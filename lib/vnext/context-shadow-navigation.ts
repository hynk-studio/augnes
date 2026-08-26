import {
  createPersonalPerspectiveScopeLineageRefV01,
  selectPersonalPerspectiveContextV01,
} from "@/lib/vnext/project-controls/project-controls";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  scanForbiddenProtocolMaterialV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import { validateContextUseAttributionProjectionV01 } from "@/lib/vnext/context-use-attribution-projection";
import type {
  ContextUseAttributionProjectionV01,
  ContextUseAttributionRowV01,
} from "@/types/vnext/context-use-attribution-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  PERSONAL_PERSPECTIVE_CONTEXT_SELECTION_VERSION_V01,
  PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01,
  type PersonalPerspectiveContextCandidateV01,
  type PersonalPerspectiveEffectiveScopeV01,
} from "@/types/vnext/project-controls";
import { EXTERNAL_REF_TRUST_CLASSES_V01 } from "@/types/vnext/external-ref";
import {
  TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01,
  type TaskContextPacketExcludedEntryV01,
  type TaskContextPacketSelectedEntryKindV01,
  type TaskContextPacketSelectedEntryV01,
} from "@/types/vnext/task-context-packet";
import {
  PERSONAL_PERSPECTIVE_CANDIDATE_SNAPSHOT_VERSION_V01,
  PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01,
  PERSONAL_PERSPECTIVE_SHADOW_COMPARISON_VERSION_V01,
  PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01,
  PERSONAL_PERSPECTIVE_SHADOW_NAVIGATION_VERSION_V01,
  PERSONAL_PERSPECTIVE_SHADOW_POLICY_VERSION_V01,
  PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01,
  PERSONAL_PERSPECTIVE_SHADOW_SELECTOR_SEAM_V01,
  type ContextShadowAuthoritySummaryV01,
  type ContextShadowIntegrityV01,
  type ContextShadowMaterialBoundaryV01,
  type ContextShadowPacketBindingV01,
  type PersonalPerspectiveCandidateSnapshotRowV01,
  type PersonalPerspectiveCandidateSnapshotV01,
  type PersonalPerspectivePairedEvaluationRowV01,
  type PersonalPerspectivePairedEvaluationV01,
  type PersonalPerspectiveShadowComparisonV01,
  type PersonalPerspectiveShadowNavigationResultV01,
  type PersonalPerspectiveShadowProjectionV01,
} from "@/types/vnext/context-shadow-navigation";

const PENDING_ID = "context-shadow:pending";
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const CANONICALIZATION = "augnes-json-c14n-v0_1" as const;
const SHADOW_BUDGET_REASON =
  "Excluded only from the shadow result because max_shadow_selected was reached; the unchanged baseline selector remains eligible.";
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;

const selectedEntryKinds = new Set<TaskContextPacketSelectedEntryKindV01>([
  "accepted_state_ref",
  "memory_ref",
  "evidence_ref",
  "claim_ref",
  "artifact_ref",
  "proof_ref",
  "action_ref",
  "legacy_state_key_ref",
  "source_ref",
  "work_ref",
  "other_ref",
]);
const currentnessStatuses = new Set<string>(
  TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01,
);
const trustClasses = new Set<string>(EXTERNAL_REF_TRUST_CLASSES_V01);

export interface BuildPersonalPerspectiveShadowProjectionInputV01 {
  workspace_id: string;
  project_id: string;
  scope: PersonalPerspectiveEffectiveScopeV01;
  candidates: readonly PersonalPerspectiveContextCandidateV01[];
  baseline_task_context_packet: ContextShadowPacketBindingV01;
  max_shadow_selected: number;
}

export function buildPersonalPerspectiveShadowProjectionV01(
  input: BuildPersonalPerspectiveShadowProjectionInputV01,
): PersonalPerspectiveShadowProjectionV01 {
  assertBuilderInputV01(input);
  const inputSnapshot = structuredClone(input);
  assertSafeMaterialV01(inputSnapshot);
  const baselineSelection = selectPersonalPerspectiveContextV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    scope: input.scope,
    candidates: input.candidates,
  });
  const scopeIncluded = baselineSelection.scope_status === "included";
  const uniqueCandidates = scopeIncluded
    ? uniqueCandidatesV01(input.candidates)
    : [];
  const snapshot = buildCandidateSnapshotV01(
    input,
    uniqueCandidates,
    baselineSelection.scope_lineage_ref,
  );
  const baselineFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(baselineSelection),
  );
  const baselineResultId = idFromFingerprintV01(
    "personal-perspective-baseline",
    baselineFingerprint,
  );
  const baseline = {
    baseline_result_id: baselineResultId,
    baseline_result_fingerprint: baselineFingerprint,
    packet: structuredClone(input.baseline_task_context_packet),
    selection: structuredClone(baselineSelection),
  };
  const shadow = buildShadowResultV01(
    input,
    snapshot,
    baselineResultId,
    baselineFingerprint,
    baselineSelection,
  );
  const comparison = buildShadowComparisonV01(
    snapshot,
    baselineSelection,
    shadow,
  );
  const frozenPairFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      candidate_snapshot_fingerprint: snapshot.integrity.fingerprint,
      baseline_result_fingerprint: baselineFingerprint,
      shadow_result_fingerprint: shadow.integrity.fingerprint,
      comparison_fingerprint: comparison.integrity.fingerprint,
    }),
  );
  const projection: PersonalPerspectiveShadowProjectionV01 = {
    projection_version: PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01,
    projection_id: PENDING_ID,
    projection_kind: "derived_rebuildable_pre_outcome_research_output",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    temporal_boundary: "candidate_and_baseline_frozen_before_later_evidence",
    candidate_snapshot: snapshot,
    baseline,
    shadow,
    comparison,
    frozen_identity: {
      candidate_snapshot_fingerprint: snapshot.integrity.fingerprint,
      baseline_result_fingerprint: baselineFingerprint,
      shadow_result_fingerprint: shadow.integrity.fingerprint,
      comparison_fingerprint: comparison.integrity.fingerprint,
      frozen_pair_fingerprint: frozenPairFingerprint,
    },
    material_boundary: createMaterialBoundaryV01(),
    authority_summary: createAuthoritySummaryV01(),
    integrity: integrityV01(),
  };
  finalizeIdentityV01(projection, "personal-perspective-shadow");
  assertValidPersonalPerspectiveShadowProjectionV01(projection);
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(inputSnapshot)) {
    throw new Error("context_shadow_navigation_input_mutated");
  }
  return projection;
}

