import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  readVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextCoreRecordWriteResultV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { readProposalForExactSourcePurposeV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  canonicalizeProjectVerifyMaterialV01,
  claimEvidenceRelationReferenceV01,
  claimRecordReferenceV01,
  evidenceRecordReferenceV01,
  validateClaimEvidenceRelationV01,
  validateClaimRecordV01,
  validateEvidenceRecordV01,
} from "@/lib/vnext/project-verify-material";
import {
  deriveRunAssessmentProposalAdmissionIdentityV01,
  materializeRunAssessmentProposalV01,
} from "@/lib/vnext/run-assessment-proposal";
import {
  materializeRunCriterionClaimCandidateV01,
  materializeRunCriterionProjectVerifyMaterialV01,
} from "@/lib/vnext/run-criterion-project-verify-material";
import { readProjectRunResultSourceBindingV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type {
  ClaimEvidenceRelationReferenceV01,
  ClaimEvidenceRelationV01,
  ClaimRecordReferenceV01,
  ClaimRecordV01,
  EvidenceRecordReferenceV01,
  EvidenceRecordV01,
  ProjectVerifyProducerV01,
  RunCriterionProjectVerifyMaterialV01,
} from "@/types/vnext/project-verify-material";
import {
  PROJECT_VERIFY_MATERIAL_MAX_LINEAGE_REVISIONS_V01,
  RUN_CRITERION_CLAIM_FAMILY_NAMESPACE_V01,
  RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01,
  RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01,
  RUN_CRITERION_RELATION_FAMILY_NAMESPACE_V01,
} from "@/types/vnext/project-verify-material";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const PROJECT_VERIFY_MATERIAL_STORE_VERSION_V01 =
  "project_verify_material_store.v0.1" as const;

const PROJECT_VERIFY_RECORD_LIST_LIMIT_V01 = 256;
const PROJECT_VERIFY_BATCH_MEMBER_LIMIT_V01 = 64;
const SHA256_PATTERN_V01 = /^sha256:[a-f0-9]{64}$/u;

export type ProjectVerifyMaterialAdmissionStatusV01 =
  VNextCoreRecordWriteResultV01["status"];

export interface ProjectVerifyMaterialScopeV01 {
  workspace_id: string;
  project_id: string;
}

declare const PROJECT_VERIFY_MATERIAL_READ_SESSION_OPAQUE_V01: unique symbol;

/** Creator-issued opaque handle for one synchronous project-scoped read. */
export interface ProjectVerifyMaterialReadSessionV01 {
  readonly [PROJECT_VERIFY_MATERIAL_READ_SESSION_OPAQUE_V01]: true;
}

/**
 * Private state behind the opaque read-session handle. It memoizes only
 * successful authentication of immutable Core material. Public standalone
 * reads create a fresh session unless explicitly given a creator-issued
 * handle; every new reconciliation creates a fresh session. Mutable heads,
 * lifecycle projections, missing material, and conflicts are never stored.
 */
class ProjectVerifyMaterialReadSessionStateV01 {
  private readonly authenticatedRecords = new Set<string>();
  private readonly claimFamilies = new Map<string, ClaimRecordV01[]>();
  private readonly relationFamilies = new Map<
    string,
    ClaimEvidenceRelationV01[]
  >();
  private readonly expectedMaterialByReceipt = new Map<
    string,
    RunCriterionProjectVerifyMaterialV01
  >();

  constructor(
    private readonly db: Database.Database,
    readonly workspace_id: string,
    readonly project_id: string,
  ) {}

  assertScope(
    db: Database.Database,
    scope: ProjectVerifyMaterialScopeV01,
  ): void {
    if (
      db !== this.db ||
      scope.workspace_id !== this.workspace_id ||
      scope.project_id !== this.project_id
    ) {
      refuseV01("project_verify_material_read_session_scope_conflict");
    }
  }

  hasAuthenticatedRecord(
    record: EvidenceRecordV01 | ClaimRecordV01 | ClaimEvidenceRelationV01,
  ): boolean {
    return this.authenticatedRecords.has(readRecordCacheKeyV01(record));
  }

  rememberAuthenticatedRecord(
    record: EvidenceRecordV01 | ClaimRecordV01 | ClaimEvidenceRelationV01,
  ): void {
    if (
      this.authenticatedRecords.size <
      PROJECT_VERIFY_RECORD_LIST_LIMIT_V01 * 3
    ) {
      this.authenticatedRecords.add(readRecordCacheKeyV01(record));
    }
  }

  readClaimFamily(
    familyId: string,
    snapshotFingerprint: string,
  ): ClaimRecordV01[] | null {
    const cached = this.claimFamilies.get(
      `${familyId}\0${snapshotFingerprint}`,
    );
    return cached ? structuredClone(cached) : null;
  }

  rememberClaimFamily(
    familyId: string,
    snapshotFingerprint: string,
    records: ClaimRecordV01[],
  ): void {
    if (this.claimFamilies.size < PROJECT_VERIFY_RECORD_LIST_LIMIT_V01) {
      this.claimFamilies.set(
        `${familyId}\0${snapshotFingerprint}`,
        structuredClone(records),
      );
    }
  }

  readRelationFamily(
    familyId: string,
    snapshotFingerprint: string,
  ): ClaimEvidenceRelationV01[] | null {
    const cached = this.relationFamilies.get(
      `${familyId}\0${snapshotFingerprint}`,
    );
    return cached ? structuredClone(cached) : null;
  }

  rememberRelationFamily(
    familyId: string,
    snapshotFingerprint: string,
    records: ClaimEvidenceRelationV01[],
  ): void {
    if (this.relationFamilies.size < PROJECT_VERIFY_RECORD_LIST_LIMIT_V01) {
      this.relationFamilies.set(
        `${familyId}\0${snapshotFingerprint}`,
        structuredClone(records),
      );
    }
  }

  resolveExpectedMaterial(
    db: Database.Database,
    scope: ProjectVerifyMaterialScopeV01,
    refs: ExternalRefV01[],
  ): RunCriterionProjectVerifyMaterialV01 {
    this.assertScope(db, scope);
    const receiptRef = singleSourceRefV01(
      refs,
      "run_receipt",
      "source_bound_receipt_ref_invalid",
    );
    if (
      !receiptRef.source_ref ||
      !SHA256_PATTERN_V01.test(receiptRef.source_ref)
    ) {
      refuseV01("source_bound_receipt_ref_invalid");
    }
    const key = canonicalizeProjectVerifyMaterialV01({
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      receipt_id: receiptRef.external_id,
      receipt_fingerprint: receiptRef.source_ref,
    });
    const cached = this.expectedMaterialByReceipt.get(key);
    if (cached) return structuredClone(cached);
    const expected = resolveExpectedRunCriterionProjectVerifyMaterialV01(db, {
      ...scope,
      receipt_id: receiptRef.external_id,
    });
    if (
      expected.source.receipt.receipt_id !== receiptRef.external_id ||
      expected.source.receipt.receipt_fingerprint !== receiptRef.source_ref
    ) {
      refuseV01("source_bound_receipt_ref_invalid");
    }
    if (
      this.expectedMaterialByReceipt.size <
      PROJECT_VERIFY_RECORD_LIST_LIMIT_V01
    ) {
      this.expectedMaterialByReceipt.set(key, structuredClone(expected));
    }
    return structuredClone(expected);
  }
}

// This is an ownership registry for opaque call-local handles, not a reusable
// source cache. The handle is the only strong reference to its private state.
const projectVerifyMaterialReadSessionStatesV01 = new WeakMap<
  ProjectVerifyMaterialReadSessionV01,
  ProjectVerifyMaterialReadSessionStateV01
>();

export function createProjectVerifyMaterialReadSessionV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01,
): ProjectVerifyMaterialReadSessionV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const scope = scopeV01(input);
  const state = new ProjectVerifyMaterialReadSessionStateV01(
    db,
    scope.workspace_id,
    scope.project_id,
  );
  const session = Object.freeze({}) as ProjectVerifyMaterialReadSessionV01;
  projectVerifyMaterialReadSessionStatesV01.set(session, state);
  return session;
}

