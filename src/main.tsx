import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  environment: import.meta.env.VITE_PADDLE_ENV === "production" ? "production" : "development",
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById("root")!).render(<App />);
