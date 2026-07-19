import type Database from "better-sqlite3";

import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  admitProjectVerifyMaterialBatchV01,
  readClaimEvidenceRelationV01,
  readClaimRecordV01,
  readEvidenceRecordV01,
  resolveExpectedRunCriterionProjectVerifyMaterialV01,
  type ProjectVerifyMaterialAdmissionStatusV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import type {
  ClaimEvidenceRelationV01,
  ClaimRecordV01,
  EvidenceRecordV01,
  RunCriterionProjectVerifyMaterialV01,
} from "@/types/vnext/project-verify-material";

export const RUN_CRITERION_PROJECT_VERIFY_MATERIAL_ADMISSION_VERSION_V01 =
  "run_criterion_project_verify_material_admission.v0.1" as const;

export class RunCriterionProjectVerifyMaterialAdmissionErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RunCriterionProjectVerifyMaterialAdmissionErrorV01";
  }
}

export interface RunCriterionProjectVerifyMaterialScopeV01 {
  workspace_id: string;
  project_id: string;
  receipt_id: string;
}

export interface RunCriterionProjectVerifyMaterialAdmissionResultV01 {
  status: ProjectVerifyMaterialAdmissionStatusV01 | "no_exact_material";
  material: RunCriterionProjectVerifyMaterialV01;
}

/**
 * Explicit SR-2 writer for exact SR-1 criterion relation material. Source
 * packet, receipt, assessment, and proposal are reloaded and rematerialized
 * inside the same write transaction before any candidate record is admitted.
 * Nothing invokes this operation implicitly during proposal admission.
 */
export function admitRunCriterionProjectVerifyMaterialV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialScopeV01,
): RunCriterionProjectVerifyMaterialAdmissionResultV01 {
  return withAtomicSourceBoundOperationV01(db, () => {
    const material = resolveExpectedMaterialV01(db, input);
    if (!hasRecordsV01(material)) {
      return { status: "no_exact_material", material };
    }
    const admitted = admitProjectVerifyMaterialBatchV01(db, {
      workspace_id: material.workspace_id,
      project_id: material.project_id,
      evidence_records: material.evidence_records,
      claim_records: material.claim_records,
      relations: material.relations,
      source_bound_run: {
        receipt_id: input.receipt_id,
        batch_idempotency_key: material.batch_idempotency_key,
      },
    });
    assertMaterialArraysEqualV01(material, admitted);
    return { status: admitted.status, material };
  });
}

/**
 * Mandatory source-authenticity read for SR-1-derived Evidence and relations.
 * Generic readers also reauthenticate reserved records; this operation returns
 * the complete batch after recomputing it from the exact durable packet,
 * receipt, assessment, and proposal.
 */
export function readSourceBoundRunCriterionProjectVerifyMaterialV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialScopeV01,
): RunCriterionProjectVerifyMaterialV01 {
  const expected = resolveExpectedMaterialV01(db, input);
  const evidenceRecords = expected.evidence_records.map((record) => {
    const persisted = readEvidenceRecordV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      evidence_id: record.evidence_id,
    });
    if (!persisted) refuseV01("source_bound_evidence_missing");
    assertCanonicalEqualV01(
      persisted,
      record,
      "source_bound_evidence_material_conflict",
    );
    return persisted;
  });
  const claimRecords = expected.claim_records.map((record) => {
    const persisted = readClaimRecordV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      claim_id: record.claim_id,
    });
    if (!persisted) refuseV01("source_bound_claim_missing");
    assertCanonicalEqualV01(
      persisted,
      record,
      "source_bound_claim_material_conflict",
    );
    return persisted;
  });
  const relations = expected.relations.map((record) => {
    const persisted = readClaimEvidenceRelationV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      relation_id: record.relation_id,
    });
    if (!persisted) refuseV01("source_bound_relation_missing");
    assertCanonicalEqualV01(
      persisted,
      record,
      "source_bound_relation_material_conflict",
    );
    return persisted;
  });
  return {
    ...expected,
    evidence_records: evidenceRecords,
    claim_records: claimRecords,
    relations,
  };
}

