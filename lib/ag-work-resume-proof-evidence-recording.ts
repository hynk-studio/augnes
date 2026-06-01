import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import {
  parseConfirmedMappingRecordRow,
  type AgWorkResumeConfirmedMappingRecord,
} from "@/lib/ag-work-resume-confirmed-mapping";
import {
  parseImportedContextRecordRow,
  type AgWorkResumeImportedContextRecord,
} from "@/lib/ag-work-resume-imported-context";
import {
  parseReconciliationCandidateRecordRow,
  type AgWorkResumeProofEvidenceReconciliationCandidateRecord,
} from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate";

export type AgWorkResumeProofEvidenceRecordingInput = {
  candidate_id: unknown;
  import_id?: unknown;
  mapping_id?: unknown;
  user_core_approval: unknown;
  actor: unknown;
  reason: unknown;
  redaction_summary: unknown;
  trust_provenance_label: unknown;
  local_target_scope: unknown;
  local_target_work_id: unknown;
  expected_idempotency_key?: unknown;
  now?: unknown;
  db?: Database.Database;
};

export type AgWorkResumeProofEvidenceRecordingResultName =
  | "recorded"
  | "idempotent_no_new_write"
  | "unauthorized_attempt"
  | "invalid_candidate"
  | "source_cross_check_failed"
  | "missing_source_rows"
  | "unsafe_redaction"
  | "invalid_actor_reason"
  | "invalid_trust_provenance"
  | "duplicate_conflict"
  | "fk_or_unique_failure"
  | "db_error";

export type AgWorkResumeProofEvidenceRecordingAuthorityBoundary = {
  exact_user_core_approval_required: true;
  verification_evidence_record_created: boolean;
  bridge_link_created: boolean;
  proof_recorded: false;
  action_record_created: false;
  route_added: false;
  ui_added: false;
  session_bound: false;
  codex_executed: false;
  codex_continued: false;
  work_item_created: false;
  work_event_created: false;
  imported_context_mutated: false;
  confirmed_mapping_mutated: false;
  proposal_record_mutated: false;
  reconciliation_candidate_mutated: false;
  approval_granted: false;
  publish_retry_replay_authority: false;
  merge_authority: false;
  auto_merge_authority: false;
  external_posting_authority: false;
  committed_state_mutated: false;
  allowed_insert_tables: readonly [
    "verification_evidence_records",
    "ag_work_resume_proof_evidence_recording_links",
  ];
  statement: string;
};

export type AgWorkResumeProofEvidenceRecordingResult = {
  ok: boolean;
  result: AgWorkResumeProofEvidenceRecordingResultName;
  created: boolean;
  candidate_id: string | null;
  evidence_id: string | null;
  recording_link_id: string | null;
  idempotency_key: string | null;
  target_record_kind: "verification_evidence" | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeProofEvidenceRecordingAuthorityBoundary;
  recommended_next_step: string;
};

type UserCoreApprovalPayload = {
  approval_kind: "ag_work_resume_actual_proof_evidence_recording";
  approval_schema: "augnes.ag_work_resume.actual_proof_evidence_recording.approval.v0_1";
  approved_candidate_id: string;
  approved_import_id: string;
  approved_mapping_id: string;
  approved_local_target_scope: string;
  approved_local_target_work_id: string;
  approved_target_record_kind: "verification_evidence";
  approved_idempotency_key: string;
  approved_actor: string;
  approved_reason: string;
  approved_redaction_summary: Record<string, unknown>;
  approved_trust_provenance_label: "foreign_summary_user_core_attested";
  approved_side_effects: {
    insert_tables: string[];
    forbidden_tables: string[];
  };
};

type NormalizedInput = {
  candidate_id: string;
  import_id?: string;
  mapping_id?: string;
  user_core_approval: UserCoreApprovalPayload;
  actor: string;
  reason: string;
  redaction_summary: Record<string, unknown>;
  trust_provenance_label: "foreign_summary_user_core_attested";
  local_target_scope: string;
  local_target_work_id: string;
  expected_idempotency_key?: string;
  created_at: string;
};

type RecordingRows = {
  evidence: VerificationEvidenceRecordInsertRow;
  link: RecordingLinkInsertRow;
  metadata: Record<string, unknown>;
  provenance: Record<string, unknown>;
};

type VerificationEvidenceRecordInsertRow = {
  evidence_id: string;
  scope: string;
  work_id: string;
  publication_id: null;
  delivery_id: null;
  target_surface: "ag_work_resume";
  target_ref: string;
  evidence_kind: "check_passed";
  label: string;
  status: "passed";
  command: null;
  result_summary: string;
  skipped_reason: null;
  observed_behavior: string;
  source_surface: "ag_work_resume_proof_evidence_recording_writer_helper";
  source_ref: string;
  related_action_id: null;
  related_work_event_id: null;
  metadata: string;
  created_by: string;
  created_at: string;
};

type RecordingLinkInsertRow = {
  recording_link_id: string;
  record_kind: "ag_work_resume_proof_evidence_recording_link";
  schema: "augnes.ag_work_resume_proof_evidence_recording_link.v0_1";
  candidate_id: string;
  import_id: string;
  mapping_id: string;
  local_target_scope: string;
  local_target_work_id: string;
  target_record_kind: "verification_evidence";
  target_evidence_id: string;
  target_action_id: null;
  idempotency_key: string;
  actor: string;
  reason: string;
  redaction_summary: string;
  trust_provenance_label: "foreign_summary_user_core_attested";
  provenance_json: string;
  recording_status: "recorded";
  failure_reason: null;
  created_at: string;
  updated_at: string;
};

const TRUST_PROVENANCE_LABEL = "foreign_summary_user_core_attested" as const;
const TARGET_RECORD_KIND = "verification_evidence" as const;
const RECORD_KIND = "ag_work_resume_proof_evidence_recording_link" as const;
const RECORD_SCHEMA =
  "augnes.ag_work_resume_proof_evidence_recording_link.v0_1" as const;
const APPROVAL_KIND = "ag_work_resume_actual_proof_evidence_recording" as const;
const APPROVAL_SCHEMA =
  "augnes.ag_work_resume.actual_proof_evidence_recording.approval.v0_1" as const;
