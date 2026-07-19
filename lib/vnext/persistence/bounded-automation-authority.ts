import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  countVNextCoreRecordsV01,
  insertVNextCoreRecordV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordWriteResultV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import { validateBoundedAutomationCapabilityGrantV01 } from "@/lib/vnext/bounded-automation-cycle";
import { validateExternalRefV01 } from "@/lib/vnext/task-context-packet";
import type {
  VNextAutomationWorkCycleBindingV01,
  VNextAutomationWorkSnapshotV01,
  VNextAutomationWorkSourceV01,
  VNextAutomationWorkStatusV01,
} from "@/types/vnext/automation-work-item";
import {
  VNEXT_AUTOMATION_WORK_SNAPSHOT_VERSION_V01,
  VNEXT_AUTOMATION_WORK_SOURCE_VERSION_V01,
  VNEXT_AUTOMATION_WORK_STATUSES_V01,
} from "@/types/vnext/automation-work-item";
import type { BoundedAutomationCapabilityGrantV01 } from "@/types/vnext/bounded-automation-cycle";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const WORK_HISTORY_LIMIT_V01 = 128;
const WORK_TEXT_LIMIT_V01 = 2_000;
const WORK_COLLECTION_LIMIT_V01 = 64;

export class BoundedAutomationAuthorityErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "BoundedAutomationAuthorityErrorV01";
  }
}

export function createVNextAutomationWorkSourceV01(input: Omit<
  VNextAutomationWorkSourceV01,
  "work_source_version" | "work_id" | "work_fingerprint"
>): VNextAutomationWorkSourceV01 {
  const material = normalizeWorkSourceMaterialV01(input);
  const workFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(workFingerprintMaterialV01(material)),
  );
  const work: VNextAutomationWorkSourceV01 = {
    work_source_version: VNEXT_AUTOMATION_WORK_SOURCE_VERSION_V01,
    ...material,
    work_id: `automation-work:${workFingerprint.slice(7, 31)}`,
    work_fingerprint: workFingerprint,
  };
  if (!validateVNextAutomationWorkSourceV01(work)) {
    refuseV01("bounded_automation_work_source_invalid", 422);
  }
  return work;
}

export function admitQueuedVNextAutomationWorkV01(
  db: Database.Database,
  input: { source: VNextAutomationWorkSourceV01; observed_at: string },
): { status: VNextCoreRecordWriteResultV01["status"]; snapshot: VNextAutomationWorkSnapshotV01 } {
  const existing = readCurrentVNextAutomationWorkSnapshotV01(db, {
    workspace_id: input.source.workspace_id,
    project_id: input.source.project_id,
    work_id: input.source.work_id,
  });
  if (existing) {
    const { created_at: _existingCreatedAt, ...existingIdentity } = existing.source;
    const { created_at: _incomingCreatedAt, ...incomingIdentity } = input.source;
    if (
      existing.status === "queued" &&
      canonicalizeProtocolValueV01(existingIdentity) ===
        canonicalizeProtocolValueV01(incomingIdentity)
    ) {
      return { status: "exact_replay", snapshot: existing };
    }
    refuseV01("bounded_automation_work_replay_conflict");
  }
  const snapshot = createWorkSnapshotV01({
    source: input.source,
    status: "queued",
    revision: 1,
    prior_snapshot_ref: null,
    cycle_binding: null,
    status_reason: "explicit_operator_queue",
    observed_at: input.observed_at,
  });
  return admitWorkSnapshotV01(db, snapshot);
}

