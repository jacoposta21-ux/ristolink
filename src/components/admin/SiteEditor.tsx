"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { saveSiteAction } from "@/app/admin/actions";
import { DAYS, TEMPLATE_LABEL, TEMPLATES, type SiteContent, type TemplateId } from "@/lib/site/schema";
import { Field, inputCls, btnPrimary, btnSecondary } from "./ui";
import { ImageInput, uploadImage } from "./ImageInput";

const PALETTES: [string, string, string][] = [
  ["Rosso trattoria", "#9a3412", "#ca8a04"],
  ["Bordeaux", "#7f1d1d", "#d97706"],
  ["Verde oliva", "#3f6212", "#ca8a04"],
  ["Blu mare", "#1e40af", "#f59e0b"],
  ["Rosa cipria", "#9d174d", "#d4a373"],
  ["Lavanda", "#6d28d9", "#f0abfc"],
  ["Ardesia", "#334155", "#eab308"],
  ["Nero e oro", "#18181b", "#d4af37"],
  ["Petrolio", "#115e59", "#fb923c"],
];

type Props = {
  clientId: string;
  initial: { template: TemplateId; content: SiteContent; pubblicato: boolean };
  previewHref: string;
  siteUrl: string;
};

export function SiteEditor({ clientId, initial, previewHref, siteUrl }: Props) {
  const [template, setTemplate] = useState<TemplateId>(initial.template);
  const [c, setC] = useState<SiteContent>(initial.content);
  const [published, setPublished] = useState(initial.pubblicato);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, start] = useTransition();

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  /** aggiorna una sezione del contenuto */
  function set<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setC((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMsg(null);
  }
  function patch<K extends keyof SiteContent>(key: K, partial: Partial<SiteContent[K]>) {
    setC((prev) => ({ ...prev, [key]: { ...(prev[key] as object), ...partial } }));
    setDirty(true);
    setMsg(null);
  }

  function save(opts: { publish?: boolean; thenPreview?: boolean } = {}) {
    const pub = opts.publish ?? published;
    const w = opts.thenPreview ? window.open("about:blank", "_blank") : null;
    start(async () => {
      const r = await saveSiteAction(clientId, { template, content: c, pubblicato: pub });
      if (r?.error) {
        w?.close();
        setMsg({ ok: false, text: r.error });
        return;
      }
      setPublished(pub);
      setDirty(false);
      setMsg({ ok: true, text: pub ? "Salvato e pubblicato" : "Salvato (bozza)" });
      if (w) w.location.href = previewHref;
    });
  }

  const items = c.services.items;
  const setItems = (next: typeof items) => patch("services", { items: next });

  return (
    <div className="space-y-6 pb-24">
      <div className="sticky top-[57px] z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-neutral-50/95 px-4 py-3 backdrop-blur">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              setPublished(e.target.checked);
              setDirty(true);
            }}
            className="h-4 w-4 accent-emerald-600"
          />
          Pubblicato
        </label>
        <span className="text-xs text-neutral-500">
          {published ? <>Visibile su <a href={siteUrl} target="_blank" className="underline">{siteUrl.replace(/^https?:\/\//, "")}</a> se l&apos;abbonamento è attivo</> : "Bozza: visibile solo in anteprima"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {msg && <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</span>}
          {dirty && !msg && <span className="text-sm text-amber-700">Modifiche non salvate</span>}
          <button type="button" onClick={() => save({ thenPreview: true })} disabled={saving} className={btnSecondary}>
            <Eye className="h-4 w-4" /> Salva e anteprima
          </button>
          <button type="button" onClick={() => save()} disabled={saving} className={btnPrimary}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salva
          </button>
        </div>
      </div>

      <Section title="1. Template e colori">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTemplate(t); setDirty(true); }}
              className={`rounded-xl border p-3 text-left text-sm transition ${template === t ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200 hover:border-neutral-400"}`}
            >
              <span className="font-semibold capitalize">{t}</span>
              <span className="block text-xs text-neutral-500">{TEMPLATE_LABEL[t]}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <ColorField label="Colore principale" value={c.theme.primary} onChange={(v) => patch("theme", { primary: v })} />
          <ColorField label="Colore accento" value={c.theme.accent} onChange={(v) => patch("theme", { accent: v })} />
          <div className="flex flex-wrap gap-2">
            {PALETTES.map(([name, p, a]) => (
              <button key={name} type="button" title={name} onClick={() => patch("theme", { primary: p, accent: a })} className="flex overflow-hidden rounded-full ring-1 ring-black/10 hover:scale-110">
                <span className="h-7 w-5" style={{ background: p }} />
                <span className="h-7 w-3" style={{ background: a }} />
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="2. Copertina">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Titolo"><input className={inputCls} value={c.hero.title} onChange={(e) => patch("hero", { title: e.target.value })} /></Field>
            <Field label="Sottotitolo"><textarea rows={3} className={inputCls} value={c.hero.subtitle} onChange={(e) => patch("hero", { subtitle: e.target.value })} /></Field>
            <Field label="Testo del pulsante" hint="Il pulsante porta a: link prenotazione › WhatsApp › telefono">
              <input className={inputCls} value={c.hero.ctaLabel} onChange={(e) => patch("hero", { ctaLabel: e.target.value })} placeholder="Prenota un tavolo" />
            </Field>
          </div>
          <ImageInput clientId={clientId} label="Foto di copertina" value={c.hero.image} onChange={(v) => patch("hero", { image: v })} />
        </div>
      </Section>

      <Section title="3. Chi siamo">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Titolo"><input className={inputCls} value={c.about.title} onChange={(e) => patch("about", { title: e.target.value })} /></Field>
            <Field label="Testo"><textarea rows={7} className={inputCls} value={c.about.text} onChange={(e) => patch("about", { text: e.target.value })} /></Field>
          </div>
          <ImageInput clientId={clientId} label="Foto" aspect="aspect-[4/3]" value={c.about.image} onChange={(v) => patch("about", { image: v })} />
        </div>
      </Section>

      <Section title="4. Punti di forza" hint="Fino a 6, consigliati 3">
        <div className="space-y-3">
          {c.highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls + " md:w-64"} placeholder="Titolo" value={h.title} onChange={(e) => set("highlights", c.highlights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Descrizione" value={h.text} onChange={(e) => set("highlights", c.highlights.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              <IconBtn label="Rimuovi" onClick={() => set("highlights", c.highlights.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconBtn>
            </div>
          ))}
          {c.highlights.length < 6 && (
            <button type="button" className={btnSecondary} onClick={() => set("highlights", [...c.highlights, { title: "", text: "" }])}>
              <Plus className="h-4 w-4" /> Aggiungi
            </button>
          )}
        </div>
      </Section>

      <Section title="5. Servizi / Menù / Prodotti" hint="La categoria raggruppa le voci (es. Antipasti, Primi…). Lasciala vuota per un elenco semplice.">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <Field label="Titolo sezione"><input className={inputCls} value={c.services.title} onChange={(e) => patch("services", { title: e.target.value })} /></Field>
          <Field label="Introduzione"><input className={inputCls} value={c.services.intro} onChange={(e) => patch("services", { intro: e.target.value })} /></Field>
        </div>
        <div className="space-y-2">
          {items.map((s, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-[10rem_1fr_1.5fr_7rem_auto]">
              <input className={inputCls} placeholder="Categoria" value={s.category} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Nome *" value={s.name} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Descrizione" value={s.description} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Prezzo" value={s.price} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
              <div className="flex gap-1">
                <IconBtn label="Su" disabled={i === 0} onClick={() => setItems(move(items, i, -1))}><ArrowUp className="h-4 w-4" /></IconBtn>
                <IconBtn label="Giù" disabled={i === items.length - 1} onClick={() => setItems(move(items, i, 1))}><ArrowDown className="h-4 w-4" /></IconBtn>
                <IconBtn label="Rimuovi" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconBtn>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={btnSecondary}
            onClick={() => setItems([...items, { category: items.at(-1)?.category ?? "", name: "", description: "", price: "" }])}
          >
            <Plus className="h-4 w-4" /> Aggiungi voce
          </button>
        </div>
      </Section>

      <Section title="6. Orari">
        <div className="space-y-2">
          {DAYS.map((day, i) => {
            const d = c.hours[i];
            const setDay = (next: typeof d) => set("hours", c.hours.map((x, j) => (j === i ? next : x)));
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                <span className="w-24 text-sm font-medium">{day}</span>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={d.closed} onChange={(e) => setDay({ ...d, closed: e.target.checked })} /> Chiuso
                </label>
                {!d.closed && (
                  <>
                    {d.slots.map((s, k) => (
                      <span key={k} className="flex items-center gap-1">
                        <input type="time" className={inputCls + " !w-28"} value={s.from} onChange={(e) => setDay({ ...d, slots: d.slots.map((x, m) => (m === k ? { ...x, from: e.target.value } : x)) })} />
                        –
                        <input type="time" className={inputCls + " !w-28"} value={s.to} onChange={(e) => setDay({ ...d, slots: d.slots.map((x, m) => (m === k ? { ...x, to: e.target.value } : x)) })} />
                        <IconBtn label="Rimuovi fascia" onClick={() => setDay({ ...d, slots: d.slots.filter((_, m) => m !== k) })}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                      </span>
                    ))}
                    {d.slots.length < 3 && (
                      <button type="button" className="text-sm text-neutral-600 underline" onClick={() => setDay({ ...d, slots: [...d.slots, d.slots.length ? { from: "19:00", to: "23:00" } : { from: "09:00", to: "13:00" }] })}>
                        + fascia
                      </button>
                    )}
                  </>
                )}
                {i === 0 && (
                  <button type="button" className="ml-auto text-xs text-neutral-500 underline" onClick={() => set("hours", c.hours.map(() => structuredClone(d)))}>
                    copia su tutti i giorni
                  </button>
                )}
              </div>
            );
          })}
          <Field label="Nota sugli orari"><input className={inputCls} value={c.hoursNote} onChange={(e) => set("hoursNote", e.target.value)} placeholder="Agosto chiuso per ferie" /></Field>
        </div>
      </Section>

      <Section title="7. Contatti e indirizzo">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Telefono"><input className={inputCls} value={c.contacts.phone} onChange={(e) => patch("contacts", { phone: e.target.value })} /></Field>
          <Field label="WhatsApp" hint="Vuoto = niente pulsante WhatsApp"><input className={inputCls} value={c.contacts.whatsapp} onChange={(e) => patch("contacts", { whatsapp: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} value={c.contacts.email} onChange={(e) => patch("contacts", { email: e.target.value })} /></Field>
          <Field label="Via e numero"><input className={inputCls} value={c.contacts.address} onChange={(e) => patch("contacts", { address: e.target.value })} /></Field>
          <div className="grid grid-cols-[1fr_5rem_4rem] gap-2">
            <Field label="Città"><input className={inputCls} value={c.contacts.city} onChange={(e) => patch("contacts", { city: e.target.value })} /></Field>
            <Field label="CAP"><input className={inputCls} value={c.contacts.zip} onChange={(e) => patch("contacts", { zip: e.target.value })} /></Field>
            <Field label="Prov."><input className={inputCls} maxLength={4} value={c.contacts.province} onChange={(e) => patch("contacts", { province: e.target.value.toUpperCase() })} /></Field>
          </div>
          <Field label="Ricerca Google Maps" hint="Es. &quot;Trattoria Da Mario, Roma&quot; (vuoto = indirizzo)"><input className={inputCls} value={c.contacts.mapsQuery} onChange={(e) => patch("contacts", { mapsQuery: e.target.value })} /></Field>
          <Field label="Instagram (URL)"><input className={inputCls} value={c.contacts.instagram} onChange={(e) => patch("contacts", { instagram: e.target.value })} placeholder="https://instagram.com/…" /></Field>
          <Field label="Facebook (URL)"><input className={inputCls} value={c.contacts.facebook} onChange={(e) => patch("contacts", { facebook: e.target.value })} placeholder="https://facebook.com/…" /></Field>
          <Field label="Link prenotazioni (opz.)" hint="TheFork, Treatwell, Calendly…"><input className={inputCls} value={c.contacts.bookingUrl} onChange={(e) => patch("contacts", { bookingUrl: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="8. Galleria foto" hint="Fino a 24 foto, ridimensionate automaticamente">
        <GalleryEditor clientId={clientId} images={c.gallery} onChange={(g) => set("gallery", g)} />
      </Section>

      <Section title="9. Google e condivisione (SEO)">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Titolo per Google" hint={`${c.seo.title.length}/70 — es. "Trattoria Da Mario — Cucina romana a Trastevere"`}>
              <input className={inputCls} maxLength={70} value={c.seo.title} onChange={(e) => patch("seo", { title: e.target.value })} />
            </Field>
            <Field label="Descrizione per Google" hint={`${c.seo.description.length}/170`}>
              <textarea rows={3} maxLength={170} className={inputCls} value={c.seo.description} onChange={(e) => patch("seo", { description: e.target.value })} />
            </Field>
          </div>
          <ImageInput clientId={clientId} label="Immagine per WhatsApp/Facebook (vuoto = copertina)" value={c.seo.ogImage} onChange={(v) => patch("seo", { ogImage: v })} />
        </div>
      </Section>
    </div>
  );
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const next = [...arr];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mb-1 text-xs text-neutral-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-100 disabled:opacity-30">
      {children}
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-neutral-700">{label}</span>
      <span className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" />
        <input value={value} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} className="w-20 font-mono text-xs outline-none" />
      </span>
    </label>
  );
}

function GalleryEditor({ clientId, images, onChange }: { clientId: string; images: string[]; onChange: (g: string[]) => void }) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => onChange(move(images, i, -1))} className="rounded bg-white/90 p-1 shadow disabled:opacity-40"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                <button type="button" disabled={i === images.length - 1} onClick={() => onChange(move(images, i, 1))} className="rounded bg-white/90 p-1 shadow disabled:opacity-40"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
              </div>
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="rounded bg-white/90 p-1 text-red-600 shadow"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {images.length < 24 && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 hover:bg-neutral-50">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="flex flex-col items-center gap-1"><Upload className="h-6 w-6" /> Aggiungi foto</span>}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])].slice(0, 24 - images.length);
                e.target.value = "";
                setError(null);
                setBusy(files.length);
                const urls: string[] = [];
                for (const f of files) {
                  try {
                    urls.push(await uploadImage(clientId, f));
                  } catch (err) {
                    setError((err as Error).message);
                  }
                  setBusy((n) => n - 1);
                }
                onChange([...images, ...urls]);
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
