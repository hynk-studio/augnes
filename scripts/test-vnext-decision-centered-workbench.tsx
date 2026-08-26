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
import {
  buildSelectedWorkTimelineV01,
  selectNextSelectedWorkCandidateV01,
  selectSelectedCandidateActionableApplyingDecisionV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import {
  buildSelectedWorkRelationshipsV01,
} from "@/lib/vnext/ai-workplane/selected-work-relationships";
import {
  effectiveSelectedWorkRelationshipQuestionV01,
  selectedWorkRelationshipScopeKeyV01,
} from "@/components/workbench/semantic-review/selected-work-relationship-selection";
import { semanticReviewDetailEntryPresentationV01 } from "@/components/workbench/semantic-review/semantic-review-entry-presentation";
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
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type {
  ProjectVerifyExactProtocolKindV01,
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
import type {
  DelegatedWorkProjectionV01,
  DelegatedWorkStageV01,
} from "@/types/vnext/delegated-work";
import type { ProjectHomeProjectionV01 } from "@/types/vnext/project-home";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";
import type { VNextOperatorPilotReviewListItemV01 } from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { VNextOperatorPilotCandidateAdmissionV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { SelectedWorkTimelineV01 } from "@/types/vnext/selected-work-timeline";

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
        delegated_work: null,
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
  assert.equal(idle.primary_action?.label, "Return to Continuities");

  const firstWorkInitialization = {
    initialization_version: "project_work_initialization.v0.1" as const,
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    state: "not_defined" as const,
    reason: "zero_durable_work_history" as const,
    active_project_id: PROJECT_ID,
    active_selection_revision: 1,
    current_work: null,
    current_packet: null,
    mutation_eligible: true,
    revision_eligibility: {
      eligibility_version: "project_work_revision_eligibility.v0.1" as const,
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      active_project_id: PROJECT_ID,
      active_selection_revision: 1,
      current_packet_id: null,
      current_packet_fingerprint: null,
      current_lineage_kind: null,
      revision_count: 0,
      status: "unavailable" as const,
      reason: "source_unavailable" as const,
      eligible: false,
      projection_only: true as const,
      semantic_authority_granted: false as const,
      execution_authority_granted: false as const,
    },
    projection_only: true as const,
    semantic_authority_granted: false as const,
    execution_authority_granted: false as const,
  };
  const firstWorkHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [],
    continuity,
    work_initialization: firstWorkInitialization,
  });
  assert.equal(firstWorkHome.state, "first_work_definition");
  assert.equal(firstWorkHome.heading, "Define the first work");
  assert.equal(firstWorkHome.primary_action?.label, "Save first work");
  assert.equal(firstWorkHome.authority.grants_execution_authority, false);

  const unavailableWorkHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [],
    continuity,
    work_initialization: {
      ...firstWorkInitialization,
      state: "existing_history_without_current_packet",
      reason: "durable_history_without_current_packet",
      mutation_eligible: false,
    },
  });
  assert.equal(unavailableWorkHome.state, "work_instructions_unavailable");
  assert.notEqual(unavailableWorkHome.primary_action?.label, "Save first work");

  const unavailableInitialization = {
    ...firstWorkInitialization,
    state: "unavailable" as const,
    reason: "source_unavailable" as const,
    mutation_eligible: false,
  };
  for (const workInitialization of [
    {
      ...firstWorkInitialization,
      state: "existing_history_without_current_packet" as const,
      reason: "durable_history_without_current_packet" as const,
      mutation_eligible: false,
    },
    {
      ...firstWorkInitialization,
      state: "existing_history_without_current_packet" as const,
      reason: "future_additive_recovery_reason",
      mutation_eligible: false,
    } as unknown as ProjectWorkInitializationV01,
    unavailableInitialization,
  ]) {
    for (const [stage, expected] of [
      ["waiting_for_approval", "delegated_approval"],
      ["working", "work_in_progress"],
      ["result_ready", "result_ready"],
    ] as const) {
      assert.equal(
        buildAIWorkplaneHomeViewV01({
          access: "authenticated",
          loading: false,
          guide,
          proposals: [],
          continuity,
          delegated_work: delegatedWorkV01(stage),
          work_initialization: workInitialization,
        }).state,
        expected,
        `${workInitialization.state}:${stage}`,
      );
    }
    const proposalOwner = buildAIWorkplaneHomeViewV01({
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
      work_initialization: workInitialization,
    });
    assert.equal(proposalOwner.state, "change_decision");
    const completionOwner = buildAIWorkplaneHomeViewV01({
      access: "authenticated",
      loading: false,
      guide,
      proposals: [
        {
          ...reviewListItem,
          decision_application_summary: {
            ...reviewListItem.decision_application_summary,
            status: "ready_to_complete",
          },
        },
      ],
      continuity,
      work_initialization: workInitialization,
    });
    assert.equal(completionOwner.state, "change_completion");
    const delegatedReady = {
      ...delegatedWorkV01("not_started"),
      start_eligible: true,
      start_blocker: null,
    };
    assert.equal(
      buildAIWorkplaneHomeViewV01({
        access: "authenticated",
        loading: false,
        guide,
        proposals: [],
        continuity,
        delegated_work: delegatedReady,
        work_initialization: workInitialization,
      }).state,
      "work_instructions_unavailable",
    );
    assert.equal(
      buildAIWorkplaneHomeViewV01({
        access: "authenticated",
        loading: false,
        guide,
        proposals: [],
        continuity,
        work_initialization: workInitialization,
      }).state,
      "work_instructions_unavailable",
    );
  }

  const delegatedApprovalHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [reviewListItem],
    continuity,
    delegated_work: delegatedWorkV01("waiting_for_approval"),
  });
  assert.equal(delegatedApprovalHome.state, "delegated_approval");
  assert.equal(
    delegatedApprovalHome.primary_action?.label,
    "Review requested access",
  );
  const delegatedResumeHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [reviewListItem],
    continuity,
    delegated_work: delegatedWorkV01("resume_required"),
  });
  assert.equal(delegatedResumeHome.state, "delegated_resume");
  assert.equal(delegatedResumeHome.primary_action?.label, "Resume Codex work");
  const delegatedWorkingHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [reviewListItem],
    continuity,
    delegated_work: delegatedWorkV01("working"),
  });
  assert.equal(delegatedWorkingHome.state, "work_in_progress");
  assert.equal(delegatedWorkingHome.primary_action, null);
  const delegatedResultHome = buildAIWorkplaneHomeViewV01({
    access: "authenticated",
    loading: false,
    guide,
    proposals: [reviewListItem],
    continuity,
    delegated_work: delegatedWorkV01("result_ready"),
  });
  assert.equal(delegatedResultHome.state, "result_ready");
  assert.equal(delegatedResultHome.primary_action?.label, "Review result");

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

  const ambiguousHistoricalSummary =
    deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
      source_currentness: "fresh",
      candidate_admissions: [exactCandidateAdmission],
      decision_history: [
        {
          ...exactDecisionHistoryV01(exactApplyingDecision, true),
          status: "invalid",
          pilot_session_bound: false,
          pilot_actionable: false,
          session_id: null,
          request_fingerprint: null,
          errors: ["operator_pilot_decision_record_provenance_mismatch"],
        },
      ],
      transition_receipts: [],
    });
  assert.equal(ambiguousHistoricalSummary.status, "continue_review");
  assert.equal(ambiguousHistoricalSummary.effective_decision, null);
  assert.equal(ambiguousHistoricalSummary.applying_decision_pending, false);

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
    blocking_reasons: [],
  };
  const multiCandidateDecisionInput = structuredClone(
    acceptReviewDecisionInputFixture,
  );
  multiCandidateDecisionInput.workspace_id = changeRead.proposal.workspace_id;
  multiCandidateDecisionInput.project_id = changeRead.proposal.project_id;
  multiCandidateDecisionInput.source_proposal = {
    proposal_version: changeRead.proposal.proposal_version,
    proposal_id: changeRead.proposal.proposal_id,
    proposal_fingerprint: changeRead.proposal.integrity.fingerprint,
  };
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
  const appliedMultiCandidateReceipt = {
    ...exactAppliedReceipt,
    source_proposal: {
      proposal_version: changeRead.proposal.proposal_version,
      proposal_id: changeRead.proposal.proposal_id,
      proposal_fingerprint: changeRead.proposal.integrity.fingerprint,
    },
    source_decision: {
      ...exactAppliedReceipt.source_decision,
      decision_id: multiCandidateDecision.decision_id,
      decision_fingerprint: multiCandidateDecision.integrity.fingerprint,
    },
    source_candidate: {
      candidate_id: secondCandidate.candidate.candidate_id,
      candidate_fingerprint: secondCandidate.candidate_fingerprint,
    },
  };
  const multiCandidateAfterApplication = {
    ...multiCandidateRead,
    transition_receipts: [appliedMultiCandidateReceipt],
    transition: {
      status: "applied" as const,
      transition_receipt_id:
        appliedMultiCandidateReceipt.transition_receipt_id,
      transition_receipt_fingerprint:
        appliedMultiCandidateReceipt.integrity.fingerprint,
      notes: [],
    },
    decision_application_summary: {
      ...multiCandidateRead.decision_application_summary,
      status: "project_updated" as const,
      applying_decision_pending: false,
      matching_transition_receipt_present: true,
    },
  } satisfies SemanticReviewProposalDetailV01;
  const remainingDecisionCandidate =
    selectAIWorkplaneChangeCandidateV01(
      multiCandidateAfterApplication,
      null,
    );
  assert.equal(
    remainingDecisionCandidate?.candidate.candidate_id,
    firstCandidate.candidate.candidate_id,
  );
  const remainingDecisionView = buildAIWorkplaneChangeReviewViewV01({
    read: multiCandidateAfterApplication,
    selected_candidate_id: null,
  });
  assert.equal(remainingDecisionView.decision_status, "blocked");
  const multiCandidateView = buildAIWorkplaneChangeReviewViewV01({
    read: multiCandidateRead,
    selected_candidate_id: null,
  });
  assert.equal(multiCandidateView.decision_status, "decision_saved");
  assert.equal(multiCandidateView.primary_action?.label, "Review impact");

  const timelineCandidate = structuredClone(secondCandidate);
  timelineCandidate.pilot_admission.blocking_reasons = [];
  timelineCandidate.pilot_admission.decision_allowed.accept = true;
  const timelineBaseRead = {
    ...multiCandidateRead,
    candidates: [timelineCandidate],
    decisions: [],
    decision_history: [],
    transition_receipts: [],
    transition: {
      status: "not_applied" as const,
      transition_receipt_id: null,
      transition_receipt_fingerprint: null,
      notes: [],
    },
    project_continuity: aiWorkplaneContinuityV01(),
    durable_lineage: { chains: [] } as never,
  } satisfies SemanticReviewProposalDetailV01;
  const withTimelineSourceSummary = (
    read: SemanticReviewProposalDetailV01,
  ): SemanticReviewProposalDetailV01 => ({
    ...read,
    decision_application_summary:
      deriveVNextOperatorPilotProposalDecisionApplicationSummaryV01({
        source_currentness: read.source_currentness,
        candidate_admissions: read.candidates.map(
          (candidate) => candidate.pilot_admission,
        ),
        decision_history: read.decision_history,
        transition_receipts: read.transition_receipts,
      }),
  });
  const timelineForSelected = (
    read: SemanticReviewProposalDetailV01,
    selectedCandidate: SemanticReviewProposalDetailV01["candidates"][number],
  ) =>
    buildSelectedWorkTimelineV01({
      read: withTimelineSourceSummary(read),
      selected_candidate: selectedCandidate,
    });
  const assertNextCandidateOwnerConsistency = (
    read: SemanticReviewProposalDetailV01,
    selectedCandidate: SemanticReviewProposalDetailV01["candidates"][number],
    expectedCandidateId: string | null,
  ) => {
    const normalizedRead = withTimelineSourceSummary(read);
    const timeline = buildSelectedWorkTimelineV01({
      read: normalizedRead,
      selected_candidate: selectedCandidate,
    });
    const nextCandidate = selectNextSelectedWorkCandidateV01({
      read: normalizedRead,
      selected_candidate: selectedCandidate,
    });
    assert.equal(
      timeline.current_position.primary_action_owner ===
        "candidate_selection",
      nextCandidate !== null,
      "the timeline candidate-selection owner and shared next-candidate projection must agree",
    );
    assert.equal(
      nextCandidate?.candidate.candidate_id ?? null,
      expectedCandidateId,
    );
    return { timeline, nextCandidate, read: normalizedRead };
  };
  const timelineFor = (read: SemanticReviewProposalDetailV01) =>
    timelineForSelected(read, read.candidates[0]!);
  const noDecisionTimeline = timelineFor(timelineBaseRead);
  assert.equal(noDecisionTimeline.timeline_version, "selected_work_timeline.v0.1");
  assert.deepEqual(
    noDecisionTimeline.items.map((item) => item.stage),
    ["source_observed", "change_suggested", "review_focused"],
  );
  assert.equal(noDecisionTimeline.current_position.stage, "review_focused");
  assert.equal(noDecisionTimeline.current_position.primary_action_owner, "decision");
  assert.equal(
    noDecisionTimeline.items.filter(
      (item) => item.item_id === noDecisionTimeline.current_item_id,
    ).length,
    1,
  );
  assert.equal(noDecisionTimeline.items.length <= 8, true);
  assert.equal(noDecisionTimeline.authority.writes_database, false);
  assert.equal(noDecisionTimeline.authority.creates_decision, false);
  assert.equal(noDecisionTimeline.authority.authorizes_transition, false);
  assert.equal(noDecisionTimeline.authority.applies_transition, false);
  assert.equal(noDecisionTimeline.authority.establishes_verified_success, false);
  assert.equal(noDecisionTimeline.authority.calls_model_or_provider, false);

  const acceptedTimelineDecision = {
    ...structuredClone(multiCandidateDecision),
    decided_at: "2026-07-20T03:10:00.000Z",
  };
  const historyFor = (
    decision: ReviewDecisionV01,
    pilotActionable = true,
  ): VNextOperatorPilotDecisionHistoryItemV01 => ({
    decision,
    status: "valid",
    pilot_session_bound: true,
    pilot_actionable: pilotActionable,
    session_id: "operator-session:pc2-timeline",
    request_fingerprint: `sha256:${"8".repeat(64)}`,
    errors: [],
  });
  const acceptedRead = {
    ...timelineBaseRead,
    decisions: [acceptedTimelineDecision],
    decision_history: [historyFor(acceptedTimelineDecision)],
  } satisfies SemanticReviewProposalDetailV01;
  const currentSessionAcceptedRead = withTimelineSourceSummary(acceptedRead);
  assert.equal(
    currentSessionAcceptedRead.decision_application_summary.status,
    "ready_to_complete",
  );
  assert.equal(
    currentSessionAcceptedRead.decision_application_summary
      .effective_decision?.pilot_actionable,
    true,
  );
  const acceptedTimeline = timelineFor(acceptedRead);
  assert.equal(acceptedTimeline.current_position.stage, "awaiting_application");
  assert.equal(acceptedTimeline.current_position.primary_action_owner, "transition");
  assert.deepEqual(
    new Set(acceptedTimeline.items.map((item) => item.basis)),
    new Set(["observed", "bounded_interpretation", "user_decision"]),
  );
  assert.equal(
    semanticReviewDetailEntryPresentationV01(
      acceptedRead,
      timelineCandidate.candidate.candidate_id,
    ).state,
    "decided_proposal",
  );

  const candidateLocalA = structuredClone(timelineCandidate);
  candidateLocalA.candidate = {
    ...candidateLocalA.candidate,
    candidate_id: "delta:pc2-candidate-local-a",
    title: "Apply candidate-local change A",
  };
  candidateLocalA.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(candidateLocalA.candidate);
  candidateLocalA.pilot_admission = {
    ...candidateLocalA.pilot_admission,
    candidate_id: candidateLocalA.candidate.candidate_id,
    candidate_fingerprint: candidateLocalA.candidate_fingerprint,
  };
  const candidateLocalB = structuredClone(timelineCandidate);
  candidateLocalB.candidate = {
    ...candidateLocalB.candidate,
    candidate_id: "delta:pc2-candidate-local-b",
    title: "Apply candidate-local change B",
  };
  candidateLocalB.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(candidateLocalB.candidate);
  candidateLocalB.pilot_admission = {
    ...candidateLocalB.pilot_admission,
    candidate_id: candidateLocalB.candidate.candidate_id,
    candidate_fingerprint: candidateLocalB.candidate_fingerprint,
  };
  const candidateApplyingDecisionV01 = (
    candidate: SemanticReviewProposalDetailV01["candidates"][number],
    suffix: "a" | "b",
    decidedAt: string,
  ): ReviewDecisionV01 => {
    const input = structuredClone(acceptReviewDecisionInputFixture);
    input.workspace_id = timelineBaseRead.proposal.workspace_id;
    input.project_id = timelineBaseRead.proposal.project_id;
    input.source_proposal = {
      proposal_version: timelineBaseRead.proposal.proposal_version,
      proposal_id: timelineBaseRead.proposal.proposal_id,
      proposal_fingerprint: timelineBaseRead.proposal.integrity.fingerprint,
    };
    input.candidate = {
      candidate_id: candidate.candidate.candidate_id,
      candidate_fingerprint: candidate.candidate_fingerprint,
    };
    input.decided_at = decidedAt;
    input.rationale_summary =
      `Accept exact candidate ${suffix.toUpperCase()} in this operator session.`;
    input.requested_transition_intent = {
      ...input.requested_transition_intent!,
      intent_id: `transition-intent:pc2-candidate-local-${suffix}`,
      target_refs: candidate.candidate.target_refs,
    };
    return buildReviewDecisionV01(input);
  };
  const candidateLocalDecisionA = candidateApplyingDecisionV01(
    candidateLocalA,
    "a",
    "2026-07-20T03:20:00.000Z",
  );
  const candidateLocalDecisionB = candidateApplyingDecisionV01(
    candidateLocalB,
    "b",
    "2026-07-20T03:21:00.000Z",
  );
  const twoActionableCandidatesRead = withTimelineSourceSummary({
    ...timelineBaseRead,
    candidates: [candidateLocalA, candidateLocalB],
    decisions: [candidateLocalDecisionA, candidateLocalDecisionB],
    decision_history: [
      historyFor(candidateLocalDecisionA),
      historyFor(candidateLocalDecisionB),
    ],
  } satisfies SemanticReviewProposalDetailV01);
  assert.equal(
    twoActionableCandidatesRead.decision_application_summary
      .effective_decision?.candidate_id,
    candidateLocalB.candidate.candidate_id,
    "the proposal-wide summary intentionally selects the later candidate",
  );
  for (const [candidate, decision] of [
    [candidateLocalA, candidateLocalDecisionA],
    [candidateLocalB, candidateLocalDecisionB],
  ] as const) {
    const timeline = timelineForSelected(
      twoActionableCandidatesRead,
      candidate,
    );
    assert.equal(timeline.current_position.stage, "awaiting_application");
    assert.equal(
      timeline.current_position.primary_action_owner,
      "transition",
    );
    assert.equal(
      selectSelectedCandidateActionableApplyingDecisionV01({
        read: twoActionableCandidatesRead,
        selected_candidate: candidate,
      })?.decision_id,
      decision.decision_id,
      "the Transition action region receives the selected candidate's exact applying decision",
    );
  }
  const contradictoryExactSummaryRead = {
    ...twoActionableCandidatesRead,
    decision_application_summary: {
      ...twoActionableCandidatesRead.decision_application_summary,
      status: "continue_review" as const,
      effective_decision: {
        decision: candidateLocalDecisionA.decision,
        decision_id: candidateLocalDecisionA.decision_id,
        decision_fingerprint:
          candidateLocalDecisionA.integrity.fingerprint,
        candidate_id: candidateLocalA.candidate.candidate_id,
        candidate_fingerprint: candidateLocalA.candidate_fingerprint,
        pilot_actionable: false,
        requested_project_change: true,
        matching_transition_receipt_id: null,
        matching_transition_receipt_fingerprint: null,
      },
      applying_decision_pending: false,
      matching_transition_receipt_present: false,
    },
  } satisfies SemanticReviewProposalDetailV01;
  assert.equal(
    buildSelectedWorkTimelineV01({
      read: contradictoryExactSummaryRead,
      selected_candidate: candidateLocalA,
    }).current_position.stage,
    "decision_recorded",
    "an exact same-decision summary contradiction must fail closed",
  );
  assert.equal(
    selectSelectedCandidateActionableApplyingDecisionV01({
      read: contradictoryExactSummaryRead,
      selected_candidate: candidateLocalA,
    }),
    null,
  );

  const mixedCandidateActionability = (
    candidateAActionable: boolean,
    candidateBActionable: boolean,
  ) =>
    withTimelineSourceSummary({
      ...twoActionableCandidatesRead,
      decision_history: [
        historyFor(candidateLocalDecisionA, candidateAActionable),
        historyFor(candidateLocalDecisionB, candidateBActionable),
      ],
    });
  for (const [candidateAActionable, candidateBActionable] of [
    [true, false],
    [false, true],
  ] as const) {
    const mixedRead = mixedCandidateActionability(
      candidateAActionable,
      candidateBActionable,
    );
    const candidateATimeline = timelineForSelected(mixedRead, candidateLocalA);
    const candidateBTimeline = timelineForSelected(mixedRead, candidateLocalB);
    assert.equal(
      candidateATimeline.current_position.stage,
      candidateAActionable
        ? "awaiting_application"
        : "decision_recorded",
    );
    assert.equal(
      candidateATimeline.current_position.primary_action_owner,
      candidateAActionable ? "transition" : "decision",
    );
    assert.equal(
      candidateBTimeline.current_position.stage,
      candidateBActionable
        ? "awaiting_application"
        : "decision_recorded",
    );
    assert.equal(
      candidateBTimeline.current_position.primary_action_owner,
      candidateBActionable ? "transition" : "decision",
    );
  }

  const candidateLocalReceiptA = {
    ...structuredClone(appliedMultiCandidateReceipt),
    transition_receipt_id: "state-transition-receipt:pc2-candidate-local-a",
    source_proposal: {
      proposal_version: timelineBaseRead.proposal.proposal_version,
      proposal_id: timelineBaseRead.proposal.proposal_id,
      proposal_fingerprint: timelineBaseRead.proposal.integrity.fingerprint,
    },
    source_decision: {
      ...appliedMultiCandidateReceipt.source_decision,
      decision_id: candidateLocalDecisionA.decision_id,
      decision_fingerprint: candidateLocalDecisionA.integrity.fingerprint,
    },
    source_candidate: {
      candidate_id: candidateLocalA.candidate.candidate_id,
      candidate_fingerprint: candidateLocalA.candidate_fingerprint,
    },
    integrity: {
      ...appliedMultiCandidateReceipt.integrity,
      fingerprint: `sha256:${"c".repeat(64)}`,
    },
  };
  const candidateAAppliedRead = withTimelineSourceSummary({
    ...twoActionableCandidatesRead,
    transition_receipts: [candidateLocalReceiptA],
  } satisfies SemanticReviewProposalDetailV01);
  const candidateAAppliedSelection =
    assertNextCandidateOwnerConsistency(
      candidateAAppliedRead,
      candidateLocalA,
      candidateLocalB.candidate.candidate_id,
    );
  assert.equal(
    candidateAAppliedSelection.timeline.current_position.stage,
    "project_updated",
  );
  assert.equal(
    candidateAAppliedSelection.timeline.current_position
      .primary_action_owner,
    "candidate_selection",
    "an applied candidate must offer the next exact applying-unapplied candidate",
  );
  const candidateBUnappliedTimeline = timelineForSelected(
    candidateAAppliedRead,
    candidateLocalB,
  );
  assert.equal(
    candidateBUnappliedTimeline.current_position.stage,
    "awaiting_application",
  );
  assert.equal(
    candidateBUnappliedTimeline.current_position.primary_action_owner,
    "transition",
  );
  assert.equal(
    selectSelectedCandidateActionableApplyingDecisionV01({
      read: candidateAAppliedRead,
      selected_candidate: candidateLocalB,
    })?.decision_id,
    candidateLocalDecisionB.decision_id,
    "candidate A's receipt must not suppress candidate B's exact preview action",
  );

  const candidateBUndecidedRead = withTimelineSourceSummary({
    ...twoActionableCandidatesRead,
    decisions: [candidateLocalDecisionA],
    decision_history: [historyFor(candidateLocalDecisionA)],
    transition_receipts: [candidateLocalReceiptA],
  } satisfies SemanticReviewProposalDetailV01);
  assert.equal(
    assertNextCandidateOwnerConsistency(
      candidateBUndecidedRead,
      candidateLocalA,
      candidateLocalB.candidate.candidate_id,
    ).timeline.current_position.stage,
    "project_updated",
  );
  const candidateBUndecidedTimeline = timelineForSelected(
    candidateBUndecidedRead,
    candidateLocalB,
  );
  assert.equal(
    candidateBUndecidedTimeline.current_position.stage,
    "review_focused",
  );
  assert.equal(
    candidateBUndecidedTimeline.current_position.primary_action_owner,
    "decision",
  );

  const candidateBPriorSessionRead = withTimelineSourceSummary({
    ...candidateAAppliedRead,
    decision_history: [
      historyFor(candidateLocalDecisionA),
      historyFor(candidateLocalDecisionB, false),
    ],
  } satisfies SemanticReviewProposalDetailV01);
  assertNextCandidateOwnerConsistency(
    candidateBPriorSessionRead,
    candidateLocalA,
    candidateLocalB.candidate.candidate_id,
  );
  const candidateBPriorSessionTimeline = timelineForSelected(
    candidateBPriorSessionRead,
    candidateLocalB,
  );
  assert.equal(
    candidateBPriorSessionTimeline.current_position.stage,
    "decision_recorded",
  );
  assert.equal(
    candidateBPriorSessionTimeline.current_position.primary_action_owner,
    "decision",
    "a prior-session applying decision requires renewed current review rather than Transition authority",
  );

  const candidateLocalBBlocked = structuredClone(candidateLocalB);
  candidateLocalBBlocked.pilot_admission = {
    ...candidateLocalBBlocked.pilot_admission,
    decision_allowed: {
      ...candidateLocalBBlocked.pilot_admission.decision_allowed,
      accept: false,
    },
    blocking_reasons: ["current_state_drifted"],
  };
  const candidateBBlockedRead = withTimelineSourceSummary({
    ...candidateAAppliedRead,
    candidates: [candidateLocalA, candidateLocalBBlocked],
  } satisfies SemanticReviewProposalDetailV01);
  assertNextCandidateOwnerConsistency(
    candidateBBlockedRead,
    candidateLocalA,
    candidateLocalB.candidate.candidate_id,
  );
  const candidateBBlockedTimeline = timelineForSelected(
    candidateBBlockedRead,
    candidateLocalBBlocked,
  );
  assert.equal(
    candidateBBlockedTimeline.current_position.stage,
    "transition_blocked",
  );
  assert.equal(
    candidateBBlockedTimeline.current_position.primary_action_owner,
    "transition",
  );
  assert.equal(
    candidateBBlockedTimeline.authority.authorizes_transition,
    false,
  );
  assert.equal(
    candidateBBlockedTimeline.authority.applies_transition,
    false,
    "selecting a blocked candidate must not expand Transition authority",
  );

  const candidateLocalReceiptB = {
    ...structuredClone(candidateLocalReceiptA),
    transition_receipt_id:
      "state-transition-receipt:pc2-candidate-local-b",
    source_decision: {
      ...candidateLocalReceiptA.source_decision,
      decision_id: candidateLocalDecisionB.decision_id,
      decision_fingerprint: candidateLocalDecisionB.integrity.fingerprint,
    },
    source_candidate: {
      candidate_id: candidateLocalB.candidate.candidate_id,
      candidate_fingerprint: candidateLocalB.candidate_fingerprint,
    },
    integrity: {
      ...candidateLocalReceiptA.integrity,
      fingerprint: `sha256:${"d".repeat(64)}`,
    },
  };
  const bothCandidatesAppliedRead = withTimelineSourceSummary({
    ...candidateAAppliedRead,
    transition_receipts: [
      candidateLocalReceiptA,
      candidateLocalReceiptB,
    ],
  } satisfies SemanticReviewProposalDetailV01);
  const bothCandidatesAppliedSelection =
    assertNextCandidateOwnerConsistency(
      bothCandidatesAppliedRead,
      candidateLocalA,
      null,
    );
  assert.equal(
    bothCandidatesAppliedSelection.timeline.current_position.stage,
    "project_updated",
  );
  assert.equal(
    bothCandidatesAppliedSelection.timeline.current_position
      .primary_action_owner,
    "none",
  );

  for (const mismatchedReceipt of [
    {
      ...structuredClone(candidateLocalReceiptB),
      source_decision: {
        ...candidateLocalReceiptB.source_decision,
        decision_fingerprint: `sha256:${"e".repeat(64)}`,
      },
    },
    {
      ...structuredClone(candidateLocalReceiptB),
      source_candidate: {
        ...candidateLocalReceiptB.source_candidate,
        candidate_fingerprint: candidateLocalA.candidate_fingerprint,
      },
    },
  ]) {
    assertNextCandidateOwnerConsistency(
      withTimelineSourceSummary({
        ...candidateAAppliedRead,
        transition_receipts: [
          candidateLocalReceiptA,
          mismatchedReceipt,
        ],
      } satisfies SemanticReviewProposalDetailV01),
      candidateLocalA,
      candidateLocalB.candidate.candidate_id,
    );
  }

  const priorSessionAcceptedRead = withTimelineSourceSummary({
    ...acceptedRead,
    decision_history: [historyFor(acceptedTimelineDecision, false)],
  });
  assert.equal(
    priorSessionAcceptedRead.decision_application_summary.status,
    "continue_review",
  );
  assert.equal(
    priorSessionAcceptedRead.decision_application_summary.effective_decision
      ?.pilot_actionable,
    false,
  );
  const priorSessionAcceptedTimeline = timelineFor(
    priorSessionAcceptedRead,
  );
  assert.equal(
    priorSessionAcceptedTimeline.items.some(
      (item) =>
        item.stage === "decision_recorded" &&
        item.source_refs.some(
          (ref) =>
            ref.record_id === acceptedTimelineDecision.decision_id,
        ),
    ),
    true,
  );
  assert.equal(
    priorSessionAcceptedTimeline.current_position.stage,
    "decision_recorded",
  );
  assert.equal(
    priorSessionAcceptedTimeline.current_position.primary_action_owner,
    "decision",
  );
  assert.equal(
    priorSessionAcceptedTimeline.items.some(
      (item) => item.stage === "awaiting_application",
    ),
    false,
  );
  const priorSessionAcceptedView = buildAIWorkplaneChangeReviewViewV01({
    read: priorSessionAcceptedRead,
    selected_candidate_id: timelineCandidate.candidate.candidate_id,
  });
  assert.equal(priorSessionAcceptedView.decision_status, "needs_decision");
  assert.equal(
    priorSessionAcceptedView.primary_action?.label,
    "Save decision",
  );
  assert.equal(
    semanticReviewDetailEntryPresentationV01(
      priorSessionAcceptedRead,
      timelineCandidate.candidate.candidate_id,
    ).state,
    "pending_proposal",
  );

  const rejectedDecision = {
    ...structuredClone(acceptedTimelineDecision),
    decision_id: "review-decision:pc2-reject",
    decision: "reject" as const,
    decided_at: "2026-07-20T03:11:00.000Z",
    requested_transition_intent: null,
    rationale_summary: "The suggested change is not appropriate now.",
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
    integrity: {
      ...acceptedTimelineDecision.integrity,
      fingerprint: `sha256:${"1".repeat(64)}`,
    },
  };
  const rejectedRead = withTimelineSourceSummary({
    ...timelineBaseRead,
    decisions: [rejectedDecision],
    decision_history: [historyFor(rejectedDecision, false)],
  });
  assert.equal(
    rejectedRead.decision_application_summary.status,
    "rejected",
  );
  const rejectedTimeline = timelineFor(rejectedRead);
  assert.equal(rejectedTimeline.current_position.stage, "decision_recorded");
  assert.match(rejectedTimeline.current_position.title, /Rejected/u);
  assert.equal(rejectedTimeline.current_position.primary_action_owner, "none");

  const deferredDecision = {
    ...structuredClone(rejectedDecision),
    decision_id: "review-decision:pc2-defer",
    decision: "defer" as const,
    decided_at: "2026-07-20T03:12:00.000Z",
    revisit: {
      revisit_at: "2026-07-21T03:12:00.000Z",
      expires_at: "2026-07-22T03:12:00.000Z",
      condition_summary: "the missing current verification is available",
    },
    rationale_summary: "Wait for current verification.",
    integrity: {
      ...rejectedDecision.integrity,
      fingerprint: `sha256:${"2".repeat(64)}`,
    },
  };
  const deferredRead = withTimelineSourceSummary({
    ...timelineBaseRead,
    projection_observed_at: "2026-07-20T04:00:00.000Z",
    decisions: [deferredDecision],
    decision_history: [historyFor(deferredDecision, false)],
  } satisfies SemanticReviewProposalDetailV01);
  assert.equal(
    deferredRead.decision_application_summary.status,
    "deferred",
  );
  const deferredTimeline = timelineFor(deferredRead);
  assert.equal(
    deferredTimeline.current_position.stage,
    "deferred_until_condition",
  );
  assert.equal(deferredTimeline.current_position.primary_action_owner, "none");
  assert.equal(
    timelineFor({
      ...deferredRead,
      projection_observed_at: "2026-07-21T03:12:00.000Z",
    }).current_position.primary_action_owner,
    "decision",
  );

  const candidateLocalRejectedDecision = {
    ...structuredClone(rejectedDecision),
    decision_id: "review-decision:pc2-candidate-local-b-reject",
    candidate: {
      candidate_id: candidateLocalB.candidate.candidate_id,
      candidate_fingerprint: candidateLocalB.candidate_fingerprint,
    },
    integrity: {
      ...rejectedDecision.integrity,
      fingerprint: `sha256:${"5".repeat(64)}`,
    },
  };
  const candidateBRejectedRead = withTimelineSourceSummary({
    ...candidateAAppliedRead,
    decisions: [
      candidateLocalDecisionA,
      candidateLocalRejectedDecision,
    ],
    decision_history: [
      historyFor(candidateLocalDecisionA),
      historyFor(candidateLocalRejectedDecision, false),
    ],
  } satisfies SemanticReviewProposalDetailV01);
  const candidateBRejectedSelection =
    assertNextCandidateOwnerConsistency(
      candidateBRejectedRead,
      candidateLocalA,
      null,
    );
  assert.equal(
    candidateBRejectedSelection.timeline.current_position
      .primary_action_owner,
    "none",
  );
  assert.match(
    timelineForSelected(candidateBRejectedRead, candidateLocalB)
      .current_position.title,
    /Rejected/u,
  );

  const candidateLocalDeferredDecision = {
    ...structuredClone(deferredDecision),
    decision_id: "review-decision:pc2-candidate-local-b-defer",
    candidate: {
      candidate_id: candidateLocalB.candidate.candidate_id,
      candidate_fingerprint: candidateLocalB.candidate_fingerprint,
    },
    integrity: {
      ...deferredDecision.integrity,
      fingerprint: `sha256:${"6".repeat(64)}`,
    },
  };
  const candidateBDeferredBeforeRead = withTimelineSourceSummary({
    ...candidateAAppliedRead,
    projection_observed_at: "2026-07-20T04:00:00.000Z",
    decisions: [
      candidateLocalDecisionA,
      candidateLocalDeferredDecision,
    ],
    decision_history: [
      historyFor(candidateLocalDecisionA),
      historyFor(candidateLocalDeferredDecision, false),
    ],
  } satisfies SemanticReviewProposalDetailV01);
  const candidateBDeferredBeforeSelection =
    assertNextCandidateOwnerConsistency(
      candidateBDeferredBeforeRead,
      candidateLocalA,
      null,
    );
  assert.equal(
    candidateBDeferredBeforeSelection.timeline.current_position
      .primary_action_owner,
    "none",
  );
  const candidateBDeferredDueRead = withTimelineSourceSummary({
    ...candidateBDeferredBeforeRead,
    projection_observed_at: "2026-07-21T03:12:00.000Z",
  });
  assertNextCandidateOwnerConsistency(
    candidateBDeferredDueRead,
    candidateLocalA,
    candidateLocalB.candidate.candidate_id,
  );
  assert.equal(
    timelineForSelected(candidateBDeferredDueRead, candidateLocalB)
      .current_position.primary_action_owner,
    "decision",
  );

  const supersedingDecision = {
    ...structuredClone(acceptedTimelineDecision),
    decision_id: "review-decision:pc2-supersede",
    decision: "supersede" as const,
    rationale_summary: "Replace the exact prior saved context.",
    integrity: {
      ...acceptedTimelineDecision.integrity,
      fingerprint: `sha256:${"3".repeat(64)}`,
    },
  };
  const retractingDecision = {
    ...structuredClone(acceptedTimelineDecision),
    decision_id: "review-decision:pc2-retract",
    decision: "retract" as const,
    rationale_summary: "Remove the exact prior saved context.",
    integrity: {
      ...acceptedTimelineDecision.integrity,
      fingerprint: `sha256:${"4".repeat(64)}`,
    },
  };
  assert.match(
    timelineFor({
      ...timelineBaseRead,
      decisions: [supersedingDecision],
      decision_history: [historyFor(supersedingDecision)],
    }).items.find((item) => item.stage === "decision_recorded")?.summary ?? "",
    /replace/u,
  );
  assert.match(
    timelineFor({
      ...timelineBaseRead,
      decisions: [retractingDecision],
      decision_history: [historyFor(retractingDecision)],
    }).items.find((item) => item.stage === "decision_recorded")?.summary ?? "",
    /remove/u,
  );
  for (const [applyingDecision, fingerprintFill] of [
    [supersedingDecision, "7"],
    [retractingDecision, "9"],
  ] as const) {
    const candidateLocalApplyingDecision = {
      ...structuredClone(applyingDecision),
      decision_id:
        `${applyingDecision.decision_id}:candidate-local-b`,
      candidate: {
        candidate_id: candidateLocalB.candidate.candidate_id,
        candidate_fingerprint: candidateLocalB.candidate_fingerprint,
      },
      integrity: {
        ...applyingDecision.integrity,
        fingerprint: `sha256:${fingerprintFill.repeat(64)}`,
      },
    };
    assertNextCandidateOwnerConsistency(
      withTimelineSourceSummary({
        ...candidateAAppliedRead,
        decisions: [
          candidateLocalDecisionA,
          candidateLocalApplyingDecision,
        ],
        decision_history: [
          historyFor(candidateLocalDecisionA),
          historyFor(candidateLocalApplyingDecision),
        ],
      } satisfies SemanticReviewProposalDetailV01),
      candidateLocalA,
      candidateLocalB.candidate.candidate_id,
    );
  }

  const blockedRead = {
    ...acceptedRead,
    candidates: [
      {
        ...structuredClone(timelineCandidate),
        pilot_admission: {
          ...structuredClone(timelineCandidate.pilot_admission),
          decision_allowed: {
            ...timelineCandidate.pilot_admission.decision_allowed,
            accept: false,
          },
          blocking_reasons: ["current_state_drifted"],
        },
      },
    ],
  } satisfies SemanticReviewProposalDetailV01;
  const blockedTimeline = timelineFor(blockedRead);
  assert.equal(blockedTimeline.current_position.stage, "transition_blocked");
  assert.equal(
    blockedTimeline.current_position.primary_action_owner,
    "transition",
  );
  assert.equal(
    blockedTimeline.items.some(
      (item) =>
        item.stage === "transition_blocked" &&
        item.basis === "authorized_change",
    ),
    false,
  );

  const gateFamily = structuredClone(
    acceptedRead.project_verify_reconciliation.claim_families[0]!,
  );
  const gateRevision = gateFamily.revisions[0]!;
  gateRevision.lifecycle.gate = {
    status: "authorized",
    gate_ref: {
      record_kind: "semantic_commit_gate",
      record_id: "semantic-commit-gate:pc2-confirmed",
      record_fingerprint: `sha256:${"5".repeat(64)}`,
    },
  };
  gateRevision.lifecycle.transition = {
    status: "transition_missing",
    transition_receipt_ref: null,
    semantic_state_ref: null,
    semantic_target_head_ref: null,
  };
  const gateConfirmedRead = {
    ...acceptedRead,
    proposal: {
      ...acceptedRead.proposal,
      project_verify_lifecycle: {
        lifecycle_binding: {
          family_id: gateFamily.claim_family_id,
          selected_record_ref: gateRevision.claim_ref,
          selected_candidate: {
            candidate_id: timelineCandidate.candidate.candidate_id,
            candidate_fingerprint: timelineCandidate.candidate_fingerprint,
          },
        },
      } as never,
    },
    project_verify_reconciliation: {
      ...acceptedRead.project_verify_reconciliation,
      claim_families: [
        gateFamily,
        ...acceptedRead.project_verify_reconciliation.claim_families.slice(1),
      ],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const gateTimeline = timelineFor(gateConfirmedRead);
  assert.equal(gateTimeline.current_position.stage, "awaiting_application");
  assert.match(gateTimeline.current_position.title, /confirmed/u);
  assert.match(gateTimeline.current_position.summary, /no authorized project update/u);

  const appliedReceipt = {
    ...structuredClone(appliedMultiCandidateReceipt),
    source_proposal: {
      proposal_version: acceptedRead.proposal.proposal_version,
      proposal_id: acceptedRead.proposal.proposal_id,
      proposal_fingerprint: acceptedRead.proposal.integrity.fingerprint,
    },
    source_decision: {
      ...appliedMultiCandidateReceipt.source_decision,
      decision_id: acceptedTimelineDecision.decision_id,
      decision_fingerprint: acceptedTimelineDecision.integrity.fingerprint,
    },
    source_candidate: {
      candidate_id: timelineCandidate.candidate.candidate_id,
      candidate_fingerprint: timelineCandidate.candidate_fingerprint,
    },
  };
  const appliedRead = {
    ...acceptedRead,
    transition_receipts: [appliedReceipt],
    transition: {
      status: "applied" as const,
      transition_receipt_id: appliedReceipt.transition_receipt_id,
      transition_receipt_fingerprint: appliedReceipt.integrity.fingerprint,
      notes: [],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const appliedTimeline = timelineFor(appliedRead);
  assert.equal(appliedTimeline.current_position.stage, "project_updated");
  assert.equal(appliedTimeline.current_position.primary_action_owner, "none");
  assert.equal(
    appliedTimeline.items.some(
      (item) =>
        item.basis === "authorized_change" &&
        item.stage === "project_updated",
    ),
    true,
  );
  const priorSessionAppliedRead = withTimelineSourceSummary({
    ...appliedRead,
    decision_history: [historyFor(acceptedTimelineDecision, false)],
  });
  assert.equal(
    priorSessionAppliedRead.decision_application_summary.status,
    "project_updated",
  );
  const priorSessionAppliedTimeline = timelineFor(priorSessionAppliedRead);
  assert.equal(
    priorSessionAppliedTimeline.current_position.stage,
    "project_updated",
  );
  assert.equal(
    priorSessionAppliedTimeline.current_position.primary_action_owner,
    "none",
  );

  const replayTimeline = timelineFor({
    ...appliedRead,
    decision_history: [
      historyFor(acceptedTimelineDecision),
      historyFor(acceptedTimelineDecision),
    ],
    transition_receipts: [appliedReceipt, appliedReceipt],
  });
  assert.equal(
    replayTimeline.items.filter((item) => item.stage === "decision_recorded")
      .length,
    1,
  );
  assert.equal(
    replayTimeline.items.filter((item) => item.stage === "project_updated")
      .length,
    1,
  );

  const laterReceipt = {
    receipt_id: "run-receipt:pc2-later",
    receipt_fingerprint: `sha256:${"6".repeat(64)}`,
    recorded_at: "2026-07-22T02:00:00.000Z",
    task_context_packet_id: "task-context-packet:pc2-later",
    task_context_packet_fingerprint: `sha256:${"7".repeat(64)}`,
    trust_summary: productionSource.receipt.trust_summary,
  };
  const exactLaterLineage = {
    lineage_version: "vnext_operator_pilot_workbench_lineage.v0.1",
    workspace_id: appliedRead.proposal.workspace_id,
    project_id: appliedRead.proposal.project_id,
    proposal_id: appliedRead.proposal.proposal_id,
    proposal_fingerprint: appliedRead.proposal.integrity.fingerprint,
    overall_status: "packet_compiled" as const,
    chains: [
      {
        transition: {
          receipt_id: appliedReceipt.transition_receipt_id,
          receipt_fingerprint: appliedReceipt.integrity.fingerprint,
          decision_id: acceptedTimelineDecision.decision_id,
          decision_fingerprint:
            acceptedTimelineDecision.integrity.fingerprint,
          candidate_id: timelineCandidate.candidate.candidate_id,
          candidate_fingerprint: timelineCandidate.candidate_fingerprint,
          applied_at: appliedReceipt.applied_at,
          recorded_at: appliedReceipt.recorded_at,
        },
        semantic_gate: {
          gate_id: "semantic-commit-gate:pc2-later",
          gate_fingerprint: `sha256:${"9".repeat(64)}`,
          status: "authorized" as const,
          confirmed_at: "2026-07-21T01:00:00.000Z",
          evaluated_at: "2026-07-21T01:00:00.000Z",
          expires_at: "2026-07-22T01:00:00.000Z",
        },
        compiled_packet: {
          packet_id: laterReceipt.task_context_packet_id,
          packet_fingerprint:
            laterReceipt.task_context_packet_fingerprint,
          generated_at: "2026-07-21T01:01:00.000Z",
          expires_at: null,
          currentness: "fresh" as const,
          projection_current: true,
        },
        stage_status: "packet_compiled" as const,
      },
    ],
    read_only: true as const,
    semantic_authority_granted: false as const,
  } satisfies SemanticReviewProposalDetailV01["durable_lineage"];
  const laterAvailableRead = {
    ...appliedRead,
    durable_lineage: exactLaterLineage,
    project_continuity: {
      ...appliedRead.project_continuity,
      latest_applied_transition: {
        transition_receipt_id: appliedReceipt.transition_receipt_id,
        transition_receipt_fingerprint: appliedReceipt.integrity.fingerprint,
        proposal_id: appliedRead.proposal.proposal_id,
        decision_id: acceptedTimelineDecision.decision_id,
        effect_count: appliedReceipt.effects.length,
        applied_at: appliedReceipt.applied_at,
        recorded_at: appliedReceipt.recorded_at,
      },
      latest_context_use_receipt: laterReceipt,
    },
  } satisfies SemanticReviewProposalDetailV01;
  const expectPriorProjectUpdated = (
    read: SemanticReviewProposalDetailV01,
  ) => {
    const timeline = timelineFor(read);
    assert.equal(timeline.current_position.stage, "project_updated");
    assert.equal(
      timeline.items.some(
        (item) =>
          item.stage === "later_outcome_available" ||
          item.stage === "later_outcome_reviewed",
      ),
      false,
    );
  };
  expectPriorProjectUpdated({
    ...laterAvailableRead,
    project_continuity: {
      ...laterAvailableRead.project_continuity,
      latest_applied_transition: {
        ...laterAvailableRead.project_continuity.latest_applied_transition!,
        transition_receipt_fingerprint: `sha256:${"0".repeat(64)}`,
      },
    },
  });
  expectPriorProjectUpdated({
    ...laterAvailableRead,
    durable_lineage: {
      ...laterAvailableRead.durable_lineage,
      chains: laterAvailableRead.durable_lineage.chains.map((chain) => ({
        ...chain,
        transition: {
          ...chain.transition,
          receipt_fingerprint: `sha256:${"0".repeat(64)}`,
        },
      })),
    },
  });
  expectPriorProjectUpdated({
    ...laterAvailableRead,
    project_continuity: {
      ...laterAvailableRead.project_continuity,
      latest_context_use_receipt: {
        ...laterReceipt,
        task_context_packet_id: "task-context-packet:pc2-older",
        task_context_packet_fingerprint: `sha256:${"1".repeat(64)}`,
      },
    },
  });
  expectPriorProjectUpdated({
    ...laterAvailableRead,
    project_continuity: {
      ...laterAvailableRead.project_continuity,
      latest_context_use_receipt: {
        ...laterReceipt,
        task_context_packet_fingerprint: `sha256:${"1".repeat(64)}`,
      },
    },
  });
  const laterAvailableTimeline = timelineFor(laterAvailableRead);
  assert.equal(
    laterAvailableTimeline.current_position.stage,
    "later_outcome_available",
  );
  assert.deepEqual(
    laterAvailableTimeline.items
      .filter(
        (item) =>
          item.stage === "project_updated" ||
          item.stage === "later_outcome_available",
      )
      .map((item) => [item.stage, item.basis, item.status]),
    [
      ["project_updated", "authorized_change", "completed"],
      ["later_outcome_available", "later_outcome", "current"],
    ],
  );
  const laterReviewedRead = {
    ...laterAvailableRead,
    project_continuity: {
      ...laterAvailableRead.project_continuity,
      latest_context_use_review_status: {
        review_id: "context-use-review:pc2",
        review_fingerprint: `sha256:${"a".repeat(64)}`,
        reviewed_at: "2026-07-22T03:00:00.000Z",
        presented: "yes" as const,
        presentation_basis: "direct_local_probe" as never,
        actually_used: "yes" as const,
        actually_used_basis: "explicit_user_report" as never,
        assessment: "helpful" as const,
        assessment_basis: "explicit_user_report" as never,
        later_task_run_receipt_id: laterReceipt.receipt_id,
        later_task_run_receipt_fingerprint:
          laterReceipt.receipt_fingerprint,
      },
    },
  } satisfies SemanticReviewProposalDetailV01;
  const reviewFingerprintMismatchTimeline = timelineFor({
    ...laterReviewedRead,
    project_continuity: {
      ...laterReviewedRead.project_continuity,
      latest_context_use_review_status: {
        ...laterReviewedRead.project_continuity
          .latest_context_use_review_status!,
        later_task_run_receipt_fingerprint: `sha256:${"0".repeat(64)}`,
      },
    },
  });
  assert.equal(
    reviewFingerprintMismatchTimeline.current_position.stage,
    "later_outcome_available",
  );
  const laterReviewedTimeline = timelineFor(laterReviewedRead);
  assert.equal(
    laterReviewedTimeline.current_position.stage,
    "later_outcome_reviewed",
  );
  assert.equal(
    laterReviewedTimeline.items.filter(
      (item) => item.stage === "project_updated",
    ).length,
    1,
  );

  const missingSourceTimeTimeline = timelineFor({
    ...timelineBaseRead,
    source_run_receipts: timelineBaseRead.source_run_receipts.map((receipt) => ({
      ...receipt,
      finished_at: null,
    })),
  });
  const sourceItem = missingSourceTimeTimeline.items.find(
    (item) => item.stage === "source_observed",
  );
  assert.equal(sourceItem?.occurred_at, null);
  assert.equal(sourceItem?.time_status, "not_established");
  assert.equal(
    missingSourceTimeTimeline.items.find(
      (item) => item.stage === "review_focused",
    )?.order_basis,
    "partial_order",
  );
  const strictUtcSourceTime = "2026-07-20T03:00:00.000Z";
  const strictOffsetSourceTime = "2026-07-20T12:00:00+09:00";
  for (const validTimestamp of [
    strictUtcSourceTime,
    strictOffsetSourceTime,
  ]) {
    const strictTimeline = timelineFor({
      ...timelineBaseRead,
      source_run_receipts: timelineBaseRead.source_run_receipts.map(
        (receipt) => ({
          ...receipt,
          finished_at: validTimestamp,
        }),
      ),
    });
    const strictSource = strictTimeline.items.find(
      (item) => item.stage === "source_observed",
    );
    assert.equal(strictSource?.occurred_at, validTimestamp);
    assert.equal(strictSource?.time_status, "exact");
  }
  for (const invalidTimestamp of [
    "2026-07-20",
    "July 20, 2026 03:00:00",
    "2026-02-30T03:00:00.000Z",
    "2026-07-20T03:00:00+24:00",
  ]) {
    const invalidTimeline = timelineFor({
      ...timelineBaseRead,
      source_run_receipts: timelineBaseRead.source_run_receipts.map(
        (receipt) => ({
          ...receipt,
          finished_at: invalidTimestamp,
        }),
      ),
    });
    const invalidSource = invalidTimeline.items.find(
      (item) => item.stage === "source_observed",
    );
    assert.equal(invalidSource?.occurred_at, null, invalidTimestamp);
    assert.equal(
      invalidSource?.time_status,
      "not_established",
      invalidTimestamp,
    );
  }
  const invalidObservedDeferTimeline = timelineFor({
    ...deferredRead,
    projection_observed_at: "July 22, 2026 03:12:00",
  });
  assert.equal(
    invalidObservedDeferTimeline.current_position.stage,
    "deferred_until_condition",
  );
  assert.equal(
    invalidObservedDeferTimeline.current_position.primary_action_owner,
    "none",
  );
  assert.match(
    invalidObservedDeferTimeline.current_position.title,
    /Deferred until/u,
  );
  const invalidRevisitDecision = {
    ...structuredClone(deferredDecision),
    revisit: {
      ...structuredClone(deferredDecision.revisit!),
      revisit_at: "2026-07-21",
      expires_at: "2026-02-30T03:12:00.000Z",
    },
  };
  const invalidRevisitTimeline = timelineFor({
    ...deferredRead,
    projection_observed_at: "2026-07-30T03:12:00.000Z",
    decisions: [invalidRevisitDecision],
    decision_history: [historyFor(invalidRevisitDecision, false)],
  });
  assert.equal(
    invalidRevisitTimeline.current_position.primary_action_owner,
    "none",
  );
  assert.match(
    invalidRevisitTimeline.current_position.title,
    /Deferred until/u,
  );
  assert.equal(
    timelineFor({
      ...deferredRead,
      projection_observed_at: "2026-07-21T12:12:00+09:00",
    }).current_position.primary_action_owner,
    "decision",
  );
  const unavailableSourceTimeline = timelineFor({
    ...timelineBaseRead,
    source_run_receipts: [],
  });
  assert.equal(
    unavailableSourceTimeline.items.some(
      (item) => item.stage === "source_observed",
    ),
    false,
    "an unavailable source must not fabricate an observed-source event",
  );
  assert.equal(
    unavailableSourceTimeline.items.some(
      (item) =>
        item.basis === "observed" && item.source_refs.length === 0,
    ),
    false,
  );
  assert.equal(
    unavailableSourceTimeline.items.filter(
      (item) => item.status === "current" || item.status === "blocked",
    ).length,
    1,
  );

  const priorEqualTimeDecision = {
    ...structuredClone(rejectedDecision),
    decision_id: "review-decision:pc2-equal-prior",
    decided_at: "2026-07-20T03:30:00.000Z",
    integrity: {
      ...rejectedDecision.integrity,
      fingerprint: `sha256:${"b".repeat(64)}`,
    },
  };
  const effectiveEqualTimeDecision = {
    ...structuredClone(acceptedTimelineDecision),
    decision_id: "review-decision:pc2-equal-effective",
    decided_at: priorEqualTimeDecision.decided_at,
    lineage: {
      ...acceptedTimelineDecision.lineage,
      prior_decisions: [
        {
          decision_id: priorEqualTimeDecision.decision_id,
          decision_fingerprint: priorEqualTimeDecision.integrity.fingerprint,
        },
      ],
    },
    integrity: {
      ...acceptedTimelineDecision.integrity,
      fingerprint: `sha256:${"c".repeat(64)}`,
    },
  };
  const equalTimeRead = {
    ...timelineBaseRead,
    source_run_receipts: timelineBaseRead.source_run_receipts.map((receipt) => ({
      ...receipt,
      finished_at: "2026-07-23T03:30:00.000Z",
    })),
    decisions: [effectiveEqualTimeDecision, priorEqualTimeDecision],
    decision_history: [
      historyFor(effectiveEqualTimeDecision),
      historyFor(priorEqualTimeDecision, false),
    ],
  } satisfies SemanticReviewProposalDetailV01;
  const equalFirst = timelineFor(equalTimeRead);
  const equalSecond = timelineFor({
    ...equalTimeRead,
    decision_history: [...equalTimeRead.decision_history].reverse(),
  });
  assert.deepEqual(equalFirst, equalSecond);
  assert.deepEqual(
    equalFirst.items
      .filter((item) => item.stage === "decision_recorded")
      .map((item) => item.status),
    ["superseded", "completed"],
  );
  assert.equal(equalFirst.items[0]?.stage, "source_observed");
  assert.equal(
    equalFirst.items.findIndex((item) => item.stage === "source_observed") <
      equalFirst.items.findIndex((item) => item.stage === "decision_recorded"),
    true,
    "a later source timestamp must not override semantic lineage ordering",
  );

  const unrelatedDecision = {
    ...structuredClone(acceptedTimelineDecision),
    decision_id: "review-decision:pc2-unrelated",
    candidate: {
      candidate_id: firstCandidate.candidate.candidate_id,
      candidate_fingerprint: firstCandidate.candidate_fingerprint,
    },
    integrity: {
      ...acceptedTimelineDecision.integrity,
      fingerprint: `sha256:${"d".repeat(64)}`,
    },
  };
  const isolatedTimeline = buildSelectedWorkTimelineV01({
    read: {
      ...acceptedRead,
      candidates: [firstCandidate, timelineCandidate],
      decisions: [unrelatedDecision, acceptedTimelineDecision],
      decision_history: [
        historyFor(unrelatedDecision),
        historyFor(acceptedTimelineDecision),
      ],
    },
    selected_candidate: timelineCandidate,
  });
  assert.equal(
    isolatedTimeline.items
      .flatMap((item) => item.source_refs)
      .some((ref) => ref.record_id === unrelatedDecision.decision_id),
    false,
  );

  const revisedTimeline = timelineFor({
    ...timelineBaseRead,
    proposal: {
      ...timelineBaseRead.proposal,
      operation_revision: {
        source: {
          proposal_id: "episode-delta-proposal:pc2-source",
          proposal_fingerprint: `sha256:${"e".repeat(64)}`,
        },
      } as never,
    },
  });
  const revisedSuggestion = revisedTimeline.items.find(
    (item) => item.stage === "change_suggested",
  );
  assert.equal(revisedSuggestion?.title, "Clarified change suggested");
  assert.equal(
    revisedSuggestion?.source_refs.some(
      (ref) => ref.record_id === "episode-delta-proposal:pc2-source",
    ),
    true,
  );
  assert.equal(
    noDecisionTimeline.items.every(
      (item) =>
        item.projection_only === true &&
        item.grants_semantic_authority === false,
    ),
    true,
  );
  assert.equal(
    JSON.stringify(noDecisionTimeline).includes(
      timelineCandidate.candidate.candidate_id,
    ),
    true,
    "exact refs remain available in the projection contract",
  );
  assert.equal(
    noDecisionTimeline.items
      .map((item) => `${item.title} ${item.summary} ${item.meaning_change}`)
      .join(" ")
      .includes(timelineCandidate.candidate.candidate_id),
    false,
    "ordinary timeline copy must not expose internal candidate IDs",
  );
  const protocolNamedCandidate = {
    ...timelineCandidate,
    candidate: {
      ...timelineCandidate.candidate,
      title: "Review the EpisodeDeltaProposal and CriterionAssessment",
      proposed_state_summary:
        "Connect the RunReceipt without treating a semantic gate as application.",
    },
  };
  const protocolSafeTimeline = buildSelectedWorkTimelineV01({
    read: {
      ...timelineBaseRead,
      candidates: [protocolNamedCandidate],
    },
    selected_candidate: protocolNamedCandidate,
  });
  assert.doesNotMatch(
    [
      protocolSafeTimeline.selected_work.title,
      protocolSafeTimeline.selected_work.current_meaning,
      ...protocolSafeTimeline.items.flatMap((item) => [
        item.title,
        item.summary,
        item.meaning_change,
      ]),
    ].join(" "),
    /EpisodeDeltaProposal|CriterionAssessment|RunReceipt|semantic gate/u,
  );

  const relationshipsForSelected = (
    read: SemanticReviewProposalDetailV01,
    selectedCandidate: SemanticReviewProposalDetailV01["candidates"][number],
    selectedQuestion:
      | Parameters<typeof buildSelectedWorkRelationshipsV01>[0]["selected_question_key"]
      = null,
  ) => {
    const normalizedRead = withTimelineSourceSummary(read);
    const timeline = timelineForSelected(normalizedRead, selectedCandidate);
    return buildSelectedWorkRelationshipsV01({
      read: normalizedRead,
      selected_candidate: selectedCandidate,
      timeline,
      selected_question_key: selectedQuestion,
    });
  };
  const relationshipsFor = (
    read: SemanticReviewProposalDetailV01,
    selectedQuestion:
      | Parameters<typeof buildSelectedWorkRelationshipsV01>[0]["selected_question_key"]
      = null,
  ) => relationshipsForSelected(read, read.candidates[0]!, selectedQuestion);

  const sourceRelationships = relationshipsFor(timelineBaseRead);
  assert.equal(
    sourceRelationships.relationships_version,
    "selected_work_relationships.v0.1",
  );
  assert.equal(
    sourceRelationships.selected_question_key,
    "support_and_source",
  );
  assert.equal(sourceRelationships.questions.length <= 4, true);
  assert.equal(sourceRelationships.connections.length <= 6, true);
  assert.equal(
    sourceRelationships.connections.filter(
      (connection) =>
        connection.connection_id ===
        sourceRelationships.highlighted_connection_id,
    ).length,
    1,
  );
  assert.equal(
    sourceRelationships.selected_work_anchor.timeline_stage,
    noDecisionTimeline.current_position.stage,
  );
  assert.equal(
    sourceRelationships.selected_work_anchor.timeline_current_item_id,
    noDecisionTimeline.current_item_id,
  );
  assert.equal(
    sourceRelationships.selected_work_anchor
      .timeline_remains_current_position_owner,
    true,
  );
  const relationshipScope = (input: {
    proposal_id?: string;
    proposal_fingerprint?: string;
    candidate_id?: string;
    candidate_fingerprint?: string;
  } = {}) =>
    selectedWorkRelationshipScopeKeyV01({
      workspace_id: timelineBaseRead.proposal.workspace_id,
      project_id: timelineBaseRead.proposal.project_id,
      proposal_id:
        input.proposal_id ?? timelineBaseRead.proposal.proposal_id,
      proposal_fingerprint:
        input.proposal_fingerprint ??
        timelineBaseRead.proposal.integrity.fingerprint,
      candidate_id:
        input.candidate_id ?? timelineCandidate.candidate.candidate_id,
      candidate_fingerprint:
        input.candidate_fingerprint ??
        timelineCandidate.candidate_fingerprint,
    });
  const proposalAScope = relationshipScope();
  const proposalBRelationships = relationshipsFor(blockedRead);
  const proposalBScope = relationshipScope({
    proposal_id: `${timelineBaseRead.proposal.proposal_id}:blocked`,
    proposal_fingerprint: `sha256:${"b".repeat(64)}`,
  });
  const proposalASelection = {
    scope_key: proposalAScope,
    question_key: "support_and_source",
  } as const;
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: proposalBScope,
      selection: proposalASelection,
      available_questions: proposalBRelationships.questions,
      default_question_key: proposalBRelationships.selected_question_key,
    }),
    "blocker_and_conflict",
    "another proposal must synchronously use its own deterministic question even when candidate identity is unchanged",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: relationshipScope({
        proposal_fingerprint: `sha256:${"c".repeat(64)}`,
      }),
      selection: proposalASelection,
      available_questions: proposalBRelationships.questions,
      default_question_key: proposalBRelationships.selected_question_key,
    }),
    "blocker_and_conflict",
    "a changed proposal fingerprint must reset relationship selection synchronously",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: relationshipScope({
        candidate_id: "delta:other-candidate",
        candidate_fingerprint: `sha256:${"d".repeat(64)}`,
      }),
      selection: proposalASelection,
      available_questions: proposalBRelationships.questions,
      default_question_key: "blocker_and_conflict",
    }),
    "blocker_and_conflict",
    "candidate switching must not transfer a prior candidate's question",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: proposalAScope,
      selection: proposalASelection,
      available_questions: sourceRelationships.questions,
      default_question_key: sourceRelationships.selected_question_key,
    }),
    "support_and_source",
    "same-scope unrelated rerenders must preserve a still-supported selection",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: proposalAScope,
      selection: {
        scope_key: proposalAScope,
        question_key: "project_change_and_later_outcome",
      },
      available_questions: sourceRelationships.questions,
      default_question_key: sourceRelationships.selected_question_key,
    }),
    "support_and_source",
    "a no-longer-supported same-scope question must fall back immediately",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: proposalAScope,
      selection: proposalASelection,
      available_questions: [],
      default_question_key: null,
    }),
    null,
    "a no-question scope must not retain a stale selection",
  );
  assert.equal(
    sourceRelationships.completeness.omitted_source_count_known,
    false,
  );
  assert.equal(sourceRelationships.completeness.omitted_source_count, null);
  assert.equal(
    sourceRelationships.connections.every(
      (connection) =>
        connection.projection_only &&
        !connection.grants_semantic_authority,
    ),
    true,
  );
  assert.equal(
    sourceRelationships.connections.some(
      (connection) =>
        connection.source_role !== "later_work" &&
        connection.exact_refs.some(
          (ref) => ref.source_kind === "run_receipt",
        ),
    ),
    true,
    "a source receipt must preserve its canonical kind without being mislabeled as a later result",
  );
  assert.deepEqual(sourceRelationships.authority, {
    projection_only: true,
    rebuildable: true,
    writes_database: false,
    creates_relation_record: false,
    creates_evidence: false,
    accepts_evidence: false,
    establishes_claim_truth: false,
    creates_decision: false,
    authorizes_transition: false,
    applies_transition: false,
    selects_current_position: false,
    changes_timeline_order: false,
    changes_project_state: false,
    changes_later_context: false,
    calls_model_or_provider: false,
    performs_external_action: false,
  });

  const observedTemplate =
    timelineBaseRead.source_lanes.observations[0] ??
    ({
      material_id: "material:pc3-observed-template",
      source_run_receipt_refs: [],
    } as never);
  const inferredTemplate =
    timelineBaseRead.source_lanes.inferences[0] ??
    ({
      material_id: "material:pc3-inferred-template",
      source_run_receipt_refs: [],
    } as never);
  const observedMaterialId = "material:pc3-observed";
  const inferredMaterialId = "material:pc3-inferred";
  const observedAndInferredCandidate = {
    ...structuredClone(timelineCandidate),
    candidate: {
      ...structuredClone(timelineCandidate.candidate),
      basis_material_ids: [observedMaterialId, inferredMaterialId],
    },
  };
  observedAndInferredCandidate.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(
      observedAndInferredCandidate.candidate,
    );
  observedAndInferredCandidate.pilot_admission = {
    ...observedAndInferredCandidate.pilot_admission,
    candidate_id: observedAndInferredCandidate.candidate.candidate_id,
    candidate_fingerprint: observedAndInferredCandidate.candidate_fingerprint,
  };
  const observedAndInferredRead = {
    ...timelineBaseRead,
    candidates: [observedAndInferredCandidate],
    source_lanes: {
      observations: [
        {
          ...structuredClone(observedTemplate),
          material_id: observedMaterialId,
        },
      ],
      attestations: [],
      inferences: [
        {
          ...structuredClone(inferredTemplate),
          material_id: inferredMaterialId,
        },
      ],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const observedAndInferredRelationships = relationshipsFor(
    observedAndInferredRead,
  );
  assert.deepEqual(
    new Set(
      observedAndInferredRelationships.connections.map(
        (connection) => connection.basis,
      ),
    ),
    new Set(["observed_source", "bounded_interpretation"]),
    "observation and inference must remain different relationship bases",
  );

  const boundedMaterialIds = Array.from(
    { length: 8 },
    (_, index) => `material:pc3-bounded:${index + 1}`,
  );
  const boundedCandidate = {
    ...structuredClone(timelineCandidate),
    candidate: {
      ...structuredClone(timelineCandidate.candidate),
      basis_material_ids: boundedMaterialIds,
    },
  };
  boundedCandidate.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(boundedCandidate.candidate);
  boundedCandidate.pilot_admission = {
    ...boundedCandidate.pilot_admission,
    candidate_id: boundedCandidate.candidate.candidate_id,
    candidate_fingerprint: boundedCandidate.candidate_fingerprint,
  };
  const boundedRelationshipRead = {
    ...timelineBaseRead,
    candidates: [boundedCandidate],
    source_lanes: {
      observations: boundedMaterialIds.map((materialId) => ({
        ...structuredClone(observedTemplate),
        material_id: materialId,
        source_run_receipt_refs: [
          externalRef(
            "run_receipt",
            `run-receipt:pc3-bounded:${materialId}`,
            "direct_local_observation",
          ),
        ],
      })),
      attestations: [],
      inferences: [],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const boundedRelationships = relationshipsFor(boundedRelationshipRead);
  assert.equal(boundedRelationships.visible_connection_count, 6);
  assert.equal(boundedRelationships.known_connection_count, 8);
  assert.equal(boundedRelationships.locally_omitted_connection_count, 2);
  assert.equal(boundedRelationships.completeness.status, "bounded_incomplete");
  assert.equal(
    boundedRelationships.connections.filter(
      (connection) =>
        connection.connection_id ===
        boundedRelationships.highlighted_connection_id,
    ).length,
    1,
  );
  assert.deepEqual(
    relationshipsFor({
      ...boundedRelationshipRead,
      source_lanes: {
        ...boundedRelationshipRead.source_lanes,
        observations: [
          ...boundedRelationshipRead.source_lanes.observations,
        ].reverse(),
      },
    }),
    boundedRelationships,
    "source-array order must not affect deterministic connection ordering",
  );
  const replayDeduplicatedRelationships = relationshipsFor({
    ...observedAndInferredRead,
    source_lanes: {
      ...observedAndInferredRead.source_lanes,
      observations: [
        observedAndInferredRead.source_lanes.observations[0]!,
        structuredClone(
          observedAndInferredRead.source_lanes.observations[0]!,
        ),
      ],
    },
  });
  assert.equal(
    replayDeduplicatedRelationships.connections.filter(
      (connection) => connection.basis === "observed_source",
    ).length,
    1,
  );

  const sourceScopedCandidate = (
    candidateId: string,
    sourceRefs: ExternalRefV01[],
    basisMaterialIds: string[] = [],
  ) => {
    const candidate = {
      ...structuredClone(timelineCandidate),
      candidate: {
        ...structuredClone(timelineCandidate.candidate),
        candidate_id: candidateId,
        basis_material_ids: basisMaterialIds,
        source_refs: sourceRefs,
      },
    };
    candidate.candidate_fingerprint =
      createEpisodeDeltaCandidateFingerprintV01(candidate.candidate);
    candidate.pilot_admission = {
      ...candidate.pilot_admission,
      candidate_id: candidate.candidate.candidate_id,
      candidate_fingerprint: candidate.candidate_fingerprint,
    };
    return candidate;
  };
  const proposalSourceRefs =
    timelineBaseRead.proposal.source_refs.map((ref) => structuredClone(ref));
  const exactReceiptSourceRef = proposalSourceRefs.find(
    (ref) => ref.ref_type === "run_receipt",
  )!;
  const exactPacketSourceRef = proposalSourceRefs.find(
    (ref) => ref.ref_type === "task_context_packet",
  )!;
  assert.ok(exactReceiptSourceRef);
  assert.ok(exactPacketSourceRef);
  const sourceRefOnlyCandidate = sourceScopedCandidate(
    "delta:pc3-source-ref-only",
    [exactPacketSourceRef],
  );
  const sourceRefOnlyRead = {
    ...timelineBaseRead,
    candidates: [sourceRefOnlyCandidate],
    source_run_receipts: [],
    source_lanes: {
      observations: [],
      attestations: [],
      inferences: [],
    },
    proposal: {
      ...timelineBaseRead.proposal,
      project_verify_lifecycle: undefined,
    },
  } satisfies SemanticReviewProposalDetailV01;
  const sourceRefOnlyRelationships = relationshipsFor(sourceRefOnlyRead);
  assert.equal(
    sourceRefOnlyRelationships.questions.some(
      (question) => question.question_key === "support_and_source",
    ),
    true,
    "an exact candidate-local source pointer present in the validated read must expose a truthful source question",
  );
  assert.equal(sourceRefOnlyRelationships.answer_availability, "partial");
  assert.equal(sourceRefOnlyRelationships.known_connection_count, 1);
  assert.equal(
    sourceRefOnlyRelationships.connections[0]?.exact_refs.some(
      (ref) => ref.record_id === exactPacketSourceRef.external_id,
    ),
    true,
  );
  assert.match(
    sourceRefOnlyRelationships.connections[0]?.why_it_matters_now ?? "",
    /does not.*proof|does not.*success|not.*proof/iu,
  );

  const unresolvedSourceCandidate = sourceScopedCandidate(
    "delta:pc3-unresolved-source-ref",
    [
      externalRef(
        "unresolved_external_source",
        "external-source:pc3-not-in-read",
        "imported_unverified",
      ),
    ],
  );
  const unresolvedSourceRelationships = relationshipsFor({
    ...sourceRefOnlyRead,
    candidates: [unresolvedSourceCandidate],
  });
  assert.equal(
    unresolvedSourceRelationships.questions.some(
      (question) => question.question_key === "support_and_source",
    ),
    false,
    "an unresolved candidate ref must not expose a source-supported question",
  );

  const candidateLocalSourceA = sourceScopedCandidate(
    "delta:pc3-source-isolation-a",
    [exactReceiptSourceRef],
  );
  const secondSourceReceipt = {
    ...structuredClone(timelineBaseRead.source_run_receipts[0]!),
    receipt_id: "run-receipt:pc3-source-isolation-b",
    integrity: {
      ...structuredClone(
        timelineBaseRead.source_run_receipts[0]!.integrity,
      ),
      fingerprint: `sha256:${"b".repeat(64)}`,
    },
  };
  const secondReceiptSourceRef = {
    ...structuredClone(exactReceiptSourceRef),
    external_id: secondSourceReceipt.receipt_id,
    source_ref: secondSourceReceipt.integrity.fingerprint,
  };
  const candidateLocalSourceB = sourceScopedCandidate(
    "delta:pc3-source-isolation-b",
    [secondReceiptSourceRef],
  );
  const isolatedSourceRead = {
    ...sourceRefOnlyRead,
    candidates: [candidateLocalSourceA, candidateLocalSourceB],
    source_run_receipts: [
      timelineBaseRead.source_run_receipts[0]!,
      secondSourceReceipt,
    ],
    proposal: {
      ...sourceRefOnlyRead.proposal,
      source_refs: [
        ...sourceRefOnlyRead.proposal.source_refs,
        secondReceiptSourceRef,
      ],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const isolatedSourceA = relationshipsForSelected(
    isolatedSourceRead,
    candidateLocalSourceA,
  );
  const isolatedSourceB = relationshipsForSelected(
    isolatedSourceRead,
    candidateLocalSourceB,
  );
  assert.equal(
    JSON.stringify(isolatedSourceA).includes(
      secondReceiptSourceRef.external_id,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(isolatedSourceB).includes(
      exactReceiptSourceRef.external_id,
    ),
    false,
  );
  assert.equal(
    [isolatedSourceA, isolatedSourceB].some((relationships) =>
      relationships.connections.some((connection) =>
        /shared proposal source context/iu.test(connection.title)
      )
    ),
    false,
    "different exact candidate-local receipts must not be presented as shared context",
  );

  const sharedSourceCandidateA = sourceScopedCandidate(
    "delta:pc3-shared-source-a",
    [exactReceiptSourceRef],
  );
  const sharedSourceCandidateB = sourceScopedCandidate(
    "delta:pc3-shared-source-b",
    [exactReceiptSourceRef],
  );
  const sharedSourceRead = {
    ...timelineBaseRead,
    candidates: [sharedSourceCandidateA, sharedSourceCandidateB],
    source_lanes: {
      observations: [],
      attestations: [],
      inferences: [],
    },
    proposal: {
      ...timelineBaseRead.proposal,
      project_verify_lifecycle: undefined,
    },
  } satisfies SemanticReviewProposalDetailV01;
  const sharedSourceRelationships = relationshipsForSelected(
    sharedSourceRead,
    sharedSourceCandidateA,
  );
  assert.equal(
    sharedSourceRelationships.connections.some((connection) =>
      /shared proposal source context/iu.test(connection.title)
    ),
    true,
    "a source receipt shared by every candidate must be labeled as shared proposal context",
  );

  const unboundReceiptCandidate = sourceScopedCandidate(
    "delta:pc3-unbound-proposal-receipt",
    [],
  );
  const unboundReceiptRelationships = relationshipsFor({
    ...timelineBaseRead,
    candidates: [unboundReceiptCandidate],
    source_lanes: {
      observations: [],
      attestations: [],
      inferences: [],
    },
    proposal: {
      ...timelineBaseRead.proposal,
      project_verify_lifecycle: undefined,
    },
  });
  assert.equal(
    unboundReceiptRelationships.questions.some(
      (question) => question.question_key === "support_and_source",
    ),
    false,
    "proposal-wide receipts without a selected-candidate binding must not become candidate-local support",
  );

  const missingIntermediateCandidate = sourceScopedCandidate(
    "delta:pc3-missing-intermediate-source",
    [exactPacketSourceRef],
    ["material:pc3-not-in-bounded-read"],
  );
  const missingIntermediateRelationships = relationshipsFor({
    ...sourceRefOnlyRead,
    candidates: [missingIntermediateCandidate],
  });
  assert.equal(missingIntermediateRelationships.answer_availability, "partial");
  assert.equal(
    missingIntermediateRelationships.connections.some(
      (connection) => connection.support_status === "partial",
    ),
    true,
    "missing intermediate source material must remain partial",
  );

  const orderedSourceCandidate = sourceScopedCandidate(
    "delta:pc3-deterministic-source-refs",
    [exactPacketSourceRef, exactReceiptSourceRef],
  );
  const replayedSourceCandidate = sourceScopedCandidate(
    "delta:pc3-deterministic-source-refs",
    [
      exactReceiptSourceRef,
      exactPacketSourceRef,
      exactReceiptSourceRef,
      exactPacketSourceRef,
    ],
  );
  replayedSourceCandidate.candidate_fingerprint =
    orderedSourceCandidate.candidate_fingerprint;
  replayedSourceCandidate.pilot_admission = {
    ...replayedSourceCandidate.pilot_admission,
    candidate_fingerprint: orderedSourceCandidate.candidate_fingerprint,
  };
  assert.deepEqual(
    relationshipsFor({
      ...sourceRefOnlyRead,
      candidates: [replayedSourceCandidate],
    }),
    relationshipsFor({
      ...sourceRefOnlyRead,
      candidates: [orderedSourceCandidate],
    }),
    "candidate source-ref order and replay duplication must not affect deterministic output",
  );
  assert.equal(
    relationshipsFor({
      ...sourceRefOnlyRead,
      candidates: [orderedSourceCandidate],
    }).known_connection_count,
    2,
  );

  const identicalTitleCandidateA = sourceScopedCandidate(
    "delta:pc3-identical-title-a",
    [exactPacketSourceRef],
  );
  const identicalTitleCandidateB = sourceScopedCandidate(
    "delta:pc3-identical-title-b",
    [exactReceiptSourceRef],
  );
  identicalTitleCandidateB.candidate.title =
    identicalTitleCandidateA.candidate.title;
  identicalTitleCandidateB.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(
      identicalTitleCandidateB.candidate,
    );
  identicalTitleCandidateB.pilot_admission = {
    ...identicalTitleCandidateB.pilot_admission,
    candidate_fingerprint:
      identicalTitleCandidateB.candidate_fingerprint,
  };
  const identicalTitleRead = {
    ...sourceRefOnlyRead,
    candidates: [identicalTitleCandidateA, identicalTitleCandidateB],
  } satisfies SemanticReviewProposalDetailV01;
  const candidateATimeline = timelineForSelected(
    identicalTitleRead,
    identicalTitleCandidateA,
  );
  const candidateBTimeline = timelineForSelected(
    identicalTitleRead,
    identicalTitleCandidateB,
  );
  assert.throws(
    () =>
      buildSelectedWorkRelationshipsV01({
        read: identicalTitleRead,
        selected_candidate: identicalTitleCandidateA,
        timeline: candidateBTimeline,
      }),
    /selected_work_relationship_timeline_scope_invalid/u,
    "matching public titles must not permit candidate B's timeline to be combined with candidate A",
  );
  const exactCandidateARelationships =
    buildSelectedWorkRelationshipsV01({
      read: identicalTitleRead,
      selected_candidate: identicalTitleCandidateA,
      timeline: candidateATimeline,
    });
  assert.equal(
    candidateATimeline.selected_work.selected_candidate_id,
    identicalTitleCandidateA.candidate.candidate_id,
  );
  assert.equal(
    candidateATimeline.selected_work.selected_candidate_fingerprint,
    identicalTitleCandidateA.candidate_fingerprint,
  );
  assert.equal(
    exactCandidateARelationships.selected_work_anchor
      .timeline_remains_current_position_owner,
    true,
  );

  const wrongTimelineFingerprint = {
    ...candidateATimeline,
    selected_work: {
      ...candidateATimeline.selected_work,
      selected_candidate_fingerprint: `sha256:${"0".repeat(64)}`,
    },
  } as SelectedWorkTimelineV01;
  assert.throws(
    () =>
      buildSelectedWorkRelationshipsV01({
        read: identicalTitleRead,
        selected_candidate: identicalTitleCandidateA,
        timeline: wrongTimelineFingerprint,
      }),
    /selected_work_relationship_timeline_scope_invalid/u,
    "the correct candidate ID with the wrong fingerprint must fail closed",
  );
  const wrongTimelineId = {
    ...candidateATimeline,
    selected_work: {
      ...candidateATimeline.selected_work,
      selected_candidate_id:
        identicalTitleCandidateB.candidate.candidate_id,
    },
  } as SelectedWorkTimelineV01;
  assert.throws(
    () =>
      buildSelectedWorkRelationshipsV01({
        read: identicalTitleRead,
        selected_candidate: identicalTitleCandidateA,
        timeline: wrongTimelineId,
      }),
    /selected_work_relationship_timeline_scope_invalid/u,
    "the correct fingerprint with the wrong candidate ID must fail closed",
  );

  const candidateRefAbsentTimeline = {
    ...candidateATimeline,
    items: candidateATimeline.items.map((item) => ({
      ...item,
      source_refs: item.source_refs.filter(
        (ref) => ref.source_kind !== "candidate",
      ),
    })),
  } satisfies SelectedWorkTimelineV01;
  assert.throws(
    () =>
      buildSelectedWorkRelationshipsV01({
        read: identicalTitleRead,
        selected_candidate: identicalTitleCandidateA,
        timeline: candidateRefAbsentTimeline,
      }),
    /selected_work_relationship_timeline_scope_invalid/u,
    "a timeline with no exact candidate ref must fail closed",
  );
  const ambiguousCandidateRefTimeline = {
    ...candidateATimeline,
    items: candidateATimeline.items.map((item) =>
      item.item_id === candidateATimeline.current_item_id
        ? {
            ...item,
            source_refs: [
              ...item.source_refs,
              {
                source_kind: "candidate" as const,
                record_id:
                  identicalTitleCandidateB.candidate.candidate_id,
                record_fingerprint:
                  identicalTitleCandidateB.candidate_fingerprint,
              },
            ],
          }
        : item,
    ),
  } satisfies SelectedWorkTimelineV01;
  assert.throws(
    () =>
      buildSelectedWorkRelationshipsV01({
        read: identicalTitleRead,
        selected_candidate: identicalTitleCandidateA,
        timeline: ambiguousCandidateRefTimeline,
      }),
    /selected_work_relationship_timeline_scope_invalid/u,
    "multiple distinct candidate refs make timeline scope ambiguous",
  );

  const candidateBExactRelationships =
    buildSelectedWorkRelationshipsV01({
      read: identicalTitleRead,
      selected_candidate: identicalTitleCandidateB,
      timeline: candidateBTimeline,
    });
  assert.notEqual(
    exactCandidateARelationships.selected_work_anchor
      .selected_candidate_fingerprint,
    candidateBExactRelationships.selected_work_anchor
      .selected_candidate_fingerprint,
    "candidate switching must rebuild both timeline and relationship identity",
  );
  const identicalTitlePublicCopy = [
    candidateATimeline.selected_work.title,
    candidateATimeline.selected_work.current_meaning,
    candidateATimeline.current_position.title,
    candidateATimeline.current_position.summary,
    ...exactCandidateARelationships.connections.flatMap((connection) => [
      connection.title,
      connection.explanation,
      connection.why_it_matters_now,
    ]),
  ].join(" ");
  assert.equal(
    identicalTitlePublicCopy.includes(
      identicalTitleCandidateA.candidate.candidate_id,
    ),
    false,
  );
  assert.equal(
    identicalTitlePublicCopy.includes(
      identicalTitleCandidateA.candidate_fingerprint,
    ),
    false,
  );

  const exactRelationFamily = structuredClone(
    reconciliation.relation_families.find(
      (family) =>
        family.revisions[0]?.relation.relation_kind === "supports",
    )!,
  );
  const exactRelationRevision = exactRelationFamily.revisions[0]!;
  exactRelationRevision.relation = {
    ...exactRelationRevision.relation,
    relation_id: exactRelationRevision.relation_ref.record_id,
    claim_ref: exactRelationFamily.claim_ref,
    evidence_ref: exactRelationFamily.evidence_ref,
    uncertainty: [],
    integrity: {
      fingerprint:
        exactRelationRevision.relation_ref.record_fingerprint,
    },
  } as never;
  const relationBoundRead = {
    ...timelineBaseRead,
    proposal: {
      ...timelineBaseRead.proposal,
      project_verify_lifecycle: {
        lifecycle_binding: {
          entity_kind: "claim_evidence_relation",
          family_id: exactRelationFamily.relation_family_id,
          selected_record_ref: exactRelationRevision.relation_ref,
          relation_endpoints: {
            claim_ref: exactRelationFamily.claim_ref,
            evidence_ref: exactRelationFamily.evidence_ref,
          },
          selected_candidate: {
            candidate_id: timelineCandidate.candidate.candidate_id,
            candidate_fingerprint: timelineCandidate.candidate_fingerprint,
          },
        },
      } as never,
    },
    project_verify_reconciliation: {
      ...timelineBaseRead.project_verify_reconciliation,
      relation_families: [exactRelationFamily],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const relationBoundRelationships = relationshipsFor(relationBoundRead);
  const exactRecordedRelation =
    relationBoundRelationships.connections.find(
      (connection) =>
        connection.basis === "exact_recorded_relation",
    );
  assert.equal(exactRecordedRelation?.relation_kind, "supported_by");
  assert.equal(exactRecordedRelation?.support_status, "exact");
  assert.equal(
    exactRecordedRelation?.exact_refs.some(
      (ref) => ref.source_kind === "claim_evidence_relation",
    ),
    true,
  );
  assert.equal(
    exactRecordedRelation?.why_it_matters_now.includes("does not prove"),
    true,
  );

  const partialRelationRead = {
    ...relationBoundRead,
    project_verify_reconciliation: {
      ...relationBoundRead.project_verify_reconciliation,
      relation_families: [
        {
          ...exactRelationFamily,
          revisions: [],
          completeness: {
            ...exactRelationFamily.completeness,
            status: "bounded_incomplete" as const,
            omitted_reason: "bounded exact relation source unavailable",
          },
        },
      ],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const partialRelationships = relationshipsFor(partialRelationRead);
  assert.equal(partialRelationships.answer_availability, "partial");
  assert.equal(partialRelationships.completeness.upstream_incomplete, true);
  assert.equal(
    partialRelationships.connections.some(
      (connection) => connection.support_status === "partial",
    ),
    true,
  );

  const acceptedRelationships = relationshipsFor(acceptedRead);
  assert.equal(
    acceptedRelationships.selected_question_key,
    "candidate_and_decision",
  );
  const acceptedScope = relationshipScope({
    proposal_id: acceptedRead.proposal.proposal_id,
    proposal_fingerprint: acceptedRead.proposal.integrity.fingerprint,
    candidate_id: acceptedRead.candidates[0]!.candidate.candidate_id,
    candidate_fingerprint:
      acceptedRead.candidates[0]!.candidate_fingerprint,
  });
  const acceptedSupportSelection = {
    scope_key: acceptedScope,
    question_key: "support_and_source",
  } as const;
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: acceptedScope,
      selection: acceptedSupportSelection,
      available_questions: acceptedRelationships.questions,
      default_question_key: acceptedRelationships.selected_question_key,
    }),
    "support_and_source",
    "same exact proposal and candidate must preserve a supported user selection",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: relationshipScope({
        candidate_id: "delta:switched-candidate",
        candidate_fingerprint: `sha256:${"e".repeat(64)}`,
      }),
      selection: acceptedSupportSelection,
      available_questions: acceptedRelationships.questions,
      default_question_key: acceptedRelationships.selected_question_key,
    }),
    "candidate_and_decision",
    "switching candidates must use the new candidate's deterministic default",
  );
  assert.equal(
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: acceptedScope,
      selection: null,
      available_questions: acceptedRelationships.questions,
      default_question_key: acceptedRelationships.selected_question_key,
    }),
    "candidate_and_decision",
    "returning to a remounted exact scope must rebuild its current default instead of restoring an old selection",
  );
  assert.equal(
    acceptedRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "decided_by" &&
        connection.basis === "user_decision",
    ),
    true,
  );
  assert.equal(
    acceptedRelationships.selected_work_anchor.timeline_stage,
    acceptedTimeline.current_position.stage,
  );
  const priorSessionRelationships = relationshipsFor(
    priorSessionAcceptedRead,
  );
  assert.equal(
    priorSessionRelationships.selected_work_anchor.timeline_stage,
    "decision_recorded",
  );
  assert.equal(
    priorSessionRelationships.connections.some(
      (connection) =>
        connection.uncertainty_or_conflict?.includes(
          "Current-session application authority is not present",
        ) === true,
    ),
    true,
  );
  assert.equal(
    priorSessionRelationships.connections.some(
      (connection) => connection.relation_kind === "applied_as",
    ),
    false,
  );

  for (const [read, expectedTitle] of [
    [rejectedRead, /reject decision/u],
    [deferredRead, /review-later decision/u],
  ] as const) {
    const relationships = relationshipsFor(read);
    assert.equal(
      relationships.selected_question_key,
      "candidate_and_decision",
    );
    assert.match(relationships.connections[0]?.title ?? "", expectedTitle);
  }

  const supersedeWithLineage = {
    ...supersedingDecision,
    lineage: {
      ...supersedingDecision.lineage,
      prior_decisions: [
        {
          decision_id: acceptedTimelineDecision.decision_id,
          decision_fingerprint:
            acceptedTimelineDecision.integrity.fingerprint,
        },
      ],
    },
  };
  const supersedeRelationships = relationshipsFor({
    ...timelineBaseRead,
    decisions: [supersedeWithLineage, acceptedTimelineDecision],
    decision_history: [
      historyFor(acceptedTimelineDecision, false),
      historyFor(supersedeWithLineage),
    ],
  });
  assert.equal(
    supersedeRelationships.connections.some(
      (connection) => connection.relation_kind === "supersedes",
    ),
    true,
  );
  const retractWithLineage = {
    ...retractingDecision,
    lineage: {
      ...retractingDecision.lineage,
      retracted_decision: {
        decision_id: acceptedTimelineDecision.decision_id,
        decision_fingerprint:
          acceptedTimelineDecision.integrity.fingerprint,
      },
    },
  };
  const retractRelationships = relationshipsFor({
    ...timelineBaseRead,
    decisions: [retractWithLineage, acceptedTimelineDecision],
    decision_history: [
      historyFor(acceptedTimelineDecision, false),
      historyFor(retractWithLineage),
    ],
  });
  assert.equal(
    retractRelationships.connections.some(
      (connection) => connection.relation_kind === "retracts",
    ),
    true,
  );

  const blockedRelationships = relationshipsFor(blockedRead);
  assert.equal(
    blockedRelationships.selected_question_key,
    "blocker_and_conflict",
  );
  assert.equal(
    blockedRelationships.selected_work_anchor.timeline_stage,
    "transition_blocked",
  );
  assert.equal(
    blockedRelationships.connections[0]?.relation_kind,
    "blocked_by",
  );
  assert.equal(
    blockedRelationships.connections[0]?.basis,
    "blocker_or_conflict",
  );

  const exactConflictFamily = structuredClone(exactRelationFamily);
  exactConflictFamily.revisions[0]!.lifecycle.conflicts = [
    {
      conflict_kind: "current_head",
      code: "project_verify_current_head_conflict",
      exact_refs: [exactRef("claim_evidence_relation", "relation:pc3-conflict")],
      source_refs: [],
    },
  ];
  const exactConflictRead = {
    ...relationBoundRead,
    project_verify_reconciliation: {
      ...relationBoundRead.project_verify_reconciliation,
      relation_families: [exactConflictFamily],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const exactConflictRelationships = relationshipsFor(
    exactConflictRead,
    "blocker_and_conflict",
  );
  assert.equal(
    exactConflictRelationships.selected_question_key,
    "blocker_and_conflict",
  );
  assert.equal(exactConflictRelationships.answer_availability, "conflicted");
  assert.equal(
    exactConflictRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "conflicts_with" &&
        connection.support_status === "conflicting",
    ),
    true,
  );

  const exactProtocolKinds = [
    "task_context_packet",
    "run_receipt",
    "criterion_assessment",
    "evidence_record",
    "claim_record",
    "claim_evidence_relation",
    "episode_delta_proposal",
    "episode_delta_proposal_candidate",
    "review_decision",
    "semantic_commit_gate",
    "state_transition_receipt",
    "semantic_state",
    "semantic_target_head",
    "context_use_review",
  ] as const satisfies readonly ProjectVerifyExactProtocolKindV01[];
  const exhaustiveConflictFamily = structuredClone(exactRelationFamily);
  exhaustiveConflictFamily.revisions[0]!.lifecycle.conflicts = [
    {
      conflict_kind: "current_head",
      code: "project_verify_exact_kind_mapping",
      exact_refs: exactProtocolKinds.map((kind) =>
        exactRef(kind, `exact-kind:${kind}`)
      ),
      source_refs: [],
    },
  ];
  const exhaustiveKindRead = {
    ...relationBoundRead,
    project_verify_reconciliation: {
      ...relationBoundRead.project_verify_reconciliation,
      relation_families: [exhaustiveConflictFamily],
    },
  } satisfies SemanticReviewProposalDetailV01;
  const exhaustiveKindRelationships = relationshipsFor(
    exhaustiveKindRead,
    "blocker_and_conflict",
  );
  const exhaustiveKindConnection =
    exhaustiveKindRelationships.connections.find((connection) =>
      connection.exact_refs.some((ref) =>
        ref.record_id.startsWith("exact-kind:")
      )
    );
  assert.ok(exhaustiveKindConnection);
  for (const kind of exactProtocolKinds) {
    assert.equal(
      exhaustiveKindConnection.exact_refs.find(
        (ref) => ref.record_id === `exact-kind:${kind}`,
      )?.source_kind,
      kind,
      `${kind} must preserve its exact canonical protocol kind`,
    );
  }

  const sameExactFingerprint = fingerprint(
    "pc3-exact-kind-deduplication",
  );
  const exactKindDeduplicationFamily =
    structuredClone(exactRelationFamily);
  exactKindDeduplicationFamily.revisions[0]!.lifecycle.conflicts = [
    {
      conflict_kind: "current_head",
      code: "project_verify_exact_kind_deduplication",
      exact_refs: [
        {
          record_kind: "criterion_assessment",
          record_id: "exact-kind:shared-id",
          record_fingerprint: sameExactFingerprint,
        },
        {
          record_kind: "semantic_state",
          record_id: "exact-kind:shared-id",
          record_fingerprint: sameExactFingerprint,
        },
      ],
      source_refs: [],
    },
  ];
  const exactKindDeduplicationRelationships = relationshipsFor(
    {
      ...relationBoundRead,
      project_verify_reconciliation: {
        ...relationBoundRead.project_verify_reconciliation,
        relation_families: [exactKindDeduplicationFamily],
      },
    },
    "blocker_and_conflict",
  );
  assert.deepEqual(
    exactKindDeduplicationRelationships.connections
      .flatMap((connection) => connection.exact_refs)
      .filter((ref) => ref.record_id === "exact-kind:shared-id")
      .map((ref) => ref.source_kind)
      .sort(),
    ["criterion_assessment", "semantic_state"],
    "exact-ref deduplication must retain refs that differ by canonical kind",
  );

  const unsupportedKindFamily = structuredClone(exactRelationFamily);
  unsupportedKindFamily.revisions[0]!.lifecycle.conflicts = [
    {
      conflict_kind: "current_head",
      code: "project_verify_unsupported_exact_kind",
      exact_refs: [
        {
          ...exactRef("semantic_state", "exact-kind:unsupported"),
          record_kind: "future_protocol_kind",
        } as unknown as ProjectVerifyExactProtocolRefV01,
      ],
      source_refs: [],
    },
  ];
  assert.throws(
    () =>
      relationshipsFor(
        {
          ...relationBoundRead,
          project_verify_reconciliation: {
            ...relationBoundRead.project_verify_reconciliation,
            relation_families: [unsupportedKindFamily],
          },
        },
        "blocker_and_conflict",
      ),
    /selected_work_relationship_exact_ref_kind_unsupported/u,
    "an unsupported future protocol kind must fail closed instead of becoming a proposal",
  );

  const appliedRelationships = relationshipsFor(appliedRead);
  assert.equal(
    appliedRelationships.selected_question_key,
    "decision_and_project_change",
  );
  assert.equal(
    appliedRelationships.selected_work_anchor.timeline_stage,
    "project_updated",
  );
  assert.equal(
    appliedRelationships.connections[0]?.relation_kind,
    "applied_as",
  );
  assert.equal(
    appliedRelationships.connections[0]?.basis,
    "authorized_project_change",
  );

  const candidateARelationships = relationshipsForSelected(
    candidateAAppliedRead,
    candidateLocalA,
  );
  const candidateBRelationships = relationshipsForSelected(
    candidateAAppliedRead,
    candidateLocalB,
  );
  assert.equal(
    candidateARelationships.selected_question_key,
    "decision_and_project_change",
  );
  assert.equal(
    candidateBRelationships.selected_question_key,
    "candidate_and_decision",
  );
  assert.equal(
    JSON.stringify(candidateARelationships).includes(
      candidateLocalDecisionB.decision_id,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(candidateBRelationships).includes(
      candidateLocalDecisionA.decision_id,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(candidateBRelationships).includes(
      candidateLocalReceiptA.transition_receipt_id,
    ),
    false,
  );
  assert.equal(
    relationshipsForSelected(
      twoActionableCandidatesRead,
      candidateLocalA,
      "project_change_and_later_outcome",
    ).selected_question_key,
    "candidate_and_decision",
    "a stale question selection must fall back inside the selected candidate scope",
  );

  const laterRelationships = relationshipsFor(laterAvailableRead);
  assert.equal(
    laterRelationships.selected_question_key,
    "project_change_and_later_outcome",
  );
  assert.equal(
    laterRelationships.selected_work_anchor.timeline_stage,
    "later_outcome_available",
  );
  assert.equal(
    laterRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "used_by_later_work" &&
        connection.exact_refs.some(
          (ref) => ref.source_kind === "task_context_packet",
        ),
    ),
    true,
  );
  assert.equal(
    laterRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "used_by_later_work" &&
        connection.target_role === "later_work" &&
        connection.exact_refs.some(
          (ref) => ref.source_kind === "run_receipt",
        ),
    ),
    true,
    "a later receipt remains distinguishable through relationship role while retaining its canonical protocol kind",
  );
  assert.equal(
    laterRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "reviewed_by_later_feedback",
    ),
    false,
  );
  const laterReviewedRelationships = relationshipsFor(laterReviewedRead);
  assert.equal(
    laterReviewedRelationships.selected_work_anchor.timeline_stage,
    "later_outcome_reviewed",
  );
  assert.equal(
    laterReviewedRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "reviewed_by_later_feedback",
    ),
    true,
  );
  const mismatchedLaterRead = {
    ...laterAvailableRead,
    project_continuity: {
      ...laterAvailableRead.project_continuity,
      latest_context_use_receipt: {
        ...laterReceipt,
        task_context_packet_fingerprint: `sha256:${"1".repeat(64)}`,
      },
    },
  } satisfies SemanticReviewProposalDetailV01;
  const mismatchedLaterRelationships = relationshipsFor(mismatchedLaterRead);
  assert.equal(
    mismatchedLaterRelationships.questions.some(
      (question) =>
        question.question_key === "project_change_and_later_outcome",
    ),
    false,
  );
  assert.equal(
    mismatchedLaterRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "used_by_later_work" ||
        connection.relation_kind === "reviewed_by_later_feedback",
    ),
    false,
  );
  const reviewMismatchRelationships = relationshipsFor({
    ...laterReviewedRead,
    project_continuity: {
      ...laterReviewedRead.project_continuity,
      latest_context_use_review_status: {
        ...laterReviewedRead.project_continuity
          .latest_context_use_review_status!,
        later_task_run_receipt_fingerprint: `sha256:${"0".repeat(64)}`,
      },
    },
  });
  assert.equal(
    reviewMismatchRelationships.selected_work_anchor.timeline_stage,
    "later_outcome_available",
  );
  assert.equal(
    reviewMismatchRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "reviewed_by_later_feedback",
    ),
    false,
  );
  const exactReviewedTimeline = timelineFor(laterReviewedRead);
  const mismatchedReviewRefTimeline = {
    ...exactReviewedTimeline,
    items: exactReviewedTimeline.items.map((item) =>
      item.item_id === exactReviewedTimeline.current_item_id
        ? {
            ...item,
            source_refs: item.source_refs.map((ref) =>
              ref.source_kind === "later_feedback"
                ? {
                    ...ref,
                    record_fingerprint: `sha256:${"0".repeat(64)}`,
                  }
                : ref,
            ),
          }
        : item,
    ),
  } satisfies SelectedWorkTimelineV01;
  const mismatchedReviewRefRelationships =
    buildSelectedWorkRelationshipsV01({
      read: laterReviewedRead,
      selected_candidate: laterReviewedRead.candidates[0]!,
      timeline: mismatchedReviewRefTimeline,
      selected_question_key: "project_change_and_later_outcome",
    });
  assert.equal(
    mismatchedReviewRefRelationships.connections.some(
      (connection) =>
        connection.relation_kind === "reviewed_by_later_feedback",
    ),
    false,
    "a mismatched exact review fingerprint must not create a reviewed connection",
  );
  assert.equal(
    mismatchedReviewRefRelationships.connections.some(
      (connection) => connection.relation_kind === "used_by_later_work",
    ),
    true,
    "a review mismatch must not erase the separately exact later-result connection",
  );

  const noRelationshipCandidate = {
    ...structuredClone(timelineCandidate),
    candidate: {
      ...structuredClone(timelineCandidate.candidate),
      basis_material_ids: [],
      source_refs: [],
    },
  };
  noRelationshipCandidate.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(
      noRelationshipCandidate.candidate,
    );
  noRelationshipCandidate.pilot_admission = {
    ...noRelationshipCandidate.pilot_admission,
    candidate_id: noRelationshipCandidate.candidate.candidate_id,
    candidate_fingerprint: noRelationshipCandidate.candidate_fingerprint,
  };
  const unavailableRelationships = relationshipsFor({
    ...timelineBaseRead,
    candidates: [noRelationshipCandidate],
    source_run_receipts: [],
    source_lanes: {
      observations: [],
      attestations: [],
      inferences: [],
    },
    proposal: {
      ...timelineBaseRead.proposal,
      project_verify_lifecycle: undefined,
    },
  });
  assert.equal(unavailableRelationships.questions.length, 0);
  assert.equal(unavailableRelationships.answer_availability, "unavailable");
  assert.equal(unavailableRelationships.highlighted_connection_id, null);
  assert.equal(unavailableRelationships.connections.length, 0);

  const protocolSafeRelationships = buildSelectedWorkRelationshipsV01({
    read: {
      ...timelineBaseRead,
      candidates: [protocolNamedCandidate],
    },
    selected_candidate: protocolNamedCandidate,
    timeline: protocolSafeTimeline,
  });
  const ordinaryRelationshipCopy = [
    protocolSafeRelationships.selected_work_anchor.title,
    protocolSafeRelationships.selected_question_label,
    protocolSafeRelationships.completeness.summary,
    ...protocolSafeRelationships.connections.flatMap((connection) => [
      connection.title,
      connection.explanation,
      connection.why_it_matters_now,
      connection.uncertainty_or_conflict ?? "",
    ]),
  ].join(" ");
  assert.doesNotMatch(
    ordinaryRelationshipCopy,
    /EpisodeDeltaProposal|CriterionAssessment|RunReceipt|ReviewDecision|StateTransitionReceipt|TaskContextPacket|semantic gate|sha256:/u,
  );
  assert.equal(
    ordinaryRelationshipCopy.includes(
      protocolNamedCandidate.candidate.candidate_id,
    ),
    false,
  );

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
        selected_work_timeline_stage_matrix_checked: true,
        candidate_local_transition_actionability_checked: true,
        shared_next_candidate_owner_consistency_checked: true,
        prior_session_applying_decision_requires_current_review_checked: true,
        applied_receipt_overrides_session_actionability_checked: true,
        selected_candidate_timeline_isolation_checked: true,
        partial_order_and_unknown_time_checked: true,
        strict_protocol_timestamps_checked: true,
        unavailable_source_does_not_fabricate_observation_checked: true,
        exact_transition_packet_outcome_chain_checked: true,
        later_outcome_preserves_project_update_checked: true,
        timeline_public_copy_protocol_safe_checked: true,
        timeline_projection_authority_all_false_checked: true,
        selected_work_relationship_question_derivation_checked: true,
        selected_work_relationship_exact_scope_selection_checked: true,
        selected_work_relationship_candidate_source_ref_binding_checked: true,
        selected_work_relationship_shared_source_policy_checked: true,
        selected_work_relationship_exact_timeline_candidate_anchor_checked: true,
        selected_work_relationship_protocol_kind_exhaustiveness_checked: true,
        selected_work_relationship_basis_separation_checked: true,
        selected_work_relationship_candidate_isolation_checked: true,
        selected_work_relationship_exact_later_chain_checked: true,
        selected_work_relationship_bounds_and_deduplication_checked: true,
        selected_work_relationship_completeness_checked: true,
        selected_work_relationship_public_copy_protocol_safe_checked: true,
        selected_work_relationship_projection_authority_all_false_checked: true,
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
    delegated_work: null,
  };
}

