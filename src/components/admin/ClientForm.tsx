"use client";

import { useEffect, useState } from "react";
import { useNoResetAction } from "./useNoResetAction";
import { checkSlug, suggestSlug, type ActionState } from "@/app/admin/actions";
import { Field, inputCls, btnPrimary, Notice } from "./ui";
import { TEMPLATE_LABEL, TEMPLATES } from "@/lib/site/schema";
import type { Client } from "@/lib/types";

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  client?: Client;
  rootDomain: string;
  defaultTrialDays: number;
};

export function ClientForm({ action, client, rootDomain, defaultTrialDays }: Props) {
  const [state, onSubmit, pending] = useNoResetAction(action);
  const [name, setName] = useState(client?.nome_attivita ?? "");
  const [slug, setSlug] = useState(client?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!client);
  const [checked, setChecked] = useState<{ slug: string; ok: boolean; reason?: string } | null>(null);
  const slugState = slug && checked?.slug === slug ? checked : null;
  // Slug automatico dal nome finché non viene modificato a mano
  useEffect(() => {
    if (slugTouched || !name.trim()) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const s = await suggestSlug(name);
      if (!cancelled) setSlug(s);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug) return;
    const t = setTimeout(async () => setChecked({ slug, ...(await checkSlug(slug, client?.id)) }), 300);
    return () => clearTimeout(t);
  }, [slug, client?.id]);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome attività *">
          <input name="nome_attivita" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Trattoria Da Mario" />
        </Field>
        <Field
          label="Indirizzo web (sottodominio) *"
          hint={
            slugState && !slugState.ok ? (
              <span className="text-red-600">{slugState.reason}</span>
            ) : slug ? (
              <span className="text-emerald-700">✓ {slug}.{rootDomain}</span>
            ) : (
              "Generato dal nome, modificabile"
            )
          }
        >
          <div className="flex items-center rounded-lg border border-neutral-300 bg-white shadow-sm focus-within:border-neutral-900">
            <input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              className="w-full rounded-l-lg px-3 py-2 text-sm outline-none"
              placeholder="damario"
            />
            <span className="whitespace-nowrap pr-3 text-sm text-neutral-400">.{rootDomain}</span>
          </div>
        </Field>
        <Field label="Referente">
          <input name="referente" defaultValue={client?.referente ?? ""} className={inputCls} placeholder="Mario Rossi" />
        </Field>
        <Field label="Telefono" hint="Usato anche per il pulsante WhatsApp del sito">
          <input name="telefono" type="tel" defaultValue={client?.telefono ?? ""} className={inputCls} placeholder="333 1234567" />
        </Field>
        <Field label="Email" hint="Per ricevute Stripe e promemoria di pagamento">
          <input name="email" type="email" defaultValue={client?.email ?? ""} className={inputCls} placeholder="info@damario.it" />
        </Field>
        <Field label="Indirizzo">
          <input name="indirizzo" defaultValue={client?.indirizzo ?? ""} className={inputCls} placeholder="Via Roma 1, 00100 Roma (RM)" />
        </Field>
        <Field label="Partita IVA">
          <input name="partita_iva" defaultValue={client?.partita_iva ?? ""} className={inputCls} placeholder="IT01234567890" />
        </Field>
        <Field label="Codice fiscale">
          <input name="codice_fiscale" defaultValue={client?.codice_fiscale ?? ""} className={inputCls} />
        </Field>
        {!client && (
          <Field label="Template del sito">
            <select name="template" className={inputCls} defaultValue="ristorante">
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>{TEMPLATE_LABEL[t]}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Giorni di prova gratuita" hint={`Vuoto = predefinito (${defaultTrialDays} gg). Vale solo per il primo abbonamento.`}>
          <input name="trial_days" type="number" min={0} max={365} defaultValue={client?.trial_days ?? ""} className={inputCls} placeholder={String(defaultTrialDays)} />
        </Field>
      </div>
      <Field label="Note interne">
        <textarea name="note" rows={3} defaultValue={client?.note ?? ""} className={inputCls} />
      </Field>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="ok">{state.message}</Notice>}
      <button disabled={pending || (slugState !== null && !slugState.ok)} className={btnPrimary}>
        {pending ? "Salvataggio…" : client ? "Salva modifiche" : "Crea cliente e sito"}
      </button>
    </form>
  );
}
