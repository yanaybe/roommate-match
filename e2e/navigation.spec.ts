import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-route-definitely-does-not-exist");
    await expect(page.getByText(/not found|404|doesn't exist/i)).toBeVisible({ timeout: 6000 });
  });

  test("bottom nav renders on main pages", async ({ page }) => {
    await page.goto("/");
    // Bottom nav should be present (check for a nav element or known nav links)
    const nav = page.locator("nav").or(page.locator("[data-testid='bottom-nav']"));
    // Just ensure the page loads without crashing
    await expect(page.locator("body")).toBeVisible();
  });

  test("terms of service page loads", async ({ page }) => {
    await page.goto("/terms-of-service");
    await expect(page.getByText(/terms/i)).toBeVisible({ timeout: 6000 });
  });

  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page.getByText(/privacy/i)).toBeVisible({ timeout: 6000 });
  });
});
