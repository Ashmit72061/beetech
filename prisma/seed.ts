import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { createBlockHash, createLedgerHash, createValidatorSignature, hashCanonicalValue, localValidator } from "../src/lib/domain/ledger";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed Honey Chain.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const at = (value: string) => new Date(`${value}Z`);

const organizations = [
  ["org-aravali", "Aravali Madhu Sakhi FPO", "PRODUCER_COLLECTIVE", "Dausa, Rajasthan"],
  ["org-vaishali", "Vaishali Bee Collective", "PRODUCER_COLLECTIVE", "Muzaffarpur, Bihar"],
  ["org-kumaon", "Kumaon Apiary Collective", "PRODUCER_COLLECTIVE", "Mukteshwar, Uttarakhand"],
  ["org-madhur", "Madhur Foods", "MANUFACTURER", "Jaipur, Rajasthan"],
  ["org-bharat", "Bharat Quality Labs", "LABORATORY", "Jaipur, Rajasthan"],
  ["org-consumer", "Independent buyer", "CONSUMER", "Bengaluru, Karnataka"],
  ["org-governance", "Honey Chain Governance Cell", "GOVERNANCE", "New Delhi"],
] as const;

const users = [
  ["user-asha", "org-aravali", "beekeeper@honeychain.in", "Asha Devi", "BEEKEEPER"],
  ["user-sunita", "org-vaishali", "sunita@honeychain.in", "Sunita Kumari", "BEEKEEPER"],
  ["user-devika", "org-kumaon", "devika@honeychain.in", "Devika Bisht", "BEEKEEPER"],
  ["user-rohan", "org-madhur", "manufacturer@honeychain.in", "Rohan Mehta", "MANUFACTURER"],
  ["user-neha", "org-bharat", "lab@honeychain.in", "Dr. Neha Kulkarni", "LAB"],
  ["user-kavya", "org-consumer", "consumer@honeychain.in", "Kavya Nair", "CONSUMER"],
  ["user-vikram", "org-governance", "admin@honeychain.in", "Vikram Singh", "ADMIN"],
] as const;

const hives = [
  ["HC-HIVE-BK102-08", "org-aravali", "Hive 08", "Apis cerana", "Rajgarh, Rajasthan", 8, "Health checked", "2026-08-01T08:00:00"],
  ["HC-HIVE-BK102-12", "org-aravali", "Hive 12", "Apis cerana", "Rajgarh, Rajasthan", 8, "Healthy", "2026-08-01T08:00:00"],
  ["HC-HIVE-BK102-15", "org-aravali", "Hive 15", "Apis cerana", "Rajgarh, Rajasthan", 8, "Healthy", "2026-08-01T08:00:00"],
  ["HC-HIVE-BK228-04", "org-vaishali", "Litchi Grove Hive 04", "Apis mellifera", "Bochaha, Bihar", 10, "Healthy", "2026-07-20T08:00:00"],
  ["HC-HIVE-BK228-09", "org-vaishali", "Litchi Grove Hive 09", "Apis mellifera", "Bochaha, Bihar", 10, "Healthy", "2026-07-20T08:00:00"],
  ["HC-HIVE-BK117-02", "org-kumaon", "Orchard Hive 02", "Apis cerana", "Mukteshwar, Uttarakhand", 8, "Healthy", "2026-07-12T08:00:00"],
  ["HC-HIVE-BK117-07", "org-kumaon", "Orchard Hive 07", "Apis cerana", "Mukteshwar, Uttarakhand", 8, "Health checked", "2026-07-12T08:00:00"],
] as const;

