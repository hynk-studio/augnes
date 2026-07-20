import assert from "node:assert/strict";

import {
  boundedProjectVerifyDisplayTextV01,
  projectVerificationWorkbenchPresentationV01,
  runReceiptComparisonPresentationV01,
} from "@/components/workbench/semantic-review/project-verification-presentation";
import { buildProjectVerifyWorkbenchFixtureV01 } from "@/fixtures/vnext/protocol/project-verify-workbench-v0-1";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  ProjectVerifyExactProtocolRefV01,
  ProjectVerifyReconciliationV01,
  ProjectVerifyRevisionLifecycleV01,
} from "@/types/vnext/project-verify-reconciliation";
import type { ProjectVerifyLineageV01 } from "@/types/vnext/project-verify-lineage";
import type {
  ClaimEvidenceRelationReferenceV01,
  ClaimRecordReferenceV01,
  EvidenceRecordReferenceV01,
} from "@/types/vnext/project-verify-material";

import {
  installZeroNetworkGuard,
  ZERO_NETWORK_GUARD_METHODS,
} from "./test-harness-zero-network-guard.mjs";

const WORKSPACE_ID = "workspace-r7b-workbench-contract";
const PROJECT_ID = "project-r7b-workbench-contract";
const OBSERVED_AT = "2026-07-20T03:00:00.000Z";

const networkGuard = installZeroNetworkGuard({
  allowLoopback: false,
  errorPrefix: "r7b_workbench_external_io_blocked",
});

