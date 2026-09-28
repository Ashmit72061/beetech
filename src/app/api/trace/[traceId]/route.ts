import { NextResponse } from "next/server";
import { getPublicTrace } from "@/lib/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;
  const trace = await getPublicTrace(traceId);
  if (!trace) return NextResponse.json({ status: "unknown", traceId: traceId.trim().toUpperCase() }, { status: 404 });
  return NextResponse.json({ status: trace.integrity.valid ? "valid" : "tampered", trace });
}
