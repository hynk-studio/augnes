import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
  inspectInitialProjectWorkPacketLineageV01,
  normalizeInitialProjectWorkDefinitionV01,
} from "@/lib/vnext/runtime/initial-project-work-context";
import { readVNextLocalOperatorSessionHistoryV01 } from "@/lib/vnext/runtime/local-operator-session";
import { inspectProjectManagedRunHistoryV01 } from "@/lib/vnext/runtime/project-managed-run-history";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  buildTaskContextPacketV01,
  validateTaskContextPacketV01,
} from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { ProjectWorkDefinitionV01 } from "@/types/vnext/project-work-initialization";
import {
  MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01,
  PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
  type PreExecutionProjectWorkLineageKindV01,
  type RevisePreExecutionProjectWorkRequestV01,
} from "@/types/vnext/project-work-revision";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const PRE_EXECUTION_PROJECT_WORK_REVISION_REQUEST_NAMESPACE_V01 =
  "augnes.vnext.pre-execution-work-revision-request.v0.1" as const;

const REVISION_DEFINITION_ID =
  /^work-definition-revision:(\d+):([a-f0-9]{24})$/u;
const REVISION_REQUEST_ID = /^work-revision-request:(\d+):([a-f0-9]{24})$/u;
const MAX_PACKET_ROWS = 256;
const REVISION_PACKET_CONTEXT_BUDGET_V01 = Object.freeze({
  max_selected_entries: 4,
  max_projection_items: 1,
  max_characters: 76_000,
  max_estimated_tokens: 19_000,
});

export class PreExecutionProjectWorkRevisionErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 422) {
    super(code);
    this.name = "PreExecutionProjectWorkRevisionErrorV01";
  }
}

export interface PreExecutionProjectWorkRevisionMaterialV01 {
  revision_definition_ref: ExternalRefV01;
  revision_request_ref: ExternalRefV01;
  operator_action_ref: ExternalRefV01;
  immediate_prior_packet_ref: ExternalRefV01;
  origin_first_work_definition_ref: ExternalRefV01;
  request_fingerprint: string;
  idempotency_key: string;
}

export interface PreExecutionProjectWorkRevisionLineageV01 {
  lineage_kind: "pre_execution_user_revision";
  packet: TaskContextPacketV01;
  prior_packet: TaskContextPacketV01;
  revision_number: number;
  projection_current: boolean;
  revision_definition_ref: ExternalRefV01;
  revision_request_ref: ExternalRefV01;
  operator_action_ref: ExternalRefV01;
  immediate_prior_packet_ref: ExternalRefV01;
  origin_first_work_definition_ref: ExternalRefV01;
}

export interface PreExecutionProjectWorkChainInspectionV01 {
  genesis_packet: TaskContextPacketV01;
  tip_packet: TaskContextPacketV01;
  tip_lineage_kind: PreExecutionProjectWorkLineageKindV01;
  tip_revision: PreExecutionProjectWorkRevisionLineageV01 | null;
  revision_count: number;
  projection_current: boolean;
  origin_first_work_definition_ref: ExternalRefV01;
  packet_ids: string[];
}