export function buildPersonalPerspectivePairedEvaluationV01(
  preOutcomeInput: PersonalPerspectiveShadowProjectionV01,
  attributionInput: ContextUseAttributionProjectionV01,
): PersonalPerspectivePairedEvaluationV01 {
  const preOutcome = structuredClone(preOutcomeInput);
  const attribution = structuredClone(attributionInput);
  assertValidPersonalPerspectiveShadowProjectionV01(preOutcome);
  const attributionValidation = validateContextUseAttributionProjectionV01(
    attribution,
  );
  if (attributionValidation.status !== "valid") {
    throw new Error("context_shadow_navigation_attribution_invalid");
  }
  if (
    attribution.workspace_id !== preOutcome.workspace_id ||
    attribution.project_id !== preOutcome.project_id
  ) {
    throw new Error("context_shadow_navigation_attribution_scope_mismatch");
  }
  const expectedPacket = preOutcome.baseline.packet;
  const observedPacket = attribution.later_task_context_packet;
  if (
    expectedPacket.packet_version !== observedPacket.packet_version ||
    expectedPacket.packet_id !== observedPacket.packet_id ||
    expectedPacket.packet_fingerprint !== observedPacket.packet_fingerprint
  ) {
    throw new Error("context_shadow_navigation_attribution_packet_mismatch");
  }

  const attributionRows = new Map<string, ContextUseAttributionRowV01[]>();
  for (const row of attribution.rows) {
    const key = attributionRowIdentityKeyV01(row);
    const existing = attributionRows.get(key) ?? [];
    existing.push(row);
    attributionRows.set(key, existing);
  }
  const overlap = new Set(preOutcome.comparison.overlap.map(entryIdentityKeyV01));
  const baselineOnly = new Set(
    preOutcome.comparison.baseline_only.map(entryIdentityKeyV01),
  );
  const shadowOnly = new Set(
    preOutcome.comparison.shadow_only.map(entryIdentityKeyV01),
  );
  const comparisonEntries = [
    ...preOutcome.comparison.overlap,
    ...preOutcome.comparison.baseline_only,
    ...preOutcome.comparison.shadow_only,
  ];
  const rows: PersonalPerspectivePairedEvaluationRowV01[] = comparisonEntries
    .map((entry) => {
      const key = entryIdentityKeyV01(entry);
      const matching = attributionRows.get(key) ?? [];
      if (matching.length !== 1) {
        throw new Error(
          matching.length === 0
            ? "context_shadow_navigation_attribution_item_missing"
            : "context_shadow_navigation_attribution_item_ambiguous",
        );
      }
      const row = matching[0]!;
      const comparisonLane = overlap.has(key)
        ? "overlap"
        : baselineOnly.has(key)
          ? "baseline_only"
          : shadowOnly.has(key)
            ? "shadow_only"
            : null;
      if (!comparisonLane) {
        throw new Error("context_shadow_navigation_comparison_identity_invalid");
      }
      const criticalOmissionCandidate =
        comparisonLane === "baseline_only" &&
        row.citation_or_reference.status === "referenced";
      return {
        comparison_lane: comparisonLane,
        entry_id: entry.entry_id,
        attribution: {
          presentation: structuredClone(row.presentation),
          actual_use: structuredClone(row.actual_use),
          citation_or_reference: structuredClone(row.citation_or_reference),
          support_validation: structuredClone(row.support_validation),
          outcome_association: structuredClone(row.outcome_association),
          causal_contribution: structuredClone(row.causal_contribution),
          limitations: [...row.limitations],
        },
        critical_omission_candidate: criticalOmissionCandidate,
        critical_omission_candidate_rule: criticalOmissionCandidate
          ? "baseline_only_exact_reference_non_causal_v0.1"
          : null,
        limitations: uniqueStringsV01([
          "selection_difference_is_not_omission_harm",
          "reference_is_not_support_validation",
          "support_is_not_outcome_association",
          "outcome_is_not_causal_contribution",
          ...(criticalOmissionCandidate
            ? ["critical_omission_candidate_is_non_causal_heuristic"]
            : []),
        ]),
      } satisfies PersonalPerspectivePairedEvaluationRowV01;
    })
    .sort((left, right) =>
      compareProtocolCodeUnitsV01(
        canonicalizeProtocolValueV01(left),
        canonicalizeProtocolValueV01(right),
      ),
    );

  const evaluation: PersonalPerspectivePairedEvaluationV01 = {
    evaluation_version: PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01,
    evaluation_id: PENDING_ID,
    evaluation_kind: "derived_rebuildable_later_paired_research_output",
    workspace_id: preOutcome.workspace_id,
    project_id: preOutcome.project_id,
    pre_outcome_shadow: {
      projection_id: preOutcome.projection_id,
      projection_fingerprint: preOutcome.integrity.fingerprint,
      frozen_pair_fingerprint:
        preOutcome.frozen_identity.frozen_pair_fingerprint,
    },
    later_context_use_attribution: {
      projection_id: attribution.projection_id,
      projection_fingerprint: attribution.integrity.fingerprint,
      review_id: attribution.context_use_review.review_id,
      packet: {
        packet_version: attribution.later_task_context_packet.packet_version,
        packet_id: attribution.later_task_context_packet.packet_id,
        packet_fingerprint:
          attribution.later_task_context_packet.packet_fingerprint,
      },
    },
    rows,
    summary: {
      overlap_count: preOutcome.comparison.overlap.length,
      baseline_only_count: preOutcome.comparison.baseline_only.length,
      shadow_only_count: preOutcome.comparison.shadow_only.length,
      selected_count_delta:
        preOutcome.shadow.selected.length -
        preOutcome.baseline.selection.selected_context.length,
      critical_omission_candidate_count: rows.filter(
        (row) => row.critical_omission_candidate,
      ).length,
      attribution_missing_lanes: [...attribution.completeness.missing_lanes],
      attribution_coverage: "partial",
    },
    hindsight_boundary: {
      frozen_shadow_unchanged: true,
      later_evidence_used_for_selection: false,
      later_evidence_scope: "evaluation_only",
    },
    limitations: uniqueStringsV01([
      ...preOutcome.comparison.limitations,
      "packet_level_actual_use_is_episode_context_only",
      "packet_level_assessment_is_episode_context_only",
      "missing_item_attribution_remains_unknown",
      "paired_evaluation_does_not_promote_policy_or_context",
    ]),
    authority_summary: createAuthoritySummaryV01(),
    integrity: integrityV01(),
  };
  finalizeIdentityV01(evaluation, "personal-perspective-paired-evaluation");
  if (
    canonicalizeProtocolValueV01(preOutcomeInput) !==
      canonicalizeProtocolValueV01(preOutcome) ||
    canonicalizeProtocolValueV01(attributionInput) !==
      canonicalizeProtocolValueV01(attribution)
  ) {
    throw new Error("context_shadow_navigation_paired_input_mutated");
  }
  return evaluation;
}

