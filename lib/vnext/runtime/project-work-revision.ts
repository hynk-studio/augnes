import { compareNewProjectWorkV01, currentPreparationRootBindingV01, NewProjectWorkPreparationErrorV01 } from "./new-project-work-preparation";
import { accessSync, constants, statSync } from "node:fs";

import type Database from "better-sqlite3";
import { compareSelectedWorkSources, normalizeRetainedWorkSourceRefs, normalizeSelectedWorkSources, readSelectedWorkSources, SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { resolveRetainedWorkSources } from "@/lib/intake/retained-work-source-recall";

import {
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  VNextLocalOperatorSessionErrorV01,
  admitVNextLocalOperatorMutationInsideTransactionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  PreExecutionProjectWorkRevisionErrorV01,
  buildPreExecutionProjectWorkRevisionPacketV01,
  createPreExecutionProjectWorkRevisionMaterialV01,
  inspectPreExecutionProjectWorkRevisionChainV01,
} from "@/lib/vnext/runtime/pre-execution-project-work-revision";
import { inspectProjectManagedRunHistoryV01 } from "@/lib/vnext/runtime/project-managed-run-history";
import {
  inspectSourceLinkedOperationalContinuationLineageV01,
  readOperationalContinuationLineageStateV01,
} from "@/lib/vnext/runtime/source-linked-operational-continuation-lineage";
import {
  INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
  normalizeInitialProjectWorkDefinitionV01,
} from "@/lib/vnext/runtime/initial-project-work-context";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ProjectWorkDefinitionV01 } from "@/types/vnext/project-work-initialization";
import {
  MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01,
  PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
  PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01,
  PROJECT_WORK_REVISION_ELIGIBILITY_VERSION_V01,
  type ProjectWorkRevisionEligibilityV01,
  type ProjectWorkRevisionEligibilityStatusV01,
  type RevisePreExecutionProjectWorkRequestV01,
  type RevisePreExecutionProjectWorkResultV01,
} from "@/types/vnext/project-work-revision";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const REQUEST_KEYS = [
  "action",
  "workspace_id",
  "project_id",
  "expected_active_project_id",
  "expected_active_selection_revision",
  "expected_current_packet_id",
  "expected_current_packet_fingerprint",
  "expected_current_lineage_kind",
  "goal",
  "success_criteria",
  "non_goals",
] as const;

export class ProjectWorkRevisionErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "ProjectWorkRevisionErrorV01";
  }
}

export interface ProjectWorkRevisionDependenciesV01 {
  root_available?: (root: string) => boolean;
}

export function readProjectWorkRevisionEligibilityV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  dependencies: ProjectWorkRevisionDependenciesV01 = {},
): ProjectWorkRevisionEligibilityV01 {
  try {
    return readProjectWorkRevisionEligibilityStrictV01(
      db,
      input,
      dependencies,
    );
  } catch {
    return eligibilityV01(input, {
      status: "unavailable",
      reason: "source_unavailable",
    });
  }
}