try {
  const reconciliation = reconciliationFixtureV01();
  const lineage = lineageFixtureV01();
  const presentation = projectVerificationWorkbenchPresentationV01(
    reconciliation,
    lineage,
  );
  assert.equal(
    presentation.presentation_version,
    "project_verification_workbench_presentation.v0.1",
  );
  assert.deepEqual(presentation.scope, {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    observed_at: OBSERVED_AT,
  });
  assert.equal(presentation.completeness.status, "bounded_incomplete");
  assert.deepEqual(
    presentation.criteria.map((criterion) => [criterion.status, criterion.basis]),
    [
      ["satisfied", "observed"],
      ["unsatisfied", "attested"],
      ["not_applicable", "mixed"],
      ["unknown", "insufficient"],
    ],
  );
  assert.deepEqual(
    presentation.relation_counts.map((entry) => [
      entry.kind,
      entry.applied,
      entry.pending,
    ]),
    [
      ["supports", 1, 0],
      ["opposes", 0, 1],
      ["contradicts", 0, 1],
      ["qualifies", 0, 1],
      ["contextualizes", 0, 1],
      ["insufficient", 0, 1],
    ],
  );
  const currentVsLatest = presentation.claim_families[0]!;
  assert.equal(
    currentVsLatest.applied_current?.claim.proposition,
    "Applied current proposition.",
  );
  assert.equal(
    currentVsLatest.latest_recorded?.claim.proposition,
    "Latest recorded pending proposition.",
  );
  assert.notEqual(
    currentVsLatest.applied_current?.claim_ref.record_id,
    currentVsLatest.latest_recorded?.claim_ref.record_id,
  );
  assert.deepEqual(
    currentVsLatest.revisions.map((revision) =>
      revision.lifecycle.application.status
    ),
    ["applied_current", "pending_later_candidate"],
  );
  assert.equal(
    presentation.claim_families[1]?.revisions[0]?.lifecycle.application.status,
    "applied_retracted",
  );
  assert.equal(presentation.claim_families[1]?.applied_current, null);
  assert.equal(
    presentation.relation_families.find((family) =>
      family.latest_recorded?.relation.relation_kind === "opposes"
    )?.revisions[0]?.lifecycle.gate.status,
    "expired",
  );
  const competing = presentation.relation_families.find((family) =>
    family.latest_recorded?.relation.relation_kind === "contradicts"
  );
  assert.equal(competing?.revisions[0]?.lifecycle.gate.status, "source_conflict");
  assert.equal(competing?.revisions[0]?.lifecycle.application.status, "conflict");
  assert.equal(presentation.selected_lineage?.stop.reason, "source_conflict");
  assert.deepEqual(
    presentation.selected_lineage?.nodes.map((node) => [
      node.node_kind,
      node.status,
      node.authority_boundary,
    ]),
    [
      ["episode_delta_proposal_candidate", "pending", "candidate_not_command"],
      ["review_decision", "present", "decision_not_transition"],
      ["semantic_commit_gate", "gate_authorized", "gate_authorized_not_applied"],
      ["semantic_commit_gate", "expired", "expired_gate_not_applied"],
      ["state_transition_receipt_effect", "conflict", "missing_or_conflict"],
    ],
  );
  assert.equal(presentation.summary.claim_truth, "not_established");
  assert.equal(presentation.authority.writes_database, false);
  assert.equal(presentation.authority.establishes_truth, false);
  assert.equal(presentation.authority.selects_current_head, false);
  assert.equal(presentation.authority.calls_model_or_provider, false);
  assert.equal(presentation.authority.performs_network_or_external_action, false);
  assert.deepEqual(
    presentation.later_context.map((entry) => entry.status),
    ["packet_compiled_feedback_pending"],
  );
  assert.equal(networkGuard.attempts.length, 0);

  const embeddedObligationFingerprint = `${"criterion-obligation:"}${fingerprint(
    "embedded-obligation",
  )}`;
  const boundedDisplayText = boundedProjectVerifyDisplayTextV01(
    `Exact check is bound only through obligation ${embeddedObligationFingerprint}.`,
  );
  assert.equal(boundedDisplayText.includes("sha256:"), false);
  assert.equal(
    boundedDisplayText,
    "Exact check is bound only through obligation exact reference (available in details).",
  );
  assert.equal(
    boundedProjectVerifyDisplayTextV01("No protocol fingerprint here."),
    "No protocol fingerprint here.",
  );

  const firstProductionSource = buildProjectVerifyWorkbenchFixtureV01({
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    run_id: "run:r7b-receipt-comparison:first",
  });
  const secondProductionSource = buildProjectVerifyWorkbenchFixtureV01({
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    run_id: "run:r7b-receipt-comparison:second",
  });
  const singleReceipt = runReceiptComparisonPresentationV01([
    firstProductionSource.receipt,
  ]);
  assert.equal(singleReceipt.mode, "single");
  assert.equal(singleReceipt.receipts.length, 1);
  const multipleReceipts = runReceiptComparisonPresentationV01([
    firstProductionSource.receipt,
    secondProductionSource.receipt,
  ]);
  assert.equal(multipleReceipts.mode, "multiple");
  assert.deepEqual(
    multipleReceipts.receipts.map((receipt) => receipt.receipt_id),
    [
      firstProductionSource.receipt.receipt_id,
      secondProductionSource.receipt.receipt_id,
    ],
    "exact proposal source order must be preserved without voting or latest-wins selection",
  );
  assert.equal(
    multipleReceipts.receipts.every(
      (receipt) =>
        receipt.verification_status === "passed" &&
        receipt.check_count > 0 &&
        receipt.skipped_check_count === 0,
    ),
    true,
  );
  assert.notEqual(
    multipleReceipts.receipts[0]?.receipt_id,
    multipleReceipts.receipts[1]?.receipt_id,
  );
  assert.equal(networkGuard.attempts.length, 0);

  const emptyPresentation = projectVerificationWorkbenchPresentationV01(
    emptyReconciliationFixtureV01(),
  );
  assert.deepEqual(emptyPresentation.criteria, []);
  assert.deepEqual(emptyPresentation.claim_families, []);
  assert.deepEqual(emptyPresentation.relation_families, []);
  assert.deepEqual(emptyPresentation.later_context, []);
  assert.equal(emptyPresentation.summary.claim_truth, "not_established");
  assert.equal(emptyPresentation.selected_lineage, null);
  assert.equal(networkGuard.attempts.length, 0);

  console.log(
    JSON.stringify(
      {
        suite: "decision-centered-semantic-workbench-v0.1",
        status: "passed",
        canonical_response_contract_fixture: true,
        production_route_read_proof: "smoke-vnext-operator-pilot-v0-1.ts",
        criterion_status_basis_matrix: true,
        production_shaped_single_and_multiple_receipt_comparison: true,
        support_and_opposition_coexist: true,
        contradiction_and_qualification_coexist: true,
        latest_recorded_separate_from_applied_current: true,
        decision_gate_transition_application_layers_distinct: true,
        expired_and_competing_gate_states_visible: true,
        retraction_history_visible_without_current_reactivation: true,
        bounded_incomplete_visible: true,
        claim_truth_not_established: true,
        embedded_protocol_fingerprints_hidden_from_default_summary: true,
        exact_lineage_structural_mapping: true,
        empty_historical_compatibility: true,
        external_network_calls: networkGuard.attempts.length,
        network_guard_methods: ZERO_NETWORK_GUARD_METHODS,
      },
      null,
      2,
    ),
  );
} finally {
  networkGuard.restore();
}

