export const FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION =
  "feedback_influenced_surfacing_preview.v0.1" as const;
export const FEEDBACK_INFLUENCED_SURFACING_INPUT_VERSION =
  "feedback_influenced_surfacing_input.v0.1" as const;
export const FEEDBACK_INFLUENCED_SURFACING_RESULT_VERSION =
  "feedback_influenced_surfacing_result.v0.1" as const;
export const FEEDBACK_INFLUENCED_SURFACING_ITEM_VERSION =
  "feedback_influenced_surfacing_item.v0.1" as const;

const scope = "project:augnes" as const;
const blockedPreviewId = "feedback-influenced-surfacing-preview:blocked" as const;

export type FeedbackInfluencedSurfacingStatus =
  | "built"
  | "empty"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input";

export type FeedbackInfluencedVisibilityHint =
  | "visible"
  | "visible_with_warning"
  | "lower_priority"
  | "needs_review"
  | "blocked_from_auto_hide";

export type FeedbackInfluencedPriorityPreview =
  | "none"
  | "lower"
  | "normal"
  | "elevated"
  | "needs_review";

export type FeedbackInfluencedReviewAttentionHint =
  | "none"
  | "review_suggested"
  | "review_required"
  | "evidence_needed"
  | "rule_review_needed"
  | "stale_context_review_needed";

export type FeedbackInfluencedCandidateOverlayHint =
  | "none"
  | "show_overlay"
  | "show_with_warning"
  | "separate_from_durable_graph";

export type FeedbackInfluencedReasonCode =
  | "feedback_aggregate_present"
  | "feedback_aggregate_missing"
  | "candidate_ref_present"
  | "candidate_ref_missing"
  | "surface_ref_present"
  | "surface_ref_missing"
  | "advisory_preview_only"
  | "feedback_is_not_truth"
  | "feedback_is_not_proof"
  | "feedback_is_not_evidence"
  | "feedback_is_not_promotion_readiness"
  | "surfacing_preview_is_not_authority"
  | "surfacing_preview_does_not_delete_candidates"
  | "surfacing_preview_does_not_promote_candidates"
  | "surfacing_preview_does_not_mutate_rules"
  | "surfacing_preview_does_not_mutate_parser"
  | "surfacing_preview_does_not_mutate_state"
  | "surfacing_preview_does_not_product_write"
  | "pin_keeps_visible_without_promotion"
  | "dismiss_lowers_priority_without_deletion"
  | "correction_adds_warning_without_rule_mutation"
  | "invalidation_requires_review_without_deletion"
  | "needs_more_evidence_review_cue"
  | "scope_overreach_rule_review_cue"
  | "stale_context_review_cue"
  | "useful_elevates_without_promotion"
  | "wrong_requires_review_without_parser_mutation"
  | "priority_hint_lowered"
  | "priority_hint_elevated"
  | "priority_hint_needs_review"
  | "visibility_hint_visible"
  | "visibility_hint_visible_with_warning"
  | "visibility_hint_lower_priority"
  | "visibility_hint_needs_review"
  | "auto_hide_blocked"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "durable_state_not_mutated"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_write_not_executed"
  | "git_ledger_export_not_executed";

export interface FeedbackInfluencedSurfacingAuthorityBoundary {
  feedback_influenced_surfacing_preview_now: true;
  advisory_preview_only: true;
  feedback_write_now: false;
  feedback_persistence_now: false;
  candidate_mutation_now: false;
  candidate_deletion_now: false;
  candidate_auto_hide_now: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  work_mutation_now: false;
  db_query_or_write_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  feedback_is_truth: false;
  feedback_is_proof: false;
  feedback_is_evidence: false;
  feedback_is_promotion_readiness: false;
  surfacing_preview_is_authority: false;
  surfacing_preview_is_ranking_authority: false;
  product_write_authority: false;
}

export interface FeedbackInfluencedCandidateInput {
  candidate_ref: string;
  target_surface: string;
  target_surface_ref: string;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  review_record_refs: string[];
  feedback_aggregate_refs: string[];
  rule_failure_candidate_refs: string[];
  public_safe: boolean;
  reason_codes: FeedbackInfluencedReasonCode[];
}

export interface FeedbackInfluencedAggregateInput {
  aggregate_id?: string;
  target_surface: string;
  target_surface_ref: string;
  target_candidate_ref: string;
  feedback_event_refs?: string[];
  pin_count?: number;
  dismiss_count?: number;
  correct_count?: number;
  invalidate_count?: number;
  needs_more_evidence_count?: number;
  scope_overreach_count?: number;
  not_relevant_now_count?: number;
  mark_useful_count?: number;
  mark_wrong_count?: number;
  current_surface_priority_hint?: FeedbackInfluencedPriorityPreview;
  advisory_only?: true;
  deletes_candidate?: false;
  promotes_candidate?: false;
  mutates_rules?: false;
  mutates_parser?: false;
  mutates_durable_state?: false;
  product_write_executed?: false;
  reason_codes?: string[];
}

export interface FeedbackInfluencedRuleFailureCandidateInput {
  rule_failure_candidate_id: string;
  failure_kind?: string;
  target_surface: string;
  target_surface_ref: string;
  target_candidate_refs: string[];
  bounded_summary?: string;
  review_status?: string;
  source_refs?: string[];
  feedback_event_refs?: string[];
  mutates_rules?: false;
  mutates_parser?: false;
  mutates_durable_state?: false;
  promotes_candidate?: false;
  deletes_candidate?: false;
  product_write_executed?: false;
  reason_codes?: string[];
}

