import assert from "node:assert/strict";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildBoundedAutomationCapabilityGrantV01,
  selectBoundedAutomationWorkSourceV01,
} from "@/lib/vnext/runtime/bounded-automation-cycle";
import {
  createBoundedAutomationCapabilityGrantFingerprintV01,
  deriveBoundedAutomationCycleIdV01,
  validateBoundedAutomationCapabilityGrantV01,
} from "@/lib/vnext/bounded-automation-cycle";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { createVNextAutomationWorkSourceV01 } from "@/lib/vnext/persistence/bounded-automation-authority";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { TaskContextPacketBuilderInputV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { VNextAutomationWorkSnapshotV01 } from "@/types/vnext/automation-work-item";
import {
  LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TITLE_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";

const ISSUED_AT = "2026-07-19T00:00:00.000Z";
const EXPIRES_AT = "2026-07-19T00:15:00.000Z";

export function runBoundedAutomationCycleConformanceV01() {
  const packet = packetV01("Bounded policy work");
  const secondPacket = packetV01("Second bounded policy work");
  const work = workV01(packet);
  const secondWork = workV01(secondPacket);
  const workSnapshot = workSnapshotV01(work);
  const secondWorkSnapshot = workSnapshotV01(secondWork);
  assert.deepEqual(selectBoundedAutomationWorkSourceV01([]), { status: "none" });
  assert.equal(selectBoundedAutomationWorkSourceV01([workSnapshot]).status, "selected");
  assert.deepEqual(
    selectBoundedAutomationWorkSourceV01([workSnapshot, secondWorkSnapshot]),
    selectBoundedAutomationWorkSourceV01([secondWorkSnapshot, workSnapshot]),
    "work ambiguity must not depend on query or array order",
  );
  assert.throws(
    () =>
      createVNextAutomationWorkSourceV01({
        ...workSourceInputV01(packet),
        source_grant_record_status: "forged_status" as "exact_record",
      }),
    /bounded_automation_source_grant_record_status_invalid/u,
    "only exact-record or packet-bound-summary source grant lineage is valid",
  );
  assert.throws(
    () =>
      createVNextAutomationWorkSourceV01({
        ...workSourceInputV01(packet),
        task: structuredClone(packet.task),
      }),
    /bounded_automation_work_operation_profile_conflict/u,
    "an arbitrary source-packet task cannot masquerade as the server-owned verification profile",
  );
  assert.throws(
    () =>
      createVNextAutomationWorkSourceV01({
        ...workSourceInputV01(packet),
        operation_profile: "forged_operation_profile.v0.1" as typeof LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01,
      }),
    /bounded_automation_work_operation_profile_invalid/u,
    "a recomputed work identity cannot bypass the server-owned operation profile",
  );
  assert.deepEqual(
    selectBoundedAutomationWorkSourceV01([workSnapshot, structuredClone(workSnapshot)]),
    { status: "selected", work: workSnapshot },
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
    max_augnes_model_invocations: 0 as const,
    max_augnes_model_tokens: 0 as const,
    max_augnes_model_cost_units: 0 as const,
    native_host_model_scope: "none" as const,
    host_egress: "local_in_process_only" as const,
    network_access: "denied" as const,
    automatic_retry: false as const,
  };
  const input = {
    config: {
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
    },
    work,
    source_packet: packet,
    policy_ref: policyRef,
    policy_fingerprint: policyRef.source_ref!,
    control_revision: 1,
    host: {
      adapter_version: "deterministic_codex_adapter.v0.1",
      capability_version: "deterministic_codex_capability.v0.1",
      timeout_ms: 900_000,
      execution_profile: "deterministic_zero_model" as const,
      provider_egress: "forbidden" as const,
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
  const {
    grant_id: _grantId,
    grant_fingerprint: _grantFingerprint,
    ...unsafeMaterial
  } = grant;
  const recomputedUnsafeMaterial = {
    ...unsafeMaterial,
    allowed_capabilities: [...unsafeMaterial.allowed_capabilities, "merge"].sort(),
    forbidden_capabilities: unsafeMaterial.forbidden_capabilities.filter(
      (capability) => capability !== "merge",
    ),
  };
  const recomputedUnsafeFingerprint =
    createBoundedAutomationCapabilityGrantFingerprintV01(
      recomputedUnsafeMaterial,
    );
  assert.equal(
    validateBoundedAutomationCapabilityGrantV01({
      ...recomputedUnsafeMaterial,
      grant_id: `bounded-grant:${recomputedUnsafeFingerprint.slice(0, 24)}`,
      grant_fingerprint: recomputedUnsafeFingerprint,
    }),
    false,
    "a recomputed fingerprint cannot broaden the server-owned profile",
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
  assert.equal(grant.budget.max_augnes_model_invocations, 0);
  assert.equal(grant.budget.network_access, "denied");
  assert.equal(grant.host_execution_profile, "deterministic_zero_model");
  assert.equal(grant.host_provider_egress, "forbidden");
  assert.equal(
    grant.work_operation_profile,
    LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01,
  );
  assert.deepEqual(
    grant.source_grant_ref,
    packet.capability_grant?.grant_external_ref,
  );
  assert.equal(
    grant.source_grant_fingerprint,
    packet.capability_grant?.grant_external_ref?.source_ref,
  );
  assert.equal(
    grant.allowed_capabilities.some((capability) =>
      grant.forbidden_capabilities.includes(capability),
    ),
    false,
  );
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
    model_calls: grant.budget.max_augnes_model_invocations,
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
      allowed_capabilities: [
        "project_scoped_structured_task_round_trip.v0.1",
      ],
      forbidden_capabilities: ["network_access", "model_invocation"],
      resource_scope: [input.project_id],
      stop_conditions: ["review_needed", "timeout"],
      coverage: "enforced",
      expires_at: EXPIRES_AT,
    },
  });
}

function workV01(packet: ReturnType<typeof packetV01>) {
  return createVNextAutomationWorkSourceV01(workSourceInputV01(packet));
}

function workSourceInputV01(packet: ReturnType<typeof packetV01>) {
  const sourceGrant = packet.capability_grant!;
  return {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_class: "bounded_project_task",
    operation_profile: LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01,
    title: LOCAL_PROJECT_ROOT_VERIFICATION_TITLE_V01,
    task: structuredClone(LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01),
    source_task: packet.task,
    source_packet: {
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
    },
    source_capability_grant: sourceGrant,
    source_capability_grant_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(sourceGrant),
    ),
    source_grant_record_status: "packet_bound_summary",
    required_context_refs: [],
    proposed_files: [],
    required_checks: [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
    expected_outputs: [...LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01],
    blocked_actions: [
      ...packet.constraints.forbidden_actions,
      "authority_expansion",
      "credential_access",
      "deploy",
      "external_post",
      "merge",
      "model_invocation",
      "native_host_approval:command_execution",
      "native_host_approval:file_change",
      "native_host_approval:filesystem_permission",
      "native_host_approval:network_permission",
      "network_access",
      "publish",
      "semantic_commit",
      "strategic_analysis",
    ],
    stop_conditions: ["budget_exhausted", "cancellation_requested", "review_needed", "timeout"],
    budget_projection: {
      max_work_items: 1,
      max_active_runs: 1,
      max_attempts: 1,
      max_commands: 128,
      max_runtime_ms: 900_000,
      augnes_model_invocations: 0,
      augnes_model_tokens: 0,
      augnes_model_cost_units: 0,
      native_host_model_scope: "none",
      network_access: "denied",
    },
    created_at: ISSUED_AT,
  } satisfies Parameters<typeof createVNextAutomationWorkSourceV01>[0];
}

function workSnapshotV01(
  source: ReturnType<typeof workV01>,
): VNextAutomationWorkSnapshotV01 {
  return {
    snapshot_version: "vnext_automation_work_snapshot.v0.1",
    source,
    status: "queued",
    revision: 1,
    prior_snapshot_ref: null,
    cycle_binding: null,
    status_reason: "explicit_operator_queue",
    observed_at: ISSUED_AT,
    snapshot_id: `fixture:${source.work_id}`,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "automation_work_snapshot_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(source.work_id),
    },
  };
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
