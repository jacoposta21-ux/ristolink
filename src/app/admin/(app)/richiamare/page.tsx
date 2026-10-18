import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CopyButton } from "@/components/admin/CopyButton";
import { date, telHref, waHref } from "@/lib/format";
import { ROOT_URL } from "@/lib/env";
import type { Client } from "@/lib/types";

export const metadata = { title: "Da richiamare" };

export default async function CallListPage() {
  const { supabase } = await requireAdmin();
  const settings = await getSettings(supabase);
  const { data } = await supabase
    .from("clients")
    .select("*")
    .in("stato", ["in_ritardo", "sospeso"])
    .is("archived_at", null)
    .order("past_due_since", { ascending: true, nullsFirst: false });
  const clients = (data ?? []) as Client[];
  const late = clients.filter((c) => c.stato === "in_ritardo");
  const suspended = clients.filter((c) => c.stato === "sospeso" && c.manual_override !== "sospeso");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Da richiamare</h1>
        <p className="text-sm text-neutral-600">
          Clienti con pagamento non riuscito. Tolleranza: {settings.grace_days} giorni, poi il sito va offline in automatico.
        </p>
      </div>
      <Section title={`In ritardo (${late.length})`} clients={late} graceDays={settings.grace_days} empty="Nessun cliente in ritardo 🎉" />
      <Section title={`Sospesi per mancato pagamento (${suspended.length})`} clients={suspended} graceDays={settings.grace_days} empty="Nessun sito sospeso." />
    </div>
  );
}

function Section({ title, clients, graceDays, empty }: { title: string; clients: Client[]; graceDays: number; empty: string }) {
  return (
    <section>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {clients.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">{empty}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const graceEnd = c.past_due_since ? new Date(new Date(c.past_due_since).getTime() + graceDays * 86_400_000) : null;
            // eslint-disable-next-line react-hooks/purity -- Server Component renderizzato a ogni richiesta
            const daysLeft = graceEnd ? Math.ceil((graceEnd.getTime() - Date.now()) / 86_400_000) : null;
            const portal = `${ROOT_URL}/portale/${c.portal_token}`;
            const msg = `Ciao${c.referente ? " " + c.referente : ""}, il rinnovo del sito di ${c.nome_attivita} non è andato a buon fine. Puoi aggiornare il metodo di pagamento qui: ${portal}`;
            return (
              <li key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/clienti/${c.id}`} className="font-semibold hover:underline">{c.nome_attivita}</Link>
                  <StatusBadge status={c.stato} />
                </div>
                {c.referente && <p className="text-sm text-neutral-600">{c.referente}</p>}
                <p className="mt-1 text-xs text-neutral-500">
                  In ritardo dal {date(c.past_due_since)}
                  {c.stato === "in_ritardo" && daysLeft !== null && ` · sospensione tra ${Math.max(daysLeft, 0)} gg`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.telefono ? (
                    <>
                      <a href={telHref(c.telefono)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                        <Phone className="h-4 w-4" /> {c.telefono}
                      </a>
                      <a href={waHref(c.telefono, msg)} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
                        <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
                      </a>
                    </>
                  ) : (
                    <span className="text-sm text-neutral-500">Nessun telefono</span>
                  )}
                  <CopyButton value={portal} label="Link portale" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