export function transitionVNextAutomationWorkV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    work_id: string;
    expected_work_fingerprint: string;
    expected_status: VNextAutomationWorkStatusV01 | readonly VNextAutomationWorkStatusV01[];
    status: Exclude<VNextAutomationWorkStatusV01, "queued">;
    cycle_binding: VNextAutomationWorkCycleBindingV01;
    status_reason: string;
    observed_at: string;
  },
): { status: VNextCoreRecordWriteResultV01["status"]; snapshot: VNextAutomationWorkSnapshotV01 } {
  const current = readCurrentVNextAutomationWorkSnapshotV01(db, input);
  if (!current) refuseV01("bounded_automation_work_missing", 404);
  if (current.source.work_fingerprint !== input.expected_work_fingerprint) {
    refuseV01("bounded_automation_work_fingerprint_conflict");
  }
  const expected = Array.isArray(input.expected_status)
    ? input.expected_status
    : [input.expected_status];
  if (current.status === input.status) {
    if (
      canonicalizeProtocolValueV01(current.cycle_binding) ===
        canonicalizeProtocolValueV01(normalizeCycleBindingV01(input.cycle_binding)) &&
      current.status_reason === normalizeTextV01(input.status_reason, "status_reason")
    ) {
      return { status: "exact_replay", snapshot: current };
    }
    refuseV01("bounded_automation_work_state_replay_conflict");
  }
  if (!expected.includes(current.status) || !validStatusTransitionV01(current.status, input.status)) {
    refuseV01("bounded_automation_work_state_conflict");
  }
  const snapshot = createWorkSnapshotV01({
    source: current.source,
    status: input.status,
    revision: current.revision + 1,
    prior_snapshot_ref: createAutomationWorkSnapshotRefV01(current),
    cycle_binding: input.cycle_binding,
    status_reason: input.status_reason,
    observed_at: input.observed_at,
  });
  return admitWorkSnapshotV01(db, snapshot);
}

export function listCurrentVNextAutomationWorkSnapshotsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): VNextAutomationWorkSnapshotV01[] {
  const recordCount = countVNextCoreRecordsV01(db, {
    ...input,
    record_kind: "automation_work_item",
  });
  if (recordCount > WORK_HISTORY_LIMIT_V01) {
    refuseV01("bounded_automation_work_history_bound_exceeded", 422);
  }
  const records = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["automation_work_item"],
    limit: WORK_HISTORY_LIMIT_V01,
  });
  const current = new Map<string, VNextAutomationWorkSnapshotV01>();
  for (const record of records) {
    const snapshot = record.payload as VNextAutomationWorkSnapshotV01;
    if (!validateVNextAutomationWorkSnapshotV01(snapshot)) {
      refuseV01("bounded_automation_work_snapshot_invalid", 422);
    }
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: snapshot.source.workspace_id,
      project_id: snapshot.source.project_id,
      fingerprint: snapshot.integrity.fingerprint,
    });
    if (record.record_id !== snapshot.snapshot_id || record.created_at !== snapshot.observed_at) {
      refuseV01("bounded_automation_work_envelope_conflict");
    }
    const prior = current.get(snapshot.source.work_id);
    if (!prior || snapshot.revision > prior.revision) {
      current.set(snapshot.source.work_id, snapshot);
    } else if (
      snapshot.revision === prior.revision &&
      snapshot.integrity.fingerprint !== prior.integrity.fingerprint
    ) {
      refuseV01("bounded_automation_work_revision_conflict");
    }
  }
  return [...current.values()].sort((left, right) =>
    left.source.work_id.localeCompare(right.source.work_id),
  );
}

export function readCurrentVNextAutomationWorkSnapshotV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; work_id: string },
): VNextAutomationWorkSnapshotV01 | null {
  return (
    listCurrentVNextAutomationWorkSnapshotsV01(db, input).find(
      (snapshot) => snapshot.source.work_id === input.work_id,
    ) ?? null
  );
}

