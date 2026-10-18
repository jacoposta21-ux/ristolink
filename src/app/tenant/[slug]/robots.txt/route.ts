import { getPublicSite } from "@/lib/tenant/data";
import { tenantUrl } from "@/lib/env";

// dinamico: i dati sono comunque in cache (getPublicSite)
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const site = await getPublicSite((await params).slug);
  if (!site) return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
  const base = tenantUrl(site.client.slug, site.client.custom_domain);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
