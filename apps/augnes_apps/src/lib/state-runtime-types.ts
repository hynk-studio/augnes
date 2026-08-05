import { z } from "zod";
import { ProjectionSchema as CodexCurrentContinuityProjectionSchema } from "../../scripts/codex-current-continuity.js";

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
    quality: z.literal("reported"),
    source: z.literal("provider_response"),
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
    total_tokens: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (value) => value.total_tokens >= value.input_tokens + value.output_tokens,
    "total token usage must cover input and output usage"
  );
const ModelGatewayExternalRefSchema = z
  .object({
    ref_version: z.literal("external_ref.v0.1"),
    ref_type: ModelGatewaySafeIdentifierSchema,
    external_id: ModelGatewaySafeIdentifierSchema,
    provider: ModelGatewaySafeIdentifierSchema.nullable().optional(),
    host: ModelGatewaySafeIdentifierSchema.nullable().optional(),
    observed_at: z.string().datetime({ offset: true }).nullable().optional(),
    source_ref: ModelGatewayProvenanceRefSchema.nullable().optional(),
    compatibility_namespace: ModelGatewaySafeIdentifierSchema.nullable().optional(),
    trust_class: z.enum([
      "direct_local_observation",
      "verified_external_observation",
      "host_attestation",
      "provider_report",
      "user_declaration",
      "imported_unverified",
      "derived_interpretation",
    ]),
  })
  .strict();
const ModelGatewayCostSchema = z
  .object({
    basis: z.literal("unavailable"),
    amount: z.null(),
    currency: z.null(),
    source: z.literal("no_pricing_authority"),
  })
  .strict();
const ModelGatewayBudgetReceiptSchema = z
  .object({
    decision: z.enum(["within_budget", "not_used", "refused"]),
    input_bytes_limit: z.number().int().positive(),
    input_bytes_used: z.number().int().nonnegative().nullable(),
    output_tokens_limit: z.number().int().positive(),
    output_tokens_used: z.number().int().nonnegative().nullable(),
    provider_call_limit: z.union([z.literal(0), z.literal(1)]),
    provider_calls_used: z.union([z.literal(0), z.literal(1)]),
    timeout_limit_ms: z.number().int().positive(),
    timeout_disposition: z.enum([
      "completed_within_deadline",
      "timed_out",
      "cancelled",
    ]),
  })
  .strict()
  .refine(
    (value) =>
      value.provider_calls_used <= value.provider_call_limit &&
      (value.input_bytes_used === null ||
        value.input_bytes_used <= value.input_bytes_limit) &&
      (value.output_tokens_used === null ||
        value.output_tokens_used <= value.output_tokens_limit),
    "model invocation usage must remain within the receipt budget"
  );

