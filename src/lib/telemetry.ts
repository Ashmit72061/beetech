import "server-only";

import { z } from "zod";

export const telemetryInputSchema = z.object({
  hiveId: z.string().trim().min(3).max(120),
  capturedAt: z.coerce.date(),
  temperatureC: z.coerce.number().finite().min(-10).max(60),
  humidityPct: z.coerce.number().finite().min(0).max(100),
  weightKg: z.coerce.number().finite().min(0).max(250).optional(),
  batteryPct: z.coerce.number().finite().min(0).max(100).optional(),
  deviceId: z.string().trim().min(3).max(100),
  source: z.enum(["sensor", "gateway", "simulator"]),
  idempotencyKey: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9._:-]+$/, "Use only letters, numbers, periods, underscores, colons, or hyphens."),
}).strict();

export const telemetryQuerySchema = z.object({
  hiveId: z.string().trim().min(3).max(120).optional(),
  limit: z.coerce.number().int().min(2).max(96).default(24),
});

export const TELEMETRY_STALE_MS = 30 * 60 * 1000;

export type Reading = { capturedAt: Date; temperatureC: number; humidityPct: number; weightKg: number | null; batteryPct: number | null };

export function insightFlags(latest: Reading, previous?: Reading) {
  const flags: { code: string; severity: "warning" | "critical"; message: string }[] = [];
  if (latest.humidityPct >= 70) flags.push({ code: "HIGH_HUMIDITY", severity: "warning", message: `Humidity is ${latest.humidityPct.toFixed(1)}%; check ventilation and moisture exposure.` });
  if (latest.temperatureC < 28 || latest.temperatureC > 36) flags.push({ code: "TEMPERATURE_EXCURSION", severity: "warning", message: `Temperature is ${latest.temperatureC.toFixed(1)} C, outside the 28-36 C demo range.` });
  if (latest.batteryPct !== null && latest.batteryPct <= 20) flags.push({ code: "LOW_BATTERY", severity: "warning", message: `Battery is ${latest.batteryPct.toFixed(0)}%; schedule a device check.` });
  if (previous?.weightKg !== null && latest.weightKg !== null && previous?.weightKg !== undefined && latest.weightKg <= previous.weightKg * 0.95) flags.push({ code: "RAPID_WEIGHT_LOSS", severity: "critical", message: `Weight fell ${(previous.weightKg - latest.weightKg).toFixed(1)} kg since the prior reading; inspect before acting.` });
  if (Date.now() - latest.capturedAt.getTime() > TELEMETRY_STALE_MS) flags.push({ code: "DEVICE_OFFLINE", severity: "critical", message: "No reading has arrived in 30 minutes; device may be offline or out of coverage." });
  return flags;
}
