import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
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
import Index from "./pages/Index";
import Roommates from "./pages/Roommates";
import CreateApartment from "./pages/CreateApartment";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import ApartmentDetail from "./pages/ApartmentDetail";
import PostApartment from "./pages/PostApartment";
import CreateSquad from "./pages/CreateSquad";
import SquadHub from "./pages/SquadHub";
import MySquads from "./pages/MySquads";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import Settings from "./pages/Settings";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactSupport from "./pages/ContactSupport";
import HelpCenter from "./pages/HelpCenter";
import RoommateProfile from "./pages/RoommateProfile";
import BillingHistory from "./pages/BillingHistory";
import Landing from "./pages/Landing";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { SidebarProvider, useSidebar } from "@/hooks/useSidebar";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { collapsed } = useSidebar();
  const offsetClass = collapsed ? "desk:ltr:pl-14 desk:rtl:pr-14" : "desk:ltr:pl-64 desk:rtl:pr-64";
  if (loading || profileLoading) return <PageLoader />;
  if (!user) return <Landing />;
  if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <div className={`transition-all duration-200 ${offsetClass}`}><div className="desk:max-w-[1400px] desk:mx-auto"><Index /></div></div>;
}

function AuthedLayout() {
  const { user, loading } = useAuth();
  const { collapsed } = useSidebar();
  const offsetClass = collapsed ? "desk:ltr:pl-14 desk:rtl:pr-14" : "desk:ltr:pl-64 desk:rtl:pr-64";
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;
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
        <LanguageProvider>
        <SidebarProvider>
        <UnreadCountProvider>
        <NotificationsProvider>
        <DailyLimitsProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <ScrollToTop />
            <NotificationToaster />
            <BottomNav />
            <Routes>
              {/* Public — no auth, no sidebar */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/contact-support" element={<ContactSupport />} />
              <Route path="*" element={<NotFound />} />

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
                <Route path="/help-center" element={<HelpCenter />} />

                {/* Require completed onboarding profile */}
                <Route element={<OnboardedLayout />}>
                  <Route path="/roommates" element={<Roommates />} />
                  <Route path="/create-squad" element={<CreateSquad />} />
                  <Route path="/squad/:id" element={<SquadHub />} />
                  <Route path="/my-squads" element={<MySquads />} />
                  <Route path="/chats" element={<Chats />} />
                </Route>
              </Route>
            </Routes>
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
