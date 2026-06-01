import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseReconciliationCandidateRecordRow,
  type AgWorkResumeProofEvidenceReconciliationCandidateRecord,
} from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate";

export type AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction =
  | "accept_for_future_recording"
  | "reject"
  | "defer"
  | "withdraw"
  | "revoke"
  | "supersede";

export type AgWorkResumeProofEvidenceReconciliationCandidateLifecycleStatus =
  | "accepted_for_future_recording"
  | "rejected"
  | "deferred"
  | "withdrawn"
  | "revoked"
  | "superseded";

export type AgWorkResumeProofEvidenceReconciliationCandidateLifecycleInput = {
  candidate_id: unknown;
  action: unknown;
  reviewed_by: unknown;
  review_note: unknown;
  reviewed_at?: unknown;
  replacement_candidate_id?: unknown;
  superseded_by_candidate_id?: unknown;
  db?: Database.Database;
  now?: string;
};

export type AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAuthorityBoundary = {
  reconciliation_candidate_lifecycle_updated: boolean;
  reconciliation_candidate_updated: boolean;
  review_metadata_only: true;
  reconciliation_candidate_created: false;
  reconciliation_candidate_deleted: false;
  proof_recorded: false;
  evidence_recorded: false;
  session_bound: false;
  codex_executed: false;
  work_item_created: false;
  work_event_created: false;
  imported_context_updated: false;
  confirmed_mapping_updated: false;
  proposal_record_updated: false;
  approval_granted: false;
  publish_retry_replay_authority: false;
  merge_authority: false;
  durable_approval: "user/Core gated";
  statement: string;
};

export type AgWorkResumeProofEvidenceReconciliationCandidateLifecycleResult = {
  ok: boolean;
  status:
    | "updated"
    | "invalid_input"
    | "not_found"
    | "invalid_transition"
    | "replacement_not_found"
    | "db_error";
  action: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction | null;
  candidate_id: string | null;
  before_record: AgWorkResumeProofEvidenceReconciliationCandidateRecord | null;
  record: AgWorkResumeProofEvidenceReconciliationCandidateRecord | null;
  updated_fields: string[];
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAuthorityBoundary;
  recommended_next_step: string;
};

type CandidateStatus = AgWorkResumeProofEvidenceReconciliationCandidateRecord["status"];

type NormalizedLifecycleInput = {
  candidate_id: string;
  action: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction;
  next_status: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleStatus;
  reviewed_by: string;
  review_note: string;
  reviewed_at: string;
  updated_at: string;
  superseded_by_candidate_id: string | null;
};

const ACTION_TO_STATUS: Record<
  AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction,
  AgWorkResumeProofEvidenceReconciliationCandidateLifecycleStatus
> = {
  accept_for_future_recording: "accepted_for_future_recording",
  reject: "rejected",
  defer: "deferred",
  withdraw: "withdrawn",
  revoke: "revoked",
  supersede: "superseded",
};

const ALLOWED_ACTIONS_BY_STATUS: Record<
  CandidateStatus,
  Set<AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction>
> = {
  proposed: new Set([
    "accept_for_future_recording",
    "reject",
    "defer",
    "withdraw",
    "supersede",
  ]),
  deferred: new Set([
    "accept_for_future_recording",
    "reject",
    "withdraw",
    "revoke",
    "supersede",
  ]),
  accepted_for_future_recording: new Set(["revoke", "supersede"]),
  rejected: new Set(["revoke", "supersede"]),
  withdrawn: new Set(["revoke", "supersede"]),
  superseded: new Set(["revoke"]),
  revoked: new Set(),
};

const LIFECYCLE_STATEMENT =
  "AG Resume proof/evidence reconciliation candidate lifecycle actions update candidate review metadata only. accepted_for_future_recording is not proof/evidence recording and grants no session, Codex, work, approval, publish, retry, replay, or merge authority.";
const MAX_TEXT_LENGTH = 4000;

