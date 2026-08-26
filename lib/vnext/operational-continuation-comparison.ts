import {
  buildContextUseAttributionProjectionV01,
  validateContextUseAttributionProjectionV01,
} from "@/lib/vnext/context-use-attribution-projection";
import {
  validateContextUseReviewRelationsV01,
  validateContextUseReviewV01,
} from "@/lib/vnext/context-use-review";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  type ProtocolValidationIssueSinkV01,
} from "@/lib/vnext/protocol-primitives";
import {
  validateOperationalContextSelectionV01,
  validateOperationalContinuationAdmissionIdentityV01,
} from "@/lib/vnext/operational-context-selection";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { assertOperationalContinuationAdmissionV01 } from "@/lib/vnext/runtime/source-linked-operational-continuation-lineage";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import {
  CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01,
  type ContextUseReviewV01,
} from "@/types/vnext/context-use-review";
import type { OperationalContinuationAdmissionV01 } from "@/types/vnext/operational-continuation-admission";
import {
  SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
  type SourceLinkedOperationalContinuationV01,
} from "@/types/vnext/operational-context-selection";
import {
  OPERATIONAL_CONTINUATION_COMPARISON_VERSION_V01,
  OPERATIONAL_CONTINUATION_EQUAL_CEILING_VERSION_V01,
  type OperationalContinuationBaselineBindingV01,
  type OperationalContinuationBudgetComplianceStateV01,
  type OperationalContinuationCandidateBindingV01,
  type OperationalContinuationComparisonAuthorityV01,
  type OperationalContinuationComparisonDimensionDeltaV01,
  type OperationalContinuationComparisonIntegrityV01,
  type OperationalContinuationComparisonRecordRefV01,
  type OperationalContinuationComparisonStatusV01,
  type OperationalContinuationComparisonV01,
  type OperationalContinuationComparisonValidationResultV01,
  type OperationalContinuationCoordinationOverheadV01,
  type OperationalContinuationCostOperabilityV01,
  type OperationalContinuationEqualCeilingEnvelopeV01,
  type OperationalContinuationEqualCeilingRowV01,
  type OperationalContinuationHarmfulTransferV01,
  type OperationalContinuationLatencyProvenanceV01,
  type OperationalContinuationManagedRunBindingV01,
  type OperationalContinuationParityDimensionV01,
  type OperationalContinuationParityRowV01,
  type OperationalContinuationRepositoryStateBindingV01,
  type OperationalContinuationResourceDimensionV01,
  type OperationalContinuationReviewBurdenV01,
  type OperationalContinuationTaskOutcomeV01,
} from "@/types/vnext/operational-continuation-comparison";
import {
  RUN_RECEIPT_EXECUTION_STATUSES_V01,
  RUN_RECEIPT_VERIFICATION_STATUSES_V01,
  type RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const COMMIT = /^[a-f0-9]{40}$/u;
const SAFE_ID = /^[A-Za-z0-9:._/-]{1,512}$/u;
const PRIVATE_PATH = /(?:^|[\s"'])(?:\/(?:Users|home|private|var|tmp|etc)\/|[A-Za-z]:\\)/u;
const PENDING_COMPARISON_ID = "operational-continuation-comparison:pending";
const PENDING_ENVELOPE_ID = "operational-continuation-equal-ceiling:pending";
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const MAX_ITEMS = 128;
const MAX_TEXT = 2000;
const MAX_COUNT = 1_000_000_000;

const RESOURCE_DIMENSIONS: OperationalContinuationResourceDimensionV01[] = [
  "provider_call_count",
  "host_tool_command_count",
  "step_operation_count",
  "usage_unit_count",
  "cost_microunits",
  "latency_ms",
];
const PARITY_DIMENSIONS: OperationalContinuationParityDimensionV01[] = [
  "task_goal",
  "success_criteria",
  "non_goals",
  "required_checks",
  "forbidden_actions",
  "data_classification",
  "work_task_family",
  "frozen_repository_head",
  "initial_worktree_content",
  "platform",
  "native_host_adapter",
  "native_host_capability",
  "operation_approval_policy",
  "verification_owner_set",
  "construction_cutoff",
];
const REQUIRED_EQUAL_PARITY_DIMENSIONS = new Set<
  OperationalContinuationParityDimensionV01
>([
  "task_goal",
  "success_criteria",
  "non_goals",
  "required_checks",
  "forbidden_actions",
  "data_classification",
  "work_task_family",
  "frozen_repository_head",
  "initial_worktree_content",
  "construction_cutoff",
]);

export interface OperationalContinuationComparisonExactObservationsV01 {
  step_operation_count: number | null;
  required_human_interventions: number | null;
  recovery_reconciliation_actions: number | null;
  cleanup_recovery_burden: number | null;
  additional_review_actions: number | null;
  latency_provenance: OperationalContinuationLatencyProvenanceV01;
}

export interface OperationalContinuationEqualCeilingInputV01 {
  provider_call_count: number;
  host_tool_command_count: number;
  step_operation_count: number;
  usage_unit_count: number;
  cost_microunits: number;
  latency_ms: number;
}

export interface BuildOperationalContinuationComparisonInputV01 {
  task_family_key: string;
  frozen_construction_cutoff: string;
  observation_cutoff: string;
  equal_ceiling: OperationalContinuationEqualCeilingInputV01;
  candidate: {
    evaluation_case_id: string;
    repository_state: OperationalContinuationRepositoryStateBindingV01;
    packet_a: TaskContextPacketV01;
    run_a: OperationalContinuationManagedRunBindingV01;
    run_receipt_a: RunReceiptV01;
    context_use_review_a: ContextUseReviewV01;
    continuation: SourceLinkedOperationalContinuationV01;
    admission: OperationalContinuationAdmissionV01;
    run_b: OperationalContinuationManagedRunBindingV01;
    run_receipt_b: RunReceiptV01;
    context_use_review_b: ContextUseReviewV01;
    context_use_attribution_b: ContextUseAttributionProjectionV01;
    exact_observations: OperationalContinuationComparisonExactObservationsV01;
  };
  baseline: {
    evaluation_case_id: string;
    repository_state: OperationalContinuationRepositoryStateBindingV01;
    prior_packet: TaskContextPacketV01;
    packet: TaskContextPacketV01;
    source_transition_receipt: StateTransitionReceiptV01;
    run: OperationalContinuationManagedRunBindingV01;
    run_receipt: RunReceiptV01;
    context_use_review: ContextUseReviewV01;
    exact_observations: OperationalContinuationComparisonExactObservationsV01;
  };
  limitations: string[];
}

export class OperationalContinuationComparisonErrorV01 extends Error {
  constructor(readonly code: string, readonly path = "$") {
    super(code);
    this.name = "OperationalContinuationComparisonErrorV01";
  }
}

export function buildOperationalContinuationComparisonV01(
  input: BuildOperationalContinuationComparisonInputV01,
): OperationalContinuationComparisonV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertSafeSourceMaterialV01(input);
  const taskFamilyKey = requiredIdV01(input.task_family_key, "$.task_family_key");
  const frozenCutoff = requiredTimestampV01(
    input.frozen_construction_cutoff,
    "$.frozen_construction_cutoff",
  );
  const observationCutoff = requiredTimestampV01(
    input.observation_cutoff,
    "$.observation_cutoff",
  );
  if (timestampV01(observationCutoff) <= timestampV01(frozenCutoff)) {
    failV01("operational_comparison_cutoff_order_invalid", "$.observation_cutoff");
  }
  assertExactObservationV01(input.candidate.exact_observations, "$.candidate.exact_observations");
  assertExactObservationV01(input.baseline.exact_observations, "$.baseline.exact_observations");

  const candidate = validateAndBindCandidateV01(
    input.candidate,
    frozenCutoff,
    observationCutoff,
  );
  const baseline = validateAndBindBaselineV01(
    input.baseline,
    frozenCutoff,
    observationCutoff,
  );
  if (candidate.project_id === baseline.project_id) {
    failV01("operational_comparison_scope_isolation_invalid", "$.baseline");
  }
  if (
    input.candidate.evaluation_case_id !== input.baseline.evaluation_case_id ||
    candidate.evaluation_case_id !== baseline.evaluation_case_id
  ) {
    failV01("operational_comparison_evaluation_case_mismatch");
  }

  const structuralParity = createStructuralParityV01(
    input.candidate,
    input.baseline,
    taskFamilyKey,
    frozenCutoff,
  );
  const evaluationCaseFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      evaluation_case_id: candidate.evaluation_case_id,
      task_family_key: taskFamilyKey,
      task: input.candidate.packet_a.task,
      constraints: {
        required_checks: input.candidate.packet_a.constraints.required_checks,
        forbidden_actions: input.candidate.packet_a.constraints.forbidden_actions,
        data_classification:
          input.candidate.packet_a.constraints.data_classification,
      },
      frozen_head_commit:
        input.candidate.repository_state.frozen_head_commit,
      frozen_worktree_content_fingerprint:
        input.candidate.repository_state.frozen_worktree_content_fingerprint,
      frozen_construction_cutoff: frozenCutoff,
    }),
  );

  const candidateTaskOutcome = deriveTaskOutcomeV01(
    input.candidate.run_receipt_b,
    [input.candidate.run_receipt_a, input.candidate.run_receipt_b],
  );
  const baselineTaskOutcome = deriveTaskOutcomeV01(
    input.baseline.run_receipt,
    [input.baseline.run_receipt],
  );
  const continuationContribution = deriveContributionV01(
    input.candidate.context_use_review_b,
    input.candidate.context_use_attribution_b,
  );
  const candidatePostContinuationReviewBurden = deriveReviewBurdenV01(
    input.candidate.context_use_review_b,
    input.candidate.exact_observations,
  );
  const candidateReviewBurden = aggregateOperationalContinuationReviewBurdenV01(
    input.candidate.context_use_review_a,
    input.candidate.context_use_review_b,
    input.candidate.exact_observations,
  );
  const baselineReviewBurden = deriveReviewBurdenV01(
    input.baseline.context_use_review,
    input.baseline.exact_observations,
  );
  const candidateCoordination = deriveCandidateCoordinationV01(input.candidate);
  const baselineCoordination = deriveBaselineCoordinationV01(input.baseline);
  const candidateCost = deriveCostOperabilityV01(
    [input.candidate.run_receipt_a, input.candidate.run_receipt_b],
    input.candidate.run_a.started_at,
    input.candidate.context_use_review_b.reviewed_at,
    input.candidate.exact_observations,
    input.candidate.repository_state.platform,
  );
  const baselineCost = deriveCostOperabilityV01(
    [input.baseline.run_receipt],
    input.baseline.run.started_at,
    input.baseline.context_use_review.reviewed_at,
    input.baseline.exact_observations,
    input.baseline.repository_state.platform,
  );
  const equalCeiling = buildEqualCeilingV01(
    input.equal_ceiling,
    {
      provider_call_count: candidateCost.provider_model_call_count,
      host_tool_command_count: candidateCost.host_tool_command_count,
      step_operation_count:
        input.candidate.exact_observations.step_operation_count,
      usage_unit_count: candidateCost.usage_unit_count,
      cost_microunits: candidateCost.cost_microunits,
      latency_ms: candidateCost.run_latency_ms,
    },
    {
      provider_call_count: baselineCost.provider_model_call_count,
      host_tool_command_count: baselineCost.host_tool_command_count,
      step_operation_count:
        input.baseline.exact_observations.step_operation_count,
      usage_unit_count: baselineCost.usage_unit_count,
      cost_microunits: baselineCost.cost_microunits,
      latency_ms: baselineCost.run_latency_ms,
    },
  );
  const dimensionDeltas = deriveDimensionDeltasV01({
    candidateTaskOutcome,
    baselineTaskOutcome,
    candidateReviewBurden,
    baselineReviewBurden,
    candidateCoordination,
    baselineCoordination,
    candidateCost,
    baselineCost,
  });
  const exactCaseStatus = deriveOperationalContinuationExactCaseStatusV01(
    dimensionDeltas,
    candidateTaskOutcome,
    baselineTaskOutcome,
    {
      complete_equal_budget_claim:
        equalCeiling.complete_equal_budget_claim,
      structural_parity: structuralParity,
    },
  );
  const harmfulTransfer = deriveHarmfulTransferV01(
    candidateTaskOutcome,
    baselineTaskOutcome,
    candidatePostContinuationReviewBurden,
    baselineReviewBurden,
    candidateCost,
    baselineCost,
  );
  const skipped = deriveSkippedDimensionsV01(equalCeiling, dimensionDeltas);
  const tradeOffs = deriveTradeOffsV01(
    dimensionDeltas,
    candidateTaskOutcome,
    baselineTaskOutcome,
  );
  const missingEvidence = deriveMissingEvidenceV01(
    skipped,
    continuationContribution.missing_attribution_lanes,
    candidateTaskOutcome,
    baselineTaskOutcome,
  );

  const comparison: OperationalContinuationComparisonV01 = {
    comparison_version: OPERATIONAL_CONTINUATION_COMPARISON_VERSION_V01,
    comparison_id: PENDING_COMPARISON_ID,
    comparison_kind: "pure_rebuildable_exact_case_non_authoritative",
    evaluation_case_id: candidate.evaluation_case_id,
    evaluation_case_fingerprint: evaluationCaseFingerprint,
    task_family_key: taskFamilyKey,
    frozen_construction_cutoff: frozenCutoff,
    observation_cutoff: observationCutoff,
    candidate,
    baseline,
    structural_parity: structuralParity,
    equal_ceiling: equalCeiling,
    candidate_task_outcome: candidateTaskOutcome,
    baseline_task_outcome: baselineTaskOutcome,
    continuation_contribution: continuationContribution,
    candidate_review_burden: candidateReviewBurden,
    candidate_post_continuation_review_burden:
      candidatePostContinuationReviewBurden,
    baseline_review_burden: baselineReviewBurden,
    candidate_coordination_overhead: candidateCoordination,
    baseline_coordination_overhead: baselineCoordination,
    candidate_cost_operability: candidateCost,
    baseline_cost_operability: baselineCost,
    dimension_deltas: dimensionDeltas,
    hard_gate_non_compensation_applied:
      candidateTaskOutcome.hard_gate_failure !==
      baselineTaskOutcome.hard_gate_failure,
    trade_offs: tradeOffs,
    skipped_unobserved_dimensions: skipped,
    candidate_budget_compliance: summarizeBudgetComplianceV01(
      equalCeiling.rows.map((row) => row.candidate_status),
    ),
    baseline_budget_compliance: summarizeBudgetComplianceV01(
      equalCeiling.rows.map((row) => row.baseline_status),
    ),
    exact_case_status: exactCaseStatus,
    harmful_transfer: harmfulTransfer,
    limitations: uniqueTextV01([
      ...input.limitations,
      "Exact-case association is not a general operational-policy benefit.",
      "Review A is structurally validated and exact-bound to the validated ACGC5A selection and materialization identity; complete historical semantic source revalidation remains owned upstream.",
      "Packet-level use is not distributed to item-level actual use, support, outcome association, or causal contribution.",
      "Equal declared ceilings do not establish equal capability.",
      ...(input.candidate.exact_observations.latency_provenance ===
          "synthetic_event_chronology" ||
        input.baseline.exact_observations.latency_provenance ===
          "synthetic_event_chronology"
        ? [
            "Synthetic protocol event chronology validates ordering but is not observed performance latency.",
          ]
        : []),
      "The comparison is pure, rebuildable, non-authoritative, and not persisted by default.",
    ]),
    missing_evidence: missingEvidence,
    no_bundle_credit: true,
    exact_case_only: true,
    material_boundary: materialBoundaryV01(),
    authority_summary: authorityV01(),
    integrity: pendingIntegrityV01(),
  };
  comparison.comparison_id = `operational-continuation-comparison:${hashSuffixV01(
    comparison,
    "comparison_id",
  )}`;
  comparison.integrity.fingerprint = fingerprintV01(comparison);
  assertValidOperationalContinuationComparisonV01(comparison);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("operational_comparison_input_mutated");
  }
  return comparison;
}

