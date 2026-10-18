import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { startCheckout } from "../actions";
import { findClientByToken } from "@/lib/tenant/tokens";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/settings";
import { hasOngoingSubscription, trialDaysFor } from "@/lib/billing/checkout";
import { euro } from "@/lib/format";
import { tenantUrl } from "@/lib/env";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PublicShell } from "../PublicShell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ annullato?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const client = await findClientByToken("payment_token", (await params).token);
  return {
    title: client ? `Attiva il sito di ${client.nome_attivita}` : "Attivazione sito",
    description: "Il sito della tua attività, online e aggiornato. Nessun costo iniziale, disdici quando vuoi.",
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { annullato } = await searchParams;
  const client = await findClientByToken("payment_token", token);
  if (!client) notFound();

  const db = supabaseAdmin();
  const [settings, trialDays] = await Promise.all([getSettings(db), trialDaysFor(db, client)]);
  const ongoing = hasOngoingSubscription(client);
  const site = tenantUrl(client.slug, client.custom_domain).replace(/^https?:\/\//, "");

  return (
    <PublicShell>
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="bg-neutral-900 px-7 py-6 text-white">
          <p className="text-sm text-neutral-400">Il sito di</p>
          <h1 className="text-2xl font-semibold">{client.nome_attivita}</h1>
          <p className="mt-1 text-sm text-neutral-300">{site}</p>
        </div>
        <div className="space-y-5 px-7 py-6">
          {annullato && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Pagamento annullato. Puoi riprovare quando vuoi.</p>
          )}
          {ongoing ? (
            <>
              <p className="text-neutral-700">L&apos;abbonamento è già attivo. Puoi gestire il metodo di pagamento e scaricare le fatture.</p>
              <form action={startCheckout.bind(null, token)}>
                <SubmitButton className="w-full rounded-xl bg-neutral-900 px-5 py-3.5 font-semibold text-white hover:bg-neutral-700" pendingLabel="Apertura…">
                  Gestisci abbonamento
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{euro(settings.monthly_price_cents)}</span>
                  <span className="text-neutral-500">/mese</span>
                </div>
                <p className="text-sm text-neutral-500">IVA inclusa · nessun costo di attivazione</p>
                {trialDays > 0 && (
                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                    🎁 I primi {trialDays} giorni sono gratuiti: il primo addebito avverrà solo al termine della prova.
                  </p>
                )}
              </div>
              <ul className="space-y-2 text-sm text-neutral-700">
                {[
                  "Sito online su smartphone e computer",
                  "Pulsanti chiama, WhatsApp e indicazioni stradali",
                  "Aggiornamenti di orari, menù e foto inclusi",
                  "Rinnovo automatico, disdici quando vuoi",
                ].map((t) => (
                  <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> {t}</li>
                ))}
              </ul>
              <form action={startCheckout.bind(null, token)}>
                <SubmitButton className="w-full rounded-xl bg-neutral-900 px-5 py-3.5 font-semibold text-white hover:bg-neutral-700" pendingLabel="Apertura pagamento…">
                  {trialDays > 0 ? "Attiva la prova gratuita" : "Attiva ora"}
                </SubmitButton>
              </form>
              <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                <Lock className="h-3.5 w-3.5" /> Carta o addebito su conto (SEPA) · pagamento sicuro Stripe
              </p>
            </>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
