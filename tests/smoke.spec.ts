import { expect, test } from "@playwright/test";

const traceId = "HC-BK102-B260906-03-000347";

async function useAccount(page: import("@playwright/test").Page, role: string) {
  await page.goto("/login");
  await page.locator(".account-card", { hasText: role }).getByRole("button", { name: "Use account" }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test("dashboard rejects direct access without a valid session", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
});

test("landing demo scanner opens a verified bottle result", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open QR scanner" }).click();
  await expect(page.getByRole("dialog", { name: "Scan the bottle QR code" })).toBeVisible();
  await page.getByRole("link", { name: "Try demo bottle" }).click();
  await expect(page).toHaveURL(new RegExp(`/verify\\?trace=${traceId}`));
  await expect(page.getByRole("heading", { name: "Verified Honey Chain product" })).toBeVisible();
});

test("workspace support opens a simple chatbox", async ({ page }) => {
  await useAccount(page, "Beekeeper");
  await page.getByRole("button", { name: /Need support/ }).click();
  await expect(page.getByRole("dialog", { name: "BeeTech support" })).toBeVisible();
  await page.getByRole("button", { name: "Close support chat" }).click();
  await expect(page.getByRole("dialog", { name: "BeeTech support" })).toHaveCount(0);
});

test("operational actions persist by account and role", async ({ page }) => {
  await useAccount(page, "Beekeeper");
  await expect(page.getByText("Active role").first()).toBeVisible();
  await page.getByRole("button", { name: "Record harvest" }).click();
  await page.getByLabel("Quantity (kg)").fill("54");
  await page.getByRole("button", { name: "Confirm and save" }).click();
  await expect(page.getByTestId("persisted-activity").getByText("Harvest recorded")).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByTestId("persisted-activity").getByText("Harvest recorded")).toBeVisible();
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await page.getByRole("button", { name: "List batch" }).click();
  await page.getByLabel("Listing title").fill("Asha's traceable September harvest");
  await page.getByRole("button", { name: "Confirm and save" }).click();
  const activities = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.includes("beekeeper@honeychain.in:beekeeper:activities"));
    return key ? JSON.parse(localStorage.getItem(key) || "[]") : [];
  });
  expect(activities.some((item: { action: string }) => item.action === "Harvest recorded")).toBe(true);
  const published = await page.evaluate(() => JSON.parse(localStorage.getItem("hc:marketplace:listings") || "[]")[0]);
  expect(published).toMatchObject({ name: "Asha's traceable September harvest", category: "Raw Honey Batch" });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  const retained = await page.evaluate(() => Object.keys(localStorage).some((key) => key.includes("beekeeper@honeychain.in:beekeeper:activities")));
  expect(retained).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("hc:session"))).toBeNull();
});

