import type { SiteContent } from "@/lib/site/schema";
import { contactInfo } from "./helpers";
import type { PublicClient } from "./types";

// Informativa privacy e cookie generata dai dati del cliente.
// È un modello di base: va verificato con il proprio consulente.

export function PrivacyPolicy({ client, content, homeHref }: { client: PublicClient; content: SiteContent; homeHref: string }) {
  const ct = contactInfo(client, content);
  return (
    <main className="mx-auto max-w-3xl px-5 py-14 text-neutral-800">
      <a href={homeHref} className="text-sm underline">← Torna al sito</a>
      <h1 className="mt-6 text-3xl font-semibold">Privacy e cookie</h1>
      <p className="mt-2 text-sm text-neutral-500">Informativa ai sensi degli artt. 13-14 del Regolamento UE 2016/679 (GDPR)</p>

      <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold">
        <section>
          <h2>Titolare del trattamento</h2>
          <p>
            {client.nome_attivita}
            {ct.fullAddress && <>, {ct.fullAddress}</>}
            {client.partita_iva && <> — P. IVA {client.partita_iva}</>}
            {client.codice_fiscale && <> — C.F. {client.codice_fiscale}</>}
            {ct.email && <> — email: <a className="underline" href={`mailto:${ct.email}`}>{ct.email}</a></>}
            {ct.phone && <> — tel. {ct.phone}</>}.
          </p>
        </section>
        <section>
          <h2>Dati trattati</h2>
          <p>
            Questo sito è una vetrina informativa: non contiene moduli e non raccoglie dati personali, se non i dati tecnici di
            navigazione (es. indirizzo IP, tipo di browser, orario della richiesta) registrati automaticamente dai sistemi del
            fornitore di hosting per garantire sicurezza e funzionamento del servizio, conservati per il tempo strettamente necessario.
          </p>
          <p className="mt-2">
            Se ci contatti per telefono, email o WhatsApp, tratteremo i dati che ci fornisci solo per rispondere alla tua richiesta
            (base giuridica: misure precontrattuali o tua richiesta, art. 6.1.b GDPR). Per WhatsApp si applica anche
            l&apos;informativa di WhatsApp/Meta.
          </p>
        </section>
        <section>
          <h2>Cookie</h2>
          <p>
            Il sito utilizza solo strumenti tecnici necessari al suo funzionamento, inclusa la memorizzazione nel tuo browser della
            scelta espressa nel banner cookie. Non usiamo cookie di profilazione né strumenti di statistica di terze parti.
          </p>
          <p className="mt-2">
            La mappa è fornita da <b>Google Maps</b> (Google Ireland Ltd.) e viene caricata solo se accetti dal banner o premi
            &quot;Mostra la mappa&quot;: in quel caso Google può impostare cookie propri, secondo la sua{" "}
            <a className="underline" href="https://policies.google.com/privacy?hl=it" target="_blank" rel="noopener">informativa</a>.
            Puoi cambiare la tua scelta in qualsiasi momento con il link &quot;Preferenze cookie&quot; in fondo alla pagina.
          </p>
        </section>
        <section>
          <h2>Fornitori</h2>
          <p>
            Il sito è realizzato e gestito tramite la piattaforma RistoLink, che agisce come responsabile del trattamento, e ospitato su
            infrastruttura Vercel Inc. e Supabase (con garanzie adeguate per eventuali trasferimenti extra UE, art. 46 GDPR).
          </p>
        </section>
        <section>
          <h2>I tuoi diritti</h2>
          <p>
            Puoi chiedere in ogni momento accesso, rettifica, cancellazione, limitazione od opposizione al trattamento dei tuoi dati
            scrivendo ai contatti del titolare, e proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).
          </p>
        </section>
      </div>
    </main>
  );
}