export function assertValidPersonalPerspectiveShadowProjectionV01(
  input: unknown,
): asserts input is PersonalPerspectiveShadowProjectionV01 {
  if (!isProtocolRecordV01(input)) {
    throw new Error("context_shadow_navigation_projection_invalid");
  }
  assertExactKeysV01(input, [
    "projection_version",
    "projection_id",
    "projection_kind",
    "workspace_id",
    "project_id",
    "temporal_boundary",
    "candidate_snapshot",
    "baseline",
    "shadow",
    "comparison",
    "frozen_identity",
    "material_boundary",
    "authority_summary",
    "integrity",
  ]);
  const projection = input as unknown as PersonalPerspectiveShadowProjectionV01;
  if (
    projection.projection_version !==
      PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01 ||
    projection.projection_kind !==
      "derived_rebuildable_pre_outcome_research_output" ||
    projection.temporal_boundary !==
      "candidate_and_baseline_frozen_before_later_evidence" ||
    projection.workspace_id !== projection.candidate_snapshot.workspace_id ||
    projection.project_id !== projection.candidate_snapshot.project_id ||
    projection.baseline.selection.workspace_id !== projection.workspace_id ||
    projection.baseline.selection.project_id !== projection.project_id ||
    projection.shadow.workspace_id !== projection.workspace_id ||
    projection.shadow.project_id !== projection.project_id ||
    canonicalizeProtocolValueV01(projection.authority_summary) !==
      canonicalizeProtocolValueV01(createAuthoritySummaryV01()) ||
    canonicalizeProtocolValueV01(projection.material_boundary) !==
      canonicalizeProtocolValueV01(createMaterialBoundaryV01())
  ) {
    throw new Error("context_shadow_navigation_projection_invalid");
  }
  validatePacketBindingV01(projection.baseline.packet);
  const baselineFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(projection.baseline.selection),
  );
  const frozenPairFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      candidate_snapshot_fingerprint:
        projection.candidate_snapshot.integrity.fingerprint,
      baseline_result_fingerprint: baselineFingerprint,
      shadow_result_fingerprint: projection.shadow.integrity.fingerprint,
      comparison_fingerprint: projection.comparison.integrity.fingerprint,
    }),
  );
  if (
    baselineFingerprint !== projection.baseline.baseline_result_fingerprint ||
    projection.frozen_identity.candidate_snapshot_fingerprint !==
      projection.candidate_snapshot.integrity.fingerprint ||
    projection.frozen_identity.baseline_result_fingerprint !==
      baselineFingerprint ||
    projection.frozen_identity.shadow_result_fingerprint !==
      projection.shadow.integrity.fingerprint ||
    projection.frozen_identity.comparison_fingerprint !==
      projection.comparison.integrity.fingerprint ||
    projection.frozen_identity.frozen_pair_fingerprint !==
      frozenPairFingerprint ||
    createFingerprintV01(projection) !== projection.integrity.fingerprint ||
    deriveIdentityV01(
      projection as unknown as PersonalPerspectiveShadowProjectionV01 &
        Record<string, unknown>,
      "personal-perspective-shadow",
    ) !== projection.projection_id
  ) {
    throw new Error("context_shadow_navigation_projection_fingerprint_invalid");
  }
  const baselineKeys = projection.baseline.selection.selected_context.map(
    entryIdentityKeyV01,
  );
  const shadowKeys = projection.shadow.selected.map((row) =>
    entryIdentityKeyV01(row.entry),
  );
  if (
    shadowKeys.some((key, index) => key !== baselineKeys[index]) ||
    projection.comparison.shadow_only.length !== 0
  ) {
    throw new Error("context_shadow_navigation_strict_subset_invalid");
  }
}

