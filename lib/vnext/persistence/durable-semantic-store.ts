import type Database from "better-sqlite3";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import { EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01 } from "@/types/vnext/episode-delta-proposal";

export const VNEXT_DURABLE_SEMANTIC_STORE_VERSION_V01 =
  "vnext_durable_semantic_store.v0.1" as const;
export const VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01 =
  "persisted_semantic_state_content.v0.1" as const;
export const VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01 =
  "persisted_semantic_state_version.v0.1" as const;
export const VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01 =
  "augnes.vnext.local-semantic-state.v0.1" as const;

export const VNEXT_CORE_RECORD_KINDS_V01 = [
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "semantic_state",
  "state_transition_receipt",
  "task_context_packet",
  "run_receipt",
] as const;

export type VNextCoreRecordKindV01 =
  (typeof VNEXT_CORE_RECORD_KINDS_V01)[number];

export interface VNextCoreRecordEnvelopeV01 {
  record_kind: VNextCoreRecordKindV01;
  record_id: string;
  workspace_id: string;
  project_id: string;
  fingerprint: string;
  idempotency_key: string | null;
  payload: unknown;
  created_at: string;
}

export interface VNextCoreRecordWriteResultV01 {
  status: "inserted" | "exact_replay";
  record: VNextCoreRecordEnvelopeV01;
}

export interface VNextSemanticTargetIdentityV01 {
  compatibility_namespace: string | null;
  ref_type: string;
  external_id: string;
  provider: string | null;
  host: string | null;
}

export interface VNextSemanticStateContentV01 {
  state_content_version: typeof VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01;
  target_semantic_identity: VNextSemanticTargetIdentityV01;
  delta_type: EpisodeDeltaProposalDeltaCandidateV01["delta_type"];
  proposed_state_summary: string;
}

export interface VNextPersistedSemanticStateVersionV01 {
  semantic_state_version: typeof VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01;
  semantic_state_record_id: string;
  workspace_id: string;
  project_id: string;
  target_key: string;
  target_ref: ExternalRefV01;
  state_ref: ExternalRefV01;
  state_content: VNextSemanticStateContentV01;
  state_content_fingerprint: string;
  bounded_state_summary: string;
  source_proposal_id: string;
  source_proposal_fingerprint: string;
  source_candidate_id: string;
  source_candidate_fingerprint: string;
  source_decision_id: string;
  source_decision_fingerprint: string;
  created_at: string;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "persisted_semantic_state_without_integrity_fingerprint";
    fingerprint: string;
  };
}

export interface VNextPersistedSemanticStateValidationIssueV01 {
  code: string;
  path: string;
  message: string;
}

export interface VNextPersistedSemanticStateValidationResultV01 {
  status: "valid" | "invalid";
  errors: VNextPersistedSemanticStateValidationIssueV01[];
  normalized_state: VNextPersistedSemanticStateVersionV01 | null;
}

export interface VNextProtocolPayloadLedgerBindingV01 {
  workspace_id: string;
  project_id: string;
  fingerprint: string;
}

export class VNextPersistedSemanticStateValidationErrorV01 extends Error {
  readonly code: string;
  readonly path: string;

  constructor(code: string, path: string, message = code) {
    super(message);
    this.name = "VNextPersistedSemanticStateValidationErrorV01";
    this.code = code;
    this.path = path;
  }
}

export interface VNextSemanticStateProjectionEntryV01 {
  workspace_id: string;
  project_id: string;
  presence: "present";
  target_key: string;
  target_ref: ExternalRefV01;
  state_ref: ExternalRefV01;
  state_fingerprint: string;
  bounded_state_summary: string;
  source_proposal_id: string;
  source_proposal_fingerprint: string;
  source_candidate_id: string;
  source_candidate_fingerprint: string;
  source_transition_receipt_id: string;
  source_transition_receipt_fingerprint: string;
  revision: number;
  updated_at: string;
}

