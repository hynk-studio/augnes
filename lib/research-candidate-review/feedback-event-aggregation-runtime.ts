import { createHash } from "node:crypto";

export const FEEDBACK_EVENT_AGGREGATION_RUNTIME_VERSION =
  "feedback_event_aggregation_runtime.v0.1" as const;
export const FEEDBACK_EVENT_AGGREGATION_INPUT_VERSION =
  "feedback_event_aggregation_input.v0.1" as const;
export const FEEDBACK_EVENT_AGGREGATION_RESULT_VERSION =
  "feedback_event_aggregation_result.v0.1" as const;
export const FEEDBACK_EVENT_AGGREGATE_VERSION =
  "feedback_event_aggregate.v0.1" as const;
export const FEEDBACK_RULE_FAILURE_CANDIDATE_VERSION =
  "feedback_rule_failure_candidate.v0.1" as const;

const scope = "project:augnes" as const;
const blockedAggregationId = "feedback-aggregation:blocked" as const;

export type FeedbackAggregationInputEventKind =
  | "pin_preview"
  | "dismiss_preview"
  | "correct_preview"
  | "invalidate_preview"
  | "needs_more_evidence"
  | "scope_overreach"
  | "not_relevant_now"
  | "mark_useful"
  | "mark_wrong"
  | "unknown";

export type FeedbackAggregationSurface =
  | "manual_note_parser"
  | "research_candidate_review"
  | "geometry_digest"
  | "ai_context_packet"
  | "codex_handoff_draft"
  | "lifecycle_read_model"
  | "calibration_diagnostic"
  | "constellation_runtime_ui"
  | "manual_anchor_store"
  | "perspective_trajectory"
  | "durable_state_apply"
  | "unknown";

export type FeedbackAggregationStatus =
  | "aggregated"
  | "empty"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input";

export type FeedbackSurfacePriorityHint =
  | "none"
  | "lower"
  | "normal"
  | "elevated"
  | "needs_review";

export type FeedbackRuleFailureKind =
  | "parser_rule_failure"
  | "surface_scope_overreach"
  | "candidate_conflict"
  | "repeated_dismissal"
  | "repeated_correction"
  | "evidence_gap"
  | "stale_context"
  | "unknown";

export type FeedbackRuleFailureCandidateReviewStatus =
  | "candidate_only"
  | "needs_review"
  | "rejected"
  | "accepted_for_future_runtime";

export type FeedbackAggregationReasonCode =
  | "feedback_event_present"
  | "feedback_event_missing"
  | "feedback_event_kind_supported"
  | "feedback_event_kind_unknown"
  | "target_candidate_ref_present"
  | "target_candidate_ref_missing"
  | "target_surface_ref_present"
  | "target_surface_ref_missing"
  | "operator_actor_ref_present"
  | "operator_actor_ref_missing"
  | "feedback_is_advisory"
  | "feedback_is_not_truth"
  | "feedback_is_not_proof"
  | "feedback_is_not_evidence"
  | "feedback_is_not_promotion"
  | "aggregation_is_advisory"
  | "aggregation_is_not_state"
  | "aggregation_does_not_delete_candidates"
  | "aggregation_does_not_promote"
  | "aggregation_does_not_mutate_rules"
  | "aggregation_does_not_product_write"
  | "pin_counted"
  | "dismiss_counted"
  | "correction_counted"
  | "invalidation_counted"
  | "needs_more_evidence_counted"
  | "scope_overreach_counted"
  | "not_relevant_now_counted"
  | "useful_counted"
  | "wrong_counted"
  | "priority_hint_lowered"
  | "priority_hint_elevated"
  | "operator_review_required"
  | "rule_failure_candidate_created"
  | "evidence_gap_review_cue_created"
  | "stale_context_review_cue_created"
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

