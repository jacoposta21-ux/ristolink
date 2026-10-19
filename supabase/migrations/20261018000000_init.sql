-- =====================================================================
-- EasySito — schema iniziale
-- Tabelle: admins, settings, clients, sites, payments, events_log, stripe_events
-- Sicurezza: RLS attiva su tutto. Solo gli utenti presenti in "admins"
-- possono leggere/scrivere. Webhook, cron e rendering pubblico usano la
-- secret key (service_role) lato server, che bypassa la RLS.
-- Il proxy (middleware) usa solo la chiave pubblica + la funzione
-- resolve_tenant(), che espone il minimo indispensabile.
-- =====================================================================

-- ---------- Tipi ----------
create type public.client_status as enum (
  'in_attesa',   -- creato, in attesa del primo pagamento (sito offline)
  'trial',       -- periodo di prova attivo (sito online)
  'attivo',      -- abbonamento pagato (sito online)
  'in_ritardo',  -- pagamento fallito, nel periodo di tolleranza (sito online)
  'sospeso',     -- tolleranza scaduta o sospensione manuale (sito offline)
  'cancellato'   -- abbonamento disdetto (sito offline, dati conservati 90 gg)
);

-- ---------- updated_at automatico ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Admin ----------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------- Impostazioni globali (riga unica) ----------
create table public.settings (
  id                   int primary key default 1 check (id = 1),
  grace_days           int not null default 7 check (grace_days between 0 and 60),
  default_trial_days   int not null default 0 check (default_trial_days between 0 and 365),
  monthly_price_cents  int not null default 999 check (monthly_price_cents > 0),
  archive_after_days   int not null default 90 check (archive_after_days >= 1),
  updated_at           timestamptz not null default now()
);
insert into public.settings (id) values (1);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- Clienti ----------
create table public.clients (
  id                      uuid primary key default gen_random_uuid(),
  nome_attivita           text not null check (length(trim(nome_attivita)) > 0),
  referente               text,
  telefono                text,
  email                   text,
  partita_iva             text,
  codice_fiscale          text,
  indirizzo               text,
  slug                    text not null unique
                            check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'),
  custom_domain           text unique
                            check (custom_domain is null or custom_domain = lower(custom_domain)),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  stato                   public.client_status not null default 'in_attesa',
  -- Forzatura manuale dalla dashboard: 'sospeso' o 'attivo' (es. paga in contanti).
  -- Ha la precedenza sullo stato calcolato da Stripe.
  manual_override         text check (manual_override in ('sospeso', 'attivo')),
  -- Giorni di prova per questo cliente (null = usa settings.default_trial_days)
  trial_days              int check (trial_days between 0 and 365),
  -- Token dei link pubblici (/paga/<token>, /portale/<token>), generati dall'app
  payment_token           text not null unique,
  portal_token            text not null unique,
  monthly_amount_cents    int not null default 999,
  past_due_since          timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  trial_end               timestamptz,
  data_attivazione        timestamptz,
  canceled_at             timestamptz,
  archived_at             timestamptz,
  last_synced_at          timestamptz,
  note                    text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index clients_stato_idx on public.clients (stato) where archived_at is null;
create index clients_created_idx on public.clients (created_at desc);
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------- Siti ----------
create table public.sites (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null unique references public.clients (id) on delete cascade,
  template      text not null default 'ristorante'
                  check (template in ('ristorante', 'beauty', 'negozio', 'artigiano')),
  content       jsonb not null default '{}'::jsonb,
  pubblicato    boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger sites_updated_at before update on public.sites
  for each row execute function public.set_updated_at();

-- ---------- Pagamenti (fatture Stripe) ----------
create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid references public.clients (id) on delete set null,
  stripe_invoice_id       text not null unique,
  stripe_subscription_id  text,
  number                  text,
  status                  text not null,          -- draft | open | paid | uncollectible | void
  billing_reason          text,
  amount_due              int not null default 0,
  amount_paid             int not null default 0,
  currency                text not null default 'eur',
  attempt_count           int not null default 0,
  next_payment_attempt    timestamptz,
  hosted_invoice_url      text,
  invoice_pdf             text,
  period_start            timestamptz,
  period_end              timestamptz,
  paid_at                 timestamptz,
  last_error              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index payments_client_idx on public.payments (client_id, created_at desc);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- Log eventi (audit) ----------
create table public.events_log (
  id           bigint generated always as identity primary key,
  client_id    uuid references public.clients (id) on delete cascade,
  actor        text not null,         -- 'admin:<email>' | 'stripe:<evento>' | 'cron' | 'sistema'
  action       text not null,         -- 'stato_cambiato' | 'cliente_creato' | ...
  from_status  public.client_status,
  to_status    public.client_status,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index events_log_client_idx on public.events_log (client_id, created_at desc);

-- ---------- Webhook Stripe ricevuti (idempotenza) ----------
create table public.stripe_events (
  id            text primary key,      -- evt_...
  type          text not null,
  livemode      boolean not null default false,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  attempts      int not null default 0,
  error         text
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.admins        enable row level security;
alter table public.settings      enable row level security;
alter table public.clients       enable row level security;
alter table public.sites         enable row level security;
alter table public.payments      enable row level security;
alter table public.events_log    enable row level security;
alter table public.stripe_events enable row level security;

-- admins: ognuno vede solo la propria riga (serve a is_admin lato app)
create policy "admins_select_self" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "settings_admin_all" on public.settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "clients_admin_all" on public.clients
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "sites_admin_all" on public.sites
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- payments/events_log/stripe_events: in sola lettura per l'admin,
-- scritti solo dal server (service_role)
create policy "payments_admin_read" on public.payments
  for select to authenticated using ((select public.is_admin()));

create policy "events_log_admin_read" on public.events_log
  for select to authenticated using ((select public.is_admin()));
create policy "events_log_admin_insert" on public.events_log
  for insert to authenticated with check ((select public.is_admin()));

create policy "stripe_events_admin_read" on public.stripe_events
  for select to authenticated using ((select public.is_admin()));

-- =====================================================================
-- Funzione pubblica per il proxy: host -> tenant (dati minimi)
-- =====================================================================
create or replace function public.resolve_tenant(p_slug text default null, p_domain text default null)
returns table (
  slug           text,
  nome_attivita  text,
  stato          public.client_status,
  pubblicato     boolean,
  custom_domain  text
)
language sql stable security definer
set search_path = ''
as $$
  select c.slug, c.nome_attivita, c.stato, coalesce(s.pubblicato, false), c.custom_domain
  from public.clients c
  left join public.sites s on s.client_id = c.id
  where c.archived_at is null
    and (
      (p_slug is not null and c.slug = lower(p_slug))
      or (p_domain is not null and c.custom_domain = lower(p_domain))
    )
  limit 1;
$$;

revoke all on function public.resolve_tenant(text, text) from public;
grant execute on function public.resolve_tenant(text, text) to anon, authenticated, service_role;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- =====================================================================
-- KPI dashboard (eseguita con i permessi dell'utente: la RLS si applica)
-- =====================================================================
create or replace view public.client_kpis
with (security_invoker = true) as
select
  count(*) filter (where stato = 'attivo')                                   as attivi,
  count(*) filter (where stato = 'trial')                                    as in_prova,
  count(*) filter (where stato = 'in_ritardo')                               as in_ritardo,
  count(*) filter (where stato = 'sospeso')                                  as sospesi,
  count(*) filter (where stato = 'in_attesa')                                as in_attesa,
  count(*) filter (where stato = 'cancellato')                               as cancellati,
  coalesce(sum(monthly_amount_cents) filter (where stato in ('attivo', 'in_ritardo')), 0) as mrr_cents,
  count(*) filter (where data_attivazione >= date_trunc('month', now()))    as nuovi_mese
from public.clients
where archived_at is null;

-- =====================================================================
-- Storage: bucket pubblico per le foto dei siti
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

create policy "site_media_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'site-media' and (select public.is_admin()));
create policy "site_media_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'site-media' and (select public.is_admin()));
create policy "site_media_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site-media' and (select public.is_admin()));

-- =====================================================================
-- Privilegi espliciti (non dipendere dai default del progetto)
-- anon non legge nessuna tabella: passa solo da resolve_tenant().
-- =====================================================================
grant usage on schema public to anon, authenticated, service_role;
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
