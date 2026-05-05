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
} from "../src/lib/state-runtime-types.js";

const proposal: StateRuntimeProposal = {
  id: "proposal-smoke-1",
  scope: "project:augnes",
  status: "pending",
  title: "Keep bridge read surface narrow",
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
}
