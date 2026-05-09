import assert from "node:assert/strict";
import { MockAugnesCoreAdapter } from "../src/adapters/mock-core.js";
import { sanitizeValue } from "../src/lib/sanitize.js";
import { createMcpAppServer, AUGNES_BRIDGE_TOOL_NAMES, AUGNES_WORK_READ_TOOL_NAMES, LEGACY_PUBLIC_TOOL_NAMES, PUBLIC_TOOL_NAMES } from "../src/server.js";
import { MockStateRuntimeBridgeAdapter } from "./mock-state-runtime.js";

const INTENDED_LEGACY_TOOL_NAMES = [
  "search",
  "fetch",
  "open_casefile",
  "get_working_view",
  "explain_strategy",
  "get_boundary_packet",
  "get_continuity_report",
  "navigate_repo",
  "get_governance_audit",
] as const;
const INTENDED_BRIDGE_TOOL_NAMES = [
  "augnes_get_state_brief",
  "augnes_observe",
  "augnes_plan",
  "augnes_record_action_result",
  "augnes_list_pending_proposals",
  "augnes_record_work_event",
  "augnes_generate_codex_handoff_draft",
  "augnes_review_codex_result_draft",
] as const;
const INTENDED_WORK_READ_TOOL_NAMES = [
  "augnes_list_work_items",
  "augnes_get_work_brief",
] as const;
const INTENDED_PUBLIC_TOOL_NAMES = [
  ...INTENDED_LEGACY_TOOL_NAMES,
  ...INTENDED_WORK_READ_TOOL_NAMES,
] as const;

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;
const BRIDGE_READ_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
} as const;
const BRIDGE_WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: true,
} as const;

interface RegisteredTool {
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
  };
  enabled?: boolean;
  execution?: {
    taskSupport?: string;
  };
}

function registeredTools(server: unknown): Record<string, RegisteredTool> {
  const candidate = server as { _registeredTools?: Record<string, RegisteredTool> };
  assert.ok(candidate._registeredTools, "MCP server registered tools should be inspectable");
  return candidate._registeredTools;
}

function assertNoDangerousTools(toolNames: string[], mode: string) {
  assert.ok(
    !toolNames.some((toolName) => /commit|reject|delete|destructive|promote|apply/i.test(toolName)),
    `${mode} tools must not include commit/reject/destructive names`
  );
}

function assertLegacyTools(tools: Record<string, RegisteredTool>) {
  for (const name of INTENDED_LEGACY_TOOL_NAMES) {
    const tool = tools[name];
    assert.ok(tool, `${name} should be registered`);
    assert.equal(tool.enabled, true, `${name} should be enabled`);
    assert.deepEqual(tool.annotations, READ_ONLY_ANNOTATIONS, `${name} must be read-only, non-destructive, and closed-world`);
    assert.equal(tool.execution?.taskSupport, "forbidden", `${name} must not expose task/job execution`);
  }
}

function assertBridgeTools(tools: Record<string, RegisteredTool>) {
  for (const name of ["augnes_get_state_brief", "augnes_plan", "augnes_list_pending_proposals"] as const) {
    const tool = tools[name];
    assert.ok(tool, `${name} should be registered`);
    assert.equal(tool.enabled, true, `${name} should be enabled`);
    assert.deepEqual(tool.annotations, BRIDGE_READ_ANNOTATIONS, `${name} must be read-only, non-destructive, and open-world`);
    assert.equal(tool.execution?.taskSupport, "forbidden", `${name} must not expose task/job execution`);
  }

  for (const name of [
    "augnes_observe",
    "augnes_record_action_result",
    "augnes_record_work_event",
    "augnes_generate_codex_handoff_draft",
    "augnes_review_codex_result_draft",
  ] as const) {
    const tool = tools[name];
    assert.ok(tool, `${name} should be registered`);
    assert.equal(tool.enabled, true, `${name} should be enabled`);
    assert.deepEqual(tool.annotations, BRIDGE_WRITE_ANNOTATIONS, `${name} must be low-risk write, non-destructive, and open-world`);
    assert.equal(tool.execution?.taskSupport, "forbidden", `${name} must not expose task/job execution`);
  }
}

