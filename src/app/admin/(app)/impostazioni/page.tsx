import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Card, Notice } from "@/components/admin/ui";
import { SettingsForm } from "./SettingsForm";
import { dateTime } from "@/lib/format";
import { ROOT_DOMAIN } from "@/lib/env";
import { vercelConfigured } from "@/lib/vercel-domains";

export const metadata = { title: "Impostazioni" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const settings = await getSettings(supabase);
  const { data: hooks } = await supabase
    .from("stripe_events")
    .select("id, type, received_at, processed_at, attempts, error")
    .order("received_at", { ascending: false })
    .limit(25);

  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const checks: [string, boolean, string][] = [
    ["Stripe", !!key, key.startsWith("sk_live") ? "LIVE (pagamenti reali)" : key ? "modalità TEST" : "STRIPE_SECRET_KEY mancante"],
    ["Webhook Stripe", !!process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET ? "firma configurata" : "STRIPE_WEBHOOK_SECRET mancante"],
    ["Prezzo", !!process.env.STRIPE_PRICE_ID, process.env.STRIPE_PRICE_ID ?? "STRIPE_PRICE_ID mancante"],
    ["Cron", !!process.env.CRON_SECRET, process.env.CRON_SECRET ? "CRON_SECRET impostato" : "CRON_SECRET mancante"],
    ["Email promemoria", !!process.env.RESEND_API_KEY, process.env.RESEND_API_KEY ? "Resend attivo" : "solo email automatiche di Stripe"],
    ["Domini su Vercel", vercelConfigured(), vercelConfigured() ? "automatico via API" : "manuale (VERCEL_API_TOKEN assente)"],
    ["Dominio base", true, ROOT_DOMAIN],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Impostazioni</h1>
      <Card title="Abbonamenti e sospensione">
        <SettingsForm settings={settings} />
      </Card>

      <Card title="Configurazione">
        <ul className="divide-y divide-neutral-100 text-sm">
          {checks.map(([name, ok, detail]) => (
            <li key={name} className="flex items-center justify-between py-2">
              <span>{ok ? "✅" : "⚠️"} {name}</span>
              <span className="text-neutral-600">{detail}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Ultimi webhook Stripe">
        {!hooks?.length ? (
          <Notice>Nessun webhook ricevuto. Vedi il README per collegare Stripe CLI in locale.</Notice>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left uppercase text-neutral-500">
                <tr><th className="py-1.5 pr-3">Ricevuto</th><th className="pr-3">Tipo</th><th className="pr-3">Esito</th><th>Tentativi</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {hooks.map((h) => (
                  <tr key={h.id} title={h.id}>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{dateTime(h.received_at)}</td>
                    <td className="pr-3 font-mono">{h.type}</td>
                    <td className="pr-3">{h.error ? <span className="text-red-600">{h.error}</span> : h.processed_at ? "ok" : "in corso"}</td>
                    <td>{h.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
