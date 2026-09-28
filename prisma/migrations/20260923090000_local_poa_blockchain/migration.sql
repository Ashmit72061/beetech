-- Honey Chain's local demo network commits every receipt to an explicit block.
-- Blocks are append-only and are attested by the configured local PoA validator.
CREATE TABLE "LedgerBlock" (
    "id" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "receiptId" TEXT NOT NULL,
    "eventHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "hash" TEXT NOT NULL,
    "validatorId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "consensus" TEXT NOT NULL DEFAULT 'LOCAL_POA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerBlock_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LedgerBlock_height_positive" CHECK ("height" > 0),
    CONSTRAINT "LedgerBlock_hash_format" CHECK ("hash" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "LedgerBlock_event_hash_format" CHECK ("eventHash" ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX "LedgerBlock_height_key" ON "LedgerBlock"("height");
CREATE UNIQUE INDEX "LedgerBlock_receiptId_key" ON "LedgerBlock"("receiptId");
CREATE UNIQUE INDEX "LedgerBlock_hash_key" ON "LedgerBlock"("hash");
CREATE INDEX "LedgerBlock_createdAt_idx" ON "LedgerBlock"("createdAt");

ALTER TABLE "LedgerBlock" ADD CONSTRAINT "LedgerBlock_receiptId_fkey"
FOREIGN KEY ("receiptId") REFERENCES "LedgerReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_ledger_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LedgerBlock is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_block_append_only
BEFORE UPDATE OR DELETE ON "LedgerBlock"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_block_mutation();
