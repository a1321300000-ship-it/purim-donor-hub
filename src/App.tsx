import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
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

function AppRoutes() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        {!session ? (
          <Route path="*" element={<Auth />} />
        ) : (
          <Route element={<Layout />}>
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
          </Route>
        )}
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
