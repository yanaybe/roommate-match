import { test, expect } from "@playwright/test";

test.describe("Apartment listings", () => {
  test("rooms page is accessible without auth", async ({ page }) => {
    await page.goto("/");
    // The home/rooms page should load without crashing
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Should not show a blank error screen
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("apartment detail page loads for valid ID", async ({ page }) => {
    // Navigate to rooms first to find a listing link
    await page.goto("/");
    const apartmentLink = page.locator("a[href*='/apartment/']").first();
    const count = await apartmentLink.count();
    if (count > 0) {
      await apartmentLink.click();
      await expect(page).toHaveURL(/\/apartment\//);
      await expect(page.getByText(/message owner|message/i)).toBeVisible({ timeout: 8000 });
    }
  });

  test("apartment not found shows friendly error", async ({ page }) => {
    await page.goto("/apartment/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/not found|doesn't exist|removed/i)).toBeVisible({ timeout: 8000 });
  });
});
