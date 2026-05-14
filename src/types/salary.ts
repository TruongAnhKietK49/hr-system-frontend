export type SalaryRecord = {
  EmployeeID: string;
  FullName?: string | null;

  DepartmentID?: string | null;
  DepartmentName?: string | null;
  PositionID?: number | null;

  TaxID?: string | null;

  BaseSalary?: number | string | null;
  SalaryCoefficient?: number | string | null;
  PositionCoefficient?: number | string | null;
  Allowance?: number | string | null;
  FinalSalary?: number | string | null;

  FormulaVersion?: string | null;
  ApprovedBy?: string | null;

  SalaryUpdatedAt?: string | null;
  SalaryCalculatedAt?: string | null;
};

export type UpdateSalaryPayload = {
  baseSalary: number;
  salaryCoefficient: number;
  positionCoefficient: number;
  allowance: number;
  formulaVersion?: string | null;
};