export function createPreExecutionProjectWorkRevisionMaterialV01(input: {
  request: RevisePreExecutionProjectWorkRequestV01;
  operator_id: string;
  session_id: string;
  revision_number: number;
  definition: ProjectWorkDefinitionV01;
  prior_packet: TaskContextPacketV01;
  origin_first_work_definition_ref: ExternalRefV01;
  observed_at: string;
}): PreExecutionProjectWorkRevisionMaterialV01 {
  const definition = normalizeInitialProjectWorkDefinitionV01(input.definition);
  const definitionFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      compiler: PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
      workspace_id: input.request.workspace_id,
      project_id: input.request.project_id,
      prior_packet_id: input.prior_packet.packet_id,
      prior_packet_fingerprint: input.prior_packet.integrity.fingerprint,
      definition,
    }),
  );
  const logicalDigest = definitionFingerprint.slice("sha256:".length);
  const revisionDefinitionRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "work_definition_revision",
    external_id: `work-definition-revision:${input.revision_number}:${logicalDigest.slice(0, 24)}`,
    trust_class: "user_declaration",
    observed_at: input.observed_at,
    source_ref: definitionFingerprint,
    compatibility_namespace:
      PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
  };
  const requestFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "revise_pre_execution_project_work",
      workspace_id: input.request.workspace_id,
      project_id: input.request.project_id,
      expected_active_project_id: input.request.expected_active_project_id,
      expected_active_selection_revision:
        input.request.expected_active_selection_revision,
      expected_current_packet_id: input.request.expected_current_packet_id,
      expected_current_packet_fingerprint:
        input.request.expected_current_packet_fingerprint,
      expected_current_lineage_kind:
        input.request.expected_current_lineage_kind,
      definition,
    }),
  );
  const revisionRequestRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "work_revision_request",
    external_id: `work-revision-request:${input.request.expected_active_selection_revision}:${logicalDigest.slice(0, 24)}`,
    trust_class: "user_declaration",
    observed_at: input.observed_at,
    source_ref: requestFingerprint,
    compatibility_namespace:
      PRE_EXECUTION_PROJECT_WORK_REVISION_REQUEST_NAMESPACE_V01,
  };
  const priorPacketRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: input.prior_packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: input.prior_packet.generated_at,
    source_ref: input.prior_packet.integrity.fingerprint,
    compatibility_namespace:
      PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
  };
  const authenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "revise_pre_execution_project_work",
      workspace_id: input.request.workspace_id,
      project_id: input.request.project_id,
      operator_id: input.operator_id,
      session_id: input.session_id,
      revision_definition_ref: revisionDefinitionRef,
      revision_request_fingerprint: requestFingerprint,
      immediate_prior_packet_ref: priorPacketRef,
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
    revision_definition_ref: revisionDefinitionRef,
    revision_request_ref: revisionRequestRef,
    operator_action_ref: operatorActionRef,
    immediate_prior_packet_ref: priorPacketRef,
    origin_first_work_definition_ref:
      structuredClone(input.origin_first_work_definition_ref),
    request_fingerprint: requestFingerprint,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
        workspace_id: input.request.workspace_id,
        project_id: input.request.project_id,
        prior_packet_id: input.prior_packet.packet_id,
        prior_packet_fingerprint: input.prior_packet.integrity.fingerprint,
        definition,
      }),
    ),
  };
}