export function admitBoundedAutomationCapabilityGrantV01(
  db: Database.Database,
  grant: BoundedAutomationCapabilityGrantV01,
): VNextCoreRecordWriteResultV01 {
  if (!validateBoundedAutomationCapabilityGrantV01(grant)) {
    refuseV01("bounded_automation_final_grant_invalid", 422);
  }
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "capability_grant",
    record_id: grant.grant_id,
    workspace_id: grant.workspace_id,
    project_id: grant.project_id,
    fingerprint: grant.grant_fingerprint,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: grant.grant_version,
        workspace_id: grant.workspace_id,
        project_id: grant.project_id,
        work_source_ref: grant.work_source_ref,
        policy_ref: grant.policy_ref,
        control_revision: grant.control_revision,
        packet_intent_fingerprint: grant.packet_intent_fingerprint,
      }),
    ),
    payload: grant,
    created_at: grant.issued_at,
  });
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(write.record, {
    workspace_id: grant.workspace_id,
    project_id: grant.project_id,
    fingerprint: grant.grant_fingerprint,
  });
  return write;
}

export function readBoundedAutomationCapabilityGrantV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; grant_id: string; grant_fingerprint: string },
): BoundedAutomationCapabilityGrantV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "capability_grant",
    record_id: input.grant_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record) refuseV01("bounded_automation_final_grant_missing", 404);
  const grant = record.payload as BoundedAutomationCapabilityGrantV01;
  if (
    record.fingerprint !== input.grant_fingerprint ||
    !validateBoundedAutomationCapabilityGrantV01(grant) ||
    grant.grant_id !== input.grant_id ||
    grant.grant_fingerprint !== input.grant_fingerprint ||
    record.created_at !== grant.issued_at
  ) {
    refuseV01("bounded_automation_final_grant_conflict");
  }
  return grant;
}

export function createAutomationWorkRefV01(source: VNextAutomationWorkSourceV01): ExternalRefV01 {
  return automationRefV01(
    "automation_work_item",
    source.work_id,
    source.created_at,
    source.work_fingerprint,
  );
}

export function createAutomationWorkSnapshotRefV01(snapshot: VNextAutomationWorkSnapshotV01): ExternalRefV01 {
  return automationRefV01(
    "automation_work_snapshot",
    snapshot.snapshot_id,
    snapshot.observed_at,
    snapshot.integrity.fingerprint,
  );
}

export function createBoundedAutomationGrantRefV01(
  grant: BoundedAutomationCapabilityGrantV01,
): ExternalRefV01 {
  return automationRefV01(
    "capability_grant",
    grant.grant_id,
    grant.issued_at,
    grant.grant_fingerprint,
  );
}

export function validateVNextAutomationWorkSourceV01(value: unknown): value is VNextAutomationWorkSourceV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const source = value as Partial<VNextAutomationWorkSourceV01>;
  if (!hasExactKeysV01(source, [
    "blocked_actions", "budget_projection", "created_at", "expected_outputs",
    "project_id", "proposed_files", "required_checks", "required_context_refs",
    "source_capability_grant", "source_capability_grant_fingerprint",
    "source_grant_record_status", "source_packet", "stop_conditions", "task",
    "title", "work_class", "work_fingerprint", "work_id", "work_source_version",
    "workspace_id",
  ])) return false;
  if (!source.task || !hasExactKeysV01(source.task, ["goal", "non_goals", "success_criteria"])) return false;
  if (!source.source_packet || !hasExactKeysV01(source.source_packet, ["packet_fingerprint", "packet_id"])) return false;
  if (!source.budget_projection || !hasExactKeysV01(source.budget_projection, [
    "augnes_model_cost_units", "augnes_model_invocations", "augnes_model_tokens",
    "max_active_runs", "max_attempts", "max_commands", "max_runtime_ms",
    "max_work_items", "native_host_model_scope", "network_access",
  ])) return false;
  try {
    const {
      work_source_version: _version,
      work_id: _workId,
      work_fingerprint: _workFingerprint,
      ...sourceMaterial
    } = source as VNextAutomationWorkSourceV01;
    const normalized = normalizeWorkSourceMaterialV01(sourceMaterial);
    const expectedFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(workFingerprintMaterialV01(normalized)),
    );
    return (
      source.work_source_version === VNEXT_AUTOMATION_WORK_SOURCE_VERSION_V01 &&
      source.work_id === `automation-work:${expectedFingerprint.slice(7, 31)}` &&
      source.work_fingerprint === expectedFingerprint &&
      canonicalizeProtocolValueV01(normalized) ===
        canonicalizeProtocolValueV01(sourceMaterial)
    );
  } catch {
    return false;
  }
}