export interface FeedbackAggregationAuthorityBoundary {
  feedback_aggregation_runtime_now: true;
  advisory_read_model_only: true;
  feedback_write_now: false;
  candidate_mutation_now: false;
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
  aggregation_is_authority: false;
  product_write_authority: false;
}

export interface FeedbackAggregationInputEvent {
  event_version: typeof FEEDBACK_EVENT_AGGREGATION_INPUT_VERSION;
  scope: typeof scope;
  feedback_event_id: string;
  event_kind: FeedbackAggregationInputEventKind;
  target_surface: FeedbackAggregationSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  target_source_refs: string[];
  target_review_record_refs: string[];
  operator_actor_ref: string;
  bounded_feedback_summary: string;
  created_at: string;
  public_safe: boolean;
  reason_codes: FeedbackAggregationReasonCode[];
}

export interface FeedbackRuleFailureCandidate {
  candidate_version: typeof FEEDBACK_RULE_FAILURE_CANDIDATE_VERSION;
  scope: typeof scope;
  rule_failure_candidate_id: string;
  failure_kind: FeedbackRuleFailureKind;
  target_surface: FeedbackAggregationSurface;
  target_surface_ref: string;
  target_candidate_refs: string[];
  bounded_summary: string;
  review_status: FeedbackRuleFailureCandidateReviewStatus;
  source_refs: string[];
  feedback_event_refs: string[];
  reason_codes: FeedbackAggregationReasonCode[];
  authority_boundary: FeedbackAggregationAuthorityBoundary;
}

export interface FeedbackEventAggregate {
  aggregate_version: typeof FEEDBACK_EVENT_AGGREGATE_VERSION;
  scope: typeof scope;
  aggregate_id: string;
  target_surface: FeedbackAggregationSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  feedback_event_refs: string[];
  pin_count: number;
  dismiss_count: number;
  correct_count: number;
  invalidate_count: number;
  needs_more_evidence_count: number;
  scope_overreach_count: number;
  not_relevant_now_count: number;
  mark_useful_count: number;
  mark_wrong_count: number;
  last_feedback_at: string;
  current_surface_priority_hint: FeedbackSurfacePriorityHint;
  advisory_only: true;
  deletes_candidate: false;
  promotes_candidate: false;
  mutates_rules: false;
  mutates_parser: false;
  mutates_durable_state: false;
  product_write_executed: false;
  rule_failure_candidates: FeedbackRuleFailureCandidate[];
  reason_codes: FeedbackAggregationReasonCode[];
  authority_boundary: FeedbackAggregationAuthorityBoundary;
}

