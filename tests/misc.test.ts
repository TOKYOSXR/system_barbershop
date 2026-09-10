import { describe, it, expect } from "vitest";

import { buildMessage } from "@/lib/notifications/templates";
import { buildWhatsappLink } from "@/lib/notifications/whatsapp";
import { buildCSV } from "@/lib/csv";
import { buildICS } from "@/lib/ics";
import { resolvePeriod } from "@/lib/finance/period";
import { slugify } from "@/lib/utils";

const CTX = {
  customerName: "João Silva",
  barbershopName: "Barbearia X",
  serviceName: "Corte",
  barberName: "Carlos",
  dateLabel: "10/09/2026",
  timeLabel: "14:30",
};

describe("buildMessage", () => {
  it("usa o primeiro nome do cliente e inclui dados do agendamento", () => {
    const msg = buildMessage("APPOINTMENT_CONFIRMED", CTX);
    expect(msg).toContain("João");
    expect(msg).toContain("Barbearia X");
    expect(msg).toContain("14:30");
    expect(msg).not.toContain("Silva"); // só primeiro nome
  });

  it("gera lembrete", () => {
    expect(buildMessage("APPOINTMENT_REMINDER", CTX)).toContain("Lembrando");
  });
});

describe("buildWhatsappLink", () => {
  it("normaliza telefone e adiciona 55", () => {
    const link = buildWhatsappLink("(11) 99999-0000", "Olá");
    expect(link).toContain("https://wa.me/5511999990000");
    expect(link).toContain("text=Ol%C3%A1");
  });

  it("não duplica o 55 quando já presente", () => {
    const link = buildWhatsappLink("5511999990000", "oi");
    expect(link).toContain("wa.me/5511999990000");
  });
});

describe("buildCSV", () => {
  it("gera CSV com BOM, separador ; e cabeçalho", () => {
    const csv = buildCSV(
      [
        { key: "name", label: "Nome" },
        { key: "value", label: "Valor" },
      ],
      [{ name: "Corte", value: "40.00" }],
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Nome;Valor");
    expect(csv).toContain("Corte;40.00");
  });

  it("escapa campos com separador", () => {
    const csv = buildCSV([{ key: "a", label: "A" }], [{ a: "x;y" }]);
    expect(csv).toContain('"x;y"');
  });
});

describe("buildICS", () => {
  it("gera VCALENDAR válido", () => {
    const ics = buildICS({
      uid: "abc",
      title: "Corte",
      start: new Date("2026-09-10T17:30:00Z"),
      end: new Date("2026-09-10T18:00:00Z"),
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Corte");
    expect(ics).toContain("END:VCALENDAR");
  });
});

describe("resolvePeriod", () => {
  it("hoje é um intervalo de exatamente 1 dia", () => {
    const { from, to } = resolvePeriod("today");
    expect(to.getTime() - from.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("mês começa no dia 1", () => {
    const { from } = resolvePeriod("month");
    expect(from.getDate()).toBe(1);
  });
});

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Barbearia do João")).toBe("barbearia-do-joao");
  });
});
