import { createHash } from "node:crypto";

import type {
  DurablePerspectiveState,
  DurablePerspectiveStateApplyEvent,
} from "./apply-perspective-delta";

export const PERSPECTIVE_TRAJECTORY_BUILDER_VERSION = "perspective_trajectory_builder.v0.1" as const;
export const PERSPECTIVE_TRAJECTORY_EVENT_VERSION = "perspective_trajectory_event.v0.1" as const;
export const PERSPECTIVE_TRAJECTORY_VERSION = "perspective_trajectory.v0.1" as const;

const scope = "project:augnes" as const;

export type PerspectiveTrajectoryEventKind =
  | "candidate_created"
  | "review_record_saved"
  | "promotion_decision_created"
  | "formation_receipt_created"
  | "durable_delta_applied"
  | "claim_retired"
  | "tension_resolved"
  | "knowledge_gap_deferred"
  | "knowledge_gap_closed"
  | "salience_changed"
  | "feedback_influenced_surface"
  | "unknown";

export type PerspectiveTrajectoryLayer =
  | "candidate"
  | "review_memory"
  | "promotion_decision"
  | "formation_receipt"
  | "durable_state"
  | "feedback"
  | "source_ref"
  | "unknown";

export type PerspectiveTrajectoryStatus =
  | "built"
  | "empty"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input";

export type PerspectiveTrajectoryReasonCode =
  | "durable_state_ref_present"
  | "durable_state_ref_missing"
  | "apply_event_ref_present"
  | "apply_event_ref_missing"
  | "promotion_decision_ref_present"
  | "promotion_decision_ref_missing"
  | "formation_receipt_ref_present"
  | "formation_receipt_ref_missing"
  | "review_record_ref_present"
  | "review_record_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "candidate_ref_present"
  | "candidate_ref_missing"
  | "prior_thesis_preserved"
  | "retired_claim_preserved"
  | "contradiction_preserved"
  | "unresolved_tension_preserved"
  | "unresolved_tension_resolved_explicitly"
  | "knowledge_gap_preserved"
  | "knowledge_gap_deferred"
  | "knowledge_gap_closed_explicitly"
  | "feedback_ref_present"
  | "trajectory_built"
  | "trajectory_is_read_only"
  | "derived_view_not_source_of_truth"
  | "no_state_mutation"
  | "no_promotion_execution"
  | "no_formation_receipt_write"
  | "no_proof_created"
  | "no_evidence_created"
  | "no_product_write"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_write_not_executed"
  | "git_ledger_export_not_executed";

export const allowedPerspectiveTrajectoryEventKinds = [
  "candidate_created",
  "review_record_saved",
  "promotion_decision_created",
  "formation_receipt_created",
  "durable_delta_applied",
  "claim_retired",
  "tension_resolved",
  "knowledge_gap_deferred",
  "knowledge_gap_closed",
  "salience_changed",
  "feedback_influenced_surface",
  "unknown",
] as const satisfies readonly PerspectiveTrajectoryEventKind[];

export const allowedPerspectiveTrajectoryLayers = [
  "candidate",
  "review_memory",
  "promotion_decision",
  "formation_receipt",
  "durable_state",
  "feedback",
  "source_ref",
  "unknown",
] as const satisfies readonly PerspectiveTrajectoryLayer[];

export const allowedPerspectiveTrajectoryReasonCodes = [
  "durable_state_ref_present",
  "durable_state_ref_missing",
  "apply_event_ref_present",
  "apply_event_ref_missing",
  "promotion_decision_ref_present",
  "promotion_decision_ref_missing",
  "formation_receipt_ref_present",
  "formation_receipt_ref_missing",
  "review_record_ref_present",
  "review_record_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "candidate_ref_present",
  "candidate_ref_missing",
  "prior_thesis_preserved",
  "retired_claim_preserved",
  "contradiction_preserved",
  "unresolved_tension_preserved",
  "unresolved_tension_resolved_explicitly",
  "knowledge_gap_preserved",
  "knowledge_gap_deferred",
  "knowledge_gap_closed_explicitly",
  "feedback_ref_present",
  "trajectory_built",
  "trajectory_is_read_only",
  "derived_view_not_source_of_truth",
  "no_state_mutation",
  "no_promotion_execution",
  "no_formation_receipt_write",
  "no_proof_created",
  "no_evidence_created",
  "no_product_write",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_not_executed",
  "git_ledger_export_not_executed",
] as const satisfies readonly PerspectiveTrajectoryReasonCode[];

const allowedReasonCodeSet = new Set<string>(allowedPerspectiveTrajectoryReasonCodes);

