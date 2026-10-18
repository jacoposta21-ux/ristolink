import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSite } from "@/lib/tenant/data";
import { isLive } from "@/lib/billing/status";
import { PrivacyPolicy } from "@/components/site/PrivacyPolicy";

export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getPublicSite((await params).slug);
  return { title: site ? `Privacy e cookie — ${site.client.nome_attivita}` : "Privacy", robots: { index: false } };
}

export default async function TenantPrivacy({ params }: Props) {
  const site = await getPublicSite((await params).slug);
  if (!site || !site.pubblicato || !isLive(site.stato)) notFound();
  return <PrivacyPolicy client={site.client} content={site.content} homeHref="/" />;
}
