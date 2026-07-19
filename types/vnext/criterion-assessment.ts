import type { ExternalRefV01 } from "./external-ref";
import type { RunReceiptCapabilityCoverageEntryV01 } from "./run-receipt";

export const CRITERION_ASSESSMENT_VERSION_V01 =
  "criterion_assessment.v0.1" as const;

export const CRITERION_ASSESSMENT_STATUSES_V01 = [
  "satisfied",
  "unsatisfied",
  "unknown",
  "not_applicable",
] as const;

export const CRITERION_ASSESSMENT_BASES_V01 = [
  "observed",
  "attested",
  "mixed",
  "insufficient",
] as const;

export type CriterionAssessmentStatusV01 =
  (typeof CRITERION_ASSESSMENT_STATUSES_V01)[number];

export type CriterionAssessmentBasisV01 =
  (typeof CRITERION_ASSESSMENT_BASES_V01)[number];

export interface CriterionAssessmentTrustV01 {
  direct_local_observation: number;
  verified_external_observation: number;
  host_attestation: number;
  provider_report: number;
  user_declaration: number;
  imported_unverified: number;
  derived_interpretation: number;
}

export interface CriterionAssessmentItemV01 {
  criterion_id: string;
  criterion: string;
  status: CriterionAssessmentStatusV01;
  basis: CriterionAssessmentBasisV01;
  supporting_refs: ExternalRefV01[];
  opposing_refs: ExternalRefV01[];
  missing_refs: ExternalRefV01[];
  trust: CriterionAssessmentTrustV01;
  operation_coverage: RunReceiptCapabilityCoverageEntryV01[];
  uncertainty: string[];
}

export interface CriterionAssessmentSummaryV01 {
  satisfied: number;
  unsatisfied: number;
  unknown: number;
  not_applicable: number;
}

export interface CriterionAssessmentAuthorityV01 {
  authoritative: false;
  creates_evidence: false;
  validates_claims: false;
  creates_proposal: false;
  creates_decision: false;
  applies_transition: false;
  changes_semantic_state: false;
  changes_later_context: false;
}

export interface CriterionAssessmentV01 {
  assessment_version: typeof CRITERION_ASSESSMENT_VERSION_V01;
  workspace_id: string;
  project_id: string;
  packet_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
  run_id: string;
  criteria: CriterionAssessmentItemV01[];
  summary: CriterionAssessmentSummaryV01;
  assessment_fingerprint: string;
  authority: CriterionAssessmentAuthorityV01;
}

export type CriterionAssessmentUnavailableReasonV01 =
  | "packet_missing"
  | "unsupported_protocol";

export type CriterionAssessmentReadbackV01 =
  | {
      status: "available";
      assessment: CriterionAssessmentV01;
      criterion_specific_relations_available: boolean;
      task_success_status: CriterionAssessmentStatusV01;
      source_validation: "recomputed_from_packet_and_receipt";
    }
  | {
      status: "unavailable";
      reason: CriterionAssessmentUnavailableReasonV01;
    };

export interface CriterionAssessmentValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface CriterionAssessmentValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version:
    | typeof CRITERION_ASSESSMENT_VERSION_V01
    | null;
  errors: CriterionAssessmentValidationIssueV01[];
  warnings: CriterionAssessmentValidationIssueV01[];
}