export interface FeedbackInfluencedSurfacingInput {
  input_version: typeof FEEDBACK_INFLUENCED_SURFACING_INPUT_VERSION;
  preview_version: typeof FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION;
  scope: typeof scope;
  preview_id: string;
  as_of: string;
  candidates: FeedbackInfluencedCandidateInput[];
  feedback_aggregates: FeedbackInfluencedAggregateInput[];
  rule_failure_candidates: FeedbackInfluencedRuleFailureCandidateInput[];
  boundary_notes: string[];
  reason_codes: FeedbackInfluencedReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface FeedbackInfluencedSurfacingItem {
  item_version: typeof FEEDBACK_INFLUENCED_SURFACING_ITEM_VERSION;
  preview_version: typeof FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION;
  scope: typeof scope;
  item_id: string;
  candidate_ref: string;
  target_surface: string;
  target_surface_ref: string;
  bounded_title: string;
  bounded_summary: string;
  surface_priority_preview: FeedbackInfluencedPriorityPreview;
  visibility_hint: FeedbackInfluencedVisibilityHint;
  review_attention_hint: FeedbackInfluencedReviewAttentionHint;
  candidate_overlay_hint: FeedbackInfluencedCandidateOverlayHint;
  correction_warning_hint: boolean;
  invalidation_warning_hint: boolean;
  needs_more_evidence_hint: boolean;
  scope_overreach_hint: boolean;
  stale_context_hint: boolean;
  rule_failure_hint: boolean;
  source_refs: string[];
  review_record_refs: string[];
  feedback_aggregate_refs: string[];
  rule_failure_candidate_refs: string[];
  advisory_only: true;
  deletes_candidate: false;
  hides_candidate_silently: false;
  promotes_candidate: false;
  mutates_rules: false;
  mutates_parser: false;
  mutates_durable_state: false;
  product_write_executed: false;
  reason_codes: FeedbackInfluencedReasonCode[];
  authority_boundary: FeedbackInfluencedSurfacingAuthorityBoundary;
}

export interface FeedbackInfluencedSurfacingResult {
  result_version: typeof FEEDBACK_INFLUENCED_SURFACING_RESULT_VERSION;
  preview_version: typeof FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION;
  scope: typeof scope;
  preview_id: string;
  status: FeedbackInfluencedSurfacingStatus;
  items: FeedbackInfluencedSurfacingItem[];
  rejected_candidate_refs: string[];
  warnings: string[];
  reason_codes: FeedbackInfluencedReasonCode[];
  authority_boundary: FeedbackInfluencedSurfacingAuthorityBoundary;
}

export interface FeedbackInfluencedSurfacingValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type FeedbackLink = {
  aggregateRefs: string[];
  ruleFailureRefs: string[];
  counts: {
    pin: number;
    dismiss: number;
    correct: number;
    invalidate: number;
    needsMoreEvidence: number;
    scopeOverreach: number;
    notRelevantNow: number;
    useful: number;
    wrong: number;
  };
  aggregateReasonCodes: string[];
  ruleFailureKinds: string[];
};

const reasonCodes: FeedbackInfluencedReasonCode[] = [
  "feedback_aggregate_present",
  "feedback_aggregate_missing",
  "candidate_ref_present",
  "candidate_ref_missing",
  "surface_ref_present",
  "surface_ref_missing",
  "advisory_preview_only",
  "feedback_is_not_truth",
  "feedback_is_not_proof",
  "feedback_is_not_evidence",
  "feedback_is_not_promotion_readiness",
  "surfacing_preview_is_not_authority",
  "surfacing_preview_does_not_delete_candidates",
  "surfacing_preview_does_not_promote_candidates",
  "surfacing_preview_does_not_mutate_rules",
  "surfacing_preview_does_not_mutate_parser",
  "surfacing_preview_does_not_mutate_state",
  "surfacing_preview_does_not_product_write",
  "pin_keeps_visible_without_promotion",
  "dismiss_lowers_priority_without_deletion",
  "correction_adds_warning_without_rule_mutation",
  "invalidation_requires_review_without_deletion",
  "needs_more_evidence_review_cue",
  "scope_overreach_rule_review_cue",
  "stale_context_review_cue",
  "useful_elevates_without_promotion",
  "wrong_requires_review_without_parser_mutation",
  "priority_hint_lowered",
  "priority_hint_elevated",
  "priority_hint_needs_review",
  "visibility_hint_visible",
  "visibility_hint_visible_with_warning",
  "visibility_hint_lower_priority",
  "visibility_hint_needs_review",
  "auto_hide_blocked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "durable_state_not_mutated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_not_executed",
  "git_ledger_export_not_executed",
];

const forbiddenTrueAuthorityFields = [
  "feedback_write_now",
  "feedback_persistence_now",
  "candidate_mutation_now",
  "candidate_deletion_now",
  "candidate_auto_hide_now",
  "rule_mutation_now",
  "parser_mutation_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "db_query_or_write_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "feedback_is_truth",
  "feedback_is_proof",
  "feedback_is_evidence",
  "feedback_is_promotion_readiness",
  "surfacing_preview_is_authority",
  "surfacing_preview_is_ranking_authority",
  "product_write_authority",
] as const;

const aggregateCountFields = [
  "pin_count",
  "dismiss_count",
  "correct_count",
  "invalidate_count",
  "needs_more_evidence_count",
  "scope_overreach_count",
  "not_relevant_now_count",
  "mark_useful_count",
  "mark_wrong_count",
] as const;

const compatibleAggregationReasonCodes = [
  "feedback_event_present",
  "feedback_event_missing",
  "feedback_event_kind_supported",
  "feedback_event_kind_unknown",
  "target_candidate_ref_present",
  "target_candidate_ref_missing",
  "target_surface_ref_present",
  "target_surface_ref_missing",
  "operator_actor_ref_present",
  "operator_actor_ref_missing",
  "feedback_is_advisory",
  "feedback_is_not_truth",
  "feedback_is_not_proof",
  "feedback_is_not_evidence",
  "feedback_is_not_promotion",
  "aggregation_is_advisory",
  "aggregation_is_not_state",
  "aggregation_does_not_delete_candidates",
  "aggregation_does_not_promote",
  "aggregation_does_not_mutate_rules",
  "aggregation_does_not_product_write",
  "pin_counted",
  "dismiss_counted",
  "correction_counted",
  "invalidation_counted",
  "needs_more_evidence_counted",
  "scope_overreach_counted",
  "not_relevant_now_counted",
  "useful_counted",
  "wrong_counted",
  "priority_hint_lowered",
  "priority_hint_elevated",
  "operator_review_required",
  "rule_failure_candidate_created",
  "evidence_gap_review_cue_created",
  "stale_context_review_cue_created",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "durable_state_not_mutated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_not_executed",
  "git_ledger_export_not_executed",
] as const;

const compatibleReasonCodes = new Set<string>([
  ...reasonCodes,
  ...compatibleAggregationReasonCodes,
]);

const compatibleRuleFailureReviewStatuses = [
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_runtime",
] as const;

const unsafeTextPattern =
  /(\/Users\/|\/home\/|file:\/\/|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|private key|raw provider output|raw retrieval output|raw feedback payload|raw surfacing payload|raw surfacing preview payload|raw conversation|hidden reasoning|raw DB row|raw_db_row|browser dump|raw browser dump|raw source body|actual prompt:|provider response:|actual query:|embedding vector:|vector index dump:|secret-like surfacing preview input)/i;

export function buildFeedbackInfluencedSurfacingPreviewV01(
  input: FeedbackInfluencedSurfacingInput,
): FeedbackInfluencedSurfacingResult {
  const validation = validateFeedbackInfluencedSurfacingInputV01(input);
  if (!validation.passed) {
    const hasPrivateFailure = validation.failure_codes.some((code) =>
      /private|raw|secret|local_path|private_url/.test(code),
    );
    return blockedResult(
      hasPrivateFailure ? "blocked_private_or_raw_payload" : "blocked_invalid_input",
      safePreviewId(input),
      safeRejectedCandidateRefs(input),
      hasPrivateFailure
        ? [
            "private_or_raw_payload_blocked",
            ...privacyReasonCodes(validation.failure_codes),
          ]
        : baseReasonCodes(["feedback_aggregate_missing"]),
    );
  }

  const candidates = [...input.candidates].sort(compareCandidates);
  if (candidates.length === 0) {
    return {
      result_version: FEEDBACK_INFLUENCED_SURFACING_RESULT_VERSION,
      preview_version: FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION,
      scope,
      preview_id: input.preview_id,
      status: "empty",
      items: [],
      rejected_candidate_refs: [],
      warnings: [
        "Feedback influenced surfacing is preview-only.",
        "No candidates were supplied for advisory surfacing preview.",
      ],
      reason_codes: baseReasonCodes(["feedback_aggregate_missing"]),
      authority_boundary: createFeedbackInfluencedSurfacingAuthorityBoundaryV01(),
    };
  }

  const items = candidates.map((candidate) =>
    buildSurfacingItem(candidate, input.feedback_aggregates, input.rule_failure_candidates),
  );

  return {
    result_version: FEEDBACK_INFLUENCED_SURFACING_RESULT_VERSION,
    preview_version: FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION,
    scope,
    preview_id: input.preview_id,
    status: "built",
    items,
    rejected_candidate_refs: [],
    warnings: [
      "Feedback influenced surfacing is preview-only.",
      "Feedback influenced surfacing is advisory only.",
      "Surfacing preview does not delete, hide silently, promote, mutate durable state, or product-write.",
    ],
    reason_codes: uniqueReasonCodes(
      baseReasonCodes([
        items.length > 0 ? "candidate_ref_present" : "candidate_ref_missing",
        items.some((item) => item.reason_codes.includes("feedback_aggregate_present"))
          ? "feedback_aggregate_present"
          : "feedback_aggregate_missing",
      ]),
    ),
    authority_boundary: createFeedbackInfluencedSurfacingAuthorityBoundaryV01(),
  };
}

export function validateFeedbackInfluencedSurfacingInputV01(
  input: unknown,
): FeedbackInfluencedSurfacingValidationResult {
  const failureCodes: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }

  const value = input as Partial<FeedbackInfluencedSurfacingInput>;
  if (value.input_version !== FEEDBACK_INFLUENCED_SURFACING_INPUT_VERSION) {
    failureCodes.push("invalid_input_version");
  }
  if (value.preview_version !== FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION) {
    failureCodes.push("invalid_preview_version");
  }
  if (value.scope !== scope) failureCodes.push("invalid_scope");
  validatePublicString(value.preview_id, "preview_id", failureCodes);
  validatePublicString(value.as_of, "as_of", failureCodes);
  validateStringArray(value.boundary_notes, "boundary_notes", failureCodes);
  validateReasonCodeArray(value.reason_codes, "reason_codes", failureCodes);
  validateAuthorityBoundaryInput(value.authority_boundary, "authority_boundary", failureCodes);
  collectForbiddenAuthorityFailures(value, "input", failureCodes);
  collectUnsafeObjectFailures(value, "input", failureCodes);

  if (!Array.isArray(value.candidates)) {
    failureCodes.push("candidates_missing");
  } else {
    for (let index = 0; index < value.candidates.length; index += 1) {
      const candidateValidation = validateFeedbackInfluencedCandidateInputV01(
        value.candidates[index],
      );
      for (const code of candidateValidation.failure_codes) {
        failureCodes.push(`candidates.${index}.${code}`);
      }
    }
  }

  if (!Array.isArray(value.feedback_aggregates)) {
    failureCodes.push("feedback_aggregates_missing");
  } else {
    for (let index = 0; index < value.feedback_aggregates.length; index += 1) {
      validateAggregateInput(value.feedback_aggregates[index], index, failureCodes);
    }
  }

