-- Piani: "base" (sottodominio, 9,99 €) e "dominio" (dominio personalizzato incluso, 14,99 €)
alter table public.clients add column if not exists plan text not null default 'base'
  check (plan in ('base', 'dominio'));

alter table public.settings add column if not exists dominio_price_cents int not null default 1499
  check (dominio_price_cents > 0);
