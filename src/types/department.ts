export type DepartmentRecord = {
  DepartmentID: string;
  DepartmentName: string;
  ManagerID: string | null;
};

export type CreateDepartmentPayload = {
  departmentId: string;
  departmentName: string;
  managerId?: string | null;
};

export type UpdateDepartmentPayload = {
  departmentName?: string;
  managerId?: string | null;
};
