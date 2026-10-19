import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  grace_days: 7,
  default_trial_days: 0,
  monthly_price_cents: 999,
  dominio_price_cents: 1499,
  archive_after_days: 90,
};

export async function getSettings(db: SupabaseClient): Promise<Settings> {
  const { data } = await db
    .from("settings")
    .select("grace_days, default_trial_days, monthly_price_cents, dominio_price_cents, archive_after_days")
    .eq("id", 1)
    .maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}