export const VNEXT_DURABLE_SEMANTIC_STORE_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_core_records (
    record_kind TEXT NOT NULL CHECK (record_kind IN (
      'episode_delta_proposal',
      'review_decision',
      'semantic_commit_gate',
      'semantic_state',
      'state_transition_receipt',
      'task_context_packet',
      'run_receipt'
    )),
    record_id TEXT NOT NULL CHECK (length(trim(record_id)) > 0),
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    fingerprint TEXT NOT NULL CHECK (
      length(fingerprint) = 71 AND substr(fingerprint, 1, 7) = 'sha256:'
    ),
    idempotency_key TEXT CHECK (
      idempotency_key IS NULL OR
      (length(idempotency_key) = 71 AND substr(idempotency_key, 1, 7) = 'sha256:')
    ),
    payload_json TEXT NOT NULL CHECK (
      json_valid(payload_json) AND json_type(payload_json) = 'object'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (record_kind, record_id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_core_records_project_idempotency
    ON vnext_core_records(workspace_id, project_id, record_kind, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_vnext_core_records_project_kind_created
    ON vnext_core_records(workspace_id, project_id, record_kind, created_at, record_id);

  CREATE TRIGGER IF NOT EXISTS trg_vnext_core_records_immutable_update
    BEFORE UPDATE ON vnext_core_records
    BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_core_records_immutable_delete
    BEFORE DELETE ON vnext_core_records
    BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;

  CREATE TABLE IF NOT EXISTS vnext_semantic_state_entries (
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    presence TEXT NOT NULL CHECK (presence = 'present'),
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    target_ref_json TEXT NOT NULL CHECK (
      json_valid(target_ref_json) AND json_type(target_ref_json) = 'object'
    ),
    state_ref_json TEXT NOT NULL CHECK (
      json_valid(state_ref_json) AND json_type(state_ref_json) = 'object'
    ),
    current_state_fingerprint TEXT NOT NULL CHECK (
      length(current_state_fingerprint) = 71 AND substr(current_state_fingerprint, 1, 7) = 'sha256:'
    ),
    bounded_state_summary TEXT NOT NULL CHECK (
      length(bounded_state_summary) > 0 AND length(bounded_state_summary) <= 2000
    ),
    source_proposal_id TEXT NOT NULL,
    source_proposal_fingerprint TEXT NOT NULL CHECK (
      length(source_proposal_fingerprint) = 71 AND substr(source_proposal_fingerprint, 1, 7) = 'sha256:'
    ),
    source_candidate_id TEXT NOT NULL,
    source_candidate_fingerprint TEXT NOT NULL CHECK (
      length(source_candidate_fingerprint) = 71 AND substr(source_candidate_fingerprint, 1, 7) = 'sha256:'
    ),
    source_transition_receipt_id TEXT NOT NULL,
    source_transition_receipt_fingerprint TEXT NOT NULL CHECK (
      length(source_transition_receipt_fingerprint) = 71 AND substr(source_transition_receipt_fingerprint, 1, 7) = 'sha256:'
    ),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, target_key)
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_semantic_state_entries_project_updated
    ON vnext_semantic_state_entries(workspace_id, project_id, updated_at, target_key);
`;

interface CoreRecordRowV01 {
  record_kind: string;
  record_id: string;
  workspace_id: string;
  project_id: string;
  fingerprint: string;
  idempotency_key: string | null;
  payload_json: string;
  created_at: string;
}

interface ProjectionRowV01 {
  workspace_id: string;
  project_id: string;
  presence: string;
  target_key: string;
  target_ref_json: string;
  state_ref_json: string;
  current_state_fingerprint: string;
  bounded_state_summary: string;
  source_proposal_id: string;
  source_proposal_fingerprint: string;
  source_candidate_id: string;
  source_candidate_fingerprint: string;
  source_transition_receipt_id: string;
  source_transition_receipt_fingerprint: string;
  revision: number;
  updated_at: string;
}

export function ensureVNextDurableSemanticStoreSchemaV01(
  db: Database.Database,
): void {
  db.pragma("foreign_keys = ON");
  db.exec(VNEXT_DURABLE_SEMANTIC_STORE_SCHEMA_SQL_V01);
}

export function insertVNextCoreRecordV01(
  db: Database.Database,
  input: VNextCoreRecordEnvelopeV01,
): VNextCoreRecordWriteResultV01 {
  const record = normalizeCoreRecord(input);
  const existing = selectCoreRecordByIdentity(
    db,
    record.record_kind,
    record.record_id,
  );
  if (existing) return exactReplayOrThrow(existing, record);
  if (record.idempotency_key) {
    const byKey = selectCoreRecordByIdempotency(
      db,
      record.workspace_id,
      record.project_id,
      record.record_kind,
      record.idempotency_key,
    );
    if (byKey) return exactReplayOrThrow(byKey, record);
  }
  db.prepare(
    `INSERT INTO vnext_core_records (
      record_kind, record_id, workspace_id, project_id, fingerprint,
      idempotency_key, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.record_kind,
    record.record_id,
    record.workspace_id,
    record.project_id,
    record.fingerprint,
    record.idempotency_key,
    canonicalizeProtocolValueV01(record.payload),
    record.created_at,
  );
  return { status: "inserted", record };
}

export function readVNextCoreRecordV01(
  db: Database.Database,
  input: Pick<
    VNextCoreRecordEnvelopeV01,
    "record_kind" | "record_id" | "workspace_id" | "project_id"
  >,
): VNextCoreRecordEnvelopeV01 | null {
  const row = db
    .prepare(
      `SELECT * FROM vnext_core_records
       WHERE record_kind = ? AND record_id = ?
         AND workspace_id = ? AND project_id = ?`,
    )
    .get(
      input.record_kind,
      normalizeRequiredText(input.record_id, "record_id"),
      normalizeRequiredText(input.workspace_id, "workspace_id"),
      normalizeRequiredText(input.project_id, "project_id"),
    ) as CoreRecordRowV01 | undefined;
  return row ? parseCoreRecord(row) : null;
}

export function readVNextCoreRecordByIdempotencyKeyV01(
  db: Database.Database,
  input: Pick<
    VNextCoreRecordEnvelopeV01,
    "record_kind" | "workspace_id" | "project_id"
  > & { idempotency_key: string },
): VNextCoreRecordEnvelopeV01 | null {
  return selectCoreRecordByIdempotency(
    db,
    normalizeRequiredText(input.workspace_id, "workspace_id"),
    normalizeRequiredText(input.project_id, "project_id"),
    input.record_kind,
    normalizeSha256(input.idempotency_key, "idempotency_key"),
  );
}

export function countVNextCoreRecordsV01(
  db: Database.Database,
  input?: {
    workspace_id?: string;
    project_id?: string;
    record_kind?: VNextCoreRecordKindV01;
  },
): number {
  const conditions: string[] = [];
  const values: string[] = [];
  if (input?.workspace_id) {
    conditions.push("workspace_id = ?");
    values.push(normalizeRequiredText(input.workspace_id, "workspace_id"));
  }
  if (input?.project_id) {
    conditions.push("project_id = ?");
    values.push(normalizeRequiredText(input.project_id, "project_id"));
  }
  if (input?.record_kind) {
    conditions.push("record_kind = ?");
    values.push(input.record_kind);
  }
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM vnext_core_records${
        conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""
      }`,
    )
    .get(...values) as { count: number };
  return row.count;
}

export function createVNextSemanticTargetIdentityV01(
  ref: ExternalRefV01,
): VNextSemanticTargetIdentityV01 {
  const normalized = normalizeExternalRefPrimitiveV01(ref);
  const compatibilityNamespace = normalized.compatibility_namespace ?? null;
  return {
    compatibility_namespace: compatibilityNamespace,
    ref_type: normalizeRequiredText(normalized.ref_type, "target_ref.ref_type"),
    external_id: normalizeRequiredText(
      normalized.external_id,
      "target_ref.external_id",
    ),
    provider: compatibilityNamespace ? null : (normalized.provider ?? null),
    host: compatibilityNamespace ? null : (normalized.host ?? null),
  };
}

export function deriveVNextSemanticTargetKeyV01(
  ref: ExternalRefV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(createVNextSemanticTargetIdentityV01(ref)),
  );
}

export function buildVNextPersistedSemanticStateV01(input: {
  proposal: EpisodeDeltaProposalV01;
  candidate_id: string;
  target_ref: ExternalRefV01;
  source_decision: {
    decision_id: string;
    decision_fingerprint: string;
  };
  created_at: string;
}): VNextPersistedSemanticStateVersionV01 {
  const candidateId = normalizeRequiredText(input.candidate_id, "candidate_id");
  const candidate = input.proposal.proposed_deltas.find(
    (item) => item.candidate_id === candidateId,
  );
  if (!candidate) throw new Error("semantic_state_candidate_missing");
  const targetRef = normalizeExternalRefPrimitiveV01(input.target_ref);
  const targetCanonical = canonicalizeProtocolValueV01(targetRef);
  if (
    !candidate.target_refs.some(
      (item) =>
        canonicalizeProtocolValueV01(
          normalizeExternalRefPrimitiveV01(item),
        ) === targetCanonical,
    )
  ) {
    throw new Error("semantic_state_target_outside_candidate");
  }
  const summary = normalizeRequiredText(
    candidate.proposed_state_summary,
    "proposed_state_summary",
  );
  if (summary.length > 2000) throw new Error("semantic_state_summary_bound_exceeded");
  const content: VNextSemanticStateContentV01 = {
    state_content_version: VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01,
    target_semantic_identity: createVNextSemanticTargetIdentityV01(targetRef),
    delta_type: candidate.delta_type,
    proposed_state_summary: summary,
  };
  const contentFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(content),
  );
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  const createdAt = normalizeRequiredText(input.created_at, "created_at");
  const recordId = derivePersistedSemanticStateRecordIdV01({
    workspace_id: input.proposal.workspace_id,
    project_id: input.proposal.project_id,
    target_key: targetKey,
    state_content_fingerprint: contentFingerprint,
    source_proposal_id: input.proposal.proposal_id,
    source_candidate_id: candidate.candidate_id,
    source_decision_id: input.source_decision.decision_id,
  });
  const stateRef = createPersistedSemanticStateRefV01(
    recordId,
    contentFingerprint,
    createdAt,
  );
  const withoutFingerprint = {
    semantic_state_version: VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01,
    semantic_state_record_id: recordId,
    workspace_id: normalizeRequiredText(input.proposal.workspace_id, "workspace_id"),
    project_id: normalizeRequiredText(input.proposal.project_id, "project_id"),
    target_key: targetKey,
    target_ref: targetRef,
    state_ref: stateRef,
    state_content: content,
    state_content_fingerprint: contentFingerprint,
    bounded_state_summary: summary,
    source_proposal_id: input.proposal.proposal_id,
    source_proposal_fingerprint: normalizeSha256(
      input.proposal.integrity.fingerprint,
      "source_proposal_fingerprint",
    ),
    source_candidate_id: candidate.candidate_id,
    source_candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(candidate),
    source_decision_id: normalizeRequiredText(
      input.source_decision.decision_id,
      "source_decision_id",
    ),
    source_decision_fingerprint: normalizeSha256(
      input.source_decision.decision_fingerprint,
      "source_decision_fingerprint",
    ),
    created_at: createdAt,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint_scope:
        "persisted_semantic_state_without_integrity_fingerprint" as const,
      fingerprint: "sha256:pending",
    },
  };
  const fingerprint = createPersistedSemanticStateFingerprintV01(
    withoutFingerprint,
  );
  return {
    ...withoutFingerprint,
    integrity: { ...withoutFingerprint.integrity, fingerprint },
  };
}

export function validateVNextPersistedSemanticStateV01(
  input: unknown,
): VNextPersistedSemanticStateValidationResultV01 {
  try {
    return {
      status: "valid",
      errors: [],
      normalized_state: rebuildVNextPersistedSemanticStateV01(input),
    };
  } catch (error) {
    const issue =
      error instanceof VNextPersistedSemanticStateValidationErrorV01
        ? error
        : new VNextPersistedSemanticStateValidationErrorV01(
            "persisted_semantic_state_invalid",
            "$",
            error instanceof Error ? error.message : "Persisted semantic state is invalid.",
          );
    return {
      status: "invalid",
      errors: [
        { code: issue.code, path: issue.path, message: issue.message },
      ],
      normalized_state: null,
    };
  }
}

export function rebuildVNextPersistedSemanticStateV01(
  input: unknown,
): VNextPersistedSemanticStateVersionV01 {
  if (!isProtocolRecordV01(input)) {
    failSemanticState("semantic_state_not_object", "$", "Persisted semantic state must be an object.");
  }
  assertAllowedSemanticStateKeys(
    input,
    new Set([
      "semantic_state_version",
      "semantic_state_record_id",
      "workspace_id",
      "project_id",
      "target_key",
      "target_ref",
      "state_ref",
      "state_content",
      "state_content_fingerprint",
      "bounded_state_summary",
      "source_proposal_id",
      "source_proposal_fingerprint",
      "source_candidate_id",
      "source_candidate_fingerprint",
      "source_decision_id",
      "source_decision_fingerprint",
      "created_at",
      "integrity",
    ]),
    "$",
  );
  if (
    input.semantic_state_version !== VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01
  ) {
    failSemanticState(
      "semantic_state_version_invalid",
      "$.semantic_state_version",
      "Persisted semantic state uses an unsupported version.",
    );
  }

  const workspaceId = semanticStateText(input.workspace_id, "$.workspace_id");
  const projectId = semanticStateText(input.project_id, "$.project_id");
  const targetRef = normalizeValidatedSemanticStateRef(
    input.target_ref,
    "$.target_ref",
  );
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  if (normalizeSemanticStateSha(input.target_key, "$.target_key") !== targetKey) {
    failSemanticState(
      "semantic_state_target_key_mismatch",
      "$.target_key",
      "Target key does not match the normalized target semantic identity.",
    );
  }

  if (!isProtocolRecordV01(input.state_content)) {
    failSemanticState(
      "semantic_state_content_invalid",
      "$.state_content",
      "State content must be an object.",
    );
  }
  const stateContent = input.state_content;
  assertAllowedSemanticStateKeys(
    stateContent,
    new Set([
      "state_content_version",
      "target_semantic_identity",
      "delta_type",
      "proposed_state_summary",
    ]),
    "$.state_content",
  );
  if (
    stateContent.state_content_version !==
    VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01
  ) {
    failSemanticState(
      "semantic_state_content_version_invalid",
      "$.state_content.state_content_version",
      "Semantic state content uses an unsupported version.",
    );
  }
  if (
    typeof stateContent.delta_type !== "string" ||
    !EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01.includes(
      stateContent.delta_type as EpisodeDeltaProposalDeltaCandidateV01["delta_type"],
    )
  ) {
    failSemanticState(
      "semantic_state_delta_type_invalid",
      "$.state_content.delta_type",
      "Semantic state content requires a supported delta type.",
    );
  }
  const summary = semanticStateText(
    stateContent.proposed_state_summary,
    "$.state_content.proposed_state_summary",
  );
  if (summary.length > 2000) {
    failSemanticState(
      "semantic_state_summary_bound_exceeded",
      "$.state_content.proposed_state_summary",
      "Semantic state summary exceeds 2000 characters.",
    );
  }
  const targetIdentity = createVNextSemanticTargetIdentityV01(targetRef);
  if (
    canonicalizeProtocolValueV01(stateContent.target_semantic_identity) !==
    canonicalizeProtocolValueV01(targetIdentity)
  ) {
    failSemanticState(
      "semantic_state_target_identity_mismatch",
      "$.state_content.target_semantic_identity",
      "State content target identity does not match the normalized target ref.",
    );
  }
  const normalizedContent: VNextSemanticStateContentV01 = {
    state_content_version: VNEXT_SEMANTIC_STATE_CONTENT_VERSION_V01,
    target_semantic_identity: targetIdentity,
    delta_type:
      stateContent.delta_type as EpisodeDeltaProposalDeltaCandidateV01["delta_type"],
    proposed_state_summary: summary,
  };
  const contentFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(normalizedContent),
  );
  if (
    normalizeSemanticStateSha(
      input.state_content_fingerprint,
      "$.state_content_fingerprint",
    ) !== contentFingerprint
  ) {
    failSemanticState(
      "semantic_state_content_fingerprint_mismatch",
      "$.state_content_fingerprint",
      "State content fingerprint does not match normalized candidate-derived content.",
    );
  }
  if (
    semanticStateText(input.bounded_state_summary, "$.bounded_state_summary") !==
    summary
  ) {
    failSemanticState(
      "semantic_state_bounded_summary_mismatch",
      "$.bounded_state_summary",
      "Bounded state summary must match the normalized state content summary.",
    );
  }

  const sourceProposalId = semanticStateText(
    input.source_proposal_id,
    "$.source_proposal_id",
  );
  const sourceProposalFingerprint = normalizeSemanticStateSha(
    input.source_proposal_fingerprint,
    "$.source_proposal_fingerprint",
  );
  const sourceCandidateId = semanticStateText(
    input.source_candidate_id,
    "$.source_candidate_id",
  );
  const sourceCandidateFingerprint = normalizeSemanticStateSha(
    input.source_candidate_fingerprint,
    "$.source_candidate_fingerprint",
  );
  const sourceDecisionId = semanticStateText(
    input.source_decision_id,
    "$.source_decision_id",
  );
  const sourceDecisionFingerprint = normalizeSemanticStateSha(
    input.source_decision_fingerprint,
    "$.source_decision_fingerprint",
  );
  const createdAt = semanticStateText(input.created_at, "$.created_at");
  if (parseStrictIsoTimestampV01(createdAt) === null) {
    failSemanticState(
      "semantic_state_created_at_invalid",
      "$.created_at",
      "Persisted semantic state requires a strict ISO-8601 timestamp.",
    );
  }

  const recordId = derivePersistedSemanticStateRecordIdV01({
    workspace_id: workspaceId,
    project_id: projectId,
    target_key: targetKey,
    state_content_fingerprint: contentFingerprint,
    source_proposal_id: sourceProposalId,
    source_candidate_id: sourceCandidateId,
    source_decision_id: sourceDecisionId,
  });
  if (
    semanticStateText(
      input.semantic_state_record_id,
      "$.semantic_state_record_id",
    ) !== recordId
  ) {
    failSemanticState(
      "semantic_state_record_id_mismatch",
      "$.semantic_state_record_id",
      "Semantic state record ID does not match deterministic source bindings.",
    );
  }
  const expectedStateRef = createPersistedSemanticStateRefV01(
    recordId,
    contentFingerprint,
    createdAt,
  );
  const stateRef = normalizeValidatedSemanticStateRef(
    input.state_ref,
    "$.state_ref",
  );
  if (
    canonicalizeProtocolValueV01(stateRef) !==
    canonicalizeProtocolValueV01(expectedStateRef)
  ) {
    failSemanticState(
      "semantic_state_ref_mismatch",
      "$.state_ref",
      "State ref must preserve the deterministic local record identity and content provenance.",
    );
  }

  if (!isProtocolRecordV01(input.integrity)) {
    failSemanticState(
      "semantic_state_integrity_invalid",
      "$.integrity",
      "Semantic state integrity must be an object.",
    );
  }
  assertAllowedSemanticStateKeys(
    input.integrity,
    new Set(["algorithm", "fingerprint_scope", "fingerprint"]),
    "$.integrity",
  );
  if (
    input.integrity.algorithm !== "sha256" ||
    input.integrity.fingerprint_scope !==
      "persisted_semantic_state_without_integrity_fingerprint"
  ) {
    failSemanticState(
      "semantic_state_integrity_shape_invalid",
      "$.integrity",
      "Semantic state integrity algorithm or fingerprint scope is invalid.",
    );
  }

  const normalizedWithoutFingerprint = {
    semantic_state_version: VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01,
    semantic_state_record_id: recordId,
    workspace_id: workspaceId,
    project_id: projectId,
    target_key: targetKey,
    target_ref: targetRef,
    state_ref: expectedStateRef,
    state_content: normalizedContent,
    state_content_fingerprint: contentFingerprint,
    bounded_state_summary: summary,
    source_proposal_id: sourceProposalId,
    source_proposal_fingerprint: sourceProposalFingerprint,
    source_candidate_id: sourceCandidateId,
    source_candidate_fingerprint: sourceCandidateFingerprint,
    source_decision_id: sourceDecisionId,
    source_decision_fingerprint: sourceDecisionFingerprint,
    created_at: createdAt,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint_scope:
        "persisted_semantic_state_without_integrity_fingerprint" as const,
      fingerprint: "sha256:pending",
    },
  };
  const fingerprint = createPersistedSemanticStateFingerprintV01(
    normalizedWithoutFingerprint,
  );
  if (
    normalizeSemanticStateSha(
      input.integrity.fingerprint,
      "$.integrity.fingerprint",
    ) !== fingerprint
  ) {
    failSemanticState(
      "semantic_state_integrity_fingerprint_mismatch",
      "$.integrity.fingerprint",
      "Semantic state aggregate fingerprint does not match normalized content and lineage.",
    );
  }
  return {
    ...normalizedWithoutFingerprint,
    integrity: { ...normalizedWithoutFingerprint.integrity, fingerprint },
  };
}

export function assertVNextCoreRecordMatchesProtocolPayloadBindingV01(
  record: VNextCoreRecordEnvelopeV01,
  binding: VNextProtocolPayloadLedgerBindingV01,
): void {
  if (
    normalizeRequiredText(record.workspace_id, "workspace_id") !==
    normalizeRequiredText(binding.workspace_id, "payload.workspace_id")
  ) {
    throw new Error("vnext_core_record_workspace_mismatch");
  }
  if (
    normalizeRequiredText(record.project_id, "project_id") !==
    normalizeRequiredText(binding.project_id, "payload.project_id")
  ) {
    throw new Error("vnext_core_record_project_mismatch");
  }
  if (
    normalizeSha256(record.fingerprint, "fingerprint") !==
    normalizeSha256(binding.fingerprint, "payload.fingerprint")
  ) {
    throw new Error("vnext_core_record_fingerprint_mismatch");
  }
}

export function readVNextSemanticStateEntryV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; target_key: string },
): VNextSemanticStateProjectionEntryV01 | null {
  const row = db
    .prepare(
      `SELECT * FROM vnext_semantic_state_entries
       WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
    )
    .get(
      normalizeRequiredText(input.workspace_id, "workspace_id"),
      normalizeRequiredText(input.project_id, "project_id"),
      normalizeSha256(input.target_key, "target_key"),
    ) as ProjectionRowV01 | undefined;
  return row ? parseProjection(row) : null;
}

export function listVNextSemanticStateEntriesV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): VNextSemanticStateProjectionEntryV01[] {
  const rows = db
    .prepare(
      `SELECT * FROM vnext_semantic_state_entries
       WHERE workspace_id = ? AND project_id = ? ORDER BY target_key ASC`,
    )
    .all(
      normalizeRequiredText(input.workspace_id, "workspace_id"),
      normalizeRequiredText(input.project_id, "project_id"),
    ) as ProjectionRowV01[];
  return rows.map(parseProjection);
}

export function insertVNextSemanticStateEntryV01(
  db: Database.Database,
  entry: VNextSemanticStateProjectionEntryV01,
): void {
  const normalized = normalizeProjection(entry);
  const result = db.prepare(
    `INSERT INTO vnext_semantic_state_entries (
      workspace_id, project_id, presence, target_key, target_ref_json, state_ref_json,
      current_state_fingerprint, bounded_state_summary,
      source_proposal_id, source_proposal_fingerprint,
      source_candidate_id, source_candidate_fingerprint,
      source_transition_receipt_id, source_transition_receipt_fingerprint,
      revision, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(...projectionValues(normalized));
  if (result.changes !== 1) throw new Error("semantic_state_insert_failed");
}

export function updateVNextSemanticStateEntryCasV01(
  db: Database.Database,
  input: {
    expected_revision: number;
    expected_state_fingerprint: string;
    next: VNextSemanticStateProjectionEntryV01;
  },
): void {
  const next = normalizeProjection(input.next);
  if (next.revision !== input.expected_revision + 1) {
    throw new Error("semantic_state_revision_invalid");
  }
  const result = db.prepare(
    `UPDATE vnext_semantic_state_entries SET
      target_ref_json = ?, state_ref_json = ?, current_state_fingerprint = ?,
      bounded_state_summary = ?, source_proposal_id = ?,
      source_proposal_fingerprint = ?, source_candidate_id = ?,
      source_candidate_fingerprint = ?, source_transition_receipt_id = ?,
      source_transition_receipt_fingerprint = ?, revision = ?, updated_at = ?
     WHERE workspace_id = ? AND project_id = ? AND target_key = ?
       AND revision = ? AND current_state_fingerprint = ?`,
  ).run(
    canonicalizeProtocolValueV01(next.target_ref),
    canonicalizeProtocolValueV01(next.state_ref),
    next.state_fingerprint,
    next.bounded_state_summary,
    next.source_proposal_id,
    next.source_proposal_fingerprint,
    next.source_candidate_id,
    next.source_candidate_fingerprint,
    next.source_transition_receipt_id,
    next.source_transition_receipt_fingerprint,
    next.revision,
    next.updated_at,
    next.workspace_id,
    next.project_id,
    next.target_key,
    input.expected_revision,
    normalizeSha256(input.expected_state_fingerprint, "expected_state_fingerprint"),
  );
  if (result.changes !== 1) throw new Error("semantic_state_cas_conflict");
}

export function deleteVNextSemanticStateEntryCasV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    target_key: string;
    expected_revision: number;
    expected_state_fingerprint: string;
  },
): void {
  const result = db.prepare(
    `DELETE FROM vnext_semantic_state_entries
     WHERE workspace_id = ? AND project_id = ? AND target_key = ?
       AND revision = ? AND current_state_fingerprint = ?`,
  ).run(
    normalizeRequiredText(input.workspace_id, "workspace_id"),
    normalizeRequiredText(input.project_id, "project_id"),
    normalizeSha256(input.target_key, "target_key"),
    input.expected_revision,
    normalizeSha256(input.expected_state_fingerprint, "expected_state_fingerprint"),
  );
  if (result.changes !== 1) throw new Error("semantic_state_cas_conflict");
}

function selectCoreRecordByIdentity(
  db: Database.Database,
  kind: VNextCoreRecordKindV01,
  id: string,
): VNextCoreRecordEnvelopeV01 | null {
  const row = db
    .prepare(
      "SELECT * FROM vnext_core_records WHERE record_kind = ? AND record_id = ?",
    )
    .get(kind, id) as CoreRecordRowV01 | undefined;
  return row ? parseCoreRecord(row) : null;
}

function selectCoreRecordByIdempotency(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  kind: VNextCoreRecordKindV01,
  key: string,
): VNextCoreRecordEnvelopeV01 | null {
  const row = db
    .prepare(
      `SELECT * FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = ? AND idempotency_key = ?`,
    )
    .get(workspaceId, projectId, kind, key) as CoreRecordRowV01 | undefined;
  return row ? parseCoreRecord(row) : null;
}

function exactReplayOrThrow(
  existing: VNextCoreRecordEnvelopeV01,
  attempted: VNextCoreRecordEnvelopeV01,
): VNextCoreRecordWriteResultV01 {
  if (
    canonicalizeProtocolValueV01(existing) !==
    canonicalizeProtocolValueV01(attempted)
  ) {
    throw new Error("vnext_core_record_conflict");
  }
  return { status: "exact_replay", record: existing };
}

function normalizeCoreRecord(
  input: VNextCoreRecordEnvelopeV01,
): VNextCoreRecordEnvelopeV01 {
  if (!VNEXT_CORE_RECORD_KINDS_V01.includes(input.record_kind)) {
    throw new Error("vnext_core_record_kind_invalid");
  }
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    throw new Error("vnext_core_record_payload_invalid");
  }
  return {
    record_kind: input.record_kind,
    record_id: normalizeRequiredText(input.record_id, "record_id"),
    workspace_id: normalizeRequiredText(input.workspace_id, "workspace_id"),
    project_id: normalizeRequiredText(input.project_id, "project_id"),
    fingerprint: normalizeSha256(input.fingerprint, "fingerprint"),
    idempotency_key:
      input.idempotency_key === null
        ? null
        : normalizeSha256(input.idempotency_key, "idempotency_key"),
    payload: JSON.parse(canonicalizeProtocolValueV01(input.payload)) as unknown,
    created_at: normalizeRequiredText(input.created_at, "created_at"),
  };
}

function parseCoreRecord(row: CoreRecordRowV01): VNextCoreRecordEnvelopeV01 {
  let payload: unknown;
  try {
    payload = JSON.parse(row.payload_json) as unknown;
  } catch {
    throw new Error("vnext_core_record_payload_corrupt");
  }
  return normalizeCoreRecord({
    record_kind: row.record_kind as VNextCoreRecordKindV01,
    record_id: row.record_id,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    fingerprint: row.fingerprint,
    idempotency_key: row.idempotency_key,
    payload,
    created_at: row.created_at,
  });
}

function normalizeProjection(
  input: VNextSemanticStateProjectionEntryV01,
): VNextSemanticStateProjectionEntryV01 {
  const summary = normalizeRequiredText(input.bounded_state_summary, "bounded_state_summary");
  if (summary.length > 2000) throw new Error("semantic_state_summary_bound_exceeded");
  if (!Number.isSafeInteger(input.revision) || input.revision < 1) {
    throw new Error("semantic_state_revision_invalid");
  }
  return {
    workspace_id: normalizeRequiredText(input.workspace_id, "workspace_id"),
    project_id: normalizeRequiredText(input.project_id, "project_id"),
    presence: normalizePresence(input.presence),
    target_key: normalizeSha256(input.target_key, "target_key"),
    target_ref: normalizeExternalRefPrimitiveV01(input.target_ref),
    state_ref: normalizeExternalRefPrimitiveV01(input.state_ref),
    state_fingerprint: normalizeSha256(input.state_fingerprint, "state_fingerprint"),
    bounded_state_summary: summary,
    source_proposal_id: normalizeRequiredText(input.source_proposal_id, "source_proposal_id"),
    source_proposal_fingerprint: normalizeSha256(input.source_proposal_fingerprint, "source_proposal_fingerprint"),
    source_candidate_id: normalizeRequiredText(input.source_candidate_id, "source_candidate_id"),
    source_candidate_fingerprint: normalizeSha256(input.source_candidate_fingerprint, "source_candidate_fingerprint"),
    source_transition_receipt_id: normalizeRequiredText(input.source_transition_receipt_id, "source_transition_receipt_id"),
    source_transition_receipt_fingerprint: normalizeSha256(input.source_transition_receipt_fingerprint, "source_transition_receipt_fingerprint"),
    revision: input.revision,
    updated_at: normalizeRequiredText(input.updated_at, "updated_at"),
  };
}

function projectionValues(entry: VNextSemanticStateProjectionEntryV01): unknown[] {
  return [
    entry.workspace_id,
    entry.project_id,
    entry.presence,
    entry.target_key,
    canonicalizeProtocolValueV01(entry.target_ref),
    canonicalizeProtocolValueV01(entry.state_ref),
    entry.state_fingerprint,
    entry.bounded_state_summary,
    entry.source_proposal_id,
    entry.source_proposal_fingerprint,
    entry.source_candidate_id,
    entry.source_candidate_fingerprint,
    entry.source_transition_receipt_id,
    entry.source_transition_receipt_fingerprint,
    entry.revision,
    entry.updated_at,
  ];
}

function parseProjection(row: ProjectionRowV01): VNextSemanticStateProjectionEntryV01 {
  let targetRef: ExternalRefV01;
  let stateRef: ExternalRefV01;
  try {
    targetRef = JSON.parse(row.target_ref_json) as ExternalRefV01;
    stateRef = JSON.parse(row.state_ref_json) as ExternalRefV01;
  } catch {
    throw new Error("semantic_state_projection_json_corrupt");
  }
  return normalizeProjection({
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    presence: normalizePresence(row.presence),
    target_key: row.target_key,
    target_ref: targetRef,
    state_ref: stateRef,
    state_fingerprint: row.current_state_fingerprint,
    bounded_state_summary: row.bounded_state_summary,
    source_proposal_id: row.source_proposal_id,
    source_proposal_fingerprint: row.source_proposal_fingerprint,
    source_candidate_id: row.source_candidate_id,
    source_candidate_fingerprint: row.source_candidate_fingerprint,
    source_transition_receipt_id: row.source_transition_receipt_id,
    source_transition_receipt_fingerprint: row.source_transition_receipt_fingerprint,
    revision: row.revision,
    updated_at: row.updated_at,
  });
}

function derivePersistedSemanticStateRecordIdV01(input: {
  workspace_id: string;
  project_id: string;
  target_key: string;
  state_content_fingerprint: string;
  source_proposal_id: string;
  source_candidate_id: string;
  source_decision_id: string;
}): string {
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      semantic_state_version: VNEXT_PERSISTED_SEMANTIC_STATE_VERSION_V01,
      workspace_id: normalizeRequiredText(input.workspace_id, "workspace_id"),
      project_id: normalizeRequiredText(input.project_id, "project_id"),
      target_key: normalizeSha256(input.target_key, "target_key"),
      state_content_fingerprint: normalizeSha256(
        input.state_content_fingerprint,
        "state_content_fingerprint",
      ),
      source_proposal_id: normalizeRequiredText(
        input.source_proposal_id,
        "source_proposal_id",
      ),
      source_candidate_id: normalizeRequiredText(
        input.source_candidate_id,
        "source_candidate_id",
      ),
      source_decision_id: normalizeRequiredText(
        input.source_decision_id,
        "source_decision_id",
      ),
    }),
  );
  return `semantic-state:${identityHash.slice("sha256:".length, 31)}`;
}

function createPersistedSemanticStateRefV01(
  recordId: string,
  contentFingerprint: string,
  createdAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "accepted_semantic_state",
    external_id: normalizeRequiredText(recordId, "semantic_state_record_id"),
    trust_class: "direct_local_observation",
    observed_at: normalizeRequiredText(createdAt, "created_at"),
    source_ref: normalizeSha256(
      contentFingerprint,
      "state_content_fingerprint",
    ),
    compatibility_namespace: VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
  };
}

function createPersistedSemanticStateFingerprintV01(input: unknown): string {
  if (!isProtocolRecordV01(input) || !isProtocolRecordV01(input.integrity)) {
    throw new Error("semantic_state_integrity_invalid");
  }
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...input,
      integrity: { ...input.integrity, fingerprint: undefined },
    }),
  );
}

function normalizeValidatedSemanticStateRef(
  input: unknown,
  path: string,
): ExternalRefV01 {
  const errors: VNextPersistedSemanticStateValidationIssueV01[] = [];
  validateExternalRefStructureV01(input, path, {
    error(code, issuePath, message) {
      errors.push({ code, path: issuePath ?? path, message });
    },
    warning() {},
  });
  if (errors[0]) {
    failSemanticState(errors[0].code, errors[0].path, errors[0].message);
  }
  const normalized = normalizeExternalRefPrimitiveV01(input as ExternalRefV01);
  return {
    ...normalized,
    trust_class: normalizeProtocolTextV01(
      normalized.trust_class,
    ) as ExternalRefV01["trust_class"],
  };
}

function assertAllowedSemanticStateKeys(
  input: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
): void {
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      failSemanticState(
        "semantic_state_unknown_field",
        `${path}.${key}`,
        `Field ${key} is not part of persisted semantic state v0.1.`,
      );
    }
  }
}

function semanticStateText(value: unknown, path: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized) {
    failSemanticState(
      "semantic_state_required_field_missing",
      path,
      `${path} must be a non-empty string.`,
    );
  }
  return normalized;
}

function normalizeSemanticStateSha(value: unknown, path: string): string {
  const normalized = semanticStateText(value, path);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    failSemanticState(
      "semantic_state_sha256_invalid",
      path,
      `${path} must be a lowercase SHA-256 fingerprint.`,
    );
  }
  return normalized;
}

function failSemanticState(
  code: string,
  path: string,
  message: string,
): never {
  throw new VNextPersistedSemanticStateValidationErrorV01(code, path, message);
}

function normalizeRequiredText(value: unknown, field: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized) throw new Error(`${field}_required`);
  return normalized;
}

function normalizePresence(value: unknown): "present" {
  if (normalizeProtocolTextV01(value) !== "present") {
    throw new Error("semantic_state_presence_invalid");
  }
  return "present";
}

function normalizeSha256(value: unknown, field: string): string {
  const normalized = normalizeRequiredText(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    throw new Error(`${field}_invalid`);
  }
  return normalized;
}
