import "server-only";
import { env } from "./env";

// Collegamento automatico dei domini personalizzati al progetto Vercel
// (opzionale: serve VERCEL_API_TOKEN + VERCEL_PROJECT_ID). Senza token
// il dominio va aggiunto a mano in Vercel → Project → Settings → Domains.

export function vercelConfigured() {
  return !!(env.vercelToken() && env.vercelProjectId());
}

async function api(path: string, init: RequestInit = {}) {
  const team = env.vercelTeamId();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.vercel.com${path}${team ? `${sep}teamId=${team}` : ""}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.vercelToken()}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

/** Aggiunge dominio e www.dominio (redirect al principale) al progetto. */
export async function addDomain(domain: string) {
  const project = env.vercelProjectId();
  const main = await api(`/v10/projects/${project}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (!main.ok && main.body?.error?.code !== "domain_already_in_use") {
    return { ok: false, error: main.body?.error?.message ?? `Errore Vercel ${main.status}` };
  }
  await api(`/v10/projects/${project}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: `www.${domain}`, redirect: domain, redirectStatusCode: 308 }),
  });
  return { ok: true as const };
}

/**
 * Sottodominio del cliente (es. damario.miositoveloce.it) aggiunto esplicitamente
 * al progetto: Vercel gli emette un certificato proprio. Serve quando il wildcard
 * *.dominio non può avere il certificato (DNS non gestito da Vercel, es. domini .it su IONOS).
 * Innocuo se il wildcard funziona già.
 */
export async function addSubdomain(fqdn: string) {
  const res = await api(`/v10/projects/${env.vercelProjectId()}/domains`, { method: "POST", body: JSON.stringify({ name: fqdn }) });
  if (!res.ok && res.body?.error?.code !== "domain_already_in_use" && res.status !== 409) {
    console.error("[vercel] aggiunta sottodominio fallita", fqdn, res.status, res.body?.error?.message);
    return false;
  }
  return true;
}

export async function removeSubdomain(fqdn: string) {
  await api(`/v9/projects/${env.vercelProjectId()}/domains/${fqdn}`, { method: "DELETE" });
}

export async function removeDomain(domain: string) {
  const project = env.vercelProjectId();
  await api(`/v9/projects/${project}/domains/www.${domain}`, { method: "DELETE" });
  await api(`/v9/projects/${project}/domains/${domain}`, { method: "DELETE" });
}

export type DomainStatus = { configured: boolean; verified: boolean; message: string };

export async function domainStatus(domain: string): Promise<DomainStatus> {
  const project = env.vercelProjectId();
  const [info, config] = await Promise.all([
    api(`/v9/projects/${project}/domains/${domain}`),
    api(`/v6/domains/${domain}/config`),
  ]);
  if (!info.ok) return { configured: false, verified: false, message: "Dominio non presente nel progetto Vercel" };
  const verified = info.body?.verified !== false;
  const configured = config.ok && config.body?.misconfigured === false;
  return {
    configured,
    verified,
    message: configured
      ? "DNS corretto, certificato SSL gestito da Vercel"
      : "DNS non ancora corretto (la propagazione può richiedere fino a 24-48 ore)",
  };
}
