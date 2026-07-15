import { z } from "zod";

export const StateRuntimeScopeSchema = z.string().min(1);
export const StateRuntimeLimitSchema = z.number().int().min(1).max(50);
export const EvidenceKindSchema = z.enum([
  "command_run",
  "check_passed",
  "check_failed",
  "check_skipped",
  "replay_observed",
  "duplicate_block_observed",
]);
export const EvidenceStatusSchema = z.enum([
  "passed",
  "failed",
  "skipped",
  "observed",
  "blocked",
  "needs_review",
]);

export const StateRuntimeStateItemSchema = z.record(z.unknown());
export const StateRuntimeStateBlockSchema = z.union([
  z.array(StateRuntimeStateItemSchema),
  z.record(z.unknown()),
]);

export const StateRuntimeProposalSchema = z
  .object({
    id: z.string(),
    scope: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const StateRuntimeActionRecordSchema = z.record(z.unknown());

export const PlannerRecommendationSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  tool_name: z.string().nullable(),
  priority: z.enum(["now", "next", "later"]),
  grounded_state_keys: z.array(z.string()),
});

export const StateRuntimeActionResultStatusSchema = z.enum(["completed", "failed", "blocked", "partial", "needs_review"]);
export const StateRuntimeActionResultKindSchema = z.enum([
  "implementation",
  "verification",
  "documentation",
  "screenshot",
  "handoff",
  "review",
  "other",
]);