export function buildPreExecutionProjectWorkRevisionPacketV01(input: {
  request: RevisePreExecutionProjectWorkRequestV01;
  operator_id: string;
  session_id: string;
  revision_number: number;
  definition: ProjectWorkDefinitionV01;
  prior_packet: TaskContextPacketV01;
  origin_first_work_definition_ref: ExternalRefV01;
  generated_at: string;
}): {
  packet: TaskContextPacketV01;
  lineage: PreExecutionProjectWorkRevisionMaterialV01;
} {
  const definition = normalizeInitialProjectWorkDefinitionV01(input.definition);
  const lineage = createPreExecutionProjectWorkRevisionMaterialV01({
    ...input,
    definition,
    observed_at: input.generated_at,
  });
  const currentness = {
    status: "fresh" as const,
    as_of: input.generated_at,
    basis: "Bound to the exact authenticated pre-execution work revision.",
    source_ref: lineage.revision_definition_ref,
  };
  let packet: TaskContextPacketV01;
  try {
    packet = buildTaskContextPacketV01({
      workspace_id: input.request.workspace_id,
      project_id: input.request.project_id,
      work_ref: lineage.revision_definition_ref,
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
            source_refs: [lineage.revision_definition_ref.source_ref!],
            external_refs: [lineage.revision_definition_ref],
            currentness,
          },
        ],
        source_refs: [lineage.revision_definition_ref.source_ref!],
        external_refs: [lineage.revision_definition_ref],
        currentness,
        warnings: [
          "This working projection comes from the user's latest pre-execution revision and is not canonical project state.",
        ],
      },
      selected_context: [
        {
          entry_id: `work-revision-definition:${lineage.revision_definition_ref.external_id}`,
          entry_kind: "source_ref",
          source_ref: lineage.revision_definition_ref.source_ref!,
          external_ref: lineage.revision_definition_ref,
          why_included: "Carries the exact revised work definition supplied by the user.",
          currentness,
          trust_class: "user_declaration",
          compatibility_source_ref: lineage.revision_request_ref,
          bounded_summary: definition.goal,
        },
        {
          entry_id: `work-revision-request:${lineage.revision_request_ref.external_id}`,
          entry_kind: "source_ref",
          source_ref: lineage.revision_request_ref.source_ref!,
          external_ref: lineage.revision_request_ref,
          why_included: "Binds the revised declaration to the exact compare-and-set request.",
          currentness: { ...currentness, source_ref: lineage.revision_request_ref },
          trust_class: "user_declaration",
          compatibility_source_ref: lineage.revision_definition_ref,
          bounded_summary: null,
        },
        {
          entry_id: `work-revision-prior:${input.prior_packet.packet_id}`,
          entry_kind: "source_ref",
          source_ref: input.prior_packet.integrity.fingerprint,
          external_ref: lineage.immediate_prior_packet_ref,
          why_included: "Preserves the exact immutable packet immediately preceding this revision.",
          currentness: { ...currentness, source_ref: lineage.immediate_prior_packet_ref },
          trust_class: "direct_local_observation",
          compatibility_source_ref: lineage.revision_request_ref,
          bounded_summary: null,
        },
        {
          entry_id: `work-revision-operator:${lineage.operator_action_ref.external_id}`,
          entry_kind: "action_ref",
          source_ref: lineage.operator_action_ref.source_ref!,
          external_ref: lineage.operator_action_ref,
          why_included: "Binds the revision to the admitted local operator action without granting execution authority.",
          currentness: { ...currentness, source_ref: lineage.operator_action_ref },
          trust_class: "direct_local_observation",
          compatibility_source_ref: lineage.revision_request_ref,
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
                source_refs: [lineage.revision_definition_ref.source_ref!],
                external_refs: [lineage.revision_definition_ref],
              },
            ]
          : [],
      constraints: {
        required_checks: [],
        forbidden_actions: [],
        data_classification: "private",
        context_budget: REVISION_PACKET_CONTEXT_BUDGET_V01,
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
          lineage.revision_definition_ref.source_ref!,
          lineage.revision_request_ref.source_ref!,
          lineage.operator_action_ref.source_ref!,
          input.prior_packet.integrity.fingerprint,
          lineage.origin_first_work_definition_ref.source_ref!,
        ],
        external_refs: [
          lineage.revision_definition_ref,
          lineage.revision_request_ref,
          lineage.operator_action_ref,
          lineage.immediate_prior_packet_ref,
          lineage.origin_first_work_definition_ref,
        ],
        warnings: [],
      },
      compatibility: {
        source_contracts: [
          PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
        ],
        legacy_scope_ref: null,
        source_refs: [
          lineage.revision_definition_ref,
          lineage.revision_request_ref,
          lineage.operator_action_ref,
          lineage.immediate_prior_packet_ref,
          lineage.origin_first_work_definition_ref,
        ],
        unmapped_fields: [],
        warnings: [
          "This append-only packet revises unstarted user-defined work and is not a semantic Transition.",
        ],
      },
      authority_notes: [
        "Saving this revision changes bounded working context but does not start execution.",
        "This revision is not accepted semantic state, a proposal, approval, ReviewDecision, or Transition.",
      ],
    });
  } catch (error) {
    if (error instanceof RangeError) refuse("work_revision_packet_budget_exceeded");
    throw error;
  }
  return { packet, lineage };
}

