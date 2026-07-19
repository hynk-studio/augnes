import type Database from "better-sqlite3";

import {
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  PROJECT_VERIFY_LIFECYCLE_ADMISSION_VERSION_V01,
  ProjectVerifyLifecycleAdmissionErrorV01,
  materializeProjectVerifyLifecycleProposalStructuralOnlyV01 as materializeStructuralProposalV01,
  readProjectVerifyLifecycleProposalStructuralOnlyV01 as readStructuralProposalV01,
  type ProjectVerifyLifecycleStructuralSourceV01,
  type ProjectVerifyLifecycleStoreSelectionV01,
} from "@/lib/vnext/persistence/project-verify-lifecycle-source";
import {
  deriveProjectVerifyLifecycleProposalAdmissionIdentityV01,
  type ProjectVerifyLifecycleProposalAdmissionIdentityV01,
  type ProjectVerifyLifecycleProposalMaterializationV01,
  type ProjectVerifyLifecycleSelectedRecordV01,
} from "@/lib/vnext/project-verify-lifecycle";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  assertProjectVerifyLifecycleProposalFullCurrentHeadV01,
  assertProjectVerifyLifecycleProposalFullSourceBoundV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ProjectVerifyLifecycleCurrentHeadExpectationV01 } from "@/types/vnext/project-verify-lifecycle";

export {
  PROJECT_VERIFY_LIFECYCLE_ADMISSION_VERSION_V01,
  ProjectVerifyLifecycleAdmissionErrorV01,
};
export type { ProjectVerifyLifecycleStoreSelectionV01 };
export type ProjectVerifyLifecycleSourceAuthenticationV01 =
  ProjectVerifyLifecycleStructuralSourceV01;

/**
 * Public lifecycle materialization is source-authentic, not merely structural.
 * A present family head must replay through its exact immutable proposal,
 * ReviewDecision, gate, Transition receipt, state, and selected SR-2 record.
 */
export function materializePersistedProjectVerifyLifecycleProposalV01(
  db: Database.Database,
  input: ProjectVerifyLifecycleStoreSelectionV01,
): ProjectVerifyLifecycleProposalMaterializationV01 {
  const material = materializeStructuralProposalV01(db, input);
  assertProjectVerifyLifecycleProposalFullCurrentHeadV01(db, material.proposal);
  return material;
}

export function materializeProjectVerifyClaimLifecycleProposalV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    claim_id: string;
    observed_at: string;
  },
): ProjectVerifyLifecycleProposalMaterializationV01 {
  return materializePersistedProjectVerifyLifecycleProposalV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    entity_kind: "claim_record",
    selected_record_id: input.claim_id,
    observed_at: input.observed_at,
  });
}

export function materializeProjectVerifyRelationLifecycleProposalV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    relation_id: string;
    observed_at: string;
  },
): ProjectVerifyLifecycleProposalMaterializationV01 {
  return materializePersistedProjectVerifyLifecycleProposalV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    entity_kind: "claim_evidence_relation",
    selected_record_id: input.relation_id,
    observed_at: input.observed_at,
  });
}

/** Sole canonical lifecycle-proposal writer. */
export function admitProjectVerifyLifecycleProposalV01(
  db: Database.Database,
  input:
    | ProjectVerifyLifecycleProposalMaterializationV01
    | { expected: ProjectVerifyLifecycleProposalMaterializationV01 },
): {
  status: "inserted" | "exact_replay";
  proposal: EpisodeDeltaProposalV01;
} {
  const expected = "expected" in input ? input.expected : input;
  const ownsTransaction = !db.inTransaction;
  if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
  try {
    assertVNextDurableSemanticStoreSchemaV01(db);
    assertMaterializationIdentityV01(expected);
    const existing = readProjectVerifyLifecycleProposalByIdentityV01(
      db,
      expected.identity,
    );
    if (existing) {
      if (!canonicalEqualV01(existing.proposal, expected.proposal)) {
        refuseV01("project_verify_lifecycle_proposal_conflicting_replay");
      }
      if (ownsTransaction) db.exec("COMMIT");
      return { status: "exact_replay", proposal: existing.proposal };
    }

    const rematerialized =
      materializePersistedProjectVerifyLifecycleProposalV01(db, {
        workspace_id: expected.identity.workspace_id,
        project_id: expected.identity.project_id,
        entity_kind: expected.identity.entity_kind,
        selected_record_id: expected.identity.selected_record_ref.record_id,
        observed_at: expected.proposal.created_at,
      });
    if (!canonicalEqualV01(rematerialized, expected)) {
      refuseV01("project_verify_lifecycle_live_source_conflict");
    }
    const proposal = rematerialized.proposal;
    const write = insertVNextCoreRecordV01(db, {
      record_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      fingerprint: proposal.integrity.fingerprint,
      idempotency_key: rematerialized.identity.admission_idempotency_key,
      payload: proposal,
      created_at: proposal.created_at,
    });
    // The exact proposal was fully source-authenticated above while this same
    // BEGIN IMMEDIATE transaction owns the write boundary. Re-reading the new
    // immutable envelope only needs the structural reader; replay and every
    // public read still traverse the complete prior Transition source chain.
    const persisted = readStructuralProposalV01(db, rematerialized.identity);
    if (
      !persisted ||
      persisted.record.record_id !== write.record.record_id ||
      !canonicalEqualV01(persisted.proposal, proposal)
    ) {
      refuseV01("project_verify_lifecycle_proposal_envelope_conflict");
    }
    if (ownsTransaction) db.exec("COMMIT");
    return { status: write.status, proposal };
  } catch (error) {
    if (ownsTransaction && db.inTransaction) db.exec("ROLLBACK");
    if (error instanceof ProjectVerifyLifecycleAdmissionErrorV01) throw error;
    if (
      error instanceof Error &&
      error.message === "vnext_core_record_conflict"
    ) {
      refuseV01("project_verify_lifecycle_proposal_conflicting_replay");
    }
    throw error;
  }
}

