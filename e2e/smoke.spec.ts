import { expect, test } from "@playwright/test";

// Smoke: runs against every Vercel deploy (preview + prod).

test("landing page is public and links sign-in to /app", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBeLessThan(400);
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toHaveAttribute(
    "href",
    "/app",
  );
});

test("/sign-in renders the sign-in form on the app domain", async ({ page, baseURL }) => {
  await page.goto("/sign-in");
  await expect(page.locator("input[name=identifier]")).toBeVisible();
  expect(new URL(page.url()).host).toBe(new URL(baseURL!).host);
});

test("/app sends signed-out users to sign-in, returning to /app", async ({ page }) => {
  await page.goto("/app");
  await page.waitForURL(/sign-in/);
  const redirect = new URL(page.url()).searchParams.get("redirect_url") ?? page.url();
  expect(redirect).toMatch(/\/app/);
});

test("test user signs in and reaches the app", async ({ page }) => {
  const user = process.env.E2E_USERNAME;
  const pass = process.env.E2E_PASSWORD;
  test.skip(!user || !pass, "E2E_USERNAME / E2E_PASSWORD not set");

  await page.goto("/sign-in");
  await page.locator("input[name=identifier]").fill(user!);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.locator("input[name=password]").fill(pass!);
  await page.getByRole("button", { name: /continue/i }).click();

  await page.waitForURL(/\/app/);
  await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
  await expect(page.getByText(/account setup not finished/i)).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe("/app");
});