export function derivePersonalPerspectivePairedEvaluationIdV01(
  evaluation: PersonalPerspectivePairedEvaluationV01,
): string {
  return deriveIdentityV01(
    evaluation as PersonalPerspectivePairedEvaluationV01 &
      Record<string, unknown>,
    "personal-perspective-paired-evaluation",
  );
}

export function createPersonalPerspectivePairedEvaluationFingerprintV01(
  evaluation: PersonalPerspectivePairedEvaluationV01,
): string {
  return createFingerprintV01(evaluation);
}

/**
 * Serialized validation for a paired evaluation. This proves only the
 * evaluation's internal shape, derived counts, epistemic boundary, and
 * deterministic seal. Exact upstream projection/attribution relations remain
 * the responsibility of a source-bound caller that has those objects.
 */
export function assertValidPersonalPerspectivePairedEvaluationV01(
  input: unknown,
): asserts input is PersonalPerspectivePairedEvaluationV01 {
  if (!isProtocolRecordV01(input)) {
    throw new Error("context_shadow_navigation_paired_evaluation_invalid");
  }
  assertExactKeysV01(input, [
    "evaluation_version",
    "evaluation_id",
    "evaluation_kind",
    "workspace_id",
    "project_id",
    "pre_outcome_shadow",
    "later_context_use_attribution",
    "rows",
    "summary",
    "hindsight_boundary",
    "limitations",
    "authority_summary",
    "integrity",
  ]);
  const evaluation = input as unknown as PersonalPerspectivePairedEvaluationV01;
  if (
    evaluation.evaluation_version !==
      PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01 ||
    evaluation.evaluation_kind !==
      "derived_rebuildable_later_paired_research_output" ||
    !requireNonEmptyStringV01(evaluation.workspace_id) ||
    !requireNonEmptyStringV01(evaluation.project_id) ||
    canonicalizeProtocolValueV01(evaluation.authority_summary) !==
      canonicalizeProtocolValueV01(createAuthoritySummaryV01()) ||
    evaluation.hindsight_boundary?.frozen_shadow_unchanged !== true ||
    evaluation.hindsight_boundary?.later_evidence_used_for_selection !== false ||
    evaluation.hindsight_boundary?.later_evidence_scope !== "evaluation_only" ||
    !Array.isArray(evaluation.rows)
  ) {
    throw new Error("context_shadow_navigation_paired_evaluation_invalid");
  }
  assertExactKeysV01(
    evaluation.pre_outcome_shadow as unknown as Record<string, unknown>,
    [
      "projection_id",
      "projection_fingerprint",
      "frozen_pair_fingerprint",
    ],
  );
  assertExactKeysV01(
    evaluation.later_context_use_attribution as unknown as Record<
      string,
      unknown
    >,
    ["projection_id", "projection_fingerprint", "review_id", "packet"],
  );
  validatePacketBindingV01(evaluation.later_context_use_attribution.packet);
  for (const fingerprint of [
    evaluation.pre_outcome_shadow.projection_fingerprint,
    evaluation.pre_outcome_shadow.frozen_pair_fingerprint,
    evaluation.later_context_use_attribution.projection_fingerprint,
  ]) {
    if (!SHA256_PATTERN.test(fingerprint)) {
      throw new Error(
        "context_shadow_navigation_paired_evaluation_source_invalid",
      );
    }
  }
  const laneCounts = {
    overlap: 0,
    baseline_only: 0,
    shadow_only: 0,
  };
  let criticalCount = 0;
  const rowIdentities = new Set<string>();
  for (const row of evaluation.rows) {
    if (!isProtocolRecordV01(row)) {
      throw new Error("context_shadow_navigation_paired_evaluation_row_invalid");
    }
    assertExactKeysV01(row, [
      "comparison_lane",
      "entry_id",
      "attribution",
      "critical_omission_candidate",
      "critical_omission_candidate_rule",
      "limitations",
    ]);
    if (
      !["overlap", "baseline_only", "shadow_only"].includes(
        row.comparison_lane,
      ) ||
      !requireNonEmptyStringV01(row.entry_id) ||
      !Array.isArray(row.limitations) ||
      row.limitations.some((item) => typeof item !== "string")
    ) {
      throw new Error("context_shadow_navigation_paired_evaluation_row_invalid");
    }
    const identity = `${row.comparison_lane}:${row.entry_id}`;
    if (rowIdentities.has(identity)) {
      throw new Error(
        "context_shadow_navigation_paired_evaluation_row_duplicate",
      );
    }
    rowIdentities.add(identity);
    laneCounts[row.comparison_lane] += 1;
    if (row.critical_omission_candidate) {
      criticalCount += 1;
      if (
        row.comparison_lane !== "baseline_only" ||
        row.critical_omission_candidate_rule !==
          "baseline_only_exact_reference_non_causal_v0.1" ||
        !isProtocolRecordV01(row.attribution) ||
        !isProtocolRecordV01(row.attribution.causal_contribution) ||
        row.attribution.causal_contribution.basis !==
          "no_intervention_relation"
      ) {
        throw new Error(
          "context_shadow_navigation_critical_omission_boundary_invalid",
        );
      }
    } else if (row.critical_omission_candidate_rule !== null) {
      throw new Error(
        "context_shadow_navigation_critical_omission_boundary_invalid",
      );
    }
  }
  if (
    evaluation.summary.overlap_count !== laneCounts.overlap ||
    evaluation.summary.baseline_only_count !== laneCounts.baseline_only ||
    evaluation.summary.shadow_only_count !== laneCounts.shadow_only ||
    evaluation.summary.critical_omission_candidate_count !== criticalCount ||
    evaluation.summary.attribution_coverage !== "partial" ||
    !Array.isArray(evaluation.summary.attribution_missing_lanes)
  ) {
    throw new Error(
      "context_shadow_navigation_paired_evaluation_summary_invalid",
    );
  }
  if (
    createFingerprintV01(evaluation) !== evaluation.integrity.fingerprint ||
    deriveIdentityV01(
      evaluation as PersonalPerspectivePairedEvaluationV01 &
        Record<string, unknown>,
      "personal-perspective-paired-evaluation",
    ) !== evaluation.evaluation_id
  ) {
    throw new Error(
      "context_shadow_navigation_paired_evaluation_fingerprint_invalid",
    );
  }
  assertSafeMaterialV01(evaluation);
}

