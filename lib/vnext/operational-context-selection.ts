import {
  buildPersonalPerspectivePairedEvaluationV01,
} from "@/lib/vnext/context-shadow-navigation";
import {
  buildContextUseAttributionProjectionV01,
} from "@/lib/vnext/context-use-attribution-projection";
import { validateContextUseReviewRelationsV01 } from "@/lib/vnext/context-use-review";
import {
  assertOperationalFrictionMaterialMatchesSourcesV01,
  deriveOperationalFrictionProposalAdmissionIdentityV01,
  materializeOperationalFrictionProposalV01,
  validateOperationalFrictionProposalAdmissionIdentityV01,
  type MaterializeOperationalFrictionProposalInputV01,
  type MaterializeOperationalFrictionProposalResultV01,
  type OperationalFrictionProposalAdmissionIdentityV01,
} from "@/lib/vnext/operational-friction-proposal";
import type { VNextCoreRecordEnvelopeV01 } from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { compareEffectiveReviewDecisionsV01 } from "@/lib/vnext/review-decision-lineage";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01,
  OPERATIONAL_CONTEXT_SELECTION_MAX_SUMMARY_CHARACTERS_V01,
  OPERATIONAL_CONTEXT_SELECTION_RULE_VERSION_V01,
  OPERATIONAL_CONTEXT_SELECTION_VERSION_V01,
  OPERATIONAL_CONTINUATION_ADMISSION_IDENTITY_VERSION_V01,
  SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
  type OperationalContextSelectionAuthoritySummaryV01,
  type OperationalContextSelectionCandidateSnapshotRowV01,
  type OperationalContextSelectionCandidateSnapshotV01,
  type OperationalContextSelectionDecisionBindingV01,
  type OperationalContextSelectionMaterialBoundaryV01,
  type OperationalContextSelectionRecordBindingV01,
  type OperationalContextSelectionRowV01,
  type OperationalContextSelectionV01,
  type OperationalContinuationAdmissionIdentityV01,
  type SourceLinkedOperationalContinuationV01,
} from "@/types/vnext/operational-context-selection";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const PENDING_SELECTION_ID = "operational-context-selection:pending";
const PENDING_FINGERPRINT = "sha256:pending";
const MAX_DECISIONS = 128;

export class OperationalContextSelectionErrorV01 extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "OperationalContextSelectionErrorV01";
    this.code = code;
  }
}

export interface OperationalContinuationDecisionHistoryItemV01 {
  decision: ReviewDecisionV01;
  status: "valid" | "invalid";
  pilot_session_bound: boolean;
  pilot_actionable: boolean;
  session_id: string | null;
  request_fingerprint: string | null;
  errors: string[];
}

export interface OperationalContinuationCanonicalAdmissionReadbackV01 {
  record: VNextCoreRecordEnvelopeV01;
  proposal: EpisodeDeltaProposalV01;
  admission_identity: OperationalFrictionProposalAdmissionIdentityV01;
  canonical_admission_identity_verified: true;
  canonical_writer_requires_exact_source_rematerialization: true;
  write_path_provenance: "not_serialized_not_reprovable";
  ordinary_readback_rehydrates_upstream_sources: false;
  exact_source_rematerialization_bound: true;
}

export interface MaterializeSourceLinkedOperationalContinuationInputV01 {
  workspace_id: string;
  project_id: string;
  prior_packet_a: TaskContextPacketV01;
  packet_a: TaskContextPacketV01;
  source_transition_receipt_a: StateTransitionReceiptV01;
  run_receipt_a: RunReceiptV01;
  context_use_review_a: ContextUseReviewV01;
  operational_friction_source: MaterializeOperationalFrictionProposalInputV01;
  operational_friction_materialization: MaterializeOperationalFrictionProposalResultV01;
  canonical_admission: OperationalContinuationCanonicalAdmissionReadbackV01;
  decision_history: readonly OperationalContinuationDecisionHistoryItemV01[];
  state_transition_receipts: readonly StateTransitionReceiptV01[];
  decision_time_cutoff: string;
  max_selected_candidates: number;
}

export interface OperationalContextSelectionValidationResultV01 {
  status: "valid" | "invalid";
  errors: string[];
}

/**
 * Pure ACGC5A compiler. It accepts exact source objects and returns one
 * non-durable candidate packet; it has no ambient clock, environment,
 * persistence, filesystem, provider, network, GitHub, Browser, or Companion
 * dependency.
 */
