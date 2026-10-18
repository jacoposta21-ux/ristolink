import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ClientForm } from "@/components/admin/ClientForm";
import { Card } from "@/components/admin/ui";
import { updateClientAction } from "../../../../actions";
import { ROOT_DOMAIN } from "@/lib/env";
import type { Client } from "@/lib/types";

export const metadata = { title: "Dati cliente" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: client }, settings] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>(),
    getSettings(supabase),
  ]);
  if (!client) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/clienti/${id}`} className="text-sm text-neutral-500 hover:underline">← {client.nome_attivita}</Link>
      <h1 className="text-2xl font-semibold">Dati cliente</h1>
      <Card>
        <ClientForm
          action={updateClientAction.bind(null, id)}
          client={client}
          rootDomain={ROOT_DOMAIN}
          defaultTrialDays={settings.default_trial_days}
        />
      </Card>
      <p className="text-xs text-neutral-500">
        Attenzione: cambiando lo slug cambia l&apos;indirizzo del sito ({client.slug}.{ROOT_DOMAIN}). Il vecchio indirizzo smette di funzionare.
      </p>
    </div>
  );
}