export function validateOperationalContinuationComparisonV01(
  input: unknown,
): OperationalContinuationComparisonValidationResultV01 {
  try {
    assertValidOperationalContinuationComparisonV01(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    return {
      status: "blocked",
      errors: [
        {
          code:
            error instanceof OperationalContinuationComparisonErrorV01
              ? error.code
              : "operational_comparison_invalid",
          path:
            error instanceof OperationalContinuationComparisonErrorV01
              ? error.path
              : "$",
        },
      ],
    };
  }
}

export function assertValidOperationalContinuationComparisonV01(
  input: unknown,
): asserts input is OperationalContinuationComparisonV01 {
  if (!isProtocolRecordV01(input)) failV01("operational_comparison_invalid");
  assertSafeMaterialV01(input);
  const comparison = input as unknown as OperationalContinuationComparisonV01;
  assertExactKeysV01(comparison, [
    "comparison_version", "comparison_id", "comparison_kind",
    "evaluation_case_id", "evaluation_case_fingerprint", "task_family_key",
    "frozen_construction_cutoff", "observation_cutoff", "candidate", "baseline",
    "structural_parity", "equal_ceiling", "candidate_task_outcome",
    "baseline_task_outcome", "continuation_contribution", "candidate_review_burden",
    "candidate_post_continuation_review_burden", "baseline_review_burden",
    "candidate_coordination_overhead",
    "baseline_coordination_overhead", "candidate_cost_operability",
    "baseline_cost_operability", "dimension_deltas",
    "hard_gate_non_compensation_applied", "trade_offs",
    "skipped_unobserved_dimensions", "candidate_budget_compliance",
    "baseline_budget_compliance", "exact_case_status", "harmful_transfer",
    "limitations", "missing_evidence", "no_bundle_credit", "exact_case_only",
    "material_boundary", "authority_summary", "integrity",
  ], "$");
  if (
    comparison.comparison_version !==
      OPERATIONAL_CONTINUATION_COMPARISON_VERSION_V01 ||
    comparison.comparison_kind !==
      "pure_rebuildable_exact_case_non_authoritative" ||
    comparison.no_bundle_credit !== true ||
    comparison.exact_case_only !== true ||
    comparison.candidate.project_id === comparison.baseline.project_id ||
    comparison.candidate.evaluation_case_id !== comparison.evaluation_case_id ||
    comparison.baseline.evaluation_case_id !== comparison.evaluation_case_id
  ) {
    failV01("operational_comparison_contract_invalid");
  }
  requiredIdV01(comparison.comparison_id, "$.comparison_id");
  requiredIdV01(comparison.evaluation_case_id, "$.evaluation_case_id");
  requiredFingerprintV01(
    comparison.evaluation_case_fingerprint,
    "$.evaluation_case_fingerprint",
  );
  requiredTimestampV01(
    comparison.frozen_construction_cutoff,
    "$.frozen_construction_cutoff",
  );
  requiredTimestampV01(comparison.observation_cutoff, "$.observation_cutoff");
  assertCandidateBindingV01(comparison.candidate);
  assertBaselineBindingV01(comparison.baseline);
  assertParityRowsV01(comparison.structural_parity);
  assertEqualCeilingV01(comparison.equal_ceiling);
  assertTaskOutcomeV01(comparison.candidate_task_outcome, "$.candidate_task_outcome");
  assertTaskOutcomeV01(comparison.baseline_task_outcome, "$.baseline_task_outcome");
  assertContributionV01(comparison.continuation_contribution);
  assertReviewBurdenV01(comparison.candidate_review_burden, "$.candidate_review_burden");
  assertReviewBurdenV01(
    comparison.candidate_post_continuation_review_burden,
    "$.candidate_post_continuation_review_burden",
  );
  assertReviewBurdenV01(comparison.baseline_review_burden, "$.baseline_review_burden");
  assertCandidateReviewBurdenRelationV01(
    comparison.candidate_review_burden,
    comparison.candidate_post_continuation_review_burden,
  );
  assertCoordinationV01(comparison.candidate_coordination_overhead, "$.candidate_coordination_overhead");
  assertCoordinationV01(comparison.baseline_coordination_overhead, "$.baseline_coordination_overhead");
  if (
    comparison.candidate_coordination_overhead.managed_runs !== 2 ||
    comparison.candidate_coordination_overhead.repository_attachments !== 2 ||
    comparison.candidate_coordination_overhead.browser_start_confirmations !== 2 ||
    comparison.candidate_coordination_overhead.proposal_only_review_decisions < 1 ||
    comparison.candidate_coordination_overhead.continuation_admission_actions !== 1 ||
    comparison.candidate_coordination_overhead.context_use_review_actions !== 2 ||
    comparison.baseline_coordination_overhead.managed_runs !== 1 ||
    comparison.baseline_coordination_overhead.repository_attachments !== 1 ||
    comparison.baseline_coordination_overhead.browser_start_confirmations !== 1 ||
    comparison.baseline_coordination_overhead.proposal_only_review_decisions !== 0 ||
    comparison.baseline_coordination_overhead.continuation_admission_actions !== 0 ||
    comparison.baseline_coordination_overhead.context_use_review_actions !== 1
  ) {
    failV01("operational_comparison_coordination_structure_invalid");
  }
  assertCostV01(comparison.candidate_cost_operability, "$.candidate_cost_operability");
  assertCostV01(comparison.baseline_cost_operability, "$.baseline_cost_operability");
  const rebuiltDeltas = deriveDimensionDeltasV01({
    candidateTaskOutcome: comparison.candidate_task_outcome,
    baselineTaskOutcome: comparison.baseline_task_outcome,
    candidateReviewBurden: comparison.candidate_review_burden,
    baselineReviewBurden: comparison.baseline_review_burden,
    candidateCoordination: comparison.candidate_coordination_overhead,
    baselineCoordination: comparison.baseline_coordination_overhead,
    candidateCost: comparison.candidate_cost_operability,
    baselineCost: comparison.baseline_cost_operability,
  });
  assertCanonicalEqualV01(
    comparison.dimension_deltas,
    rebuiltDeltas,
    "operational_comparison_dimension_delta_reseal",
  );
  const rebuiltStatus = deriveOperationalContinuationExactCaseStatusV01(
    rebuiltDeltas,
    comparison.candidate_task_outcome,
    comparison.baseline_task_outcome,
    {
      complete_equal_budget_claim:
        comparison.equal_ceiling.complete_equal_budget_claim,
      structural_parity: comparison.structural_parity,
    },
  );
  if (comparison.exact_case_status !== rebuiltStatus) {
    failV01("operational_comparison_status_reseal");
  }
  const rebuiltHarm = deriveHarmfulTransferV01(
    comparison.candidate_task_outcome,
    comparison.baseline_task_outcome,
    comparison.candidate_post_continuation_review_burden,
    comparison.baseline_review_burden,
    comparison.candidate_cost_operability,
    comparison.baseline_cost_operability,
  );
  assertCanonicalEqualV01(
    comparison.harmful_transfer,
    rebuiltHarm,
    "operational_comparison_harmful_transfer_reseal",
  );
  const rebuiltSkipped = deriveSkippedDimensionsV01(
    comparison.equal_ceiling,
    rebuiltDeltas,
  );
  assertCanonicalEqualV01(
    comparison.skipped_unobserved_dimensions,
    rebuiltSkipped,
    "operational_comparison_skipped_dimensions_reseal",
  );
  if (
    comparison.candidate_budget_compliance !==
      summarizeBudgetComplianceV01(
        comparison.equal_ceiling.rows.map((row) => row.candidate_status),
      ) ||
    comparison.baseline_budget_compliance !==
      summarizeBudgetComplianceV01(
        comparison.equal_ceiling.rows.map((row) => row.baseline_status),
      ) ||
    comparison.hard_gate_non_compensation_applied !==
      (comparison.candidate_task_outcome.hard_gate_failure !==
        comparison.baseline_task_outcome.hard_gate_failure)
  ) {
    failV01("operational_comparison_summary_reseal");
  }
  assertCanonicalEqualV01(
    comparison.trade_offs,
    deriveTradeOffsV01(
      rebuiltDeltas,
      comparison.candidate_task_outcome,
      comparison.baseline_task_outcome,
    ),
    "operational_comparison_tradeoff_reseal",
  );
  assertCanonicalEqualV01(
    comparison.limitations,
    uniqueTextV01(comparison.limitations),
    "operational_comparison_limitations_invalid",
  );
  assertCanonicalEqualV01(
    comparison.missing_evidence,
    deriveMissingEvidenceV01(
      rebuiltSkipped,
      comparison.continuation_contribution.missing_attribution_lanes,
      comparison.candidate_task_outcome,
      comparison.baseline_task_outcome,
    ),
    "operational_comparison_missing_evidence_reseal",
  );
  assertCanonicalEqualV01(
    comparison.material_boundary,
    materialBoundaryV01(),
    "operational_comparison_material_boundary_invalid",
  );
  assertCanonicalEqualV01(
    comparison.authority_summary,
    authorityV01(),
    "operational_comparison_authority_invalid",
  );
  assertIntegrityV01(comparison.integrity, "$.integrity");
  if (comparison.integrity.fingerprint !== fingerprintV01(comparison)) {
    failV01("operational_comparison_fingerprint_mismatch", "$.integrity.fingerprint");
  }
  if (
    comparison.comparison_id !==
    `operational-continuation-comparison:${hashSuffixV01(
      comparison,
      "comparison_id",
    )}`
  ) {
    failV01("operational_comparison_id_mismatch", "$.comparison_id");
  }
}

function validateAndBindCandidateV01(
  input: BuildOperationalContinuationComparisonInputV01["candidate"],
  frozenCutoff: string,
  observationCutoff: string,
): OperationalContinuationCandidateBindingV01 {
  const packetA = input.packet_a;
  const continuation = input.continuation;
  const selection = continuation.selection;
  const packetB = continuation.candidate_task_context_packet_b;
  assertPacketV01(packetA, "$.candidate.packet_a");
  assertPacketV01(packetB, "$.candidate.continuation.candidate_task_context_packet_b");
  if (validateOperationalContextSelectionV01(selection).status !== "valid") {
    failV01("operational_comparison_selection_invalid", "$.candidate.continuation.selection");
  }
  if (
    validateOperationalContinuationAdmissionIdentityV01(
      continuation.materialization_identity,
    ).status !== "valid"
  ) {
    failV01("operational_comparison_materialization_identity_invalid");
  }
  try {
    assertOperationalContinuationAdmissionV01(input.admission);
  } catch {
    failV01("operational_comparison_admission_invalid", "$.candidate.admission");
  }
  const identity = continuation.materialization_identity;
  if (
    continuation.materialization_version !==
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01 ||
    continuation.persisted !== false ||
    continuation.current_packet !== false ||
    continuation.execution_eligible !== false ||
    continuation.attachment_prepared !== false ||
    continuation.grant_issued !== false ||
    continuation.run_created !== false ||
    continuation.semantic_transition_created !== false ||
    Object.values(continuation.persistence).some((value) => value !== 0) ||
    Object.values(continuation.external_effects).some((value) => value !== 0) ||
    selection.selected_rows.length < 1 ||
    canonicalizeProtocolValueV01(identity) !==
      canonicalizeProtocolValueV01(
        input.admission.acgc5a_materialization_identity,
      ) ||
    selection.selection_id !==
      input.admission.operational_context_selection.selection_id ||
    selection.integrity.fingerprint !==
      input.admission.operational_context_selection.selection_fingerprint ||
    canonicalizeProtocolValueV01(packetB) !==
      canonicalizeProtocolValueV01(
        input.continuation.candidate_task_context_packet_b,
      ) ||
    packetA.packet_id !== identity.packet_a_id ||
    packetA.integrity.fingerprint !== identity.packet_a_fingerprint ||
    selection.packet_a.record_id !== packetA.packet_id ||
    selection.packet_a.record_fingerprint !== packetA.integrity.fingerprint ||
    selection.run_receipt_a.record_id !== input.run_receipt_a.receipt_id ||
    selection.run_receipt_a.record_fingerprint !==
      input.run_receipt_a.integrity.fingerprint ||
    input.admission.lineage.packet_a.packet_id !== packetA.packet_id ||
    input.admission.lineage.packet_a.packet_fingerprint !==
      packetA.integrity.fingerprint ||
    input.admission.lineage.packet_b.packet_id !== packetB.packet_id ||
    input.admission.lineage.packet_b.packet_fingerprint !==
      packetB.integrity.fingerprint ||
    input.admission.lineage.continuation_hop !== 1 ||
    input.admission.lineage.semantic_transition_created !== false
  ) {
    failV01("operational_comparison_candidate_source_relation_invalid");
  }
  assertRunAndReceiptV01(input.run_a, input.run_receipt_a, packetA, "$.candidate.run_a");
  assertRunAndReceiptV01(input.run_b, input.run_receipt_b, packetB, "$.candidate.run_b");
  const reviewAValidation = validateContextUseReviewV01(
    input.context_use_review_a,
  );
  if (reviewAValidation.status !== "valid") {
    failV01(
      `operational_comparison_review_a_invalid:${reviewAValidation.errors
        .map((issue) => issue.code)
        .join(",")}`,
      "$.candidate.context_use_review_a",
    );
  }
  const reviewAFingerprint = input.context_use_review_a.integrity.fingerprint;
  if (
    input.context_use_review_a.workspace_id !== packetA.workspace_id ||
    input.context_use_review_a.project_id !== packetA.project_id ||
    input.context_use_review_a.later_packet.packet_version !==
      packetA.packet_version ||
    input.context_use_review_a.later_packet.packet_id !== packetA.packet_id ||
    input.context_use_review_a.later_packet.packet_fingerprint !==
      packetA.integrity.fingerprint ||
    input.context_use_review_a.later_task_run_receipt.receipt_version !==
      input.run_receipt_a.receipt_version ||
    input.context_use_review_a.later_task_run_receipt.receipt_id !==
      input.run_receipt_a.receipt_id ||
    input.context_use_review_a.later_task_run_receipt.receipt_fingerprint !==
      input.run_receipt_a.integrity.fingerprint
  ) {
    failV01(
      "operational_comparison_review_a_source_relation_invalid",
      "$.candidate.context_use_review_a",
    );
  }
  if (
    input.context_use_review_a.review_id !==
      selection.context_use_review_a.record_id ||
    reviewAFingerprint !==
      selection.context_use_review_a.record_fingerprint
  ) {
    failV01(
      "operational_comparison_review_a_selection_relation_invalid",
      "$.candidate.context_use_review_a",
    );
  }
  if (
    input.context_use_review_a.review_id !== identity.context_use_review_a_id ||
    reviewAFingerprint !== identity.context_use_review_a_fingerprint
  ) {
    failV01(
      "operational_comparison_review_a_materialization_relation_invalid",
      "$.candidate.context_use_review_a",
    );
  }
  if (
    timestampV01(input.context_use_review_a.reviewed_at) <
      timestampV01(input.run_receipt_a.recorded_at) ||
    timestampV01(input.context_use_review_a.reviewed_at) >=
      timestampV01(selection.decision_time_cutoff) ||
    timestampV01(input.context_use_review_a.reviewed_at) >=
      timestampV01(input.admission.authenticated_action.admitted_at)
  ) {
    failV01(
      "operational_comparison_review_a_chronology_invalid",
      "$.candidate.context_use_review_a.reviewed_at",
    );
  }
  if (
    input.run_a.run_id === input.run_b.run_id ||
    input.run_a.attachment_id === input.run_b.attachment_id ||
    input.run_a.attachment_binding_fingerprint ===
      input.run_b.attachment_binding_fingerprint ||
    input.run_a.start_request_fingerprint ===
      input.run_b.start_request_fingerprint ||
    input.run_a.start_grant_fingerprint === input.run_b.start_grant_fingerprint ||
    input.run_a.controller_identity_fingerprint ===
      input.run_b.controller_identity_fingerprint ||
    timestampV01(input.run_a.finished_at) >
      timestampV01(input.admission.authenticated_action.admitted_at) ||
    timestampV01(input.admission.authenticated_action.admitted_at) >
      timestampV01(input.run_b.started_at)
  ) {
    failV01("operational_comparison_two_run_lineage_invalid");
  }
  const reviewRelation = validateContextUseReviewRelationsV01(
    input.context_use_review_b,
    packetA,
    packetB,
    input.admission,
    input.run_receipt_b,
  );
  if (reviewRelation.status !== "valid") {
    failV01(
      `operational_comparison_review_b_relation_invalid:${reviewRelation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const rebuiltAttribution = buildContextUseAttributionProjectionV01({
    review: input.context_use_review_b,
    prior_packet: packetA,
    later_packet: packetB,
    source_operational_continuation_admission: input.admission,
    source_operational_context_selection: selection,
    later_task_run_receipt: input.run_receipt_b,
  });
  if (
    validateContextUseAttributionProjectionV01(
      input.context_use_attribution_b,
    ).status !== "valid" ||
    canonicalizeProtocolValueV01(rebuiltAttribution) !==
      canonicalizeProtocolValueV01(input.context_use_attribution_b)
  ) {
    failV01("operational_comparison_attribution_b_relation_invalid");
  }
  const operationalRows = input.context_use_attribution_b.rows.filter(
    (row) => row.operational_continuation !== undefined,
  );
  if (
    operationalRows.length !== selection.selected_rows.length ||
    operationalRows.some(
      (row) =>
        row.presentation.status !== "yes" ||
        row.presentation.basis !== "exact_packet_delivery" ||
        row.citation_or_reference.status !== "referenced" ||
        row.citation_or_reference.basis !== "exact_run_receipt_reference" ||
        row.actual_use.status !== "unknown" ||
        row.support_validation.status !== "unknown" ||
        row.outcome_association.status !== "unknown" ||
        row.causal_contribution.status !== "unknown",
    )
  ) {
    failV01("operational_comparison_selected_entry_attribution_invalid");
  }
  assertRepositoryStateV01(input.repository_state, "$.candidate.repository_state");
  assertReceiptRuntimeBindingV01(
    [input.run_receipt_a, input.run_receipt_b],
    input.repository_state,
    "$.candidate.repository_state",
  );
  assertFrozenBeforeRunsV01(frozenCutoff, [input.run_a, input.run_b]);
  assertObservedByCutoffV01(observationCutoff, [
    input.run_receipt_a.recorded_at,
    input.run_receipt_b.recorded_at,
    input.context_use_review_a.reviewed_at,
    input.context_use_review_b.reviewed_at,
  ]);
  return {
    workspace_id: packetA.workspace_id,
    project_id: packetA.project_id,
    work: workBindingV01(packetA),
    evaluation_case_id: requiredIdV01(input.evaluation_case_id, "$.candidate.evaluation_case_id"),
    repository_state: structuredClone(input.repository_state),
    packet_a: packetRefV01(packetA),
    run_a: structuredClone(input.run_a),
    run_receipt_a: receiptRefV01(input.run_receipt_a),
    context_use_review_a: reviewRefV01(input.context_use_review_a),
    operational_context_selection: recordRefV01(
      selection.selection_version,
      selection.selection_id,
      selection.integrity.fingerprint,
    ),
    acgc5a_materialization: recordRefV01(
      continuation.materialization_version,
      identity.materialization_id,
      identity.materialization_fingerprint,
    ),
    continuation_admission: recordRefV01(
      input.admission.admission_version,
      input.admission.admission_id,
      input.admission.integrity.fingerprint,
    ),
    packet_b: packetRefV01(packetB),
    run_b: structuredClone(input.run_b),
    run_receipt_b: receiptRefV01(input.run_receipt_b),
    context_use_review_b: reviewRefV01(input.context_use_review_b),
    context_use_attribution_b: recordRefV01(
      input.context_use_attribution_b.projection_version,
      input.context_use_attribution_b.projection_id,
      input.context_use_attribution_b.integrity.fingerprint,
    ),
  };
}

function validateAndBindBaselineV01(
  input: BuildOperationalContinuationComparisonInputV01["baseline"],
  frozenCutoff: string,
  observationCutoff: string,
): OperationalContinuationBaselineBindingV01 {
  assertPacketV01(input.prior_packet, "$.baseline.prior_packet");
  assertPacketV01(input.packet, "$.baseline.packet");
  if (
    validateStateTransitionReceiptV01(input.source_transition_receipt).status !==
      "valid" ||
    input.packet.compatibility.source_contracts.includes(
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    ) ||
    input.packet.selected_context.some(
      (entry) => entry.external_ref?.ref_type === "operational_friction_candidate",
    ) ||
    input.context_use_review.source_operational_continuation !== undefined ||
    input.context_use_review.source_transition_receipt === undefined
  ) {
    failV01("operational_comparison_baseline_contamination_detected");
  }
  assertRunAndReceiptV01(input.run, input.run_receipt, input.packet, "$.baseline.run");
  const relation = validateContextUseReviewRelationsV01(
    input.context_use_review,
    input.prior_packet,
    input.packet,
    input.source_transition_receipt,
    input.run_receipt,
  );
  if (relation.status !== "valid") {
    failV01(
      `operational_comparison_baseline_review_relation_invalid:${relation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  assertRepositoryStateV01(input.repository_state, "$.baseline.repository_state");
  assertReceiptRuntimeBindingV01(
    [input.run_receipt],
    input.repository_state,
    "$.baseline.repository_state",
  );
  assertFrozenBeforeRunsV01(frozenCutoff, [input.run]);
  assertObservedByCutoffV01(observationCutoff, [
    input.run_receipt.recorded_at,
    input.context_use_review.reviewed_at,
  ]);
  return {
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    work: workBindingV01(input.packet),
    evaluation_case_id: requiredIdV01(input.evaluation_case_id, "$.baseline.evaluation_case_id"),
    repository_state: structuredClone(input.repository_state),
    packet: packetRefV01(input.packet),
    run: structuredClone(input.run),
    run_receipt: receiptRefV01(input.run_receipt),
    context_use_review: reviewRefV01(input.context_use_review),
    run_count: 1,
    resume_used: false,
    operational_continuation_present: false,
    packet_b_present: false,
    post_cutoff_candidate_material_present: false,
  };
}

function createStructuralParityV01(
  candidate: BuildOperationalContinuationComparisonInputV01["candidate"],
  baseline: BuildOperationalContinuationComparisonInputV01["baseline"],
  taskFamilyKey: string,
  frozenCutoff: string,
): OperationalContinuationParityRowV01[] {
  const taskPairs: Array<[
    OperationalContinuationParityRowV01["dimension"],
    unknown,
    unknown,
    boolean,
  ]> = [
    ["task_goal", candidate.packet_a.task.goal, baseline.packet.task.goal, true],
    ["success_criteria", candidate.packet_a.task.success_criteria, baseline.packet.task.success_criteria, true],
    ["non_goals", candidate.packet_a.task.non_goals, baseline.packet.task.non_goals, true],
    ["required_checks", candidate.packet_a.constraints.required_checks, baseline.packet.constraints.required_checks, true],
    ["forbidden_actions", candidate.packet_a.constraints.forbidden_actions, baseline.packet.constraints.forbidden_actions, true],
    ["data_classification", candidate.packet_a.constraints.data_classification, baseline.packet.constraints.data_classification, true],
    ["work_task_family", taskFamilyKey, taskFamilyKey, true],
    ["frozen_repository_head", candidate.repository_state.frozen_head_commit, baseline.repository_state.frozen_head_commit, true],
    ["initial_worktree_content", candidate.repository_state.frozen_worktree_content_fingerprint, baseline.repository_state.frozen_worktree_content_fingerprint, true],
    ["platform", candidate.repository_state.platform, baseline.repository_state.platform, false],
    ["native_host_adapter", candidate.repository_state.native_host_adapter_version, baseline.repository_state.native_host_adapter_version, false],
    ["native_host_capability", candidate.repository_state.native_host_capability_version, baseline.repository_state.native_host_capability_version, false],
    ["operation_approval_policy", candidate.repository_state.operation_approval_policy_fingerprint, baseline.repository_state.operation_approval_policy_fingerprint, false],
    ["verification_owner_set", candidate.repository_state.verification_owner_set_fingerprint, baseline.repository_state.verification_owner_set_fingerprint, false],
    ["construction_cutoff", candidate.repository_state.construction_cutoff, baseline.repository_state.construction_cutoff, true],
  ];
  const rows = taskPairs.map(([dimension, left, right, required]) => {
    const equal =
      canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right);
    if (required && !equal) {
      failV01(
        `operational_comparison_baseline_parity_${dimension}_mismatch`,
        "$.structural_parity",
      );
    }
    return {
      dimension,
      status: equal ? "equal" : "not_comparable",
      candidate_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(left),
      ),
      baseline_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(right),
      ),
      limitation: equal
        ? null
        : `The ${dimension} dimension is not structurally comparable in this exact case.`,
    } satisfies OperationalContinuationParityRowV01;
  });
  if (
    candidate.repository_state.construction_cutoff !== frozenCutoff ||
    baseline.repository_state.construction_cutoff !== frozenCutoff ||
    canonicalizeProtocolValueV01(candidate.packet_a.task) !==
      canonicalizeProtocolValueV01(
        candidate.continuation.candidate_task_context_packet_b.task,
      ) ||
    canonicalizeProtocolValueV01(candidate.packet_a.constraints.required_checks) !==
      canonicalizeProtocolValueV01(
        candidate.continuation.candidate_task_context_packet_b.constraints
          .required_checks,
      ) ||
    canonicalizeProtocolValueV01(candidate.packet_a.constraints.forbidden_actions) !==
      canonicalizeProtocolValueV01(
        candidate.continuation.candidate_task_context_packet_b.constraints
          .forbidden_actions,
      )
  ) {
    failV01("operational_comparison_candidate_task_semantics_changed");
  }
  return rows;
}

function deriveTaskOutcomeV01(
  finalReceipt: RunReceiptV01,
  artifactReceipts: RunReceiptV01[],
): OperationalContinuationTaskOutcomeV01 {
  const required = uniqueSortedV01(finalReceipt.verification.required_check_ids);
  const byId = new Map(finalReceipt.checks.map((check) => [check.check_id, check]));
  const skippedById = new Map(
    finalReceipt.skipped_checks.map((check) => [check.check_id, check]),
  );
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  let skipped = 0;
  let unknown = 0;
  const hardGateCodes: string[] = [];
  for (const checkId of required) {
    const check = byId.get(checkId);
    if (check?.status === "passed") passed += 1;
    else if (check?.status === "failed") {
      failed += 1;
      hardGateCodes.push(checkId);
    } else if (check?.status === "blocked") {
      blocked += 1;
      hardGateCodes.push(checkId);
    } else if (skippedById.has(checkId)) skipped += 1;
    else unknown += 1;
  }
  const changed = [
    ...new Map(
      artifactReceipts
        .flatMap((receipt) => receipt.changed_artifacts)
        .map((item) => ({
          artifact_id: item.artifact_ref.external_id,
          before_hash: item.before_hash,
          after_hash: item.after_hash,
        }))
        .map((item) => [canonicalizeProtocolValueV01(item), item] as const),
    ).values(),
  ]
    .sort((left, right) =>
      canonicalizeProtocolValueV01(left).localeCompare(
        canonicalizeProtocolValueV01(right),
      ),
    );
  return {
    execution_status: finalReceipt.execution.status,
    verification_status: finalReceipt.verification.status,
    required_passed_count: passed,
    failed_count: failed,
    blocked_count: blocked,
    skipped_count: skipped,
    unknown_count: unknown,
    hard_gate_failure: failed + blocked > 0,
    hard_gate_codes: uniqueSortedV01(hardGateCodes),
    blockers: uniqueSortedV01(finalReceipt.blockers.map((item) => item.code)),
    warnings: uniqueSortedV01(finalReceipt.warnings.map((item) => item.code)),
    gaps: uniqueSortedV01(finalReceipt.gaps.map((item) => item.code)),
    result_limitations: uniqueTextV01(finalReceipt.result_summary.limitations),
    changed_artifact_count: changed.length,
    changed_artifacts: changed,
    false_success_status: "unknown",
  };
}

function deriveContributionV01(
  review: ContextUseReviewV01,
  attribution: ContextUseAttributionProjectionV01,
) {
  const rows = attribution.rows.filter(
    (row) => row.operational_continuation !== undefined,
  );
  return {
    selected_operational_entry_count: rows.length,
    exact_delivered_count: rows.filter(
      (row) =>
        row.presentation.status === "yes" &&
        row.presentation.basis === "exact_packet_delivery",
    ).length,
    exact_referenced_count: rows.filter(
      (row) =>
        row.citation_or_reference.status === "referenced" &&
        row.citation_or_reference.basis === "exact_run_receipt_reference",
    ).length,
    packet_level_actual_use_claim: review.usage.actually_used,
    actual_use_provenance:
      review.usage_provenance?.actually_used.basis ?? "historical_missing",
    item_level_actual_use_proven_count: 0 as const,
    support_validated_count: 0 as const,
    outcome_associated_count: 0 as const,
    causally_supported_count: 0 as const,
    missing_attribution_lanes: uniqueSortedV01(
      attribution.completeness.missing_lanes,
    ),
    bundle_credit_assigned: false as const,
  };
}

function deriveReviewBurdenV01(
  review: ContextUseReviewV01,
  observations: OperationalContinuationComparisonExactObservationsV01,
): OperationalContinuationReviewBurdenV01 {
  return {
    correction_count: review.corrections.correction_count,
    wrong_context_correction_count:
      review.metrics.wrong_context_correction_count,
    repeated_explanation_estimate:
      review.metrics.repeated_explanation_estimate,
    missing_critical_context_count:
      review.metrics.missing_critical_context_count,
    context_refs_used_count: review.metrics.context_refs_used_count,
    additional_review_actions: observations.additional_review_actions,
  };
}

export function aggregateOperationalContinuationReviewBurdenV01(
  reviewA: ContextUseReviewV01,
  reviewB: ContextUseReviewV01,
  observations: OperationalContinuationComparisonExactObservationsV01,
): OperationalContinuationReviewBurdenV01 {
  return {
    correction_count: boundedIntegerV01(
      reviewA.corrections.correction_count +
        reviewB.corrections.correction_count,
      "$.candidate_review_burden.correction_count",
    ),
    wrong_context_correction_count: nullableSumV01(
      reviewA.metrics.wrong_context_correction_count,
      reviewB.metrics.wrong_context_correction_count,
      "$.candidate_review_burden.wrong_context_correction_count",
    ),
    repeated_explanation_estimate: nullableSumV01(
      reviewA.metrics.repeated_explanation_estimate,
      reviewB.metrics.repeated_explanation_estimate,
      "$.candidate_review_burden.repeated_explanation_estimate",
    ),
    missing_critical_context_count: nullableSumV01(
      reviewA.metrics.missing_critical_context_count,
      reviewB.metrics.missing_critical_context_count,
      "$.candidate_review_burden.missing_critical_context_count",
    ),
    context_refs_used_count: nullableSumV01(
      reviewA.metrics.context_refs_used_count,
      reviewB.metrics.context_refs_used_count,
      "$.candidate_review_burden.context_refs_used_count",
    ),
    additional_review_actions: observations.additional_review_actions,
  };
}

function deriveCandidateCoordinationV01(
  input: BuildOperationalContinuationComparisonInputV01["candidate"],
): OperationalContinuationCoordinationOverheadV01 {
  return {
    managed_runs: 2,
    repository_attachments: 2,
    browser_start_confirmations: 2,
    proposal_only_review_decisions:
      input.continuation.selection.effective_decisions.length,
    continuation_admission_actions: 1,
    context_use_review_actions: 2,
    required_human_interventions:
      input.exact_observations.required_human_interventions,
    recovery_reconciliation_actions:
      input.exact_observations.recovery_reconciliation_actions,
    coordination_elapsed_latency_ms:
      input.exact_observations.latency_provenance === "observed_elapsed"
        ? elapsedV01(
            input.run_a.started_at,
            input.context_use_review_b.reviewed_at,
          )
        : null,
    latency_provenance: input.exact_observations.latency_provenance,
  };
}

function deriveBaselineCoordinationV01(
  input: BuildOperationalContinuationComparisonInputV01["baseline"],
): OperationalContinuationCoordinationOverheadV01 {
  return {
    managed_runs: 1,
    repository_attachments: 1,
    browser_start_confirmations: 1,
    proposal_only_review_decisions: 0,
    continuation_admission_actions: 0,
    context_use_review_actions: 1,
    required_human_interventions:
      input.exact_observations.required_human_interventions,
    recovery_reconciliation_actions:
      input.exact_observations.recovery_reconciliation_actions,
    coordination_elapsed_latency_ms:
      input.exact_observations.latency_provenance === "observed_elapsed"
        ? elapsedV01(
            input.run.started_at,
            input.context_use_review.reviewed_at,
          )
        : null,
    latency_provenance: input.exact_observations.latency_provenance,
  };
}

function deriveCostOperabilityV01(
  receipts: RunReceiptV01[],
  startedAt: string,
  completedReviewAt: string,
  observations: OperationalContinuationComparisonExactObservationsV01,
  platform: string,
): OperationalContinuationCostOperabilityV01 {
  const usage = sumNullableV01(
    receipts.map((receipt) => receipt.cost_usage.usage.total_units),
  );
  const cost = receipts.every(
    (receipt) =>
      receipt.cost_usage.cost_amount !== null &&
      receipt.cost_usage.currency === "microunits",
  )
    ? receipts.reduce(
        (sum, receipt) => sum + receipt.cost_usage.cost_amount!,
        0,
      )
    : null;
  const observedElapsed =
    observations.latency_provenance === "observed_elapsed";
  const latencies = observedElapsed
    ? receipts.map((receipt) =>
        receipt.started_at && receipt.finished_at
          ? elapsedV01(receipt.started_at, receipt.finished_at)
          : null,
      )
    : [];
  const runLatency = observedElapsed ? sumNullableV01(latencies) : null;
  const egress = receipts.some(
    (receipt) => receipt.privacy_egress.egress_status === "occurred",
  )
    ? "observed"
    : receipts.every(
          (receipt) =>
            receipt.privacy_egress.egress_status === "did_not_occur" ||
            receipt.privacy_egress.egress_status === "blocked",
        )
      ? "none_observed"
      : "unknown";
  return {
    provider_model_call_count: receipts.reduce(
      (sum, receipt) => sum + receipt.model_invocations.length,
      0,
    ),
    host_tool_command_count: receipts.reduce(
      (sum, receipt) => sum + receipt.commands.length,
      0,
    ),
    usage_unit_count: usage,
    cost_microunits: cost,
    run_latency_ms: runLatency,
    end_to_end_latency_ms: observedElapsed
      ? elapsedV01(startedAt, completedReviewAt)
      : null,
    latency_provenance: observations.latency_provenance,
    cleanup_recovery_burden: observations.cleanup_recovery_burden,
    privacy_egress_observation: egress,
    platform_evidence_boundary: `${platform}_source_runtime_exact_case_only`,
  };
}

function buildEqualCeilingV01(
  ceilings: OperationalContinuationEqualCeilingInputV01,
  candidate: Record<OperationalContinuationResourceDimensionV01, number | null>,
  baseline: Record<OperationalContinuationResourceDimensionV01, number | null>,
): OperationalContinuationEqualCeilingEnvelopeV01 {
  assertExactKeysV01(ceilings, RESOURCE_DIMENSIONS, "$.equal_ceiling");
  const rows = RESOURCE_DIMENSIONS.map((dimension) => {
    const declared = boundedIntegerV01(
      ceilings[dimension],
      `$.equal_ceiling.${dimension}`,
    );
    const candidateObserved = nullableCountV01(
      candidate[dimension],
      `$.candidate.${dimension}`,
    );
    const baselineObserved = nullableCountV01(
      baseline[dimension],
      `$.baseline.${dimension}`,
    );
    return {
      dimension,
      declared_ceiling: declared,
      candidate_observed: candidateObserved,
      baseline_observed: baselineObserved,
      candidate_status: complianceV01(candidateObserved, declared),
      baseline_status: complianceV01(baselineObserved, declared),
      observation_basis:
        candidateObserved === null || baselineObserved === null
          ? "unobserved"
          : dimension === "step_operation_count"
            ? "fixture_ledger"
            : "exact_receipts",
    } satisfies OperationalContinuationEqualCeilingRowV01;
  });
  const envelope: OperationalContinuationEqualCeilingEnvelopeV01 = {
    envelope_version: OPERATIONAL_CONTINUATION_EQUAL_CEILING_VERSION_V01,
    envelope_id: PENDING_ENVELOPE_ID,
    envelope_kind: "research_evaluation_binding_only",
    rows,
    same_total_declared_ceiling: true,
    baseline_not_artificially_capability_constrained: true,
    complete_equal_budget_claim: rows.every(
      (row) =>
        row.candidate_status === "within_ceiling" &&
        row.baseline_status === "within_ceiling",
    ),
    equal_budget_is_equal_capability: false,
    is_capability_grant: false,
    is_execution_grant: false,
    is_operational_policy: false,
    integrity: pendingIntegrityV01(),
  };
  envelope.envelope_id = `operational-continuation-equal-ceiling:${hashSuffixV01(
    envelope,
    "envelope_id",
  )}`;
  envelope.integrity.fingerprint = fingerprintV01(envelope);
  return envelope;
}

function deriveDimensionDeltasV01(input: {
  candidateTaskOutcome: OperationalContinuationTaskOutcomeV01;
  baselineTaskOutcome: OperationalContinuationTaskOutcomeV01;
  candidateReviewBurden: OperationalContinuationReviewBurdenV01;
  baselineReviewBurden: OperationalContinuationReviewBurdenV01;
  candidateCoordination: OperationalContinuationCoordinationOverheadV01;
  baselineCoordination: OperationalContinuationCoordinationOverheadV01;
  candidateCost: OperationalContinuationCostOperabilityV01;
  baselineCost: OperationalContinuationCostOperabilityV01;
}): OperationalContinuationComparisonDimensionDeltaV01[] {
  const rows: OperationalContinuationComparisonDimensionDeltaV01[] = [
    descriptiveDeltaV01("task.execution_status", input.candidateTaskOutcome.execution_status, input.baselineTaskOutcome.execution_status),
    descriptiveDeltaV01("task.verification_status", input.candidateTaskOutcome.verification_status, input.baselineTaskOutcome.verification_status),
    numericDeltaV01("verification.required_passed", input.candidateTaskOutcome.required_passed_count, input.baselineTaskOutcome.required_passed_count, "higher"),
    numericDeltaV01("verification.failed", input.candidateTaskOutcome.failed_count, input.baselineTaskOutcome.failed_count, "lower"),
    numericDeltaV01("verification.blocked", input.candidateTaskOutcome.blocked_count, input.baselineTaskOutcome.blocked_count, "lower"),
    numericDeltaV01("verification.skipped", input.candidateTaskOutcome.skipped_count, input.baselineTaskOutcome.skipped_count, "lower"),
    numericDeltaV01("verification.unknown", input.candidateTaskOutcome.unknown_count, input.baselineTaskOutcome.unknown_count, "lower"),
    booleanDeltaV01("verification.hard_gate_failure", input.candidateTaskOutcome.hard_gate_failure, input.baselineTaskOutcome.hard_gate_failure),
    numericDeltaV01("task.blockers", input.candidateTaskOutcome.blockers.length, input.baselineTaskOutcome.blockers.length, "lower"),
    numericDeltaV01("task.warnings", input.candidateTaskOutcome.warnings.length, input.baselineTaskOutcome.warnings.length, "lower"),
    numericDeltaV01("task.gaps", input.candidateTaskOutcome.gaps.length, input.baselineTaskOutcome.gaps.length, "lower"),
    descriptiveDeltaV01("task.result_limitations", input.candidateTaskOutcome.result_limitations.length, input.baselineTaskOutcome.result_limitations.length),
    descriptiveDeltaV01("task.changed_artifact_count", input.candidateTaskOutcome.changed_artifact_count, input.baselineTaskOutcome.changed_artifact_count),
    descriptiveDeltaV01(
      "task.changed_artifact_set",
      createProtocolSha256V01(canonicalizeProtocolValueV01(input.candidateTaskOutcome.changed_artifacts)),
      createProtocolSha256V01(canonicalizeProtocolValueV01(input.baselineTaskOutcome.changed_artifacts)),
    ),
    numericDeltaV01("review.corrections", input.candidateReviewBurden.correction_count, input.baselineReviewBurden.correction_count, "lower"),
    numericDeltaV01("review.wrong_context_corrections", input.candidateReviewBurden.wrong_context_correction_count, input.baselineReviewBurden.wrong_context_correction_count, "lower"),
    numericDeltaV01("review.repeated_explanation", input.candidateReviewBurden.repeated_explanation_estimate, input.baselineReviewBurden.repeated_explanation_estimate, "lower"),
    numericDeltaV01("review.missing_critical_context", input.candidateReviewBurden.missing_critical_context_count, input.baselineReviewBurden.missing_critical_context_count, "lower"),
    descriptiveDeltaV01("review.context_refs_used", input.candidateReviewBurden.context_refs_used_count, input.baselineReviewBurden.context_refs_used_count),
    numericDeltaV01("review.additional_actions", input.candidateReviewBurden.additional_review_actions, input.baselineReviewBurden.additional_review_actions, "lower"),
    numericDeltaV01("coordination.managed_runs", input.candidateCoordination.managed_runs, input.baselineCoordination.managed_runs, "lower"),
    numericDeltaV01("coordination.repository_attachments", input.candidateCoordination.repository_attachments, input.baselineCoordination.repository_attachments, "lower"),
    numericDeltaV01("coordination.browser_start_confirmations", input.candidateCoordination.browser_start_confirmations, input.baselineCoordination.browser_start_confirmations, "lower"),
    numericDeltaV01("coordination.proposal_only_review_decisions", input.candidateCoordination.proposal_only_review_decisions, input.baselineCoordination.proposal_only_review_decisions, "lower"),
    numericDeltaV01("coordination.continuation_admission_actions", input.candidateCoordination.continuation_admission_actions, input.baselineCoordination.continuation_admission_actions, "lower"),
    numericDeltaV01("coordination.context_use_review_actions", input.candidateCoordination.context_use_review_actions, input.baselineCoordination.context_use_review_actions, "lower"),
    numericDeltaV01("coordination.required_human_interventions", input.candidateCoordination.required_human_interventions, input.baselineCoordination.required_human_interventions, "lower"),
    numericDeltaV01("coordination.recovery_reconciliation", input.candidateCoordination.recovery_reconciliation_actions, input.baselineCoordination.recovery_reconciliation_actions, "lower"),
    numericDeltaV01("coordination.elapsed_latency_ms", input.candidateCoordination.coordination_elapsed_latency_ms, input.baselineCoordination.coordination_elapsed_latency_ms, "lower"),
    numericDeltaV01("cost.provider_model_calls", input.candidateCost.provider_model_call_count, input.baselineCost.provider_model_call_count, "lower"),
    numericDeltaV01("cost.host_tool_commands", input.candidateCost.host_tool_command_count, input.baselineCost.host_tool_command_count, "lower"),
    numericDeltaV01("cost.usage_units", input.candidateCost.usage_unit_count, input.baselineCost.usage_unit_count, "lower"),
    numericDeltaV01("cost.microunits", input.candidateCost.cost_microunits, input.baselineCost.cost_microunits, "lower"),
    numericDeltaV01("cost.run_latency_ms", input.candidateCost.run_latency_ms, input.baselineCost.run_latency_ms, "lower"),
    numericDeltaV01("cost.end_to_end_latency_ms", input.candidateCost.end_to_end_latency_ms, input.baselineCost.end_to_end_latency_ms, "lower"),
    numericDeltaV01("cost.cleanup_recovery_burden", input.candidateCost.cleanup_recovery_burden, input.baselineCost.cleanup_recovery_burden, "lower"),
    descriptiveDeltaV01("privacy.egress_observation", input.candidateCost.privacy_egress_observation, input.baselineCost.privacy_egress_observation),
  ];
  return rows.sort((left, right) => left.dimension.localeCompare(right.dimension));
}

function numericDeltaV01(
  dimension: string,
  candidate: number | null,
  baseline: number | null,
  direction: "higher" | "lower",
): OperationalContinuationComparisonDimensionDeltaV01 {
  if (candidate === null || baseline === null) {
    return {
      dimension,
      relation: "unknown",
      preferred_direction: direction,
      candidate_value: candidate,
      baseline_value: baseline,
      exact_delta: null,
      basis: "one_or_both_exact_observations_unavailable",
    };
  }
  const delta = candidate - baseline;
  return {
    dimension,
    relation:
      delta === 0
        ? "equal"
        : (direction === "higher" ? delta > 0 : delta < 0)
          ? "candidate_better"
          : "baseline_better",
    preferred_direction: direction,
    candidate_value: candidate,
    baseline_value: baseline,
    exact_delta: delta,
    basis: "exact_bounded_observation_delta",
  };
}

function booleanDeltaV01(
  dimension: string,
  candidate: boolean,
  baseline: boolean,
): OperationalContinuationComparisonDimensionDeltaV01 {
  return {
    dimension,
    relation:
      candidate === baseline
        ? "equal"
        : candidate
          ? "baseline_better"
          : "candidate_better",
    preferred_direction: "required_false",
    candidate_value: candidate,
    baseline_value: baseline,
    exact_delta: null,
    basis: "exact_hard_gate_non_compensation",
  };
}

function descriptiveDeltaV01(
  dimension: string,
  candidate: string | number | boolean | null,
  baseline: string | number | boolean | null,
): OperationalContinuationComparisonDimensionDeltaV01 {
  return {
    dimension,
    relation:
      candidate === null || baseline === null
        ? "unknown"
        : candidate === baseline
          ? "equal"
          : "tradeoff",
    preferred_direction: "descriptive",
    candidate_value: candidate,
    baseline_value: baseline,
    exact_delta: null,
    basis:
      candidate === null || baseline === null
        ? "one_or_both_exact_observations_unavailable"
        : "descriptive_status_without_ordinal_ranking",
  };
}

export function deriveOperationalContinuationExactCaseStatusV01(
  deltas: OperationalContinuationComparisonDimensionDeltaV01[],
  candidate: OperationalContinuationTaskOutcomeV01,
  baseline: OperationalContinuationTaskOutcomeV01,
  completeness: {
    complete_equal_budget_claim: boolean;
    structural_parity: OperationalContinuationParityRowV01[];
  },
): OperationalContinuationComparisonStatusV01 {
  if (candidate.hard_gate_failure !== baseline.hard_gate_failure) {
    return candidate.hard_gate_failure ? "refuted" : "supported";
  }
  if (
    completeness.complete_equal_budget_claim !== true ||
    completeness.structural_parity.some(
      (row) => row.status === "not_comparable",
    ) ||
    deltas.some(
      (row) =>
        row.relation === "unknown" || row.relation === "not_comparable",
    )
  ) {
    return "inconclusive";
  }
  const candidateBetter = deltas.some(
    (row) => row.relation === "candidate_better",
  );
  const baselineBetter = deltas.some(
    (row) => row.relation === "baseline_better",
  );
  if (candidateBetter && baselineBetter) return "mixed";
  if (candidateBetter) return "supported";
  if (baselineBetter) return "refuted";
  return "inconclusive";
}

function deriveHarmfulTransferV01(
  candidate: OperationalContinuationTaskOutcomeV01,
  baseline: OperationalContinuationTaskOutcomeV01,
  candidateReview: OperationalContinuationReviewBurdenV01,
  baselineReview: OperationalContinuationReviewBurdenV01,
  candidateCost: OperationalContinuationCostOperabilityV01,
  baselineCost: OperationalContinuationCostOperabilityV01,
): OperationalContinuationHarmfulTransferV01 {
  const adverse: string[] = [];
  if (candidate.hard_gate_failure && !baseline.hard_gate_failure) adverse.push("worse_hard_gate_result");
  if (candidate.failed_count > baseline.failed_count) adverse.push("verification_regression_failed_checks");
  if (candidate.blocked_count > baseline.blocked_count) adverse.push("introduced_blocked_checks");
  if (candidateReview.correction_count > baselineReview.correction_count) adverse.push("additional_review_corrections");
  if (nullableGreaterV01(candidateReview.wrong_context_correction_count, baselineReview.wrong_context_correction_count)) adverse.push("additional_wrong_context_corrections");
  if (nullableGreaterV01(candidateReview.missing_critical_context_count, baselineReview.missing_critical_context_count)) adverse.push("additional_missing_critical_context");
  if (nullableGreaterV01(candidateCost.cleanup_recovery_burden, baselineCost.cleanup_recovery_burden)) adverse.push("additional_cleanup_recovery_burden");
  const unknown = [
    candidateReview.wrong_context_correction_count,
    baselineReview.wrong_context_correction_count,
    candidateReview.missing_critical_context_count,
    baselineReview.missing_critical_context_count,
    candidateCost.cleanup_recovery_burden,
    baselineCost.cleanup_recovery_burden,
  ].some((value) => value === null);
  return {
    status:
      adverse.length > 0
        ? "local_candidate"
        : unknown
          ? "unknown"
          : "none_observed",
    adverse_observations: uniqueSortedV01(adverse),
    exact_case_only: true,
    causal_harm_claimed: false,
    general_harm_claimed: false,
    blacklist_created: false,
    rollback_activated: false,
  };
}

function deriveSkippedDimensionsV01(
  envelope: OperationalContinuationEqualCeilingEnvelopeV01,
  deltas: OperationalContinuationComparisonDimensionDeltaV01[],
): string[] {
  return uniqueSortedV01([
    ...envelope.rows
      .filter(
        (row) =>
          row.candidate_status === "unobserved" ||
          row.baseline_status === "unobserved",
      )
      .map((row) => `budget.${row.dimension}`),
    ...deltas
      .filter((row) => row.relation === "unknown")
      .map((row) => row.dimension),
  ]);
}

function deriveMissingEvidenceV01(
  skippedDimensions: string[],
  missingAttributionLanes: string[],
  candidate: OperationalContinuationTaskOutcomeV01,
  baseline: OperationalContinuationTaskOutcomeV01,
): string[] {
  return uniqueSortedV01([
    ...skippedDimensions,
    ...missingAttributionLanes,
    ...(candidate.false_success_status === "unknown"
      ? ["candidate_false_success_status"]
      : []),
    ...(baseline.false_success_status === "unknown"
      ? ["baseline_false_success_status"]
      : []),
  ]);
}

function deriveTradeOffsV01(
  deltas: OperationalContinuationComparisonDimensionDeltaV01[],
  candidate: OperationalContinuationTaskOutcomeV01,
  baseline: OperationalContinuationTaskOutcomeV01,
): string[] {
  const candidateBetter = deltas
    .filter((row) => row.relation === "candidate_better")
    .map((row) => row.dimension);
  const baselineBetter = deltas
    .filter((row) => row.relation === "baseline_better")
    .map((row) => row.dimension);
  const descriptiveTradeoffs = deltas
    .filter((row) => row.relation === "tradeoff")
    .map((row) => row.dimension);
  return uniqueTextV01([
    ...(candidateBetter.length > 0
      ? [`Candidate-better exact dimensions: ${candidateBetter.join(", ")}.`]
      : []),
    ...(baselineBetter.length > 0
      ? [`Baseline-better exact dimensions: ${baselineBetter.join(", ")}.`]
      : []),
    ...(descriptiveTradeoffs.length > 0
      ? [
          `Non-ordinal exact differences: ${descriptiveTradeoffs.join(", ")}.`,
        ]
      : []),
    ...(candidate.hard_gate_failure !== baseline.hard_gate_failure
      ? ["Hard-gate failure is non-compensating in this exact comparison."]
      : []),
    ...(candidateBetter.length === 0 && baselineBetter.length === 0
      ? ["No directional advantage is established by the observed dimensions."]
      : []),
  ]);
}

function assertRunAndReceiptV01(
  run: OperationalContinuationManagedRunBindingV01,
  receipt: RunReceiptV01,
  packet: TaskContextPacketV01,
  path: string,
): void {
  assertRunBindingV01(run, path);
  if (validateRunReceiptV01(receipt).status !== "valid") {
    failV01("operational_comparison_run_receipt_invalid", `${path}_receipt`);
  }
  const expectedExecution: Record<
    OperationalContinuationManagedRunBindingV01["status"],
    RunReceiptV01["execution"]["status"][]
  > = {
    completed: ["completed"],
    failed: ["failed"],
    blocked: ["blocked"],
    cancelled: ["cancelled"],
    timed_out: ["failed", "blocked"],
    needs_review: ["partial", "completed"],
  };
  if (
    receipt.run_id !== run.run_id ||
    receipt.workspace_id !== packet.workspace_id ||
    receipt.project_id !== packet.project_id ||
    canonicalizeProtocolValueV01(receipt.work_ref) !==
      canonicalizeProtocolValueV01(packet.work_ref) ||
    run.packet_id !== packet.packet_id ||
    run.packet_fingerprint !== packet.integrity.fingerprint ||
    receipt.task_context_packet_ref?.ref_type !== "task_context_packet" ||
    receipt.task_context_packet_ref.external_id !== packet.packet_id ||
    receipt.task_context_packet_ref.source_ref !== packet.integrity.fingerprint ||
    receipt.started_at !== run.started_at ||
    receipt.finished_at !== run.finished_at ||
    !expectedExecution[run.status].includes(receipt.execution.status)
  ) {
    failV01("operational_comparison_run_receipt_relation_invalid", path);
  }
}

function assertRunBindingV01(
  run: OperationalContinuationManagedRunBindingV01,
  path: string,
): void {
  assertExactKeysV01(run, [
    "run_id", "packet_id", "packet_fingerprint", "attachment_id",
    "attachment_binding_fingerprint", "start_request_fingerprint",
    "start_grant_fingerprint", "controller_identity_fingerprint", "action",
    "resume_used", "status", "started_at", "finished_at",
  ], path);
  requiredIdV01(run.run_id, `${path}.run_id`);
  requiredIdV01(run.packet_id, `${path}.packet_id`);
  for (const [key, value] of [
    ["packet_fingerprint", run.packet_fingerprint],
    ["attachment_id", run.attachment_id],
    ["attachment_binding_fingerprint", run.attachment_binding_fingerprint],
    ["start_request_fingerprint", run.start_request_fingerprint],
    ["start_grant_fingerprint", run.start_grant_fingerprint],
    ["controller_identity_fingerprint", run.controller_identity_fingerprint],
  ] as const) requiredFingerprintV01(value, `${path}.${key}`);
  if (
    run.action !== "start_repository_managed_delegation" ||
    run.resume_used !== false ||
    !["completed", "failed", "blocked", "cancelled", "timed_out", "needs_review"].includes(run.status)
  ) failV01("operational_comparison_run_binding_invalid", path);
  const started = requiredTimestampV01(run.started_at, `${path}.started_at`);
  const finished = requiredTimestampV01(run.finished_at, `${path}.finished_at`);
  if (timestampV01(finished) < timestampV01(started)) {
    failV01("operational_comparison_run_chronology_invalid", path);
  }
}

function assertRepositoryStateV01(
  state: OperationalContinuationRepositoryStateBindingV01,
  path: string,
): void {
  assertExactKeysV01(state, [
    "frozen_head_commit", "frozen_worktree_content_fingerprint",
    "construction_cutoff", "platform", "native_host_adapter_version",
    "native_host_capability_version", "operation_approval_policy_fingerprint",
    "verification_owner_set_fingerprint",
  ], path);
  if (!COMMIT.test(state.frozen_head_commit)) {
    failV01("operational_comparison_repository_head_invalid", `${path}.frozen_head_commit`);
  }
  requiredFingerprintV01(state.frozen_worktree_content_fingerprint, `${path}.frozen_worktree_content_fingerprint`);
  requiredTimestampV01(state.construction_cutoff, `${path}.construction_cutoff`);
  requiredIdV01(state.platform, `${path}.platform`);
  requiredIdV01(state.native_host_adapter_version, `${path}.native_host_adapter_version`);
  requiredIdV01(state.native_host_capability_version, `${path}.native_host_capability_version`);
  requiredFingerprintV01(state.operation_approval_policy_fingerprint, `${path}.operation_approval_policy_fingerprint`);
  requiredFingerprintV01(state.verification_owner_set_fingerprint, `${path}.verification_owner_set_fingerprint`);
}

function assertReceiptRuntimeBindingV01(
  receipts: RunReceiptV01[],
  state: OperationalContinuationRepositoryStateBindingV01,
  path: string,
): void {
  for (const receipt of receipts) {
    const sourceContracts = new Set(receipt.compatibility.source_contracts);
    const verifierFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        receipt.verifier_refs
          .map((ref) => ({
            ref_type: ref.ref_type,
            external_id: ref.external_id,
            compatibility_namespace: ref.compatibility_namespace ?? null,
          }))
          .sort((left, right) =>
            canonicalizeProtocolValueV01(left).localeCompare(
              canonicalizeProtocolValueV01(right),
            ),
          ),
      ),
    );
    if (
      !sourceContracts.has(state.native_host_adapter_version) ||
      !sourceContracts.has(state.native_host_capability_version) ||
      verifierFingerprint !== state.verification_owner_set_fingerprint
    ) {
      failV01("operational_comparison_runtime_parity_binding_invalid", path);
    }
  }
}