export function readProjectWorkRevisionEligibilityStrictV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  dependencies: ProjectWorkRevisionDependenciesV01 = {},
): ProjectWorkRevisionEligibilityV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const active = readActiveProjectSelectionV01(db, input.workspace_id);
  const activeBinding = {
    active_project_id: active?.project_id ?? null,
    active_selection_revision: active?.selection_revision ?? null,
  };
  const registration = readCanonicalProjectWithRootV01(db, input);
  if (!registration) {
    return eligibilityV01(input, {
      ...activeBinding,
      status: "unavailable",
      reason: "project_unavailable",
    });
  }
  if (
    active?.project_id !== input.project_id ||
    !Number.isSafeInteger(active.selection_revision) ||
    active.selection_revision < 1
  ) {
    return eligibilityV01(input, {
      ...activeBinding,
      status: "blocked_inactive_project",
      reason: "project_inactive",
    });
  }
  const rootAvailable =
    dependencies.root_available ?? rootAvailableSynchronouslyV01;
  if (!rootAvailable(registration.root_binding.local_root.normalized_path)) {
    return eligibilityV01(input, {
      ...activeBinding,
      status: "blocked_root_unavailable",
      reason: "root_unavailable",
    });
  }
  const packetCount = countCoreRecordsV01(db, input, "task_context_packet");
  if (packetCount === 0) {
    return eligibilityV01(input, {
      ...activeBinding,
      status: "blocked_not_current",
      reason: "current_packet_stale_or_unavailable",
    });
  }
  const continuation = readOperationalContinuationLineageStateV01(db, input);
  if (continuation) {
    const lineage = inspectSourceLinkedOperationalContinuationLineageV01(db, {
      ...input,
      packet_id: continuation.packet_b.packet_id,
      packet_fingerprint: continuation.packet_b.integrity.fingerprint,
    });
    if (!lineage.projection_current) {
      return eligibilityV01(input, {
        ...activeBinding,
        status: "blocked_not_current",
        reason: "current_packet_stale_or_unavailable",
      });
    }
    return eligibilityV01(input, {
      ...activeBinding,
      current_packet_id: continuation.packet_b.packet_id,
      current_packet_fingerprint:
        continuation.packet_b.integrity.fingerprint,
      current_lineage_kind: null,
      revision_count: 0,
      status: "blocked_operational_continuation",
      reason: "operational_continuation_not_revisable",
    });
  }
  let chain: ReturnType<
    typeof inspectPreExecutionProjectWorkRevisionChainV01
  >;
  try {
    chain = inspectPreExecutionProjectWorkRevisionChainV01(db, input);
  } catch (error) {
    if (error instanceof PreExecutionProjectWorkRevisionErrorV01) {
      return eligibilityV01(input, {
        ...activeBinding,
        status: "unavailable",
        reason: "revision_chain_invalid",
      });
    }
    throw error;
  }
  const binding = {
    ...activeBinding,
    current_packet_id: chain.tip_packet.packet_id,
    current_packet_fingerprint: chain.tip_packet.integrity.fingerprint,
    current_lineage_kind: chain.tip_lineage_kind,
    revision_count: chain.revision_count,
  };
  const runHistory = inspectProjectManagedRunHistoryV01(db, input);
  if (runHistory.status === "unavailable") {
    return eligibilityV01(input, {
      ...binding,
      status: "unavailable",
      reason: "source_unavailable",
    });
  }
  if (runHistory.status === "present") {
    return eligibilityV01(input, {
      ...binding,
      status: "blocked_execution_started",
      reason: "managed_run_history_present",
    });
  }
  const allowedPackets = new Set(chain.packet_ids);
  const coreRows = db
    .prepare(
      `SELECT record_kind, record_id FROM vnext_core_records
        WHERE workspace_id = ? AND project_id = ?`,
    )
    .all(input.workspace_id, input.project_id) as Array<{
    record_kind: string;
    record_id: string;
  }>;
  const otherHistory = coreRows.some(
    (row) =>
      row.record_kind !== "work_expectation_record" && (row.record_kind !== "task_context_packet" ||
      !allowedPackets.has(row.record_id)),
  );
  const semanticState = countScopedRowsV01(
    db,
    "vnext_semantic_state_entries",
    input,
  );
  const semanticHeads = countScopedRowsV01(
    db,
    "vnext_semantic_target_heads",
    input,
  );
  if (!chain.projection_current) {
    return eligibilityV01(input, {
      ...binding,
      status: "blocked_not_current",
      reason: "current_packet_stale_or_unavailable",
    });
  }
  if (otherHistory || semanticState > 0 || semanticHeads > 0) {
    return eligibilityV01(input, {
      ...binding,
      status: "blocked_work_history",
      reason: "durable_work_history_present",
    });
  }
  if (
    chain.revision_count >= MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01
  ) {
    return eligibilityV01(input, {
      ...binding,
      status: "revision_limit_reached",
      reason: "revision_limit_reached",
    });
  }
  return eligibilityV01(input, {
    ...binding,
    status:
      chain.tip_lineage_kind === "initial_user_defined"
        ? "eligible_initial_packet"
        : "eligible_revised_packet",
    reason:
      chain.tip_lineage_kind === "initial_user_defined"
        ? "current_initial_packet_zero_history"
        : "current_revision_packet_zero_history",
  });
}

