import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseContent, type TemplateId } from "@/lib/site/schema";
import { SiteRenderer } from "@/components/site/SiteRenderer";
import { isLive } from "@/lib/billing/status";
import type { PublicClient } from "@/components/site/types";
import type { Client, Site } from "@/lib/types";

export const metadata = { title: "Anteprima", robots: { index: false } };

// Anteprima del sito (ultima versione salvata), visibile solo all'admin,
// indipendentemente da stato abbonamento e pubblicazione.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: client }, { data: site }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>(),
    supabase.from("sites").select("*").eq("client_id", id).maybeSingle<Site>(),
  ]);
  if (!client || !site) notFound();
  const pub: PublicClient = {
    nome_attivita: client.nome_attivita,
    slug: client.slug,
    custom_domain: client.custom_domain,
    telefono: client.telefono,
    email: client.email,
    indirizzo: client.indirizzo,
    partita_iva: client.partita_iva,
    codice_fiscale: client.codice_fiscale,
  };
  const online = site.pubblicato && isLive(client.stato);
  return (
    <>
      <div className="fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-full bg-black/80 px-4 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur">
        Anteprima · {online ? "il sito è online" : "il sito NON è ancora visibile al pubblico"}
      </div>
      <SiteRenderer client={pub} content={parseContent(site.content)} template={site.template as TemplateId} privacyHref="#" preview />
    </>
  );
}
