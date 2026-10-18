import { describe, expect, it } from "vitest";
import { classifyHost } from "./hosts";

const R = "miositoveloce.it";

describe("classifyHost", () => {
  it("root, www, admin", () => {
    expect(classifyHost("miositoveloce.it", R)).toEqual({ kind: "root" });
    expect(classifyHost("MioSitoVeloce.it:443", R)).toEqual({ kind: "root" });
    expect(classifyHost("www.miositoveloce.it", R)).toEqual({ kind: "www" });
    expect(classifyHost("admin.miositoveloce.it", R)).toEqual({ kind: "admin" });
  });
  it("sottodominio cliente", () => {
    expect(classifyHost("damario.miositoveloce.it", R)).toEqual({ kind: "tenant-slug", slug: "damario" });
    expect(classifyHost("a.b.miositoveloce.it", R)).toEqual({ kind: "invalid" });
  });
  it("dominio personalizzato (con e senza www)", () => {
    expect(classifyHost("damario.it", R)).toEqual({ kind: "tenant-domain", domain: "damario.it" });
    expect(classifyHost("www.damario.it", R)).toEqual({ kind: "tenant-domain", domain: "damario.it" });
  });
  it("sviluppo locale con *.localhost", () => {
    const D = "localhost:3000";
    expect(classifyHost("localhost:3000", D)).toEqual({ kind: "root" });
    expect(classifyHost("admin.localhost:3000", D)).toEqual({ kind: "admin" });
    expect(classifyHost("damario.localhost:3000", D)).toEqual({ kind: "tenant-slug", slug: "damario" });
  });
  it("anteprime vercel e host extra", () => {
    expect(classifyHost("ristolink-git-x.vercel.app", R)).toEqual({ kind: "root" });
    expect(classifyHost("127.0.0.1:3000", R, ["127.0.0.1"])).toEqual({ kind: "root" });
  });
  it("host admin aggiuntivi (es. URL vercel.app)", () => {
    expect(classifyHost("miositoveloce-x.vercel.app", R, [], ["miositoveloce-x.vercel.app"])).toEqual({ kind: "admin" });
    expect(classifyHost("altro.vercel.app", R, [], ["miositoveloce-x.vercel.app"])).toEqual({ kind: "root" });
  });
  it("host vuoto o senza punto", () => {
    expect(classifyHost("", R)).toEqual({ kind: "invalid" });
    expect(classifyHost("intranet", R)).toEqual({ kind: "invalid" });
  });
});
