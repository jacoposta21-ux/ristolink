import { reconcileAll } from "@/lib/billing/reconcile";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

// Cron giornaliero (vercel.json). Vercel invia "Authorization: Bearer $CRON_SECRET".
export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret()}`) {
    return new Response("Non autorizzato", { status: 401 });
  }
  const summary = await reconcileAll(supabaseAdmin());
  console.info("[cron] riconciliazione", JSON.stringify(summary));
  return Response.json(summary);
}