const forbiddenAuthorityFields = [
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "db_write_now",
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
  "source_of_truth",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "formation_receipt_is_proof",
  "durable_state_apply_is_product_write",
  "product_write_authority",
] as const;

const unsafeStringPatterns = [
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
  /raw source body/i,
  /raw provider output/i,
  /raw retrieval output/i,
  /raw trajectory payload/i,
  /raw perspective trajectory payload/i,
  /raw conversation/i,
  /hidden reasoning/i,
  /raw DB row/i,
  /raw_db_row/i,
  /browser dump/i,
  /raw browser dump/i,
  /actual prompt:/i,
  /provider response:/i,
  /actual query:/i,
  /embedding vector:/i,
  /vector index dump:/i,
  /sk-/i,
  /ghp_/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
  /secret-like perspective trajectory input/i,
];

export interface PerspectiveTrajectoryAuthorityBoundary {
  trajectory_read_model_now: true;
  derived_view_only: true;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  work_mutation_now: false;
  db_write_now: false;
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
  source_of_truth: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  formation_receipt_is_proof: false;
  durable_state_apply_is_product_write: false;
  product_write_authority: false;
}

export interface PerspectiveTrajectorySourceRef {
  source_ref: string;
  bounded_summary: string;
  reason_codes: PerspectiveTrajectoryReasonCode[];
}

export interface PerspectiveTrajectoryEvent {
  event_version: typeof PERSPECTIVE_TRAJECTORY_EVENT_VERSION;
  builder_version: typeof PERSPECTIVE_TRAJECTORY_BUILDER_VERSION;
  scope: typeof scope;
  event_id: string;
  perspective_id: string;
  event_kind: PerspectiveTrajectoryEventKind;
  layer: PerspectiveTrajectoryLayer;
  occurred_at: string;
  actor_ref: string;
  subject_ref: string;
  bounded_summary: string;
  source_refs: string[];
  candidate_refs: string[];
  review_record_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  apply_event_refs: string[];
  feedback_refs: string[];
  prior_thesis_refs: string[];
  active_claim_refs: string[];
  retired_claim_refs: string[];
  tension_refs: string[];
  knowledge_gap_refs: string[];
  authority_boundary: PerspectiveTrajectoryAuthorityBoundary;
  reason_codes: PerspectiveTrajectoryReasonCode[];
}

