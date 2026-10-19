import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { computeStatus, effectiveOverride, pickRelevantSubscription, type ClientStatus } from "./status";
import { getStripe, subscriptionPeriodEnd, ts } from "./stripe";
import { getSettings } from "../settings";
import { logEvent } from "../events";
import { tenantTag } from "../cache";
import { notifyAdmin, sendPaymentFailedReminder, sendSuspendedNotice } from "../email";
import type { Client } from "../types";
import { planFromPriceId } from "../plans";

/**
 * Allinea UN cliente allo stato reale su Stripe.
 * È idempotente e "fetch-latest": rilegge sempre l'abbonamento da Stripe,
 * quindi non importa l'ordine in cui arrivano i webhook. La usano sia i
 * webhook sia il cron di riconciliazione sia le azioni manuali.
 */
export async function syncClient(
  db: SupabaseClient,
  client: Client,
  opts: { actor: string; subscriptionId?: string | null; now?: Date },
): Promise<{ from: ClientStatus; to: ClientStatus; changed: boolean }> {
  const now = opts.now ?? new Date();
  const sub = await findSubscription(client, opts.subscriptionId ?? null);
  const settings = await getSettings(db);

  const everActivated =
    !!client.data_attivazione || (!!sub && ["active", "trialing", "past_due", "unpaid"].includes(sub.status));

  const subscriptionStatus = sub?.status ?? (client.stripe_subscription_id ? "canceled" : null);
  const override = effectiveOverride(client.manual_override, subscriptionStatus);
  const result = computeStatus({
    subscriptionStatus,
    pastDueSince: client.past_due_since ? new Date(client.past_due_since) : null,
    manualOverride: override,
    everActivated,
    graceDays: settings.grace_days,
    now,
  });

  const becameLive = result.status === "trial" || result.status === "attivo";
  const updates: Partial<Client> = {
    stato: result.status,
    past_due_since: result.pastDueSince?.toISOString() ?? null,
    last_synced_at: now.toISOString(),
    data_attivazione: client.data_attivazione ?? (becameLive && sub ? now.toISOString() : null),
  };
  if (override !== client.manual_override) updates.manual_override = override;
  if (sub) {
    updates.stripe_subscription_id = sub.id;
    updates.stripe_customer_id = client.stripe_customer_id ?? (typeof sub.customer === "string" ? sub.customer : sub.customer.id);
    updates.current_period_end = ts(subscriptionPeriodEnd(sub));
    updates.cancel_at_period_end = sub.cancel_at_period_end;
    updates.trial_end = ts(sub.trial_end);
    const price = sub.items.data[0]?.price;
    if (price?.unit_amount) updates.monthly_amount_cents = price.unit_amount;
    const plan = planFromPriceId(price?.id);
    if (plan) updates.plan = plan;
    // la prima data di cancellazione osservata fa partire i giorni prima dell'archiviazione
    updates.canceled_at =
      sub.status === "canceled" ? client.canceled_at ?? ts(sub.ended_at ?? sub.canceled_at) ?? now.toISOString() : null;
  } else if (result.status === "cancellato") {
    updates.canceled_at = client.canceled_at ?? now.toISOString();
  }

  const { error } = await db.from("clients").update(updates).eq("id", client.id);
  if (error) throw new Error(`Aggiornamento cliente ${client.id} fallito: ${error.message}`);
  if (override !== client.manual_override) {
    await logEvent(db, {
      clientId: client.id,
      actor: opts.actor,
      action: "override_rimosso",
      details: { motivo: "pagamento Stripe confermato", subscription_status: subscriptionStatus },
    });
  }

  const from = client.stato;
  const to = result.status;
  const changed = from !== to;
  if (changed) {
    await logEvent(db, {
      clientId: client.id,
      actor: opts.actor,
      action: "stato_cambiato",
      from,
      to,
      details: {
        subscription_id: sub?.id ?? null,
        subscription_status: sub?.status ?? null,
        grace_ends_at: result.graceEndsAt?.toISOString() ?? null,
        manual_override: client.manual_override,
      },
    });
    safeRevalidate(client.slug);
    await onTransition(db, { ...client, ...updates } as Client, from, to, opts.actor, result.graceEndsAt);
  }
  return { from, to, changed };
}

async function findSubscription(client: Client, hintId: string | null): Promise<Stripe.Subscription | null> {
  if (client.stripe_customer_id) {
    const list = await getStripe().subscriptions.list({ customer: client.stripe_customer_id, status: "all", limit: 20 });
    const best = pickRelevantSubscription(list.data);
    if (best) return best;
  }
  const id = hintId ?? client.stripe_subscription_id;
  if (!id) return null;
  try {
    return await getStripe().subscriptions.retrieve(id);
  } catch (e) {
    if ((e as { code?: string }).code === "resource_missing") return null;
    throw e;
  }
}

async function onTransition(
  db: SupabaseClient,
  client: Client,
  from: ClientStatus,
  to: ClientStatus,
  actor: string,
  graceEndsAt: Date | null,
) {
  try {
    if (to === "in_ritardo" && from !== "sospeso") {
      const { data: open } = await db
        .from("payments")
        .select("hosted_invoice_url")
        .eq("client_id", client.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      await sendPaymentFailedReminder(client, { graceEndsAt, invoiceUrl: open?.hosted_invoice_url ?? null });
    }
    if (to === "sospeso" && client.manual_override !== "sospeso") await sendSuspendedNotice(client);
    await notifyAdmin(client, from, to, actor);
  } catch (e) {
    // le notifiche non devono mai far fallire la sincronizzazione
    console.error("[sync] notifica fallita", e);
  }
}

export function safeRevalidate(slug: string) {
  try {
    revalidateTag(tenantTag(slug), { expire: 0 });
  } catch {
    // fuori da un contesto Next (es. test): ignora
  }
}
