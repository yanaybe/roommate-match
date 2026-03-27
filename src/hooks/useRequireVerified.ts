import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Returns a wrapper that checks both auth AND email verification before running an action.
 * If not authenticated → redirects to /auth
 * If not verified → shows verification prompt
 */
export function useRequireVerified() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isVerified = !!user?.email_confirmed_at;

  const requireVerified = useCallback(
    (action: () => void) => {
      if (!user) {
        toast.info("Sign in to continue");
        navigate("/auth");
        return;
      }
      if (!user.email_confirmed_at) {
        toast("📧 Please verify your email to continue", {
          description: "Check your inbox for the verification link",
          action: {
            label: "Go to verification",
            onClick: () => navigate("/verify-email"),
          },
        });
        return;
      }
      action();
    },
    [user, navigate]
  );

  return { user, isVerified, requireVerified };
}
