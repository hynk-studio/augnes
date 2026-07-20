import type Database from "better-sqlite3";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  readVNextCoreRecordV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextPersistedSemanticStateVersionV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  assertProjectVerifyLifecyclePersistedStateSourceBoundV01,
  loadValidatedVNextSemanticTransitionRelationV01,
  type VNextSemanticCommitGateRecordV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  readProjectVerifyReconciliationForLineageV01,
  ProjectVerifyReconciliationReadErrorV01,
  type ProjectVerifyReconciliationFocusV01,
} from "@/lib/vnext/runtime/project-verify-reconciliation";
import type { CriterionAssessmentItemV01 } from "@/types/vnext/criterion-assessment";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type {
  ExternalRefTrustClassV01,
  ExternalRefV01,
} from "@/types/vnext/external-ref";
import {
  PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01,
  PROJECT_VERIFY_LINEAGE_MAX_NODES_V01,
  PROJECT_VERIFY_LINEAGE_VERSION_V01,
  type ProjectVerifyLineageEdgeKindV01,
  type ProjectVerifyLineageEdgeV01,
  type ProjectVerifyLineageLookupV01,
  type ProjectVerifyLineageNodeKindV01,
  type ProjectVerifyLineageNodeStatusV01,
  type ProjectVerifyLineageNodeV01,
  type ProjectVerifyLineageStopV01,
  type ProjectVerifyLineageV01,
} from "@/types/vnext/project-verify-lineage";
import type {
  ProjectVerifyClaimRevisionProjectionV01,
  ProjectVerifyConflictV01,
  ProjectVerifyCriterionProjectionV01,
  ProjectVerifyEvidenceProjectionV01,
  ProjectVerifyExactProtocolRefV01,
  ProjectVerifyReconciliationV01,
  ProjectVerifyRelationRevisionProjectionV01,
  ProjectVerifyRevisionLifecycleV01,
} from "@/types/vnext/project-verify-reconciliation";
import { PROJECT_VERIFY_READ_MAX_IDENTIFIER_CHARACTERS_V01 } from "@/types/vnext/project-verify-reconciliation";
import type {
  ClaimEvidenceRelationReferenceV01,
  ClaimRecordReferenceV01,
  ClaimRecordV01,
  EvidenceRecordReferenceV01,
} from "@/types/vnext/project-verify-material";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";

const SHA256_V01 = /^sha256:[a-f0-9]{64}$/u;

export class ProjectVerifyLineageReadErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ProjectVerifyLineageReadErrorV01";
  }
}

export interface ReadProjectVerifyLineageInputV01 {
  workspace_id: string;
  project_id: string;
  observed_at: string;
  lookup: ProjectVerifyLineageLookupV01;
}

type RevisionProjectionV01 =
  | ProjectVerifyClaimRevisionProjectionV01
  | ProjectVerifyRelationRevisionProjectionV01;

interface SelectedGraphV01 {
  criteria: ProjectVerifyCriterionProjectionV01[];
  evidence: ProjectVerifyEvidenceProjectionV01[];
  claims: ProjectVerifyClaimRevisionProjectionV01[];
  relations: ProjectVerifyRelationRevisionProjectionV01[];
}

interface GraphBuilderV01 {
  nodes: Map<string, ProjectVerifyLineageNodeV01>;
  edges: Map<string, ProjectVerifyLineageEdgeV01>;
}

/**
 * Exact bounded lineage over the same source-authenticated material used by
 * reconciliation. Missing stages are represented as missing nodes and a
 * truthful stop reason; no read manufactures a decision, gate, Transition or
 * semantic meaning.
 */
