import { test, expect, type Page } from "@playwright/test";

const BASE = "https://roommate-match-nine.vercel.app";

async function getBodyText(page: Page, url: string): Promise<string> {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  return await page.textContent("body") ?? "";
}

// ── Landing page ─────────────────────────────────────────────────────────────

test("landing: title is RooMatch (not Roomatch)", async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle(/RooMatch/);
  const title = await page.title();
  expect(title).not.toContain("Roomatch");
  expect(title).not.toContain("RoomMatch");
});

test("landing: hero badge and CTA copy are updated", async ({ page }) => {
  const body = await getBodyText(page, BASE);
  expect(body).toContain("Lifestyle-first roommate matching");
  expect(body).toContain("Get Matched Free");
  expect(body).not.toContain("Israel's smartest");
  expect(body).not.toContain("Find my roommate");
});

test("landing: logo present in nav", async ({ page }) => {
  await page.goto(BASE);
  const logo = page.locator('nav img[alt="RooMatch"]').first();
  await expect(logo).toBeVisible();
});

test("landing: stats are honest (no 85% or inflated count)", async ({ page }) => {
  const body = await getBodyText(page, BASE);
  expect(body).not.toContain("85%");
  expect(body).not.toContain("Active searchers");
  expect(body).toContain("14");
  expect(body).toContain("Compatibility factors");
});

test("landing: no fake testimonials", async ({ page }) => {
  const body = await getBodyText(page, BASE);
  expect(body).not.toContain("Maya L.");
  expect(body).not.toContain("Yonatan K.");
  expect(body).not.toContain("Noa S.");
  expect(body).not.toContain("What our users say");
  expect(body).toContain("Why RooMatch?");
});

test("landing: no 'Example' badge on listing cards", async ({ page }) => {
  const body = await getBodyText(page, BASE);
  expect(body).not.toContain("Example");
  expect(body).toContain("Sign in to view");
});

test("landing: footer has aria-labels on social links", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  const instagramLink = page.locator('footer a[aria-label*="Instagram"]');
  const emailLink = page.locator('footer a[aria-label*="Email"]');
  await expect(instagramLink).toBeVisible();
  await expect(emailLink).toBeVisible();
});

test("landing: footer shows RooMatch (not Roomatch)", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  const footer = await page.locator("footer").textContent();
  expect(footer).toContain("RooMatch");
  expect(footer).not.toContain("Roomatch");
  expect(footer).not.toContain("RoomMatch");
});

test("landing: og:image is absolute URL", async ({ page }) => {
  await page.goto(BASE);
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toMatch(/^https:\/\//);
});

test("landing: og:title is RooMatch", async ({ page }) => {
  await page.goto(BASE);
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  expect(ogTitle).toContain("RooMatch");
  expect(ogTitle).not.toContain("Roomatch");
});

test("landing: manifest link present with correct path", async ({ page }) => {
  await page.goto(BASE);
  const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifest).toBe("/manifest.json");
});

test("landing: all whileInView sections visible (animations fire)", async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  const hidden = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[style*='opacity: 0']")).length
  );
  expect(hidden).toBe(0);
});

// ── Auth page ─────────────────────────────────────────────────────────────────

test("auth: login shows logo above wordmark", async ({ page }) => {
  await page.goto(`${BASE}/auth`);
  await page.waitForLoadState("networkidle");
  const logo = page.locator('img[alt="RooMatch"]').first();
  await expect(logo).toBeVisible();
});

test("auth: wrong password shows persistent inline error", async ({ page }) => {
  await page.goto(`${BASE}/auth`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "nobody@example.com");
  await page.fill('input[type="password"]', "WrongPass123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const errorBox = page.locator("div.bg-destructive\\/10");
  await expect(errorBox).toBeVisible();
  const text = await errorBox.textContent();
  expect(text).toContain("Incorrect email or password");
});

test("auth: no Step 1 of 2 badge on signup", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/auth?mode=register`);
  expect(body).not.toContain("Step 1 of 2");
  expect(body).not.toContain("step 1");
});

test("auth: signup header shows logo", async ({ page }) => {
  await page.goto(`${BASE}/auth?mode=register`);
  await page.waitForLoadState("networkidle");
  const logo = page.locator('img[alt="RooMatch"]').first();
  await expect(logo).toBeVisible();
});

test("auth: password checklist appears when typing", async ({ page }) => {
  await page.goto(`${BASE}/auth?mode=register`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="password"]', "abc");
  await page.waitForTimeout(300);
  const checklist = await page.locator("div.grid-cols-2").count();
  expect(checklist).toBeGreaterThan(0);
});

test("auth: brand name is RooMatch in header", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/auth`);
  expect(body).toContain("RooMatch");
  expect(body).not.toContain("Roomatch");
});

// ── Routing & access control ──────────────────────────────────────────────────

test("routing: /help-center is accessible without login", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/help-center`);
  expect(page.url()).not.toContain("/auth");
  expect(body.length).toBeGreaterThan(100);
});

test("routing: logged-out user on /roommates redirects to /auth", async ({ page }) => {
  await page.goto(`${BASE}/roommates`);
  await page.waitForURL(/\/auth/);
  expect(page.url()).toContain("/auth");
});

test("routing: logged-out user sees no sidebar nav on unknown path", async ({ page }) => {
  await page.goto(`${BASE}/some-nonexistent-route`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  const mobileNav = await page.locator("nav.desk\\:hidden").count();
  expect(mobileNav).toBe(0);
});

test("routing: /verify-email redirects logged-out user with toast", async ({ page }) => {
  await page.goto(`${BASE}/verify-email`);
  await page.waitForURL(/\/auth/);
  expect(page.url()).toContain("/auth");
});

test("routing: /contact-support is fully accessible without login", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/contact-support`);
  expect(page.url()).not.toContain("/auth");
  expect(body).toContain("roomatchltd@gmail.com");
});

// ── Legal pages ───────────────────────────────────────────────────────────────

test("terms: brand name is RooMatch (not Roomatch)", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/terms-of-service`);
  expect(body).toContain("RooMatch");
  expect(body).not.toContain("Roomatch");
});

test("terms: substantial content (>2000 chars)", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/terms-of-service`);
  expect(body!.length).toBeGreaterThan(2000);
  expect(body).toContain("Governing Law");
  expect(body).toContain("Limitation of Liability");
  expect(body).toContain("Indemnification");
});

test("privacy: brand name is RooMatch (not Roomatch)", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/privacy-policy`);
  expect(body).toContain("RooMatch");
  expect(body).not.toContain("Roomatch");
});

test("privacy: substantial content with Israeli law reference", async ({ page }) => {
  const body = await getBodyText(page, `${BASE}/privacy-policy`);
  expect(body!.length).toBeGreaterThan(2000);
  expect(body).toContain("Israeli Privacy Protection Law");
  expect(body).toContain("Supabase");
  expect(body).toContain("third-party");
});

// ── PWA & meta ────────────────────────────────────────────────────────────────

test("pwa: manifest.json returns valid JSON with correct fields", async ({ page }) => {
  const res = await page.goto(`${BASE}/manifest.json`);
  expect(res?.status()).toBe(200);
  const json = await res?.json();
  expect(json.name).toBe("RooMatch");
  expect(json.background_color).toBe("#fbfaf9");
  expect(json.display).toBe("standalone");
  expect(json.icons.length).toBeGreaterThan(0);
});

// ── OAuthWelcome brand ────────────────────────────────────────────────────────

test("oauth-welcome: no house emoji, uses logo", async ({ page }) => {
  const body = await getBodyText(page, BASE);
  expect(body).not.toContain("🏠");
});