  if (!Array.isArray(value.rule_failure_candidates)) {
    failureCodes.push("rule_failure_candidates_missing");
  } else {
    for (let index = 0; index < value.rule_failure_candidates.length; index += 1) {
      validateRuleFailureCandidateInput(
        value.rule_failure_candidates[index],
        index,
        failureCodes,
      );
    }
  }

  return { passed: failureCodes.length === 0, failure_codes: failureCodes };
}

export function validateFeedbackInfluencedCandidateInputV01(
  candidate: unknown,
): FeedbackInfluencedSurfacingValidationResult {
  const failureCodes: string[] = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { passed: false, failure_codes: ["candidate_not_object"] };
  }

  const value = candidate as Partial<FeedbackInfluencedCandidateInput>;
  validatePublicString(value.candidate_ref, "candidate_ref", failureCodes);
  validatePublicString(value.target_surface, "target_surface", failureCodes);
  validatePublicString(value.target_surface_ref, "target_surface_ref", failureCodes);
  validatePublicString(value.bounded_title, "bounded_title", failureCodes);
  validatePublicString(value.bounded_summary, "bounded_summary", failureCodes);
  validateStringArray(value.source_refs, "source_refs", failureCodes);
  validateStringArray(value.review_record_refs, "review_record_refs", failureCodes);
  validateStringArray(value.feedback_aggregate_refs, "feedback_aggregate_refs", failureCodes);
  validateStringArray(
    value.rule_failure_candidate_refs,
    "rule_failure_candidate_refs",
    failureCodes,
  );
  if (value.public_safe !== true) failureCodes.push("public_safe_false");
  validateReasonCodeArray(value.reason_codes, "reason_codes", failureCodes);
  collectUnsafeObjectFailures(value, "candidate", failureCodes);

  return { passed: failureCodes.length === 0, failure_codes: failureCodes };
}

export function createFeedbackInfluencedSurfacingAuthorityBoundaryV01(): FeedbackInfluencedSurfacingAuthorityBoundary {
  return {
    feedback_influenced_surfacing_preview_now: true,
    advisory_preview_only: true,
    feedback_write_now: false,
    feedback_persistence_now: false,
    candidate_mutation_now: false,
    candidate_deletion_now: false,
    candidate_auto_hide_now: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    work_mutation_now: false,
    db_query_or_write_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    git_ledger_export_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    feedback_is_truth: false,
    feedback_is_proof: false,
    feedback_is_evidence: false,
    feedback_is_promotion_readiness: false,
    surfacing_preview_is_authority: false,
    surfacing_preview_is_ranking_authority: false,
    product_write_authority: false,
  };
}

export function createFeedbackInfluencedSurfacingItemIdV01(
  candidate: Pick<
    FeedbackInfluencedCandidateInput,
    "target_surface" | "target_surface_ref" | "candidate_ref"
  >,
): string {
  return [
    "feedback-surfacing-item",
    stableSlug(candidate.target_surface),
    stableSlug(candidate.target_surface_ref),
    stableSlug(candidate.candidate_ref),
  ].join(":");
}

function buildSurfacingItem(
  candidate: FeedbackInfluencedCandidateInput,
  aggregates: FeedbackInfluencedAggregateInput[],
  ruleFailureCandidates: FeedbackInfluencedRuleFailureCandidateInput[],
): FeedbackInfluencedSurfacingItem {
  const link = linkFeedback(candidate, aggregates, ruleFailureCandidates);
  const correctionWarning = link.counts.correct > 0;
  const invalidationWarning = link.counts.invalidate > 0;
  const wrongReviewCue = link.counts.wrong > 0;
  const needsMoreEvidence = link.counts.needsMoreEvidence > 0;
  const scopeOverreach = link.counts.scopeOverreach > 0;
  const staleContext =
    link.counts.notRelevantNow > 0 ||
    link.aggregateReasonCodes.includes("stale_context_review_cue_created") ||
    link.ruleFailureKinds.includes("stale_context");
  const ruleFailureHint = link.ruleFailureRefs.length > 0;

  const reviewAttention = determineReviewAttention({
    correctionWarning,
    invalidationWarning,
    wrongReviewCue,
    needsMoreEvidence,
    scopeOverreach,
    staleContext,
    ruleFailureHint,
  });
  const priorityPreview = determinePriorityPreview(link, reviewAttention);
  const visibilityHint = determineVisibilityHint(
    priorityPreview,
    reviewAttention,
    correctionWarning || invalidationWarning || wrongReviewCue || ruleFailureHint || staleContext,
  );
  const candidateOverlayHint = determineCandidateOverlayHint(
    link,
    reviewAttention,
    correctionWarning || invalidationWarning || wrongReviewCue || ruleFailureHint || staleContext,
  );

  return {
    item_version: FEEDBACK_INFLUENCED_SURFACING_ITEM_VERSION,
    preview_version: FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION,
    scope,
    item_id: createFeedbackInfluencedSurfacingItemIdV01(candidate),
    candidate_ref: candidate.candidate_ref,
    target_surface: candidate.target_surface,
    target_surface_ref: candidate.target_surface_ref,
    bounded_title: candidate.bounded_title,
    bounded_summary: candidate.bounded_summary,
    surface_priority_preview: priorityPreview,
    visibility_hint: visibilityHint,
    review_attention_hint: reviewAttention,
    candidate_overlay_hint: candidateOverlayHint,
    correction_warning_hint: correctionWarning,
    invalidation_warning_hint: invalidationWarning,
    needs_more_evidence_hint: needsMoreEvidence,
    scope_overreach_hint: scopeOverreach,
    stale_context_hint: staleContext,
    rule_failure_hint: ruleFailureHint,
    source_refs: uniqueSorted(candidate.source_refs),
    review_record_refs: uniqueSorted(candidate.review_record_refs),
    feedback_aggregate_refs: uniqueSorted([
      ...candidate.feedback_aggregate_refs,
      ...link.aggregateRefs,
    ]),
    rule_failure_candidate_refs: uniqueSorted([
      ...candidate.rule_failure_candidate_refs,
      ...link.ruleFailureRefs,
    ]),
    advisory_only: true,
    deletes_candidate: false,
    hides_candidate_silently: false,
    promotes_candidate: false,
    mutates_rules: false,
    mutates_parser: false,
    mutates_durable_state: false,
    product_write_executed: false,
    reason_codes: itemReasonCodes({
      link,
      priorityPreview,
      visibilityHint,
      reviewAttention,
      correctionWarning,
      invalidationWarning,
      wrongReviewCue,
      needsMoreEvidence,
      scopeOverreach,
      staleContext,
      ruleFailureHint,
    }),
    authority_boundary: createFeedbackInfluencedSurfacingAuthorityBoundaryV01(),
  };
}

