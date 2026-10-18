// Logica di stato del cliente: UNA sola funzione pura, usata sia dai webhook
// Stripe sia dal cron di riconciliazione. Testata in status.test.ts.

export const CLIENT_STATUSES = [
  "in_attesa",
  "trial",
  "attivo",
  "in_ritardo",
  "sospeso",
  "cancellato",
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type ManualOverride = "sospeso" | "attivo" | null;

/** Stati in cui il sito è visibile al pubblico (se pubblicato). */
export const LIVE_STATUSES: ReadonlySet<ClientStatus> = new Set(["trial", "attivo", "in_ritardo"]);

export function isLive(status: ClientStatus): boolean {
  return LIVE_STATUSES.has(status);
}

export type StatusInput = {
  /** stato dell'abbonamento Stripe, null se non esiste ancora */
  subscriptionStatus: string | null;
  /** quando è iniziato il ritardo di pagamento (già salvato sul cliente) */
  pastDueSince: Date | null;
  manualOverride: ManualOverride;
  /** il cliente ha mai avuto un abbonamento attivo/in prova? */
  everActivated: boolean;
  graceDays: number;
  now: Date;
};

export type StatusResult = {
  status: ClientStatus;
  /** valore aggiornato di past_due_since da salvare */
  pastDueSince: Date | null;
  /** quando scadrà la tolleranza (solo se in ritardo) */
  graceEndsAt: Date | null;
};

const DAY = 24 * 60 * 60 * 1000;

export function computeStatus(i: StatusInput): StatusResult {
  const base = computeFromStripe(i);
  if (i.manualOverride === "sospeso") return { ...base, status: "sospeso" };
  if (i.manualOverride === "attivo") return { ...base, status: "attivo" };
  return base;
}

function computeFromStripe(i: StatusInput): StatusResult {
  const none = { pastDueSince: null, graceEndsAt: null };
  switch (i.subscriptionStatus) {
    case "trialing":
      return { status: "trial", ...none };
    case "active":
      return { status: "attivo", ...none };
    case "canceled":
      return { status: "cancellato", ...none };
    case "paused":
      // es. prova terminata senza metodo di pagamento
      return { status: "sospeso", ...none };
    case "past_due":
    case "unpaid":
      return overdue(i);
    case "incomplete":
      // primo pagamento non ancora riuscito (es. 3D Secure non completato)
      return i.everActivated ? overdue(i) : { status: "in_attesa", ...none };
    case "incomplete_expired":
    case null:
    default:
      return { status: i.everActivated ? "cancellato" : "in_attesa", ...none };
  }
}

function overdue(i: StatusInput): StatusResult {
  const since = i.pastDueSince ?? i.now;
  const graceEndsAt = new Date(since.getTime() + i.graceDays * DAY);
  const status: ClientStatus = i.now.getTime() >= graceEndsAt.getTime() ? "sospeso" : "in_ritardo";
  return { status, pastDueSince: since, graceEndsAt };
}

/** Priorità per scegliere l'abbonamento "giusto" se un cliente ne ha più di uno. */
const SUB_PRIORITY: Record<string, number> = {
  active: 6,
  trialing: 5,
  past_due: 4,
  unpaid: 3,
  incomplete: 2,
  paused: 1,
};

export function pickRelevantSubscription<T extends { status: string; created: number }>(subs: T[]): T | null {
  if (!subs.length) return null;
  return [...subs].sort(
    (a, b) => (SUB_PRIORITY[b.status] ?? 0) - (SUB_PRIORITY[a.status] ?? 0) || b.created - a.created,
  )[0];
}

export const STATUS_LABEL: Record<ClientStatus, string> = {
  in_attesa: "In attesa",
  trial: "In prova",
  attivo: "Attivo",
  in_ritardo: "In ritardo",
  sospeso: "Sospeso",
  cancellato: "Cancellato",
};
