export const EXECUTION_LANE_ROLES = [
  "core_runtime",
  "surface_host",
  "reasoning_backend",
  "specialist_worker",
  "actuator",
  "observability_surface",
  "code_history_surface",
] as const;

export type ExecutionLaneRole = (typeof EXECUTION_LANE_ROLES)[number];

export const EXECUTION_LANE_AUTHORITY_FLAGS = [
  "can_read_state",
  "can_propose_pending_state",
  "can_record_trace_or_proof",
  "can_commit_or_reject_state",
  "can_publish_external",
  "can_modify_worktree",
  "can_open_pull_request",
  "can_merge_pull_request",
  "creates_durable_core_records",
  "derived_view_only",
] as const;

export type ExecutionLaneAuthorityFlag =
  (typeof EXECUTION_LANE_AUTHORITY_FLAGS)[number];

export type ExecutionLaneAuthority = Readonly<
  Record<ExecutionLaneAuthorityFlag, boolean>
>;

export const EXECUTION_LANE_IDS = [
  "augnes_core",
  "chatgpt_mcp_bridge",
  "openai_responses_api",
  "codex_worker",
  "github_code_history",
  "github_publication_actuator",
  "cockpit",
  "browser_or_mcp_inspector",
] as const;

export type ExecutionLaneId = (typeof EXECUTION_LANE_IDS)[number];

export type ExecutionLane = Readonly<{
  id: ExecutionLaneId;
  role: ExecutionLaneRole;
  label: string;
  provider_examples: readonly string[];
  authority: ExecutionLaneAuthority;
  authority_notes: readonly string[];
  core_gate_required_for_external_publish: boolean;
}>;

const NO_AUTHORITY: ExecutionLaneAuthority = Object.freeze({
  can_read_state: false,
  can_propose_pending_state: false,
  can_record_trace_or_proof: false,
  can_commit_or_reject_state: false,
  can_publish_external: false,
  can_modify_worktree: false,
  can_open_pull_request: false,
  can_merge_pull_request: false,
  creates_durable_core_records: false,
  derived_view_only: false,
});

function authority(
  overrides: Partial<Record<ExecutionLaneAuthorityFlag, boolean>>,
): ExecutionLaneAuthority {
  return Object.freeze({
    ...NO_AUTHORITY,
    ...overrides,
  });
}

export const EXECUTION_LANE_REGISTRY: Readonly<
  Record<ExecutionLaneId, ExecutionLane>
