import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Verifica che l'utente sia loggato E presente nella tabella admins.
 * Da chiamare in ogni layout/pagina/Server Action dell'area admin.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/login?errore=non-autorizzato");
  }
  return { supabase, user, actor: `admin:${user.email}` };
});
