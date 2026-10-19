import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Globe, Pencil, PenSquare, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, Notice, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { DomainForm, PlanControls, PortalButton, RegenerateLinks, ShareLink, StatusControls } from "@/components/admin/ClientActions";
import { planPriceCents } from "@/lib/plans";
import { isLive, STATUS_LABEL } from "@/lib/billing/status";
import { date, dateTime, euro, telHref } from "@/lib/format";
import { ROOT_URL, tenantUrl } from "@/lib/env";
import { vercelConfigured } from "@/lib/vercel-domains";
import type { Client, EventLog, Payment, Site } from "@/lib/types";

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuovo?: string }>;
}) {
  const { id } = await params;
  const { nuovo } = await searchParams;
  const { supabase } = await requireAdmin();

  const [{ data: client }, { data: site }, { data: payments }, { data: events }, settings] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>(),
    supabase.from("sites").select("*").eq("client_id", id).maybeSingle<Site>(),
    supabase.from("payments").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("events_log").select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(50),
    getSettings(supabase),
  ]);
  if (!client) notFound();

  const payUrl = `${ROOT_URL}/paga/${client.payment_token}`;
  const portalUrl = `${ROOT_URL}/portale/${client.portal_token}`;
  const siteUrl = tenantUrl(client.slug, client.custom_domain);
  const online = isLive(client.stato) && !!site?.pubblicato;
  const graceEnd = client.past_due_since
    ? new Date(new Date(client.past_due_since).getTime() + settings.grace_days * 86_400_000).toISOString()
    : null;
  const stripeBase = `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "" : "test/"}`;

  return (
    <div className="space-y-6">
      {nuovo && (
        <Notice kind="ok">
          Cliente creato! Ora <Link href={`/clienti/${id}/sito`} className="font-semibold underline">personalizza il sito</Link>,
          pubblicalo e invia il link di pagamento qui sotto.
        </Notice>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{client.nome_attivita}</h1>
            <StatusBadge status={client.stato} override={client.manual_override} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
            <a href={siteUrl} target="_blank" className="flex items-center gap-1 hover:underline">
              <Globe className="h-4 w-4" /> {siteUrl.replace(/^https?:\/\//, "")}
            </a>
            {client.telefono && (
              <a href={telHref(client.telefono)} className="flex items-center gap-1 hover:underline">
                <Phone className="h-4 w-4" /> {client.telefono}
              </a>
            )}
            {client.referente && <span>{client.referente}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/clienti/${id}/sito`} className={btnPrimary}><PenSquare className="h-4 w-4" /> Modifica sito</Link>
          <Link href={`/clienti/${id}/anteprima`} target="_blank" className={btnSecondary}><Eye className="h-4 w-4" /> Anteprima</Link>
          <Link href={`/clienti/${id}/dati`} className={btnSecondary}><Pencil className="h-4 w-4" /> Dati</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Link di pagamento" actions={<RegenerateLinks clientId={id} />}>
            <p className="mb-3 text-sm text-neutral-600">
              Invialo al cliente: apre una pagina con il riepilogo ({euro(client.stripe_subscription_id ? client.monthly_amount_cents : planPriceCents(client.plan, settings))}/mese IVA inclusa
              {(client.trial_days ?? settings.default_trial_days) > 0 && !client.data_attivazione
                ? `, ${client.trial_days ?? settings.default_trial_days} giorni gratis`
                : ""}
              ) e il pagamento sicuro Stripe con carta o IBAN. Il link non scade.
            </p>
            <ShareLink url={payUrl} phone={client.telefono} email={client.email} name={client.nome_attivita} kind="pagamento" />
          </Card>

          <Card title="Portale cliente (metodo di pagamento, fatture, disdetta)">
            <div className="space-y-3">
              <ShareLink url={portalUrl} phone={client.telefono} email={client.email} name={client.nome_attivita} kind="portale" />
              <PortalButton clientId={id} disabled={!client.stripe_customer_id} />
            </div>
          </Card>

          <Card title="Pagamenti">
            {!payments?.length ? (
              <p className="text-sm text-neutral-500">Nessuna fattura ancora.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Data</th>
                      <th className="py-2 pr-4 font-medium">Periodo</th>
                      <th className="py-2 pr-4 font-medium">Importo</th>
                      <th className="py-2 pr-4 font-medium">Stato</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(payments as Payment[]).map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-4">{date(p.paid_at ?? p.created_at)}</td>
                        <td className="py-2 pr-4 text-neutral-600">{date(p.period_start)} – {date(p.period_end)}</td>
                        <td className="py-2 pr-4">{euro(p.status === "paid" ? p.amount_paid : p.amount_due)}</td>
                        <td className="py-2 pr-4"><InvoiceStatus p={p} /></td>
                        <td className="py-2 text-right">
                          {p.hosted_invoice_url && <a href={p.hosted_invoice_url} target="_blank" className="text-neutral-600 underline">fattura</a>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Storico eventi">
            {!events?.length ? (
              <p className="text-sm text-neutral-500">Nessun evento.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {(events as EventLog[]).map((e) => (
                  <li key={e.id} className="flex flex-wrap gap-x-2">
                    <span className="w-36 shrink-0 text-xs text-neutral-400">{dateTime(e.created_at)}</span>
                    <span className="font-medium">{e.action.replaceAll("_", " ")}</span>
                    {e.to_status && (
                      <span className="text-neutral-600">
                        {e.from_status ? `${STATUS_LABEL[e.from_status]} → ` : ""}{STATUS_LABEL[e.to_status]}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">{e.actor}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Stato del sito">
            <div className="space-y-4 text-sm">
              <div className={`rounded-lg px-3 py-2 font-medium ${online ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-700"}`}>
                {online ? "● Online" : "○ Offline"} —{" "}
                {!site?.pubblicato
                  ? "sito non ancora pubblicato (bozza)"
                  : online
                    ? "visibile al pubblico"
                    : "i visitatori vedono \"temporaneamente non disponibile\""}
              </div>
              {client.stato === "in_ritardo" && graceEnd && (
                <Notice kind="warn">
                  Pagamento fallito il {date(client.past_due_since)}. Se non paga, il sito verrà sospeso il <b>{date(graceEnd)}</b>.
                </Notice>
              )}
              {client.manual_override && (
                <Notice kind="info">
                  Stato forzato manualmente su <b>{client.manual_override}</b>: i pagamenti Stripe non lo cambiano finché non riattivi la modalità automatica.
                </Notice>
              )}
              <StatusControls clientId={id} override={client.manual_override} />
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-neutral-100 pt-3 text-neutral-600">
                <dt>Attivato il</dt><dd className="text-neutral-900">{date(client.data_attivazione)}</dd>
                <dt>Prova fino al</dt><dd className="text-neutral-900">{date(client.trial_end)}</dd>
                <dt>Prossimo rinnovo</dt><dd className="text-neutral-900">{date(client.current_period_end)}</dd>
                <dt>Disdetta a fine periodo</dt><dd className="text-neutral-900">{client.cancel_at_period_end ? "Sì" : "No"}</dd>
                {client.canceled_at && (<><dt>Cancellato il</dt><dd className="text-neutral-900">{date(client.canceled_at)}</dd></>)}
                <dt>Ultima sincronizzazione</dt><dd className="text-neutral-900">{dateTime(client.last_synced_at)}</dd>
              </dl>
              <div className="flex flex-col gap-1 text-xs">
                {client.stripe_customer_id && (
                  <a className="text-neutral-500 underline" target="_blank" href={`${stripeBase}customers/${client.stripe_customer_id}`}>
                    Cliente su Stripe ({client.stripe_customer_id})
                  </a>
                )}
                {client.stripe_subscription_id && (
                  <a className="text-neutral-500 underline" target="_blank" href={`${stripeBase}subscriptions/${client.stripe_subscription_id}`}>
                    Abbonamento su Stripe
                  </a>
                )}
              </div>
            </div>
          </Card>

          <Card title="Piano">
            <PlanControls
              clientId={id}
              plan={client.plan}
              prices={{ base: euro(settings.monthly_price_cents), dominio: euro(settings.dominio_price_cents) }}
              hasSubscription={!!client.stripe_subscription_id && ["trial", "attivo", "in_ritardo"].includes(client.stato)}
            />
          </Card>

          <Card title="QR code del sito">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/clienti/${id}/qr?formato=svg&anteprima=1`} alt="QR code del sito" className="h-28 w-28 rounded-lg border border-neutral-200 bg-white p-1" />
              <div className="space-y-2 text-sm">
                <p className="text-neutral-600">Inquadrandolo si apre <b className="break-all">{siteUrl.replace(/^https?:\/\//, "")}</b>. Da stampare su vetrine, menù e biglietti.</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`/clienti/${id}/qr?formato=png`} className={btnSecondary + " !px-3 !py-1.5"}>Scarica PNG</a>
                  <a href={`/clienti/${id}/qr?formato=svg`} className={btnSecondary + " !px-3 !py-1.5"}>SVG (per tipografia)</a>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Dominio personalizzato">
            <div className="space-y-3 text-sm">
              {client.plan !== "dominio" && (
                <Notice kind="warn">Il dominio personalizzato è incluso nel piano <b>Con dominio</b>: cambia piano qui sopra prima di collegarlo.</Notice>
              )}
              <p className="text-neutral-600">
                Opzionale. Il sito resta sempre raggiungibile anche su <b>{client.slug}</b>.{ROOT_URL.replace(/^https?:\/\//, "")}.
              </p>
              <DomainForm clientId={id} current={client.custom_domain} vercel={vercelConfigured()} />
              {client.custom_domain && (
                <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700">
                  <p className="mb-2 font-medium">Record DNS da impostare presso il provider del cliente:</p>
                  <table className="w-full font-mono">
                    <tbody>
                      <tr><td className="pr-2">A</td><td className="pr-2">@</td><td>76.76.21.21</td></tr>
                      <tr><td className="pr-2">CNAME</td><td className="pr-2">www</td><td>cname.vercel-dns.com</td></tr>
                    </tbody>
                  </table>
                  <p className="mt-2 text-neutral-500">Vercel emette il certificato SSL in automatico appena i DNS puntano correttamente.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Dati">
            <dl className="space-y-1.5 text-sm">
              <Row k="Email" v={client.email} />
              <Row k="P. IVA" v={client.partita_iva} />
              <Row k="Cod. fiscale" v={client.codice_fiscale} />
              <Row k="Indirizzo" v={client.indirizzo} />
              <Row k="Cliente dal" v={date(client.created_at)} />
            </dl>
            {client.note && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{client.note}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-neutral-500">{k}</dt>
      <dd className="break-all">{v || "—"}</dd>
    </div>
  );
}

function InvoiceStatus({ p }: { p: Payment }) {
  const map: Record<string, [string, string]> = {
    paid: ["Pagata", "text-emerald-700"],
    open: [p.attempt_count > 0 ? `Non riuscita (${p.attempt_count} tentativi)` : "Da pagare", "text-amber-700"],
    void: ["Annullata", "text-neutral-500"],
    uncollectible: ["Inesigibile", "text-red-700"],
    draft: ["Bozza", "text-neutral-500"],
  };
  const [label, cls] = map[p.status] ?? [p.status, ""];
  return <span className={cls}>{label}</span>;
}