// Exact v0.2 mirror: the Apps package cannot import the root Next runtime module.
export const ModelInvocationReceiptSchema = z
  .object({
    receipt_version: z.literal("model_invocation_receipt.v0.2"),
    gateway_version: z.literal("model_gateway.v0.1"),
    invocation_id: ModelGatewaySafeIdentifierSchema,
    workspace_id: CanonicalWorkspaceIdSchema,
    project_id: CanonicalProjectIdSchema,
    work_id: ModelGatewaySafeIdentifierSchema.nullable(),
    run_id: ModelGatewaySafeIdentifierSchema.nullable(),
    purpose: z.enum([
      "observe_delta_compile",
      "planner_plan",
      "strategic_advantage_transfer",
      "temporal_interpretation",
    ]),
    invocation_origin: z.enum(["interactive", "policy_triggered"]),
    attempted_implementation_id: ModelGatewaySafeIdentifierSchema.nullable(),
    attempted_implementation_version: ModelGatewaySafeIdentifierSchema.nullable(),
    attempted_provider_ref: ModelGatewayExternalRefSchema.nullable(),
    attempted_model_ref: ModelGatewayExternalRefSchema.nullable(),
    final_implementation_id: ModelGatewaySafeIdentifierSchema,
    final_implementation_version: ModelGatewaySafeIdentifierSchema,
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
    status: z.enum([
      "completed",
      "blocked",
      "failed",
      "cancelled",
      "timed_out",
    ]),
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
    egress_policy_version: z.literal("model_gateway_egress_policy.v0.1"),
    usage: ModelGatewayUsageSchema.nullable(),
    cost: ModelGatewayCostSchema,
    budget: ModelGatewayBudgetReceiptSchema,
    cancellation_disposition: z.enum(["not_cancelled", "cancelled"]),
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
    grant_lineage_ref: ModelGatewayExternalRefSchema.nullable(),
    automation_control_lineage_ref: ModelGatewayExternalRefSchema.nullable(),
    fallback_used: z.boolean(),
    coverage_class: z.literal("enforced"),
    trust_class: z.enum([
      "direct_local_observation",
      "provider_report",
      "mixed",
    ]),
    raw_prompt_persisted: z.literal(false),
    raw_response_persisted: z.literal(false),
    hidden_reasoning_persisted: z.literal(false),
    receipt_is_semantic_authority: z.literal(false),
    normalized_output_fingerprint: z
      .string()
      .regex(/^sha256:[0-9a-f]{64}$/)
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((receipt, context) => {
    if (
      receipt.purpose === "strategic_advantage_transfer" &&
      receipt.status === "completed" &&
      typeof receipt.normalized_output_fingerprint !== "string"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed strategic receipts must bind the normalized output fingerprint",
      });
    }
    const policyTriggered = receipt.invocation_origin === "policy_triggered";
    const hasPolicyLineage =
      receipt.work_id !== null &&
      receipt.run_id !== null &&
      receipt.grant_lineage_ref !== null &&
      receipt.automation_control_lineage_ref !== null;
    const hasAnyPolicyLineage =
      receipt.work_id !== null ||
      receipt.run_id !== null ||
      receipt.grant_lineage_ref !== null ||
      receipt.automation_control_lineage_ref !== null;
    const attemptedImplementationComplete =
      (receipt.attempted_implementation_id === null) ===
      (receipt.attempted_implementation_version === null);
    const attemptedProviderComplete =
      (receipt.attempted_provider_ref === null) ===
      (receipt.attempted_model_ref === null);
    const providerRefsConsistent =
      receipt.attempted_provider_ref === null ||
      (receipt.attempted_provider_ref.ref_type === "model_provider" &&
        receipt.attempted_model_ref?.ref_type === "provider_model" &&
        receipt.attempted_provider_ref.trust_class ===
          "direct_local_observation" &&
        receipt.attempted_model_ref.trust_class ===
          "direct_local_observation" &&
        receipt.attempted_provider_ref.provider ===
          receipt.attempted_provider_ref.external_id &&
        receipt.attempted_model_ref.provider ===
          receipt.attempted_provider_ref.external_id);
    const policyLineageConsistent =
      !policyTriggered ||
      (receipt.grant_lineage_ref?.ref_type ===
        "model_invocation_capability_grant" &&
        receipt.grant_lineage_ref.trust_class ===
          "direct_local_observation" &&
        /^sha256:[0-9a-f]{64}$/.test(
          receipt.grant_lineage_ref.source_ref ?? ""
        ) &&
        receipt.automation_control_lineage_ref?.ref_type ===
          "project_automation_control" &&
        receipt.automation_control_lineage_ref.trust_class ===
          "direct_local_observation" &&
        receipt.automation_control_lineage_ref.external_id.startsWith(
          `${receipt.project_id}:automation-control:`
        ) &&
        /^control-revision:[1-9][0-9]*$/.test(
          receipt.automation_control_lineage_ref.source_ref ?? ""
        ) &&
        receipt.automation_control_lineage_ref.external_id.slice(
          receipt.automation_control_lineage_ref.external_id.lastIndexOf(":") +
            1
        ) ===
          receipt.automation_control_lineage_ref.source_ref?.slice(
            "control-revision:".length
          ));
    const providerFailureCodes = new Set<string>([
      "model_gateway_provider_rejected",
      "model_gateway_provider_response_invalid",
      "model_gateway_transport_failed",
    ]);
    const refusalFailureCodes = new Set<string>([
      "model_gateway_invalid_envelope",
      "model_gateway_scope_refused",
      "model_gateway_policy_refused",
      "model_gateway_budget_refused",
      "model_gateway_egress_refused",
    ]);
    const providerCallsUsed = receipt.budget.provider_calls_used;
    const providerRefsPresent = receipt.attempted_provider_ref !== null;
    const expectedPrivacyDecision =
      receipt.egress_status === "occurred"
        ? "provider_egress_approved"
        : receipt.egress_status === "blocked"
          ? "provider_egress_blocked"
          : "provider_egress_not_used";
    const statusOutcomes: Record<string, readonly string[]> = {
      completed: [
        "live_success",
        "deterministic_success",
        "deterministic_fallback_success",
      ],
      blocked: ["refused"],
      failed: ["provider_failure", "deterministic_failure"],
      cancelled: ["cancelled"],
      timed_out: ["timeout"],
    };
    const statusOutcomeConsistent = statusOutcomes[receipt.status].includes(
      receipt.outcome
    );
    const failureConsistent =
      receipt.status === "completed"
        ? receipt.outcome === "deterministic_fallback_success"
          ? providerFailureCodes.has(receipt.failure_code ?? "")
          : receipt.failure_code === null
        : receipt.failure_code !== null;
    const usageConsistent =
      receipt.usage === null ||
      (providerCallsUsed === 1 &&
        receipt.egress_status === "occurred" &&
        providerRefsPresent &&
        receipt.outcome === "live_success" &&
        receipt.trust_class === "provider_report");
    let selectionConsistent = false;
    if (receipt.selection_reason === "explicit_deterministic") {
      selectionConsistent =
        receipt.requested_mode === "deterministic" &&
        receipt.execution_mode === "deterministic" &&
        receipt.attempted_implementation_id === null &&
        !providerRefsPresent &&
        !receipt.egress_attempted &&
        providerCallsUsed === 0 &&
        receipt.egress_status === "did_not_occur" &&
        receipt.usage === null &&
        !receipt.fallback_used &&
        receipt.trust_class === "direct_local_observation";
    } else if (receipt.selection_reason === "provider_unavailable") {
      selectionConsistent =
        receipt.requested_mode === "live" &&
        receipt.execution_mode === "deterministic" &&
        receipt.attempted_implementation_id !== null &&
        !providerRefsPresent &&
        !receipt.egress_attempted &&
        providerCallsUsed === 0 &&
        receipt.egress_status === "did_not_occur" &&
        receipt.usage === null &&
        !receipt.fallback_used &&
        receipt.trust_class === "direct_local_observation";
    } else if (receipt.selection_reason === "requested_live") {
      selectionConsistent =
        receipt.requested_mode === "live" &&
        receipt.execution_mode === "live" &&
        receipt.attempted_implementation_id !== null &&
        !receipt.fallback_used &&
        receipt.trust_class ===
          (receipt.outcome === "live_success"
            ? "provider_report"
            : "direct_local_observation");
    } else {
      selectionConsistent =
        receipt.requested_mode === "live" &&
        receipt.execution_mode === "deterministic" &&
        receipt.attempted_implementation_id !== null &&
        providerRefsPresent &&
        receipt.final_implementation_id !==
          receipt.attempted_implementation_id &&
        receipt.egress_attempted &&
        providerCallsUsed === 1 &&
        receipt.egress_status === "occurred" &&
        receipt.usage === null &&
        receipt.fallback_used &&
        receipt.trust_class === "mixed" &&
        [
          "deterministic_fallback_success",
          "deterministic_failure",
          "timeout",
          "cancelled",
        ].includes(receipt.outcome);
    }
    let outcomeConsistent = false;
    if (receipt.outcome === "live_success") {
      outcomeConsistent =
        receipt.status === "completed" &&
        receipt.requested_mode === "live" &&
        receipt.execution_mode === "live" &&
        receipt.selection_reason === "requested_live" &&
        !receipt.fallback_used &&
        receipt.attempted_implementation_id !== null &&
        providerRefsPresent &&
        receipt.egress_attempted &&
        receipt.egress_status === "occurred" &&
        providerCallsUsed === 1 &&
        receipt.failure_code === null &&
        receipt.trust_class === "provider_report" &&
        receipt.budget.decision === "within_budget";
    } else if (receipt.outcome === "deterministic_success") {
      outcomeConsistent =
        receipt.status === "completed" &&
        receipt.execution_mode === "deterministic" &&
        ["explicit_deterministic", "provider_unavailable"].includes(
          receipt.selection_reason
        ) &&
        !receipt.fallback_used &&
        !receipt.egress_attempted &&
        providerCallsUsed === 0 &&
        receipt.egress_status === "did_not_occur" &&
        receipt.usage === null &&
        receipt.failure_code === null &&
        receipt.trust_class === "direct_local_observation" &&
        receipt.budget.decision === "not_used";
    } else if (receipt.outcome === "deterministic_fallback_success") {
      outcomeConsistent =
        receipt.status === "completed" &&
        receipt.selection_reason === "provider_failure_fallback" &&
        providerFailureCodes.has(receipt.failure_code ?? "") &&
        receipt.budget.decision === "within_budget";
    } else if (receipt.outcome === "provider_failure") {
      outcomeConsistent =
        receipt.status === "failed" &&
        receipt.requested_mode === "live" &&
        receipt.execution_mode === "live" &&
        receipt.selection_reason === "requested_live" &&
        providerFailureCodes.has(receipt.failure_code ?? "") &&
        receipt.usage === null &&
        receipt.trust_class === "direct_local_observation" &&
        receipt.egress_status ===
          (providerCallsUsed === 1 ? "occurred" : "did_not_occur") &&
        receipt.budget.decision ===
          (providerCallsUsed === 1 ? "within_budget" : "not_used");
    } else if (receipt.outcome === "deterministic_failure") {
      outcomeConsistent =
        receipt.status === "failed" &&
        receipt.execution_mode === "deterministic" &&
        receipt.failure_code === "model_gateway_deterministic_failed" &&
        receipt.usage === null;
    } else if (receipt.outcome === "refused") {
      outcomeConsistent =
        receipt.status === "blocked" &&
        refusalFailureCodes.has(receipt.failure_code ?? "") &&
        receipt.usage === null &&
        receipt.budget.decision === "refused" &&
        receipt.egress_status ===
          (providerCallsUsed === 1 ? "occurred" : "blocked");
    } else if (receipt.outcome === "timeout") {
      outcomeConsistent =
        receipt.status === "timed_out" &&
        receipt.failure_code === "model_gateway_timeout" &&
        receipt.budget.timeout_disposition === "timed_out" &&
        receipt.cancellation_disposition === "not_cancelled" &&
        receipt.usage === null &&
        receipt.budget.decision ===
          (providerCallsUsed === 1 ? "within_budget" : "not_used");
    } else {
      outcomeConsistent =
        receipt.status === "cancelled" &&
        receipt.failure_code === "model_gateway_cancelled" &&
        receipt.budget.timeout_disposition === "cancelled" &&
        receipt.cancellation_disposition === "cancelled" &&
        receipt.usage === null &&
        receipt.budget.decision ===
          (providerCallsUsed === 1 ? "within_budget" : "not_used");
    }
    if (
      (policyTriggered ? !hasPolicyLineage : hasAnyPolicyLineage) ||
      !attemptedImplementationComplete ||
      !attemptedProviderComplete ||
      !providerRefsConsistent ||
      !policyLineageConsistent ||
      receipt.budget.output_tokens_used !==
        (receipt.usage?.output_tokens ?? null) ||
      receipt.egress_attempted !== (providerCallsUsed === 1) ||
      (receipt.egress_status === "occurred") !== (providerCallsUsed === 1) ||
      (providerCallsUsed === 1 && !providerRefsPresent) ||
      receipt.privacy_decision !== expectedPrivacyDecision ||
      (receipt.outcome !== "refused" && receipt.egress_status === "blocked") ||
      receipt.fallback_used !==
        (receipt.selection_reason === "provider_failure_fallback") ||
      !statusOutcomeConsistent ||
      !failureConsistent ||
      (receipt.budget.decision === "refused") !==
        (receipt.outcome === "refused") ||
      !usageConsistent ||
      !selectionConsistent ||
      !outcomeConsistent
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "model invocation receipt fields are internally inconsistent",
      });
    }
  });

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
    projectId: z.string().regex(/^project:[0-9a-f-]{36}$/iu).optional(),
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
    can_approve: z.literal(false),
    can_transition: z.literal(false),
    can_publish_external: z.literal(false),
    can_merge: z.literal(false),
    can_retry: z.literal(false),
    can_call_github: z.literal(false),
    can_call_openai_or_provider: z.literal(false),
    can_execute_codex: z.literal(false),
    can_create_branch_or_pr: z.literal(false),
    can_send_handoff: z.literal(false),
    can_launch_autonomy: z.literal(false),
    can_write_db: z.literal(false),
    can_create_ui_action: z.literal(false),
    can_grant_host_permission: z.literal(false),
    notes: z.array(z.string()),
  })
  .passthrough();

