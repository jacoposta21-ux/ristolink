// Lettura centralizzata delle variabili d'ambiente (vedi .env.example).

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variabile d'ambiente mancante: ${name} (vedi .env.example)`);
  return v;
}

/** Dominio base, es. "easysito.com" (in locale "localhost:3000"). */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

const isLocal = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.startsWith("127.");
export const PROTOCOL = isLocal ? "http" : "https";

/** URL pubblico della root (landing, link di pagamento). */
export const ROOT_URL = `${PROTOCOL}://${ROOT_DOMAIN}`;
export const ADMIN_URL = `${PROTOCOL}://admin.${ROOT_DOMAIN}`;

export function tenantUrl(slug: string, customDomain?: string | null): string {
  if (customDomain) return `https://${customDomain}`;
  return `${PROTOCOL}://${slug}.${ROOT_DOMAIN}`;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: () => required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseSecretKey: () => required("SUPABASE_SECRET_KEY"),
  stripeSecretKey: () => required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => required("STRIPE_WEBHOOK_SECRET"),
  stripePriceId: () => required("STRIPE_PRICE_ID"),
  cronSecret: () => required("CRON_SECRET"),
  resendApiKey: () => process.env.RESEND_API_KEY || null,
  emailFrom: () => process.env.EMAIL_FROM || "EasySito <noreply@easysito.com>",
  adminNotifyEmail: () => process.env.ADMIN_NOTIFY_EMAIL || null,
  vercelToken: () => process.env.VERCEL_API_TOKEN || null,
  vercelProjectId: () => process.env.VERCEL_PROJECT_ID || null,
  vercelTeamId: () => process.env.VERCEL_TEAM_ID || null,
};
