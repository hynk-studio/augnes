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

export const FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION =
  "feedback_event_aggregation_runtime_completion.v0.1" as const;
export const FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_REQUEST_VERSION =
  "feedback_event_aggregation_runtime_completion_request.v0.1" as const;
export const FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_ROUTE_VERSION =
  "feedback_event_aggregation_runtime_completion_route.v0.1" as const;

export type FeedbackEventAggregationRuntimeCompletionStatusV01 =
  | "aggregated"
  | "empty"
  | "db_missing"
  | "schema_missing"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";

export type FeedbackEventAggregationRuntimeCompletionKindV01 =
  | "pin"
  | "dismiss"
  | "correct"
  | "invalidate"
  | "needs_more_evidence"
  | "scope_overreach"
  | "not_relevant_now"
  | "mark_useful"
  | "mark_wrong";

export type FeedbackEventAggregationRuntimeCompletionTargetLayerV01 =
  | "candidate"
  | "review_memory"
  | "durable_perspective_state"
  | "source_ref"
  | "provider_candidate"
  | "retrieval_context"
  | "layout_surface"
  | "unknown";

export type FeedbackEventAggregationRuntimeCompletionPriorityHintV01 =
  | "keep_visible"
  | "lower_priority"
  | "raise_priority_for_review"
  | "needs_more_evidence"
  | "needs_operator_review"
  | "no_change"
  | "blocked";

interface FeedbackEventAggregationStatementV01 {
  get?: (...values: unknown[]) => unknown;
  all?: (...values: unknown[]) => unknown[];
  run?: (...values: unknown[]) => { changes?: number };
}

export interface FeedbackEventAggregationSqliteLikeV01 {
  exec?: (sql: string) => unknown;
  prepare(sql: string): FeedbackEventAggregationStatementV01;
}

