import type { Metadata } from "next";
import { Check, Clock, MessageCircle, Phone, Search, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { waHref } from "@/lib/format";
import { ROOT_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "EasySito — Il sito per la tua attività a 9,99 €/mese",
  description:
    "Siti web belli e veloci per ristoranti, parrucchieri, artigiani e negozi. Nessun costo iniziale: 9,99 € al mese IVA inclusa, disdici quando vuoi.",
  metadataBase: new URL(ROOT_URL),
  openGraph: { type: "website", locale: "it_IT", siteName: "EasySito" },
};

const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

const FEATURES = [
  { icon: Smartphone, title: "Perfetto sul telefono", text: "I tuoi clienti ti cercano dallo smartphone: il sito è pensato prima di tutto per loro." },
  { icon: Phone, title: "Chiama e WhatsApp", text: "Un tocco per chiamarti, scriverti su WhatsApp o avere le indicazioni stradali." },
  { icon: Search, title: "Trovato su Google", text: "Ottimizzato per la ricerca locale, con orari e indirizzo leggibili da Google." },
  { icon: Clock, title: "Orari sempre aggiornati", text: "Cambi orario, menù o listino? Ci scrivi e lo aggiorniamo noi." },
  { icon: ShieldCheck, title: "Privacy e cookie in regola", text: "Informativa privacy e banner cookie inclusi, senza pensieri." },
  { icon: Sparkles, title: "Pronto in 48 ore", text: "Ci mandi due foto e qualche informazione: al resto pensiamo noi." },
];

const FAQ = [
  ["Ci sono costi iniziali?", "No. Paghi solo 9,99 € al mese IVA inclusa, con carta o addebito sul conto (SEPA)."],
  ["Posso disdire quando voglio?", "Sì, senza penali. Disdici in autonomia dal tuo link di gestione pagamenti."],
  ["Posso usare un mio dominio (es. miaattivita.it)?", "Sì. Di base il sito è su nomeattivita.easysito.com, ma possiamo collegare il tuo dominio."],
  ["Chi aggiorna i contenuti?", "Noi: ci invii le modifiche via WhatsApp o email e le pubblichiamo."],
];

export default function Landing() {
  const contactHref = PHONE ? waHref(PHONE, "Ciao! Vorrei informazioni sul sito EasySito per la mia attività.") : EMAIL ? `mailto:${EMAIL}` : "#contatti";
  return (
    <div className="bg-white text-neutral-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-900 text-white">E</span> EasySito
        </div>
        <a href={contactHref} className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Contattaci</a>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 text-center md:pt-20">
        <p className="mx-auto mb-5 w-fit rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">Nessun costo iniziale</p>
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
          Il sito della tua attività, a <span className="text-emerald-600">9,99 €</span> al mese.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 md:text-xl">
          Per ristoranti, parrucchieri, centri estetici, artigiani e negozi. Bello, veloce, trovabile su Google. Lo creiamo e lo aggiorniamo noi.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href={contactHref} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-7 py-4 font-semibold text-white hover:bg-neutral-700">
            <MessageCircle className="h-5 w-5" /> Voglio il mio sito
          </a>
          <a href="#come-funziona" className="rounded-full border border-neutral-300 px-7 py-4 font-semibold hover:bg-neutral-50">Come funziona</a>
        </div>
        <p className="mt-4 text-sm text-neutral-500">IVA inclusa · disdici quando vuoi</p>
      </section>

      <section className="bg-neutral-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <Icon className="h-7 w-7 text-emerald-600" />
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1 text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="come-funziona" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center text-4xl font-extrabold tracking-tight">Come funziona</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            ["1", "Ci senti", "Una telefonata o un messaggio: ci racconti la tua attività e ci mandi qualche foto."],
            ["2", "Lo creiamo", "Prepariamo il sito con orari, servizi, contatti e mappa. Lo vedi prima di attivarlo."],
            ["3", "Sei online", "Attivi l'abbonamento con un link sicuro e il sito è subito visibile a tutti."],
          ].map(([n, t, d]) => (
            <div key={n} className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neutral-900 text-xl font-bold text-white">{n}</div>
              <h3 className="mt-4 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-neutral-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-900 py-20 text-white">
        <div className="mx-auto max-w-md px-5 text-center">
          <h2 className="text-3xl font-extrabold">Un solo prezzo, tutto incluso</h2>
          <div className="mt-8 rounded-3xl bg-white p-8 text-left text-neutral-900">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold">9,99 €</span><span className="text-neutral-500">/mese</span>
            </div>
            <p className="text-sm text-neutral-500">IVA inclusa · nessun vincolo</p>
            <ul className="mt-6 space-y-2.5">
              {["Sito professionale su misura", "Sottodominio incluso (tuonome.easysito.com)", "Aggiornamenti dei contenuti", "Hosting veloce e certificato SSL", "Privacy e cookie banner"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-emerald-600" /> {t}</li>
              ))}
            </ul>
            <a href={contactHref} className="mt-8 block rounded-xl bg-neutral-900 py-3.5 text-center font-semibold text-white hover:bg-neutral-700">Inizia ora</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="mb-8 text-center text-4xl font-extrabold tracking-tight">Domande frequenti</h2>
        <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold">{q}</summary>
              <p className="mt-2 text-neutral-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer id="contatti" className="border-t border-neutral-200 px-5 py-10 text-sm text-neutral-500">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 md:flex-row">
          <p>© {new Date().getFullYear()} EasySito{process.env.NEXT_PUBLIC_COMPANY_INFO ? ` — ${process.env.NEXT_PUBLIC_COMPANY_INFO}` : ""}</p>
          <div className="flex gap-4">
            {PHONE && <a href={`tel:${PHONE}`} className="hover:underline">{PHONE}</a>}
            {EMAIL && <a href={`mailto:${EMAIL}`} className="hover:underline">{EMAIL}</a>}
            <a href="/privacy" className="hover:underline">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
