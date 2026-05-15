import type { AuditLog } from "@/types/audit";

export type AuditAlertSeverity = "low" | "medium" | "high" | "critical";

export type AuditAlert = {
  id: string;
  title: string;
  description: string;
  severity: AuditAlertSeverity;
  actorId?: string | null;
  action?: string | null;
  tableName?: string | null;
  count?: number;
};

const HIGH_RISK_ACTIONS = [
  "DELETE_EMPLOYEE",
  "UPDATE_EMPLOYEE",
  "UPDATE_SALARY",
  "APPROVE_HR_REQUEST",
  "REJECT_HR_REQUEST",
];

const SENSITIVE_TABLES = ["Salary", "Finance", "Account", "Employee"];

function getLogTime(log: AuditLog) {
  const rawTime = log.CreatedAt ?? log.createdAt;

  if (!rawTime) return null;

  const time = new Date(rawTime).getTime();

  return Number.isNaN(time) ? null : time;
}

function getActorId(log: AuditLog) {
  return log.ActorID ?? log.actorId ?? null;
}

function getAction(log: AuditLog) {
  return log.Action ?? log.action ?? null;
}

function getTableName(log: AuditLog) {
  return log.TableName ?? log.tableName ?? null;
}

function getRecordId(log: AuditLog) {
  return log.RecordID ?? log.recordId ?? null;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((result, item) => {
    const key = getKey(item);

    if (!result[key]) {
      result[key] = [];
    }

    result[key].push(item);

    return result;
  }, {});
}

function isWithinMinutes(log: AuditLog, minutes: number) {
  const time = getLogTime(log);
  if (!time) return false;

  const now = Date.now();
  return now - time <= minutes * 60 * 1000;
}

function createAlertKey(parts: Array<string | number | null | undefined>) {
  return parts.filter(Boolean).join("-");
}

export function analyzeAuditAlerts(logs: AuditLog[]): AuditAlert[] {
  const alerts: AuditAlert[] = [];
  const recentLogs = logs.filter((log) => isWithinMinutes(log, 30));

  const logsByActor = groupBy(
    recentLogs,
    (log) => getActorId(log) ?? "UNKNOWN",
  );

  Object.entries(logsByActor).forEach(([actorId, actorLogs]) => {
    if (actorId === "UNKNOWN") {
      alerts.push({
        id: createAlertKey(["unknown-actor", actorLogs.length]),
        title: "Phát hiện log thiếu người thực hiện",
        description:
          "Một số bản ghi nhật ký không xác định được người thực hiện. Cần kiểm tra lại nguồn ghi log hoặc phiên đăng nhập.",
        severity: "critical",
        actorId: null,
        count: actorLogs.length,
      });

      return;
    }

    if (actorLogs.length >= 10) {
      alerts.push({
        id: createAlertKey(["high-frequency", actorId]),
        title: "Tần suất thao tác bất thường",
        description: `Người dùng ${actorId} thực hiện ${actorLogs.length} thao tác trong 30 phút gần nhất.`,
        severity: "high",
        actorId,
        count: actorLogs.length,
      });
    }

    const updateEmployeeLogs = actorLogs.filter(
      (log) => getAction(log) === "UPDATE_EMPLOYEE",
    );

    if (updateEmployeeLogs.length >= 5) {
      alerts.push({
        id: createAlertKey(["mass-update-employee", actorId]),
        title: "Cập nhật nhân viên hàng loạt",
        description: `Người dùng ${actorId} đã cập nhật ${updateEmployeeLogs.length} hồ sơ nhân viên trong thời gian ngắn.`,
        severity: "medium",
        actorId,
        action: "UPDATE_EMPLOYEE",
        tableName: "Employee",
        count: updateEmployeeLogs.length,
      });
    }

    const hrRequestLogs = actorLogs.filter(
      (log) => getAction(log) === "CREATE_HR_REQUEST",
    );

    if (hrRequestLogs.length >= 5) {
      alerts.push({
        id: createAlertKey(["many-hr-request", actorId]),
        title: "Tạo nhiều yêu cầu nhân sự",
        description: `Người dùng ${actorId} tạo ${hrRequestLogs.length} yêu cầu nhân sự trong thời gian ngắn.`,
        severity: "medium",
        actorId,
        action: "CREATE_HR_REQUEST",
        tableName: "HR_Request",
        count: hrRequestLogs.length,
      });
    }
  });

  recentLogs.forEach((log) => {
    const actorId = getActorId(log);
    const action = getAction(log);
    const tableName = getTableName(log);
    const recordId = getRecordId(log);

    if (!actorId || !action || !tableName) {
      alerts.push({
        id: createAlertKey([
          "invalid-log",
          actorId,
          action,
          tableName,
          recordId,
        ]),
        title: "Log có cấu trúc bất thường",
        description:
          "Một bản ghi nhật ký thiếu ActorID, Action hoặc TableName. Đây có thể là lỗi hệ thống hoặc thao tác không hợp lệ.",
        severity: "critical",
        actorId,
        action,
        tableName,
      });

      return;
    }

    if (action === "DELETE_EMPLOYEE") {
      alerts.push({
        id: createAlertKey(["delete-employee", actorId, recordId]),
        title: "Thao tác xóa nhân viên",
        description: `Người dùng ${actorId} thực hiện thao tác xóa nhân viên ${recordId ?? ""}. Cần kiểm tra tính hợp lệ của yêu cầu.`,
        severity: "high",
        actorId,
        action,
        tableName,
      });
    }

    if (HIGH_RISK_ACTIONS.includes(action)) {
      alerts.push({
        id: createAlertKey(["high-risk-action", actorId, action, recordId]),
        title: "Thao tác có rủi ro cao",
        description: `Phát hiện thao tác ${action} trên bảng ${tableName} bởi người dùng ${actorId}.`,
        severity: "medium",
        actorId,
        action,
        tableName,
      });
    }

    if (SENSITIVE_TABLES.includes(tableName)) {
      alerts.push({
        id: createAlertKey([
          "sensitive-table",
          actorId,
          tableName,
          action,
          recordId,
        ]),
        title: "Truy cập dữ liệu nhạy cảm",
        description: `Người dùng ${actorId} thao tác trên bảng nhạy cảm ${tableName}.`,
        severity:
          tableName === "Salary" || tableName === "Finance" ? "high" : "medium",
        actorId,
        action,
        tableName,
      });
    }
  });

  return deduplicateAlerts(alerts).sort(
    (a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity),
  );
}

export function getSeverityScore(severity: AuditAlertSeverity) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function deduplicateAlerts(alerts: AuditAlert[]) {
  const map = new Map<string, AuditAlert>();

  alerts.forEach((alert) => {
    if (!map.has(alert.id)) {
      map.set(alert.id, alert);
    }
  });

  return Array.from(map.values());
}

export function getAlertSeverityLabel(severity: AuditAlertSeverity) {
  switch (severity) {
    case "critical":
      return "Nghiêm trọng";
    case "high":
      return "Cao";
    case "medium":
      return "Trung bình";
    case "low":
      return "Thấp";
    default:
      return "Không xác định";
  }
}

export function getAlertSeverityClassName(severity: AuditAlertSeverity) {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "low":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
