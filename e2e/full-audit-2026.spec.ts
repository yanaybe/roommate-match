import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://roommate-match-nine.vercel.app';
const SS_DIR = path.join(__dirname, 'audit-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function ss(page: Page, name: string) {
  const filePath = path.join(SS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

test.describe('RooMatch Full UX Audit 2026', () => {

  // ============================
  // LANDING PAGE
  // ============================
  test('01 - Landing page desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '01-landing-desktop-full');

    // Check title
    const title = await page.title();
    console.log('PAGE TITLE:', title);

    // Check meta description
    const metaDesc = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => 'NOT FOUND');
    console.log('META DESC:', metaDesc);

    // Check og:image
    const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content')).catch(() => 'NOT FOUND');
    console.log('OG:IMAGE:', ogImage);

    // Check manifest
    const manifest = await page.$eval('link[rel="manifest"]', el => el.getAttribute('href')).catch(() => 'NOT FOUND');
    console.log('PWA MANIFEST:', manifest);

    // Check hero section
    const heroText = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');
    console.log('H1 TEXT:', heroText);

    // Check for logo in nav
    const navLogo = await page.locator('nav img, header img, [class*="logo"]').first().isVisible().catch(() => false);
    console.log('NAV LOGO VISIBLE:', navLogo);

    // Check hero badge
    const badge = await page.locator('[class*="badge"], [class*="pill"]').first().textContent().catch(() => 'NOT FOUND');
    console.log('HERO BADGE TEXT:', badge);

    // Check CTAs
    const ctaButtons = await page.locator('a[href*="auth"], button:has-text("Get"), button:has-text("Start"), button:has-text("Find"), a:has-text("Get"), a:has-text("Start"), a:has-text("Find")').allTextContents();
    console.log('CTA BUTTONS:', JSON.stringify(ctaButtons));

    // Check stats
    const statsText = await page.locator('[class*="stat"], [class*="counter"], [class*="number"]').allTextContents().catch(() => []);
    console.log('STATS TEXT:', JSON.stringify(statsText));

    // Check testimonials
    const testimonials = await page.locator('[class*="testimonial"], [class*="review"]').allTextContents().catch(() => []);
    console.log('TESTIMONIALS COUNT:', testimonials.length);

    // Language switcher
    const langSwitcher = await page.locator('button:has-text("EN"), button:has-text("HE"), button:has-text("עב"), [class*="lang"]').first().isVisible().catch(() => false);
    console.log('LANG SWITCHER VISIBLE:', langSwitcher);

    // Footer
    const footer = await page.locator('footer').textContent().catch(() => 'NOT FOUND');
    console.log('FOOTER TEXT:', footer?.substring(0, 500));

    // Social links in footer
    const socialLinks = await page.locator('footer a[href*="twitter"], footer a[href*="instagram"], footer a[href*="facebook"], footer a[href*="linkedin"]').count();
    console.log('SOCIAL LINKS IN FOOTER:', socialLinks);
  });

  test('02 - Landing page scroll and animations', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Scroll to trigger whileInView animations
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);
    await ss(page, '02a-landing-scroll-400');

    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(800);
    await ss(page, '02b-landing-scroll-1000');

    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(800);
    await ss(page, '02c-landing-scroll-2000');

    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(800);
    await ss(page, '02d-landing-scroll-3000');

    await page.evaluate(() => window.scrollTo(0, 5000));
    await page.waitForTimeout(800);
    await ss(page, '02e-landing-scroll-bottom');

    // Check if animated elements are visible
    const hiddenElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="opacity-0"], [style*="opacity: 0"]');
      return elements.length;
    });
    console.log('ELEMENTS STILL HIDDEN AFTER SCROLL:', hiddenElements);
  });

  test('03 - Landing language switcher', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Try clicking language switcher
    const langBtn = page.locator('button:has-text("EN"), button:has-text("HE"), button:has-text("עב"), [class*="lang"]').first();
    const isVisible = await langBtn.isVisible().catch(() => false);
    console.log('LANG BTN VISIBLE:', isVisible);

    if (isVisible) {
      await langBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, '03a-after-lang-switch');

      const bodyText = await page.locator('body').textContent();
      const hasHebrew = /[֐-׿]/.test(bodyText || '');
      console.log('PAGE HAS HEBREW TEXT AFTER SWITCH:', hasHebrew);

      // Switch back
      const langBtnBack = page.locator('button:has-text("EN"), button:has-text("HE"), button:has-text("עב"), [class*="lang"]').first();
      if (await langBtnBack.isVisible()) {
        await langBtnBack.click();
        await page.waitForTimeout(1000);
        await ss(page, '03b-after-lang-switch-back');
      }
    }
  });

  test('04 - Landing CTA buttons', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Capture all links and buttons text
    const allLinks = await page.locator('a').allTextContents();
    console.log('ALL LINKS:', JSON.stringify(allLinks));

    // Test primary CTA
    const primaryCTA = page.locator('a[href*="/auth"], a[href*="sign"], a[href*="register"]').first();
    const ctaVisible = await primaryCTA.isVisible().catch(() => false);
    console.log('PRIMARY CTA VISIBLE:', ctaVisible);

    if (ctaVisible) {
      const ctaText = await primaryCTA.textContent();
      console.log('PRIMARY CTA TEXT:', ctaText);
      await primaryCTA.click();
      await page.waitForURL('**', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      console.log('AFTER CTA CLICK URL:', page.url());
      await ss(page, '04-after-cta-click');
    }
  });

  // ============================
  // AUTH PAGES
  // ============================
  test('05 - Auth page desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '05-auth-desktop');

    const url = page.url();
    console.log('AUTH PAGE URL:', url);

    // Check for logo/branding
    const logo = await page.locator('img, [class*="logo"]').first().isVisible().catch(() => false);
    console.log('LOGO ON AUTH PAGE:', logo);

    const logoText = await page.locator('img').first().getAttribute('alt').catch(() => 'NO IMG');
    console.log('LOGO ALT TEXT:', logoText);

    // Check for emoji instead of logo
    const h1Text = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log('AUTH HEADING:', h1Text);

    // Check for "step 1 of 2" badge
    const stepBadge = await page.locator('text=/step.*1.*2/i, text=/שלב.*1/i').count();
    console.log('STEP BADGE COUNT:', stepBadge);

    // Tab switching
    const tabs = await page.locator('[role="tab"], button:has-text("Sign"), button:has-text("Log"), button:has-text("כניסה"), button:has-text("הרשמה")').allTextContents();
    console.log('AUTH TABS:', JSON.stringify(tabs));

    // Check signup tab
    const signupTab = page.locator('[role="tab"]:has-text("Sign up"), button:has-text("Sign up"), button:has-text("הרשמה")').first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.waitForTimeout(500);
      await ss(page, '05b-auth-signup-tab');
    }
  });

  test('06 - Sign up with fake account', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Switch to sign up tab
    const signupTab = page.locator('[role="tab"]:has-text("Sign"), [data-value="signup"], button:has-text("Sign Up"), button:has-text("Register")').first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.waitForTimeout(500);
    }

    // Look for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="אימייל"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('audit2026@test.com');
    }

    // Password inputs
    const passwordInputs = page.locator('input[type="password"]');
    const pwCount = await passwordInputs.count();
    console.log('PASSWORD INPUT COUNT:', pwCount);

    if (pwCount >= 1) {
      await passwordInputs.nth(0).fill('Passw0rd!');
    }
    if (pwCount >= 2) {
      await passwordInputs.nth(1).fill('Passw0rd!');
    }

    await ss(page, '06a-signup-form-filled');

    // Check password requirements display
    const pwRequirements = await page.locator('[class*="requirement"], ul:has(li:has-text("character")), [class*="password-hint"]').isVisible().catch(() => false);
    console.log('PASSWORD REQUIREMENTS VISIBLE:', pwRequirements);

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("הרשמה")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, '06b-after-signup');
      console.log('AFTER SIGNUP URL:', page.url());
    }
  });

  test('07 - Login wrong password test', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Switch to login tab if needed
    const loginTab = page.locator('[role="tab"]:has-text("Log"), [role="tab"]:has-text("Sign in"), button:has-text("Log in"), button:has-text("כניסה")').first();
    if (await loginTab.isVisible()) {
      await loginTab.click();
      await page.waitForTimeout(500);
    }

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('wrong@test.com');
    }

    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('wrongpassword');
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, '07a-wrong-password-error');

      const errorMsg = await page.locator('[class*="error"], [role="alert"], .text-red, [class*="destructive"]').first().textContent().catch(() => 'NO ERROR SHOWN');
      console.log('ERROR MESSAGE:', errorMsg);
    }
  });

  test('08 - Login empty fields validation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click submit without filling anything
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, '08-empty-fields-validation');

      const validationMsgs = await page.locator('[class*="error"], [role="alert"], :invalid, [aria-invalid="true"]').allTextContents();
      console.log('VALIDATION MESSAGES:', JSON.stringify(validationMsgs));
    }
  });

  test('09 - Forgot password flow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const forgotLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot"), a:has-text("שכחת"), text=/forgot.*password/i').first();
    const forgotVisible = await forgotLink.isVisible().catch(() => false);
    console.log('FORGOT PASSWORD LINK VISIBLE:', forgotVisible);

    if (forgotVisible) {
      await forgotLink.click();
      await page.waitForTimeout(1500);
      await ss(page, '09-forgot-password');
      console.log('FORGOT PASSWORD URL:', page.url());
    }
  });

  // ============================
  // STATIC PAGES
  // ============================
  test('10 - Terms of Service page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/terms-of-service`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss(page, '10-terms-of-service');

    const url = page.url();
    console.log('TERMS PAGE URL:', url);

    const h1 = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');
    console.log('TERMS H1:', h1);

    const wordCount = await page.evaluate(() => document.body.innerText.split(' ').length);
    console.log('TERMS WORD COUNT:', wordCount);
  });

  test('11 - Privacy Policy page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/privacy-policy`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss(page, '11-privacy-policy');

    const h1 = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');
    console.log('PRIVACY H1:', h1);

    const wordCount = await page.evaluate(() => document.body.innerText.split(' ').length);
    console.log('PRIVACY WORD COUNT:', wordCount);
  });

  test('12 - Contact support page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/contact-support`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss(page, '12a-contact-support');

    const url = page.url();
    console.log('CONTACT SUPPORT URL:', url);

    // Was this gated before? Check if we're redirected to auth
    const isRedirectedToAuth = url.includes('/auth');
    console.log('CONTACT REDIRECTED TO AUTH:', isRedirectedToAuth);

    if (!isRedirectedToAuth) {
      const formVisible = await page.locator('form, input, textarea').first().isVisible().catch(() => false);
      console.log('CONTACT FORM VISIBLE:', formVisible);
    }
  });

  test('13 - Help Center page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/help-center`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss(page, '13-help-center');

    const url = page.url();
    console.log('HELP CENTER URL:', url);

    const h1 = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');
    console.log('HELP CENTER H1:', h1);
  });

  test('14 - Verify email page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/verify-email`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss(page, '14-verify-email');

    const url = page.url();
    console.log('VERIFY EMAIL URL:', url);

    // Check for pulsing animation / waiting indicator
    const pulsingEl = await page.locator('[class*="pulse"], [class*="animate"], [class*="spin"]').first().isVisible().catch(() => false);
    console.log('PULSING INDICATOR:', pulsingEl);

    const bodyText = await page.locator('body').textContent();
    console.log('VERIFY EMAIL TEXT (first 500):', bodyText?.substring(0, 500));
  });

  // ============================
  // PROTECTED ROUTES (LOGGED OUT)
  // ============================
  test('15 - Protected routes while logged out', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const protectedRoutes = ['/dashboard', '/roommates', '/chats', '/profile', '/settings', '/squads', '/onboarding'];

    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      console.log(`PROTECTED ROUTE ${route} → redirected to: ${finalUrl}`);
      await ss(page, `15-protected${route.replace('/', '-')}`);
    }
  });

  // ============================
  // MOBILE VIEWPORT
  // ============================
  test('16 - Landing page mobile (iPhone 15)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '16a-mobile-landing-top');

    // Check for horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log('MOBILE HORIZONTAL OVERFLOW:', hasHorizontalOverflow);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await ss(page, '16b-mobile-landing-scroll1');

    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(500);
    await ss(page, '16c-mobile-landing-scroll2');

    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(500);
    await ss(page, '16d-mobile-landing-bottom');

    // Hamburger menu
    const hamburger = await page.locator('button[aria-label*="menu" i], button[aria-label*="תפריט"], [class*="hamburger"], [class*="menu-toggle"]').first().isVisible().catch(() => false);
    console.log('HAMBURGER MENU VISIBLE:', hamburger);
  });

  test('17 - Auth page mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '17-auth-mobile');

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log('AUTH MOBILE HORIZONTAL OVERFLOW:', hasHorizontalOverflow);
  });

  // ============================
  // ONBOARDING PAGE
  // ============================
  test('18 - Onboarding page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '18-onboarding');

    console.log('ONBOARDING URL:', page.url());

    const h1 = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');
    console.log('ONBOARDING H1:', h1);
  });

  // ============================
  // 404 PAGE
  // ============================
  test('19 - 404 page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/this-page-does-not-exist-404xyz`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await ss(page, '19-404-page');

    const url = page.url();
    console.log('404 PAGE URL:', url);

    const bodyText = await page.locator('body').textContent();
    console.log('404 PAGE TEXT:', bodyText?.substring(0, 300));
  });

  // ============================
  // ACCESSIBILITY CHECKS
  // ============================
  test('20 - Accessibility checks on landing', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Images without alt text
    const imgsWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let count = 0;
      imgs.forEach(img => {
        if (!img.alt) count++;
      });
      return count;
    });
    console.log('IMAGES WITHOUT ALT TEXT:', imgsWithoutAlt);

    // Buttons without aria-label or text
    const btnsWithoutLabel = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      let count = 0;
      btns.forEach(btn => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) count++;
      });
      return count;
    });
    console.log('BUTTONS WITHOUT LABEL:', btnsWithoutLabel);

    // Keyboard navigation test
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Tab');

    const focusedEl = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, text: el?.textContent?.substring(0, 50), ariaLabel: el?.getAttribute('aria-label') };
    });
    console.log('FOCUSED ELEMENT AFTER 3 TABS:', JSON.stringify(focusedEl));
  });

  // ============================
  // BRAND CONSISTENCY CHECK
  // ============================
  test('21 - Brand name consistency check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent() || '';

    const roomatch = (bodyText.match(/Roomatch/gi) || []).length;
    const roomatch2 = (bodyText.match(/RooMatch/gi) || []).length;
    const roomatch3 = (bodyText.match(/RoomMatch/gi) || []).length;
    const roomatch4 = (bodyText.match(/ROOMATCH/gi) || []).length;

    console.log('Brand name occurrences on landing:');
    console.log('  "Roomatch":', roomatch);
    console.log('  "RooMatch":', roomatch2);
    console.log('  "RoomMatch":', roomatch3);
    console.log('  "ROOMATCH":', roomatch4);

    // Also check auth page
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const authText = await page.locator('body').textContent() || '';
    const authRoomatch = (authText.match(/Roomatch/gi) || []).length;
    const authRoomatch2 = (authText.match(/RooMatch/gi) || []).length;
    const authRoomatch3 = (authText.match(/RoomMatch/gi) || []).length;

    console.log('Brand name occurrences on auth:');
    console.log('  "Roomatch":', authRoomatch);
    console.log('  "RooMatch":', authRoomatch2);
    console.log('  "RoomMatch":', authRoomatch3);
  });

  // ============================
  // DARK MODE
  // ============================
  test('22 - Dark mode check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await ss(page, '22a-dark-mode-landing');

    // Check if dark mode is respected
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    console.log('DARK MODE BG COLOR:', bgColor);

    // Also check if there's a dark mode toggle
    const darkToggle = await page.locator('button[aria-label*="dark" i], button[aria-label*="theme" i], [class*="dark-mode"], [class*="theme-toggle"]').first().isVisible().catch(() => false);
    console.log('DARK MODE TOGGLE VISIBLE:', darkToggle);
  });

  // ============================
  // PERFORMANCE CHECKS
  // ============================
  test('23 - Performance metrics', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    console.log('LOAD TIME (ms):', loadTime);

    // Check for layout shifts
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(entry as any).hadRecentInput) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cls += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(cls), 2000);
      });
    });
    console.log('CLS SCORE:', cls);

    // Check for LCP element
    const lcp = await page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resolve((last as any)?.element?.tagName || 'unknown');
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve('timeout'), 3000);
      });
    });
    console.log('LCP ELEMENT:', lcp);

    // Check bundle size via network
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.includes('.js') || r.name.includes('.css'))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(r => ({ name: r.name.split('/').pop(), size: (r as any).transferSize }))
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, 5);
    });
    console.log('TOP 5 LARGEST RESOURCES:', JSON.stringify(resources));
  });

  // ============================
  // FOOTER LINKS TEST
  // ============================
  test('24 - Footer links', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await ss(page, '24-footer-close');

    const footerLinks = await page.locator('footer a').all();
    console.log('FOOTER LINK COUNT:', footerLinks.length);

    for (const link of footerLinks) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`FOOTER LINK: "${text?.trim()}" → ${href}`);
    }

    // Email link
    const emailLink = await page.locator('footer a[href^="mailto:"]').first().getAttribute('href').catch(() => 'NOT FOUND');
    console.log('FOOTER EMAIL:', emailLink);
  });

  // ============================
  // FULL PAGE SCREENSHOTS (various routes)
  // ============================
  test('25 - All accessible pages screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const pages = [
      { url: BASE_URL, name: 'landing' },
      { url: `${BASE_URL}/auth`, name: 'auth' },
      { url: `${BASE_URL}/terms-of-service`, name: 'terms' },
      { url: `${BASE_URL}/privacy-policy`, name: 'privacy' },
    ];

    for (const p of pages) {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
      await ss(page, `25-${p.name}`);
    }
  });

  // ============================
  // OAUTH WELCOME / SIGNIN
  // ============================
  test('26 - OAuth buttons check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const googleBtn = await page.locator('button:has-text("Google"), button:has-text("גוגל"), [class*="google"]').first().isVisible().catch(() => false);
    const facebookBtn = await page.locator('button:has-text("Facebook"), button:has-text("פייסבוק")').first().isVisible().catch(() => false);
    const appleBtn = await page.locator('button:has-text("Apple"), button:has-text("אפל")').first().isVisible().catch(() => false);

    console.log('GOOGLE OAUTH BTN:', googleBtn);
    console.log('FACEBOOK OAUTH BTN:', facebookBtn);
    console.log('APPLE OAUTH BTN:', appleBtn);

    // Check what emoji/icon is used in auth header (previous issue: 🏠 emoji)
    const authHeaderText = await page.locator('h1, h2, [class*="header"]').first().textContent().catch(() => '');
    const hasHomeEmoji = authHeaderText?.includes('🏠');
    console.log('AUTH HEADER HAS 🏠 EMOJI:', hasHomeEmoji);
    console.log('AUTH HEADER TEXT:', authHeaderText);

    await ss(page, '26-oauth-buttons');
  });

  // ============================
  // COMPLETE FLOW SCREENCAPTURE
  // ============================
  test('27 - Detailed hero section analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Viewport screenshot (above fold only)
    await page.screenshot({ path: path.join(SS_DIR, '27a-hero-above-fold.png') });

    // Get all text on page for analysis
    const allText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while ((node = walker.nextNode()) !== null) {
        const text = node.textContent?.trim();
        if (text && text.length > 3) texts.push(text);
      }
      return texts.join('\n');
    });

    // Stats check
    const has85Match = allText.includes('85%');
    const hasFakeStats = allText.match(/\d+[k+,]+\s*(users|rooms|matches)/i);
    console.log('HAS 85% MATCH CLAIM:', has85Match);
    console.log('HAS FAKE STATS PATTERN:', hasFakeStats?.[0] || 'none');

    // Check specific copy issues from previous audit
    const hasIsraelSmartestClaim = allText.toLowerCase().includes('smartest');
    console.log('HAS "SMARTEST" CLAIM:', hasIsraelSmartestClaim);

    // Preview listing "Example" badge
    const exampleBadge = await page.locator('text="Example", [class*="badge"]:has-text("Example"), [class*="badge"]:has-text("דוגמה")').count();
    console.log('EXAMPLE BADGE COUNT:', exampleBadge);

    // All heading text
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('ALL HEADINGS:', JSON.stringify(headings));

    // All badge texts
    const badges = await page.locator('[class*="badge"], [class*="chip"], [class*="tag"], [class*="pill"]').allTextContents();
    console.log('ALL BADGES:', JSON.stringify(badges));

    await ss(page, '27b-full-landing-for-analysis');
  });

  // Check nav section specifically
  test('28 - Nav section deep analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Nav screenshot - just the top
    await page.screenshot({
      path: path.join(SS_DIR, '28-nav-closeup.png'),
      clip: { x: 0, y: 0, width: 1440, height: 100 }
    });

    const navHTML = await page.locator('nav, header').first().innerHTML().catch(() => 'NOT FOUND');
    console.log('NAV HTML (first 1000):', navHTML.substring(0, 1000));

    // Specifically check for logo vs text
    const navImgs = await page.locator('nav img, header img').count();
    console.log('IMAGES IN NAV:', navImgs);

    const navText = await page.locator('nav, header').first().textContent();
    console.log('NAV TEXT:', navText?.substring(0, 200));
  });

});
