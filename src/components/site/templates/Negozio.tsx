import { BadgeCheck, Clock, Phone } from "lucide-react";
import type { SiteProps } from "../types";
import { contactInfo, groupServices, hasHours, primaryCta } from "../helpers";
import { Img } from "../Img";
import { OpenNow } from "../OpenNow";
import { MapEmbed } from "../MapEmbed";
import { ContactList, FloatingWhatsApp, Gallery, HoursList, MobileActionBar, SiteFooter } from "../shared";

export function Negozio({ client, content: c, privacyHref }: SiteProps) {
  const ct = contactInfo(client, c);
  const cta = primaryCta(ct, c.hero.ctaLabel);
  const items = c.services.items;

  return (
    <div className="bg-white text-neutral-900">
      <div className="bg-neutral-900 text-xs text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2">
          <span className="truncate">{ct.fullAddress}</span>
          {ct.phoneHref && <a href={ct.phoneHref} className="flex shrink-0 items-center gap-1 font-semibold"><Phone className="h-3.5 w-3.5" /> {ct.phone}</a>}
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="text-xl font-extrabold tracking-tight text-primary">{client.nome_attivita}</a>
          <nav className="hidden gap-6 text-sm font-semibold md:flex">
            {items.length > 0 && <a href="#prodotti" className="hover:text-primary">{c.services.title || "Prodotti"}</a>}
            <a href="#visita" className="hover:text-primary">Orari e indirizzo</a>
          </nav>
        </div>
      </header>

      <section className="bg-primary relative overflow-hidden text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-accent opacity-30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <OpenNow hours={c.hours} className="mb-5" />
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">{c.hero.title || client.nome_attivita}</h1>
            {c.hero.subtitle && <p className="mt-5 max-w-md text-lg text-white/85">{c.hero.subtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {cta && (
                <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noopener" className="bg-accent rounded-xl px-6 py-3.5 font-bold text-neutral-900 shadow-lg hover:brightness-105">
                  {cta.label}
                </a>
              )}
              {ct.directionsHref && (
                <a href={ct.directionsHref} target="_blank" rel="noopener" className="rounded-xl bg-white/15 px-6 py-3.5 font-bold backdrop-blur hover:bg-white/25">
                  Come arrivare
                </a>
              )}
            </div>
          </div>
          <Img src={c.hero.image} alt={client.nome_attivita} eager className="aspect-[4/3] w-full rotate-1 rounded-3xl shadow-2xl ring-8 ring-white/15" />
        </div>
      </section>

      {c.highlights.length > 0 && (
        <section className="mx-auto -mt-8 grid max-w-6xl gap-4 px-5 md:grid-cols-3">
          {c.highlights.map((h, i) => (
            <div key={i} className="relative rounded-2xl border border-neutral-100 bg-white p-6 shadow-lg">
              <BadgeCheck className="mb-3 h-7 w-7 text-primary" />
              <h3 className="text-lg font-bold">{h.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{h.text}</p>
            </div>
          ))}
        </section>
      )}

      {items.length > 0 && (
        <section id="prodotti" className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-4xl font-extrabold tracking-tight">{c.services.title || "Cosa trovi da noi"}</h2>
            {c.services.intro && <p className="mt-3 text-neutral-600">{c.services.intro}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupServices(items).flatMap(([cat, list]) =>
              list.map((s, i) => (
                <div key={cat + i} className="group rounded-2xl border border-neutral-200 p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                  {cat && <span className="text-xs font-bold uppercase tracking-wider text-accent">{cat}</span>}
                  <h3 className="mt-1 text-lg font-bold group-hover:text-primary">{s.name}</h3>
                  {s.description && <p className="mt-1 text-sm text-neutral-600">{s.description}</p>}
                  {s.price && <p className="mt-3 text-lg font-extrabold text-primary">{s.price}</p>}
                </div>
              )),
            )}
          </div>
        </section>
      )}

      {(c.about.text || c.about.image) && (
        <section className="bg-neutral-50">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight">{c.about.title || "Il negozio"}</h2>
              <div className="mt-5 space-y-4 whitespace-pre-line text-lg leading-relaxed text-neutral-600">{c.about.text}</div>
            </div>
            <Img src={c.about.image || c.gallery[0]} alt={c.about.title || client.nome_attivita} className="aspect-[4/3] w-full rounded-3xl" />
          </div>
        </section>
      )}

      {c.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Gallery images={c.gallery} name={client.nome_attivita} />
        </section>
      )}

      <section id="visita" className="bg-neutral-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">Vieni a trovarci</h2>
            <ContactList ct={ct} className="mt-6 text-neutral-200" />
            {hasHours(c) && (
              <div className="mt-8 rounded-2xl bg-white/5 p-6">
                <h3 className="mb-3 flex items-center gap-2 font-bold"><Clock className="h-5 w-5 text-accent" /> Orari di apertura</h3>
                <HoursList content={c} rowClass="text-sm" />
              </div>
            )}
          </div>
          <MapEmbed query={ct.mapsQuery} className="min-h-96 rounded-3xl" />
        </div>
      </section>

      <SiteFooter client={client} content={c} privacyHref={privacyHref} className="bg-black text-neutral-400" />
      <MobileActionBar ct={ct} />
      <FloatingWhatsApp ct={ct} />
    </div>
  );
}
