import type { SiteContent, Service } from "@/lib/site/schema";
import { DAYS } from "@/lib/site/schema";
import type { PublicClient } from "./types";
import { telHref, waHref } from "@/lib/format";

export function contactInfo(client: PublicClient, c: SiteContent) {
  const phone = c.contacts.phone || client.telefono || "";
  const whatsapp = c.contacts.whatsapp || "";
  const email = c.contacts.email || client.email || "";
  const street = c.contacts.address || client.indirizzo || "";
  const cityLine = [c.contacts.zip, c.contacts.city, c.contacts.province ? `(${c.contacts.province})` : ""].filter(Boolean).join(" ");
  const fullAddress = [street, cityLine].filter(Boolean).join(", ");
  const mapsQuery = c.contacts.mapsQuery || (fullAddress ? `${client.nome_attivita}, ${fullAddress}` : "");
  return {
    phone,
    phoneHref: phone ? telHref(phone) : null,
    whatsapp,
    whatsappHref: whatsapp ? waHref(whatsapp, `Ciao ${client.nome_attivita}, vi scrivo dal vostro sito.`) : null,
    email,
    street,
    cityLine,
    fullAddress,
    mapsQuery,
    directionsHref: mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}` : null,
    bookingHref: c.contacts.bookingUrl || null,
  };
}

export type Contact = ReturnType<typeof contactInfo>;

export function groupServices(items: Service[]): [string, Service[]][] {
  const groups = new Map<string, Service[]>();
  for (const s of items) {
    const k = s.category.trim();
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  return [...groups.entries()];
}

export function hoursRows(c: SiteContent) {
  return DAYS.map((day, i) => {
    const d = c.hours[i];
    const text = d?.closed ? "Chiuso" : d?.slots?.length ? d.slots.map((s) => `${s.from}–${s.to}`).join(" · ") : "";
    return { day, text, closed: !!d?.closed };
  });
}

export function hasHours(c: SiteContent) {
  return c.hours.some((d) => d.closed || d.slots.length > 0);
}

/** CTA principale: prenotazione > WhatsApp > telefono > indicazioni */
export function primaryCta(ct: Contact, label: string) {
  if (ct.bookingHref) return { href: ct.bookingHref, label: label || "Prenota", external: true };
  if (ct.whatsappHref) return { href: ct.whatsappHref, label: label || "Scrivici su WhatsApp", external: true };
  if (ct.phoneHref) return { href: ct.phoneHref, label: label || "Chiamaci", external: false };
  if (ct.directionsHref) return { href: ct.directionsHref, label: label || "Come arrivare", external: true };
  return null;
}