test("public audit request reaches admin and keeps its decision", async ({ page }) => {
  await page.goto(`/verify?trace=${traceId}`);
  await page.getByRole("button", { name: "Request full audit trail" }).click();
  await expect(page.getByLabel("Your name")).toBeFocused();
  const reason = "Reviewing this purchase for our resident welfare association sourcing policy.";
  await page.getByLabel("Reason for requesting access").fill(reason);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit request for review" }).click();
  await page.reload();
  await expect(page.getByTestId("audit-request-state").getByText("Governance review pending")).toBeVisible();
  await expect(page.getByRole("button", { name: /Request under review/ })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hc:audit-requests") || "[]").length)).toBe(1);

  await useAccount(page, "Administrator");
  await page.getByRole("button", { name: /Access requests/ }).click();
  await expect(page.getByText(reason)).toBeVisible();
  await page.getByRole("button", { name: "Approve for 7 days" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Access requests/ }).click();
  await expect(page.locator(".case-list .status", { hasText: "Approved" })).toBeVisible();
  const request = await page.evaluate(() => JSON.parse(localStorage.getItem("hc:audit-requests") || "[]")[0]);
  expect(request).toMatchObject({ reason, consent: true, traceId, status: "Approved" });
  await page.goto(`/verify?trace=${traceId}`);
  await expect(page.getByTestId("audit-request-state").getByText("Audit access approved")).toBeVisible();
  await expect(page.getByRole("button", { name: /Audit access approved/ })).toBeDisabled();
  await page.reload();
  await expect(page.getByTestId("audit-request-state").getByText("Audit access approved")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hc:audit-requests") || "[]").length)).toBe(1);
});

test("login honors safe local return paths and rejects external destinations", async ({ page }) => {
  await page.goto("/login?next=%2Fmarketplace");
  await page.locator(".account-card", { hasText: "Consumer" }).getByRole("button", { name: "Use account" }).click();
  await expect(page).toHaveURL(/\/marketplace$/);

  await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fcollect");
  await page.locator(".account-card", { hasText: "Administrator" }).getByRole("button", { name: "Use account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("laboratory records bind independently and persist certification", async ({ page }) => {
  await useAccount(page, "Laboratory");
  const notes = "Pollen spectrum and moisture review completed by the assigned analyst.";
  await page.getByLabel("Reviewer notes").fill(notes);
  await page.locator('input[type="file"]').setInputFiles({ name: "BQL-26-0910-884.pdf", mimeType: "application/pdf", buffer: Buffer.from("signed certificate") });
  await page.getByRole("button", { name: "Approve and certify" }).click();
  await page.getByRole("button", { name: /HC-BK228-B260902-01/ }).click();
  await expect(page.getByLabel("Reviewer notes")).not.toHaveValue(notes);
  await page.getByRole("button", { name: new RegExp(traceId.slice(0, -7)) }).first().click();
  await expect(page.getByLabel("Reviewer notes")).toHaveValue(notes);
  await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Reviewer notes")).toHaveValue(notes);
  await expect(page.getByText("BQL-26-0910-884.pdf")).toBeVisible();
});

test("marketplace requires sign-in and persists saves and complete orders", async ({ page }) => {
  await page.goto("/marketplace");
  await page.getByRole("button", { name: /View listing/ }).first().click();
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/login/);

  await page.locator(".account-card", { hasText: "Consumer" }).getByRole("button", { name: "Use account" }).click();
  await page.getByRole("button", { name: /Save Apis cerana colony/ }).click();
  await page.getByRole("button", { name: /View listing/ }).first().click();
  await page.getByRole("button", { name: "Place order" }).click();
  await page.getByLabel("Quantity").fill("2");
  await page.getByRole("button", { name: /Confirm order/ }).click();
  await expect(page.getByRole("heading", { name: "Your order is recorded" })).toBeVisible();
  const order = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.includes("consumer@honeychain.in:consumer:orders"));
    return key ? JSON.parse(localStorage.getItem(key) || "[]")[0] : null;
  });
  expect(order).toMatchObject({ category: "Hive/Colony Asset", buyerEmail: "consumer@honeychain.in", buyerRole: "consumer", quantity: 2, auditEvent: "Asset ownership order recorded" });
  expect(order.total).toBe(13600);
  await page.getByRole("button", { name: "Continue browsing" }).click();
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Saved products", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Apis cerana colony/ })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Saved products", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Apis cerana colony/ })).toBeVisible();
});

test("admin role and anomaly decisions persist per selected record", async ({ page }) => {
  await useAccount(page, "Administrator");
  await page.getByRole("button", { name: "Approve", exact: true }).first().click();
  await page.getByRole("button", { name: "Anomalies" }).click();
  await page.getByLabel("Resolution reason / evidence note").fill("Transfer document reconciled against the receiving event and verified input quantity.");
  await page.getByRole("button", { name: "Resolve case" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Anomalies" }).click();
  await expect(page.getByText("Transfer document reconciled against the receiving event and verified input quantity.")).toBeVisible();
  const decisions = await page.evaluate(() => ({ approvals: JSON.parse(localStorage.getItem("hc:admin:role-approvals") || "[]"), anomalies: JSON.parse(localStorage.getItem("hc:admin:anomalies") || "[]") }));
  expect(decisions.approvals[0].status).toBe("Approved");
  expect(decisions.anomalies[0].status).toBe("Resolved");
});

test("empty verification, persistent locale, and mobile navigation are usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/verify");
  await expect(page.getByRole("heading", { name: "Enter the ID printed beside the QR code" })).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Switch to Hindi" }).click();
  await expect(page.getByRole("heading", { name: /मेहनत को जानें/ })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  const width = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(width[0]).toBeLessThanOrEqual(width[1]);
});

test("manufacturer and administrator dashboards stay within 390px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const expectContained = async () => {
    const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  };

  await useAccount(page, "Manufacturer");
  await expectContained();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Processing" }).click();
  await expectContained();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await expectContained();

  await useAccount(page, "Administrator");
  await expectContained();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: /Access requests/ }).click();
  await expectContained();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Anomalies" }).click();
  await expectContained();
});
