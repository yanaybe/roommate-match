// Phone verification sheet.
// Uses Supabase phone auth OTP:
//   Step 1: user enters phone → supabase.auth.updateUser({ phone }) sends OTP
//   Step 2: user enters 6-digit code → verifyOtp marks phone as verified
//   Step 3: we set phone_verified = true on their profile row
//
// Requires Phone auth to be enabled in the Supabase project settings.

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Phone, Loader2, CheckCircle2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

async function trackOtpAttempt(
  phone: string,
  failed: boolean,
): Promise<{ allowed: boolean; locked_until: string | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/otp-rate-limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ identifier: phone, action: "otp_verify", failed }),
    });
    return await res.json();
  } catch {
    // Fail open if edge function is unreachable so users aren't blocked by infra issues
    return { allowed: true, locked_until: null };
  }
}

const OTP_ATTEMPTS_KEY = "otp_attempts";
const OTP_LOCKOUT_KEY = "otp_lockout_until";
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVerified: () => void;
}

export default function PhoneVerifySheet({ open, onOpenChange, onVerified }: Props) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [loading, setLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState<number>(() => {
    const stored = sessionStorage.getItem(OTP_ATTEMPTS_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockedUntil, setLockedUntil] = useState<number>(() => {
    const stored = sessionStorage.getItem(OTP_LOCKOUT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Sync OTP attempts to sessionStorage so they survive DevTools state resets
  useEffect(() => {
    sessionStorage.setItem(OTP_ATTEMPTS_KEY, String(otpAttempts));
  }, [otpAttempts]);

  // When the sheet opens, check for an active lockout and expire stale data
  useEffect(() => {
    if (!open) return;
    const stored = sessionStorage.getItem(OTP_LOCKOUT_KEY);
    if (stored) {
      const expiry = parseInt(stored, 10);
      if (expiry > Date.now()) {
        setLockedUntil(expiry);
        toast.error("Too many attempts. Please wait before trying again.");
      } else {
        sessionStorage.removeItem(OTP_LOCKOUT_KEY);
        sessionStorage.removeItem(OTP_ATTEMPTS_KEY);
        setLockedUntil(0);
        setOtpAttempts(0);
      }
    }
  }, [open]);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned.startsWith("+")) {
      toast.error("Enter your phone with country code, e.g. +972501234567");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ phone: cleaned });
      if (error) throw error;
      setStep("otp");
      setOtpAttempts(0);
      setLockedUntil(0);
      sessionStorage.removeItem(OTP_LOCKOUT_KEY);
      toast.success("OTP sent! Check your SMS.");
      // Reset any server-side rate limit record when a new OTP is issued
      trackOtpAttempt(cleaned, false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleaned = phone.replace(/\s/g, "");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: cleaned,
        token: otp,
        type: "phone_change",
      });
      if (error) throw error;

      await supabase.rpc("mark_phone_verified", {
        p_user_id: user!.id,
        p_phone: cleaned,
      });

      // Clear server-side rate limit on successful verification
      trackOtpAttempt(cleaned, false);

      setStep("done");
      toast.success("Phone verified! ✅");
      onVerified();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      console.error(err);

      // Report failure to server-side rate limiter and check if now locked
      const rlResult = await trackOtpAttempt(cleaned, true);
      if (!rlResult.allowed) {
        // Server-side lock takes precedence — use a 15-minute local mirror
        const expiry = Date.now() + 15 * 60 * 1000;
        sessionStorage.setItem(OTP_LOCKOUT_KEY, String(expiry));
        setLockedUntil(expiry);
        toast.error("Too many attempts. Please try again in 15 minutes.");
      } else if (newAttempts >= 3) {
        const expiry = Date.now() + LOCKOUT_DURATION_MS;
        sessionStorage.setItem(OTP_LOCKOUT_KEY, String(expiry));
        setLockedUntil(expiry);
        toast.error("Too many attempts. Please request a new code.");
      } else {
        toast.error("OTP verification failed. Please check the code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg font-extrabold">
            <Phone className="w-5 h-5 text-green-500" />
            Verify Phone Number
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 py-5 space-y-4">
          {step === "phone" && (
            <>
              <p className="text-sm text-muted-foreground">
                A verified phone number builds trust with future roommates and increases your match chances.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+972 50 123 4567"
                  className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g. +972 for Israel)</p>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading || !phone.trim()}
                className="w-full py-3.5 gradient-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {loading ? "Sending…" : "Send verification code"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code we sent to <strong>{phone}</strong>.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Verification code</label>
                <input
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center text-xl font-bold tracking-widest"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4 || otpAttempts >= 3 || lockedUntil > Date.now()}
                className="w-full py-3.5 gradient-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button onClick={() => setStep("phone")} className="w-full text-center text-sm text-muted-foreground">
                ← Change number
              </button>
            </>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
              <p className="text-lg font-bold text-foreground">Phone Verified!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your profile now shows a verified phone badge. Roommates will trust you more.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-8 py-3 gradient-primary text-primary-foreground rounded-2xl font-bold text-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