export function revisePreExecutionProjectWorkV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
  dependencies: ProjectWorkRevisionDependenciesV01 = {},
): RevisePreExecutionProjectWorkResultV01 {
  // Preserve Browser validation order before credential admission.
  const request = parseRequestV01(input.request);
  normalizeInitialProjectWorkDefinitionV01(request);
  if (request.workspace_id !== input.config.workspace_id ||
    request.project_id !== input.config.project_id ||
    request.expected_active_project_id !== input.config.project_id) {
    refuse("work_revision_scope_conflict", 403);
  }
  if (db.inTransaction) refuse("work_revision_transaction_conflict", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const result = revisePreExecutionProjectWorkInsideTransactionV01(db, {
      scope: input.config, request: input.request, admission,
    }, dependencies);
    db.exec("COMMIT");
    return { ...result, session_admission: {
      cookie_value: admission.cookie_value,
      cookie_expires_at: admission.cookie_expires_at,
      cookie_max_age_seconds: admission.cookie_max_age_seconds,
    } };
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (error instanceof ProjectWorkRevisionErrorV01 ||
      error instanceof PreExecutionProjectWorkRevisionErrorV01 ||
      error instanceof VNextLocalOperatorSessionErrorV01 ||
      error instanceof SelectedWorkSourceError || error instanceof NewProjectWorkPreparationErrorV01) throw error;
    throw new ProjectWorkRevisionErrorV01("work_revision_write_failed", 409);
  }
}

/** Both authenticated transports share this writer. Caller owns IMMEDIATE,
 * admission and commit/rollback; no credential or transport bypass lives here. */
