-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BEEKEEPER', 'MANUFACTURER', 'LAB', 'CONSUMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationKind" AS ENUM ('PRODUCER_COLLECTIVE', 'MANUFACTURER', 'LABORATORY', 'CONSUMER', 'GOVERNANCE');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'SEALED', 'IN_TRANSIT', 'LAB_APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('HIVE_COLONY_ASSET', 'RAW_HONEY_BATCH', 'PACKAGED_HONEY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'RESERVED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "AnomalyStatus" AS ENUM ('OPEN_REVIEW', 'INVESTIGATING', 'RESOLVED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "OrganizationKind" NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hive" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "frameCount" INTEGER NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "temperatureC" DECIMAL(5,2) NOT NULL,
    "humidityPct" DECIMAL(5,2) NOT NULL,
    "weightKg" DECIMAL(7,2),
    "source" TEXT NOT NULL,

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floralProfile" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "harvestedAt" TIMESTAMP(3) NOT NULL,
    "quantityKg" DECIMAL(10,2) NOT NULL,
    "status" "BatchStatus" NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchHive" (
    "batchId" TEXT NOT NULL,
    "hiveId" TEXT NOT NULL,

    CONSTRAINT "BatchHive_pkey" PRIMARY KEY ("batchId","hiveId")
);

-- CreateTable
CREATE TABLE "ProcessingRun" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "inputKg" DECIMAL(10,2) NOT NULL,
    "outputKg" DECIMAL(10,2),
    "method" TEXT NOT NULL,

    CONSTRAINT "ProcessingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "laboratoryId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "pollenProfile" TEXT NOT NULL,
    "moisturePct" DECIMAL(5,2) NOT NULL,
    "adulteration" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "signer" TEXT NOT NULL,
    "documentUrl" TEXT,
    "sha256" TEXT NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bottle" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "processingRunId" TEXT,
    "productName" TEXT NOT NULL,
    "netWeightGrams" INTEGER NOT NULL,
    "packagedAt" TIMESTAMP(3) NOT NULL,
    "bestBefore" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bottle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hiveId" TEXT,
    "batchId" TEXT,
    "bottleId" TEXT,
    "category" "ListingCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "priceInr" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "available" TEXT NOT NULL,
    "floralProfile" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "description" TEXT NOT NULL,
    "traceLabel" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "accent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingSave" (
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingSave_pkey" PRIMARY KEY ("userId","listingId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalInr" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT,
    "requesterOrganizationId" TEXT,
    "traceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "status" "AuditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "AuditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "response" TEXT,
    "resolution" TEXT,
    "status" "AnomalyStatus" NOT NULL DEFAULT 'OPEN_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvenanceEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "batchId" TEXT,
    "processingRunId" TEXT,
    "bottleId" TEXT,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "publicSummary" TEXT NOT NULL,
    "protectedData" JSONB,

    CONSTRAINT "ProvenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerReceipt" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "provenanceEventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "previousHash" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Hive_organizationId_idx" ON "Hive"("organizationId");

-- CreateIndex
CREATE INDEX "Telemetry_hiveId_capturedAt_idx" ON "Telemetry"("hiveId", "capturedAt");

-- CreateIndex
CREATE INDEX "Batch_producerId_idx" ON "Batch"("producerId");

-- CreateIndex
CREATE INDEX "ProcessingRun_batchId_idx" ON "ProcessingRun"("batchId");

-- CreateIndex
CREATE INDEX "ProcessingRun_processorId_idx" ON "ProcessingRun"("processorId");

-- CreateIndex
CREATE INDEX "LabTest_batchId_idx" ON "LabTest"("batchId");

-- CreateIndex
CREATE INDEX "LabTest_laboratoryId_idx" ON "LabTest"("laboratoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_labTestId_key" ON "Certificate"("labTestId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_number_key" ON "Certificate"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Bottle_traceId_key" ON "Bottle"("traceId");

-- CreateIndex
CREATE INDEX "Bottle_batchId_idx" ON "Bottle"("batchId");

-- CreateIndex
CREATE INDEX "Listing_organizationId_idx" ON "Listing"("organizationId");

-- CreateIndex
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");

-- CreateIndex
CREATE INDEX "Order_listingId_idx" ON "Order"("listingId");

-- CreateIndex
CREATE INDEX "AuditRequest_traceId_email_idx" ON "AuditRequest"("traceId", "email");

-- CreateIndex
CREATE INDEX "Anomaly_organizationId_status_idx" ON "Anomaly"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ProvenanceEvent_batchId_occurredAt_idx" ON "ProvenanceEvent"("batchId", "occurredAt");

-- CreateIndex
CREATE INDEX "ProvenanceEvent_bottleId_occurredAt_idx" ON "ProvenanceEvent"("bottleId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerReceipt_sequence_key" ON "LedgerReceipt"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerReceipt_provenanceEventId_key" ON "LedgerReceipt"("provenanceEventId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerReceipt_hash_key" ON "LedgerReceipt"("hash");

-- CreateIndex
CREATE INDEX "LedgerReceipt_createdAt_idx" ON "LedgerReceipt"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hive" ADD CONSTRAINT "Hive_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchHive" ADD CONSTRAINT "BatchHive_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchHive" ADD CONSTRAINT "BatchHive_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRun" ADD CONSTRAINT "ProcessingRun_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRun" ADD CONSTRAINT "ProcessingRun_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bottle" ADD CONSTRAINT "Bottle_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bottle" ADD CONSTRAINT "Bottle_processingRunId_fkey" FOREIGN KEY ("processingRunId") REFERENCES "ProcessingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_hiveId_fkey" FOREIGN KEY ("hiveId") REFERENCES "Hive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSave" ADD CONSTRAINT "ListingSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingSave" ADD CONSTRAINT "ListingSave_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRequest" ADD CONSTRAINT "AuditRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRequest" ADD CONSTRAINT "AuditRequest_requesterOrganizationId_fkey" FOREIGN KEY ("requesterOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_processingRunId_fkey" FOREIGN KEY ("processingRunId") REFERENCES "ProcessingRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerReceipt" ADD CONSTRAINT "LedgerReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerReceipt" ADD CONSTRAINT "LedgerReceipt_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerReceipt" ADD CONSTRAINT "LedgerReceipt_provenanceEventId_fkey" FOREIGN KEY ("provenanceEventId") REFERENCES "ProvenanceEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ledger receipts are evidence records. Corrections require a new provenance event
-- and receipt rather than mutating or removing a prior link in the hash chain.
CREATE FUNCTION prevent_ledger_receipt_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LedgerReceipt is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_receipt_append_only
BEFORE UPDATE OR DELETE ON "LedgerReceipt"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_receipt_mutation();
