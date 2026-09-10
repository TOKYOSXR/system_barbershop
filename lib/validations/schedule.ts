import { z } from "zod";

const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:mm)");

export const workingHoursDaySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    active: z.boolean(),
    startTime: hhmm,
    endTime: hhmm,
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "O início deve ser antes do fim",
    path: ["endTime"],
  });

export const workingHoursSchema = z.object({
  barberId: z.string().min(1),
  days: z.array(workingHoursDaySchema).length(7),
});

export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;

export const blockedTimeSchema = z
  .object({
    barberId: z.string().min(1, "Selecione o barbeiro"),
    date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida"),
    startTime: hhmm,
    endTime: hhmm,
    reason: z.string().max(120).optional().or(z.literal("")),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "O início deve ser antes do fim",
    path: ["endTime"],
  });

export type BlockedTimeInput = z.infer<typeof blockedTimeSchema>;
export type BlockedTimeFormInput = z.input<typeof blockedTimeSchema>;
