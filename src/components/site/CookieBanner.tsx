"use client";

import { useEffect, useState } from "react";
import { onConsentChange, readConsent, writeConsent } from "./consent";

// Banner conforme alle linee guida del Garante: "Rifiuta" e "Accetta" con
// pari evidenza, nessun cookie non tecnico prima del consenso. Il sito usa
// solo contenuti di terze parti opzionali (Google Maps).

export function CookieBanner({ privacyHref }: { privacyHref: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const sync = () => setShow(readConsent() === null);
    sync();
    return onConsentChange(sync);
  }, []);
  if (!show) return null;
  return (
    <div role="dialog" aria-label="Preferenze cookie" className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-xl md:flex-row md:items-center">
        <p className="flex-1">
          Usiamo solo cookie tecnici. Con il tuo consenso carichiamo anche la mappa di Google Maps, che può impostare cookie di terze parti.{" "}
          <a href={privacyHref} className="underline">Privacy e cookie</a>
        </p>
        <div className="flex gap-2">
          <button onClick={() => writeConsent("necessary")} className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium hover:bg-neutral-50">
            Rifiuta
          </button>
          <button onClick={() => writeConsent("all")} className="flex-1 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700">
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookiePrefsLink({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => writeConsent(null)} className={`underline ${className}`}>
      Preferenze cookie
    </button>
  );
}
