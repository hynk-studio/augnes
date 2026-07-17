export type ProjectHomeRefreshProjectionStatusV01 =
  | "idle"
  | "queued"
  | "starting"
  | "running"
  | "waiting_for_approval"
  | "cancelling"
  | "paused"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

export interface ProjectHomeRefreshProjectionV01 {
  run_ref: string | null;
  status: ProjectHomeRefreshProjectionStatusV01;
  control_revision: number;
  pending_approval: null | {
    approval_ref: string;
    control_revision: number;
    decision_submitted?: boolean;
  };
  receipt: null | {
    receipt_ref: string;
  };
}

export const MAX_REFRESHED_PROJECT_HOME_PROJECTIONS_V01 = 32;

const MAX_PROJECT_HOME_REFRESH_REF_LENGTH_V01 = 512;
const PROJECT_HOME_REFRESH_STATES_V01 = new Set<
  ProjectHomeRefreshProjectionStatusV01
>([
  "waiting_for_approval",
  "cancelling",
  "paused",
  "blocked",
  "completed",
  "failed",
  "cancelled",
  "timed_out",
]);

export function buildProjectHomeRefreshProjectionKeyV01(
  projection: ProjectHomeRefreshProjectionV01,
): string | null {
  if (
    !PROJECT_HOME_REFRESH_STATES_V01.has(projection.status) ||
    !isBoundedRefV01(projection.run_ref) ||
    !isRevisionV01(projection.control_revision)
  ) {
    return null;
  }

  const approvalRef = projection.pending_approval?.approval_ref ?? null;
  const approvalControlRevision =
    projection.pending_approval?.control_revision ?? null;
  const receiptRef = projection.receipt?.receipt_ref ?? null;
  if (
    (projection.pending_approval !== null &&
      (!isBoundedRefV01(approvalRef) ||
        !isRevisionV01(approvalControlRevision))) ||
    (projection.receipt !== null && !isBoundedRefV01(receiptRef))
  ) {
    return null;
  }

  return JSON.stringify([
    "project_home_refresh_projection.v0.1",
    projection.run_ref,
    projection.status,
    projection.control_revision,
    approvalRef,
    approvalControlRevision,
    receiptRef,
  ]);
}

export function createProjectHomeRefreshHistoryV01(
  maximumEntries = MAX_REFRESHED_PROJECT_HOME_PROJECTIONS_V01,
): {
  mark(key: string): boolean;
  snapshot(): readonly string[];
} {
  if (!Number.isSafeInteger(maximumEntries) || maximumEntries < 1) {
    throw new Error("project_home_refresh_history_bound_invalid");
  }
  const entries: string[] = [];
  const known = new Set<string>();
  return {
    mark(key) {
      if (known.has(key)) return false;
      entries.push(key);
      known.add(key);
      if (entries.length > maximumEntries) {
        const evicted = entries.shift();
        if (evicted !== undefined) known.delete(evicted);
      }
      return true;
    },
    snapshot() {
      return [...entries];
    },
  };
}

const refreshedProjectHomeProjectionsV01 =
  createProjectHomeRefreshHistoryV01();

export function markProjectHomeProjectionForRefreshV01(key: string): boolean {
  return refreshedProjectHomeProjectionsV01.mark(key);
}

function isBoundedRefV01(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_PROJECT_HOME_REFRESH_REF_LENGTH_V01
  );
}

function isRevisionV01(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}