function linkFeedback(
  candidate: FeedbackInfluencedCandidateInput,
  aggregates: FeedbackInfluencedAggregateInput[],
  ruleFailureCandidates: FeedbackInfluencedRuleFailureCandidateInput[],
): FeedbackLink {
  const matchingAggregates = aggregates
    .filter(
      (aggregate) =>
        aggregate.target_candidate_ref === candidate.candidate_ref &&
        aggregate.target_surface === candidate.target_surface &&
        aggregate.target_surface_ref === candidate.target_surface_ref,
    )
    .sort(compareAggregates);
  const matchingRuleFailures = ruleFailureCandidates
    .filter(
      (ruleFailure) =>
        ruleFailure.target_surface === candidate.target_surface &&
        ruleFailure.target_surface_ref === candidate.target_surface_ref &&
        ruleFailure.target_candidate_refs.includes(candidate.candidate_ref),
    )
    .sort(compareRuleFailureCandidates);

  return {
    aggregateRefs: matchingAggregates
      .map((aggregate) => aggregate.aggregate_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    ruleFailureRefs: matchingRuleFailures
      .map((ruleFailure) => ruleFailure.rule_failure_candidate_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
    counts: {
      pin: sumCounts(matchingAggregates, "pin_count"),
      dismiss: sumCounts(matchingAggregates, "dismiss_count"),
      correct: sumCounts(matchingAggregates, "correct_count"),
      invalidate: sumCounts(matchingAggregates, "invalidate_count"),
      needsMoreEvidence: sumCounts(matchingAggregates, "needs_more_evidence_count"),
      scopeOverreach: sumCounts(matchingAggregates, "scope_overreach_count"),
      notRelevantNow: sumCounts(matchingAggregates, "not_relevant_now_count"),
      useful: sumCounts(matchingAggregates, "mark_useful_count"),
      wrong: sumCounts(matchingAggregates, "mark_wrong_count"),
    },
    aggregateReasonCodes: uniqueSorted(
      matchingAggregates.flatMap((aggregate) => aggregate.reason_codes ?? []),
    ),
    ruleFailureKinds: uniqueSorted(
      matchingRuleFailures
        .map((ruleFailure) => ruleFailure.failure_kind)
        .filter((value): value is string => typeof value === "string"),
    ),
  };
}

function determineReviewAttention(args: {
  correctionWarning: boolean;
  invalidationWarning: boolean;
  wrongReviewCue: boolean;
  needsMoreEvidence: boolean;
  scopeOverreach: boolean;
  staleContext: boolean;
  ruleFailureHint: boolean;
}): FeedbackInfluencedReviewAttentionHint {
  if (args.invalidationWarning || args.correctionWarning || args.wrongReviewCue) {
    return "review_required";
  }
  if (args.needsMoreEvidence) return "evidence_needed";
  if (args.scopeOverreach) return "rule_review_needed";
  if (args.staleContext) return "stale_context_review_needed";
  if (args.ruleFailureHint) return "rule_review_needed";
  return "none";
}

function determinePriorityPreview(
  link: FeedbackLink,
  reviewAttention: FeedbackInfluencedReviewAttentionHint,
): FeedbackInfluencedPriorityPreview {
  if (
    reviewAttention === "review_required" ||
    reviewAttention === "evidence_needed" ||
    reviewAttention === "rule_review_needed"
  ) {
    const negative = link.counts.dismiss + link.counts.wrong + link.counts.notRelevantNow;
    const positive = link.counts.pin + link.counts.useful;
    if (
      reviewAttention === "review_required" &&
      link.counts.wrong > 0 &&
      link.counts.correct === 0 &&
      link.counts.invalidate === 0 &&
      negative > positive
    ) {
      return "lower";
    }
    return "needs_review";
  }

  const negative = link.counts.dismiss + link.counts.wrong + link.counts.notRelevantNow;
  const positive = link.counts.pin + link.counts.useful;
  const totalFeedback =
    negative +
    positive +
    link.counts.correct +
    link.counts.invalidate +
    link.counts.needsMoreEvidence +
    link.counts.scopeOverreach;
  if (totalFeedback === 0) return "none";
  if (negative > positive) return "lower";
  if (positive > negative) return "elevated";
  return "normal";
}

function determineVisibilityHint(
  priorityPreview: FeedbackInfluencedPriorityPreview,
  reviewAttention: FeedbackInfluencedReviewAttentionHint,
  hasWarning: boolean,
): FeedbackInfluencedVisibilityHint {
  if (reviewAttention === "review_required") return "needs_review";
  if (reviewAttention !== "none" || hasWarning) return "visible_with_warning";
  if (priorityPreview === "lower") return "lower_priority";
  return "visible";
}

function determineCandidateOverlayHint(
  link: FeedbackLink,
  reviewAttention: FeedbackInfluencedReviewAttentionHint,
  hasWarning: boolean,
): FeedbackInfluencedCandidateOverlayHint {
  if (reviewAttention !== "none" || hasWarning) return "show_with_warning";
  if (link.aggregateRefs.length > 0) return "show_overlay";
  return "none";
}

function itemReasonCodes(args: {
  link: FeedbackLink;
  priorityPreview: FeedbackInfluencedPriorityPreview;
  visibilityHint: FeedbackInfluencedVisibilityHint;
  reviewAttention: FeedbackInfluencedReviewAttentionHint;
  correctionWarning: boolean;
  invalidationWarning: boolean;
  wrongReviewCue: boolean;
  needsMoreEvidence: boolean;
  scopeOverreach: boolean;
  staleContext: boolean;
  ruleFailureHint: boolean;
}): FeedbackInfluencedReasonCode[] {
  const codes = baseReasonCodes([
    args.link.aggregateRefs.length > 0
      ? "feedback_aggregate_present"
      : "feedback_aggregate_missing",
    "candidate_ref_present",
    "surface_ref_present",
    "auto_hide_blocked",
  ]);
  if (args.link.counts.pin > 0) codes.push("pin_keeps_visible_without_promotion");
  if (args.link.counts.dismiss > 0) {
    codes.push("dismiss_lowers_priority_without_deletion");
  }
  if (args.link.counts.useful > 0) codes.push("useful_elevates_without_promotion");
  if (args.link.counts.wrong > 0) {
    codes.push("wrong_requires_review_without_parser_mutation");
  }
  if (args.correctionWarning) {
    codes.push("correction_adds_warning_without_rule_mutation");
  }
  if (args.invalidationWarning) {
    codes.push("invalidation_requires_review_without_deletion");
  }
  if (args.needsMoreEvidence) codes.push("needs_more_evidence_review_cue");
  if (args.scopeOverreach) codes.push("scope_overreach_rule_review_cue");
  if (args.staleContext) codes.push("stale_context_review_cue");
  if (args.priorityPreview === "lower") codes.push("priority_hint_lowered");
  if (args.priorityPreview === "elevated") codes.push("priority_hint_elevated");
  if (args.priorityPreview === "needs_review") codes.push("priority_hint_needs_review");
  if (args.visibilityHint === "visible") codes.push("visibility_hint_visible");
  if (args.visibilityHint === "visible_with_warning") {
    codes.push("visibility_hint_visible_with_warning");
  }
  if (args.visibilityHint === "lower_priority") codes.push("visibility_hint_lower_priority");
  if (args.visibilityHint === "needs_review") codes.push("visibility_hint_needs_review");
  if (args.ruleFailureHint) codes.push("surfacing_preview_does_not_mutate_rules");
  return uniqueReasonCodes(codes);
}

function baseReasonCodes(
  extras: FeedbackInfluencedReasonCode[],
): FeedbackInfluencedReasonCode[] {
  return uniqueReasonCodes([
    "advisory_preview_only",
    "feedback_is_not_truth",
    "feedback_is_not_proof",
    "feedback_is_not_evidence",
    "feedback_is_not_promotion_readiness",
    "surfacing_preview_is_not_authority",
    "surfacing_preview_does_not_delete_candidates",
    "surfacing_preview_does_not_promote_candidates",
    "surfacing_preview_does_not_mutate_rules",
    "surfacing_preview_does_not_mutate_parser",
    "surfacing_preview_does_not_mutate_state",
    "surfacing_preview_does_not_product_write",
    "durable_state_not_mutated",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "product_write_denied",
    "provider_call_not_executed",
    "prompt_not_sent",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "source_fetch_not_executed",
    "file_read_not_executed",
    "db_write_not_executed",
    "git_ledger_export_not_executed",
    ...extras,
  ]);
}

function validateAggregateInput(value: unknown, index: number, failureCodes: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failureCodes.push(`feedback_aggregates.${index}.aggregate_not_object`);
    return;
  }
  const aggregate = value as Partial<FeedbackInfluencedAggregateInput>;
  if (aggregate.aggregate_id !== undefined) {
    validatePublicString(
      aggregate.aggregate_id,
      `feedback_aggregates.${index}.aggregate_id`,
      failureCodes,
    );
  }
  validatePublicString(
    aggregate.target_surface,
    `feedback_aggregates.${index}.target_surface`,
    failureCodes,
  );
  validatePublicString(
    aggregate.target_surface_ref,
    `feedback_aggregates.${index}.target_surface_ref`,
    failureCodes,
  );
  validatePublicString(
    aggregate.target_candidate_ref,
    `feedback_aggregates.${index}.target_candidate_ref`,
    failureCodes,
  );
  if (aggregate.feedback_event_refs !== undefined) {
    validateStringArray(
      aggregate.feedback_event_refs,
      `feedback_aggregates.${index}.feedback_event_refs`,
      failureCodes,
    );
  }
  for (const countField of aggregateCountFields) {
    validateOptionalNonNegativeInteger(
      aggregate[countField],
      `feedback_aggregates.${index}.${countField}`,
      failureCodes,
    );
  }
  if (aggregate.reason_codes !== undefined) {
    validateCompatibleReasonCodeArray(
      aggregate.reason_codes,
      `feedback_aggregates.${index}.reason_codes`,
      failureCodes,
    );
  }
  validateOptionalBooleanLiteral(
    aggregate.advisory_only,
    true,
    `feedback_aggregates.${index}.advisory_only`,
    failureCodes,
  );
  for (const field of [
    "deletes_candidate",
    "promotes_candidate",
    "mutates_rules",
    "mutates_parser",
    "mutates_durable_state",
    "product_write_executed",
  ] as const) {
    validateOptionalBooleanLiteral(
      aggregate[field],
      false,
      `feedback_aggregates.${index}.${field}`,
      failureCodes,
    );
  }
}

function validateRuleFailureCandidateInput(
  value: unknown,
  index: number,
  failureCodes: string[],
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failureCodes.push(`rule_failure_candidates.${index}.rule_failure_candidate_not_object`);
    return;
  }
  const ruleFailure = value as Partial<FeedbackInfluencedRuleFailureCandidateInput>;
  validatePublicString(
    ruleFailure.rule_failure_candidate_id,
    `rule_failure_candidates.${index}.rule_failure_candidate_id`,
    failureCodes,
  );
  if (ruleFailure.failure_kind !== undefined) {
    validatePublicString(
      ruleFailure.failure_kind,
      `rule_failure_candidates.${index}.failure_kind`,
      failureCodes,
    );
  }
  validatePublicString(
    ruleFailure.target_surface,
    `rule_failure_candidates.${index}.target_surface`,
    failureCodes,
  );
  validatePublicString(
    ruleFailure.target_surface_ref,
    `rule_failure_candidates.${index}.target_surface_ref`,
    failureCodes,
  );
  validateStringArray(
    ruleFailure.target_candidate_refs,
    `rule_failure_candidates.${index}.target_candidate_refs`,
    failureCodes,
  );
  if (ruleFailure.source_refs !== undefined) {
    validateStringArray(
      ruleFailure.source_refs,
      `rule_failure_candidates.${index}.source_refs`,
      failureCodes,
    );
  }
  if (ruleFailure.feedback_event_refs !== undefined) {
    validateStringArray(
      ruleFailure.feedback_event_refs,
      `rule_failure_candidates.${index}.feedback_event_refs`,
      failureCodes,
    );
  }
  if (ruleFailure.review_status !== undefined) {
    validatePublicString(
      ruleFailure.review_status,
      `rule_failure_candidates.${index}.review_status`,
      failureCodes,
    );
    if (
      typeof ruleFailure.review_status === "string" &&
      !compatibleRuleFailureReviewStatuses.includes(
        ruleFailure.review_status as (typeof compatibleRuleFailureReviewStatuses)[number],
      )
    ) {
      failureCodes.push(`rule_failure_candidates.${index}.review_status_unknown`);
    }
  }
  if (ruleFailure.reason_codes !== undefined) {
    validateCompatibleReasonCodeArray(
      ruleFailure.reason_codes,
      `rule_failure_candidates.${index}.reason_codes`,
      failureCodes,
    );
  }
  for (const field of [
    "mutates_rules",
    "mutates_parser",
    "mutates_durable_state",
    "promotes_candidate",
    "deletes_candidate",
    "product_write_executed",
  ] as const) {
    validateOptionalBooleanLiteral(
      ruleFailure[field],
      false,
      `rule_failure_candidates.${index}.${field}`,
      failureCodes,
    );
  }
}

