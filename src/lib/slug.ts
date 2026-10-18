// Generazione e validazione degli slug (sottodomini dei clienti).

export const RESERVED_SLUGS = new Set([
  "www", "admin", "app", "api", "mail", "email", "smtp", "imap", "pop", "pop3",
  "ftp", "sftp", "ssh", "vpn", "dns", "ns", "ns1", "ns2", "mx", "webmail",
  "cpanel", "dashboard", "panel", "login", "auth", "account", "accounts",
  "billing", "pay", "paga", "pagamenti", "portale", "portal", "checkout",
  "stripe", "static", "assets", "cdn", "media", "img", "images", "files",
  "blog", "docs", "help", "support", "supporto", "assistenza", "status",
  "dev", "test", "staging", "preview", "demo", "beta", "localhost",
  "ristolink", "miositoveloce", "privacy", "cookie", "termini", "legal", "info", "contatti",
  "autoconfig", "autodiscover", "_dmarc", "_domainkey",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** "Trattoria Da Mario & Figli" -> "trattoria-da-mario-figli" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenti
    .toLowerCase()
    .replace(/['’`]/g, "")           // l'osteria -> losteria
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 63)
    .replace(/-+$/g, "");
}

export type SlugCheck = { ok: true } | { ok: false; reason: string };

export function validateSlug(slug: string): SlugCheck {
  if (!slug) return { ok: false, reason: "Lo slug è obbligatorio" };
  if (!SLUG_RE.test(slug))
    return {
      ok: false,
      reason: "Solo lettere minuscole, numeri e trattini (non all'inizio o alla fine), max 63 caratteri",
    };
  if (slug.includes("--")) return { ok: false, reason: "Niente doppi trattini" };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: `"${slug}" è riservato` };
  return { ok: true };
}

/** Normalizza un dominio personalizzato: "https://www.DaMario.it/" -> "damario.it" */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
}

const DOMAIN_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function isValidDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain);
}
