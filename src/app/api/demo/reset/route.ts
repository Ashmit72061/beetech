import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  if (process.env.DEMO_MODE !== "true") return NextResponse.json({ error: "Demo reset is unavailable outside the isolated demo environment." }, { status: 404 });
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  // This isolated demo database has a fixed schema and is only reset outside production.
  await db.$executeRawUnsafe('TRUNCATE TABLE "LedgerBlock", "LedgerReceipt", "ProvenanceEvent", "ListingSave", "Order", "Certificate", "LabTest", "Bottle", "ProcessingRun", "BatchHive", "Listing", "Telemetry", "Hive", "AuditRequest", "Anomaly", "Session", "Batch", "User", "Organization" CASCADE');
  const { seedDemo } = await import("../../../../../prisma/seed");
  await seedDemo(db);
  return NextResponse.json({ message: "Demo data reset to the deterministic seed." });
}