export function materializeSourceLinkedOperationalContinuationV01(
  input: MaterializeSourceLinkedOperationalContinuationInputV01,
): SourceLinkedOperationalContinuationV01 {
  assertExactInputShapeV01(input);
  const inputBefore = canonicalizeProtocolValueV01(input);
  assertBoundedSourceMaterialV01(input);
  const source = structuredClone(input);
  const cutoff = requireTimestampV01(
    source.decision_time_cutoff,
    "operational_continuation_decision_cutoff_invalid",
  );
  if (
    !Number.isInteger(source.max_selected_candidates) ||
    source.max_selected_candidates < 0 ||
    source.max_selected_candidates >
      OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01
  ) {
    failV01("operational_continuation_selection_budget_invalid");
  }
  assertScopeV01(source);
  assertExactPacketRunReviewChainV01(source);

  const rebuiltAttribution = buildContextUseAttributionProjectionV01({
    review: source.context_use_review_a,
    prior_packet: source.prior_packet_a,
    later_packet: source.packet_a,
    source_transition_receipt: source.source_transition_receipt_a,
    later_task_run_receipt: source.run_receipt_a,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltAttribution) !==
    canonicalizeProtocolValueV01(source.operational_friction_source.attribution)
  ) {
    failV01("operational_continuation_acgc1_source_mismatch");
  }
  const rebuiltPaired = buildPersonalPerspectivePairedEvaluationV01(
    source.operational_friction_source.context_shadow_projection,
    rebuiltAttribution,
  );
  if (
    canonicalizeProtocolValueV01(rebuiltPaired) !==
    canonicalizeProtocolValueV01(
      source.operational_friction_source.paired_evaluation,
    )
  ) {
    failV01("operational_continuation_acgc2_source_mismatch");
  }

  const rebuiltFriction = materializeOperationalFrictionProposalV01(
    source.operational_friction_source,
  );
  if (
    canonicalizeProtocolValueV01(rebuiltFriction) !==
    canonicalizeProtocolValueV01(source.operational_friction_materialization)
  ) {
    failV01("operational_continuation_acgc4_materialization_mismatch");
  }
  assertOperationalFrictionMaterialMatchesSourcesV01(
    source.operational_friction_source,
    rebuiltFriction.profile,
    rebuiltFriction.proposal,
  );
  const admissionIdentity =
    deriveOperationalFrictionProposalAdmissionIdentityV01({
      workspace_id: source.workspace_id,
      project_id: source.project_id,
      proposal: rebuiltFriction.proposal,
    });
  assertCanonicalAdmissionReadbackV01(
    source.canonical_admission,
    rebuiltFriction.proposal,
    admissionIdentity,
  );
  if (
    rebuiltFriction.profile.source_bundle.packet_review_binding.packet_id !==
      source.packet_a.packet_id ||
    rebuiltFriction.profile.source_bundle.packet_review_binding
      .packet_fingerprint !== source.packet_a.integrity.fingerprint ||
    rebuiltFriction.profile.source_bundle.packet_review_binding.review_id !==
      source.context_use_review_a.review_id ||
    rebuiltFriction.profile.source_bundle.packet_review_binding
      .review_fingerprint !== source.context_use_review_a.integrity.fingerprint
  ) {
    failV01("operational_continuation_packet_review_source_mismatch");
  }

  const proposal = rebuiltFriction.proposal;
  const profile = rebuiltFriction.profile;
  if (
    !proposal.operational_friction_proposal ||
    profile.proposal_only_status !== "proposal_only" ||
    profile.policy_activation_owner !== null ||
    profile.authority_summary.semantic_transition_eligible !== false ||
    profile.authority_summary.activates_policy !== false
  ) {
    failV01("operational_continuation_proposal_only_mode_invalid");
  }

  const effectiveByCandidate = resolveEffectiveDecisionsV01(
    source.decision_history,
    proposal,
    cutoff,
  );
  assertNoTransitionReceiptConflictV01(
    source.state_transition_receipts,
    proposal,
    effectiveByCandidate,
  );
  const candidateSnapshot = buildCandidateSnapshotV01(proposal);
  const { selectedRows, excludedRows, stopReason } = buildSelectionRowsV01({
    proposal,
    profile,
    candidateSnapshot,
    effectiveByCandidate,
    maxSelected: source.max_selected_candidates,
  });
  const effectiveDecisions = [...effectiveByCandidate.values()]
    .map(decisionBindingV01)
    .sort(compareDecisionBindingsV01);
  const sourceCurrentness = {
    status: proposal.source_status.currentness,
    as_of:
      proposal.source_status.as_of ??
      source.operational_friction_source.dynamics_digest.end_boundary
        .boundary_timestamp,
    basis: proposal.source_status.basis,
    source_refs: normalizeRefsV01(proposal.source_status.source_refs),
  } satisfies OperationalContextSelectionV01["source_currentness"];
  const selection = finalizeSelectionV01({
    selection_version: OPERATIONAL_CONTEXT_SELECTION_VERSION_V01,
    selection_id: PENDING_SELECTION_ID,
    selection_kind: "pure_rebuildable_non_authoritative_operational_context",
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    work_ref: structuredClone(source.packet_a.work_ref),
    packet_a: packetBindingV01(source.packet_a),
    run_receipt_a: runBindingV01(source.run_receipt_a),
    context_use_review_a: reviewBindingV01(source.context_use_review_a),
    acgc1_attribution: attributionBindingV01(rebuiltAttribution),
    acgc2_shadow_projection: shadowBindingV01(
      source.operational_friction_source.context_shadow_projection,
    ),
    acgc2_paired_evaluation: pairedBindingV01(rebuiltPaired),
    acgc3_dynamics_digest: digestBindingV01(
      source.operational_friction_source.dynamics_digest,
    ),
    acgc3_ordered_frames: source.operational_friction_source.frames.map(
      frameBindingV01,
    ),
    acgc4_materialization: {
      materialization_version: rebuiltFriction.materialization_version,
      materialization_id: rebuiltFriction.materialization_id,
    },
    acgc4_source_bundle: {
      record_version: profile.source_bundle.bundle_version,
      record_id: profile.source_bundle.bundle_id,
      record_fingerprint: profile.source_bundle.bundle_fingerprint,
    },
    acgc4_profile: {
      record_version: profile.profile_version,
      record_id: profile.profile_id,
      record_fingerprint: profile.integrity.fingerprint,
    },
    acgc4_proposal: {
      record_version: proposal.proposal_version,
      record_id: proposal.proposal_id,
      record_fingerprint: proposal.integrity.fingerprint,
    },
    acgc4_canonical_admission: admissionIdentity,
    effective_decisions: effectiveDecisions,
    decision_time_cutoff: source.decision_time_cutoff,
    selection_rule_version: OPERATIONAL_CONTEXT_SELECTION_RULE_VERSION_V01,
    max_selected_candidates: source.max_selected_candidates,
    candidate_snapshot: candidateSnapshot,
    selected_rows: selectedRows,
    excluded_rows: excludedRows,
    source_currentness: sourceCurrentness,
    uncertainties: uniqueProtocolStringsV01([
      ...profile.uncertainties,
      ...selectedRows.flatMap((row) => row.uncertainties),
      ...excludedRows.flatMap((row) => row.uncertainties),
    ]),
    limitations: uniqueProtocolStringsV01([
      ...profile.limitations,
      "Canonical candidate order is a determinism rule only; it is not priority, rank, utility, policy benefit, superiority, or winner selection.",
      "Proposal-only accept records review judgment but does not activate operational policy or create semantic Transition.",
      "Selected continuation material is neither Evidence, accepted state, reviewed memory, authority, nor current work.",
      "Ordinary canonical readback verifies immutable admission identity but does not reproduce historical canonical-writer invocation provenance.",
      "Only exact source rematerialization revalidates the upstream ACGC1 through ACGC4 relation chain.",
    ]),
    stop_reason: stopReason,
    material_boundary: createMaterialBoundaryV01(),
    authority_summary: createAuthoritySummaryV01(),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: "selection_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  });
  assertValidOperationalContextSelectionV01(selection);

  const generatedAt = deriveGeneratedAtV01(source, effectiveByCandidate);
  const candidatePacket = buildCandidatePacketV01(
    source.packet_a,
    selection,
    generatedAt,
  );
  const materializationIdentity = deriveMaterializationIdentityV01(
    selection,
    candidatePacket,
  );
  const result: SourceLinkedOperationalContinuationV01 = {
    materialization_version:
      SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
    materialization_identity: materializationIdentity,
    selection,
    candidate_task_context_packet_b: candidatePacket,
    persisted: false,
    current_packet: false,
    execution_eligible: false,
    attachment_prepared: false,
    grant_issued: false,
    run_created: false,
    semantic_transition_created: false,
    persistence: { reads: 0, writes: 0, database_calls: 0 },
    external_effects: {
      provider_calls: 0,
      model_calls: 0,
      network_calls: 0,
      github_calls: 0,
      browser_calls: 0,
      companion_calls: 0,
      filesystem_calls: 0,
    },
    authority_summary: createAuthoritySummaryV01(),
  };
  assertSafeBoundedMaterialV01(result);
  if (canonicalizeProtocolValueV01(input) !== inputBefore) {
    failV01("operational_continuation_input_mutated");
  }
  return result;
}

export function validateOperationalContextSelectionV01(
  input: unknown,
): OperationalContextSelectionValidationResultV01 {
  const errors: string[] = [];
  const add = (code: string) => {
    if (!errors.includes(code)) errors.push(code);
  };
  if (!isProtocolRecordV01(input)) {
    return { status: "invalid", errors: ["selection_shape_invalid"] };
  }
  const selection = input as unknown as OperationalContextSelectionV01;
  if (
    !hasExactKeysV01(input, [
      "selection_version",
      "selection_id",
      "selection_kind",
      "workspace_id",
      "project_id",
      "work_ref",
      "packet_a",
      "run_receipt_a",
      "context_use_review_a",
      "acgc1_attribution",
      "acgc2_shadow_projection",
      "acgc2_paired_evaluation",
      "acgc3_dynamics_digest",
      "acgc3_ordered_frames",
      "acgc4_materialization",
      "acgc4_source_bundle",
      "acgc4_profile",
      "acgc4_proposal",
      "acgc4_canonical_admission",
      "effective_decisions",
      "decision_time_cutoff",
      "selection_rule_version",
      "max_selected_candidates",
      "candidate_snapshot",
      "selected_rows",
      "excluded_rows",
      "source_currentness",
      "uncertainties",
      "limitations",
      "stop_reason",
      "material_boundary",
      "authority_summary",
      "integrity",
    ])
  ) {
    add("selection_shape_invalid");
  }
  if (
    selection.selection_version !==
      OPERATIONAL_CONTEXT_SELECTION_VERSION_V01 ||
    selection.selection_kind !==
      "pure_rebuildable_non_authoritative_operational_context" ||
    selection.selection_rule_version !==
      OPERATIONAL_CONTEXT_SELECTION_RULE_VERSION_V01
  ) {
    add("selection_version_or_kind_invalid");
  }
  if (
    !selection.workspace_id ||
    !selection.project_id ||
    !Array.isArray(selection.selected_rows) ||
    !Array.isArray(selection.excluded_rows) ||
    !Array.isArray(selection.effective_decisions) ||
    !isProtocolRecordV01(selection.candidate_snapshot) ||
    !Array.isArray(selection.candidate_snapshot.rows) ||
    !isProtocolRecordV01(selection.integrity)
  ) {
    add("selection_shape_invalid");
    return { status: "invalid", errors };
  }
  if (
    !Number.isInteger(selection.max_selected_candidates) ||
    selection.max_selected_candidates < 0 ||
    selection.max_selected_candidates >
      OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01 ||
    selection.selected_rows.length > selection.max_selected_candidates
  ) {
    add("selection_budget_invalid");
  }
  if (
    canonicalizeProtocolValueV01(selection.authority_summary) !==
      canonicalizeProtocolValueV01(createAuthoritySummaryV01())
  ) {
    add("selection_authority_invalid");
  }
  if (
    canonicalizeProtocolValueV01(selection.material_boundary) !==
      canonicalizeProtocolValueV01(createMaterialBoundaryV01())
  ) {
    add("selection_material_boundary_invalid");
  }
  const rows = [...selection.selected_rows, ...selection.excluded_rows];
  if (
    !hasExactKeysV01(selection.candidate_snapshot, [
      "snapshot_version",
      "candidate_count",
      "canonical_order",
      "rows",
      "fingerprint",
    ]) ||
    selection.candidate_snapshot.snapshot_version !==
      "operational_context_candidate_snapshot.v0.1" ||
    selection.candidate_snapshot.canonical_order !==
      "candidate_id_then_fingerprint_code_unit_order" ||
    !hasExactKeysV01(selection.integrity, [
      "algorithm",
      "canonicalization",
      "fingerprint_scope",
      "fingerprint",
    ])
  ) {
    add("selection_nested_shape_invalid");
  }
  const snapshotKeys = selection.candidate_snapshot.rows.map((row) =>
    candidateKeyV01(row.candidate_id, row.candidate_fingerprint),
  );
  const rowKeys = rows.map((row) =>
    candidateKeyV01(row.candidate_id, row.candidate_fingerprint),
  );
  if (
    rows.length !== selection.candidate_snapshot?.candidate_count ||
    new Set(rowKeys).size !== rowKeys.length ||
    canonicalizeProtocolValueV01([...rowKeys].sort(compareProtocolCodeUnitsV01)) !==
      canonicalizeProtocolValueV01(
        [...snapshotKeys].sort(compareProtocolCodeUnitsV01),
      ) ||
    selection.candidate_snapshot.rows.some(
      (row) =>
        !hasExactKeysV01(row, [
          "candidate_id",
          "candidate_fingerprint",
          "delta_family",
          "operation",
          "operation_domain",
          "target_class",
        ]),
    ) ||
    rows.some(
      (row) =>
        !hasExactKeysV01(row, [
          "candidate_id",
          "candidate_fingerprint",
          "delta_family",
          "operation",
          "operation_domain",
          "target_class",
          "basis_observation_ids",
          "source_refs",
          "review_decision",
          "disposition",
          "exclusion_reason",
          "currentness",
          "uncertainties",
          "limitations",
          "proposal_only",
          "activation_owner",
          "semantic_transition_eligible",
          "causal_contribution",
          "item_level_credit_or_blame",
          "exact_intervention_evidence_present",
          "exact_item_evidence_present",
        ]),
    ) ||
    rows.some(
      (row) =>
        row.proposal_only !== true ||
        row.activation_owner !== null ||
        row.semantic_transition_eligible !== false ||
        row.causal_contribution !== false ||
        row.item_level_credit_or_blame !== false ||
        row.exact_intervention_evidence_present !== false ||
        row.exact_item_evidence_present !== false,
    )
  ) {
    add("selection_row_semantics_invalid");
  }
  if (
    selection.effective_decisions.some(
      (decision) =>
        !hasExactKeysV01(decision, [
          "decision_version",
          "decision_id",
          "decision_fingerprint",
          "disposition",
          "decided_at",
          "revisit",
          "review_mode",
          "requested_transition_intent_present",
        ]) ||
        decision.review_mode !== "proposal_only_no_activation" ||
        decision.requested_transition_intent_present !== false ||
        !["accept", "reject", "defer"].includes(decision.disposition) ||
        parseStrictIsoTimestampV01(decision.decided_at) === null ||
        (decision.disposition === "defer") !== (decision.revisit !== null),
    ) ||
    validateOperationalFrictionProposalAdmissionIdentityV01(
      selection.acgc4_canonical_admission,
    ).status !== "valid"
  ) {
    add("selection_decision_or_admission_invalid");
  }
  if (
    selection.selected_rows.some(
      (row) =>
        row.disposition !== "selected_effective_accept" ||
        row.exclusion_reason !== null ||
        row.review_decision?.disposition !== "accept",
    ) ||
    selection.excluded_rows.some(
      (row) =>
        row.disposition === "selected_effective_accept" ||
        row.exclusion_reason === null,
    )
  ) {
    add("selection_disposition_invalid");
  }
  if (
    candidateSnapshotFingerprintV01(selection.candidate_snapshot.rows) !==
    selection.candidate_snapshot.fingerprint
  ) {
    add("selection_candidate_snapshot_fingerprint_invalid");
  }
  const expectedId = deriveSelectionIdV01(selection);
  if (selection.selection_id !== expectedId) add("selection_id_invalid");
  if (
    createSelectionFingerprintV01(selection) !==
    selection.integrity?.fingerprint
  ) {
    add("selection_fingerprint_invalid");
  }
  try {
    assertSafeBoundedMaterialV01(selection);
  } catch (error) {
    add(
      error instanceof OperationalContextSelectionErrorV01
        ? error.code
        : "selection_material_unsafe",
    );
  }
  return { status: errors.length === 0 ? "valid" : "invalid", errors };
}

export function assertValidOperationalContextSelectionV01(
  input: unknown,
): asserts input is OperationalContextSelectionV01 {
  const validation = validateOperationalContextSelectionV01(input);
  if (validation.status !== "valid") {
    failV01(`operational_context_selection_invalid:${validation.errors.join(",")}`);
  }
}

function assertExactInputShapeV01(
  input: unknown,
): asserts input is MaterializeSourceLinkedOperationalContinuationInputV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("operational_continuation_input_invalid");
  }
  const expected = [
    "workspace_id",
    "project_id",
    "prior_packet_a",
    "packet_a",
    "source_transition_receipt_a",
    "run_receipt_a",
    "context_use_review_a",
    "operational_friction_source",
    "operational_friction_materialization",
    "canonical_admission",
    "decision_history",
    "state_transition_receipts",
    "decision_time_cutoff",
    "max_selected_candidates",
  ].sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(
      Object.keys(input).sort(compareProtocolCodeUnitsV01),
    ) !== canonicalizeProtocolValueV01(expected)
  ) {
    failV01("operational_continuation_caller_material_refused");
  }
  if (
    !Array.isArray(input.decision_history) ||
    !Array.isArray(input.state_transition_receipts)
  ) {
    failV01("operational_continuation_review_bundle_invalid");
  }
}