> = Object.freeze({
  augnes_core: Object.freeze({
    id: "augnes_core",
    role: "core_runtime",
    label: "Augnes Core",
    provider_examples: ["local_runtime"],
    authority: authority({
      can_read_state: true,
      can_propose_pending_state: true,
      can_record_trace_or_proof: true,
      can_commit_or_reject_state: true,
      creates_durable_core_records: true,
    }),
    authority_notes: Object.freeze([
      "Owns committed Augnes state storage and commit/reject route behavior.",
      "Owns durable Core records and gate validation.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
  chatgpt_mcp_bridge: Object.freeze({
    id: "chatgpt_mcp_bridge",
    role: "surface_host",
    label: "ChatGPT MCP bridge",
    provider_examples: ["ChatGPT App", "MCP bridge"],
    authority: authority({
      can_read_state: true,
      can_propose_pending_state: true,
      can_record_trace_or_proof: true,
    }),
    authority_notes: Object.freeze([
      "May read state and request pending proposals through bounded bridge tools.",
      "Does not own durable state, commit/reject decisions, publication, or repo mutation.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
  openai_responses_api: Object.freeze({
    id: "openai_responses_api",
    role: "reasoning_backend",
    label: "OpenAI Responses API",
    provider_examples: ["OpenAI Responses API"],
    authority: authority({}),
    authority_notes: Object.freeze([
      "Receives explicitly supplied request context for observe/plan/preview behavior.",
      "Does not read Augnes state directly, create durable records, publish, commit/reject state, or mutate repo history.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
  codex_worker: Object.freeze({
    id: "codex_worker",
    role: "specialist_worker",
    label: "Codex worker",
    provider_examples: ["Codex"],
    authority: authority({
      can_read_state: true,
      can_record_trace_or_proof: true,
      can_modify_worktree: true,
      can_open_pull_request: true,
    }),
    authority_notes: Object.freeze([
      "May implement repo/workspace file changes and open PRs through workflow.",
      "May record verification trace/proof through Core-gated helpers.",
      "Does not own durable Augnes state, commit/reject decisions, external publication, or PR merge authority.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
  github_code_history: Object.freeze({
    id: "github_code_history",
    role: "code_history_surface",
    label: "GitHub code history",
    provider_examples: ["GitHub repository", "GitHub pull request"],
    authority: authority({}),
    authority_notes: Object.freeze([
      "Stores repo and PR history that Augnes may reference as evidence.",
      "GitHub history is not Augnes committed state authority and is not an active mutation authority.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
  github_publication_actuator: Object.freeze({
    id: "github_publication_actuator",
    role: "actuator",
    label: "GitHub publication actuator",
    provider_examples: ["GitHub PR comment publish adapter"],
    authority: authority({
      can_publish_external: true,
    }),
    authority_notes: Object.freeze([
      "May perform the external PR-comment side effect only after existing Core gate semantics pass.",
      "Does not approve, commit/reject state, record proof, merge, or mutate repo history.",
    ]),
    core_gate_required_for_external_publish: true,
  }),
  cockpit: Object.freeze({
    id: "cockpit",
    role: "observability_surface",
    label: "Cockpit",
    provider_examples: ["Augnes Cockpit"],
    authority: authority({
      can_read_state: true,
      derived_view_only: true,
    }),
    authority_notes: Object.freeze([
      "Renders derived views over Core records.",
      "Does not gain hidden approve, publish, retry, proof, state, repo, or execution authority.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
  browser_or_mcp_inspector: Object.freeze({
    id: "browser_or_mcp_inspector",
    role: "observability_surface",
    label: "Browser or MCP Inspector",
    provider_examples: ["Browser", "Chrome", "MCP Inspector"],
    authority: authority({
      can_read_state: true,
      derived_view_only: true,
    }),
    authority_notes: Object.freeze([
      "Observes rendered surfaces or MCP tool outputs for verification.",
      "Does not approve, publish, record durable state, commit/reject, edit files, open PRs, merge, or mutate repo history.",
    ]),
    core_gate_required_for_external_publish: false,
  }),
});

export function listExecutionLanes(): ExecutionLane[] {
  return EXECUTION_LANE_IDS.map((id) => EXECUTION_LANE_REGISTRY[id]);
}

export function getExecutionLane(id: string): ExecutionLane {
  if (!isExecutionLaneId(id)) {
    throw new Error(`Unknown execution lane: ${id}`);
  }
  return EXECUTION_LANE_REGISTRY[id];
}

export function assertNoCoreAuthority(id: string): ExecutionLane {
  const lane = getExecutionLane(id);
  if (
    lane.authority.can_commit_or_reject_state ||
    lane.authority.creates_durable_core_records
  ) {
    throw new Error(`${id} has Augnes Core authority.`);
  }
  return lane;
}

export function assertDerivedViewOnly(id: string): ExecutionLane {
  const lane = getExecutionLane(id);
  const mutatingFlags: ExecutionLaneAuthorityFlag[] = [
    "can_propose_pending_state",
    "can_record_trace_or_proof",
    "can_commit_or_reject_state",
    "can_publish_external",
    "can_modify_worktree",
    "can_open_pull_request",
    "can_merge_pull_request",
    "creates_durable_core_records",
  ];
  const enabledMutatingFlags = mutatingFlags.filter(
    (flag) => lane.authority[flag],
  );

  if (!lane.authority.derived_view_only || enabledMutatingFlags.length > 0) {
    throw new Error(
      `${id} is not derived-view-only: ${enabledMutatingFlags.join(", ")}`,
    );
  }
  return lane;
}

function isExecutionLaneId(id: string): id is ExecutionLaneId {
  return (EXECUTION_LANE_IDS as readonly string[]).includes(id);
}
