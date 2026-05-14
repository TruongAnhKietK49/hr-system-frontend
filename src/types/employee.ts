export type EmployeeEmploymentStatus =
  | "ACTIVE"
  | "ON_LEAVE"
  | "TERMINATED"
  | string;

export type EmployeeRecord = {
  EmployeeID: string;
  FullName: string | null;
  Gender: string | null;
  DateOfBirth: string | null;
  PhoneNumber: string | null;
  TaxID?: string | null;

  DepartmentID: string | null;
  DepartmentName: string | null;
  PositionID: number | null;

  EmploymentStatus: EmployeeEmploymentStatus;
  IsActive: boolean;
  CreatedAt: string | null;

  BaseSalary?: string | number | null;
  SalaryCoefficient?: string | number | null;
  PositionCoefficient?: string | number | null;
  Allowance?: string | number | null;
  FinalSalary?: string | number | null;
};

export type EmployeeListItem = EmployeeRecord;

export type EmployeeDetail = EmployeeRecord;
