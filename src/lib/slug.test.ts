import { describe, expect, it } from "vitest";
import { isValidDomain, normalizeDomain, slugify, validateSlug } from "./slug";

describe("slugify", () => {
  it.each([
    ["Trattoria Da Mario", "trattoria-da-mario"],
    ["Pizzeria Più Bella", "pizzeria-piu-bella"],
    ["L'Osteria del Ponte", "losteria-del-ponte"],
    ["Bar & Caffè", "bar-e-caffe"],
    ["  --Ciao   Mondo!!--  ", "ciao-mondo"],
    ["Parrucchiera Élite № 1", "parrucchiera-elite-1"],
  ])("%s -> %s", (input, out) => expect(slugify(input)).toBe(out));

  it("tronca a 63 caratteri senza trattino finale", () => {
    const s = slugify("a".repeat(62) + " b c");
    expect(s.length).toBeLessThanOrEqual(63);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("validateSlug", () => {
  it("accetta slug validi", () => expect(validateSlug("damario").ok).toBe(true));
  it("rifiuta riservati", () => {
    for (const s of ["www", "admin", "app", "api", "mail"]) expect(validateSlug(s).ok).toBe(false);
  });
  it("rifiuta formati non validi", () => {
    for (const s of ["", "-a", "a-", "A", "a_b", "a--b", "a.b"]) expect(validateSlug(s).ok).toBe(false);
  });
});

describe("domini", () => {
  it("normalizza", () => {
    expect(normalizeDomain("https://www.DaMario.it/menu")).toBe("damario.it");
    expect(normalizeDomain("damario.it:443")).toBe("damario.it");
  });
  it("valida", () => {
    expect(isValidDomain("damario.it")).toBe(true);
    expect(isValidDomain("pizzeria.roma.it")).toBe(true);
    expect(isValidDomain("damario")).toBe(false);
    expect(isValidDomain("da mario.it")).toBe(false);
  });
});
