import { randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { insightFlags, telemetryInputSchema, telemetryQuerySchema } from "@/lib/telemetry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(error: string, status = 400) { return NextResponse.json({ error }, { status }); }

function authorized(request: Request, deviceId: string, hiveId: string) {
  const bindings = process.env.IOT_DEVICE_BINDINGS
    ? JSON.parse(process.env.IOT_DEVICE_BINDINGS) as Record<string, { token: string; hiveId: string }>
    : process.env.DEMO_MODE === "true" && process.env.IOT_INGEST_TOKEN
      ? Object.fromEntries(["08", "12", "15"].map((suffix) => [`demo-${suffix}`, { token: process.env.IOT_INGEST_TOKEN!, hiveId: `HC-HIVE-BK102-${suffix}` }]))
      : {};
  const binding = bindings[deviceId];
  const header = request.headers.get("authorization");
  if (!binding || binding.hiveId !== hiveId || !header?.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  const expectedBuffer = Buffer.from(binding.token);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: Request) {
  const parsed = telemetryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid telemetry payload.");
  const input = parsed.data;
  if (!authorized(request, input.deviceId, input.hiveId)) return fail("A bound device credential is required.", 401);
  if (input.capturedAt.getTime() > Date.now() + 5 * 60 * 1000 || input.capturedAt.getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000) return fail("capturedAt must be within the last 90 days and no more than five minutes ahead.");

  const hive = await db.hive.findUnique({ where: { id: input.hiveId }, select: { id: true } });
  if (!hive) return fail("Unknown hive identity.", 404);
  const existing = await db.telemetry.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return NextResponse.json({ accepted: true, idempotent: true, telemetryId: existing.id }, { status: 200 });

  try {
    const telemetry = await db.telemetry.create({ data: { id: `tel-${randomUUID()}`, ...input } });
    return NextResponse.json({ accepted: true, idempotent: false, telemetryId: telemetry.id }, { status: 201 });
  } catch (error) {
    // A concurrent retry can win the unique idempotency key after the read above.
    const retry = await db.telemetry.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (retry) return NextResponse.json({ accepted: true, idempotent: true, telemetryId: retry.id }, { status: 200 });
    throw error;
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["beekeeper", "admin"].includes(session.role)) return fail("Beekeeper or administrator session required.", 403);
  const parsed = telemetryQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return fail("Invalid telemetry query.");
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { organizationId: true } });
  const hiveWhere = session.role === "admin" ? {} : { organizationId: user.organizationId };
  const hives = await db.hive.findMany({ where: { ...hiveWhere, ...(parsed.data.hiveId ? { id: parsed.data.hiveId } : {}) }, select: { id: true, name: true, location: true } });
  const hiveIds = hives.map((hive) => hive.id);
  const readings = await db.telemetry.findMany({ where: { hiveId: { in: hiveIds } }, orderBy: { capturedAt: "desc" }, take: Math.max(hiveIds.length * (parsed.data.limit + 2), 100) });
  const byHive = new Map(hiveIds.map((id) => [id, readings.filter((reading) => reading.hiveId === id).slice(0, parsed.data.limit + 1)]));
  const hivesResponse = hives.map((hive) => {
    const series = byHive.get(hive.id) ?? [];
    const latest = series[0];
    const previous = series[1];
    return {
      ...hive,
      latest: latest ? { ...latest, temperatureC: Number(latest.temperatureC), humidityPct: Number(latest.humidityPct), weightKg: latest.weightKg === null ? null : Number(latest.weightKg), batteryPct: latest.batteryPct === null ? null : Number(latest.batteryPct), insights: insightFlags({ capturedAt: latest.capturedAt, temperatureC: Number(latest.temperatureC), humidityPct: Number(latest.humidityPct), weightKg: latest.weightKg === null ? null : Number(latest.weightKg), batteryPct: latest.batteryPct === null ? null : Number(latest.batteryPct) }, previous ? { capturedAt: previous.capturedAt, temperatureC: Number(previous.temperatureC), humidityPct: Number(previous.humidityPct), weightKg: previous.weightKg === null ? null : Number(previous.weightKg), batteryPct: previous.batteryPct === null ? null : Number(previous.batteryPct) } : undefined) } : null,
      trend: series.slice(0, parsed.data.limit).reverse().map((reading) => ({ capturedAt: reading.capturedAt, temperatureC: Number(reading.temperatureC), humidityPct: Number(reading.humidityPct), weightKg: reading.weightKg === null ? null : Number(reading.weightKg) })),
    };
  });
  return NextResponse.json({ generatedAt: new Date().toISOString(), insightMethod: "Deterministic demo thresholds, not machine-learned predictions.", hives: hivesResponse });
}