export function readProjectVerifyLineageV01(
  db: Database.Database,
  input: ReadProjectVerifyLineageInputV01,
): ProjectVerifyLineageV01 {
  assertExactKeysV01(
    input,
    ["workspace_id", "project_id", "observed_at", "lookup"],
    "lineage_read_input_fields_invalid",
  );
  const workspaceId = requiredTextV01(
    input.workspace_id,
    "workspace_id_invalid",
  );
  const projectId = requiredTextV01(input.project_id, "project_id_invalid");
  const observedAt = requiredTimestampV01(
    input.observed_at,
    "observed_at_invalid",
  );
  validateLookupV01(input.lookup);

  let reconciliation: ProjectVerifyReconciliationV01;
  let focusBounded = false;
  try {
    const focused = readProjectVerifyReconciliationForLineageV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      observed_at: observedAt,
      focus: reconciliationFocusV01(input.lookup),
    });
    reconciliation = focused.reconciliation;
    focusBounded = focused.focus_bounded;
  } catch (error) {
    if (error instanceof ProjectVerifyReconciliationReadErrorV01) {
      throw new ProjectVerifyLineageReadErrorV01(
        `reconciliation_source_conflict:${error.code}`,
      );
    }
    throw error;
  }

  const selected = selectGraphV01(reconciliation, input.lookup);
  const graph: GraphBuilderV01 = { nodes: new Map(), edges: new Map() };
  buildCriterionAndMaterialGraphV01(graph, selected, workspaceId, projectId);
  const lifecycleRevisions: RevisionProjectionV01[] = [
    ...selected.claims,
    ...selected.relations,
  ];
  for (const revision of lifecycleRevisions) {
    buildLifecycleGraphV01(db, graph, reconciliation, revision, {
      workspace_id: workspaceId,
      project_id: projectId,
    });
  }
  buildRevisionEdgesV01(graph, selected);

  let stop = deriveStopV01(
    graph,
    lifecycleRevisions,
    reconciliation,
    input.lookup,
  );
  if (graph.nodes.size === 0) {
    stop = {
      stopped_at: "lookup",
      reason: lookupIdentityExistsV01(reconciliation, input.lookup)
        ? "source_conflict"
        : reconciliation.completeness.status === "bounded_incomplete"
          ? "bounded_incomplete"
          : "source_missing",
      exact_ref: null,
    };
  }
  addMissingStopNodeV01(graph, stop, workspaceId, projectId);

  const rootNodeIds = lineageRootNodeIdsV01(graph, selected, input.lookup);
  let nodes = [...graph.nodes.values()].sort((left, right) => {
    const leftRoot = rootNodeIds.has(left.node_id) ? 0 : 1;
    const rightRoot = rootNodeIds.has(right.node_id) ? 0 : 1;
    return leftRoot - rightRoot || left.node_id.localeCompare(right.node_id);
  });
  let edges = [...graph.edges.values()].sort((left, right) =>
    left.edge_id.localeCompare(right.edge_id),
  );
  const bounded =
    focusBounded ||
    nodes.length > PROJECT_VERIFY_LINEAGE_MAX_NODES_V01 ||
    edges.length > PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01;
  if (bounded) {
    nodes = nodes.slice(0, PROJECT_VERIFY_LINEAGE_MAX_NODES_V01);
    const retainedNodeIds = new Set(nodes.map((node) => node.node_id));
    edges = edges
      .filter(
        (edge) =>
          retainedNodeIds.has(edge.from_node_id) &&
          retainedNodeIds.has(edge.to_node_id),
      )
      .slice(0, PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01);
    stop = {
      stopped_at: "lookup",
      reason: "bounded_incomplete",
      exact_ref: null,
    };
  }
  const conflicts = selectedConflictsV01(
    reconciliation,
    lifecycleRevisions,
  ).filter(
    (conflict) => focusBounded || conflict.conflict_kind !== "bounded_read",
  );
  const withoutFingerprint = {
    lineage_version: PROJECT_VERIFY_LINEAGE_VERSION_V01,
    workspace_id: workspaceId,
    project_id: projectId,
    observed_at: observedAt,
    lookup: structuredClone(input.lookup),
    nodes,
    edges,
    stop,
    conflicts,
    bounds: {
      max_nodes: PROJECT_VERIFY_LINEAGE_MAX_NODES_V01,
      max_edges: PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01,
    },
    completeness: {
      status: bounded
        ? ("bounded_incomplete" as const)
        : conflicts.length > 0
          ? ("conflict" as const)
          : ("complete" as const),
      returned_items: nodes.length + edges.length,
      fixed_bound:
        PROJECT_VERIFY_LINEAGE_MAX_NODES_V01 +
        PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01,
      continuation_cursor: null,
      omitted_reason: bounded ? "project_verify_lineage_bound_exceeded" : null,
    },
    authority: structuredClone(reconciliation.authority),
  } satisfies Omit<ProjectVerifyLineageV01, "projection_fingerprint">;
  return {
    ...withoutFingerprint,
    projection_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

function reconciliationFocusV01(
  lookup: ProjectVerifyLineageLookupV01,
): ProjectVerifyReconciliationFocusV01 {
  switch (lookup.lookup_kind) {
    case "criterion":
      return {
        focus_kind: "criterion",
        criterion_id: lookup.criterion_id,
        packet_ref: structuredClone(lookup.packet_ref),
        receipt_ref: structuredClone(lookup.receipt_ref),
      };
    case "evidence":
      return { focus_kind: "evidence", evidence_id: lookup.evidence_id };
    case "claim":
      return { focus_kind: "claim", claim_id: lookup.claim_id };
    case "claim_family":
      return {
        focus_kind: "claim_family",
        claim_family_id: lookup.claim_family_id,
      };
    case "claim_evidence_relation":
      return {
        focus_kind: "claim_evidence_relation",
        relation_id: lookup.relation_id,
      };
    case "claim_evidence_relation_family":
      return {
        focus_kind: "claim_evidence_relation_family",
        relation_family_id: lookup.relation_family_id,
      };
    case "proposal":
      return { focus_kind: "proposal", proposal_id: lookup.proposal_id };
    case "transition_receipt":
      return {
        focus_kind: "transition_receipt",
        transition_receipt_id: lookup.transition_receipt_id,
      };
  }
}

function lineageRootNodeIdsV01(
  graph: GraphBuilderV01,
  selected: SelectedGraphV01,
  lookup: ProjectVerifyLineageLookupV01,
): Set<string> {
  const roots = new Set<string>();
  const add = (kind: ProjectVerifyLineageNodeKindV01, recordId: string) => {
    const node = findNodeV01(graph, kind, recordId);
    if (node) roots.add(node.node_id);
  };
  switch (lookup.lookup_kind) {
    case "criterion":
      for (const criterion of selected.criteria.filter(
        (item) =>
          item.criterion.criterion_id === lookup.criterion_id &&
          exactRefEqualV01(item.packet_ref, lookup.packet_ref) &&
          exactRefEqualV01(item.receipt_ref, lookup.receipt_ref),
      )) {
        const node = [...graph.nodes.values()].find(
          (candidate) =>
            candidate.node_kind === "criterion" &&
            candidate.record_id === lookup.criterion_id &&
            candidate.exact_ref !== null &&
            exactRefEqualV01(candidate.exact_ref, criterion.assessment_ref),
        );
        if (node) roots.add(node.node_id);
      }
      break;
    case "evidence":
      add("evidence_record", lookup.evidence_id);
      break;
    case "claim":
      add("claim_record", lookup.claim_id);
      break;
    case "claim_family":
      for (const claim of selected.claims) {
        if (claim.claim.claim_family_id === lookup.claim_family_id) {
          add("claim_record", claim.claim_ref.record_id);
        }
      }
      break;
    case "claim_evidence_relation":
      add("claim_evidence_relation", lookup.relation_id);
      break;
    case "claim_evidence_relation_family":
      for (const relation of selected.relations) {
        if (
          relation.relation.relation_family_id === lookup.relation_family_id
        ) {
          add("claim_evidence_relation", relation.relation_ref.record_id);
        }
      }
      break;
    case "proposal":
      for (const revision of [...selected.claims, ...selected.relations]) {
        if (
          revision.lifecycle.review.proposal_ref?.record_id ===
          lookup.proposal_id
        ) {
          const candidateId =
            revision.lifecycle.review.proposal_candidate_ref?.record_id;
          if (candidateId) add("episode_delta_proposal_candidate", candidateId);
        }
      }
      break;
    case "transition_receipt":
      add("state_transition_receipt_effect", lookup.transition_receipt_id);
      break;
  }
  return roots;
}

function selectGraphV01(
  reconciliation: ProjectVerifyReconciliationV01,
  lookup: ProjectVerifyLineageLookupV01,
): SelectedGraphV01 {
  const allClaims = reconciliation.claim_families.flatMap(
    (family) => family.revisions,
  );
  const allRelations = reconciliation.relation_families.flatMap(
    (family) => family.revisions,
  );
  const selected: SelectedGraphV01 = {
    criteria: [],
    evidence: [],
    claims: [],
    relations: [],
  };
  switch (lookup.lookup_kind) {
    case "criterion":
      selected.criteria = reconciliation.criteria.filter(
        (criterion) =>
          criterion.criterion.criterion_id === lookup.criterion_id &&
          exactRefEqualV01(criterion.packet_ref, lookup.packet_ref) &&
          exactRefEqualV01(criterion.receipt_ref, lookup.receipt_ref),
      );
      break;
    case "evidence":
      selected.evidence = reconciliation.evidence.filter(
        (evidence) =>
          evidence.evidence_ref.record_id === lookup.evidence_id &&
          (!lookup.expected_fingerprint ||
            evidence.evidence_ref.record_fingerprint ===
              lookup.expected_fingerprint),
      );
      break;
    case "claim":
      selected.claims = allClaims.filter(
        (claim) =>
          claim.claim_ref.record_id === lookup.claim_id &&
          (!lookup.expected_fingerprint ||
            claim.claim_ref.record_fingerprint === lookup.expected_fingerprint),
      );
      break;
    case "claim_family":
      selected.claims = reconciliation.claim_families
        .filter((family) => family.claim_family_id === lookup.claim_family_id)
        .flatMap((family) => family.revisions);
      break;
    case "claim_evidence_relation":
      selected.relations = allRelations.filter(
        (relation) =>
          relation.relation_ref.record_id === lookup.relation_id &&
          (!lookup.expected_fingerprint ||
            relation.relation_ref.record_fingerprint ===
              lookup.expected_fingerprint),
      );
      break;
    case "claim_evidence_relation_family":
      selected.relations = reconciliation.relation_families
        .filter(
          (family) => family.relation_family_id === lookup.relation_family_id,
        )
        .flatMap((family) => family.revisions);
      break;
    case "proposal":
      selected.claims = allClaims.filter((claim) =>
        matchesLifecycleProtocolRefV01(
          claim.lifecycle.review.proposal_ref,
          lookup.proposal_id,
          lookup.expected_fingerprint,
        ),
      );
      selected.relations = allRelations.filter((relation) =>
        matchesLifecycleProtocolRefV01(
          relation.lifecycle.review.proposal_ref,
          lookup.proposal_id,
          lookup.expected_fingerprint,
        ),
      );
      break;
    case "transition_receipt":
      selected.claims = allClaims.filter((claim) =>
        matchesLifecycleProtocolRefV01(
          claim.lifecycle.transition.transition_receipt_ref,
          lookup.transition_receipt_id,
          lookup.expected_fingerprint,
        ),
      );
      selected.relations = allRelations.filter((relation) =>
        matchesLifecycleProtocolRefV01(
          relation.lifecycle.transition.transition_receipt_ref,
          lookup.transition_receipt_id,
          lookup.expected_fingerprint,
        ),
      );
      break;
  }
  expandGraphSelectionV01(reconciliation, selected);
  return selected;
}

function lookupIdentityExistsV01(
  reconciliation: ProjectVerifyReconciliationV01,
  lookup: ProjectVerifyLineageLookupV01,
): boolean {
  const claims = reconciliation.claim_families.flatMap(
    (family) => family.revisions,
  );
  const relations = reconciliation.relation_families.flatMap(
    (family) => family.revisions,
  );
  switch (lookup.lookup_kind) {
    case "criterion":
      return reconciliation.criteria.some(
        (item) =>
          item.criterion.criterion_id === lookup.criterion_id &&
          item.packet_ref.record_id === lookup.packet_ref.record_id &&
          item.receipt_ref.record_id === lookup.receipt_ref.record_id,
      );
    case "evidence":
      return reconciliation.evidence.some(
        (item) => item.evidence_ref.record_id === lookup.evidence_id,
      );
    case "claim":
      return claims.some(
        (item) => item.claim_ref.record_id === lookup.claim_id,
      );
    case "claim_family":
      return reconciliation.claim_families.some(
        (family) => family.claim_family_id === lookup.claim_family_id,
      );
    case "claim_evidence_relation":
      return relations.some(
        (item) => item.relation_ref.record_id === lookup.relation_id,
      );
    case "claim_evidence_relation_family":
      return reconciliation.relation_families.some(
        (family) => family.relation_family_id === lookup.relation_family_id,
      );
    case "proposal":
      return [...claims, ...relations].some(
        (item) =>
          item.lifecycle.review.proposal_ref?.record_id === lookup.proposal_id,
      );
    case "transition_receipt":
      return [...claims, ...relations].some(
        (item) =>
          item.lifecycle.transition.transition_receipt_ref?.record_id ===
          lookup.transition_receipt_id,
      );
  }
}

function expandGraphSelectionV01(
  reconciliation: ProjectVerifyReconciliationV01,
  selected: SelectedGraphV01,
): void {
  const allClaims = reconciliation.claim_families.flatMap(
    (family) => family.revisions,
  );
  const allRelations = reconciliation.relation_families.flatMap(
    (family) => family.revisions,
  );
  let changed = true;
  while (changed) {
    changed = false;
    const selectedClaimFamilies = new Set(
      selected.claims.map((item) => item.claim.claim_family_id),
    );
    changed =
      addUniqueV01(
        selected.claims,
        allClaims.filter((item) =>
          selectedClaimFamilies.has(item.claim.claim_family_id),
        ),
        (item) => item.claim_ref.record_id,
      ) || changed;
    const selectedRelationFamilies = new Set(
      selected.relations.map((item) => item.relation.relation_family_id),
    );
    changed =
      addUniqueV01(
        selected.relations,
        allRelations.filter((item) =>
          selectedRelationFamilies.has(item.relation.relation_family_id),
        ),
        (item) => item.relation_ref.record_id,
      ) || changed;
    const criterionRelationRefs = selected.criteria.flatMap((criterion) => [
      ...criterion.criterion.supporting_refs,
      ...criterion.criterion.opposing_refs,
      ...criterion.criterion.missing_refs,
    ]);
    changed =
      addUniqueV01(
        selected.evidence,
        reconciliation.evidence.filter((evidence) =>
          evidence.source_refs.some((source) =>
            criterionRelationRefs.some(
              (criterionRef) => canonical(source) === canonical(criterionRef),
            ),
          ),
        ),
        (item) => item.evidence_ref.record_id,
      ) || changed;
    const evidenceIds = new Set(
      selected.evidence.map((item) => item.evidence_ref.record_id),
    );
    changed =
      addUniqueV01(
        selected.relations,
        allRelations.filter((item) =>
          evidenceIds.has(item.relation.evidence_ref.record_id),
        ),
        (item) => item.relation_ref.record_id,
      ) || changed;
    const selectedClaimIds = new Set(
      selected.claims.map((item) => item.claim_ref.record_id),
    );
    changed =
      addUniqueV01(
        selected.relations,
        allRelations.filter((item) =>
          selectedClaimIds.has(item.relation.claim_ref.record_id),
        ),
        (item) => item.relation_ref.record_id,
      ) || changed;
    const relationClaimIds = new Set(
      selected.relations.map((item) => item.relation.claim_ref.record_id),
    );
    changed =
      addUniqueV01(
        selected.claims,
        allClaims.filter((item) =>
          relationClaimIds.has(item.claim_ref.record_id),
        ),
        (item) => item.claim_ref.record_id,
      ) || changed;
    const relationEvidenceIds = new Set(
      selected.relations.map((item) => item.relation.evidence_ref.record_id),
    );
    changed =
      addUniqueV01(
        selected.evidence,
        reconciliation.evidence.filter((item) =>
          relationEvidenceIds.has(item.evidence_ref.record_id),
        ),
        (item) => item.evidence_ref.record_id,
      ) || changed;
    const evidenceSourceRefs = selected.evidence.flatMap(
      (item) => item.source_refs,
    );
    changed =
      addUniqueV01(
        selected.criteria,
        reconciliation.criteria.filter((criterion) =>
          [
            ...criterion.criterion.supporting_refs,
            ...criterion.criterion.opposing_refs,
            ...criterion.criterion.missing_refs,
          ].some((ref) =>
            evidenceSourceRefs.some(
              (source) => canonical(source) === canonical(ref),
            ),
          ),
        ),
        criterionProjectionIdentityV01,
      ) || changed;
  }
  selected.criteria.sort((left, right) =>
    criterionProjectionIdentityV01(left).localeCompare(
      criterionProjectionIdentityV01(right),
    ),
  );
  selected.evidence.sort((left, right) =>
    left.evidence_ref.record_id.localeCompare(right.evidence_ref.record_id),
  );
  selected.claims.sort((left, right) =>
    left.claim_ref.record_id.localeCompare(right.claim_ref.record_id),
  );
  selected.relations.sort((left, right) =>
    left.relation_ref.record_id.localeCompare(right.relation_ref.record_id),
  );
}

function criterionProjectionIdentityV01(
  criterion: ProjectVerifyCriterionProjectionV01,
): string {
  return canonical({
    packet_ref: criterion.packet_ref,
    receipt_ref: criterion.receipt_ref,
    assessment_ref: criterion.assessment_ref,
    criterion_id: criterion.criterion.criterion_id,
  });
}

function buildCriterionAndMaterialGraphV01(
  graph: GraphBuilderV01,
  selected: SelectedGraphV01,
  workspaceId: string,
  projectId: string,
): void {
  for (const criterion of selected.criteria) {
    const criterionNode = addNodeV01(graph, {
      node_kind: "criterion",
      identity: criterionProjectionIdentityV01(criterion),
      status: "present",
      exact_ref: criterion.assessment_ref,
      record_id: criterion.criterion.criterion_id,
      record_fingerprint: criterion.assessment_ref.record_fingerprint,
      source_refs: [
        ...criterion.criterion.supporting_refs,
        ...criterion.criterion.opposing_refs,
        ...criterion.criterion.missing_refs,
      ],
      trust_class: criterionTrustV01(criterion.criterion),
      recorded_at: null,
      workspace_id: workspaceId,
      project_id: projectId,
      authority_boundary: "support_not_truth",
    });
    for (const ref of [
      ...criterion.criterion.supporting_refs,
      ...criterion.criterion.opposing_refs,
      ...criterion.criterion.missing_refs,
    ]) {
      const residueNode = addNodeV01(graph, {
        node_kind: "criterion_relation_residue",
        identity: canonical(ref),
        status: "present",
        exact_ref: null,
        record_id: ref.external_id,
        record_fingerprint: SHA256_V01.test(ref.source_ref ?? "")
          ? ref.source_ref!
          : null,
        source_refs: [ref],
        trust_class: ref.trust_class,
        recorded_at: ref.observed_at ?? null,
        workspace_id: workspaceId,
        project_id: projectId,
        authority_boundary: "support_not_truth",
      });
      addEdgeV01(
        graph,
        "criterion_has_exact_residue",
        criterionNode,
        residueNode,
        "present",
        [ref],
      );
    }
  }
  for (const evidence of selected.evidence) {
    const evidenceNode = addNodeV01(graph, {
      node_kind: "evidence_record",
      identity: evidence.evidence_ref.record_id,
      status: "present",
      exact_ref: materialRefToExactV01(evidence.evidence_ref),
      record_id: evidence.evidence_ref.record_id,
      record_fingerprint: evidence.evidence_ref.record_fingerprint,
      source_refs: evidence.source_refs,
      trust_class: evidence.trust_class,
      recorded_at: evidence.evidence.recorded_at,
      workspace_id: workspaceId,
      project_id: projectId,
      authority_boundary: "support_not_truth",
    });
    for (const residue of [...graph.nodes.values()].filter(
      (node) =>
        node.node_kind === "criterion_relation_residue" &&
        node.source_refs.some((source) =>
          evidence.source_refs.some(
            (candidate) => canonical(source) === canonical(candidate),
          ),
        ),
    )) {
      addEdgeV01(
        graph,
        "residue_materialized_as_evidence",
        residue,
        evidenceNode,
        "present",
        evidence.source_refs,
      );
    }
  }
  for (const claim of selected.claims) {
    addNodeV01(graph, {
      node_kind: "claim_record",
      identity: claim.claim_ref.record_id,
      status: lifecycleNodeStatusV01(claim.lifecycle),
      exact_ref: materialRefToExactV01(claim.claim_ref),
      record_id: claim.claim_ref.record_id,
      record_fingerprint: claim.claim_ref.record_fingerprint,
      source_refs: claim.claim.source_refs,
      trust_class: producerTrustV01(claim.claim),
      recorded_at: claim.claim.created_at,
      workspace_id: workspaceId,
      project_id: projectId,
      authority_boundary: "candidate_not_command",
    });
  }
  for (const relation of selected.relations) {
    const relationNode = addNodeV01(graph, {
      node_kind: "claim_evidence_relation",
      identity: relation.relation_ref.record_id,
      status: lifecycleNodeStatusV01(relation.lifecycle),
      exact_ref: materialRefToExactV01(relation.relation_ref),
      record_id: relation.relation_ref.record_id,
      record_fingerprint: relation.relation_ref.record_fingerprint,
      source_refs: relation.relation.source_refs,
      trust_class: relation.relation.trust_class,
      recorded_at: relation.relation.created_at,
      workspace_id: workspaceId,
      project_id: projectId,
      authority_boundary: "support_not_truth",
    });
    const evidenceNode = findNodeV01(
      graph,
      "evidence_record",
      relation.relation.evidence_ref.record_id,
    );
    const claimNode = findNodeV01(
      graph,
      "claim_record",
      relation.relation.claim_ref.record_id,
    );
    if (evidenceNode) {
      addEdgeV01(
        graph,
        "evidence_related_to_claim",
        evidenceNode,
        relationNode,
        "present",
        relation.relation.source_refs,
      );
    }
    if (claimNode) {
      addEdgeV01(
        graph,
        "evidence_related_to_claim",
        relationNode,
        claimNode,
        "present",
        relation.relation.source_refs,
      );
    }
  }
}

function buildLifecycleGraphV01(
  db: Database.Database,
  graph: GraphBuilderV01,
  reconciliation: ProjectVerifyReconciliationV01,
  revision: RevisionProjectionV01,
  scope: { workspace_id: string; project_id: string },
): void {
  const recordRef = recordRefV01(revision);
  const recordNode = findNodeV01(
    graph,
    "claim_ref" in revision ? "claim_record" : "claim_evidence_relation",
    recordRef.record_id,
  );
  if (!recordNode) return;
  const lifecycle = revision.lifecycle;
  const proposalRef = lifecycle.review.proposal_ref;
  if (!proposalRef) return;
  const proposal = loadProposalV01(db, scope, proposalRef);
  const candidate = proposal.proposed_deltas[0]!;
  const candidateNode = addNodeV01(graph, {
    node_kind: "episode_delta_proposal_candidate",
    identity: candidate.candidate_id,
    status: candidateStatusV01(lifecycle),
    exact_ref: lifecycle.review.proposal_candidate_ref,
    record_id: candidate.candidate_id,
    record_fingerprint:
      lifecycle.review.proposal_candidate_ref?.record_fingerprint ?? null,
    source_refs: candidate.source_refs,
    trust_class: "derived_interpretation",
    recorded_at: proposal.created_at,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    authority_boundary: "candidate_not_command",
  });
  addEdgeV01(
    graph,
    "claim_or_relation_selected_by_candidate",
    recordNode,
    candidateNode,
    "present",
    candidate.source_refs,
  );

  const decisionRef = lifecycle.decision.decision_ref;
  if (!decisionRef) return;
  const decision = loadDecisionV01(db, scope, decisionRef);
  const decisionNode = addNodeV01(graph, {
    node_kind: "review_decision",
    identity: decision.decision_id,
    status:
      decision.decision === "reject"
        ? "rejected"
        : decision.decision === "defer"
          ? "deferred"
          : "present",
    exact_ref: decisionRef,
    record_id: decision.decision_id,
    record_fingerprint: decision.integrity.fingerprint,
    source_refs: decision.decision_basis_refs,
    trust_class: decision.actor_ref.trust_class,
    recorded_at: decision.decided_at,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    authority_boundary: "decision_not_transition",
  });
  addEdgeV01(
    graph,
    "candidate_reviewed_by_decision",
    candidateNode,
    decisionNode,
    "present",
    decision.decision_basis_refs,
  );

  const gateRef = lifecycle.gate.gate_ref;
  if (!gateRef) return;
  const gate = loadGateV01(db, scope, gateRef);
  const gateNode = addNodeV01(graph, {
    node_kind: "semantic_commit_gate",
    identity: gate.gate_record_id,
    status: lifecycle.gate.status === "expired" ? "expired" : "gate_authorized",
    exact_ref: gateRef,
    record_id: gate.gate_record_id,
    record_fingerprint: gate.integrity.fingerprint,
    source_refs: gate.semantic_commit_gate_evaluation.source_refs,
    trust_class: gate.confirmation_observation_ref.trust_class,
    recorded_at: gate.confirmed_at,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    authority_boundary:
      lifecycle.gate.status === "expired"
        ? "expired_gate_not_applied"
        : "gate_authorized_not_applied",
  });
  addEdgeV01(
    graph,
    "decision_authorized_by_gate",
    decisionNode,
    gateNode,
    "present",
    gate.semantic_commit_gate_evaluation.source_refs,
  );

  const transitionRef = lifecycle.transition.transition_receipt_ref;
  if (!transitionRef) return;
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    ...scope,
    transition_receipt_id: transitionRef.record_id,
    transition_receipt_fingerprint: transitionRef.record_fingerprint,
  });
  const transitionNode = addNodeV01(graph, {
    node_kind: "state_transition_receipt_effect",
    identity: transition.receipt.transition_receipt_id,
    status:
      lifecycle.application.status === "applied_retracted"
        ? "retracted"
        : lifecycle.application.status === "applied_superseded"
          ? "superseded"
          : "applied",
    exact_ref: transitionRef,
    record_id: transition.receipt.transition_receipt_id,
    record_fingerprint: transition.receipt.integrity.fingerprint,
    source_refs: transition.receipt.source_refs,
    trust_class: transition.receipt.applied_by_ref.trust_class,
    recorded_at: transition.receipt.recorded_at,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    authority_boundary: "applied_transition",
  });
  addEdgeV01(
    graph,
    "gate_applied_by_transition",
    gateNode,
    transitionNode,
    "present",
    transition.receipt.source_refs,
  );
  addTransitionStateAndContextV01(
    db,
    graph,
    reconciliation,
    transition.receipt,
    transitionNode,
    proposal,
    scope,
  );
}

