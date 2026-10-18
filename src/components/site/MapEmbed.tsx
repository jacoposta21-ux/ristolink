"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { onConsentChange, readConsent, writeConsent } from "./consent";

// Mappa Google caricata SOLO dopo il consenso (niente cookie di terze parti prima).

export function MapEmbed({ query, className = "" }: { query: string; className?: string }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const sync = () => setAllowed(readConsent() === "all");
    sync();
    return onConsentChange(sync);
  }, []);
  if (!query) return null;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=it`;
  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
      {allowed ? (
        <iframe title="Mappa" src={src} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-neutral-600">
          <div>
            <MapPin className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
            <p className="mb-3">La mappa è fornita da Google Maps e può impostare cookie di terze parti.</p>
            <button onClick={() => writeConsent("all")} className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white">
              Mostra la mappa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
