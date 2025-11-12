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
import { APP_TITLE } from "./const";

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
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = APP_TITLE;
    }
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