function addTransitionStateAndContextV01(
  db: Database.Database,
  graph: GraphBuilderV01,
  reconciliation: ProjectVerifyReconciliationV01,
  receipt: StateTransitionReceiptV01,
  transitionNode: ProjectVerifyLineageNodeV01,
  proposal: EpisodeDeltaProposalV01,
  scope: { workspace_id: string; project_id: string },
): void {
  const targetRef =
    proposal.project_verify_lifecycle?.lifecycle_binding.family_target_ref;
  const effect = receipt.effects.find(
    (candidate) => canonical(candidate.target_ref) === canonical(targetRef),
  );
  if (!effect) failV01("lineage_transition_effect_missing");
  let compiledSourceNode = transitionNode;
  let laterPacketEdgeKind: ProjectVerifyLineageEdgeKindV01 =
    "transition_context_compiled_into_later_packet";
  if (effect.after_state.presence === "present") {
    const stateEnvelope = readVNextCoreRecordV01(db, {
      ...scope,
      record_kind: "semantic_state",
      record_id: effect.durable_record_ref.external_id,
    });
    if (!stateEnvelope) failV01("lineage_semantic_state_missing");
    const state = rebuildVNextPersistedSemanticStateV01(stateEnvelope.payload);
    if (
      stateEnvelope.record_id !== state.semantic_state_record_id ||
      stateEnvelope.fingerprint !== state.integrity.fingerprint ||
      stateEnvelope.created_at !== state.created_at ||
      state.workspace_id !== scope.workspace_id ||
      state.project_id !== scope.project_id ||
      canonical(state.state_ref) !== canonical(effect.after_state.state_ref) ||
      state.source_proposal_id !== proposal.proposal_id ||
      canonical(state.state_content.project_verify_lifecycle_binding) !==
        canonical(proposal.project_verify_lifecycle?.lifecycle_binding)
    ) {
      failV01("lineage_semantic_state_source_conflict");
    }
    try {
      assertProjectVerifyLifecyclePersistedStateSourceBoundV01(db, {
        state,
        transition_receipt_id: receipt.transition_receipt_id,
        transition_receipt_fingerprint: receipt.integrity.fingerprint,
      });
    } catch {
      failV01("lineage_semantic_state_source_conflict");
    }
    const stateNode = semanticStateNodeV01(state, scope);
    addNodeObjectV01(graph, stateNode);
    compiledSourceNode = stateNode;
    laterPacketEdgeKind = "semantic_state_compiled_into_later_packet";
    addEdgeV01(
      graph,
      "transition_wrote_semantic_state",
      transitionNode,
      stateNode,
      "present",
      [effect.durable_record_ref],
    );
  }
  const lifecycle = findLifecycleByTransitionV01(
    reconciliation,
    receipt.transition_receipt_id,
  );
  const headRef = lifecycle?.transition.semantic_target_head_ref ?? null;
  if (headRef) {
    const headNode = addNodeV01(graph, {
      node_kind: "semantic_target_head",
      identity: headRef.record_id,
      status:
        effect.after_state.presence === "absent" ? "retracted" : "applied",
      exact_ref: headRef,
      record_id: headRef.record_id,
      record_fingerprint: headRef.record_fingerprint,
      source_refs: [effect.after_application_observation_ref],
      trust_class: effect.after_application_observation_ref.trust_class,
      recorded_at: receipt.recorded_at,
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      authority_boundary: "state_projection_not_truth",
    });
    addEdgeV01(
      graph,
      "transition_updated_target_head",
      transitionNode,
      headNode,
      "present",
      [effect.after_application_observation_ref],
    );
  }
  for (const later of reconciliation.later_context.filter(
    (item) =>
      item.source_transition_receipt_ref.record_id ===
        receipt.transition_receipt_id &&
      item.source_transition_receipt_ref.record_fingerprint ===
        receipt.integrity.fingerprint,
  )) {
    if (!later.later_packet_ref) continue;
    const packet = loadPacketV01(db, scope, later.later_packet_ref);
    const packetNode = addNodeV01(graph, {
      node_kind: "later_task_context_packet",
      identity: packet.packet_id,
      status: "present",
      exact_ref: later.later_packet_ref,
      record_id: packet.packet_id,
      record_fingerprint: packet.integrity.fingerprint,
      source_refs: packet.compatibility.source_refs,
      trust_class: "derived_interpretation",
      recorded_at: packet.generated_at,
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      authority_boundary: "context_selection_not_truth",
    });
    addEdgeV01(
      graph,
      laterPacketEdgeKind,
      compiledSourceNode,
      packetNode,
      "present",
      packet.compatibility.source_refs,
    );
    if (!later.context_use_review_ref) continue;
    const review = loadContextUseReviewV01(
      db,
      scope,
      later.context_use_review_ref,
    );
    const reviewNode = addNodeV01(graph, {
      node_kind: "context_use_review",
      identity: review.review_id,
      status: "present",
      exact_ref: later.context_use_review_ref,
      record_id: review.review_id,
      record_fingerprint: review.integrity.fingerprint,
      source_refs: review.compatibility.external_refs,
      trust_class: review.reviewer_ref.trust_class,
      recorded_at: review.reviewed_at,
      workspace_id: scope.workspace_id,
      project_id: scope.project_id,
      authority_boundary: "feedback_not_truth",
    });
    addEdgeV01(
      graph,
      "later_packet_reviewed_by_context_use_review",
      packetNode,
      reviewNode,
      "present",
      review.compatibility.external_refs,
    );
  }
}

