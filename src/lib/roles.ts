export type Role =
  | "director"
  | "hrStaff"
  | "hrManager"
  | "manager"
  | "finance"
  | "employee";

export type BackendRole =
  | "Director"
  | "HR Staff"
  | "HR Manager"
  | "Manager"
  | "Finance Staff"
  | "Employee";

export const ROLE_LABELS: Record<Role, string> = {
  director: "Giám đốc",
  hrStaff: "Nhân viên nhân sự",
  hrManager: "Trưởng phòng nhân sự",
  manager: "Trưởng phòng",
  finance: "Nhân viên tài vụ",
  employee: "Nhân viên",
};

export const BACKEND_ROLE_TO_FRONTEND_ROLE: Record<BackendRole, Role> = {
  Director: "director",
  "HR Staff": "hrStaff",
  "HR Manager": "hrManager",
  Manager: "manager",
  "Finance Staff": "finance",
  Employee: "employee",
};

export const FRONTEND_ROLE_TO_BACKEND_ROLE: Record<Role, BackendRole> = {
  director: "Director",
  hrStaff: "HR Staff",
  hrManager: "HR Manager",
  manager: "Manager",
  finance: "Finance Staff",
  employee: "Employee",
};

export const mapBackendRoleToFrontendRole = (role: BackendRole): Role => {
  return BACKEND_ROLE_TO_FRONTEND_ROLE[role];
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
  director: [
    "dashboard",
    "employees",
    "departments",
    "approvals",
    "salary",
    "finance",
    "audit",
    "profile",
  ],
  hrStaff: ["dashboard", "employees", "departments", "requests", "profile"],
  hrManager: [
    "dashboard",
    "employees",
    "departments",
    "requests",
    "audit",
    "profile",
  ],
  manager: ["dashboard", "employees", "profile"],
  finance: ["dashboard", "finance", "profile"],
  employee: ["dashboard", "employees", "profile"],
};