export interface ProjectVerifyMaterialBatchInputV01 extends ProjectVerifyMaterialScopeV01 {
  evidence_records: EvidenceRecordV01[];
  claim_records: ClaimRecordV01[];
  relations: ClaimEvidenceRelationV01[];
  source_bound_run?: {
    receipt_id: string;
    batch_idempotency_key: string;
  };
}

export interface ProjectVerifyMaterialBatchAdmissionResultV01 {
  status: ProjectVerifyMaterialAdmissionStatusV01;
  evidence_records: EvidenceRecordV01[];
  claim_records: ClaimRecordV01[];
  relations: ClaimEvidenceRelationV01[];
}

export interface ClaimFamilyLineageReadModelV01 extends ProjectVerifyMaterialScopeV01 {
  claim_family_id: string;
  lineage_status: "missing" | "recorded";
  revisions: ClaimRecordV01[];
  latest_recorded_revision: number | null;
  latest_recorded_claim: ClaimRecordV01 | null;
  latest_recorded_claim_ref: ClaimRecordReferenceV01 | null;
  competing_candidate_revisions: ClaimRecordV01[];
  unresolved_lineage_conflict: false;
  canonical_applied_current_head_ref: null;
  review_decision_ref: null;
  transition_ref: null;
  truth_status: "not_established";
  notes: string[];
}

export interface ClaimEvidenceRelationFamilyLineageReadModelV01 extends ProjectVerifyMaterialScopeV01 {
  relation_family_id: string;
  lineage_status: "missing" | "recorded";
  revisions: ClaimEvidenceRelationV01[];
  latest_recorded_revision: number | null;
  latest_recorded_relation: ClaimEvidenceRelationV01 | null;
  latest_recorded_relation_ref: ClaimEvidenceRelationReferenceV01 | null;
  competing_candidate_revisions: ClaimEvidenceRelationV01[];
  unresolved_lineage_conflict: false;
  canonical_applied_current_head_ref: null;
  review_decision_ref: null;
  transition_ref: null;
  relation_status: "not_established";
  notes: string[];
}

export class ProjectVerifyMaterialStoreErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ProjectVerifyMaterialStoreErrorV01";
  }
}

/**
 * Canonical scoped Evidence writer. It records immutable support material only;
 * no Claim, decision, Transition, or semantic projection is created implicitly.
 */
export function admitEvidenceRecordV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { evidence: EvidenceRecordV01 },
): {
  status: ProjectVerifyMaterialAdmissionStatusV01;
  evidence: EvidenceRecordV01;
} {
  const admitted = admitProjectVerifyMaterialBatchV01(db, {
    ...scopeV01(input),
    evidence_records: [input.evidence],
    claim_records: [],
    relations: [],
  });
  return {
    status: admitted.status,
    evidence: admitted.evidence_records[0]!,
  };
}

/**
 * Canonical scoped Claim candidate writer. Revision admission is serialized
 * against the complete recorded family, but no applied/current head is chosen.
 */
export function admitClaimRecordV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { claim: ClaimRecordV01 },
): {
  status: ProjectVerifyMaterialAdmissionStatusV01;
  claim: ClaimRecordV01;
} {
  const admitted = admitProjectVerifyMaterialBatchV01(db, {
    ...scopeV01(input),
    evidence_records: [],
    claim_records: [input.claim],
    relations: [],
  });
  return {
    status: admitted.status,
    claim: admitted.claim_records[0]!,
  };
}

/**
 * Canonical scoped Claim-Evidence relation candidate writer. Both immutable
 * endpoints must already exist or be part of the same atomic batch.
 */
export function admitClaimEvidenceRelationV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & {
    relation: ClaimEvidenceRelationV01;
  },
): {
  status: ProjectVerifyMaterialAdmissionStatusV01;
  relation: ClaimEvidenceRelationV01;
} {
  const admitted = admitProjectVerifyMaterialBatchV01(db, {
    ...scopeV01(input),
    evidence_records: [],
    claim_records: [],
    relations: [input.relation],
  });
  return {
    status: admitted.status,
    relation: admitted.relations[0]!,
  };
}

/**
 * One atomic project-Verify admission operation. Pure record validation,
 * endpoint validation, and virtual lineage validation all complete before the
 * first insert. The generic immutable store remains replay/conflict authority.
 */
export function admitProjectVerifyMaterialBatchV01(
  db: Database.Database,
  input: ProjectVerifyMaterialBatchInputV01,
): ProjectVerifyMaterialBatchAdmissionResultV01 {
  return withAtomicWriteV01(db, "project_verify_material_batch", () => {
    assertVNextDurableSemanticStoreSchemaV01(db);
    const scope = scopeV01(input);
    const preflight = preflightBatchV01(db, scope, input);
    const evidenceWrites = preflight.evidence.map((record) =>
      writeEvidenceRecordV01(db, record),
    );
    const claimWrites = preflight.claims.map((record) =>
      writeClaimRecordV01(db, record),
    );
    const relationWrites = preflight.relations.map((record) =>
      writeClaimEvidenceRelationV01(db, record),
    );
    const statuses = [
      ...evidenceWrites.map((write) => write.status),
      ...claimWrites.map((write) => write.status),
      ...relationWrites.map((write) => write.status),
    ];
    return {
      status: statuses.every((status) => status === "exact_replay")
        ? "exact_replay"
        : "inserted",
      evidence_records: evidenceWrites.map((write) => write.record),
      claim_records: claimWrites.map((write) => write.record),
      relations: relationWrites.map((write) => write.record),
    };
  });
}

export function readEvidenceRecordV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { evidence_id: string },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): EvidenceRecordV01 | null {
  const { scope, cache } = materialReadScopeV01(db, input, readSession);
  const record = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "evidence_record",
    record_id: lookupTextV01(input.evidence_id, "evidence_id_invalid"),
  });
  if (!record) return null;
  const evidence = evidenceFromEnvelopeV01(record, scope);
  assertPersistedSourceAuthenticityV01(db, scope, evidence, cache);
  return evidence;
}

export function listProjectEvidenceRecordsV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { limit?: number },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): EvidenceRecordV01[] {
  const { scope, cache } = materialReadScopeV01(db, input, readSession);
  const records = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["evidence_record"],
    limit: listLimitV01(input.limit),
  }).map((record) => evidenceFromEnvelopeV01(record, scope));
  for (const record of records) {
    assertPersistedSourceAuthenticityV01(db, scope, record, cache);
  }
  return records;
}

export function readClaimRecordV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { claim_id: string },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimRecordV01 | null {
  const { scope, session, cache } = materialReadScopeV01(
    db,
    input,
    readSession,
  );
  const claim = readClaimRecordEnvelopeOnlyV01(
    db,
    scope,
    lookupTextV01(input.claim_id, "claim_id_invalid"),
  );
  if (!claim) return null;
  const history = listClaimFamilyRevisionsV01(
    db,
    {
      ...scope,
      claim_family_id: claim.claim_family_id,
    },
    session,
  );
  const fromHistory = history.find(
    (candidate) => candidate.claim_id === claim.claim_id,
  );
  if (!fromHistory || !canonicalEqualV01(fromHistory, claim)) {
    refuseV01("claim_family_record_conflict");
  }
  assertPersistedSourceAuthenticityV01(db, scope, fromHistory, cache);
  return fromHistory;
}