export interface PerspectiveTrajectoryInput {
  builder_version: typeof PERSPECTIVE_TRAJECTORY_BUILDER_VERSION;
  scope: typeof scope;
  perspective_id: string;
  as_of: string;
  durable_state_refs: string[];
  apply_events: PerspectiveTrajectoryEvent[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  review_record_refs: string[];
  feedback_refs: string[];
  source_refs: PerspectiveTrajectorySourceRef[];
  boundary_notes: string[];
  reason_codes: PerspectiveTrajectoryReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface PerspectiveTrajectory {
  trajectory_version: typeof PERSPECTIVE_TRAJECTORY_VERSION;
  builder_version: typeof PERSPECTIVE_TRAJECTORY_BUILDER_VERSION;
  scope: typeof scope;
  perspective_id: string;
  status: PerspectiveTrajectoryStatus;
  as_of: string;
  events: PerspectiveTrajectoryEvent[];
  current_state_summary: string;
  prior_thesis_refs: string[];
  active_claim_refs: string[];
  retired_claim_refs: string[];
  supporting_evidence_refs: string[];
  contradicting_evidence_refs: string[];
  open_tension_refs: string[];
  resolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  apply_event_refs: string[];
  feedback_refs: string[];
  source_refs: PerspectiveTrajectorySourceRef[];
  boundary_notes: string[];
  authority_boundary: PerspectiveTrajectoryAuthorityBoundary;
  reason_codes: PerspectiveTrajectoryReasonCode[];
  trajectory_fingerprint: string;
}

export interface PerspectiveTrajectoryValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export function createPerspectiveTrajectoryAuthorityBoundaryV01(): PerspectiveTrajectoryAuthorityBoundary {
  return {
    trajectory_read_model_now: true,
    derived_view_only: true,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    work_mutation_now: false,
    db_write_now: false,
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
    source_of_truth: false,
    candidate_is_fact: false,
    candidate_is_proof: false,
    candidate_is_accepted_evidence: false,
    formation_receipt_is_proof: false,
    durable_state_apply_is_product_write: false,
    product_write_authority: false,
  };
}

export function buildPerspectiveTrajectoryV01(input: PerspectiveTrajectoryInput): PerspectiveTrajectory {
  const validation = validatePerspectiveTrajectoryInputV01(input);
  if (!validation.passed) {
    const status = validation.failure_codes.some((code) =>
      code.includes("private") || code.includes("raw") || code.includes("unsafe") || code.includes("secret"),
    )
      ? "blocked_private_or_raw_payload"
      : "blocked_invalid_input";
    return emptyTrajectory(input, status, reasonCodesForBlockedStatus(status));
  }

  const events = dedupeAndSortEvents(input.apply_events);
  const status: PerspectiveTrajectoryStatus = events.length === 0 ? "empty" : "built";
  const trajectoryWithoutFingerprint = {
    trajectory_version: PERSPECTIVE_TRAJECTORY_VERSION,
    builder_version: PERSPECTIVE_TRAJECTORY_BUILDER_VERSION,
    scope,
    perspective_id: input.perspective_id,
    status,
    as_of: input.as_of,
    events,
    current_state_summary: buildCurrentStateSummary(events),
    prior_thesis_refs: collectEventRefs(events, "prior_thesis_refs"),
    active_claim_refs: collectEventRefs(events, "active_claim_refs"),
    retired_claim_refs: collectEventRefs(events, "retired_claim_refs"),
    supporting_evidence_refs: collectEvidenceRefs(events, "supporting"),
    contradicting_evidence_refs: collectEvidenceRefs(events, "contradicting"),
    open_tension_refs: collectTensionRefs(events, "open"),
    resolved_tension_refs: collectTensionRefs(events, "resolved"),
    knowledge_gap_refs: collectEventRefs(events, "knowledge_gap_refs"),
    promotion_decision_refs: uniqueSorted([
      ...input.promotion_decision_refs,
      ...collectEventRefs(events, "promotion_decision_refs"),
    ]),
    formation_receipt_refs: uniqueSorted([
      ...input.formation_receipt_refs,
      ...collectEventRefs(events, "formation_receipt_refs"),
    ]),
    apply_event_refs: collectEventRefs(events, "apply_event_refs"),
    feedback_refs: uniqueSorted([...input.feedback_refs, ...collectEventRefs(events, "feedback_refs")]),
    source_refs: normalizeSourceRefs(input.source_refs),
    boundary_notes: uniqueSorted(input.boundary_notes),
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...events.flatMap((event) => event.reason_codes),
      "trajectory_built",
      "trajectory_is_read_only",
      "derived_view_not_source_of_truth",
      "no_state_mutation",
      "no_promotion_execution",
      "no_formation_receipt_write",
      "no_proof_created",
      "no_evidence_created",
      "no_product_write",
      "provider_call_not_executed",
      "prompt_not_sent",
      "retrieval_not_executed",
      "rag_answer_not_generated",
      "source_fetch_not_executed",
      "file_read_not_executed",
      "db_write_not_executed",
      "git_ledger_export_not_executed",
    ]),
  };
  return {
    ...trajectoryWithoutFingerprint,
    trajectory_fingerprint: createPerspectiveTrajectoryFingerprintV01(trajectoryWithoutFingerprint),
  };
}

