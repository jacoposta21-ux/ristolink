// Crea su Stripe il prodotto "Sito web RistoLink" e il prezzo 9,99 €/mese IVA inclusa.
// Uso: STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
// Idempotente: se esiste già un prezzo con lookup_key "ristolink_mensile" lo riusa.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Imposta STRIPE_SECRET_KEY (usa prima la chiave di TEST sk_test_...)");
  process.exit(1);
}
const stripe = new Stripe(key);
const LOOKUP = "ristolink_mensile";

const existing = await stripe.prices.list({ lookup_keys: [LOOKUP], active: true, limit: 1 });
let price = existing.data[0];
if (!price) {
  const product = await stripe.products.create({
    name: "Sito web RistoLink",
    description: "Sito web per la tua attività: hosting, aggiornamenti e assistenza",
  });
  price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: 999,
    recurring: { interval: "month" },
    tax_behavior: "inclusive", // 9,99 € è IVA inclusa
    lookup_key: LOOKUP,
    nickname: "Mensile 9,99 € IVA incl.",
  });
  console.log("Creato prodotto", product.id);
}
console.log(`\nSTRIPE_PRICE_ID=${price.id}   (${key.startsWith("sk_live") ? "LIVE" : "TEST"})\n`);
console.log("Copialo in .env.local / variabili d'ambiente Vercel.");