function validatePublicString(value: unknown, label: string, failureCodes: string[]) {
  if (typeof value !== "string") {
    failureCodes.push(`${label}_not_string`);
    return;
  }
  if (value.length === 0) {
    failureCodes.push(`${label}_missing`);
    return;
  }
  if (unsafeTextPattern.test(value)) {
    failureCodes.push(`${label}_private_or_raw_payload`);
  }
}

function validateStringArray(value: unknown, label: string, failureCodes: string[]) {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  for (let index = 0; index < value.length; index += 1) {
    validatePublicString(value[index], `${label}.${index}`, failureCodes);
  }
}

function validateReasonCodeArray(value: unknown, label: string, failureCodes: string[]) {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  for (let index = 0; index < value.length; index += 1) {
    const reasonCode = value[index];
    if (typeof reasonCode !== "string") {
      failureCodes.push(`${label}.${index}_not_string`);
    } else if (!reasonCodes.includes(reasonCode as FeedbackInfluencedReasonCode)) {
      failureCodes.push(`${label}.${index}_unknown`);
    }
  }
}

function validateCompatibleReasonCodeArray(
  value: unknown,
  label: string,
  failureCodes: string[],
) {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  for (let index = 0; index < value.length; index += 1) {
    const reasonCode = value[index];
    validatePublicString(reasonCode, `${label}.${index}`, failureCodes);
    if (typeof reasonCode === "string" && !compatibleReasonCodes.has(reasonCode)) {
      failureCodes.push(`${label}.${index}_unknown`);
    }
  }
}