function buildCandidateSnapshotV01(
  input: BuildPersonalPerspectiveShadowProjectionInputV01,
  uniqueCandidates: PersonalPerspectiveContextCandidateV01[],
  scopeLineageRef: ExternalRefV01 | null,
): PersonalPerspectiveCandidateSnapshotV01 {
  const scopeIncluded = input.scope.status === "included";
  const rows: PersonalPerspectiveCandidateSnapshotRowV01[] =
    uniqueCandidates.map((candidate) => {
      const candidateFingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01(candidate),
      );
      const single = selectPersonalPerspectiveContextV01({
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        scope: input.scope,
        candidates: [candidate],
      });
      const selected = single.selected_context.length === 1;
      return {
        candidate_id: idFromFingerprintV01(
          "personal-perspective-candidate",
          candidateFingerprint,
        ),
        candidate_fingerprint: candidateFingerprint,
        candidate_scope: structuredClone(candidate.candidate_scope),
        review_status: candidate.review_status,
        trust_policy_status: candidate.trust_policy_status,
        entry_id: candidate.entry.entry_id,
        entry_kind: candidate.entry.entry_kind,
        source_ref: candidate.entry.source_ref,
        external_ref: candidate.entry.external_ref
          ? structuredClone(candidate.entry.external_ref)
          : null,
        currentness_status: candidate.entry.currentness.status,
        currentness_source_ref: candidate.entry.currentness.source_ref
          ? structuredClone(candidate.entry.currentness.source_ref)
          : null,
        trust_class: candidate.entry.trust_class,
        compatibility_source_ref: candidate.entry.compatibility_source_ref
          ? structuredClone(candidate.entry.compatibility_source_ref)
          : null,
        baseline_disposition: selected ? "selected" : "excluded",
        baseline_exclusion_reason: selected
          ? null
          : (single.excluded_context[0]?.why_excluded ??
            "Excluded by the unchanged baseline selector."),
      };
    });
  const candidateSetFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(uniqueCandidates),
  );
  const snapshot: PersonalPerspectiveCandidateSnapshotV01 = {
    snapshot_version: PERSONAL_PERSPECTIVE_CANDIDATE_SNAPSHOT_VERSION_V01,
    snapshot_id: PENDING_ID,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    effective_scope: structuredClone(input.scope),
    effective_scope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.scope),
    ),
    scope_lineage_ref: scopeLineageRef
      ? structuredClone(scopeLineageRef)
      : null,
    selector_seam: PERSONAL_PERSPECTIVE_SHADOW_SELECTOR_SEAM_V01,
    selector_version: PERSONAL_PERSPECTIVE_CONTEXT_SELECTION_VERSION_V01,
    candidate_set_fingerprint: candidateSetFingerprint,
    collection: {
      bounded: true,
      max_candidates: PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01,
      input_candidate_count: input.candidates.length,
      unique_candidate_count: uniqueCandidates.length,
      duplicate_candidate_count: scopeIncluded
        ? input.candidates.length - uniqueCandidates.length
        : 0,
      truncated: false,
    },
    source_completeness: scopeIncluded
      ? {
          status: "complete",
          candidate_source: "exact_pre_outcome_input",
          missing: [],
        }
      : {
          status: "partial",
          candidate_source: "not_collected_scope_excluded",
          missing: ["candidate_material_not_collected_due_scope"],
        },
    candidates: rows,
    authority_summary: createAuthoritySummaryV01(),
    integrity: integrityV01(),
  };
  finalizeIdentityV01(snapshot, "personal-perspective-candidate-snapshot");
  return snapshot;
}