export interface FeedbackEventAggregationInput {
  input_version: typeof FEEDBACK_EVENT_AGGREGATION_INPUT_VERSION;
  runtime_version: typeof FEEDBACK_EVENT_AGGREGATION_RUNTIME_VERSION;
  scope: typeof scope;
  aggregation_id: string;
  as_of: string;
  input_events: FeedbackAggregationInputEvent[];
  boundary_notes: string[];
  reason_codes: FeedbackAggregationReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface FeedbackEventAggregationResult {
  result_version: typeof FEEDBACK_EVENT_AGGREGATION_RESULT_VERSION;
  runtime_version: typeof FEEDBACK_EVENT_AGGREGATION_RUNTIME_VERSION;
  scope: typeof scope;
  aggregation_id: string;
  status: FeedbackAggregationStatus;
  aggregates: FeedbackEventAggregate[];
  rule_failure_candidates: FeedbackRuleFailureCandidate[];
  rejected_event_refs: string[];
  warnings: string[];
  reason_codes: FeedbackAggregationReasonCode[];
  authority_boundary: FeedbackAggregationAuthorityBoundary;
}

export interface FeedbackEventAggregationValidationResult {
  passed: boolean;
  failure_codes: string[];
}

type CountState = {
  pin_count: number;
  dismiss_count: number;
  correct_count: number;
  invalidate_count: number;
  needs_more_evidence_count: number;
  scope_overreach_count: number;
  not_relevant_now_count: number;
  mark_useful_count: number;
  mark_wrong_count: number;
  unknown_count: number;
};

type FeedbackEventGroup = {
  target_surface: FeedbackAggregationSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  events: FeedbackAggregationInputEvent[];
};

const inputEventKinds: FeedbackAggregationInputEventKind[] = [
  "pin_preview",
  "dismiss_preview",
  "correct_preview",
  "invalidate_preview",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
  "unknown",
];

const surfaces: FeedbackAggregationSurface[] = [
  "manual_note_parser",
  "research_candidate_review",
  "geometry_digest",
  "ai_context_packet",
  "codex_handoff_draft",
  "lifecycle_read_model",
  "calibration_diagnostic",
  "constellation_runtime_ui",
  "manual_anchor_store",
  "perspective_trajectory",
  "durable_state_apply",
  "unknown",
];

const reasonCodes: FeedbackAggregationReasonCode[] = [
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
];

const forbiddenTrueAuthorityFields = [
  "feedback_write_now",
  "candidate_mutation_now",
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
  "aggregation_is_authority",
  "product_write_authority",
] as const;

const unsafeTextPattern =
  /(\/Users\/|\/home\/|file:\/\/|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|private key|raw provider output|raw retrieval output|raw feedback payload|raw feedback aggregation payload|raw conversation|hidden reasoning|raw DB row|raw_db_row|browser dump|raw browser dump|raw source body|actual prompt:|provider response:|actual query:|embedding vector:|vector index dump:|secret-like feedback aggregation input)/i;

export function aggregateFeedbackEventsV01(
  input: FeedbackEventAggregationInput,
): FeedbackEventAggregationResult {
  const validation = validateFeedbackEventAggregationInputV01(input);
  if (!validation.passed) {
    const hasPrivateFailure = validation.failure_codes.some((code) =>
      /private|raw|secret|local_path|private_url/.test(code),
    );
    return emptyResult(
      hasPrivateFailure ? "blocked_private_or_raw_payload" : "blocked_invalid_input",
      safeAggregationId(input),
      hasPrivateFailure
        ? ["private_or_raw_payload_blocked"]
        : ["feedback_event_missing", "aggregation_is_advisory"],
      safeRejectedEventRefs(input),
    );
  }

  const events = [...input.input_events].sort(compareEvents);
  if (events.length === 0) {
    return emptyResult("empty", input.aggregation_id, ["feedback_event_missing"], []);
  }

  const groups = groupEvents(events);
  const aggregates = groups.map(buildAggregate).sort(compareAggregates);
  const ruleFailureCandidates = aggregates
    .flatMap((aggregate) => aggregate.rule_failure_candidates)
    .sort(compareRuleFailureCandidates);

  return {
    result_version: FEEDBACK_EVENT_AGGREGATION_RESULT_VERSION,
    runtime_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_VERSION,
    scope,
    aggregation_id: input.aggregation_id,
    status: "aggregated",
    aggregates,
    rule_failure_candidates: ruleFailureCandidates,
    rejected_event_refs: [],
    warnings: [
      "Aggregation is advisory only.",
      "Feedback is not truth.",
      "Feedback aggregation does not mutate candidates, rules, parser behavior, durable state, or product state.",
    ],
    reason_codes: uniqueReasonCodes([
      "feedback_event_present",
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
    ]),
    authority_boundary: createFeedbackAggregationAuthorityBoundaryV01(),
  };
}

export function validateFeedbackEventAggregationInputV01(
  input: unknown,
): FeedbackEventAggregationValidationResult {
  const failureCodes: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }

  const value = input as Partial<FeedbackEventAggregationInput>;
  if (value.input_version !== FEEDBACK_EVENT_AGGREGATION_INPUT_VERSION) {
    failureCodes.push("invalid_input_version");
  }
  if (value.runtime_version !== FEEDBACK_EVENT_AGGREGATION_RUNTIME_VERSION) {
    failureCodes.push("invalid_runtime_version");
  }
  if (value.scope !== scope) failureCodes.push("invalid_scope");
  validatePublicString(value.aggregation_id, "aggregation_id", failureCodes);
  validatePublicString(value.as_of, "as_of", failureCodes);
  validateStringArray(value.boundary_notes, "boundary_notes", failureCodes);
  validateReasonCodeArray(value.reason_codes, "reason_codes", failureCodes);
  validateAuthorityBoundaryInput(value.authority_boundary, "authority_boundary", failureCodes);
  collectUnsafeObjectFailures(value, "input", failureCodes);

  if (!Array.isArray(value.input_events)) {
    failureCodes.push("input_events_missing");
  } else {
    for (let index = 0; index < value.input_events.length; index += 1) {
      const eventValidation = validateFeedbackAggregationInputEventV01(
        value.input_events[index],
      );
      for (const code of eventValidation.failure_codes) {
        failureCodes.push(`input_events.${index}.${code}`);
      }
    }
  }

  return { passed: failureCodes.length === 0, failure_codes: failureCodes };
}

export function validateFeedbackAggregationInputEventV01(
  event: unknown,
): FeedbackEventAggregationValidationResult {
  const failureCodes: string[] = [];
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return { passed: false, failure_codes: ["event_not_object"] };
  }

  const value = event as Partial<FeedbackAggregationInputEvent>;
  if (value.event_version !== FEEDBACK_EVENT_AGGREGATION_INPUT_VERSION) {
    failureCodes.push("invalid_event_version");
  }
  if (value.scope !== scope) failureCodes.push("invalid_scope");
  if (!inputEventKinds.includes(value.event_kind as FeedbackAggregationInputEventKind)) {
    failureCodes.push("invalid_event_kind");
  }
  if (!surfaces.includes(value.target_surface as FeedbackAggregationSurface)) {
    failureCodes.push("invalid_target_surface");
  }
  validatePublicString(value.feedback_event_id, "feedback_event_id", failureCodes);
  validatePublicString(value.target_surface_ref, "target_surface_ref", failureCodes);
  validatePublicString(value.target_candidate_ref, "target_candidate_ref", failureCodes);
  validateStringArray(value.target_source_refs, "target_source_refs", failureCodes);
  validateStringArray(
    value.target_review_record_refs,
    "target_review_record_refs",
    failureCodes,
  );
  validatePublicString(value.operator_actor_ref, "operator_actor_ref", failureCodes);
  validatePublicString(value.bounded_feedback_summary, "bounded_feedback_summary", failureCodes);
  validatePublicString(value.created_at, "created_at", failureCodes);
  if (value.public_safe !== true) failureCodes.push("public_safe_false");
  validateReasonCodeArray(value.reason_codes, "reason_codes", failureCodes);
  collectUnsafeObjectFailures(value, "event", failureCodes);

  if (value.target_candidate_ref === "") failureCodes.push("target_candidate_ref_missing");
  if (value.target_surface_ref === "") failureCodes.push("target_surface_ref_missing");
  if (value.operator_actor_ref === "") failureCodes.push("operator_actor_ref_missing");

  return { passed: failureCodes.length === 0, failure_codes: failureCodes };
}

export function createFeedbackAggregationAuthorityBoundaryV01(): FeedbackAggregationAuthorityBoundary {
  return {
    feedback_aggregation_runtime_now: true,
    advisory_read_model_only: true,
    feedback_write_now: false,
    candidate_mutation_now: false,
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
    aggregation_is_authority: false,
    product_write_authority: false,
  };
}