export function preExecutionProjectWorkRevisionIdempotencyKeyV01(
  packet: TaskContextPacketV01,
): string | null {
  if (!isStandaloneRevisionPacketV01(packet)) return null;
  const prior = exactRef(packet, "task_context_packet");
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      purpose: PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      prior_packet_id: prior.external_id,
      prior_packet_fingerprint: prior.source_ref,
      definition: normalizeInitialProjectWorkDefinitionV01(packet.task),
    }),
  );
}

export function inspectPreExecutionProjectWorkRevisionChainV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): PreExecutionProjectWorkChainInspectionV01 {
  const records = loadPacketRecords(db, input);
  const initialRecords = records.filter(
    (record) =>
      hasContract(record.packet, INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01) &&
      !hasContract(
        record.packet,
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
      ),
  );
  if (initialRecords.length !== 1) refuse("work_revision_genesis_count_invalid", 409);
  const genesis = initialRecords[0]!.packet;
  const genesisLineage = inspectInitialProjectWorkPacketLineageV01(db, {
    ...input,
    packet: genesis,
  });
  const revisionRecords = records.filter((record) =>
    isStandaloneRevisionPacketV01(record.packet),
  );
  if (revisionRecords.length > MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01) {
    refuse("work_revision_limit_reached", 409);
  }
  const recordsById = new Map(
    records.map((record) => [record.packet.packet_id, record] as const),
  );
  const revisions = revisionRecords.map((record) =>
    inspectRevisionPacketV01(
      db,
      input,
      record,
      genesisLineage.definition_ref,
      recordsById,
    ),
  );
  const byPrior = new Map<string, PreExecutionProjectWorkRevisionLineageV01[]>();
  for (const revision of revisions) {
    const key = packetKey(
      revision.prior_packet.packet_id,
      revision.prior_packet.integrity.fingerprint,
    );
    const values = byPrior.get(key) ?? [];
    values.push(revision);
    byPrior.set(key, values);
  }
  if ([...byPrior.values()].some((values) => values.length !== 1)) {
    refuse("work_revision_branch_invalid", 409);
  }
  const ordered: PreExecutionProjectWorkRevisionLineageV01[] = [];
  const visited = new Set<string>();
  let current = genesis;
  while (true) {
    const successors = byPrior.get(
      packetKey(current.packet_id, current.integrity.fingerprint),
    );
    if (!successors) break;
    const successor = successors[0]!;
    if (visited.has(successor.packet.packet_id)) {
      refuse("work_revision_cycle_invalid", 409);
    }
    visited.add(successor.packet.packet_id);
    const expectedRevision = ordered.length + 1;
    if (
      successor.revision_number !== expectedRevision ||
      parseStrictIsoTimestampV01(successor.packet.generated_at)! <=
        parseStrictIsoTimestampV01(current.generated_at)!
    ) {
      refuse("work_revision_order_invalid", 409);
    }
    ordered.push(successor);
    current = successor.packet;
  }
  if (ordered.length !== revisions.length) {
    refuse("work_revision_chain_incomplete", 409);
  }
  validatePreExecutionHistoryAtEachRevisionV01(db, input, genesis, ordered);
  const semanticSuccessor = records.some((record) =>
    hasContract(
      record.packet,
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    ),
  );
  const semanticState = countRows(db, "vnext_semantic_state_entries", input);
  const semanticHeads = countRows(db, "vnext_semantic_target_heads", input);
  const projectionCurrent =
    !semanticSuccessor && semanticState === 0 && semanticHeads === 0;
  const tipRevision = ordered.at(-1) ?? null;
  return {
    genesis_packet: genesis,
    tip_packet: tipRevision?.packet ?? genesis,
    tip_lineage_kind: tipRevision
      ? "pre_execution_user_revision"
      : "initial_user_defined",
    tip_revision: tipRevision
      ? { ...tipRevision, projection_current: projectionCurrent }
      : null,
    revision_count: ordered.length,
    projection_current: projectionCurrent,
    origin_first_work_definition_ref: genesisLineage.definition_ref,
    packet_ids: [genesis.packet_id, ...ordered.map((entry) => entry.packet.packet_id)],
  };
}