function assertScopeV01(
  input: MaterializeSourceLinkedOperationalContinuationInputV01,
): void {
  if (!input.workspace_id.trim() || !input.project_id.trim()) {
    failV01("operational_continuation_scope_invalid");
  }
  const scoped = [
    input.prior_packet_a,
    input.packet_a,
    input.source_transition_receipt_a,
    input.run_receipt_a,
    input.context_use_review_a,
    input.operational_friction_source,
    input.operational_friction_materialization.profile,
    input.operational_friction_materialization.proposal,
    input.canonical_admission.proposal,
    ...input.decision_history.map((entry) => entry.decision),
    ...input.state_transition_receipts,
  ];
  if (
    scoped.some(
      (value) =>
        value.workspace_id !== input.workspace_id ||
        value.project_id !== input.project_id,
    )
  ) {
    failV01("operational_continuation_cross_scope_refused");
  }
}

function assertExactPacketRunReviewChainV01(
  input: MaterializeSourceLinkedOperationalContinuationInputV01,
): void {
  const relation = validateContextUseReviewRelationsV01(
    input.context_use_review_a,
    input.prior_packet_a,
    input.packet_a,
    input.source_transition_receipt_a,
    input.run_receipt_a,
  );
  if (relation.status !== "valid") {
    failV01(
      `operational_continuation_packet_run_review_relation_invalid:${relation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const packetWork = canonicalizeProtocolValueV01(input.packet_a.work_ref);
  const runWork = canonicalizeProtocolValueV01(input.run_receipt_a.work_ref);
  if (
    input.packet_a.work_ref === null ||
    (input.run_receipt_a.work_ref !== null &&
      packetWork !== runWork &&
      !(
        typeof input.packet_a.work_ref === "string" &&
        input.run_receipt_a.work_ref.external_id === input.packet_a.work_ref
      ))
  ) {
    failV01("operational_continuation_work_binding_mismatch");
  }
}

function assertCanonicalAdmissionReadbackV01(
  readback: OperationalContinuationCanonicalAdmissionReadbackV01,
  proposal: EpisodeDeltaProposalV01,
  identity: OperationalFrictionProposalAdmissionIdentityV01,
): void {
  const record = readback.record;
  if (
    readback.canonical_admission_identity_verified !== true ||
    readback.canonical_writer_requires_exact_source_rematerialization !== true ||
    readback.write_path_provenance !== "not_serialized_not_reprovable" ||
    readback.ordinary_readback_rehydrates_upstream_sources !== false ||
    readback.exact_source_rematerialization_bound !== true ||
    canonicalizeProtocolValueV01(readback.proposal) !==
      canonicalizeProtocolValueV01(proposal) ||
    canonicalizeProtocolValueV01(readback.admission_identity) !==
      canonicalizeProtocolValueV01(identity) ||
    record.record_kind !== "episode_delta_proposal" ||
    record.record_id !== proposal.proposal_id ||
    record.workspace_id !== proposal.workspace_id ||
    record.project_id !== proposal.project_id ||
    record.fingerprint !== proposal.integrity.fingerprint ||
    record.idempotency_key !== identity.idempotency_key ||
    record.created_at !== proposal.created_at ||
    canonicalizeProtocolValueV01(record.payload) !==
      canonicalizeProtocolValueV01(proposal)
  ) {
    failV01("operational_continuation_canonical_admission_conflict");
  }
}

function resolveEffectiveDecisionsV01(
  history: readonly OperationalContinuationDecisionHistoryItemV01[],
  proposal: EpisodeDeltaProposalV01,
  cutoff: number,
): Map<string, ReviewDecisionV01> {
  if (history.length > MAX_DECISIONS) {
    failV01("operational_continuation_decision_bound_exceeded");
  }
  const exactCandidateKeys = new Set(
    proposal.proposed_deltas.map((candidate) =>
      candidateKeyV01(
        candidate.candidate_id,
        createEpisodeDeltaCandidateFingerprintV01(candidate),
      ),
    ),
  );
  const seenDecisions = new Map<string, string>();
  const byCandidate = new Map<string, ReviewDecisionV01[]>();
  for (const entry of history) {
    const decision = entry.decision;
    if (
      entry.status !== "valid" ||
      entry.pilot_session_bound !== true ||
      entry.errors.length !== 0 ||
      validateReviewDecisionV01(decision).status !== "valid" ||
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        decision,
        proposal,
      ).status !== "valid"
    ) {
      failV01("operational_continuation_decision_provenance_invalid");
    }
    const existingFingerprint = seenDecisions.get(decision.decision_id);
    if (existingFingerprint) {
      failV01(
        existingFingerprint === decision.integrity.fingerprint
          ? "operational_continuation_duplicate_decision_refused"
          : "operational_continuation_conflicting_decision_reseal_refused",
      );
    }
    seenDecisions.set(decision.decision_id, decision.integrity.fingerprint);
    const decidedAt = requireTimestampV01(
      decision.decided_at,
      "operational_continuation_decision_timestamp_invalid",
    );
    if (decidedAt > cutoff) {
      failV01("operational_continuation_post_cutoff_decision_refused");
    }
    if (
      !["accept", "reject", "defer"].includes(decision.decision) ||
      decision.requested_transition_intent !== null ||
      decision.lineage.superseding_candidate !== null ||
      decision.lineage.retracted_decision !== null ||
      decision.lineage.prior_decisions.length !== 0
    ) {
      failV01("operational_continuation_transition_intent_decision_refused");
    }
    if (
      (decision.decision === "defer" && decision.revisit === null) ||
      (decision.decision !== "defer" && decision.revisit !== null)
    ) {
      failV01("operational_continuation_revisit_relation_invalid");
    }
    const key = candidateKeyV01(
      decision.candidate.candidate_id,
      decision.candidate.candidate_fingerprint,
    );
    if (!exactCandidateKeys.has(key)) {
      failV01("operational_continuation_decision_candidate_mismatch");
    }
    const current = byCandidate.get(key) ?? [];
    current.push(decision);
    byCandidate.set(key, current);
  }

  const effective = new Map<string, ReviewDecisionV01>();
  for (const [key, decisions] of byCandidate) {
    const chronological = [...decisions].sort(
      (left, right) =>
        Date.parse(left.decided_at) - Date.parse(right.decided_at) ||
        compareProtocolCodeUnitsV01(left.decision_id, right.decision_id),
    );
    for (let index = 0; index < chronological.length - 1; index += 1) {
      if (["accept", "reject"].includes(chronological[index]!.decision)) {
        failV01("operational_continuation_terminal_decision_conflict");
      }
    }
    const ordered = [...decisions].sort(compareEffectiveReviewDecisionsV01);
    if (
      ordered.length > 1 &&
      ordered[0]!.decided_at === ordered[1]!.decided_at
    ) {
      failV01("operational_continuation_effective_decision_ambiguous");
    }
    effective.set(key, ordered[0]!);
  }
  return effective;
}

function assertNoTransitionReceiptConflictV01(
  receipts: readonly StateTransitionReceiptV01[],
  proposal: EpisodeDeltaProposalV01,
  decisions: Map<string, ReviewDecisionV01>,
): void {
  if (receipts.length === 0) return;
  const exactDecisionKeys = new Set(
    [...decisions.values()].map((decision) =>
      candidateKeyV01(
        decision.decision_id,
        decision.integrity.fingerprint,
      ),
    ),
  );
  const linked = receipts.some(
    (receipt) =>
      receipt.source_proposal.proposal_id === proposal.proposal_id ||
      exactDecisionKeys.has(
        candidateKeyV01(
          receipt.source_decision.decision_id,
          receipt.source_decision.decision_fingerprint,
        ),
      ),
  );
  if (linked) {
    failV01("operational_continuation_proposal_only_transition_conflict");
  }
  failV01("operational_continuation_unexpected_transition_receipt_refused");
}

function buildCandidateSnapshotV01(
  proposal: EpisodeDeltaProposalV01,
): OperationalContextSelectionCandidateSnapshotV01 {
  const profile = proposal.operational_friction_proposal;
  if (!profile) {
    failV01("operational_continuation_generic_unknown_candidate_refused");
  }
  const rows = profile.candidate_bindings
    .map((binding): OperationalContextSelectionCandidateSnapshotRowV01 => {
      const candidate = proposal.proposed_deltas.find(
        (item) => item.candidate_id === binding.candidate_id,
      );
      if (
        !candidate ||
        createEpisodeDeltaCandidateFingerprintV01(candidate) !==
          binding.candidate_fingerprint ||
        candidate.operation !== "unknown" ||
        candidate.delta_type !== binding.delta_family ||
        binding.proposal_only !== true ||
        binding.activation_owner !== null ||
        binding.semantic_state_target_present !== false
      ) {
        failV01("operational_continuation_candidate_profile_mismatch");
      }
      return {
        candidate_id: binding.candidate_id,
        candidate_fingerprint: binding.candidate_fingerprint,
        delta_family: binding.delta_family,
        operation: "unknown",
        operation_domain: binding.operation_domain,
        target_class: binding.target_class,
      };
    })
    .sort(compareCandidateRowsV01);
  if (
    rows.length !== proposal.proposed_deltas.length ||
    rows.length < 1 ||
    rows.length > OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01 ||
    new Set(rows.map((row) => row.candidate_id)).size !== rows.length
  ) {
    failV01("operational_continuation_candidate_snapshot_invalid");
  }
  return {
    snapshot_version: "operational_context_candidate_snapshot.v0.1",
    candidate_count: rows.length,
    canonical_order: "candidate_id_then_fingerprint_code_unit_order",
    rows,
    fingerprint: candidateSnapshotFingerprintV01(rows),
  };
}

function buildSelectionRowsV01(input: {
  proposal: EpisodeDeltaProposalV01;
  profile: NonNullable<EpisodeDeltaProposalV01["operational_friction_proposal"]>;
  candidateSnapshot: OperationalContextSelectionCandidateSnapshotV01;
  effectiveByCandidate: Map<string, ReviewDecisionV01>;
  maxSelected: number;
}): {
  selectedRows: OperationalContextSelectionRowV01[];
  excludedRows: OperationalContextSelectionRowV01[];
  stopReason: OperationalContextSelectionV01["stop_reason"];
} {
  const selectedRows: OperationalContextSelectionRowV01[] = [];
  const excludedRows: OperationalContextSelectionRowV01[] = [];
  let eligibleCount = 0;
  for (const snapshot of input.candidateSnapshot.rows) {
    const binding = input.profile.candidate_bindings.find(
      (item) =>
        item.candidate_id === snapshot.candidate_id &&
        item.candidate_fingerprint === snapshot.candidate_fingerprint,
    );
    const candidate = input.proposal.proposed_deltas.find(
      (item) => item.candidate_id === snapshot.candidate_id,
    );
    if (!binding || !candidate) {
      failV01("operational_continuation_candidate_relation_missing");
    }
    const observations = binding.basis_observation_ids.map((observationId) => {
      const observation = input.profile.observations.find(
        (item) => item.observation_id === observationId,
      );
      if (!observation) {
        failV01("operational_continuation_basis_observation_missing");
      }
      if (
        observation.causal_contribution !== false ||
        observation.item_level_credit_or_blame !== false
      ) {
        failV01("operational_continuation_bundle_credit_refused");
      }
      return observation;
    });
    const decision = input.effectiveByCandidate.get(
      candidateKeyV01(snapshot.candidate_id, snapshot.candidate_fingerprint),
    );
    const base = {
      ...snapshot,
      basis_observation_ids: [...binding.basis_observation_ids],
      source_refs: normalizeRefsV01([
        ...candidate.source_refs,
        ...observations.flatMap((observation) => observation.source_refs),
      ]),
      review_decision: decision ? decisionBindingV01(decision) : null,
      currentness: {
        status: input.proposal.source_status.currentness,
        as_of:
          input.proposal.source_status.as_of ??
          input.profile.source_bundle.end_boundary_timestamp,
        basis: input.proposal.source_status.basis,
        source_refs: normalizeRefsV01(input.proposal.source_status.source_refs),
      },
      uncertainties: uniqueProtocolStringsV01([
        ...candidate.uncertainties,
        ...observations.flatMap((observation) => observation.uncertainties),
      ]),
      limitations: uniqueProtocolStringsV01([
        ...candidate.limitations,
        ...observations.flatMap((observation) => observation.limitations),
        "No bundle-level, item-level, or causal credit or blame is inferred.",
      ]),
      proposal_only: true as const,
      activation_owner: null,
      semantic_transition_eligible: false as const,
      causal_contribution: false as const,
      item_level_credit_or_blame: false as const,
      exact_intervention_evidence_present: false as const,
      exact_item_evidence_present: false as const,
    };
    if (!decision) {
      excludedRows.push({
        ...base,
        disposition: "excluded_unresolved",
        exclusion_reason: "effective_review_unresolved",
      });
      continue;
    }
    if (decision.decision === "reject") {
      excludedRows.push({
        ...base,
        disposition: "excluded_effective_reject",
        exclusion_reason: "effective_review_rejected",
      });
      continue;
    }
    if (decision.decision === "defer") {
      excludedRows.push({
        ...base,
        disposition: "excluded_effective_defer",
        exclusion_reason: "effective_review_deferred_revisit_capable",
      });
      continue;
    }
    eligibleCount += 1;
    if (selectedRows.length < input.maxSelected) {
      selectedRows.push({
        ...base,
        disposition: "selected_effective_accept",
        exclusion_reason: null,
      });
    } else {
      excludedRows.push({
        ...base,
        disposition: "excluded_budget_reached",
        exclusion_reason: "budget_reached",
      });
    }
  }
  return {
    selectedRows,
    excludedRows,
    stopReason:
      eligibleCount > input.maxSelected
        ? "budget_reached"
        : selectedRows.length === 0
          ? "no_eligible_candidates"
          : "eligible_candidates_exhausted",
  };
}

function buildCandidatePacketV01(
  packetA: TaskContextPacketV01,
  selection: OperationalContextSelectionV01,
  generatedAt: string,
): TaskContextPacketV01 {
  const selectionRef = externalRefV01(
    "operational_context_selection",
    selection.selection_id,
    selection.integrity.fingerprint,
    generatedAt,
  );
  const proposalRef = externalRefV01(
    "episode_delta_proposal",
    selection.acgc4_proposal.record_id,
    selection.acgc4_proposal.record_fingerprint,
    generatedAt,
  );
  const derivedEntries = selection.selected_rows.map((row) => ({
    entry_id: `operational-continuation:${createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        selection_id: selection.selection_id,
        candidate_id: row.candidate_id,
        candidate_fingerprint: row.candidate_fingerprint,
      }),
    ).slice("sha256:".length, 39)}`,
    entry_kind: "source_ref" as const,
    source_ref: row.candidate_fingerprint,
    external_ref: externalRefV01(
      "operational_friction_candidate",
      row.candidate_id,
      row.candidate_fingerprint,
      generatedAt,
    ),
    why_included:
      "Selected by an effective proposal-only accept as source-linked, derived, non-authoritative operational continuation material.",
    currentness: {
      status: row.currentness.status,
      as_of: row.currentness.as_of,
      basis: row.currentness.basis,
      source_ref: proposalRef,
    },
    trust_class: "derived_interpretation" as const,
    compatibility_source_ref: selectionRef,
    bounded_summary: `Proposal-only ${row.operation_domain} candidate for ${row.target_class}; no activation, policy, Evidence, accepted state, or execution authority is implied.`,
  }));
  const maxSelected = packetA.constraints.context_budget.max_selected_entries;
  if (
    maxSelected !== null &&
    packetA.selected_context.length + derivedEntries.length > maxSelected
  ) {
    failV01("operational_continuation_packet_selected_budget_insufficient");
  }
  const candidate = buildTaskContextPacketV01({
    workspace_id: packetA.workspace_id,
    project_id: packetA.project_id,
    work_ref: structuredClone(packetA.work_ref),
    generated_at: generatedAt,
    expires_at: deriveCandidateExpiryV01(packetA, generatedAt),
    task: structuredClone(packetA.task),
    current_projection: structuredClone(packetA.current_projection),
    selected_context: [
      ...structuredClone(packetA.selected_context),
      ...derivedEntries,
    ],
    excluded_context: structuredClone(packetA.excluded_context),
    tensions: structuredClone(packetA.tensions),
    risks: structuredClone(packetA.risks),
    gaps: structuredClone(packetA.gaps),
    constraints: {
      required_checks: [...packetA.constraints.required_checks],
      forbidden_actions: [...packetA.constraints.forbidden_actions],
      data_classification: packetA.constraints.data_classification,
      context_budget: structuredClone(packetA.constraints.context_budget),
    },
    capability_grant: null,
    ...(packetA.criterion_verification_plan
      ? {
          criterion_verification_plan: structuredClone(
            packetA.criterion_verification_plan,
          ),
        }
      : {}),
    return_contract: structuredClone(packetA.return_contract),
    source_status: {
      ...structuredClone(packetA.source_status),
      external_refs: normalizeRefsV01([
        ...packetA.source_status.external_refs,
        selectionRef,
        proposalRef,
      ]),
      warnings: uniqueProtocolStringsV01([
        ...packetA.source_status.warnings,
        "Operational continuation entries are proposal-only derived context; they are not accepted state, Evidence, memory, policy, or authority.",
      ]),
    },
    compatibility: {
      ...structuredClone(packetA.compatibility),
      source_contracts: uniqueProtocolStringsV01([
        ...packetA.compatibility.source_contracts,
        OPERATIONAL_CONTEXT_SELECTION_VERSION_V01,
        SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01,
        selection.acgc4_source_bundle.record_version,
        selection.acgc4_profile.record_version,
      ]),
      source_refs: normalizeRefsV01([
        ...packetA.compatibility.source_refs,
        selectionRef,
        proposalRef,
        ...selection.effective_decisions.map((decision) =>
          externalRefV01(
            "review_decision",
            decision.decision_id,
            decision.decision_fingerprint,
            decision.decided_at,
          ),
        ),
      ]),
      warnings: uniqueProtocolStringsV01([
        ...packetA.compatibility.warnings,
        "This candidate packet is pure, rebuildable, non-durable, not current work, and ineligible for attachment, Start, or Resume in ACGC5A.",
      ]),
    },
    authority_notes: [
      ...packetA.authority_summary.notes,
      "Knowledge inheritance is not authority inheritance.",
      "Run A grant is not inherited and cannot serve as a Run B grant.",
      "A protocol-valid candidate packet is not the current packet and cannot authorize execution.",
    ],
  });
  const validation = validateTaskContextPacketV01(candidate, {
    evaluated_at: generatedAt,
  });
  if (validation.status !== "valid") {
    failV01(
      `operational_continuation_candidate_packet_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  for (const [name, left, right] of [
    ["goal", candidate.task.goal, packetA.task.goal],
    [
      "success_criteria",
      candidate.task.success_criteria,
      packetA.task.success_criteria,
    ],
    ["non_goals", candidate.task.non_goals, packetA.task.non_goals],
    [
      "required_checks",
      candidate.constraints.required_checks,
      packetA.constraints.required_checks,
    ],
    [
      "forbidden_actions",
      candidate.constraints.forbidden_actions,
      packetA.constraints.forbidden_actions,
    ],
  ] as const) {
    if (
      canonicalizeProtocolValueV01(left) !==
      canonicalizeProtocolValueV01(right)
    ) {
      failV01(`operational_continuation_packet_${name}_changed`);
    }
  }
  if (
    candidate.constraints.data_classification !==
      packetA.constraints.data_classification ||
    candidate.capability_grant !== null ||
    candidate.workspace_id !== packetA.workspace_id ||
    candidate.project_id !== packetA.project_id ||
    canonicalizeProtocolValueV01(candidate.work_ref) !==
      canonicalizeProtocolValueV01(packetA.work_ref) ||
    candidate.constraints.context_budget.max_selected_entries !==
      packetA.constraints.context_budget.max_selected_entries ||
    candidate.constraints.context_budget.max_projection_items !==
      packetA.constraints.context_budget.max_projection_items ||
    candidate.constraints.context_budget.max_characters !==
      packetA.constraints.context_budget.max_characters ||
    candidate.constraints.context_budget.max_estimated_tokens !==
      packetA.constraints.context_budget.max_estimated_tokens
  ) {
    failV01("operational_continuation_packet_invariant_changed");
  }
  const derivedIds = new Set(derivedEntries.map((entry) => entry.entry_id));
  if (
    candidate.selected_context
      .filter((entry) => derivedIds.has(entry.entry_id))
      .some(
        (entry) =>
          entry.entry_kind !== "source_ref" ||
          entry.trust_class !== "derived_interpretation",
      )
  ) {
    failV01("operational_continuation_packet_semantic_misclassification");
  }
  return candidate;
}

