import { accessSync, constants, statSync } from "node:fs";

import type Database from "better-sqlite3";

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
  INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
  normalizeInitialProjectWorkDefinitionV01,
} from "@/lib/vnext/runtime/initial-project-work-context";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ProjectWorkDefinitionV01 } from "@/types/vnext/project-work-initialization";
import {
  MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01,
  PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
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
      row.record_kind !== "task_context_packet" ||
      !allowedPackets.has(row.record_id),
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
  if (otherHistory || semanticState > 0 || semanticHeads > 0) {
    return eligibilityV01(input, {
      ...binding,
      status: "blocked_work_history",
      reason: "durable_work_history_present",
    });
  }
  if (!chain.projection_current) {
    return eligibilityV01(input, {
      ...binding,
      status: "blocked_not_current",
      reason: "current_packet_stale_or_unavailable",
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
  const request = parseRequestV01(input.request);
  const definition = normalizeInitialProjectWorkDefinitionV01(request);
  if (
    request.workspace_id !== input.config.workspace_id ||
    request.project_id !== input.config.project_id ||
    request.expected_active_project_id !== input.config.project_id
  ) {
    refuse("work_revision_scope_conflict", 403);
  }
  if (db.inTransaction) refuse("work_revision_transaction_conflict", 409);
  db.exec("BEGIN IMMEDIATE");
  try {
    const sessionAdmission =
      admitVNextLocalOperatorMutationInsideTransactionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      });
    const active = readActiveProjectSelectionV01(
      db,
      input.config.workspace_id,
    );
    if (
      active?.project_id !== request.expected_active_project_id ||
      active.selection_revision !== request.expected_active_selection_revision
    ) {
      refuse("work_revision_active_selection_conflict", 409);
    }
    const registration = readCanonicalProjectWithRootV01(db, input.config);
    if (!registration) refuse("work_revision_project_missing", 404);
    const rootAvailable =
      dependencies.root_available ?? rootAvailableSynchronouslyV01;
    if (!rootAvailable(registration.root_binding.local_root.normalized_path)) {
      refuse("work_revision_root_unavailable", 409);
    }
    const chain = inspectPreExecutionProjectWorkRevisionChainV01(
      db,
      input.config,
    );
    const exactExpectedCurrent =
      chain.tip_packet.packet_id === request.expected_current_packet_id &&
      chain.tip_packet.integrity.fingerprint ===
        request.expected_current_packet_fingerprint &&
      chain.tip_lineage_kind === request.expected_current_lineage_kind;
    if (!exactExpectedCurrent) {
      const replay = exactConcurrentSuccessorV01({
        chain,
        request,
        definition,
        operator_id: input.config.operator_id,
        session_id: sessionAdmission.session.session_id,
        observed_at: sessionAdmission.action_observed_at,
      });
      if (replay) {
        db.exec("COMMIT");
        return resultV01(
          "exact_replay",
          replay,
          definition,
          readProjectWorkRevisionEligibilityStrictV01(
            db,
            input.config,
            { root_available: rootAvailable },
          ),
          sessionAdmission,
        );
      }
      refuse("work_revision_current_packet_changed", 409);
    }
    const eligibility = readProjectWorkRevisionEligibilityStrictV01(
      db,
      input.config,
      { root_available: rootAvailable },
    );
    assertEligibleForMutationV01(eligibility);
    if (sameDefinitionV01(chain.tip_packet.task, definition)) {
      db.exec("COMMIT");
      return resultV01(
        "exact_replay",
        chain.tip_packet,
        definition,
        eligibility,
        sessionAdmission,
      );
    }
    const generatedAt = sessionAdmission.action_observed_at;
    if (Date.parse(generatedAt) <= Date.parse(chain.tip_packet.generated_at)) {
      refuse("work_revision_current_packet_changed", 409);
    }
    const built = buildPreExecutionProjectWorkRevisionPacketV01({
      request,
      operator_id: input.config.operator_id,
      session_id: sessionAdmission.session.session_id,
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
      input.config,
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
      input.config,
      { root_available: rootAvailable },
    );
    db.exec("COMMIT");
    return resultV01(
      write.status === "inserted" ? "inserted" : "exact_replay",
      built.packet,
      definition,
      afterEligibility,
      sessionAdmission,
    );
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (
      error instanceof ProjectWorkRevisionErrorV01 ||
      error instanceof PreExecutionProjectWorkRevisionErrorV01 ||
      error instanceof VNextLocalOperatorSessionErrorV01
    ) {
      throw error;
    }
    throw new ProjectWorkRevisionErrorV01(
      "work_revision_write_failed",
      409,
    );
  }
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

function parseRequestV01(value: unknown): RevisePreExecutionProjectWorkRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse("work_revision_request_invalid", 400);
  }
  const request = value as Record<string, unknown>;
  if (
    canonicalizeProtocolValueV01(Object.keys(request).sort()) !==
      canonicalizeProtocolValueV01([...REQUEST_KEYS].sort()) ||
    request.action !== "revise_pre_execution_project_work" ||
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
    ].includes(String(request.expected_current_lineage_kind))
  ) {
    refuse("work_revision_request_invalid", 400);
  }
  return request as unknown as RevisePreExecutionProjectWorkRequestV01;
}

function packetLineageKindV01(
  packet: TaskContextPacketV01,
): RevisePreExecutionProjectWorkRequestV01["expected_current_lineage_kind"] | null {
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
  admission: ReturnType<
    typeof admitVNextLocalOperatorMutationInsideTransactionV01
  >,
): RevisePreExecutionProjectWorkResultV01 {
  return {
    status,
    packet,
    definition,
    revision_eligibility: eligibility,
    session_admission: {
      cookie_value: admission.cookie_value,
      cookie_expires_at: admission.cookie_expires_at,
      cookie_max_age_seconds: admission.cookie_max_age_seconds,
    },
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