export function applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction(
  input: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleInput,
): AgWorkResumeProofEvidenceReconciliationCandidateLifecycleResult {
  const validation = normalizeLifecycleInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      action: validation.action,
      candidate_id: validation.candidate_id,
      failures: [validation.error],
      recommended_next_step:
        "Stop. Provide candidate_id, action accept_for_future_recording/reject/defer/withdraw/revoke/supersede, reviewed_by, review_note, and valid lifecycle timestamps.",
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    return db.transaction(() => {
      const beforeRow = selectCandidateRecordRow(db, normalized.candidate_id);
      if (!beforeRow) {
        return failureResult({
          status: "not_found",
          action: normalized.action,
          candidate_id: normalized.candidate_id,
          failures: [
            `Reconciliation candidate not found: ${normalized.candidate_id}`,
          ],
          recommended_next_step:
            "Check candidate_id through the read route before retrying the lifecycle action.",
        });
      }

      const beforeRecord = parseReconciliationCandidateRecordRow(beforeRow);
      if (
        !ALLOWED_ACTIONS_BY_STATUS[beforeRecord.status]?.has(normalized.action)
      ) {
        return failureResult({
          status: "invalid_transition",
          action: normalized.action,
          candidate_id: normalized.candidate_id,
          before_record: beforeRecord,
          failures: [
            `Action ${normalized.action} is not allowed from candidate status ${beforeRecord.status}.`,
          ],
          recommended_next_step:
            "Stop. Candidate lifecycle decisions are review metadata only; unsupported correction or reopen behavior requires a separately gated design.",
        });
      }

      if (normalized.superseded_by_candidate_id) {
        const replacementRow = selectCandidateRecordRow(
          db,
          normalized.superseded_by_candidate_id,
        );
        if (!replacementRow) {
          return failureResult({
            status: "replacement_not_found",
            action: normalized.action,
            candidate_id: normalized.candidate_id,
            before_record: beforeRecord,
            failures: [
              `Replacement reconciliation candidate not found: ${normalized.superseded_by_candidate_id}`,
            ],
            recommended_next_step:
              "Create or identify the replacement candidate through the separately scoped candidate writer before superseding with a replacement id.",
          });
        }
      }

      const updatedFields = [
        "status",
        "reviewed_by",
        "reviewed_at",
        "review_note",
        "updated_at",
      ];
      const params: Record<string, string | null> = {
        candidate_id: normalized.candidate_id,
        status: normalized.next_status,
        reviewed_by: normalized.reviewed_by,
        reviewed_at: normalized.reviewed_at,
        review_note: normalized.review_note,
        updated_at: normalized.updated_at,
        superseded_by_candidate_id: normalized.superseded_by_candidate_id,
      };

      if (normalized.superseded_by_candidate_id) {
        updatedFields.push("superseded_by_candidate_id");
        const updateInfo = db
          .prepare(
            `
              UPDATE ag_work_resume_proof_evidence_reconciliation_candidates
              SET
                status = @status,
                reviewed_by = @reviewed_by,
                reviewed_at = @reviewed_at,
                review_note = @review_note,
                updated_at = @updated_at,
                superseded_by_candidate_id = @superseded_by_candidate_id
              WHERE candidate_id = @candidate_id
            `,
          )
          .run(params);
        if (updateInfo.changes !== 1) {
          throw new Error("Lifecycle update affected an unexpected row count.");
        }
      } else {
        const updateInfo = db
          .prepare(
            `
              UPDATE ag_work_resume_proof_evidence_reconciliation_candidates
              SET
                status = @status,
                reviewed_by = @reviewed_by,
                reviewed_at = @reviewed_at,
                review_note = @review_note,
                updated_at = @updated_at
              WHERE candidate_id = @candidate_id
            `,
          )
          .run(params);
        if (updateInfo.changes !== 1) {
          throw new Error("Lifecycle update affected an unexpected row count.");
        }
      }

      const afterRow = selectCandidateRecordRow(db, normalized.candidate_id);
      if (!afterRow) {
        throw new Error("Updated reconciliation candidate could not be read back.");
      }
      const record = parseReconciliationCandidateRecordRow(afterRow);

      return {
        ok: true,
        status: "updated" as const,
        action: normalized.action,
        candidate_id: normalized.candidate_id,
        before_record: beforeRecord,
        record,
        updated_fields: updatedFields,
        warnings: [],
        failures: [],
        authority_boundary: buildAuthorityBoundary(true),
        recommended_next_step:
          "User/Core may continue reviewing candidate metadata. accepted_for_future_recording is not proof/evidence recording; actual proof/evidence recording remains a separately authorized future gate.",
      };
    })();
  } catch (error) {
    return failureResult({
      status: "db_error",
      action: normalized.action,
      candidate_id: normalized.candidate_id,
      failures: [
        `Failed to apply reconciliation candidate lifecycle action: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database error before retrying the candidate lifecycle action.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeLifecycleInput(
  input: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleInput,
):
  | { value: NormalizedLifecycleInput }
  | {
      error: string;
      action: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction | null;
      candidate_id: string | null;
    } {
  if (!isRecord(input)) {
    return {
      error: "Candidate lifecycle action input must be a JSON object.",
      action: null,
      candidate_id: null,
    };
  }

  const allowedKeys = new Set([
    "candidate_id",
    "action",
    "reviewed_by",
    "review_note",
    "reviewed_at",
    "replacement_candidate_id",
    "superseded_by_candidate_id",
    "db",
    "now",
  ]);
  const unknownKeys = Object.keys(input).filter((key) => !allowedKeys.has(key));
  const candidateId = cleanString(input.candidate_id);
  const action = normalizeAction(input.action);
  if (unknownKeys.length > 0) {
    return {
      error: `Unsupported candidate lifecycle action input field(s): ${unknownKeys.join(", ")}.`,
      action,
      candidate_id: candidateId,
    };
  }
  if (!candidateId) {
    return {
      error: "candidate_id must be a non-empty string.",
      action,
      candidate_id: null,
    };
  }
  if (!action) {
    return {
      error:
        "action must be one of: accept_for_future_recording, reject, defer, withdraw, revoke, supersede.",
      action: null,
      candidate_id: candidateId,
    };
  }

  const reviewedBy = cleanString(input.reviewed_by);
  if (!reviewedBy) {
    return {
      error: "reviewed_by must be a non-empty string.",
      action,
      candidate_id: candidateId,
    };
  }
  const reviewNote = boundedRequiredString(input.review_note, "review_note");
  if ("error" in reviewNote) {
    return { error: reviewNote.error, action, candidate_id: candidateId };
  }

  const now = normalizeOptionalTimestamp(input.now, "now");
  if ("error" in now) {
    return { error: now.error, action, candidate_id: candidateId };
  }
  const reviewedAt = normalizeReviewedAt(input.reviewed_at, now.value);
  if ("error" in reviewedAt) {
    return { error: reviewedAt.error, action, candidate_id: candidateId };
  }

  const replacementId = normalizeOptionalId(
    input.replacement_candidate_id,
    "replacement_candidate_id",
  );
  if ("error" in replacementId) {
    return { error: replacementId.error, action, candidate_id: candidateId };
  }
  const supersededById = normalizeOptionalId(
    input.superseded_by_candidate_id,
    "superseded_by_candidate_id",
  );
  if ("error" in supersededById) {
    return { error: supersededById.error, action, candidate_id: candidateId };
  }
  if (
    action !== "supersede" &&
    (isSupplied(input.replacement_candidate_id) ||
      isSupplied(input.superseded_by_candidate_id))
  ) {
    return {
      error:
        "replacement_candidate_id and superseded_by_candidate_id are allowed only for action supersede.",
      action,
      candidate_id: candidateId,
    };
  }
  if (
    replacementId.value &&
    supersededById.value &&
    replacementId.value !== supersededById.value
  ) {
    return {
      error:
        "replacement_candidate_id and superseded_by_candidate_id must match when both are supplied.",
      action,
      candidate_id: candidateId,
    };
  }
  const supersededByCandidateId = replacementId.value ?? supersededById.value;
  if (supersededByCandidateId === candidateId) {
    return {
      error: "Supersede replacement candidate id must not equal candidate_id.",
      action,
      candidate_id: candidateId,
    };
  }

  return {
    value: {
      candidate_id: candidateId,
      action,
      next_status: ACTION_TO_STATUS[action],
      reviewed_by: reviewedBy,
      review_note: reviewNote.value,
      reviewed_at: reviewedAt.value,
      updated_at: reviewedAt.value,
      superseded_by_candidate_id:
        action === "supersede" ? supersededByCandidateId : null,
    },
  };
}

function selectCandidateRecordRow(db: Database.Database, candidateId: string) {
  return db
    .prepare(
      `
        SELECT *
        FROM ag_work_resume_proof_evidence_reconciliation_candidates
        WHERE candidate_id = ?
      `,
    )
    .get(candidateId) as Record<string, unknown> | undefined;
}

function failureResult({
  status,
  action = null,
  candidate_id = null,
  before_record = null,
  record = null,
  updated_fields = [],
  warnings = [],
  failures,
  recommended_next_step,
}: {
  status: Exclude<
    AgWorkResumeProofEvidenceReconciliationCandidateLifecycleResult["status"],
    "updated"
  >;
  action?: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction | null;
  candidate_id?: string | null;
  before_record?: AgWorkResumeProofEvidenceReconciliationCandidateRecord | null;
  record?: AgWorkResumeProofEvidenceReconciliationCandidateRecord | null;
  updated_fields?: string[];
  warnings?: string[];
  failures: string[];
  recommended_next_step: string;
}): AgWorkResumeProofEvidenceReconciliationCandidateLifecycleResult {
  return {
    ok: false,
    status,
    action,
    candidate_id,
    before_record,
    record,
    updated_fields,
    warnings,
    failures,
    authority_boundary: buildAuthorityBoundary(false),
    recommended_next_step,
  };
}

function buildAuthorityBoundary(
  lifecycleUpdated: boolean,
): AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAuthorityBoundary {
  return {
    reconciliation_candidate_lifecycle_updated: lifecycleUpdated,
    reconciliation_candidate_updated: lifecycleUpdated,
    review_metadata_only: true,
    reconciliation_candidate_created: false,
    reconciliation_candidate_deleted: false,
    proof_recorded: false,
    evidence_recorded: false,
    session_bound: false,
    codex_executed: false,
    work_item_created: false,
    work_event_created: false,
    imported_context_updated: false,
    confirmed_mapping_updated: false,
    proposal_record_updated: false,
    approval_granted: false,
    publish_retry_replay_authority: false,
    merge_authority: false,
    durable_approval: "user/Core gated",
    statement: LIFECYCLE_STATEMENT,
  };
}

function normalizeAction(
  value: unknown,
): AgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction | null {
  const action = cleanString(value);
  if (
    action === "accept_for_future_recording" ||
    action === "reject" ||
    action === "defer" ||
    action === "withdraw" ||
    action === "revoke" ||
    action === "supersede"
  ) {
    return action;
  }
  return null;
}

function normalizeReviewedAt(
  value: unknown,
  normalizedNow: string | null,
): { value: string } | { error: string } {
  if (value === undefined || value === null) {
    return { value: normalizedNow ?? new Date().toISOString() };
  }
  return normalizeRequiredTimestamp(value, "reviewed_at");
}

function normalizeOptionalTimestamp(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === undefined || value === null) return { value: null };
  return normalizeRequiredTimestamp(value, field);
}

function normalizeRequiredTimestamp(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      error: `${field} must be an ISO UTC timestamp with millisecond precision.`,
    };
  }
  const timestamp = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) {
    return {
      error: `${field} must be an ISO UTC timestamp with millisecond precision.`,
    };
  }
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== timestamp) {
    return { error: `${field} must be a valid ISO UTC timestamp.` };
  }
  return { value: timestamp };
}

function normalizeOptionalId(
  value: unknown,
  field: string,
): { value: string | null } | { error: string } {
  if (value === undefined || value === null) return { value: null };
  const cleaned = cleanString(value);
  if (!cleaned) {
    return { error: `${field} must be a non-empty string when supplied.` };
  }
  return { value: cleaned };
}

function boundedRequiredString(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  const cleaned = cleanString(value);
  if (!cleaned) return { error: `${field} must be a non-empty string.` };
  if (cleaned.length > MAX_TEXT_LENGTH) {
    return { error: `${field} must be ${MAX_TEXT_LENGTH} characters or fewer.` };
  }
  return { value: cleaned };
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isSupplied(value: unknown) {
  return value !== undefined && value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