export function createFeedbackRuleFailureCandidateV01(args: {
  failure_kind: FeedbackRuleFailureKind;
  target_surface: FeedbackAggregationSurface;
  target_surface_ref: string;
  target_candidate_refs: string[];
  source_refs: string[];
  feedback_event_refs: string[];
  bounded_summary: string;
  reason_codes: FeedbackAggregationReasonCode[];
}): FeedbackRuleFailureCandidate {
  const sourceRefs = uniqueSorted(args.source_refs);
  const feedbackEventRefs = uniqueSorted(args.feedback_event_refs);
  const candidateRefs = uniqueSorted(args.target_candidate_refs);
  return {
    candidate_version: FEEDBACK_RULE_FAILURE_CANDIDATE_VERSION,
    scope,
    rule_failure_candidate_id: `feedback-rule-failure:${hashStable({
      failure_kind: args.failure_kind,
      target_surface: args.target_surface,
      target_surface_ref: args.target_surface_ref,
      target_candidate_refs: candidateRefs,
      feedback_event_refs: feedbackEventRefs,
    })}`,
    failure_kind: args.failure_kind,
    target_surface: args.target_surface,
    target_surface_ref: args.target_surface_ref,
    target_candidate_refs: candidateRefs,
    bounded_summary: args.bounded_summary,
    review_status: "candidate_only",
    source_refs: sourceRefs,
    feedback_event_refs: feedbackEventRefs,
    reason_codes: uniqueReasonCodes([
      "feedback_is_advisory",
      "aggregation_is_advisory",
      "rule_failure_candidate_created",
      "aggregation_does_not_mutate_rules",
      "aggregation_does_not_delete_candidates",
      "aggregation_does_not_promote",
      ...args.reason_codes,
    ]),
    authority_boundary: createFeedbackAggregationAuthorityBoundaryV01(),
  };
}

export function createFeedbackAggregateIdV01(
  event: Pick<
    FeedbackAggregationInputEvent,
    "target_surface" | "target_surface_ref" | "target_candidate_ref"
  >,
): string {
  return `feedback-aggregate:${hashStable({
    target_surface: event.target_surface,
    target_surface_ref: event.target_surface_ref,
    target_candidate_ref: event.target_candidate_ref,
  })}`;
}

function buildAggregate(group: FeedbackEventGroup): FeedbackEventAggregate {
  const counts = countEvents(group.events);
  const aggregateId = createFeedbackAggregateIdV01(group);
  const feedbackEventRefs = group.events.map((event) => event.feedback_event_id).sort();
  const sourceRefs = uniqueSorted(group.events.flatMap((event) => event.target_source_refs));
  const priorityHint = determinePriorityHint(counts);
  const reasonCodes = aggregateReasonCodes(group.events, counts, priorityHint);
  const ruleFailureCandidates = createRuleFailureCandidates(
    group,
    counts,
    sourceRefs,
    feedbackEventRefs,
  );

  return {
    aggregate_version: FEEDBACK_EVENT_AGGREGATE_VERSION,
    scope,
    aggregate_id: aggregateId,
    target_surface: group.target_surface,
    target_surface_ref: group.target_surface_ref,
    target_candidate_ref: group.target_candidate_ref,
    feedback_event_refs: feedbackEventRefs,
    pin_count: counts.pin_count,
    dismiss_count: counts.dismiss_count,
    correct_count: counts.correct_count,
    invalidate_count: counts.invalidate_count,
    needs_more_evidence_count: counts.needs_more_evidence_count,
    scope_overreach_count: counts.scope_overreach_count,
    not_relevant_now_count: counts.not_relevant_now_count,
    mark_useful_count: counts.mark_useful_count,
    mark_wrong_count: counts.mark_wrong_count,
    last_feedback_at: maxString(group.events.map((event) => event.created_at)),
    current_surface_priority_hint: priorityHint,
    advisory_only: true,
    deletes_candidate: false,
    promotes_candidate: false,
    mutates_rules: false,
    mutates_parser: false,
    mutates_durable_state: false,
    product_write_executed: false,
    rule_failure_candidates: ruleFailureCandidates,
    reason_codes: reasonCodes,
    authority_boundary: createFeedbackAggregationAuthorityBoundaryV01(),
  };
}

