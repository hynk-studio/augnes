import { isHistoricalProjectSelectionRevision, type ProjectSelectionRevision } from "@/lib/vnext/project-selection";
import { readWorkHandoff, receivedHandoffEntries, type WorkHandoff } from "../work-handoff";
import { InitialProjectWorkContextErrorV01, normalizeInitialProjectWorkDefinitionV01 } from "@/lib/intake/work-definition";
export { InitialProjectWorkContextErrorV01, normalizeInitialProjectWorkDefinitionV01 } from "@/lib/intake/work-definition";
import type Database from "better-sqlite3";
import { PROSPECTIVE_PREPARATION_PACKET } from "../prospective-agenda";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { readVNextLocalOperatorSessionHistoryV01 } from "@/lib/vnext/runtime/local-operator-session";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  INITIAL_PROJECT_WORK_LIMITS_V01,
  type ProjectWorkDefinitionV01,
} from "@/types/vnext/project-work-initialization";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { inspectProjectManagedRunHistoryV01 } from "@/lib/vnext/runtime/project-managed-run-history";
import { PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01, PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01 } from "@/types/vnext/project-work-revision";
import { SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01 } from "@/types/vnext/operational-context-selection";

export const INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01 =
  "augnes.vnext.initial-work-context-compiler.v0.1" as const;
export const INITIAL_PROJECT_WORK_REQUEST_NAMESPACE_V01 =
  "augnes.vnext.initial-work-request.v0.1" as const;

// The accepted definition domain is capped at 12,000 canonical UTF-8 bytes.
// Canonical JSON escaping and the three additional goal projections are
// included conservatively so every accepted definition can compile.
const INITIAL_PROJECT_WORK_PACKET_FIXED_CHARACTERS_V01 = 16_000;
const INITIAL_PROJECT_WORK_PACKET_DERIVED_CHARACTERS_V01 =
  INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes * 2 +
  INITIAL_PROJECT_WORK_LIMITS_V01.goal_characters * 2 * 3;
export const INITIAL_PROJECT_WORK_PACKET_CONTEXT_BUDGET_V01 = {
  max_selected_entries: 3,
  max_projection_items: 1,
  max_characters:
    INITIAL_PROJECT_WORK_PACKET_FIXED_CHARACTERS_V01 +
    INITIAL_PROJECT_WORK_PACKET_DERIVED_CHARACTERS_V01,
  max_estimated_tokens: Math.ceil(
    (INITIAL_PROJECT_WORK_PACKET_FIXED_CHARACTERS_V01 +
      INITIAL_PROJECT_WORK_PACKET_DERIVED_CHARACTERS_V01) /
      4,
  ),
} as const;

const REQUEST_ID_PATTERN = /^first-work-request:(\d+|selection:[a-f0-9]{32}):([a-f0-9]{24})$/u;
const DEFINITION_ID_PATTERN = /^first-work-definition:[a-f0-9]{24}$/u;

export interface InitialProjectWorkLineageMaterialV01 {
  definition_ref: ExternalRefV01;
  request_ref: ExternalRefV01;
  operator_action_ref: ExternalRefV01;
  request_fingerprint: string;
  idempotency_key: string;
}

export interface InitialProjectWorkPacketLineageV01 {
  lineage_kind: "initial_user_defined";
  packet: TaskContextPacketV01;
  projection_current: boolean;
  definition_ref: ExternalRefV01;
  request_ref: ExternalRefV01;
  operator_action_ref: ExternalRefV01;
}

