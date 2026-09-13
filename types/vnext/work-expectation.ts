import type { ExternalRefV01 } from "./external-ref";
import type { CriterionAssessmentBasisV01, CriterionAssessmentStatusV01 } from "./criterion-assessment";

export const WORK_EXPECTATION_VERSION = "work_expectation_record.v0.1" as const;
export const WORK_EXPECTATION_RULE = "exact_criterion_or_operator_report.v0.1" as const;
export const WORK_EXPECTATION_LIMIT = 32;

interface ExpectationEnvelope {
  version: typeof WORK_EXPECTATION_VERSION;
  record_id: string;
  workspace_id: string;
  project_id: string;
  recorded_at: string;
  packet_ref: ExternalRefV01;
  integrity: { fingerprint: string };
}

/** Non-authoritative history in the existing immutable project ledger. */
export interface WorkExpectation extends ExpectationEnvelope {
  kind: "expectation";
  previous_ref: ExternalRefV01 | null;
  revision: number;
  criterion_id: string;
  criterion: string;
  predicted_outcome: "satisfied" | "unsatisfied";
  reason: string;
  conditions: string;
  observation_window: "first_upcoming_interactive_attempt_of_exact_packet";
  outcome_rule: typeof WORK_EXPECTATION_RULE;
  author: { operator_id: string; session_id: string; provenance: "operator_authored" };
  information_cutoff: string;
  source_refs: (ExternalRefV01 | string | null)[];
  source_currentness: "recorded_packet_snapshot_only_external_currentness_unknown";
  exposure: "operator_ui_only_no_automatic_worker_delivery_attention_and_copying_unknown";
}

export interface WorkExpectationAttempt extends ExpectationEnvelope {
  kind: "attempt_binding";
  expectation_ref: ExternalRefV01;
  run_id: string;
  run_created_at: string;
  chronology: "same_transaction_as_first_local_interactive_run";
}

export interface WorkOutcomeReport extends ExpectationEnvelope {
  kind: "outcome_report";
  expectation_ref: ExternalRefV01;
  attempt_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
  previous_ref: ExternalRefV01 | null;
  revision: number;
  outcome: CriterionAssessmentStatusV01;
  observation: string;
  applicability: "applied" | "not_established";
  author: { operator_id: string; session_id: string; provenance: "operator_attested" };
}

export type WorkExpectationRecord = WorkExpectation | WorkExpectationAttempt | WorkOutcomeReport;

export interface WorkExpectationComparison {
  expectation: WorkExpectation;
  history: WorkExpectation[];
  attempt: WorkExpectationAttempt | null;
  reports: WorkOutcomeReport[];
  run_disposition: string;
  eligibility: "eligible" | "local_chronology_unavailable" | "not_observed";
  comparison: "match" | "mismatch" | "unknown" | "unassessed";
  actual_outcome: CriterionAssessmentStatusV01;
  outcome_source: "criterion_assessment" | "operator_report" | "unassessed";
  basis: CriterionAssessmentBasisV01;
  uncertainty: string[];
  supporting_refs: ExternalRefV01[];
  report_allowed: boolean;
  packet_href: string;
  result_href: string | null;
}
