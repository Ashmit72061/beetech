import "server-only";

import { canonicalize, createBlockHash, createLedgerHash, hashCanonicalValue, localValidator, verifyValidatorSignature } from "@/lib/domain/ledger";
import { db } from "@/lib/db";
import type { LedgerIntegrity, PublicTrace } from "@/lib/trace-types";

export const normalizeTraceId = (traceId: string) => traceId.trim().toUpperCase();

async function verifyLedger(): Promise<LedgerIntegrity> {
  const [receipts, eventCount, blockCount] = await Promise.all([
    db.ledgerReceipt.findMany({ orderBy: { sequence: "asc" }, include: { provenanceEvent: true, block: true } }),
    db.provenanceEvent.count(),
    db.ledgerBlock.count(),
  ]);
  const validator = localValidator();
  const result = (valid: boolean, checkedReceipts: number, checkedBlocks: number, failure?: string): LedgerIntegrity => ({
    valid,
    checkedReceipts,
    checkedBlocks,
    chainHeight: receipts.at(-1)?.sequence ?? 0,
    chainHead: receipts.at(-1)?.block?.hash ?? null,
    network: "Honey Chain Local PoA",
    consensus: "LOCAL_POA",
    validatorId: validator.id,
    ...(failure ? { failure } : {}),
  });
  if (!receipts.length) return result(false, 0, 0, "The local blockchain has no blocks.");
  if (eventCount !== receipts.length || blockCount !== receipts.length) return result(false, 0, 0, "Events, receipts, and blocks are not in one-to-one agreement.");

  let previousReceiptHash: string | null = null;
  let previousBlockHash: string | null = null;

  for (let index = 0; index < receipts.length; index += 1) {
    const receipt = receipts[index];
    const expectedHeight = index + 1;
    if (receipt.sequence !== expectedHeight) return result(false, index, index, `Receipt sequence ${receipt.sequence} is not contiguous.`);
    if (receipt.previousHash !== previousReceiptHash) {
      return result(false, index, index, `Receipt ${receipt.sequence} has an invalid previous hash.`);
    }
    if (createLedgerHash(previousReceiptHash, receipt.payload) !== receipt.hash) {
      return result(false, index, index, `Receipt ${receipt.sequence} does not match its payload.`);
    }
    const payload = receipt.payload as Record<string, unknown>;
    const event = receipt.provenanceEvent;
    const expected = {
      eventId: event.id,
      organizationId: event.organizationId,
      actorId: event.actorId,
      type: event.type,
      occurredAt: event.occurredAt.toISOString(),
      publicSummary: event.publicSummary,
      ...(event.batchId ? { batchId: event.batchId } : {}),
      ...(event.processingRunId ? { processingRunId: event.processingRunId } : {}),
      ...(event.bottleId ? { bottleId: event.bottleId } : {}),
      ...(event.protectedData === null ? {} : { protectedDataHash: hashCanonicalValue(event.protectedData) }),
    };
    if (canonicalize(payload) !== canonicalize(expected)) {
      return result(false, index, index, `Receipt ${receipt.sequence} is not bound to its provenance event.`);
    }
    if (receipt.organizationId !== event.organizationId || receipt.actorId !== event.actorId) return result(false, index, index, `Receipt ${receipt.sequence} metadata does not match its event.`);
    const block = receipt.block;
    if (!block || block.height !== expectedHeight || block.previousHash !== previousBlockHash || block.receiptId !== receipt.id) return result(false, index + 1, index, `Block ${expectedHeight} is missing or incorrectly linked.`);
    const eventHash = hashCanonicalValue(receipt.payload);
    if (block.eventHash !== eventHash) return result(false, index + 1, index, `Block ${expectedHeight} has an invalid event commitment.`);
    const blockHash = createBlockHash({ height: block.height, receiptHash: receipt.hash, eventHash, previousHash: block.previousHash, validatorId: block.validatorId, createdAt: block.createdAt.toISOString() });
    if (block.hash !== blockHash || block.validatorId !== validator.id || !verifyValidatorSignature(block.hash, block.signature, validator.secret)) return result(false, index + 1, index, `Block ${expectedHeight} failed validator attestation.`);
    previousReceiptHash = receipt.hash;
    previousBlockHash = block.hash;
  }
  return result(true, receipts.length, receipts.length);
}

