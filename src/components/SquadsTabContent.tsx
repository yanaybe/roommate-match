import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Crown,
  Bell,
  Check,
  X,
  MapPin,
  DollarSign,
  UserPlus,
  Loader2,
  SlidersHorizontal,
  Percent,
  ChevronDown,
  CigaretteOff, PawPrint,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMySquads, useMyInvites, useDiscoverSquads } from "@/hooks/useSquad";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/hooks/useLanguage";

type Tab = "my" | "discover";

export default function SquadsTabContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { squads, loading, refetch } = useMySquads();
  const { invites, refetch: refetchInvites } = useMyInvites();
  const { squads: openSquads, loading: discoverLoading, refetch: refetchDiscover } = useDiscoverSquads();
  const [tab, setTab] = useState<Tab>("my");
  const [requesting, setRequesting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filterLocation, setFilterLocation] = useState("");
  const [filterBudgetMin, setFilterBudgetMin] = useState(0);
  const [filterBudgetMax, setFilterBudgetMax] = useState(15000);
  const [filterMinMatch, setFilterMinMatch] = useState(0);

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    openSquads.forEach((s) => s.preferred_locations.forEach((l) => locs.add(l)));
    return [...locs].sort();
  }, [openSquads]);

  const filteredSquads = useMemo(() => {
    return openSquads.filter((s) => {
      if (filterMinMatch > 0 && s.matchPercent < filterMinMatch) return false;
      if (filterBudgetMin > 0 && s.budget_max < filterBudgetMin) return false;
      if (filterBudgetMax < 15000 && s.budget_min > filterBudgetMax) return false;
      if (filterLocation && !s.preferred_locations.some((l) => l.toLowerCase().includes(filterLocation.toLowerCase())))
        return false;
      return true;
    });
  }, [openSquads, filterLocation, filterBudgetMin, filterBudgetMax, filterMinMatch]);

  const hasActiveFilters =
    filterLocation !== "" || filterBudgetMin > 0 || filterBudgetMax < 15000 || filterMinMatch > 0;

  const clearFilters = () => {
    setFilterLocation("");
    setFilterBudgetMin(0);
    setFilterBudgetMax(15000);
    setFilterMinMatch(0);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAcceptInvite = async (invite: any) => {
    if (!user) return;
    if (invite.invitee_id !== user.id) return;
    const { count: currentMemberCount } = await supabase
      .from("squad_members")
      .select("id", { count: "exact", head: true })
      .eq("squad_id", invite.squad_id)
      .eq("status", "joined");
    if (invite.squad?.target_size && (currentMemberCount ?? 0) >= invite.squad.target_size) {
      toast.error("This squad is already full.");
      refetchInvites();
      return;
    }
    await supabase.from("squad_members").insert({
      squad_id: invite.squad_id,
      user_id: user.id,
      status: "joined",
      role: "member",
    });
    await supabase.from("squad_invites").update({ status: "accepted" }).eq("id", invite.id).eq("invitee_id", user.id);

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
      const { error } = await supabase.from("squad_invites").upsert({
        squad_id: squadId,
        inviter_id: user.id,
        invitee_id: creatorId,
        status: "pending",
      }, { onConflict: "squad_id,invitee_id" });
      if (error) throw error;
      toast.success("Join request sent! 🙌");
      refetchDiscover();
    } catch {
      toast.error("Failed to send request");
    } finally {
      setRequesting(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm mb-4">{t("signInToViewSquads")}</p>
        <button
          onClick={() => navigate("/auth")}
          className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold"
        >
          {t("signIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Inner tab control + create button */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2">
          {(["my", "discover"] as Tab[]).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === tabId
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabId === "my" ? t("mySquadsTab") : t("discoverTab")}
              {tabId === "my" && invites.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                  {invites.length}
                </span>
              )}
              {tabId === "discover" && openSquads.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">
                  {openSquads.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/create-squad")}
          className="gradient-primary p-2 rounded-xl shrink-0"
          title="Create Squad"
        >
          <Plus className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {tab === "my" ? (
        <>
          {invites.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> {t("pendingInvites")}
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
                          {t("invitedBy")} {inv.inviter_profile?.name ?? "someone"}
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">{t("loadingSquads")}</p>
            </div>
          ) : squads.length === 0 && invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">{t("noSquadsYet")}</h2>
              <p className="text-muted-foreground text-sm mb-6">{t("createOrDiscoverSquad")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/create-squad")}
                  className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t("createSquad")}
                </button>
                <button
                  onClick={() => setTab("discover")}
                  className="bg-secondary text-foreground px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4" /> {t("discoverTab")}
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
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          squad.status === "active"
                            ? "bg-accent/20 text-accent"
                            : squad.status === "forming"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
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
        <>
          <div className="space-y-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                hasActiveFilters
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t("filters")}
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-2xl shadow-card p-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        {t("locationFilter")}
                      </label>
                      {allLocations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setFilterLocation("")}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                              filterLocation === ""
                                ? "gradient-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {t("allLocations")}
                          </button>
                          {allLocations.map((loc) => (
                            <button
                              key={loc}
                              onClick={() => setFilterLocation(filterLocation === loc ? "" : loc)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                                filterLocation === loc
                                  ? "gradient-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={filterLocation}
                          onChange={(e) => setFilterLocation(e.target.value)}
                          placeholder={t("typeLocation")}
                          className="w-full bg-secondary rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>{t("budgetRange")}</span>
                        <span className="text-foreground normal-case font-bold">
                          ₪{filterBudgetMin.toLocaleString()} – ₪{filterBudgetMax.toLocaleString()}
                        </span>
                      </label>
                      <Slider
                        min={0}
                        max={15000}
                        step={500}
                        value={[filterBudgetMin, filterBudgetMax]}
                        onValueChange={([min, max]) => {
                          setFilterBudgetMin(min);
                          setFilterBudgetMax(max);
                        }}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" /> {t("minMatch")}
                        </span>
                        <span className="text-foreground normal-case font-bold">{filterMinMatch}%</span>
                      </label>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[filterMinMatch]}
                        onValueChange={([v]) => setFilterMinMatch(v)}
                        className="mt-2"
                      />
                    </div>

                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs font-semibold text-destructive hover:underline"
                      >
                        {t("clearAllFilters")}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {discoverLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-sm">{t("findingOpenSquads")}</p>
            </div>
          ) : filteredSquads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">
                {hasActiveFilters ? t("noMatchingSquads") : t("noOpenSquads")}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {hasActiveFilters ? t("tryAdjustingFilters") : t("noOpenSquadsDesc")}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="bg-secondary text-foreground px-6 py-3 rounded-2xl font-bold text-sm"
                >
                  {t("clearFilters")}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/create-squad")}
                  className="gradient-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> {t("createSquad")}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {filteredSquads.length} {filteredSquads.length !== 1 ? t("squadsFound") : t("squadFound")}
              </p>
              {filteredSquads.map((squad, i) => (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl shadow-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div
                        className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-primary-foreground ${
                          squad.matchPercent >= 80
                            ? "bg-accent"
                            : squad.matchPercent >= 60
                              ? "bg-primary"
                              : "bg-muted-foreground"
                        }`}
                      >
                        {squad.matchPercent}%
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-card-foreground text-sm truncate">{squad.name}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t("createdBy")} {squad.creator_profile?.name ?? "Unknown"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {squad.member_count}/{squad.target_size}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          <DollarSign className="w-3 h-3" />₪{squad.budget_min}–{squad.budget_max}
                        </span>
                        {squad.preferred_locations.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {squad.preferred_locations.slice(0, 2).join(", ")}
                            {squad.preferred_locations.length > 2 && ` +${squad.preferred_locations.length - 2}`}
                          </span>
                        )}
                        {squad.no_smoking && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground" title="No smoking">
                            <CigaretteOff className="w-3 h-3" />
                          </span>
                        )}
                        {squad.pet_friendly && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-muted-foreground" title="Pet friendly">
                            <PawPrint className="w-3 h-3" />
                          </span>
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
                    {requesting === squad.id ? t("sendingRequest") : t("askToJoin")}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