export function revisePreExecutionProjectWorkInsideTransactionV01(
  db: Database.Database,
  input: {
    scope: { workspace_id: string; project_id: string; operator_id: string };
    request: unknown;
    admission: { session: { session_id: string }; action_observed_at: string };
  },
  dependencies: ProjectWorkRevisionDependenciesV01 = {},
): Omit<RevisePreExecutionProjectWorkResultV01, "session_admission"> {
  if (!db.inTransaction) refuse("work_revision_transaction_conflict", 409);
  const request = parseRequestV01(input.request);
  const definition = normalizeInitialProjectWorkDefinitionV01(request);
  if (request.workspace_id !== input.scope.workspace_id ||
    request.project_id !== input.scope.project_id ||
    request.expected_active_project_id !== input.scope.project_id) {
    refuse("work_revision_scope_conflict", 403);
  }
  const active = readActiveProjectSelectionV01(
    db,
    input.scope.workspace_id,
  );
  if (
    active?.project_id !== request.expected_active_project_id ||
    active.selection_revision !== request.expected_active_selection_revision
  ) {
    refuse("work_revision_active_selection_conflict", 409);
  }
  const registration = readCanonicalProjectWithRootV01(db, input.scope);
  if (!registration) refuse("work_revision_project_missing", 404);
  const rootAvailable =
    dependencies.root_available ?? rootAvailableSynchronouslyV01;
  if (!rootAvailable(registration.root_binding.local_root.normalized_path)) {
    refuse("work_revision_root_unavailable", 409);
  }
  const chain = inspectPreExecutionProjectWorkRevisionChainV01(
    db,
    input.scope,
  );
  if (request.selected_source_context !== undefined) {
    const comparisonPacket = chain.tip_packet.packet_id === request.expected_current_packet_id
      ? chain.tip_packet : chain.tip_revision?.prior_packet;
    const cutoff = chain.packets.findIndex((packet) => packet.packet_id === comparisonPacket?.packet_id);
    const retained = resolveRetainedWorkSources({ ...chain, packets: chain.packets.slice(0, cutoff + 1) }, request.retained_source_refs ?? []);
    if (retained.entries.some((entry) => !request.selected_source_context!.some((selected) =>
      canonicalizeProtocolValueV01(selected) === canonicalizeProtocolValueV01(entry)))) {
      refuse("retained_source_selection_changed", 409);
    }
    if (!comparisonPacket || comparisonPacket.packet_id !== request.expected_current_packet_id ||
      comparisonPacket.integrity.fingerprint !== request.expected_current_packet_fingerprint ||
      compareSelectedWorkSources(comparisonPacket, request.selected_source_context, retained.refs).fingerprint !== request.expected_source_comparison) {
      refuse("work_revision_source_comparison_changed", 409);
    }
  }
  if (request.action === "prepare_new_project_work") {
    const basis = chain.tip_packet.packet_id === request.expected_current_packet_id
      ? chain.tip_packet : chain.tip_revision?.prior_packet;
    if (!basis || basis.packet_id !== request.expected_current_packet_id) refuse("work_revision_current_packet_changed", 409);
    const reviewed = compareNewProjectWorkV01(basis, request,
      currentPreparationRootBindingV01(db, input.scope), request.preparation!.omitted_sources);
    if (canonicalizeProtocolValueV01(reviewed.preparation) !== canonicalizeProtocolValueV01(request.preparation)) {
      refuse("new_work_preview_changed", 409);
    }
  }
  const exactExpectedCurrent =
    chain.tip_packet.packet_id === request.expected_current_packet_id &&
    chain.tip_packet.integrity.fingerprint ===
      request.expected_current_packet_fingerprint &&
    chain.tip_lineage_kind === request.expected_current_lineage_kind;
  const eligibility = readProjectWorkRevisionEligibilityStrictV01(
    db,
    input.scope,
    { root_available: rootAvailable },
  );
  if (!exactExpectedCurrent) {
    assertEligibleForExactSuccessorReplayV01(eligibility, chain);
    const replay = exactConcurrentSuccessorV01({
      chain,
      request,
      definition,
      operator_id: input.scope.operator_id,
      session_id: input.admission.session.session_id,
      observed_at: input.admission.action_observed_at,
    });
    if (replay) {
      return resultV01(
        "exact_replay",
        replay,
        definition,
        eligibility,
      );
    }
    refuse("work_revision_current_packet_changed", 409);
  }
  assertEligibleForMutationV01(eligibility);
  if (request.action === "revise_pre_execution_project_work" && sameDefinitionV01(chain.tip_packet.task, definition) &&
    canonicalizeProtocolValueV01(readSelectedWorkSources(chain.tip_packet)) ===
    canonicalizeProtocolValueV01(request.selected_source_context ?? readSelectedWorkSources(chain.tip_packet))) {
    return resultV01(
      "exact_replay",
      chain.tip_packet,
      definition,
      eligibility,
    );
  }
  const generatedAt = input.admission.action_observed_at;
  if (Date.parse(generatedAt) <= Date.parse(chain.tip_packet.generated_at)) {
    refuse("work_revision_current_packet_changed", 409);
  }
  const built = buildPreExecutionProjectWorkRevisionPacketV01({
    request,
    operator_id: input.scope.operator_id,
    session_id: input.admission.session.session_id,
    revision_number: chain.revision_count + 1,
    definition,
    prior_packet: chain.tip_packet,
    origin_first_work_definition_ref:
      chain.origin_first_work_definition_ref,
    generated_at: generatedAt,
  });
  if (
    validateTaskContextPacketV01(built.packet, {
      evaluated_at: generatedAt,
    }).status !== "valid"
  ) {
    refuse("work_revision_packet_invalid", 422);
  }
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: built.packet.packet_id,
    workspace_id: built.packet.workspace_id,
    project_id: built.packet.project_id,
    fingerprint: built.packet.integrity.fingerprint,
    idempotency_key: built.lineage.idempotency_key,
    payload: built.packet,
    created_at: built.packet.generated_at,
  });
  const after = inspectPreExecutionProjectWorkRevisionChainV01(
    db,
    input.scope,
  );
  if (
    after.tip_packet.packet_id !== built.packet.packet_id ||
    after.tip_packet.integrity.fingerprint !==
      built.packet.integrity.fingerprint ||
    !after.projection_current ||
    after.revision_count !== chain.revision_count + 1
  ) {
    refuse("work_revision_not_eligible", 409);
  }
  const afterEligibility = readProjectWorkRevisionEligibilityStrictV01(
    db,
    input.scope,
    { root_available: rootAvailable },
  );
  return resultV01(
    write.status === "inserted" ? "inserted" : "exact_replay",
    built.packet,
    definition,
    afterEligibility,
  );
}

