import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FilterProvider } from "@/contexts/FilterContext";
import { Layout } from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import HeatmapPage from "@/pages/HeatmapPage";
import SistemasPage from "@/pages/SistemasPage";
import ClustersPage from "@/pages/ClustersPage";
import ProblemasPage from "@/pages/ProblemasPage";
import IncidentDetailPage from "@/pages/IncidentDetailPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FilterProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/heatmap" element={<HeatmapPage />} />
              <Route path="/sistemas" element={<SistemasPage />} />
              <Route path="/clusters" element={<ClustersPage />} />
              <Route path="/problemas" element={<ProblemasPage />} />
              <Route path="/incident/:id" element={<IncidentDetailPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FilterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
