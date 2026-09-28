import { expect, test, type Page } from "@playwright/test";

const traceId = "HC-BK102-B260906-03-000347";
const accounts = {
  beekeeper: "beekeeper@honeychain.in",
  manufacturer: "manufacturer@honeychain.in",
  lab: "lab@honeychain.in",
  consumer: "consumer@honeychain.in",
  admin: "admin@honeychain.in",
} as const;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.locator("#login-password").fill("honey123");
  await page.getByRole("button", { name: /sign in securely/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

async function reset(page: Page) {
  await signIn(page, accounts.admin);
  const status = await page.evaluate(async () => (await fetch("/api/demo/reset", { method: "POST" })).status);
  expect(status).toBe(200);
  await signIn(page, accounts.admin);
  await page.context().clearCookies();
}

async function api(page: Page, action: Record<string, unknown>) {
  return request(page, "/api/workflow", { method: "POST", data: action });
}

async function request(page: Page, url: string, options: { method?: string; data?: unknown; headers?: Record<string, string> } = {}) {
  const cookies = await page.context().cookies();
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
  return page.context().request.fetch(url, { ...options, headers: { ...((options.headers as Record<string, string> | undefined) || {}), ...(cookie ? { cookie } : {}) } });
}

test.beforeEach(async ({ page }) => reset(page));

test("anonymous protected route redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=\/?dashboard/);
});

test("each seeded role logs in and only receives its server-backed workflow scope", async ({ page }) => {
  for (const [role, email] of Object.entries(accounts)) {
    await signIn(page, email);
    const response = await request(page, "/api/workflow");
    expect(response.ok(), role).toBeTruthy();
    const state = await response.json() as { requests: unknown[]; batches: unknown[] };
    expect(await page.getByText("Server-backed operations").isVisible()).toBeTruthy();
    expect(state.requests.length, role).toBe(role === "admin" ? 1 : 0);
    if (role === "consumer") expect(state.batches).toEqual([]);
    await page.getByLabel("Sign out").click();
    await expect(page).toHaveURL(/login/);
  }
});

test("known and unknown public traces, QR, receipt, and certificate endpoints resolve correctly", async ({ page }) => {
  const trace = await request(page, `/api/trace/${traceId}`);
  expect(trace.ok()).toBeTruthy();
  const body = await trace.json() as { status: string; trace: { integrity: { valid: boolean; checkedBlocks: number; chainHead: string | null; validatorId: string }; events: Array<{ receiptHash: string | null; block: { height: number; hash: string; signature: string } | null }>; certificate: { number: string } | null } };
  expect(body.status).toBe("valid");
  expect(body.trace.certificate?.number).toBe("BQL-26-0910-884");
  expect(body.trace.integrity.valid).toBeTruthy();
  expect(body.trace.integrity.checkedBlocks).toBeGreaterThan(20);
  expect(body.trace.integrity.chainHead).toMatch(/^[a-f0-9]{64}$/);
  expect(body.trace.integrity.validatorId).toBe("HC-POA-VALIDATOR-01");
  expect(body.trace.events).toHaveLength(6);
  expect(body.trace.events.every((event) => event.block?.hash.match(/^[a-f0-9]{64}$/) && event.block.signature.match(/^[a-f0-9]{64}$/))).toBeTruthy();
  expect((await request(page, "/api/trace/not-a-real-trace")).status()).toBe(404);

  const qr = await request(page, `/api/qr/${traceId}`, { headers: { host: "attacker.invalid" } });
  expect(qr.headers()["content-type"]).toContain("image/png");
  expect((await qr.body()).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const payload = qr.headers()["x-honey-chain-qr-payload"];
  expect(payload).toBe(`http://localhost:3001/verify?trace=${encodeURIComponent(traceId)}`);
  await page.goto(new URL(payload).pathname + new URL(payload).search);
  await expect(page.getByRole("heading", { name: "Verified Honey Chain product" })).toBeVisible();

  const receiptHash = body.trace.events.find((event) => event.receiptHash)?.receiptHash;
  expect(receiptHash).toBeTruthy();
  expect((await request(page, `/api/receipts/${receiptHash}`)).ok()).toBeTruthy();
  expect((await request(page, "/api/certificates/BQL-26-0910-884")).ok()).toBeTruthy();
  const manifest = await request(page, "/api/qr/batch/HC-BK102-B260906-03");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).count).toBe(3);
  await page.goto("/labels?batch=HC-BK102-B260906-03");
  await expect(page.getByRole("heading", { name: "QR label sheet" })).toBeVisible();
  await expect(page.getByText(traceId, { exact: true })).toBeVisible();
});

test("marketplace saves, orders, and rejects unavailable inventory on the server", async ({ page }) => {
  await signIn(page, accounts.consumer);
  const listings = await (await request(page, "/api/marketplace")).json() as { listings: Array<{ id: string; category: string }> };
  const packaged = listings.listings.find((listing) => listing.category === "Packaged Honey");
  expect(packaged).toBeTruthy();
  expect((await request(page, "/api/marketplace", { method: "POST", data: { listingId: packaged!.id } })).ok()).toBeTruthy();
  expect((await api(page, { action: "order", listingId: packaged!.id, quantity: 1 })).status()).toBe(200);
  const rejected = await api(page, { action: "order", listingId: packaged!.id, quantity: 10_000 });
  expect(rejected.status()).toBe(400);
  expect((await rejected.json()).error).toMatch(/unavailable/i);
});

