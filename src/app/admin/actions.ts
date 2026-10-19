"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidDomain, normalizeDomain, slugify, validateSlug } from "@/lib/slug";
import { newToken } from "@/lib/tokens";
import { logEvent } from "@/lib/events";
import { syncClient } from "@/lib/billing/sync";
import { createPortalSession } from "@/lib/billing/checkout";
import { siteContentSchema, TEMPLATES, type TemplateId } from "@/lib/site/schema";
import { defaultContent } from "@/lib/site/defaults";
import { starterHtml, validateCustomHtml } from "@/lib/site/custom-html";
import { tenantTag } from "@/lib/cache";
import { addDomain, addSubdomain, domainStatus, removeDomain, removeSubdomain, vercelConfigured, type DomainStatus } from "@/lib/vercel-domains";
import { ROOT_DOMAIN } from "@/lib/env";
import type { Client } from "@/lib/types";

export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

const opt = (max: number) =>
  z.string().max(max).trim().transform((v) => (v === "" ? null : v)).nullable().optional();

// ---------------------------------------------------------------- Auth

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o password non corretti" };
  redirect("/");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------- Slug

async function slugAvailable(slug: string, excludeId?: string): Promise<{ ok: boolean; reason?: string }> {
  const check = validateSlug(slug);
  if (!check.ok) return { ok: false, reason: check.reason };
  const { supabase } = await requireAdmin();
  let q = supabase.from("clients").select("id").eq("slug", slug);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.maybeSingle();
  return data ? { ok: false, reason: "Slug già usato da un altro cliente" } : { ok: true };
}

export async function checkSlug(slug: string, excludeId?: string) {
  return slugAvailable(slug, excludeId);
}

/** Primo slug libero partendo dal nome (damario, damario-2, ...). */
export async function suggestSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "sito";
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? base : `${base.slice(0, 60)}-${i}`;
    if ((await slugAvailable(candidate, excludeId)).ok) return candidate;
  }
  return `${base.slice(0, 50)}-${newToken(6).toLowerCase()}`;
}

// ---------------------------------------------------------------- Clienti

const clientSchema = z.object({
  nome_attivita: z.string().trim().min(2, "Inserisci il nome dell'attività").max(120),
  referente: opt(120),
  telefono: opt(40),
  email: z.union([z.literal(""), z.string().trim().email("Email non valida")]).transform((v) => v || null).nullable().optional(),
  partita_iva: opt(20),
  codice_fiscale: opt(20),
  indirizzo: opt(250),
  slug: z.string().trim().toLowerCase(),
  note: opt(4000),
  trial_days: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 365), "Giorni di prova non validi"),
});

function formObject(form: FormData) {
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
}