export function listProjectClaimRecordsV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { limit?: number },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimRecordV01[] {
  const { scope, session, cache } = materialReadScopeV01(
    db,
    input,
    readSession,
  );
  const records = listVNextCoreRecordsV01(db, {
    ...scope,
    record_kinds: ["claim_record"],
    limit: listLimitV01(input.limit),
  }).map((record) => claimFromEnvelopeV01(record, scope));
  for (const familyId of new Set(
    records.map((record) => record.claim_family_id),
  )) {
    listClaimFamilyRevisionsV01(
      db,
      {
        ...scope,
        claim_family_id: familyId,
      },
      session,
    );
  }
  for (const record of records) {
    assertPersistedSourceAuthenticityV01(db, scope, record, cache);
  }
  return records;
}

export function listClaimFamilyRevisionsV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { claim_family_id: string },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimRecordV01[] {
  const { scope, cache } = materialReadScopeV01(db, input, readSession);
  const familyId = lookupTextV01(
    input.claim_family_id,
    "claim_family_id_invalid",
  );
  const identities = boundedRecordIdentitiesV01(
    db,
    `SELECT record_id, fingerprint
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'claim_record'
         AND json_extract(payload_json, '$.claim_family_id') = ?
       ORDER BY CAST(json_extract(payload_json, '$.revision') AS INTEGER),
                record_id
       LIMIT ?`,
    [
      scope.workspace_id,
      scope.project_id,
      familyId,
      PROJECT_VERIFY_RECORD_LIST_LIMIT_V01 + 1,
    ],
    "claim_family_history_bound_exceeded",
  );
  const snapshotFingerprint = canonicalizeProjectVerifyMaterialV01(identities);
  const cached = cache.readClaimFamily(familyId, snapshotFingerprint);
  if (cached) return cached;
  const revisions = identities.map(({ record_id: claimId }) => {
    const claim = readClaimRecordEnvelopeOnlyV01(db, scope, claimId);
    if (!claim || claim.claim_family_id !== familyId) {
      refuseV01("claim_family_record_conflict");
    }
    return claim;
  });
  assertClaimHistoryV01(revisions);
  for (const revision of revisions) {
    assertPersistedSourceAuthenticityV01(db, scope, revision, cache);
  }
  cache.rememberClaimFamily(familyId, snapshotFingerprint, revisions);
  return structuredClone(revisions);
}

export function readClaimFamilyLineageV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { claim_family_id: string },
): ClaimFamilyLineageReadModelV01 {
  const scope = scopeV01(input);
  const familyId = lookupTextV01(
    input.claim_family_id,
    "claim_family_id_invalid",
  );
  const revisions = listClaimFamilyRevisionsV01(db, {
    ...scope,
    claim_family_id: familyId,
  });
  const latest = revisions.at(-1) ?? null;
  return {
    ...scope,
    claim_family_id: familyId,
    lineage_status: latest ? "recorded" : "missing",
    revisions,
    latest_recorded_revision: latest?.revision ?? null,
    latest_recorded_claim: latest,
    latest_recorded_claim_ref: latest ? claimRecordReferenceV01(latest) : null,
    competing_candidate_revisions: [],
    unresolved_lineage_conflict: false,
    canonical_applied_current_head_ref: null,
    review_decision_ref: null,
    transition_ref: null,
    truth_status: "not_established",
    notes: latest
      ? [
          "The highest contiguous revision is only the latest recorded candidate; no applied/current Claim head or truth status is selected in SR-2.",
        ]
      : [
          "No Claim candidate is recorded for this exact project-scoped family.",
        ],
  };
}

export function readClaimEvidenceRelationV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { relation_id: string },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimEvidenceRelationV01 | null {
  const { scope, session } = materialReadScopeV01(db, input, readSession);
  const relation = readRelationEnvelopeOnlyV01(
    db,
    scope,
    lookupTextV01(input.relation_id, "relation_id_invalid"),
  );
  if (!relation) return null;
  const history = listClaimEvidenceRelationFamilyRevisionsV01(
    db,
    {
      ...scope,
      relation_family_id: relation.relation_family_id,
    },
    session,
  );
  const fromHistory = history.find(
    (candidate) => candidate.relation_id === relation.relation_id,
  );
  if (!fromHistory || !canonicalEqualV01(fromHistory, relation)) {
    refuseV01("relation_family_record_conflict");
  }
  return fromHistory;
}

export function listClaimEvidenceRelationFamilyRevisionsV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { relation_family_id: string },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimEvidenceRelationV01[] {
  const { scope, session, cache } = materialReadScopeV01(
    db,
    input,
    readSession,
  );
  const familyId = lookupTextV01(
    input.relation_family_id,
    "relation_family_id_invalid",
  );
  const identities = boundedRecordIdentitiesV01(
    db,
    `SELECT record_id, fingerprint
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'claim_evidence_relation'
         AND json_extract(payload_json, '$.relation_family_id') = ?
       ORDER BY CAST(json_extract(payload_json, '$.revision') AS INTEGER),
                record_id
       LIMIT ?`,
    [
      scope.workspace_id,
      scope.project_id,
      familyId,
      PROJECT_VERIFY_RECORD_LIST_LIMIT_V01 + 1,
    ],
    "relation_family_history_bound_exceeded",
  );
  const snapshotFingerprint = canonicalizeProjectVerifyMaterialV01(identities);
  const cached = cache.readRelationFamily(familyId, snapshotFingerprint);
  if (cached) return cached;
  const revisions = identities.map(({ record_id: relationId }) => {
    const relation = readRelationEnvelopeOnlyV01(db, scope, relationId);
    if (!relation || relation.relation_family_id !== familyId) {
      refuseV01("relation_family_record_conflict");
    }
    return relation;
  });
  assertRelationHistoryV01(revisions);
  for (const relation of revisions) {
    assertClaimEndpointV01(
      db,
      scope,
      relation.claim_ref,
      new Map(),
      session,
    );
    const evidence = assertEvidenceEndpointV01(
      db,
      scope,
      relation.evidence_ref,
      new Map(),
      session,
    );
    if (relation.trust_class !== evidence.trust_class) {
      refuseV01("relation_evidence_trust_conflict");
    }
    assertPersistedSourceAuthenticityV01(db, scope, relation, cache);
  }
  cache.rememberRelationFamily(familyId, snapshotFingerprint, revisions);
  return structuredClone(revisions);
}

export function readClaimEvidenceRelationFamilyLineageV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & { relation_family_id: string },
): ClaimEvidenceRelationFamilyLineageReadModelV01 {
  const scope = scopeV01(input);
  const familyId = lookupTextV01(
    input.relation_family_id,
    "relation_family_id_invalid",
  );
  const revisions = listClaimEvidenceRelationFamilyRevisionsV01(db, {
    ...scope,
    relation_family_id: familyId,
  });
  const latest = revisions.at(-1) ?? null;
  return {
    ...scope,
    relation_family_id: familyId,
    lineage_status: latest ? "recorded" : "missing",
    revisions,
    latest_recorded_revision: latest?.revision ?? null,
    latest_recorded_relation: latest,
    latest_recorded_relation_ref: latest
      ? claimEvidenceRelationReferenceV01(latest)
      : null,
    competing_candidate_revisions: [],
    unresolved_lineage_conflict: false,
    canonical_applied_current_head_ref: null,
    review_decision_ref: null,
    transition_ref: null,
    relation_status: "not_established",
    notes: latest
      ? [
          "The highest contiguous revision is only the latest recorded relation candidate; no applied/current relation head or truth result is selected in SR-2.",
        ]
      : [
          "No Claim-Evidence relation candidate is recorded for this exact project-scoped family.",
        ],
  };
}