function reconciliationFixtureV01(): ProjectVerifyReconciliationV01 {
  const packetRef = exactRef("task_context_packet", "packet:workbench");
  const receiptRef = exactRef("run_receipt", "receipt:workbench");
  const assessmentRef = exactRef(
    "criterion_assessment",
    "assessment:workbench",
  );
  const evidenceRef = materialRef("evidence_record", "evidence:workbench");
  const claim1Ref = materialRef("claim_record", "claim:workbench:r1");
  const claim2Ref = materialRef("claim_record", "claim:workbench:r2");
  const retractedRef = materialRef(
    "claim_record",
    "claim:workbench:retracted",
  );
  const relationRefs = Object.fromEntries(
    [
      "supports",
      "opposes",
      "contradicts",
      "qualifies",
      "contextualizes",
      "insufficient",
    ].map((kind) => [
      kind,
      materialRef("claim_evidence_relation", `relation:workbench:${kind}`),
    ]),
  ) as Record<
    "supports" | "opposes" | "contradicts" | "qualifies" | "contextualizes" | "insufficient",
    ReturnType<typeof materialRef>
  >;
  const criteria = [
    ["satisfied", "observed"],
    ["unsatisfied", "attested"],
    ["not_applicable", "mixed"],
    ["unknown", "insufficient"],
  ] as const;
  const supportRef = externalRef(
    "criterion_relation",
    "criterion-support:workbench",
    "direct_local_observation",
  );
  const oppositionRef = externalRef(
    "criterion_relation",
    "criterion-opposition:workbench",
    "host_attestation",
  );
  const missingRef = externalRef(
    "criterion_relation",
    "criterion-missing:workbench",
    "derived_interpretation",
  );

  return {
    reconciliation_version: "project_verify_reconciliation.v0.1",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    observed_at: OBSERVED_AT,
    source_packets: [packetRef],
    source_receipts: [receiptRef],
    source_assessments: [assessmentRef],
    criteria: criteria.map(([status, basis], index) => ({
      packet_ref: packetRef,
      receipt_ref: receiptRef,
      assessment_ref: assessmentRef,
      criterion: {
        criterion_id: `criterion:workbench:${index + 1}`,
        criterion: `Canonical criterion ${index + 1}`,
        status,
        basis,
        supporting_refs: status === "satisfied" ? [supportRef] : [],
        opposing_refs: status === "unsatisfied" ? [oppositionRef] : [],
        missing_refs: status === "unknown" ? [missingRef] : [],
        trust: {
          direct_local_observation: status === "satisfied" ? 1 : 0,
          verified_external_observation: 0,
          host_attestation: status === "unsatisfied" ? 1 : 0,
          provider_report: 0,
          user_declaration: 0,
          imported_unverified: 0,
          derived_interpretation: status === "unknown" ? 1 : 0,
        },
        operation_coverage: [
          {
            capability: "repository_command_execution",
            coverage_level: status === "unknown" ? "outside_coverage" : "observed",
            source_ref: status === "unknown" ? null : supportRef,
            notes: status === "unknown" ? ["Exact operation coverage is missing."] : [],
          },
        ],
        uncertainty:
          status === "unknown"
            ? ["Exact criterion material remains insufficient."]
            : [],
      },
    })),
    evidence: [
      {
        evidence_ref: evidenceRef,
        evidence: {
          bounded_summary:
            "Exact authenticated observation supports one bounded proposition.",
        } as never,
        source_authentication: {
          status: "verified",
          authenticator_profile: "project-verify-source-authenticator.v0.1",
        },
        trust_class: "direct_local_observation",
        coverage: "partial",
        source_refs: [supportRef],
        limitations: ["Evidence remains support material."],
        uncertainty: ["Other observations oppose the proposition."],
        acceptance_status: "not_accepted_by_record_existence",
      },
    ],
    claim_families: [
      {
        claim_family_id: "claim-family:workbench-current-vs-latest",
        family_target_ref: externalRef(
          "claim_family",
          "claim-family:workbench-current-vs-latest",
        ),
        family_origin_fingerprint: fingerprint("claim-family-origin"),
        applicability_scope_fingerprint: fingerprint("claim-scope"),
        subject_refs: [externalRef("project", PROJECT_ID)],
        applicability_scope: {} as never,
        revisions: [
          {
            claim_ref: claim1Ref,
            claim: {
              revision: 1,
              operation_intent: "create",
              proposition: "Applied current proposition.",
            } as never,
            lifecycle: lifecycle({ application: "applied_current" }),
          },
          {
            claim_ref: claim2Ref,
            claim: {
              revision: 2,
              operation_intent: "revise",
              proposition: "Latest recorded pending proposition.",
            } as never,
            lifecycle: lifecycle({
              review: "pending_review",
              application: "pending_later_candidate",
            }),
          },
        ],
        latest_recorded_candidate_ref: claim2Ref,
        applied_current_head_ref: claim1Ref,
        previously_applied_refs: [],
        pending_revision_refs: [claim2Ref],
        conflicts: [],
        completeness: complete(2),
      },
      {
        claim_family_id: "claim-family:workbench-retracted",
        family_target_ref: externalRef(
          "claim_family",
          "claim-family:workbench-retracted",
        ),
        family_origin_fingerprint: fingerprint("retracted-family-origin"),
        applicability_scope_fingerprint: fingerprint("retracted-scope"),
        subject_refs: [externalRef("project", PROJECT_ID)],
        applicability_scope: {} as never,
        revisions: [
          {
            claim_ref: retractedRef,
            claim: {
              revision: 1,
              operation_intent: "retract",
              proposition: "Retracted proposition remains historical.",
            } as never,
            lifecycle: lifecycle({
              decision: "retract_decision",
              gate: "authorized",
              transition: "applied",
              application: "applied_retracted",
            }),
          },
        ],
        latest_recorded_candidate_ref: retractedRef,
        applied_current_head_ref: null,
        previously_applied_refs: [retractedRef],
        pending_revision_refs: [],
        conflicts: [],
        completeness: complete(1),
      },
    ],
    relation_families: Object.entries(relationRefs).map(([kind, ref], index) => ({
      relation_family_id: `relation-family:workbench:${kind}`,
      family_target_ref: externalRef(
        "claim_evidence_relation_family",
        `relation-family:workbench:${kind}`,
      ),
      family_origin_fingerprint: fingerprint(`relation-origin:${kind}`),
      applicability_scope_fingerprint: fingerprint(`relation-scope:${kind}`),
      claim_ref: claim2Ref,
      evidence_ref: evidenceRef,
      applicability_scope: {} as never,
      revisions: [
        {
          relation_ref: ref,
          relation: {
            revision: 1,
            relation_kind: kind,
            basis: kind === "supports" ? "observed" : "mixed",
            trust_class:
              kind === "supports"
                ? "direct_local_observation"
                : "host_attestation",
          } as never,
          lifecycle: lifecycle(
            index === 1
              ? { gate: "expired" }
              : index === 2
                ? { gate: "source_conflict", application: "conflict" }
                : {},
          ),
        },
      ],
      latest_recorded_candidate_ref: ref,
      applied_current_head_ref: kind === "supports" ? ref : null,
      previously_applied_refs: [],
      pending_revision_refs: kind === "supports" ? [] : [ref],
      conflicts:
        kind === "contradicts"
          ? [
              {
                conflict_kind: "semantic_commit_gate",
                code: "project_verify_competing_gate_authorization",
                exact_refs: [],
                source_refs: [],
              },
            ]
          : [],
      completeness: complete(1),
    })) as never,
    pending_relation_material: {
      supports: [],
      opposes: [relationRefs.opposes],
      contradicts: [relationRefs.contradicts],
      qualifies: [relationRefs.qualifies],
      contextualizes: [relationRefs.contextualizes],
      insufficient: [relationRefs.insufficient],
    },
    applied_relation_material: {
      supports: [relationRefs.supports],
      opposes: [],
      contradicts: [],
      qualifies: [],
      contextualizes: [],
      insufficient: [],
    },
    applicability_groups: [],
    later_context: [
      {
        source_transition_receipt_ref: exactRef(
          "state_transition_receipt",
          "transition:workbench",
        ),
        later_packet_ref: exactRef(
          "task_context_packet",
          "packet:workbench:later",
        ),
        context_use_review_ref: null,
        status: "packet_compiled_feedback_pending",
      },
    ],
    conflicts: [
      {
        conflict_kind: "bounded_read",
        code: "project_verify_reconciliation_bound_exceeded",
        exact_refs: [],
        source_refs: [],
      },
    ],
    summary: {
      support_present: true,
      opposition_present: true,
      contradiction_present: true,
      qualification_present: true,
      contextualization_present: true,
      insufficient_material_present: true,
      mixed_or_disputed_material_present: true,
      no_applied_relation: false,
      pending_review: true,
      applied_current: true,
      retracted: true,
      claim_truth: "not_established",
    },
    bounds: {
      max_families: 256,
      max_revisions_per_family: 256,
      max_refs_per_collection: 256,
      max_conflicts: 256,
    },
    completeness: {
      status: "bounded_incomplete",
      returned_items: 18,
      fixed_bound: 256,
      continuation_cursor: null,
      omitted_reason: "project_verify_reconciliation_bound_exceeded",
    },
    projection_fingerprint: fingerprint("reconciliation"),
    authority: readAuthority(),
  };
}