const batches = [
  ["HC-BK102-B260906-03", "org-aravali", "Wild forest raw honey", "Wild neem & acacia", "Rajgarh, Rajasthan", "2026-09-06T07:42:00", 186, "LAB_APPROVED", ["HC-HIVE-BK102-08", "HC-HIVE-BK102-12", "HC-HIVE-BK102-15"]],
  ["HC-BK228-B260902-01", "org-vaishali", "Litchi blossom raw honey", "Litchi blossom", "Muzaffarpur, Bihar", "2026-09-02T05:55:00", 94, "LAB_APPROVED", ["HC-HIVE-BK228-04", "HC-HIVE-BK228-09"]],
  ["HC-BK117-B260824-01", "org-kumaon", "Himalayan multi-flora raw honey", "Rhododendron & Himalayan clover", "Mukteshwar, Uttarakhand", "2026-08-24T06:20:00", 84, "LAB_APPROVED", ["HC-HIVE-BK117-02", "HC-HIVE-BK117-07"]],
] as const;

const runs = [
  ["HC-MF221-R260912-02", "HC-BK102-B260906-03", "org-madhur", "2026-09-12T08:15:00", "2026-09-12T09:24:00", 170, 168.4, "Slow filtered and bottled"],
  ["HC-MF228-R260906-01", "HC-BK228-B260902-01", "org-madhur", "2026-09-06T08:30:00", "2026-09-06T10:10:00", 80, 78.8, "Low-temperature settling and fine filtration"],
  ["HC-MF117-R260829-01", "HC-BK117-B260824-01", "org-madhur", "2026-08-29T08:00:00", "2026-08-29T09:30:00", 74, 72.9, "Controlled dehumidification and cold filtration"],
] as const;

const tests = [
  ["BQL-REQ-884", "HC-BK102-B260906-03", "2026-09-09T10:24:00", "2026-09-10T17:05:00", "Wild neem and acacia consistent", 17.4, "Not detected", "Approved", "Pollen spectrum is consistent with the declared forage."],
  ["BQL-REQ-881", "HC-BK228-B260902-01", "2026-09-03T15:00:00", "2026-09-04T16:20:00", "Litchi blossom dominant", 18.1, "Not detected", "Approved", "Monofloral profile matches the Bihar litchi belt."],
  ["BQL-REQ-841", "HC-BK117-B260824-01", "2026-08-25T16:00:00", "2026-08-26T16:40:00", "Rhododendron and clover consistent", 19.6, "Not detected", "Rejected", "Moisture exceeded the demo acceptance threshold; lot held for remediation."],
  ["BQL-REQ-863", "HC-BK117-B260824-01", "2026-08-27T13:00:00", "2026-08-28T15:10:00", "Rhododendron and clover consistent", 17.8, "Not detected", "Approved", "Retest passed after documented moisture remediation."],
] as const;

const certificates = [
  ["cert-bql-884", "BQL-REQ-884", "BQL-26-0910-884", "2026-09-10T17:05:00", "e19cd64517d03b8fd836fb164a96e09f18d5e5b42d25bf2f0c5bcdf1352a6b93"],
  ["cert-bql-881", "BQL-REQ-881", "BQL-26-0904-881", "2026-09-04T16:20:00", "19540b891916bbaa1c8dbd72d67abbad9a43da9aa2ac3d06067081d02193014e"],
  ["cert-bql-863", "BQL-REQ-863", "BQL-26-0828-863", "2026-08-28T15:10:00", "32b7feedd00486381957bb55a3267cb50f155ec5a1b998502e1090837f37bfb7"],
] as const;

