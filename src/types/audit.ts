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