export function validateVNextAutomationWorkSnapshotV01(value: unknown): value is VNextAutomationWorkSnapshotV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const snapshot = value as Partial<VNextAutomationWorkSnapshotV01>;
  if (!hasExactKeysV01(snapshot, [
    "cycle_binding", "integrity", "observed_at", "prior_snapshot_ref", "revision",
    "snapshot_id", "snapshot_version", "source", "status", "status_reason",
  ])) return false;
  if (!snapshot.integrity || !hasExactKeysV01(snapshot.integrity, ["algorithm", "fingerprint", "fingerprint_scope"])) return false;
  if (!validateVNextAutomationWorkSourceV01(snapshot.source)) return false;
  if (!VNEXT_AUTOMATION_WORK_STATUSES_V01.includes(snapshot.status as VNextAutomationWorkStatusV01)) return false;
  if (!Number.isSafeInteger(snapshot.revision) || Number(snapshot.revision) < 1) return false;
  if (parseStrictIsoTimestampV01(snapshot.observed_at ?? "") === null) return false;
  if (!nonemptyV01(snapshot.status_reason, WORK_TEXT_LIMIT_V01)) return false;
  if (snapshot.prior_snapshot_ref && validateExternalRefV01(snapshot.prior_snapshot_ref).status !== "valid") return false;
  if (snapshot.cycle_binding && !validateCycleBindingV01(snapshot.cycle_binding)) return false;
  if ((snapshot.status === "queued") !== (snapshot.cycle_binding === null)) return false;
  const { integrity, snapshot_id: snapshotId, ...material } = snapshot as VNextAutomationWorkSnapshotV01;
  const fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(material));
  return (
    snapshot.snapshot_version === VNEXT_AUTOMATION_WORK_SNAPSHOT_VERSION_V01 &&
    integrity.algorithm === "sha256" &&
    integrity.fingerprint_scope === "automation_work_snapshot_without_integrity_fingerprint" &&
    integrity.fingerprint === fingerprint &&
    snapshotId === `automation-work-snapshot:${snapshot.source.work_id.slice(-24)}:${snapshot.revision}:${fingerprint.slice(7, 19)}`
  );
}

