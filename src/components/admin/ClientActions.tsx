"use client";

import { useState, useTransition } from "react";
import { useNoResetAction } from "./useNoResetAction";
import { ExternalLink, Mail, MessageCircle, MessageSquare, RefreshCw } from "lucide-react";
import {
  domainStatusAction,
  portalUrlAction,
  regenerateTokensAction,
  setCustomDomainAction,
  setOverrideAction,
  setPlanAction,
  syncNowAction,
} from "@/app/admin/actions";
import { CopyButton } from "./CopyButton";
import { btnDanger, btnPrimary, btnSecondary, inputCls, Notice } from "./ui";
import { waHref } from "@/lib/format";

export function ShareLink({ url, phone, email, name, kind }: {
  url: string;
  phone: string | null;
  email: string | null;
  name: string;
  kind: "pagamento" | "portale";
}) {
  const text =
    kind === "pagamento"
      ? `Ciao! Ecco il link per attivare il sito di ${name} (9,99 €/mese IVA inclusa, disdici quando vuoi): ${url}`
      : `Ciao! Da questo link puoi aggiornare il metodo di pagamento o scaricare le fatture del sito di ${name}: ${url}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
        <code className="flex-1 truncate text-sm">{url}</code>
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={url} label="Copia link" />
        <CopyButton value={text} label="Copia messaggio" />
        {phone && (
          <a href={waHref(phone, text)} target="_blank" className={btnSecondary + " !py-1.5"}>
            <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp
          </a>
        )}
        {phone && (
          <a href={`sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(text)}`} className={btnSecondary + " !py-1.5"}>
            <MessageSquare className="h-4 w-4" /> SMS
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Il sito di ${name}`)}&body=${encodeURIComponent(text)}`}
            className={btnSecondary + " !py-1.5"}
          >
            <Mail className="h-4 w-4" /> Email
          </a>
        )}
      </div>
    </div>
  );
}

export function PortalButton({ clientId, disabled }: { clientId: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        className={btnSecondary}
        onClick={() =>
          start(async () => {
            // apri la finestra subito (evita il blocco popup), poi naviga
            const w = window.open("about:blank", "_blank");
            const r = await portalUrlAction(clientId);
            if (r.url && w) w.location.href = r.url;
            else {
              w?.close();
              setError(r.error ?? "Errore");
            }
          })
        }
      >
        <ExternalLink className="h-4 w-4" /> {pending ? "Apertura…" : "Apri portale cliente"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function StatusControls({ clientId, override }: { clientId: string; override: "sospeso" | "attivo" | null }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    start(async () => {
      await fn();
    });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {override !== "sospeso" && (
        <button
          disabled={pending}
          className={btnDanger}
          onClick={() => run(() => setOverrideAction(clientId, "sospeso"), "Sospendere il sito? I visitatori vedranno la pagina \"temporaneamente non disponibile\". L'abbonamento Stripe NON viene modificato.")}
        >
          Sospendi manualmente
        </button>
      )}
      {override !== "attivo" && (
        <button
          disabled={pending}
          className={btnSecondary}
          onClick={() => run(() => setOverrideAction(clientId, "attivo"), "Forzare il sito online indipendentemente dai pagamenti (es. pagamento in contanti/bonifico)?")}
        >
          Forza online
        </button>
      )}
      {override && (
        <button disabled={pending} className={btnPrimary} onClick={() => run(() => setOverrideAction(clientId, null))}>
          Riattiva modalità automatica (Stripe)
        </button>
      )}
      <button disabled={pending} className={btnSecondary} onClick={() => run(() => syncNowAction(clientId))}>
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} /> Sincronizza con Stripe
      </button>
    </div>
  );
}

export function RegenerateLinks({ clientId }: { clientId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      className="text-xs text-neutral-500 underline hover:text-neutral-800"
      onClick={() => {
        if (window.confirm("Rigenerare i link? Quelli inviati finora smetteranno di funzionare.")) start(() => regenerateTokensAction(clientId));
      }}
    >
      Rigenera link
    </button>
  );
}

export function DomainForm({ clientId, current, vercel }: { clientId: string; current: string | null; vercel: boolean }) {
  const [state, onSubmit, pending] = useNoResetAction(setCustomDomainAction.bind(null, clientId));
  const [status, setStatus] = useState<string | null>(null);
  const [checking, start] = useTransition();
  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        <input name="custom_domain" defaultValue={current ?? ""} placeholder="damario.it" className={inputCls + " max-w-xs"} />
        <button disabled={pending} className={btnSecondary}>{pending ? "Salvataggio…" : current ? "Aggiorna" : "Collega dominio"}</button>
        {current && vercel && (
          <button
            type="button"
            disabled={checking}
            className={btnSecondary}
            onClick={() =>
              start(async () => {
                const r = await domainStatusAction(clientId);
                setStatus("error" in r ? r.error : `${r.configured ? "✅" : "⏳"} ${r.message}`);
              })
            }
          >
            {checking ? "Verifica…" : "Verifica DNS"}
          </button>
        )}
      </form>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="ok">{state.message}</Notice>}
      {status && <Notice>{status}</Notice>}
    </div>
  );
}

export function PlanControls({ clientId, plan, prices, hasSubscription }: {
  clientId: string;
  plan: "base" | "dominio";
  prices: { base: string; dominio: string };
  hasSubscription: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const choose = (next: "base" | "dominio") => {
    if (next === plan) return;
    const warn = hasSubscription
      ? `Cambiare piano? L'abbonamento Stripe passa subito a ${next === "dominio" ? prices.dominio : prices.base}/mese, con conguaglio sul prossimo rinnovo.`
      : "Cambiare piano? Il nuovo prezzo vale dal primo pagamento.";
    if (!window.confirm(warn)) return;
    start(async () => {
      const r = await setPlanAction(clientId, next);
      setMsg(r?.error ? { ok: false, text: r.error } : { ok: true, text: r?.message ?? "Fatto" });
    });
  };
  const opt = (value: "base" | "dominio", title: string, price: string, desc: string) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => choose(value)}
      className={`w-full rounded-xl border p-3 text-left text-sm transition ${plan === value ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10" : "border-neutral-200 hover:border-neutral-400"}`}
    >
      <span className="flex justify-between font-semibold"><span>{title}</span><span>{price}/mese</span></span>
      <span className="block text-xs text-neutral-500">{desc}</span>
    </button>
  );
  return (
    <div className="space-y-2">
      {opt("base", "Base", prices.base, "Sito su nome.easysito.com")}
      {opt("dominio", "Con dominio", prices.dominio, "Sito anche sul dominio del cliente (es. nome.it)")}
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
