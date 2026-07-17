import type Database from "better-sqlite3";

import {
  autonomyRunnerLedgerSchemaExistsV01,
  listAutonomyRunLedgerRecords,
  readAutonomyRunLedgerRecord,
} from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import type { AutonomyRunSummary } from "@/types/autonomy-runner-execution";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  PROJECT_RUN_RESULT_READ_MODEL_VERSION_V01,
  type ProjectRunResultActionV01,
  type ProjectRunResultArtifactV01,
  type ProjectRunResultAttentionV01,
  type ProjectRunResultCurrentRunV01,
  type ProjectRunResultDetailV01,
  type ProjectRunResultModelInvocationV01,
  type ProjectRunResultOverviewV01,
  type ProjectRunResultSummaryV01,
} from "@/types/vnext/project-run-result";
import type {
  RunReceiptModelInvocationEntryV02,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const RECEIPT_SCAN_LIMIT = 256;
const HOST_RUN_SCAN_LIMIT = 128;
const MODEL_INVOCATION_REF_TYPES = new Set([
  "model_invocation",
  "model_invocation_receipt",
]);

export class ProjectRunResultReadErrorV01 extends Error {
  constructor(
    readonly code:
      | "project_result_receipt_missing"
      | "project_result_receipt_invalid"
      | "project_result_receipt_scope_conflict"
      | "project_result_receipt_run_conflict"
      | "project_result_packet_conflict",
  ) {
    super(code);
    this.name = "ProjectRunResultReadErrorV01";
  }
}

export function readProjectRunResultOverviewV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectRunResultOverviewV01 {
  const runs = listManagedHostRunsV01(db, input);
  const current = runs.find((run) => !isTerminalRunnerStatus(run.status));
  const receipts = listValidReceiptsV01(db, input);
  const latest = receipts[0] ?? null;
  const terminalManaged = runs.find((run) => isTerminalRunnerStatus(run.status));
  const expectedReceiptId = stringMetadataV01(
    terminalManaged?.metadata.run_receipt_id,
  );
  const expectedReceiptMissing = Boolean(
    terminalManaged?.metadata.terminal_receipt_persisted === true &&
      expectedReceiptId &&
      !receipts.some((receipt) => receipt.receipt_id === expectedReceiptId),
  );
  return {
    read_model_version: PROJECT_RUN_RESULT_READ_MODEL_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    current_run: current ? projectCurrentRunV01(current) : null,
    latest_result: latest ? projectReceiptSummaryV01(latest) : null,
    latest_result_state: expectedReceiptMissing
      ? "receipt_unavailable"
      : latest
        ? "available"
        : "empty",
  };
}

export function readProjectRunResultDetailV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; receipt_id: string },
): ProjectRunResultDetailV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: input.receipt_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record) {
    throw new ProjectRunResultReadErrorV01("project_result_receipt_missing");
  }
  const receipt = validatedReceiptFromEnvelopeV01(record, input);
  const duplicateCount = (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM vnext_core_records
         WHERE workspace_id = ? AND project_id = ?
           AND record_kind = 'run_receipt'
           AND json_extract(payload_json, '$.run_id') = ?`,
      )
      .get(input.workspace_id, input.project_id, receipt.run_id) as {
      count: number;
    }
  ).count;
  if (duplicateCount !== 1) {
    throw new ProjectRunResultReadErrorV01(
      "project_result_receipt_run_conflict",
    );
  }
  const run = autonomyRunnerLedgerSchemaExistsV01(db)
    ? readAutonomyRunLedgerRecord(receipt.run_id, { db })
    : null;
  if (
    run &&
    (run.scope !== input.project_id ||
      run.metadata.workspace_id !== input.workspace_id ||
      run.metadata.project_id !== input.project_id ||
      (typeof run.metadata.run_receipt_id === "string" &&
        run.metadata.run_receipt_id !== receipt.receipt_id) ||
      (typeof run.metadata.run_receipt_fingerprint === "string" &&
        run.metadata.run_receipt_fingerprint !== receipt.integrity.fingerprint))
  ) {
    throw new ProjectRunResultReadErrorV01(
      "project_result_receipt_run_conflict",
    );
  }
  const packet = readLinkedPacketV01(db, input, receipt);
  assertRunPacketBindingV01(run?.metadata ?? null, receipt, packet);
  const summary = projectReceiptSummaryV01(receipt);
  const sourceTransitionRef = findRefV01(
    receipt.source_refs,
    "state_transition_receipt",
  );
  const rootScopeRef = findRefV01(receipt.source_refs, "project_root_scope");
  const repositoryRef =
    findRefV01(receipt.external_refs, "repository_remote") ??
    receipt.external_refs.find((ref) => ref.ref_type.includes("repository")) ??
    null;
  const selectedWorktreeRef = findRefV01(
    receipt.external_refs,
    "repository_worktree",
  );
  const adapterRef = findRefV01(
    receipt.external_refs,
    "native_host_adapter_version",
  );
  const capabilityRef = findRefV01(
    receipt.external_refs,
    "native_host_capability_version",
  );
  const hostRefs = uniqueRefsV01([
    receipt.host_ref,
    ...receipt.external_refs.filter(
      (ref) =>
        ref.ref_type.startsWith("host_") ||
        ref.ref_type.startsWith("native_host_"),
    ),
  ]);
  return {
    read_model_version: PROJECT_RUN_RESULT_READ_MODEL_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    summary,
    identity: {
      receipt_ref: receipt.receipt_id,
      receipt_fingerprint: receipt.integrity.fingerprint,
      run_ref: receipt.run_id,
      work_ref: receipt.work_ref,
      packet_ref: receipt.task_context_packet_ref,
      source_transition_ref: sourceTransitionRef,
      root_scope_ref: rootScopeRef,
      repository_ref: repositoryRef,
      selected_worktree_ref: selectedWorktreeRef,
      adapter_ref: adapterRef,
      capability_ref: capabilityRef,
      source_refs: receipt.source_refs,
    },
    packet: packet
      ? {
          status: "available",
          generated_at: packet.generated_at,
          packet_fingerprint: packet.integrity.fingerprint,
          selected_context_count: packet.selected_context.length,
          selected_context_refs: uniqueRefsV01(
            packet.selected_context.flatMap((entry) => [
              entry.external_ref,
              entry.compatibility_source_ref,
            ]),
          ),
          source_ref_count: packet.source_status.source_refs.length,
        }
      : {
          status: receipt.task_context_packet_ref ? "missing" : "not_recorded",
          generated_at: null,
          packet_fingerprint:
            receipt.task_context_packet_ref?.source_ref ?? null,
          selected_context_count: null,
          selected_context_refs: [],
          source_ref_count: null,
        },
    host: {
      host_ref: receipt.host_ref,
      host_refs: hostRefs,
      approvals: receipt.host_approvals ?? [],
    },
    artifacts: projectArtifactsV01(receipt),
    commands: receipt.commands,
    actions: projectActionsV01(receipt),
    checks: receipt.checks,
    skipped_checks: receipt.skipped_checks,
    blockers: receipt.blockers,
    warnings: receipt.warnings,
    gaps: receipt.gaps,
    uncertainty: receipt.warnings
      .filter((issue) => issue.code.startsWith("native_host_uncertainty_"))
      .map((issue) => issue.summary),
    proposed_next_steps: projectProposedNextStepsV01(receipt),
    model_invocations: projectModelInvocationsV01(receipt),
    capability_coverage: receipt.capability_coverage,
    trust_summary: receipt.trust_summary,
    privacy_egress: receipt.privacy_egress,
    compatibility: {
      source_contracts: receipt.compatibility.source_contracts,
      unmapped_fields: receipt.compatibility.unmapped_fields,
      warnings: receipt.compatibility.warnings,
    },
    authority: {
      proposal_created: false,
      review_decision_created: false,
      semantic_transition_created: false,
      evidence_accepted: false,
      work_closed: false,
      semantic_state_changed: false,
    },
  };
}

function listManagedHostRunsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): AutonomyRunSummary[] {
  if (!autonomyRunnerLedgerSchemaExistsV01(db)) return [];
  return listAutonomyRunLedgerRecords({
    db,
    scope: input.project_id,
    limit: HOST_RUN_SCAN_LIMIT,
  }).filter(
    (run) =>
      run.autonomy_contract_ref === DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 &&
      run.metadata.workspace_id === input.workspace_id &&
      run.metadata.project_id === input.project_id,
  );
}

function listValidReceiptsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): RunReceiptV01[] {
  const receipts = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["run_receipt"],
    limit: RECEIPT_SCAN_LIMIT,
  }).map((record) => validatedReceiptFromEnvelopeV01(record, input));
  const runIds = new Set<string>();
  for (const receipt of receipts) {
    if (runIds.has(receipt.run_id)) {
      throw new ProjectRunResultReadErrorV01(
        "project_result_receipt_run_conflict",
      );
    }
    runIds.add(receipt.run_id);
  }
  return receipts;
}

function validatedReceiptFromEnvelopeV01(
  record: VNextCoreRecordEnvelopeV01,
  input: { workspace_id: string; project_id: string },
): RunReceiptV01 {
  const validation = validateRunReceiptV01(record.payload);
  if (validation.status !== "valid") {
    throw new ProjectRunResultReadErrorV01("project_result_receipt_invalid");
  }
  const receipt = record.payload as RunReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  if (
    receipt.workspace_id !== input.workspace_id ||
    receipt.project_id !== input.project_id ||
    record.record_id !== receipt.receipt_id ||
    record.fingerprint !== receipt.integrity.fingerprint ||
    record.idempotency_key !== receipt.idempotency_key ||
    record.created_at !== receipt.recorded_at
  ) {
    throw new ProjectRunResultReadErrorV01(
      "project_result_receipt_scope_conflict",
    );
  }
  return receipt;
}

function readLinkedPacketV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  receipt: RunReceiptV01,
): TaskContextPacketV01 | null {
  const ref = receipt.task_context_packet_ref;
  if (!ref || ref.ref_type !== "task_context_packet" || !ref.source_ref) {
    return null;
  }
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: ref.external_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record) return null;
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet?.generated_at ?? "",
    }).status !== "valid" ||
    packet.workspace_id !== input.workspace_id ||
    packet.project_id !== input.project_id ||
    packet.packet_id !== ref.external_id ||
    packet.integrity.fingerprint !== ref.source_ref ||
    record.record_id !== packet.packet_id ||
    record.fingerprint !== packet.integrity.fingerprint
  ) {
    throw new ProjectRunResultReadErrorV01("project_result_packet_conflict");
  }
  return packet;
}

function assertRunPacketBindingV01(
  metadata: Record<string, unknown> | null,
  receipt: RunReceiptV01,
  packet: TaskContextPacketV01 | null,
): void {
  if (!metadata) return;
  const packetRef = receipt.task_context_packet_ref;
  if (
    (typeof metadata.packet_id === "string" &&
      packetRef?.external_id !== metadata.packet_id) ||
    (typeof metadata.packet_fingerprint === "string" &&
      packetRef?.source_ref !== metadata.packet_fingerprint) ||
    (packet &&
      (packet.packet_id !== metadata.packet_id ||
        packet.integrity.fingerprint !== metadata.packet_fingerprint)) ||
    (typeof metadata.root_fingerprint === "string" &&
      !receipt.source_refs.some(
        (ref) =>
          ref.ref_type === "project_root_scope" &&
          ref.source_ref === metadata.root_fingerprint,
      ))
  ) {
    throw new ProjectRunResultReadErrorV01("project_result_packet_conflict");
  }
}

function projectCurrentRunV01(
  run: AutonomyRunSummary,
): ProjectRunResultCurrentRunV01 {
  return {
    run_ref: run.run_id,
    status: run.status,
    mode: runModeV01(run.metadata.invocation_origin),
    started_at: run.started_at,
    updated_at: run.updated_at,
    public_reason: stringMetadataV01(run.metadata.public_reason) ?? run.stop_reason,
    reconciliation_required: run.metadata.reconciliation_required === true,
    packet_ref: stringMetadataV01(run.metadata.packet_id),
    receipt_available:
      typeof run.metadata.run_receipt_id === "string" &&
      run.metadata.terminal_receipt_persisted === true,
  };
}

function projectReceiptSummaryV01(
  receipt: RunReceiptV01,
): ProjectRunResultSummaryV01 {
  const actionCount = projectActionsV01(receipt).length;
  const trustLabel =
    receipt.execution.basis === "mixed"
      ? "mixed"
      : receipt.execution.basis === "attested"
        ? "host_attested"
        : receipt.execution.basis === "observed"
          ? "observed"
          : "unknown";
  return {
    receipt_ref: receipt.receipt_id,
    run_ref: receipt.run_id,
    outcome: receipt.result_summary.outcome,
    execution_status: receipt.execution.status,
    verification_status: receipt.verification.status,
    recorded_at: receipt.recorded_at,
    started_at: receipt.started_at,
    finished_at: receipt.finished_at,
    summary: receipt.result_summary.summary,
    changed_file_count: receipt.changed_artifacts.length,
    artifact_count: receipt.artifact_refs.length,
    command_count: receipt.commands.length,
    action_count: actionCount,
    check_counts: {
      passed: receipt.checks.filter((check) => check.status === "passed").length,
      failed: receipt.checks.filter((check) => check.status === "failed").length,
      blocked: receipt.checks.filter((check) => check.status === "blocked").length,
      unknown: receipt.checks.filter((check) => check.status === "unknown").length,
      skipped: receipt.skipped_checks.length,
    },
    blocker_count: receipt.blockers.length,
    gap_count: receipt.gaps.length,
    trust_label: trustLabel,
    review_attention: reviewAttentionV01(receipt),
    review_href: `/workbench/results/${receipt.receipt_id.replace(":", "~")}`,
    mode: runModeV01(
      receipt.execution_environment.runtime_labels.find((label) =>
        ["interactive", "policy_triggered"].includes(label),
      ),
    ),
  };
}

function reviewAttentionV01(
  receipt: RunReceiptV01,
): ProjectRunResultAttentionV01 {
  if (receipt.verification.status === "failed") return "verification_failed";
  if (receipt.result_summary.outcome === "timed_out") return "timed_out";
  if (receipt.result_summary.outcome === "cancelled") return "cancelled";
  if (receipt.result_summary.outcome === "unavailable") return "unavailable";
  if (receipt.execution.status === "blocked") return "blocked";
  if (receipt.gaps.length > 0) return "gaps_present";
  if (
    ["partial", "unknown", "not_run"].includes(receipt.verification.status)
  ) {
    return "verification_partial";
  }
  return "terminal_result_available";
}

function projectArtifactsV01(
  receipt: RunReceiptV01,
): ProjectRunResultArtifactV01[] {
  const changedByRef = new Map(
    receipt.changed_artifacts.map((artifact) => [
      refIdentityV01(artifact.artifact_ref),
      artifact,
    ]),
  );
  return receipt.artifact_refs.map((artifactRef) => {
    const identity = refIdentityV01(artifactRef);
    const changed = changedByRef.get(identity) ?? null;
    const observation = receipt.observations.find((entry) =>
      entry.related_artifact_refs.some(
        (candidate) => refIdentityV01(candidate) === identity,
      ),
    );
    const attestation = receipt.attestations.find((entry) =>
      entry.subject_refs.some(
        (candidate) => refIdentityV01(candidate) === identity,
      ),
    );
    return {
      artifact_ref: artifactRef,
      summary: attestation?.summary ?? observation?.summary ?? null,
      change_kind: changed?.change_kind ?? null,
      before_hash: changed?.before_hash ?? null,
      after_hash: changed?.after_hash ?? null,
      basis: changed?.basis ?? (attestation ? "attested" : observation ? "observed" : "unknown"),
      source_refs: uniqueRefsV01([
        ...(changed?.source_refs ?? []),
        ...(attestation?.source_refs ?? []),
        ...(observation?.source_refs ?? []),
      ]),
    };
  });
}

function projectActionsV01(receipt: RunReceiptV01): ProjectRunResultActionV01[] {
  return [
    ...receipt.observations
      .filter((entry) => entry.observation_kind === "native_host_action")
      .map((entry) => ({
        action_id: entry.observation_id,
        summary: entry.summary,
        basis: "observed" as const,
        source_refs: entry.source_refs,
      })),
    ...receipt.attestations
      .filter((entry) => entry.attestation_kind === "native_host_action_report")
      .map((entry) => ({
        action_id: entry.attestation_id,
        summary: entry.summary,
        basis: "host_attested" as const,
        source_refs: entry.source_refs,
      })),
  ].sort((left, right) => left.action_id.localeCompare(right.action_id));
}

function projectProposedNextStepsV01(
  receipt: RunReceiptV01,
): ProjectRunResultActionV01[] {
  return receipt.attestations
    .filter((entry) => entry.attestation_kind === "proposed_next_step")
    .map((entry) => ({
      action_id: entry.attestation_id,
      summary: entry.summary,
      basis: "advisory" as const,
      source_refs: entry.source_refs,
    }));
}

function projectModelInvocationsV01(
  receipt: RunReceiptV01,
): ProjectRunResultModelInvocationV01[] {
  const projected: ProjectRunResultModelInvocationV01[] = [];
  const resolved = new Set<string>();
  for (const item of receipt.model_invocations) {
    if ("entry_version" in item) {
      const entry = item as RunReceiptModelInvocationEntryV02;
      const invocation = entry.invocation_receipt;
      if (
        invocation.workspace_id !== receipt.workspace_id ||
        invocation.project_id !== receipt.project_id ||
        invocation.run_id !== receipt.run_id
      ) {
        throw new ProjectRunResultReadErrorV01(
          "project_result_receipt_scope_conflict",
        );
      }
      resolved.add(refIdentityV01(entry.invocation_ref));
      projected.push({
        state: "resolved_augnes_owned",
        invocation_ref: entry.invocation_ref,
        provider_ref: invocation.attempted_provider_ref,
        model_ref: invocation.attempted_model_ref,
        purpose: invocation.purpose,
        status: invocation.status,
        outcome: invocation.outcome,
        usage_summary: invocation.usage
          ? `${invocation.usage.total_tokens} reported tokens`
          : null,
        latency_ms: invocation.latency_ms,
        cost_summary:
          invocation.cost.amount === null
            ? "Cost unavailable; no pricing authority was recorded."
            : `${invocation.cost.amount} ${invocation.cost.currency ?? "currency not recorded"}`,
        budget_summary: [
          invocation.budget.decision,
          `${invocation.budget.provider_calls_used}/${invocation.budget.provider_call_limit} provider calls`,
          `${invocation.budget.input_bytes_used ?? "unknown"}/${invocation.budget.input_bytes_limit} input bytes`,
          `${invocation.budget.output_tokens_used ?? "unknown"}/${invocation.budget.output_tokens_limit} output tokens`,
          `${invocation.budget.timeout_limit_ms} ms timeout · ${invocation.budget.timeout_disposition}`,
        ].join(" · "),
        egress_status: invocation.egress_status,
        cancellation_disposition: invocation.cancellation_disposition,
        failure_code: invocation.failure_code,
        coverage: invocation.coverage_class,
        source_refs: entry.source_refs,
      });
      continue;
    }
    resolved.add(refIdentityV01(item.invocation_ref));
    projected.push({
      state: "referenced_unresolved",
      invocation_ref: item.invocation_ref,
      provider_ref: item.provider_ref,
      model_ref: item.model_ref,
      purpose: null,
      status: item.status,
      outcome: null,
      usage_summary:
        item.input_units !== null || item.output_units !== null
          ? "Legacy attested usage; canonical R4 ownership was not resolved."
          : null,
      latency_ms: item.latency_ms,
      cost_summary: null,
      budget_summary: null,
      egress_status: item.egress_status,
      cancellation_disposition: null,
      failure_code: null,
      coverage: "legacy_attested_unresolved",
      source_refs: item.source_refs,
    });
  }
  for (const ref of receipt.external_refs.filter((candidate) =>
    MODEL_INVOCATION_REF_TYPES.has(candidate.ref_type),
  )) {
    if (resolved.has(refIdentityV01(ref))) continue;
    projected.push({
      state: "referenced_unresolved",
      invocation_ref: ref,
      provider_ref: null,
      model_ref: null,
      purpose: null,
      status: null,
      outcome: null,
      usage_summary: null,
      latency_ms: null,
      cost_summary: null,
      budget_summary: null,
      egress_status: null,
      cancellation_disposition: null,
      failure_code: null,
      coverage: "reference_only",
      source_refs: [ref],
    });
  }
  const outsideCoverage = receipt.capability_coverage.some(
    (entry) =>
      entry.capability === "native_host_internal_model_activity" ||
      entry.notes.some((note) =>
        note.includes("outside Augnes-owned R4 Model Gateway"),
      ),
  );
  if (outsideCoverage) {
    projected.push({
      state: "native_host_internal_outside_coverage",
      invocation_ref: null,
      provider_ref: null,
      model_ref: null,
      purpose: null,
      status: null,
      outcome: null,
      usage_summary: null,
      latency_ms: null,
      cost_summary: null,
      budget_summary: null,
      egress_status: null,
      cancellation_disposition: null,
      failure_code: null,
      coverage: "outside_augnes_owned_r4",
      source_refs: [],
    });
  }
  if (projected.length === 0) {
    projected.push({
      state: "none",
      invocation_ref: null,
      provider_ref: null,
      model_ref: null,
      purpose: null,
      status: null,
      outcome: null,
      usage_summary: null,
      latency_ms: null,
      cost_summary: null,
      budget_summary: null,
      egress_status: null,
      cancellation_disposition: null,
      failure_code: null,
      coverage: "not_recorded",
      source_refs: [],
    });
  }
  return projected;
}

function findRefV01(
  refs: ExternalRefV01[],
  refType: string,
): ExternalRefV01 | null {
  return refs.find((ref) => ref.ref_type === refType) ?? null;
}

function refIdentityV01(ref: ExternalRefV01): string {
  return canonicalizeProtocolValueV01({
    ref_type: ref.ref_type,
    external_id: ref.external_id,
    provider: ref.provider ?? null,
    host: ref.host ?? null,
    compatibility_namespace: ref.compatibility_namespace ?? null,
  });
}

function uniqueRefsV01(
  values: Array<ExternalRefV01 | null | undefined>,
): ExternalRefV01[] {
  const byIdentity = new Map<string, ExternalRefV01>();
  for (const value of values) {
    if (!value) continue;
    const identity = refIdentityV01(value);
    if (!byIdentity.has(identity)) byIdentity.set(identity, value);
  }
  return [...byIdentity.values()].sort((left, right) =>
    refIdentityV01(left).localeCompare(refIdentityV01(right)),
  );
}

function runModeV01(
  value: unknown,
): "interactive" | "policy_triggered" | "unknown" {
  return value === "interactive" || value === "policy_triggered"
    ? value
    : "unknown";
}

function stringMetadataV01(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
