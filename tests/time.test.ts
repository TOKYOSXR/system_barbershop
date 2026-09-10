import { describe, it, expect } from "vitest";

import {
  parseHHmm,
  formatHHmm,
  intervalsOverlap,
} from "@/lib/availability/time";

describe("parseHHmm / formatHHmm", () => {
  it("converte HH:mm em minutos", () => {
    expect(parseHHmm("09:00")).toBe(540);
    expect(parseHHmm("00:00")).toBe(0);
    expect(parseHHmm("23:59")).toBe(1439);
  });

  it("rejeita valores inválidos", () => {
    expect(parseHHmm("24:00")).toBeNull();
    expect(parseHHmm("9h")).toBeNull();
    expect(parseHHmm("12:60")).toBeNull();
  });

  it("formata minutos em HH:mm", () => {
    expect(formatHHmm(540)).toBe("09:00");
    expect(formatHHmm(0)).toBe("00:00");
    expect(formatHHmm(1439)).toBe("23:59");
  });
});

describe("intervalsOverlap", () => {
  it("detecta sobreposição", () => {
    expect(
      intervalsOverlap({ start: 0, end: 30 }, { start: 15, end: 45 }),
    ).toBe(true);
  });

  it("intervalos adjacentes (half-open) não se sobrepõem", () => {
    expect(
      intervalsOverlap({ start: 0, end: 30 }, { start: 30, end: 60 }),
    ).toBe(false);
  });
});