export function validatePerspectiveTrajectoryInputV01(
  input: unknown,
): PerspectiveTrajectoryValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<PerspectiveTrajectoryInput>;
  const failureCodes: string[] = [];
  if (value.builder_version !== PERSPECTIVE_TRAJECTORY_BUILDER_VERSION) {
    failureCodes.push("builder_version_invalid");
  }
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  failureCodes.push(...validateRequiredSafeString(value.perspective_id, "perspective_id"));
  failureCodes.push(...validateRequiredSafeString(value.as_of, "as_of"));
  for (const key of [
    "durable_state_refs",
    "promotion_decision_refs",
    "formation_receipt_refs",
    "review_record_refs",
    "feedback_refs",
    "boundary_notes",
  ] as const) {
    failureCodes.push(...validateStringArray(value[key], key));
  }
  failureCodes.push(...validateReasonCodeArray(value.reason_codes, "reason_codes"));
  if (!Array.isArray(value.source_refs)) {
    failureCodes.push("source_refs_invalid");
  } else {
    value.source_refs.forEach((sourceRef, index) => {
      failureCodes.push(...validateSourceRef(sourceRef, `source_refs.${index}`));
    });
  }
  if (!Array.isArray(value.apply_events)) {
    failureCodes.push("apply_events_invalid");
  } else {
    value.apply_events.forEach((event, index) => {
      failureCodes.push(...validatePerspectiveTrajectoryEventV01(event).failure_codes.map((code) => `apply_events.${index}.${code}`));
    });
  }
  failureCodes.push(...validateInputAuthorityBoundary(value.authority_boundary));
  failureCodes.push(...validatePublicSafeValue(value, "input"));
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function validatePerspectiveTrajectoryEventV01(
  event: unknown,
): PerspectiveTrajectoryValidationResult {
  const failureCodes = validateEventInternal(event);
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function createPerspectiveTrajectoryFingerprintV01(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function createPerspectiveTrajectoryInputFromDurableStateV01(args: {
  state: DurablePerspectiveState;
  apply_events: DurablePerspectiveStateApplyEvent[];
  as_of?: string;
  feedback_refs?: string[];
  source_refs?: PerspectiveTrajectorySourceRef[];
  boundary_notes?: string[];
}): PerspectiveTrajectoryInput {
  const latestEventId = args.apply_events.at(-1)?.apply_event_id ?? "apply-event:none";
  const stateEvent = createTrajectoryEvent({
    event_id: `trajectory:event:${args.state.perspective_id}:state-summary`,
    perspective_id: args.state.perspective_id,
    event_kind: "durable_delta_applied",
    layer: "durable_state",
    occurred_at: args.state.updated_at,
    actor_ref: args.apply_events.at(-1)?.operator_actor_ref ?? "operator:unknown",
    subject_ref: args.state.perspective_id,
    bounded_summary: `Current durable Perspective state summary for ${args.state.perspective_id}.`,
    source_refs: [],
    candidate_refs: [
      ...args.state.active_claims.map((claim) => claim.claim_ref),
      ...args.state.retired_claims.map((claim) => claim.claim_ref),
    ],
    review_record_refs: uniqueSorted(args.apply_events.map((event) => event.review_record_ref)),
    promotion_decision_refs: args.state.promotion_history,
    formation_receipt_refs: args.state.formation_receipt_refs,
    apply_event_refs: [latestEventId],
    feedback_refs: args.feedback_refs ?? [],
    prior_thesis_refs: args.state.prior_theses,
    active_claim_refs: args.state.active_claims.map((claim) => claim.claim_ref),
    retired_claim_refs: args.state.retired_claims.map((claim) => claim.claim_ref),
    tension_refs: [],
    knowledge_gap_refs: args.state.knowledge_gaps.map((gap) => gap.knowledge_gap_ref),
    reason_codes: [
      "durable_state_ref_present",
      "apply_event_ref_present",
      "prior_thesis_preserved",
      "retired_claim_preserved",
      "trajectory_is_read_only",
      "derived_view_not_source_of_truth",
      "no_state_mutation",
      "no_product_write",
    ],
  });
  const stateDerivedEvents = [
    args.state.supporting_evidence_refs.length > 0
      ? createTrajectoryEvent({
          event_id: `trajectory:event:${args.state.perspective_id}:supporting-evidence`,
          perspective_id: args.state.perspective_id,
          event_kind: "durable_delta_applied",
          layer: "source_ref",
          occurred_at: args.state.updated_at,
          actor_ref: args.apply_events.at(-1)?.operator_actor_ref ?? "operator:unknown",
          subject_ref: `${args.state.perspective_id}:supporting-evidence`,
          bounded_summary: `Supporting evidence refs preserved for ${args.state.perspective_id}.`,
          source_refs: args.state.supporting_evidence_refs,
          candidate_refs: [],
          review_record_refs: uniqueSorted(args.apply_events.map((event) => event.review_record_ref)),
          promotion_decision_refs: args.state.promotion_history,
          formation_receipt_refs: args.state.formation_receipt_refs,
          apply_event_refs: [latestEventId],
          feedback_refs: args.feedback_refs ?? [],
          prior_thesis_refs: [],
          active_claim_refs: [],
          retired_claim_refs: [],
          tension_refs: [],
          knowledge_gap_refs: [],
          reason_codes: [
            "source_ref_present",
            "trajectory_is_read_only",
            "derived_view_not_source_of_truth",
            "no_state_mutation",
            "no_product_write",
          ],
        })
      : null,
    args.state.contradicting_evidence_refs.length > 0
      ? createTrajectoryEvent({
          event_id: `trajectory:event:${args.state.perspective_id}:contradicting-evidence`,
          perspective_id: args.state.perspective_id,
          event_kind: "durable_delta_applied",
          layer: "source_ref",
          occurred_at: args.state.updated_at,
          actor_ref: args.apply_events.at(-1)?.operator_actor_ref ?? "operator:unknown",
          subject_ref: `${args.state.perspective_id}:contradicting-evidence`,
          bounded_summary: `Contradicting evidence refs preserved for ${args.state.perspective_id}.`,
          source_refs: args.state.contradicting_evidence_refs,
          candidate_refs: [],
          review_record_refs: uniqueSorted(args.apply_events.map((event) => event.review_record_ref)),
          promotion_decision_refs: args.state.promotion_history,
          formation_receipt_refs: args.state.formation_receipt_refs,
          apply_event_refs: [latestEventId],
          feedback_refs: args.feedback_refs ?? [],
          prior_thesis_refs: [],
          active_claim_refs: [],
          retired_claim_refs: [],
          tension_refs: [],
          knowledge_gap_refs: [],
          reason_codes: [
            "contradiction_preserved",
            "trajectory_is_read_only",
            "derived_view_not_source_of_truth",
            "no_state_mutation",
            "no_product_write",
          ],
        })
      : null,
    args.state.open_tensions.length > 0
      ? createTrajectoryEvent({
          event_id: `trajectory:event:${args.state.perspective_id}:open-tensions`,
          perspective_id: args.state.perspective_id,
          event_kind: "durable_delta_applied",
          layer: "durable_state",
          occurred_at: args.state.updated_at,
          actor_ref: args.apply_events.at(-1)?.operator_actor_ref ?? "operator:unknown",
          subject_ref: `${args.state.perspective_id}:open-tensions`,
          bounded_summary: `Open tension refs preserved for ${args.state.perspective_id}.`,
          source_refs: [],
          candidate_refs: [],
          review_record_refs: uniqueSorted(args.apply_events.map((event) => event.review_record_ref)),
          promotion_decision_refs: args.state.promotion_history,
          formation_receipt_refs: args.state.formation_receipt_refs,
          apply_event_refs: [latestEventId],
          feedback_refs: args.feedback_refs ?? [],
          prior_thesis_refs: [],
          active_claim_refs: [],
          retired_claim_refs: [],
          tension_refs: args.state.open_tensions.map((tension) => tension.tension_ref),
          knowledge_gap_refs: [],
          reason_codes: [
            "unresolved_tension_preserved",
            "trajectory_is_read_only",
            "derived_view_not_source_of_truth",
            "no_state_mutation",
            "no_product_write",
          ],
        })
      : null,
    args.state.resolved_tensions.length > 0
      ? createTrajectoryEvent({
          event_id: `trajectory:event:${args.state.perspective_id}:resolved-tensions`,
          perspective_id: args.state.perspective_id,
          event_kind: "tension_resolved",
          layer: "durable_state",
          occurred_at: args.state.updated_at,
          actor_ref: args.apply_events.at(-1)?.operator_actor_ref ?? "operator:unknown",
          subject_ref: `${args.state.perspective_id}:resolved-tensions`,
          bounded_summary: `Resolved tension refs preserved for ${args.state.perspective_id}.`,
          source_refs: [],
          candidate_refs: [],
          review_record_refs: uniqueSorted(args.apply_events.map((event) => event.review_record_ref)),
          promotion_decision_refs: args.state.promotion_history,
          formation_receipt_refs: args.state.formation_receipt_refs,
          apply_event_refs: [latestEventId],
          feedback_refs: args.feedback_refs ?? [],
          prior_thesis_refs: [],
          active_claim_refs: [],
          retired_claim_refs: [],
          tension_refs: args.state.resolved_tensions.map((tension) => tension.tension_ref),
          knowledge_gap_refs: [],
          reason_codes: [
            "unresolved_tension_resolved_explicitly",
            "trajectory_is_read_only",
            "derived_view_not_source_of_truth",
            "no_state_mutation",
            "no_product_write",
          ],
        })
      : null,
  ].filter((event): event is PerspectiveTrajectoryEvent => event !== null);
  const applyEvents = args.apply_events.map((event) =>
    createTrajectoryEvent({
      event_id: `trajectory:event:${event.apply_event_id}`,
      perspective_id: event.perspective_id,
      event_kind: "durable_delta_applied",
      layer: "durable_state",
      occurred_at: event.applied_at,
      actor_ref: event.operator_actor_ref,
      subject_ref: event.formation_receipt_id,
      bounded_summary: `Durable delta applied for ${event.perspective_id}.`,
      source_refs: [],
      candidate_refs: [
        ...event.selected_candidate_refs,
        ...event.omitted_candidate_refs,
        ...event.deferred_candidate_refs,
      ],
      review_record_refs: [event.review_record_ref],
      promotion_decision_refs: [event.promotion_decision_id],
      formation_receipt_refs: [event.formation_receipt_id],
      apply_event_refs: [event.apply_event_id],
      feedback_refs: args.feedback_refs ?? [],
      prior_thesis_refs: event.prior_state_version ? [event.prior_state_version] : [],
      active_claim_refs: [],
      retired_claim_refs: event.apply_operation === "retire" ? event.selected_candidate_refs : [],
      tension_refs: event.unresolved_tensions_preserved,
      knowledge_gap_refs: event.knowledge_gaps_preserved,
      reason_codes: [
        "apply_event_ref_present",
        "promotion_decision_ref_present",
        "formation_receipt_ref_present",
        "review_record_ref_present",
        "candidate_ref_present",
        "trajectory_is_read_only",
        "no_state_mutation",
        "no_product_write",
      ],
    }),
  );
  return {
    builder_version: PERSPECTIVE_TRAJECTORY_BUILDER_VERSION,
    scope,
    perspective_id: args.state.perspective_id,
    as_of: args.as_of ?? args.state.updated_at,
    durable_state_refs: [args.state.perspective_id],
    apply_events: [...applyEvents, stateEvent, ...stateDerivedEvents],
    promotion_decision_refs: args.state.promotion_history,
    formation_receipt_refs: args.state.formation_receipt_refs,
    review_record_refs: uniqueSorted(args.apply_events.map((event) => event.review_record_ref)),
    feedback_refs: args.feedback_refs ?? [],
    source_refs: args.source_refs ?? [],
    boundary_notes: args.boundary_notes ?? [
      "Perspective trajectory is read-only.",
      "Derived view, not source of truth.",
      "Product-write remains parked by #686.",
    ],
    reason_codes: [
      "durable_state_ref_present",
      "apply_event_ref_present",
      "trajectory_is_read_only",
      "derived_view_not_source_of_truth",
      "no_state_mutation",
      "no_product_write",
    ],
  };
}

function createTrajectoryEvent(
  event: Omit<PerspectiveTrajectoryEvent, "event_version" | "builder_version" | "scope" | "authority_boundary">,
): PerspectiveTrajectoryEvent {
  return {
    event_version: PERSPECTIVE_TRAJECTORY_EVENT_VERSION,
    builder_version: PERSPECTIVE_TRAJECTORY_BUILDER_VERSION,
    scope,
    ...event,
    source_refs: uniqueSorted(event.source_refs),
    candidate_refs: uniqueSorted(event.candidate_refs),
    review_record_refs: uniqueSorted(event.review_record_refs),
    promotion_decision_refs: uniqueSorted(event.promotion_decision_refs),
    formation_receipt_refs: uniqueSorted(event.formation_receipt_refs),
    apply_event_refs: uniqueSorted(event.apply_event_refs),
    feedback_refs: uniqueSorted(event.feedback_refs),
    prior_thesis_refs: uniqueSorted(event.prior_thesis_refs),
    active_claim_refs: uniqueSorted(event.active_claim_refs),
    retired_claim_refs: uniqueSorted(event.retired_claim_refs),
    tension_refs: uniqueSorted(event.tension_refs),
    knowledge_gap_refs: uniqueSorted(event.knowledge_gap_refs),
    reason_codes: uniqueSorted(event.reason_codes),
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
  };
}

function emptyTrajectory(
  input: Partial<PerspectiveTrajectoryInput>,
  status: PerspectiveTrajectoryStatus,
  reasonCodes: PerspectiveTrajectoryReasonCode[],
): PerspectiveTrajectory {
  const trajectoryWithoutFingerprint = {
    trajectory_version: PERSPECTIVE_TRAJECTORY_VERSION,
    builder_version: PERSPECTIVE_TRAJECTORY_BUILDER_VERSION,
    scope,
    perspective_id: isPublicSafeNonEmptyString(input.perspective_id)
      ? input.perspective_id
      : "perspective:trajectory:blocked",
    status,
    as_of: isPublicSafeNonEmptyString(input.as_of)
      ? input.as_of
      : "2026-06-26T00:00:00.000Z",
    events: [],
    current_state_summary: status === "empty"
      ? "No Perspective trajectory events available."
      : "Perspective trajectory input blocked before read model build.",
    prior_thesis_refs: [],
    active_claim_refs: [],
    retired_claim_refs: [],
    supporting_evidence_refs: [],
    contradicting_evidence_refs: [],
    open_tension_refs: [],
    resolved_tension_refs: [],
    knowledge_gap_refs: [],
    promotion_decision_refs: [],
    formation_receipt_refs: [],
    apply_event_refs: [],
    feedback_refs: [],
    source_refs: [],
    boundary_notes: [],
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
    reason_codes: reasonCodes,
  };
  return {
    ...trajectoryWithoutFingerprint,
    trajectory_fingerprint: createPerspectiveTrajectoryFingerprintV01(trajectoryWithoutFingerprint),
  };
}

function validateEventInternal(event: unknown): string[] {
  if (!event || typeof event !== "object" || Array.isArray(event)) return ["event_invalid_object"];
  const value = event as Partial<PerspectiveTrajectoryEvent>;
  const failureCodes: string[] = [];
  if (value.event_version !== PERSPECTIVE_TRAJECTORY_EVENT_VERSION) failureCodes.push("event_version_invalid");
  if (value.builder_version !== PERSPECTIVE_TRAJECTORY_BUILDER_VERSION) failureCodes.push("event_builder_version_invalid");
  if (value.scope !== scope) failureCodes.push("event_scope_invalid");
  failureCodes.push(...validateRequiredSafeString(value.event_id, "event_id"));
  failureCodes.push(...validateRequiredSafeString(value.perspective_id, "event_perspective_id"));
  if (!allowedPerspectiveTrajectoryEventKinds.includes(value.event_kind as PerspectiveTrajectoryEventKind)) {
    failureCodes.push("event_kind_invalid");
  }
  if (!allowedPerspectiveTrajectoryLayers.includes(value.layer as PerspectiveTrajectoryLayer)) {
    failureCodes.push("event_layer_invalid");
  }
  failureCodes.push(...validateRequiredSafeString(value.occurred_at, "event_occurred_at"));
  failureCodes.push(...validateRequiredSafeString(value.actor_ref, "event_actor_ref"));
  failureCodes.push(...validateRequiredSafeString(value.subject_ref, "event_subject_ref"));
  failureCodes.push(...validateRequiredSafeString(value.bounded_summary, "event_bounded_summary"));
  for (const key of [
    "source_refs",
    "candidate_refs",
    "review_record_refs",
    "promotion_decision_refs",
    "formation_receipt_refs",
    "apply_event_refs",
    "feedback_refs",
    "prior_thesis_refs",
    "active_claim_refs",
    "retired_claim_refs",
    "tension_refs",
    "knowledge_gap_refs",
  ] as const) {
    failureCodes.push(...validateStringArray(value[key], `event_${key}`));
  }
  failureCodes.push(...validateReasonCodeArray(value.reason_codes, "event_reason_codes"));
  failureCodes.push(...validateAuthorityBoundaryShape(value.authority_boundary, "event_authority_boundary"));
  return failureCodes;
}

function validateSourceRef(value: unknown, path: string): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [`${path}_invalid`];
  const sourceRef = value as Partial<PerspectiveTrajectorySourceRef>;
  return [
    ...validateRequiredSafeString(sourceRef.source_ref, `${path}.source_ref`),
    ...validateRequiredSafeString(sourceRef.bounded_summary, `${path}.bounded_summary`),
    ...validateReasonCodeArray(sourceRef.reason_codes, `${path}.reason_codes`),
  ];
}

function validateInputAuthorityBoundary(boundary: unknown): string[] {
  if (boundary === undefined) return [];
  return validateAuthorityBoundaryShape(boundary, "authority_boundary");
}

function validateAuthorityBoundaryShape(boundary: unknown, path: string): string[] {
  if (!boundary || typeof boundary !== "object" || Array.isArray(boundary)) return [`${path}_invalid`];
  const failureCodes: string[] = [];
  const value = boundary as Record<string, unknown>;
  for (const field of forbiddenAuthorityFields) {
    if (value[field] === true) failureCodes.push(`${path}_forbidden:${field}`);
  }
  return failureCodes;
}

function validateRequiredSafeString(value: unknown, path: string): string[] {
  if (typeof value !== "string" || value.length === 0) return [`${path}_invalid`];
  return hasUnsafeString(value) ? [`${path}_unsafe_private_or_raw_marker`] : [];
}

function validateStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) return [`${path}_invalid`];
  return value.flatMap((item, index) => {
    if (typeof item !== "string") return [`${path}.${index}_non_string`];
    if (item.length === 0) return [`${path}.${index}_empty`];
    return hasUnsafeString(item) ? [`${path}.${index}_unsafe_private_or_raw_marker`] : [];
  });
}

