// ── Text sanitization ────────────────────────────────────────────────────────
// Strips null bytes, ASCII control chars, zero-width chars, and Unicode
// bidirectional override characters (e.g. \u202E can reverse displayed text).
export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")          // null byte + control chars
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, "") // zero-width + bidi overrides
    .trim();
}

// ── URL safety ───────────────────────────────────────────────────────────────
// Rejects javascript:, data:, and any non-https scheme.
export function isSafeImageUrl(url: string): boolean {
  if (!url) return true; // empty is fine (no avatar)
  try {
    const { protocol } = new URL(url);
    return protocol === "https:";
  } catch {
    return false;
  }
}

// ── Password strength ────────────────────────────────────────────────────────
export type PasswordStrength = "weak" | "fair" | "strong";

export interface PasswordAnalysis {
  strength: PasswordStrength;
  score: number; // 0-5
  missing: string[];
}

export function analyzePassword(pw: string): PasswordAnalysis {
  const missing: string[] = [];
  let score = 0;

  if (pw.length >= 8) score++; else missing.push("At least 8 characters");
  if (/[A-Z]/.test(pw))  score++; else missing.push("One uppercase letter (A-Z)");
  if (/[a-z]/.test(pw))  score++; else missing.push("One lowercase letter (a-z)");
  if (/[0-9]/.test(pw))  score++; else missing.push("One number (0-9)");
  if (/[^A-Za-z0-9]/.test(pw)) score++; else missing.push("One special character (!@#$…)");

  const strength: PasswordStrength =
    score <= 2 ? "weak" : score <= 3 ? "fair" : "strong";

  return { strength, score, missing };
}

// ── Image magic-bytes validation ─────────────────────────────────────────────
// Reads the first 12 bytes of a File and checks against known image signatures.
// This cannot be spoofed by renaming or setting a fake Content-Type header.
export async function validateImageMagicBytes(file: File): Promise<boolean> {
  const buf = await file.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(buf);

  // JPEG  FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
  // PNG   89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true;
  // GIF   47 49 46 38
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return true;
  // WebP  52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return true;

  return false;
}
