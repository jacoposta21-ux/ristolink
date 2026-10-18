-- Siti "HTML personalizzato": una pagina HTML completa (es. creata in chat con
-- Claude) servita al posto del template. Abbonamento e sospensione funzionano
-- uguale. Il template React resta salvato: si torna indietro spegnendo html_mode.

alter table public.sites add column if not exists custom_html text
  check (custom_html is null or octet_length(custom_html) <= 2000000);

alter table public.sites add column if not exists html_mode boolean not null default false;

-- Come resolve_tenant, in più dice al proxy se servire l'HTML personalizzato
create or replace function public.resolve_tenant_v2(p_slug text default null, p_domain text default null)
returns table (slug text, nome_attivita text, stato public.client_status, pubblicato boolean, custom_domain text, html_mode boolean)
language sql stable security definer
set search_path = ''
as $$
  select c.slug, c.nome_attivita, c.stato, coalesce(s.pubblicato, false), c.custom_domain,
         coalesce(s.html_mode and s.custom_html is not null, false)
  from public.clients c
  left join public.sites s on s.client_id = c.id
  where c.archived_at is null
    and ((p_slug is not null and c.slug = lower(p_slug))
      or (p_domain is not null and c.custom_domain = lower(p_domain)))
  limit 1;
$$;

revoke all on function public.resolve_tenant_v2(text, text) from public;
grant execute on function public.resolve_tenant_v2(text, text) to anon, authenticated, service_role;
