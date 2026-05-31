import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseProposalRecordRow,
  type AgWorkResumeMappingProposalRecord,
} from "@/lib/ag-work-resume-mapping-proposal-record";

export type AgWorkResumeMappingProposalLifecycleAction =
  | "withdraw"
  | "reject"
  | "supersede"
  | "expire";

export type AgWorkResumeMappingProposalLifecycleStatus =
  | "withdrawn"
  | "rejected"
  | "superseded"
  | "expired";

export type AgWorkResumeMappingProposalLifecycleActionInput = {
  proposal_id: unknown;
  action: unknown;
  reviewed_by: unknown;
  review_note: unknown;
  reviewed_at?: unknown;
  replacement_proposal_id?: unknown;
  superseded_by_proposal_id?: unknown;
  db?: Database.Database;
  now?: string;
};

export type AgWorkResumeMappingProposalLifecycleActionAuthorityBoundary = {
  proposal_lifecycle_updated: boolean;
  proposal_review_metadata_only: true;
  proposal_record_created: false;
  proposal_record_deleted: false;
  confirmed_mapping_created: false;
  import_record_created: false;
  imported_context_created: false;
  work_item_created: false;
  work_event_created: false;
  proof_recorded: false;
  evidence_recorded: false;
  session_bound: false;
  codex_executed: false;
  approval_granted: false;
  publish_retry_replay_authority: false;
  merge_authority: false;
  durable_approval: "user/Core gated";
  statement: string;
};