export function createInitialProjectWorkLineageMaterialV01(input: {
  workspace_id: string;
  project_id: string;
  operator_id: string;
  session_id: string;
  expected_active_selection_revision: ProjectSelectionRevision;
  definition: ProjectWorkDefinitionV01;
  handoff?: WorkHandoff;
  observed_at: string;
}): InitialProjectWorkLineageMaterialV01 {
  const definitionFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      compiler: INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      definition: input.definition,
      ...(input.handoff ? { handoff_fingerprint: input.handoff.fingerprint } : {}),
    }),
  );
  const logicalDigest = definitionFingerprint.slice("sha256:".length);
  const definitionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "first_work_definition",
    external_id: `first-work-definition:${logicalDigest.slice(0, 24)}`,
    trust_class: "user_declaration",
    observed_at: input.observed_at,
    source_ref: definitionFingerprint,
    compatibility_namespace:
      INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
  };
  const requestIdentity = `first-work-request:${input.expected_active_selection_revision}:${logicalDigest.slice(0, 24)}`;
  const requestFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "define_initial_project_work",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_active_project_id: input.project_id,
      expected_active_selection_revision:
        input.expected_active_selection_revision,
      expected_initialization_state: "not_defined",
      definition: input.definition,
      ...(input.handoff ? { handoff_fingerprint: input.handoff.fingerprint } : {}),
    }),
  );
  const requestRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "first_work_request",
    external_id: requestIdentity,
    trust_class: "user_declaration",
    observed_at: input.observed_at,
    source_ref: requestFingerprint,
    compatibility_namespace: INITIAL_PROJECT_WORK_REQUEST_NAMESPACE_V01,
  };
  const authenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "define_initial_project_work",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      operator_id: input.operator_id,
      session_id: input.session_id,
      definition_ref: definitionRef,
      request_fingerprint: requestFingerprint,
      observed_at: input.observed_at,
    }),
  );
  const operatorActionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_session_action",
    external_id: input.session_id,
    trust_class: "direct_local_observation",
    observed_at: input.observed_at,
    source_ref: authenticationFingerprint,
    compatibility_namespace: "augnes.vnext.local-operator-session.v0.1",
  };
  return {
    definition_ref: definitionRef,
    request_ref: requestRef,
    operator_action_ref: operatorActionRef,
    request_fingerprint: requestFingerprint,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        definition_identity: definitionRef.external_id,
      }),
    ),
  };
}

