import { createContext, ReactNode, useContext } from "react";
import { Role, mapBackendRoleToFrontendRole } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";

type RoleContextValue = {
  role: Role;
  username: string;
  fullName: string;
  employeeId: string;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const role = mapBackendRoleToFrontendRole(user.role);

  return (
    <RoleContext.Provider
      value={{
        role,
        username: user.username,
        fullName: user.fullName,
        employeeId: user.employeeId,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }

  return context;
};