function validateReasonCodeArray(value: unknown, path: string): string[] {
  const failureCodes = validateStringArray(value, path);
  if (!Array.isArray(value)) return failureCodes;
  for (const [index, item] of value.entries()) {
    if (typeof item === "string" && item.length > 0 && !allowedReasonCodeSet.has(item)) {
      failureCodes.push(`${path}.${index}_unknown_reason_code`);
    }
  }
  return failureCodes;
}

function validatePublicSafeValue(value: unknown, path: string): string[] {
  if (typeof value === "string") {
    return hasUnsafeString(value) ? [`${path}_unsafe_private_or_raw_marker`] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => validatePublicSafeValue(item, `${path}.${index}`));
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    validatePublicSafeValue(nested, `${path}.${key}`),
  );
}

function reasonCodesForBlockedStatus(status: PerspectiveTrajectoryStatus): PerspectiveTrajectoryReasonCode[] {
  if (status === "blocked_private_or_raw_payload") {
    return [
      "private_or_raw_payload_blocked",
      "secret_like_pattern_blocked",
      "local_path_blocked",
      "private_url_blocked",
      "trajectory_is_read_only",
      "no_state_mutation",
      "no_product_write",
    ];
  }
  return [
    "derived_view_not_source_of_truth",
    "trajectory_is_read_only",
    "no_state_mutation",
    "no_product_write",
  ];
}