function createRuleFailureCandidates(
  group: FeedbackEventGroup,
  counts: CountState,
  sourceRefs: string[],
  feedbackEventRefs: string[],
): FeedbackRuleFailureCandidate[] {
  const candidates: FeedbackRuleFailureCandidate[] = [];
  const base = {
    target_surface: group.target_surface,
    target_surface_ref: group.target_surface_ref,
    target_candidate_refs: [group.target_candidate_ref],
    source_refs: sourceRefs,
    feedback_event_refs: feedbackEventRefs,
  };

  if (counts.mark_wrong_count > 0) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "parser_rule_failure",
        bounded_summary: "Wrong-mark feedback creates a parser rule failure review candidate.",
        reason_codes: ["wrong_counted", "operator_review_required"],
      }),
    );
  }
  if (counts.scope_overreach_count > 0) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "surface_scope_overreach",
        bounded_summary: "Scope-overreach feedback creates a surface scope review candidate.",
        reason_codes: ["scope_overreach_counted", "operator_review_required"],
      }),
    );
  }
  if (counts.invalidate_count > 0) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "candidate_conflict",
        bounded_summary: "Invalidation feedback creates a candidate conflict review candidate.",
        reason_codes: ["invalidation_counted", "operator_review_required"],
      }),
    );
  }
  if (counts.dismiss_count >= 2) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "repeated_dismissal",
        bounded_summary: "Repeated dismissals create a candidate-only review cue.",
        reason_codes: ["dismiss_counted", "priority_hint_lowered"],
      }),
    );
  }
  if (counts.correct_count >= 2) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "repeated_correction",
        bounded_summary: "Repeated corrections create a candidate-only rule review cue.",
        reason_codes: ["correction_counted", "operator_review_required"],
      }),
    );
  }
  if (counts.needs_more_evidence_count > 0) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "evidence_gap",
        bounded_summary: "Needs-more-evidence feedback creates an evidence gap review cue.",
        reason_codes: [
          "needs_more_evidence_counted",
          "evidence_gap_review_cue_created",
          "operator_review_required",
        ],
      }),
    );
  }
  if (
    counts.not_relevant_now_count > 0 ||
    group.events.some((event) => event.reason_codes.includes("stale_context_review_cue_created"))
  ) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "stale_context",
        bounded_summary: "Not-relevant-now feedback creates a stale context review cue.",
        reason_codes: [
          "not_relevant_now_counted",
          "stale_context_review_cue_created",
          "operator_review_required",
        ],
      }),
    );
  }
  if (counts.unknown_count > 0) {
    candidates.push(
      createFeedbackRuleFailureCandidateV01({
        ...base,
        failure_kind: "unknown",
        bounded_summary: "Unknown feedback kind remains a candidate-only review aid.",
        reason_codes: ["feedback_event_kind_unknown", "operator_review_required"],
      }),
    );
  }

  return candidates.sort(compareRuleFailureCandidates);
}

