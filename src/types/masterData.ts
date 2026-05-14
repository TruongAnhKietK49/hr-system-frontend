export type Department = {
  DepartmentID: string;
  DepartmentName: string;
  ManagerID: string | null;
};

export type Employee = {
  EmployeeID: string;
  FullName: string;
  Gender: string | null;
  DateOfBirth: string | null;
  PhoneNumber: string | null;
  TaxID?: string | null;
  DepartmentID: string;
  DepartmentName: string;
  PositionID: number;
  EmploymentStatus: string;
  IsActive: boolean;
  CreatedAt: string;
};