function normalizeWorkSourceMaterialV01(input: Omit<VNextAutomationWorkSourceV01, "work_source_version" | "work_id" | "work_fingerprint">) {
  if (
    input.source_grant_record_status !== "exact_record" &&
    input.source_grant_record_status !== "packet_bound_summary"
  ) {
    refuseV01("bounded_automation_source_grant_record_status_invalid", 422);
  }
  if (!input.source_capability_grant || input.source_capability_grant.coverage !== "enforced") {
    refuseV01("bounded_automation_source_grant_unenforced", 422);
  }
  const sourceGrantFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(input.source_capability_grant),
  );
  if (sourceGrantFingerprint !== input.source_capability_grant_fingerprint) {
    refuseV01("bounded_automation_source_grant_fingerprint_conflict", 422);
  }
  const sourcePacket = {
    packet_id: normalizeTextV01(input.source_packet.packet_id, "source_packet.packet_id"),
    packet_fingerprint: normalizeShaV01(input.source_packet.packet_fingerprint, "source_packet.packet_fingerprint"),
  };
  const task = {
    goal: normalizeTextV01(input.task.goal, "task.goal", WORK_TEXT_LIMIT_V01),
    success_criteria: canonicalStringsV01(input.task.success_criteria, "task.success_criteria"),
    non_goals: canonicalStringsV01(input.task.non_goals, "task.non_goals"),
  };
  if (task.success_criteria.length === 0) refuseV01("bounded_automation_success_criteria_empty", 422);
  const requiredContextRefs = uniqueProtocolValuesV01(
    input.required_context_refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
  if (requiredContextRefs.length > WORK_COLLECTION_LIMIT_V01) refuseV01("bounded_automation_context_ref_bound_exceeded", 422);
  const createdAt = normalizeTimestampV01(input.created_at, "created_at");
  const budget = input.budget_projection;
  if (
    !budget || budget.max_work_items !== 1 || budget.max_active_runs !== 1 ||
    budget.max_attempts !== 1 || !Number.isSafeInteger(budget.max_commands) ||
    budget.max_commands < 1 || budget.max_commands > 128 ||
    !Number.isSafeInteger(budget.max_runtime_ms) || budget.max_runtime_ms < 1 ||
    budget.max_runtime_ms > 900_000 || budget.augnes_model_invocations !== 0 ||
    budget.augnes_model_tokens !== 0 || budget.augnes_model_cost_units !== 0 ||
    budget.native_host_model_scope !== "none" || budget.network_access !== "denied"
  ) refuseV01("bounded_automation_work_budget_invalid", 422);
  return {
    workspace_id: normalizeTextV01(input.workspace_id, "workspace_id"),
    project_id: normalizeTextV01(input.project_id, "project_id"),
    work_class: "bounded_project_task" as const,
    title: normalizeTextV01(input.title, "title", 320),
    task,
    source_packet: sourcePacket,
    source_capability_grant: structuredClone(input.source_capability_grant),
    source_capability_grant_fingerprint: sourceGrantFingerprint,
    source_grant_record_status: input.source_grant_record_status,
    required_context_refs: requiredContextRefs,
    proposed_files: canonicalStringsV01(input.proposed_files, "proposed_files"),
    required_checks: canonicalStringsV01(input.required_checks, "required_checks"),
    expected_outputs: canonicalStringsV01(input.expected_outputs, "expected_outputs"),
    blocked_actions: canonicalStringsV01(input.blocked_actions, "blocked_actions"),
    stop_conditions: canonicalStringsV01(input.stop_conditions, "stop_conditions"),
    budget_projection: structuredClone(budget),
    created_at: createdAt,
  };
}

function workFingerprintMaterialV01(input: ReturnType<typeof normalizeWorkSourceMaterialV01>) {
  const { created_at: _createdAt, ...identity } = input;
  return identity;
}

function createWorkSnapshotV01(input: Omit<VNextAutomationWorkSnapshotV01, "snapshot_version" | "snapshot_id" | "integrity">): VNextAutomationWorkSnapshotV01 {
  const material = {
    snapshot_version: VNEXT_AUTOMATION_WORK_SNAPSHOT_VERSION_V01,
    source: structuredClone(input.source),
    status: input.status,
    revision: input.revision,
    prior_snapshot_ref: input.prior_snapshot_ref ? normalizeExternalRefPrimitiveV01(input.prior_snapshot_ref) : null,
    cycle_binding: input.cycle_binding ? normalizeCycleBindingV01(input.cycle_binding) : null,
    status_reason: normalizeTextV01(input.status_reason, "status_reason"),
    observed_at: normalizeTimestampV01(input.observed_at, "observed_at"),
  };
  const fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(material));
  const snapshot: VNextAutomationWorkSnapshotV01 = {
    ...material,
    snapshot_id: `automation-work-snapshot:${input.source.work_id.slice(-24)}:${input.revision}:${fingerprint.slice(7, 19)}`,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "automation_work_snapshot_without_integrity_fingerprint",
      fingerprint,
    },
  };
  if (!validateVNextAutomationWorkSnapshotV01(snapshot)) refuseV01("bounded_automation_work_snapshot_invalid", 422);
  return snapshot;
}

function admitWorkSnapshotV01(db: Database.Database, snapshot: VNextAutomationWorkSnapshotV01) {
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "automation_work_item",
    record_id: snapshot.snapshot_id,
    workspace_id: snapshot.source.workspace_id,
    project_id: snapshot.source.project_id,
    fingerprint: snapshot.integrity.fingerprint,
    idempotency_key: createProtocolSha256V01(canonicalizeProtocolValueV01({
      purpose: snapshot.snapshot_version,
      work_id: snapshot.source.work_id,
      revision: snapshot.revision,
    })),
    payload: snapshot,
    created_at: snapshot.observed_at,
  });
  return { status: write.status, snapshot };
}

