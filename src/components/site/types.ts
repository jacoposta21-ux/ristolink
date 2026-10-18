import type { SiteContent, TemplateId } from "@/lib/site/schema";

/** Dati del cliente esposti pubblicamente sul sito (niente dati Stripe). */
export type PublicClient = {
  nome_attivita: string;
  slug: string;
  custom_domain: string | null;
  telefono: string | null;
  email: string | null;
  indirizzo: string | null;
  partita_iva: string | null;
  codice_fiscale: string | null;
};

export type SiteProps = {
  client: PublicClient;
  content: SiteContent;
  template: TemplateId;
  /** link alla pagina privacy (diverso in anteprima) */
  privacyHref: string;
  preview?: boolean;
};
