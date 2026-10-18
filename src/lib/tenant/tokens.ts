import "server-only";
import { supabaseAdmin } from "../supabase/admin";
import type { Client } from "../types";

/** Cliente dal token dei link pubblici (/paga, /portale). Solo lato server. */
export async function findClientByToken(column: "payment_token" | "portal_token", token: string): Promise<Client | null> {
  if (!/^[A-Za-z0-9]{10,40}$/.test(token)) return null;
  const { data } = await supabaseAdmin().from("clients").select("*").eq(column, token).is("archived_at", null).maybeSingle();
  return (data as Client) ?? null;
}
