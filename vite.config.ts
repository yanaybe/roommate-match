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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — never changes, cache forever
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Animation & UI utilities
          "vendor-motion": ["framer-motion"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Paddle payment SDK
          "vendor-paddle": ["@paddle/paddle-js"],
          // Map (Leaflet is very large)
          "vendor-leaflet": ["leaflet", "react-leaflet"],
          // i18n & form utilities
          "vendor-utils": ["react-hook-form", "zod", "sonner", "date-fns"],
          // Radix UI components (large but shared)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-scroll-area",
          ],
        },
      },
    },
    // Raise chunk warning threshold slightly since Leaflet is inherently large
    chunkSizeWarningLimit: 600,
  },
}));
