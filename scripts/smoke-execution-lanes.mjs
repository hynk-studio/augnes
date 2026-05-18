import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("execution lane smoke must not make live external calls");
};

const {
  EXECUTION_LANE_AUTHORITY_FLAGS,
  EXECUTION_LANE_IDS,
  EXECUTION_LANE_ROLES,
  assertDerivedViewOnly,
  assertNoCoreAuthority,
  getExecutionLane,
  listExecutionLanes,
} = await import("../lib/execution-lanes.ts");

const lanes = listExecutionLanes();

assert.equal(lanes.length, EXECUTION_LANE_IDS.length, "all lane ids should be listed");
assert.deepEqual(
  lanes.map((lane) => lane.id),
  [...EXECUTION_LANE_IDS],
  "lane listing should preserve registry order",
);

for (const lane of lanes) {
  assert(EXECUTION_LANE_ROLES.includes(lane.role), `${lane.id} role is registered`);
  for (const flag of EXECUTION_LANE_AUTHORITY_FLAGS) {
    assert.equal(
      typeof lane.authority[flag],
      "boolean",
      `${lane.id}.${flag} should be boolean`,
    );
  }
}

const chatgptBridge = getExecutionLane("chatgpt_mcp_bridge");
assert.equal(chatgptBridge.role, "surface_host");
assert.equal(chatgptBridge.authority.can_commit_or_reject_state, false);
assertNoCoreAuthority("chatgpt_mcp_bridge");

const openaiResponsesApi = getExecutionLane("openai_responses_api");
assert.equal(openaiResponsesApi.role, "reasoning_backend");
assert.equal(openaiResponsesApi.authority.can_commit_or_reject_state, false);
assert.equal(openaiResponsesApi.authority.can_publish_external, false);
assert.equal(openaiResponsesApi.authority.can_merge_or_mutate_repo, false);
assert.equal(openaiResponsesApi.authority.can_record_trace_or_proof, false);
assertNoCoreAuthority("openai_responses_api");

const codexWorker = getExecutionLane("codex_worker");
assert.equal(codexWorker.role, "specialist_worker");
assert.equal(codexWorker.authority.can_record_trace_or_proof, true);
assert.equal(codexWorker.authority.can_commit_or_reject_state, false);
assert.equal(codexWorker.authority.can_publish_external, false);
assertNoCoreAuthority("codex_worker");

const githubCodeHistory = getExecutionLane("github_code_history");
assert.equal(githubCodeHistory.role, "code_history_surface");
assert.equal(githubCodeHistory.authority.can_commit_or_reject_state, false);
assert.equal(githubCodeHistory.authority.creates_durable_core_records, false);
assertNoCoreAuthority("github_code_history");

const githubPublicationActuator = getExecutionLane("github_publication_actuator");
assert.equal(githubPublicationActuator.role, "actuator");
assert.equal(githubPublicationActuator.authority.can_publish_external, true);
assert.equal(githubPublicationActuator.core_gate_required_for_external_publish, true);
assert.equal(githubPublicationActuator.authority.can_commit_or_reject_state, false);
assertNoCoreAuthority("github_publication_actuator");

const cockpit = getExecutionLane("cockpit");
assert.equal(cockpit.role, "observability_surface");
assert.equal(cockpit.authority.derived_view_only, true);
assert.equal(cockpit.authority.can_commit_or_reject_state, false);
assert.equal(cockpit.authority.can_publish_external, false);
assertDerivedViewOnly("cockpit");

assertDerivedViewOnly("browser_or_mcp_inspector");

const coreAuthorityLanes = lanes.filter(
  (lane) => lane.authority.can_commit_or_reject_state,
);
assert.deepEqual(
  coreAuthorityLanes.map((lane) => lane.id),
  ["augnes_core"],
  "Augnes Core should be the only commit/reject authority",
);

for (const lane of lanes.filter((lane) => lane.id !== "augnes_core")) {
  assert.equal(
    lane.authority.can_commit_or_reject_state,
    false,
    `${lane.id} must not commit/reject Augnes state`,
  );
}

assert.throws(
  () => assertNoCoreAuthority("augnes_core"),
  /has Augnes Core authority/,
  "Core authority assertion should reject Augnes Core itself",
);

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(
  packageJson.scripts["smoke:execution-lanes"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-execution-lanes.mjs",
  "package.json should register smoke:execution-lanes",
);

assert.equal(fetchCalls, 0, "smoke should make no fetch/OpenAI/GitHub calls");

console.log(
  JSON.stringify(
    {
      smoke: "execution-lanes",
      lane_count: lanes.length,
      chatgpt_mcp_bridge_can_commit_or_reject_state: false,
      openai_responses_api_role: openaiResponsesApi.role,
      codex_worker_can_record_trace_or_proof: true,
      github_code_history_augnes_state_authority: false,
      github_publication_actuator_core_gate_required:
        githubPublicationActuator.core_gate_required_for_external_publish,
      cockpit_derived_view_only: true,
      core_commit_or_reject_authority_lanes: coreAuthorityLanes.map(
        (lane) => lane.id,
      ),
      non_core_commit_or_reject_authority: false,
      fetch_calls: fetchCalls,
    },
    null,
    2,
  ),
);
