import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parseContent, type TemplateId } from "@/lib/site/schema";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { tenantUrl } from "@/lib/env";
import type { Client, Site } from "@/lib/types";

export const metadata = { title: "Modifica sito" };

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: client }, { data: site }] = await Promise.all([
    supabase.from("clients").select("id, nome_attivita, slug, custom_domain, stato, manual_override").eq("id", id).maybeSingle<Client>(),
    supabase.from("sites").select("*").eq("client_id", id).maybeSingle<Site>(),
  ]);
  if (!client || !site) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/clienti/${id}`} className="text-sm text-neutral-500 hover:underline">← Scheda cliente</Link>
        <h1 className="text-2xl font-semibold">Sito di {client.nome_attivita}</h1>
        <StatusBadge status={client.stato} override={client.manual_override} />
      </div>
      <SiteEditor
        clientId={id}
        initial={{
          template: site.template as TemplateId,
          content: parseContent(site.content),
          pubblicato: site.pubblicato,
          htmlMode: site.html_mode,
          customHtml: site.custom_html,
        }}
        previewHref={`/clienti/${id}/anteprima`}
        siteUrl={tenantUrl(client.slug, client.custom_domain)}
      />
    </div>
  );
}
