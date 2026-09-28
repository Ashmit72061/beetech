ALTER TABLE "Listing" ADD COLUMN "availableUnits" INTEGER NOT NULL DEFAULT 0;

UPDATE "Listing"
SET "availableUnits" = CASE
  WHEN "category" = 'HIVE_COLONY_ASSET' THEN 1
  WHEN "category" = 'RAW_HONEY_BATCH' THEN COALESCE((regexp_match("available", '([0-9]+)'))[1]::integer, 0)
  ELSE COALESCE((regexp_match("available", '([0-9]+)'))[1]::integer, 0)
END;

CREATE INDEX "Listing_status_category_idx" ON "Listing"("status", "category");