function exactConcurrentSuccessorV01(input: {
  chain: ReturnType<typeof inspectPreExecutionProjectWorkRevisionChainV01>;
  request: RevisePreExecutionProjectWorkRequestV01;
  definition: ProjectWorkDefinitionV01;
  operator_id: string;
  session_id: string;
  observed_at: string;
}): TaskContextPacketV01 | null {
  const revision = input.chain.tip_revision;
  if (
    !revision ||
    (revision.lineage_kind === "pre_execution_new_task") !== (input.request.action === "prepare_new_project_work") ||
    revision.prior_packet.packet_id !==
      input.request.expected_current_packet_id ||
    revision.prior_packet.integrity.fingerprint !==
      input.request.expected_current_packet_fingerprint ||
    packetLineageKindV01(revision.prior_packet) !==
      input.request.expected_current_lineage_kind ||
    !sameDefinitionV01(revision.packet.task, input.definition)
  ) {
    return null;
  }
  const material = createPreExecutionProjectWorkRevisionMaterialV01({
    request: input.request,
    operator_id: input.operator_id,
    session_id: input.session_id,
    revision_number: revision.revision_number,
    definition: input.definition,
    prior_packet: revision.prior_packet,
    origin_first_work_definition_ref:
      input.chain.origin_first_work_definition_ref,
    observed_at: input.observed_at,
  });
  return material.request_fingerprint ===
    revision.revision_request_ref.source_ref
    ? revision.packet
    : null;
}

function assertEligibleForMutationV01(
  eligibility: ProjectWorkRevisionEligibilityV01,
): void {
  if (eligibility.eligible) return;
  if (eligibility.status === "blocked_execution_started") {
    refuse("work_revision_execution_started", 409);
  }
  if (eligibility.status === "blocked_work_history") {
    refuse("work_revision_history_changed", 409);
  }
  if (eligibility.status === "blocked_root_unavailable") {
    refuse("work_revision_root_unavailable", 409);
  }
  if (eligibility.status === "revision_limit_reached") {
    refuse("work_revision_limit_reached", 409);
  }
  refuse("work_revision_not_eligible", 409);
}

function assertEligibleForExactSuccessorReplayV01(
  eligibility: ProjectWorkRevisionEligibilityV01,
  chain: ReturnType<typeof inspectPreExecutionProjectWorkRevisionChainV01>,
): void {
  if (
    (eligibility.eligible || eligibility.status === "revision_limit_reached") &&
    chain.projection_current &&
    eligibility.current_packet_id === chain.tip_packet.packet_id &&
    eligibility.current_packet_fingerprint ===
      chain.tip_packet.integrity.fingerprint &&
    eligibility.current_lineage_kind === chain.tip_lineage_kind &&
    eligibility.revision_count === chain.revision_count
  ) {
    return;
  }
  if (eligibility.status === "blocked_execution_started") {
    refuse("work_revision_execution_started", 409);
  }
  if (eligibility.status === "blocked_work_history") {
    refuse("work_revision_history_changed", 409);
  }
  if (eligibility.status === "blocked_root_unavailable") {
    refuse("work_revision_root_unavailable", 409);
  }
  if (eligibility.status === "blocked_not_current") {
    refuse("work_revision_current_packet_changed", 409);
  }
  refuse("work_revision_not_eligible", 409);
}