function emptyReconciliationFixtureV01(): ProjectVerifyReconciliationV01 {
  const fixture = reconciliationFixtureV01();
  return {
    ...fixture,
    source_packets: [],
    source_receipts: [],
    source_assessments: [],
    criteria: [],
    evidence: [],
    claim_families: [],
    relation_families: [],
    pending_relation_material: emptyRelationBuckets(),
    applied_relation_material: emptyRelationBuckets(),
    later_context: [],
    conflicts: [],
    summary: {
      support_present: false,
      opposition_present: false,
      contradiction_present: false,
      qualification_present: false,
      contextualization_present: false,
      insufficient_material_present: false,
      mixed_or_disputed_material_present: false,
      no_applied_relation: true,
      pending_review: false,
      applied_current: false,
      retracted: false,
      claim_truth: "not_established",
    },
    completeness: complete(0),
  };
}

function lineageFixtureV01(): ProjectVerifyLineageV01 {
  return {
    lineage_version: "project_verify_lineage.v0.1",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    observed_at: OBSERVED_AT,
    lookup: {
      lookup_kind: "proposal",
      proposal_id: "episode-delta-proposal:workbench",
      expected_fingerprint: fingerprint("proposal"),
    },
    nodes: [
      lineageNode("episode_delta_proposal_candidate", "pending", "candidate_not_command"),
      lineageNode("review_decision", "present", "decision_not_transition"),
      lineageNode("semantic_commit_gate", "gate_authorized", "gate_authorized_not_applied"),
      lineageNode("semantic_commit_gate", "expired", "expired_gate_not_applied", 2),
      lineageNode("state_transition_receipt_effect", "conflict", "missing_or_conflict"),
    ],
    edges: [],
    stop: {
      stopped_at: "state_transition_receipt_effect",
      reason: "source_conflict",
      exact_ref: null,
    },
    conflicts: [
      {
        conflict_kind: "semantic_commit_gate",
        code: "project_verify_competing_gate_authorization",
        exact_refs: [],
        source_refs: [],
      },
    ],
    bounds: { max_nodes: 256, max_edges: 512 },
    completeness: complete(5),
    projection_fingerprint: fingerprint("lineage"),
    authority: readAuthority(),
  };
}