function buildRevisionEdgesV01(
  graph: GraphBuilderV01,
  selected: SelectedGraphV01,
): void {
  for (const claim of selected.claims) {
    addRecordLineageEdgesV01(
      graph,
      "claim_record",
      claim.claim_ref.record_id,
      claim.claim.prior_claim_ref,
      claim.claim.operation_target_claim_ref,
      claim.claim.operation_intent,
    );
  }
  for (const relation of selected.relations) {
    addRecordLineageEdgesV01(
      graph,
      "claim_evidence_relation",
      relation.relation_ref.record_id,
      relation.relation.prior_relation_ref,
      relation.relation.supersedes_relation_ref,
      relation.relation.operation_intent,
    );
  }
}

function addRecordLineageEdgesV01(
  graph: GraphBuilderV01,
  kind: "claim_record" | "claim_evidence_relation",
  recordId: string,
  prior: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
  target: ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 | null,
  operation: ClaimRecordV01["operation_intent"],
): void {
  const current = findNodeV01(graph, kind, recordId);
  if (!current) return;
  const priorNode = prior ? findNodeV01(graph, kind, prior.record_id) : null;
  if (priorNode) {
    addEdgeV01(graph, "prior_revision", priorNode, current, "present", []);
  }
  const targetNode = target ? findNodeV01(graph, kind, target.record_id) : null;
  if (targetNode && operation === "supersede") {
    addEdgeV01(graph, "supersedes", current, targetNode, "present", []);
  }
  if (targetNode && operation === "retract") {
    addEdgeV01(graph, "retracts", current, targetNode, "present", []);
  }
}