export function listRelationsForExactClaimV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & {
    claim_ref: ClaimRecordReferenceV01;
    limit?: number;
  },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimEvidenceRelationV01[] {
  const { scope, session } = materialReadScopeV01(db, input, readSession);
  const claimRef = exactClaimRefV01(input.claim_ref);
  assertClaimEndpointV01(db, scope, claimRef, new Map(), session);
  return listRelationsByEndpointV01(
    db,
    scope,
    {
      id_path: "$.claim_ref.record_id",
      fingerprint_path: "$.claim_ref.record_fingerprint",
      record_id: claimRef.record_id,
      record_fingerprint: claimRef.record_fingerprint,
      limit: listLimitV01(input.limit),
    },
    session,
  );
}

export function listRelationsForExactEvidenceV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01 & {
    evidence_ref: EvidenceRecordReferenceV01;
    limit?: number;
  },
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimEvidenceRelationV01[] {
  const { scope, session } = materialReadScopeV01(db, input, readSession);
  const evidenceRef = exactEvidenceRefV01(input.evidence_ref);
  assertEvidenceEndpointV01(db, scope, evidenceRef, new Map(), session);
  return listRelationsByEndpointV01(
    db,
    scope,
    {
      id_path: "$.evidence_ref.record_id",
      fingerprint_path: "$.evidence_ref.record_fingerprint",
      record_id: evidenceRef.record_id,
      record_fingerprint: evidenceRef.record_fingerprint,
      limit: listLimitV01(input.limit),
    },
    session,
  );
}

interface BatchPreflightV01 {
  evidence: EvidenceRecordV01[];
  claims: ClaimRecordV01[];
  relations: ClaimEvidenceRelationV01[];
}

export interface RunCriterionProjectVerifyMaterialSourceScopeV01 extends ProjectVerifyMaterialScopeV01 {
  receipt_id: string;
}

/**
 * Reconstruct the complete SR-1-derived SR-2 batch from canonical durable
 * sources. Callers cannot substitute embedded packet, receipt, assessment, or
 * proposal snapshots.
 */
export function resolveExpectedRunCriterionProjectVerifyMaterialV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialSourceScopeV01,
): RunCriterionProjectVerifyMaterialV01 {
  const scope = scopeV01(input);
  const receiptId = lookupTextV01(input.receipt_id, "receipt_id_invalid");
  const binding = readProjectRunResultSourceBindingV01(db, {
    ...scope,
    receipt_id: receiptId,
  });
  if (!binding.packet) refuseV01("run_project_verify_packet_missing");
  if (binding.criterion_assessment.status !== "available") {
    refuseV01("run_project_verify_assessment_unavailable");
  }
  const source = {
    packet: binding.packet,
    receipt: binding.receipt,
    assessment: binding.criterion_assessment.assessment,
  };
  const proposalMaterial = materializeRunAssessmentProposalV01(source);
  const identity = deriveRunAssessmentProposalAdmissionIdentityV01(source);
  const persistedProposal = readProposalForExactSourcePurposeV01(db, identity);
  if (!persistedProposal) refuseV01("run_project_verify_proposal_missing");
  assertCanonicalEqualV01(
    persistedProposal.proposal,
    proposalMaterial.proposal,
    "run_project_verify_proposal_material_conflict",
  );
  return materializeRunCriterionProjectVerifyMaterialV01({
    ...source,
    proposal: persistedProposal.proposal,
  });
}

function assertSourceBoundBatchV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  input: ProjectVerifyMaterialBatchInputV01,
  records: BatchPreflightV01,
): void {
  const containsReservedMaterial =
    records.evidence.some(isReservedRunCriterionEvidenceV01) ||
    records.claims.some(isReservedRunCriterionClaimV01) ||
    records.relations.some(isReservedRunCriterionRelationV01);
  if (!containsReservedMaterial) {
    if (input.source_bound_run !== undefined) {
      refuseV01("source_bound_run_material_unnecessary");
    }
    return;
  }
  if (!input.source_bound_run) {
    refuseV01("source_bound_run_material_required");
  }
  const expected = resolveExpectedRunCriterionProjectVerifyMaterialV01(db, {
    ...scope,
    receipt_id: input.source_bound_run.receipt_id,
  });
  if (
    input.source_bound_run.batch_idempotency_key !==
      expected.batch_idempotency_key ||
    !canonicalEqualV01(
      sortedByIdentityV01(records.evidence, (record) => record.evidence_id),
      sortedByIdentityV01(
        expected.evidence_records,
        (record) => record.evidence_id,
      ),
    ) ||
    !canonicalEqualV01(
      sortedByIdentityV01(records.claims, (record) => record.claim_id),
      sortedByIdentityV01(expected.claim_records, (record) => record.claim_id),
    ) ||
    !canonicalEqualV01(
      sortedByIdentityV01(records.relations, (record) => record.relation_id),
      sortedByIdentityV01(expected.relations, (record) => record.relation_id),
    )
  ) {
    refuseV01("source_bound_run_material_conflict");
  }
}

