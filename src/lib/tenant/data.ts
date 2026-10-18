import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "../supabase/admin";
import { tenantTag } from "../cache";
import { parseContent, type SiteContent, type TemplateId } from "../site/schema";
import type { ClientStatus } from "../billing/status";
import type { PublicClient } from "@/components/site/types";

export type PublicSite = {
  client: PublicClient;
  stato: ClientStatus;
  template: TemplateId;
  content: SiteContent;
  pubblicato: boolean;
  updated_at: string;
};

/**
 * Dati pubblici del sito, in cache (tag "tenant:<slug>") per 1 ora.
 * La cache viene invalidata subito quando il sito viene salvato o lo stato cambia.
 */
export const getPublicSite = (slug: string) =>
  unstable_cache(
    async (): Promise<PublicSite | null> => {
      const { data } = await supabaseAdmin()
        .from("clients")
        .select("nome_attivita, slug, custom_domain, telefono, email, indirizzo, partita_iva, codice_fiscale, stato, archived_at, sites(template, content, pubblicato, updated_at)")
        .eq("slug", slug)
        .is("archived_at", null)
        .maybeSingle();
      if (!data || !data.sites) return null;
      const site = data.sites as unknown as { template: TemplateId; content: unknown; pubblicato: boolean; updated_at: string };
      return {
        client: {
          nome_attivita: data.nome_attivita,
          slug: data.slug,
          custom_domain: data.custom_domain,
          telefono: data.telefono,
          email: data.email,
          indirizzo: data.indirizzo,
          partita_iva: data.partita_iva,
          codice_fiscale: data.codice_fiscale,
        },
        stato: data.stato as ClientStatus,
        template: site.template,
        content: parseContent(site.content),
        pubblicato: site.pubblicato,
        updated_at: site.updated_at,
      };
    },
    ["public-site", slug],
    { tags: [tenantTag(slug)], revalidate: 3600 },
  )();