function deriveStopV01(
  graph: GraphBuilderV01,
  revisions: RevisionProjectionV01[],
  reconciliation: ProjectVerifyReconciliationV01,
  lookup: ProjectVerifyLineageLookupV01,
): ProjectVerifyLineageStopV01 {
  if (
    revisions.some((revision) => revision.lifecycle.conflicts.length > 0)
  ) {
    return { stopped_at: "lookup", reason: "source_conflict", exact_ref: null };
  }
  if (revisions.length === 0) {
    const lastMaterial = [...graph.nodes.values()].at(-1) ?? null;
    return {
      stopped_at: lastMaterial?.node_kind ?? "lookup",
      reason: "source_missing",
      exact_ref: lastMaterial?.exact_ref ?? null,
    };
  }
  const principal = principalRevisionsV01(revisions, lookup);
  const stops = principal.map((revision) =>
    deriveRevisionStopV01(revision, reconciliation),
  );
  return (
    stops
      .filter((stop) => stop.reason !== "chain_complete")
      .sort(
        (left, right) =>
          lineageStopDepthV01(left) - lineageStopDepthV01(right) ||
          left.reason.localeCompare(right.reason),
      )[0] ??
    stops[0] ?? {
      stopped_at: "lookup",
      reason: "source_missing",
      exact_ref: null,
    }
  );
}

