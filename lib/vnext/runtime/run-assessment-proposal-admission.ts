import type Database from "better-sqlite3";

import {
  appendAutonomyRunLedgerEvent,
  buildAutonomyRunEventRecord,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
} from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { admitEpisodeDeltaProposalV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import { readProjectRunResultSourceBindingV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

export const RUN_ASSESSMENT_PROPOSAL_ADMISSION_SERVICE_VERSION_V01 =
  "run_assessment_proposal_admission_service.v0.1" as const;

export class RunAssessmentProposalAdmissionErrorV01 extends Error {
  constructor(
    readonly code: string,
    readonly status = 409,
  ) {
    super(code);
    this.name = "RunAssessmentProposalAdmissionErrorV01";
  }
}

export interface RunAssessmentProposalAdmissionResultV01 {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
  idempotency_key: string;
}

export interface RunAssessmentProposalAdmissionDependenciesV01 {
  admit_proposal?: typeof admitEpisodeDeltaProposalV01;
  record_failure?: (
    db: Database.Database,
    input: RunAssessmentProposalSettlementInputV01,
    errorCode: string,
    retryable: boolean,
  ) => void;
}

export interface RunAssessmentProposalSettlementInputV01 {
  workspace_id: string;
  project_id: string;
  receipt: RunReceiptV01;
}

export type RunAssessmentProposalSettlementV01 =
  | {
      status: "available";
      admission_status: "inserted" | "exact_replay";
      proposal: EpisodeDeltaProposalV01;
      idempotency_key: string;
    }
  | {
      status: "failed";
      error_code: string;
      retryable: boolean;
      failure_recorded: boolean;
      failure_recording_error_code: string | null;
    };

const RETRYABLE_PROPOSAL_ADMISSION_ERROR_CODES_V01 = new Set([
  "run_assessment_proposal_store_busy",
  "run_assessment_proposal_transient_writer_failure",
]);

/**
 * Production R6-B service. The exact R6-A result binding remains the source
 * authority; this service materializes and admits one proposal in a separate
 * transaction after immutable receipt admission.
 */
export function admitRunAssessmentProposalV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    receipt_id: string;
  },
  dependencies: RunAssessmentProposalAdmissionDependenciesV01 = {},
): RunAssessmentProposalAdmissionResultV01 {
  if (db.inTransaction) {
    refuseV01("run_assessment_proposal_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const binding = readProjectRunResultSourceBindingV01(db, input);
    if (!binding.packet) {
      refuseV01("run_assessment_proposal_packet_missing", 422);
    }
    if (binding.criterion_assessment.status !== "available") {
      refuseV01(
        binding.criterion_assessment.reason === "unsupported_protocol"
          ? "run_assessment_proposal_protocol_unsupported"
          : "run_assessment_proposal_assessment_unavailable",
        422,
      );
    }
    if (
      !binding.run ||
      !isTerminalRunnerStatus(binding.run.status) ||
      binding.run.scope !== input.project_id
    ) {
      refuseV01("run_assessment_proposal_terminal_run_missing", 409);
    }
    const material = materializeRunAssessmentProposalV01({
      packet: binding.packet,
      receipt: binding.receipt,
      assessment: binding.criterion_assessment.assessment,
    });
    const write = (dependencies.admit_proposal ?? admitEpisodeDeltaProposalV01)(
      db,
      {
        expected: material,
        source: {
          packet: binding.packet,
          receipt: binding.receipt,
          assessment: binding.criterion_assessment.assessment,
        },
      },
    );
    updateAutonomyRunLedgerFields(
      binding.run.run_id,
      {
        status:
          binding.run.metadata.bounded_automation_cycle_id != null
            ? "needs_review"
            : binding.run.status,
        stop_reason:
          binding.run.metadata.bounded_automation_cycle_id != null
            ? "review_needed"
            : binding.run.stop_reason,
        metadata: {
          ...binding.run.metadata,
          run_assessment_proposal_status: "available",
          run_assessment_proposal_id: write.proposal.proposal_id,
          run_assessment_proposal_fingerprint:
            write.proposal.integrity.fingerprint,
          run_assessment_proposal_idempotency_key:
            material.identity.idempotency_key,
          run_assessment_proposal_error_code: null,
          run_assessment_proposal_retry_required: false,
          run_assessment_proposal_admission_version:
            RUN_ASSESSMENT_PROPOSAL_ADMISSION_SERVICE_VERSION_V01,
          review_decision_created: false,
          semantic_transition_created: false,
          semantic_state_changed: false,
        },
      },
      { db },
    );
    if (binding.run.metadata.bounded_automation_cycle_id != null) {
      appendAutonomyRunLedgerEvent(
        buildAutonomyRunEventRecord({
          run_id: binding.run.run_id,
          event_type: "run_needs_review",
          status: "needs_review",
          message:
            "The bounded policy-triggered cycle stopped after one pending proposal became reviewable.",
          payload: {
            stop_reason: "review_needed",
            proposal_id: write.proposal.proposal_id,
            automatic_retry: false,
            semantic_state_changed: false,
          },
          created_at: binding.receipt.recorded_at,
        }),
        { db },
      );
    }
    db.exec("COMMIT");
    return {
      status: write.status,
      proposal: write.proposal,
      idempotency_key: material.identity.idempotency_key,
    };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (error instanceof RunAssessmentProposalAdmissionErrorV01) throw error;
    throw new RunAssessmentProposalAdmissionErrorV01(
      errorCodeV01(error),
      409,
    );
  }
}

/**
 * Terminal producer settlement. Failure is operationally visible but cannot
 * rewrite the immutable receipt or turn a completed execution into failure.
 */
export function settleRunAssessmentProposalV01(
  db: Database.Database,
  input: RunAssessmentProposalSettlementInputV01,
  dependencies: RunAssessmentProposalAdmissionDependenciesV01 = {},
): RunAssessmentProposalSettlementV01 {
  try {
    const priorFailure = readNonRetryablePriorFailureV01(db, input);
    if (priorFailure) return priorFailure;
    const admitted = admitRunAssessmentProposalV01(
      db,
      {
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        receipt_id: input.receipt.receipt_id,
      },
      dependencies,
    );
    return {
      status: "available",
      admission_status: admitted.status,
      proposal: admitted.proposal,
      idempotency_key: admitted.idempotency_key,
    };
  } catch (error) {
    const failure = classifyRunAssessmentProposalAdmissionErrorV01(error);
    let failureRecorded = false;
    let failureRecordingErrorCode: string | null = null;
    try {
      (dependencies.record_failure ?? recordProposalFailureV01)(
        db,
        input,
        failure.error_code,
        failure.retryable,
      );
      failureRecorded = true;
    } catch (recordingError) {
      try {
        if (db.inTransaction) db.exec("ROLLBACK");
      } catch {
        // The original proposal error remains the settlement authority.
      }
      failureRecordingErrorCode = errorCodeV01(recordingError);
    }
    return {
      status: "failed",
      error_code: failure.error_code,
      retryable: failure.retryable,
      failure_recorded: failureRecorded,
      failure_recording_error_code: failureRecordingErrorCode,
    };
  }
}

function recordProposalFailureV01(
  db: Database.Database,
  input: RunAssessmentProposalSettlementInputV01,
  errorCode: string,
  retryable: boolean,
): void {
  if (db.inTransaction) {
    refuseV01("run_assessment_proposal_failure_nested_transaction", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const run = readAutonomyRunLedgerRecord(input.receipt.run_id, { db });
    if (
      !run ||
      run.scope !== input.project_id ||
      run.metadata.workspace_id !== input.workspace_id ||
      run.metadata.project_id !== input.project_id ||
      run.metadata.run_receipt_id !== input.receipt.receipt_id ||
      run.metadata.run_receipt_fingerprint !==
        input.receipt.integrity.fingerprint ||
      !isTerminalRunnerStatus(run.status)
    ) {
      refuseV01("run_assessment_proposal_failure_binding_conflict", 409);
    }
    updateAutonomyRunLedgerFields(
      run.run_id,
      {
        metadata: {
          ...run.metadata,
          run_assessment_proposal_status: "failed",
          run_assessment_proposal_id: null,
          run_assessment_proposal_fingerprint: null,
          run_assessment_proposal_idempotency_key: null,
          run_assessment_proposal_error_code: errorCode,
          run_assessment_proposal_retry_required: retryable,
          run_assessment_proposal_admission_version:
            RUN_ASSESSMENT_PROPOSAL_ADMISSION_SERVICE_VERSION_V01,
          review_decision_created: false,
          semantic_transition_created: false,
          semantic_state_changed: false,
        },
      },
      { db },
    );
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function classifyRunAssessmentProposalAdmissionErrorV01(
  error: unknown,
): { error_code: string; retryable: boolean } {
  const errorCode = errorCodeV01(error);
  return {
    error_code: errorCode,
    retryable: RETRYABLE_PROPOSAL_ADMISSION_ERROR_CODES_V01.has(errorCode),
  };
}

function readNonRetryablePriorFailureV01(
  db: Database.Database,
  input: RunAssessmentProposalSettlementInputV01,
): Extract<RunAssessmentProposalSettlementV01, { status: "failed" }> | null {
  const run = readAutonomyRunLedgerRecord(input.receipt.run_id, { db });
  if (
    !run ||
    run.scope !== input.project_id ||
    run.metadata.workspace_id !== input.workspace_id ||
    run.metadata.project_id !== input.project_id ||
    run.metadata.run_receipt_id !== input.receipt.receipt_id ||
    run.metadata.run_receipt_fingerprint !==
      input.receipt.integrity.fingerprint ||
    run.metadata.run_assessment_proposal_status !== "failed" ||
    run.metadata.run_assessment_proposal_retry_required === true
  ) {
    return null;
  }
  return {
    status: "failed",
    error_code:
      typeof run.metadata.run_assessment_proposal_error_code === "string"
        ? run.metadata.run_assessment_proposal_error_code
        : "run_assessment_proposal_admission_failed",
    retryable: false,
    failure_recorded: true,
    failure_recording_error_code: null,
  };
}

function errorCodeV01(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : null;
  if (typeof code === "string") {
    if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED") {
      return "run_assessment_proposal_store_busy";
    }
    const stableCode = code.split(":", 1)[0] ?? "";
    if (/^[a-z0-9_,-]{1,96}$/u.test(stableCode)) return stableCode;
  }
  if (
    error instanceof Error &&
    /^[a-z0-9_,-]{1,96}$/u.test(error.message)
  ) {
    return error.message;
  }
  return "run_assessment_proposal_admission_failed";
}

function refuseV01(code: string, status: number): never {
  throw new RunAssessmentProposalAdmissionErrorV01(code, status);
}
