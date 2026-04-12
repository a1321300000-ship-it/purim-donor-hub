import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import DonorManagement from "@/pages/DonorManagement";
import AddDonor from "@/pages/AddDonor";
import DonorArchive from "@/pages/DonorArchive";
import DataSettings from "@/pages/DataSettings";
import BachurimList from "@/pages/BachurimList";
import AddBachur from "@/pages/AddBachur";
import BachurimAssign from "@/pages/BachurimAssign";
import DonorMapping from "@/pages/DonorMapping";
import GroupManagement from "@/pages/GroupManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
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
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
