import type { ClientStatus, ManualOverride } from "./billing/status";
import type { SiteContent, TemplateId } from "./site/schema";

export type Client = {
  id: string;
  nome_attivita: string;
  referente: string | null;
  telefono: string | null;
  email: string | null;
  partita_iva: string | null;
  codice_fiscale: string | null;
  indirizzo: string | null;
  slug: string;
  custom_domain: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stato: ClientStatus;
  manual_override: ManualOverride;
  trial_days: number | null;
  payment_token: string;
  portal_token: string;
  monthly_amount_cents: number;
  past_due_since: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  data_attivazione: string | null;
  canceled_at: string | null;
  archived_at: string | null;
  last_synced_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Site = {
  id: string;
  client_id: string;
  template: TemplateId;
  content: SiteContent;
  pubblicato: boolean;
  html_mode: boolean;
  custom_html: string | null;
  published_at: string | null;
  updated_at: string;
};

export type Payment = {
  id: string;
  client_id: string | null;
  stripe_invoice_id: string;
  number: string | null;
  status: string;
  billing_reason: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  attempt_count: number;
  next_payment_attempt: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  last_error: string | null;
  created_at: string;
};

export type EventLog = {
  id: number;
  client_id: string | null;
  actor: string;
  action: string;
  from_status: ClientStatus | null;
  to_status: ClientStatus | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type Settings = {
  grace_days: number;
  default_trial_days: number;
  monthly_price_cents: number;
  archive_after_days: number;
};