function deriveGeneratedAtV01(
  input: MaterializeSourceLinkedOperationalContinuationInputV01,
  decisions: Map<string, ReviewDecisionV01>,
): string {
  const timestamps = [
    input.packet_a.generated_at,
    input.run_receipt_a.recorded_at,
    input.context_use_review_a.reviewed_at,
    input.operational_friction_materialization.proposal.created_at,
    input.operational_friction_source.dynamics_digest.end_boundary
      .boundary_timestamp,
    ...[...decisions.values()].map((decision) => decision.decided_at),
  ];
  const parsed = timestamps.map((timestamp) => ({
    timestamp,
    value: requireTimestampV01(
      timestamp,
      "operational_continuation_source_timestamp_invalid",
    ),
  }));
  const latest = parsed.reduce((left, right) =>
    right.value > left.value ? right : left,
  );
  if (
    latest.value >
    requireTimestampV01(
      input.decision_time_cutoff,
      "operational_continuation_decision_cutoff_invalid",
    )
  ) {
    failV01("operational_continuation_source_after_cutoff_refused");
  }
  return latest.timestamp;
}

function deriveCandidateExpiryV01(
  packetA: TaskContextPacketV01,
  generatedAt: string,
): string | null {
  if (packetA.expires_at === null) return null;
  const sourceGeneratedAt = requireTimestampV01(
    packetA.generated_at,
    "operational_continuation_packet_a_timestamp_invalid",
  );
  const sourceExpiresAt = requireTimestampV01(
    packetA.expires_at,
    "operational_continuation_packet_a_expiry_invalid",
  );
  const generated = requireTimestampV01(
    generatedAt,
    "operational_continuation_generated_at_invalid",
  );
  const ttl = sourceExpiresAt - sourceGeneratedAt;
  if (ttl <= 0) {
    failV01("operational_continuation_packet_a_expiry_invalid");
  }
  return new Date(generated + ttl).toISOString();
}