export async function createClientAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, actor } = await requireAdmin();
  const parsed = clientSchema.safeParse(formObject(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // "html" = sito HTML personalizzato (il template sotto resta come riserva)
  const choice = String(form.get("template") ?? "ristorante");
  const htmlMode = choice === "html";
  const template = (htmlMode ? "ristorante" : choice) as TemplateId;
  if (!TEMPLATES.includes(template)) return { error: "Template non valido" };

  const data = parsed.data;
  const slug = data.slug || (await suggestSlug(data.nome_attivita));
  const avail = await slugAvailable(slug);
  if (!avail.ok) return { error: avail.reason };

  const { data: created, error } = await supabase
    .from("clients")
    .insert({ ...data, slug, payment_token: newToken(), portal_token: newToken(20) })
    .select("id")
    .single();
  if (error) return { error: `Salvataggio non riuscito: ${error.message}` };

  const content = defaultContent(template, {
    nome: data.nome_attivita,
    telefono: data.telefono,
    email: data.email,
    indirizzo: data.indirizzo,
  });
  const { error: siteErr } = await supabase.from("sites").insert({
    client_id: created.id,
    template,
    content,
    html_mode: htmlMode,
    custom_html: htmlMode ? starterHtml(data.nome_attivita, data.telefono) : null,
  });
  if (siteErr) return { error: `Cliente creato ma sito non creato: ${siteErr.message}` };

  await logEvent(supabase, { clientId: created.id, actor, action: "cliente_creato", to: "in_attesa", details: { slug, template: htmlMode ? "html" : template } });
  if (vercelConfigured()) await addSubdomain(`${slug}.${ROOT_DOMAIN}`);
  redirect(`/clienti/${created.id}?nuovo=1`);
}

export async function updateClientAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, actor } = await requireAdmin();
  const parsed = clientSchema.safeParse(formObject(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data: old } = await supabase.from("clients").select("slug").eq("id", id).single();
  if (!old) return { error: "Cliente non trovato" };

  const data = parsed.data;
  if (data.slug !== old.slug) {
    const avail = await slugAvailable(data.slug, id);
    if (!avail.ok) return { error: avail.reason };
  }
  const { error } = await supabase.from("clients").update(data).eq("id", id);
  if (error) return { error: error.message };
  await logEvent(supabase, {
    clientId: id,
    actor,
    action: "dati_modificati",
    details: data.slug !== old.slug ? { slug_da: old.slug, slug_a: data.slug } : {},
  });
  updateTag(tenantTag(old.slug));
  updateTag(tenantTag(data.slug));
  if (data.slug !== old.slug && vercelConfigured()) {
    await addSubdomain(`${data.slug}.${ROOT_DOMAIN}`);
    await removeSubdomain(`${old.slug}.${ROOT_DOMAIN}`);
  }
  revalidatePath(`/admin/clienti/${id}`);
  return { ok: true, message: "Dati salvati" };
}

async function loadClient(id: string) {
  const ctx = await requireAdmin();
  const { data } = await ctx.supabase.from("clients").select("*").eq("id", id).single();
  if (!data) throw new Error("Cliente non trovato");
  return { ...ctx, client: data as Client };
}

/** Sospendi / forza online / torna automatico (segue Stripe). */
export async function setOverrideAction(id: string, override: "sospeso" | "attivo" | null) {
  const { supabase, actor, client } = await loadClient(id);
  await supabase.from("clients").update({ manual_override: override }).eq("id", id);
  await logEvent(supabase, {
    clientId: id,
    actor,
    action: override === "sospeso" ? "sospensione_manuale" : override === "attivo" ? "attivazione_manuale" : "override_rimosso",
  });
  await syncClient(supabase, { ...client, manual_override: override }, { actor });
  updateTag(tenantTag(client.slug));
  revalidatePath(`/admin/clienti/${id}`);
}

export async function syncNowAction(id: string) {
  const { supabase, actor, client } = await loadClient(id);
  await syncClient(supabase, client, { actor });
  revalidatePath(`/admin/clienti/${id}`);
}

