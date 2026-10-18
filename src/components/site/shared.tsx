import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { SiteContent } from "@/lib/site/schema";
import { CookieBanner, CookiePrefsLink } from "./CookieBanner";
import { Img } from "./Img";
import { hoursRows, type Contact } from "./helpers";
import type { PublicClient } from "./types";

/** Barra azioni fissa in basso su mobile: Chiama / WhatsApp / Indicazioni. */
export function MobileActionBar({ ct }: { ct: Contact }) {
  const items = [
    ct.phoneHref && { href: ct.phoneHref, label: "Chiama", icon: Phone, ext: false },
    ct.whatsappHref && { href: ct.whatsappHref, label: "WhatsApp", icon: MessageCircle, ext: true },
    ct.directionsHref && { href: ct.directionsHref, label: "Indicazioni", icon: Navigation, ext: true },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Phone; ext: boolean }[];
  if (!items.length) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ href, label, icon: Icon, ext }) => (
          <a key={label} href={href} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined} className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold text-neutral-800">
            <Icon className="h-5 w-5 text-primary" />
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/** Pulsanti flottanti desktop (WhatsApp). */
export function FloatingWhatsApp({ ct }: { ct: Contact }) {
  if (!ct.whatsappHref) return null;
  return (
    <a
      href={ct.whatsappHref}
      target="_blank"
      rel="noopener"
      aria-label="Scrivici su WhatsApp"
      className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 md:grid"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}

export function HoursList({ content, className = "", rowClass = "" }: { content: SiteContent; className?: string; rowClass?: string }) {
  const rows = hoursRows(content);
  return (
    <div className={className}>
      <dl className="divide-y divide-current/10">
        {rows.map((r) => (
          <div key={r.day} className={`flex justify-between gap-4 py-2 ${rowClass}`}>
            <dt className="font-medium">{r.day}</dt>
            <dd className={r.closed ? "opacity-60" : "text-right tabular-nums"}>{r.text || "—"}</dd>
          </div>
        ))}
      </dl>
      {content.hoursNote && <p className="mt-3 text-sm opacity-75">{content.hoursNote}</p>}
    </div>
  );
}

export function ContactList({ ct, className = "" }: { ct: Contact; className?: string }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {ct.fullAddress && (
        <li className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          {ct.directionsHref ? <a href={ct.directionsHref} target="_blank" rel="noopener" className="hover:underline">{ct.fullAddress}</a> : ct.fullAddress}
        </li>
      )}
      {ct.phone && (
        <li className="flex gap-3">
          <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <a href={ct.phoneHref!} className="hover:underline">{ct.phone}</a>
        </li>
      )}
      {ct.whatsappHref && (
        <li className="flex gap-3">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <a href={ct.whatsappHref} target="_blank" rel="noopener" className="hover:underline">WhatsApp {ct.whatsapp}</a>
        </li>
      )}
      {ct.email && (
        <li className="flex gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <a href={`mailto:${ct.email}`} className="break-all hover:underline">{ct.email}</a>
        </li>
      )}
    </ul>
  );
}

export function Gallery({ images, name, className = "" }: { images: string[]; name: string; className?: string }) {
  if (!images.length) return null;
  return (
    <div className={`grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 ${className}`}>
      {images.map((src, i) => (
        <a key={src + i} href={src} target="_blank" rel="noopener" className={`group block overflow-hidden rounded-xl ${i === 0 ? "col-span-2 row-span-2 md:col-span-2" : ""}`}>
          <Img src={src} alt={`${name} — foto ${i + 1}`} className="aspect-square h-full w-full transition duration-500 group-hover:scale-105" />
        </a>
      ))}
    </div>
  );
}

export function Socials({ content, className = "" }: { content: SiteContent; className?: string }) {
  const { instagram, facebook } = content.contacts;
  if (!instagram && !facebook) return null;
  return (
    <div className={`flex gap-4 text-sm font-medium ${className}`}>
      {instagram && <a href={instagram} target="_blank" rel="noopener" className="hover:underline">Instagram</a>}
      {facebook && <a href={facebook} target="_blank" rel="noopener" className="hover:underline">Facebook</a>}
    </div>
  );
}

export function SiteFooter({ client, content, privacyHref, className = "" }: {
  client: PublicClient;
  content: SiteContent;
  privacyHref: string;
  className?: string;
}) {
  const year = new Date().getFullYear();
  const fiscal = [client.partita_iva && `P. IVA ${client.partita_iva}`, client.codice_fiscale && `C.F. ${client.codice_fiscale}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <footer className={`px-5 pb-28 pt-10 text-sm md:pb-10 ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">{client.nome_attivita}</p>
          {fiscal && <p className="opacity-75">{fiscal}</p>}
          <p className="opacity-75">© {year} — Tutti i diritti riservati</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Socials content={content} />
          <div className="flex gap-4 opacity-75">
            <a href={privacyHref} className="underline">Privacy e cookie</a>
            <CookiePrefsLink />
          </div>
        </div>
      </div>
      <CookieBanner privacyHref={privacyHref} />
    </footer>
  );
}

export function SectionTitle({ kicker, title, className = "" }: { kicker?: string; title: string; className?: string }) {
  return (
    <div className={`mb-8 ${className}`}>
      {kicker && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{kicker}</p>}
      <h2 className="text-3xl font-semibold md:text-4xl">{title}</h2>
    </div>
  );
}

export { Clock };
