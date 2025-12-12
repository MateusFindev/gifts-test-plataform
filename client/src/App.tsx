import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TestInfo from "./pages/TestInfo";
import TestQuestions from "./pages/TestQuestions";
import ExternalLinks from "./pages/ExternalLinks";
import ExternalAssessment from "./pages/ExternalAssessment";
import Results from "./pages/Results";
import CheckResult from "./pages/CheckResult";
import GiftsExplanation from "./pages/GiftsExplanation";
import { APP_LOGO, APP_TITLE, ANALYTICS_ENDPOINT, ANALYTICS_WEBSITE_ID } from "./const";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminResults from "./pages/admin/AdminResults";
import AdminResultDetails from "./pages/admin/AdminResultDetails";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalyses from "./pages/admin/AdminAnalyses";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/gifts-explanation"} component={GiftsExplanation} />
      <Route path={"/test/info"} component={TestInfo} />
      <Route path={"/test/questions"} component={TestQuestions} />
      <Route path={"/test/external-links"} component={ExternalLinks} />
      <Route path={"/external/:token"} component={ExternalAssessment} />
      <Route path={"/results"} component={Results} />
      <Route path={"/check-result"} component={CheckResult} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/results/:resultId"} component={AdminResultDetails} />
      <Route path={"/admin/results"} component={AdminResults} />
      <Route path={"/admin/analyses"} component={AdminAnalyses} />
      <Route path={"/admin/organizations"} component={AdminOrganizations} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

const configureBrandingAssets = () => {
  if (typeof document === "undefined") {
    return;
  }

  document.title = APP_TITLE;

  const updateLinkHref = (id: string) => {
    const element = document.getElementById(id);
    if (element instanceof HTMLLinkElement) {
      element.href = APP_LOGO;
      return;
    }

    if (APP_LOGO) {
      const fallbackLink = document.createElement("link");
      fallbackLink.id = id;
      fallbackLink.href = APP_LOGO;
      if (id === "app-apple-icon") {
        fallbackLink.rel = "apple-touch-icon";
      } else {
        fallbackLink.rel = "icon";
        fallbackLink.type = "image/png";
      }
      document.head.appendChild(fallbackLink);
    }
  };

  updateLinkHref("app-favicon");
  updateLinkHref("app-apple-icon");
};

const configureAnalytics = () => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>("script[data-analytics-loader='umami']");
  if (existing) {
    existing.remove();
  }

  if (!ANALYTICS_ENDPOINT || !ANALYTICS_WEBSITE_ID) {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${ANALYTICS_ENDPOINT}/umami`;
  script.dataset.websiteId = ANALYTICS_WEBSITE_ID;
  script.dataset.analyticsLoader = "umami";
  document.body.appendChild(script);
};

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    configureBrandingAssets();
    configureAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
