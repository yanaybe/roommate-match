import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import { UnreadCountProvider } from "@/hooks/useUnreadCount";
import { DailyLimitsProvider } from "@/hooks/useDailyLimits";
import { NotificationsProvider } from "@/hooks/useNotifications";
import NotificationToaster from "@/components/NotificationToaster";
import BottomNav from "@/components/BottomNav";
import ScrollToTop from "@/components/ScrollToTop";
const Index = lazy(() => import("./pages/Index"));
const Roommates = lazy(() => import("./pages/Roommates"));
const CreateApartment = lazy(() => import("./pages/CreateApartment"));
const Chats = lazy(() => import("./pages/Chats"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ApartmentDetail = lazy(() => import("./pages/ApartmentDetail"));
const PostApartment = lazy(() => import("./pages/PostApartment"));
const CreateSquad = lazy(() => import("./pages/CreateSquad"));
const SquadHub = lazy(() => import("./pages/SquadHub"));
const MySquads = lazy(() => import("./pages/MySquads"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Settings = lazy(() => import("./pages/Settings"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ContactSupport = lazy(() => import("./pages/ContactSupport"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const RoommateProfile = lazy(() => import("./pages/RoommateProfile"));
const BillingHistory = lazy(() => import("./pages/BillingHistory"));
const Landing = lazy(() => import("./pages/Landing"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRooms = lazy(() => import("./pages/admin/AdminRooms"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { SidebarProvider, useSidebar } from "@/hooks/useSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { initAnalytics, identifyUser, resetAnalytics } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

initAnalytics();

const queryClient = new QueryClient();

function AnalyticsSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      identifyUser(user.id, { email: user.email });
    } else {
      resetAnalytics();
    }
  }, [user?.id]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

function EmailVerificationBanner() {
  const { user } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!user || user.email_confirmed_at) return null;

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !user.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (!error) setResendCooldown(60);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
        Please verify your email to unlock all features.{" "}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="underline font-bold disabled:opacity-50"
        >
          {resending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
        </button>
      </p>
    </div>
  );
}

function OAuthWelcome({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <img src="/logo.png" alt="RooMatch" className="w-20 h-20 object-contain mx-auto mb-6" />
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Welcome to Roo<span className="text-primary">Match</span>!</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
          You're 3 minutes away from your first match. Let's set up your profile so we can find you the perfect roommate.
        </p>
        <button
          onClick={onContinue}
          className="w-full gradient-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm"
        >
          Set up my profile
        </button>
        <p className="text-xs text-muted-foreground mt-4">Takes about 3 minutes · Free forever</p>
      </div>
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { collapsed } = useSidebar();
  const [showOAuthWelcome, setShowOAuthWelcome] = useState(false);
  const offsetClass = collapsed ? "desk:ltr:pl-14 desk:rtl:pr-14" : "desk:ltr:pl-64 desk:rtl:pr-64";

  useEffect(() => {
    if (!loading && !profileLoading && user && profile && !profile.onboarding_complete) {
      const provider = (user as any).app_metadata?.provider;
      if (provider && provider !== "email") {
        setShowOAuthWelcome(true);
      }
    }
  }, [loading, profileLoading, user, profile]);

  if (loading || profileLoading) return <PageLoader />;
  if (!user) return <Landing />;
  if (showOAuthWelcome) return <OAuthWelcome onContinue={() => { setShowOAuthWelcome(false); }} />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <div className={`transition-all duration-200 ${offsetClass}`}><div className="desk:max-w-[1400px] desk:mx-auto"><Index /></div></div>;
}

function AuthedLayout() {
  const { user, loading } = useAuth();
  const { collapsed } = useSidebar();
  const offsetClass = collapsed ? "desk:ltr:pl-14 desk:rtl:pr-14" : "desk:ltr:pl-64 desk:rtl:pr-64";
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <div className={`transition-all duration-200 ${offsetClass}`}><div className="desk:max-w-[1400px] desk:mx-auto"><Outlet /></div></div>;
}

// Routes inside this layout additionally require a completed onboarding profile.
// Unauthenticated / unverified users are already caught by the parent AuthedLayout.
function OnboardedLayout() {
  const { profile, loading: profileLoading } = useProfile();
  if (profileLoading) return <PageLoader />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AnalyticsSync />
        <LanguageProvider>
        <SidebarProvider>
        <UnreadCountProvider>
        <NotificationsProvider>
        <DailyLimitsProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <ErrorBoundary>
            <ScrollToTop />
            <EmailVerificationBanner />
            <NotificationToaster />
            <BottomNav />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public — no auth, no sidebar */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/contact-support" element={<ContactSupport />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />

              {/* Admin — own layout + own auth guard, no app sidebar */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="rooms" element={<AdminRooms />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="system" element={<AdminSystem />} />
              </Route>

              {/* Protected — must be signed in, gets sidebar */}
              <Route element={<AuthedLayout />}>
                {/* Accessible without completing onboarding */}
                <Route path="/apartment/:id" element={<ApartmentDetail />} />
                <Route path="/roommate/:id" element={<RoommateProfile />} />
                <Route path="/create" element={<CreateApartment />} />
                <Route path="/post-apartment" element={<PostApartment />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/billing-history" element={<BillingHistory />} />

                {/* Require completed onboarding profile */}
                <Route element={<OnboardedLayout />}>
                  <Route path="/roommates" element={<ErrorBoundary><Roommates /></ErrorBoundary>} />
                  <Route path="/create-squad" element={<ErrorBoundary><CreateSquad /></ErrorBoundary>} />
                  <Route path="/squad/:id" element={<ErrorBoundary><SquadHub /></ErrorBoundary>} />
                  <Route path="/my-squads" element={<ErrorBoundary><MySquads /></ErrorBoundary>} />
                  <Route path="/chats" element={<ErrorBoundary><Chats /></ErrorBoundary>} />
                </Route>
              </Route>
            </Routes>
            </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </DailyLimitsProvider>
        </NotificationsProvider>
        </UnreadCountProvider>
        </SidebarProvider>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
