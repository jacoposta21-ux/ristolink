"use client";

import { useState } from "react";
import { Check, Copy, Mail, X } from "lucide-react";

// Pulsante di contatto: il solo "mailto:" non funziona se il dispositivo non ha
// un'app email impostata (frequente su PC e nei browser interni alle app),
// quindi offriamo anche Gmail web e la copia dell'indirizzo.

const SUBJECT = "Voglio il mio sito EasySito";
const BODY = "Ciao! Vorrei informazioni sul sito per la mia attività.\n\nNome attività:\nTelefono:\n";

export function ContactButton({ email, className, children }: { email: string; className: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mailto = `mailto:${email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 sm:place-items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-label="Contattaci" className="w-full max-w-sm rounded-2xl bg-white p-6 text-left text-neutral-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-lg font-bold">Scrivici</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Chiudi" className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-5 text-sm text-neutral-600">Ti rispondiamo in giornata. Indicaci il nome dell&apos;attività e un numero di telefono.</p>
            <div className="space-y-2">
              <a href={mailto} className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white hover:bg-neutral-700">
                <Mail className="h-5 w-5" /> Apri l&apos;app email
              </a>
              <a href={gmail} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 py-3 font-semibold hover:bg-neutral-50">
                Scrivi con Gmail
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(email);
                  } catch {
                    window.prompt("Copia l'indirizzo:", email);
                  }
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 py-3 font-semibold hover:bg-neutral-50"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                {copied ? "Copiato!" : email}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
