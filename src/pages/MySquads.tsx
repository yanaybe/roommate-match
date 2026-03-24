import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Plus, ArrowLeft, Crown, Bell, Check, X, MapPin, DollarSign, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMySquads, useMyInvites, useDiscoverSquads } from "@/hooks/useSquad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "my" | "discover";

export default function MySquads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { squads, loading, refetch } = useMySquads();
  const { invites, refetch: refetchInvites } = useMyInvites();
  const { squads: openSquads, loading: discoverLoading, refetch: refetchDiscover } = useDiscoverSquads();
  const [tab, setTab] = useState<Tab>("my");
  const [requesting, setRequesting] = useState<string | null>(null);

  const handleAcceptInvite = async (invite: any) => {
    if (!user) return;
    await supabase.from("squad_members").insert({
      squad_id: invite.squad_id,
      user_id: user.id,
      status: "joined",
      role: "member",
    });
    await supabase.from("squad_invites").update({ status: "accepted" }).eq("id", invite.id);

    const { data: members } = await supabase
      .from("squad_members")
      .select("id")
      .eq("squad_id", invite.squad_id)
      .eq("status", "joined");

    const squad = invite.squad;
    if (squad && members && members.length >= 2 && squad.status === "draft") {
      await supabase.from("squads").update({ status: "forming" }).eq("id", squad.id);
    }
    if (squad && members && members.length >= squad.target_size) {
      await supabase.from("squads").update({ status: "active" }).eq("id", squad.id);
    }

    toast.success("Joined squad! 🎉");
    refetch();
    refetchInvites();
    refetchDiscover();
  };

  const handleDeclineInvite = async (inviteId: string) => {
    await supabase.from("squad_invites").update({ status: "declined" }).eq("id", inviteId);
    toast("Invite declined");
    refetchInvites();
  };

  const handleRequestJoin = async (squadId: string, creatorId: string) => {
    if (!user) return;
    setRequesting(squadId);
    try {
      // Send an invite where the user is the inviter (request to join)
      const { error } = await supabase.from("squad_invites").insert({
        squad_id: squadId,
        inviter_id: user.id,
        invitee_id: creatorId,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Join request sent! 🙌");
      refetchDiscover();
    } catch (e: any) {
      toast.error("Failed to send request");
    } finally {
      setRequesting(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Sign in to view squads</p>
          <button onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-foreground">Squads</h1>
          </div>
          <button onClick={() => navigate("/create-squad")} className="gradient-primary p-2 rounded-xl">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2">
          {(["my", "discover"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "my" ? "My Squads" : "Discover"}
              {t === "my" && invites.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                  {invites.length}
                </span>
              )}
              {t === "discover" && openSquads.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">
                  {openSquads.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {tab === "my" ? (
          <>
            {/* Pending invites */}
            {invites.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" /> Pending Invites
                </h2>
                <div className="space-y-2">
                  {invites.map((inv) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-2xl shadow-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-card-foreground text-sm truncate">
                            {inv.squad?.name ?? "Squad"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Invited by {inv.inviter_profile?.name ?? "someone"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeclineInvite(inv.id)}
                            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleAcceptInvite(inv)}
                            className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* My squads list */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground text-sm">Loading squads...</p>
              </div>
            ) : squads.length === 0 && invites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">No squads yet</h2>
                <p className="text-muted-foreground text-sm mb-6">Create a squad or discover one to join!</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/create-squad")}
                    className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Squad
                  </button>
                  <button
                    onClick={() => setTab("discover")}
                    className="bg-secondary text-foreground px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Discover
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {squads.map((squad, i) => (
                  <motion.button
                    key={squad.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/squad/${squad.id}`)}
                    className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl shadow-card hover:shadow-elevated transition-shadow text-left"
                  >
                    <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-card-foreground text-sm truncate">{squad.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          squad.status === "active" ? "bg-accent/20 text-accent"
                            : squad.status === "forming" ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {squad.status.charAt(0).toUpperCase() + squad.status.slice(1)}
                        </span>
                        {squad.creator_id === user?.id && <Crown className="w-3 h-3 text-primary" />}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Discover tab */
          discoverLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">Finding open squads...</p>
            </div>
          ) : openSquads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">No open squads</h2>
              <p className="text-muted-foreground text-sm mb-6">No squads looking for members right now. Create your own!</p>
              <button
                onClick={() => navigate("/create-squad")}
                className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Squad
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {openSquads.map((squad, i) => (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl shadow-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-card-foreground text-sm truncate">{squad.name}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Created by {squad.creator_profile?.name ?? "Unknown"}
                      </p>

                      {/* Squad details */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {squad.member_count}/{squad.target_size}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          <DollarSign className="w-3 h-3" />
                          ₪{squad.budget_min}–{squad.budget_max}
                        </span>
                        {squad.preferred_locations.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {squad.preferred_locations.slice(0, 2).join(", ")}
                            {squad.preferred_locations.length > 2 && ` +${squad.preferred_locations.length - 2}`}
                          </span>
                        )}
                        {squad.no_smoking && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">🚭</span>
                        )}
                        {squad.pet_friendly && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">🐾</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRequestJoin(squad.id, squad.creator_id)}
                    disabled={requesting === squad.id}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {requesting === squad.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {requesting === squad.id ? "Sending..." : "Ask to Join"}
                  </button>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
