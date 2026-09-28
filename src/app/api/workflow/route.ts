import { NextResponse } from "next/server";
import { z } from "zod";
import { BatchStatus, ListingCategory, ListingStatus } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { appendLedger, certificateHash, id, workflowState } from "@/lib/workflow";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("harvest"), name: z.string().min(3).max(120), floralProfile: z.string().min(2).max(100), origin: z.string().min(2).max(120), quantityKg: z.coerce.number().positive().max(10000) }),
  z.object({ action: z.literal("publishRaw"), batchId: z.string().min(3), priceInr: z.coerce.number().int().positive().max(100000) }),
  z.object({ action: z.literal("order"), listingId: z.string().min(3), quantity: z.coerce.number().int().positive().max(10000) }),
  z.object({ action: z.literal("startRun"), batchId: z.string().min(3), inputKg: z.coerce.number().positive().max(10000), method: z.string().min(3).max(300) }),
  z.object({ action: z.literal("requestTest"), runId: z.string().min(3), laboratoryId: z.string().min(3) }),
  z.object({ action: z.literal("reviewTest"), testId: z.string().min(3), decision: z.enum(["Approved", "Rejected"]), pollenProfile: z.string().min(2).max(100), moisturePct: z.coerce.number().min(0).max(100), adulteration: z.string().min(2).max(100), notes: z.string().max(1000).optional(), certificateNumber: z.string().min(3).max(100).optional() }),
  z.object({ action: z.literal("package"), runId: z.string().min(3), productName: z.string().min(3).max(120), netWeightGrams: z.coerce.number().int().positive().max(5000), count: z.coerce.number().int().min(1).max(24).default(1) }),
  z.object({ action: z.literal("publishPackaged"), bottleId: z.string().min(3), priceInr: z.coerce.number().int().positive().max(100000) }),
  z.object({ action: z.literal("decideAudit"), requestId: z.string().min(3), decision: z.enum(["APPROVED", "DENIED"]) }),
]);

function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }

export async function GET() {
  const actor = await getSession();
  if (!actor) return fail("Sign in required.", 401);
  return NextResponse.json(await workflowState(actor));
}