function assertWorkReadTools(tools: Record<string, RegisteredTool>) {
  for (const name of INTENDED_WORK_READ_TOOL_NAMES) {
    const tool = tools[name];
    assert.ok(tool, `${name} should be registered`);
    assert.equal(tool.enabled, true, `${name} should be enabled`);
    assert.deepEqual(tool.annotations, BRIDGE_READ_ANNOTATIONS, `${name} must be read-only, non-destructive, and open-world`);
    assert.equal(tool.execution?.taskSupport, "forbidden", `${name} must not expose task/job execution`);
  }
}

function assertPublicToolSurface() {
  assert.deepEqual(LEGACY_PUBLIC_TOOL_NAMES, INTENDED_LEGACY_TOOL_NAMES, "legacy public tools must remain the original nine");
  assert.deepEqual(AUGNES_WORK_READ_TOOL_NAMES, INTENDED_WORK_READ_TOOL_NAMES, "work read tools must remain read-first");
  assert.deepEqual(AUGNES_BRIDGE_TOOL_NAMES, INTENDED_BRIDGE_TOOL_NAMES, "bridge tools must remain the intended gated surface");
  assert.deepEqual(PUBLIC_TOOL_NAMES, INTENDED_PUBLIC_TOOL_NAMES, "PUBLIC_TOOL_NAMES must remain read-only");

  const defaultServer = createMcpAppServer(new MockAugnesCoreAdapter(), new MockStateRuntimeBridgeAdapter());
  try {
    const tools = registeredTools(defaultServer);
    const registeredNames = Object.keys(tools);
    assert.deepEqual(registeredNames, INTENDED_PUBLIC_TOOL_NAMES, "default registered tools must be exactly the read-only public surface");
    assertNoDangerousTools(registeredNames, "default");
    assertLegacyTools(tools);
    assertWorkReadTools(tools);
  } finally {
    defaultServer.close();
  }

  const bridgeServer = createMcpAppServer(new MockAugnesCoreAdapter(), new MockStateRuntimeBridgeAdapter(), {
    enableAgentBridge: true,
  });
  try {
    const tools = registeredTools(bridgeServer);
    const registeredNames = Object.keys(tools);
    assert.deepEqual(
      registeredNames,
      [...INTENDED_PUBLIC_TOOL_NAMES, ...INTENDED_BRIDGE_TOOL_NAMES],
      "bridge-enabled registered tools must include public tools plus the Augnes bridge surface"
    );
    assertNoDangerousTools(registeredNames, "bridge-enabled");
    assertLegacyTools(tools);
    assertWorkReadTools(tools);
    assertBridgeTools(tools);
  } finally {
    bridgeServer.close();
  }
}

function assertSanitizerContract() {
  const sanitized = sanitizeValue({
    provider: "remove-me",
    providerName: "remove-me",
    providerSessionId: "remove-me",
    session: "remove-me",
    sessionId: "remove-me",
    auth: "remove-me",
    authContext: "remove-me",
    authorization: "remove-me",
    debug: "remove-me",
    debugInfo: "remove-me",
    token: "remove-me",
    secret: "remove-me",
    password: "remove-me",
    evidenceId: "ev-keep",
    claimId: "claim-keep",
    boundaryId: "boundary-keep",
    casefileId: "casefile-keep",
    snapshotId: "snapshot-keep",
    repoNodeId: "repo-keep",
    nested: {
      apiKey: "remove-me",
      runId: "remove-me",
      threadId: "remove-me",
      workspaceId: "remove-me",
      traceId: "remove-me",
      augnesId: "augnes-keep",
    },
    items: [
      {
        providerDebug: "remove-me",
        continuityId: "continuity-keep",
      },
    ],
  });

  assert.deepEqual(sanitized, {
    evidenceId: "ev-keep",
    claimId: "claim-keep",
    boundaryId: "boundary-keep",
    casefileId: "casefile-keep",
    snapshotId: "snapshot-keep",
    repoNodeId: "repo-keep",
    nested: {
      augnesId: "augnes-keep",
    },
    items: [
      {
        continuityId: "continuity-keep",
      },
    ],
  });
}

assertPublicToolSurface();
assertSanitizerContract();

console.log("Invariant checks passed.");
