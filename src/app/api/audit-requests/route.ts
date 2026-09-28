import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ traceId: z.string().min(4).max(160), name: z.string().min(2).max(120), email: z.string().email(), reason: z.string().min(12).max(1000), consent: z.literal(true) });

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Provide a valid email, purpose, and consent." }, { status: 400 });
  const bottle = await db.bottle.findUnique({ where: { traceId: input.data.traceId.trim().toUpperCase() } });
  if (!bottle) return NextResponse.json({ error: "Bottle trace ID was not found." }, { status: 404 });
  const session = await getSession();
  const audit = await db.auditRequest.create({ data: { id: `HC-REQ-${randomUUID().slice(0, 8).toUpperCase()}`, requesterId: session?.userId, requesterOrganizationId: session ? (await db.user.findUnique({ where: { id: session.userId }, select: { organizationId: true } }))?.organizationId : null, traceId: bottle.traceId, name: input.data.name, email: input.data.email.toLowerCase(), reason: input.data.reason, consent: true } });
  return NextResponse.json({ id: audit.id, message: "Audit access request submitted for administrator review." });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const traceId = url.searchParams.get("trace")?.trim().toUpperCase();
  const session = await getSession();
  if (!traceId || !session) return NextResponse.json({ protected: false });
  const access = await db.auditRequest.findFirst({ where: { traceId, requesterId: session.userId, status: "APPROVED", expiresAt: { gt: new Date() } }, orderBy: { decidedAt: "desc" } });
  if (!access) return NextResponse.json({ protected: false });
  const bottle = await db.bottle.findUnique({ where: { traceId }, select: { id: true, batchId: true, processingRunId: true } });
  if (!bottle) return NextResponse.json({ protected: false });
  const events = await db.provenanceEvent.findMany({
    where: {
      batchId: bottle.batchId,
      AND: [
        { OR: [{ processingRunId: null }, { processingRunId: bottle.processingRunId }] },
        { OR: [{ bottleId: null }, { bottleId: bottle.id }] },
      ],
    },
    orderBy: { occurredAt: "asc" },
    select: { type: true, occurredAt: true, protectedData: true },
  });
  return NextResponse.json({ protected: true, expiresAt: access.expiresAt, events });
}