export function inspectPreExecutionProjectWorkRevisionPacketV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    packet: TaskContextPacketV01;
  },
): PreExecutionProjectWorkRevisionLineageV01 {
  const records = loadPacketRecords(db, input);
  const record = records.find(
    (candidate) =>
      candidate.packet.packet_id === input.packet.packet_id &&
      candidate.packet.integrity.fingerprint ===
        input.packet.integrity.fingerprint,
  );
  if (!record || !isStandaloneRevisionPacketV01(record.packet)) {
    refuse("work_revision_packet_missing", 409);
  }
  const initialRecords = records.filter(
    (candidate) =>
      hasContract(
        candidate.packet,
        INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01,
      ) &&
      !hasContract(
        candidate.packet,
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
      ),
  );
  if (initialRecords.length !== 1) {
    refuse("work_revision_genesis_count_invalid", 409);
  }
  const genesisLineage = inspectInitialProjectWorkPacketLineageV01(db, {
    ...input,
    packet: initialRecords[0]!.packet,
  });
  const recordsById = new Map(
    records.map((candidate) => [candidate.packet.packet_id, candidate] as const),
  );
  const inspected = inspectRevisionPacketV01(
    db,
    input,
    record,
    genesisLineage.definition_ref,
    recordsById,
  );
  const chain = inspectPreExecutionProjectWorkRevisionChainV01(db, input);
  const projectionCurrent =
    chain.projection_current &&
    chain.tip_packet.packet_id === inspected.packet.packet_id &&
    chain.tip_packet.integrity.fingerprint ===
      inspected.packet.integrity.fingerprint;
  return { ...inspected, projection_current: projectionCurrent };
}

