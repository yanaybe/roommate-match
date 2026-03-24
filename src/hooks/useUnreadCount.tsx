import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UnreadCountContextType {
  totalUnread: number;
  refresh: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextType>({ totalUnread: 0, refresh: () => {} });

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setTotalUnread(0); return; }

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) { setTotalUnread(0); return; }

    let total = 0;
    for (const p of participations) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", p.conversation_id)
        .neq("sender_id", user.id);

      if (!msgs?.length) continue;

      const { data: receipts } = await supabase
        .from("message_read_receipts")
        .select("message_id")
        .eq("user_id", user.id)
        .in("message_id", msgs.map(m => m.id));

      const readSet = new Set(receipts?.map(r => r.message_id) ?? []);
      total += msgs.filter(m => !readSet.has(m.id)).length;
    }
    setTotalUnread(total);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <UnreadCountContext.Provider value={{ totalUnread, refresh }}>
      {children}
    </UnreadCountContext.Provider>
  );
}

export function useUnreadCount() {
  return useContext(UnreadCountContext);
}
