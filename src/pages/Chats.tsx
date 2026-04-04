import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Check, CheckCheck, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Conversation {
  id: string;
  other_user_id: string;
  other_name: string;
  other_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

export default function Chats() {
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnreadCount();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversations — batched to avoid N+1 queries
  const loadConversations = useCallback(async () => {
    if (!user) return;

    // 1. Get all conversation IDs for this user
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!participations?.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map((p) => p.conversation_id);

    // 2. Batch: get all other participants across all conversations
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", user.id);

    // 3. Batch: get all profiles for other users
    const otherUserIds = [...new Set((allParticipants ?? []).map((p) => p.user_id))];
    const { data: profiles } = otherUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", otherUserIds)
      : { data: [] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    // 4. Batch: get all messages for all conversations (for last message + unread counts)
    const { data: allMessages } = await supabase
      .from("messages")
      .select("id, conversation_id, content, sender_id, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });

    // 5. Batch: get all read receipts for this user in one query
    const allMsgIds = (allMessages ?? []).map((m) => m.id);
    const { data: readReceipts } = allMsgIds.length > 0
      ? await supabase.from("message_read_receipts").select("message_id").eq("user_id", user.id).in("message_id", allMsgIds)
      : { data: [] };
    const readIds = new Set((readReceipts ?? []).map((r) => r.message_id));

    // Build lookup: convId -> first other participant
    const otherByConv = new Map<string, string>();
    (allParticipants ?? []).forEach((p) => {
      if (!otherByConv.has(p.conversation_id)) {
        otherByConv.set(p.conversation_id, p.user_id);
      }
    });

    // Group messages by conversation (already sorted desc, first = latest)
    const msgsByConv = new Map<string, (typeof allMessages & object[])>();
    (allMessages ?? []).forEach((m) => {
      const list = msgsByConv.get(m.conversation_id) ?? [];
      list.push(m);
      msgsByConv.set(m.conversation_id, list);
    });

    // Assemble conversations, deduplicating by other_user_id
    const convMap = new Map<string, Conversation>();
    for (const convId of convIds) {
      const otherUserId = otherByConv.get(convId) ?? "";
      const profile = profileMap.get(otherUserId) as { name?: string; avatar_url?: string } | undefined;
      const otherName = profile?.name ?? otherUserId.slice(0, 8) + "...";
      const otherAvatar = profile?.avatar_url ?? null;

      const msgs = msgsByConv.get(convId) ?? [];
      const lastMsg = msgs[0] ?? null;
      const unreadCount = msgs.filter((m) => m.sender_id !== user.id && !readIds.has(m.id)).length;

      const conv: Conversation = {
        id: convId,
        other_user_id: otherUserId,
        other_name: otherName,
        other_avatar: otherAvatar,
        last_message: lastMsg?.content ?? null,
        last_message_at: lastMsg?.created_at ?? null,
        unread_count: unreadCount,
      };

      const existing = convMap.get(otherUserId);
      if (!existing || (conv.last_message_at && (!existing.last_message_at || conv.last_message_at > existing.last_message_at))) {
        convMap.set(otherUserId, conv);
      }
    }

    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation & mark as read
  useEffect(() => {
    if (!activeConv || !user) return;

    const loadMessages = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at")
        .eq("conversation_id", activeConv)
        .order("created_at", { ascending: true });

      const msgIds = msgs?.map((m) => m.id) ?? [];
      const { data: receipts } = await supabase
        .from("message_read_receipts")
        .select("message_id")
        .in("message_id", msgIds.length > 0 ? msgIds : ["none"]);

      const readSet = new Set(receipts?.map((r) => r.message_id) ?? []);

      setMessages(
        msgs?.map((m) => ({
          ...m,
          is_read: readSet.has(m.id),
        })) ?? []
      );

      // Mark unread incoming messages as read
      const unreadIncoming = msgs?.filter(
        (m) => m.sender_id !== user.id && !readSet.has(m.id)
      );
      if (unreadIncoming?.length) {
        const inserts = unreadIncoming.map((m) => ({
          message_id: m.id,
          user_id: user.id,
        }));
        await supabase.from("message_read_receipts").insert(inserts);

        // Update local conversation unread count to 0
        setConversations((prev) =>
          prev.map((c) => c.id === activeConv ? { ...c, unread_count: 0 } : c)
        );
        refreshUnread();
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${activeConv}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => [
            ...prev,
            { ...newMsg, is_read: false },
          ]);

          // Auto mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            await supabase.from("message_read_receipts").insert({
              message_id: newMsg.id,
              user_id: user.id,
            });
            refreshUnread();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_read_receipts",
        },
        () => {
          setMessages((prev) =>
            prev.map((m) => ({ ...m, is_read: true }))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv, user, refreshUnread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || !user) return;

    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      conversation_id: activeConv,
      sender_id: user.id,
      content,
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return formatTime(dateStr);
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString();
  };

  const deleteConversation = async (convId: string) => {
    if (!user) return;
    // Delete read receipts, messages, participation, then conversation
    const { data: msgs } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", convId);
    const msgIds = (msgs ?? []).map((m) => m.id);
    if (msgIds.length > 0) {
      await supabase.from("message_read_receipts").delete().in("message_id", msgIds);
      await supabase.from("messages").delete().eq("conversation_id", convId);
    }
    await supabase.from("conversation_participants").delete().eq("conversation_id", convId).eq("user_id", user.id);
    await supabase.from("conversations").delete().eq("id", convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    setDeleteTarget(null);
    refreshUnread();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <p className="text-muted-foreground">{t("signInToChat")}</p>
      </div>
    );
  }

  if (activeConv) {
    const conv = conversations.find((c) => c.id === activeConv);
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="max-w-lg mx-auto px-4 pt-12 pb-3 flex items-center gap-3">
            <button
              onClick={() => { setActiveConv(null); loadConversations(); }}
              className="p-1 -ml-1 text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {conv?.other_avatar ? (
              <img src={conv.other_avatar} alt={conv.other_name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {conv?.other_name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-bold text-foreground text-sm">
                {conv?.other_name}
              </h2>
              <p className="text-muted-foreground text-xs">{t("online")}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-0.5 ${
                        isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                      {isMine && (
                        msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="sticky bottom-20 bg-background border-t border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t("typeMessage")}
              className="flex-1 bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="gradient-primary p-2.5 rounded-full disabled:opacity-40"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <h1 className="text-xl font-extrabold text-foreground">{t("messages")}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground text-sm">{t("loadingChats")}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-bold text-foreground mb-1">{t("noConversationsYet")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("matchToChat")}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveConv(conv.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border/50 text-left"
              >
                {conv.other_avatar ? (
                  <img src={conv.other_avatar} alt={conv.other_name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">
                      {conv.other_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-card-foreground text-sm">
                      {conv.other_name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm truncate">
                    {conv.last_message ?? t("startChatting")}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="gradient-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {conv.unread_count}
                  </span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