export const GuideBriefResultSchema = z
  .object({
    runtime: z.literal("augnes_current_project"),
    guide_version: z.literal("guide_brief.v0.2"),
    generated_at: z.string(),
    request: z.object({ scope: z.literal("project:augnes") }).passthrough(),
    identity: z.object({
      workspace_id: z.string().nullable(),
      project_id: z.string().nullable(),
      project_display_name: z.string().nullable(),
      project_context: z.enum(["none", "current", "viewed"]),
      active_project_id: z.string().nullable(),
      root_resolution: z.enum(["none", "available", "unavailable", "not_found"]),
    }),
    source_status: z.enum(["live_current_project", "project_choice", "viewed_project", "partial", "unavailable"]),
    gaps: z.array(z.string()),
    coordinate: z.object({
      focus: z.string(),
      goal: z.string().nullable(),
      work_status: z.string(),
      result_available: z.boolean(),
      result_summary: z.string().nullable(),
      verification: z.object({ passed: z.number(), failed: z.number(), skipped: z.number() }).nullable(),
      material_blocker_or_uncertainty: z.string().nullable(),
      unresolved_user_judgment: z.string().nullable(),
      recent_meaningful_change: z.string().nullable(),
      delegated_work: z
        .object({
          stage: z.enum([
            "not_started",
            "preparing",
            "working",
            "waiting_for_approval",
            "cancelling",
            "resume_required",
            "result_ready",
            "blocked",
            "failed",
            "cancelled",
            "timed_out",
            "unavailable",
          ]),
          latest_checkpoint: z.string().nullable(),
          needs_user: z.boolean(),
          trusted_result_available: z.boolean(),
          next_action: z.enum([
            "open_ai_workplane",
            "start_codex_work",
            "review_requested_access",
            "resume_codex_work",
            "view_progress",
            "review_result",
            "return_to_blank_state",
            "none",
          ]),
        })
        .nullable(),
    }),
    observed: z.array(z.object({ item_id: z.string(), statement: z.string(), source_refs: z.array(z.string()) })),
    inferred: z.array(z.object({ item_id: z.string(), statement: z.string(), supporting_observation_ids: z.array(z.string()), confidence: z.enum(["high", "medium", "low"]), caveats: z.array(z.string()) })),
    suggested: z.array(z.object({ item_id: z.string(), label: z.string(), reason: z.string(), href: z.string().nullable(), action_ref: z.string().nullable(), blockers: z.array(z.string()), source_refs: z.array(z.string()), executes: z.literal(false) })),
    needs_user_judgment: z.array(z.object({ item_id: z.string(), question: z.string(), why_it_matters: z.string(), blocked: z.array(z.string()), source_refs: z.array(z.string()), resolved: z.literal(false) })),
    primary_guidance: z.object({ label: z.string(), reason: z.string(), href: z.string().nullable(), action_ref: z.string().nullable(), requires_user_judgment: z.boolean(), source_refs: z.array(z.string()), executes: z.literal(false) }).passthrough(),
    source_refs: z.array(z.object({ ref_id: z.string(), kind: z.string(), label: z.string(), href: z.string().nullable() })),
    projections: z.object({ chatgpt: z.record(z.unknown()), codex: z.record(z.unknown()) }).passthrough(),
    authority: GuideBriefAuthorityBoundarySchema,
    safety: z.object({
      contains_private_absolute_paths: z.literal(false),
      contains_credentials: z.literal(false),
      contains_raw_provider_output: z.literal(false),
      contains_hidden_reasoning: z.literal(false),
      contains_raw_transcripts: z.literal(false),
      provider_or_network_calls: z.literal(false),
      persisted: z.literal(false),
    }),
  })
  .passthrough();

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
export type AutonomyContractPreviewResult = z.infer<typeof AutonomyContractPreviewResultSchema>;
export type AutonomyRunnerPreflightPreviewResult = z.infer<typeof AutonomyRunnerPreflightPreviewResultSchema>;
export type WorkEventResult = z.infer<typeof WorkEventResultSchema>;
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

