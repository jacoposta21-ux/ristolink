import { Phone, Clock, MapPin } from "lucide-react";
import type { SiteProps } from "../types";
import { contactInfo, groupServices, hasHours, primaryCta } from "../helpers";
import { Img } from "../Img";
import { OpenNow } from "../OpenNow";
import { MapEmbed } from "../MapEmbed";
import { ContactList, FloatingWhatsApp, Gallery, HoursList, MobileActionBar, SiteFooter } from "../shared";

export function Ristorante({ client, content: c, privacyHref }: SiteProps) {
  const ct = contactInfo(client, c);
  const cta = primaryCta(ct, c.hero.ctaLabel);
  const menu = groupServices(c.services.items);

  return (
    <div className="bg-[#faf7f2] text-[#2b2118]">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 text-white">
          <a href="#" className="font-serif text-xl font-semibold tracking-wide">{client.nome_attivita}</a>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            {menu.length > 0 && <a href="#menu" className="hover:opacity-80">{c.services.title || "Menù"}</a>}
            {hasHours(c) && <a href="#orari" className="hover:opacity-80">Orari</a>}
            <a href="#contatti" className="hover:opacity-80">Dove siamo</a>
            {ct.phoneHref && (
              <a href={ct.phoneHref} className="rounded-full border border-white/60 px-4 py-2 hover:bg-white hover:text-black">
                {ct.phone}
              </a>
            )}
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[92svh] items-end overflow-hidden text-white">
        <Img src={c.hero.image} alt={client.nome_attivita} eager className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-32">
          <OpenNow hours={c.hours} className="mb-5" />
          <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.05] md:text-7xl">{c.hero.title || client.nome_attivita}</h1>
          {c.hero.subtitle && <p className="mt-5 max-w-xl text-lg text-white/85 md:text-xl">{c.hero.subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {cta && (
              <a href={cta.href} target={cta.external ? "_blank" : undefined} rel="noopener" className="bg-primary rounded-full px-7 py-3.5 font-semibold text-white shadow-lg transition hover:brightness-110">
                {cta.label}
              </a>
            )}
            {menu.length > 0 && (
              <a href="#menu" className="rounded-full border border-white/70 px-7 py-3.5 font-semibold backdrop-blur hover:bg-white hover:text-black">
                Guarda il menù
              </a>
            )}
          </div>
        </div>
      </section>

      {c.highlights.length > 0 && (
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-3">
          {c.highlights.map((h, i) => (
            <div key={i} className="border-t-2 border-primary pt-5">
              <p className="font-serif text-4xl text-accent">0{i + 1}</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold">{h.title}</h3>
              <p className="mt-2 leading-relaxed text-[#5b4b3e]">{h.text}</p>
            </div>
          ))}
        </section>
      )}

      {(c.about.text || c.about.image) && (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-20 md:grid-cols-2 md:gap-16">
          <Img src={c.about.image || c.gallery[0]} alt={c.about.title || client.nome_attivita} className="aspect-[4/5] w-full rounded-sm shadow-2xl" />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Benvenuti</p>
            <h2 className="font-serif text-4xl font-semibold md:text-5xl">{c.about.title || "Chi siamo"}</h2>
            <div className="mt-6 space-y-4 whitespace-pre-line text-lg leading-relaxed text-[#5b4b3e]">{c.about.text}</div>
          </div>
        </section>
      )}

      {menu.length > 0 && (
        <section id="menu" className="bg-white py-20">
          <div className="mx-auto max-w-4xl px-5">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">La nostra cucina</p>
              <h2 className="font-serif text-4xl font-semibold md:text-5xl">{c.services.title || "Il menù"}</h2>
              {c.services.intro && <p className="mx-auto mt-4 max-w-xl text-[#5b4b3e]">{c.services.intro}</p>}
            </div>
            <div className="space-y-12">
              {menu.map(([cat, items]) => (
                <div key={cat}>
                  {cat && <h3 className="mb-5 text-center font-serif text-2xl italic text-primary">{cat}</h3>}
                  <ul className="space-y-5">
                    {items.map((s, i) => (
                      <li key={i}>
                        <div className="flex items-baseline gap-3">
                          <span className="font-serif text-lg font-semibold">{s.name}</span>
                          <span className="flex-1 border-b border-dotted border-[#cdbfae]" />
                          {s.price && <span className="font-serif text-lg font-semibold text-primary">{s.price}</span>}
                        </div>
                        {s.description && <p className="mt-1 text-sm italic text-[#7a6a5c]">{s.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {c.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Gallery images={c.gallery} name={client.nome_attivita} />
        </section>
      )}

      <section id="contatti" className="bg-[color-mix(in_srgb,var(--primary)_22%,#1c1410)] text-[#f5ede4]">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div id="orari" className="space-y-10">
            {hasHours(c) && (
              <div>
                <h2 className="mb-5 flex items-center gap-3 font-serif text-3xl font-semibold"><Clock className="h-6 w-6 text-accent" /> Orari</h2>
                <HoursList content={c} />
              </div>
            )}
            <div>
              <h2 className="mb-5 flex items-center gap-3 font-serif text-3xl font-semibold"><MapPin className="h-6 w-6 text-accent" /> Dove siamo</h2>
              <ContactList ct={ct} />
              {ct.phoneHref && (
                <a href={ct.phoneHref} className="bg-primary mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white hover:brightness-110">
                  <Phone className="h-4 w-4" /> Prenota al telefono
                </a>
              )}
            </div>
          </div>
          <MapEmbed query={ct.mapsQuery} className="min-h-80 rounded-sm" />
        </div>
      </section>

      <SiteFooter client={client} content={c} privacyHref={privacyHref} className="bg-[#140e0b] text-[#d8cbbd]" />
      <MobileActionBar ct={ct} />
      <FloatingWhatsApp ct={ct} />
    </div>
  );
}
