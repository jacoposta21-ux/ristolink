-- Test RLS: eseguire dopo stub + migrazioni. Fallisce (ERROR) se qualcosa non va.
\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-000000000001', 'admin@test.it'),
                              ('00000000-0000-0000-0000-000000000002', 'intruso@test.it');
insert into public.admins values ('00000000-0000-0000-0000-000000000001', 'admin@test.it');
insert into public.clients (nome_attivita, slug, payment_token, portal_token, stato)
  values ('Da Mario', 'damario', 'tokpay1', 'tokpor1', 'attivo');
insert into public.sites (client_id, pubblicato) select id, true from public.clients;

do $$ begin
  -- anon: nessun accesso alle tabelle
  set local role anon;
  begin
    perform count(*) from public.clients;
    raise exception 'anon legge clients';
  exception when insufficient_privilege then null; end;
  -- ma può risolvere il tenant
  if (select count(*) from public.resolve_tenant('damario', null)) <> 1 then raise exception 'resolve_tenant slug ko'; end if;
  if (select count(*) from public.resolve_tenant(null, 'nonesiste.it')) <> 0 then raise exception 'resolve_tenant dominio ko'; end if;
  reset role;

  -- utente autenticato non admin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  set local role authenticated;
  if (select count(*) from public.clients) <> 0 then raise exception 'non-admin vede clients'; end if;
  if (select attivi from public.client_kpis) <> 0 then raise exception 'non-admin vede KPI'; end if;
  begin
    insert into public.clients (nome_attivita, slug, payment_token, portal_token) values ('X', 'x', 'a', 'b');
    raise exception 'non-admin ha inserito un cliente';
  exception when insufficient_privilege then null; end;
  reset role;

  -- admin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  set local role authenticated;
  if (select count(*) from public.clients) <> 1 then raise exception 'admin non vede clients'; end if;
  if (select attivi from public.client_kpis) <> 1 then raise exception 'KPI errati'; end if;
  if (select mrr_cents from public.client_kpis) <> 999 then raise exception 'MRR errato'; end if;
  update public.clients set note = 'ok';
  begin
    insert into public.payments (stripe_invoice_id, status) values ('in_1', 'paid');
    raise exception 'admin ha scritto payments (deve farlo solo il server)';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.clients (nome_attivita, slug, payment_token, portal_token) values ('Y', 'Bad Slug', 'c', 'd');
    raise exception 'slug non valido accettato';
  exception when check_violation then null; end;
  reset role;
end $$;
select 'RLS OK' as risultato;
