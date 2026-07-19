import assert from "node:assert/strict";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildBoundedAutomationCapabilityGrantV01,
  selectBoundedAutomationWorkSourceV01,
} from "@/lib/vnext/runtime/bounded-automation-cycle";
import {
  deriveBoundedAutomationCycleIdV01,
  validateBoundedAutomationCapabilityGrantV01,
} from "@/lib/vnext/bounded-automation-cycle";
import { createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { TaskContextPacketBuilderInputV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const ISSUED_AT = "2026-07-19T00:00:00.000Z";
const EXPIRES_AT = "2026-07-19T00:15:00.000Z";

export function runBoundedAutomationCycleConformanceV01() {
  const packet = packetV01("Bounded policy work");
  const secondPacket = packetV01("Second bounded policy work");
  assert.deepEqual(selectBoundedAutomationWorkSourceV01([]), { status: "none" });
  assert.equal(selectBoundedAutomationWorkSourceV01([packet]).status, "selected");
  assert.deepEqual(
    selectBoundedAutomationWorkSourceV01([packet, secondPacket]),
    selectBoundedAutomationWorkSourceV01([secondPacket, packet]),
    "work ambiguity must not depend on query or array order",
  );
  assert.deepEqual(
    selectBoundedAutomationWorkSourceV01([packet, structuredClone(packet)]),
    { status: "selected", packet },
    "exact duplicate work material must converge before selection",
  );

  const policyRef = refV01(
    "automation_policy",
    "project-portable-fixture:1",
    createProtocolSha256V01("policy"),
  );
  const budget = {
    budget_version: "bounded_automation_budget.v0.1" as const,
    max_work_items: 1 as const,
    max_active_runs: 1 as const,
    max_attempts: 1 as const,
    max_runtime_ms: 900_000,
    max_commands: 128,
    max_model_invocations: 0 as const,
    max_model_tokens: 0 as const,
    max_model_cost_units: 0 as const,
    network_access: "denied" as const,
    automatic_retry: false as const,
  };
  const input = {
    config: {
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
    },
    packet,
    policy_ref: policyRef,
    policy_fingerprint: policyRef.source_ref!,
    control_revision: 1,
    host: {
      adapter_version: "deterministic_codex_adapter.v0.1",
      capability_version: "deterministic_codex_capability.v0.1",
      timeout_ms: 900_000,
    },
    root_fingerprint: createProtocolSha256V01("root"),
    issued_at: ISSUED_AT,
    expires_at: EXPIRES_AT,
    budget,
  };
  const grant = buildBoundedAutomationCapabilityGrantV01(input);
  assert.equal(validateBoundedAutomationCapabilityGrantV01(grant), true);
  assert.equal(
    validateBoundedAutomationCapabilityGrantV01({
      ...grant,
      can_merge: true as false,
    }),
    false,
  );
  assert.equal(
    validateBoundedAutomationCapabilityGrantV01({
      ...grant,
      browser_supplied_authority: true,
    }),
    false,
    "unknown grant material must fail closed even with an otherwise valid grant",
  );
  assert.equal(
    validateBoundedAutomationCapabilityGrantV01({
      ...grant,
      budget: { ...grant.budget, browser_override: 1 },
    }),
    false,
    "unknown budget overrides must fail closed",
  );
  const clone = buildBoundedAutomationCapabilityGrantV01(structuredClone(input));
  assert.deepEqual(grant, clone);
  assert.equal(grant.budget.max_work_items, 1);
  assert.equal(grant.budget.max_active_runs, 1);
  assert.equal(grant.budget.max_attempts, 1);
  assert.equal(grant.budget.max_model_invocations, 0);
  assert.equal(grant.budget.network_access, "denied");
  assert.equal(grant.grants_semantic_authority, false);
  assert.equal(grant.grants_external_action_authority, false);
  for (const forbidden of [
    "credential_access",
    "deploy",
    "external_post",
    "merge",
    "model_invocation",
    "network_access",
    "publish",
  ]) {
    assert.ok(grant.forbidden_capabilities.includes(forbidden));
  }
  const cycleId = deriveBoundedAutomationCycleIdV01({ grant, packet });
  assert.equal(
    cycleId,
    deriveBoundedAutomationCycleIdV01({ grant: structuredClone(grant), packet: structuredClone(packet) }),
  );
  const changedPolicyGrant = buildBoundedAutomationCapabilityGrantV01({
    ...input,
    policy_fingerprint: createProtocolSha256V01("changed-policy"),
  });
  assert.notEqual(
    cycleId,
    deriveBoundedAutomationCycleIdV01({ grant: changedPolicyGrant, packet }),
    "changed policy material must produce a distinct bounded cycle identity",
  );

  return {
    suite: "bounded-automation-cycle.v0.1",
    status: "passed",
    work_selection: "zero_one_ambiguous_order_independent",
    max_work_items: grant.budget.max_work_items,
    max_active_runs: grant.budget.max_active_runs,
    max_attempts: grant.budget.max_attempts,
    model_calls: grant.budget.max_model_invocations,
    network: grant.budget.network_access,
  };
}

function packetV01(goal: string) {
  const grantRef = refV01(
    "capability_grant",
    `grant:${createProtocolSha256V01(goal).slice(0, 20)}`,
    createProtocolSha256V01(`grant:${goal}`),
  );
  const input = structuredClone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  return buildTaskContextPacketV01({
    ...input,
    task: { ...input.task, goal },
    constraints: {
      ...input.constraints,
      data_classification: "private",
    },
    capability_grant: {
      grant_ref: grantRef.external_id,
      grant_external_ref: grantRef,
      allowed_capabilities: ["native_host.execute_project_task"],
      forbidden_capabilities: ["network_access", "model_invocation"],
      resource_scope: [input.project_id],
      stop_conditions: ["review_needed", "timeout"],
      coverage: "enforced",
      expires_at: EXPIRES_AT,
    },
  });
}

function refV01(
  refType: string,
  externalId: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: ISSUED_AT,
    source_ref: sourceRef,
    compatibility_namespace: "bounded_autohunt_review_needed.v0.1",
    trust_class: "direct_local_observation",
  };
}
