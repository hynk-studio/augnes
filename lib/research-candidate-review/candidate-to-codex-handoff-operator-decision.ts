import type {
  CandidateToCodexHandoffOperatorDecisionAuthorityBoundary,
  CandidateToCodexHandoffOperatorDecisionId,
  CandidateToCodexHandoffOperatorDecisionInput,
  CandidateToCodexHandoffOperatorDecisionLineage,
  CandidateToCodexHandoffOperatorDecisionOption,
  CandidateToCodexHandoffOperatorDecisionPreview,
  CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement,
  CandidateToCodexHandoffOperatorDecisionValidationResult,
} from "@/types/candidate-to-codex-handoff-operator-decision";
import type { CandidateToCodexHandoffDraftReview } from "@/types/candidate-to-codex-handoff-draft-review";

type JsonRecord = Record<string, unknown>;

const decisionPreviewVersion = "candidate_to_codex_handoff_operator_decision.v0.1";
const decisionStatus =
  "operator_decision_required_before_any_codex_or_github_execution";
const recommendationStatus = "ready_for_feedback_event_store_minimal_v0_1";
const nextRecommendedSlice = "feedback_event_store_minimal_v0_1";

export function buildCandidateToCodexHandoffOperatorDecisionPreview(
  input: CandidateToCodexHandoffOperatorDecisionInput,
): CandidateToCodexHandoffOperatorDecisionPreview {
  const review = input.handoffDraftReview;
  const sourceReviewRef = `${review.review_version}:${review.review_fingerprint}`;
  const lineage = buildLineage(review, sourceReviewRef);
  const preview: CandidateToCodexHandoffOperatorDecisionPreview = {
    decision_preview_kind:
      "candidate_to_codex_handoff_operator_decision_preview",
    decision_preview_version: decisionPreviewVersion,
    scope: input.scope ?? review.scope,
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1",
    source_handoff_draft_review_ref: sourceReviewRef,
    source_handoff_draft_review_fingerprint: review.review_fingerprint,
    decision_preview_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    operator_decision_required: true,
    operator_decision_satisfied_now: false,
    operator_decision_status: decisionStatus,
    operator_decision: null,
    operator_note: null,
    decision_options: buildDecisionOptions(),
    required_acknowledgements: buildRequiredAcknowledgements(),
    reviewed_readiness_summary: buildReviewedReadinessSummary(review),
    execution_blockers: requiredExecutionBlockers(),
    source_refs_summary: buildSourceRefsSummary(review),
    manual_lineage_summary: buildManualLineageSummary(review),
    unresolved_tension_summary: buildUnresolvedTensionSummary(review),
    stop_condition_summary: buildStopConditionSummary(review),
    expected_checks_summary: buildExpectedChecksSummary(review),
    authority_boundary:
      getCandidateToCodexHandoffOperatorDecisionAuthorityBoundary(),
    lineage,
    validation: { passed: true, failure_codes: [] },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };

  preview.validation =
    validateCandidateToCodexHandoffOperatorDecisionPreview(preview);
  preview.decision_preview_fingerprint =
    createCandidateToCodexHandoffOperatorDecisionFingerprint(preview);
  return preview;
}