function assertPacketV01(packet: TaskContextPacketV01, path: string): void {
  if (
    validateTaskContextPacketV01(packet, { evaluated_at: packet?.generated_at ?? "" })
      .status !== "valid"
  ) failV01("operational_comparison_packet_invalid", path);
}

function assertFrozenBeforeRunsV01(
  cutoff: string,
  runs: OperationalContinuationManagedRunBindingV01[],
): void {
  if (runs.some((run) => timestampV01(cutoff) >= timestampV01(run.started_at))) {
    failV01("operational_comparison_construction_cutoff_not_frozen");
  }
}

function assertObservedByCutoffV01(cutoff: string, values: string[]): void {
  if (values.some((value) => timestampV01(value) > timestampV01(cutoff))) {
    failV01("operational_comparison_post_cutoff_observation_refused");
  }
}

function assertExactObservationV01(
  input: OperationalContinuationComparisonExactObservationsV01,
  path: string,
): void {
  assertExactKeysV01(input, [
    "step_operation_count", "required_human_interventions",
    "recovery_reconciliation_actions", "cleanup_recovery_burden",
    "additional_review_actions", "latency_provenance",
  ], path);
  for (const key of [
    "step_operation_count", "required_human_interventions",
    "recovery_reconciliation_actions", "cleanup_recovery_burden",
    "additional_review_actions",
  ] as const) {
    nullableCountV01(input[key], `${path}.${key}`);
  }
  if (
    ![
      "observed_elapsed",
      "synthetic_event_chronology",
      "unobserved",
    ].includes(input.latency_provenance)
  ) {
    failV01("operational_comparison_latency_provenance_invalid", path);
  }
  if (input.latency_provenance === "observed_elapsed") {
    failV01(
      "operational_comparison_observed_latency_source_unavailable",
      `${path}.latency_provenance`,
    );
  }
}

