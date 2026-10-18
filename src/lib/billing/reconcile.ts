import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncClient, safeRevalidate } from "./sync";
import { getSettings } from "../settings";
import { logEvent } from "../events";
import type { Client } from "../types";

/**
 * Riconciliazione giornaliera (cron): ricalcola lo stato di tutti i clienti
 * da Stripe. Copre webhook persi e la scadenza della tolleranza (che non
 * genera alcun evento Stripe). Archivia i cancellati dopo N giorni.
 */
export async function reconcileAll(db: SupabaseClient, now = new Date()) {
  const { data, error } = await db.from("clients").select("*").is("archived_at", null);
  if (error) throw new Error(error.message);
  const clients = (data ?? []) as Client[];

  const summary = { checked: 0, changed: [] as string[], errors: [] as string[], archived: [] as string[] };
  for (const c of clients) {
    // Senza Stripe e senza override non c'è nulla da ricalcolare
    if (!c.stripe_customer_id && !c.stripe_subscription_id && !c.manual_override && c.stato === "in_attesa") continue;
    try {
      summary.checked++;
      const r = await syncClient(db, c, { actor: "cron:riconciliazione", now });
      if (r.changed) summary.changed.push(`${c.slug}: ${r.from} -> ${r.to}`);
    } catch (e) {
      summary.errors.push(`${c.slug}: ${(e as Error).message}`);
    }
  }

  const settings = await getSettings(db);
  const cutoff = new Date(now.getTime() - settings.archive_after_days * 86_400_000).toISOString();
  const { data: toArchive } = await db
    .from("clients")
    .select("id, slug, stato, canceled_at")
    .eq("stato", "cancellato")
    .is("archived_at", null)
    .lt("canceled_at", cutoff);
  for (const c of toArchive ?? []) {
    await db.from("clients").update({ archived_at: now.toISOString() }).eq("id", c.id);
    await db.from("sites").update({ pubblicato: false }).eq("client_id", c.id);
    await logEvent(db, {
      clientId: c.id,
      actor: "cron:riconciliazione",
      action: "archiviato",
      details: { canceled_at: c.canceled_at, after_days: settings.archive_after_days },
    });
    safeRevalidate(c.slug);
    summary.archived.push(c.slug);
  }
  return summary;
}
