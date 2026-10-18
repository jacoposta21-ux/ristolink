import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CLIENT_STATUSES, STATUS_LABEL, type ClientStatus } from "@/lib/billing/status";
import { date, dateTime, euro, telHref } from "@/lib/format";
import { tenantUrl } from "@/lib/env";
import type { Client, EventLog } from "@/lib/types";

export const metadata = { title: "Clienti" };

type Kpis = {
  attivi: number;
  in_prova: number;
  in_ritardo: number;
  sospesi: number;
  in_attesa: number;
  cancellati: number;
  mrr_cents: number;
  nuovi_mese: number;
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string; q?: string; archiviati?: string }>;
}) {
  const { stato, q, archiviati } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("clients")
    .select("id, nome_attivita, referente, telefono, slug, custom_domain, stato, manual_override, current_period_end, past_due_since, data_attivazione, created_at, sites(pubblicato)")
    .order("created_at", { ascending: false })
    .limit(500);
  query = archiviati ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (stato && (CLIENT_STATUSES as readonly string[]).includes(stato)) query = query.eq("stato", stato);
  if (q) {
    const s = q.replace(/[%,()]/g, " ").trim();
    query = query.or(`nome_attivita.ilike.%${s}%,referente.ilike.%${s}%,slug.ilike.%${s}%,telefono.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const [{ data: clients }, { data: kpis }, { data: events }] = await Promise.all([
    query,
    supabase.from("client_kpis").select("*").single<Kpis>(),
    supabase
      .from("events_log")
      .select("id, action, from_status, to_status, actor, created_at, client_id, clients(nome_attivita)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const k = kpis ?? ({} as Kpis);
  const rows = (clients ?? []) as unknown as (Client & { sites: { pubblicato: boolean } | null })[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Attivi" value={k.attivi ?? 0} sub={k.in_prova ? `+ ${k.in_prova} in prova` : undefined} href="/?stato=attivo" tone="emerald" />
        <Kpi label="In ritardo" value={k.in_ritardo ?? 0} href="/?stato=in_ritardo" tone="amber" />
        <Kpi label="Sospesi" value={k.sospesi ?? 0} href="/?stato=sospeso" tone="red" />
        <Kpi label="MRR" value={euro(k.mrr_cents ?? 0)} sub="entrate mensili ricorrenti" tone="neutral" />
        <Kpi label="Nuovi questo mese" value={k.nuovi_mese ?? 0} sub={k.in_attesa ? `${k.in_attesa} in attesa di pagamento` : undefined} tone="sky" />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 md:flex-row md:items-center">
          <form className="relative flex-1" action="/">
            {stato && <input type="hidden" name="stato" value={stato} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cerca per nome, referente, telefono, slug…"
              className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-900"
            />
          </form>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip href={q ? `/?q=${encodeURIComponent(q)}` : "/"} active={!stato && !archiviati}>Tutti</FilterChip>
            {CLIENT_STATUSES.map((s) => (
              <FilterChip key={s} href={`/?stato=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`} active={stato === s}>
                {STATUS_LABEL[s]}
              </FilterChip>
            ))}
            <FilterChip href="/?archiviati=1" active={!!archiviati}>Archiviati</FilterChip>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Nessun cliente trovato.{" "}
            <Link href="/clienti/nuovo" className="font-medium text-neutral-900 underline">Crea il primo</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Attività</th>
                  <th className="px-4 py-2.5 font-medium">Stato</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Sito</th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Telefono</th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Rinnovo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/clienti/${c.id}`} className="font-medium text-neutral-900 hover:underline">
                        {c.nome_attivita}
                      </Link>
                      {c.referente && <div className="text-xs text-neutral-500">{c.referente}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.stato as ClientStatus} override={c.manual_override} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <a href={tenantUrl(c.slug, c.custom_domain)} target="_blank" className="text-neutral-600 hover:underline">
                        {c.custom_domain ?? `${c.slug}.…`}
                      </a>
                      {!c.sites?.pubblicato && <span className="ml-2 text-xs text-neutral-400">(bozza)</span>}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {c.telefono ? <a href={telHref(c.telefono)} className="text-neutral-700 hover:underline">{c.telefono}</a> : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-neutral-600 lg:table-cell">{date(c.current_period_end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!!events?.length && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Ultime attività</h2>
          <ul className="space-y-2 text-sm">
            {(events as unknown as (EventLog & { clients: { nome_attivita: string } | null })[]).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-2 text-neutral-700">
                <span className="w-36 shrink-0 text-xs text-neutral-400">{dateTime(e.created_at)}</span>
                {e.client_id ? (
                  <Link href={`/clienti/${e.client_id}`} className="font-medium hover:underline">{e.clients?.nome_attivita}</Link>
                ) : (
                  <span className="font-medium">Sistema</span>
                )}
                <span>{e.action.replaceAll("_", " ")}</span>
                {e.to_status && (
                  <span className="text-neutral-500">
                    {e.from_status ? `${STATUS_LABEL[e.from_status]} → ` : ""}{STATUS_LABEL[e.to_status]}
                  </span>
                )}
                <span className="text-xs text-neutral-400">({e.actor})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const TONES = {
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  sky: "text-sky-700",
  neutral: "text-neutral-900",
};

function Kpi({ label, value, sub, href, tone }: { label: string; value: React.ReactNode; sub?: string; href?: string; tone: keyof typeof TONES }) {
  const body = (
    <div className="h-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${TONES[tone]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
    >
      {children}
    </Link>
  );
}
