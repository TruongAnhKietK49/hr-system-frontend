import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { authStorage } from "@/lib/authStorage";
import { mapBackendRoleToFrontendRole } from "@/lib/roles";
import { AuthUser, LoginPayload } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(() =>
    authStorage.getUser(),
  );

  const isAuthenticated = Boolean(user && authStorage.getAccessToken());

  const login = async (payload: LoginPayload) => {
    const data = await authService.login(payload);

    authStorage.setAccessToken(data.accessToken);
    authStorage.setRefreshToken(data.refreshToken);
    authStorage.setUser(data.user);

    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    navigate("/", { replace: true });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
    }),
    [user, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