function normalizeCycleBindingV01(binding: VNextAutomationWorkCycleBindingV01): VNextAutomationWorkCycleBindingV01 {
  return {
    cycle_id: normalizeTextV01(binding.cycle_id, "cycle_id"),
    policy_ref: normalizeExternalRefPrimitiveV01(binding.policy_ref),
    control_revision: integerV01(binding.control_revision, "control_revision"),
    final_grant_ref: normalizeExternalRefPrimitiveV01(binding.final_grant_ref),
    packet_ref: normalizeExternalRefPrimitiveV01(binding.packet_ref),
    trigger_ref: normalizeExternalRefPrimitiveV01(binding.trigger_ref),
    attempt: 1,
    run_id: normalizeTextV01(binding.run_id, "run_id"),
    receipt_ref: binding.receipt_ref ? normalizeExternalRefPrimitiveV01(binding.receipt_ref) : null,
    proposal_ref: binding.proposal_ref ? normalizeExternalRefPrimitiveV01(binding.proposal_ref) : null,
  };
}

function validateCycleBindingV01(binding: VNextAutomationWorkCycleBindingV01): boolean {
  try {
    const normalized = normalizeCycleBindingV01(binding);
    return canonicalizeProtocolValueV01(normalized) === canonicalizeProtocolValueV01(binding);
  } catch {
    return false;
  }
}

function validStatusTransitionV01(from: VNextAutomationWorkStatusV01, to: VNextAutomationWorkStatusV01): boolean {
  return (
    (from === "queued" && to === "claimed") ||
    (from === "claimed" && ["running", "failed", "reconciliation_required", "cancelled"].includes(to)) ||
    (from === "running" && ["review_needed", "failed", "reconciliation_required", "cancelled"].includes(to)) ||
    (from === "failed" && to === "reconciliation_required") ||
    (from === "reconciliation_required" && to === "review_needed") ||
    (from === "review_needed" && to === "completed")
  );
}

function automationRefV01(refType: string, externalId: string, observedAt: string, sourceRef: string): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: "bounded_autohunt_review_needed.v0.1",
    trust_class: "direct_local_observation",
  };
}

function canonicalStringsV01(values: readonly string[], field: string): string[] {
  if (!Array.isArray(values) || values.length > WORK_COLLECTION_LIMIT_V01) refuseV01(`bounded_automation_${field.replaceAll(".", "_")}_bound_exceeded`, 422);
  return [...new Set(values.map((value) => normalizeTextV01(value, field)))].sort();
}

function normalizeTextV01(value: string, field: string, limit = WORK_TEXT_LIMIT_V01): string {
  if (typeof value !== "string") refuseV01(`bounded_automation_${field.replaceAll(".", "_")}_invalid`, 422);
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (!normalized || normalized.length > limit) refuseV01(`bounded_automation_${field.replaceAll(".", "_")}_invalid`, 422);
  return normalized;
}

function normalizeShaV01(value: string, field: string): string {
  if (!/^sha256:[a-f0-9]{64}$/u.test(value)) refuseV01(`bounded_automation_${field.replaceAll(".", "_")}_invalid`, 422);
  return value;
}

function normalizeTimestampV01(value: string, field: string): string {
  if (parseStrictIsoTimestampV01(value) === null) refuseV01(`bounded_automation_${field}_invalid`, 422);
  return value;
}

function integerV01(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) refuseV01(`bounded_automation_${field}_invalid`, 422);
  return value;
}

function nonemptyV01(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= limit;
}

function hasExactKeysV01(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function refuseV01(code: string, status = 409): never {
  throw new BoundedAutomationAuthorityErrorV01(code, status);
}
