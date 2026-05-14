import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { mapBackendRoleToFrontendRole, type Role } from "@/lib/roles";

type ProtectedRouteProps = {
  allowedRoles?: Role[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const currentRole = mapBackendRoleToFrontendRole(user.role);

  if (allowedRoles?.length && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
