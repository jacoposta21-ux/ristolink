import { describe, expect, it } from "vitest";
import { isOpenAt } from "./OpenNow";

const week = (slots: { from: string; to: string }[], closed = false) => Array.from({ length: 7 }, () => ({ closed, slots }));
const m = (h: number, min = 0) => h * 60 + min;

describe("isOpenAt", () => {
  const h = week([{ from: "12:00", to: "15:00" }, { from: "19:00", to: "23:00" }]);
  it("dentro e fuori fascia", () => {
    expect(isOpenAt(h, 0, m(13))).toBe(true);
    expect(isOpenAt(h, 0, m(16))).toBe(false);
    expect(isOpenAt(h, 0, m(23))).toBe(false);
  });
  it("giorno chiuso", () => {
    const c = week([{ from: "09:00", to: "18:00" }]);
    c[6] = { closed: true, slots: [] };
    expect(isOpenAt(c, 6, m(10))).toBe(false);
  });
  it("oltre mezzanotte", () => {
    const n = week([{ from: "20:00", to: "02:00" }]);
    expect(isOpenAt(n, 4, m(23))).toBe(true);
    expect(isOpenAt(n, 5, m(1))).toBe(true);
    expect(isOpenAt(n, 5, m(3))).toBe(false);
  });
});