function assertCandidateBindingV01(
  value: OperationalContinuationCandidateBindingV01,
): void {
  assertExactKeysV01(value, [
    "workspace_id", "project_id", "work", "evaluation_case_id",
    "repository_state", "packet_a", "run_a", "run_receipt_a",
    "context_use_review_a",
    "operational_context_selection", "acgc5a_materialization",
    "continuation_admission", "packet_b", "run_b", "run_receipt_b",
    "context_use_review_b", "context_use_attribution_b",
  ], "$.candidate");
  requiredIdV01(value.workspace_id, "$.candidate.workspace_id");
  requiredIdV01(value.project_id, "$.candidate.project_id");
  assertWorkBindingV01(value.work, "$.candidate.work");
  assertRepositoryStateV01(value.repository_state, "$.candidate.repository_state");
  for (const [key, ref] of [
    ["packet_a", value.packet_a], ["run_receipt_a", value.run_receipt_a],
    ["context_use_review_a", value.context_use_review_a],
    ["operational_context_selection", value.operational_context_selection],
    ["acgc5a_materialization", value.acgc5a_materialization],
    ["continuation_admission", value.continuation_admission],
    ["packet_b", value.packet_b], ["run_receipt_b", value.run_receipt_b],
    ["context_use_review_b", value.context_use_review_b],
    ["context_use_attribution_b", value.context_use_attribution_b],
  ] as const) assertRecordRefV01(ref, `$.candidate.${key}`);
  assertRunBindingV01(value.run_a, "$.candidate.run_a");
  assertRunBindingV01(value.run_b, "$.candidate.run_b");
  if (
    value.run_a.run_id === value.run_b.run_id ||
    value.run_a.attachment_id === value.run_b.attachment_id ||
    value.run_a.start_grant_fingerprint === value.run_b.start_grant_fingerprint
  ) failV01("operational_comparison_candidate_run_identity_invalid");
}

