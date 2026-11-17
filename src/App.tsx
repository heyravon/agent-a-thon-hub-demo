import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JudgingProvider } from "@/context/JudgingContext";
import { SiteNav } from "@/components/SiteNav";
import Index from "./pages/Index.tsx";
import Judge from "./pages/Judge.tsx";
import Register from "./pages/Register.tsx";
import Admin from "./pages/Admin.tsx";
import Staff from "./pages/Staff.tsx";
import LeaderboardPage from "./pages/Leaderboard.tsx";
import AnnouncePage from "./pages/Announce.tsx";
import Rules from "./pages/Rules.tsx";
import LabGuide from "./pages/LabGuide.tsx";
import LabAccess from "./pages/LabAccess.tsx";
import Gallery from "./pages/Gallery.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <JudgingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SiteNav />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/judge" element={<Judge />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/announce" element={<AnnouncePage />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/lab-guide" element={<LabGuide />} />
            <Route path="/lab-access" element={<LabAccess />} />
            <Route path="/gallery" element={<Gallery />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </JudgingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