const bottles = [
  ["bottle-000347", "HC-BK102-B260906-03-000347", "HC-BK102-B260906-03", "HC-MF221-R260912-02", "Wild Forest Honey", 500, "2026-09-12T09:24:00", "2028-03-11T00:00:00"],
  ["bottle-000348", "HC-BK102-B260906-03-000348", "HC-BK102-B260906-03", "HC-MF221-R260912-02", "Wild Forest Honey", 500, "2026-09-12T09:25:00", "2028-03-11T00:00:00"],
  ["bottle-000349", "HC-BK102-B260906-03-000349", "HC-BK102-B260906-03", "HC-MF221-R260912-02", "Wild Forest Honey", 250, "2026-09-12T09:26:00", "2028-03-11T00:00:00"],
  ["bottle-000101", "HC-BK228-B260902-01-000101", "HC-BK228-B260902-01", "HC-MF228-R260906-01", "Litchi Blossom Honey", 350, "2026-09-06T10:11:00", "2028-03-05T00:00:00"],
  ["bottle-000102", "HC-BK228-B260902-01-000102", "HC-BK228-B260902-01", "HC-MF228-R260906-01", "Litchi Blossom Honey", 350, "2026-09-06T10:12:00", "2028-03-05T00:00:00"],
  ["bottle-000201", "HC-BK117-B260824-01-000201", "HC-BK117-B260824-01", "HC-MF117-R260829-01", "Himalayan Multi-flora Honey", 500, "2026-08-29T09:31:00", "2028-02-28T00:00:00"],
  ["bottle-000202", "HC-BK117-B260824-01-000202", "HC-BK117-B260824-01", "HC-MF117-R260829-01", "Himalayan Multi-flora Honey", 500, "2026-08-29T09:32:00", "2028-02-28T00:00:00"],
] as const;

