import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyEmail() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  // If already verified, check onboarding and redirect
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (user?.email_confirmed_at && !verified) {
      handleVerifiedRedirect();
    }
  }, [user, loading, navigate]);

  const handleVerifiedRedirect = async () => {
    setVerified(true);
    // Check onboarding status
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("user_id", user!.id)
      .maybeSingle();

    // Brief success animation before redirect
    setTimeout(() => {
      if (data?.onboarding_complete) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }, 1800);
  };

  // Poll for verification every 3 seconds
  useEffect(() => {
    if (!user || user.email_confirmed_at || verified) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at) {
        toast.success("Email verified! 🎉");
        await supabase.auth.refreshSession();
        handleVerifiedRedirect();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [user, navigate, verified]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !user?.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email sent!");
      setResendCooldown(60);
    }
  };

  const handleChangeEmail = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Success state - show verified animation before redirect
  if (verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-extrabold text-foreground tracking-tight mb-2"
          >
            Email Verified! ✨
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground text-sm"
          >
            Setting up your profile…
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <RefreshCw className="w-5 h-5 animate-spin text-primary mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Mail className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm mb-1">
          We sent a verification link to
        </p>
        <p className="text-foreground font-semibold text-sm mb-6">
          {user?.email}
        </p>

        <div className="bg-secondary/50 rounded-2xl p-4 mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Open the email and click <span className="font-semibold text-foreground">"Verify Email"</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              You'll be redirected back here automatically
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-muted-foreground/40 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Check your spam folder if you don't see it
            </p>
          </div>
        </div>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
        >
          {resending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend verification email"}
        </button>

        {/* Change email */}
        <button
          onClick={handleChangeEmail}
          className="w-full text-muted-foreground text-sm py-2 flex items-center justify-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Sign up with a different email
        </button>
      </motion.div>
    </div>
  );
}