function validateOptionalNonNegativeInteger(
  value: unknown,
  label: string,
  failureCodes: string[],
) {
  if (value === undefined) return;
  if (typeof value !== "number") {
    failureCodes.push(`${label}_not_number`);
    return;
  }
  if (!Number.isFinite(value)) {
    failureCodes.push(`${label}_not_finite`);
    return;
  }
  if (!Number.isInteger(value)) {
    failureCodes.push(`${label}_not_integer`);
    return;
  }
  if (value < 0) failureCodes.push(`${label}_negative`);
}

function validateOptionalBooleanLiteral(
  value: unknown,
  expected: boolean,
  label: string,
  failureCodes: string[],
) {
  if (value === undefined) return;
  if (value !== expected) failureCodes.push(`${label}_unsafe_value`);
}

function validateAuthorityBoundaryInput(
  value: Record<string, unknown> | undefined,
  label: string,
  failureCodes: string[],
) {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failureCodes.push(`${label}_not_object`);
    return;
  }
  for (const field of forbiddenTrueAuthorityFields) {
    if (value[field] === true) failureCodes.push(`${label}.${field}_forbidden_true`);
  }
}

function collectForbiddenAuthorityFailures(
  value: unknown,
  label: string,
  failureCodes: string[],
) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      collectForbiddenAuthorityFailures(value[index], `${label}.${index}`, failureCodes);
    }
    return;
  }
  const record = value as Record<string, unknown>;
  for (const field of forbiddenTrueAuthorityFields) {
    if (record[field] === true) failureCodes.push(`${label}.${field}_forbidden_true`);
  }
  for (const [key, child] of Object.entries(record)) {
    if (child && typeof child === "object") {
      collectForbiddenAuthorityFailures(child, `${label}.${key}`, failureCodes);
    }
  }
}