function deriveRevisionStopV01(
  revision: RevisionProjectionV01,
  reconciliation: ProjectVerifyReconciliationV01,
): ProjectVerifyLineageStopV01 {
  const lifecycle = revision.lifecycle;
  if (!lifecycle.review.proposal_ref) {
    return {
      stopped_at:
        "claim_ref" in revision ? "claim_record" : "claim_evidence_relation",
      reason: "candidate_recorded_no_proposal",
      exact_ref: null,
    };
  }
  if (!lifecycle.decision.decision_ref) {
    return {
      stopped_at: "episode_delta_proposal_candidate",
      reason: "proposal_pending_review",
      exact_ref: lifecycle.review.proposal_candidate_ref,
    };
  }
  if (lifecycle.decision.status === "rejected") {
    return {
      stopped_at: "review_decision",
      reason: "review_rejected",
      exact_ref: lifecycle.decision.decision_ref,
    };
  }
  if (lifecycle.decision.status === "deferred") {
    return {
      stopped_at: "review_decision",
      reason: "review_deferred",
      exact_ref: lifecycle.decision.decision_ref,
    };
  }
  if (!lifecycle.gate.gate_ref) {
    return {
      stopped_at: "review_decision",
      reason: "decision_recorded_gate_pending",
      exact_ref: lifecycle.decision.decision_ref,
    };
  }
  if (!lifecycle.transition.transition_receipt_ref) {
    return {
      stopped_at: "semantic_commit_gate",
      reason:
        lifecycle.gate.status === "expired"
          ? "gate_expired_transition_not_applied"
          : "gate_authorized_transition_pending",
      exact_ref: lifecycle.gate.gate_ref,
    };
  }
  const later = reconciliation.later_context.filter((item) =>
    exactRefEqualV01(
      item.source_transition_receipt_ref,
      lifecycle.transition.transition_receipt_ref!,
    ),
  );
  if (later.length === 0 || later.every((item) => !item.later_packet_ref)) {
    return {
      stopped_at: "state_transition_receipt_effect",
      reason: "transition_applied_packet_pending",
      exact_ref: lifecycle.transition.transition_receipt_ref,
    };
  }
  if (later.some((item) => !item.context_use_review_ref)) {
    return {
      stopped_at: "later_task_context_packet",
      reason: "later_packet_feedback_pending",
      exact_ref:
        later.find(
          (item) => item.later_packet_ref && !item.context_use_review_ref,
        )?.later_packet_ref ?? null,
    };
  }
  return {
    stopped_at: "context_use_review",
    reason: "chain_complete",
    exact_ref:
      later.find((item) => item.context_use_review_ref)
        ?.context_use_review_ref ?? null,
  };
}

function lineageStopDepthV01(stop: ProjectVerifyLineageStopV01): number {
  const depth = {
    lookup: 0,
    criterion: 1,
    criterion_relation_residue: 2,
    evidence_record: 3,
    claim_record: 4,
    claim_evidence_relation: 4,
    episode_delta_proposal_candidate: 5,
    review_decision: 6,
    semantic_commit_gate: 7,
    state_transition_receipt_effect: 8,
    semantic_state: 9,
    semantic_target_head: 10,
    later_task_context_packet: 11,
    context_use_review: 12,
  } satisfies Record<ProjectVerifyLineageStopV01["stopped_at"], number>;
  return depth[stop.stopped_at];
}

function principalRevisionsV01(
  revisions: RevisionProjectionV01[],
  lookup: ProjectVerifyLineageLookupV01,
): RevisionProjectionV01[] {
  if (lookup.lookup_kind === "claim") {
    return revisions.filter(
      (revision) =>
        "claim_ref" in revision &&
        revision.claim_ref.record_id === lookup.claim_id,
    );
  }
  if (lookup.lookup_kind === "claim_evidence_relation") {
    return revisions.filter(
      (revision) =>
        "relation_ref" in revision &&
        revision.relation_ref.record_id === lookup.relation_id,
    );
  }
  if (lookup.lookup_kind === "claim_family") {
    const matching = revisions.filter(
      (revision) =>
        "claim_ref" in revision &&
        revision.claim.claim_family_id === lookup.claim_family_id,
    );
    const latest = matching.sort(
      (left, right) =>
        ("claim_ref" in right ? right.claim.revision : 0) -
        ("claim_ref" in left ? left.claim.revision : 0),
    )[0];
    return latest ? [latest] : revisions;
  }
  if (lookup.lookup_kind === "claim_evidence_relation_family") {
    const matching = revisions.filter(
      (revision) =>
        "relation_ref" in revision &&
        revision.relation.relation_family_id === lookup.relation_family_id,
    );
    const latest = matching.sort(
      (left, right) =>
        ("relation_ref" in right ? right.relation.revision : 0) -
        ("relation_ref" in left ? left.relation.revision : 0),
    )[0];
    return latest ? [latest] : revisions;
  }
  if (lookup.lookup_kind === "proposal") {
    const matching = revisions.filter(
      (revision) =>
        revision.lifecycle.review.proposal_ref?.record_id ===
        lookup.proposal_id,
    );
    return matching.length > 0 ? matching : revisions;
  }
  if (lookup.lookup_kind === "transition_receipt") {
    const matching = revisions.filter(
      (revision) =>
        revision.lifecycle.transition.transition_receipt_ref?.record_id ===
        lookup.transition_receipt_id,
    );
    return matching.length > 0 ? matching : revisions;
  }
  return revisions;
}

