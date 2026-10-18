import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";
import { findClientByToken } from "@/lib/tenant/tokens";
import { tenantUrl } from "@/lib/env";
import { PublicShell } from "../PublicShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Grazie!", robots: { index: false } };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const client = c ? await findClientByToken("payment_token", c) : null;
  const url = client ? tenantUrl(client.slug, client.custom_domain) : null;
  return (
    <PublicShell>
      <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <PartyPopper className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-semibold">Grazie, è tutto pronto!</h1>
        <p className="mt-2 text-neutral-600">
          Abbiamo ricevuto la tua attivazione. Riceverai via email la conferma e le ricevute di Stripe.
          {url && " Il sito sarà online entro pochi minuti."}
        </p>
        {url && (
          <a href={url} className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white">
            Vai al sito
          </a>
        )}
      </div>
    </PublicShell>
  );
}