function finalizeSelectionV01(
  input: OperationalContextSelectionV01,
): OperationalContextSelectionV01 {
  const selection = structuredClone(input);
  selection.selection_id = deriveSelectionIdV01(selection);
  selection.integrity.fingerprint = createSelectionFingerprintV01(selection);
  return selection;
}

function deriveSelectionIdV01(selection: OperationalContextSelectionV01): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutSelectionFingerprintV01(selection),
      selection_id: PENDING_SELECTION_ID,
    }),
  );
  return `operational-context-selection:${hash.slice("sha256:".length, 38)}`;
}

function createSelectionFingerprintV01(
  selection: OperationalContextSelectionV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutSelectionFingerprintV01(selection)),
  );
}

function withoutSelectionFingerprintV01(
  selection: OperationalContextSelectionV01,
): Omit<OperationalContextSelectionV01, "integrity"> & {
  integrity: Omit<OperationalContextSelectionV01["integrity"], "fingerprint">;
} {
  const copy = structuredClone(selection);
  const { fingerprint: _fingerprint, ...integrity } = copy.integrity;
  return { ...copy, integrity };
}

function deriveMaterializationIdentityV01(
  selection: OperationalContextSelectionV01,
  packet: TaskContextPacketV01,
): OperationalContinuationAdmissionIdentityV01 {
  const decisionFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(selection.effective_decisions),
  );
  const core = {
    identity_version:
      OPERATIONAL_CONTINUATION_ADMISSION_IDENTITY_VERSION_V01,
    workspace_id: selection.workspace_id,
    project_id: selection.project_id,
    work_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(selection.work_ref),
    ),
    packet_a_id: selection.packet_a.record_id,
    packet_a_fingerprint: selection.packet_a.record_fingerprint,
    run_receipt_a_id: selection.run_receipt_a.record_id,
    run_receipt_a_fingerprint: selection.run_receipt_a.record_fingerprint,
    context_use_review_a_id: selection.context_use_review_a.record_id,
    context_use_review_a_fingerprint:
      selection.context_use_review_a.record_fingerprint,
    acgc4_source_bundle_id: selection.acgc4_source_bundle.record_id,
    acgc4_source_bundle_fingerprint:
      selection.acgc4_source_bundle.record_fingerprint,
    acgc4_profile_id: selection.acgc4_profile.record_id,
    acgc4_profile_fingerprint: selection.acgc4_profile.record_fingerprint,
    acgc4_proposal_id: selection.acgc4_proposal.record_id,
    acgc4_proposal_fingerprint: selection.acgc4_proposal.record_fingerprint,
    acgc4_admission_idempotency_key:
      selection.acgc4_canonical_admission.idempotency_key,
    effective_decisions_fingerprint: decisionFingerprint,
    decision_time_cutoff: selection.decision_time_cutoff,
    selection_rule_version: selection.selection_rule_version,
    max_selected_candidates: selection.max_selected_candidates,
    selection_id: selection.selection_id,
    selection_fingerprint: selection.integrity.fingerprint,
    candidate_packet_b_id: packet.packet_id,
    candidate_packet_b_fingerprint: packet.integrity.fingerprint,
  };
  const coreHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01(core),
  );
  const materializationId = `operational-continuation-materialization:${coreHash.slice("sha256:".length, 38)}`;
  const materializationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({ materialization_id: materializationId, ...core }),
  );
  return {
    ...core,
    materialization_id: materializationId,
    materialization_fingerprint: materializationFingerprint,
    future_admission_idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: OPERATIONAL_CONTINUATION_ADMISSION_IDENTITY_VERSION_V01,
        materialization_id: materializationId,
        materialization_fingerprint: materializationFingerprint,
        ...core,
      }),
    ),
  };
}