function buildShadowResultV01(
  input: BuildPersonalPerspectiveShadowProjectionInputV01,
  snapshot: PersonalPerspectiveCandidateSnapshotV01,
  baselineResultId: string,
  baselineFingerprint: string,
  baselineSelection: ReturnType<typeof selectPersonalPerspectiveContextV01>,
): PersonalPerspectiveShadowNavigationResultV01 {
  const selectedEntries = baselineSelection.selected_context.slice(
    0,
    input.max_shadow_selected,
  );
  const budgetExcludedEntries = baselineSelection.selected_context.slice(
    selectedEntries.length,
  );
  const selected = selectedEntries.map((entry, index) => ({
    baseline_selected_order: index,
    entry: structuredClone(entry),
  }));
  const hardExcluded = baselineSelection.excluded_context.map((entry) => ({
    exclusion_kind: "baseline_hard_exclusion" as const,
    baseline_selected_order: null,
    entry: structuredClone(entry),
  }));
  const budgetExcluded = budgetExcludedEntries.map((entry, index) => ({
    exclusion_kind: "shadow_budget" as const,
    baseline_selected_order: selectedEntries.length + index,
    entry: budgetExcludedEntryV01(entry),
  }));
  const stopReason =
    baselineSelection.scope_status !== "included"
      ? "scope_excluded"
      : baselineSelection.selected_context.length === 0
        ? "no_eligible_material"
        : budgetExcluded.length > 0
          ? "max_shadow_selected_reached"
          : "candidates_exhausted";
  const shadow: PersonalPerspectiveShadowNavigationResultV01 = {
    shadow_result_version:
      PERSONAL_PERSPECTIVE_SHADOW_NAVIGATION_VERSION_V01,
    shadow_result_id: PENDING_ID,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    candidate_snapshot_id: snapshot.snapshot_id,
    candidate_snapshot_fingerprint: snapshot.integrity.fingerprint,
    baseline_result_id: baselineResultId,
    baseline_result_fingerprint: baselineFingerprint,
    policy_version: PERSONAL_PERSPECTIVE_SHADOW_POLICY_VERSION_V01,
    policy_kind: "strict_subset_of_baseline_eligible_in_baseline_order",
    max_shadow_selected: input.max_shadow_selected,
    selected,
    excluded: [...hardExcluded, ...budgetExcluded],
    budget: {
      eligible_available: baselineSelection.selected_context.length,
      selected_count: selected.length,
      budget_excluded_count: budgetExcluded.length,
      remaining_capacity: Math.max(
        0,
        input.max_shadow_selected - selected.length,
      ),
    },
    stop_reason: stopReason,
    completeness: {
      status: snapshot.source_completeness.status,
      missing: [...snapshot.source_completeness.missing],
    },
    authority_summary: createAuthoritySummaryV01(),
    integrity: integrityV01(),
  };
  finalizeIdentityV01(shadow, "personal-perspective-shadow-result");
  return shadow;
}

function buildShadowComparisonV01(
  snapshot: PersonalPerspectiveCandidateSnapshotV01,
  baselineSelection: ReturnType<typeof selectPersonalPerspectiveContextV01>,
  shadow: PersonalPerspectiveShadowNavigationResultV01,
): PersonalPerspectiveShadowComparisonV01 {
  const overlap = shadow.selected.map((row) => structuredClone(row.entry));
  const baselineOnly = baselineSelection.selected_context.slice(overlap.length);
  const comparison: PersonalPerspectiveShadowComparisonV01 = {
    comparison_version:
      PERSONAL_PERSPECTIVE_SHADOW_COMPARISON_VERSION_V01,
    comparison_id: PENDING_ID,
    candidate_snapshot_fingerprint: snapshot.integrity.fingerprint,
    baseline_result_fingerprint: shadow.baseline_result_fingerprint,
    shadow_result_fingerprint: shadow.integrity.fingerprint,
    overlap,
    baseline_only: structuredClone(baselineOnly),
    shadow_only: [],
    exclusion_reason_deltas: baselineOnly.map((entry) => ({
      entry_id: entry.entry_id,
      baseline_reason: null,
      shadow_reason: SHADOW_BUDGET_REASON,
    })),
    duplicate_indicators: {
      exact_duplicate_candidate_count:
        snapshot.collection.duplicate_candidate_count,
      duplicate_selected_identity_count:
        baselineSelection.selected_context.length -
        new Set(
          baselineSelection.selected_context.map(entryIdentityKeyV01),
        ).size,
    },
    budget: structuredClone(shadow.budget),
    stop_reason: shadow.stop_reason,
    source_completeness: structuredClone(snapshot.source_completeness),
    limitations: [
      "shadow_policy_is_a_budgeted_strict_subset_of_baseline_eligible_entries",
      "shadow_only_is_intentionally_zero_for_this_policy",
      "selection_difference_is_not_omission_harm",
      "paired_outcomes_require_separate_later_exact_attribution",
      "no_scalar_quality_or_fitness_score",
    ],
    authority_summary: createAuthoritySummaryV01(),
    integrity: integrityV01(),
  };
  finalizeIdentityV01(comparison, "personal-perspective-shadow-comparison");
  return comparison;
}

function assertBuilderInputV01(
  input: BuildPersonalPerspectiveShadowProjectionInputV01,
): void {
  if (!isProtocolRecordV01(input)) {
    throw new Error("context_shadow_navigation_input_invalid");
  }
  assertExactKeysV01(input, [
    "workspace_id",
    "project_id",
    "scope",
    "candidates",
    "baseline_task_context_packet",
    "max_shadow_selected",
  ]);
  requireNonEmptyStringV01(input.workspace_id);
  requireNonEmptyStringV01(input.project_id);
  if (!Array.isArray(input.candidates)) {
    throw new Error("context_shadow_navigation_candidates_invalid");
  }
  if (input.candidates.length > PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01) {
    throw new Error("context_shadow_navigation_candidate_bound_exceeded");
  }
  if (
    !Number.isSafeInteger(input.max_shadow_selected) ||
    input.max_shadow_selected < 0 ||
    input.max_shadow_selected > PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01
  ) {
    throw new Error("context_shadow_navigation_budget_invalid");
  }
  validatePacketBindingV01(input.baseline_task_context_packet);
  validateScopeShapeV01(input.scope);
  input.candidates.forEach(validateCandidateShapeV01);
}