function assertBaselineBindingV01(
  value: OperationalContinuationBaselineBindingV01,
): void {
  assertExactKeysV01(value, [
    "workspace_id", "project_id", "work", "evaluation_case_id",
    "repository_state", "packet", "run", "run_receipt", "context_use_review",
    "run_count", "resume_used", "operational_continuation_present",
    "packet_b_present", "post_cutoff_candidate_material_present",
  ], "$.baseline");
  requiredIdV01(value.workspace_id, "$.baseline.workspace_id");
  requiredIdV01(value.project_id, "$.baseline.project_id");
  assertWorkBindingV01(value.work, "$.baseline.work");
  assertRepositoryStateV01(value.repository_state, "$.baseline.repository_state");
  assertRecordRefV01(value.packet, "$.baseline.packet");
  assertRecordRefV01(value.run_receipt, "$.baseline.run_receipt");
  assertRecordRefV01(value.context_use_review, "$.baseline.context_use_review");
  assertRunBindingV01(value.run, "$.baseline.run");
  if (
    value.run_count !== 1 || value.resume_used !== false ||
    value.operational_continuation_present !== false ||
    value.packet_b_present !== false ||
    value.post_cutoff_candidate_material_present !== false
  ) failV01("operational_comparison_baseline_boundary_invalid");
}

