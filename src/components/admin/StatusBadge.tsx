import { STATUS_LABEL, type ClientStatus } from "@/lib/billing/status";

const STYLES: Record<ClientStatus, string> = {
  in_attesa: "bg-neutral-100 text-neutral-700 ring-neutral-300",
  trial: "bg-sky-50 text-sky-700 ring-sky-200",
  attivo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  in_ritardo: "bg-amber-50 text-amber-800 ring-amber-300",
  sospeso: "bg-red-50 text-red-700 ring-red-200",
  cancellato: "bg-neutral-800 text-white ring-neutral-800",
};

const DOT: Record<ClientStatus, string> = {
  in_attesa: "bg-neutral-400",
  trial: "bg-sky-500",
  attivo: "bg-emerald-500",
  in_ritardo: "bg-amber-500",
  sospeso: "bg-red-500",
  cancellato: "bg-neutral-400",
};

export function StatusBadge({ status, override }: { status: ClientStatus; override?: string | null }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {STATUS_LABEL[status]}
      {override ? <span title="Stato forzato manualmente">· manuale</span> : null}
    </span>
  );
}
