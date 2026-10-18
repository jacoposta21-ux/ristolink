import { CheckCircle2, Phone } from "lucide-react";
import type { SiteProps } from "../types";
import { contactInfo, hasHours, primaryCta } from "../helpers";
import { Img } from "../Img";
import { OpenNow } from "../OpenNow";
import { MapEmbed } from "../MapEmbed";
import { ContactList, FloatingWhatsApp, Gallery, HoursList, MobileActionBar, SiteFooter } from "../shared";

export function Artigiano({ client, content: c, privacyHref }: SiteProps) {
  const ct = contactInfo(client, c);
  const cta = primaryCta(ct, c.hero.ctaLabel || "Richiedi un preventivo");
  const items = c.services.items;

  return (
    <div className="bg-white font-display text-slate-900">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-white">
          <a href="#" className="text-lg font-black uppercase tracking-wider">{client.nome_attivita}</a>
          {ct.phoneHref && (
            <a href={ct.phoneHref} className="bg-accent hidden items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-slate-900 md:flex">
              <Phone className="h-4 w-4" /> {ct.phone}
            </a>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-900 text-white">
        <Img src={c.hero.image} alt={client.nome_attivita} eager className="absolute inset-0 h-full w-full opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-36 md:pb-32 md:pt-44">
          <div className="mb-6 h-1.5 w-20 bg-accent" />
          <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">{c.hero.title || client.nome_attivita}</h1>
          {c.hero.subtitle && <p className="mt-6 max-w-xl text-lg text-slate-300">{c.hero.subtitle}</p>}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {cta && (
              <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noopener" className="bg-accent rounded-md px-7 py-4 font-bold uppercase tracking-wide text-slate-900 hover:brightness-105">
                {cta.label}
              </a>
            )}
            <OpenNow hours={c.hours} />
          </div>
        </div>
      </section>

      {c.highlights.length > 0 && (
        <section className="bg-primary text-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-3">
            {c.highlights.map((h, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h3 className="font-bold uppercase tracking-wide">{h.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12">
            <div className="mb-4 h-1.5 w-14 bg-accent" />
            <h2 className="text-4xl font-black uppercase tracking-tight md:text-5xl">{c.services.title || "Servizi"}</h2>
            {c.services.intro && <p className="mt-3 max-w-2xl text-slate-600">{c.services.intro}</p>}
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg bg-slate-200 md:grid-cols-3">
            {items.map((s, i) => (
              <div key={i} className="bg-white p-7">
                <p className="text-5xl font-black text-slate-200">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-xl font-bold">{s.name}</h3>
                {s.description && <p className="mt-2 text-slate-600">{s.description}</p>}
                {s.price && <p className="mt-3 font-bold text-primary">{s.price}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {(c.about.text || c.about.image) && (
        <section className="bg-slate-50">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
            <Img src={c.about.image || c.gallery[0]} alt={c.about.title || client.nome_attivita} className="aspect-[4/3] w-full rounded-lg shadow-xl" />
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight">{c.about.title || "Chi siamo"}</h2>
              <div className="mt-5 space-y-4 whitespace-pre-line text-lg leading-relaxed text-slate-600">{c.about.text}</div>
            </div>
          </div>
        </section>
      )}

      {c.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-8 text-4xl font-black uppercase tracking-tight">Lavori realizzati</h2>
          <Gallery images={c.gallery} name={client.nome_attivita} />
        </section>
      )}

      <section className="bg-accent">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Hai un lavoro da fare?</h2>
            <p className="mt-1 text-slate-800">Sopralluogo e preventivo senza impegno.</p>
          </div>
          {ct.phoneHref && (
            <a href={ct.phoneHref} className="flex items-center gap-3 rounded-md bg-slate-900 px-7 py-4 text-xl font-black text-white">
              <Phone className="h-6 w-6" /> {ct.phone}
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-3">
        <div>
          <h2 className="mb-5 text-2xl font-black uppercase">Contatti</h2>
          <ContactList ct={ct} />
        </div>
        {hasHours(c) && (
          <div>
            <h2 className="mb-5 text-2xl font-black uppercase">Orari</h2>
            <HoursList content={c} rowClass="text-sm" />
          </div>
        )}
        <MapEmbed query={ct.mapsQuery} className={`min-h-72 rounded-lg ${hasHours(c) ? "" : "md:col-span-2"}`} />
      </section>

      <SiteFooter client={client} content={c} privacyHref={privacyHref} className="bg-slate-950 text-slate-400" />
      <MobileActionBar ct={ct} />
      <FloatingWhatsApp ct={ct} />
    </div>
  );
}