export type AgWorkResumeMappingProposalLifecycleActionResult = {
  ok: boolean;
  status:
    | "updated"
    | "invalid_input"
    | "not_found"
    | "not_active"
    | "replacement_not_found"
    | "db_error";
  action: AgWorkResumeMappingProposalLifecycleAction | null;
  proposal_id: string | null;
  before_record: AgWorkResumeMappingProposalRecord | null;
  record: AgWorkResumeMappingProposalRecord | null;
  updated_fields: string[];
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeMappingProposalLifecycleActionAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedLifecycleActionInput = {
  proposal_id: string;
  action: AgWorkResumeMappingProposalLifecycleAction;
  next_status: AgWorkResumeMappingProposalLifecycleStatus;
  reviewed_by: string;
  review_note: string;
  reviewed_at: string;
  updated_at: string;
  superseded_by_proposal_id: string | null;
};

const ACTIVE_PROPOSAL_STATUSES = new Set(["proposed", "needs_review"]);
const ACTION_TO_STATUS: Record<
  AgWorkResumeMappingProposalLifecycleAction,
  AgWorkResumeMappingProposalLifecycleStatus
> = {
  withdraw: "withdrawn",
  reject: "rejected",
  supersede: "superseded",
  expire: "expired",
};
const LIFECYCLE_STATEMENT =
  "AG Resume mapping proposal lifecycle updates are proposal review metadata only. They do not confirm mappings, import context, record proof/evidence, bind sessions, execute Codex, approve, publish, retry, replay, or merge.";

export function applyAgWorkResumeMappingProposalLifecycleAction(
  input: AgWorkResumeMappingProposalLifecycleActionInput,
): AgWorkResumeMappingProposalLifecycleActionResult {
  const validation = normalizeLifecycleActionInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      action: validation.action,
      proposal_id: validation.proposal_id,
      failures: [validation.error],
      recommended_next_step:
        "Stop. Provide proposal_id, action withdraw/reject/supersede/expire, reviewed_by, review_note, and valid lifecycle timestamps.",
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    return db.transaction(() => {
      const beforeRow = selectProposalRecordRow(db, normalized.proposal_id);
      if (!beforeRow) {
        return failureResult({
          status: "not_found",
          action: normalized.action,
          proposal_id: normalized.proposal_id,
          failures: [`Proposal record not found: ${normalized.proposal_id}`],
          recommended_next_step:
            "Check the proposal_id or list proposal records before retrying the lifecycle action.",
        });
      }

      const beforeRecord = parseProposalRecordRow(beforeRow);
      if (!ACTIVE_PROPOSAL_STATUSES.has(beforeRecord.status)) {
        return failureResult({
          status: "not_active",
          action: normalized.action,
          proposal_id: normalized.proposal_id,
          before_record: beforeRecord,
          failures: [
            `Proposal record ${normalized.proposal_id} is ${beforeRecord.status}, not proposed or needs_review.`,
          ],
          recommended_next_step:
            "Stop. Terminal or inactive proposal records require a separately gated correction/reopen design before further lifecycle changes.",
        });
      }

      if (normalized.superseded_by_proposal_id) {
        const replacementRow = selectProposalRecordRow(
          db,
          normalized.superseded_by_proposal_id,
        );
        if (!replacementRow) {
          return failureResult({
            status: "replacement_not_found",
            action: normalized.action,
            proposal_id: normalized.proposal_id,
            before_record: beforeRecord,
            failures: [
              `Replacement proposal record not found: ${normalized.superseded_by_proposal_id}`,
            ],
            recommended_next_step:
              "Create or identify the replacement proposal record through the separately scoped proposal writer before superseding with a replacement id.",
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
        proposal_id: normalized.proposal_id,
        status: normalized.next_status,
        reviewed_by: normalized.reviewed_by,
        reviewed_at: normalized.reviewed_at,
        review_note: normalized.review_note,
        updated_at: normalized.updated_at,
        superseded_by_proposal_id: normalized.superseded_by_proposal_id,
      };

      if (normalized.superseded_by_proposal_id) {
        updatedFields.push("superseded_by_proposal_id");
        const updateInfo = db.prepare(
          `
            UPDATE ag_work_resume_mapping_proposals
            SET
              status = @status,
              reviewed_by = @reviewed_by,
              reviewed_at = @reviewed_at,
              review_note = @review_note,
              updated_at = @updated_at,
              superseded_by_proposal_id = @superseded_by_proposal_id
            WHERE proposal_id = @proposal_id
          `,
        ).run(params);
        if (updateInfo.changes !== 1) {
          throw new Error("Lifecycle action update affected an unexpected row count.");
        }
      } else {
        const updateInfo = db.prepare(
          `
            UPDATE ag_work_resume_mapping_proposals
            SET
              status = @status,
              reviewed_by = @reviewed_by,
              reviewed_at = @reviewed_at,
              review_note = @review_note,
              updated_at = @updated_at
            WHERE proposal_id = @proposal_id
          `,
        ).run(params);
        if (updateInfo.changes !== 1) {
          throw new Error("Lifecycle action update affected an unexpected row count.");
        }
      }

      const afterRow = selectProposalRecordRow(db, normalized.proposal_id);
      if (!afterRow) {
        throw new Error("Updated mapping proposal record could not be read back.");
      }
      const record = parseProposalRecordRow(afterRow);

      return {
        ok: true,
        status: "updated" as const,
        action: normalized.action,
        proposal_id: normalized.proposal_id,
        before_record: beforeRecord,
        record,
        updated_fields: updatedFields,
        warnings: [],
        failures: [],
        authority_boundary: buildAuthorityBoundary(true),
        recommended_next_step:
          "User/Core may continue reviewing proposal metadata. This lifecycle update is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
      };
    })();
  } catch (error) {
    return failureResult({
      status: "db_error",
      action: normalized.action,
      proposal_id: normalized.proposal_id,
      failures: [
        `Failed to apply mapping proposal lifecycle action: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        "Stop. Inspect the database error before retrying the lifecycle action.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeLifecycleActionInput(
  input: AgWorkResumeMappingProposalLifecycleActionInput,
):
  | { value: NormalizedLifecycleActionInput }
  | { error: string; action: AgWorkResumeMappingProposalLifecycleAction | null; proposal_id: string | null } {
  if (!isRecord(input)) {
    return {
      error: "Lifecycle action input must be a JSON object.",
      action: null,
      proposal_id: null,
    };
  }

  const unknownKeys = Object.keys(input).filter(
    (key) =>
      ![
        "proposal_id",
        "action",
        "reviewed_by",
        "review_note",
        "reviewed_at",
        "replacement_proposal_id",
        "superseded_by_proposal_id",
        "db",
        "now",
      ].includes(key),
  );
  const proposalId = cleanString(input.proposal_id);
  const action = normalizeAction(input.action);
  if (unknownKeys.length > 0) {
    return {
      error: `Unsupported lifecycle action input field(s): ${unknownKeys.join(", ")}.`,
      action,
      proposal_id: proposalId,
    };
  }
  if (!proposalId) {
    return {
      error: "proposal_id must be a non-empty string.",
      action,
      proposal_id: null,
    };
  }
  if (!action) {
    return {
      error: "action must be one of: withdraw, reject, supersede, expire.",
      action: null,
      proposal_id: proposalId,
    };
  }

  const reviewedBy = cleanString(input.reviewed_by);
  if (!reviewedBy) {
    return {
      error: "reviewed_by must be a non-empty string.",
      action,
      proposal_id: proposalId,
    };
  }
  const reviewNote = cleanString(input.review_note);
  if (!reviewNote) {
    return {
      error: "review_note must be a non-empty string.",
      action,
      proposal_id: proposalId,
    };
  }

  const now = normalizeOptionalTimestamp(input.now, "now");
  if ("error" in now) {
    return { error: now.error, action, proposal_id: proposalId };
  }
  const reviewedAt = normalizeReviewedAt(input.reviewed_at, now.value);
  if ("error" in reviewedAt) {
    return { error: reviewedAt.error, action, proposal_id: proposalId };
  }

  const replacementId = normalizeOptionalId(
    input.replacement_proposal_id,
    "replacement_proposal_id",
  );
  if ("error" in replacementId) {
    return { error: replacementId.error, action, proposal_id: proposalId };
  }
  const supersededById = normalizeOptionalId(
    input.superseded_by_proposal_id,
    "superseded_by_proposal_id",
  );
  if ("error" in supersededById) {
    return { error: supersededById.error, action, proposal_id: proposalId };
  }
  if (
    action !== "supersede" &&
    (isSupplied(input.replacement_proposal_id) ||
      isSupplied(input.superseded_by_proposal_id))
  ) {
    return {
      error:
        "replacement_proposal_id and superseded_by_proposal_id are allowed only for action supersede.",
      action,
      proposal_id: proposalId,
    };
  }
  if (replacementId.value && supersededById.value && replacementId.value !== supersededById.value) {
    return {
      error:
        "replacement_proposal_id and superseded_by_proposal_id must match when both are supplied.",
      action,
      proposal_id: proposalId,
    };
  }
  const supersededByProposalId = replacementId.value ?? supersededById.value;
  if (supersededByProposalId === proposalId) {
    return {
      error: "Supersede replacement proposal id must not equal proposal_id.",
      action,
      proposal_id: proposalId,
    };
  }

  return {
    value: {
      proposal_id: proposalId,
      action,
      next_status: ACTION_TO_STATUS[action],
      reviewed_by: reviewedBy,
      review_note: reviewNote,
      reviewed_at: reviewedAt.value,
      updated_at: reviewedAt.value,
      superseded_by_proposal_id:
        action === "supersede" ? supersededByProposalId : null,
    },
  };
}

function selectProposalRecordRow(db: Database.Database, proposalId: string) {
  return db
    .prepare(
      `
        SELECT *
        FROM ag_work_resume_mapping_proposals
        WHERE proposal_id = ?
      `,
    )
    .get(proposalId) as Record<string, unknown> | undefined;
}

function failureResult({
  status,
  action = null,
  proposal_id = null,
  before_record = null,
  record = null,
  updated_fields = [],
  warnings = [],
  failures,
  recommended_next_step,
}: {
  status: Exclude<AgWorkResumeMappingProposalLifecycleActionResult["status"], "updated">;
  action?: AgWorkResumeMappingProposalLifecycleAction | null;
  proposal_id?: string | null;
  before_record?: AgWorkResumeMappingProposalRecord | null;
  record?: AgWorkResumeMappingProposalRecord | null;
  updated_fields?: string[];
  warnings?: string[];
  failures: string[];
  recommended_next_step: string;
}): AgWorkResumeMappingProposalLifecycleActionResult {
  return {
    ok: false,
    status,
    action,
    proposal_id,
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
  proposalLifecycleUpdated: boolean,
): AgWorkResumeMappingProposalLifecycleActionAuthorityBoundary {
  return {
    proposal_lifecycle_updated: proposalLifecycleUpdated,
    proposal_review_metadata_only: true,
    proposal_record_created: false,
    proposal_record_deleted: false,
    confirmed_mapping_created: false,
    import_record_created: false,
    imported_context_created: false,
    work_item_created: false,
    work_event_created: false,
    proof_recorded: false,
    evidence_recorded: false,
    session_bound: false,
    codex_executed: false,
    approval_granted: false,
    publish_retry_replay_authority: false,
    merge_authority: false,
    durable_approval: "user/Core gated",
    statement: LIFECYCLE_STATEMENT,
  };
}

function normalizeAction(
  value: unknown,
): AgWorkResumeMappingProposalLifecycleAction | null {
  const action = cleanString(value);
  if (
    action === "withdraw" ||
    action === "reject" ||
    action === "supersede" ||
    action === "expire"
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
  if (value === undefined || value === null) {
    return { value: null };
  }
  return normalizeRequiredTimestamp(value, field);
}

function normalizeRequiredTimestamp(
  value: unknown,
  field: string,
): { value: string } | { error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: `${field} must be an ISO UTC timestamp with millisecond precision.` };
  }
  const timestamp = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) {
    return { error: `${field} must be an ISO UTC timestamp with millisecond precision.` };
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
  if (value === undefined || value === null) {
    return { value: null };
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: `${field} must be a non-empty string when supplied.` };
  }
  return { value: value.trim() };
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
