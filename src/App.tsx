import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";

const DonorManagement = lazy(() => import("@/pages/DonorManagement"));
const AddDonor = lazy(() => import("@/pages/AddDonor"));
const DonorArchive = lazy(() => import("@/pages/DonorArchive"));
const DataSettings = lazy(() => import("@/pages/DataSettings"));
const BachurimList = lazy(() => import("@/pages/BachurimList"));
const AddBachur = lazy(() => import("@/pages/AddBachur"));
const BachurimAssign = lazy(() => import("@/pages/BachurimAssign"));
const DonorMapping = lazy(() => import("@/pages/DonorMapping"));
const GroupManagement = lazy(() => import("@/pages/GroupManagement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
            <Routes>
              <Route path="/" element={<DonorManagement />} />
              <Route path="/donor-archive" element={<DonorArchive />} />
              <Route path="/add-donor" element={<AddDonor />} />
              <Route path="/data-settings" element={<DataSettings />} />
              <Route path="/bachurim" element={<BachurimList />} />
              <Route path="/add-bachur" element={<AddBachur />} />
              <Route path="/bachurim-assign" element={<BachurimAssign />} />
              <Route path="/donor-mapping" element={<DonorMapping />} />
              <Route path="/groups" element={<GroupManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
