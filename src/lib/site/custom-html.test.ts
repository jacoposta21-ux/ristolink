import { describe, expect, it } from "vitest";
import { starterHtml, validateCustomHtml, withLegalFooter } from "./custom-html";

describe("HTML personalizzato", () => {
  it("valida", () => {
    expect(validateCustomHtml("")).not.toBeNull();
    expect(validateCustomHtml("solo testo")).not.toBeNull();
    expect(validateCustomHtml("<h1>Ciao</h1>")).toBeNull();
  });
  it("aggiunge il footer legale prima dell'ultimo </body>", () => {
    const out = withLegalFooter("<html><body><p>x</p></body></html>", { nome: "Da Mario", partitaIva: "IT123" });
    expect(out).toMatch(/P\. IVA IT123 · <a href="\/privacy"[^>]*>Privacy e cookie<\/a><\/div><\/body><\/html>$/);
  });
  it("non duplica se c'è già il link privacy", () => {
    const html = '<body><a href="/privacy">Privacy</a></body>';
    expect(withLegalFooter(html, { nome: "X", partitaIva: null })).toBe(html);
  });
  it("escape del nome", () => {
    expect(starterHtml("<b>A&B</b>")).not.toContain("<b>A&B</b>");
  });
});
