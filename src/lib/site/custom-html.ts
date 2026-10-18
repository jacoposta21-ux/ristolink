// Siti "HTML personalizzato": una pagina HTML completa (es. creata in chat
// con Claude) servita al posto dei template.

export const MAX_HTML_BYTES = 2_000_000;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function validateCustomHtml(html: string): string | null {
  if (!html.trim()) return "L'HTML è vuoto";
  if (new TextEncoder().encode(html).length > MAX_HTML_BYTES) return "L'HTML supera 2 MB: carica le immagini come foto e usa i loro link";
  if (!/<[a-z!]/i.test(html)) return "Non sembra HTML (manca almeno un tag)";
  return null;
}

/**
 * Se la pagina non ha già un link alla privacy, aggiunge in fondo una piccola
 * riga con ragione sociale, P. IVA e link "Privacy" (obbligatori per legge).
 */
export function withLegalFooter(html: string, info: { nome: string; partitaIva: string | null }): string {
  if (/href=["']\/privacy["']/i.test(html)) return html;
  const piva = info.partitaIva ? ` · P. IVA ${esc(info.partitaIva)}` : "";
  const footer = `<div style="font:12px/1.4 system-ui,sans-serif;text-align:center;padding:14px 12px;color:#666;background:#f6f6f6">${esc(info.nome)}${piva} · <a href="/privacy" style="color:inherit">Privacy e cookie</a></div>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${footer}</body>`) : html + footer;
}

/** Pagina di partenza per un nuovo sito HTML (da sostituire con quella vera). */
export function starterHtml(nome: string, telefono?: string | null): string {
  const n = esc(nome);
  const tel = telefono ? esc(telefono) : "";
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${n}</title>
<meta name="description" content="${n}">
<style>
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1f2937;background:#faf7f2}
  main{min-height:100vh;display:grid;place-items:center;text-align:center;padding:2rem}
  h1{font-size:clamp(2rem,6vw,3.5rem);margin:0 0 .5rem}
  p{color:#6b7280;margin:0 0 1.5rem}
  a.btn{display:inline-block;background:#111;color:#fff;padding:.9rem 1.6rem;border-radius:999px;text-decoration:none;font-weight:600}
</style>
</head>
<body>
<main>
  <div>
    <h1>${n}</h1>
    <p>Il nostro nuovo sito sta arrivando.</p>
    ${tel ? `<a class="btn" href="tel:${tel.replace(/[^\d+]/g, "")}">Chiama ${tel}</a>` : ""}
  </div>
</main>
</body>
</html>`;
}