const CodexRepositoryAuthoritySchema = z.object({
  writes_database: z.literal(false),
  writes_project_files: z.literal(false),
  changes_project_selection: z.literal(false),
  changes_operator_session: z.literal(false),
  creates_run: z.literal(false),
  starts_codex_or_native_host: z.literal(false),
  calls_provider: z.literal(false),
  approves_host_action: z.literal(false),
  cancels_or_resumes_run: z.literal(false),
  creates_or_admits_result: z.literal(false),
  creates_proof_or_evidence: z.literal(false),
  creates_proposal: z.literal(false),
  creates_review_decision: z.literal(false),
  creates_or_applies_transition: z.literal(false),
  mutates_accepted_state: z.literal(false),
  retries_or_replays: z.literal(false),
  calls_github: z.literal(false),
  creates_branch_or_pr: z.literal(false),
  merges_releases_or_deploys: z.literal(false),
  starts_background_work: z.literal(false),
}).strict();

export const CodexRepositoryContinuityResultSchema = z.object({
  projection_version: z.literal("codex_repository_continuity.v0.1"),
  generated_at: z.string().datetime(),
  repository_resolution: z.object({
    status: z.enum([
      "resolved_exact",
      "project_not_registered",
      "project_ambiguous",
      "root_unavailable",
      "repository_input_invalid",
      "companion_unavailable",
    ]),
    project_key: z.string().nullable(),
    display_name: z.string().nullable(),
    message: z.string(),
  }).strict(),
  continuity: CodexCurrentContinuityProjectionSchema.nullable(),
  resume_eligibility: z.object({
    projection_version: z.literal("repository_run_resume_eligibility.v0.1"),
    generated_at: z.string().datetime(),
    status: z.enum([
      "active_owned",
      "terminal",
      "approval_pending",
      "resume_ready",
      "reconciliation_required",
      "stale",
      "unsupported",
      "unavailable",
    ]),
    summary: z.string().max(640),
    run_state: z.enum([
      "active",
      "paused_or_disconnected",
      "terminal",
      "not_available",
    ]),
    last_confirmed_operation: z.object({
      operation_class: z.enum(["command_execution", "file_change"]),
      certainty: z.enum(["not_started", "completed", "failed", "cancelled"]),
      summary: z.string().max(640),
      observed_at: z.string().datetime(),
    }).strict().nullable(),
    pending_approval: z.object({
      operation_class: z.enum([
        "command_execution",
        "file_change",
        "filesystem_permission",
        "network_permission",
      ]),
      title: z.string().max(640),
      reason: z.string().max(640),
      risk: z.string().max(640),
      resource_summary: z.string().max(640),
      available_decisions: z.array(z.enum([
        "approve_once",
        "decline",
        "cancel_run",
      ])).max(3),
      expires_at: z.string().datetime().nullable(),
    }).strict().nullable(),
    next_action: z.object({
      kind: z.enum([
        "view_progress",
        "review_result",
        "review_approval",
        "explicit_resume_not_yet_available",
        "review_uncertain_operation",
        "restore_checkpoint_state",
        "restore_resume_support",
        "restore_continuity",
      ]),
      label: z.string().max(640),
      reason: z.string().max(640),
      executes: z.literal(false),
    }).strict(),
    gaps: z.array(z.string()).max(12),
    authority: z.object({
      writes_database: z.literal(false),
      writes_project_files: z.literal(false),
      creates_run_or_attachment: z.literal(false),
      creates_controller_generation: z.literal(false),
      starts_or_resumes_worker: z.literal(false),
      calls_provider_or_thread_resume: z.literal(false),
      executes_command: z.literal(false),
      consumes_grant: z.literal(false),
      issues_or_decides_approval: z.literal(false),
      creates_result_or_proposal: z.literal(false),
      creates_review_decision_or_transition: z.literal(false),
      mutates_accepted_state_or_closes_work: z.literal(false),
      calls_github_or_external_network: z.literal(false),
    }).strict(),
  }).strict().nullable(),
  current_situation: z.string(),
  next_meaningful_action: z.object({
    label: z.string(),
    reason: z.string(),
    executes: z.literal(false),
  }).strict(),
  browser_deep_link: z.string().url().nullable(),
  authority: CodexRepositoryAuthoritySchema,
}).strict();

