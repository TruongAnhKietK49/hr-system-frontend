export type DepartmentRecord = {
  DepartmentID: string;
  DepartmentName: string;
  ManagerID: string | null;
};

export type CreateDepartmentPayload = {
  departmentName: string;
  managerEmployeeId?: string | null;
};

export type UpdateDepartmentPayload = {
  departmentName?: string;
  managerId?: string | null;
};

export type ManagerCandidate = {
  EmployeeID: string;
  FullName: string | null;
  DepartmentID: string | null;
  DepartmentName: string | null;
  PositionID: number | null;
  PositionName: string | null;
  IsActive: boolean;
  IsManagingDepartment: boolean;
};
