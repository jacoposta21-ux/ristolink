import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSite } from "@/lib/tenant/data";
import { isLive } from "@/lib/billing/status";
import { tenantUrl } from "@/lib/env";
import { SiteRenderer } from "@/components/site/SiteRenderer";
import { JsonLd, localBusinessJsonLd } from "@/components/site/JsonLd";

// Pagina pubblica del sito cliente. Il proxy ci arriva solo se il sito è online;
// qui ricontrolliamo comunque (difesa in profondità). ISR: generata alla prima
// visita e servita dalla cache finché non viene invalidata dal salvataggio.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSite(slug);
  if (!site) return {};
  const { client, content } = site;
  const url = tenantUrl(client.slug, client.custom_domain);
  const title = content.seo.title || client.nome_attivita;
  const description = content.seo.description || content.hero.subtitle || `${client.nome_attivita}: orari, contatti e informazioni.`;
  const image = content.seo.ogImage || content.hero.image || content.gallery[0];
  return {
    metadataBase: new URL(url),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "it_IT",
      url,
      siteName: client.nome_attivita,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
    robots: { index: true, follow: true },
    other: { "theme-color": content.theme.primary },
  };
}

export default async function TenantPage({ params }: Props) {
  const { slug } = await params;
  const site = await getPublicSite(slug);
  if (!site || !site.pubblicato || !isLive(site.stato)) notFound();
  const url = tenantUrl(site.client.slug, site.client.custom_domain);
  return (
    <>
      <JsonLd data={localBusinessJsonLd(site.client, site.content, site.template, url)} />
      <SiteRenderer client={site.client} content={site.content} template={site.template} privacyHref="/privacy" />
    </>
  );
}