export function readSourceBoundRunCriterionEvidenceRecordV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialScopeV01 & { evidence_id: string },
): EvidenceRecordV01 {
  const record = readSourceBoundRunCriterionProjectVerifyMaterialV01(
    db,
    input,
  ).evidence_records.find(
    (candidate) => candidate.evidence_id === input.evidence_id,
  );
  if (!record) refuseV01("source_bound_evidence_not_in_material");
  return record;
}

export function readSourceBoundRunCriterionClaimRecordV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialScopeV01 & { claim_id: string },
): ClaimRecordV01 {
  const record = readSourceBoundRunCriterionProjectVerifyMaterialV01(
    db,
    input,
  ).claim_records.find((candidate) => candidate.claim_id === input.claim_id);
  if (!record) refuseV01("source_bound_claim_not_in_material");
  return record;
}

export function readSourceBoundRunCriterionRelationV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialScopeV01 & { relation_id: string },
): ClaimEvidenceRelationV01 {
  const record = readSourceBoundRunCriterionProjectVerifyMaterialV01(
    db,
    input,
  ).relations.find((candidate) => candidate.relation_id === input.relation_id);
  if (!record) refuseV01("source_bound_relation_not_in_material");
  return record;
}

function resolveExpectedMaterialV01(
  db: Database.Database,
  input: RunCriterionProjectVerifyMaterialScopeV01,
): RunCriterionProjectVerifyMaterialV01 {
  return resolveExpectedRunCriterionProjectVerifyMaterialV01(db, input);
}

function assertMaterialArraysEqualV01(
  expected: RunCriterionProjectVerifyMaterialV01,
  actual: {
    evidence_records: EvidenceRecordV01[];
    claim_records: ClaimRecordV01[];
    relations: ClaimEvidenceRelationV01[];
  },
): void {
  assertCanonicalEqualV01(
    sortedRecordsV01(actual.evidence_records, (record) => record.evidence_id),
    sortedRecordsV01(expected.evidence_records, (record) => record.evidence_id),
    "run_project_verify_evidence_admission_conflict",
  );
  assertCanonicalEqualV01(
    sortedRecordsV01(actual.claim_records, (record) => record.claim_id),
    sortedRecordsV01(expected.claim_records, (record) => record.claim_id),
    "run_project_verify_claim_admission_conflict",
  );
  assertCanonicalEqualV01(
    sortedRecordsV01(actual.relations, (record) => record.relation_id),
    sortedRecordsV01(expected.relations, (record) => record.relation_id),
    "run_project_verify_relation_admission_conflict",
  );
}

function sortedRecordsV01<T>(
  records: T[],
  identity: (record: T) => string,
): T[] {
  return [...records].sort((left, right) =>
    identity(left).localeCompare(identity(right)),
  );
}

function hasRecordsV01(
  material: RunCriterionProjectVerifyMaterialV01,
): boolean {
  return (
    material.evidence_records.length > 0 ||
    material.claim_records.length > 0 ||
    material.relations.length > 0
  );
}

function withAtomicSourceBoundOperationV01<T>(
  db: Database.Database,
  operation: () => T,
): T {
  const ownsTransaction = !db.inTransaction;
  if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
  else db.exec("SAVEPOINT run_criterion_project_verify_material");
  try {
    const result = operation();
    if (ownsTransaction) db.exec("COMMIT");
    else db.exec("RELEASE SAVEPOINT run_criterion_project_verify_material");
    return result;
  } catch (error) {
    if (ownsTransaction) {
      if (db.inTransaction) db.exec("ROLLBACK");
    } else if (db.inTransaction) {
      db.exec("ROLLBACK TO SAVEPOINT run_criterion_project_verify_material");
      db.exec("RELEASE SAVEPOINT run_criterion_project_verify_material");
    }
    if (error instanceof RunCriterionProjectVerifyMaterialAdmissionErrorV01) {
      throw error;
    }
    throw error;
  }
}

function assertCanonicalEqualV01(
  actual: unknown,
  expected: unknown,
  code: string,
): void {
  if (
    canonicalizeProtocolValueV01(actual) !==
    canonicalizeProtocolValueV01(expected)
  ) {
    refuseV01(code);
  }
}

function refuseV01(code: string): never {
  throw new RunCriterionProjectVerifyMaterialAdmissionErrorV01(code);
}
