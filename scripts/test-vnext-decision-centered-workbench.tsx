import assert from "node:assert/strict";

import {
  aiWorkplanePresentationAuthorityV01,
  buildAIWorkplaneChangeReviewViewV01,
  buildAIWorkplaneHomeViewV01,
  buildAIWorkplaneQueueV01,
  buildAIWorkplaneResultViewV01,
  compareAIWorkplaneGuideProjectV01,
  selectAIWorkplaneChangeCandidateV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";
import { refreshAIWorkplaneAfterProjectApplicationV01 } from "@/lib/vnext/ai-workplane/ai-workplane-refresh";
import {
  deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01,
  type VNextOperatorPilotDecisionHistoryItemV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import {
  buildProjectGuideBriefV02,
} from "@/lib/vnext/guide-brief/project-guide-brief";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
} from "@/lib/vnext/review-decision";
import { buildStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import {
  acceptReviewDecisionInputFixture,
  deferReviewDecisionInputFixture,
  rejectReviewDecisionInputFixture,
  reviewDecisionGenericSourceProposal,
} from "@/fixtures/vnext/protocol/review-decision-v0-1";
import { genericStateTransitionReceiptInputFixture } from "@/fixtures/vnext/protocol/state-transition-receipt-v0-1";
import {
  boundedProjectVerifyDisplayTextV01,
  projectVerificationRelationDisclosureSummaryV01,
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
import type { BlankStateSourceV01 } from "@/types/vnext/blank-state";
import type { ProjectHomeProjectionV01 } from "@/types/vnext/project-home";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";
import type { VNextOperatorPilotReviewListItemV01 } from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { VNextOperatorPilotCandidateAdmissionV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";

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
  assert.match(
    projectVerificationRelationDisclosureSummaryV01(reconciliation).text,
    /Insufficient material present/u,
  );
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
  assert.doesNotMatch(
    projectVerificationRelationDisclosureSummaryV01(
      emptyReconciliationFixtureV01(),
    ).text,
    /Insufficient material present/u,
  );
  assert.equal(emptyPresentation.selected_lineage, null);
  assert.equal(networkGuard.attempts.length, 0);

  const productionSource = buildProjectVerifyWorkbenchFixtureV01({
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    run_id: "run:r7b-ai-workplane-projection",
  });
  const guide = buildProjectGuideBriefV02({
    source: aiWorkplaneGuideSourceV01(),
    generated_at: OBSERVED_AT,
  });
  const admissions = productionSource.proposal_material.proposal.proposed_deltas.map(
    (candidate) => ({
      policy_version: "vnext_operator_pilot_policy.v0.1" as const,
      candidate_id: candidate.candidate_id,
      candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
      target_count: candidate.target_refs.length,
      current_state_status: "absent" as const,
      target_states: candidate.target_refs.map((target_ref) => ({
        target_ref,
        target_key: `target:${candidate.candidate_id}`,
        presence: "absent" as const,
        revision: 0,
        state_fingerprint: null,
        head_fingerprint: null,
        source_transition_receipt_id: null,
        source_transition_receipt_fingerprint: null,
      })),
      decision_allowed: { accept: false, reject: true as const, defer: true as const },
      mapped_operation: null,
      accept_operation: null,
      blocking_reasons: ["pilot_candidate_operation_not_transitionable"],
      policy_notes: [],
    }),
  );
  const reviewListItem: VNextOperatorPilotReviewListItemV01 = {
    proposal_id: productionSource.proposal_material.proposal.proposal_id,
    proposal_fingerprint:
      productionSource.proposal_material.proposal.integrity.fingerprint,
    created_at: productionSource.proposal_material.proposal.created_at,
    status: productionSource.proposal_material.proposal.status,
    bounded_summary:
      productionSource.proposal_material.proposal.bounded_summary,
    source_currentness:
      productionSource.proposal_material.proposal.source_status.currentness,
    source_receipts: [
      {
        receipt_id: productionSource.receipt.receipt_id,
        receipt_fingerprint: productionSource.receipt.integrity.fingerprint,
      },
    ],
    candidate_count:
      productionSource.proposal_material.proposal.proposed_deltas.length,
    current_state_status: "absent",
    candidate_admissions: admissions,
    decision_count: 0,
    transition_status: "not_applied",
    decision_application_summary: {
      status: "needs_more_information",
      effective_decision: null,
      preferred_candidate_id: admissions[0]?.candidate_id ?? null,
      preferred_candidate_fingerprint:
        admissions[0]?.candidate_fingerprint ?? null,
      applying_decision_pending: false,
      matching_transition_receipt_present: false,
      exact_lineage_and_receipt_binding: true,
    },
  };
  const continuity = aiWorkplaneContinuityV01();
  const needsDecisionHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [
      {
        ...reviewListItem,
        decision_application_summary: {
          ...reviewListItem.decision_application_summary,
          status: "needs_decision",
        },
      },
    ],
    continuity,
  });
  assert.equal(needsDecisionHome.state, "change_decision");
  assert.equal(needsDecisionHome.primary_action?.label, "Review suggested change");
  assert.equal(needsDecisionHome.additional_items.length, 0);
  assert.deepEqual(needsDecisionHome.authority, aiWorkplanePresentationAuthorityV01());
  assert.deepEqual(compareAIWorkplaneGuideProjectV01(guide, PROJECT_ID), {
    status: "consistent",
    blocks_actions: false,
    message: null,
  });
  const guideMismatch = compareAIWorkplaneGuideProjectV01(
    guide,
    "project-r7b-other",
  );
  assert.equal(guideMismatch.status, "source_mismatch");
  assert.equal(guideMismatch.blocks_actions, true);
  assert.match(guideMismatch.message ?? "", /do not fully agree/u);
  assert.equal(
    compareAIWorkplaneGuideProjectV01(null, PROJECT_ID).blocks_actions,
    false,
  );

  const accessRequired = buildAIWorkplaneHomeViewV01({
    access: "locked",
    loading: false,
    guide,
    proposals: [],
    continuity: null,
  });
  assert.equal(accessRequired.state, "access_required");
  assert.equal(accessRequired.primary_action?.kind, "unlock");
  const noProject = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide: buildProjectGuideBriefV02({
      source: {
        route_mode: "canonical",
        requested_project_id: null,
        active_project_id: null,
        recent_projects: [],
        projection: null,
        project_resolution: "none",
        direct_host_round_trip_available: false,
      },
      generated_at: OBSERVED_AT,
    }),
    proposals: [],
    continuity: null,
  });
  assert.equal(noProject.state, "no_project");
  assert.equal(noProject.primary_action?.href, "/");
  const unavailable = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide: null,
    proposals: [],
    continuity: null,
  });
  assert.equal(unavailable.state, "guidance_unavailable");
  const idle = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [],
    continuity,
  });
  assert.equal(idle.state, "no_current_decision");
  assert.equal(idle.primary_action?.label, "Return to Blank State");

  const queue = buildAIWorkplaneQueueV01([
    {
      ...reviewListItem,
      transition_status: "applied",
      created_at: "2026-07-20T02:00:00.000Z",
      decision_application_summary: {
        ...reviewListItem.decision_application_summary,
        status: "project_updated",
      },
    },
    {
      ...reviewListItem,
      decision_application_summary: {
        ...reviewListItem.decision_application_summary,
        status: "needs_decision",
      },
    },
    {
      ...reviewListItem,
      proposal_id: "episode-delta-proposal:ffffffffffffffffffffffff",
      decision_count: 1,
    },
  ]);
  assert.deepEqual(queue.map((item) => item.status), [
    "needs_decision",
    "needs_more_information",
    "project_updated",
  ]);
  assert.equal(queue.length <= 5, true);

  const exactApplyingDecision = buildReviewDecisionV01(
    structuredClone(acceptReviewDecisionInputFixture),
  );
  const exactRejectDecision = buildReviewDecisionV01(
    structuredClone(rejectReviewDecisionInputFixture),
  );
  const exactDeferDecision = buildReviewDecisionV01(
    structuredClone(deferReviewDecisionInputFixture),
  );
  const exactCandidateAdmission = exactDecisionCandidateAdmissionV01(
    exactApplyingDecision,
  );
  const exactAppliedReceipt = buildStateTransitionReceiptV01(
    structuredClone(genericStateTransitionReceiptInputFixture),
  );
  const readyToCompleteSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [exactCandidateAdmission],
      decision_history: [
        exactDecisionHistoryV01(exactApplyingDecision, true),
      ],
      transition_receipts: [],
    });
  assert.equal(readyToCompleteSummary.status, "ready_to_complete");
  assert.equal(
    readyToCompleteSummary.preferred_candidate_id,
    exactApplyingDecision.candidate.candidate_id,
  );

  const newerProposalA = {
    ...reviewListItem,
    proposal_id: "episode-delta-proposal:aaaaaaaaaaaaaaaaaaaaaaaa",
    created_at: "2026-07-20T03:00:00.000Z",
    decision_application_summary: {
      ...reviewListItem.decision_application_summary,
      status: "needs_decision" as const,
    },
  };
  const olderProposalB = {
    ...reviewListItem,
    proposal_id: "episode-delta-proposal:bbbbbbbbbbbbbbbbbbbbbbbb",
    created_at: "2026-07-20T02:00:00.000Z",
    decision_count: 1,
    decision_application_summary: readyToCompleteSummary,
  };
  const exactCompletionHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [newerProposalA, olderProposalB],
    continuity: {
      ...continuity,
      pending_accepted_decision_count: 1,
    },
  });
  assert.equal(exactCompletionHome.state, "change_completion");
  assert.equal(
    exactCompletionHome.focused_item?.proposal_id,
    olderProposalB.proposal_id,
  );
  assert.equal(
    exactCompletionHome.primary_action?.label,
    "Continue change review",
  );
  assert.equal(
    exactCompletionHome.primary_action?.href,
    "/workbench/semantic-review/episode-delta-proposal~bbbbbbbbbbbbbbbbbbbbbbbb",
  );
  assert.equal(
    exactCompletionHome.additional_items[0]?.proposal_id,
    newerProposalA.proposal_id,
  );
  assert.equal(
    exactCompletionHome.additional_items[0]?.status,
    "needs_decision",
  );

  const rejectedSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [exactCandidateAdmission],
      decision_history: [exactDecisionHistoryV01(exactRejectDecision, false)],
      transition_receipts: [],
    });
  assert.equal(rejectedSummary.status, "rejected");
  assert.equal(rejectedSummary.applying_decision_pending, false);

  const laterRejectInput = structuredClone(
    rejectReviewDecisionInputFixture,
  );
  laterRejectInput.decided_at = "2026-07-10T12:20:00.000Z";
  laterRejectInput.rationale_summary =
    "Reject the previously accepted change through exact decision lineage.";
  laterRejectInput.lineage.prior_decisions = [
    {
      decision_id: exactApplyingDecision.decision_id,
      decision_fingerprint:
        exactApplyingDecision.integrity.fingerprint,
    },
  ];
  const laterRejectDecision = buildReviewDecisionV01(laterRejectInput);
  const lineageSupersededApplyingSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [exactCandidateAdmission],
      decision_history: [
        exactDecisionHistoryV01(exactApplyingDecision, true),
        exactDecisionHistoryV01(laterRejectDecision, false),
      ],
      transition_receipts: [],
    });
  assert.equal(lineageSupersededApplyingSummary.status, "rejected");
  assert.equal(
    lineageSupersededApplyingSummary.applying_decision_pending,
    false,
  );

  const deferredSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [exactCandidateAdmission],
      decision_history: [exactDecisionHistoryV01(exactDeferDecision, false)],
      transition_receipts: [],
    });
  assert.equal(deferredSummary.status, "deferred");
  assert.equal(deferredSummary.applying_decision_pending, false);

  const updatedSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [exactCandidateAdmission],
      decision_history: [
        exactDecisionHistoryV01(exactApplyingDecision, true),
      ],
      transition_receipts: [exactAppliedReceipt],
    });
  assert.equal(updatedSummary.status, "project_updated");
  assert.equal(updatedSummary.matching_transition_receipt_present, true);

  const unrelatedApplyingInput = structuredClone(
    acceptReviewDecisionInputFixture,
  );
  unrelatedApplyingInput.decided_at = "2026-07-10T12:16:00.000Z";
  unrelatedApplyingInput.rationale_summary =
    "A distinct exact applying decision used to prove unrelated receipt refusal.";
  const unrelatedApplyingDecision = buildReviewDecisionV01(
    unrelatedApplyingInput,
  );
  const unrelatedReceiptSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [
        exactDecisionCandidateAdmissionV01(unrelatedApplyingDecision),
      ],
      decision_history: [
        exactDecisionHistoryV01(unrelatedApplyingDecision, true),
      ],
      transition_receipts: [exactAppliedReceipt],
    });
  assert.equal(unrelatedReceiptSummary.status, "ready_to_complete");
  assert.equal(
    unrelatedReceiptSummary.matching_transition_receipt_present,
    false,
  );

  const changeRead = {
    ...reviewListItem,
    proposal: productionSource.proposal_material.proposal,
    criterion_specific_relations_source_bound: true,
    candidates: productionSource.proposal_material.proposal.proposed_deltas.map(
      (candidate, index) => ({
        candidate,
        candidate_fingerprint: admissions[index]!.candidate_fingerprint,
        pilot_admission: admissions[index]!,
      }),
    ),
    source_run_receipts: [productionSource.receipt],
    source_lanes: {
      observations: productionSource.proposal_material.proposal.observations,
      attestations: productionSource.proposal_material.proposal.attestations,
      inferences: productionSource.proposal_material.proposal.inferences,
    },
    decisions: [],
    decision_history: [],
    transition_receipts: [],
    transition: {
      status: "not_applied" as const,
      transition_receipt_id: null,
      transition_receipt_fingerprint: null,
      notes: [],
    },
    strategic_analysis: { status: "unavailable" } as never,
    projection_observed_at: OBSERVED_AT,
    durable_lineage: { chains: [] } as never,
    project_continuity: continuity,
    project_verify_reconciliation: reconciliation,
    project_verify_lineage: lineage,
  } satisfies SemanticReviewProposalDetailV01;
  const changeView = buildAIWorkplaneChangeReviewViewV01({
    read: changeRead,
    selected_candidate_id: changeRead.candidates[0]!.candidate.candidate_id,
  });
  assert.equal(changeView.decision_status, "blocked");
  assert.equal(changeView.verification.failed, 0);
  assert.equal(changeView.verification.unknown, 1);
  assert.equal(changeView.uncertainties.length <= 6, true);
  assert.deepEqual(changeView.authority, aiWorkplanePresentationAuthorityV01());

  const firstCandidate = changeRead.candidates[0]!;
  const secondCandidate = {
    ...structuredClone(firstCandidate),
    candidate: {
      ...structuredClone(firstCandidate.candidate),
      candidate_id: "delta:ai-workplane-exact-pending",
      title: "Complete the exact saved change",
    },
  };
  secondCandidate.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(secondCandidate.candidate);
  secondCandidate.pilot_admission = {
    ...structuredClone(firstCandidate.pilot_admission),
    candidate_id: secondCandidate.candidate.candidate_id,
    candidate_fingerprint: secondCandidate.candidate_fingerprint,
    decision_allowed: {
      accept: true,
      reject: true,
      defer: true,
    },
  };
  const multiCandidateDecisionInput = structuredClone(
    acceptReviewDecisionInputFixture,
  );
  multiCandidateDecisionInput.candidate = {
    candidate_id: secondCandidate.candidate.candidate_id,
    candidate_fingerprint: secondCandidate.candidate_fingerprint,
  };
  multiCandidateDecisionInput.decided_at = "2026-07-20T03:10:00.000Z";
  multiCandidateDecisionInput.rationale_summary =
    "Bind the saved applying decision to the second exact candidate.";
  const multiCandidateDecision = buildReviewDecisionV01(
    multiCandidateDecisionInput,
  );
  const multiCandidateRead = {
    ...changeRead,
    candidates: [firstCandidate, secondCandidate],
    decision_count: 1,
    decisions: [multiCandidateDecision],
    decision_history: [
      exactDecisionHistoryV01(multiCandidateDecision, true),
    ],
    decision_application_summary: {
      status: "ready_to_complete" as const,
      effective_decision: {
        decision: multiCandidateDecision.decision,
        decision_id: multiCandidateDecision.decision_id,
        decision_fingerprint:
          multiCandidateDecision.integrity.fingerprint,
        candidate_id: multiCandidateDecision.candidate.candidate_id,
        candidate_fingerprint:
          multiCandidateDecision.candidate.candidate_fingerprint,
        pilot_actionable: true,
        requested_project_change: true,
        matching_transition_receipt_id: null,
        matching_transition_receipt_fingerprint: null,
      },
      preferred_candidate_id:
        multiCandidateDecision.candidate.candidate_id,
      preferred_candidate_fingerprint:
        multiCandidateDecision.candidate.candidate_fingerprint,
      applying_decision_pending: true,
      matching_transition_receipt_present: false,
      exact_lineage_and_receipt_binding: true as const,
    },
  } satisfies SemanticReviewProposalDetailV01;
  const automaticallySelectedCandidate =
    selectAIWorkplaneChangeCandidateV01(multiCandidateRead, null);
  assert.equal(
    automaticallySelectedCandidate?.candidate.candidate_id,
    secondCandidate.candidate.candidate_id,
  );
  const multiCandidateView = buildAIWorkplaneChangeReviewViewV01({
    read: multiCandidateRead,
    selected_candidate_id: null,
  });
  assert.equal(multiCandidateView.decision_status, "decision_saved");
  assert.equal(multiCandidateView.primary_action?.label, "Review impact");

  let exactRefreshCount = 0;
  let guideRefreshCount = 0;
  const refreshContract =
    refreshAIWorkplaneAfterProjectApplicationV01({
    refresh_exact_review: async () => {
      exactRefreshCount += 1;
    },
    refresh_guide_brief: async () => {
      guideRefreshCount += 1;
    },
  });
  assert.equal(exactRefreshCount, 1);
  assert.equal(guideRefreshCount, 0);
  void refreshContract.then(() => {
    assert.equal(exactRefreshCount, 1);
    assert.equal(guideRefreshCount, 1);
  });

  const resultView = buildAIWorkplaneResultViewV01(
    aiWorkplaneResultV01(productionSource),
  );
  assert.equal(resultView.heading, "Result ready");
  assert.equal(resultView.primary_action.label, "Review suggested change");
  assert.equal(resultView.verification.passed > 0, true);
  assert.equal(resultView.verification.failed, 0);
  assert.deepEqual(resultView.authority, aiWorkplanePresentationAuthorityV01());
  assert.equal(networkGuard.attempts.length, 0);

  console.log(
    JSON.stringify(
      {
        suite: "ai-workplane-human-projection-v0.1",
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
        human_home_state_priority_checked: true,
        one_primary_action_mapping_checked: true,
        bounded_queue_and_deterministic_order_checked: true,
        exact_ready_to_complete_proposal_binding_checked: true,
        reject_defer_and_unrelated_receipt_classification_checked: true,
        lineage_superseded_applying_decision_checked: true,
        pending_applying_candidate_default_selection_checked: true,
        post_application_exact_then_guide_refresh_checked: true,
        change_verification_and_uncertainty_projection_checked: true,
        result_outcome_verification_next_action_checked: true,
        presentation_authority_all_false_checked: true,
        guide_exact_project_mismatch_blocks_actions: true,
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

function exactDecisionHistoryV01(
  decision: ReviewDecisionV01,
  pilotActionable: boolean,
): VNextOperatorPilotDecisionHistoryItemV01 {
  return {
    decision,
    status: "valid",
    pilot_session_bound: true,
    pilot_actionable: pilotActionable,
    session_id: "operator-session:ai-workplane-exact-binding",
    request_fingerprint: `sha256:${"9".repeat(64)}`,
    errors: [],
  };
}

function exactDecisionCandidateAdmissionV01(
  decision: ReviewDecisionV01,
): VNextOperatorPilotCandidateAdmissionV01 {
  const candidate = reviewDecisionGenericSourceProposal.proposed_deltas.find(
    (entry) =>
      entry.candidate_id === decision.candidate.candidate_id,
  );
  assert(candidate);
  assert.equal(
    createEpisodeDeltaCandidateFingerprintV01(candidate),
    decision.candidate.candidate_fingerprint,
  );
  return {
    policy_version: "vnext_operator_pilot_policy.v0.1",
    candidate_id: decision.candidate.candidate_id,
    candidate_fingerprint: decision.candidate.candidate_fingerprint,
    target_count: candidate.target_refs.length,
    current_state_status: "absent",
    target_states: candidate.target_refs.map((target_ref, index) => ({
      target_ref,
      target_key: `target:exact-decision:${index}`,
      presence: "absent",
      revision: 0,
      state_fingerprint: null,
      source_transition_receipt_id: null,
      source_transition_receipt_fingerprint: null,
    })),
    decision_allowed: {
      accept: true,
      reject: true,
      defer: true,
    },
    mapped_operation: "create",
    accept_operation: "create",
    blocking_reasons: [],
    policy_notes: [],
  };
}

function aiWorkplaneGuideSourceV01(): BlankStateSourceV01 {
  const projection = {
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    generated_at: OBSERVED_AT,
    project_summary: {
      project: { project_id: PROJECT_ID, display_name: "AI Workplane project" },
      root_availability: "available",
      is_active: true,
      active_selection: { project_id: PROJECT_ID, selection_revision: 1 },
    },
    coordination: {
      task_frame: {
        goal: "Review the bounded current result",
        success_criteria: ["The current result is reviewed"],
        non_goals: ["Do not broaden authority"],
        required_checks: ["npm test"],
        forbidden_actions: ["Do not apply automatically"],
        tensions: [],
        risks: [],
        gaps: [],
      },
    },
    run_results: { current_run: null, latest_result: null, workbench_entry: null },
    attention: { items: [] },
    recent_activity: { items: [] },
  } as unknown as ProjectHomeProjectionV01;
  return {
    route_mode: "canonical",
    requested_project_id: null,
    active_project_id: PROJECT_ID,
    recent_projects: [],
    projection,
    project_resolution: "resolved",
    direct_host_round_trip_available: false,
  };
}

function aiWorkplaneContinuityV01(): VNextOperatorPilotProjectContinuityV01 {
  return {
    continuity_version: "vnext_operator_pilot_project_continuity.v0.1",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    pending_proposal_count: 0,
    pending_accepted_decision_count: 0,
    latest_applied_transition: null,
    current_accepted_state_count: 0,
    latest_target_head_revision: null,
    latest_compiled_packet: null,
    packet_currentness: "not_available",
    latest_context_use_receipt: null,
    latest_context_use_review_status: null,
    projection_is_read_only: true,
    semantic_authority_granted: false,
  };
}

function aiWorkplaneResultV01(
  source: ReturnType<typeof buildProjectVerifyWorkbenchFixtureV01>,
): ProjectRunResultDetailV01 {
  const receipt = source.receipt;
  const proposal = source.proposal_material.proposal;
  return {
    read_model_version: "project_run_result_read_model.v0.1",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    summary: {
      receipt_ref: receipt.receipt_id,
      run_ref: receipt.run_id,
      outcome: receipt.result_summary.outcome,
      execution_status: receipt.execution.status,
      verification_status: receipt.verification.status,
      recorded_at: receipt.recorded_at,
      started_at: receipt.started_at,
      finished_at: receipt.finished_at,
      summary: receipt.result_summary.summary,
      changed_file_count: receipt.changed_artifacts.length,
      artifact_count: receipt.artifact_refs.length,
      command_count: receipt.commands.length,
      action_count: 0,
      check_counts: {
        passed: receipt.checks.filter((entry) => entry.status === "passed").length,
        failed: receipt.checks.filter((entry) => entry.status === "failed").length,
        blocked: receipt.checks.filter((entry) => entry.status === "blocked").length,
        unknown: receipt.checks.filter((entry) => entry.status === "unknown").length,
        skipped: receipt.skipped_checks.length,
      },
      blocker_count: receipt.blockers.length,
      gap_count: receipt.gaps.length,
      trust_label: "observed",
      review_attention: "terminal_result_available",
      review_href: `/workbench/results/${receipt.receipt_id.replace(":", "~")}`,
      inspector_href: "/workbench/inspector?target=run_receipt",
      mode: "interactive",
    },
    identity: {
      receipt_ref: receipt.receipt_id,
      receipt_fingerprint: receipt.integrity.fingerprint,
      run_ref: receipt.run_id,
      work_ref: receipt.work_ref,
      packet_ref: receipt.task_context_packet_ref,
      source_transition_ref: null,
      root_scope_ref: null,
      repository_ref: null,
      selected_worktree_ref: null,
      adapter_ref: null,
      capability_ref: null,
      source_refs: [],
    },
    packet: {
      status: "available",
      generated_at: source.packet.generated_at,
      packet_fingerprint: source.packet.integrity.fingerprint,
      selected_context_count: source.packet.selected_context.length,
      selected_context_refs: [],
      source_ref_count: 0,
    },
    criterion_assessment: {
      status: "available",
      assessment: source.assessment,
      criterion_specific_relations_available: true,
      task_success_status:
        source.assessment.summary.unsatisfied > 0
          ? "unsatisfied"
          : source.assessment.summary.unknown > 0
            ? "unknown"
            : "satisfied",
      source_validation: "recomputed_from_packet_and_receipt",
    },
    proposal: {
      status: "available",
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      proposal_status: "pending_review",
      admission_idempotency_key: source.proposal_material.identity.idempotency_key,
      review_href: `/workbench/semantic-review/${proposal.proposal_id.replace(":", "~")}`,
    },
    automation: null,
    host: { host_ref: null, host_refs: [], approvals: [] },
    artifacts: [],
    commands: [],
    actions: [],
    checks: [],
    skipped_checks: [],
    blockers: [],
    warnings: [],
    gaps: [],
    uncertainty: [],
    proposed_next_steps: [],
    model_invocations: [],
    capability_coverage: [],
    trust_summary: receipt.trust_summary,
    privacy_egress: receipt.privacy_egress,
    compatibility: { source_contracts: [], unmapped_fields: [], warnings: [] },
    authority: {
      proposal_created: false,
      review_decision_created: false,
      semantic_transition_created: false,
      evidence_accepted: false,
      work_closed: false,
      semantic_state_changed: false,
    },
  };
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