export const StateBriefAgentHandoffSchema = z
  .object({
    current_status: z
      .object({
        summary: z.string(),
        state_counts: z.record(z.number()),
        notable_state_keys: z.array(z.string()),
      })
      .passthrough(),
    next_recommended_action: z
      .object({
        title: z.string(),
        rationale: z.string(),
        suggested_actor: z.string().optional(),
        priority: z.enum(["now", "next", "later"]).optional(),
        related_state_keys: z.array(z.string()),
      })
      .passthrough(),
    blockers_or_tensions: z.array(
      z
        .object({
          title: z.string().optional(),
          severity: z.string().optional(),
          summary: z.string().optional(),
          related_state_keys: z.array(z.string()).optional(),
        })
        .passthrough()
    ),
    codex_handoff: z
      .object({
        task_brief: z.string(),
        constraints: z.array(z.string()),
        verification_commands: z.array(z.string()),
        action_record_template: z
          .object({
            scope: z.string(),
            source_agent_id: z.string(),
            action_name: z.string(),
            result_summary: z.string(),
            files_changed: z.array(z.string()),
            result_status: StateRuntimeActionResultStatusSchema.optional(),
            result_kind: StateRuntimeActionResultKindSchema.optional(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export const StateBriefSchema = z
  .object({
    runtime: z.string(),
    scope: z.string(),
    as_of: z.string(),
    active_state: StateRuntimeStateBlockSchema,
    future_state: StateRuntimeStateBlockSchema,
    deprecated_state: StateRuntimeStateBlockSchema,
    completed_state: StateRuntimeStateBlockSchema,
    open_tensions: z.array(z.unknown()),
    pending_proposals: z.array(StateRuntimeProposalSchema),
    recent_actions: z.array(StateRuntimeActionRecordSchema),
    agent_instructions: z.array(z.unknown()),
    agent_handoff: StateBriefAgentHandoffSchema.optional(),
  })
  .passthrough();

const CanonicalWorkspaceIdSchema = z.string().regex(
  /^workspace:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
);
const CanonicalProjectIdSchema = z.string().regex(
  /^project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
);
const ModelGatewaySafeIdentifierSchema = z
  .string()
  .regex(/^[A-Za-z0-9:._-]{1,256}$/);
const ModelGatewayProvenanceRefSchema = z.string().regex(
  /^(?:sha256:[0-9a-f]{64}|[a-z][a-z0-9_.-]{0,63}:[A-Za-z0-9:._-]{1,256})$/
);
const ModelGatewayFailureCodeSchema = z.enum([
  "model_gateway_invalid_envelope",
  "model_gateway_scope_refused",
  "model_gateway_policy_refused",
  "model_gateway_budget_refused",
  "model_gateway_egress_refused",
  "model_gateway_cancelled",
  "model_gateway_timeout",
  "model_gateway_deterministic_failed",
  "model_gateway_provider_rejected",
  "model_gateway_provider_response_invalid",
  "model_gateway_transport_failed",
]);
const ModelGatewayUsageSchema = z
  .object({
    basis: z.literal("provider_report"),
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
    total_tokens: z.number().int().nonnegative(),
  })
  .strict();
const ModelGatewayBudgetReceiptSchema = z
  .object({
    decision: z.enum(["within_budget", "not_used", "refused"]),
    input_bytes_limit: z.number().int().positive(),
    input_bytes_used: z.number().int().nonnegative().nullable(),
    output_tokens_limit: z.number().int().positive(),
    provider_call_limit: z.union([z.literal(0), z.literal(1)]),
    provider_calls_used: z.union([z.literal(0), z.literal(1)]),
  })
  .strict();

// Exact v0.1 mirror: the Apps package cannot import the root Next runtime module.
export const ModelInvocationReceiptSchema = z
  .object({
    receipt_version: z.literal("model_invocation_receipt.v0.1"),
    gateway_version: z.literal("model_gateway.v0.1"),
    invocation_id: ModelGatewaySafeIdentifierSchema,
    workspace_id: CanonicalWorkspaceIdSchema,
    project_id: CanonicalProjectIdSchema,
    purpose: z.enum([
      "observe_delta_compile",
      "planner_plan",
      "temporal_interpretation",
    ]),
    implementation_id: ModelGatewaySafeIdentifierSchema,
    implementation_version: ModelGatewaySafeIdentifierSchema,
    requested_mode: z.enum(["live", "deterministic"]),
    execution_mode: z.enum(["live", "deterministic"]),
    selection_reason: z.enum([
      "requested_live",
      "explicit_deterministic",
      "provider_unavailable",
      "provider_failure_fallback",
    ]),
    started_at: z.string().datetime({ offset: true }),
    finished_at: z.string().datetime({ offset: true }),
    latency_ms: z.number().int().nonnegative(),
    status: z.enum(["completed", "blocked", "failed", "cancelled"]),
    outcome: z.enum([
      "live_success",
      "deterministic_success",
      "deterministic_fallback_success",
      "deterministic_failure",
      "refused",
      "provider_failure",
      "timeout",
      "cancelled",
    ]),
    egress_attempted: z.boolean(),
    egress_status: z.enum(["occurred", "did_not_occur", "blocked"]),
    usage: ModelGatewayUsageSchema.nullable(),
    budget: ModelGatewayBudgetReceiptSchema,
    failure_code: ModelGatewayFailureCodeSchema.nullable(),
    data_classification: z.enum([
      "public_safe",
      "private",
      "local_only",
      "secret",
    ]),
    retention_class: z.literal("none"),
    privacy_decision: z.enum([
      "provider_egress_approved",
      "provider_egress_not_used",
      "provider_egress_blocked",
    ]),
    provenance_refs: z
      .array(ModelGatewayProvenanceRefSchema)
      .min(1)
      .max(16),
    raw_prompt_persisted: z.literal(false),
    raw_response_persisted: z.literal(false),
    hidden_reasoning_persisted: z.literal(false),
    receipt_is_semantic_authority: z.literal(false),
  })
  .strict();

export const ObserveResultSchema = z
  .object({
    workspace_id: z.string(),
    project_id: z.string(),
    scope: z.string(),
    session_id: z.string(),
    message_id: z.string(),
    compiler: z.string(),
    proposals: z.array(StateRuntimeProposalSchema),
    model_invocation_receipt: ModelInvocationReceiptSchema,
  })
  .passthrough();

export const PlanResultSchema = z
  .object({
    workspace_id: CanonicalWorkspaceIdSchema,
    project_id: CanonicalProjectIdSchema,
    scope: CanonicalProjectIdSchema,
    planner: z.enum(["openai", "mock"]),
    message: z.string(),
    recommendations: z.array(PlannerRecommendationSchema),
    agent_instructions: z.array(z.string()),
    model_invocation_receipt: ModelInvocationReceiptSchema,
  })
  .strict();

export const ActionRecordResultSchema = z.record(z.unknown());

export const WorkItemSchema = z
  .object({
    work_id: z.string(),
    scope: z.string(),
    title: z.string(),
    status: z.string(),
    priority: z.string(),
    summary: z.string(),
    next_action: z.string(),
    updated_at: z.string(),
    user_attention_required: z.boolean().optional(),
    related_state_keys: z.array(z.string()),
    links: z.record(z.unknown()),
    created_at: z.string(),
  })
  .passthrough();

export const WorkEventSchema = z
  .object({
    id: z.string(),
    work_id: z.string(),
    scope: z.string(),
    actor: z.string(),
    event_type: z.string(),
    summary: z.string(),
    created_at: z.string(),
  })
  .passthrough();

export const WorkBriefSchema = z
  .object({
    runtime: z.string(),
    scope: z.string(),
    work_id: z.string(),
    as_of: z.string(),
    framing: z.record(z.string()),
    work: WorkItemSchema,
    next_action: z.string(),
    user_attention_required: z.boolean(),
    recent_events: z.array(WorkEventSchema),
    related_state_keys: z.array(z.string()),
    related_proof: z
      .object({
        action_ids: z.array(z.string()),
        prs: z.array(z.string()),
        docs: z.array(z.string()),
        links: z.record(z.unknown()),
      })
      .passthrough(),
    codex_handoff: z
      .object({
        task_brief: z.string(),
        constraints: z.array(z.string()),
        suggested_verification: z.array(z.string()),
        work_event_template: z.record(z.unknown()),
      })
      .passthrough(),
  })
  .passthrough();

export const WorkListResultSchema = z
  .object({
    scope: z.string(),
    work_items: z.array(WorkItemSchema),
  })
  .passthrough();

export const EvidencePackToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    workId: z.string().min(1).optional(),
    publicationId: z.string().min(1).optional(),
    deliveryId: z.string().min(1).optional(),
    targetRef: z.string().min(1).optional(),
  })
  .strip();

export const EvidencePackResultSchema = z
  .object({
    scope: z.string().optional(),
    as_of: z.string().optional(),
    generated_at: z.string().optional(),
    boundaries: z.array(z.string()).optional(),
  })
  .passthrough();

export const SessionTraceToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
    limit: StateRuntimeLimitSchema.optional(),
  })
  .strip();

export const SessionTraceLatestMessageSchema = z
  .object({
    id: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    date: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    content_preview: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  })
  .passthrough();

export const SessionTraceLatestWorkEventSchema = z
  .object({
    summary: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    result_status: z.string().nullable().optional(),
    kind: z.string().nullable().optional(),
    result_kind: z.string().nullable().optional(),
    event_type: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
  })
  .passthrough();

export const SessionTraceLatestEvidenceRecordSchema = z
  .object({
    evidence_id: z.string().nullable().optional(),
    evidence_kind: z.string().nullable().optional(),
    kind: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
  })
  .passthrough();

export const SessionTraceEvidenceCountsSchema = z
  .object({
    messages: z.number().optional(),
    action_records_by_session: z.number().optional(),
    verification_evidence_records_for_work: z.number().optional(),
    verification_evidence_records_for_pr: z.number().optional(),
    verification_evidence_records_total: z.number().optional(),
  })
  .passthrough();

export const SessionTraceWorkEventCountsSchema = z
  .object({
    total: z.number().optional(),
    by_event_type: z.record(z.number()).optional(),
    with_related_action_id: z.number().optional(),
    with_related_pr: z.number().optional(),
  })
  .passthrough();

export const SessionTraceSessionSchema = z
  .object({
    session_id: z.string(),
    surface: z.string().nullable().optional(),
    actor: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    related_work_id: z.string().nullable().optional(),
    related_pr: z.string().nullable().optional(),
    handoff_ref: z.string().nullable().optional(),
    evidence_pack_ref: z.string().nullable().optional(),
    started_at: z.string().nullable().optional(),
    ended_at: z.string().nullable().optional(),
    evidence_counts: SessionTraceEvidenceCountsSchema.optional(),
    message_count: z.number().nullable().optional(),
    latest_message: SessionTraceLatestMessageSchema.nullable().optional(),
    work_event_counts: SessionTraceWorkEventCountsSchema.nullable().optional(),
    action_records_by_session: z.union([z.number(), z.array(z.unknown()), z.record(z.unknown())]).nullable().optional(),
    action_records_by_session_count: z.number().nullable().optional(),
    verification_evidence_records_total: z.number().nullable().optional(),
    latest_work_event: SessionTraceLatestWorkEventSchema.nullable().optional(),
    latest_evidence_record: SessionTraceLatestEvidenceRecordSchema.nullable().optional(),
    action_records: z.array(z.unknown()).optional(),
    work: z.record(z.unknown()).nullable().optional(),
    gaps: z.array(z.string()).optional(),
  })
  .passthrough();

export const SessionTraceListResultSchema = z
  .object({
    scope: z.string().optional(),
    generated_at: z.string(),
    sessions: z.array(SessionTraceSessionSchema),
    session_count: z.number().optional(),
    action_records_by_session: z.record(z.union([z.number(), z.array(z.unknown())])).nullable().optional(),
    gaps: z.array(z.string()).optional(),
    boundaries: z.array(z.string()).optional(),
  })
  .passthrough();

export const SessionTraceSingleResultSchema = SessionTraceSessionSchema.extend({
  scope: z.string().optional(),
  generated_at: z.string().optional(),
  action_records_by_session: z.record(z.union([z.number(), z.array(z.unknown())])).nullable().optional(),
  boundaries: z.array(z.string()).optional(),
}).passthrough();

export const SessionTraceResultSchema = z.union([SessionTraceListResultSchema, SessionTraceSingleResultSchema]);

export const VerificationEvidenceRecordsToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    workId: z.string().min(1).optional(),
    publicationId: z.string().min(1).optional(),
    deliveryId: z.string().min(1).optional(),
    targetSurface: z.string().min(1).optional(),
    targetRef: z.string().min(1).optional(),
    evidenceKind: EvidenceKindSchema.optional(),
    status: EvidenceStatusSchema.optional(),
    limit: StateRuntimeLimitSchema.optional(),
  })
  .strip();

export const VerificationEvidenceRecordSchema = z
  .object({
    evidence_id: z.string().optional(),
    scope: z.string().optional(),
    work_id: z.string().nullable().optional(),
    publication_id: z.string().nullable().optional(),
    delivery_id: z.string().nullable().optional(),
    target_surface: z.string().nullable().optional(),
    target_ref: z.string().nullable().optional(),
    evidence_kind: EvidenceKindSchema.nullable().optional(),
    status: EvidenceStatusSchema.nullable().optional(),
    label: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const VerificationEvidenceRecordsEnvelopeSchema = z
  .object({
    scope: z.string().optional(),
    as_of: z.string().optional(),
    generated_at: z.string().optional(),
    boundaries: z.array(z.string()).optional(),
    count: z.number().optional(),
    records: z.array(VerificationEvidenceRecordSchema).optional(),
    items: z.array(VerificationEvidenceRecordSchema).optional(),
  })
  .passthrough();

export const VerificationEvidenceRecordsResultSchema = z.union([
  z.array(VerificationEvidenceRecordSchema),
  VerificationEvidenceRecordsEnvelopeSchema,
]);

export const ProjectConstellationPreviewToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    selected_candidate_id: z.string().min(1).optional(),
  })
  .strip();

export const ConstellationPreviewEvidencePointerSchema = z
  .object({
    pointer_id: z.string(),
    label: z.string(),
    target_ref: z.string(),
    pointer_kind: z.string(),
    pointer_semantics: z.literal("pointer_only"),
    bounded_summary: z.string().optional(),
    proof_evidence_write_authority: z.literal(false),
    readiness_write_authority: z.literal(false),
  })
  .passthrough();

export const ConstellationPreviewUnresolvedTensionSchema = z
  .object({
    tension_id: z.string(),
    label: z.string(),
    summary: z.string(),
    source_refs: z.array(z.string()),
    evidence_pointers: z.array(ConstellationPreviewEvidencePointerSchema),
  })
  .passthrough();

export const ConstellationPreviewNextActionCandidateSchema = z
  .object({
    candidate_id: z.string(),
    label: z.string(),
    summary: z.string(),
    source_refs: z.array(z.string()),
    blocked_by: z.array(z.string()).optional(),
    boundary_class: z.string().optional(),
  })
  .passthrough();

export const ConstellationPreviewNodeSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    summary: z.string(),
    source_refs: z.array(z.string()),
    evidence_pointers: z.array(ConstellationPreviewEvidencePointerSchema),
    unresolved_tensions: z.array(ConstellationPreviewUnresolvedTensionSchema),
    next_action_candidates: z.array(ConstellationPreviewNextActionCandidateSchema),
  })
  .passthrough();

export const ConstellationPreviewEdgeSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    source: z.string(),
    target: z.string(),
    summary: z.string(),
    source_refs: z.array(z.string()),
    evidence_pointers: z.array(ConstellationPreviewEvidencePointerSchema),
  })
  .passthrough();

export const ConstellationPreviewClusterSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    node_ids: z.array(z.string()),
    edge_ids: z.array(z.string()),
    cluster_thesis: z.string(),
    unresolved_tensions: z.array(ConstellationPreviewUnresolvedTensionSchema),
    next_action_candidates: z.array(ConstellationPreviewNextActionCandidateSchema),
  })
  .passthrough();

export const ConstellationPreviewProjectSchema = z
  .object({
    constellation_id: z.string(),
    boundary_class: z.string(),
    thesis: z.string(),
    nodes: z.array(ConstellationPreviewNodeSchema),
    edges: z.array(ConstellationPreviewEdgeSchema),
    clusters: z.array(ConstellationPreviewClusterSchema),
    evidence_pointers: z.array(ConstellationPreviewEvidencePointerSchema),
    unresolved_tensions: z.array(ConstellationPreviewUnresolvedTensionSchema),
    next_action_candidates: z.array(ConstellationPreviewNextActionCandidateSchema),
  })
  .passthrough();

export const ConstellationPreviewSourceRefSchema = z
  .object({
    source_ref: z.string(),
    source_kind: z.string(),
    source_label: z.string(),
    source_scope: z.string(),
    provenance_note: z.string(),
  })
  .passthrough();

export const ConstellationPreviewResultSchema = z
  .object({
    response_version: z.string(),
    boundary_class: z.string(),
    meta: z.record(z.unknown()),
    source_refs: z.array(ConstellationPreviewSourceRefSchema),
    project_constellation: ConstellationPreviewProjectSchema,
    evidence_pointers: z.array(ConstellationPreviewEvidencePointerSchema),
    unresolved_tensions: z.array(ConstellationPreviewUnresolvedTensionSchema),
    next_action_candidates: z.array(ConstellationPreviewNextActionCandidateSchema),
  })
  .passthrough();

