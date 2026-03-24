import { mockChats } from "@/data/mockData";
import { motion } from "framer-motion";

export default function Chats() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3">
          <h1 className="text-xl font-extrabold text-foreground">Messages</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {mockChats.map((chat, i) => (
          <motion.button
            key={chat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border/50 text-left"
          >
            <div className="relative">
              <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
              {chat.isGroup && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-accent text-accent-foreground text-[8px] font-bold px-1 rounded-full">
                  GRP
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-card-foreground text-sm">{chat.name}</span>
                <span className="text-muted-foreground text-xs">{chat.time}</span>
              </div>
              <p className="text-muted-foreground text-sm truncate">{chat.lastMessage}</p>
            </div>
            {chat.unread > 0 && (
              <span className="gradient-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                {chat.unread}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