function assertParityRowsV01(rows: OperationalContinuationParityRowV01[]): void {
  if (!Array.isArray(rows) || rows.length !== PARITY_DIMENSIONS.length) {
    failV01("operational_comparison_parity_rows_invalid");
  }
  for (const [index, row] of rows.entries()) {
    assertExactKeysV01(row, [
      "dimension", "status", "candidate_fingerprint", "baseline_fingerprint",
      "limitation",
    ], "$.structural_parity[]");
    if (row.dimension !== PARITY_DIMENSIONS[index]) {
      failV01("operational_comparison_parity_order_invalid");
    }
    if (!SHA256.test(row.candidate_fingerprint ?? "") || !SHA256.test(row.baseline_fingerprint ?? "")) {
      failV01("operational_comparison_parity_fingerprint_invalid");
    }
    if (row.status === "equal" && row.candidate_fingerprint !== row.baseline_fingerprint) {
      failV01("operational_comparison_parity_equal_reseal");
    }
    if (
      REQUIRED_EQUAL_PARITY_DIMENSIONS.has(row.dimension) &&
      row.status !== "equal"
    ) {
      failV01("operational_comparison_required_parity_reseal");
    }
    if (row.status === "equal" && row.limitation !== null) {
      failV01("operational_comparison_parity_limitation_reseal");
    }
    if (row.status === "not_comparable" && !row.limitation) {
      failV01("operational_comparison_parity_limitation_missing");
    }
  }
}