export function validateCandidateToCodexHandoffOperatorDecisionPreview(
  preview: CandidateToCodexHandoffOperatorDecisionPreview,
): CandidateToCodexHandoffOperatorDecisionValidationResult {
  const failureCodes: string[] = [];
  if (preview.decision_preview_version !== decisionPreviewVersion) {
    failureCodes.push("decision_preview_version_invalid");
  }
  if (!preview.source_handoff_draft_review_fingerprint) {
    failureCodes.push("source_handoff_draft_review_fingerprint_missing");
  }
  if (preview.operator_decision_required !== true) {
    failureCodes.push("operator_decision_required_not_true");
  }
  if (preview.operator_decision_satisfied_now !== false) {
    failureCodes.push("operator_decision_satisfied_now_not_false");
  }
  if (preview.operator_decision !== null) {
    failureCodes.push("operator_decision_must_be_null");
  }
  if (preview.operator_decision_status !== decisionStatus) {
    failureCodes.push("operator_decision_status_invalid");
  }
  if (!decisionOptionsAreSafe(preview.decision_options)) {
    failureCodes.push("decision_options_missing_or_authority_granting");
  }
  if (!acknowledgementsAreUnsatisfied(preview.required_acknowledgements)) {
    failureCodes.push("required_acknowledgements_missing_or_satisfied");
  }
  if (!reviewedReadinessPassed(preview.reviewed_readiness_summary)) {
    failureCodes.push("reviewed_readiness_summary_not_passed");
  }
  if (!hasAllRequiredValues(preview.execution_blockers, requiredExecutionBlockers())) {
    failureCodes.push("execution_blockers_missing");
  }
  if (!authorityBoundaryIsSafe(preview.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (preview.authority_boundary.can_run_retrieval_or_rag !== false) {
    failureCodes.push("retrieval_rag_authority_enabled");
  }
  if (preview.authority_boundary.can_fetch_sources !== false) {
    failureCodes.push("source_fetch_authority_enabled");
  }
  if (
    preview.authority_boundary.can_execute_codex !== false ||
    preview.authority_boundary.can_call_github !== false ||
    preview.authority_boundary.can_create_branch !== false ||
    preview.authority_boundary.can_open_pr !== false ||
    preview.authority_boundary.can_send_external_handoff !== false
  ) {
    failureCodes.push("codex_github_branch_pr_external_authority_enabled");
  }
  if (
    preview.authority_boundary.can_open_db !== false ||
    preview.authority_boundary.can_execute_sql !== false ||
    preview.authority_boundary.can_execute_transaction !== false
  ) {
    failureCodes.push("db_sql_transaction_authority_enabled");
  }
  if (
    preview.authority_boundary.can_call_providers_or_openai !== false ||
    preview.authority_boundary.can_fetch_sources !== false ||
    preview.authority_boundary.can_run_retrieval_or_rag !== false
  ) {
    failureCodes.push("provider_source_retrieval_authority_enabled");
  }
  if (
    preview.authority_boundary.can_record_proof !== false ||
    preview.authority_boundary.can_create_evidence !== false ||
    preview.authority_boundary.can_update_work !== false ||
    preview.authority_boundary.can_promote_perspective !== false ||
    preview.authority_boundary.durable_write_authority !== false
  ) {
    failureCodes.push("durable_write_authority_enabled");
  }
  if (
    preview.authority_boundary.can_execute_product_write !== false ||
    preview.authority_boundary.can_allocate_product_ids !== false
  ) {
    failureCodes.push("product_write_or_product_id_authority_enabled");
  }
  if (!preview.lineage.product_write_stopline_ref?.includes("pr:686")) {
    failureCodes.push("product_write_stopline_missing");
  }
  if (preview.authority_boundary.product_write_lane_parked_by_686 !== true) {
    failureCodes.push("product_write_lane_not_parked_by_686");
  }
  if (
    preview.manual_lineage_summary.manual_lineage_preserved !== true ||
    !preview.lineage.manual_ai_context_packet_base_ref ||
    preview.lineage.manual_research_candidate_review_refs.length === 0 ||
    preview.lineage.manual_formation_receipt_refs.length === 0
  ) {
    failureCodes.push("manual_lineage_not_preserved");
  }
  if (preview.unresolved_tension_summary.unresolved_tensions_preserved !== true) {
    failureCodes.push("unresolved_tensions_not_preserved");
  }
  if (preview.recommendation_status !== recommendationStatus) {
    failureCodes.push("recommendation_status_invalid");
  }
  if (preview.next_recommended_slice !== nextRecommendedSlice) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createCandidateToCodexHandoffOperatorDecisionFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildDecisionOptions(): CandidateToCodexHandoffOperatorDecisionOption[] {
  return [
    decisionOption(
      "approve_for_manual_codex_copy_paste_later",
      "Approve for manual Codex copy/paste later",
      "A human may later choose to manually copy a reviewed handoff into Codex outside this preview; this preview itself grants no execution authority.",
    ),
    decisionOption(
      "request_handoff_revision",
      "Request handoff revision",
      "A human may ask for a revised handoff preview before any execution discussion.",
    ),
    decisionOption(
      "defer_handoff",
      "Defer handoff",
      "A human may defer the handoff decision without granting execution or durable write authority.",
    ),
    decisionOption(
      "reject_handoff",
      "Reject handoff",
      "A human may reject the handoff path without mutating work, state, proof, evidence, Perspective, or product data.",
    ),
    decisionOption(
      "archive_preview",
      "Archive preview",
      "A human may treat this preview as informational archive material only; no external handoff is sent.",
    ),
  ];
}

function decisionOption(
  optionId: CandidateToCodexHandoffOperatorDecisionId,
  label: string,
  meaning: string,
): CandidateToCodexHandoffOperatorDecisionOption {
  return {
    option_id: optionId,
    label,
    meaning,
    execution_authority_granted_now: false,
    github_authority_granted_now: false,
    branch_or_pr_authority_granted_now: false,
    durable_write_authority_granted_now: false,
    product_write_authority_granted_now: false,
  };
}

function buildRequiredAcknowledgements(): CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement[] {
  return requiredAcknowledgementIds().map((acknowledgementId) => ({
    acknowledgement_id: acknowledgementId,
    required: true,
    satisfied_now: false,
    authority_boundary_notes: [
      "Acknowledgement is required before any future execution discussion and is not satisfied by this preview.",
    ],
  }));
}

function requiredAcknowledgementIds(): CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement["acknowledgement_id"][] {
  return [
    "packet_is_not_source_of_truth",
    "codex_execution_not_authorized_by_preview",
    "github_automation_not_authorized_by_preview",
    "branch_pr_creation_not_authorized_by_preview",
    "external_handoff_not_sent_by_preview",
    "no_provider_openai_call",
    "no_source_fetch",
    "no_retrieval_rag_execution",
    "no_db_sql_transaction",
    "no_proof_evidence_work_perspective_write",
    "no_product_write_or_product_id_allocation",
    "manual_lineage_preserved",
    "unresolved_tensions_preserved",
  ];
}

function buildReviewedReadinessSummary(
  review: CandidateToCodexHandoffDraftReview,
): JsonRecord {
  return {
    review_status: review.review_status,
    recommendation_status: review.recommendation_status,
    source_handoff_draft_fingerprint: review.source_handoff_draft_fingerprint,
    prompt_review_passed: review.prompt_review.passed === true,
    structured_handoff_review_passed:
      review.structured_handoff_review.passed === true,
    lineage_review_passed: review.lineage_review.passed === true,
    manual_lineage_review_passed: review.manual_lineage_review.passed === true,
    unresolved_tension_review_passed:
      review.unresolved_tension_review.passed === true,
    source_ref_review_passed: review.source_ref_review.passed === true,
    boundary_review_passed: review.boundary_review.passed === true,
    expected_checks_review_passed: review.expected_check_review.passed === true,
    stop_conditions_review_passed:
      review.stop_condition_review.passed === true,
    product_write_stopline_preserved:
      review.lineage.product_write_stopline_ref.includes("pr:686"),
    review_finding_count: review.review_findings.length,
    checklist_pass_count: review.checklist.filter((item) => item.passed).length,
  };
}

function requiredExecutionBlockers(): string[] {
  return [
    "operator_decision_missing",
    "required_acknowledgements_unsatisfied",
    "codex_execution_not_authorized",
    "github_automation_not_authorized",
    "branch_pr_creation_not_authorized",
    "external_handoff_not_authorized",
    "source_of_truth_authority_not_granted",
    "proof_evidence_write_not_authorized",
    "work_mutation_not_authorized",
    "perspective_promotion_not_authorized",
    "provider_openai_call_not_authorized",
    "source_fetch_not_authorized",
    "retrieval_rag_execution_not_authorized",
    "db_sql_transaction_not_authorized",
    "product_write_not_authorized",
    "product_id_allocation_not_authorized",
  ];
}

function buildSourceRefsSummary(
  review: CandidateToCodexHandoffDraftReview,
): JsonRecord {
  const sourceRefs = collectSourceRefs(review);
  return {
    source_ref_count: sourceRefs.length,
    source_refs: sourceRefs,
    source_ref_review_passed: review.source_ref_review.passed === true,
    source_ref_authority_granted: false,
  };
}

function buildManualLineageSummary(
  review: CandidateToCodexHandoffDraftReview,
): JsonRecord {
  return {
    manual_lineage_preserved: review.manual_lineage_review.passed === true,
    manual_ai_context_packet_base_ref:
      review.lineage.manual_ai_context_packet_base_ref,
    manual_research_candidate_review_refs:
      review.lineage.manual_research_candidate_review_refs,
    manual_formation_receipt_refs: review.lineage.manual_formation_receipt_refs,
    manual_lineage_authority_granted: false,
  };
}

function buildUnresolvedTensionSummary(
  review: CandidateToCodexHandoffDraftReview,
): JsonRecord {
  return {
    unresolved_tension_count: numberFromRecord(
      review.source_summary,
      "unresolved_tension_count",
    ),
    unresolved_tension_review_passed:
      review.unresolved_tension_review.passed === true,
    unresolved_tensions_preserved:
      review.unresolved_tension_review.unresolved_tension_preserved === true,
    unresolved_tensions_not_smoothed_away:
      review.unresolved_tension_review
        .unresolved_tensions_not_smoothed_away_into_recommendations === true,
  };
}

function buildStopConditionSummary(
  review: CandidateToCodexHandoffDraftReview,
): JsonRecord {
  return {
    stop_conditions_count: numberFromRecord(
      review.source_summary,
      "stop_conditions_count",
    ),
    stop_conditions_review_passed: review.stop_condition_review.passed === true,
    stop_conditions_authority: false,
  };
}

function buildExpectedChecksSummary(
  review: CandidateToCodexHandoffDraftReview,
): JsonRecord {
  return {
    expected_checks_count: numberFromRecord(
      review.source_summary,
      "expected_checks_count",
    ),
    expected_checks_review_passed: review.expected_check_review.passed === true,
    expected_checks_authorize_execution_now: false,
  };
}

function buildLineage(
  review: CandidateToCodexHandoffDraftReview,
  sourceReviewRef: string,
): CandidateToCodexHandoffOperatorDecisionLineage {
  return {
    source_handoff_draft_review_ref: sourceReviewRef,
    source_handoff_draft_review_fingerprint: review.review_fingerprint,
    source_handoff_draft_ref: review.lineage.source_handoff_draft_ref,
    source_handoff_draft_fingerprint:
      review.lineage.source_handoff_draft_fingerprint,
    source_ai_context_packet_ref: review.lineage.upgraded_ai_context_packet_ref,
    source_ai_context_packet_fingerprint:
      review.lineage.upgraded_ai_context_packet_fingerprint,
    ai_context_packet_base_refs: review.lineage.ai_context_packet_base_refs,
    manual_ai_context_packet_base_ref:
      review.lineage.manual_ai_context_packet_base_ref,
    research_candidate_review_refs:
      review.lineage.research_candidate_review_refs,
    manual_research_candidate_review_refs:
      review.lineage.manual_research_candidate_review_refs,
    perspective_geometry_digest_refs:
      review.lineage.perspective_geometry_digest_refs,
    agent_perspective_substrate_ref:
      review.lineage.agent_perspective_substrate_ref,
    agent_perspective_substrate_preview_ref:
      review.lineage.agent_perspective_substrate_preview_ref,
    cockpit_folded_audit_panel_ref:
      review.lineage.cockpit_folded_audit_panel_ref,
    formation_receipt_refs: review.lineage.formation_receipt_refs,
    manual_formation_receipt_refs:
      review.lineage.manual_formation_receipt_refs,
    product_write_stopline_ref: review.lineage.product_write_stopline_ref,
  };
}

function getCandidateToCodexHandoffOperatorDecisionAuthorityBoundary(): CandidateToCodexHandoffOperatorDecisionAuthorityBoundary {
  return {
    preview_only: true,
    review_only: true,
    operator_decision_recorded_now: false,
    operator_decision_satisfied_now: false,
    can_execute_codex: false,
    can_create_branch: false,
    can_open_pr: false,
    can_call_github: false,
    can_send_external_handoff: false,
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_create_work_item: false,
    can_execute_agents: false,
    can_route_agents: false,
    can_call_external_services: false,
    can_call_providers_or_openai: false,
    can_run_retrieval_or_rag: false,
    can_fetch_sources: false,
    can_promote_perspective: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    can_open_db: false,
    can_execute_sql: false,
    can_execute_transaction: false,
    can_add_route_or_ui: false,
    durable_write_authority: false,
    merge_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function decisionOptionsAreSafe(
  options: CandidateToCodexHandoffOperatorDecisionOption[],
): boolean {
  if (!Array.isArray(options) || options.length !== requiredDecisionOptionIds().length) {
    return false;
  }
  const optionIds = options.map((option) => option.option_id).sort();
  if (!arraysEqual(optionIds, requiredDecisionOptionIds().sort())) return false;
  return options.every(
    (option) =>
      option.execution_authority_granted_now === false &&
      option.github_authority_granted_now === false &&
      option.branch_or_pr_authority_granted_now === false &&
      option.durable_write_authority_granted_now === false &&
      option.product_write_authority_granted_now === false,
  );
}

function acknowledgementsAreUnsatisfied(
  acknowledgements: CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement[],
): boolean {
  if (
    !Array.isArray(acknowledgements) ||
    acknowledgements.length !== requiredAcknowledgementIds().length
  ) {
    return false;
  }
  const acknowledgementIds = acknowledgements
    .map((acknowledgement) => acknowledgement.acknowledgement_id)
    .sort();
  if (!arraysEqual(acknowledgementIds, requiredAcknowledgementIds().sort())) {
    return false;
  }
  return acknowledgements.every(
    (acknowledgement) =>
      acknowledgement.required === true &&
      acknowledgement.satisfied_now === false,
  );
}

function reviewedReadinessPassed(summary: Record<string, unknown>): boolean {
  return (
    summary.review_status === "candidate_to_codex_handoff_draft_review_passed" &&
    summary.recommendation_status ===
      "ready_for_human_operator_handoff_decision" &&
    summary.prompt_review_passed === true &&
    summary.structured_handoff_review_passed === true &&
    summary.lineage_review_passed === true &&
    summary.manual_lineage_review_passed === true &&
    summary.unresolved_tension_review_passed === true &&
    summary.source_ref_review_passed === true &&
    summary.boundary_review_passed === true &&
    summary.expected_checks_review_passed === true &&
    summary.stop_conditions_review_passed === true &&
    summary.product_write_stopline_preserved === true &&
    typeof summary.review_finding_count === "number" &&
    Number(summary.review_finding_count) > 0 &&
    typeof summary.checklist_pass_count === "number" &&
    Number(summary.checklist_pass_count) > 0
  );
}

function authorityBoundaryIsSafe(
  boundary: CandidateToCodexHandoffOperatorDecisionAuthorityBoundary,
): boolean {
  if (
    !boundary ||
    boundary.preview_only !== true ||
    boundary.review_only !== true ||
    boundary.operator_decision_recorded_now !== false ||
    boundary.operator_decision_satisfied_now !== false ||
    boundary.product_write_lane_parked_by_686 !== true
  ) {
    return false;
  }
  return forbiddenCapabilityKeys().every((key) => boundary[key] === false);
}

function forbiddenCapabilityKeys(): Array<
  keyof CandidateToCodexHandoffOperatorDecisionAuthorityBoundary
> {
  return [
    "can_execute_codex",
    "can_create_branch",
    "can_open_pr",
    "can_call_github",
    "can_send_external_handoff",
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
    "can_add_route_or_ui",
    "durable_write_authority",
    "merge_authority",
  ];
}

function requiredDecisionOptionIds(): CandidateToCodexHandoffOperatorDecisionId[] {
  return [
    "approve_for_manual_codex_copy_paste_later",
    "request_handoff_revision",
    "defer_handoff",
    "reject_handoff",
    "archive_preview",
  ];
}

function hasAllRequiredValues(values: string[], requiredValues: string[]): boolean {
  return requiredValues.every((requiredValue) => values.includes(requiredValue));
}

function collectSourceRefs(review: CandidateToCodexHandoffDraftReview): string[] {
  return uniqueSorted([
    review.source_handoff_draft_ref,
    review.source_handoff_draft_fingerprint,
    review.review_fingerprint,
    ...review.review_findings.flatMap((finding) => finding.source_refs),
  ]);
}

function numberFromRecord(value: unknown, key: string): number {
  if (!value || typeof value !== "object") return 0;
  const nestedValue = (value as JsonRecord)[key];
  return typeof nestedValue === "number" ? nestedValue : 0;
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "decision_preview_fingerprint")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
