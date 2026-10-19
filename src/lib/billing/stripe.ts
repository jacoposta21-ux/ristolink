import "server-only";
import Stripe from "stripe";
import { env } from "../env";

let stripe: Stripe | null = null;

/** Istanza Stripe lazy (così la build non richiede la chiave). */
export function getStripe(): Stripe {
  // STRIPE_API_HOST (opzionale) punta a stripe-mock per i test locali, es. "localhost:12111"
  const mock = process.env.STRIPE_API_HOST;
  stripe ??= new Stripe(env.stripeSecretKey(), {
    appInfo: { name: "EasySito" },
    maxNetworkRetries: 2,
    ...(mock ? { host: mock.split(":")[0], port: Number(mock.split(":")[1] ?? 80), protocol: "http" as const } : {}),
  });
  return stripe;
}

export function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === "string" ? x : x.id;
}

/** Dalla API 2025-03 il riferimento all'abbonamento sta in invoice.parent. */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return idOf(invoice.parent?.subscription_details?.subscription ?? null);
}

export function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter(Boolean);
  return ends.length ? Math.min(...ends) : null;
}

export const ts = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);
