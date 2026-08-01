import { accessSync, constants, statSync } from "node:fs";

import type Database from "better-sqlite3";

import {
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  VNextLocalOperatorSessionErrorV01,
  admitVNextLocalOperatorMutationInsideTransactionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  buildInitialProjectWorkTaskContextPacketV01,
  INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
  InitialProjectWorkContextErrorV01,
  inspectInitialProjectWorkPacketLineageV01,
  normalizeInitialProjectWorkDefinitionV01,
} from "@/lib/vnext/runtime/initial-project-work-context";
import {
  VNextOperatorPilotContinuityErrorV01,
  inspectVNextOperatorPilotPacketLineageV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  PROJECT_WORK_INITIALIZATION_VERSION_V01,
  type DefineInitialProjectWorkRequestV01,
  type DefineInitialProjectWorkResultV01,
  type ProjectWorkDefinitionV01,
  type ProjectWorkInitializationV01,
} from "@/types/vnext/project-work-initialization";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { inspectProjectManagedRunHistoryV01 } from "@/lib/vnext/runtime/project-managed-run-history";

const MAX_PROJECT_WORK_RECORDS = 4_096;
const REQUEST_KEYS = [
  "action",
  "workspace_id",
  "project_id",
  "expected_active_project_id",
  "expected_active_selection_revision",
  "expected_initialization_state",
  "goal",
  "success_criteria",
  "non_goals",
] as const;

export class ProjectWorkInitializationErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "ProjectWorkInitializationErrorV01";
  }
}

export interface ProjectWorkInitializationDependenciesV01 {
  root_available?: (root: string) => boolean;
}

export function readProjectWorkInitializationV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
  },
  dependencies: ProjectWorkInitializationDependenciesV01 = {},
): ProjectWorkInitializationV01 {
  try {
    return readProjectWorkInitializationStrictV01(db, input, dependencies);
  } catch {
    return unavailableV01(db, input, "source_unavailable");
  }
}

export function defineInitialProjectWorkV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    request: unknown;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
  dependencies: ProjectWorkInitializationDependenciesV01 = {},
): DefineInitialProjectWorkResultV01 {
  const request = parseRequestV01(input.request);
  const definition = normalizeInitialProjectWorkDefinitionV01(request);
  if (
    request.workspace_id !== input.config.workspace_id ||
    request.project_id !== input.config.project_id ||
    request.expected_active_project_id !== input.config.project_id
  ) {
    refuse("first_work_scope_conflict", 403);
  }
  if (db.inTransaction) refuse("first_work_transaction_conflict", 409);
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
      refuse("first_work_active_selection_conflict", 409);
    }
    const registration = readCanonicalProjectWithRootV01(db, input.config);
    if (!registration) refuse("first_work_project_missing", 404);
    const rootAvailable =
      dependencies.root_available ?? rootAvailableSynchronouslyV01;
    if (!rootAvailable(registration.root_binding.local_root.normalized_path)) {
      refuse("first_work_root_unavailable", 409);
    }
    const initialization = readProjectWorkInitializationStrictV01(
      db,
      input.config,
      { root_available: rootAvailable },
    );
    if (
      initialization.state === "defined_initial_work" &&
      initialization.current_packet &&
      initialization.current_work &&
      sameDefinitionV01(initialization.current_work, definition)
    ) {
      const record = readVNextCoreRecordV01(db, {
        record_kind: "task_context_packet",
        record_id: initialization.current_packet.packet_id,
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
      });
      if (!record) refuse("first_work_packet_missing", 409);
      const packet = record.payload as TaskContextPacketV01;
      db.exec("COMMIT");
      return resultV01("exact_replay", packet, definition, sessionAdmission);
    }
    if (initialization.state === "defined_initial_work") {
      refuse("first_work_already_defined", 409);
    }
    if (initialization.state !== "not_defined") {
      refuse("first_work_state_changed", 409);
    }
    const built = buildInitialProjectWorkTaskContextPacketV01({
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      operator_id: input.config.operator_id,
      session_id: sessionAdmission.session.session_id,
      expected_active_selection_revision:
        request.expected_active_selection_revision,
      definition,
      generated_at: sessionAdmission.action_observed_at,
    });
    if (
      validateTaskContextPacketV01(built.packet, {
        evaluated_at: built.packet.generated_at,
      }).status !== "valid"
    ) {
      refuse("first_work_packet_invalid", 422);
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
    if (write.status !== "inserted") {
      refuse("first_work_insert_conflict", 409);
    }
    const lineage = inspectInitialProjectWorkPacketLineageV01(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      packet: built.packet,
    });
    if (!lineage.projection_current) {
      refuse("first_work_state_changed", 409);
    }
    db.exec("COMMIT");
    return resultV01("inserted", built.packet, definition, sessionAdmission);
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (
      error instanceof ProjectWorkInitializationErrorV01 ||
      error instanceof InitialProjectWorkContextErrorV01 ||
      error instanceof VNextLocalOperatorSessionErrorV01
    ) {
      throw error;
    }
    throw new ProjectWorkInitializationErrorV01(
      "first_work_write_failed",
      409,
    );
  }
}

