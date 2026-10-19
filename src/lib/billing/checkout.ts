import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "./stripe";
import { getSettings } from "../settings";
import { ROOT_URL } from "../env";
import { priceIdFor } from "../plans";
import { logEvent } from "../events";
import type { Client } from "../types";

/** Crea (una volta sola) il Customer Stripe del cliente. */
export async function ensureStripeCustomer(db: SupabaseClient, client: Client): Promise<string> {
  if (client.stripe_customer_id) return client.stripe_customer_id;
  const customer = await getStripe().customers.create(
    {
      name: client.nome_attivita,
      email: client.email ?? undefined,
      phone: client.telefono ?? undefined,
      preferred_locales: ["it"],
      metadata: { client_id: client.id, slug: client.slug },
    },
    { idempotencyKey: `customer-${client.id}` },
  );
  const { error } = await db.from("clients").update({ stripe_customer_id: customer.id }).eq("id", client.id);
  if (error) throw new Error(error.message);
  return customer.id;
}

/** Giorni di prova applicabili: solo al primo abbonamento del cliente. */
export async function trialDaysFor(db: SupabaseClient, client: Client): Promise<number> {
  if (client.data_attivazione) return 0;
  const settings = await getSettings(db);
  return client.trial_days ?? settings.default_trial_days;
}

/** Sessione Stripe Checkout (abbonamento mensile, carta + SEPA). */
export async function createCheckoutSession(db: SupabaseClient, client: Client): Promise<string> {
  const customer = await ensureStripeCustomer(db, client);
  const trialDays = await trialDaysFor(db, client);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: client.id,
    line_items: [{ price: priceIdFor(client.plan ?? "base"), quantity: 1 }],
    // Filtro sui metodi attivi in Dashboard → Settings → Payment methods (attiva Carte e SEPA Direct Debit)
    allowed_payment_method_types: ["card", "sepa_debit"],
    payment_method_collection: "always",
    locale: "it",
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { client_id: client.id, slug: client.slug, plan: client.plan ?? "base" },
      ...(trialDays > 0
        ? {
            trial_period_days: trialDays,
            trial_settings: { end_behavior: { missing_payment_method: "pause" } },
          }
        : {}),
    },
    metadata: { client_id: client.id },
    success_url: `${ROOT_URL}/paga/grazie?c=${encodeURIComponent(client.payment_token)}`,
    cancel_url: `${ROOT_URL}/paga/${encodeURIComponent(client.payment_token)}?annullato=1`,
  });
  await logEvent(db, {
    clientId: client.id,
    actor: "cliente",
    action: "checkout_avviato",
    details: { session_id: session.id, trial_days: trialDays },
  });
  if (!session.url) throw new Error("Stripe non ha restituito l'URL di Checkout");
  return session.url;
}

/** Sessione del Customer Portal (aggiorna metodo di pagamento, fatture, disdetta). */
export async function createPortalSession(client: Client, returnUrl = `${ROOT_URL}/portale/${client.portal_token}?ritorno=1`) {
  if (!client.stripe_customer_id) throw new Error("Il cliente non ha ancora un account Stripe");
  const session = await getStripe().billingPortal.sessions.create({
    customer: client.stripe_customer_id,
    // configurazione dedicata (l'account può avere un portale di default per altre attività)
    ...(process.env.STRIPE_PORTAL_CONFIG_ID ? { configuration: process.env.STRIPE_PORTAL_CONFIG_ID } : {}),
    locale: "it",
    return_url: returnUrl,
  });
  return session.url;
}

/** Ha già un abbonamento in corso (per non crearne un secondo)? */
export function hasOngoingSubscription(client: Client): boolean {
  return !!client.stripe_subscription_id && ["trial", "attivo", "in_ritardo", "sospeso"].includes(client.stato)
    && client.manual_override !== "attivo";
}
