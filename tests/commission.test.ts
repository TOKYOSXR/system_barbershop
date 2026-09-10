import { describe, it, expect } from "vitest";

import { calcCommission } from "@/lib/finance/commission";

describe("calcCommission", () => {
  it("calcula 40% de R$50 = R$20", () => {
    expect(calcCommission(50, 40)).toBe(20);
  });

  it("arredonda para centavos", () => {
    expect(calcCommission(65, 45)).toBe(29.25);
    expect(calcCommission(33.33, 33)).toBe(11); // 10.9989 -> 11.00
  });

  it("comissão de 0% é zero", () => {
    expect(calcCommission(100, 0)).toBe(0);
  });

  it("comissão de 100% é o valor cheio", () => {
    expect(calcCommission(80, 100)).toBe(80);
  });
});