export function buildInitialProjectWorkTaskContextPacketV01(input: {
  workspace_id: string;
  project_id: string;
  operator_id: string;
  session_id: string;
  expected_active_selection_revision: ProjectSelectionRevision;
  definition: ProjectWorkDefinitionV01;
  handoff?: WorkHandoff;
  generated_at: string;
}): {
  packet: TaskContextPacketV01;
  lineage: InitialProjectWorkLineageMaterialV01;
} {
  const definition = normalizeInitialProjectWorkDefinitionV01(input.definition);
  const lineage = createInitialProjectWorkLineageMaterialV01({
    ...input,
    definition,
    observed_at: input.generated_at,
  });
  const currentness = {
    status: "fresh" as const,
    as_of: input.generated_at,
    basis: "Bound to the exact authenticated first-work declaration.",
    source_ref: lineage.definition_ref,
  };
  const packet = buildInitialProjectWorkPacketWithinBudgetV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_ref: lineage.definition_ref,
    generated_at: input.generated_at,
    expires_at: null,
    task: definition,
    current_projection: {
      projection_kind: "current_working_perspective",
      projection_only: true,
      canonical_state: false,
      perspective_ref: null,
      bounded_summary: definition.goal,
      as_of: input.generated_at,
      items: [
        {
          item_kind: "active_goal",
          summary: definition.goal,
          source_refs: [lineage.definition_ref.source_ref!],
          external_refs: [lineage.definition_ref],
          currentness,
        },
      ],
      source_refs: [lineage.definition_ref.source_ref!],
      external_refs: [lineage.definition_ref],
      currentness,
      warnings: [
        "This working projection comes from the user's first-work declaration and is not canonical project state.",
      ],
    },
    selected_context: [
      ...(input.handoff ? receivedHandoffEntries(input, input.handoff, input.generated_at) : []),
      {
        entry_id: `initial-definition:${lineage.definition_ref.external_id}`,
        entry_kind: "source_ref",
        source_ref: lineage.definition_ref.source_ref ?? null,
        external_ref: lineage.definition_ref,
        why_included:
          "Carries the exact bounded first-work definition supplied by the user.",
        currentness,
        trust_class: "user_declaration",
        compatibility_source_ref: lineage.request_ref,
        bounded_summary: definition.goal,
      },
      {
        entry_id: `initial-operator-action:${lineage.operator_action_ref.external_id}`,
        entry_kind: "action_ref",
        source_ref: lineage.operator_action_ref.source_ref ?? null,
        external_ref: lineage.operator_action_ref,
        why_included:
          "Binds the declaration to the admitted local operator action without granting execution authority.",
        currentness: {
          ...currentness,
          source_ref: lineage.operator_action_ref,
        },
        trust_class: "direct_local_observation",
        compatibility_source_ref: lineage.request_ref,
        bounded_summary: null,
      },
    ],
    excluded_context: [],
    tensions: [],
    risks: [],
    gaps:
      definition.non_goals.length === 0
        ? [
            {
              code: "missing_non_goals",
              summary: "No out-of-scope items were declared.",
              severity: "low",
              missing_fields: ["task.non_goals"],
              source_refs: [lineage.definition_ref.source_ref!],
              external_refs: [lineage.definition_ref],
            },
          ]
        : [],
    constraints: {
      required_checks: [],
      forbidden_actions: [],
      data_classification: "private",
      context_budget: { ...INITIAL_PROJECT_WORK_PACKET_CONTEXT_BUDGET_V01, ...(input.handoff ? { max_selected_entries: 12 } : {}) },
    },
    capability_grant: null,
    return_contract: {
      return_kind: "bounded_result",
      required_fields: ["status", "summary"],
      expected_artifacts: [],
      required_checks: [],
      return_ref: null,
      compatibility_only: false,
    },
    source_status: {
      status: "complete",
      currentness,
      source_refs: [
        lineage.definition_ref.source_ref!,
        lineage.request_ref.source_ref!,
        lineage.operator_action_ref.source_ref!,
      ],
      external_refs: [
        lineage.definition_ref,
        lineage.request_ref,
        lineage.operator_action_ref,
      ],
      warnings: [],
    },
    compatibility: {
      source_contracts: [INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01],
      legacy_scope_ref: null,
      source_refs: [
        lineage.definition_ref,
        lineage.request_ref,
        lineage.operator_action_ref,
      ],
      unmapped_fields: [],
      warnings: [
        "Initial user-defined work has no prior packet and no StateTransitionReceipt.",
      ],
    },
    authority_notes: [
      "Saving first work defines bounded context but does not start execution.",
      "This initial packet is not accepted semantic state, approval, ReviewDecision, or Transition.",
    ],
  });
  return { packet, lineage };
}

function buildInitialProjectWorkPacketWithinBudgetV01(
  input: Parameters<typeof buildTaskContextPacketV01>[0],
): TaskContextPacketV01 {
  try {
    return buildTaskContextPacketV01(input, { required_selected_entry_ids: input.selected_context.map(e => e.entry_id) });
  } catch (error) {
    if (error instanceof RangeError) {
      refuse("first_work_packet_budget_exceeded");
    }
    throw error;
  }
}

export function initialProjectWorkIdempotencyKeyV01(
  packet: TaskContextPacketV01,
): string | null {
  if (
    !packet.compatibility.source_contracts.includes(
      INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
    ) ||
    packet.compatibility.source_contracts.includes(
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    ) ||
    packet.compatibility.source_contracts.some(contract => (contract === PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01 || contract === PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01)) ||
    packet.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    )
  ) {
    return null;
  }
  const definition = packet.compatibility.source_refs.find(
    (ref) => ref.ref_type === "first_work_definition",
  );
  return definition
    ? createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          purpose: INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
          workspace_id: packet.workspace_id,
          project_id: packet.project_id,
          definition_identity: definition.external_id,
        }),
      )
    : null;
}