function inspectRevisionPacketV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  record: PacketRecordV01,
  originDefinitionRef: ExternalRefV01,
  recordsById: ReadonlyMap<string, PacketRecordV01>,
): PreExecutionProjectWorkRevisionLineageV01 {
  const packet = record.packet;
  const definitionRef = exactRef(packet, "work_definition_revision");
  const requestRef = exactRef(packet, "work_revision_request");
  const operatorActionRef = exactRef(packet, "local_operator_session_action");
  const priorRef = exactRef(packet, "task_context_packet");
  const originRef = exactRef(packet, "first_work_definition");
  const definitionMatch = REVISION_DEFINITION_ID.exec(definitionRef.external_id);
  const requestMatch = REVISION_REQUEST_ID.exec(requestRef.external_id);
  const revisionNumber = definitionMatch ? Number(definitionMatch[1]) : NaN;
  const activeRevision = requestMatch ? Number(requestMatch[1]) : NaN;
  if (
    !Number.isSafeInteger(revisionNumber) ||
    revisionNumber < 1 ||
    !Number.isSafeInteger(activeRevision) ||
    activeRevision < 1 ||
    definitionMatch?.[2] !== requestMatch?.[2] ||
    definitionRef.trust_class !== "user_declaration" ||
    definitionRef.compatibility_namespace !==
      PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01 ||
    requestRef.trust_class !== "user_declaration" ||
    requestRef.compatibility_namespace !==
      PRE_EXECUTION_PROJECT_WORK_REVISION_REQUEST_NAMESPACE_V01 ||
    operatorActionRef.trust_class !== "direct_local_observation" ||
    operatorActionRef.compatibility_namespace !==
      "augnes.vnext.local-operator-session.v0.1" ||
    priorRef.trust_class !== "direct_local_observation" ||
    priorRef.compatibility_namespace !==
      PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01 ||
    canonicalizeProtocolValueV01(originRef) !==
      canonicalizeProtocolValueV01(originDefinitionRef) ||
    definitionRef.observed_at !== packet.generated_at ||
    requestRef.observed_at !== packet.generated_at ||
    operatorActionRef.observed_at !== packet.generated_at
  ) {
    refuse("work_revision_provenance_invalid", 409);
  }
  const priorRecord = readValidatedPacketRecordByIdentity(
    recordsById,
    priorRef.external_id,
    priorRef.source_ref!,
  );
  const priorKind = packetLineageKind(priorRecord.packet);
  if (!priorKind) refuse("work_revision_prior_packet_invalid", 409);
  const session = readVNextLocalOperatorSessionHistoryV01(db, {
    session_id: operatorActionRef.external_id,
  });
  if (
    !session ||
    session.workspace_id !== input.workspace_id ||
    session.project_id !== input.project_id ||
    !session.bootstrap_consumed_at
  ) {
    refuse("work_revision_operator_provenance_invalid", 409);
  }
  validateOperatorTimeV01(session, packet.generated_at);
  const request: RevisePreExecutionProjectWorkRequestV01 = {
    action: "revise_pre_execution_project_work",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    expected_active_project_id: input.project_id,
    expected_active_selection_revision: activeRevision,
    expected_current_packet_id: priorRecord.packet.packet_id,
    expected_current_packet_fingerprint:
      priorRecord.packet.integrity.fingerprint,
    expected_current_lineage_kind: priorKind,
    ...normalizeInitialProjectWorkDefinitionV01(packet.task),
  };
  const expected = buildPreExecutionProjectWorkRevisionPacketV01({
    request,
    operator_id: session.operator_id,
    session_id: session.session_id,
    revision_number: revisionNumber,
    definition: packet.task,
    prior_packet: priorRecord.packet,
    origin_first_work_definition_ref: originDefinitionRef,
    generated_at: packet.generated_at,
  });
  if (
    canonicalizeProtocolValueV01(expected.packet) !==
      canonicalizeProtocolValueV01(packet) ||
    record.idempotency_key !== expected.lineage.idempotency_key
  ) {
    refuse("work_revision_packet_binding_invalid", 409);
  }
  return {
    lineage_kind: "pre_execution_user_revision",
    packet,
    prior_packet: priorRecord.packet,
    revision_number: revisionNumber,
    projection_current: false,
    revision_definition_ref: definitionRef,
    revision_request_ref: requestRef,
    operator_action_ref: operatorActionRef,
    immediate_prior_packet_ref: priorRef,
    origin_first_work_definition_ref: originRef,
  };
}

function validatePreExecutionHistoryAtEachRevisionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  genesis: TaskContextPacketV01,
  revisions: PreExecutionProjectWorkRevisionLineageV01[],
): void {
  const allowed = new Set([genesis.packet_id]);
  for (const revision of revisions) {
    allowed.add(revision.packet.packet_id);
    const coreRows = db
      .prepare(
        `SELECT record_kind, record_id FROM vnext_core_records
          WHERE workspace_id = ? AND project_id = ? AND created_at <= ?`,
      )
      .all(input.workspace_id, input.project_id, revision.packet.generated_at) as Array<{
      record_kind: string;
      record_id: string;
    }>;
    if (
      coreRows.some(
        (row) =>
          row.record_kind !== "task_context_packet" || !allowed.has(row.record_id),
      )
    ) {
      refuse("work_revision_history_predates_revision", 409);
    }
    const runHistory = inspectProjectManagedRunHistoryV01(db, {
      ...input,
      created_at_lte: revision.packet.generated_at,
    });
    if (runHistory.status !== "none") {
      refuse("work_revision_run_history_predates_revision", 409);
    }
  }
}

interface PacketRecordV01 extends VNextCoreRecordEnvelopeV01 {
  packet: TaskContextPacketV01;
}