function preflightBatchV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  input: ProjectVerifyMaterialBatchInputV01,
): BatchPreflightV01 {
  const evidence = boundedBatchMembersV01(
    input.evidence_records,
    "evidence_batch_invalid",
  );
  const claims = boundedBatchMembersV01(
    input.claim_records,
    "claim_batch_invalid",
  );
  const relations = boundedBatchMembersV01(
    input.relations,
    "relation_batch_invalid",
  );
  if (evidence.length + claims.length + relations.length === 0) {
    refuseV01("project_verify_material_batch_empty");
  }
  const evidenceById = new Map<string, EvidenceRecordV01>();
  const claimById = new Map<string, ClaimRecordV01>();
  const relationById = new Map<string, ClaimEvidenceRelationV01>();
  const idempotencyByKind = {
    evidence_record: new Set<string>(),
    claim_record: new Set<string>(),
    claim_evidence_relation: new Set<string>(),
  };

  for (const record of evidence) {
    assertEvidenceInputV01(record, scope);
    addUniqueBatchIdentityV01(
      evidenceById,
      idempotencyByKind.evidence_record,
      record.evidence_id,
      record.idempotency_key,
      record,
      "evidence_batch_duplicate",
    );
    assertExactExistingEvidenceV01(db, scope, record);
  }
  for (const record of claims) {
    assertClaimInputV01(record, scope);
    addUniqueBatchIdentityV01(
      claimById,
      idempotencyByKind.claim_record,
      record.claim_id,
      record.idempotency_key,
      record,
      "claim_batch_duplicate",
    );
    assertExactExistingClaimV01(db, scope, record);
  }
  for (const record of relations) {
    assertRelationInputV01(record, scope);
    addUniqueBatchIdentityV01(
      relationById,
      idempotencyByKind.claim_evidence_relation,
      record.relation_id,
      record.idempotency_key,
      record,
      "relation_batch_duplicate",
    );
    assertExactExistingRelationV01(db, scope, record);
  }

  assertSourceBoundBatchV01(db, scope, input, {
    evidence,
    claims,
    relations,
  });

  const sortedClaims = [...claims].sort(
    (left, right) =>
      left.claim_family_id.localeCompare(right.claim_family_id) ||
      left.revision - right.revision,
  );
  const claimHistories = new Map<string, ClaimRecordV01[]>();
  for (const claim of sortedClaims) {
    const history =
      claimHistories.get(claim.claim_family_id) ??
      listClaimFamilyRevisionsV01(db, {
        ...scope,
        claim_family_id: claim.claim_family_id,
      });
    claimHistories.set(claim.claim_family_id, history);
    const existing = history.find(
      (candidate) => candidate.claim_id === claim.claim_id,
    );
    if (existing) {
      assertCanonicalEqualV01(existing, claim, "claim_record_conflict");
      continue;
    }
    if (history.length >= PROJECT_VERIFY_MATERIAL_MAX_LINEAGE_REVISIONS_V01) {
      refuseV01("claim_family_history_bound_exceeded");
    }
    assertClaimLineageAppendV01(claim, history);
    history.push(claim);
  }

  for (const claim of sortedClaims) {
    if (!claim.operation_target_claim_ref) continue;
    const target =
      claimById.get(claim.operation_target_claim_ref.record_id) ??
      readClaimRecordV01(db, {
        ...scope,
        claim_id: claim.operation_target_claim_ref.record_id,
      });
    if (
      !target ||
      target.integrity.fingerprint !==
        claim.operation_target_claim_ref.record_fingerprint ||
      target.claim_family_id !== claim.claim_family_id
    ) {
      refuseV01("claim_operation_target_conflict");
    }
  }

  for (const relation of relations) {
    assertClaimEndpointV01(db, scope, relation.claim_ref, claimById);
    const evidenceEndpoint = assertEvidenceEndpointV01(
      db,
      scope,
      relation.evidence_ref,
      evidenceById,
    );
    if (relation.trust_class !== evidenceEndpoint.trust_class) {
      refuseV01("relation_evidence_trust_conflict");
    }
  }
  const sortedRelations = [...relations].sort(
    (left, right) =>
      left.relation_family_id.localeCompare(right.relation_family_id) ||
      left.revision - right.revision,
  );
  const relationHistories = new Map<string, ClaimEvidenceRelationV01[]>();
  for (const relation of sortedRelations) {
    const history =
      relationHistories.get(relation.relation_family_id) ??
      listClaimEvidenceRelationFamilyRevisionsV01(db, {
        ...scope,
        relation_family_id: relation.relation_family_id,
      });
    relationHistories.set(relation.relation_family_id, history);
    const existing = history.find(
      (candidate) => candidate.relation_id === relation.relation_id,
    );
    if (existing) {
      assertCanonicalEqualV01(
        existing,
        relation,
        "claim_evidence_relation_conflict",
      );
      continue;
    }
    if (history.length >= PROJECT_VERIFY_MATERIAL_MAX_LINEAGE_REVISIONS_V01) {
      refuseV01("relation_family_history_bound_exceeded");
    }
    assertRelationLineageAppendV01(relation, history);
    history.push(relation);
  }

  return {
    evidence,
    claims: sortedClaims,
    relations: sortedRelations,
  };
}

function assertEvidenceInputV01(
  record: EvidenceRecordV01,
  scope: ProjectVerifyMaterialScopeV01,
): void {
  if (validateEvidenceRecordV01(record).status !== "valid") {
    refuseV01("evidence_record_invalid");
  }
  assertRecordScopeV01(record, scope, "evidence_record_scope_conflict");
}

function assertClaimInputV01(
  record: ClaimRecordV01,
  scope: ProjectVerifyMaterialScopeV01,
): void {
  if (validateClaimRecordV01(record).status !== "valid") {
    refuseV01("claim_record_invalid");
  }
  assertRecordScopeV01(record, scope, "claim_record_scope_conflict");
}

function assertRelationInputV01(
  record: ClaimEvidenceRelationV01,
  scope: ProjectVerifyMaterialScopeV01,
): void {
  if (validateClaimEvidenceRelationV01(record).status !== "valid") {
    refuseV01("claim_evidence_relation_invalid");
  }
  assertRecordScopeV01(record, scope, "claim_evidence_relation_scope_conflict");
}

function assertExactExistingEvidenceV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  record: EvidenceRecordV01,
): void {
  const existing = readExistingEnvelopeV01(db, scope, {
    record_kind: "evidence_record",
    record_id: record.evidence_id,
    idempotency_key: record.idempotency_key,
  });
  if (existing) {
    assertCanonicalEqualV01(
      evidenceFromEnvelopeV01(existing, scope),
      record,
      "evidence_record_conflict",
    );
  }
}

function assertExactExistingClaimV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  record: ClaimRecordV01,
): void {
  const existing = readExistingEnvelopeV01(db, scope, {
    record_kind: "claim_record",
    record_id: record.claim_id,
    idempotency_key: record.idempotency_key,
  });
  if (existing) {
    assertCanonicalEqualV01(
      claimFromEnvelopeV01(existing, scope),
      record,
      "claim_record_conflict",
    );
  }
}

function assertExactExistingRelationV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  record: ClaimEvidenceRelationV01,
): void {
  const existing = readExistingEnvelopeV01(db, scope, {
    record_kind: "claim_evidence_relation",
    record_id: record.relation_id,
    idempotency_key: record.idempotency_key,
  });
  if (existing) {
    assertCanonicalEqualV01(
      relationFromEnvelopeV01(existing, scope),
      record,
      "claim_evidence_relation_conflict",
    );
  }
}

function readExistingEnvelopeV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  input: {
    record_kind: "evidence_record" | "claim_record" | "claim_evidence_relation";
    record_id: string;
    idempotency_key: string;
  },
): VNextCoreRecordEnvelopeV01 | null {
  const byId = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: input.record_kind,
    record_id: input.record_id,
  });
  const byKey = readVNextCoreRecordByIdempotencyKeyV01(db, {
    ...scope,
    record_kind: input.record_kind,
    idempotency_key: input.idempotency_key,
  });
  if (byId && byKey && byId.record_id !== byKey.record_id) {
    refuseV01("project_verify_material_idempotency_conflict");
  }
  if (byKey && byKey.record_id !== input.record_id) {
    refuseV01("project_verify_material_idempotency_conflict");
  }
  return byId ?? byKey;
}

function assertClaimEndpointV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  ref: ClaimRecordReferenceV01,
  batch: Map<string, ClaimRecordV01>,
  readSession?: ProjectVerifyMaterialReadSessionV01,
): ClaimRecordV01 {
  const exactRef = exactClaimRefV01(ref);
  const record =
    batch.get(exactRef.record_id) ??
    readClaimRecordV01(
      db,
      { ...scope, claim_id: exactRef.record_id },
      readSession,
    );
  if (!record) refuseV01("relation_claim_endpoint_missing");
  if (record.integrity.fingerprint !== exactRef.record_fingerprint) {
    refuseV01("relation_claim_endpoint_fingerprint_conflict");
  }
  assertRecordScopeV01(record, scope, "relation_claim_endpoint_scope_conflict");
  return record;
}

