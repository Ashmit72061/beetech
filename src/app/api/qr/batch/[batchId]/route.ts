import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificationUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const bottles = await db.bottle.findMany({ where: { batchId: batchId.trim().toUpperCase() }, orderBy: { traceId: "asc" }, select: { traceId: true, productName: true, netWeightGrams: true } });
  if (!bottles.length) return NextResponse.json({ status: "unknown" }, { status: 404 });
  try {
    return NextResponse.json({
      status: "ready",
      batchId: batchId.trim().toUpperCase(),
      count: bottles.length,
      bottles: bottles.map((bottle) => ({ ...bottle, verificationUrl: verificationUrl(bottle.traceId), qrPng: `/api/qr/${encodeURIComponent(bottle.traceId)}` })),
    });
  } catch {
    return NextResponse.json({ error: "QR generation is not configured." }, { status: 503 });
  }
}