function assertEqualCeilingV01(
  envelope: OperationalContinuationEqualCeilingEnvelopeV01,
): void {
  assertExactKeysV01(envelope, [
    "envelope_version", "envelope_id", "envelope_kind", "rows",
    "same_total_declared_ceiling",
    "baseline_not_artificially_capability_constrained",
    "complete_equal_budget_claim", "equal_budget_is_equal_capability",
    "is_capability_grant", "is_execution_grant", "is_operational_policy",
    "integrity",
  ], "$.equal_ceiling");
  if (
    envelope.envelope_version !==
      OPERATIONAL_CONTINUATION_EQUAL_CEILING_VERSION_V01 ||
    envelope.envelope_kind !== "research_evaluation_binding_only" ||
    envelope.same_total_declared_ceiling !== true ||
    envelope.baseline_not_artificially_capability_constrained !== true ||
    envelope.equal_budget_is_equal_capability !== false ||
    envelope.is_capability_grant !== false ||
    envelope.is_execution_grant !== false ||
    envelope.is_operational_policy !== false ||
    envelope.rows.length !== RESOURCE_DIMENSIONS.length
  ) failV01("operational_comparison_equal_ceiling_invalid");
  for (const [index, row] of envelope.rows.entries()) {
    assertExactKeysV01(row, [
      "dimension", "declared_ceiling", "candidate_observed",
      "baseline_observed", "candidate_status", "baseline_status",
      "observation_basis",
    ], "$.equal_ceiling.rows[]");
    if (row.dimension !== RESOURCE_DIMENSIONS[index]) {
      failV01("operational_comparison_equal_ceiling_order_invalid");
    }
    boundedIntegerV01(row.declared_ceiling, "$.equal_ceiling.rows[].declared_ceiling");
    nullableCountV01(row.candidate_observed, "$.equal_ceiling.rows[].candidate_observed");
    nullableCountV01(row.baseline_observed, "$.equal_ceiling.rows[].baseline_observed");
    if (
      row.candidate_status !== complianceV01(row.candidate_observed, row.declared_ceiling) ||
      row.baseline_status !== complianceV01(row.baseline_observed, row.declared_ceiling)
    ) failV01("operational_comparison_equal_ceiling_compliance_reseal");
    const expectedBasis =
      row.candidate_observed === null || row.baseline_observed === null
        ? "unobserved"
        : row.dimension === "step_operation_count"
          ? "fixture_ledger"
          : "exact_receipts";
    if (row.observation_basis !== expectedBasis) {
      failV01("operational_comparison_equal_ceiling_basis_reseal");
    }
  }
  const complete = envelope.rows.every(
    (row) =>
      row.candidate_status === "within_ceiling" &&
      row.baseline_status === "within_ceiling",
  );
  if (envelope.complete_equal_budget_claim !== complete) {
    failV01("operational_comparison_equal_budget_claim_invalid");
  }
  assertIntegrityV01(envelope.integrity, "$.equal_ceiling.integrity");
  if (
    envelope.integrity.fingerprint !== fingerprintV01(envelope) ||
    envelope.envelope_id !==
      `operational-continuation-equal-ceiling:${hashSuffixV01(
        envelope,
        "envelope_id",
      )}`
  ) failV01("operational_comparison_equal_ceiling_identity_invalid");
}

function assertTaskOutcomeV01(value: OperationalContinuationTaskOutcomeV01, path: string): void {
  assertExactKeysV01(value, [
    "execution_status", "verification_status", "required_passed_count",
    "failed_count", "blocked_count", "skipped_count", "unknown_count",
    "hard_gate_failure", "hard_gate_codes", "blockers", "warnings", "gaps",
    "result_limitations", "changed_artifact_count", "changed_artifacts",
    "false_success_status",
  ], path);
  for (const count of [
    value.required_passed_count, value.failed_count, value.blocked_count,
    value.skipped_count, value.unknown_count, value.changed_artifact_count,
  ]) boundedIntegerV01(count, path);
  if (
    !RUN_RECEIPT_EXECUTION_STATUSES_V01.includes(value.execution_status) ||
    !RUN_RECEIPT_VERIFICATION_STATUSES_V01.includes(
      value.verification_status,
    ) ||
    value.false_success_status !== "unknown" ||
    value.hard_gate_failure !== (value.failed_count + value.blocked_count > 0) ||
    value.changed_artifact_count !== value.changed_artifacts.length ||
    value.changed_artifacts.length > MAX_ITEMS
  ) failV01("operational_comparison_task_outcome_invalid", path);
  for (const [field, items] of [
    ["hard_gate_codes", value.hard_gate_codes],
    ["blockers", value.blockers],
    ["warnings", value.warnings],
    ["gaps", value.gaps],
  ] as const) {
    assertCanonicalEqualV01(
      items,
      uniqueSortedV01(items.map((item) => requiredIdV01(item, `${path}.${field}[]`))),
      `operational_comparison_${field}_invalid`,
    );
    if (items.length > MAX_ITEMS) {
      failV01("operational_comparison_collection_bound_exceeded", `${path}.${field}`);
    }
  }
  assertCanonicalEqualV01(
    value.result_limitations,
    uniqueTextV01(value.result_limitations),
    "operational_comparison_result_limitations_invalid",
  );
  value.changed_artifacts.forEach((artifact, index) => {
    const artifactPath = `${path}.changed_artifacts[${index}]`;
    assertExactKeysV01(
      artifact,
      ["artifact_id", "before_hash", "after_hash"],
      artifactPath,
    );
    requiredIdV01(artifact.artifact_id, `${artifactPath}.artifact_id`);
    for (const [field, hash] of [
      ["before_hash", artifact.before_hash],
      ["after_hash", artifact.after_hash],
    ] as const) {
      if (
        hash !== null &&
        (typeof hash !== "string" || !hash.trim() || hash.length > MAX_TEXT)
      ) {
        failV01("operational_comparison_artifact_hash_invalid", `${artifactPath}.${field}`);
      }
    }
  });
  assertCanonicalEqualV01(
    value.changed_artifacts,
    [...value.changed_artifacts].sort((left, right) =>
      canonicalizeProtocolValueV01(left).localeCompare(
        canonicalizeProtocolValueV01(right),
      ),
    ),
    "operational_comparison_changed_artifact_order_invalid",
  );
}

function assertContributionV01(value: OperationalContinuationComparisonV01["continuation_contribution"]): void {
  assertExactKeysV01(value, [
    "selected_operational_entry_count", "exact_delivered_count",
    "exact_referenced_count", "packet_level_actual_use_claim",
    "actual_use_provenance", "item_level_actual_use_proven_count",
    "support_validated_count", "outcome_associated_count",
    "causally_supported_count", "missing_attribution_lanes",
    "bundle_credit_assigned",
  ], "$.continuation_contribution");
  for (const count of [
    value.selected_operational_entry_count,
    value.exact_delivered_count,
    value.exact_referenced_count,
    value.item_level_actual_use_proven_count,
    value.support_validated_count,
    value.outcome_associated_count,
    value.causally_supported_count,
  ]) boundedIntegerV01(count, "$.continuation_contribution");
  requiredIdV01(
    value.actual_use_provenance,
    "$.continuation_contribution.actual_use_provenance",
  );
  if (
    value.selected_operational_entry_count < 1 ||
    value.exact_delivered_count !== value.selected_operational_entry_count ||
    value.exact_referenced_count !== value.selected_operational_entry_count ||
    !CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01.includes(
      value.packet_level_actual_use_claim,
    ) ||
    value.item_level_actual_use_proven_count !== 0 ||
    value.support_validated_count !== 0 ||
    value.outcome_associated_count !== 0 ||
    value.causally_supported_count !== 0 ||
    value.bundle_credit_assigned !== false
  ) failV01("operational_comparison_contribution_invalid");
  assertCanonicalEqualV01(
    value.missing_attribution_lanes,
    uniqueSortedV01(
      value.missing_attribution_lanes.map((item) =>
        requiredIdV01(
          item,
          "$.continuation_contribution.missing_attribution_lanes[]",
        ),
      ),
    ),
    "operational_comparison_missing_attribution_lanes_invalid",
  );
  if (value.missing_attribution_lanes.length > MAX_ITEMS) {
    failV01("operational_comparison_collection_bound_exceeded");
  }
}

function assertReviewBurdenV01(value: OperationalContinuationReviewBurdenV01, path: string): void {
  assertExactKeysV01(value, [
    "correction_count", "wrong_context_correction_count",
    "repeated_explanation_estimate", "missing_critical_context_count",
    "context_refs_used_count", "additional_review_actions",
  ], path);
  for (const item of [
    value.correction_count,
    value.wrong_context_correction_count,
    value.repeated_explanation_estimate,
    value.missing_critical_context_count,
    value.context_refs_used_count,
    value.additional_review_actions,
  ]) nullableCountV01(item, path);
}

function assertCandidateReviewBurdenRelationV01(
  completePath: OperationalContinuationReviewBurdenV01,
  postContinuation: OperationalContinuationReviewBurdenV01,
): void {
  if (
    completePath.correction_count < postContinuation.correction_count ||
    completePath.additional_review_actions !==
      postContinuation.additional_review_actions
  ) {
    failV01("operational_comparison_review_burden_scope_invalid");
  }
  for (const key of [
    "wrong_context_correction_count",
    "repeated_explanation_estimate",
    "missing_critical_context_count",
    "context_refs_used_count",
  ] as const) {
    const completeValue = completePath[key];
    const postValue = postContinuation[key];
    if (
      (postValue === null && completeValue !== null) ||
      (postValue !== null &&
        completeValue !== null &&
        completeValue < postValue)
    ) {
      failV01("operational_comparison_review_burden_scope_invalid");
    }
  }
}

function assertCoordinationV01(value: OperationalContinuationCoordinationOverheadV01, path: string): void {
  assertExactKeysV01(value, [
    "managed_runs", "repository_attachments", "browser_start_confirmations",
    "proposal_only_review_decisions", "continuation_admission_actions",
    "context_use_review_actions", "required_human_interventions",
    "recovery_reconciliation_actions", "coordination_elapsed_latency_ms",
    "latency_provenance",
  ], path);
  for (const item of [
    value.managed_runs,
    value.repository_attachments,
    value.browser_start_confirmations,
    value.proposal_only_review_decisions,
    value.continuation_admission_actions,
    value.context_use_review_actions,
    value.required_human_interventions,
    value.recovery_reconciliation_actions,
    value.coordination_elapsed_latency_ms,
  ]) nullableCountV01(item, path);
  assertLatencyObservationV01(
    value.latency_provenance,
    [value.coordination_elapsed_latency_ms],
    path,
  );
}

