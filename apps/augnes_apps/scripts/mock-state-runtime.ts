import type {
  ActionRecordResult,
  ObserveResult,
  PlanResult,
  StateBrief,
  StateRuntimeActionResultInput,
  StateRuntimeBridgeAdapter,
  StateRuntimeMessageInput,
  StateRuntimeProposal,
  StateRuntimeScope,
  StateRuntimeWorkEventInput,
  WorkBrief,
  WorkEventResult,
  WorkItem,
} from "../src/lib/state-runtime-types.js";

const proposal: StateRuntimeProposal = {
  id: "proposal-smoke-1",
  scope: "project:augnes",
  status: "pending",
  title: "Keep bridge read surface narrow",
};

const workItem: WorkItem = {
  work_id: "AG-001",
  scope: "project:augnes",
  title: "Work Trace Spine v0 and Work Focus View",
  status: "in_progress",
  priority: "now",
  summary: "Expose focused work trace packets without changing durable state authority.",
  next_action: "Verify work bridge read tools and gated event recording.",
  user_attention_required: false,
  related_state_keys: ["current_focus"],
  links: {
    issue: "https://github.com/Aurna-code/augnes/issues/37",
    docs: ["docs/OPS_PLAYBOOK.md"],
  },
  created_at: "2026-05-07T00:00:00.000Z",
  updated_at: "2026-05-07T00:05:00.000Z",
};

export class MockStateRuntimeBridgeAdapter implements StateRuntimeBridgeAdapter {
  async getStateBrief(scope: StateRuntimeScope): Promise<StateBrief> {
    return {
      runtime: "augnes",
      scope,
      as_of: "2026-05-03T00:00:00.000Z",
      active_state: [
        {
          key: "current_focus",
          value: "Expose Augnes state runtime through MCP bridge tools.",
        },
      ],
      future_state: [],
      deprecated_state: [],
      completed_state: [],
      open_tensions: [
        {
          id: "tension-smoke-1",
          summary: "Bridge tools write runtime observations but do not commit deltas.",
        },
      ],
      pending_proposals: [proposal],
      recent_actions: [
        {
          id: "action-smoke-1",
          action_name: "smoke_check",
        },
      ],
      agent_instructions: ["Use Augnes runtime state as external context."],
      agent_handoff: {
        current_status: {
          summary: "The bridge smoke state is ready for user-facing status and next-step answers.",
          notable_state_keys: ["current_focus"],
          state_counts: {
            active: 1,
            pending: 1,
            recent_actions: 1,
            open_tensions: 1,
          },
        },
        next_recommended_action: {
          title: "Verify bridge tool surface",
          rationale: "The MCP app should expose runtime state without adding commit or reject tools.",
          related_state_keys: ["current_focus"],
        },
        codex_handoff: {
          task_brief: "Confirm agent_handoff is preserved and summarized without dumping raw state.",
          constraints: ["Keep the public default tool surface read-only."],
          verification_commands: ["npm run smoke"],
          action_record_template: {
            scope,
            source_agent_id: "codex-smoke",
            action_name: "smoke_agent_handoff_preserved",
            result_summary: "Summarize bridge smoke validation and preservation results.",
            files_changed: [],
            result_status: "completed",
            result_kind: "verification",
          },
        },
        blockers_or_tensions: [
          {
            summary: "Bridge tools may record observations but must not commit or reject proposals.",
            related_state_keys: ["bridge_surface"],
          },
        ],
      },
    };
  }

  async observe(input: StateRuntimeMessageInput): Promise<ObserveResult> {
    return {
      scope: input.scope,
      session_id: "session-smoke-1",
      message_id: "message-smoke-1",
      compiler: "mock",
      proposals: [{ ...proposal, scope: input.scope }],
    };
  }

  async plan(input: StateRuntimeMessageInput): Promise<PlanResult> {
    return {
      scope: input.scope,
      planner: "mock",
      message: input.message,
      recommendations: [
        {
          title: "Verify bridge tool surface",
          rationale: "The MCP app should expose runtime state without adding commit or reject tools.",
          tool_name: null,
          priority: "now",
          grounded_state_keys: ["current_focus"],
        },
      ],
      agent_instructions: ["Do not commit or reject proposals from the MCP bridge."],
    };
  }

  async recordActionResult(input: StateRuntimeActionResultInput): Promise<ActionRecordResult> {
    return {
      id: "action-record-smoke-1",
      scope: input.scope,
      source_agent_id: input.sourceAgentId,
      action_name: input.actionName,
      result_summary: input.resultSummary,
      files_changed: input.filesChanged ?? [],
      ...(input.resultStatus ? { result_status: input.resultStatus } : {}),
      ...(input.resultKind ? { result_kind: input.resultKind } : {}),
    };
  }

  async listPendingProposals(scope: StateRuntimeScope): Promise<StateRuntimeProposal[]> {
    return [{ ...proposal, scope }];
  }

  async listWorkItems(scope: StateRuntimeScope): Promise<WorkItem[]> {
    return [{ ...workItem, scope }];
  }

  async getWorkBrief(scope: StateRuntimeScope, workId: string): Promise<WorkBrief> {
    return {
      runtime: "augnes",
      scope,
      work_id: workId.toUpperCase(),
      as_of: "2026-05-07T00:05:00.000Z",
      framing: {
        work_id: "Trace anchor only; not canonical project state.",
        state_authority: "Durable state authority remains Augnes committed state.",
        execution_proof: "Official execution proof remains action_records.",
        temporal_proof: "Temporal State Graph remains proof over time.",
      },
      work: { ...workItem, scope, work_id: workId.toUpperCase() },
      next_action: workItem.next_action,
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event-smoke-1",
          work_id: workId.toUpperCase(),
          scope,
          actor: "chatgpt",
          event_type: "handoff",
          summary: "Smoke work brief preserves trace-anchor framing.",
          result_status: null,
          result_kind: "handoff",
          related_action_id: null,
          related_pr: null,
          related_state_keys: ["current_focus"],
          created_at: "2026-05-07T00:05:00.000Z",
        },
      ],
      related_state_keys: ["current_focus"],
      related_proof: {
        action_ids: [],
        prs: [],
        docs: ["docs/OPS_PLAYBOOK.md"],
        links: workItem.links,
      },
      codex_handoff: {
        task_brief: "Verify AG-001 work trace bridge tools.",
        constraints: ["work_id is a trace anchor, not state authority."],
        suggested_verification: ["npm run smoke"],
        work_event_template: {
          work_id: workId.toUpperCase(),
          scope,
          actor: "codex",
          event_type: "verification",
          summary: "Summarize bridge smoke validation.",
        },
      },
    };
  }

  async recordWorkEvent(input: StateRuntimeWorkEventInput): Promise<WorkEventResult> {
    return {
      scope: input.scope,
      event: {
        id: "work-event-recorded-smoke-1",
        work_id: input.workId.toUpperCase(),
        scope: input.scope,
        actor: input.actor ?? "codex",
        event_type: input.eventType ?? "note",
        summary: input.summary,
        result_status: input.resultStatus ?? null,
        result_kind: input.resultKind ?? null,
        related_action_id: input.relatedActionId ?? null,
        related_pr: input.relatedPr ?? null,
        related_state_keys: input.relatedStateKeys ?? [],
        created_at: "2026-05-07T00:10:00.000Z",
      },
    };
  }
}