function assertEvidenceEndpointV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  ref: EvidenceRecordReferenceV01,
  batch: Map<string, EvidenceRecordV01>,
  readSession?: ProjectVerifyMaterialReadSessionV01,
): EvidenceRecordV01 {
  const exactRef = exactEvidenceRefV01(ref);
  const record =
    batch.get(exactRef.record_id) ??
    readEvidenceRecordV01(
      db,
      { ...scope, evidence_id: exactRef.record_id },
      readSession,
    );
  if (!record) refuseV01("relation_evidence_endpoint_missing");
  if (record.integrity.fingerprint !== exactRef.record_fingerprint) {
    refuseV01("relation_evidence_endpoint_fingerprint_conflict");
  }
  assertRecordScopeV01(
    record,
    scope,
    "relation_evidence_endpoint_scope_conflict",
  );
  return record;
}

function assertClaimHistoryV01(revisions: ClaimRecordV01[]): void {
  const history: ClaimRecordV01[] = [];
  for (const revision of revisions) {
    assertClaimLineageAppendV01(revision, history);
    history.push(revision);
  }
}

function assertClaimLineageAppendV01(
  record: ClaimRecordV01,
  history: ClaimRecordV01[],
): void {
  const prior = history.at(-1) ?? null;
  const expectedRevision = prior ? prior.revision + 1 : 1;
  if (record.revision !== expectedRevision) {
    refuseV01("claim_revision_not_contiguous");
  }
  if (!prior) {
    if (
      record.prior_claim_ref !== null ||
      record.operation_intent !== "create"
    ) {
      refuseV01("claim_initial_lineage_conflict");
    }
    return;
  }
  if (
    !recordReferenceEqualV01(
      record.prior_claim_ref,
      claimRecordReferenceV01(prior),
    )
  ) {
    refuseV01("claim_prior_ref_conflict");
  }
  if (
    record.claim_family_id !== prior.claim_family_id ||
    record.workspace_id !== prior.workspace_id ||
    record.project_id !== prior.project_id ||
    !canonicalEqualV01(record.family_origin, prior.family_origin) ||
    !canonicalEqualV01(record.subject_refs, prior.subject_refs) ||
    !canonicalEqualV01(record.applicability_scope, prior.applicability_scope)
  ) {
    refuseV01("claim_family_lineage_conflict");
  }
  if (Date.parse(record.created_at) < Date.parse(prior.created_at)) {
    refuseV01("claim_lineage_time_conflict");
  }
  if (
    (record.operation_intent === "supersede" ||
      record.operation_intent === "retract") &&
    !recordReferenceEqualV01(
      record.operation_target_claim_ref,
      claimRecordReferenceV01(prior),
    )
  ) {
    refuseV01("claim_operation_target_conflict");
  }
  if (
    record.operation_intent === "retract" &&
    record.proposition !== prior.proposition
  ) {
    refuseV01("claim_retract_proposition_conflict");
  }
}

function assertRelationHistoryV01(revisions: ClaimEvidenceRelationV01[]): void {
  const history: ClaimEvidenceRelationV01[] = [];
  for (const revision of revisions) {
    assertRelationLineageAppendV01(revision, history);
    history.push(revision);
  }
}

function assertRelationLineageAppendV01(
  record: ClaimEvidenceRelationV01,
  history: ClaimEvidenceRelationV01[],
): void {
  const prior = history.at(-1) ?? null;
  const expectedRevision = prior ? prior.revision + 1 : 1;
  if (record.revision !== expectedRevision) {
    refuseV01("relation_revision_not_contiguous");
  }
  if (!prior) {
    if (
      record.prior_relation_ref !== null ||
      record.operation_intent !== "create"
    ) {
      refuseV01("relation_initial_lineage_conflict");
    }
    return;
  }
  if (
    !recordReferenceEqualV01(
      record.prior_relation_ref,
      claimEvidenceRelationReferenceV01(prior),
    )
  ) {
    refuseV01("relation_prior_ref_conflict");
  }
  if (
    record.relation_family_id !== prior.relation_family_id ||
    record.workspace_id !== prior.workspace_id ||
    record.project_id !== prior.project_id ||
    !canonicalEqualV01(record.family_origin, prior.family_origin) ||
    !recordReferenceEqualV01(record.claim_ref, prior.claim_ref) ||
    !recordReferenceEqualV01(record.evidence_ref, prior.evidence_ref) ||
    !canonicalEqualV01(record.applicability_scope, prior.applicability_scope)
  ) {
    refuseV01("relation_family_lineage_conflict");
  }
  if (Date.parse(record.created_at) < Date.parse(prior.created_at)) {
    refuseV01("relation_lineage_time_conflict");
  }
  if (
    record.operation_intent === "supersede" &&
    !recordReferenceEqualV01(
      record.supersedes_relation_ref,
      claimEvidenceRelationReferenceV01(prior),
    )
  ) {
    refuseV01("relation_supersedes_ref_conflict");
  }
  if (
    record.operation_intent === "retract" &&
    (record.relation_kind !== prior.relation_kind ||
      record.basis !== prior.basis ||
      record.trust_class !== prior.trust_class)
  ) {
    refuseV01("relation_retract_semantics_conflict");
  }
}

function writeEvidenceRecordV01(
  db: Database.Database,
  record: EvidenceRecordV01,
): {
  status: ProjectVerifyMaterialAdmissionStatusV01;
  record: EvidenceRecordV01;
} {
  const write = insertRecordV01(db, {
    record_kind: "evidence_record",
    record_id: record.evidence_id,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    fingerprint: record.integrity.fingerprint,
    idempotency_key: record.idempotency_key,
    payload: record,
    created_at: record.recorded_at,
  });
  return {
    status: write.status,
    record: evidenceFromEnvelopeV01(write.record, record),
  };
}

function writeClaimRecordV01(
  db: Database.Database,
  record: ClaimRecordV01,
): { status: ProjectVerifyMaterialAdmissionStatusV01; record: ClaimRecordV01 } {
  const write = insertRecordV01(db, {
    record_kind: "claim_record",
    record_id: record.claim_id,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    fingerprint: record.integrity.fingerprint,
    idempotency_key: record.idempotency_key,
    payload: record,
    created_at: record.created_at,
  });
  return {
    status: write.status,
    record: claimFromEnvelopeV01(write.record, record),
  };
}

function writeClaimEvidenceRelationV01(
  db: Database.Database,
  record: ClaimEvidenceRelationV01,
): {
  status: ProjectVerifyMaterialAdmissionStatusV01;
  record: ClaimEvidenceRelationV01;
} {
  const write = insertRecordV01(db, {
    record_kind: "claim_evidence_relation",
    record_id: record.relation_id,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
    fingerprint: record.integrity.fingerprint,
    idempotency_key: record.idempotency_key,
    payload: record,
    created_at: record.created_at,
  });
  return {
    status: write.status,
    record: relationFromEnvelopeV01(write.record, record),
  };
}

function insertRecordV01(
  db: Database.Database,
  record: VNextCoreRecordEnvelopeV01,
): VNextCoreRecordWriteResultV01 {
  try {
    return insertVNextCoreRecordV01(db, record);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "vnext_core_record_conflict"
    ) {
      refuseV01("project_verify_material_record_conflict");
    }
    throw error;
  }
}

function evidenceFromEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  expectedScope: ProjectVerifyMaterialScopeV01,
): EvidenceRecordV01 {
  if (validateEvidenceRecordV01(envelope.payload).status !== "valid") {
    refuseV01("persisted_evidence_record_invalid");
  }
  const record = envelope.payload as EvidenceRecordV01;
  assertEnvelopeV01(envelope, expectedScope, {
    record_id: record.evidence_id,
    fingerprint: record.integrity.fingerprint,
    idempotency_key: record.idempotency_key,
    created_at: record.recorded_at,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  return record;
}

function readClaimRecordEnvelopeOnlyV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  claimId: string,
): ClaimRecordV01 | null {
  const envelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "claim_record",
    record_id: claimId,
  });
  return envelope ? claimFromEnvelopeV01(envelope, scope) : null;
}

function claimFromEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  expectedScope: ProjectVerifyMaterialScopeV01,
): ClaimRecordV01 {
  if (validateClaimRecordV01(envelope.payload).status !== "valid") {
    refuseV01("persisted_claim_record_invalid");
  }
  const record = envelope.payload as ClaimRecordV01;
  assertEnvelopeV01(envelope, expectedScope, {
    record_id: record.claim_id,
    fingerprint: record.integrity.fingerprint,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  return record;
}

function readRelationEnvelopeOnlyV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  relationId: string,
): ClaimEvidenceRelationV01 | null {
  const envelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "claim_evidence_relation",
    record_id: relationId,
  });
  return envelope ? relationFromEnvelopeV01(envelope, scope) : null;
}

function relationFromEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  expectedScope: ProjectVerifyMaterialScopeV01,
): ClaimEvidenceRelationV01 {
  if (validateClaimEvidenceRelationV01(envelope.payload).status !== "valid") {
    refuseV01("persisted_claim_evidence_relation_invalid");
  }
  const record = envelope.payload as ClaimEvidenceRelationV01;
  assertEnvelopeV01(envelope, expectedScope, {
    record_id: record.relation_id,
    fingerprint: record.integrity.fingerprint,
    idempotency_key: record.idempotency_key,
    created_at: record.created_at,
    workspace_id: record.workspace_id,
    project_id: record.project_id,
  });
  return record;
}

function assertEnvelopeV01(
  envelope: VNextCoreRecordEnvelopeV01,
  expectedScope: ProjectVerifyMaterialScopeV01,
  expected: {
    record_id: string;
    fingerprint: string;
    idempotency_key: string;
    created_at: string;
    workspace_id: string;
    project_id: string;
  },
): void {
  try {
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(envelope, {
      workspace_id: expectedScope.workspace_id,
      project_id: expectedScope.project_id,
      fingerprint: expected.fingerprint,
    });
  } catch {
    refuseV01("project_verify_material_envelope_binding_conflict");
  }
  if (
    envelope.record_id !== expected.record_id ||
    envelope.fingerprint !== expected.fingerprint ||
    envelope.idempotency_key !== expected.idempotency_key ||
    envelope.created_at !== expected.created_at ||
    envelope.workspace_id !== expectedScope.workspace_id ||
    envelope.project_id !== expectedScope.project_id ||
    expected.workspace_id !== expectedScope.workspace_id ||
    expected.project_id !== expectedScope.project_id
  ) {
    refuseV01("project_verify_material_envelope_binding_conflict");
  }
}

function listRelationsByEndpointV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  input: {
    id_path: "$.claim_ref.record_id" | "$.evidence_ref.record_id";
    fingerprint_path:
      "$.claim_ref.record_fingerprint" | "$.evidence_ref.record_fingerprint";
    record_id: string;
    record_fingerprint: string;
    limit: number;
  },
  readSession: ProjectVerifyMaterialReadSessionV01,
): ClaimEvidenceRelationV01[] {
  const rows = db
    .prepare(
      `SELECT record_id
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'claim_evidence_relation'
         AND json_extract(payload_json, ?) = ?
         AND json_extract(payload_json, ?) = ?
       ORDER BY created_at DESC, record_id
       LIMIT ?`,
    )
    .all(
      scope.workspace_id,
      scope.project_id,
      input.id_path,
      input.record_id,
      input.fingerprint_path,
      input.record_fingerprint,
      input.limit,
    ) as Array<{ record_id: string }>;
  return rows.map(({ record_id: relationId }) => {
    const relation = readClaimEvidenceRelationV01(
      db,
      {
        ...scope,
        relation_id: relationId,
      },
      readSession,
    );
    if (!relation) refuseV01("claim_evidence_relation_record_missing");
    return relation;
  });
}

function boundedRecordIdentitiesV01(
  db: Database.Database,
  sql: string,
  parameters: Array<string | number>,
  boundCode: string,
): Array<{ record_id: string; fingerprint: string }> {
  const rows = db.prepare(sql).all(...parameters) as Array<{
    record_id: string;
    fingerprint: string;
  }>;
  if (rows.length > PROJECT_VERIFY_RECORD_LIST_LIMIT_V01) {
    refuseV01(boundCode);
  }
  return rows;
}

function withAtomicWriteV01<T>(
  db: Database.Database,
  savepointName: "project_verify_material_batch",
  operation: () => T,
): T {
  const ownsTransaction = !db.inTransaction;
  if (ownsTransaction) {
    db.exec("BEGIN IMMEDIATE");
  } else {
    db.exec(`SAVEPOINT ${savepointName}`);
  }
  try {
    const result = operation();
    if (ownsTransaction) db.exec("COMMIT");
    else db.exec(`RELEASE SAVEPOINT ${savepointName}`);
    return result;
  } catch (error) {
    if (ownsTransaction) {
      if (db.inTransaction) db.exec("ROLLBACK");
    } else if (db.inTransaction) {
      db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      db.exec(`RELEASE SAVEPOINT ${savepointName}`);
    }
    if (error instanceof ProjectVerifyMaterialStoreErrorV01) throw error;
    throw error;
  }
}

function addUniqueBatchIdentityV01<T>(
  records: Map<string, T>,
  idempotencyKeys: Set<string>,
  recordId: string,
  idempotencyKey: string,
  record: T,
  code: string,
): void {
  if (records.has(recordId) || idempotencyKeys.has(idempotencyKey)) {
    refuseV01(code);
  }
  records.set(recordId, record);
  idempotencyKeys.add(idempotencyKey);
}

function boundedBatchMembersV01<T>(value: T[], code: string): T[] {
  if (
    !Array.isArray(value) ||
    value.length > PROJECT_VERIFY_BATCH_MEMBER_LIMIT_V01
  ) {
    refuseV01(code);
  }
  return [...value];
}

function exactClaimRefV01(
  value: ClaimRecordReferenceV01,
): ClaimRecordReferenceV01 {
  if (
    !value ||
    value.record_kind !== "claim_record" ||
    !lookupTextV01(value.record_id, "claim_ref_invalid") ||
    !SHA256_PATTERN_V01.test(value.record_fingerprint)
  ) {
    refuseV01("claim_ref_invalid");
  }
  return { ...value };
}

function exactEvidenceRefV01(
  value: EvidenceRecordReferenceV01,
): EvidenceRecordReferenceV01 {
  if (
    !value ||
    value.record_kind !== "evidence_record" ||
    !lookupTextV01(value.record_id, "evidence_ref_invalid") ||
    !SHA256_PATTERN_V01.test(value.record_fingerprint)
  ) {
    refuseV01("evidence_ref_invalid");
  }
  return { ...value };
}

function assertRecordScopeV01(
  record: { workspace_id: string; project_id: string },
  scope: ProjectVerifyMaterialScopeV01,
  code: string,
): void {
  if (
    record.workspace_id !== scope.workspace_id ||
    record.project_id !== scope.project_id
  ) {
    refuseV01(code);
  }
}

function recordReferenceEqualV01(
  left:
    | ClaimRecordReferenceV01
    | EvidenceRecordReferenceV01
    | ClaimEvidenceRelationReferenceV01
    | null,
  right:
    | ClaimRecordReferenceV01
    | EvidenceRecordReferenceV01
    | ClaimEvidenceRelationReferenceV01,
): boolean {
  return Boolean(
    left &&
    left.record_kind === right.record_kind &&
    left.record_id === right.record_id &&
    left.record_fingerprint === right.record_fingerprint,
  );
}