export type CodexRepositoryContinuityResult = z.infer<typeof CodexRepositoryContinuityResultSchema>;

const RepositoryExecutionAuthoritySchema = z.object({
  project_files_written: z.literal(false),
  project_commands_executed: z.literal(false),
  managed_run_created: z.literal(false),
  execution_started: z.literal(false),
  provider_called: z.literal(false),
  branch_or_commit_created: z.literal(false),
  github_called: z.literal(false),
  semantic_authority_granted: z.literal(false),
  execution_authority_granted: z.literal(false),
  external_effect_authority_granted: z.literal(false),
}).strict();

const RepositoryWorktreeObservationSchema = z.union([
  z.object({
    observation_version: z.literal("repository_worktree_observation.v0.1"),
    status: z.literal("exact"),
    repository_kind: z.enum(["git_repository", "git_worktree"]),
    git_common_dir_fingerprint: z.string(),
    head_commit: z.string().nullable(),
    head_state: z.enum(["branch", "detached", "unborn"]),
    branch_name: z.string().nullable(),
    index_fingerprint: z.string(),
    staged_content_fingerprint: z.string(),
    tracked_dirty_paths_fingerprint: z.string(),
    unstaged_tracked_content_fingerprint: z.string(),
    relevant_untracked_paths_fingerprint: z.string(),
    relevant_untracked_content_fingerprint: z.string(),
    submodule_state_fingerprint: z.string(),
    inspected_path_count: z.number().int().nonnegative(),
    inspected_content_bytes: z.number().int().nonnegative(),
    limits: z.object({
      maximum_path_count: z.number().int().positive(),
      maximum_individual_file_bytes: z.number().int().positive(),
      maximum_total_inspected_bytes: z.number().int().positive(),
    }).strict(),
    observed_at: z.string().datetime(),
    observation_fingerprint: z.string(),
  }).strict(),
  z.object({
    observation_version: z.literal("repository_worktree_observation.v0.1"),
    status: z.literal("non_git"),
    repository_kind: z.literal("plain_folder"),
    observed_at: z.string().datetime(),
    observation_fingerprint: z.string(),
  }).strict(),
  z.object({
    observation_version: z.literal("repository_worktree_observation.v0.1"),
    status: z.enum(["unavailable", "ambiguous"]),
    repository_kind: z.literal("unknown"),
    reason: z.string(),
    observed_at: z.string().datetime(),
    observation_fingerprint: z.string(),
  }).strict(),
]);

