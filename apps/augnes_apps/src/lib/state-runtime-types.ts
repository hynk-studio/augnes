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
export type StateBrief = z.infer<typeof StateBriefSchema>;
export type ObserveResult = z.infer<typeof ObserveResultSchema>;
export type PlanResult = z.infer<typeof PlanResultSchema>;
export type ActionRecordResult = z.infer<typeof ActionRecordResultSchema>;
export type StateRuntimeActionResultStatus = z.infer<typeof StateRuntimeActionResultStatusSchema>;
export type StateRuntimeActionResultKind = z.infer<typeof StateRuntimeActionResultKindSchema>;

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

export interface StateRuntimeBridgeAdapter {
  getStateBrief(scope: StateRuntimeScope): Promise<StateBrief>;
  observe(input: StateRuntimeMessageInput): Promise<ObserveResult>;
  plan(input: StateRuntimeMessageInput): Promise<PlanResult>;
  recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult>;
  listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]>;
}
