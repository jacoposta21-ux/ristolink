import { siteContentSchema, type SiteContent, type TemplateId } from "./schema";

// Contenuti di partenza per ogni template: il nuovo sito è già "pieno"
// e basta ritoccare testi e foto (obiettivo: sito pronto in < 15 minuti).

type Seed = { nome: string; telefono?: string | null; email?: string | null; indirizzo?: string | null };

const open = (slots: [string, string][]) => ({ closed: false, slots: slots.map(([from, to]) => ({ from, to })) });
const closed = { closed: true, slots: [] };

const PRESETS: Record<TemplateId, (s: Seed) => Partial<SiteContent>> = {
  ristorante: (s) => ({
    theme: { primary: "#9a3412", accent: "#ca8a04" },
    hero: {
      title: s.nome,
      subtitle: "Cucina di tradizione, ingredienti freschi e l'accoglienza di casa.",
      image: "",
      ctaLabel: "Prenota un tavolo",
    },
    about: {
      title: "La nostra storia",
      text: `Da ${s.nome} ogni piatto nasce da ricette di famiglia e prodotti del territorio. Ti aspettiamo per pranzo e cena in un ambiente semplice e accogliente.`,
      image: "",
    },
    highlights: [
      { title: "Prodotti locali", text: "Scegliamo ogni giorno materie prime dai produttori della zona." },
      { title: "Fatto in casa", text: "Pasta, dolci e pane preparati ogni mattina nella nostra cucina." },
      { title: "Per ogni occasione", text: "Cene di famiglia, pranzi di lavoro e feste su prenotazione." },
    ],
    services: {
      title: "Il menù",
      intro: "Una selezione dei nostri piatti. Il menù cambia con le stagioni.",
      items: [
        { category: "Antipasti", name: "Tagliere della casa", description: "Salumi e formaggi locali", price: "12 €" },
        { category: "Primi", name: "Tagliatelle al ragù", description: "Pasta fresca fatta in casa", price: "11 €" },
        { category: "Secondi", name: "Grigliata mista", description: "Con verdure di stagione", price: "16 €" },
        { category: "Dolci", name: "Tiramisù", description: "La ricetta della nonna", price: "5 €" },
      ],
    },
    hours: [closed, open([["12:00", "14:30"], ["19:00", "23:00"]]), open([["12:00", "14:30"], ["19:00", "23:00"]]),
      open([["12:00", "14:30"], ["19:00", "23:00"]]), open([["12:00", "14:30"], ["19:00", "23:30"]]),
      open([["12:00", "14:30"], ["19:00", "23:30"]]), open([["12:00", "15:00"]])],
  }),
  beauty: (s) => ({
    theme: { primary: "#9d174d", accent: "#d4a373" },
    hero: {
      title: s.nome,
      subtitle: "Prenditi un momento per te: taglio, colore e trattamenti su misura.",
      image: "",
      ctaLabel: "Prenota su WhatsApp",
    },
    about: {
      title: "Chi siamo",
      text: `${s.nome} è il tuo salone di fiducia: ascoltiamo le tue esigenze e ti consigliamo il look più adatto a te, con prodotti professionali e tanta passione.`,
      image: "",
    },
    highlights: [
      { title: "Consulenza personalizzata", text: "Ogni servizio inizia ascoltando cosa desideri." },
      { title: "Prodotti professionali", text: "Usiamo solo marchi selezionati e delicati." },
      { title: "Su appuntamento", text: "Niente attese: scegli tu l'orario." },
    ],
    services: {
      title: "Servizi e prezzi",
      intro: "",
      items: [
        { category: "Capelli", name: "Taglio e piega", description: "", price: "da 30 €" },
        { category: "Capelli", name: "Colore", description: "", price: "da 40 €" },
        { category: "Capelli", name: "Meches / Balayage", description: "", price: "da 70 €" },
        { category: "Trattamenti", name: "Trattamento ristrutturante", description: "", price: "20 €" },
      ],
    },
    hours: [closed, open([["09:00", "19:00"]]), open([["09:00", "19:00"]]), open([["09:00", "19:00"]]),
      open([["09:00", "19:00"]]), open([["08:30", "18:00"]]), closed],
  }),
  negozio: (s) => ({
    theme: { primary: "#1d4ed8", accent: "#f97316" },
    hero: {
      title: s.nome,
      subtitle: "Qualità, cortesia e i consigli giusti, a due passi da casa.",
      image: "",
      ctaLabel: "Vieni a trovarci",
    },
    about: {
      title: "Il negozio",
      text: `${s.nome} è un punto di riferimento nel quartiere: selezioniamo con cura ogni prodotto e siamo sempre pronti ad aiutarti a trovare quello che cerchi.`,
      image: "",
    },
    highlights: [
      { title: "Scelta accurata", text: "Solo prodotti che conosciamo e consigliamo." },
      { title: "Servizio su misura", text: "Ordini su richiesta e confezioni regalo." },
      { title: "Vicino a te", text: "Ritiro in negozio e consegna in zona." },
    ],
    services: {
      title: "Cosa trovi da noi",
      intro: "",
      items: [
        { category: "", name: "Novità di stagione", description: "Arrivi settimanali", price: "" },
        { category: "", name: "Idee regalo", description: "Confezioni personalizzate", price: "" },
        { category: "", name: "Ordini su richiesta", description: "Chiedici quello che non trovi", price: "" },
      ],
    },
    hours: [open([["15:30", "19:30"]]), open([["09:00", "12:30"], ["15:30", "19:30"]]),
      open([["09:00", "12:30"], ["15:30", "19:30"]]), open([["09:00", "12:30"], ["15:30", "19:30"]]),
      open([["09:00", "12:30"], ["15:30", "19:30"]]), open([["09:00", "12:30"], ["15:30", "19:30"]]), closed],
  }),
  artigiano: (s) => ({
    theme: { primary: "#334155", accent: "#eab308" },
    hero: {
      title: s.nome,
      subtitle: "Lavori eseguiti a regola d'arte, preventivi chiari e tempi rispettati.",
      image: "",
      ctaLabel: "Richiedi un preventivo",
    },
    about: {
      title: "Chi siamo",
      text: `${s.nome} lavora con serietà e professionalità per privati e aziende. Sopralluogo e preventivo senza impegno.`,
      image: "",
    },
    highlights: [
      { title: "Preventivo gratuito", text: "Sopralluogo e stima dei costi senza impegno." },
      { title: "Esperienza", text: "Anni di lavori eseguiti nella zona." },
      { title: "Pronto intervento", text: "Disponibili anche per urgenze." },
    ],
    services: {
      title: "I nostri servizi",
      intro: "",
      items: [
        { category: "", name: "Installazione", description: "Nuovi impianti chiavi in mano", price: "" },
        { category: "", name: "Manutenzione", description: "Controlli periodici e riparazioni", price: "" },
        { category: "", name: "Ristrutturazioni", description: "Dal progetto alla consegna", price: "" },
      ],
    },
    hours: [open([["08:00", "12:30"], ["14:00", "18:00"]]), open([["08:00", "12:30"], ["14:00", "18:00"]]),
      open([["08:00", "12:30"], ["14:00", "18:00"]]), open([["08:00", "12:30"], ["14:00", "18:00"]]),
      open([["08:00", "12:30"], ["14:00", "18:00"]]), open([["08:00", "12:00"]]), closed],
  }),
};

export function defaultContent(template: TemplateId, seed: Seed): SiteContent {
  const preset = PRESETS[template](seed);
  return siteContentSchema.parse({
    ...preset,
    contacts: {
      phone: seed.telefono ?? "",
      whatsapp: seed.telefono ?? "",
      email: seed.email ?? "",
      address: seed.indirizzo ?? "",
      mapsQuery: seed.indirizzo ? `${seed.nome}, ${seed.indirizzo}` : "",
    },
    seo: { title: seed.nome, description: preset.hero?.subtitle ?? "", ogImage: "" },
  });
}
