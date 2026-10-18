import type { SiteContent, TemplateId } from "@/lib/site/schema";
import { contactInfo } from "./helpers";
import type { PublicClient } from "./types";

const TYPE: Record<TemplateId, string> = {
  ristorante: "Restaurant",
  beauty: "BeautySalon",
  negozio: "Store",
  artigiano: "HomeAndConstructionBusiness",
};
const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function localBusinessJsonLd(client: PublicClient, content: SiteContent, template: TemplateId, url: string) {
  const ct = contactInfo(client, content);
  const images = [content.hero.image, content.about.image, ...content.gallery].filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": TYPE[template],
    "@id": `${url}/#business`,
    name: client.nome_attivita,
    url,
    description: content.seo.description || content.hero.subtitle || undefined,
    telephone: ct.phone || undefined,
    email: ct.email || undefined,
    image: images.length ? images : undefined,
    vatID: client.partita_iva || undefined,
    address: ct.street
      ? {
          "@type": "PostalAddress",
          streetAddress: ct.street,
          addressLocality: content.contacts.city || undefined,
          postalCode: content.contacts.zip || undefined,
          addressRegion: content.contacts.province || undefined,
          addressCountry: "IT",
        }
      : undefined,
    openingHoursSpecification: content.hours.flatMap((d, i) =>
      d.closed ? [] : d.slots.map((s) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAYS[i], opens: s.from, closes: s.to })),
    ),
    sameAs: [content.contacts.instagram, content.contacts.facebook].filter(Boolean),
    hasMap: ct.mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ct.mapsQuery)}` : undefined,
  };
  if (template === "ristorante") {
    data.servesCuisine = "Italiana";
    if (content.contacts.bookingUrl) data.acceptsReservations = true;
  }
  return data;
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // l'escape di "<" evita qualsiasi chiusura anticipata del tag script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