function collectUnsafeObjectFailures(value: unknown, label: string, failureCodes: string[]) {
  const serialized = safeSerialize(value);
  if (!serialized) return;
  if (/\/Users\/|\/home\//.test(serialized)) failureCodes.push(`${label}_local_path_blocked`);
  if (/file:\/\//i.test(serialized)) failureCodes.push(`${label}_private_url_blocked`);
  if (/sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|private key/i.test(serialized)) {
    failureCodes.push(`${label}_secret_like_pattern_blocked`);
  }
  if (unsafeTextPattern.test(serialized)) failureCodes.push(`${label}_private_or_raw_payload`);
}

function blockedResult(
  status: "blocked_private_or_raw_payload" | "blocked_invalid_input",
  previewId: string,
  rejectedCandidateRefs: string[],
  reasonCodesForResult: FeedbackInfluencedReasonCode[],
): FeedbackInfluencedSurfacingResult {
  return {
    result_version: FEEDBACK_INFLUENCED_SURFACING_RESULT_VERSION,
    preview_version: FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION,
    scope,
    preview_id: previewId,
    status,
    items: [],
    rejected_candidate_refs: rejectedCandidateRefs,
    warnings: [
      "Feedback influenced surfacing preview blocked unsafe or invalid input.",
      "No candidate was deleted, hidden silently, promoted, mutated, or product-written.",
    ],
    reason_codes: uniqueReasonCodes(reasonCodesForResult),
    authority_boundary: createFeedbackInfluencedSurfacingAuthorityBoundaryV01(),
  };
}

function privacyReasonCodes(failureCodes: string[]): FeedbackInfluencedReasonCode[] {
  const codes: FeedbackInfluencedReasonCode[] = [];
  if (failureCodes.some((code) => code.includes("secret"))) {
    codes.push("secret_like_pattern_blocked");
  }
  if (failureCodes.some((code) => code.includes("local_path"))) {
    codes.push("local_path_blocked");
  }
  if (failureCodes.some((code) => code.includes("private_url"))) {
    codes.push("private_url_blocked");
  }
  return baseReasonCodes(codes);
}

function safePreviewId(input: unknown): string {
  if (!input || typeof input !== "object" || Array.isArray(input)) return blockedPreviewId;
  const previewId = (input as { preview_id?: unknown }).preview_id;
  if (typeof previewId !== "string" || unsafeTextPattern.test(previewId)) {
    return blockedPreviewId;
  }
  return previewId;
}

function safeRejectedCandidateRefs(input: unknown): string[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  const candidates = (input as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return [];
  return uniqueSorted(
    candidates
      .map((candidate) => {
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
          return undefined;
        }
        const candidateRef = (candidate as { candidate_ref?: unknown }).candidate_ref;
        if (typeof candidateRef !== "string" || unsafeTextPattern.test(candidateRef)) {
          return undefined;
        }
        return candidateRef;
      })
      .filter((value): value is string => Boolean(value)),
  );
}

function sumCounts(
  aggregates: FeedbackInfluencedAggregateInput[],
  key: keyof Pick<
    FeedbackInfluencedAggregateInput,
    | "pin_count"
    | "dismiss_count"
    | "correct_count"
    | "invalidate_count"
    | "needs_more_evidence_count"
    | "scope_overreach_count"
    | "not_relevant_now_count"
    | "mark_useful_count"
    | "mark_wrong_count"
  >,
): number {
  return aggregates.reduce((total, aggregate) => {
    const value = aggregate[key];
    return total + (typeof value === "number" && Number.isFinite(value) ? value : 0);
  }, 0);
}

function compareCandidates(
  left: FeedbackInfluencedCandidateInput,
  right: FeedbackInfluencedCandidateInput,
) {
  return (
    compareStrings(left.target_surface, right.target_surface) ||
    compareStrings(left.target_surface_ref, right.target_surface_ref) ||
    compareStrings(left.candidate_ref, right.candidate_ref)
  );
}

function compareAggregates(
  left: FeedbackInfluencedAggregateInput,
  right: FeedbackInfluencedAggregateInput,
) {
  return (
    compareStrings(left.target_surface, right.target_surface) ||
    compareStrings(left.target_surface_ref, right.target_surface_ref) ||
    compareStrings(left.target_candidate_ref, right.target_candidate_ref) ||
    compareStrings(left.aggregate_id ?? "", right.aggregate_id ?? "")
  );
}

function compareRuleFailureCandidates(
  left: FeedbackInfluencedRuleFailureCandidateInput,
  right: FeedbackInfluencedRuleFailureCandidateInput,
) {
  return (
    compareStrings(left.target_surface, right.target_surface) ||
    compareStrings(left.target_surface_ref, right.target_surface_ref) ||
    compareStrings(
      left.target_candidate_refs.join("\u0000"),
      right.target_candidate_refs.join("\u0000"),
    ) ||
    compareStrings(left.rule_failure_candidate_id ?? "", right.rule_failure_candidate_id ?? "")
  );
}

function compareStrings(left: string, right: string) {
  return left.localeCompare(right);
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueReasonCodes(
  values: FeedbackInfluencedReasonCode[],
): FeedbackInfluencedReasonCode[] {
  return uniqueSorted(values);
}

function stableSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "unknown";
}

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}
