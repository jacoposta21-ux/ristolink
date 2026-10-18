import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { openPortal } from "../../paga/actions";
import { findClientByToken } from "@/lib/tenant/tokens";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PublicShell } from "../../paga/PublicShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gestione abbonamento", robots: { index: false, follow: false } };

export default async function PortalPage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ ritorno?: string }>;
}) {
  const { token } = await params;
  const { ritorno } = await searchParams;
  const client = await findClientByToken("portal_token", token);
  if (!client) notFound();

  return (
    <PublicShell>
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <CreditCard className="h-10 w-10 text-neutral-800" />
        <h1 className="mt-4 text-2xl font-semibold">{client.nome_attivita}</h1>
        {ritorno && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Modifiche salvate. Grazie!</p>}
        {client.stripe_customer_id ? (
          <>
            <p className="mt-2 text-neutral-600">
              Aggiorna la carta o l&apos;IBAN, scarica le fatture o gestisci l&apos;abbonamento in modo sicuro su Stripe.
            </p>
            <form action={openPortal.bind(null, token)} className="mt-6">
              <SubmitButton className="w-full rounded-xl bg-neutral-900 px-5 py-3.5 font-semibold text-white hover:bg-neutral-700" pendingLabel="Apertura…">
                Apri l&apos;area pagamenti
              </SubmitButton>
            </form>
          </>
        ) : (
          <p className="mt-2 text-neutral-600">L&apos;abbonamento non è ancora stato attivato. Usa il link di attivazione che ti abbiamo inviato.</p>
        )}
      </div>
    </PublicShell>
  );
}