function validateScopeShapeV01(value: unknown): void {
  if (!isProtocolRecordV01(value)) {
    throw new Error("context_shadow_navigation_scope_invalid");
  }
  assertExactKeysV01(value, [
    "effective_scope_version",
    "workspace_id",
    "project_id",
    "status",
    "configured",
    "effectively_included",
    "scope_revision",
    "created_at",
    "updated_at",
    "effective_context_behavior",
    "explanation",
  ]);
  if (
    value.effective_scope_version !==
      PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01
  ) {
    throw new Error("context_shadow_navigation_scope_invalid");
  }
}

function validateCandidateShapeV01(value: unknown): void {
  if (!isProtocolRecordV01(value)) {
    throw new Error("context_shadow_navigation_candidate_invalid");
  }
  assertExactKeysV01(value, [
    "candidate_scope",
    "review_status",
    "trust_policy_status",
    "entry",
  ]);
  if (
    !["reviewed", "unreviewed", "contested", "retracted"].includes(
      String(value.review_status),
    ) ||
    !["eligible", "ineligible"].includes(
      String(value.trust_policy_status),
    )
  ) {
    throw new Error("context_shadow_navigation_candidate_status_invalid");
  }
  const scope = value.candidate_scope;
  if (!isProtocolRecordV01(scope)) {
    throw new Error("context_shadow_navigation_candidate_scope_invalid");
  }
  if (scope.scope_kind === "canonical_project") {
    assertExactKeysV01(scope, ["scope_kind", "workspace_id", "project_id"]);
  } else {
    assertExactKeysV01(scope, ["scope_kind"]);
  }
  const entry = value.entry;
  if (!isProtocolRecordV01(entry)) {
    throw new Error("context_shadow_navigation_candidate_entry_invalid");
  }
  assertExactKeysV01(entry, [
    "entry_id",
    "entry_kind",
    "source_ref",
    "external_ref",
    "why_included",
    "currentness",
    "trust_class",
    "compatibility_source_ref",
    "bounded_summary",
  ]);
  if (
    !selectedEntryKinds.has(
      entry.entry_kind as TaskContextPacketSelectedEntryKindV01,
    )
  ) {
    throw new Error("context_shadow_navigation_candidate_entry_kind_invalid");
  }
  if (!trustClasses.has(String(entry.trust_class))) {
    throw new Error("context_shadow_navigation_candidate_trust_invalid");
  }
  const currentness = entry.currentness;
  if (!isProtocolRecordV01(currentness)) {
    throw new Error("context_shadow_navigation_candidate_currentness_invalid");
  }
  assertExactKeysV01(currentness, ["status", "as_of", "basis", "source_ref"]);
  if (!currentnessStatuses.has(String(currentness.status))) {
    throw new Error("context_shadow_navigation_candidate_currentness_invalid");
  }
  for (const ref of [
    entry.external_ref,
    entry.compatibility_source_ref,
    currentness.source_ref,
  ]) {
    if (ref !== null) validateExternalRefV01(ref);
  }
}

function validateExternalRefV01(value: unknown): void {
  const issues: string[] = [];
  validateExternalRefStructureV01(value, "$", {
    error: (code) => issues.push(code),
    warning: () => {},
  });
  if (issues.length > 0) {
    throw new Error("context_shadow_navigation_external_ref_invalid");
  }
}

function validatePacketBindingV01(value: unknown): void {
  if (!isProtocolRecordV01(value)) {
    throw new Error("context_shadow_navigation_packet_binding_invalid");
  }
  assertExactKeysV01(value, [
    "packet_version",
    "packet_id",
    "packet_fingerprint",
  ]);
  if (
    value.packet_version !== "task_context_packet.v0.1" ||
    !requireNonEmptyStringV01(value.packet_id) ||
    !/^sha256:[a-f0-9]{64}$/u.test(String(value.packet_fingerprint))
  ) {
    throw new Error("context_shadow_navigation_packet_binding_invalid");
  }
}

function assertSafeMaterialV01(value: unknown): void {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => issues.push(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in shadow navigation.",
      provider_specific_field_message:
        "Provider-specific identity is allowed only inside ExternalRef.",
    },
  );
  scanStringsV01(value, (text) => {
    if (
      /^(?:\/|[A-Za-z]:[\\/]|\\\\)/u.test(text) &&
      !/^\/api\//u.test(text)
    ) {
      issues.push("absolute_local_path");
    }
  });
  if (issues.length > 0) {
    throw new Error(
      `context_shadow_navigation_material_refused:${uniqueStringsV01(issues).join(",")}`,
    );
  }
}

function uniqueCandidatesV01(
  candidates: readonly PersonalPerspectiveContextCandidateV01[],
): PersonalPerspectiveContextCandidateV01[] {
  const unique = new Map<string, PersonalPerspectiveContextCandidateV01>();
  for (const candidate of candidates) {
    const key = canonicalizeProtocolValueV01(candidate);
    if (!unique.has(key)) unique.set(key, structuredClone(candidate));
  }
  return [...unique.values()].sort((left, right) =>
    compareProtocolCodeUnitsV01(
      canonicalizeProtocolValueV01(left),
      canonicalizeProtocolValueV01(right),
    ),
  );
}

