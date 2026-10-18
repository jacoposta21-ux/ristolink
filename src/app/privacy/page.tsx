import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy — MioSitoVeloce" };

export default function Privacy() {
  const company = process.env.NEXT_PUBLIC_COMPANY_INFO ?? "MioSitoVeloce";
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
  return (
    <main className="mx-auto max-w-3xl px-5 py-14 leading-relaxed text-neutral-800 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold">
      <Link href="/" className="text-sm underline">← MioSitoVeloce</Link>
      <h1 className="mt-6 text-3xl font-semibold">Informativa privacy</h1>
      <h2>Titolare</h2>
      <p>{company}{email && <> — <a className="underline" href={`mailto:${email}`}>{email}</a></>}</p>
      <h2>Dati trattati e finalità</h2>
      <p>
        Trattiamo i dati dei clienti (nome dell&apos;attività, referente, contatti, dati fiscali) per fornire il servizio di creazione e
        gestione del sito e per la fatturazione (art. 6.1.b e 6.1.c GDPR). I pagamenti sono gestiti da Stripe Payments Europe Ltd.:
        non conserviamo i dati della carta o dell&apos;IBAN.
      </p>
      <h2>Fornitori</h2>
      <p>Stripe (pagamenti), Vercel (hosting), Supabase (database), eventuale servizio email transazionale.</p>
      <h2>Conservazione</h2>
      <p>Per la durata del contratto e, dopo la disdetta, per i tempi previsti dagli obblighi fiscali; i contenuti del sito vengono archiviati 90 giorni dopo la cancellazione.</p>
      <h2>Cookie</h2>
      <p>Questo sito utilizza solo cookie tecnici necessari (es. sessione di accesso all&apos;area riservata).</p>
      <h2>Diritti</h2>
      <p>Puoi esercitare i diritti degli artt. 15-22 GDPR scrivendo ai contatti sopra e proporre reclamo al Garante Privacy.</p>
    </main>
  );
}