const RepositoryExecutionAttachmentSchema = z.object({
  attachment_version: z.literal("repository_execution_attachment.v0.1"),
  attachment_id: z.string(),
  workspace_id: z.string(),
  project_id: z.string(),
  node_scope_fingerprint: z.string(),
  physical_root_baseline_fingerprint: z.string(),
  root_binding_fingerprint: z.string(),
  task_context_packet_id: z.string(),
  task_context_packet_fingerprint: z.string(),
  current_work_fingerprint: z.string(),
  project_execution_admission_fingerprint: z.string(),
  worktree_observation_fingerprint: z.string(),
  managed_run_state_fingerprint: z.string(),
  binding_fingerprint: z.string(),
  prepared_at: z.string().datetime(),
  freshness_policy: z.object({
    policy_version: z.literal("repository_execution_freshness_policy.v0.1"),
    max_age_ms: z.number().int().positive(),
    expires_at: z.string().datetime(),
  }).strict(),
  lifecycle: z.enum(["prepared", "stale", "superseded", "revoked", "consumed"]),
  stale_reason: z.enum([
    "physical_root_mismatch",
    "root_binding_changed",
    "packet_changed",
    "current_work_changed",
    "project_unavailable",
    "managed_run_conflict",
    "worktree_changed",
    "freshness_expired",
    "explicitly_revoked",
    "superseded",
  ]).nullable(),
  lifecycle_updated_at: z.string().datetime(),
  consumed_run_id: z.string().nullable(),
}).strict();