function createAuthoritySummaryV01(): OperationalContextSelectionAuthoritySummaryV01 {
  return {
    is_operational_policy: false,
    is_evidence: false,
    is_accepted_state: false,
    is_reviewed_memory: false,
    is_canonical_perspective: false,
    is_command: false,
    is_approval: false,
    performs_semantic_transition: false,
    activates_policy: false,
    mutates_current_packet: false,
    persists_candidate_packet: false,
    grants_execution_authority: false,
    grants_external_effect_authority: false,
    grants_scheduling_authority: false,
    inherits_run_grant: false,
    creates_attachment: false,
    creates_start_decision: false,
    creates_resume_decision: false,
    calls_provider: false,
    calls_network: false,
    calls_github: false,
    writes_database: false,
    writes_project_files: false,
  };
}

function createMaterialBoundaryV01(): OperationalContextSelectionMaterialBoundaryV01 {
  return {
    bounded_summaries_only: true,
    max_summary_characters:
      OPERATIONAL_CONTEXT_SELECTION_MAX_SUMMARY_CHARACTERS_V01,
    max_candidates: OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    raw_artifact_content_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    token_cookie_or_nonce_included: false,
    absolute_local_path_included: false,
  };
}

function assertSafeBoundedMaterialV01(value: unknown): void {
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => failV01(`operational_continuation_material_refused:${code}`),
      warning: () => undefined,
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in operational continuation material.",
      provider_specific_field_message:
        "Provider identity must remain inside an ExternalRef.",
      allowed_false_invariant_fields: new Set([
        "raw_prompt_included",
        "raw_transcript_included",
        "raw_terminal_output_included",
        "raw_provider_output_included",
        "raw_artifact_content_included",
        "hidden_reasoning_included",
        "credential_or_secret_included",
        "token_cookie_or_nonce_included",
        "absolute_local_path_included",
        "raw_prompt_persisted",
        "raw_transcript_persisted",
        "raw_terminal_output_persisted",
        "raw_provider_output_persisted",
        "raw_artifact_content_persisted",
        "hidden_reasoning_persisted",
        "credential_or_secret_persisted",
        "absolute_local_path_persisted",
      ]),
    },
  );
  scanAbsolutePathsV01(value, "$", false);
  scanTextBoundsV01(value, "$");
  const canonical = canonicalizeProtocolValueV01(value);
  if (canonical.length > 4_000_000) {
    failV01("operational_continuation_material_bound_exceeded");
  }
}