test("golden path persists harvest through protected audit approval", async ({ page }) => {
  await signIn(page, accounts.beekeeper);
  const harvest = await api(page, { action: "harvest", name: "E2E forest harvest", floralProfile: "Neem", origin: "Dausa", quantityKg: 2 });
  expect(harvest.ok()).toBeTruthy();
  const batchId = (await harvest.json()).batchId as string;
  expect((await api(page, { action: "publishRaw", batchId, priceInr: 450 })).ok()).toBeTruthy();

  await page.getByLabel("Sign out").click();
  await signIn(page, accounts.manufacturer);
  const raw = await (await request(page, "/api/marketplace")).json() as { listings: Array<{ id: string; batchId?: string; name: string }> };
  const rawListing = raw.listings.find((listing) => listing.name === "E2E forest harvest");
  expect(rawListing).toBeTruthy();
  expect((await api(page, { action: "order", listingId: rawListing!.id, quantity: 2 })).ok()).toBeTruthy();
  const run = await api(page, { action: "startRun", batchId, inputKg: 2, method: "Filtered" });
  expect(run.ok()).toBeTruthy();
  const runId = (await run.json()).runId as string;
  const testRequest = await api(page, { action: "requestTest", runId, laboratoryId: "org-bharat" });
  expect(testRequest.ok()).toBeTruthy();
  const testId = (await testRequest.json()).testId as string;

  await page.getByLabel("Sign out").click();
  await signIn(page, accounts.lab);
  expect((await api(page, { action: "reviewTest", testId, decision: "Approved", pollenProfile: "Conforms", moisturePct: 17.4, adulteration: "Not detected", notes: "E2E approval", certificateNumber: "E2E-CERT-01" })).ok()).toBeTruthy();

  await page.getByLabel("Sign out").click();
  await signIn(page, accounts.manufacturer);
  const packaged = await api(page, { action: "package", runId, productName: "E2E Honey", netWeightGrams: 500, count: 2 });
  expect(packaged.ok()).toBeTruthy();
  const packageResult = await packaged.json() as { traceId: string; traceIds: string[]; labelsUrl: string };
  expect(packageResult.traceIds).toHaveLength(2);
  expect(packageResult.labelsUrl).toContain("/labels?batch=");
  const newTrace = packageResult.traceId;
  const state = await (await request(page, "/api/workflow")).json() as { bottles: Array<{ id: string; traceId: string }> };
  const bottle = state.bottles.find((item) => item.traceId === newTrace);
  expect(bottle).toBeTruthy();
  expect((await api(page, { action: "publishPackaged", bottleId: bottle!.id, priceInr: 499 })).ok()).toBeTruthy();

  await page.getByLabel("Sign out").click();
  await signIn(page, accounts.consumer);
  const audit = await request(page, "/api/audit-requests", { method: "POST", data: { traceId: newTrace, name: "Kavya Nair", email: accounts.consumer, reason: "Need the protected provenance for this purchase.", consent: true } });
  expect(audit.ok()).toBeTruthy();
  expect((await request(page, `/api/audit-requests?trace=${newTrace}`)).status()).toBe(200);
  expect((await (await request(page, `/api/audit-requests?trace=${newTrace}`)).json()).protected).toBeFalsy();
  const auditId = (await audit.json()).id as string;

  await page.getByLabel("Sign out").click();
  await signIn(page, accounts.admin);
  expect((await api(page, { action: "decideAudit", requestId: auditId, decision: "APPROVED" })).ok()).toBeTruthy();
  await page.getByLabel("Sign out").click();
  await signIn(page, accounts.consumer);
  const protectedAccess = await request(page, `/api/audit-requests?trace=${newTrace}`);
  expect((await protectedAccess.json()).protected).toBeTruthy();
});

test("IoT auth, idempotency, simulator output, and beekeeper telemetry are server-backed", async ({ page }) => {
  const reading = { hiveId: "HC-HIVE-BK102-08", deviceId: "demo-08", source: "simulator", capturedAt: new Date().toISOString(), temperatureC: 31.2, humidityPct: 58.4, weightKg: 34.8, batteryPct: 82, idempotencyKey: "e2e-telemetry-0001" };
  expect((await request(page, "/api/telemetry", { method: "POST", data: reading })).status()).toBe(401);
  expect((await request(page, "/api/telemetry", { method: "POST", headers: { authorization: "Bearer honey-chain-local-iot-demo" }, data: { ...reading, hiveId: "HC-HIVE-BK102-12" } })).status()).toBe(401);
  expect((await request(page, "/api/telemetry", { method: "POST", headers: { authorization: "Bearer honey-chain-local-iot-demo" }, data: reading })).status()).toBe(201);
  const retry = await request(page, "/api/telemetry", { method: "POST", headers: { authorization: "Bearer honey-chain-local-iot-demo" }, data: reading });
  expect(retry.status()).toBe(200);
  expect((await retry.json()).idempotent).toBeTruthy();
  await signIn(page, accounts.beekeeper);
  await page.goto("/dashboard");
  await expect(page.getByText("Hive conditions")).toBeVisible();
  await expect(page.getByText("demo-08 via simulator")).toBeVisible();
});

test("health reports the database-backed presentation stack ready", async ({ page }) => {
  const response = await request(page, "/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ status: "ok", database: "ok" });
});

test("manual scanner fallback, mobile navigation, no overflow, and no console errors work on core routes", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open QR scanner" }).click();
    await page.getByRole("button", { name: "Try demo bottle" }).click();
    await expect(page).toHaveURL(new RegExp(`/verify\\?trace=${traceId}`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await signIn(page, accounts.beekeeper);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("button", { name: "Marketplace", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
