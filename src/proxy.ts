import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { classifyHost } from "./lib/hosts";
import { resolveTenant } from "./lib/tenant/resolve";
import { isLive } from "./lib/billing/status";
import { notFoundHtml, unavailableHtml } from "./lib/tenant/unavailable";

// Smistamento multi-tenant per host:
//   ristolink.it              -> landing + /paga/<token> + /portale/<token>
//   www.ristolink.it          -> redirect 308 a ristolink.it
//   admin.ristolink.it/...    -> /admin/... (dashboard, login Supabase)
//   <slug>.ristolink.it/...   -> /tenant/<slug>/... (se online) oppure pagina neutra 503
//   dominio-cliente.it/...    -> come sopra, risolto tramite clients.custom_domain

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
const EXTRA_ROOT_HOSTS = (process.env.EXTRA_ROOT_HOSTS || "").split(",").filter(Boolean);

// Percorsi interni che non devono essere raggiungibili direttamente
const INTERNAL = /^\/(admin|tenant)(\/|$)/;

export async function proxy(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const target = classifyHost(host, ROOT, EXTRA_ROOT_HOSTS);
  const url = req.nextUrl.clone();
  const path = url.pathname;

  switch (target.kind) {
    case "invalid":
      return html(notFoundHtml(), 404);

    case "www": {
      const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
      return NextResponse.redirect(new URL(path + url.search, `${proto}://${ROOT}`), 308);
    }

    case "root":
      if (INTERNAL.test(path)) return html(notFoundHtml(), 404);
      return NextResponse.next();

    case "admin":
      return adminProxy(req, path, host!);

    case "tenant-slug":
    case "tenant-domain": {
      let tenant;
      try {
        tenant = await resolveTenant(target.kind === "tenant-slug" ? { slug: target.slug } : { domain: target.domain });
      } catch (e) {
        console.error("[proxy] resolve_tenant fallito", e);
        return html(unavailableHtml(), 503);
      }
      if (!tenant) return html(notFoundHtml(), 404);
      if (!tenant.pubblicato || !isLive(tenant.stato)) {
        return html(unavailableHtml(tenant.nome_attivita), 503, { "Retry-After": "3600" });
      }
      url.pathname = `/tenant/${tenant.slug}${path === "/" ? "" : path}`;
      const res = NextResponse.rewrite(url);
      res.headers.set("x-tenant", tenant.slug);
      return res;
    }
  }
}

async function adminProxy(req: NextRequest, path: string, host: string) {
  const url = req.nextUrl.clone();
  url.pathname = path.startsWith("/admin") ? path : `/admin${path === "/" ? "" : path}`;
  let res = NextResponse.rewrite(url);

  // Aggiorna la sessione Supabase (refresh dei token nei cookie)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet, headers) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.rewrite(url, { request: { headers: req.headers } });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => res.headers.set(k, v));
        },
      },
    },
  );
  const { data } = await supabase.auth.getClaims();

  // Controllo "di cortesia": la verifica vera (utente admin) è nel layout e in ogni Server Action
  const isLogin = url.pathname === "/admin/login";
  if (!data?.claims && !isLogin) {
    // costruito dall'host della richiesta: dietro proxy nextUrl può avere l'host interno
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    return NextResponse.redirect(new URL("/login", `${proto}://${host}`));
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function html(body: string, status: number, headers: Record<string, string> = {}) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export const config = {
  matcher: [
    // tutto tranne API, asset di Next, immagini ottimizzate e file statici comuni
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|woff2?)$).*)",
  ],
};