function parseRequestV01(value: unknown): RevisePreExecutionProjectWorkRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse("work_revision_request_invalid", 400);
  }
  const request = { ...value } as Record<string, unknown>;
  const optionalKeys = request.selected_source_context === undefined
    ? [] : ["selected_source_context", "expected_source_comparison", ...(request.retained_source_refs !== undefined ? ["retained_source_refs"] : [])];
  if (
    canonicalizeProtocolValueV01(Object.keys(request).sort()) !==
      canonicalizeProtocolValueV01([...REQUEST_KEYS, ...optionalKeys, ...(request.action === "prepare_new_project_work" ? ["preparation"] : [])].sort()) ||
    !["revise_pre_execution_project_work", "prepare_new_project_work"].includes(String(request.action)) ||
    typeof request.workspace_id !== "string" ||
    typeof request.project_id !== "string" ||
    typeof request.expected_active_project_id !== "string" ||
    !Number.isSafeInteger(request.expected_active_selection_revision) ||
    Number(request.expected_active_selection_revision) < 1 ||
    typeof request.expected_current_packet_id !== "string" ||
    typeof request.expected_current_packet_fingerprint !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(
      request.expected_current_packet_fingerprint,
    ) ||
    ![
      "initial_user_defined",
      "pre_execution_user_revision",
      "pre_execution_new_task",
    ].includes(String(request.expected_current_lineage_kind))
  ) {
    refuse("work_revision_request_invalid", 400);
  }
  if (request.action === "prepare_new_project_work") {
    const preparation = request.preparation as Record<string, unknown> | undefined;
    if (request.selected_source_context === undefined || request.retained_source_refs !== undefined ||
      !preparation || typeof preparation !== "object" || Array.isArray(preparation) ||
      Object.keys(preparation).sort().join(",") !== "expected_root_binding,omitted_sources,preview_binding" ||
      !/^sha256:[a-f0-9]{64}$/u.test(String(preparation.expected_root_binding)) ||
      !/^sha256:[a-f0-9]{64}$/u.test(String(preparation.preview_binding))) refuse("work_revision_request_invalid", 400);
  }
  if (request.selected_source_context !== undefined) {
    if (typeof request.expected_source_comparison !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(request.expected_source_comparison)) {
      refuse("work_revision_request_invalid", 400);
    }
    request.selected_source_context = normalizeSelectedWorkSources(
      { workspace_id: request.workspace_id as string, project_id: request.project_id as string }, request.selected_source_context);
    if (request.retained_source_refs !== undefined) request.retained_source_refs = normalizeRetainedWorkSourceRefs(request.retained_source_refs);
  }
  return request as unknown as RevisePreExecutionProjectWorkRequestV01;
}

export function packetLineageKindV01(
  packet: TaskContextPacketV01,
): RevisePreExecutionProjectWorkRequestV01["expected_current_lineage_kind"] | null {
  if (packet.compatibility.source_contracts.includes(PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01)) return "pre_execution_new_task";
  if (
    packet.compatibility.source_contracts.includes(
      PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
    )
  ) {
    return "pre_execution_user_revision";
  }
  return packet.compatibility.source_contracts.includes(
    INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
  )
    ? "initial_user_defined"
    : null;
}

