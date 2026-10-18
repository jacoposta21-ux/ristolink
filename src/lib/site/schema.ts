import { z } from "zod";

// Contenuto del sito (colonna sites.content). Ogni campo ha un default,
// così un JSON parziale o vecchio viene sempre "riparato" in lettura.

export const TEMPLATES = ["ristorante", "beauty", "negozio", "artigiano"] as const;
export type TemplateId = (typeof TEMPLATES)[number];

export const TEMPLATE_LABEL: Record<TemplateId, string> = {
  ristorante: "Ristorante / Bar / Pizzeria",
  beauty: "Parrucchiere / Estetica / Servizi",
  negozio: "Negozio",
  artigiano: "Artigiano / Impresa",
};

export const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido (es. #b91c1c)");
const text = (max: number) => z.string().max(max).default("");
const url = z.string().max(2000).default("");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Orario non valido (HH:MM)");

export const serviceSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio").max(120),
  description: text(400),
  price: text(40),
  category: text(60),
});

export const daySchema = z.object({
  closed: z.boolean().default(false),
  slots: z.array(z.object({ from: time, to: time })).max(3).default([]),
});

export const siteContentSchema = z.object({
  theme: z
    .object({
      primary: hex.default("#b91c1c"),
      accent: hex.default("#f59e0b"),
    })
    .default({ primary: "#b91c1c", accent: "#f59e0b" }),
  hero: z
    .object({
      title: text(120),
      subtitle: text(300),
      image: url,
      ctaLabel: text(40),
    })
    .default({ title: "", subtitle: "", image: "", ctaLabel: "" }),
  about: z
    .object({ title: text(120), text: text(3000), image: url })
    .default({ title: "", text: "", image: "" }),
  highlights: z
    .array(z.object({ title: z.string().max(80), text: text(300) }))
    .max(6)
    .default([]),
  services: z
    .object({ title: text(120), intro: text(500), items: z.array(serviceSchema).max(100).default([]) })
    .default({ title: "", intro: "", items: [] }),
  gallery: z.array(z.string().max(2000)).max(24).default([]),
  hours: z.array(daySchema).length(7).default(Array.from({ length: 7 }, () => ({ closed: false, slots: [] }))),
  hoursNote: text(300),
  contacts: z
    .object({
      phone: text(40),
      whatsapp: text(40),
      email: text(200),
      address: text(200),
      city: text(100),
      zip: text(10),
      province: text(4),
      mapsQuery: text(300),
      instagram: url,
      facebook: url,
      bookingUrl: url,
    })
    .default({
      phone: "", whatsapp: "", email: "", address: "", city: "", zip: "", province: "",
      mapsQuery: "", instagram: "", facebook: "", bookingUrl: "",
    }),
  seo: z
    .object({ title: text(70), description: text(170), ogImage: url })
    .default({ title: "", description: "", ogImage: "" }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type Service = z.infer<typeof serviceSchema>;

/** Legge il JSON dal DB in modo tollerante: se qualcosa non valida, usa i default. */
export function parseContent(raw: unknown): SiteContent {
  const r = siteContentSchema.safeParse(raw ?? {});
  if (r.success) return r.data;
  return siteContentSchema.parse({});
}
