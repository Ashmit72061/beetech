#!/usr/bin/env node

const args = process.argv.slice(2);
const once = args.includes("--once");
const intervalIndex = args.indexOf("--interval");
const intervalMs = intervalIndex >= 0 ? Number(args[intervalIndex + 1]) : 15_000;
const endpoint = process.env.TELEMETRY_ENDPOINT || `http://localhost:${process.env.APP_PORT || "3001"}/api/telemetry`;
const token = process.env.IOT_INGEST_TOKEN || "honey-chain-local-iot-demo";

if (!Number.isFinite(intervalMs) || intervalMs < 1_000) throw new Error("--interval must be at least 1000 milliseconds.");

let cycle = 0;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
async function sendCycle() {
  const capturedAt = new Date().toISOString();
  const readings = [
    { hiveId: "HC-HIVE-BK102-08", temperatureC: 31.2, humidityPct: 58.4, weightKg: 34.8 - cycle * 0.05, batteryPct: 82, deviceId: "demo-08", source: "simulator" },
    { hiveId: "HC-HIVE-BK102-12", temperatureC: 31.0, humidityPct: 78.5, weightKg: 33.9, batteryPct: 19, deviceId: "demo-12", source: "simulator" },
  ];
  for (const reading of readings) {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ ...reading, capturedAt, idempotencyKey: `sim-${runId}-${cycle}-${reading.hiveId}` }) });
    if (!response.ok) throw new Error(`${reading.hiveId}: ${response.status} ${await response.text()}`);
    console.log(`${reading.hiveId}: ${response.status} ${await response.text()}`);
  }
  console.log("HC-HIVE-BK102-15 intentionally receives no reading so the dashboard demonstrates an offline device.");
  cycle += 1;
}

await sendCycle();
if (!once) {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    await sendCycle();
  }
}