function addMissingStopNodeV01(
  graph: GraphBuilderV01,
  stop: ProjectVerifyLineageStopV01,
  workspaceId: string,
  projectId: string,
): void {
  const missingKind = {
    candidate_recorded_no_proposal: "episode_delta_proposal_candidate",
    proposal_pending_review: "review_decision",
    decision_recorded_gate_pending: "semantic_commit_gate",
    gate_authorized_transition_pending: "state_transition_receipt_effect",
    gate_expired_transition_not_applied: "state_transition_receipt_effect",
    transition_applied_packet_pending: "later_task_context_packet",
    later_packet_feedback_pending: "context_use_review",
  } as const;
  const kind = missingKind[stop.reason as keyof typeof missingKind];
  if (!kind) return;
  addNodeV01(graph, {
    node_kind: kind,
    identity: `missing:${stop.reason}:${stop.exact_ref?.record_id ?? "none"}`,
    status: "missing",
    exact_ref: null,
    record_id: null,
    record_fingerprint: null,
    source_refs: [],
    trust_class: "not_applicable",
    recorded_at: null,
    workspace_id: workspaceId,
    project_id: projectId,
    authority_boundary: "missing_or_conflict",
  });
}

function selectedConflictsV01(
  reconciliation: ProjectVerifyReconciliationV01,
  revisions: RevisionProjectionV01[],
): ProjectVerifyConflictV01[] {
  const selected = revisions.flatMap(
    (revision) => revision.lifecycle.conflicts,
  );
  const global = reconciliation.conflicts.filter(
    (conflict) => conflict.conflict_kind === "bounded_read",
  );
  return [...selected, ...global]
    .sort((left, right) =>
      `${left.conflict_kind}\0${left.code}`.localeCompare(
        `${right.conflict_kind}\0${right.code}`,
      ),
    )
    .slice(0, 256);
}

function semanticStateNodeV01(
  state: VNextPersistedSemanticStateVersionV01,
  scope: { workspace_id: string; project_id: string },
): ProjectVerifyLineageNodeV01 {
  return nodeV01({
    node_kind: "semantic_state",
    identity: state.semantic_state_record_id,
    status: "applied",
    exact_ref: {
      record_kind: "semantic_state",
      record_id: state.semantic_state_record_id,
      record_fingerprint: state.integrity.fingerprint,
    },
    record_id: state.semantic_state_record_id,
    record_fingerprint: state.integrity.fingerprint,
    source_refs: [state.state_ref, state.target_ref],
    trust_class: state.state_ref.trust_class,
    recorded_at: state.created_at,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    authority_boundary: "state_projection_not_truth",
  });
}

function loadProposalV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  ref: ProjectVerifyExactProtocolRefV01,
): EpisodeDeltaProposalV01 {
  return loadPayloadV01(db, scope, ref) as EpisodeDeltaProposalV01;
}

function loadDecisionV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  ref: ProjectVerifyExactProtocolRefV01,
): ReviewDecisionV01 {
  return loadPayloadV01(db, scope, ref) as ReviewDecisionV01;
}

function loadGateV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  ref: ProjectVerifyExactProtocolRefV01,
): VNextSemanticCommitGateRecordV01 {
  return loadPayloadV01(db, scope, ref) as VNextSemanticCommitGateRecordV01;
}

function loadPacketV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  ref: ProjectVerifyExactProtocolRefV01,
): TaskContextPacketV01 {
  const record = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: "task_context_packet",
    record_id: ref.record_id,
  });
  if (
    !record ||
    record.fingerprint !== ref.record_fingerprint ||
    record.idempotency_key !== null
  ) {
    failV01("lineage_task_context_packet_envelope_conflict");
  }
  const packet = record.payload as TaskContextPacketV01;
  if (
    validateTaskContextPacketV01(packet, {
      evaluated_at: packet.generated_at,
    }).status !== "valid" ||
    packet.packet_id !== record.record_id ||
    packet.integrity.fingerprint !== record.fingerprint ||
    packet.generated_at !== record.created_at
  ) {
    failV01("lineage_task_context_packet_envelope_conflict");
  }
  return packet;
}

function loadContextUseReviewV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  ref: ProjectVerifyExactProtocolRefV01,
): ContextUseReviewV01 {
  return loadPayloadV01(db, scope, ref) as ContextUseReviewV01;
}

function loadPayloadV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  ref: ProjectVerifyExactProtocolRefV01,
): unknown {
  if (ref.record_kind === "episode_delta_proposal_candidate") {
    failV01("lineage_candidate_not_durable_record");
  }
  const record = readVNextCoreRecordV01(db, {
    ...scope,
    record_kind: ref.record_kind as Exclude<
      typeof ref.record_kind,
      | "criterion_assessment"
      | "episode_delta_proposal_candidate"
      | "semantic_target_head"
    >,
    record_id: ref.record_id,
  });
  if (!record || record.fingerprint !== ref.record_fingerprint) {
    failV01("lineage_protocol_source_conflict");
  }
  return record.payload;
}

function findLifecycleByTransitionV01(
  reconciliation: ProjectVerifyReconciliationV01,
  receiptId: string,
): ProjectVerifyRevisionLifecycleV01 | null {
  for (const revision of [
    ...reconciliation.claim_families.flatMap((family) => family.revisions),
    ...reconciliation.relation_families.flatMap((family) => family.revisions),
  ]) {
    if (
      revision.lifecycle.transition.transition_receipt_ref?.record_id ===
      receiptId
    ) {
      return revision.lifecycle;
    }
  }
  return null;
}

function recordRefV01(
  revision: RevisionProjectionV01,
): ClaimRecordReferenceV01 | ClaimEvidenceRelationReferenceV01 {
  return "claim_ref" in revision ? revision.claim_ref : revision.relation_ref;
}

function lifecycleNodeStatusV01(
  lifecycle: ProjectVerifyRevisionLifecycleV01,
): ProjectVerifyLineageNodeStatusV01 {
  switch (lifecycle.application.status) {
    case "applied_current":
    case "previously_applied":
      return "applied";
    case "applied_superseded":
      return "superseded";
    case "applied_retracted":
      return "retracted";
    case "conflict":
      return "conflict";
    case "pending_later_candidate":
      return "pending";
    default:
      return "present";
  }
}

function candidateStatusV01(
  lifecycle: ProjectVerifyRevisionLifecycleV01,
): ProjectVerifyLineageNodeStatusV01 {
  if (lifecycle.decision.status === "rejected") return "rejected";
  if (lifecycle.decision.status === "deferred") return "deferred";
  if (lifecycle.transition.transition_receipt_ref) return "applied";
  return "pending";
}

function criterionTrustV01(
  criterion: CriterionAssessmentItemV01,
): ExternalRefTrustClassV01 | "mixed" | "not_applicable" {
  if (criterion.basis === "observed") return "direct_local_observation";
  if (criterion.basis === "attested") return "host_attestation";
  if (criterion.basis === "mixed") return "mixed";
  return "not_applicable";
}

function producerTrustV01(
  claim: ClaimRecordV01,
): ExternalRefTrustClassV01 | "mixed" | "not_applicable" {
  const trust = {
    server_deterministic_evaluator: "derived_interpretation",
    local_adapter: "derived_interpretation",
    host: "host_attestation",
    model: "derived_interpretation",
    provider: "provider_report",
    user: "user_declaration",
    import: "imported_unverified",
  } as const;
  return trust[claim.producer.producer_kind];
}