function lifecycle(
  input: {
    review?: ProjectVerifyRevisionLifecycleV01["review"]["status"];
    decision?: ProjectVerifyRevisionLifecycleV01["decision"]["status"];
    gate?: ProjectVerifyRevisionLifecycleV01["gate"]["status"];
    transition?: ProjectVerifyRevisionLifecycleV01["transition"]["status"];
    application?: ProjectVerifyRevisionLifecycleV01["application"]["status"];
  } = {},
): ProjectVerifyRevisionLifecycleV01 {
  const gate = input.gate ?? "no_gate";
  const transition = input.transition ?? "no_transition";
  const application = input.application ?? "never_applied";
  return {
    record: {
      recorded: true,
      latest_recorded_candidate: application === "pending_later_candidate",
      prior_record_ref: null,
      operation_target_ref: null,
    },
    review: { status: input.review ?? "no_proposal", proposal_ref: null, proposal_candidate_ref: null },
    decision: { status: input.decision ?? "no_decision", decision_ref: null },
    gate: { status: gate, gate_ref: gate === "no_gate" || gate === "source_conflict" ? null : exactRef("semantic_commit_gate", `gate:${gate}`) },
    transition: {
      status: transition,
      transition_receipt_ref: transition === "applied" ? exactRef("state_transition_receipt", "transition:applied") : null,
      semantic_state_ref: transition === "applied" ? exactRef("semantic_state", "state:applied") : null,
      semantic_target_head_ref: transition === "applied" ? exactRef("semantic_target_head", "head:applied") : null,
    },
    application: {
      status: application,
      current_family_head: application === "applied_current",
      applied_at: application.startsWith("applied_") ? OBSERVED_AT : null,
      ended_at: application === "applied_retracted" ? OBSERVED_AT : null,
    },
    truth: {
      claim_truth: "not_established",
      relation_is_proof: false,
      evidence_acceptance: "not_established_by_reconciliation",
    },
    conflicts: gate === "source_conflict"
      ? [{ conflict_kind: "semantic_commit_gate", code: "project_verify_competing_gate_authorization", exact_refs: [], source_refs: [] }]
      : [],
  };
}

