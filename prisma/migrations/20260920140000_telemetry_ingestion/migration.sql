ALTER TABLE "Telemetry" ADD COLUMN "batteryPct" DECIMAL(5,2);
ALTER TABLE "Telemetry" ADD COLUMN "deviceId" TEXT;
ALTER TABLE "Telemetry" ADD COLUMN "idempotencyKey" TEXT;

UPDATE "Telemetry"
SET "deviceId" = 'legacy-' || "hiveId",
    "idempotencyKey" = 'legacy-' || "id";

ALTER TABLE "Telemetry" ALTER COLUMN "deviceId" SET NOT NULL;
ALTER TABLE "Telemetry" ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "Telemetry_idempotencyKey_key" ON "Telemetry"("idempotencyKey");
CREATE INDEX "Telemetry_deviceId_capturedAt_idx" ON "Telemetry"("deviceId", "capturedAt");
