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

    // 1. Get all conversation IDs for this user
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) { setTotalUnread(0); return; }

    const convIds = participations.map(p => p.conversation_id);

    // 2. Batch: get all incoming messages across all conversations
    const { data: msgs } = await supabase
      .from("messages")
      .select("id")
      .in("conversation_id", convIds)
      .neq("sender_id", user.id);

    if (!msgs?.length) { setTotalUnread(0); return; }

    // 3. Batch: get all read receipts for those messages in one query
    const { data: receipts } = await supabase
      .from("message_read_receipts")
      .select("message_id")
      .eq("user_id", user.id)
      .in("message_id", msgs.map(m => m.id));

    const readSet = new Set(receipts?.map(r => r.message_id) ?? []);
    setTotalUnread(msgs.filter(m => !readSet.has(m.id)).length);
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