const ProjectExecutionAdmissionSchema = z.object({
  admission_version: z.literal("project_execution_admission.v0.1"),
  workspace_id: z.string(),
  project_id: z.string(),
  readiness: z.enum(["ready", "decision_required", "blocked"]),
  reason: z.enum([
    "ready",
    "project_unavailable",
    "root_unavailable",
    "baseline_adoption_required",
    "physical_root_mismatch",
    "identity_unavailable",
    "identity_unsupported",
    "identity_ambiguous",
    "current_work_unavailable",
    "admission_state_changed",
    "worktree_unavailable",
    "worktree_ambiguous",
    "non_git_execution_unsupported",
    "managed_run_conflict",
  ]),
  node_scope_fingerprint: z.string().nullable(),
  physical_root_observation_fingerprint: z.string().nullable(),
  root_binding_fingerprint: z.string().nullable(),
  physical_root_baseline_fingerprint: z.string().nullable(),
  task_context_packet_id: z.string().nullable(),
  task_context_packet_fingerprint: z.string().nullable(),
  current_work_fingerprint: z.string().nullable(),
  managed_run_state_fingerprint: z.string(),
  expected_database_state_fingerprint: z.string().nullable(),
  worktree_observation: RepositoryWorktreeObservationSchema.nullable(),
  admission_fingerprint: z.string(),
  browser_observation: z.object({
    active_project_id: z.string().nullable(),
    selected_project_is_target: z.boolean(),
  }).strict(),
  projection_only: z.literal(true),
  execution_authority_granted: z.literal(false),
  semantic_authority_granted: z.literal(false),
}).strict();

const RepositoryExecutionDecisionRequestSchema = z.object({
  decision_request_version: z.literal("repository_execution_decision_request.v0.1"),
  request_fingerprint: z.string(),
  action: z.enum(["adopt_legacy_baseline", "rebind_root", "revoke_attachment", "start_repository_managed_delegation"]),
  workspace_id: z.string(),
  project_id: z.string(),
  expected_state_fingerprint: z.string(),
  requested_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  status: z.enum(["pending", "granted", "consumed", "expired", "superseded"]),
  grant_fingerprint: z.string().nullable(),
  ordinary_text: z.string(),
}).strict();

const RepositoryExecutionPreparationSchema = z.object({
  preparation_version: z.literal("repository_execution_preparation.v0.1"),
  status: z.enum(["prepared", "baseline_adoption_required", "blocked"]),
  reason: ProjectExecutionAdmissionSchema.shape.reason,
  project: z.object({
    project_id: z.string(),
    display_name: z.string().nullable(),
  }).strict().nullable(),
  ordinary_text: z.string(),
  attachment: RepositoryExecutionAttachmentSchema.nullable(),
  admission: ProjectExecutionAdmissionSchema.nullable(),
  decision_request: RepositoryExecutionDecisionRequestSchema.nullable(),
  authority: RepositoryExecutionAuthoritySchema,
}).strict();

const PhysicalRootMutationProjectionSchema = z.object({
  status: z.enum(["adopted", "rebound", "exact_replay"]),
  project_id: z.string(),
  baseline_fingerprint: z.string(),
  ordinary_text: z.string(),
  authority: RepositoryExecutionAuthoritySchema,
}).strict();

const RepositoryRootRebindPreviewSchema = z.object({
  preview_version: z.literal("repository_execution_root_rebind_preview.v0.1"),
  status: z.enum(["ready", "blocked"]),
  reason: z.enum([
    "ready",
    "project_unavailable",
    "baseline_adoption_required",
    "identity_unavailable",
    "identity_unsupported",
    "identity_ambiguous",
  ]),
  workspace_id: z.string(),
  project_id: z.string(),
  expected_old_root_binding_fingerprint: z.string().nullable(),
  expected_old_baseline_fingerprint: z.string().nullable(),
  expected_new_observation_fingerprint: z.string().nullable(),
  decision_request: RepositoryExecutionDecisionRequestSchema.nullable(),
  ordinary_text: z.string(),
  authority: RepositoryExecutionAuthoritySchema,
}).strict();

const RepositoryAttachmentRevocationPreviewSchema = z.object({
  preview_version: z.literal("repository_execution_attachment_revocation_preview.v0.1"),
  status: z.literal("ready"),
  ordinary_text: z.string(),
  decision_request: RepositoryExecutionDecisionRequestSchema,
  authority: RepositoryExecutionAuthoritySchema,
}).strict();

const RepositoryManagedDelegationAuthoritySchema = z.object({
  attachment_consumed: z.boolean(),
  managed_run_created: z.boolean(),
  worker_started: z.boolean(),
  project_files_may_be_written: z.boolean(),
  project_commands_may_be_executed: z.boolean(),
  provider_egress_may_occur: z.boolean(),
  arbitrary_network_access_granted: z.literal(false),
  github_authority_granted: z.literal(false),
  release_authority_granted: z.literal(false),
  semantic_authority_granted: z.literal(false),
  decision_created: z.literal(false),
  transition_created: z.literal(false),
  accepted_state_mutated: z.literal(false),
  work_closed: z.literal(false),
}).strict();

