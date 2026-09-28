import { NextResponse } from "next/server";
import { getPublicCertificate } from "@/lib/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const certificate = await getPublicCertificate(number);
  if (!certificate) return NextResponse.json({ status: "unknown" }, { status: 404 });
  return NextResponse.json({ status: "valid", certificate });
}
