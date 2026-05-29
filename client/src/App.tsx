import { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedLogo } from "@/components/animated-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { initializeTheme } from "@/lib/themes";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import DashboardPage from "@/pages/dashboard";
import ConversationsPage from "@/pages/conversations";
import InsightsPage from "@/pages/insights";
import BoughtNumbersPage from "@/pages/bought-numbers";
import BuyNumbersPage from "@/pages/buy-numbers";
import TeamManagementPage from "@/pages/team";
import SettingsPage from "@/pages/settings";
import TeamSettingsPage from "@/pages/team-settings";
import SmsBlastingPage from "@/pages/sms-blasting";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

function AdminHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      
      <div 
        className={`flex items-center gap-2 absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <AnimatedLogo size="md" />
        <span className="font-semibold text-lg">Conneclify</span>
      </div>
      
      <ThemeToggle />
    </header>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function TeamMemberLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <AnimatedLogo size="md" />
            <span className="font-semibold">Conneclify</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/conversations"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === "/conversations" || location === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid="link-conversations"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Conversations</span>
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === "/settings"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid="link-settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {user?.fullName ? getInitials(user.fullName) : "U"}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user?.fullName}</span>
          </div>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-team-logout"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/login" component={() => <Redirect to="/dashboard" />} />
        <Route path="/signup" component={() => <Redirect to="/dashboard" />} />
        <Route path="/conversations" component={ConversationsPage} />
        <Route path="/sms-blasting" component={SmsBlastingPage} />
        <Route path="/insights" component={InsightsPage} />
        <Route path="/bought-numbers" component={BoughtNumbersPage} />
        <Route path="/buy-numbers" component={BuyNumbersPage} />
        <Route path="/team" component={TeamManagementPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function TeamMemberRoutes() {
  return (
    <TeamMemberLayout>
      <Switch>
        <Route path="/" component={() => <Redirect to="/conversations" />} />
        <Route path="/login" component={() => <Redirect to="/conversations" />} />
        <Route path="/signup" component={() => <Redirect to="/conversations" />} />
        <Route path="/conversations" component={ConversationsPage} />
        <Route path="/settings" component={TeamSettingsPage} />
        <Route component={() => <Redirect to="/conversations" />} />
      </Switch>
    </TeamMemberLayout>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();

  // Apply user's saved theme when they log in or when light/dark mode changes
  useEffect(() => {
    if (user?.theme) {
      initializeTheme(user.theme);
    } else {
      initializeTheme('default');
    }
  }, [user?.theme, resolvedTheme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        <Route component={() => <Redirect to="/" />} />
      </Switch>
    );
  }

  if (user.role === "admin") {
    return <AdminRoutes />;
  }

  return <TeamMemberRoutes />;
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="conneclify-theme">
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