const MAX_TEXT_LENGTH = 4000;
const MAX_JSON_TEXT_LENGTH = 12000;
const AUTHORITY_STATEMENT =
  "AG Resume actual proof/evidence recording writes exactly one verification_evidence_records row and one ag_work_resume_proof_evidence_recording_links row only after exact user/Core approval. It creates no action_records row, session binding, Codex continuation, work item/event, source-row mutation, approval, publish, retry, replay, merge, auto-merge, external posting, or committed-state authority.";
const ALLOWED_INSERT_TABLES = [
  "verification_evidence_records",
  "ag_work_resume_proof_evidence_recording_links",
] as const;
const REQUIRED_FORBIDDEN_TABLES = [
  "action_records",
  "sessions",
  "work_items",
  "work_events",
  "ag_work_resume_imported_contexts",
  "ag_work_resume_confirmed_mappings",
  "ag_work_resume_mapping_proposals",
  "ag_work_resume_proof_evidence_reconciliation_candidates",
] as const;
const REDACTION_FALSE_FIELDS = [
  "secrets_included",
  "raw_db_paths_included",
  "raw_session_payloads_included",
  "session_payloads_included",
  "raw_proof_payloads_included",
  "proof_payloads_included",
  "raw_evidence_payloads_included",
  "evidence_payloads_included",
  "tokens_included",
  "keys_included",
  "cookies_included",
  "private_paths_included",
  "raw_foreign_payload_copied",
  "raw_foreign_payloads_copied",
  "raw_command_output_included",
] as const;
const FORBIDDEN_ACTOR_PREFIXES = [
  "codex",
  "session",
  "chatgpt",
  "browser",
  "mcp",
  "github",
];

class RecordingConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordingConstraintError";
  }
}