export async function getPublicTrace(traceId: string): Promise<PublicTrace | null> {
  const normalizedTraceId = normalizeTraceId(traceId);
  const bottle = await db.bottle.findUnique({
    where: { traceId: normalizedTraceId },
    include: {
      processingRun: { include: { processor: true } },
      batch: {
        include: {
          producer: true,
          processingRuns: { include: { processor: true }, orderBy: { completedAt: "desc" }, take: 1 },
          labTests: { where: { status: "Approved" }, include: { laboratory: true, certificate: true }, orderBy: { reviewedAt: "desc" }, take: 1 },
          provenanceEvents: { include: { organization: true, receipt: { include: { block: true } } }, orderBy: { occurredAt: "asc" } },
        },
      },
    },
  });
  if (!bottle) return null;

  const [integrity] = await Promise.all([verifyLedger()]);
  const processing = bottle.processingRun ?? bottle.batch.processingRuns[0] ?? null;
  const labTest = bottle.batch.labTests[0] ?? null;
  const certificate = labTest?.certificate ?? null;
  const events = bottle.batch.provenanceEvents
    .filter((event) => (!event.processingRunId || event.processingRunId === processing?.id) && (!event.bottleId || event.bottleId === bottle.id))
    .sort((a, b) => (a.receipt?.sequence ?? Number.MAX_SAFE_INTEGER) - (b.receipt?.sequence ?? Number.MAX_SAFE_INTEGER));

  return {
    traceId: bottle.traceId,
    integrity,
    bottle: {
      productName: bottle.productName,
      netWeightGrams: bottle.netWeightGrams,
      packagedAt: bottle.packagedAt.toISOString(),
      bestBefore: bottle.bestBefore.toISOString(),
    },
    batch: {
      id: bottle.batch.id,
      name: bottle.batch.name,
      floralProfile: bottle.batch.floralProfile,
      origin: bottle.batch.origin,
      harvestedAt: bottle.batch.harvestedAt.toISOString(),
      producer: bottle.batch.producer.name,
    },
    processing: processing ? { method: processing.method, processor: processing.processor.name } : null,
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      occurredAt: event.occurredAt.toISOString(),
      publicSummary: event.publicSummary,
      organization: event.organization.name,
      receiptHash: event.receipt?.hash ?? null,
      block: event.receipt?.block ? {
        height: event.receipt.block.height,
        hash: event.receipt.block.hash,
        previousHash: event.receipt.block.previousHash,
        eventHash: event.receipt.block.eventHash,
        validatorId: event.receipt.block.validatorId,
        signature: event.receipt.block.signature,
        consensus: event.receipt.block.consensus,
      } : null,
    })),
    certificate: certificate && labTest ? {
      number: certificate.number,
      issuedAt: certificate.issuedAt.toISOString(),
      signer: certificate.signer,
      sha256: certificate.sha256,
      laboratory: labTest.laboratory.name,
      moisturePct: labTest.moisturePct.toString(),
      pollenProfile: labTest.pollenProfile,
      adulteration: labTest.adulteration,
      status: labTest.status,
      notes: labTest.notes,
    } : null,
  };
}

export async function getPublicReceipt(hash: string) {
  const receipt = await db.ledgerReceipt.findUnique({
    where: { hash: hash.toLowerCase() },
    include: { block: true, provenanceEvent: { include: { organization: true } } },
  });
  if (!receipt) return null;
  const integrity = await verifyLedger();
  return {
    sequence: receipt.sequence,
    hash: receipt.hash,
    previousHash: receipt.previousHash,
    createdAt: receipt.createdAt.toISOString(),
    payload: receipt.payload,
    block: receipt.block ? {
      height: receipt.block.height,
      hash: receipt.block.hash,
      previousHash: receipt.block.previousHash,
      eventHash: receipt.block.eventHash,
      validatorId: receipt.block.validatorId,
      signature: receipt.block.signature,
      consensus: receipt.block.consensus,
      createdAt: receipt.block.createdAt.toISOString(),
    } : null,
    event: {
      id: receipt.provenanceEvent.id,
      type: receipt.provenanceEvent.type,
      occurredAt: receipt.provenanceEvent.occurredAt.toISOString(),
      publicSummary: receipt.provenanceEvent.publicSummary,
      organization: receipt.provenanceEvent.organization.name,
    },
    integrity,
  };
}

export async function getPublicCertificate(number: string) {
  const certificate = await db.certificate.findUnique({
    where: { number },
    include: { labTest: { include: { laboratory: true, batch: true } } },
  });
  if (!certificate) return null;
  return {
    number: certificate.number,
    issuedAt: certificate.issuedAt.toISOString(),
    signer: certificate.signer,
    sha256: certificate.sha256,
    documentUrl: certificate.documentUrl,
    laboratory: certificate.labTest.laboratory.name,
    batchId: certificate.labTest.batch.id,
    pollenProfile: certificate.labTest.pollenProfile,
    moisturePct: certificate.labTest.moisturePct.toString(),
    adulteration: certificate.labTest.adulteration,
    status: certificate.labTest.status,
    notes: certificate.labTest.notes,
  };
}
