import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientStatus } from "./billing/status";

export async function logEvent(
  db: SupabaseClient,
  e: {
    clientId: string | null;
    actor: string;
    action: string;
    from?: ClientStatus | null;
    to?: ClientStatus | null;
    details?: Record<string, unknown>;
  },
) {
  const { error } = await db.from("events_log").insert({
    client_id: e.clientId,
    actor: e.actor,
    action: e.action,
    from_status: e.from ?? null,
    to_status: e.to ?? null,
    details: e.details ?? {},
  });
  if (error) console.error("[events_log] insert fallito", error.message, e);
}
