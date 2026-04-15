import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";
import { Home, MessageCircle, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { analyzePassword } from "@/lib/security";

const emailSchema = z.string().email("Invalid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
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

  useEffect(() => {
    if (!user) return;
    // If email not verified, send to verification screen
    if (!user.email_confirmed_at) {
      navigate("/verify-email", { replace: true });
      return;
    }
    // Check if user has completed onboarding
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
      if (!password) { toast.error("Password is required"); setLoading(false); return; }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate("/");
    } else {
      const pwResult = passwordSchema.safeParse(password);
      if (!pwResult.success) {
        toast.error(pwResult.error.issues[0].message);
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      if (error) toast.error(error.message);
      else navigate("/verify-email");
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

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
    { icon: Home, text: "Smart compatibility matching" },
    { icon: MessageCircle, text: "Chat directly with roommates" },
    { icon: ShieldCheck, text: "Verified profiles & safe community" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/15 via-primary/5 to-background">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center flex-1 px-6 pt-16 pb-10 text-center"
      >
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-5 shadow-lg">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Find your perfect<br /><span className="text-primary">roommate</span>
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Join thousands of people finding their ideal living situation
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {features.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm"
            >
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-card-foreground text-left">{text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Form sheet */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-card rounded-t-3xl px-6 pt-6 pb-10 shadow-[0_-8px_32px_rgba(0,0,0,0.10)]"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-foreground">{t("createYourAccount")}</h2>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">Step 1 of 2</span>
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
                  {pwAnalysis.strength === "weak" ? "Weak" : pwAnalysis.strength === "fair" ? "Fair" : "Strong"} password
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
              placeholder="Confirm password"
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
            <p className="text-destructive text-xs -mt-1 font-medium">Passwords do not match</p>
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
      </motion.div>
    </div>
  );
}
