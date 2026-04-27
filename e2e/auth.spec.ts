import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("landing page shows sign-in when logged out", async ({ page }) => {
    await page.goto("/");
    // Unauthenticated users see the landing page, not the main app
    await expect(page).toHaveURL(/\/$|\/landing/);
    await expect(page.getByRole("link", { name: /sign in|log in/i }).or(page.getByRole("button", { name: /sign in|log in/i })).first()).toBeVisible();
  });

  test("auth page renders sign-in form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test("sign-in shows error on bad credentials", async ({ page }) => {
    await page.goto("/auth");
    await page.getByPlaceholder(/email/i).fill("notreal@example.com");
    await page.getByPlaceholder(/password/i).fill("wrongpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|not found|error/i)).toBeVisible({ timeout: 8000 });
  });
});