const RepositoryExecutionEnvelopeSchema = z.object({
  envelope_version: z.literal("repository_execution_envelope.v0.1"),
  platform: z.literal("darwin"),
  run_mode: z.literal("repository_attachment"),
  filesystem_scope: z.literal("exact_repository_root"),
  network_scope: z.literal("provider_egress_only"),
  provider_egress: z.enum(["forbidden", "native_host_managed"]),
  timeout_ms: z.number().int().positive(),
  stop_settle_timeout_ms: z.number().int().positive(),
  budgets: z.object({
    max_changed_files: z.number().int().positive(),
    max_artifacts: z.number().int().positive(),
    max_commands: z.number().int().positive(),
    max_checks: z.number().int().positive(),
    max_correction_attempts: z.literal(1),
  }).strict(),
  allowed_operation_categories: z.array(z.string()),
  forbidden_operation_categories: z.array(z.string()),
  protected_untracked_paths_fingerprint: z.string(),
  adapter_version: z.string(),
  capability_version: z.string(),
  envelope_fingerprint: z.string(),
}).strict();

const LiveRepositoryRunProjectionSchema = z.object({
  service_version: z.literal("live_native_host_run_service.v0.1"),
  status: z.enum(["idle", "queued", "starting", "running", "waiting_for_approval", "cancelling", "paused", "blocked", "completed", "failed", "cancelled", "timed_out"]),
  run_ref: z.string().nullable(),
  mode: z.enum(["interactive", "policy_triggered", "repository_attachment"]).nullable(),
  control_revision: z.number().int().nonnegative(),
  reconciliation_required: z.boolean(),
  public_reason: z.string().nullable(),
  capability: z.object({
    status: z.enum(["not_checked", "checking", "available", "unavailable", "disconnected"]),
    adapter_version: z.string().nullable(),
    capability_version: z.string().nullable(),
    cli_version: z.string().nullable(),
    public_reason: z.string().nullable(),
  }).strict(),
  pending_approval: z.unknown().nullable(),
  receipt: z.unknown().nullable(),
  packet_copy_actions: z.literal(0),
  handoff_paste_actions: z.literal(0),
  result_paste_actions: z.literal(0),
  internal_id_entry_actions: z.literal(0),
  semantic_authority_granted: z.literal(false),
}).strict();

export const RepositoryExecutionResultSchema = z.union([
  RepositoryExecutionPreparationSchema,
  PhysicalRootMutationProjectionSchema,
  RepositoryRootRebindPreviewSchema,
  RepositoryAttachmentRevocationPreviewSchema,
  z.object({
    status: z.literal("validated"),
    attachment: RepositoryExecutionAttachmentSchema.nullable(),
  }).strict(),
  z.object({
    status: z.literal("revoked"),
    attachment: RepositoryExecutionAttachmentSchema,
  }).strict(),
  z.object({
    preparation_version: z.literal("repository_managed_delegation_preparation.v0.1"),
    status: z.enum(["decision_required", "blocked"]),
    ordinary_text: z.string(),
    project: z.object({ project_id: z.string(), display_name: z.string().nullable() }).strict().nullable(),
    attachment_id: z.string().nullable(),
    execution_envelope: RepositoryExecutionEnvelopeSchema.nullable(),
    decision_request: RepositoryExecutionDecisionRequestSchema.nullable(),
    authority: RepositoryManagedDelegationAuthoritySchema,
  }).strict(),
  z.object({
    start_version: z.literal("repository_managed_delegation_start.v0.1"),
    status: z.enum(["accepted", "exact_replay", "blocked"]),
    ordinary_text: z.string(),
    attachment_id: z.string(),
    run_id: z.string(),
    attachment_binding_fingerprint: z.string(),
    execution_envelope_fingerprint: z.string(),
    projection: LiveRepositoryRunProjectionSchema,
    authority: RepositoryManagedDelegationAuthoritySchema,
  }).strict(),
  z.object({
    status: z.enum([
      "cancel_requested",
      "cancelled",
      "exact_replay",
      "reconciliation_required",
    ]),
    ordinary_text: z.string(),
    attachment_id: z.string(),
    run_id: z.string(),
    projection: LiveRepositoryRunProjectionSchema,
    semantic_authority_granted: z.literal(false),
    decision_created: z.literal(false),
    transition_created: z.literal(false),
    work_closed: z.literal(false),
  }).strict(),
]);
export type RepositoryExecutionResult = z.infer<typeof RepositoryExecutionResultSchema>;

export interface StateRuntimeBridgeAdapter {
  getRepositoryContinuity(input: { repositoryRoot: string }): Promise<CodexRepositoryContinuityResult>;
  callRepositoryExecution(input: Record<string, unknown>): Promise<RepositoryExecutionResult>;
  getStateBrief(scope: StateRuntimeScope): Promise<StateBrief>;
  getConstellationPreview(scope: StateRuntimeScope): Promise<ConstellationPreviewResult>;
  getGuideBrief(input: { scope: StateRuntimeScope; projectId?: string }): Promise<GuideBriefResult>;
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
  getMailboxSummary(scope: StateRuntimeScope): Promise<MailboxSummaryResult>;
  getPublicationSummary(scope: StateRuntimeScope): Promise<PublicationSummaryResult>;
  getControlPacket(scope: StateRuntimeScope): Promise<ControlPacket>;
}
