import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCheck, Trash2, MoreVertical, Ban, Flag, ChevronDown, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBlockReport } from "@/hooks/useBlockReport";
import ReportSheet from "@/components/ReportSheet";
import { calculateUserMatch } from "@/lib/matching";
import MatchBadge from "@/components/MatchBadge";
import { sanitizeText } from "@/lib/security";
import { toast } from "sonner";
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

function getSharedTraits(a: any, b: any): string[] {
  const traits: string[] = [];
  if (a?.sleep_schedule && a.sleep_schedule === b?.sleep_schedule)
    traits.push(`🌙 Both ${a.sleep_schedule.toLowerCase()}s`);
  if (a?.lifestyle_vibe && a.lifestyle_vibe === b?.lifestyle_vibe)
    traits.push(`🌟 Both "${a.lifestyle_vibe}"`);
  if (a?.wfh && b?.wfh)
    traits.push("🏠 Both work from home");
  if (a?.city && a.city === b?.city)
    traits.push(`📍 Both in ${a.city}`);
  if (!a?.smoking && !b?.smoking)
    traits.push("🚭 Both non-smokers");
  if (!a?.pets && !b?.pets)
    traits.push("🐾 Neither has pets");
  if (a?.budget && b?.budget) {
    const diff = Math.abs(a.budget - b.budget) / ((a.budget + b.budget) / 2);
    if (diff <= 0.2) traits.push("💰 Similar budgets");
  }
  return traits.slice(0, 3);
}

function generateIcebreakers(me: any, other: any, otherName: string): string[] {
  const starters: string[] = [];
  if (me?.sleep_schedule && me.sleep_schedule === other?.sleep_schedule)
    starters.push(`Hey! I saw we're both ${me.sleep_schedule.toLowerCase()}s 🌅`);
  if (me?.lifestyle_vibe && me.lifestyle_vibe === other?.lifestyle_vibe)
    starters.push(`Seems like we have the same vibe — "${me.lifestyle_vibe}"! 🌟`);
  if (me?.city && me.city === other?.city)
    starters.push(`You're looking in ${me.city} too? Where specifically?`);
  if (me?.wfh && other?.wfh)
    starters.push("Fellow WFH person here! Do you mind noise during calls? 🏠");
  if (me?.desired_room_type && me.desired_room_type === other?.desired_room_type)
    starters.push(`We both want a ${me.desired_room_type.toLowerCase()} room — good start!`);
  starters.push(`Hey ${otherName}! Excited to connect 👋`);
  starters.push("What kind of apartment vibe are you looking for?");
  starters.push("Do you have any must-haves for your next place?");
  return starters.slice(0, 4);
}

