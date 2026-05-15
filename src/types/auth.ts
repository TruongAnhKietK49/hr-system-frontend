import { Role } from "@/lib/roles";

export type BackendRole =
  | "Director"
  | "HR Staff"
  | "HR Manager"
  | "Manager"
  | "Finance Staff"
  | "Employee";

export type AuthUser = {
  employeeId: string;
  username: string;
  fullName: string;
  role: BackendRole;
  departmentId: string | null;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponseData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type RefreshResponseData = {
  accessToken: string;
  user?: AuthUser;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: unknown;
};

export type FrontendAuthUser = AuthUser & {
  frontendRole: Role;
};