function dedupeAndSortEvents(events: PerspectiveTrajectoryEvent[]): PerspectiveTrajectoryEvent[] {
  const sortedEvents = [...events]
    .map(normalizeEvent)
    .sort((a, b) =>
      a.occurred_at.localeCompare(b.occurred_at) ||
      a.event_kind.localeCompare(b.event_kind) ||
      a.event_id.localeCompare(b.event_id),
    );
  const seenEventIds = new Set<string>();
  const dedupedEvents: PerspectiveTrajectoryEvent[] = [];
  for (const event of sortedEvents) {
    if (seenEventIds.has(event.event_id)) continue;
    seenEventIds.add(event.event_id);
    dedupedEvents.push(event);
  }
  return dedupedEvents;
}

function normalizeEvent(event: PerspectiveTrajectoryEvent): PerspectiveTrajectoryEvent {
  return {
    ...event,
    source_refs: uniqueSorted(event.source_refs),
    candidate_refs: uniqueSorted(event.candidate_refs),
    review_record_refs: uniqueSorted(event.review_record_refs),
    promotion_decision_refs: uniqueSorted(event.promotion_decision_refs),
    formation_receipt_refs: uniqueSorted(event.formation_receipt_refs),
    apply_event_refs: uniqueSorted(event.apply_event_refs),
    feedback_refs: uniqueSorted(event.feedback_refs),
    prior_thesis_refs: uniqueSorted(event.prior_thesis_refs),
    active_claim_refs: uniqueSorted(event.active_claim_refs),
    retired_claim_refs: uniqueSorted(event.retired_claim_refs),
    tension_refs: uniqueSorted(event.tension_refs),
    knowledge_gap_refs: uniqueSorted(event.knowledge_gap_refs),
    reason_codes: uniqueSorted(event.reason_codes),
    authority_boundary: createPerspectiveTrajectoryAuthorityBoundaryV01(),
  };
}

