import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/webhook";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

// Endpoint webhook Stripe: verifica firma -> idempotenza -> gestione -> log.
// In caso di errore risponde 500 così Stripe ritenta (fino a 3 giorni).

export const maxDuration = 60;

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Firma mancante", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, env.stripeWebhookSecret());
  } catch (e) {
    console.warn("[stripe-webhook] firma non valida", (e as Error).message);
    return new Response("Firma non valida", { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("stripe_events")
    .select("processed_at, attempts")
    .eq("id", event.id)
    .maybeSingle();
  if (existing?.processed_at) {
    return Response.json({ received: true, duplicate: true });
  }
  await db.from("stripe_events").upsert({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    attempts: (existing?.attempts ?? 0) + 1,
  });

  try {
    const outcome = await handleStripeEvent(db, event);
    await db.from("stripe_events").update({ processed_at: new Date().toISOString(), error: null }).eq("id", event.id);
    console.info(`[stripe-webhook] ${event.type} ${event.id}: ${outcome}`);
    return Response.json({ received: true, outcome });
  } catch (e) {
    const message = (e as Error).message ?? String(e);
    console.error(`[stripe-webhook] ${event.type} ${event.id} FALLITO:`, e);
    await db.from("stripe_events").update({ error: message.slice(0, 2000) }).eq("id", event.id);
    return Response.json({ received: false, error: "processing_failed" }, { status: 500 });
  }
}
