// Pagina neutra mostrata ai visitatori quando il sito non è online
// (sospeso, cancellato, non ancora attivato o non pubblicato).
// Volutamente NESSUN riferimento a pagamenti: non deve mettere in
// imbarazzo l'attività. HTTP 503 + Retry-After = temporaneo per i motori
// di ricerca, che così non de-indicizzano subito il sito.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function unavailableHtml(name?: string | null): string {
  const title = name ? esc(name) : "Sito non disponibile";
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f6f5f2;color:#1f2937}
  main{max-width:28rem;padding:2rem;text-align:center}
  .dot{width:56px;height:56px;border-radius:50%;margin:0 auto 1.5rem;background:#e5e1d8;display:grid;place-items:center}
  h1{font-size:1.5rem;margin:0 0 .75rem;font-weight:600}
  p{margin:0;color:#6b7280;line-height:1.6}
  @media (prefers-color-scheme:dark){body{background:#111827;color:#f3f4f6}.dot{background:#1f2937}p{color:#9ca3af}}
</style>
</head>
<body>
<main>
  <div class="dot" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/></svg></div>
  ${name ? `<h1>${title}</h1>` : ""}
  <p>Sito temporaneamente non disponibile.<br>Torna a trovarci tra poco.</p>
</main>
</body>
</html>`;
}

export function notFoundHtml(): string {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sito non trovato</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f5f2;color:#1f2937}p{color:#6b7280}</style></head>
<body><main style="text-align:center;padding:2rem"><h1 style="font-weight:600">Sito non trovato</h1><p>L'indirizzo che hai digitato non corrisponde a nessun sito.</p></main></body></html>`;
}
