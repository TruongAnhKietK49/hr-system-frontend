import {
  CreateEmployeePayload,
  DeleteEmployeePayload,
  HRRequestStatus,
  HRRequestType,
  UpdateEmployeePayload,
} from "@/types/hrRequest";

export type PendingApproval = {
  RequestID: number;
  RequestType: HRRequestType;
  Status: HRRequestStatus;
  RequesterID: string;
  RequesterName?: string | null;
  ApproverID: string | null;
  RequestPayload: string;
  CreatedAt: string;
  ApprovedAt: string | null;
  RejectionReason: string | null;
};

export type ParsedApprovalPayload =
  | CreateEmployeePayload
  | UpdateEmployeePayload
  | DeleteEmployeePayload;

export type ApproveCreateEmployeePayload = {
  baseSalary: number;
  salaryCoefficient: number;
  positionCoefficient: number;
  allowance: number;
  formulaVersion?: string;
};

export type RejectApprovalPayload = {
  rejectionReason: string;
};

export type ApprovalResult = {
  RequestID?: number;
  requestId?: number;
  RequestType?: HRRequestType;
  requestType?: HRRequestType;
  Status?: HRRequestStatus;
  status?: HRRequestStatus;
  EmployeeID?: string;
  employeeId?: string;
  FinalSalary?: number;
  finalSalary?: number;
};