export function readProjectVerifyLifecycleProposalByIdentityV01(
  db: Database.Database,
  identity: ProjectVerifyLifecycleProposalAdmissionIdentityV01,
) {
  const persisted = readStructuralProposalV01(db, identity);
  if (!persisted) return null;
  assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(
    db,
    persisted.proposal,
  );
  return persisted;
}

export function assertPersistedProjectVerifyLifecycleProposalSourceBoundV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyLifecycleSourceAuthenticationV01 {
  return assertProjectVerifyLifecycleProposalFullSourceBoundV01(db, proposal);
}

export const assertProjectVerifyLifecycleProposalSourceBoundV01 =
  assertPersistedProjectVerifyLifecycleProposalSourceBoundV01;

export function assertProjectVerifyLifecycleProposalCurrentHeadExpectationV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyLifecycleSourceAuthenticationV01 {
  return assertProjectVerifyLifecycleProposalFullCurrentHeadV01(db, proposal);
}

export function readProjectVerifyLifecycleCurrentHeadExpectationV01(
  db: Database.Database,
  selectedRecord: ProjectVerifyLifecycleSelectedRecordV01,
  observedAt: string,
): ProjectVerifyLifecycleCurrentHeadExpectationV01 {
  const selection: ProjectVerifyLifecycleStoreSelectionV01 =
    "claim_version" in selectedRecord
      ? {
          workspace_id: selectedRecord.workspace_id,
          project_id: selectedRecord.project_id,
          entity_kind: "claim_record",
          selected_record_id: selectedRecord.claim_id,
          observed_at: observedAt,
        }
      : {
          workspace_id: selectedRecord.workspace_id,
          project_id: selectedRecord.project_id,
          entity_kind: "claim_evidence_relation",
          selected_record_id: selectedRecord.relation_id,
          observed_at: observedAt,
        };
  const material = materializeStructuralProposalV01(db, selection);
  assertProjectVerifyLifecycleProposalFullCurrentHeadV01(db, material.proposal);
  return structuredClone(
    material.proposal.project_verify_lifecycle!.current_head_expectation,
  );
}

function assertMaterializationIdentityV01(
  material: ProjectVerifyLifecycleProposalMaterializationV01,
): void {
  const profile = material.proposal.project_verify_lifecycle;
  if (!profile) refuseV01("project_verify_lifecycle_proposal_profile_missing");
  const expected = deriveProjectVerifyLifecycleProposalAdmissionIdentityV01({
    workspace_id: profile.lifecycle_binding.workspace_id,
    project_id: profile.lifecycle_binding.project_id,
    entity_kind: profile.lifecycle_binding.entity_kind,
    family_id: profile.lifecycle_binding.family_id,
    selected_record_ref: profile.lifecycle_binding.selected_record_ref,
  });
  if (!canonicalEqualV01(expected, material.identity)) {
    refuseV01("project_verify_lifecycle_materialization_identity_conflict");
  }
}

function canonicalEqualV01(left: unknown, right: unknown): boolean {
  return (
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right)
  );
}

function refuseV01(code: string): never {
  throw new ProjectVerifyLifecycleAdmissionErrorV01(code);
}