function assertBoundedSourceMaterialV01(value: unknown): void {
  scanAbsolutePathsV01(value, "$", false);
  if (canonicalizeProtocolValueV01(value).length > 4_000_000) {
    failV01("operational_continuation_material_bound_exceeded");
  }
}

function scanAbsolutePathsV01(
  value: unknown,
  path: string,
  _insideExternalRef: boolean,
): void {
  if (typeof value === "string") {
    if (
      (/^(?:\/|[A-Za-z]:[\\/]|\\\\)/u.test(value) ||
        /(?:^|\s)(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)/u.test(value))
    ) {
      failV01(`operational_continuation_absolute_path_refused:${path}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanAbsolutePathsV01(item, `${path}[${index}]`, false),
    );
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  for (const [key, child] of Object.entries(value)) {
    scanAbsolutePathsV01(child, `${path}.${key}`, false);
  }
}

function scanTextBoundsV01(value: unknown, path: string): void {
  if (typeof value === "string") {
    if (
      value.length >
      OPERATIONAL_CONTEXT_SELECTION_MAX_SUMMARY_CHARACTERS_V01
    ) {
      failV01(`operational_continuation_text_bound_exceeded:${path}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanTextBoundsV01(item, `${path}[${index}]`),
    );
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  for (const [key, child] of Object.entries(value)) {
    scanTextBoundsV01(child, `${path}.${key}`);
  }
}

function candidateSnapshotFingerprintV01(
  rows: OperationalContextSelectionCandidateSnapshotRowV01[],
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      snapshot_version: "operational_context_candidate_snapshot.v0.1",
      canonical_order: "candidate_id_then_fingerprint_code_unit_order",
      rows,
    }),
  );
}

