"use client";

import { useNoResetAction } from "@/components/admin/useNoResetAction";
import { updateSettingsAction } from "@/app/admin/actions";
import { Field, inputCls, btnPrimary, Notice } from "@/components/admin/ui";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, onSubmit, pending] = useNoResetAction(updateSettingsAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Giorni di tolleranza dopo un pagamento fallito" hint="Poi il sito viene sospeso in automatico (default 7)">
          <input name="grace_days" type="number" min={0} max={60} defaultValue={settings.grace_days} className={inputCls} />
        </Field>
        <Field label="Giorni di prova gratuita predefiniti" hint="0 = nessuna prova. Si può cambiare per singolo cliente.">
          <input name="default_trial_days" type="number" min={0} max={365} defaultValue={settings.default_trial_days} className={inputCls} />
        </Field>
        <Field label="Canone mensile mostrato (€ IVA incl.)" hint="Solo informativo: l'importo addebitato è quello del prezzo Stripe (STRIPE_PRICE_ID)">
          <input name="monthly_price" inputMode="decimal" defaultValue={(settings.monthly_price_cents / 100).toFixed(2).replace(".", ",")} className={inputCls} />
        </Field>
        <Field label="Archivia i cancellati dopo (giorni)" hint="I dati restano nel database, il cliente sparisce dall'elenco principale">
          <input name="archive_after_days" type="number" min={1} defaultValue={settings.archive_after_days} className={inputCls} />
        </Field>
      </div>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="ok">{state.message}</Notice>}
      <button disabled={pending} className={btnPrimary}>{pending ? "Salvataggio…" : "Salva impostazioni"}</button>
    </form>
  );
}