export function inspectInitialProjectWorkPacketLineageV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    packet: TaskContextPacketV01;
  },
): InitialProjectWorkPacketLineageV01 {
  const packet = input.packet;
  if (
    packet.workspace_id !== input.workspace_id ||
    packet.project_id !== input.project_id ||
    !packet.compatibility.source_contracts.includes(
      INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
    ) ||
    packet.compatibility.source_contracts.includes(
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    ) ||
    packet.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    )
  ) {
    refuse("initial_project_work_lineage_kind_invalid");
  }
  const initialRows = db
    .prepare(
      `SELECT record_id, payload_json
         FROM vnext_core_records
        WHERE workspace_id = ? AND project_id = ?
          AND record_kind = 'task_context_packet'
        ORDER BY created_at, record_id`,
    )
    .all(input.workspace_id, input.project_id) as Array<{
    record_id: string;
    payload_json: string;
  }>;
  const initialCount = initialRows.filter((row) => {
    try {
      const value = JSON.parse(row.payload_json) as TaskContextPacketV01;
      return (
        value.compatibility?.source_contracts?.includes(
          INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
        ) &&
        !value.compatibility?.source_contracts?.includes(
          VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
        ) &&
        !value.compatibility?.source_contracts?.some(contract => contract === PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01 || contract === PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01) &&
        !value.compatibility?.source_contracts?.includes(
          SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
        )
      );
    } catch {
      refuse("initial_project_work_source_unavailable", 409);
    }
  }).length;
  if (initialCount !== 1) {
    refuse("initial_project_work_genesis_count_invalid", 409);
  }
  const definitionRef = exactRefV01(packet, "first_work_definition");
  const requestRef = exactRefV01(packet, "first_work_request");
  const operatorActionRef = exactRefV01(
    packet,
    "local_operator_session_action",
  );
  if (
    !DEFINITION_ID_PATTERN.test(definitionRef.external_id) ||
    definitionRef.trust_class !== "user_declaration" ||
    definitionRef.compatibility_namespace !==
      INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01 ||
    requestRef.trust_class !== "user_declaration" ||
    requestRef.compatibility_namespace !==
      INITIAL_PROJECT_WORK_REQUEST_NAMESPACE_V01 ||
    operatorActionRef.trust_class !== "direct_local_observation" ||
    operatorActionRef.compatibility_namespace !==
      "augnes.vnext.local-operator-session.v0.1" ||
    definitionRef.observed_at !== packet.generated_at ||
    requestRef.observed_at !== packet.generated_at ||
    operatorActionRef.observed_at !== packet.generated_at
  ) {
    refuse("initial_project_work_provenance_invalid");
  }
  const requestMatch = REQUEST_ID_PATTERN.exec(requestRef.external_id);
  const revision = requestMatch?.[1]?.startsWith("selection:") ? requestMatch[1] : Number(requestMatch?.[1]);
  if (!isHistoricalProjectSelectionRevision(revision)) {
    refuse("initial_project_work_request_ref_invalid");
  }
  const session = readVNextLocalOperatorSessionHistoryV01(db, {
    session_id: operatorActionRef.external_id,
  });
  if (
    !session ||
    session.workspace_id !== input.workspace_id ||
    session.project_id !== input.project_id ||
    !session.bootstrap_consumed_at
  ) {
    refuse("initial_project_work_operator_provenance_invalid", 409);
  }
  const actionAt = parseStrictIsoTimestampV01(packet.generated_at);
  const issuedAt = parseStrictIsoTimestampV01(session.issued_at);
  const consumedAt = parseStrictIsoTimestampV01(session.bootstrap_consumed_at);
  const expiresAt = parseStrictIsoTimestampV01(session.expires_at);
  const revokedAt = session.revoked_at
    ? parseStrictIsoTimestampV01(session.revoked_at)
    : null;
  if (
    actionAt === null ||
    issuedAt === null ||
    consumedAt === null ||
    expiresAt === null ||
    actionAt < issuedAt ||
    actionAt < consumedAt ||
    actionAt > expiresAt ||
    (revokedAt !== null && revokedAt < actionAt)
  ) {
    refuse("initial_project_work_operator_time_invalid", 409);
  }
  const expected = buildInitialProjectWorkTaskContextPacketV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    operator_id: session.operator_id,
    session_id: session.session_id,
    expected_active_selection_revision: revision,
    definition: packet.task,
    ...(readWorkHandoff(packet) ? { handoff: readWorkHandoff(packet)! } : {}),
    generated_at: packet.generated_at,
  });
  if (
    canonicalizeProtocolValueV01(expected.packet) !==
      canonicalizeProtocolValueV01(packet) ||
    canonicalizeProtocolValueV01(expected.lineage.definition_ref) !==
      canonicalizeProtocolValueV01(definitionRef) ||
    canonicalizeProtocolValueV01(expected.lineage.request_ref) !==
      canonicalizeProtocolValueV01(requestRef) ||
    canonicalizeProtocolValueV01(expected.lineage.operator_action_ref) !==
      canonicalizeProtocolValueV01(operatorActionRef)
  ) {
    refuse("initial_project_work_packet_binding_invalid");
  }
  const priorCore = db
    .prepare(
      `SELECT COUNT(*) AS count FROM vnext_core_records
        WHERE workspace_id = ? AND project_id = ?
          AND record_id <> ? AND created_at <= ?`,
    )
    .get(
      input.workspace_id,
      input.project_id,
      packet.packet_id,
      packet.generated_at,
    ) as { count: number };
  const priorRuns = inspectProjectManagedRunHistoryV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    created_at_lte: packet.generated_at,
  });
  if (priorRuns.status === "unavailable") {
    refuse("initial_project_work_run_history_unavailable", 409);
  }
  if (priorCore.count !== 0 || priorRuns.status === "present") {
    refuse("initial_project_work_prior_history_invalid", 409);
  }
  const semanticState = countRowsV01(
    db,
    "vnext_semantic_state_entries",
    input,
  );
  const targetHeads = countRowsV01(
    db,
    "vnext_semantic_target_heads",
    input,
  );
  const laterTransitionPacket = initialRows.some((row) => {
    if (row.record_id === packet.packet_id) return false;
    const value = JSON.parse(row.payload_json) as TaskContextPacketV01;
    return !value.compatibility?.source_contracts?.includes(PROSPECTIVE_PREPARATION_PACKET) && value.compatibility?.source_contracts?.includes(
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    );
  });
  const laterRevisionPacket = initialRows.some((row) => {
    if (row.record_id === packet.packet_id) return false;
    const value = JSON.parse(row.payload_json) as TaskContextPacketV01;
    return (
      value.compatibility?.source_contracts?.some(contract => contract === PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01 || contract === PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01) &&
      !value.compatibility?.source_contracts?.includes(
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
      )
    );
  });
  return {
    lineage_kind: "initial_user_defined",
    packet,
    projection_current:
      semanticState === 0 &&
      targetHeads === 0 &&
      !laterTransitionPacket &&
      !laterRevisionPacket,
    definition_ref: definitionRef,
    request_ref: requestRef,
    operator_action_ref: operatorActionRef,
  };
}

function exactRefV01(
  packet: TaskContextPacketV01,
  refType: string,
): ExternalRefV01 {
  const refs = packet.compatibility.source_refs.filter(
    (ref) => ref.ref_type === refType,
  );
  if (refs.length !== 1) refuse("initial_project_work_lineage_ref_invalid");
  return refs[0]!;
}

function countRowsV01(
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

function refuse(code: string, status = 422): never {
  throw new InitialProjectWorkContextErrorV01(code, status);
}
