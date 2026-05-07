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

export interface StateRuntimeBridgeAdapter {
  getStateBrief(scope: StateRuntimeScope): Promise<StateBrief>;
  observe(input: StateRuntimeMessageInput): Promise<ObserveResult>;
  plan(input: StateRuntimeMessageInput): Promise<PlanResult>;
  recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult>;
  listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]>;
  listWorkItems(scope: StateRuntimeScope): Promise<WorkItem[]>;
  getWorkBrief(scope: StateRuntimeScope, workId: string): Promise<WorkBrief>;
  recordWorkEvent(input: StateRuntimeWorkEventInput): Promise<WorkEventResult>;
}