function budgetExcludedEntryV01(
  entry: TaskContextPacketSelectedEntryV01,
): TaskContextPacketExcludedEntryV01 {
  return {
    entry_id: `personal-perspective-shadow-budget-excluded:${entry.entry_id}`,
    source_ref: entry.source_ref,
    external_ref: entry.external_ref ? structuredClone(entry.external_ref) : null,
    why_excluded: SHADOW_BUDGET_REASON,
    currentness: structuredClone(entry.currentness),
  };
}

function attributionRowIdentityKeyV01(
  row: ContextUseAttributionRowV01,
): string {
  return entryIdentityKeyV01({
    entry_id: row.entry_id,
    entry_kind: row.entry_kind,
    source_ref: row.source_ref,
    external_ref: row.external_ref,
    why_included: row.why_included,
    currentness: row.currentness,
    trust_class: row.trust_class,
    compatibility_source_ref: row.compatibility_source_ref,
    bounded_summary: row.bounded_summary,
  });
}

function entryIdentityKeyV01(
  entry: TaskContextPacketSelectedEntryV01,
): string {
  const normalizeRef = (ref: ExternalRefV01 | null) =>
    ref ? normalizeExternalRefPrimitiveV01(ref) : null;
  return canonicalizeProtocolValueV01({
    entry_id: entry.entry_id,
    entry_kind: entry.entry_kind,
    source_ref: entry.source_ref,
    external_ref: normalizeRef(entry.external_ref),
    compatibility_source_ref: normalizeRef(entry.compatibility_source_ref),
    currentness: {
      status: entry.currentness.status,
      as_of: entry.currentness.as_of,
      basis: entry.currentness.basis,
      source_ref: normalizeRef(entry.currentness.source_ref),
    },
    trust_class: entry.trust_class,
  });
}

function createAuthoritySummaryV01(): ContextShadowAuthoritySummaryV01 {
  return {
    is_canonical_core_record: false,
    is_task_context_packet: false,
    is_memory: false,
    is_evidence: false,
    is_policy: false,
    is_proposal: false,
    is_review_decision: false,
    is_transition: false,
    writes_database: false,
    mutates_source_records: false,
    mutates_task_context_packet: false,
    selects_product_context: false,
    activates_policy: false,
    authorizes_execution: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_actuation: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    notes: [
      "The current Personal Perspective selector and admitted TaskContextPacket remain product truth.",
      "Shadow navigation is derived, rebuildable research output and never enters product selected or excluded context.",
      "Later attribution evaluates only the frozen pair and cannot affect its selection.",
    ],
  };
}

function createMaterialBoundaryV01(): ContextShadowMaterialBoundaryV01 {
  return {
    bounded: true,
    max_candidates: PERSONAL_PERSPECTIVE_SHADOW_MAX_CANDIDATES_V01,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
  };
}

function integrityV01(): ContextShadowIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: CANONICALIZATION,
    fingerprint_scope: "object_without_integrity_fingerprint",
    fingerprint: PENDING_FINGERPRINT,
  };
}

function finalizeIdentityV01<T extends { integrity: ContextShadowIntegrityV01 }>(
  value: T,
  prefix: string,
): void {
  const record = value as unknown as Record<string, unknown> & {
    integrity: ContextShadowIntegrityV01;
  };
  const idField = Object.keys(record).find((key) => key.endsWith("_id"));
  if (!idField) throw new Error("context_shadow_navigation_identity_missing");
  const identityCopy = structuredClone(record);
  identityCopy[idField] = PENDING_ID;
  delete (
    identityCopy.integrity as Partial<ContextShadowIntegrityV01>
  ).fingerprint;
  record[idField] = idFromFingerprintV01(
    prefix,
    createProtocolSha256V01(canonicalizeProtocolValueV01(identityCopy)),
  );
  value.integrity.fingerprint = createFingerprintV01(value);
}

function deriveIdentityV01(
  value: { integrity: ContextShadowIntegrityV01 } & Record<string, unknown>,
  prefix: string,
): string {
  const idField = Object.keys(value).find((key) => key.endsWith("_id"));
  if (!idField) throw new Error("context_shadow_navigation_identity_missing");
  const copy = structuredClone(value);
  copy[idField] = PENDING_ID;
  delete (copy.integrity as Partial<ContextShadowIntegrityV01>).fingerprint;
  return idFromFingerprintV01(
    prefix,
    createProtocolSha256V01(canonicalizeProtocolValueV01(copy)),
  );
}

function createFingerprintV01(value: {
  integrity: ContextShadowIntegrityV01;
}): string {
  const copy = structuredClone(value) as typeof value;
  delete (copy.integrity as Partial<ContextShadowIntegrityV01>).fingerprint;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

function idFromFingerprintV01(prefix: string, fingerprint: string): string {
  return `${prefix}:${fingerprint.slice("sha256:".length, 38)}`;
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    throw new Error("context_shadow_navigation_unknown_field");
  }
}

function requireNonEmptyStringV01(value: unknown): boolean {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("context_shadow_navigation_string_invalid");
  }
  return true;
}

function scanStringsV01(value: unknown, visit: (text: string) => void): void {
  if (typeof value === "string") {
    visit(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => scanStringsV01(item, visit));
  } else if (isProtocolRecordV01(value)) {
    Object.values(value).forEach((item) => scanStringsV01(item, visit));
  }
}

function uniqueStringsV01(values: string[]): string[] {
  return [...new Set(values)].sort(compareProtocolCodeUnitsV01);
}
