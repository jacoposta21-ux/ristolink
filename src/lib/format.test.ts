import { describe, expect, it } from "vitest";
import { waNumber, telHref } from "./format";

describe("waNumber", () => {
  it.each([
    ["333 123 4567", "393331234567"],
    ["+39 333 1234567", "393331234567"],
    ["0039 333 1234567", "393331234567"],
    ["06 1234567", "39061234567"],
    ["+41 79 123 45 67", "41791234567"],
    ["393331234567", "393331234567"],
  ])("%s -> %s", (i, o) => expect(waNumber(i)).toBe(o));
});

it("telHref", () => expect(telHref("+39 06 123-456")).toBe("tel:+3906123456"));