function aggregateReasonCodes(
  events: FeedbackAggregationInputEvent[],
  counts: CountState,
  priorityHint: FeedbackSurfacePriorityHint,
): FeedbackAggregationReasonCode[] {
  const codes: FeedbackAggregationReasonCode[] = [
    "feedback_event_present",
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
    "target_candidate_ref_present",
    "target_surface_ref_present",
    "operator_actor_ref_present",
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
  if (events.some((event) => event.event_kind === "unknown")) {
    codes.push("feedback_event_kind_unknown");
  } else {
    codes.push("feedback_event_kind_supported");
  }
  if (counts.pin_count > 0) codes.push("pin_counted");
  if (counts.dismiss_count > 0) codes.push("dismiss_counted");
  if (counts.correct_count > 0) codes.push("correction_counted");
  if (counts.invalidate_count > 0) codes.push("invalidation_counted");
  if (counts.needs_more_evidence_count > 0) {
    codes.push("needs_more_evidence_counted", "evidence_gap_review_cue_created");
  }
  if (counts.scope_overreach_count > 0) codes.push("scope_overreach_counted");
  if (counts.not_relevant_now_count > 0) {
    codes.push("not_relevant_now_counted", "stale_context_review_cue_created");
  }
  if (counts.mark_useful_count > 0) codes.push("useful_counted");
  if (counts.mark_wrong_count > 0) codes.push("wrong_counted");
  if (priorityHint === "lower") codes.push("priority_hint_lowered");
  if (priorityHint === "elevated") codes.push("priority_hint_elevated");
  if (priorityHint === "needs_review") codes.push("operator_review_required");
  if (createsRuleFailureCandidate(counts)) codes.push("rule_failure_candidate_created");
  return uniqueReasonCodes(codes);
}

function determinePriorityHint(counts: CountState): FeedbackSurfacePriorityHint {
  const total =
    counts.pin_count +
    counts.dismiss_count +
    counts.correct_count +
    counts.invalidate_count +
    counts.needs_more_evidence_count +
    counts.scope_overreach_count +
    counts.not_relevant_now_count +
    counts.mark_useful_count +
    counts.mark_wrong_count +
    counts.unknown_count;
  if (total === 0) return "none";
  if (
    counts.correct_count > 0 ||
    counts.invalidate_count > 0 ||
    counts.needs_more_evidence_count > 0 ||
    counts.scope_overreach_count > 0
  ) {
    return "needs_review";
  }
  const negative = counts.dismiss_count + counts.mark_wrong_count + counts.not_relevant_now_count;
  const positive = counts.pin_count + counts.mark_useful_count;
  if (negative > positive) return "lower";
  if (positive > negative) return "elevated";
  return "normal";
}

function createsRuleFailureCandidate(counts: CountState): boolean {
  return (
    counts.mark_wrong_count > 0 ||
    counts.scope_overreach_count > 0 ||
    counts.invalidate_count > 0 ||
    counts.dismiss_count >= 2 ||
    counts.correct_count >= 2 ||
    counts.needs_more_evidence_count > 0 ||
    counts.not_relevant_now_count > 0 ||
    counts.unknown_count > 0
  );
}

function countEvents(events: FeedbackAggregationInputEvent[]): CountState {
  const counts: CountState = {
    pin_count: 0,
    dismiss_count: 0,
    correct_count: 0,
    invalidate_count: 0,
    needs_more_evidence_count: 0,
    scope_overreach_count: 0,
    not_relevant_now_count: 0,
    mark_useful_count: 0,
    mark_wrong_count: 0,
    unknown_count: 0,
  };
  for (const event of events) {
    if (event.event_kind === "pin_preview") counts.pin_count += 1;
    else if (event.event_kind === "dismiss_preview") counts.dismiss_count += 1;
    else if (event.event_kind === "correct_preview") counts.correct_count += 1;
    else if (event.event_kind === "invalidate_preview") counts.invalidate_count += 1;
    else if (event.event_kind === "needs_more_evidence") {
      counts.needs_more_evidence_count += 1;
    } else if (event.event_kind === "scope_overreach") {
      counts.scope_overreach_count += 1;
    } else if (event.event_kind === "not_relevant_now") {
      counts.not_relevant_now_count += 1;
    } else if (event.event_kind === "mark_useful") counts.mark_useful_count += 1;
    else if (event.event_kind === "mark_wrong") counts.mark_wrong_count += 1;
    else counts.unknown_count += 1;
  }
  return counts;
}

function groupEvents(events: FeedbackAggregationInputEvent[]): FeedbackEventGroup[] {
  const groups = new Map<string, FeedbackEventGroup>();
  for (const event of events) {
    const key = [
      event.target_surface,
      event.target_surface_ref,
      event.target_candidate_ref,
    ].join("\u0000");
    const existing = groups.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.set(key, {
        target_surface: event.target_surface,
        target_surface_ref: event.target_surface_ref,
        target_candidate_ref: event.target_candidate_ref,
        events: [event],
      });
    }
  }
  return [...groups.values()].sort((left, right) =>
    compareStrings(createFeedbackAggregateIdV01(left), createFeedbackAggregateIdV01(right)),
  );
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
    } else if (!reasonCodes.includes(reasonCode as FeedbackAggregationReasonCode)) {
      failureCodes.push(`${label}.${index}_unknown`);
    }
  }
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