export async function POST(request: Request) {
  const actor = await getSession();
  if (!actor) return fail("Sign in required.", 401);
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Check the submitted workflow fields.");
  const input = parsed.data;
  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: actor.userId }, select: { organizationId: true, name: true } });
      const orgId = user.organizationId;
      if (input.action === "harvest") {
        if (actor.role !== "beekeeper") throw new Error("Only beekeeper accounts can record harvests.");
        const batchId = id("HC-BATCH");
        const batch = await tx.batch.create({ data: { id: batchId, producerId: orgId, name: input.name, floralProfile: input.floralProfile, origin: input.origin, harvestedAt: new Date(), quantityKg: input.quantityKg, status: BatchStatus.SEALED } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId, type: "HARVEST_RECORDED", publicSummary: `Harvest recorded: ${input.name}, ${input.quantityKg} kg from ${input.origin}.` });
        return { message: "Harvest batch recorded.", batchId: batch.id };
      }
      if (input.action === "publishRaw") {
        if (actor.role !== "beekeeper") throw new Error("Only beekeeper accounts can publish raw batches.");
        await tx.$queryRaw`SELECT id FROM "Batch" WHERE id = ${input.batchId} FOR UPDATE`;
        const batch = await tx.batch.findFirst({ where: { id: input.batchId, producerId: orgId } });
        if (!batch) throw new Error("You can only publish your organization’s batches.");
        const existing = await tx.listing.findFirst({ where: { batchId: batch.id, category: ListingCategory.RAW_HONEY_BATCH, status: { in: [ListingStatus.ACTIVE, ListingStatus.RESERVED] } } });
        if (existing) throw new Error("This batch already has an active raw honey listing.");
        const listing = await tx.listing.create({ data: { id: id("HC-RAW"), organizationId: orgId, batchId: batch.id, category: ListingCategory.RAW_HONEY_BATCH, name: batch.name, location: batch.origin, priceInr: input.priceInr, unit: "per kg", available: `${batch.quantityKg.toString()} kg available`, availableUnits: Math.floor(Number(batch.quantityKg)), floralProfile: batch.floralProfile, rating: 4.8, description: "Published from a sealed Honey Chain harvest batch.", traceLabel: "Material lineage", accent: "#b97321" } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId: batch.id, type: "RAW_LISTING_PUBLISHED", publicSummary: `Raw honey listing ${listing.id} published.` });
        return { message: "Raw honey listing published.", listingId: listing.id };
      }
      if (input.action === "order") {
        await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${input.listingId} FOR UPDATE`;
        const listing = await tx.listing.findUnique({ where: { id: input.listingId }, include: { batch: true, bottle: true } });
        if (!listing || listing.status !== ListingStatus.ACTIVE) throw new Error("This listing is unavailable.");
        if (listing.organizationId === orgId) throw new Error("You cannot order your own listing.");
        if (listing.category === ListingCategory.RAW_HONEY_BATCH && actor.role !== "manufacturer") throw new Error("Only manufacturers can procure raw honey batches.");
        if (listing.category === ListingCategory.PACKAGED_HONEY && actor.role !== "consumer") throw new Error("Packaged honey is available to consumer accounts in this demo.");
        const reserved = await tx.listing.updateMany({ where: { id: listing.id, status: ListingStatus.ACTIVE, availableUnits: { gte: input.quantity } }, data: { availableUnits: { decrement: input.quantity } } });
        if (!reserved.count) throw new Error("Requested quantity is unavailable.");
        const remaining = listing.availableUnits - input.quantity;
        await tx.listing.update({ where: { id: listing.id }, data: { available: listing.category === ListingCategory.PACKAGED_HONEY ? `${remaining} jars available` : `${remaining} kg available`, status: remaining === 0 ? ListingStatus.SOLD : ListingStatus.ACTIVE } });
        const order = await tx.order.create({ data: { id: id("HC-ORD"), listingId: listing.id, buyerId: actor.userId, quantity: input.quantity, totalInr: input.quantity * listing.priceInr, status: "CONFIRMED" } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId: listing.batchId ?? undefined, bottleId: listing.bottleId ?? undefined, type: listing.category === ListingCategory.PACKAGED_HONEY ? "TERMINAL_SALE" : "CUSTODY_TRANSFER", publicSummary: listing.category === ListingCategory.PACKAGED_HONEY ? `Consumer sale recorded for ${input.quantity} packaged unit(s).` : `Custody transfer initiated for ${input.quantity} kg of raw honey.`, protectedData: { orderId: order.id, buyerEmail: actor.email } });
        return { message: "Order confirmed and provenance recorded.", orderId: order.id };
      }
      if (input.action === "startRun") {
        if (actor.role !== "manufacturer") throw new Error("Only manufacturers can start processing runs.");
        await tx.$queryRaw`SELECT id FROM "Batch" WHERE id = ${input.batchId} FOR UPDATE`;
        const purchased = await tx.order.aggregate({ _sum: { quantity: true }, where: { buyerId: actor.userId, listing: { batchId: input.batchId, category: ListingCategory.RAW_HONEY_BATCH }, status: "CONFIRMED" } });
        if (!purchased._sum.quantity) throw new Error("Procure this raw batch before processing it.");
        const batch = await tx.batch.findUnique({ where: { id: input.batchId } });
        const consumed = await tx.processingRun.aggregate({ _sum: { inputKg: true }, where: { batchId: input.batchId, processorId: orgId } });
        const remainingPurchased = purchased._sum.quantity - Number(consumed._sum.inputKg ?? 0);
        if (!batch || input.inputKg > remainingPurchased) throw new Error("Processing input exceeds your remaining procured quantity.");
        const run = await tx.processingRun.create({ data: { id: id("HC-RUN"), batchId: batch.id, processorId: orgId, startedAt: new Date(), inputKg: input.inputKg, method: input.method } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId: batch.id, processingRunId: run.id, type: "PROCESSING_STARTED", publicSummary: `Processing run ${run.id} started with ${input.inputKg} kg input.` });
        return { message: "Processing run started.", runId: run.id };
      }
      if (input.action === "requestTest") {
        if (actor.role !== "manufacturer") throw new Error("Only manufacturers can request laboratory tests.");
        const run = await tx.processingRun.findFirst({ where: { id: input.runId, processorId: orgId } });
        const lab = await tx.organization.findFirst({ where: { id: input.laboratoryId, kind: "LABORATORY" } });
        if (!run || !lab) throw new Error("Choose your processing run and a registered laboratory.");
        const test = await tx.labTest.create({ data: { id: id("HC-LAB"), batchId: run.batchId, laboratoryId: lab.id, requestedAt: new Date(), pollenProfile: "Pending", moisturePct: 0, adulteration: "Pending", status: "Pending review" } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId: run.batchId, processingRunId: run.id, type: "LAB_TEST_REQUESTED", publicSummary: `Laboratory test ${test.id} requested from ${lab.name}.` });
        return { message: "Laboratory test requested.", testId: test.id };
      }
      if (input.action === "reviewTest") {
        if (actor.role !== "lab") throw new Error("Only laboratory accounts can review test results.");
        const test = await tx.labTest.findFirst({ where: { id: input.testId, laboratoryId: orgId } });
        if (!test) throw new Error("This test is not assigned to your laboratory.");
        const approved = input.decision === "Approved";
        await tx.labTest.update({ where: { id: test.id }, data: { pollenProfile: input.pollenProfile, moisturePct: input.moisturePct, adulteration: input.adulteration, notes: input.notes, status: input.decision, reviewedAt: new Date() } });
        if (approved) await tx.certificate.upsert({ where: { labTestId: test.id }, update: {}, create: { id: id("HC-CERT"), labTestId: test.id, number: input.certificateNumber || id("CERT"), issuedAt: new Date(), signer: user.name, sha256: certificateHash(input) } });
        await tx.batch.update({ where: { id: test.batchId }, data: { status: approved ? BatchStatus.LAB_APPROVED : BatchStatus.REJECTED } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId: test.batchId, type: approved ? "QUALITY_APPROVED" : "QUALITY_REJECTED", publicSummary: `Laboratory review ${approved ? "approved" : "rejected"} the batch.` });
        return { message: approved ? "Results approved and certificate issued." : "Results rejected and recorded." };
      }
      if (input.action === "package") {
        if (actor.role !== "manufacturer") throw new Error("Only manufacturers can package bottles.");
        await tx.$queryRaw`SELECT id FROM "ProcessingRun" WHERE id = ${input.runId} FOR UPDATE`;
        const run = await tx.processingRun.findFirst({ where: { id: input.runId, processorId: orgId }, include: { batch: true } });
        if (!run || run.batch.status !== BatchStatus.LAB_APPROVED) throw new Error("Only laboratory-approved material can be packaged.");
        const packaged = await tx.bottle.aggregate({ _sum: { netWeightGrams: true }, where: { processingRunId: run.id } });
        const availableGrams = Math.round(Number(run.outputKg ?? run.inputKg) * 1000) - (packaged._sum.netWeightGrams ?? 0);
        const totalGrams = input.netWeightGrams * input.count;
        if (totalGrams > availableGrams) throw new Error("Bottle run exceeds the remaining approved processing output.");
        const existing = await tx.bottle.findMany({ where: { batchId: run.batchId }, select: { traceId: true } });
        const serials = existing.map(({ traceId }) => Number(traceId.match(/-(\d{6})$/)?.[1] ?? 0));
        const firstSerial = Math.max(0, ...serials) + 1;
        const packagedAt = new Date();
        const traceIds: string[] = [];
        for (let offset = 0; offset < input.count; offset += 1) {
          const traceId = `${run.batchId}-${String(firstSerial + offset).padStart(6, "0")}`;
          const bottle = await tx.bottle.create({ data: { id: id("HC-BOTTLE"), traceId, batchId: run.batchId, processingRunId: run.id, productName: input.productName, netWeightGrams: input.netWeightGrams, packagedAt, bestBefore: new Date(packagedAt.getTime() + 1000 * 60 * 60 * 24 * 730) } });
          await appendLedger(tx, actor, { organizationId: orgId, batchId: run.batchId, processingRunId: run.id, bottleId: bottle.id, type: "BOTTLE_PACKAGED", publicSummary: `Bottle identity ${bottle.traceId} packaged, QR-enabled, and committed to the local blockchain.` });
          traceIds.push(traceId);
        }
        await tx.processingRun.update({ where: { id: run.id }, data: { completedAt: run.completedAt ?? packagedAt } });
        return { message: `${traceIds.length} unique bottle ${traceIds.length === 1 ? "identity" : "identities"} and QR ${traceIds.length === 1 ? "code" : "codes"} generated.`, traceId: traceIds[0], traceIds, batchId: run.batchId, verifyUrl: `/verify?trace=${encodeURIComponent(traceIds[0])}`, labelsUrl: `/labels?batch=${encodeURIComponent(run.batchId)}` };
      }
      if (input.action === "publishPackaged") {
        if (actor.role !== "manufacturer") throw new Error("Only manufacturers can publish packaged honey.");
        await tx.$queryRaw`SELECT id FROM "Bottle" WHERE id = ${input.bottleId} FOR UPDATE`;
        const bottle = await tx.bottle.findFirst({ where: { id: input.bottleId, processingRun: { processorId: orgId } }, include: { batch: true } });
        if (!bottle) throw new Error("You can only publish bottles packaged by your organization.");
        if (await tx.listing.findFirst({ where: { bottleId: bottle.id } })) throw new Error("This bottle already has a marketplace listing.");
        const listing = await tx.listing.create({ data: { id: id("HC-PACK"), organizationId: orgId, batchId: bottle.batchId, bottleId: bottle.id, category: ListingCategory.PACKAGED_HONEY, name: bottle.productName, location: "Jaipur, Rajasthan", priceInr: input.priceInr, unit: `${bottle.netWeightGrams} g jar`, available: "1 jar available", availableUnits: 1, floralProfile: bottle.batch.floralProfile, rating: 4.9, description: "A bottle-level traceable Honey Chain product.", traceLabel: "Bottle-to-source lineage", accent: "#e3ad38" } });
        await appendLedger(tx, actor, { organizationId: orgId, batchId: bottle.batchId, bottleId: bottle.id, type: "PACKAGED_LISTING_PUBLISHED", publicSummary: `Packaged honey listing ${listing.id} published.` });
        return { message: "Packaged honey published.", listingId: listing.id };
      }
      if (actor.role !== "admin") throw new Error("Only administrators can decide audit access.");
      const audit = await tx.auditRequest.update({ where: { id: input.requestId }, data: { status: input.decision, decidedAt: new Date(), expiresAt: input.decision === "APPROVED" ? new Date(Date.now() + 7 * 86400000) : null } });
      return { message: input.decision === "APPROVED" ? "Audit access approved for seven days." : "Audit access denied.", requestId: audit.id };
    });
    return NextResponse.json(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Workflow could not be completed.");
  }
}