function normalizeSourceRefs(sourceRefs: PerspectiveTrajectorySourceRef[]): PerspectiveTrajectorySourceRef[] {
  const byRef = new Map<string, PerspectiveTrajectorySourceRef>();
  for (const sourceRef of sourceRefs) {
    byRef.set(sourceRef.source_ref, {
      source_ref: sourceRef.source_ref,
      bounded_summary: sourceRef.bounded_summary,
      reason_codes: uniqueSorted(sourceRef.reason_codes),
    });
  }
  return [...byRef.values()].sort((a, b) => a.source_ref.localeCompare(b.source_ref));
}

function buildCurrentStateSummary(events: PerspectiveTrajectoryEvent[]): string {
  const stateSummaryEvent = [...events].reverse().find((event) =>
    event.layer === "durable_state" && event.event_id.endsWith(":state-summary"),
  );
  if (stateSummaryEvent) return stateSummaryEvent.bounded_summary;
  const latestStateEvent = [...events].reverse().find((event) => event.layer === "durable_state");
  return latestStateEvent?.bounded_summary ?? "No Perspective trajectory events available.";
}

function collectEventRefs<K extends keyof PerspectiveTrajectoryEvent>(
  events: PerspectiveTrajectoryEvent[],
  key: K,
): string[] {
  return uniqueSorted(events.flatMap((event) => {
    const value = event[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }));
}

function collectEvidenceRefs(events: PerspectiveTrajectoryEvent[], relation: "supporting" | "contradicting"): string[] {
  const reasonCode = relation === "supporting" ? "source_ref_present" : "contradiction_preserved";
  return uniqueSorted(events.flatMap((event) =>
    event.reason_codes.includes(reasonCode) ? event.source_refs : [],
  ));
}

function collectTensionRefs(events: PerspectiveTrajectoryEvent[], status: "open" | "resolved"): string[] {
  const reasonCode = status === "open" ? "unresolved_tension_preserved" : "unresolved_tension_resolved_explicitly";
  return uniqueSorted(events.flatMap((event) =>
    event.reason_codes.includes(reasonCode) ? event.tension_refs : [],
  ));
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hasUnsafeString(value: string): boolean {
  return unsafeStringPatterns.some((pattern) => pattern.test(value));
}

function isPublicSafeNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !hasUnsafeString(value);
}
