// Interpretazione dell'host della richiesta -> che "area" servire.
// Funzione pura: usata dal proxy e testata in hosts.test.ts.

export type HostKind =
  | { kind: "root" }                      // miositoveloce.it -> landing, /paga, /portale
  | { kind: "www" }                       // www.miositoveloce.it -> redirect alla root
  | { kind: "admin" }                     // admin.miositoveloce.it -> dashboard
  | { kind: "tenant-slug"; slug: string } // damario.miositoveloce.it
  | { kind: "tenant-domain"; domain: string } // damario.it / www.damario.it
  | { kind: "invalid" };

/** Rimuove la porta e normalizza. */
export function hostnameOf(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * @param host        header Host della richiesta (es. "damario.miositoveloce.it" o "damario.localhost:3000")
 * @param rootDomain  dominio base (es. "miositoveloce.it" o "localhost:3000" in sviluppo)
 * @param extraRootHosts host aggiuntivi trattati come root (es. l'URL *.vercel.app del deploy)
 * @param extraAdminHosts host aggiuntivi che aprono la dashboard (es. "miositoveloce-xyz.vercel.app",
 *                        utile prima che il dominio sia attivo)
 */
export function classifyHost(
  host: string | null | undefined,
  rootDomain: string,
  extraRootHosts: string[] = [],
  extraAdminHosts: string[] = [],
): HostKind {
  const h = hostnameOf(host);
  const root = hostnameOf(rootDomain);
  if (!h) return { kind: "invalid" };
  if (extraAdminHosts.map(hostnameOf).includes(h)) return { kind: "admin" };
  if (h === root || extraRootHosts.map(hostnameOf).includes(h)) return { kind: "root" };
  if (h === `www.${root}`) return { kind: "www" };
  if (h === `admin.${root}`) return { kind: "admin" };

  if (h.endsWith(`.${root}`)) {
    const sub = h.slice(0, -(root.length + 1));
    // un solo livello di sottodominio: "a.b.miositoveloce.it" non è valido
    if (!sub || sub.includes(".")) return { kind: "invalid" };
    return { kind: "tenant-slug", slug: sub };
  }

  // Deploy di anteprima Vercel (*.vercel.app) senza dominio: mostra la landing
  if (h.endsWith(".vercel.app")) return { kind: "root" };

  if (!h.includes(".")) return { kind: "invalid" };
  return { kind: "tenant-domain", domain: h.replace(/^www\./, "") };
}