function lineageNode(
  nodeKind: ProjectVerifyLineageV01["nodes"][number]["node_kind"],
  status: ProjectVerifyLineageV01["nodes"][number]["status"],
  authorityBoundary: ProjectVerifyLineageV01["nodes"][number]["authority_boundary"],
  suffix = 1,
): ProjectVerifyLineageV01["nodes"][number] {
  return {
    node_id: `lineage-node:${nodeKind}:${suffix}`,
    node_kind: nodeKind,
    status,
    exact_ref: null,
    record_id: null,
    record_fingerprint: null,
    source_refs: [],
    trust_class: "not_applicable",
    recorded_at: null,
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    authority_boundary: authorityBoundary,
  };
}

function exactRef(
  recordKind: ProjectVerifyExactProtocolRefV01["record_kind"],
  recordId: string,
): ProjectVerifyExactProtocolRefV01 {
  return {
    record_kind: recordKind,
    record_id: recordId,
    record_fingerprint: fingerprint(`${recordKind}:${recordId}`),
  };
}

function materialRef(
  recordKind: "evidence_record",
  recordId: string,
): EvidenceRecordReferenceV01;
function materialRef(
  recordKind: "claim_record",
  recordId: string,
): ClaimRecordReferenceV01;
function materialRef(
  recordKind: "claim_evidence_relation",
  recordId: string,
): ClaimEvidenceRelationReferenceV01;
function materialRef(
  recordKind: "evidence_record" | "claim_record" | "claim_evidence_relation",
  recordId: string,
) {
  return {
    record_kind: recordKind,
    record_id: recordId,
    record_fingerprint: fingerprint(`${recordKind}:${recordId}`),
  };
}

function externalRef(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"] = "derived_interpretation",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    observed_at: OBSERVED_AT,
    source_ref: fingerprint(`${refType}:${externalId}`),
    compatibility_namespace: "r7b-workbench-contract.v0.1",
  };
}

function complete(returnedItems: number) {
  return {
    status: "complete" as const,
    returned_items: returnedItems,
    fixed_bound: 256,
    continuation_cursor: null,
    omitted_reason: null,
  };
}

function emptyRelationBuckets() {
  return {
    supports: [],
    opposes: [],
    contradicts: [],
    qualifies: [],
    contextualizes: [],
    insufficient: [],
  };
}

function readAuthority() {
  return {
    read_only: true as const,
    projection_is_rebuildable: true as const,
    writes_database: false as const,
    creates_evidence: false as const,
    accepts_evidence: false as const,
    creates_claim_or_relation: false as const,
    creates_proposal: false as const,
    creates_review_decision: false as const,
    authorizes_semantic_commit_gate: false as const,
    applies_transition: false as const,
    selects_current_head: false as const,
    establishes_truth: false as const,
    changes_semantic_state: false as const,
    changes_later_context: false as const,
    calls_model_or_provider: false as const,
    performs_network_or_external_action: false as const,
  };
}

function fingerprint(seed: string): string {
  const body = Buffer.from(seed).toString("hex").padEnd(64, "0").slice(0, 64);
  return `sha256:${body}`;
}
