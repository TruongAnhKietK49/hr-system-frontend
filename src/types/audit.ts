export type AuditLogRecord = {
  LogID: number;
  ActorID: string | null;
  ActorRole: string | null;
  ActionType: string;
  TableName: string;
  RecordID: string | null;
  OldValues: string | null;
  NewValues: string | null;
  Timestamp: string;
};

export type AuditLogFilters = {
  actorId?: string;
  actorRole?: string;
  actionType?: string;
  tableName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type AuditLog = {
  LogID?: number;
  ActorID?: string | null;
  ActorRole?: string | null;
  Action?: string | null;
  TableName?: string | null;
  RecordID?: string | number | null;
  CreatedAt?: string | null;
  Summary?: string | null;
  OldValue?: string | null;
  NewValue?: string | null;

  logId?: number;
  actorId?: string | null;
  actorRole?: string | null;
  action?: string | null;
  tableName?: string | null;
  recordId?: string | number | null;
  createdAt?: string | null;
  summary?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
};
