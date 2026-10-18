import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../env";

let client: SupabaseClient | null = null;

/**
 * Client con la secret key (service_role): BYPASSA la RLS.
 * Usarlo solo lato server per webhook, cron, link pubblici e rendering dei siti.
 */
export function supabaseAdmin(): SupabaseClient {
  client ??= createClient(env.supabaseUrl(), env.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
