import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { Home, MessageCircle, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { analyzePassword } from "@/lib/security";
import { analytics } from "@/lib/analytics";

// ── Auth error mapper ─────────────────────────────────────────────────────────
// Maps Supabase Auth error codes/messages to user-friendly generic strings.
// Raw Supabase messages must NEVER be shown — they can enumerate registered
// emails, leak internal DB errors, or expose server configuration.
function mapAuthError(err: { message?: string; code?: string; status?: number } | null): string {
  if (!err) return "Something went wrong. Please try again.";
  const msg = (err.message ?? "").toLowerCase();
  const code = (err.code ?? "").toLowerCase();

  // Wrong credentials — deliberately vague (prevents email enumeration)
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  // Email already taken
  if (code === "user_already_exists" || msg.includes("user already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists.";
  }
  // Email not confirmed
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  // Rate limit
  if (msg.includes("rate limit") || msg.includes("too many") || err.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  // Signups disabled
  if (msg.includes("signup") && msg.includes("disabled")) {
    return "Sign-ups are temporarily unavailable. Please try again later.";
  }
  // Weak password (shouldn't reach UI with our schema, but defensive)
  if (code === "weak_password" || msg.includes("weak_password")) {
    return "Your password doesn't meet the strength requirements.";
  }
  // OAuth / provider errors
  if (msg.includes("provider") || msg.includes("oauth")) {
    return "Could not connect with the provider. Please try again.";
  }
  // Any internal / unexpected error — never expose raw message
  return "Something went wrong. Please try again.";
}

const emailSchema = z.string().email("Invalid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export default function Auth() {
  const [searchParams] = useSearchParams();
  // Pre-select tab based on ?mode=login or ?mode=register from Landing page links
  const [isLogin, setIsLogin] = useState(() => searchParams.get("mode") !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const pwAnalysis = analyzePassword(password);

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast.error(mapAuthError(error));
  };

  useEffect(() => {
    if (!user) return;
    // Check if user has completed onboarding and route accordingly.
    // Email verification is now a soft banner — no hard gate here.
    const checkProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.onboarding_complete) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };
    checkProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (isLogin) {
      if (!password) { toast.error(t("passwordRequired")); setLoading(false); return; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(mapAuthError(error));
      else { analytics.login(); navigate("/"); }
    } else {
      const pwResult = passwordSchema.safeParse(password);
      if (!pwResult.success) {
        toast.error(pwResult.error.issues[0].message);
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error(t("passwordsDoNotMatch"));
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      if (error) toast.error(mapAuthError(error));
      else { analytics.signup(); navigate("/onboarding"); }
    }
    setLoading(false);
  };

  /* ── Sign-in view ── */
  if (isLogin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Roo<span className="text-primary">match</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("welcomeBack")}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl text-sm border border-border hover:bg-secondary/70 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="space-y-1">
              <input
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) { toast.error(t("enterEmailFirst")); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/auth`,
                    });
                    if (error) toast.error(mapAuthError(error));
                    else toast.success(t("passwordResetSent"));
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {t("forgotPassword")}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? t("loading") : t("signIn")}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            {t("dontHaveAccount")}{" "}
            <button onClick={() => setIsLogin(false)} className="text-primary font-semibold">
              {t("signUp")}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  /* ── Sign-up view ── */
  const features = [
    { icon: Home, text: t("featureSmart") },
    { icon: MessageCircle, text: t("featureChat") },
    { icon: ShieldCheck, text: t("featureVerified") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Compact header — form is immediately visible on mobile */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center pt-10 pb-5 px-6 text-center"
      >
        <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center mb-3 shadow-lg">
          <span className="text-2xl">🏠</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Roo<span className="text-primary">match</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Create your account — it takes 2 minutes.</p>
      </motion.div>

      {/* Form sheet */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="flex-1 bg-card rounded-t-3xl px-6 pt-6 pb-10 shadow-[0_-8px_32px_rgba(0,0,0,0.10)]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-foreground">{t("createYourAccount")}</h2>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{t("stepOneOfTwo")}</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 bg-secondary text-secondary-foreground font-semibold py-3 rounded-xl text-sm border border-border hover:bg-secondary/70 transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Password + strength meter */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="space-y-1.5">
                {/* Strength bars */}
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        pwAnalysis.score >= level * 1.5
                          ? level === 1 ? "bg-destructive"
                            : level === 2 ? "bg-yellow-500"
                            : "bg-green-500"
                          : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${
                  pwAnalysis.strength === "weak" ? "text-destructive"
                  : pwAnalysis.strength === "fair" ? "text-yellow-500"
                  : "text-green-500"
                }`}>
                  {pwAnalysis.strength === "weak" ? t("weakPasswordLabel") : pwAnalysis.strength === "fair" ? t("fairPasswordLabel") : t("strongPasswordLabel")}
                </p>
                {pwAnalysis.missing.length > 0 && (
                  <ul className="space-y-0.5">
                    {pwAnalysis.missing.map((m) => (
                      <li key={m} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground inline-block" />
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={`w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                confirmPassword.length > 0 && confirmPassword !== password ? "ring-2 ring-destructive" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <p className="text-destructive text-xs -mt-1 font-medium">{t("passwordsDoNotMatch")}</p>
          )}

          <button
            type="submit"
            disabled={loading || pwAnalysis.strength === "weak" || password !== confirmPassword}
            className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t("loading") : (
              <>{t("signUp")} <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-5">
          {t("alreadyHaveAccount")}{" "}
          <button onClick={() => setIsLogin(true)} className="text-primary font-semibold">
            {t("signIn")}
          </button>
        </p>

        {/* Reassurance block — features below the form */}
        <div className="mt-6 pt-5 border-t border-border space-y-2.5">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