export async function portalUrlAction(id: string): Promise<{ url?: string; error?: string }> {
  const { client } = await loadClient(id);
  if (!client.stripe_customer_id) return { error: "Il cliente non ha ancora completato il pagamento" };
  try {
    return { url: await createPortalSession(client) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function regenerateTokensAction(id: string) {
  const { supabase, actor } = await loadClient(id);
  await supabase.from("clients").update({ payment_token: newToken(), portal_token: newToken(20) }).eq("id", id);
  await logEvent(supabase, { clientId: id, actor, action: "link_rigenerati" });
  revalidatePath(`/admin/clienti/${id}`);
}

// ---------------------------------------------------------------- Dominio personalizzato

export async function setCustomDomainAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, actor, client } = await loadClient(id);
  const raw = String(form.get("custom_domain") ?? "");
  const domain = raw.trim() ? normalizeDomain(raw) : null;
  if (domain && !isValidDomain(domain)) return { error: "Dominio non valido (es. damario.it)" };
  if (domain && domain.endsWith(process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "miositoveloce.it"))
    return { error: "Usa lo slug per i sottodomini di MioSitoVeloce" };

  if (domain) {
    const { data: taken } = await supabase.from("clients").select("id").eq("custom_domain", domain).neq("id", id).maybeSingle();
    if (taken) return { error: "Dominio già collegato a un altro cliente" };
  }

  if (vercelConfigured()) {
    if (client.custom_domain && client.custom_domain !== domain) await removeDomain(client.custom_domain);
    if (domain) {
      const r = await addDomain(domain);
      if (!r.ok) return { error: `Vercel: ${r.error}` };
    }
  }
  const { error } = await supabase.from("clients").update({ custom_domain: domain }).eq("id", id);
  if (error) return { error: error.message };
  await logEvent(supabase, { clientId: id, actor, action: "dominio_modificato", details: { da: client.custom_domain, a: domain } });
  updateTag(tenantTag(client.slug));
  revalidatePath(`/admin/clienti/${id}`);
  return {
    ok: true,
    message: domain
      ? vercelConfigured()
        ? "Dominio aggiunto su Vercel. Ora imposta i record DNS indicati sotto."
        : "Dominio salvato. Aggiungilo anche in Vercel → Settings → Domains."
      : "Dominio rimosso",
  };
}

export async function domainStatusAction(id: string): Promise<DomainStatus | { error: string }> {
  const { client } = await loadClient(id);
  if (!client.custom_domain) return { error: "Nessun dominio" };
  if (!vercelConfigured()) return { error: "VERCEL_API_TOKEN non configurato: verifica lo stato da Vercel" };
  return domainStatus(client.custom_domain);
}

// ---------------------------------------------------------------- Sito

export async function saveSiteAction(
  clientId: string,
  payload: { template: string; content: unknown; pubblicato: boolean; htmlMode?: boolean; customHtml?: string | null },
): Promise<ActionState> {
  const { supabase, actor, client } = await loadClient(clientId);
  if (!TEMPLATES.includes(payload.template as TemplateId)) return { error: "Template non valido" };
  if (payload.htmlMode) {
    const htmlError = validateCustomHtml(payload.customHtml ?? "");
    if (htmlError) return { error: htmlError };
  }
  const parsed = siteContentSchema.safeParse(payload.content);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return { error: `${i.path.join(" → ")}: ${i.message}` };
  }
  const { data: before } = await supabase.from("sites").select("pubblicato").eq("client_id", clientId).single();
  const { error } = await supabase
    .from("sites")
    .update({
      template: payload.template,
      content: parsed.data,
      pubblicato: payload.pubblicato,
      html_mode: !!payload.htmlMode,
      // l'HTML resta salvato anche tornando al template
      ...(payload.customHtml !== undefined ? { custom_html: payload.customHtml || null } : {}),
      ...(payload.pubblicato && !before?.pubblicato ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("client_id", clientId);
  if (error) return { error: error.message };
  if (before && before.pubblicato !== payload.pubblicato) {
    await logEvent(supabase, { clientId, actor, action: payload.pubblicato ? "sito_pubblicato" : "sito_ritirato" });
  }
  updateTag(tenantTag(client.slug));
  return { ok: true, message: "Sito salvato" };
}

// ---------------------------------------------------------------- Impostazioni

export async function updateSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, actor } = await requireAdmin();
  const schema = z.object({
    grace_days: z.coerce.number().int().min(0).max(60),
    default_trial_days: z.coerce.number().int().min(0).max(365),
    monthly_price_cents: z.coerce.number().int().min(1),
    archive_after_days: z.coerce.number().int().min(1).max(3650),
  });
  const parsed = schema.safeParse({
    grace_days: form.get("grace_days"),
    default_trial_days: form.get("default_trial_days"),
    monthly_price_cents: Math.round(Number(String(form.get("monthly_price") ?? "9.99").replace(",", ".")) * 100),
    archive_after_days: form.get("archive_after_days"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("settings").update(parsed.data).eq("id", 1);
  if (error) return { error: error.message };
  await logEvent(supabase, { clientId: null, actor, action: "impostazioni_modificate", details: parsed.data });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Impostazioni salvate" };
}