type SeedEvent = { id: string; organizationId: string; actorId: string; batchId: string; processingRunId?: string; bottleId?: string; type: string; occurredAt: string; publicSummary: string };
const event = (id: string, organizationId: string, actorId: string, batchId: string, type: string, occurredAt: string, publicSummary: string, processingRunId?: string, bottleId?: string): SeedEvent => ({ id, organizationId, actorId, batchId, type, occurredAt, publicSummary, ...(processingRunId ? { processingRunId } : {}), ...(bottleId ? { bottleId } : {}) });
const events: SeedEvent[] = [
  event("evt-uk-harvest", "org-kumaon", "user-devika", "HC-BK117-B260824-01", "HARVEST_RECORDED", "2026-08-24T06:20:00", "Himalayan multi-flora harvest recorded from registered orchard hives."),
  event("evt-uk-sealed", "org-kumaon", "user-devika", "HC-BK117-B260824-01", "BATCH_SEALED", "2026-08-24T10:05:00", "Batch sealed with source hives and field measurements linked."),
  event("evt-uk-custody", "org-madhur", "user-rohan", "HC-BK117-B260824-01", "CUSTODY_RECEIVED", "2026-08-25T14:10:00", "Processor received 80 kg with seals intact."),
  event("evt-uk-rejected", "org-bharat", "user-neha", "HC-BK117-B260824-01", "QUALITY_REJECTED", "2026-08-26T16:40:00", "Initial laboratory review held the batch at 19.6% moisture."),
  event("evt-uk-remediation", "org-madhur", "user-rohan", "HC-BK117-B260824-01", "REMEDIATION_RECORDED", "2026-08-27T11:15:00", "Controlled dehumidification completed and a fresh specimen submitted.", "HC-MF117-R260829-01"),
  event("evt-uk-approved", "org-bharat", "user-neha", "HC-BK117-B260824-01", "QUALITY_APPROVED", "2026-08-28T15:10:00", "Retest approved at 17.8% moisture; adulteration screen not detected."),
  event("evt-uk-processed", "org-madhur", "user-rohan", "HC-BK117-B260824-01", "PROCESSING_COMPLETED", "2026-08-29T09:30:00", "Cold filtration completed with 72.9 kg output.", "HC-MF117-R260829-01"),
  event("evt-uk-bottle-201", "org-madhur", "user-rohan", "HC-BK117-B260824-01", "BOTTLE_PACKAGED", "2026-08-29T09:31:00", "Bottle 000201 packaged and QR-enabled.", "HC-MF117-R260829-01", "bottle-000201"),
  event("evt-uk-bottle-202", "org-madhur", "user-rohan", "HC-BK117-B260824-01", "BOTTLE_PACKAGED", "2026-08-29T09:32:00", "Bottle 000202 packaged and QR-enabled.", "HC-MF117-R260829-01", "bottle-000202"),
  event("evt-br-harvest", "org-vaishali", "user-sunita", "HC-BK228-B260902-01", "HARVEST_RECORDED", "2026-09-02T05:55:00", "Peak-bloom litchi harvest recorded from two registered hives."),
  event("evt-br-sealed", "org-vaishali", "user-sunita", "HC-BK228-B260902-01", "BATCH_SEALED", "2026-09-02T10:10:00", "Litchi honey batch sealed in food-grade drums."),
  event("evt-br-custody", "org-madhur", "user-rohan", "HC-BK228-B260902-01", "CUSTODY_RECEIVED", "2026-09-03T13:30:00", "Processor received 90 kg and confirmed seal integrity."),
  event("evt-br-approved", "org-bharat", "user-neha", "HC-BK228-B260902-01", "QUALITY_APPROVED", "2026-09-04T16:20:00", "Litchi pollen profile confirmed; adulteration screen not detected."),
  event("evt-br-processed", "org-madhur", "user-rohan", "HC-BK228-B260902-01", "PROCESSING_COMPLETED", "2026-09-06T10:10:00", "Low-temperature settling and filtration completed.", "HC-MF228-R260906-01"),
  event("evt-br-bottle-101", "org-madhur", "user-rohan", "HC-BK228-B260902-01", "BOTTLE_PACKAGED", "2026-09-06T10:11:00", "Bottle 000101 packaged and QR-enabled.", "HC-MF228-R260906-01", "bottle-000101"),
  event("evt-br-bottle-102", "org-madhur", "user-rohan", "HC-BK228-B260902-01", "BOTTLE_PACKAGED", "2026-09-06T10:12:00", "Bottle 000102 packaged and QR-enabled.", "HC-MF228-R260906-01", "bottle-000102"),
  event("evt-harvest", "org-aravali", "user-asha", "HC-BK102-B260906-03", "HARVEST_RECORDED", "2026-09-06T07:42:00", "Harvest recorded: Wild forest forage linked to registered hives in Dausa district."),
  event("evt-sealed", "org-aravali", "user-asha", "HC-BK102-B260906-03", "BATCH_SEALED", "2026-09-06T11:18:00", "Batch HC-BK102-B260906-03 sealed from Hives 08, 12 and 15."),
  event("evt-custody", "org-madhur", "user-rohan", "HC-BK102-B260906-03", "CUSTODY_RECEIVED", "2026-09-08T15:36:00", "Custody received: seal integrity confirmed at Jaipur processing unit."),
  event("evt-quality", "org-bharat", "user-neha", "HC-BK102-B260906-03", "QUALITY_APPROVED", "2026-09-10T17:05:00", "Quality approved: moisture 17.4%; adulteration screen not detected."),
  event("evt-rj-processed", "org-madhur", "user-rohan", "HC-BK102-B260906-03", "PROCESSING_COMPLETED", "2026-09-12T09:20:00", "Slow filtration completed with recorded process loss.", "HC-MF221-R260912-02"),
  event("evt-bottled", "org-madhur", "user-rohan", "HC-BK102-B260906-03", "BOTTLE_PACKAGED", "2026-09-12T09:24:00", "Bottle 000347 issued and tamper-evident proof committed.", "HC-MF221-R260912-02", "bottle-000347"),
  event("evt-rj-bottle-348", "org-madhur", "user-rohan", "HC-BK102-B260906-03", "BOTTLE_PACKAGED", "2026-09-12T09:25:00", "Bottle 000348 packaged and QR-enabled.", "HC-MF221-R260912-02", "bottle-000348"),
  event("evt-rj-bottle-349", "org-madhur", "user-rohan", "HC-BK102-B260906-03", "BOTTLE_PACKAGED", "2026-09-12T09:26:00", "Bottle 000349 packaged and QR-enabled.", "HC-MF221-R260912-02", "bottle-000349"),
];

function payloadFor(item: SeedEvent) {
  return { eventId: item.id, organizationId: item.organizationId, actorId: item.actorId, type: item.type, occurredAt: at(item.occurredAt).toISOString(), publicSummary: item.publicSummary, batchId: item.batchId, ...(item.processingRunId ? { processingRunId: item.processingRunId } : {}), ...(item.bottleId ? { bottleId: item.bottleId } : {}) };
}

