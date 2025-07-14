import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import Threats from "@/pages/threats";
import Ingestion from "@/pages/ingestion";
import Scenarios from "@/pages/scenarios";
import Analytics from "@/pages/analytics";
import Prescriptions from "@/pages/prescriptions";
import Reports from "@/pages/reports";
import CollectionRequests from "@/pages/collection-requests";
import Admin from "@/pages/admin";
import ThreatFlow from "@/pages/threat-flow";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

// Layout
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen flex bg-dark-bg">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <TopBar />
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/threats">
        <ProtectedRoute>
          <Threats />
        </ProtectedRoute>
      </Route>
      <Route path="/ingestion">
        <ProtectedRoute>
          <Ingestion />
        </ProtectedRoute>
      </Route>
      <Route path="/scenarios">
        <ProtectedRoute>
          <Scenarios />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/prescriptions">
        <ProtectedRoute>
          <Prescriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/threat-flow">
        <ProtectedRoute>
          <ThreatFlow />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/collection-requests">
        <ProtectedRoute>
          <CollectionRequests />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Force dark theme for intelligence system
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