function materialRefToExactV01(
  ref:
    | EvidenceRecordReferenceV01
    | ClaimRecordReferenceV01
    | ClaimEvidenceRelationReferenceV01,
): ProjectVerifyExactProtocolRefV01 {
  return {
    record_kind: ref.record_kind,
    record_id: ref.record_id,
    record_fingerprint: ref.record_fingerprint,
  };
}

function matchesLifecycleProtocolRefV01(
  ref: ProjectVerifyExactProtocolRefV01 | null,
  id: string,
  fingerprint: string | null,
): boolean {
  return Boolean(
    ref &&
    ref.record_id === id &&
    (!fingerprint || ref.record_fingerprint === fingerprint),
  );
}

function exactRefEqualV01(
  left: ProjectVerifyExactProtocolRefV01,
  right: ProjectVerifyExactProtocolRefV01,
): boolean {
  return canonical(left) === canonical(right);
}

function addUniqueV01<T>(
  target: T[],
  additions: T[],
  key: (value: T) => string,
): boolean {
  const existing = new Set(target.map(key));
  let changed = false;
  for (const addition of additions) {
    const identity = key(addition);
    if (existing.has(identity)) continue;
    target.push(addition);
    existing.add(identity);
    changed = true;
  }
  return changed;
}

function addNodeV01(
  graph: GraphBuilderV01,
  input: Omit<ProjectVerifyLineageNodeV01, "node_id"> & { identity: string },
): ProjectVerifyLineageNodeV01 {
  const node = nodeV01(input);
  addNodeObjectV01(graph, node);
  return graph.nodes.get(node.node_id)!;
}

function nodeV01(
  input: Omit<ProjectVerifyLineageNodeV01, "node_id"> & { identity: string },
): ProjectVerifyLineageNodeV01 {
  const { identity, ...material } = input;
  return {
    node_id: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        namespace: "project_verify_lineage_node.v0.1",
        node_kind: input.node_kind,
        identity,
      }),
    ),
    ...material,
    source_refs: uniqueExternalRefsV01(material.source_refs),
  };
}

function addNodeObjectV01(
  graph: GraphBuilderV01,
  node: ProjectVerifyLineageNodeV01,
): void {
  const existing = graph.nodes.get(node.node_id);
  if (existing && canonical(existing) !== canonical(node)) {
    failV01("lineage_node_identity_conflict");
  }
  graph.nodes.set(node.node_id, node);
}

function findNodeV01(
  graph: GraphBuilderV01,
  kind: ProjectVerifyLineageNodeKindV01,
  recordId: string,
): ProjectVerifyLineageNodeV01 | null {
  return (
    [...graph.nodes.values()].find(
      (node) => node.node_kind === kind && node.record_id === recordId,
    ) ?? null
  );
}

function addEdgeV01(
  graph: GraphBuilderV01,
  kind: ProjectVerifyLineageEdgeKindV01,
  from: ProjectVerifyLineageNodeV01,
  to: ProjectVerifyLineageNodeV01,
  status: ProjectVerifyLineageEdgeV01["status"],
  sourceRefs: ExternalRefV01[],
): void {
  const withoutId = {
    edge_kind: kind,
    from_node_id: from.node_id,
    to_node_id: to.node_id,
    status,
    source_refs: uniqueExternalRefsV01(sourceRefs),
  };
  const edge: ProjectVerifyLineageEdgeV01 = {
    edge_id: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        namespace: "project_verify_lineage_edge.v0.1",
        ...withoutId,
      }),
    ),
    ...withoutId,
  };
  const existing = graph.edges.get(edge.edge_id);
  if (existing && canonical(existing) !== canonical(edge)) {
    failV01("lineage_edge_identity_conflict");
  }
  graph.edges.set(edge.edge_id, edge);
}

function uniqueExternalRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  const unique = new Map(refs.map((ref) => [canonical(ref), ref]));
  return [...unique.values()].sort((left, right) =>
    canonical(left).localeCompare(canonical(right)),
  );
}

function validateLookupV01(lookup: ProjectVerifyLineageLookupV01): void {
  if (!lookup || typeof lookup !== "object") failV01("lineage_lookup_invalid");
  switch (lookup.lookup_kind) {
    case "criterion":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "criterion_id", "packet_ref", "receipt_ref"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.criterion_id, "criterion_id_invalid");
      validateLookupExactRefV01(lookup.packet_ref, "task_context_packet");
      validateLookupExactRefV01(lookup.receipt_ref, "run_receipt");
      break;
    case "evidence":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "evidence_id", "expected_fingerprint"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.evidence_id, "evidence_id_invalid");
      optionalShaV01(lookup.expected_fingerprint);
      break;
    case "claim":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "claim_id", "expected_fingerprint"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.claim_id, "claim_id_invalid");
      optionalShaV01(lookup.expected_fingerprint);
      break;
    case "claim_family":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "claim_family_id"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.claim_family_id, "claim_family_id_invalid");
      break;
    case "claim_evidence_relation":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "relation_id", "expected_fingerprint"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.relation_id, "relation_id_invalid");
      optionalShaV01(lookup.expected_fingerprint);
      break;
    case "claim_evidence_relation_family":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "relation_family_id"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.relation_family_id, "relation_family_id_invalid");
      break;
    case "proposal":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "proposal_id", "expected_fingerprint"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(lookup.proposal_id, "proposal_id_invalid");
      optionalShaV01(lookup.expected_fingerprint);
      break;
    case "transition_receipt":
      assertExactKeysV01(
        lookup,
        ["lookup_kind", "transition_receipt_id", "expected_fingerprint"],
        "lineage_lookup_fields_invalid",
      );
      requiredTextV01(
        lookup.transition_receipt_id,
        "transition_receipt_id_invalid",
      );
      optionalShaV01(lookup.expected_fingerprint);
      break;
    default:
      failV01("lineage_lookup_kind_invalid");
  }
}

function validateLookupExactRefV01(
  ref: ProjectVerifyExactProtocolRefV01,
  kind: ProjectVerifyExactProtocolRefV01["record_kind"],
): void {
  assertExactKeysV01(
    ref,
    ["record_kind", "record_id", "record_fingerprint"],
    "lineage_lookup_ref_fields_invalid",
  );
  if (ref.record_kind !== kind) failV01("lineage_lookup_ref_kind_invalid");
  requiredTextV01(ref.record_id, "lineage_lookup_ref_id_invalid");
  requiredShaV01(
    ref.record_fingerprint,
    "lineage_lookup_ref_fingerprint_invalid",
  );
}

function optionalShaV01(value: string | null): void {
  if (value !== null) requiredShaV01(value, "expected_fingerprint_invalid");
}

function canonical(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

function requiredTextV01(value: unknown, code: string): string {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    value.length > PROJECT_VERIFY_READ_MAX_IDENTIFIER_CHARACTERS_V01
  ) {
    failV01(code);
  }
  return value;
}

function assertExactKeysV01(
  value: unknown,
  expectedKeys: readonly string[],
  code: string,
): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failV01(code);
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonical(actual) !== canonical(expected)) failV01(code);
}

function requiredTimestampV01(value: unknown, code: string): string {
  const text = requiredTextV01(value, code);
  if (parseStrictIsoTimestampV01(text) === null) failV01(code);
  return text;
}

function requiredShaV01(value: unknown, code: string): string {
  const text = requiredTextV01(value, code);
  if (!SHA256_V01.test(text)) failV01(code);
  return text;
}

function failV01(code: string): never {
  throw new ProjectVerifyLineageReadErrorV01(code);
}