function delegatedWorkV01(
  stage: DelegatedWorkStageV01,
): DelegatedWorkProjectionV01 {
  const resultReady = stage === "result_ready";
  return {
    projection_version: "delegated_work_projection.v0.1",
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    run_ref: "autonomy-run:ai-workplane-delegated",
    mode: "interactive",
    source_status: "available",
    stage,
    started_at: OBSERVED_AT,
    updated_at: OBSERVED_AT,
    finished_at: resultReady ? OBSERVED_AT : null,
    current: {
      goal: "Review the bounded current result",
      stage_label:
        stage === "waiting_for_approval"
          ? "Waiting for your approval"
          : stage === "resume_required"
            ? "Interrupted"
            : resultReady
              ? "Result ready"
              : "Working",
      situation: "Codex work has an exact persisted operational state.",
      latest_checkpoint: "Running a project command",
      material_blocker_or_request:
        stage === "waiting_for_approval"
          ? "A project command needs review."
          : null,
      reconciliation_required: stage === "resume_required",
      last_observed_at: OBSERVED_AT,
      trusted_result_available: resultReady,
      needs_user:
        stage === "waiting_for_approval" ||
        stage === "resume_required" ||
        resultReady,
    },
    timeline: [],
    compacted_item_count: 0,
    gap_notes: [],
    next_action: {
      kind:
        stage === "waiting_for_approval"
          ? "review_requested_access"
          : stage === "resume_required"
            ? "resume_codex_work"
            : resultReady
              ? "review_result"
              : "none",
      label:
        stage === "waiting_for_approval"
          ? "Review requested access"
          : stage === "resume_required"
            ? "Resume Codex work"
            : resultReady
              ? "Review result"
              : null,
      href: resultReady ? "/workbench/results/run-receipt~test" : null,
      executes: false,
    },
    pending_approval: null,
    resume_eligibility: null,
    result: resultReady
      ? {
          receipt_ref: "run-receipt:test",
          outcome: "completed",
          review_href: "/workbench/results/run-receipt~test",
        }
      : null,
    exact_detail_href: null,
    start_eligible: false,
    start_blocker: "A delegated run is active.",
    control_revision: 1,
    can_cancel: stage === "working" || stage === "waiting_for_approval",
    authority: {
      writes_database: false,
      creates_run: false,
      starts_codex: false,
      approves_host_action: false,
      cancels_run: false,
      resumes_run: false,
      creates_result: false,
      establishes_task_success: false,
      creates_evidence: false,
      changes_project_state: false,
      calls_provider: false,
      calls_github: false,
      retries: false,
    },
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
