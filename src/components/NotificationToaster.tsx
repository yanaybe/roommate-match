// Listens for new notifications in real-time and shows a toast.
// Mount this once inside NotificationsProvider.

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationToaster() {
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  // Track which IDs we've already toasted so we don't re-fire on re-renders
  const seenRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Skip the first batch (notifications that already existed on load)
    if (!initialLoadDone.current) {
      notifications.forEach((n) => seenRef.current.add(n.id));
      initialLoadDone.current = true;
      return;
    }

    notifications.forEach((n) => {
      if (seenRef.current.has(n.id)) return;
      seenRef.current.add(n.id);

      // Only toast for unread (newly arrived) notifications
      if (n.read) return;

      toast(n.title, {
        description: n.body ?? undefined,
        action: {
          label: n.type === "match" ? "Chat" : "View",
          onClick: () => {
            if (n.type === "match") navigate("/chats");
            if (n.type === "squad_invite" && n.reference_id) navigate(`/squad/${n.reference_id}`);
          },
        },
        duration: 6000,
      });
    });
  }, [notifications, navigate]);

  return null;
}