function assertCostV01(value: OperationalContinuationCostOperabilityV01, path: string): void {
  assertExactKeysV01(value, [
    "provider_model_call_count", "host_tool_command_count",
    "usage_unit_count", "cost_microunits", "run_latency_ms",
    "end_to_end_latency_ms", "latency_provenance",
    "cleanup_recovery_burden",
    "privacy_egress_observation", "platform_evidence_boundary",
  ], path);
  for (const item of [
    value.provider_model_call_count, value.host_tool_command_count,
    value.usage_unit_count, value.cost_microunits, value.run_latency_ms,
    value.end_to_end_latency_ms, value.cleanup_recovery_burden,
  ]) nullableCountV01(item, path);
  assertLatencyObservationV01(
    value.latency_provenance,
    [value.run_latency_ms, value.end_to_end_latency_ms],
    path,
  );
  if (
    !["none_observed", "observed", "unknown"].includes(
      value.privacy_egress_observation,
    )
  ) {
    failV01("operational_comparison_privacy_observation_invalid", path);
  }
  requiredIdV01(value.platform_evidence_boundary, `${path}.platform_evidence_boundary`);
}

function assertLatencyObservationV01(
  provenance: OperationalContinuationLatencyProvenanceV01,
  values: Array<number | null>,
  path: string,
): void {
  if (
    ![
      "observed_elapsed",
      "synthetic_event_chronology",
      "unobserved",
    ].includes(provenance) ||
    (provenance === "observed_elapsed"
      ? values.some((value) => value === null)
      : values.some((value) => value !== null))
  ) {
    failV01("operational_comparison_latency_observation_invalid", path);
  }
}

function assertWorkBindingV01(value: OperationalContinuationComparisonV01["candidate"]["work"], path: string): void {
  assertExactKeysV01(value, ["work_id", "work_fingerprint"], path);
  requiredIdV01(value.work_id, `${path}.work_id`);
  requiredFingerprintV01(value.work_fingerprint, `${path}.work_fingerprint`);
}

function assertRecordRefV01(value: OperationalContinuationComparisonRecordRefV01, path: string): void {
  assertExactKeysV01(value, ["record_version", "record_id", "record_fingerprint"], path);
  requiredIdV01(value.record_version, `${path}.record_version`);
  requiredIdV01(value.record_id, `${path}.record_id`);
  requiredFingerprintV01(value.record_fingerprint, `${path}.record_fingerprint`);
}

function recordRefV01(version: string, id: string, fingerprint: string): OperationalContinuationComparisonRecordRefV01 {
  return {
    record_version: version,
    record_id: id,
    record_fingerprint: fingerprint,
  };
}

function packetRefV01(packet: TaskContextPacketV01) {
  return recordRefV01(packet.packet_version, packet.packet_id, packet.integrity.fingerprint);
}

function receiptRefV01(receipt: RunReceiptV01) {
  return recordRefV01(receipt.receipt_version, receipt.receipt_id, receipt.integrity.fingerprint);
}

function reviewRefV01(review: ContextUseReviewV01) {
  return recordRefV01(review.review_version, review.review_id, review.integrity.fingerprint);
}

function workBindingV01(packet: TaskContextPacketV01) {
  const workId =
    typeof packet.work_ref === "string"
      ? packet.work_ref
      : packet.work_ref?.external_id ?? "work:unavailable";
  return {
    work_id: workId,
    work_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(packet.work_ref),
    ),
  };
}

function complianceV01(
  observed: number | null,
  ceiling: number,
): OperationalContinuationBudgetComplianceStateV01 {
  return observed === null
    ? "unobserved"
    : observed <= ceiling
      ? "within_ceiling"
      : "exceeded";
}

function summarizeBudgetComplianceV01(
  states: OperationalContinuationBudgetComplianceStateV01[],
): "within_observed_ceilings" | "exceeded" | "incomplete" {
  if (states.includes("exceeded")) return "exceeded";
  if (states.includes("unobserved")) return "incomplete";
  return "within_observed_ceilings";
}

function elapsedV01(start: string, end: string): number {
  const elapsed = timestampV01(end) - timestampV01(start);
  if (elapsed < 0 || !Number.isSafeInteger(elapsed)) {
    failV01("operational_comparison_elapsed_time_invalid");
  }
  return elapsed;
}

function sumNullableV01(values: Array<number | null>): number | null {
  if (values.some((value) => value === null)) return null;
  const sum = values.reduce<number>((total, value) => total + value!, 0);
  return boundedIntegerV01(sum, "$.derived_sum");
}

function nullableGreaterV01(left: number | null, right: number | null): boolean {
  return left !== null && right !== null && left > right;
}

function materialBoundaryV01(): OperationalContinuationComparisonV01["material_boundary"] {
  return {
    bounded: true,
    max_text_characters: MAX_TEXT,
    max_collection_items: MAX_ITEMS,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    raw_artifact_content_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
  };
}

function authorityV01(): OperationalContinuationComparisonAuthorityV01 {
  return {
    scalar_fitness_created: false,
    quality_score_created: false,
    global_winner_created: false,
    rank_created: false,
    promotion_created: false,
    general_verified_benefit_claimed: false,
    general_causal_contribution_claimed: false,
    general_harm_claimed: false,
    operational_policy_activated: false,
    product_context_policy_selected: false,
    semantic_state_changed: false,
    task_context_packet_mutated: false,
    execution_authority_granted: false,
    provider_authority_granted: false,
    network_authority_granted: false,
    github_authority_granted: false,
    publication_authority_granted: false,
    merge_authority_granted: false,
    writes_database: false,
    mutates_session: false,
    writes_project_files: false,
    executes_project_commands: false,
  };
}

function pendingIntegrityV01(): OperationalContinuationComparisonIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: "augnes-json-c14n-v0_1",
    fingerprint_scope: "comparison_without_integrity_fingerprint",
    fingerprint: PENDING_FINGERPRINT,
  };
}

function assertIntegrityV01(value: OperationalContinuationComparisonIntegrityV01, path: string): void {
  if (
    value.algorithm !== "sha256" ||
    value.canonicalization !== "augnes-json-c14n-v0_1" ||
    value.fingerprint_scope !== "comparison_without_integrity_fingerprint" ||
    !SHA256.test(value.fingerprint)
  ) failV01("operational_comparison_integrity_invalid", path);
}

function fingerprintV01(value: unknown): string {
  const clone = structuredClone(value) as Record<string, unknown>;
  const integrity = clone.integrity;
  if (isProtocolRecordV01(integrity)) {
    integrity.fingerprint = PENDING_FINGERPRINT;
  }
  return createProtocolSha256V01(canonicalizeProtocolValueV01(clone));
}

function hashSuffixV01(value: unknown, idField: string): string {
  const clone = structuredClone(value) as Record<string, unknown>;
  clone[idField] = idField === "comparison_id" ? PENDING_COMPARISON_ID : PENDING_ENVELOPE_ID;
  const integrity = clone.integrity;
  if (isProtocolRecordV01(integrity)) integrity.fingerprint = PENDING_FINGERPRINT;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(clone)).slice(7, 39);
}

function requiredIdV01(value: unknown, path: string): string {
  if (typeof value !== "string" || !SAFE_ID.test(value) || value !== value.trim()) {
    failV01("operational_comparison_id_invalid", path);
  }
  return value;
}

function requiredFingerprintV01(value: unknown, path: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    failV01("operational_comparison_fingerprint_invalid", path);
  }
  return value;
}

function requiredTimestampV01(value: unknown, path: string): string {
  if (typeof value !== "string" || parseStrictIsoTimestampV01(value) === null) {
    failV01("operational_comparison_timestamp_invalid", path);
  }
  return value;
}

function timestampV01(value: string): number {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) failV01("operational_comparison_timestamp_invalid");
  return parsed;
}

function boundedIntegerV01(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_COUNT) {
    failV01("operational_comparison_count_invalid", path);
  }
  return value as number;
}

function nullableCountV01(value: number | null, path: string): number | null {
  if (value === null) return null;
  return boundedIntegerV01(value, path);
}

function nullableSumV01(
  left: number | null,
  right: number | null,
  path: string,
): number | null {
  if (left === null || right === null) return null;
  return boundedIntegerV01(left + right, path);
}

function uniqueSortedV01<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function uniqueTextV01(values: readonly string[]): string[] {
  const result = uniqueSortedV01(
    values.map((value) => {
      if (typeof value !== "string" || !value.trim() || value.length > MAX_TEXT) {
        failV01("operational_comparison_text_invalid");
      }
      return value.trim();
    }),
  );
  if (result.length > MAX_ITEMS) failV01("operational_comparison_collection_bound_exceeded");
  return result;
}

function assertSafeMaterialV01(value: unknown): void {
  const issues: Array<{ code: string; path: string }> = [];
  const sink: ProtocolValidationIssueSinkV01 = {
    error(code, path) {
      issues.push({ code, path: path ?? "$" });
    },
    warning() {},
  };
  scanForbiddenProtocolMaterialV01(value, "$", sink, {
    secret_material_message: "Secret-shaped material is forbidden from the comparison.",
    provider_specific_field_message:
      "Provider-specific authority material is forbidden from the comparison.",
    allowed_canonical_identity_paths: new Set([
      "$.candidate.run_a.run_id",
      "$.candidate.run_b.run_id",
      "$.baseline.run.run_id",
    ]),
    allowed_false_invariant_fields: new Set([
      "raw_prompt_included", "raw_transcript_included",
      "raw_terminal_output_included", "raw_provider_output_included",
      "raw_artifact_content_included", "hidden_reasoning_included",
      "credential_or_secret_included",
      "raw_prompt_persisted", "raw_response_persisted",
      "raw_output_persisted", "raw_transcript_persisted",
      "hidden_reasoning_persisted", "secret_material_persisted",
      "credential_or_secret_persisted", "token_cookie_or_nonce_included",
    ]),
  });
  scanStringsV01(value, (text, path) => {
    if (PRIVATE_PATH.test(text)) {
      issues.push({ code: "private_absolute_path_material", path });
    }
    if (text.length > MAX_TEXT && !SHA256.test(text)) {
      issues.push({ code: "operational_comparison_text_bound_exceeded", path });
    }
  });
  if (issues.length > 0) failV01(issues[0]!.code, issues[0]!.path);
}

function assertSafeSourceMaterialV01(value: unknown): void {
  const forbiddenKey = /(?:^|_)(?:raw_prompt|prompt_text|transcript|terminal_output|provider_output|hidden_reasoning|chain_of_thought|credential|secret|api_key|access_token|refresh_token|password)(?:_|$)/u;
  const secretValue = /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|AKIA[A-Z0-9]{12,})\b|BEGIN (?:OPENSSH |RSA |EC |)PRIVATE KEY|(?:OPENAI_API_KEY|GITHUB_TOKEN|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY)\s*=/iu;
  const visit = (current: unknown, path: string): void => {
    if (typeof current === "string") {
      if (PRIVATE_PATH.test(current)) failV01("private_absolute_path_material", path);
      if (secretValue.test(current)) failV01("secret_shaped_material", path);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!isProtocolRecordV01(current)) return;
    for (const [key, child] of Object.entries(current)) {
      const childPath = `${path}.${key}`;
      if (forbiddenKey.test(key) && child !== false && child !== null) {
        failV01("forbidden_raw_material_field", childPath);
      }
      visit(child, childPath);
    }
  };
  visit(value, "$");
}

function scanStringsV01(
  value: unknown,
  visit: (value: string, path: string) => void,
  path = "$",
): void {
  if (typeof value === "string") {
    visit(value, path);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => scanStringsV01(item, visit, `${path}[${index}]`));
  } else if (isProtocolRecordV01(value)) {
    for (const [key, child] of Object.entries(value)) {
      scanStringsV01(child, visit, `${path}.${key}`);
    }
  }
}

function assertExactKeysV01(
  value: unknown,
  expected: readonly string[],
  path: string,
): asserts value is Record<string, unknown> {
  if (!isProtocolRecordV01(value)) failV01("operational_comparison_object_invalid", path);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(wanted)) {
    failV01("operational_comparison_unknown_or_missing_field", path);
  }
}

function assertCanonicalEqualV01(
  left: unknown,
  right: unknown,
  code: string,
): void {
  if (canonicalizeProtocolValueV01(left) !== canonicalizeProtocolValueV01(right)) {
    failV01(code);
  }
}

function failV01(code: string, path = "$"): never {
  throw new OperationalContinuationComparisonErrorV01(code, path);
}
