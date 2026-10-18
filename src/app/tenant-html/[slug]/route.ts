import { getPublicSite } from "@/lib/tenant/data";
import { isLive } from "@/lib/billing/status";
import { withLegalFooter } from "@/lib/site/custom-html";

// Home dei siti "HTML personalizzato". Il proxy ci manda qui solo se il sito
// è online; ricontrolliamo comunque. I dati sono in cache (getPublicSite).
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const site = await getPublicSite((await params).slug);
  if (!site || !site.pubblicato || !isLive(site.stato) || !site.htmlMode || !site.customHtml) {
    return new Response("Not found", { status: 404 });
  }
  const html = withLegalFooter(site.customHtml, { nome: site.client.nome_attivita, partitaIva: site.client.partita_iva });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
