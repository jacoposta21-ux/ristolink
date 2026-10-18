import { getPublicSite } from "@/lib/tenant/data";
import { tenantUrl } from "@/lib/env";

// dinamico: i dati sono comunque in cache (getPublicSite)
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const site = await getPublicSite((await params).slug);
  if (!site) return new Response("Not found", { status: 404 });
  const base = tenantUrl(site.client.slug, site.client.custom_domain);
  const lastmod = new Date(site.updated_at).toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/privacy</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq><priority>0.1</priority></url>
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
