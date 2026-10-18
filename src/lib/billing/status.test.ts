import { describe, expect, it } from "vitest";
import { computeStatus, pickRelevantSubscription, type StatusInput } from "./status";

const now = new Date("2026-10-18T12:00:00Z");
const day = 86_400_000;
const base: StatusInput = {
  subscriptionStatus: null,
  pastDueSince: null,
  manualOverride: null,
  everActivated: false,
  graceDays: 7,
  now,
};

describe("computeStatus", () => {
  it("nuovo cliente senza abbonamento -> in_attesa", () => {
    expect(computeStatus(base).status).toBe("in_attesa");
  });

  it("trialing -> trial, active -> attivo", () => {
    expect(computeStatus({ ...base, subscriptionStatus: "trialing" }).status).toBe("trial");
    expect(computeStatus({ ...base, subscriptionStatus: "active" }).status).toBe("attivo");
  });

  it("primo pagamento fallito -> in_ritardo e past_due_since = adesso", () => {
    const r = computeStatus({ ...base, subscriptionStatus: "past_due", everActivated: true });
    expect(r.status).toBe("in_ritardo");
    expect(r.pastDueSince).toEqual(now);
    expect(r.graceEndsAt).toEqual(new Date(now.getTime() + 7 * day));
  });

  it("ancora entro la tolleranza -> in_ritardo", () => {
    const since = new Date(now.getTime() - 6 * day);
    const r = computeStatus({ ...base, subscriptionStatus: "past_due", pastDueSince: since, everActivated: true });
    expect(r.status).toBe("in_ritardo");
    expect(r.pastDueSince).toEqual(since);
  });

  it("tolleranza scaduta -> sospeso", () => {
    const since = new Date(now.getTime() - 7 * day);
    const r = computeStatus({ ...base, subscriptionStatus: "past_due", pastDueSince: since, everActivated: true });
    expect(r.status).toBe("sospeso");
  });

  it("tolleranza configurabile (0 giorni = sospensione immediata)", () => {
    const r = computeStatus({ ...base, subscriptionStatus: "unpaid", everActivated: true, graceDays: 0 });
    expect(r.status).toBe("sospeso");
  });

  it("pagamento riuscito dopo la sospensione -> attivo e azzera il ritardo", () => {
    const r = computeStatus({
      ...base,
      subscriptionStatus: "active",
      pastDueSince: new Date(now.getTime() - 20 * day),
      everActivated: true,
    });
    expect(r).toEqual({ status: "attivo", pastDueSince: null, graceEndsAt: null });
  });

  it("canceled -> cancellato", () => {
    expect(computeStatus({ ...base, subscriptionStatus: "canceled", everActivated: true }).status).toBe("cancellato");
  });

  it("incomplete: nuovo cliente resta in_attesa, cliente già attivo va in ritardo", () => {
    expect(computeStatus({ ...base, subscriptionStatus: "incomplete" }).status).toBe("in_attesa");
    expect(computeStatus({ ...base, subscriptionStatus: "incomplete", everActivated: true }).status).toBe("in_ritardo");
  });

  it("paused -> sospeso", () => {
    expect(computeStatus({ ...base, subscriptionStatus: "paused", everActivated: true }).status).toBe("sospeso");
  });

  it("override manuale ha la precedenza", () => {
    expect(computeStatus({ ...base, subscriptionStatus: "active", manualOverride: "sospeso" }).status).toBe("sospeso");
    expect(computeStatus({ ...base, subscriptionStatus: null, manualOverride: "attivo" }).status).toBe("attivo");
  });
});

describe("pickRelevantSubscription", () => {
  it("preferisce active a canceled anche se più vecchio", () => {
    const s = pickRelevantSubscription([
      { id: "a", status: "canceled", created: 300 },
      { id: "b", status: "active", created: 100 },
    ]);
    expect(s?.id).toBe("b");
  });
  it("a parità di stato prende il più recente", () => {
    const s = pickRelevantSubscription([
      { id: "a", status: "canceled", created: 100 },
      { id: "b", status: "canceled", created: 200 },
    ]);
    expect(s?.id).toBe("b");
  });
  it("lista vuota -> null", () => {
    expect(pickRelevantSubscription([])).toBeNull();
  });
});
