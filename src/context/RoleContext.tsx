import { createContext, useContext, useState, ReactNode } from "react";
import { Role } from "@/lib/roles";

type Ctx = { role: Role; setRole: (r: Role) => void; username: string };
const RoleContext = createContext<Ctx | null>(null);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>("director");
  return (
    <RoleContext.Provider value={{ role, setRole, username: "Nguyễn Văn A" }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
