import { z } from "zod";

export const StateRuntimeScopeSchema = z.string().min(1);

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

export const ObserveResultSchema = z
  .object({
    scope: z.string(),
    session_id: z.string(),
    message_id: z.string(),
    compiler: z.string(),
    proposals: z.array(StateRuntimeProposalSchema),
  })
  .passthrough();

export const PlanResultSchema = z.object({
  scope: z.string(),
  planner: z.enum(["openai", "mock"]),
  message: z.string(),
  recommendations: z.array(PlannerRecommendationSchema),
  agent_instructions: z.array(z.string()),
});

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
    idempotency_key: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    sent_at: z.string().nullable(),
    acknowledged_at: z.string().nullable(),
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
    boundaries: z.array(z.string()),
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
export type WorkEventResult = z.infer<typeof WorkEventResultSchema>;
export type HandoffRecord = z.infer<typeof HandoffRecordSchema>;
export type GeneratedHandoffDraft = z.infer<typeof GeneratedHandoffDraftSchema>;
export type CodexResultReviewDraft = z.infer<typeof CodexResultReviewDraftSchema>;
export type MailboxSummaryResult = z.infer<typeof MailboxSummaryResultSchema>;
export type PublicationSummaryResult = z.infer<typeof PublicationSummaryResultSchema>;

export interface StateRuntimeMessageInput {
  scope: StateRuntimeScope;
  message: string;
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
  observe(input: StateRuntimeMessageInput): Promise<ObserveResult>;
  plan(input: StateRuntimeMessageInput): Promise<PlanResult>;
  recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult>;
  listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]>;
  listWorkItems(scope: StateRuntimeScope): Promise<WorkItem[]>;
  getWorkBrief(scope: StateRuntimeScope, workId: string): Promise<WorkBrief>;
  recordWorkEvent(input: StateRuntimeWorkEventInput): Promise<WorkEventResult>;
  generateHandoffDraft(input: GenerateHandoffDraftInput): Promise<GeneratedHandoffDraft>;
  reviewCodexResultDraft(input: ReviewCodexResultDraftInput): Promise<CodexResultReviewDraft>;
  getMailboxSummary(scope: StateRuntimeScope): Promise<MailboxSummaryResult>;
  getPublicationSummary(scope: StateRuntimeScope): Promise<PublicationSummaryResult>;
}
