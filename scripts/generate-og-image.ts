import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

  body {
    width: 1200px;
    height: 630px;
    background: #fbfaf9;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 72px 80px;
  }

  /* Background blobs */
  .blob1 {
    position: absolute;
    top: -120px;
    right: -80px;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.04) 60%, transparent 100%);
    border-radius: 50%;
  }
  .blob2 {
    position: absolute;
    bottom: -100px;
    left: -60px;
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
    border-radius: 50%;
  }
  .blob3 {
    position: absolute;
    top: 200px;
    right: 240px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  /* Dot grid texture */
  .dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(139,92,246,0.08) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  .content {
    position: relative;
    z-index: 10;
  }

  /* Logo row */
  .logo-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 32px;
  }

  .logo-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(139,92,246,0.4);
  }

  .logo-icon svg {
    width: 32px;
    height: 32px;
    fill: white;
  }

  .brand {
    font-size: 34px;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.5px;
  }
  .brand span {
    color: #8b5cf6;
  }

  /* Badge */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(139,92,246,0.1);
    border: 1px solid rgba(139,92,246,0.25);
    border-radius: 100px;
    padding: 6px 14px;
    margin-bottom: 24px;
  }
  .badge-dot {
    width: 7px;
    height: 7px;
    background: #8b5cf6;
    border-radius: 50%;
  }
  .badge-text {
    font-size: 13px;
    font-weight: 600;
    color: #8b5cf6;
    letter-spacing: 0.02em;
  }

  /* Hero headline */
  h1 {
    font-size: 64px;
    font-weight: 900;
    line-height: 1.05;
    color: #0f0f0f;
    letter-spacing: -2px;
    margin-bottom: 20px;
    max-width: 640px;
  }
  h1 em {
    font-style: normal;
    color: #8b5cf6;
  }

  /* Sub */
  .sub {
    font-size: 20px;
    font-weight: 400;
    color: #6b6b6b;
    margin-bottom: 40px;
    max-width: 520px;
    line-height: 1.5;
  }

  /* Pill stats row */
  .stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .stat-pill {
    background: white;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 100px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .stat-num {
    font-size: 17px;
    font-weight: 800;
    color: #0f0f0f;
  }
  .stat-label {
    font-size: 14px;
    color: #888;
    font-weight: 500;
  }

  /* Right side visual */
  .visual {
    position: absolute;
    right: 80px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 300px;
  }

  .profile-card {
    background: white;
    border-radius: 20px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }

  .card-info {
    flex: 1;
  }
  .card-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f0f0f;
    margin-bottom: 2px;
  }
  .card-sub {
    font-size: 12px;
    color: #888;
  }

  .match-badge {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    font-size: 12px;
    font-weight: 700;
    border-radius: 100px;
    padding: 4px 10px;
  }

  .card-lifestyle {
    display: flex;
    gap: 5px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .tag {
    font-size: 11px;
    background: #f5f3ff;
    color: #7c3aed;
    border-radius: 6px;
    padding: 3px 7px;
    font-weight: 600;
  }

  /* Bottom border accent */
  .bottom-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #8b5cf6, #a78bfa, #c4b5fd);
  }

  /* URL watermark */
  .url {
    position: absolute;
    bottom: 20px;
    right: 80px;
    font-size: 13px;
    color: #bbb;
    font-weight: 500;
  }
</style>
</head>
<body>
  <div class="dots"></div>
  <div class="blob1"></div>
  <div class="blob2"></div>
  <div class="blob3"></div>

  <div class="content">
    <div class="logo-row">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
        </svg>
      </div>
      <div class="brand">Roo<span>Match</span></div>
    </div>

    <div class="badge">
      <div class="badge-dot"></div>
      <span class="badge-text">Lifestyle-first roommate matching</span>
    </div>

    <h1>Find a roommate who<br/>actually <em>fits</em> your life.</h1>

    <p class="sub">14 compatibility factors. Squad search. Free forever.</p>

    <div class="stats">
      <div class="stat-pill">
        <span class="stat-num">14</span>
        <span class="stat-label">Lifestyle factors</span>
      </div>
      <div class="stat-pill">
        <span class="stat-num">3</span>
        <span class="stat-label">Languages</span>
      </div>
      <div class="stat-pill">
        <span class="stat-num">₪0</span>
        <span class="stat-label">To get matched</span>
      </div>
    </div>
  </div>

  <!-- Right side profile cards -->
  <div class="visual">
    <div class="profile-card">
      <div class="avatar" style="background:#fde8ff;">🧘</div>
      <div class="card-info">
        <div class="card-name">Maya, 26</div>
        <div class="card-sub">Tel Aviv · ₪3,200/mo</div>
        <div class="card-lifestyle">
          <span class="tag">Early bird</span>
          <span class="tag">Non-smoker</span>
          <span class="tag">WFH</span>
        </div>
      </div>
      <div class="match-badge">94%</div>
    </div>

    <div class="profile-card">
      <div class="avatar" style="background:#e0f2fe;">🎸</div>
      <div class="card-info">
        <div class="card-name">Lior, 24</div>
        <div class="card-sub">Ramat Gan · ₪2,800/mo</div>
        <div class="card-lifestyle">
          <span class="tag">Night owl</span>
          <span class="tag">Social</span>
          <span class="tag">Vegan</span>
        </div>
      </div>
      <div class="match-badge">88%</div>
    </div>

    <div class="profile-card">
      <div class="avatar" style="background:#f0fdf4;">🎨</div>
      <div class="card-info">
        <div class="card-name">Noa, 28</div>
        <div class="card-sub">Herzliya · ₪3,600/mo</div>
        <div class="card-lifestyle">
          <span class="tag">Quiet</span>
          <span class="tag">Clean</span>
          <span class="tag">No pets</span>
        </div>
      </div>
      <div class="match-badge">91%</div>
    </div>
  </div>

  <div class="bottom-bar"></div>
  <div class="url">roommate-match-nine.vercel.app</div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const outPath = path.resolve(__dirname, "../public/og-image.png");
  await page.screenshot({ path: outPath, type: "png" });
  await browser.close();
  console.log("OG image saved to:", outPath);
}

main();
