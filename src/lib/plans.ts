// Piani di abbonamento. Il prezzo addebitato è quello del price Stripe;
// gli importi in settings servono solo per mostrarli nelle pagine.

export const PLANS = ["base", "dominio"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LABEL: Record<Plan, string> = {
  base: "Base",
  dominio: "Con dominio personalizzato",
};

export function priceIdFor(plan: Plan): string {
  const id = plan === "dominio" ? process.env.STRIPE_PRICE_ID_DOMINIO : process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error(`Prezzo Stripe non configurato per il piano "${plan}" (STRIPE_PRICE_ID${plan === "dominio" ? "_DOMINIO" : ""})`);
  return id;
}

/** Piano corrispondente a un price Stripe (es. se cambia dal portale o da Stripe). */
export function planFromPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_DOMINIO) return "dominio";
  if (priceId === process.env.STRIPE_PRICE_ID) return "base";
  return null;
}

export function planPriceCents(plan: Plan, s: { monthly_price_cents: number; dominio_price_cents: number }) {
  return plan === "dominio" ? s.dominio_price_cents : s.monthly_price_cents;
}