export default function Chats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refresh: refreshUnread } = useUnreadCount();
  const { profile: myProfile } = useProfile();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  // Rate limiting: track timestamps of recent sends (max 5 per 3 seconds)
  const recentSendTimestamps = useRef<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [contextDismissed, setContextDismissed] = useState(false);

  const activeConvData = conversations.find((c) => c.id === activeConv);
  const { isBlocked, blockUser, unblockUser, reportUser } = useBlockReport(activeConvData?.other_user_id);

  // Fetch other user's profile for context card
  useEffect(() => {
    if (!activeConvData?.other_user_id) { setOtherProfile(null); return; }
    supabase.from("profiles").select("*").eq("user_id", activeConvData.other_user_id).maybeSingle()
      .then(({ data }) => setOtherProfile(data));
    setContextDismissed(false);
  }, [activeConvData?.other_user_id]);

  const matchPercent = useMemo(() => {
    if (!myProfile || !otherProfile) return 0;
    return calculateUserMatch(myProfile, otherProfile);
  }, [myProfile, otherProfile]);

  const sharedTraits = useMemo(() => getSharedTraits(myProfile, otherProfile), [myProfile, otherProfile]);
  const icebreakers = useMemo(
    () => generateIcebreakers(myProfile, otherProfile, activeConvData?.other_name ?? "there"),
    [myProfile, otherProfile, activeConvData?.other_name]
  );
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

    // ── Rate limiting: max 5 messages per 3 seconds ───────────────────────────
    const now = Date.now();
    const WINDOW_MS = 3000;
    const MAX_IN_WINDOW = 5;
    recentSendTimestamps.current = recentSendTimestamps.current.filter(
      (t) => now - t < WINDOW_MS
    );
    if (recentSendTimestamps.current.length >= MAX_IN_WINDOW) {
      toast.error("Slow down — you're sending messages too fast");
      return;
    }
    recentSendTimestamps.current.push(now);

    // ── Sanitize content (strip control chars + bidi overrides) ──────────────
    const content = sanitizeText(newMessage);
    if (!content) return;

    // ── Enforce max message length ────────────────────────────────────────────
    if (content.length > 2000) {
      toast.error("Message too long (max 2000 characters)");
      return;
    }

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
    if (diff < 172800000) return t("yesterday");
    return d.toLocaleDateString();
  };

  const deleteConversation = async (convId: string) => {
    if (!user) return;
    // Verify the current user is actually a participant in this conversation
    const isParticipant = conversations.some((c) => c.id === convId);
    if (!isParticipant) return;
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
      <div className="min-h-screen bg-background flex items-center justify-center pb-28 desk:pb-8">
        <p className="text-muted-foreground">{t("signInToChat")}</p>
      </div>
    );
  }

  const conv = conversations.find((c) => c.id === activeConv);

  // ── Conversation list panel (used in both mobile-only and desktop split) ──
  const ConversationList = (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-12 desk:pt-6 pb-3 border-b border-border">
        <h1 className="text-xl font-extrabold text-foreground">{t("messages")}</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
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
            <p className="text-muted-foreground text-sm mb-4">{t("matchToChat")}</p>
            <button
              onClick={() => navigate("/roommates")}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm"
            >
              {t("findRoommates")}
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border/50 ${activeConv === c.id ? "bg-secondary/70" : ""}`}
              >
                <button
                  onClick={() => setActiveConv(c.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {c.other_avatar ? (
                    <img src={c.other_avatar} alt={c.other_name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold">{c.other_name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-card-foreground text-sm">{c.other_name}</span>
                      <span className="text-muted-foreground text-xs">{formatDate(c.last_message_at)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">{c.last_message ?? t("startChatting")}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="gradient-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.id); }}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );

  // ── Active chat panel ──
  const ChatPanel = activeConv ? (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="shrink-0 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-12 desk:pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => { setActiveConv(null); loadConversations(); }}
            className="desk:hidden p-1 -ml-1 text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {conv?.other_avatar ? (
            <img src={conv.other_avatar} alt={conv.other_name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{conv?.other_name?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-sm">{conv?.other_name}</h2>
            <p className="text-muted-foreground text-xs">{t("online")}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setChatMenuOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            {chatMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-card rounded-2xl shadow-elevated border border-border/50 overflow-hidden z-50">
                <button
                  onClick={() => {
                    setChatMenuOpen(false);
                    if (isBlocked) { unblockUser(); }
                    else { blockUser().then((ok) => { if (ok) { setActiveConv(null); loadConversations(); } }); }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                >
                  <Ban size={15} className="text-destructive shrink-0" />
                  <span className="text-foreground">{isBlocked ? t("unblockUser") : t("blockUser")}</span>
                </button>
                <div className="border-t border-border/40" />
                <button
                  onClick={() => { setChatMenuOpen(false); setReportOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                >
                  <Flag size={15} className="text-destructive shrink-0" />
                  <span className="text-foreground">{t("reportUser")}</span>
                </button>
                <div className="border-t border-border/40" />
                <button
                  onClick={() => { setChatMenuOpen(false); setDeleteTarget(activeConv); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-sm"
                >
                  <Trash2 size={15} className="text-destructive shrink-0" />
                  <span className="text-foreground">{t("deleteChat")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {!contextDismissed && otherProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">{t("whyYouMatched")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {matchPercent > 0 && <MatchBadge percent={matchPercent} size="sm" />}
                  <button onClick={() => setContextDismissed(true)} className="text-muted-foreground hover:text-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {sharedTraits.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {sharedTraits.map((trait) => (
                    <span key={trait} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                    {isMine && (msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" /> : <CheckCheck className="w-3.5 h-3.5" />)}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Icebreakers */}
      {messages.length === 0 && icebreakers.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground mb-2 font-medium">💬 Tap to start the conversation</p>
          <div className="flex flex-wrap gap-2">
            {icebreakers.map((starter) => (
              <button
                key={starter}
                onClick={() => setNewMessage(starter)}
                className="text-xs bg-secondary hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 text-secondary-foreground px-3 py-1.5 rounded-full transition-all text-left"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 bg-background border-t border-border">
        <div className="px-4 py-3 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("typeMessage")}
            maxLength={2000}
            className="flex-1 bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={sendMessage} disabled={!newMessage.trim()} className="gradient-primary p-2.5 rounded-full disabled:opacity-50">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      <ReportSheet
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetName={activeConvData?.other_name ?? "this user"}
        onSubmit={(reason, details) => reportUser(reason, details)}
      />
    </div>
  ) : (
    <div className="hidden desk:flex h-full flex-1 items-center justify-center text-center pt-16 pb-8">
      <div>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
          <Send className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold text-foreground">Select a conversation</p>
        <p className="text-muted-foreground text-sm mt-1">Choose from your messages on the left</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: show list OR chat based on activeConv */}
      <div className="desk:hidden min-h-screen bg-background pb-20">
        {activeConv ? ChatPanel : ConversationList}
      </div>

      {/* Desktop: side-by-side split panel */}
      <div className="hidden desk:flex h-screen bg-background">
        <div className="w-80 shrink-0 border-r border-border overflow-hidden">
          {ConversationList}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {ChatPanel}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConversationTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConversationDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteConversation(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