export async function seedDemo(client: PrismaClient) {
  const passwordHash = await bcrypt.hash("honey123", 12);
  for (const [id, name, kind, location] of organizations) await client.organization.upsert({ where: { id }, update: {}, create: { id, name, kind, location } });
  for (const [id, organizationId, email, name, role] of users) await client.user.upsert({ where: { email }, update: {}, create: { id, organizationId, email, name, role: role as UserRole, passwordHash } });
  for (const [id, organizationId, name, species, location, frameCount, healthStatus, registeredAt] of hives) await client.hive.upsert({ where: { id }, update: {}, create: { id, organizationId, name, species, location, frameCount, healthStatus, registeredAt: at(registeredAt) } });

  const telemetryNow = Date.now();
  const telemetryRows = [
    ["telemetry-hive08-current", "HC-HIVE-BK102-08", 12, 34.8, 31.4, 58.2, 82],
    ["telemetry-hive08-prior", "HC-HIVE-BK102-08", 42, 35.4, 31.0, 57.5, 83],
    ["telemetry-hive12-current", "HC-HIVE-BK102-12", 10, 33.9, 31.1, 78.5, 19],
    ["telemetry-hive12-prior", "HC-HIVE-BK102-12", 40, 34.0, 30.8, 60.2, 20],
    ["telemetry-hive15-offline", "HC-HIVE-BK102-15", 180, 30.7, 30.5, 56.1, 67],
  ] as const;
  for (const [id, hiveId, minutesAgo, weightKg, temperatureC, humidityPct, batteryPct] of telemetryRows) await client.telemetry.upsert({ where: { id }, update: {}, create: { id, hiveId, capturedAt: new Date(telemetryNow - minutesAgo * 60000), temperatureC, humidityPct, weightKg, batteryPct, deviceId: `demo-${hiveId.slice(-2)}`, source: "seed", idempotencyKey: `seed-${id}` } });

  for (const [id, producerId, name, floralProfile, origin, harvestedAt, quantityKg, status, hiveIds] of batches) {
    await client.batch.upsert({ where: { id }, update: {}, create: { id, producerId, name, floralProfile, origin, harvestedAt: at(harvestedAt), quantityKg, status } });
    for (const hiveId of hiveIds) await client.batchHive.upsert({ where: { batchId_hiveId: { batchId: id, hiveId } }, update: {}, create: { batchId: id, hiveId } });
  }

  const rawListings = [
    ["HC-BK102-B260906-03", "org-aravali", "HC-BK102-B260906-03", "Wild forest raw honey", "Rajgarh, Rajasthan", 385, 10, "Wild neem & acacia", "#b97321"],
    ["HC-BK228-B260902-01", "org-vaishali", "HC-BK228-B260902-01", "Litchi blossom raw honey", "Muzaffarpur, Bihar", 410, 4, "Litchi blossom", "#edbe52"],
    ["HC-BK117-B260824-01", "org-kumaon", "HC-BK117-B260824-01", "Himalayan multi-flora raw honey", "Mukteshwar, Uttarakhand", 430, 4, "Rhododendron & Himalayan clover", "#c98c2f"],
  ] as const;
  for (const [id, organizationId, batchId, name, location, priceInr, availableUnits, floralProfile, accent] of rawListings) await client.listing.upsert({ where: { id }, update: {}, create: { id, organizationId, batchId, category: "RAW_HONEY_BATCH", name, location, priceInr, unit: "per kg", available: `${availableUnits} kg available`, availableUnits, floralProfile, rating: 4.8, description: "Registered source batch with complete material lineage and custody evidence.", traceLabel: "Material lineage", accent } });

  const acquisitionOrders = [
    ["HC-ORD-SEED-RJ-01", "HC-BK102-B260906-03", 176, 67760, "2026-09-08T15:36:00"],
    ["HC-ORD-SEED-BR-01", "HC-BK228-B260902-01", 90, 36900, "2026-09-03T13:30:00"],
    ["HC-ORD-SEED-UK-01", "HC-BK117-B260824-01", 80, 34400, "2026-08-25T14:10:00"],
  ] as const;
  for (const [id, listingId, quantity, totalInr, createdAt] of acquisitionOrders) await client.order.upsert({ where: { id }, update: {}, create: { id, listingId, buyerId: "user-rohan", quantity, totalInr, status: "CONFIRMED", createdAt: at(createdAt) } });

  for (const [id, batchId, processorId, startedAt, completedAt, inputKg, outputKg, method] of runs) await client.processingRun.upsert({ where: { id }, update: {}, create: { id, batchId, processorId, startedAt: at(startedAt), completedAt: at(completedAt), inputKg, outputKg, method } });
  for (const [id, batchId, requestedAt, reviewedAt, pollenProfile, moisturePct, adulteration, status, notes] of tests) await client.labTest.upsert({ where: { id }, update: {}, create: { id, batchId, laboratoryId: "org-bharat", requestedAt: at(requestedAt), reviewedAt: at(reviewedAt), pollenProfile, moisturePct, adulteration, status, notes } });
  for (const [id, labTestId, number, issuedAt, sha256] of certificates) await client.certificate.upsert({ where: { number }, update: {}, create: { id, labTestId, number, issuedAt: at(issuedAt), signer: "Dr. Neha Kulkarni", sha256 } });
  for (const [id, traceId, batchId, processingRunId, productName, netWeightGrams, packagedAt, bestBefore] of bottles) await client.bottle.upsert({ where: { traceId }, update: {}, create: { id, traceId, batchId, processingRunId, productName, netWeightGrams, packagedAt: at(packagedAt), bestBefore: at(bestBefore) } });

  const packagedListings = [
    ["HC-MF221-P260912-02", "bottle-000347", "HC-BK102-B260906-03", "Wild Forest Honey", "Jaipur, Rajasthan", 449, "500 g jar", "Wild neem & acacia", "#e3ad38"],
    ["HC-MF228-P260906-01", "bottle-000101", "HC-BK228-B260902-01", "Litchi Blossom Honey", "Jaipur, Rajasthan", 379, "350 g jar", "Litchi blossom", "#edbe52"],
    ["HC-MF117-P260829-01", "bottle-000201", "HC-BK117-B260824-01", "Himalayan Multi-flora Honey", "Jaipur, Rajasthan", 525, "500 g jar", "Rhododendron & Himalayan clover", "#c98c2f"],
  ] as const;
  for (const [id, bottleId, batchId, name, location, priceInr, unit, floralProfile, accent] of packagedListings) await client.listing.upsert({ where: { id }, update: {}, create: { id, organizationId: "org-madhur", bottleId, batchId, category: "PACKAGED_HONEY", name, location, priceInr, unit, available: "1 jar available", availableUnits: 1, floralProfile, rating: 4.9, description: "Lab-approved honey with bottle-level QR provenance and local blockchain proof.", traceLabel: "Bottle-to-source lineage", accent } });
  await client.listing.upsert({ where: { id: "HC-ASSET-RJ-BK102-H08" }, update: {}, create: { id: "HC-ASSET-RJ-BK102-H08", organizationId: "org-aravali", hiveId: "HC-HIVE-BK102-08", category: "HIVE_COLONY_ASSET", name: "Apis cerana colony · Hive 08", location: "Dausa, Rajasthan", priceInr: 6800, unit: "per colony", available: "1 registered colony", availableUnits: 1, floralProfile: "Mustard & wild neem", rating: 4.9, description: "Queen-right eight-frame colony with recent health inspection and ownership record.", traceLabel: "Asset ownership history", accent: "#d89a24" } });

  for (const item of events.sort((a, b) => at(a.occurredAt).getTime() - at(b.occurredAt).getTime() || a.id.localeCompare(b.id))) {
    await client.provenanceEvent.upsert({ where: { id: item.id }, update: {}, create: { id: item.id, organizationId: item.organizationId, actorId: item.actorId, batchId: item.batchId, processingRunId: item.processingRunId, bottleId: item.bottleId, type: item.type, occurredAt: at(item.occurredAt), publicSummary: item.publicSummary } });
  }

  let latestReceipt = await client.ledgerReceipt.findFirst({ orderBy: { sequence: "desc" }, select: { sequence: true, hash: true } });
  for (const item of events) {
    if (await client.ledgerReceipt.findUnique({ where: { provenanceEventId: item.id } })) continue;
    const payload = payloadFor(item);
    const previousHash = latestReceipt?.hash ?? null;
    const sequence = (latestReceipt?.sequence ?? 0) + 1;
    const hash = createLedgerHash(previousHash, payload);
    await client.ledgerReceipt.create({ data: { id: `receipt-${item.id}`, sequence, organizationId: item.organizationId, actorId: item.actorId, provenanceEventId: item.id, payload, previousHash, hash, createdAt: at(item.occurredAt) } });
    latestReceipt = { sequence, hash };
  }

  const validator = localValidator();
  const receipts = await client.ledgerReceipt.findMany({ orderBy: { sequence: "asc" }, include: { block: true } });
  let previousBlockHash: string | null = null;
  for (const receipt of receipts) {
    if (receipt.block) { previousBlockHash = receipt.block.hash; continue; }
    const header = { height: receipt.sequence, receiptHash: receipt.hash, eventHash: hashCanonicalValue(receipt.payload), previousHash: previousBlockHash, validatorId: validator.id, createdAt: receipt.createdAt.toISOString() };
    const hash = createBlockHash(header);
    await client.ledgerBlock.create({ data: { id: `block-${receipt.sequence}`, height: receipt.sequence, receiptId: receipt.id, eventHash: header.eventHash, previousHash: previousBlockHash, hash, validatorId: validator.id, signature: createValidatorSignature(hash, validator.secret), createdAt: receipt.createdAt } });
    previousBlockHash = hash;
  }

  await client.auditRequest.upsert({ where: { id: "HC-REQ-26194" }, update: {}, create: { id: "HC-REQ-26194", requesterId: "user-kavya", requesterOrganizationId: "org-consumer", traceId: "HC-BK102-B260906-03-000347", name: "Kavya Nair", email: "consumer@honeychain.in", reason: "Reviewing purchase provenance for a resident welfare association sourcing report.", consent: true, status: "PENDING", createdAt: at("2026-09-15T09:26:00") } });
  await client.anomaly.upsert({ where: { id: "HC-ANM-0472" }, update: {}, create: { id: "HC-ANM-0472", organizationId: "org-madhur", subjectId: "HC-BK117-B260824-01", title: "Initial moisture threshold breach", priority: "High", summary: "Initial laboratory review measured 19.6% moisture and rejected the batch.", response: "Lot held; controlled dehumidification and a fresh specimen were recorded.", resolution: "Retest BQL-REQ-863 measured 17.8%; approval preceded processing.", status: "RESOLVED", createdAt: at("2026-08-26T16:40:00"), resolvedAt: at("2026-08-28T15:10:00") } });
  await client.anomaly.upsert({ where: { id: "HC-ANM-0468" }, update: {}, create: { id: "HC-ANM-0468", organizationId: "org-madhur", subjectId: "HC-BK228-B260902-01-000102", title: "Repeated QR scan pattern", priority: "Medium", summary: "One bottle identity was checked in three distant districts within four hours.", response: "Distributor route and retail inventory requested.", status: "INVESTIGATING", createdAt: at("2026-09-13T12:00:00") } });
}

if (process.argv[1]?.includes("prisma/seed")) {
  seedDemo(prisma).then(() => console.log("Honey Chain seed complete: 3 batches, 7 bottles, and local PoA blocks ready.")).catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
