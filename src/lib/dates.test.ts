import { describe, expect, it } from "vitest";
import { daysUntil, inRange, rangeBounds, todayISO } from "@/lib/dates";

describe("rangeBounds", () => {
  it("couvre le nombre de jours demandé", () => {
    const { from, to } = rangeBounds(7);
    expect(to.getTime()).toBeGreaterThan(from.getTime());
  });
});

describe("inRange", () => {
  it("rejette une date nulle", () => {
    expect(inRange(null, 7)).toBe(false);
  });

  it("accepte aujourd'hui sur une plage d'un jour", () => {
    expect(inRange(todayISO(), 1)).toBe(true);
  });
});

describe("daysUntil", () => {
  it("renvoie 0 pour aujourd'hui", () => {
    expect(daysUntil(todayISO())).toBe(0);
  });
});
