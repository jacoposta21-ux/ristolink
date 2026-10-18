"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCheckoutSession, createPortalSession, hasOngoingSubscription } from "@/lib/billing/checkout";
import { findClientByToken } from "@/lib/tenant/tokens";

// Azioni pubbliche (nessun login): il token nel link identifica il cliente.

export async function startCheckout(token: string) {
  const client = await findClientByToken("payment_token", token);
  if (!client) redirect("/");
  // Se ha già un abbonamento in corso non ne creiamo un secondo: va al portale
  if (hasOngoingSubscription(client)) redirect(await createPortalSession(client));
  redirect(await createCheckoutSession(supabaseAdmin(), client));
}

export async function openPortal(token: string) {
  const client = await findClientByToken("portal_token", token);
  if (!client?.stripe_customer_id) redirect("/");
  redirect(await createPortalSession(client));
}
