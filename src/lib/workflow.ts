import "server-only";

import { createHash, randomUUID } from "crypto";
import { Prisma, type UserRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createBlockHash, createLedgerHash, createValidatorSignature, hashCanonicalValue, localValidator } from "@/lib/domain/ledger";

type Actor = { userId: string; email: string; person: string; role: string };
type Tx = Prisma.TransactionClient;

export function roleIs(actor: Actor, role: UserRole) {
  return actor.role === role;
}

export function id(prefix: string) {
  return `${prefix}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

async function actorOrganization(tx: Tx, actor: Actor) {
  const user = await tx.user.findUnique({ where: { id: actor.userId }, select: { organizationId: true } });
  if (!user) throw new Error("Your session is no longer valid.");
  return user.organizationId;
}

export async function appendLedger(tx: Tx, actor: Actor, data: { organizationId: string; batchId?: string; processingRunId?: string; bottleId?: string; type: string; publicSummary: string; protectedData?: Prisma.InputJsonValue }) {
  // Serializes sequence assignment and keeps the global hash chain contiguous.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(817263)`;
  const eventId = id("evt");
  const occurredAt = new Date();
  const event = await tx.provenanceEvent.create({ data: { id: eventId, organizationId: data.organizationId, actorId: actor.userId, batchId: data.batchId, processingRunId: data.processingRunId, bottleId: data.bottleId, type: data.type, occurredAt, publicSummary: data.publicSummary, protectedData: data.protectedData } });
  const latest = await tx.ledgerReceipt.findFirst({ orderBy: { sequence: "desc" }, select: { sequence: true, hash: true } });
  const payload = {
    eventId,
    organizationId: data.organizationId,
    actorId: actor.userId,
    type: data.type,
    occurredAt: occurredAt.toISOString(),
    publicSummary: data.publicSummary,
    ...(data.batchId ? { batchId: data.batchId } : {}),
    ...(data.processingRunId ? { processingRunId: data.processingRunId } : {}),
    ...(data.bottleId ? { bottleId: data.bottleId } : {}),
    ...(data.protectedData === undefined ? {} : { protectedDataHash: hashCanonicalValue(data.protectedData) }),
  };
  const previousHash = latest?.hash ?? null;
  const sequence = (latest?.sequence ?? 0) + 1;
  const receipt = await tx.ledgerReceipt.create({ data: { id: id("receipt"), sequence, organizationId: data.organizationId, actorId: actor.userId, provenanceEventId: event.id, payload, previousHash, hash: createLedgerHash(previousHash, payload), createdAt: occurredAt } });
  const latestBlock = await tx.ledgerBlock.findFirst({ orderBy: { height: "desc" }, select: { height: true, hash: true } });
  if (latestBlock && latestBlock.height !== sequence - 1) throw new Error("Local blockchain height is out of sync with the receipt ledger.");
  const validator = localValidator();
  const blockHeader = {
    height: sequence,
    receiptHash: receipt.hash,
    eventHash: hashCanonicalValue(payload),
    previousHash: latestBlock?.hash ?? null,
    validatorId: validator.id,
    createdAt: occurredAt.toISOString(),
  };
  const blockHash = createBlockHash(blockHeader);
  await tx.ledgerBlock.create({ data: { id: id("block"), height: sequence, receiptId: receipt.id, eventHash: blockHeader.eventHash, previousHash: blockHeader.previousHash, hash: blockHash, validatorId: validator.id, signature: createValidatorSignature(blockHash, validator.secret), createdAt: occurredAt } });
  return event;
}

export async function workflowState(actor: Actor) {
  const user = await db.user.findUniqueOrThrow({ where: { id: actor.userId }, select: { organizationId: true } });
  const [batches, runs, tests, bottles, orders, requests] = await Promise.all([
    db.batch.findMany({ where: actor.role === "beekeeper" ? { producerId: user.organizationId } : { OR: [{ processingRuns: { some: { processorId: user.organizationId } } }, { listings: { some: { orders: { some: { buyerId: actor.userId, status: "CONFIRMED" } } } } }] }, orderBy: { harvestedAt: "desc" }, take: 12 }),
    db.processingRun.findMany({ where: { processorId: user.organizationId }, include: { batch: true }, orderBy: { startedAt: "desc" }, take: 12 }),
    db.labTest.findMany({ where: actor.role === "lab" ? { laboratoryId: user.organizationId } : { batch: { processingRuns: { some: { processorId: user.organizationId } } } }, include: { batch: true, certificate: true }, orderBy: { requestedAt: "desc" }, take: 12 }),
    db.bottle.findMany({ where: { processingRun: { processorId: user.organizationId } }, orderBy: { packagedAt: "desc" }, take: 12 }),
    db.order.findMany({ where: { buyerId: actor.userId }, include: { listing: true }, orderBy: { createdAt: "desc" }, take: 12 }),
    actor.role === "admin" ? db.auditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 }) : Promise.resolve([]),
  ]);
  return { batches, runs, tests, bottles, orders, requests };
}

export const certificateHash = (input: unknown) => createHash("sha256").update(JSON.stringify(input)).digest("hex");

export async function organizationFor(actor: Actor) {
  return db.$transaction((tx) => actorOrganization(tx, actor));
}
