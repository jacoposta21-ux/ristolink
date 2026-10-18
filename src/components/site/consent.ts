"use client";

// Preferenze cookie salvate nel browser del visitatore.
// "all" = accetta anche i contenuti di terze parti (Google Maps).
export type Consent = "all" | "necessary";
const KEY = "rl-consent-v1";
const EVENT = "rl-consent-change";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: Consent | null) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function onConsentChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
