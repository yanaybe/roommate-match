import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import type { UserProfile } from "@/data/mockData";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { MatchFactor } from "@/lib/matching";

interface MatchModalProps {
  user: UserProfile | null;
  matchPercent: number;
  onClose: () => void;
  matchBreakdown?: MatchFactor[];
}

export default function MatchModal({ user, matchPercent, onClose, matchBreakdown }: MatchModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  if (!user) return null;

  const handleSend = async () => {
    if (!message.trim() || !authUser) return;

    const isRealUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (!isRealUser) {
      toast.info("This is a demo match — chat will be available with real users!");
      onClose();
      return;
    }

    setSending(true);

    try {
      // Check if a conversation already exists with this user
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", authUser.id);

      let existingConvId: string | null = null;

      if (myConvs?.length) {
        for (const p of myConvs) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", p.conversation_id)
            .eq("user_id", user.id)
            .maybeSingle();

          if (otherParticipant) {
            existingConvId = p.conversation_id;
            break;
          }
        }
      }

      const convId = existingConvId ?? await (async () => {
        const { data, error } = await supabase
          .rpc("create_conversation_with_participant", { other_user_id: user.id });
        if (error || !data) throw error;
        return data as string;
      })();

      const { error: msgErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId,
          sender_id: authUser.id,
          content: message.trim(),
        });

      if (msgErr) throw msgErr;

      onClose();
      navigate("/chats");
    } catch (err: any) {
      toast.error("Failed to start chat: " + (err?.message ?? "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-elevated text-center relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 10 }}
            className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="w-10 h-10 text-primary-foreground fill-primary-foreground" />
          </motion.div>

          <h2 className="text-2xl font-extrabold text-foreground mb-1">It's a Match! 🎉</h2>
          <p className="text-muted-foreground text-sm mb-2">
            You and {user.name} liked each other — {matchPercent}% compatible!
          </p>

          {matchBreakdown && matchBreakdown.filter((f) => !f.isConflict).length > 0 && (
            <div className="bg-primary/5 rounded-2xl p-3 mb-4 text-left">
              <p className="text-xs font-bold text-primary mb-2">Why you matched ✨</p>
              <div className="flex flex-wrap gap-1.5">
                {matchBreakdown
                  .filter((f) => !f.isConflict)
                  .slice(0, 3)
                  .map((f) => (
                    <span
                      key={f.label}
                      className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-medium"
                    >
                      {f.emoji} {f.detail}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <img
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-5 ring-4 ring-primary/30"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Say hi to ${user.name}...`}
              className="flex-1 bg-secondary text-secondary-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="gradient-primary text-primary-foreground p-3 rounded-xl disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => { onClose(); navigate("/chats"); }}
            className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Go to Chats →
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
