import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { authStorage } from "@/lib/authStorage";
import { authService } from "@/services/authService";
import type { AuthUser, LoginPayload } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (nextUser: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(() =>
    authStorage.getUser(),
  );

  const isAuthenticated = Boolean(user && authStorage.getAccessToken());

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await authService.login(payload);

    authStorage.setAccessToken(data.accessToken);
    authStorage.setRefreshToken(data.refreshToken);
    authStorage.setUser(data.user);

    setUser(data.user);

    return data.user;
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    navigate("/", { replace: true });
  }, [navigate]);

  const updateUser = useCallback((nextUser: Partial<AuthUser>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser: AuthUser = {
        ...currentUser,
        ...nextUser,
      };

      authStorage.setUser(updatedUser);

      return updatedUser;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      login,
      logout,
      updateUser,
    }),
    [user, isAuthenticated, login, logout, updateUser],
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
