import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Security headers configured in vercel.json (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
// TODO [POST-LAUNCH]: Add rate limiting at the CDN/edge layer before scaling.
// Currently no global API rate limit — a scraper can enumerate all profiles with the anon key.
// Options:
//   A. Vercel Edge Middleware: middleware.ts → check req rate by IP using Vercel KV
//   B. Cloudflare WAF rule: rate-limit requests to *.supabase.co/* per IP
//   C. Move useAllProfiles behind a Supabase Edge Function with per-user throttle
// Also monitor squad_messages INSERT errors post-launch — a spike indicates malicious
// large-message attempts being blocked by the squad_messages_content_len constraint.
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
