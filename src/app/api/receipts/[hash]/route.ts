import { NextResponse } from "next/server";
import { getPublicReceipt } from "@/lib/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const receipt = await getPublicReceipt(hash);
  if (!receipt) return NextResponse.json({ status: "unknown" }, { status: 404 });
  return NextResponse.json({ status: receipt.integrity.valid ? "valid" : "tampered", receipt });
}
