import QRCode from "qrcode";
import { db } from "@/lib/db";
import { verificationUrl } from "@/lib/qr";
import { normalizeTraceId } from "@/lib/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;
  const normalizedTraceId = normalizeTraceId(traceId);
  if (!(await db.bottle.findUnique({ where: { traceId: normalizedTraceId }, select: { id: true } }))) return new Response("Unknown Honey Chain trace ID", { status: 404 });
  let url: string;
  try {
    url = verificationUrl(normalizedTraceId);
  } catch {
    return new Response("QR generation is not configured", { status: 503 });
  }
  const png = await QRCode.toBuffer(url, { errorCorrectionLevel: "H", margin: 2, width: 512, color: { dark: "#164A36", light: "#FFFDF8" } });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Content-Disposition": `inline; filename="${normalizedTraceId}.png"`, "Cache-Control": "public, max-age=300", "X-Honey-Chain-QR-Payload": url },
  });
}
