import { motion } from "framer-motion";
import { Settings, ChevronRight, Crown, Sparkles, Shield, Bell, LogOut, LogIn } from "lucide-react";
import { mockUsers } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const mockUser = mockUsers[0];

const menuItems = [
  { icon: Crown, label: "Go Premium", desc: "Unlock all features", accent: true },
  { icon: Sparkles, label: "Edit Preferences", desc: "Update matching criteria" },
  { icon: Shield, label: "Verification", desc: "Verify your identity" },
  { icon: Bell, label: "Notifications", desc: "Manage alerts" },
  { icon: Settings, label: "Settings", desc: "Account & privacy" },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground mb-1">Sign in to Roomatch</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Create an account to like rooms, match with roommates, and chat
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm"
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/20">
              <span className="text-primary text-3xl font-extrabold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-foreground">{user.email}</h1>
          <p className="text-muted-foreground text-sm">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          <button className="mt-3 px-6 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold">
            Edit Profile
          </button>
        </motion.div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { val: "0", label: "Likes" },
            { val: "0", label: "Matches" },
            { val: "0", label: "Chats" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-card rounded-xl p-3 text-center shadow-card"
            >
              <span className="text-lg font-extrabold text-foreground">{s.val}</span>
              <span className="text-muted-foreground text-xs block">{s.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0 text-left"
              >
                <div className={`p-2 rounded-lg ${item.accent ? "gradient-primary" : "bg-secondary"}`}>
                  <Icon className={`w-4 h-4 ${item.accent ? "text-primary-foreground" : "text-secondary-foreground"}`} />
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-semibold ${item.accent ? "text-primary" : "text-card-foreground"}`}>{item.label}</span>
                  <span className="text-muted-foreground text-xs block">{item.desc}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-destructive text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}