export const GuideBriefToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    compact: z.boolean().optional(),
  })
  .strip();

export const GuideBriefAuthorityBoundarySchema = z
  .object({
    source_of_truth: z.literal(false),
    can_commit_or_reject_state: z.literal(false),
    can_record_proof: z.literal(false),
    can_create_evidence: z.literal(false),
    can_update_work: z.literal(false),
    can_mutate_memory: z.literal(false),
    can_apply_project_perspective: z.literal(false),
    can_publish_external: z.literal(false),
    can_merge: z.literal(false),
    can_retry_replay_deploy: z.literal(false),
    can_call_github: z.literal(false),
    can_call_openai_or_provider: z.literal(false),
    can_execute_codex: z.literal(false),
    can_create_branch_or_pr: z.literal(false),
    can_send_handoff: z.literal(false),
    can_launch_autonomy: z.literal(false),
    can_create_mcp_tool: z.literal(false),
    can_create_ui_action: z.literal(false),
  })
  .passthrough();

export const GuideBriefResultSchema = z
  .object({
    runtime: z.literal("augnes"),
    guide_version: z.string(),
    scope: z.string(),
    observed: z.array(z.unknown()),
    inferred: z.array(z.unknown()),
    suggested: z.array(z.unknown()),
    needs_user_judgment: z.array(z.unknown()),
    authority_boundary: GuideBriefAuthorityBoundarySchema,
    surface_rendering_notes: z.record(z.unknown()).optional(),
    source_refs: z.record(z.unknown()).optional(),
    staleness_warnings: z.array(z.unknown()).optional(),
    handoff_candidates: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const HandoffCapsulePreviewToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    target: z.string().min(1).optional(),
    compact: z.boolean().optional(),
  })
  .strip();

export const CodexLaunchCardPreviewToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    compact: z.boolean().optional(),
  })
  .strip();

export const AutonomyContractPreviewToolInputSchema = z
  .object({
    scope: z.string().min(1).optional(),
    compact: z.boolean().optional(),
  })
  .strip();

export const AutonomyRunnerPreflightToolInputSchema = z
  .object({
    scope: z.literal("project:augnes").optional(),
    include_dry_run_plan: z.boolean().optional(),
    include_boundary: z.boolean().optional(),
  })
  .strip();

export const HandoffPreviewAuthorityBoundarySchema = z
  .object({
    can_execute_codex: z.literal(false),
    can_launch_codex: z.literal(false),
    can_send_handoff: z.literal(false),
    can_create_branch_or_pr: z.literal(false),
    can_call_github: z.literal(false),
    can_call_openai_or_provider: z.literal(false),
    can_record_proof: z.literal(false),
    can_create_evidence: z.literal(false),
    can_mutate_memory: z.literal(false),
    can_apply_project_perspective: z.literal(false),
    can_merge: z.literal(false),
    can_retry_replay_deploy: z.literal(false),
    can_create_mcp_tool: z.literal(false),
    can_create_ui_action: z.literal(false),
    can_post_external_comment: z.literal(false),
  })
  .passthrough();

export const HandoffCapsulePreviewPacketSchema = z
  .object({
    runtime: z.literal("augnes"),
    capsule_version: z.string(),
    scope: z.string(),
    title: z.string(),
    summary: z.string(),
    target_surface: z.string(),
    target_actor: z.string(),
    handoff_intent: z.string(),
    status: z.string(),
    observed_context: z.array(z.unknown()),
    inferred_context: z.array(z.unknown()),
    suggested_context: z.array(z.unknown()),
    needs_user_judgment: z.array(z.unknown()),
    authority_boundary: HandoffPreviewAuthorityBoundarySchema,
  })
  .passthrough();

export const CodexLaunchCardPreviewPacketSchema = z
  .object({
    runtime: z.literal("augnes"),
    card_version: z.string(),
    scope: z.string(),
    repo: z.string(),
    base_branch: z.string(),
    branch_suggestion: z.string(),
    expected_pr_title: z.string(),
    task_goal: z.string(),
    task_summary: z.string(),
    status: z.string(),
    observed_context: z.array(z.unknown()),
    inferred_context: z.array(z.unknown()),
    suggestions_for_codex: z.array(z.unknown()),
    unresolved_user_judgment: z.array(z.unknown()),
    expected_files: z.array(z.string()),
    forbidden_files: z.array(z.string()),
    required_checks: z.array(z.string()),
    skipped_check_policy: z.array(z.string()),
    pr_body_requirements: z.array(z.string()),
    final_report_requirements: z.array(z.string()),
    proof_evidence_boundary: z.array(z.string()),
    authority_boundary: HandoffPreviewAuthorityBoundarySchema,
  })
  .passthrough();

export const HandoffPreviewSourceStatusSchema = z
  .object({
    guide_brief: z.string().optional(),
    capsule: z.string().optional(),
    launch_card: z.string().optional(),
    synthetic_operator_supplied_fields: z.array(z.string()).optional(),
    source_disclosure: z.string().optional(),
  })
  .passthrough();

