// Risoluzione host -> tenant usata dal proxy. Chiama la funzione SQL
// resolve_tenant() con la sola chiave pubblica e tiene una cache in memoria
// di 60 secondi per istanza (anche per i "non trovato"), così il DB non
// viene interrogato a ogni richiesta.

import type { ClientStatus } from "../billing/status";

export type TenantInfo = {
  slug: string;
  nome_attivita: string;
  stato: ClientStatus;
  pubblicato: boolean;
  custom_domain: string | null;
};

const TTL_MS = (Number(process.env.TENANT_CACHE_TTL_SECONDS) || 60) * 1000;
const MAX_ENTRIES = 5_000;
const cache = new Map<string, { value: TenantInfo | null; expires: number }>();

export async function resolveTenant(
  key: { slug: string } | { domain: string },
  fetcher: typeof fetch = fetch,
): Promise<TenantInfo | null> {
  const cacheKey = "slug" in key ? `s:${key.slug}` : `d:${key.domain}`;
  const hit = cache.get(cacheKey);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.value;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apikey) throw new Error("Supabase non configurato");

  const res = await fetcher(`${url}/rest/v1/rpc/resolve_tenant`, {
    method: "POST",
    headers: { apikey, Authorization: `Bearer ${apikey}`, "Content-Type": "application/json" },
    body: JSON.stringify("slug" in key ? { p_slug: key.slug } : { p_domain: key.domain }),
    cache: "no-store",
  });
  if (!res.ok) {
    // In caso di errore del DB usa il valore scaduto se c'è (meglio che andare offline)
    if (hit) return hit.value;
    throw new Error(`resolve_tenant ${res.status}`);
  }
  const rows = (await res.json()) as TenantInfo[];
  const value = rows[0] ?? null;

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey, { value, expires: now + TTL_MS });
  return value;
}

export function clearTenantCache() {
  cache.clear();
}
