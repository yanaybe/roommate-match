import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

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

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate("/");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else navigate("/verify-email");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Roo<span className="text-primary">match</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? t("welcomeBack") : t("createYourAccount")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? t("loading") : isLogin ? t("signIn") : t("signUp")}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold"
          >
            {isLogin ? t("signUp") : t("signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}