export const HandoffCapsulePreviewResultSchema = z
  .object({
    response_version: z.string(),
    runtime: z.literal("augnes"),
    scope: z.string(),
    route_id: z.string(),
    route_family: z.string(),
    capsule: HandoffCapsulePreviewPacketSchema,
    route_authority_boundary: z.array(z.string()),
    source_status: HandoffPreviewSourceStatusSchema,
    warnings: z.array(z.unknown()).optional(),
    gaps: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const CodexLaunchCardPreviewResultSchema = z
  .object({
    response_version: z.string(),
    runtime: z.literal("augnes"),
    scope: z.string(),
    route_id: z.string(),
    route_family: z.string(),
    launch_card: CodexLaunchCardPreviewPacketSchema,
    route_authority_boundary: z.array(z.string()),
    source_status: HandoffPreviewSourceStatusSchema,
    warnings: z.array(z.unknown()).optional(),
    gaps: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const AutonomyPreviewAuthorityBoundarySchema = z
  .object({
    source_of_truth: z.literal(false),
    can_commit_or_reject_state: z.literal(false),
    can_record_proof: z.literal(false),
    can_create_evidence: z.literal(false),
    can_update_work: z.literal(false),
    can_mutate_memory: z.literal(false),
    can_apply_project_perspective: z.literal(false),
    can_publish_external: z.literal(false),
    can_merge: z.literal(false),
    can_retry_replay_deploy: z.literal(false),
    can_call_github: z.literal(false),
    can_call_openai_or_provider: z.literal(false),
    can_execute_codex: z.literal(false),
    can_create_branch_or_pr: z.literal(false),
    can_send_handoff: z.literal(false),
    can_launch_codex: z.literal(false),
    can_launch_autonomy: z.literal(false),
    can_schedule_background_work: z.literal(false),
    can_create_mcp_tool: z.literal(false),
    can_create_ui_action: z.literal(false),
    can_post_external_comment: z.literal(false),
    can_write_db: z.literal(false),
    can_start_daemon: z.literal(false),
  })
  .passthrough();

export const AutonomyContractPreviewPacketSchema = z
  .object({
    runtime: z.literal("augnes"),
    contract_version: z.string(),
    scope: z.string(),
    contract_id: z.string(),
    status: z.string(),
    autonomy_mode: z.string(),
    title: z.string(),
    goal: z.string(),
    bounded_context_summary: z.string(),
    allowed_actions: z.array(z.unknown()),
    forbidden_actions: z.array(z.unknown()),
    budget: z.object({}).passthrough(),
    reporting_cadence: z.object({}).passthrough(),
    stop_conditions: z.array(z.unknown()),
    delta_merge_policy: z
      .object({
        auto_apply_allowed: z.literal(false),
        auto_apply_targets: z.array(z.unknown()).length(0),
      })
      .passthrough(),
    review_escalation_policy: z.object({}).passthrough(),
    output_policy: z.object({}).passthrough(),
    staleness_policy: z.object({}).passthrough(),
    validation_policy: z.object({}).passthrough(),
    run_preview: z.object({ status: z.literal("preview_only") }).passthrough(),
    authority_boundary: AutonomyPreviewAuthorityBoundarySchema,
  })
  .passthrough();

export const AutonomyContractPreviewResultSchema = z
  .object({
    response_version: z.string(),
    runtime: z.literal("augnes"),
    scope: z.string(),
    route_id: z.string(),
    route_family: z.string(),
    contract: AutonomyContractPreviewPacketSchema,
    route_authority_boundary: z.array(z.string()),
    source_status: z.object({}).passthrough(),
    warnings: z.array(z.unknown()).optional(),
    gaps: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const AutonomyRunnerPreflightAuthorityBoundarySchema = z
  .object({
    source_of_truth: z.literal(false),
    can_start_runner: z.literal(false),
    can_schedule_runner: z.literal(false),
    can_start_daemon: z.literal(false),
    can_start_background_work: z.literal(false),
    can_commit_or_reject_state: z.literal(false),
    can_record_proof: z.literal(false),
    can_create_evidence: z.literal(false),
    can_update_work: z.literal(false),
    can_mutate_memory: z.literal(false),
    can_apply_project_perspective: z.literal(false),
    can_publish_external: z.literal(false),
    can_merge: z.literal(false),
    can_retry_replay_deploy: z.literal(false),
    can_call_github: z.literal(false),
    can_call_openai_or_provider: z.literal(false),
    can_execute_codex: z.literal(false),
    can_create_branch_or_pr: z.literal(false),
    can_send_handoff: z.literal(false),
    can_launch_codex: z.literal(false),
    can_launch_autonomy: z.literal(false),
    can_schedule_background_work: z.literal(false),
    can_create_mcp_tool: z.literal(false),
    can_create_ui_action: z.literal(false),
    can_post_external_comment: z.literal(false),
    can_write_db: z.literal(false),
    can_spend_budget: z.literal(false),
    can_auto_apply_delta: z.literal(false),
  })
  .passthrough();

export const AutonomyRunnerPreflightPublicSafetySchema = z
  .object({
    contains_private_conversation: z.literal(false),
    contains_hidden_reasoning: z.literal(false),
    contains_local_private_paths: z.literal(false),
    contains_secrets_or_tokens: z.literal(false),
    contains_raw_provider_output: z.literal(false),
    contains_raw_retrieval_output: z.literal(false),
    contains_real_account_artifacts: z.literal(false),
  })
  .passthrough();

export const AutonomyRunnerPreflightStepSchema = z
  .object({
    step_id: z.string(),
    title: z.string(),
    summary: z.string(),
    action_kind: z.string(),
    allowed_by_contract: z.boolean(),
    blocked_by: z.array(z.string()),
    source_refs: z.array(z.string()),
    expected_output: z.string(),
    would_require_review: z.boolean(),
    would_execute: z.literal(false),
  })
  .passthrough();

export const AutonomyDryRunPlanPreviewSchema = z
  .object({
    runtime: z.literal("augnes"),
    dry_run_version: z.string(),
    dry_run_id: z.string(),
    source_contract_id: z.string(),
    status: z.literal("dry_run_only"),
    planned_steps: z.array(AutonomyRunnerPreflightStepSchema),
    planned_read_sources: z.array(z.string()),
    proposed_delta_outputs: z.array(z.string()),
    proposed_delta_batches: z.array(z.string()),
    proposed_reports: z.array(z.string()),
    proposed_review_queue_items: z.array(z.string()),
    blocked_steps: z.array(z.string()),
    required_preconditions: z.array(z.string()),
    required_checks: z.array(z.string()),
    stop_conditions: z.array(z.string()),
    budget_projection: z
      .object({
        would_spend_budget: z.literal(false),
      })
      .passthrough(),
    no_run_boundary: AutonomyRunnerPreflightAuthorityBoundarySchema,
    next_phase_notes: z.array(z.string()),
  })
  .passthrough();

export const AutonomyRunnerPreflightPacketSchema = z
  .object({
    runtime: z.literal("augnes"),
    preflight_version: z.literal("autonomy_runner_preflight.v0.1"),
    scope: z.string(),
    preflight_id: z.string(),
    source_contract_id: z.string(),
    source_contract_version: z.string(),
    readiness: z.string(),
    readiness_summary: z.string(),
    budget_assessment: z.object({}).passthrough(),
    action_scope_assessment: z.object({}).passthrough(),
    delta_merge_assessment: z.object({}).passthrough(),
    review_escalation_assessment: z.object({}).passthrough(),
    stop_condition_assessment: z.object({}).passthrough(),
    staleness_assessment: z.object({}).passthrough(),
    authority_assessment: z.object({}).passthrough(),
    blockers: z.array(z.unknown()),
    warnings: z.array(z.unknown()),
    required_user_judgment: z.array(z.string()),
    required_operator_review: z.array(z.string()),
    dry_run_plan: AutonomyDryRunPlanPreviewSchema,
    source_refs: z.object({}).passthrough(),
    authority_boundary: AutonomyRunnerPreflightAuthorityBoundarySchema,
    public_safety: AutonomyRunnerPreflightPublicSafetySchema,
  })
  .passthrough();

export const AutonomyRunnerPreflightPreviewResultSchema = z
  .object({
    response_version: z.string(),
    runtime: z.literal("augnes"),
    scope: z.string(),
    route_id: z.string(),
    route_family: z.string(),
    preflight: AutonomyRunnerPreflightPacketSchema,
    dry_run_plan: AutonomyDryRunPlanPreviewSchema,
    readiness: z.string(),
    blockers: z.array(z.unknown()),
    warnings: z.array(z.unknown()),
    source_refs: z.object({}).passthrough(),
    authority_boundary: AutonomyRunnerPreflightAuthorityBoundarySchema,
    public_safety: AutonomyRunnerPreflightPublicSafetySchema,
    route_authority_boundary: z.array(z.string()),
    source_status: z.object({}).passthrough(),
    route_notes: z.array(z.string()),
  })
  .passthrough();

export const WorkEventResultSchema = z
  .object({
    scope: z.string(),
    event: WorkEventSchema,
  })
  .passthrough();

export const HandoffRecordSchema = z
  .object({
    handoff_id: z.string(),
    scope: z.string(),
    work_id: z.string().nullable(),
    source_state_brief_ref: z.string().nullable(),
    source_work_brief_ref: z.string().nullable(),
    target_agent: z.string(),
    status: z.string(),
    current_committed_state_summary: z.string(),
    task_brief: z.string(),
    expected_files: z.array(z.string()),
    expected_state_keys: z.array(z.string()),
    expected_checks: z.array(z.string()),
    expected_execution_surfaces: z.array(z.string()),
    safety_boundaries: z.array(z.string()),
    completion_record_fields: z.record(z.unknown()),
    created_by: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    supersedes_handoff_id: z.string().nullable(),
  })
  .passthrough();

export const GeneratedHandoffDraftSchema = z
  .object({
    scope: z.string(),
    handoff: HandoffRecordSchema,
    packet_text: z.string(),
  })
  .passthrough();

export const AxisReviewSchema = z
  .object({
    expected: z.array(z.string()),
    actual: z.array(z.string()),
    missing: z.array(z.string()),
    unexpected: z.array(z.string()),
    match: z.enum(["yes", "no", "partial"]),
  })
  .passthrough();

export const CodexResultReviewSchema = z
  .object({
    review_id: z.string(),
    handoff_id: z.string(),
    files: AxisReviewSchema,
    state_keys: AxisReviewSchema,
    checks: AxisReviewSchema.extend({
      skipped: z.array(
        z
          .object({
            check: z.string(),
            reason: z.string(),
          })
          .passthrough()
      ),
    }).passthrough(),
    execution_surfaces: AxisReviewSchema,
    files_match: z.enum(["yes", "no", "partial"]),
    state_keys_match: z.enum(["yes", "no", "partial"]),
    checks_match: z.enum(["yes", "no", "partial"]),
    execution_surfaces_match: z.enum(["yes", "no", "partial"]),
    mismatch_or_follow_up: z.array(z.string()),
    recommended_result_status: StateRuntimeActionResultStatusSchema,
    recommended_result_kind: StateRuntimeActionResultKindSchema,
    safety_boundary_notes: z.array(z.string()),
  })
  .passthrough();

export const ActionRecordDraftSchema = z
  .object({
    scope: z.string(),
    source_agent_id: z.string(),
    action_name: z.string(),
    result_summary: z.string(),
    files_changed: z.array(z.string()),
    result_status: StateRuntimeActionResultStatusSchema,
    result_kind: StateRuntimeActionResultKindSchema,
    work_id: z.string().nullable(),
    related_state_keys: z.array(z.string()),
    related_pr: z.string().optional(),
  })
  .passthrough();

export const WorkEventDraftSchema = z
  .object({
    scope: z.string(),
    work_id: z.string().nullable(),
    actor: z.string(),
    event_type: z.string(),
    summary: z.string(),
    result_status: StateRuntimeActionResultStatusSchema,
    result_kind: StateRuntimeActionResultKindSchema,
    related_action_id: z.string().nullable(),
    related_pr: z.string().optional(),
    related_state_keys: z.array(z.string()),
  })
  .passthrough();

export const CodexResultReviewDraftSchema = z
  .object({
    scope: z.string(),
    handoff: HandoffRecordSchema,
    review: CodexResultReviewSchema,
    action_record_draft: ActionRecordDraftSchema,
    work_event_draft: WorkEventDraftSchema,
  })
  .passthrough();

export const MailboxSummaryItemSchema = z
  .object({
    message_id: z.string(),
    scope: z.string(),
    work_id: z.string().nullable(),
    from_agent: z.string(),
    to_agent: z.string(),
    message_type: z.string(),
    summary: z.string(),
    payload_ref: z.string().nullable(),
    requires_ack: z.boolean(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    acknowledged_at: z.string().nullable(),
    supersedes_message_id: z.string().nullable(),
    summary_reason: z.string(),
  })
  .passthrough();

export const MailboxSummarySchema = z
  .object({
    pending_handoffs: z.array(MailboxSummaryItemSchema),
    needs_review: z.array(MailboxSummaryItemSchema),
    approval_needed: z.array(MailboxSummaryItemSchema),
    blocked_or_partial: z.array(MailboxSummaryItemSchema),
    inactive: z
      .object({
        superseded_count: z.number(),
        expired_count: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

export const MailboxSummaryResultSchema = z
  .object({
    scope: z.string(),
    as_of: z.string(),
    summary: MailboxSummarySchema,
    boundaries: z.array(z.string()),
  })
  .passthrough();

export const PublicationSummaryItemSchema = z
  .object({
    publication_id: z.string(),
    scope: z.string(),
    work_id: z.string().nullable(),
    source_event_id: z.string().nullable(),
    target_surface: z.string(),
    target_ref: z.string(),
    status: z.string(),
    preview_excerpt: z.string(),
    created_by: z.string(),
    approved_by: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    sent_at: z.string().nullable(),
    latest_delivery_status: z.string().nullable(),
    latest_delivery_id: z.string().nullable(),
    latest_delivery_error: z.string().nullable(),
    latest_delivery_external_artifact_id: z.string().nullable().optional(),
    latest_delivery_external_artifact_url: z.string().nullable().optional(),
    latest_delivery_external_artifact_type: z.string().nullable().optional(),
    delivery_count: z.number(),
    publish_eligibility: z
      .object({
        dry_run: z.boolean(),
        actual_publish: z.boolean(),
        reason: z.string(),
      })
      .passthrough(),
    summary_reason: z.string(),
  })
  .passthrough();

export const FailedDeliverySummaryItemSchema = z
  .object({
    delivery_id: z.string(),
    publication_id: z.string(),
    scope: z.string(),
    target_surface: z.string(),
    target_ref: z.string(),
    status: z.string(),
    error_message: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    sent_at: z.string().nullable(),
    acknowledged_at: z.string().nullable(),
    external_artifact_id: z.string().nullable().optional(),
    external_artifact_url: z.string().nullable().optional(),
    external_artifact_type: z.string().nullable().optional(),
    publication_status: z.string().nullable(),
    work_id: z.string().nullable(),
    summary_reason: z.string(),
  })
  .passthrough();

export const PublicationSummarySchema = z
  .object({
    drafts: z.array(PublicationSummaryItemSchema),
    approved_previews: z.array(PublicationSummaryItemSchema),
    sent: z.array(PublicationSummaryItemSchema),
    failed: z.array(PublicationSummaryItemSchema),
    cancelled: z.array(PublicationSummaryItemSchema),
    delivery_status: z
      .object({
        pending_count: z.number(),
        sent_count: z.number(),
        failed_count: z.number(),
        acknowledged_count: z.number(),
      })
      .passthrough(),
    failed_deliveries: z.array(FailedDeliverySummaryItemSchema),
  })
  .passthrough();

export const PublicationSummaryResultSchema = z
  .object({
    scope: z.string(),
    as_of: z.string(),
    summary: PublicationSummarySchema,
    limits: z
      .object({
        bounded_view: z.literal(true),
        publication_limit: z.number(),
        delivery_limit: z.number(),
      })
      .passthrough(),
    boundaries: z.array(z.string()),
  })
  .passthrough();

export const ControlPacketBoundariesSchema = z
  .object({
    derived_view_only: z.literal(true),
    approval_authority: z.literal(false),
    publish_authority: z.literal(false),
    retry_authority: z.literal(false),
    proof_recording: z.literal(false),
    state_commit_or_reject: z.literal(false),
    codex_execution: z.literal(false),
    source_of_truth: z.literal(false),
    creates_durable_records: z.literal(false),
    external_side_effects: z.literal(false),
  })
  .passthrough();

export const ControlPacketSchema = z
  .object({
    runtime: z.string(),
    packet_version: z.string(),
    scope: z.string(),
    as_of: z.string(),
    source_refs: z.record(z.unknown()),
    relevant_publication_state: z
      .object({
        drafts: z.array(PublicationSummaryItemSchema),
        approved_previews: z.array(PublicationSummaryItemSchema),
        sent: z.array(PublicationSummaryItemSchema),
        failed: z.array(PublicationSummaryItemSchema),
        cancelled: z.array(PublicationSummaryItemSchema),
      })
      .passthrough(),
    relevant_delivery_state: z
      .object({
        status_counts: z.record(z.number()),
        failed_deliveries: z.array(FailedDeliverySummaryItemSchema),
      })
      .passthrough(),
    pending_user_decisions: z.array(z.unknown()),
    active_risks: z.array(z.unknown()),
    authority_boundaries: z.record(z.unknown()),
    next_suggested_goal: z.record(z.unknown()),
    surface_rendering_hints: z.record(z.unknown()),
    forbidden_actions: z.array(z.unknown()).optional(),
    boundaries: ControlPacketBoundariesSchema,
  })
  .passthrough();

export const PendingProposalsResultSchema = z.union([
  z.array(StateRuntimeProposalSchema),
  z
    .object({
      proposals: z.array(StateRuntimeProposalSchema),
    })
    .passthrough(),
]);

export type StateRuntimeScope = z.infer<typeof StateRuntimeScopeSchema>;
export type StateRuntimeLimit = z.infer<typeof StateRuntimeLimitSchema>;
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;
export type StateRuntimeStateItem = z.infer<typeof StateRuntimeStateItemSchema>;
export type StateRuntimeStateBlock = z.infer<typeof StateRuntimeStateBlockSchema>;
export type StateRuntimeProposal = z.infer<typeof StateRuntimeProposalSchema>;
export type StateRuntimeActionRecord = z.infer<typeof StateRuntimeActionRecordSchema>;
export type PlannerRecommendation = z.infer<typeof PlannerRecommendationSchema>;
export type StateBriefAgentHandoff = z.infer<typeof StateBriefAgentHandoffSchema>;
export type StateBrief = z.infer<typeof StateBriefSchema>;
export type ObserveResult = z.infer<typeof ObserveResultSchema>;
export type PlanResult = z.infer<typeof PlanResultSchema>;
export type ActionRecordResult = z.infer<typeof ActionRecordResultSchema>;
export type StateRuntimeActionResultStatus = z.infer<typeof StateRuntimeActionResultStatusSchema>;
export type StateRuntimeActionResultKind = z.infer<typeof StateRuntimeActionResultKindSchema>;
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type WorkBrief = z.infer<typeof WorkBriefSchema>;
export type EvidencePackResult = z.infer<typeof EvidencePackResultSchema>;
export type SessionTraceSession = z.infer<typeof SessionTraceSessionSchema>;
export type SessionTraceResult = z.infer<typeof SessionTraceResultSchema>;
export type VerificationEvidenceRecord = z.infer<typeof VerificationEvidenceRecordSchema>;
export type VerificationEvidenceRecordsResult = z.infer<typeof VerificationEvidenceRecordsResultSchema>;
export type ConstellationPreviewResult = z.infer<typeof ConstellationPreviewResultSchema>;
export type GuideBriefResult = z.infer<typeof GuideBriefResultSchema>;
export type HandoffCapsulePreviewResult = z.infer<typeof HandoffCapsulePreviewResultSchema>;
export type CodexLaunchCardPreviewResult = z.infer<typeof CodexLaunchCardPreviewResultSchema>;
export type AutonomyContractPreviewResult = z.infer<typeof AutonomyContractPreviewResultSchema>;
export type AutonomyRunnerPreflightPreviewResult = z.infer<typeof AutonomyRunnerPreflightPreviewResultSchema>;
export type WorkEventResult = z.infer<typeof WorkEventResultSchema>;
export type HandoffRecord = z.infer<typeof HandoffRecordSchema>;
export type GeneratedHandoffDraft = z.infer<typeof GeneratedHandoffDraftSchema>;
export type CodexResultReviewDraft = z.infer<typeof CodexResultReviewDraftSchema>;
export type MailboxSummaryResult = z.infer<typeof MailboxSummaryResultSchema>;
export type PublicationSummaryResult = z.infer<typeof PublicationSummaryResultSchema>;
export type ControlPacket = z.infer<typeof ControlPacketSchema>;

export interface StateRuntimePlanInput {
  workspaceId: string;
  projectId: string;
  expectedActiveProjectId: string;
  expectedActiveSelectionRevision: number;
  message: string;
  projectRoot?: {
    pathFlavor: "posix" | "win32";
    normalizedPath: string;
  };
  executionMode?: "live" | "deterministic";
}
export interface StateRuntimeObserveInput {
  workspaceId: string;
  projectId: string;
  expectedActiveProjectId: string;
  expectedActiveSelectionRevision: number;
  message: string;
  projectRoot?: {
    pathFlavor: "posix" | "win32";
    normalizedPath: string;
  };
  executionMode?: "live" | "deterministic";
}

export interface StateRuntimeEvidencePackInput {
  scope: StateRuntimeScope;
  workId?: string;
  publicationId?: string;
  deliveryId?: string;
  targetRef?: string;
}

export interface StateRuntimeSessionTraceInput {
  scope: StateRuntimeScope;
  sessionId?: string;
  limit?: StateRuntimeLimit;
}

export interface StateRuntimeVerificationEvidenceRecordsInput {
  scope: StateRuntimeScope;
  workId?: string;
  publicationId?: string;
  deliveryId?: string;
  targetSurface?: string;
  targetRef?: string;
  evidenceKind?: EvidenceKind;
  status?: EvidenceStatus;
  limit?: StateRuntimeLimit;
}

export interface StateRuntimeHandoffCapsulePreviewInput {
  scope: StateRuntimeScope;
  target: string;
}

export interface StateRuntimeCodexLaunchCardPreviewInput {
  scope: StateRuntimeScope;
}

export interface StateRuntimeAutonomyContractPreviewInput {
  scope: StateRuntimeScope;
}

export interface StateRuntimeAutonomyRunnerPreflightInput {
  scope: StateRuntimeScope;
}

export interface StateRuntimeActionResultInput {
  scope: StateRuntimeScope;
  sourceAgentId: string;
  actionName: string;
  resultSummary: string;
  filesChanged?: string[];
  resultStatus?: StateRuntimeActionResultStatus;
  resultKind?: StateRuntimeActionResultKind;
}

export interface StateRuntimeWorkEventInput {
  scope: StateRuntimeScope;
  workId: string;
  actor?: "user" | "chatgpt" | "codex" | "augnes_runtime";
  eventType?: "note" | "implementation" | "verification" | "review" | "handoff" | "blocked" | "decision";
  summary: string;
  resultStatus?: StateRuntimeActionResultStatus;
  resultKind?: StateRuntimeActionResultKind;
  relatedActionId?: string;
  relatedPr?: string;
  relatedStateKeys?: string[];
}

export interface GenerateHandoffDraftInput {
  scope: StateRuntimeScope;
  workId: string;
  targetAgent?: string;
  createdBy?: string;
}

export interface ReviewCodexResultDraftInput {
  scope: StateRuntimeScope;
  handoffId: string;
  actualFilesChanged?: string[];
  actualStateKeys?: string[];
  actualChecks?: string[];
  actualExecutionSurfaces?: string[];
  resultStatus?: StateRuntimeActionResultStatus;
  resultKind?: StateRuntimeActionResultKind;
  resultSummary: string;
  relatedPr?: string;
  blockersOrFailures?: string[];
  skippedChecks?: Array<string | { check: string; reason: string }>;
}

export interface StateRuntimeBridgeAdapter {
  getStateBrief(scope: StateRuntimeScope): Promise<StateBrief>;
  getConstellationPreview(scope: StateRuntimeScope): Promise<ConstellationPreviewResult>;
  getGuideBrief(scope: StateRuntimeScope): Promise<GuideBriefResult>;
  getHandoffCapsulePreview(input: StateRuntimeHandoffCapsulePreviewInput): Promise<HandoffCapsulePreviewResult>;
  getCodexLaunchCardPreview(input: StateRuntimeCodexLaunchCardPreviewInput): Promise<CodexLaunchCardPreviewResult>;
  getAutonomyContractPreview(input: StateRuntimeAutonomyContractPreviewInput): Promise<AutonomyContractPreviewResult>;
  getAutonomyRunnerPreflight(input: StateRuntimeAutonomyRunnerPreflightInput): Promise<AutonomyRunnerPreflightPreviewResult>;
  getEvidencePack(input: StateRuntimeEvidencePackInput): Promise<EvidencePackResult>;
  getSessionTrace(input: StateRuntimeSessionTraceInput): Promise<SessionTraceResult>;
  getVerificationEvidenceRecords(
    input: StateRuntimeVerificationEvidenceRecordsInput
  ): Promise<VerificationEvidenceRecordsResult>;
  observe(input: StateRuntimeObserveInput): Promise<ObserveResult>;
  plan(input: StateRuntimePlanInput): Promise<PlanResult>;
  recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult>;
  listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]>;
  listWorkItems(scope: StateRuntimeScope): Promise<WorkItem[]>;
  getWorkBrief(scope: StateRuntimeScope, workId: string): Promise<WorkBrief>;
  recordWorkEvent(input: StateRuntimeWorkEventInput): Promise<WorkEventResult>;
  generateHandoffDraft(input: GenerateHandoffDraftInput): Promise<GeneratedHandoffDraft>;
  reviewCodexResultDraft(input: ReviewCodexResultDraftInput): Promise<CodexResultReviewDraft>;
  getMailboxSummary(scope: StateRuntimeScope): Promise<MailboxSummaryResult>;
  getPublicationSummary(scope: StateRuntimeScope): Promise<PublicationSummaryResult>;
  getControlPacket(scope: StateRuntimeScope): Promise<ControlPacket>;
}