export interface FeedbackEventAggregationRuntimeCompletionEventRecordV01 {
  feedback_event_id: string;
  scope: typeof scope;
  target_ref: string;
  target_kind: string;
  target_layer: FeedbackEventAggregationRuntimeCompletionTargetLayerV01;
  feedback_kind: FeedbackEventAggregationRuntimeCompletionKindV01;
  feedback_value?: string;
  feedback_summary: string;
  source_ref?: string;
  source_refs?: string[];
  candidate_ref?: string;
  durable_ref?: string;
  created_by: string;
  created_at: string;
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface FeedbackEventAggregationRuntimeCompletionInputV01 {
  request_version: typeof FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_REQUEST_VERSION;
  aggregation_version: typeof FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION;
  scope: typeof scope;
  aggregation_request_id: string;
  requested_by: string;
  requested_at: string;
  db_path?: string;
  filters?: {
    target_ref?: string;
    target_kind?: string;
    target_layer?: FeedbackEventAggregationRuntimeCompletionTargetLayerV01;
    feedback_kind?: FeedbackEventAggregationRuntimeCompletionKindV01;
    limit?: number;
  };
  feedback_events?: FeedbackEventAggregationRuntimeCompletionEventRecordV01[];
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface FeedbackEventAggregationRuntimeCompletionRuleFailureCandidateV01 {
  rule_failure_candidate_ref: string;
  affected_surface: string;
  observed_pattern: string;
  proposed_rule_change_summary: string;
  expected_benefit: string;
  risk_note: string;
  review_required: true;
  rule_mutation_executed: false;
  authority_boundary: FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01;
}

export interface FeedbackEventAggregationRuntimeCompletionSourceVisibilityWarningV01 {
  warning_ref: string;
  target_ref: string;
  source_refs: string[];
  feedback_event_refs: string[];
  warning_summary: string;
  source_visibility_preserved: true;
  invalidate_is_source_suppression: false;
  authority_boundary: FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01;
}

export interface FeedbackEventAggregationRuntimeCompletionBoundaryNoteV01 {
  note_ref: string;
  target_ref: string;
  target_layer: FeedbackEventAggregationRuntimeCompletionTargetLayerV01;
  candidate_ref: string | null;
  durable_ref: string | null;
  boundary_summary: string;
  candidate_durable_distinction_preserved: true;
  authority_boundary: FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01;
}

export interface FeedbackEventAggregationRuntimeCompletionAggregateV01 {
  aggregation_version: typeof FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION;
  scope: typeof scope;
  target_ref: string;
  target_kind: string;
  target_layer: FeedbackEventAggregationRuntimeCompletionTargetLayerV01;
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
  feedback_event_refs: string[];
  current_surface_priority_hint: FeedbackEventAggregationRuntimeCompletionPriorityHintV01;
  rule_failure_candidates: FeedbackEventAggregationRuntimeCompletionRuleFailureCandidateV01[];
  source_visibility_warnings: FeedbackEventAggregationRuntimeCompletionSourceVisibilityWarningV01[];
  candidate_durable_boundary_notes: FeedbackEventAggregationRuntimeCompletionBoundaryNoteV01[];
  advisory_only: true;
  feedback_is_truth: false;
  pin_is_promotion: false;
  dismiss_is_delete: false;
  invalidate_is_source_suppression: false;
  rule_failure_candidate_is_rule_mutation: false;
  product_write_executed: false;
  authority_boundary: FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01;
  reason_codes: string[];
}

export interface FeedbackEventAggregationRuntimeCompletionResultV01 {
  aggregation_version: typeof FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION;
  scope: typeof scope;
  aggregation_request_id: string;
  status: FeedbackEventAggregationRuntimeCompletionStatusV01;
  aggregations: FeedbackEventAggregationRuntimeCompletionAggregateV01[];
  feedback_event_refs: string[];
  rule_failure_candidates: FeedbackEventAggregationRuntimeCompletionRuleFailureCandidateV01[];
  source_visibility_warnings: FeedbackEventAggregationRuntimeCompletionSourceVisibilityWarningV01[];
  candidate_durable_boundary_notes: FeedbackEventAggregationRuntimeCompletionBoundaryNoteV01[];
  advisory_only: true;
  feedback_is_truth: false;
  pin_is_promotion: false;
  dismiss_is_delete: false;
  invalidate_is_source_suppression: false;
  rule_failure_candidate_is_rule_mutation: false;
  product_write_executed: false;
  authority_boundary: FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01;
  reason_codes: string[];
}

export interface FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01 {
  feedback_event_aggregation_runtime_now: true;
  explicit_operator_aggregation_only: true;
  caller_injected_db_only: true;
  db_query_now: boolean;
  aggregation_read_now: true;
  advisory_result_only: true;
  rule_failure_candidate_preview_now: true;
  candidate_durable_boundary_visible: true;
  source_visibility_warning_visible: true;
  feedback_is_truth: false;
  pin_is_promotion: false;
  dismiss_is_delete: false;
  invalidate_is_source_suppression: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  prompt_mutation_now: false;
  ranking_mutation_now: false;
  surfacing_mutation_now: false;
  source_suppression_now: false;
  candidate_delete_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  rag_answer_generation_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

const completionFeedbackKinds: FeedbackEventAggregationRuntimeCompletionKindV01[] = [
  "pin",
  "dismiss",
  "correct",
  "invalidate",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
];

const completionTargetLayers: FeedbackEventAggregationRuntimeCompletionTargetLayerV01[] = [
  "candidate",
  "review_memory",
  "durable_perspective_state",
  "source_ref",
  "provider_candidate",
  "retrieval_context",
  "layout_surface",
  "unknown",
];

const completionForbiddenAuthorityFields = new Set([
  "feedback_is_truth",
  "pin_is_promotion",
  "dismiss_is_delete",
  "invalidate_is_source_suppression",
  "rule_mutation_now",
  "parser_mutation_now",
  "prompt_mutation_now",
  "ranking_mutation_now",
  "surfacing_mutation_now",
  "source_suppression_now",
  "candidate_delete_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "rag_answer_generation_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
]);

const completionUnsafePattern =
  /(SAFE_MARKER_|\/Users\/|\/home\/|file:\/\/|https:\/\/localhost|http:\/\/localhost|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|private key|raw provider output|raw retrieval output|raw feedback payload|raw feedback aggregation payload|raw conversation|hidden reasoning|raw DB row|raw_db_row|browser dump|raw browser dump|raw source body|actual prompt:|provider response:|actual query:|embedding vector:|vector index dump:|telemetry dump|raw diff)/i;

const feedbackEventAggregationStoreTableNameV01 = "research_candidate_feedback_events";

export const feedbackEventAggregationRuntimeCompletionSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS research_candidate_feedback_events (
  event_id TEXT PRIMARY KEY,
  event_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_fingerprint TEXT,
  source_ref_ids_json TEXT NOT NULL,
  operator_note TEXT,
  correction_text TEXT,
  reason TEXT,
  created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  authority_boundary_json TEXT NOT NULL,
  event_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_event_type
  ON research_candidate_feedback_events(event_type);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_target
  ON research_candidate_feedback_events(target_kind, target_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_created_at
  ON research_candidate_feedback_events(created_at);
`.trim();

export function createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01(
  options: { dbQueryNow?: boolean } = {},
): FeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01 {
  return {
    feedback_event_aggregation_runtime_now: true,
    explicit_operator_aggregation_only: true,
    caller_injected_db_only: true,
    db_query_now: options.dbQueryNow === true,
    aggregation_read_now: true,
    advisory_result_only: true,
    rule_failure_candidate_preview_now: true,
    candidate_durable_boundary_visible: true,
    source_visibility_warning_visible: true,
    feedback_is_truth: false,
    pin_is_promotion: false,
    dismiss_is_delete: false,
    invalidate_is_source_suppression: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    prompt_mutation_now: false,
    ranking_mutation_now: false,
    surfacing_mutation_now: false,
    source_suppression_now: false,
    candidate_delete_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    rag_answer_generation_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function ensureFeedbackEventAggregationRuntimeCompletionSchemaV01(
  db: FeedbackEventAggregationSqliteLikeV01,
): void {
  db.exec?.(feedbackEventAggregationRuntimeCompletionSchemaSqlV01);
}

export function feedbackEventAggregationRuntimeCompletionSchemaExistsV01(
  db: FeedbackEventAggregationSqliteLikeV01,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
    )
    .get?.(feedbackEventAggregationStoreTableNameV01);
  return Boolean(row);
}

export function isSafeFeedbackEventAggregationRuntimeDbPathV01(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 220) return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (!/^(tmp|\.tmp)\/feedback-event-aggregation\/[A-Za-z0-9._/-]+$/.test(value)) {
    return false;
  }
  if (
    value.startsWith("/") ||
    value.includes("..") ||
    value.includes("\\") ||
    value.includes("\0") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    completionUnsafePattern.test(value)
  ) {
    return false;
  }
  return true;
}

export function insertFeedbackEventAggregationRuntimeCompletionEventV01(
  event: FeedbackEventAggregationRuntimeCompletionEventRecordV01,
  db: FeedbackEventAggregationSqliteLikeV01,
): { status: "inserted" | "idempotent_existing" | "blocked"; failure_codes: string[] } {
  const validation = validateFeedbackEventAggregationRuntimeCompletionEventV01(event);
  if (!validation.passed) return { status: "blocked", failure_codes: validation.failure_codes };
  const sourceRefs = normalizeCompletionSourceRefs(event);
  const idempotencyKey = `feedback_event_aggregation:${hashStable(event)}`;
  db
    .prepare(
      `INSERT OR IGNORE INTO ${feedbackEventAggregationStoreTableNameV01} (
        event_id,
        event_version,
        event_type,
        target_kind,
        target_id,
        target_fingerprint,
        source_ref_ids_json,
        operator_note,
        correction_text,
        reason,
        created_at,
        idempotency_key,
        authority_boundary_json,
        event_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run?.(
      event.feedback_event_id,
      "feedback_event_aggregation_runtime_completion_event.v0.1",
      event.feedback_kind,
      event.target_kind,
      event.target_ref,
      event.candidate_ref ?? event.durable_ref ?? null,
      JSON.stringify(sourceRefs),
      event.feedback_summary,
      event.feedback_kind === "correct" ? event.feedback_value ?? null : null,
      event.feedback_value ?? null,
      event.created_at,
      idempotencyKey,
      JSON.stringify(event.authority_boundary ?? {}),
      stableStringify(event),
    );
  const row = db
    .prepare(
      `SELECT event_id FROM ${feedbackEventAggregationStoreTableNameV01}
       WHERE event_id = ? LIMIT 1`,
    )
    .get?.(event.feedback_event_id);
  return {
    status: row ? "inserted" : "idempotent_existing",
    failure_codes: [],
  };
}

export function listFeedbackEventAggregationRuntimeCompletionEventsV01(
  filters: FeedbackEventAggregationRuntimeCompletionInputV01["filters"] | undefined,
  db: FeedbackEventAggregationSqliteLikeV01,
): FeedbackEventAggregationRuntimeCompletionEventRecordV01[] {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters?.target_ref) {
    clauses.push("target_id = ?");
    values.push(filters.target_ref);
  }
  if (filters?.target_kind) {
    clauses.push("target_kind = ?");
    values.push(filters.target_kind);
  }
  if (filters?.feedback_kind) {
    clauses.push("event_type = ?");
    values.push(filters.feedback_kind);
  }
  const limit =
    typeof filters?.limit === "number" && Number.isInteger(filters.limit)
      ? Math.min(Math.max(filters.limit, 1), 200)
      : 100;
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows =
    db
      .prepare(
        `SELECT event_json, event_id, event_type, target_kind, target_id,
                source_ref_ids_json, operator_note, correction_text, reason, created_at
         FROM ${feedbackEventAggregationStoreTableNameV01}
         ${where}
         ORDER BY created_at ASC, event_id ASC
         LIMIT ?`,
      )
      .all?.(...values, limit) ?? [];
  return rows
    .map((row) => runtimeCompletionEventFromRowV01(row))
    .filter((event): event is FeedbackEventAggregationRuntimeCompletionEventRecordV01 => {
      if (!event) return false;
      if (filters?.target_layer && event.target_layer !== filters.target_layer) return false;
      return true;
    });
}

export function aggregateFeedbackEventsRuntimeCompletionV01(
  input: FeedbackEventAggregationRuntimeCompletionInputV01,
  options: {
    db?: FeedbackEventAggregationSqliteLikeV01;
    persisted_events?: FeedbackEventAggregationRuntimeCompletionEventRecordV01[];
  } = {},
): FeedbackEventAggregationRuntimeCompletionResultV01 {
  const validation = validateFeedbackEventAggregationRuntimeCompletionInputV01(input);
  if (!validation.passed) {
    const status = validation.failure_codes.some((code) => code.includes("forbidden_authority"))
      ? "blocked_forbidden_authority"
      : validation.failure_codes.some((code) => /private|raw|secret|local_path|private_url/.test(code))
        ? "blocked_private_or_raw_payload"
        : "blocked_invalid_input";
    return emptyRuntimeCompletionResultV01(
      status,
      safeRuntimeCompletionAggregationIdV01(input),
      status === "blocked_forbidden_authority"
        ? ["forbidden_authority_blocked"]
        : status === "blocked_private_or_raw_payload"
          ? ["private_or_raw_payload_blocked"]
          : ["invalid_feedback_event"],
      Boolean(options.db || input.db_path),
    );
  }

  let events = input.feedback_events ?? options.persisted_events ?? [];
  if (options.db) {
    if (!feedbackEventAggregationRuntimeCompletionSchemaExistsV01(options.db)) {
      return emptyRuntimeCompletionResultV01(
        "schema_missing",
        input.aggregation_request_id,
        ["schema_missing"],
        true,
      );
    }
    events = listFeedbackEventAggregationRuntimeCompletionEventsV01(input.filters, options.db);
  }

  const eventValidationFailures = events.flatMap((event, index) =>
    validateFeedbackEventAggregationRuntimeCompletionEventV01(event).failure_codes.map(
      (code) => `feedback_events.${index}.${code}`,
    ),
  );
  if (eventValidationFailures.length > 0) {
    const status = eventValidationFailures.some((code) => code.includes("forbidden_authority"))
      ? "blocked_forbidden_authority"
      : eventValidationFailures.some((code) => /private|raw|secret|local_path|private_url/.test(code))
        ? "blocked_private_or_raw_payload"
        : "blocked_invalid_input";
    return emptyRuntimeCompletionResultV01(
      status,
      input.aggregation_request_id,
      status === "blocked_forbidden_authority"
        ? ["forbidden_authority_blocked"]
        : status === "blocked_private_or_raw_payload"
          ? ["private_or_raw_payload_blocked"]
          : ["invalid_feedback_event"],
      Boolean(options.db || input.db_path),
    );
  }

  const normalizedEvents = events
    .map((event) => normalizeFeedbackEventAggregationRuntimeCompletionEventV01(event))
    .sort((left, right) => compareStrings(left.created_at, right.created_at) || compareStrings(left.feedback_event_id, right.feedback_event_id));
  if (normalizedEvents.length === 0) {
    return emptyRuntimeCompletionResultV01(
      "empty",
      input.aggregation_request_id,
      ["feedback_event_missing"],
      Boolean(options.db || input.db_path),
    );
  }

  const aggregations = buildRuntimeCompletionAggregationsV01(normalizedEvents).sort((left, right) =>
    compareStrings(left.target_ref, right.target_ref) ||
    compareStrings(left.target_kind, right.target_kind) ||
    compareStrings(left.target_layer, right.target_layer),
  );

  return {
    aggregation_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION,
    scope,
    aggregation_request_id: input.aggregation_request_id,
    status: "aggregated",
    aggregations,
    feedback_event_refs: uniqueSorted(normalizedEvents.map((event) => event.feedback_event_id)),
    rule_failure_candidates: aggregations.flatMap((aggregate) => aggregate.rule_failure_candidates),
    source_visibility_warnings: aggregations.flatMap((aggregate) => aggregate.source_visibility_warnings),
    candidate_durable_boundary_notes: aggregations.flatMap(
      (aggregate) => aggregate.candidate_durable_boundary_notes,
    ),
    advisory_only: true,
    feedback_is_truth: false,
    pin_is_promotion: false,
    dismiss_is_delete: false,
    invalidate_is_source_suppression: false,
    rule_failure_candidate_is_rule_mutation: false,
    product_write_executed: false,
    authority_boundary: createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
      dbQueryNow: Boolean(options.db || input.db_path),
    }),
    reason_codes: uniqueSorted([
      "feedback_event_present",
      "aggregation_is_advisory",
      "feedback_is_not_truth",
      "pin_is_not_promotion",
      "dismiss_is_not_delete",
      "invalidate_is_not_source_suppression",
      "rule_failure_candidate_is_not_rule_mutation",
      "candidate_durable_boundary_visible",
      "source_visibility_warning_visible",
      "product_write_denied",
    ]),
  };
}

export function validateFeedbackEventAggregationRuntimeCompletionInputV01(
  input: unknown,
): { passed: boolean; failure_codes: string[] } {
  const failureCodes: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }
  const value = input as Partial<FeedbackEventAggregationRuntimeCompletionInputV01>;
  if (value.request_version !== FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_REQUEST_VERSION) {
    failureCodes.push("request_version_invalid");
  }
  if (value.aggregation_version !== FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION) {
    failureCodes.push("aggregation_version_invalid");
  }
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  validateRuntimeCompletionPublicStringV01(value.aggregation_request_id, "aggregation_request_id", failureCodes);
  validateRuntimeCompletionPublicStringV01(value.requested_by, "requested_by", failureCodes);
  validateRuntimeCompletionPublicStringV01(value.requested_at, "requested_at", failureCodes);
  validateRuntimeCompletionReasonCodesV01(value.reason_codes, "reason_codes", failureCodes);
  collectRuntimeCompletionUnsafeFailuresV01(value, "input", failureCodes);
  collectRuntimeCompletionAuthorityFailuresDeepV01(value, "input", failureCodes);
  collectRuntimeCompletionAuthorityFailuresV01(value.authority_boundary, "authority_boundary", failureCodes);
  if (value.db_path !== undefined && !isSafeFeedbackEventAggregationRuntimeDbPathV01(value.db_path)) {
    failureCodes.push("db_path_invalid");
  }
  if (value.filters !== undefined) validateRuntimeCompletionFiltersV01(value.filters, failureCodes);
  if (value.feedback_events !== undefined) {
    if (!Array.isArray(value.feedback_events)) {
      failureCodes.push("feedback_events_not_array");
    } else {
      value.feedback_events.forEach((event, index) => {
        validateFeedbackEventAggregationRuntimeCompletionEventV01(event).failure_codes.forEach(
          (code) => failureCodes.push(`feedback_events.${index}.${code}`),
        );
      });
    }
  }
  return { passed: failureCodes.length === 0, failure_codes: failureCodes };
}

export function validateFeedbackEventAggregationRuntimeCompletionEventV01(
  event: unknown,
): { passed: boolean; failure_codes: string[] } {
  const failureCodes: string[] = [];
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return { passed: false, failure_codes: ["feedback_event_invalid"] };
  }
  const value = event as Partial<FeedbackEventAggregationRuntimeCompletionEventRecordV01>;
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  validateRuntimeCompletionPublicStringV01(value.feedback_event_id, "feedback_event_id", failureCodes);
  validateRuntimeCompletionPublicStringV01(value.target_ref, "target_ref", failureCodes);
  validateRuntimeCompletionPublicStringV01(value.target_kind, "target_kind", failureCodes);
  if (!completionTargetLayers.includes(value.target_layer as FeedbackEventAggregationRuntimeCompletionTargetLayerV01)) {
    failureCodes.push("target_layer_invalid");
  }
  if (!completionFeedbackKinds.includes(value.feedback_kind as FeedbackEventAggregationRuntimeCompletionKindV01)) {
    failureCodes.push("feedback_kind_invalid");
  }
  validateRuntimeCompletionPublicStringV01(value.feedback_summary, "feedback_summary", failureCodes);
  validateRuntimeCompletionPublicStringV01(value.created_by, "created_by", failureCodes);
  validateRuntimeCompletionPublicStringV01(value.created_at, "created_at", failureCodes);
  if (value.feedback_value !== undefined) {
    validateRuntimeCompletionPublicStringV01(value.feedback_value, "feedback_value", failureCodes);
  }
  if (value.source_ref !== undefined) {
    validateRuntimeCompletionPublicStringV01(value.source_ref, "source_ref", failureCodes);
  }
  if (value.candidate_ref !== undefined) {
    validateRuntimeCompletionPublicStringV01(value.candidate_ref, "candidate_ref", failureCodes);
  }
  if (value.durable_ref !== undefined) {
    validateRuntimeCompletionPublicStringV01(value.durable_ref, "durable_ref", failureCodes);
  }
  if (value.source_refs !== undefined) {
    validateRuntimeCompletionPublicStringArrayV01(value.source_refs, "source_refs", failureCodes);
  }
  validateRuntimeCompletionReasonCodesV01(value.reason_codes, "reason_codes", failureCodes);
  collectRuntimeCompletionUnsafeFailuresV01(value, "feedback_event", failureCodes);
  collectRuntimeCompletionAuthorityFailuresDeepV01(value, "feedback_event", failureCodes);
  collectRuntimeCompletionAuthorityFailuresV01(value.authority_boundary, "authority_boundary", failureCodes);
  return { passed: failureCodes.length === 0, failure_codes: failureCodes };
}