function readProjectWorkInitializationStrictV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  dependencies: ProjectWorkInitializationDependenciesV01,
): ProjectWorkInitializationV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const registration = readCanonicalProjectWithRootV01(db, input);
  const active = readActiveProjectSelectionV01(db, input.workspace_id);
  if (!registration) return unavailableV01(db, input, "project_unavailable");
  const rootAvailable =
    dependencies.root_available ?? rootAvailableSynchronouslyV01;
  if (!rootAvailable(registration.root_binding.local_root.normalized_path)) {
    return unavailableV01(db, input, "root_unavailable");
  }
  const records = readBoundedProjectWorkRecordsV01(db, input);
  const runHistory = inspectProjectManagedRunHistoryV01(db, input);
  if (runHistory.status === "unavailable") {
    refuse("first_work_run_history_unavailable", 409);
  }
  const stateCount = countScopedRowsV01(
    db,
    "vnext_semantic_state_entries",
    input,
  );
  const headCount = countScopedRowsV01(
    db,
    "vnext_semantic_target_heads",
    input,
  );
  const packetRecords = records.filter(
    (record) => record.record_kind === "task_context_packet",
  );
  const inspected = packetRecords.flatMap((record) => {
    const packet = record.payload as TaskContextPacketV01;
    try {
      const lineage = inspectVNextOperatorPilotPacketLineageV01(db, {
        config: {
          enabled: true,
          workspace_id: input.workspace_id,
          project_id: input.project_id,
          operator_id: "initialization-read",
          database_path: ":bounded-read:",
        },
        packet_id: packet.packet_id,
        packet_fingerprint: packet.integrity.fingerprint,
      });
      return [{
        packet,
        lineage_kind: lineage.lineage_kind,
        projection_current: lineage.projection_current,
      }];
    } catch {
      // A packet whose exact executable lineage cannot be proven is durable
      // history, not evidence that this project has never had work. Keep it
      // out of current selection and fail closed into recovery below.
      return [];
    }
  });
  const current = inspected
    .filter((entry) => entry.projection_current)
    .sort(
      (left, right) =>
        left.packet.generated_at.localeCompare(right.packet.generated_at) ||
        left.packet.packet_id.localeCompare(right.packet.packet_id),
    )
    .at(-1);
  if (
    current &&
    (
      current.lineage_kind === "semantic_transition" ||
      packetRecords.length === 1
    )
  ) {
    return {
      ...baseV01(input, active?.project_id ?? null, active?.selection_revision ?? null),
      state:
        current.lineage_kind === "initial_user_defined"
          ? "defined_initial_work"
          : "defined_transition_work",
      reason:
        current.lineage_kind === "initial_user_defined"
          ? "current_initial_packet"
          : "current_transition_packet",
      current_work: structuredClone(current.packet.task),
      current_packet: {
        packet_id: current.packet.packet_id,
        packet_fingerprint: current.packet.integrity.fingerprint,
        generated_at: current.packet.generated_at,
        lineage_kind: current.lineage_kind,
      },
      mutation_eligible: false,
    };
  }
  if (
    records.length === 0 &&
    runHistory.status === "none" &&
    stateCount === 0 &&
    headCount === 0
  ) {
    return {
      ...baseV01(input, active?.project_id ?? null, active?.selection_revision ?? null),
      state: "not_defined",
      reason: "zero_durable_work_history",
      current_work: null,
      current_packet: null,
      mutation_eligible:
        active?.project_id === input.project_id &&
        active.selection_revision > 0,
    };
  }
  return {
    ...baseV01(input, active?.project_id ?? null, active?.selection_revision ?? null),
    state: "existing_history_without_current_packet",
    reason: "durable_history_without_current_packet",
    current_work: null,
    current_packet: null,
    mutation_eligible: false,
  };
}

function readBoundedProjectWorkRecordsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): VNextCoreRecordEnvelopeV01[] {
  const rows = db
    .prepare(
      `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
              idempotency_key, payload_json, created_at
         FROM vnext_core_records
        WHERE workspace_id = ? AND project_id = ?
        ORDER BY created_at, record_kind, record_id
        LIMIT ?`,
    )
    .all(
      input.workspace_id,
      input.project_id,
      MAX_PROJECT_WORK_RECORDS + 1,
    ) as Array<{
    record_kind: VNextCoreRecordEnvelopeV01["record_kind"];
    record_id: string;
    workspace_id: string;
    project_id: string;
    fingerprint: string;
    idempotency_key: string | null;
    payload_json: string;
    created_at: string;
  }>;
  if (rows.length > MAX_PROJECT_WORK_RECORDS) {
    refuse("first_work_history_bound_exceeded", 422);
  }
  return rows.map((row) => ({
    record_kind: row.record_kind,
    record_id: row.record_id,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    fingerprint: row.fingerprint,
    idempotency_key: row.idempotency_key,
    payload: JSON.parse(row.payload_json) as unknown,
    created_at: row.created_at,
  }));
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

function parseRequestV01(value: unknown): DefineInitialProjectWorkRequestV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse("first_work_request_invalid", 400);
  }
  const request = value as Record<string, unknown>;
  const actual = Object.keys(request).sort();
  const expected = [...REQUEST_KEYS].sort();
  if (
    canonicalizeProtocolValueV01(actual) !==
    canonicalizeProtocolValueV01(expected) ||
    request.action !== "define_initial_project_work" ||
    request.expected_initialization_state !== "not_defined" ||
    typeof request.workspace_id !== "string" ||
    typeof request.project_id !== "string" ||
    typeof request.expected_active_project_id !== "string" ||
    !Number.isSafeInteger(request.expected_active_selection_revision) ||
    Number(request.expected_active_selection_revision) < 1
  ) {
    refuse("first_work_request_invalid", 400);
  }
  return request as unknown as DefineInitialProjectWorkRequestV01;
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

function sameDefinitionV01(
  left: ProjectWorkDefinitionV01,
  right: ProjectWorkDefinitionV01,
): boolean {
  return (
    canonicalizeProtocolValueV01(left) ===
    canonicalizeProtocolValueV01(right)
  );
}

function baseV01(
  input: { workspace_id: string; project_id: string },
  activeProjectId: string | null,
  activeSelectionRevision: number | null,
) {
  return {
    initialization_version: PROJECT_WORK_INITIALIZATION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    active_project_id: activeProjectId,
    active_selection_revision: activeSelectionRevision,
    projection_only: true as const,
    semantic_authority_granted: false as const,
    execution_authority_granted: false as const,
  };
}

function unavailableV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  reason: "project_unavailable" | "root_unavailable" | "source_unavailable",
): ProjectWorkInitializationV01 {
  let activeProjectId: string | null = null;
  let activeSelectionRevision: number | null = null;
  try {
    const active = readActiveProjectSelectionV01(db, input.workspace_id);
    activeProjectId = active?.project_id ?? null;
    activeSelectionRevision = active?.selection_revision ?? null;
  } catch {
    // The unavailable state remains conservative when lifecycle state is unreadable.
  }
  return {
    ...baseV01(input, activeProjectId, activeSelectionRevision),
    state: "unavailable",
    reason,
    current_work: null,
    current_packet: null,
    mutation_eligible: false,
  };
}

function resultV01(
  status: "inserted" | "exact_replay",
  packet: TaskContextPacketV01,
  definition: ProjectWorkDefinitionV01,
  admission: ReturnType<
    typeof admitVNextLocalOperatorMutationInsideTransactionV01
  >,
): DefineInitialProjectWorkResultV01 {
  return {
    status,
    packet,
    definition,
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
  throw new ProjectWorkInitializationErrorV01(code, status);
}

export function isProjectWorkInitializationErrorV01(
  error: unknown,
): error is
  | ProjectWorkInitializationErrorV01
  | InitialProjectWorkContextErrorV01
  | VNextOperatorPilotContinuityErrorV01 {
  return (
    error instanceof ProjectWorkInitializationErrorV01 ||
    error instanceof InitialProjectWorkContextErrorV01 ||
    error instanceof VNextOperatorPilotContinuityErrorV01
  );
}
