import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Returns a wrapper that checks auth before running an action.
 * If not authenticated, redirects to /auth with a toast.
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const requireAuth = useCallback(
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
            label: "Verify",
            onClick: () => navigate("/verify-email"),
          },
        });
        return;
      }
      action();
    },
    [user, navigate]
  );

  return { user, requireAuth };
}