function buildRuntimeCompletionAggregationsV01(
  events: FeedbackEventAggregationRuntimeCompletionEventRecordV01[],
): FeedbackEventAggregationRuntimeCompletionAggregateV01[] {
  const groups = new Map<string, FeedbackEventAggregationRuntimeCompletionEventRecordV01[]>();
  for (const event of events) {
    const key = `${event.target_ref}\u0000${event.target_kind}\u0000${event.target_layer}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.values()].map((groupEventsForTarget) => {
    const counts = countRuntimeCompletionEventsV01(groupEventsForTarget);
    const target = groupEventsForTarget[0]!;
    const feedbackEventRefs = uniqueSorted(groupEventsForTarget.map((event) => event.feedback_event_id));
    const sourceRefs = uniqueSorted(groupEventsForTarget.flatMap(normalizeCompletionSourceRefs));
    const priorityHint = determineRuntimeCompletionPriorityHintV01(counts);
    const authorityBoundary = createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
      dbQueryNow: true,
    });
    const ruleFailureCandidates = buildRuntimeCompletionRuleFailureCandidatesV01(
      target,
      counts,
      feedbackEventRefs,
    );
    const sourceVisibilityWarnings = buildRuntimeCompletionSourceVisibilityWarningsV01(
      target,
      counts,
      sourceRefs,
      feedbackEventRefs,
    );
    const boundaryNotes = buildRuntimeCompletionBoundaryNotesV01(target);
    return {
      aggregation_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION,
      scope,
      target_ref: target.target_ref,
      target_kind: target.target_kind,
      target_layer: target.target_layer,
      pin_count: counts.pin_count,
      dismiss_count: counts.dismiss_count,
      correct_count: counts.correct_count,
      invalidate_count: counts.invalidate_count,
      needs_more_evidence_count: counts.needs_more_evidence_count,
      scope_overreach_count: counts.scope_overreach_count,
      not_relevant_now_count: counts.not_relevant_now_count,
      mark_useful_count: counts.mark_useful_count,
      mark_wrong_count: counts.mark_wrong_count,
      last_feedback_at: maxString(groupEventsForTarget.map((event) => event.created_at)),
      feedback_event_refs: feedbackEventRefs,
      current_surface_priority_hint: priorityHint,
      rule_failure_candidates: ruleFailureCandidates,
      source_visibility_warnings: sourceVisibilityWarnings,
      candidate_durable_boundary_notes: boundaryNotes,
      advisory_only: true,
      feedback_is_truth: false,
      pin_is_promotion: false,
      dismiss_is_delete: false,
      invalidate_is_source_suppression: false,
      rule_failure_candidate_is_rule_mutation: false,
      product_write_executed: false,
      authority_boundary: authorityBoundary,
      reason_codes: uniqueSorted([
        "aggregation_is_advisory",
        "feedback_is_not_truth",
        "candidate_durable_boundary_visible",
        counts.pin_count > 0 ? "pin_counted" : "",
        counts.dismiss_count > 0 ? "dismiss_counted" : "",
        counts.correct_count > 0 ? "correct_counted" : "",
        counts.invalidate_count > 0 ? "invalidate_counted" : "",
        counts.needs_more_evidence_count > 0 ? "needs_more_evidence_counted" : "",
        counts.scope_overreach_count > 0 ? "scope_overreach_counted" : "",
      ].filter(Boolean)),
    };
  });
}

function countRuntimeCompletionEventsV01(
  events: FeedbackEventAggregationRuntimeCompletionEventRecordV01[],
): Omit<CountState, "unknown_count"> {
  const counts = {
    pin_count: 0,
    dismiss_count: 0,
    correct_count: 0,
    invalidate_count: 0,
    needs_more_evidence_count: 0,
    scope_overreach_count: 0,
    not_relevant_now_count: 0,
    mark_useful_count: 0,
    mark_wrong_count: 0,
  };
  for (const event of events) {
    counts[`${event.feedback_kind}_count` as keyof typeof counts] += 1;
  }
  return counts;
}

function determineRuntimeCompletionPriorityHintV01(
  counts: Omit<CountState, "unknown_count">,
): FeedbackEventAggregationRuntimeCompletionPriorityHintV01 {
  if (counts.invalidate_count > 0 || counts.scope_overreach_count > 0) {
    return "needs_operator_review";
  }
  if (counts.needs_more_evidence_count > 0) return "needs_more_evidence";
  if (counts.pin_count > 0 || counts.mark_useful_count > 0 || counts.correct_count > 0) {
    return "raise_priority_for_review";
  }
  if (counts.dismiss_count > 0 || counts.not_relevant_now_count > 0 || counts.mark_wrong_count > 0) {
    return "lower_priority";
  }
  return "no_change";
}

function buildRuntimeCompletionRuleFailureCandidatesV01(
  target: FeedbackEventAggregationRuntimeCompletionEventRecordV01,
  counts: Omit<CountState, "unknown_count">,
  feedbackEventRefs: string[],
): FeedbackEventAggregationRuntimeCompletionRuleFailureCandidateV01[] {
  const candidates: FeedbackEventAggregationRuntimeCompletionRuleFailureCandidateV01[] = [];
  const maybePush = (observedPattern: string, reason: string) => {
    candidates.push({
      rule_failure_candidate_ref: `feedback-rule-failure-candidate:${hashStable({
        observedPattern,
        target_ref: target.target_ref,
        feedbackEventRefs,
      })}`,
      affected_surface: target.target_kind,
      observed_pattern: observedPattern,
      proposed_rule_change_summary: reason,
      expected_benefit: "Operator review can decide whether a future rule change is warranted.",
      risk_note: "Candidate-only preview. No rule mutation is executed.",
      review_required: true,
      rule_mutation_executed: false,
      authority_boundary: createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
        dbQueryNow: true,
      }),
    });
  };
  if (counts.correct_count > 0) maybePush("correction_feedback_present", "Correction feedback may indicate a candidate display or parser mismatch.");
  if (counts.scope_overreach_count > 0) maybePush("scope_overreach_feedback_present", "Scope-overreach feedback may indicate an overly broad surface rule.");
  if (counts.mark_wrong_count > 0) maybePush("wrong_mark_feedback_present", "Wrong-mark feedback may indicate a candidate quality rule failure.");
  if (counts.needs_more_evidence_count > 0) maybePush("needs_more_evidence_feedback_present", "Needs-more-evidence feedback may indicate an evidence coverage gap.");
  return candidates.sort((left, right) =>
    compareStrings(left.rule_failure_candidate_ref, right.rule_failure_candidate_ref),
  );
}

function buildRuntimeCompletionSourceVisibilityWarningsV01(
  target: FeedbackEventAggregationRuntimeCompletionEventRecordV01,
  counts: Omit<CountState, "unknown_count">,
  sourceRefs: string[],
  feedbackEventRefs: string[],
): FeedbackEventAggregationRuntimeCompletionSourceVisibilityWarningV01[] {
  if (sourceRefs.length === 0) return [];
  if (counts.invalidate_count === 0 && counts.dismiss_count === 0 && counts.not_relevant_now_count === 0) {
    return [];
  }
  return [
    {
      warning_ref: `feedback-source-visibility-warning:${hashStable({
        target_ref: target.target_ref,
        sourceRefs,
        feedbackEventRefs,
      })}`,
      target_ref: target.target_ref,
      source_refs: sourceRefs,
      feedback_event_refs: feedbackEventRefs,
      warning_summary: "Feedback can lower priority or request review, but it cannot silently suppress source visibility.",
      source_visibility_preserved: true,
      invalidate_is_source_suppression: false,
      authority_boundary: createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
        dbQueryNow: true,
      }),
    },
  ];
}

function buildRuntimeCompletionBoundaryNotesV01(
  event: FeedbackEventAggregationRuntimeCompletionEventRecordV01,
): FeedbackEventAggregationRuntimeCompletionBoundaryNoteV01[] {
  return [
    {
      note_ref: `feedback-boundary-note:${hashStable({
        target_ref: event.target_ref,
        target_layer: event.target_layer,
        candidate_ref: event.candidate_ref ?? null,
        durable_ref: event.durable_ref ?? null,
      })}`,
      target_ref: event.target_ref,
      target_layer: event.target_layer,
      candidate_ref: event.candidate_ref ?? null,
      durable_ref: event.durable_ref ?? null,
      boundary_summary:
        event.target_layer === "durable_perspective_state"
          ? "Feedback on durable state is a review signal only and does not mutate durable state."
          : "Feedback preserves candidate/durable separation and remains advisory.",
      candidate_durable_distinction_preserved: true,
      authority_boundary: createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
        dbQueryNow: true,
      }),
    },
  ];
}

function runtimeCompletionEventFromRowV01(
  row: unknown,
): FeedbackEventAggregationRuntimeCompletionEventRecordV01 | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  if (typeof record.event_json === "string") {
    const parsed = safeParseJsonRecordV01(record.event_json);
    const normalized = normalizePersistedFeedbackEventRecordV01(parsed);
    if (normalized) return normalized;
  }
  return normalizePersistedFeedbackEventRecordV01(record);
}

function normalizePersistedFeedbackEventRecordV01(
  value: unknown,
): FeedbackEventAggregationRuntimeCompletionEventRecordV01 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.feedback_event_id === "string" &&
    typeof record.feedback_kind === "string"
  ) {
    return normalizeFeedbackEventAggregationRuntimeCompletionEventV01(
      record as unknown as FeedbackEventAggregationRuntimeCompletionEventRecordV01,
    );
  }
  const eventType = normalizeCompletionFeedbackKindV01(record.event_type);
  const targetKind = typeof record.target_kind === "string" ? record.target_kind : "unknown";
  const targetRef = typeof record.target_id === "string" ? record.target_id : "";
  const sourceRefs = Array.isArray(record.source_ref_ids)
    ? record.source_ref_ids.filter((sourceRef): sourceRef is string => typeof sourceRef === "string")
    : typeof record.source_ref_ids_json === "string"
      ? parseStringArrayV01(record.source_ref_ids_json)
      : [];
  if (!eventType || !targetRef) return null;
  const summary =
    firstPublicStringV01(record.operator_note, record.correction_text, record.reason) ??
    "Feedback event summary is bounded and operator-provided.";
  return normalizeFeedbackEventAggregationRuntimeCompletionEventV01({
    feedback_event_id:
      typeof record.event_id === "string" ? record.event_id : `feedback-event:${hashStable(record)}`,
    scope,
    target_ref: targetRef,
    target_kind: targetKind,
    target_layer: deriveRuntimeCompletionTargetLayerV01(targetKind, targetRef),
    feedback_kind: eventType,
    feedback_value: firstPublicStringV01(record.correction_text, record.reason),
    feedback_summary: summary,
    source_refs: sourceRefs,
    source_ref: sourceRefs[0],
    candidate_ref: targetRef.includes("candidate") ? targetRef : undefined,
    durable_ref: targetKind.includes("durable") || targetRef.includes("durable") ? targetRef : undefined,
    created_by: "operator:feedback-event-store",
    created_at: typeof record.created_at === "string" ? record.created_at : "1970-01-01T00:00:00.000Z",
    authority_boundary:
      record.authority_boundary && typeof record.authority_boundary === "object"
        ? (record.authority_boundary as Record<string, unknown>)
        : {},
    reason_codes: ["persisted_feedback_event_read"],
  });
}

function normalizeFeedbackEventAggregationRuntimeCompletionEventV01(
  event: FeedbackEventAggregationRuntimeCompletionEventRecordV01,
): FeedbackEventAggregationRuntimeCompletionEventRecordV01 {
  const sourceRefs = normalizeCompletionSourceRefs(event);
  return {
    ...event,
    feedback_value: event.feedback_value ?? undefined,
    source_refs: sourceRefs,
    source_ref: event.source_ref ?? sourceRefs[0],
    candidate_ref:
      event.candidate_ref ??
      (event.target_layer === "candidate" || event.target_layer === "provider_candidate"
        ? event.target_ref
        : undefined),
    durable_ref:
      event.durable_ref ??
      (event.target_layer === "durable_perspective_state" ? event.target_ref : undefined),
    reason_codes: uniqueSorted(event.reason_codes ?? []),
  };
}

function normalizeCompletionFeedbackKindV01(
  value: unknown,
): FeedbackEventAggregationRuntimeCompletionKindV01 | null {
  if (value === "pin_preview" || value === "pin") return "pin";
  if (value === "dismiss_preview" || value === "dismiss") return "dismiss";
  if (value === "correct_preview" || value === "correct") return "correct";
  if (value === "invalidate_preview" || value === "invalidate") return "invalidate";
  if (completionFeedbackKinds.includes(value as FeedbackEventAggregationRuntimeCompletionKindV01)) {
    return value as FeedbackEventAggregationRuntimeCompletionKindV01;
  }
  return null;
}

function deriveRuntimeCompletionTargetLayerV01(
  targetKind: string,
  targetRef: string,
): FeedbackEventAggregationRuntimeCompletionTargetLayerV01 {
  const value = `${targetKind} ${targetRef}`.toLowerCase();
  if (value.includes("review")) return "review_memory";
  if (value.includes("durable") || value.includes("perspective_state")) {
    return "durable_perspective_state";
  }
  if (value.includes("source")) return "source_ref";
  if (value.includes("provider")) return "provider_candidate";
  if (value.includes("retrieval") || value.includes("rag")) return "retrieval_context";
  if (value.includes("layout") || value.includes("constellation") || value.includes("geometry")) {
    return "layout_surface";
  }
  if (value.includes("candidate")) return "candidate";
  return "unknown";
}

function normalizeCompletionSourceRefs(
  event: FeedbackEventAggregationRuntimeCompletionEventRecordV01,
): string[] {
  return uniqueSorted([...(event.source_refs ?? []), event.source_ref ?? ""].filter(Boolean));
}

function validateRuntimeCompletionFiltersV01(value: unknown, failureCodes: string[]): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failureCodes.push("filters_invalid");
    return;
  }
  const filters = value as FeedbackEventAggregationRuntimeCompletionInputV01["filters"];
  if (filters?.target_ref !== undefined) {
    validateRuntimeCompletionPublicStringV01(filters.target_ref, "filters.target_ref", failureCodes);
  }
  if (filters?.target_kind !== undefined) {
    validateRuntimeCompletionPublicStringV01(filters.target_kind, "filters.target_kind", failureCodes);
  }
  if (
    filters?.target_layer !== undefined &&
    !completionTargetLayers.includes(filters.target_layer)
  ) {
    failureCodes.push("filters.target_layer_invalid");
  }
  if (
    filters?.feedback_kind !== undefined &&
    !completionFeedbackKinds.includes(filters.feedback_kind)
  ) {
    failureCodes.push("filters.feedback_kind_invalid");
  }
  if (
    filters?.limit !== undefined &&
    (!Number.isInteger(filters.limit) || filters.limit < 1 || filters.limit > 200)
  ) {
    failureCodes.push("filters.limit_invalid");
  }
}

function validateRuntimeCompletionPublicStringV01(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  if (typeof value !== "string") {
    failureCodes.push(`${label}_not_string`);
    return;
  }
  if (value.trim().length === 0 || value.length > 1000) {
    failureCodes.push(`${label}_invalid`);
    return;
  }
  if (completionUnsafePattern.test(value)) {
    failureCodes.push(`${label}_private_or_raw_payload`);
  }
}

function validateRuntimeCompletionPublicStringArrayV01(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  value.forEach((item, index) =>
    validateRuntimeCompletionPublicStringV01(item, `${label}.${index}`, failureCodes),
  );
}

function validateRuntimeCompletionReasonCodesV01(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.length === 0 || completionUnsafePattern.test(item)) {
      failureCodes.push(`${label}.${index}_invalid`);
    }
  });
}

function collectRuntimeCompletionUnsafeFailuresV01(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  const serialized = safeSerialize(value);
  if (!serialized) return;
  if (/\/Users\/|\/home\//.test(serialized)) failureCodes.push(`${label}_local_path_blocked`);
  if (/file:\/\//i.test(serialized)) failureCodes.push(`${label}_private_url_blocked`);
  if (/sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|private key/i.test(serialized)) {
    failureCodes.push(`${label}_secret_like_pattern_blocked`);
  }
  if (completionUnsafePattern.test(serialized)) failureCodes.push(`${label}_private_or_raw_payload`);
}

function collectRuntimeCompletionAuthorityFailuresV01(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failureCodes.push(`${label}_not_object`);
    return;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    if (hasRuntimeCompletionForbiddenAuthorityGrantV01(key, nestedValue)) {
      failureCodes.push(`${label}.${key}_forbidden_authority`);
    }
    if (nestedValue && typeof nestedValue === "object") {
      collectRuntimeCompletionAuthorityFailuresV01(
        nestedValue,
        `${label}.${key}`,
        failureCodes,
      );
    }
  }
}

function collectRuntimeCompletionAuthorityFailuresDeepV01(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  collectRuntimeCompletionAuthorityFailuresDeepInnerV01(
    value,
    label,
    failureCodes,
    new WeakSet<object>(),
  );
}

function collectRuntimeCompletionAuthorityFailuresDeepInnerV01(
  value: unknown,
  label: string,
  failureCodes: string[],
  seen: WeakSet<object>,
): void {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectRuntimeCompletionAuthorityFailuresDeepInnerV01(
        item,
        `${label}.${index}`,
        failureCodes,
        seen,
      ),
    );
    return;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    if (hasRuntimeCompletionForbiddenAuthorityGrantV01(key, nestedValue)) {
      failureCodes.push(`${label}.${key}_forbidden_authority`);
    }
    collectRuntimeCompletionAuthorityFailuresDeepInnerV01(
      nestedValue,
      `${label}.${key}`,
      failureCodes,
      seen,
    );
  }
}

function hasRuntimeCompletionForbiddenAuthorityGrantV01(key: string, value: unknown): boolean {
  if (!isRuntimeCompletionAuthorityKeyV01(key)) return false;
  return !(value === false || value === null || value === undefined);
}

function isRuntimeCompletionAuthorityKeyV01(key: string): boolean {
  if (completionForbiddenAuthorityFields.has(key)) return true;
  return /(_authority|_write_now|_call_now|_execution_now|_is_truth|_is_proof|product_write|product_id_allocation|proof_or_evidence|claim_or_evidence|promotion_execution|durable_state_apply|formation_receipt_write|github_api_call|git_write|source_suppression|candidate_delete|rule_mutation|parser_mutation|prompt_mutation|ranking_mutation|surfacing_mutation)/.test(key);
}

function emptyRuntimeCompletionResultV01(
  status: FeedbackEventAggregationRuntimeCompletionStatusV01,
  aggregationRequestId: string,
  reasonCodesForResult: string[],
  dbQueryNow: boolean,
): FeedbackEventAggregationRuntimeCompletionResultV01 {
  return {
    aggregation_version: FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_VERSION,
    scope,
    aggregation_request_id: aggregationRequestId,
    status,
    aggregations: [],
    feedback_event_refs: [],
    rule_failure_candidates: [],
    source_visibility_warnings: [],
    candidate_durable_boundary_notes: [],
    advisory_only: true,
    feedback_is_truth: false,
    pin_is_promotion: false,
    dismiss_is_delete: false,
    invalidate_is_source_suppression: false,
    rule_failure_candidate_is_rule_mutation: false,
    product_write_executed: false,
    authority_boundary: createFeedbackEventAggregationRuntimeCompletionAuthorityBoundaryV01({
      dbQueryNow,
    }),
    reason_codes: uniqueSorted([
      "aggregation_is_advisory",
      "feedback_is_not_truth",
      "product_write_denied",
      ...reasonCodesForResult,
    ]),
  };
}

function safeRuntimeCompletionAggregationIdV01(
  input: FeedbackEventAggregationRuntimeCompletionInputV01,
): string {
  return typeof input?.aggregation_request_id === "string" &&
    input.aggregation_request_id.length > 0 &&
    !completionUnsafePattern.test(input.aggregation_request_id)
    ? input.aggregation_request_id
    : "feedback-aggregation-runtime-completion:blocked";
}

function safeParseJsonRecordV01(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseStringArrayV01(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function firstPublicStringV01(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0 && !completionUnsafePattern.test(value)) {
      return value.trim();
    }
  }
  return undefined;
}