export function createAgWorkResumeProofEvidenceRecordingFromCandidate(
  input: AgWorkResumeProofEvidenceRecordingInput,
): AgWorkResumeProofEvidenceRecordingResult {
  const validation = normalizeInput(input);
  if ("error" in validation) {
    return failureResult({
      result: validation.result,
      candidate_id: validation.candidate_id,
      failures: [validation.error],
      recommended_next_step: validation.recommended_next_step,
    });
  }

  const normalized = validation.value;
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    return db.transaction(() => {
      const source = readAndValidateSourceRows(db, normalized);
      if ("failure" in source) return source.failure;

      const idempotencyKey = buildIdempotencyKey(source);
      if (
        normalized.expected_idempotency_key !== undefined &&
        normalized.expected_idempotency_key !== idempotencyKey
      ) {
        return failureResult({
          result: "unauthorized_attempt",
          candidate_id: normalized.candidate_id,
          idempotency_key: idempotencyKey,
          failures: [
            `expected_idempotency_key mismatch: supplied ${normalized.expected_idempotency_key}, derived ${idempotencyKey}.`,
          ],
          recommended_next_step:
            "Stop. Re-read the candidate and approve the exact derived idempotency key before recording.",
        });
      }

      const approvalFailures = validateApprovalPayload(
        normalized,
        source,
        idempotencyKey,
      );
      if (approvalFailures.length > 0) {
        return failureResult({
          result: "unauthorized_attempt",
          candidate_id: normalized.candidate_id,
          idempotency_key: idempotencyKey,
          failures: approvalFailures,
          recommended_next_step:
            "Stop. User/Core approval must match the exact candidate, source rows, target, idempotency key, actor, reason, redaction, trust, and side-effect boundary.",
        });
      }

      const rows = buildRecordingRows(normalized, source, idempotencyKey);
      const existingByKey = selectRecordingLinkByIdempotencyKey(
        db,
        idempotencyKey,
      );
      if (existingByKey) {
        return existingLinkResult({ db, existingByKey, rows, normalized });
      }

      const existingByCandidate = selectRecordingLinkByCandidateId(
        db,
        normalized.candidate_id,
      );
      if (
        existingByCandidate &&
        stringField(existingByCandidate.idempotency_key) !== idempotencyKey
      ) {
        return failureResult({
          result: "duplicate_conflict",
          candidate_id: normalized.candidate_id,
          idempotency_key: idempotencyKey,
          failures: [
            `Candidate ${normalized.candidate_id} already has a recording link with a different idempotency key.`,
          ],
          recommended_next_step:
            "Stop. One candidate may have at most one recording link in the first implementation.",
        });
      }

      try {
        insertVerificationEvidenceRecord(db, rows.evidence);
        insertRecordingLink(db, rows.link);
      } catch (error) {
        throw new RecordingConstraintError(
          error instanceof Error ? error.message : String(error),
        );
      }

      return {
        ok: true,
        result: "recorded" as const,
        created: true,
        candidate_id: normalized.candidate_id,
        evidence_id: rows.evidence.evidence_id,
        recording_link_id: rows.link.recording_link_id,
        idempotency_key: idempotencyKey,
        target_record_kind: TARGET_RECORD_KIND,
        warnings: [],
        failures: [],
        authority_boundary: buildAuthorityBoundary({
          evidenceCreated: true,
          bridgeCreated: true,
        }),
        recommended_next_step:
          "Review the verification evidence row and bridge link. Actual recording remains limited to this exact user/Core-approved attempt.",
      };
    })();
  } catch (error) {
    const result =
      error instanceof RecordingConstraintError || isConstraintError(error)
        ? "fk_or_unique_failure"
        : "db_error";
    return failureResult({
      result,
      candidate_id: normalized.candidate_id,
      failures: [
        `Failed to record AG Resume proof/evidence link: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      recommended_next_step:
        result === "fk_or_unique_failure"
          ? "Stop. Inspect FK/unique constraint state; the transaction rolled back with no partial recording."
          : "Stop. Inspect the database error before retrying recording.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeInput(
  input: AgWorkResumeProofEvidenceRecordingInput,
):
  | { value: NormalizedInput }
  | {
      error: string;
      result: Exclude<
        AgWorkResumeProofEvidenceRecordingResultName,
        "recorded" | "idempotent_no_new_write"
      >;
      candidate_id?: string | null;
      recommended_next_step: string;
    } {
  if (!isRecord(input)) {
    return {
      error: "Recording input must be a JSON object.",
      result: "unauthorized_attempt",
      candidate_id: null,
      recommended_next_step:
        "Stop. Provide a JSON object with candidate_id and exact user_core_approval.",
    };
  }

  const allowedKeys = new Set([
    "candidate_id",
    "import_id",
    "mapping_id",
    "user_core_approval",
    "actor",
    "reason",
    "redaction_summary",
    "trust_provenance_label",
    "local_target_scope",
    "local_target_work_id",
    "expected_idempotency_key",
    "now",
    "db",
  ]);
  const unknownKeys = Object.keys(input).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    return {
      error: `Unknown field(s): ${unknownKeys.join(", ")}.`,
      result: "unauthorized_attempt",
      candidate_id: null,
      recommended_next_step:
        "Stop. Remove unsupported fields before requesting actual proof/evidence recording.",
    };
  }

  const candidateId = cleanString(input.candidate_id);
  if (!candidateId) {
    return {
      error: "candidate_id must be a non-empty string.",
      result: "invalid_candidate",
      candidate_id: null,
      recommended_next_step:
        "Stop. Provide the accepted reconciliation candidate id as the canonical input.",
    };
  }

  const actor = cleanString(input.actor);
  const reason = boundedRequiredString(input.reason, "reason");
  if (!actor || isInferredActor(actor)) {
    return {
      error:
        "actor must be an explicit user/Core actor and must not be inferred from Codex, session, ChatGPT, Browser, MCP, or GitHub context.",
      result: "invalid_actor_reason",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Provide an explicit user/Core actor for this exact recording attempt.",
    };
  }
  if ("error" in reason) {
    return {
      error: reason.error,
      result: "invalid_actor_reason",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Provide a bounded explicit reason for this exact recording attempt.",
    };
  }

  const trustLabel = cleanString(input.trust_provenance_label);
  if (trustLabel !== TRUST_PROVENANCE_LABEL) {
    return {
      error: `trust_provenance_label must be ${TRUST_PROVENANCE_LABEL}.`,
      result: "invalid_trust_provenance",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Use the allowlisted trust/provenance label for this first implementation.",
    };
  }

  const redactionSummary = normalizeRedactionSummary(input.redaction_summary);
  if ("error" in redactionSummary) {
    return {
      error: redactionSummary.error,
      result: "unsafe_redaction",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Provide a public-safe redaction_summary JSON object with all raw/secret payload flags false.",
    };
  }

  const localTargetScope = cleanString(input.local_target_scope);
  const localTargetWorkId = cleanString(input.local_target_work_id);
  if (!localTargetScope || !localTargetWorkId) {
    return {
      error: "local_target_scope and local_target_work_id must be non-empty strings.",
      result: "source_cross_check_failed",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Provide the local target scope/work id for cross-checking against the candidate and mapping.",
    };
  }

  const approval = normalizeApprovalPayload(input.user_core_approval);
  if ("error" in approval) {
    return {
      error: approval.error,
      result: "unauthorized_attempt",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Provide exact user_core_approval for this recording attempt.",
    };
  }

  const now = normalizeOptionalTimestamp(input.now, "now");
  if ("error" in now) {
    return {
      error: now.error,
      result: "unauthorized_attempt",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Provide now as an ISO UTC timestamp with millisecond precision.",
    };
  }

  const importId = normalizeOptionalString(input.import_id, "import_id");
  if ("error" in importId) {
    return {
      error: importId.error,
      result: "source_cross_check_failed",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Omit import_id or provide the exact candidate-derived import id.",
    };
  }

  const mappingId = normalizeOptionalString(input.mapping_id, "mapping_id");
  if ("error" in mappingId) {
    return {
      error: mappingId.error,
      result: "source_cross_check_failed",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Omit mapping_id or provide the exact candidate-derived mapping id.",
    };
  }

  const expectedIdempotencyKey = normalizeOptionalString(
    input.expected_idempotency_key,
    "expected_idempotency_key",
  );
  if ("error" in expectedIdempotencyKey) {
    return {
      error: expectedIdempotencyKey.error,
      result: "unauthorized_attempt",
      candidate_id: candidateId,
      recommended_next_step:
        "Stop. Omit expected_idempotency_key or provide the exact helper-derived key.",
    };
  }

  return {
    value: {
      candidate_id: candidateId,
      import_id: importId.value,
      mapping_id: mappingId.value,
      user_core_approval: approval.value,
      actor,
      reason: reason.value,
      redaction_summary: redactionSummary.value,
      trust_provenance_label: TRUST_PROVENANCE_LABEL,
      local_target_scope: localTargetScope,
      local_target_work_id: localTargetWorkId,
      expected_idempotency_key: expectedIdempotencyKey.value,
      created_at: now.value ?? new Date().toISOString(),
    },
  };
}

function readAndValidateSourceRows(db: Database.Database, input: NormalizedInput):
  | {
      candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
      importedContext: AgWorkResumeImportedContextRecord;
      confirmedMapping: AgWorkResumeConfirmedMappingRecord;
    }
  | { failure: AgWorkResumeProofEvidenceRecordingResult } {
  const candidateRow = selectCandidateRow(db, input.candidate_id);
  if (!candidateRow) {
    return {
      failure: failureResult({
        result: "invalid_candidate",
        candidate_id: input.candidate_id,
        failures: [`Reconciliation candidate not found: ${input.candidate_id}`],
        recommended_next_step:
          "Stop. Select an existing accepted_for_future_recording candidate before recording.",
      }),
    };
  }

  const candidate = parseReconciliationCandidateRecordRow(candidateRow);
  if (candidate.status !== "accepted_for_future_recording") {
    return {
      failure: failureResult({
        result: "invalid_candidate",
        candidate_id: input.candidate_id,
        failures: [
          `Candidate ${candidate.candidate_id} is ${candidate.status}, not accepted_for_future_recording.`,
        ],
        recommended_next_step:
          "Stop. accepted_for_future_recording is necessary but not sufficient, and other candidate states cannot be recorded by this helper.",
      }),
    };
  }

  const crossCheckFailures = sourceCrossCheckFailures(candidate, input);
  if (crossCheckFailures.length > 0) {
    return {
      failure: failureResult({
        result: "source_cross_check_failed",
        candidate_id: input.candidate_id,
        failures: crossCheckFailures,
        recommended_next_step:
          "Stop. Supplied import/mapping/local target cross-checks must match the candidate-derived values.",
      }),
    };
  }

  const importedContextRow = selectImportedContextRow(db, candidate.import_id);
  const confirmedMappingRow = selectConfirmedMappingRow(db, candidate.mapping_id);
  if (!importedContextRow || !confirmedMappingRow) {
    return {
      failure: failureResult({
        result: "missing_source_rows",
        candidate_id: input.candidate_id,
        failures: [
          ...(!importedContextRow
            ? [`Imported context not found: ${candidate.import_id}`]
            : []),
          ...(!confirmedMappingRow
            ? [`Confirmed mapping not found: ${candidate.mapping_id}`]
            : []),
        ],
        recommended_next_step:
          "Stop. Candidate, imported context, and confirmed mapping rows must all exist at recording time.",
      }),
    };
  }

  const importedContext = parseImportedContextRecordRow(importedContextRow);
  const confirmedMapping = parseConfirmedMappingRecordRow(confirmedMappingRow);
  const sourceFailures = sourceRelationshipFailures({
    candidate,
    importedContext,
    confirmedMapping,
    input,
  });
  if (sourceFailures.length > 0) {
    return {
      failure: failureResult({
        result: "source_cross_check_failed",
        candidate_id: input.candidate_id,
        failures: sourceFailures,
        recommended_next_step:
          "Stop. Candidate, imported context, confirmed mapping, and local target identity must agree before recording.",
      }),
    };
  }

  const redactionFailures = [
    ...sourceRedactionFailures(candidate.redaction_status, "candidate.redaction_status"),
    ...sourceRedactionFailures(
      importedContext.redaction_report,
      "imported_context.redaction_report",
    ),
  ];
  if (redactionFailures.length > 0) {
    return {
      failure: failureResult({
        result: "unsafe_redaction",
        candidate_id: input.candidate_id,
        failures: redactionFailures,
        recommended_next_step:
          "Stop. Source redaction metadata must be safe before local evidence recording.",
      }),
    };
  }

  if (!localWorkExists(db, input.local_target_scope, input.local_target_work_id)) {
    return {
      failure: failureResult({
        result: "missing_source_rows",
        candidate_id: input.candidate_id,
        failures: [
          `Local target work not found: ${input.local_target_scope}/${input.local_target_work_id}.`,
        ],
        recommended_next_step:
          "Stop. The local work row must already exist; this helper must not create work items.",
      }),
    };
  }

  return { candidate, importedContext, confirmedMapping };
}

function sourceCrossCheckFailures(
  candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord,
  input: NormalizedInput,
) {
  const failures: string[] = [];
  if (input.import_id !== undefined && input.import_id !== candidate.import_id) {
    failures.push(
      `import_id mismatch: supplied ${input.import_id}, candidate has ${candidate.import_id}.`,
    );
  }
  if (input.mapping_id !== undefined && input.mapping_id !== candidate.mapping_id) {
    failures.push(
      `mapping_id mismatch: supplied ${input.mapping_id}, candidate has ${candidate.mapping_id}.`,
    );
  }
  if (input.local_target_scope !== candidate.local_target_scope) {
    failures.push(
      `local_target_scope mismatch: supplied ${input.local_target_scope}, candidate has ${candidate.local_target_scope}.`,
    );
  }
  if (input.local_target_work_id !== candidate.local_target_work_id) {
    failures.push(
      `local_target_work_id mismatch: supplied ${input.local_target_work_id}, candidate has ${candidate.local_target_work_id}.`,
    );
  }
  return failures;
}

function sourceRelationshipFailures({
  candidate,
  importedContext,
  confirmedMapping,
  input,
}: {
  candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
  importedContext: AgWorkResumeImportedContextRecord;
  confirmedMapping: AgWorkResumeConfirmedMappingRecord;
  input: NormalizedInput;
}) {
  const failures: string[] = [];
  if (importedContext.status !== "review_metadata") {
    failures.push(
      `Imported context ${importedContext.import_id} is ${importedContext.status}, not review_metadata.`,
    );
  }
  if (confirmedMapping.status !== "active") {
    failures.push(
      `Confirmed mapping ${confirmedMapping.mapping_id} is ${confirmedMapping.status}, not active.`,
    );
  }
  if (importedContext.import_id !== candidate.import_id) {
    failures.push("Imported context id does not match candidate import_id.");
  }
  if (importedContext.mapping_id !== candidate.mapping_id) {
    failures.push("Imported context mapping_id does not match candidate mapping_id.");
  }
  if (confirmedMapping.mapping_id !== candidate.mapping_id) {
    failures.push("Confirmed mapping id does not match candidate mapping_id.");
  }
  for (const [label, expected, actual] of [
    ["candidate/import local_scope", candidate.local_target_scope, importedContext.local_scope],
    ["candidate/import local_work_id", candidate.local_target_work_id, importedContext.local_work_id],
    ["candidate/mapping local_scope", candidate.local_target_scope, confirmedMapping.local_scope],
    ["candidate/mapping local_work_id", candidate.local_target_work_id, confirmedMapping.local_work_id],
    ["input/import local_scope", input.local_target_scope, importedContext.local_scope],
    ["input/import local_work_id", input.local_target_work_id, importedContext.local_work_id],
    ["input/mapping local_scope", input.local_target_scope, confirmedMapping.local_scope],
    ["input/mapping local_work_id", input.local_target_work_id, confirmedMapping.local_work_id],
  ] as const) {
    if (expected !== actual) {
      failures.push(`${label} mismatch: ${expected} != ${actual}.`);
    }
  }
  return failures;
}

function buildIdempotencyKey({
  candidate,
}: {
  candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
}) {
  return [
    "actual-proof-evidence-recording:v0_1",
    candidate.candidate_id,
    candidate.import_id,
    candidate.mapping_id,
    candidate.foreign_ref_type,
    candidate.foreign_ref_id,
    candidate.local_target_scope,
    candidate.local_target_work_id,
    TARGET_RECORD_KIND,
  ].join(":");
}

function validateApprovalPayload(
  input: NormalizedInput,
  source: {
    candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
    importedContext: AgWorkResumeImportedContextRecord;
    confirmedMapping: AgWorkResumeConfirmedMappingRecord;
  },
  idempotencyKey: string,
) {
  const approval = input.user_core_approval;
  const failures: string[] = [];
  for (const [field, expected, actual] of [
    ["approval_kind", APPROVAL_KIND, approval.approval_kind],
    ["approval_schema", APPROVAL_SCHEMA, approval.approval_schema],
    ["approved_candidate_id", source.candidate.candidate_id, approval.approved_candidate_id],
    ["approved_import_id", source.candidate.import_id, approval.approved_import_id],
    ["approved_mapping_id", source.candidate.mapping_id, approval.approved_mapping_id],
    [
      "approved_local_target_scope",
      source.candidate.local_target_scope,
      approval.approved_local_target_scope,
    ],
    [
      "approved_local_target_work_id",
      source.candidate.local_target_work_id,
      approval.approved_local_target_work_id,
    ],
    ["approved_target_record_kind", TARGET_RECORD_KIND, approval.approved_target_record_kind],
    ["approved_idempotency_key", idempotencyKey, approval.approved_idempotency_key],
    ["approved_actor", input.actor, approval.approved_actor],
    ["approved_reason", input.reason, approval.approved_reason],
    [
      "approved_trust_provenance_label",
      input.trust_provenance_label,
      approval.approved_trust_provenance_label,
    ],
  ] as const) {
    if (actual !== expected) {
      failures.push(`${field} mismatch: expected ${expected}, got ${actual}.`);
    }
  }
  if (
    stableStringify(approval.approved_redaction_summary) !==
    stableStringify(input.redaction_summary)
  ) {
    failures.push("approved_redaction_summary must exactly match redaction_summary.");
  }
  if (!sameStringArray(approval.approved_side_effects.insert_tables, ALLOWED_INSERT_TABLES)) {
    failures.push("approved_side_effects.insert_tables must exactly match the two allowed insert tables.");
  }
  if (
    !sameStringArray(
      approval.approved_side_effects.forbidden_tables,
      REQUIRED_FORBIDDEN_TABLES,
    )
  ) {
    failures.push("approved_side_effects.forbidden_tables must exactly match the protected source and authority tables.");
  }
  return failures;
}

function buildRecordingRows(
  input: NormalizedInput,
  source: {
    candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
    importedContext: AgWorkResumeImportedContextRecord;
    confirmedMapping: AgWorkResumeConfirmedMappingRecord;
  },
  idempotencyKey: string,
): RecordingRows {
  const hash = hashValue({ idempotency_key: idempotencyKey });
  const evidenceId = `evidence:ag-resume-recording:${hash}`;
  const recordingLinkId = `ag-resume-proof-evidence-recording-link:${hash}`;
  const metadata = buildEvidenceMetadata({
    input,
    source,
    idempotencyKey,
    evidenceId,
    recordingLinkId,
  });
  const provenance = buildProvenanceJson({
    input,
    source,
    idempotencyKey,
    evidenceId,
    recordingLinkId,
  });

  return {
    metadata,
    provenance,
    evidence: {
      evidence_id: evidenceId,
      scope: input.local_target_scope,
      work_id: input.local_target_work_id,
      publication_id: null,
      delivery_id: null,
      target_surface: "ag_work_resume",
      target_ref: `candidate:${source.candidate.candidate_id}`,
      evidence_kind: "check_passed",
      label: "AG Resume proof/evidence recording from reconciliation candidate",
      status: "passed",
      command: null,
      result_summary: `User/Core approved AG Resume reconciliation candidate ${source.candidate.candidate_id} for local verification evidence recording.`,
      skipped_reason: null,
      observed_behavior:
        "Bounded AG Resume reconciliation candidate metadata was recorded as local verification evidence. Foreign refs remain foreign.",
      source_surface: "ag_work_resume_proof_evidence_recording_writer_helper",
      source_ref: `candidate:${source.candidate.candidate_id}`,
      related_action_id: null,
      related_work_event_id: null,
      metadata: stableStringify(metadata),
      created_by: input.actor,
      created_at: input.created_at,
    },
    link: {
      recording_link_id: recordingLinkId,
      record_kind: RECORD_KIND,
      schema: RECORD_SCHEMA,
      candidate_id: source.candidate.candidate_id,
      import_id: source.candidate.import_id,
      mapping_id: source.candidate.mapping_id,
      local_target_scope: input.local_target_scope,
      local_target_work_id: input.local_target_work_id,
      target_record_kind: TARGET_RECORD_KIND,
      target_evidence_id: evidenceId,
      target_action_id: null,
      idempotency_key: idempotencyKey,
      actor: input.actor,
      reason: input.reason,
      redaction_summary: stableStringify(input.redaction_summary),
      trust_provenance_label: input.trust_provenance_label,
      provenance_json: stableStringify(provenance),
      recording_status: "recorded",
      failure_reason: null,
      created_at: input.created_at,
      updated_at: input.created_at,
    },
  };
}

function buildEvidenceMetadata({
  input,
  source,
  idempotencyKey,
  recordingLinkId,
}: {
  input: NormalizedInput;
  source: {
    candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
    importedContext: AgWorkResumeImportedContextRecord;
    confirmedMapping: AgWorkResumeConfirmedMappingRecord;
  };
  idempotencyKey: string;
  evidenceId: string;
  recordingLinkId: string;
}) {
  return {
    schema: "augnes.ag_work_resume.actual_proof_evidence_recording.metadata.v0_1",
    recording_kind: "ag_work_resume_candidate_to_verification_evidence",
    candidate_id: source.candidate.candidate_id,
    import_id: source.candidate.import_id,
    mapping_id: source.candidate.mapping_id,
    foreign_ref_type: source.candidate.foreign_ref_type,
    foreign_ref_id: source.candidate.foreign_ref_id,
    local_target_scope: input.local_target_scope,
    local_target_work_id: input.local_target_work_id,
    target_record_kind: TARGET_RECORD_KIND,
    idempotency_key: idempotencyKey,
    recording_link_id: recordingLinkId,
    actor: input.actor,
    reason: input.reason,
    redaction_summary: input.redaction_summary,
    trust_provenance_label: input.trust_provenance_label,
    source_material_policy: "bounded_foreign_summary_only",
    source_runtime_instance_id: source.importedContext.source_runtime_instance_id,
    packet_id: source.importedContext.packet_id,
    packet_hash: source.importedContext.packet_hash,
    confirmed_mapping_status: source.confirmedMapping.status,
    accepted_for_future_recording_is_recording: false,
    bridge_table_is_recording_by_itself: false,
    action_records_created: false,
    session_binding_created: false,
    codex_continuation_started: false,
  };
}

function buildProvenanceJson({
  input,
  source,
  idempotencyKey,
  evidenceId,
}: {
  input: NormalizedInput;
  source: {
    candidate: AgWorkResumeProofEvidenceReconciliationCandidateRecord;
    importedContext: AgWorkResumeImportedContextRecord;
    confirmedMapping: AgWorkResumeConfirmedMappingRecord;
  };
  idempotencyKey: string;
  evidenceId: string;
  recordingLinkId: string;
}) {
  return {
    schema: "augnes.ag_work_resume.proof_evidence_recording.provenance.v0_1",
    source: {
      candidate_id: source.candidate.candidate_id,
      import_id: source.candidate.import_id,
      mapping_id: source.candidate.mapping_id,
      foreign_ref_type: source.candidate.foreign_ref_type,
      foreign_ref_id: source.candidate.foreign_ref_id,
      source_runtime_instance_id: source.importedContext.source_runtime_instance_id,
      packet_id: source.importedContext.packet_id,
      packet_hash: source.importedContext.packet_hash,
      confirmed_mapping_status: source.confirmedMapping.status,
    },
    target: {
      local_target_scope: input.local_target_scope,
      local_target_work_id: input.local_target_work_id,
      target_record_kind: TARGET_RECORD_KIND,
      target_evidence_id: evidenceId,
      target_action_id: null,
    },
    approval: {
      actor: input.actor,
      reason: input.reason,
      approved_idempotency_key: idempotencyKey,
    },
    redaction: {
      summary: input.redaction_summary,
      raw_foreign_payload_copied: false,
    },
    trust: {
      trust_provenance_label: input.trust_provenance_label,
      foreign_refs_remain_foreign: true,
    },
    side_effects: {
      allowed_insert_tables: [...ALLOWED_INSERT_TABLES],
      action_records_created: false,
      session_binding_created: false,
      work_item_event_created: false,
      candidate_mutated: false,
      imported_context_mutated: false,
      confirmed_mapping_mutated: false,
      proposal_mutated: false,
    },
  };
}

function existingLinkResult({
  db,
  existingByKey,
  rows,
  normalized,
}: {
  db: Database.Database;
  existingByKey: Record<string, unknown>;
  rows: RecordingRows;
  normalized: NormalizedInput;
}) {
  const evidenceRow = selectEvidenceRow(
    db,
    stringField(existingByKey.target_evidence_id),
  );
  if (
    !evidenceRow ||
    !recordingLinkMatches(existingByKey, rows.link) ||
    !verificationEvidenceRecordMatches(evidenceRow, rows.evidence)
  ) {
    return failureResult({
      result: "duplicate_conflict",
      candidate_id: normalized.candidate_id,
      idempotency_key: rows.link.idempotency_key,
      failures: [
        "An existing idempotency key was found with different payload or missing evidence linkage.",
      ],
      recommended_next_step:
        "Stop. Same idempotency key with different payload must not create or reuse recording rows.",
    });
  }

  return {
    ok: true,
    result: "idempotent_no_new_write" as const,
    created: false,
    candidate_id: normalized.candidate_id,
    evidence_id: rows.evidence.evidence_id,
    recording_link_id: rows.link.recording_link_id,
    idempotency_key: rows.link.idempotency_key,
    target_record_kind: TARGET_RECORD_KIND,
    warnings: [],
    failures: [],
    authority_boundary: buildAuthorityBoundary({
      evidenceCreated: false,
      bridgeCreated: false,
    }),
    recommended_next_step:
      "No new rows were created. Existing evidence and bridge rows already match this exact approved recording attempt.",
  };
}

function verificationEvidenceRecordMatches(
  row: Record<string, unknown>,
  expected: VerificationEvidenceRecordInsertRow,
) {
  return (
    stringField(row.evidence_id) === expected.evidence_id &&
    stringField(row.scope) === expected.scope &&
    stringField(row.work_id) === expected.work_id &&
    nullableStringField(row.publication_id) === null &&
    nullableStringField(row.delivery_id) === null &&
    stringField(row.target_surface) === expected.target_surface &&
    stringField(row.target_ref) === expected.target_ref &&
    stringField(row.evidence_kind) === expected.evidence_kind &&
    stringField(row.label) === expected.label &&
    stringField(row.status) === expected.status &&
    nullableStringField(row.command) === null &&
    stringField(row.result_summary) === expected.result_summary &&
    nullableStringField(row.skipped_reason) === null &&
    stringField(row.observed_behavior) === expected.observed_behavior &&
    stringField(row.source_surface) === expected.source_surface &&
    stringField(row.source_ref) === expected.source_ref &&
    nullableStringField(row.related_action_id) === null &&
    nullableStringField(row.related_work_event_id) === null &&
    stableStringify(parseJsonObjectField(row.metadata)) === expected.metadata &&
    stringField(row.created_by) === expected.created_by
  );
}

function recordingLinkMatches(
  row: Record<string, unknown>,
  expected: RecordingLinkInsertRow,
) {
  return (
    stringField(row.recording_link_id) === expected.recording_link_id &&
    stringField(row.record_kind) === expected.record_kind &&
    stringField(row.schema) === expected.schema &&
    stringField(row.candidate_id) === expected.candidate_id &&
    stringField(row.import_id) === expected.import_id &&
    stringField(row.mapping_id) === expected.mapping_id &&
    stringField(row.local_target_scope) === expected.local_target_scope &&
    stringField(row.local_target_work_id) === expected.local_target_work_id &&
    stringField(row.target_record_kind) === expected.target_record_kind &&
    stringField(row.target_evidence_id) === expected.target_evidence_id &&
    nullableStringField(row.target_action_id) === null &&
    stringField(row.idempotency_key) === expected.idempotency_key &&
    stringField(row.actor) === expected.actor &&
    stringField(row.reason) === expected.reason &&
    stableStringify(parseJsonObjectField(row.redaction_summary)) ===
      expected.redaction_summary &&
    stringField(row.trust_provenance_label) === expected.trust_provenance_label &&
    stableStringify(parseJsonObjectField(row.provenance_json)) ===
      expected.provenance_json &&
    stringField(row.recording_status) === expected.recording_status &&
    nullableStringField(row.failure_reason) === null
  );
}

function insertVerificationEvidenceRecord(
  db: Database.Database,
  row: VerificationEvidenceRecordInsertRow,
) {
  db.prepare(
    `
      INSERT INTO verification_evidence_records (
        evidence_id,
        scope,
        work_id,
        publication_id,
        delivery_id,
        target_surface,
        target_ref,
        evidence_kind,
        label,
        status,
        command,
        result_summary,
        skipped_reason,
        observed_behavior,
        source_surface,
        source_ref,
        related_action_id,
        related_work_event_id,
        metadata,
        created_by,
        created_at
      )
      VALUES (
        @evidence_id,
        @scope,
        @work_id,
        @publication_id,
        @delivery_id,
        @target_surface,
        @target_ref,
        @evidence_kind,
        @label,
        @status,
        @command,
        @result_summary,
        @skipped_reason,
        @observed_behavior,
        @source_surface,
        @source_ref,
        @related_action_id,
        @related_work_event_id,
        @metadata,
        @created_by,
        @created_at
      )
    `,
  ).run(row);
}

function insertRecordingLink(db: Database.Database, row: RecordingLinkInsertRow) {
  db.prepare(
    `
      INSERT INTO ag_work_resume_proof_evidence_recording_links (
        recording_link_id,
        record_kind,
        schema,
        candidate_id,
        import_id,
        mapping_id,
        local_target_scope,
        local_target_work_id,
        target_record_kind,
        target_evidence_id,
        target_action_id,
        idempotency_key,
        actor,
        reason,
        redaction_summary,
        trust_provenance_label,
        provenance_json,
        recording_status,
        failure_reason,
        created_at,
        updated_at
      )
      VALUES (
        @recording_link_id,
        @record_kind,
        @schema,
        @candidate_id,
        @import_id,
        @mapping_id,
        @local_target_scope,
        @local_target_work_id,
        @target_record_kind,
        @target_evidence_id,
        @target_action_id,
        @idempotency_key,
        @actor,
        @reason,
        @redaction_summary,
        @trust_provenance_label,
        @provenance_json,
        @recording_status,
        @failure_reason,
        @created_at,
        @updated_at
      )
    `,
  ).run(row);
}

function selectCandidateRow(db: Database.Database, candidateId: string) {
  return db
    .prepare(
      "SELECT * FROM ag_work_resume_proof_evidence_reconciliation_candidates WHERE candidate_id = ?",
    )
    .get(candidateId) as Record<string, unknown> | undefined;
}

function selectImportedContextRow(db: Database.Database, importId: string) {
  return db
    .prepare("SELECT * FROM ag_work_resume_imported_contexts WHERE import_id = ?")
    .get(importId) as Record<string, unknown> | undefined;
}

function selectConfirmedMappingRow(db: Database.Database, mappingId: string) {
  return db
    .prepare("SELECT * FROM ag_work_resume_confirmed_mappings WHERE mapping_id = ?")
    .get(mappingId) as Record<string, unknown> | undefined;
}

function selectEvidenceRow(db: Database.Database, evidenceId: string) {
  return db
    .prepare("SELECT * FROM verification_evidence_records WHERE evidence_id = ?")
    .get(evidenceId) as Record<string, unknown> | undefined;
}

function selectRecordingLinkByIdempotencyKey(
  db: Database.Database,
  idempotencyKey: string,
) {
  return db
    .prepare(
      "SELECT * FROM ag_work_resume_proof_evidence_recording_links WHERE idempotency_key = ?",
    )
    .get(idempotencyKey) as Record<string, unknown> | undefined;
}

function selectRecordingLinkByCandidateId(
  db: Database.Database,
  candidateId: string,
) {
  return db
    .prepare(
      "SELECT * FROM ag_work_resume_proof_evidence_recording_links WHERE candidate_id = ?",
    )
    .get(candidateId) as Record<string, unknown> | undefined;
}

function localWorkExists(db: Database.Database, scope: string, workId: string) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM work_items WHERE scope = ? AND work_id = ?")
      .get(scope, workId),
  );
}

function normalizeApprovalPayload(
  value: unknown,
): { value: UserCoreApprovalPayload } | { error: string } {
  if (!isRecord(value)) {
    return { error: "user_core_approval must be a JSON object." };
  }
  if (!isRecord(value.approved_side_effects)) {
    return { error: "user_core_approval.approved_side_effects must be a JSON object." };
  }
  if (!Array.isArray(value.approved_side_effects.insert_tables)) {
    return {
      error: "user_core_approval.approved_side_effects.insert_tables must be an array.",
    };
  }
  if (!Array.isArray(value.approved_side_effects.forbidden_tables)) {
    return {
      error:
        "user_core_approval.approved_side_effects.forbidden_tables must be an array.",
    };
  }
  if (!isRecord(value.approved_redaction_summary)) {
    return {
      error: "user_core_approval.approved_redaction_summary must be a JSON object.",
    };
  }
  return {
    value: {
      approval_kind: stringField(value.approval_kind) as UserCoreApprovalPayload["approval_kind"],
      approval_schema: stringField(
        value.approval_schema,
      ) as UserCoreApprovalPayload["approval_schema"],
      approved_candidate_id: stringField(value.approved_candidate_id),
      approved_import_id: stringField(value.approved_import_id),
      approved_mapping_id: stringField(value.approved_mapping_id),
      approved_local_target_scope: stringField(value.approved_local_target_scope),
      approved_local_target_work_id: stringField(value.approved_local_target_work_id),
      approved_target_record_kind: stringField(
        value.approved_target_record_kind,
      ) as UserCoreApprovalPayload["approved_target_record_kind"],
      approved_idempotency_key: stringField(value.approved_idempotency_key),
      approved_actor: stringField(value.approved_actor),
      approved_reason: stringField(value.approved_reason),
      approved_redaction_summary: value.approved_redaction_summary,
      approved_trust_provenance_label: stringField(
        value.approved_trust_provenance_label,
      ) as UserCoreApprovalPayload["approved_trust_provenance_label"],
      approved_side_effects: {
        insert_tables: value.approved_side_effects.insert_tables.map(stringField),
        forbidden_tables:
          value.approved_side_effects.forbidden_tables.map(stringField),
      },
    },
  };
}

function normalizeRedactionSummary(
  value: unknown,
): { value: Record<string, unknown> } | { error: string } {
  if (!isRecord(value)) {
    return { error: "redaction_summary must be a JSON object." };
  }
  if (value.safe !== true) {
    return { error: "redaction_summary.safe must be true." };
  }
  for (const field of REDACTION_FALSE_FIELDS) {
    if (value[field] !== false) {
      return { error: `redaction_summary.${field} must be false.` };
    }
  }
  if (containsUnsafeRedactionText(value)) {
    return {
      error:
        "redaction_summary must not include raw secrets, raw DB paths, tokens, keys, cookies, private paths, or raw session/proof/evidence payloads.",
    };
  }
  if (stableStringify(value).length > MAX_JSON_TEXT_LENGTH) {
    return { error: "redaction_summary must be a bounded JSON object." };
  }
  return { value };
}

function sourceRedactionFailures(value: Record<string, unknown>, label: string) {
  const failures: string[] = [];
  if (value.safe !== true) failures.push(`${label}.safe must be true.`);
  for (const field of REDACTION_FALSE_FIELDS) {
    if (value[field] === true) failures.push(`${label}.${field} must not be true.`);
  }
  if (containsUnsafeRedactionText(value)) {
    failures.push(`${label} contains unsafe raw/private payload markers.`);
  }
  return failures;
}

function containsUnsafeRedactionText(value: Record<string, unknown>) {
  const text = collectStringValues(value).join("\n").toLowerCase();
  return [
    "sk-",
    "begin private key",
    "cookie=",
    "authorization:",
    "/users/",
    "raw_session_payload",
    "raw_proof_payload",
    "raw_evidence_payload",
  ].some((token) => text.includes(token));
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (isRecord(value)) return Object.values(value).flatMap(collectStringValues);
  return [];
}

function normalizeOptionalTimestamp(
  value: unknown,
  field: string,
): { value: string | undefined } | { error: string } {
  if (value === undefined || value === null) return { value: undefined };
  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: `${field} must be an ISO UTC timestamp.` };
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

function normalizeOptionalString(
  value: unknown,
  field: string,
): { value: string | undefined } | { error: string } {
  if (value === undefined || value === null) return { value: undefined };
  const cleaned = cleanString(value);
  if (!cleaned) return { error: `${field} must be omitted or a non-empty string.` };
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

function failureResult({
  result,
  candidate_id = null,
  evidence_id = null,
  recording_link_id = null,
  idempotency_key = null,
  failures,
  warnings = [],
  recommended_next_step,
}: {
  result: Exclude<
    AgWorkResumeProofEvidenceRecordingResultName,
    "recorded" | "idempotent_no_new_write"
  >;
  candidate_id?: string | null;
  evidence_id?: null;
  recording_link_id?: null;
  idempotency_key?: string | null;
  failures: string[];
  warnings?: string[];
  recommended_next_step: string;
}): AgWorkResumeProofEvidenceRecordingResult {
  return {
    ok: false,
    result,
    created: false,
    candidate_id,
    evidence_id,
    recording_link_id,
    idempotency_key,
    target_record_kind: null,
    warnings,
    failures,
    authority_boundary: buildAuthorityBoundary({
      evidenceCreated: false,
      bridgeCreated: false,
    }),
    recommended_next_step,
  };
}

function buildAuthorityBoundary({
  evidenceCreated,
  bridgeCreated,
}: {
  evidenceCreated: boolean;
  bridgeCreated: boolean;
}): AgWorkResumeProofEvidenceRecordingAuthorityBoundary {
  return {
    exact_user_core_approval_required: true,
    verification_evidence_record_created: evidenceCreated,
    bridge_link_created: bridgeCreated,
    proof_recorded: false,
    action_record_created: false,
    route_added: false,
    ui_added: false,
    session_bound: false,
    codex_executed: false,
    codex_continued: false,
    work_item_created: false,
    work_event_created: false,
    imported_context_mutated: false,
    confirmed_mapping_mutated: false,
    proposal_record_mutated: false,
    reconciliation_candidate_mutated: false,
    approval_granted: false,
    publish_retry_replay_authority: false,
    merge_authority: false,
    auto_merge_authority: false,
    external_posting_authority: false,
    committed_state_mutated: false,
    allowed_insert_tables: ALLOWED_INSERT_TABLES,
    statement: AUTHORITY_STATEMENT,
  };
}

function isInferredActor(actor: string) {
  const normalized = actor.toLowerCase();
  return FORBIDDEN_ACTOR_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}:`),
  );
}

function sameStringArray(actual: string[], expected: readonly string[]) {
  return stableStringify(actual) === stableStringify([...expected]);
}

function hashValue(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 24);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function parseJsonObjectField(value: unknown) {
  try {
    const parsed = JSON.parse(stringField(value));
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function nullableStringField(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isConstraintError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /constraint|unique|foreign key|primary/i.test(error.message);
}
