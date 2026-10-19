import "server-only";
import { env, ROOT_URL } from "./env";
import type { Client } from "./types";
import type { ClientStatus } from "./billing/status";
import { STATUS_LABEL } from "./billing/status";

// Email transazionali opzionali via Resend (https://resend.com).
// Se RESEND_API_KEY non è impostata, non si invia nulla: restano le email
// automatiche di Stripe (configurate dalla dashboard Stripe, vedi README).

async function send(to: string, subject: string, html: string) {
  const key = env.resendApiKey();
  if (!key) return { skipped: true as const };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom(), to, subject, html }),
  });
  if (!res.ok) console.error("[email] invio fallito", res.status, await res.text());
  return { skipped: false as const, ok: res.ok };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const layout = (body: string) => `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:auto;padding:24px">${body}<p style="color:#666;font-size:13px;margin-top:32px">EasySito — il sito della tua attività</p></body></html>`;

const button = (href: string, label: string) =>
  `<p><a href="${esc(href)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${esc(label)}</a></p>`;

export async function sendPaymentFailedReminder(client: Client, opts: { graceEndsAt: Date | null; invoiceUrl?: string | null }) {
  if (!client.email) return;
  const portal = `${ROOT_URL}/portale/${client.portal_token}`;
  const until = opts.graceEndsAt?.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  await send(
    client.email,
    `Pagamento non riuscito — ${client.nome_attivita}`,
    layout(`
      <p>Ciao${client.referente ? " " + esc(client.referente) : ""},</p>
      <p>non siamo riusciti ad addebitare il rinnovo mensile del sito di <b>${esc(client.nome_attivita)}</b>.
      Succede spesso: carta scaduta, limite raggiunto o IBAN cambiato.</p>
      <p>Il sito resta online${until ? ` fino al <b>${until}</b>` : ""}. Per evitare interruzioni basta aggiornare il metodo di pagamento:</p>
      ${opts.invoiceUrl ? button(opts.invoiceUrl, "Paga la fattura") : ""}
      ${button(portal, "Aggiorna metodo di pagamento")}
      <p>Se hai già provveduto, ignora questo messaggio. Grazie!</p>`),
  );
}

export async function sendSuspendedNotice(client: Client) {
  if (!client.email) return;
  const portal = `${ROOT_URL}/portale/${client.portal_token}`;
  await send(
    client.email,
    `Il sito di ${client.nome_attivita} è temporaneamente offline`,
    layout(`
      <p>Ciao${client.referente ? " " + esc(client.referente) : ""},</p>
      <p>il sito di <b>${esc(client.nome_attivita)}</b> è stato messo temporaneamente offline perché il rinnovo non è andato a buon fine.
      Ai visitatori mostriamo solo un messaggio neutro "temporaneamente non disponibile".</p>
      <p>Appena il pagamento va a buon fine il sito torna online da solo, in pochi minuti:</p>
      ${button(portal, "Aggiorna metodo di pagamento")}`),
  );
}

export async function notifyAdmin(client: Client, from: ClientStatus | null, to: ClientStatus, actor: string) {
  const admin = env.adminNotifyEmail();
  if (!admin) return;
  await send(
    admin,
    `[EasySito] ${client.nome_attivita}: ${from ? STATUS_LABEL[from] : "—"} → ${STATUS_LABEL[to]}`,
    layout(`<p><b>${esc(client.nome_attivita)}</b> (${esc(client.slug)}) è passato a <b>${STATUS_LABEL[to]}</b>.</p>
      <p>Origine: ${esc(actor)}${client.telefono ? ` · Tel: ${esc(client.telefono)}` : ""}</p>`),
  );
}
