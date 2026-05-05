export type Role = "director" | "hrStaff" | "hrManager" | "manager" | "finance" | "employee";

export const ROLE_LABELS: Record<Role, string> = {
  director: "Giám đốc",
  hrStaff: "Nhân viên nhân sự",
  hrManager: "Trưởng phòng nhân sự",
  manager: "Trưởng phòng",
  finance: "Nhân viên tài vụ",
  employee: "Nhân viên",
};

export type MenuKey =
  | "dashboard"
  | "employees"
  | "departments"
  | "requests"
  | "approvals"
  | "salary"
  | "finance"
  | "audit"
  | "profile";

export const ROLE_MENUS: Record<Role, MenuKey[]> = {
  director: ["dashboard", "employees", "departments", "approvals", "salary", "finance", "audit", "profile"],
  hrStaff: ["dashboard", "employees", "departments", "requests", "profile"],
  hrManager: ["dashboard", "employees", "departments", "requests", "audit", "profile"],
  manager: ["dashboard", "employees", "profile"],
  finance: ["dashboard", "finance", "profile"],
  employee: ["dashboard", "employees", "profile"],
};