function assertPersistedSourceAuthenticityV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  record: EvidenceRecordV01 | ClaimRecordV01 | ClaimEvidenceRelationV01,
  readSession: ProjectVerifyMaterialReadSessionStateV01,
): void {
  if (readSession.hasAuthenticatedRecord(record)) return;
  if ("evidence_version" in record) {
    if (isReservedRunCriterionEvidenceV01(record)) {
      const expected = readSession
        .resolveExpectedMaterial(db, scope, record.source_refs)
        .evidence_records.find(
          (candidate) => candidate.evidence_id === record.evidence_id,
        );
      if (!expected || !canonicalEqualV01(expected, record)) {
        refuseV01("source_bound_evidence_material_conflict");
      }
    }
  } else if ("claim_version" in record) {
    if (isReservedRunCriterionClaimV01(record)) {
      assertSourceBoundRunCriterionClaimV01(db, scope, record);
    }
  } else if (isReservedRunCriterionRelationV01(record)) {
    const expected = readSession
      .resolveExpectedMaterial(db, scope, record.source_refs)
      .relations.find(
        (candidate) => candidate.relation_id === record.relation_id,
      );
    if (!expected || !canonicalEqualV01(expected, record)) {
      refuseV01("source_bound_relation_material_conflict");
    }
  }
  readSession.rememberAuthenticatedRecord(record);
}

function assertSourceBoundRunCriterionClaimV01(
  db: Database.Database,
  scope: ProjectVerifyMaterialScopeV01,
  record: ClaimRecordV01,
): void {
  const packetRef = singleSourceRefV01(
    record.source_refs,
    "task_context_packet",
    "source_bound_claim_packet_ref_invalid",
  );
  const envelope = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "task_context_packet",
    record_id: packetRef.external_id,
  });
  if (!envelope) refuseV01("source_bound_claim_packet_missing");
  const packet = envelope.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet.generated_at,
    }).status !== "valid"
  ) {
    refuseV01("source_bound_claim_packet_invalid");
  }
  try {
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(envelope, {
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      fingerprint: packet.integrity.fingerprint,
    });
  } catch {
    refuseV01("source_bound_claim_packet_conflict");
  }
  if (
    packet.packet_id !== packetRef.external_id ||
    packet.integrity.fingerprint !== packetRef.source_ref ||
    packet.workspace_id !== scope.workspace_id ||
    packet.project_id !== scope.project_id
  ) {
    refuseV01("source_bound_claim_packet_conflict");
  }
  const criterionRef = singleSourceRefV01(
    record.source_refs,
    "criterion",
    "source_bound_claim_criterion_ref_invalid",
  );
  const expected = materializeRunCriterionClaimCandidateV01({
    packet,
    criterion: {
      criterion_id: criterionRef.external_id,
      criterion: record.proposition,
    },
  });
  if (!canonicalEqualV01(expected, record)) {
    refuseV01("source_bound_claim_material_conflict");
  }
}

function singleSourceRefV01(
  refs: ExternalRefV01[],
  refType: string,
  code: string,
): ExternalRefV01 {
  const matching = refs.filter((ref) => ref.ref_type === refType);
  if (matching.length !== 1) refuseV01(code);
  return matching[0]!;
}

function isReservedRunCriterionEvidenceV01(record: EvidenceRecordV01): boolean {
  return (
    ["direct_local_observation", "verified_external_observation"].includes(
      record.trust_class,
    ) ||
    record.evidence_kind === "exact_criterion_relation_material" ||
    record.identity_namespace ===
      RUN_CRITERION_EVIDENCE_IDENTITY_NAMESPACE_V01 ||
    isReservedRunCriterionProducerV01(record.producer)
  );
}

function isReservedRunCriterionClaimV01(record: ClaimRecordV01): boolean {
  return (
    record.revision === 1 &&
    record.family_origin.origin_namespace ===
      RUN_CRITERION_CLAIM_FAMILY_NAMESPACE_V01
  );
}

function isReservedRunCriterionRelationV01(
  record: ClaimEvidenceRelationV01,
): boolean {
  return (
    record.revision === 1 &&
    record.family_origin.origin_namespace ===
      RUN_CRITERION_RELATION_FAMILY_NAMESPACE_V01
  );
}

function isReservedRunCriterionProducerV01(
  producer: ProjectVerifyProducerV01,
): boolean {
  return (
    producer.producer_kind === "server_deterministic_evaluator" &&
    producer.producer_profile ===
      RUN_CRITERION_PROJECT_VERIFY_PRODUCER_PROFILE_V01
  );
}

function sortedByIdentityV01<T>(
  records: T[],
  identity: (record: T) => string,
): T[] {
  return [...records].sort((left, right) =>
    identity(left).localeCompare(identity(right)),
  );
}

function canonicalEqualV01(left: unknown, right: unknown): boolean {
  return (
    canonicalizeProjectVerifyMaterialV01(left) ===
    canonicalizeProjectVerifyMaterialV01(right)
  );
}

function assertCanonicalEqualV01(
  left: unknown,
  right: unknown,
  code: string,
): void {
  if (!canonicalEqualV01(left, right)) refuseV01(code);
}

function listLimitV01(value: number | undefined): number {
  const limit = value ?? PROJECT_VERIFY_RECORD_LIST_LIMIT_V01;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 256) {
    refuseV01("project_verify_material_list_limit_invalid");
  }
  return limit;
}

function materialReadScopeV01(
  db: Database.Database,
  input: ProjectVerifyMaterialScopeV01,
  readSession?: ProjectVerifyMaterialReadSessionV01,
): {
  scope: ProjectVerifyMaterialScopeV01;
  session: ProjectVerifyMaterialReadSessionV01;
  cache: ProjectVerifyMaterialReadSessionStateV01;
} {
  const scope = scopeV01(input);
  const session =
    readSession ?? createProjectVerifyMaterialReadSessionV01(db, scope);
  const cache = projectVerifyMaterialReadSessionStatesV01.get(session);
  if (!cache) refuseV01("project_verify_material_read_session_invalid");
  cache.assertScope(db, scope);
  return { scope, session, cache };
}

function readRecordCacheKeyV01(
  record: EvidenceRecordV01 | ClaimRecordV01 | ClaimEvidenceRelationV01,
): string {
  if ("evidence_version" in record) {
    return canonicalizeProjectVerifyMaterialV01({
      record_kind: "evidence_record",
      record_id: record.evidence_id,
      record_fingerprint: record.integrity.fingerprint,
    });
  }
  if ("claim_version" in record) {
    return canonicalizeProjectVerifyMaterialV01({
      record_kind: "claim_record",
      record_id: record.claim_id,
      record_fingerprint: record.integrity.fingerprint,
    });
  }
  return canonicalizeProjectVerifyMaterialV01({
    record_kind: "claim_evidence_relation",
    record_id: record.relation_id,
    record_fingerprint: record.integrity.fingerprint,
  });
}

function scopeV01(
  input: ProjectVerifyMaterialScopeV01,
): ProjectVerifyMaterialScopeV01 {
  return {
    workspace_id: lookupTextV01(input.workspace_id, "workspace_id_invalid"),
    project_id: lookupTextV01(input.project_id, "project_id_invalid"),
  };
}

function lookupTextV01(value: unknown, code: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    value.length > 256
  ) {
    refuseV01(code);
  }
  return value;
}

function refuseV01(code: string): never {
  throw new ProjectVerifyMaterialStoreErrorV01(code);
}
