export type HRRequestType =
  | "CREATE_EMPLOYEE"
  | "UPDATE_EMPLOYEE"
  | "DELETE_EMPLOYEE";

export type HRRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CreateEmployeePayload = {
  fullName: string;
  gender?: string | null;
  dateOfBirth: string;
  phoneNumber: string;
  taxId: string;
  departmentId: string;
  positionId: number;
  username: string;
  password: string;
  role: "Employee" | "Manager" | "HR Staff" | "HR Manager" | "Finance Staff";
};

export type UpdateEmployeePayload = {
  employeeId: string;
  fullName?: string;
  gender?: string | null;
  dateOfBirth?: string;
  phoneNumber?: string;
  departmentId?: string;
  positionId?: number;
  employmentStatus?: string;
  isActive?: boolean;
};

export type DeleteEmployeePayload = {
  employeeId: string;
  reason?: string | null;
};

export type CreateHRRequestPayload =
  | {
      requestType: "CREATE_EMPLOYEE";
      payload: CreateEmployeePayload;
    }
  | {
      requestType: "UPDATE_EMPLOYEE";
      payload: UpdateEmployeePayload;
    }
  | {
      requestType: "DELETE_EMPLOYEE";
      payload: DeleteEmployeePayload;
    };

export type HRRequestResponse = {
  RequestID: number;
  RequestType: HRRequestType;
  Status: HRRequestStatus;
  RequesterID: string;
  ApproverID: string | null;
  RequestPayload?: string;
  CreatedAt: string;
  ApprovedAt: string | null;
  RejectionReason: string | null;
};
