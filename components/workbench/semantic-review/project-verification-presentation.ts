import type {
  ProjectVerifyClaimFamilyProjectionV01,
  ProjectVerifyClaimRevisionProjectionV01,
  ProjectVerifyReconciliationV01,
  ProjectVerifyRelationFamilyProjectionV01,
  ProjectVerifyRelationRevisionProjectionV01,
} from "@/types/vnext/project-verify-reconciliation";
import type { ProjectVerifyLineageV01 } from "@/types/vnext/project-verify-lineage";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

export const PROJECT_VERIFICATION_WORKBENCH_PRESENTATION_VERSION_V01 =
  "project_verification_workbench_presentation.v0.1" as const;

const PROJECT_VERIFY_PROTOCOL_FINGERPRINT_TOKEN_V01 =
  /(?:[a-z0-9_-]+:)?sha256:[a-f0-9]{64}/gu;

/**
 * Keeps bounded Core prose readable without making an embedded fingerprint a
 * default user task. Exact refs remain available in the adjacent disclosure.
 */
export function boundedProjectVerifyDisplayTextV01(value: string): string {
  return value.replace(
    PROJECT_VERIFY_PROTOCOL_FINGERPRINT_TOKEN_V01,
    "exact reference (available in details)",
  );
}

/**
 * Structural presentation mapping over canonical Core reads. It does not
 * derive criterion meaning, choose a lifecycle source, select a current head,
 * calculate Claim truth, or invent a missing stage.
 */
export function projectVerificationWorkbenchPresentationV01(
  reconciliation: ProjectVerifyReconciliationV01,
  lineage?: ProjectVerifyLineageV01,
) {
  return {
    presentation_version:
      PROJECT_VERIFICATION_WORKBENCH_PRESENTATION_VERSION_V01,
    scope: {
      workspace_id: reconciliation.workspace_id,
      project_id: reconciliation.project_id,
      observed_at: reconciliation.observed_at,
    },
    completeness: reconciliation.completeness,
    authority: reconciliation.authority,
    criteria: reconciliation.criteria.map((entry) => ({
      criterion_id: entry.criterion.criterion_id,
      criterion: entry.criterion.criterion,
      status: entry.criterion.status,
      basis: entry.criterion.basis,
      supporting_count: entry.criterion.supporting_refs.length,
      opposing_count: entry.criterion.opposing_refs.length,
      missing_count: entry.criterion.missing_refs.length,
      uncertainty_count: entry.criterion.uncertainty.length,
    })),
    relation_counts: (
      [
        "supports",
        "opposes",
        "contradicts",
        "qualifies",
        "contextualizes",
        "insufficient",
      ] as const
    ).map((kind) => ({
      kind,
      pending: reconciliation.pending_relation_material[kind].length,
      applied: reconciliation.applied_relation_material[kind].length,
    })),
    claim_families: reconciliation.claim_families.map((family) => ({
      claim_family_id: family.claim_family_id,
      latest_recorded: findExactClaimRevisionV01(
        family,
        family.latest_recorded_candidate_ref,
      ),
      applied_current: findExactClaimRevisionV01(
        family,
        family.applied_current_head_ref,
      ),
      revisions: family.revisions,
      pending_revision_count: family.pending_revision_refs.length,
      previously_applied_count: family.previously_applied_refs.length,
      completeness: family.completeness,
    })),
    relation_families: reconciliation.relation_families.map((family) => ({
      relation_family_id: family.relation_family_id,
      latest_recorded: findExactRelationRevisionV01(
        family,
        family.latest_recorded_candidate_ref,
      ),
      applied_current: findExactRelationRevisionV01(
        family,
        family.applied_current_head_ref,
      ),
      revisions: family.revisions,
      pending_revision_count: family.pending_revision_refs.length,
      previously_applied_count: family.previously_applied_refs.length,
      completeness: family.completeness,
    })),
    conflicts: reconciliation.conflicts,
    later_context: reconciliation.later_context,
    summary: reconciliation.summary,
    selected_lineage: lineage
      ? {
          stop: lineage.stop,
          completeness: lineage.completeness,
          nodes: lineage.nodes.map((node) => ({
            node_kind: node.node_kind,
            status: node.status,
            authority_boundary: node.authority_boundary,
            exact_ref: node.exact_ref,
          })),
          conflicts: lineage.conflicts,
          authority: lineage.authority,
        }
      : null,
  };
}

export function findExactClaimRevisionV01(
  family: ProjectVerifyClaimFamilyProjectionV01,
  ref: ProjectVerifyClaimFamilyProjectionV01["latest_recorded_candidate_ref"],
): ProjectVerifyClaimRevisionProjectionV01 | null {
  if (!ref) return null;
  return (
    family.revisions.find(
      (revision) =>
        revision.claim_ref.record_id === ref.record_id &&
        revision.claim_ref.record_fingerprint === ref.record_fingerprint,
    ) ?? null
  );
}

export function findExactRelationRevisionV01(
  family: ProjectVerifyRelationFamilyProjectionV01,
  ref: ProjectVerifyRelationFamilyProjectionV01["latest_recorded_candidate_ref"],
): ProjectVerifyRelationRevisionProjectionV01 | null {
  if (!ref) return null;
  return (
    family.revisions.find(
      (revision) =>
        revision.relation_ref.record_id === ref.record_id &&
        revision.relation_ref.record_fingerprint === ref.record_fingerprint,
    ) ?? null
  );
}

export function runReceiptComparisonPresentationV01(
  receipts: RunReceiptV01[],
) {
  return {
    mode:
      receipts.length === 0
        ? ("unavailable" as const)
        : receipts.length === 1
          ? ("single" as const)
          : ("multiple" as const),
    receipts: receipts.map((receipt, source_index) => ({
      source_index,
      receipt_id: receipt.receipt_id,
      receipt_fingerprint: receipt.integrity.fingerprint,
      execution_status: receipt.execution.status,
      verification_status: receipt.verification.status,
      outcome: receipt.result_summary.outcome,
      check_count: receipt.checks.length,
      skipped_check_count: receipt.skipped_checks.length,
      artifact_count: receipt.artifact_refs.length,
      trust: receipt.trust_summary,
    })),
  };
}
