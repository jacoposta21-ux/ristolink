import { Sparkles } from "lucide-react";
import type { SiteProps } from "../types";
import { contactInfo, groupServices, hasHours, primaryCta } from "../helpers";
import { Img } from "../Img";
import { OpenNow } from "../OpenNow";
import { MapEmbed } from "../MapEmbed";
import { ContactList, FloatingWhatsApp, Gallery, HoursList, MobileActionBar, SiteFooter } from "../shared";

export function Beauty({ client, content: c, privacyHref }: SiteProps) {
  const ct = contactInfo(client, c);
  const cta = primaryCta(ct, c.hero.ctaLabel);
  const groups = groupServices(c.services.items);

  return (
    <div className="bg-[#fbf8f6] text-[#2d2a2e]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#fbf8f6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="font-serif text-xl italic">{client.nome_attivita}</a>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {groups.length > 0 && <a href="#servizi" className="hover:text-primary">Servizi</a>}
            {c.gallery.length > 0 && <a href="#galleria" className="hover:text-primary">Galleria</a>}
            <a href="#contatti" className="hover:text-primary">Contatti</a>
            {cta && (
              <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noopener" className="bg-primary rounded-full px-5 py-2 font-medium text-white hover:brightness-110">
                {cta.label}
              </a>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-24">
        <div className="order-2 md:order-1">
          <OpenNow hours={c.hours} className="mb-5" />
          <h1 className="font-serif text-5xl leading-[1.05] md:text-6xl">{c.hero.title || client.nome_attivita}</h1>
          {c.hero.subtitle && <p className="mt-5 max-w-md text-lg leading-relaxed text-[#6b6470]">{c.hero.subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {cta && (
              <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noopener" className="bg-primary rounded-full px-7 py-3.5 font-medium text-white shadow-md hover:brightness-110">
                {cta.label}
              </a>
            )}
            {groups.length > 0 && (
              <a href="#servizi" className="rounded-full border border-[#2d2a2e]/20 px-7 py-3.5 font-medium hover:border-primary hover:text-primary">
                Servizi e prezzi
              </a>
            )}
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <div className="absolute -right-4 -top-4 h-full w-full rounded-t-full bg-[color-mix(in_srgb,var(--accent)_35%,white)]" />
          <Img src={c.hero.image} alt={client.nome_attivita} eager className="relative aspect-[4/5] w-full rounded-t-full shadow-xl" />
        </div>
      </section>

      {c.highlights.length > 0 && (
        <section className="bg-white py-14">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
            {c.highlights.map((h, i) => (
              <div key={i} className="flex gap-4 rounded-3xl bg-[#fbf8f6] p-6">
                <Sparkles className="h-6 w-6 shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold">{h.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6b6470]">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section id="servizi" className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-12 text-center">
            <p className="font-serif text-lg italic text-accent">i nostri trattamenti</p>
            <h2 className="mt-1 font-serif text-4xl md:text-5xl">{c.services.title || "Servizi"}</h2>
            {c.services.intro && <p className="mx-auto mt-4 max-w-xl text-[#6b6470]">{c.services.intro}</p>}
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {groups.map(([cat, items]) => (
              <div key={cat} className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm">
                {cat && <h3 className="mb-4 font-serif text-2xl text-primary">{cat}</h3>}
                <ul className="divide-y divide-black/5">
                  {items.map((s, i) => (
                    <li key={i} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.description && <p className="text-sm text-[#6b6470]">{s.description}</p>}
                      </div>
                      {s.price && <p className="whitespace-nowrap font-semibold text-primary">{s.price}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {(c.about.text || c.about.image) && (
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[2fr_3fr]">
            <Img src={c.about.image || c.gallery[0]} alt={c.about.title || client.nome_attivita} className="mx-auto aspect-square w-full max-w-sm rounded-full" />
            <div>
              <h2 className="font-serif text-4xl">{c.about.title || "Chi siamo"}</h2>
              <div className="mt-5 space-y-4 whitespace-pre-line text-lg leading-relaxed text-[#6b6470]">{c.about.text}</div>
            </div>
          </div>
        </section>
      )}

      {c.gallery.length > 0 && (
        <section id="galleria" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-8 text-center font-serif text-4xl">Galleria</h2>
          <Gallery images={c.gallery} name={client.nome_attivita} />
        </section>
      )}

      {cta && (
        <section className="bg-primary px-5 py-16 text-center text-white">
          <h2 className="font-serif text-3xl md:text-4xl">Concediti una pausa di bellezza</h2>
          <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noopener" className="mt-6 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-primary hover:bg-white/90">
            {cta.label}
          </a>
        </section>
      )}

      <section id="contatti" className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <h2 className="mb-5 font-serif text-2xl">Contatti</h2>
          <ContactList ct={ct} />
        </div>
        {hasHours(c) && (
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="mb-5 font-serif text-2xl">Orari</h2>
            <HoursList content={c} rowClass="text-sm" />
          </div>
        )}
        <MapEmbed query={ct.mapsQuery} className={`min-h-72 rounded-3xl ${hasHours(c) ? "" : "md:col-span-2"}`} />
      </section>

      <SiteFooter client={client} content={c} privacyHref={privacyHref} className="border-t border-black/5 text-[#6b6470]" />
      <MobileActionBar ct={ct} />
      <FloatingWhatsApp ct={ct} />
    </div>
  );
}
