export type FinancePayrollRecord = {
  EmployeeID: string;

  FullName?: string | null;
  Gender?: string | null;
  DateOfBirth?: string | null;
  PhoneNumber?: string | null;

  DepartmentID?: string | null;
  DepartmentName?: string | null;

  PositionID?: number | null;
  PositionName?: string | null;

  TaxID?: string | null;

  BaseSalary?: number | string | null;
  SalaryCoefficient?: number | string | null;
  PositionCoefficient?: number | string | null;
  Allowance?: number | string | null;
  FinalSalary?: number | string | null;

  FormulaVersion?: string | null;
  SalaryUpdatedAt?: string | null;
  SalaryCalculatedAt?: string | null;
};
