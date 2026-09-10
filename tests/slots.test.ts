import { describe, it, expect } from "vitest";

import {
  computeAvailableSlots,
  computeAvailableSlotsHHmm,
  isSlotAvailable,
} from "@/lib/availability/slots";

// 09:00 = 540, 18:00 = 1080, 12:00 = 720, 13:00 = 780
const WORK_9_18 = [{ start: 540, end: 1080 }];

describe("computeAvailableSlots", () => {
  it("gera slots alinhados ao passo dentro do horário de trabalho", () => {
    const slots = computeAvailableSlots({
      workingIntervals: WORK_9_18,
      busyIntervals: [],
      durationMinutes: 30,
      stepMinutes: 30,
    });
    // 09:00..17:30 = 18 slots (último cabe 17:30-18:00)
    expect(slots.length).toBe(18);
    expect(slots[0]).toBe(540); // 09:00
    expect(slots[slots.length - 1]).toBe(1050); // 17:30
  });

  it("não permite dois agendamentos simultâneos (remove slots em conflito)", () => {
    // Ocupado 14:00-14:30 (840-870)
    const slots = computeAvailableSlotsHHmm({
      workingIntervals: WORK_9_18,
      busyIntervals: [{ start: 840, end: 870 }],
      durationMinutes: 30,
      stepMinutes: 30,
    });
    expect(slots).not.toContain("14:00");
    // 13:30-14:00 termina exatamente em 840, então é válido (half-open)
    expect(slots).toContain("13:30");
    expect(slots).toContain("14:30");
  });

  it("respeita a duração do serviço (serviço longo não cabe perto do fim)", () => {
    const slots = computeAvailableSlots({
      workingIntervals: WORK_9_18,
      busyIntervals: [],
      durationMinutes: 90,
      stepMinutes: 30,
    });
    // último início possível: 16:30 (990) -> termina 18:00
    expect(slots[slots.length - 1]).toBe(990);
    expect(slots).not.toContain(1020); // 17:00 não cabe
  });

  it("considera bloqueio de almoço", () => {
    const slots = computeAvailableSlotsHHmm({
      workingIntervals: WORK_9_18,
      busyIntervals: [{ start: 720, end: 780 }], // 12:00-13:00
      durationMinutes: 30,
      stepMinutes: 30,
    });
    expect(slots).not.toContain("12:00");
    expect(slots).not.toContain("12:30");
    expect(slots).toContain("11:30");
    expect(slots).toContain("13:00");
  });

  it("aplica o corte de antecedência (minStartMinutes)", () => {
    const slots = computeAvailableSlots({
      workingIntervals: WORK_9_18,
      busyIntervals: [],
      durationMinutes: 30,
      stepMinutes: 30,
      minStartMinutes: 600, // 10:00
    });
    expect(slots[0]).toBe(600); // primeiro slot é 10:00
    expect(slots).not.toContain(540);
  });

  it("retorna vazio para duração ou passo inválidos", () => {
    expect(
      computeAvailableSlots({
        workingIntervals: WORK_9_18,
        busyIntervals: [],
        durationMinutes: 0,
        stepMinutes: 30,
      }),
    ).toEqual([]);
  });
});

describe("isSlotAvailable", () => {
  it("aceita slot dentro do horário e sem conflito", () => {
    expect(
      isSlotAvailable({ start: 600, end: 630 }, WORK_9_18, []),
    ).toBe(true);
  });

  it("rejeita slot que ultrapassa o horário de trabalho", () => {
    expect(
      isSlotAvailable({ start: 1050, end: 1110 }, WORK_9_18, []),
    ).toBe(false);
  });

  it("rejeita slot que conflita com ocupação existente", () => {
    expect(
      isSlotAvailable({ start: 840, end: 870 }, WORK_9_18, [
        { start: 850, end: 880 },
      ]),
    ).toBe(false);
  });
});
