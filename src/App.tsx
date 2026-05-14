import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Requests from "./pages/Requests";
import Approvals from "./pages/Approvals";
import Departments from "./pages/Departments";
import Salary from "./pages/Salary";
import Finance from "./pages/Finance";
import Audit from "./pages/Audit";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "director",
                    "hrStaff",
                    "hrManager",
                    "manager",
                    "employee",
                  ]}
                />
              }
            >
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["director", "hrStaff", "hrManager"]}
                />
              }
            >
              <Route path="/departments" element={<Departments />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["hrStaff", "hrManager"]} />
              }
            >
              <Route path="/requests" element={<Requests />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["director"]} />}>
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/salary" element={<Salary />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["director", "finance"]} />
              }
            >
              <Route path="/finance" element={<Finance />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["director", "hrManager"]} />
              }
            >
              <Route path="/audit" element={<Audit />} />
            </Route>

            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
