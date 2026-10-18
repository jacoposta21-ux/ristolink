import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { idOf, invoiceSubscriptionId, ts } from "./stripe";
import { syncClient } from "./sync";
import { logEvent } from "../events";
import type { Client } from "../types";

/** Eventi Stripe che gestiamo (configurali sull'endpoint webhook, vedi README). */
export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.finalized",
  "invoice.voided",
  "invoice.marked_uncollectible",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
] as const;

async function findClient(
  db: SupabaseClient,
  by: { id?: string | null; customerId?: string | null; subscriptionId?: string | null },
): Promise<Client | null> {
  const tries: [string, string | null | undefined][] = [
    ["id", by.id],
    ["stripe_subscription_id", by.subscriptionId],
    ["stripe_customer_id", by.customerId],
  ];
  for (const [col, val] of tries) {
    if (!val) continue;
    const { data } = await db.from("clients").select("*").eq(col, val).maybeSingle();
    if (data) return data as Client;
  }
  return null;
}

export async function handleStripeEvent(db: SupabaseClient, event: Stripe.Event): Promise<string> {
  const actor = `stripe:${event.type}`;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed": {
      const s = event.data.object;
      if (s.mode !== "subscription") return "ignorato: non subscription";
      const customerId = idOf(s.customer);
      const subscriptionId = idOf(s.subscription);
      const client = await findClient(db, {
        id: s.client_reference_id ?? s.metadata?.client_id,
        customerId,
      });
      if (!client) return `ignorato: checkout ${s.id} non di un cliente MioSitoVeloce`;
      await db
        .from("clients")
        .update({ stripe_customer_id: client.stripe_customer_id ?? customerId, stripe_subscription_id: subscriptionId })
        .eq("id", client.id);
      if (event.type === "checkout.session.completed") {
        await logEvent(db, {
          clientId: client.id,
          actor,
          action: "checkout_completato",
          details: { session_id: s.id, payment_status: s.payment_status },
        });
      }
      const fresh = { ...client, stripe_customer_id: client.stripe_customer_id ?? customerId };
      const r = await syncClient(db, fresh, { actor, subscriptionId });
      return `sync ${client.slug}: ${r.from} -> ${r.to}`;
    }

    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "invoice.finalized":
    case "invoice.voided":
    case "invoice.marked_uncollectible": {
      const inv = event.data.object;
      const subscriptionId = invoiceSubscriptionId(inv);
      const customerId = idOf(inv.customer);
      const client = await findClient(db, {
        id: inv.parent?.subscription_details?.metadata?.client_id,
        subscriptionId,
        customerId,
      });
      // L'account Stripe può essere condiviso con altre attività: si salvano
      // solo le fatture dei clienti MioSitoVeloce
      if (!client) return `ignorato: fattura ${inv.id} non di un cliente MioSitoVeloce`;
      await upsertPayment(db, inv, client.id, subscriptionId);
      if (event.type === "invoice.payment_failed") {
        await logEvent(db, {
          clientId: client.id,
          actor,
          action: "pagamento_fallito",
          details: {
            invoice_id: inv.id,
            attempt_count: inv.attempt_count,
            next_payment_attempt: ts(inv.next_payment_attempt),
            amount_due: inv.amount_due,
          },
        });
      }
      if (event.type === "invoice.paid") {
        await logEvent(db, {
          clientId: client.id,
          actor,
          action: "pagamento_riuscito",
          details: { invoice_id: inv.id, amount_paid: inv.amount_paid },
        });
      }
      // senza riferimento all'abbonamento, syncClient lo cerca dal customer
      const r = await syncClient(db, client, { actor, subscriptionId });
      return `sync ${client.slug}: ${r.from} -> ${r.to}`;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      const sub = event.data.object;
      const client = await findClient(db, {
        id: sub.metadata?.client_id,
        subscriptionId: sub.id,
        customerId: idOf(sub.customer),
      });
      if (!client) return `ignorato: abbonamento ${sub.id} non di un cliente MioSitoVeloce`;
      const r = await syncClient(db, client, { actor, subscriptionId: sub.id });
      return `sync ${client.slug}: ${r.from} -> ${r.to}`;
    }

    default:
      return `ignorato: ${event.type}`;
  }
}

async function upsertPayment(db: SupabaseClient, inv: Stripe.Invoice, clientId: string | null, subscriptionId: string | null) {
  if (!inv.id) return;
  const lastError = inv.last_finalization_error?.message ?? null;
  const { error } = await db.from("payments").upsert(
    {
      stripe_invoice_id: inv.id,
      client_id: clientId,
      stripe_subscription_id: subscriptionId,
      number: inv.number,
      status: inv.status ?? "draft",
      billing_reason: inv.billing_reason,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      attempt_count: inv.attempt_count,
      next_payment_attempt: ts(inv.next_payment_attempt),
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
      invoice_pdf: inv.invoice_pdf ?? null,
      period_start: ts(inv.lines?.data?.[0]?.period?.start ?? inv.period_start),
      period_end: ts(inv.lines?.data?.[0]?.period?.end ?? inv.period_end),
      paid_at: ts(inv.status_transitions?.paid_at),
      last_error: lastError,
    },
    { onConflict: "stripe_invoice_id" },
  );
  if (error) throw new Error(`Salvataggio fattura ${inv.id} fallito: ${error.message}`);
}