function emptyResult(
  status: FeedbackAggregationStatus,
  aggregationId: string,
  reasonCodesForResult: FeedbackAggregationReasonCode[],
  rejectedEventRefs: string[],
): FeedbackEventAggregationResult {
  return {
    result_version: FEEDBACK_EVENT_AGGREGATION_RESULT_VERSION,
    runtime_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_VERSION,
    scope,
    aggregation_id: aggregationId,
    status,
    aggregates: [],
    rule_failure_candidates: [],
    rejected_event_refs: rejectedEventRefs,
    warnings:
      status === "empty"
        ? ["No feedback events were provided."]
        : ["Feedback aggregation input was blocked before aggregation."],
    reason_codes: uniqueReasonCodes([
      "feedback_is_advisory",
      "aggregation_is_advisory",
      "aggregation_is_not_state",
      "aggregation_does_not_delete_candidates",
      "aggregation_does_not_promote",
      "aggregation_does_not_mutate_rules",
      "aggregation_does_not_product_write",
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
      ...reasonCodesForResult,
    ]),
    authority_boundary: createFeedbackAggregationAuthorityBoundaryV01(),
  };
}

function safeAggregationId(input: FeedbackEventAggregationInput): string {
  return typeof input?.aggregation_id === "string" &&
    input.aggregation_id.length > 0 &&
    !unsafeTextPattern.test(input.aggregation_id)
    ? input.aggregation_id
    : blockedAggregationId;
}

function safeRejectedEventRefs(input: FeedbackEventAggregationInput): string[] {
  if (!Array.isArray(input?.input_events)) return [];
  return uniqueSorted(
    input.input_events
      .map((event) =>
        event &&
        typeof event === "object" &&
        !Array.isArray(event) &&
        typeof (event as Partial<FeedbackAggregationInputEvent>).feedback_event_id ===
          "string" &&
        !unsafeTextPattern.test(
          (event as Partial<FeedbackAggregationInputEvent>).feedback_event_id!,
        )
          ? (event as Partial<FeedbackAggregationInputEvent>).feedback_event_id!
          : null,
      )
      .filter((value): value is string => Boolean(value)),
  );
}

function compareEvents(
  left: FeedbackAggregationInputEvent,
  right: FeedbackAggregationInputEvent,
): number {
  return (
    compareStrings(left.created_at, right.created_at) ||
    compareStrings(left.feedback_event_id, right.feedback_event_id)
  );
}

function compareAggregates(
  left: FeedbackEventAggregate,
  right: FeedbackEventAggregate,
): number {
  return compareStrings(left.aggregate_id, right.aggregate_id);
}

function compareRuleFailureCandidates(
  left: FeedbackRuleFailureCandidate,
  right: FeedbackRuleFailureCandidate,
): number {
  return compareStrings(left.rule_failure_candidate_id, right.rule_failure_candidate_id);
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function maxString(values: string[]): string {
  return values.reduce((max, value) => (value > max ? value : max), "");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function uniqueReasonCodes(
  values: FeedbackAggregationReasonCode[],
): FeedbackAggregationReasonCode[] {
  return [...new Set(values)].sort();
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}