function decisionBindingV01(
  decision: ReviewDecisionV01,
): OperationalContextSelectionDecisionBindingV01 {
  if (!["accept", "reject", "defer"].includes(decision.decision)) {
    failV01("operational_continuation_decision_disposition_invalid");
  }
  return {
    decision_version: decision.decision_version,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    disposition: decision.decision as "accept" | "reject" | "defer",
    decided_at: decision.decided_at,
    revisit: structuredClone(decision.revisit),
    review_mode: "proposal_only_no_activation",
    requested_transition_intent_present: false,
  };
}

function compareDecisionBindingsV01(
  left: OperationalContextSelectionDecisionBindingV01,
  right: OperationalContextSelectionDecisionBindingV01,
): number {
  return (
    compareProtocolCodeUnitsV01(left.decision_id, right.decision_id) ||
    compareProtocolCodeUnitsV01(
      left.decision_fingerprint,
      right.decision_fingerprint,
    )
  );
}

function compareCandidateRowsV01(
  left: OperationalContextSelectionCandidateSnapshotRowV01,
  right: OperationalContextSelectionCandidateSnapshotRowV01,
): number {
  return (
    compareProtocolCodeUnitsV01(left.candidate_id, right.candidate_id) ||
    compareProtocolCodeUnitsV01(
      left.candidate_fingerprint,
      right.candidate_fingerprint,
    )
  );
}

function packetBindingV01(
  packet: TaskContextPacketV01,
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: packet.packet_version,
    record_id: packet.packet_id,
    record_fingerprint: packet.integrity.fingerprint,
  };
}

function runBindingV01(
  receipt: RunReceiptV01,
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: receipt.receipt_version,
    record_id: receipt.receipt_id,
    record_fingerprint: receipt.integrity.fingerprint,
  };
}

function reviewBindingV01(
  review: ContextUseReviewV01,
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: review.review_version,
    record_id: review.review_id,
    record_fingerprint: review.integrity.fingerprint,
  };
}

function attributionBindingV01(
  attribution: ContextUseAttributionProjectionV01,
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: attribution.projection_version,
    record_id: attribution.projection_id,
    record_fingerprint: attribution.integrity.fingerprint,
  };
}

function shadowBindingV01(
  shadow: MaterializeOperationalFrictionProposalInputV01["context_shadow_projection"],
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: shadow.projection_version,
    record_id: shadow.projection_id,
    record_fingerprint: shadow.integrity.fingerprint,
  };
}

function pairedBindingV01(
  paired: MaterializeOperationalFrictionProposalInputV01["paired_evaluation"],
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: paired.evaluation_version,
    record_id: paired.evaluation_id,
    record_fingerprint: paired.integrity.fingerprint,
  };
}

function digestBindingV01(
  digest: MaterializeOperationalFrictionProposalInputV01["dynamics_digest"],
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: digest.digest_version,
    record_id: digest.digest_id,
    record_fingerprint: digest.integrity.fingerprint,
  };
}

function frameBindingV01(
  frame: MaterializeOperationalFrictionProposalInputV01["frames"][number],
): OperationalContextSelectionRecordBindingV01 {
  return {
    record_version: frame.frame_version,
    record_id: frame.frame_id,
    record_fingerprint: frame.integrity.fingerprint,
  };
}

function externalRefV01(
  refType: string,
  id: string,
  fingerprint: string,
  observedAt: string,
): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: id,
    source_ref: fingerprint,
    observed_at: observedAt,
    compatibility_namespace: OPERATIONAL_CONTEXT_SELECTION_VERSION_V01,
    trust_class: "derived_interpretation",
  });
}

function normalizeRefsV01(refs: readonly ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map((ref) => normalizeExternalRefPrimitiveV01(ref)),
  ).sort(compareExternalRefsV01);
}

function candidateKeyV01(id: string, fingerprint: string): string {
  return `${id}\0${fingerprint}`;
}

function hasExactKeysV01(
  value: unknown,
  expectedKeys: readonly string[],
): boolean {
  if (!isProtocolRecordV01(value)) return false;
  return (
    canonicalizeProtocolValueV01(
      Object.keys(value).sort(compareProtocolCodeUnitsV01),
    ) ===
    canonicalizeProtocolValueV01(
      [...expectedKeys].sort(compareProtocolCodeUnitsV01),
    )
  );
}

function requireTimestampV01(value: unknown, code: string): number {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) failV01(code);
  return parsed;
}

function failV01(code: string): never {
  throw new OperationalContextSelectionErrorV01(code);
}
