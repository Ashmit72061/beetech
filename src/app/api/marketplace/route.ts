import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE", availableUnits: { gt: 0 } },
    include: { organization: { select: { name: true } }, batch: { select: { floralProfile: true } } },
    orderBy: { createdAt: "desc" },
  });
  const saved = session ? await db.listingSave.findMany({ where: { userId: session.userId }, select: { listingId: true } }) : [];
  return NextResponse.json({
    signedIn: Boolean(session), role: session?.role ?? null, saved: saved.map((item) => item.listingId),
    listings: listings.map((listing) => ({ id: listing.id, category: listing.category === "RAW_HONEY_BATCH" ? "Raw Honey Batch" : listing.category === "PACKAGED_HONEY" ? "Packaged Honey" : "Hive/Colony Asset", name: listing.name, seller: listing.organization.name, location: listing.location, price: listing.priceInr, unit: listing.unit, available: listing.available, floral: listing.floralProfile || listing.batch?.floralProfile || "Declared floral profile", rating: Number(listing.rating), description: listing.description, traceLabel: listing.traceLabel, status: listing.status === "ACTIVE" ? "Available" : listing.status, accent: listing.accent, availableUnits: listing.availableUnits })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { listingId?: string } | null;
  if (!body?.listingId) return NextResponse.json({ error: "Listing is required." }, { status: 400 });
  const existing = await db.listingSave.findUnique({ where: { userId_listingId: { userId: session.userId, listingId: body.listingId } } });
  if (existing) await db.listingSave.delete({ where: { userId_listingId: { userId: session.userId, listingId: body.listingId } } });
  else await db.listingSave.create({ data: { userId: session.userId, listingId: body.listingId } });
  return NextResponse.json({ saved: !existing });
}