function eligibilityV01(
  input: { workspace_id: string; project_id: string },
  values: Partial<
    Omit<
      ProjectWorkRevisionEligibilityV01,
      | "eligibility_version"
      | "workspace_id"
      | "project_id"
      | "eligible"
      | "projection_only"
      | "semantic_authority_granted"
      | "execution_authority_granted"
    >
  > & {
    status: ProjectWorkRevisionEligibilityStatusV01;
    reason: ProjectWorkRevisionEligibilityV01["reason"];
  },
): ProjectWorkRevisionEligibilityV01 {
  return {
    eligibility_version: PROJECT_WORK_REVISION_ELIGIBILITY_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    active_project_id: values.active_project_id ?? null,
    active_selection_revision: values.active_selection_revision ?? null,
    current_packet_id: values.current_packet_id ?? null,
    current_packet_fingerprint: values.current_packet_fingerprint ?? null,
    current_lineage_kind: values.current_lineage_kind ?? null,
    revision_count: values.revision_count ?? 0,
    status: values.status,
    reason: values.reason,
    eligible:
      values.status === "eligible_initial_packet" ||
      values.status === "eligible_revised_packet",
    projection_only: true,
    semantic_authority_granted: false,
    execution_authority_granted: false,
  };
}

function sameDefinitionV01(
  left: ProjectWorkDefinitionV01,
  right: ProjectWorkDefinitionV01,
): boolean {
  return (
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right)
  );
}

function countCoreRecordsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  kind: string,
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM vnext_core_records
        WHERE workspace_id = ? AND project_id = ? AND record_kind = ?`,
    )
    .get(input.workspace_id, input.project_id, kind) as { count: number };
  return row.count;
}

function countScopedRowsV01(
  db: Database.Database,
  table: string,
  input: { workspace_id: string; project_id: string },
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM ${table}
        WHERE workspace_id = ? AND project_id = ?`,
    )
    .get(input.workspace_id, input.project_id) as { count: number };
  return row.count;
}

function rootAvailableSynchronouslyV01(root: string): boolean {
  try {
    if (!statSync(root).isDirectory()) return false;
    accessSync(root, constants.R_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resultV01(
  status: "inserted" | "exact_replay",
  packet: TaskContextPacketV01,
  definition: ProjectWorkDefinitionV01,
  eligibility: ProjectWorkRevisionEligibilityV01,
): Omit<RevisePreExecutionProjectWorkResultV01, "session_admission"> {
  return {
    status,
    packet,
    definition,
    revision_eligibility: eligibility,
    run_created: false,
    provider_called: false,
    project_files_written: false,
    proposal_created: false,
    review_decision_created: false,
    transition_created: false,
    semantic_state_changed: false,
    execution_started: false,
    semantic_authority_granted: false,
    execution_authority_granted: false,
  };
}

function refuse(code: string, status = 409): never {
  throw new ProjectWorkRevisionErrorV01(code, status);
}

/** Authenticated read callers provide one coherent snapshot; never writes. */
export function previewNewProjectWorkV01(db: Database.Database, scope: { workspace_id: string; project_id: string }, value: Record<string, unknown>) {
  if (!db.inTransaction) refuse("work_revision_transaction_conflict", 409);
  const { omitted_sources, action: _action, ...fields } = value;
  const chain = inspectPreExecutionProjectWorkRevisionChainV01(db, scope);
  const eligibility = readProjectWorkRevisionEligibilityStrictV01(db, scope);
  assertEligibleForMutationV01(eligibility);
  if (fields.workspace_id !== scope.workspace_id || fields.project_id !== scope.project_id ||
    fields.expected_active_project_id !== scope.project_id || fields.expected_active_selection_revision !== eligibility.active_selection_revision ||
    fields.expected_current_packet_id !== chain.tip_packet.packet_id ||
    fields.expected_current_packet_fingerprint !== chain.tip_packet.integrity.fingerprint ||
    fields.expected_current_lineage_kind !== chain.tip_lineage_kind) refuse("work_revision_current_packet_changed", 409);
  const draft = { ...fields, action: "prepare_new_project_work" } as RevisePreExecutionProjectWorkRequestV01;
  const comparison = compareNewProjectWorkV01(chain.tip_packet, draft, currentPreparationRootBindingV01(db, scope), omitted_sources);
  const request = parseRequestV01({ ...draft, preparation: comparison.preparation });
  return { status: "new_work_preview" as const, comparison, request };
}