function loadPacketRecords(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): PacketRecordV01[] {
  let rows: Array<{
    record_kind: "task_context_packet";
    record_id: string;
    workspace_id: string;
    project_id: string;
    fingerprint: string;
    idempotency_key: string | null;
    payload_json: string;
    created_at: string;
  }>;
  try {
    rows = db
      .prepare(
        `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
                idempotency_key, payload_json, created_at
           FROM vnext_core_records
          WHERE workspace_id = ? AND project_id = ?
            AND record_kind = 'task_context_packet'
          ORDER BY created_at, record_id LIMIT ?`,
      )
      .all(input.workspace_id, input.project_id, MAX_PACKET_ROWS + 1) as typeof rows;
  } catch {
    refuse("work_revision_source_unavailable", 409);
  }
  if (rows.length > MAX_PACKET_ROWS) refuse("work_revision_packet_bound_exceeded", 409);
  return rows.map((row) => {
    let packet: TaskContextPacketV01;
    try {
      packet = JSON.parse(row.payload_json) as TaskContextPacketV01;
    } catch {
      refuse("work_revision_packet_invalid", 409);
    }
    if (
      validateTaskContextPacketV01(packet, {
        evaluated_at: packet?.generated_at ?? "",
      }).status !== "valid"
    ) {
      refuse("work_revision_packet_invalid", 409);
    }
    const record = { ...row, payload: packet } as VNextCoreRecordEnvelopeV01;
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      fingerprint: packet.integrity.fingerprint,
    });
    if (
      row.record_id !== packet.packet_id ||
      row.created_at !== packet.generated_at ||
      row.fingerprint !== packet.integrity.fingerprint
    ) {
      refuse("work_revision_packet_envelope_invalid", 409);
    }
    return { ...record, packet } as PacketRecordV01;
  });
}

function readValidatedPacketRecordByIdentity(
  recordsById: ReadonlyMap<string, PacketRecordV01>,
  packetId: string,
  fingerprint: string | null,
): PacketRecordV01 {
  const record = recordsById.get(packetId);
  if (!record || record.fingerprint !== fingerprint) {
    refuse("work_revision_prior_packet_missing", 409);
  }
  return record;
}

function exactRef(packet: TaskContextPacketV01, refType: string): ExternalRefV01 {
  const refs = packet.compatibility.source_refs.filter(
    (ref) => ref.ref_type === refType,
  );
  if (refs.length !== 1) refuse("work_revision_lineage_ref_invalid", 409);
  return refs[0]!;
}

function validateOperatorTimeV01(
  session: NonNullable<ReturnType<typeof readVNextLocalOperatorSessionHistoryV01>>,
  generatedAt: string,
): void {
  const action = parseStrictIsoTimestampV01(generatedAt);
  const issued = parseStrictIsoTimestampV01(session.issued_at);
  const consumed = parseStrictIsoTimestampV01(session.bootstrap_consumed_at!);
  const expires = parseStrictIsoTimestampV01(session.expires_at);
  const revoked = session.revoked_at
    ? parseStrictIsoTimestampV01(session.revoked_at)
    : null;
  if (
    action === null ||
    issued === null ||
    consumed === null ||
    expires === null ||
    action < issued ||
    action < consumed ||
    action > expires ||
    (revoked !== null && revoked < action)
  ) {
    refuse("work_revision_operator_time_invalid", 409);
  }
}

function packetLineageKind(
  packet: TaskContextPacketV01,
): PreExecutionProjectWorkLineageKindV01 | null {
  if (isStandaloneRevisionPacketV01(packet)) {
    return "pre_execution_user_revision";
  }
  return hasContract(packet, INITIAL_PROJECT_WORK_CONTEXT_COMPILER_VERSION_V01) &&
    !hasContract(packet, VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01)
    ? "initial_user_defined"
    : null;
}

function isStandaloneRevisionPacketV01(packet: TaskContextPacketV01): boolean {
  return (
    hasContract(
      packet,
      PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01,
    ) &&
    !hasContract(
      packet,
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
    )
  );
}

function hasContract(packet: TaskContextPacketV01, contract: string): boolean {
  return packet.compatibility?.source_contracts?.includes(contract) === true;
}

function countRows(
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

function packetKey(packetId: string, fingerprint: string): string {
  return `${packetId}\u0000${fingerprint}`;
}

function refuse(code: string, status = 422): never {
  throw new PreExecutionProjectWorkRevisionErrorV01(code, status);
}
