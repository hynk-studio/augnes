import { createHash } from "node:crypto";

import type {
  LogicalClaimInferenceType,
  LogicalClaimReviewCue,
  LogicalClaimShapeAuthorityBoundary,
  LogicalClaimShapeCandidateReviewInput,
  LogicalClaimShapePreview,
  LogicalClaimShapePreviewBuilderInput,
  LogicalClaimShapePreviewReport,
  LogicalClaimShapeReasonCode,
  LogicalClaimShapeValidationResult,
  LogicalClaimStatus,
} from "../../types/research-candidate-logical-claim-shape";

type CandidateFamily = "claim" | "evidence" | "tension" | "knowledge_gap";

type CandidateCollectionKey = keyof LogicalClaimShapeCandidateReviewInput;

type CandidateFamilyConfig = {
  family: CandidateFamily;
  collectionKey: CandidateCollectionKey;
  idField: string;
};

type CandidateRecord = {
  family: CandidateFamily;
  id: string;
  object: Record<string, unknown>;
};

type CalibrationDiagnosticRecord = {
  candidateId: string;
  candidateFamily: string;
  object: Record<string, unknown>;
};

const shapeVersion = "logical_claim_shape_preview.v0.1" as const;
const shapeStatus = "structure_preview_only" as const;

const familyConfigs: CandidateFamilyConfig[] = [
  {
    family: "claim",
    collectionKey: "claim_candidates",
    idField: "claim_candidate_id",
  },
  {
    family: "evidence",
    collectionKey: "evidence_candidates",
    idField: "evidence_candidate_id",
  },
  {
    family: "tension",
    collectionKey: "tension_candidates",
    idField: "tension_candidate_id",
  },
  {
    family: "knowledge_gap",
    collectionKey: "knowledge_gap_candidates",
    idField: "knowledge_gap_candidate_id",
  },
];

const inferenceTypeValues: LogicalClaimInferenceType[] = [
  "direct_observation",
  "source_summary",
  "abductive_hypothesis",
  "analogy",
  "extrapolation",
  "operational_translation",
  "causal_claim",
  "comparison",
  "definition",
  "unknown",
];

const logicalStatusValues: LogicalClaimStatus[] = [
  "well_structured_candidate",
  "missing_premise",
  "missing_conclusion",
  "missing_source_grounding",
  "possible_non_sequitur",
  "contradicted_by_candidate",
  "underspecified",
  "blocked",
];

const reviewCueValues: LogicalClaimReviewCue[] = [
  "inspect_source",
  "add_premise",
  "clarify_conclusion",
  "state_missing_assumption",
  "resolve_counterclaim",
  "resolve_contradiction",
  "add_evidence",
  "defer",
  "no_action",
];

const reasonCodeValues: LogicalClaimShapeReasonCode[] = [
  "claim_text_present",
  "claim_text_missing",
  "source_ref_present",
  "source_ref_missing",
  "premise_present",
  "premise_missing",
  "conclusion_present",
  "conclusion_missing",
  "evidence_present",
  "evidence_missing",
  "counterclaim_present",
  "contradiction_present",
  "tension_present",
  "knowledge_gap_present",
  "missing_assumption_present",
  "calibration_blocked",
  "calibration_ready_with_tensions",
  "calibration_overclaim_risk",
  "structure_only_not_proof",
];

const forbiddenAuthorityFields = [
  "proof_check",
  "theorem_proving",
  "formal_verification",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "execution_authority",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

export function getLogicalClaimShapeAuthorityBoundary(): LogicalClaimShapeAuthorityBoundary {
  return {
    structure_preview_only: true,
    proof_check: false,
    theorem_proving: false,
    formal_verification: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    provider_openai_authority: false,
    source_fetch_authority: false,
    retrieval_rag_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function buildLogicalClaimShapePreviewReport(
  input: LogicalClaimShapePreviewBuilderInput,
): LogicalClaimShapePreviewReport {
  const candidateRecords = collectCandidateRecords(input.candidate_review);
  const claimRecords = candidateRecords.filter((candidate) => candidate.family === "claim");
  const evidenceRecords = candidateRecords.filter(
    (candidate) => candidate.family === "evidence",
  );
  const tensionRecords = candidateRecords.filter(
    (candidate) => candidate.family === "tension",
  );
  const knowledgeGapRecords = candidateRecords.filter(
    (candidate) => candidate.family === "knowledge_gap",
  );
  const calibrationDiagnostics = collectCalibrationDiagnostics(
    input.calibration_diagnostic?.diagnostics ?? [],
  );

  const claimShapes = claimRecords
    .map((claim) =>
      buildClaimShape({
        input,
        claim,
        claimRecords,
        evidenceRecords,
        tensionRecords,
        knowledgeGapRecords,
        calibrationDiagnostics,
      }),
    )
    .sort((left, right) =>
      left.claim_candidate_id.localeCompare(right.claim_candidate_id),
    );

  const logicalStatusCounts = createLogicalStatusCounts();
  const reviewCueCounts = createReviewCueCounts();
  const shapeQueue = {
    blocked: [] as string[],
    missing_premise: [] as string[],
    missing_conclusion: [] as string[],
    contradictions: [] as string[],
    ready_for_review: [] as string[],
  };

  for (const shape of claimShapes) {
    logicalStatusCounts[shape.logical_status] += 1;
    for (const cue of shape.review_cues) {
      reviewCueCounts[cue] += 1;
    }
    if (shape.logical_status === "blocked") {
      shapeQueue.blocked.push(shape.claim_candidate_id);
    }
    if (shape.logical_status === "missing_premise") {
      shapeQueue.missing_premise.push(shape.claim_candidate_id);
    }
    if (shape.logical_status === "missing_conclusion") {
      shapeQueue.missing_conclusion.push(shape.claim_candidate_id);
    }
    if (shape.logical_status === "contradicted_by_candidate") {
      shapeQueue.contradictions.push(shape.claim_candidate_id);
    }
    if (shape.logical_status === "well_structured_candidate") {
      shapeQueue.ready_for_review.push(shape.claim_candidate_id);
    }
  }

  shapeQueue.blocked.sort();
  shapeQueue.missing_premise.sort();
  shapeQueue.missing_conclusion.sort();
  shapeQueue.contradictions.sort();
  shapeQueue.ready_for_review.sort();

  const report: LogicalClaimShapePreviewReport = {
    shape_version: shapeVersion,
    scope: input.scope,
    status: shapeStatus,
    as_of: input.as_of,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    claim_shapes: claimShapes,
    logical_status_counts: logicalStatusCounts,
    review_cue_counts: reviewCueCounts,
    shape_queue: shapeQueue,
    boundary_notes: [
      "Logical Claim Shape Preview is structure-only.",
      "Calibration Diagnostic is input signal, not truth.",
      "Missing premise is a review cue, not rejection.",
      "Contradiction is preserved as tension, not deletion.",
      "Logical status is not proof status.",
      "Review cues are not execution authority.",
      "Shape summary is explanation, not authority.",
      "Product-write remains parked by #686.",
    ].sort(),
    shape_fingerprint: "",
    authority_boundary: getLogicalClaimShapeAuthorityBoundary(),
  };

  return {
    ...report,
    shape_fingerprint: createLogicalClaimShapeFingerprint(report),
  };
}

export function validateLogicalClaimShapePreviewReport(
  report: LogicalClaimShapePreviewReport,
): LogicalClaimShapeValidationResult {
  const failureCodes: string[] = [];
  if (report.shape_version !== shapeVersion) {
    failureCodes.push("invalid_shape_version");
  }
  if (report.status !== shapeStatus) {
    failureCodes.push("invalid_status");
  }
  if (!report.scope) {
    failureCodes.push("empty_scope");
  }
  if (!Array.isArray(report.claim_shapes) || report.claim_shapes.length === 0) {
    failureCodes.push("empty_claim_shapes");
  }
  if (!report.shape_fingerprint) {
    failureCodes.push("empty_shape_fingerprint");
  } else if (report.shape_fingerprint !== createLogicalClaimShapeFingerprint(report)) {
    failureCodes.push("shape_fingerprint_mismatch");
  }
  failureCodes.push(
    ...validateAuthorityBoundary(report.authority_boundary, "report_authority_boundary"),
  );

  const seenClaimIds = new Set<string>();
  for (const shape of report.claim_shapes ?? []) {
    const claimId = shape.claim_candidate_id;
    if (seenClaimIds.has(claimId)) {
      failureCodes.push(`duplicate_claim_candidate_id:${claimId}`);
    }
    seenClaimIds.add(claimId);
    if (!logicalStatusValues.includes(shape.logical_status)) {
      failureCodes.push(`invalid_logical_status:${claimId}`);
    }
    for (const cue of shape.review_cues ?? []) {
      if (!reviewCueValues.includes(cue)) {
        failureCodes.push(`invalid_review_cue:${claimId}:${cue}`);
      }
    }
    for (const reasonCode of shape.reason_codes ?? []) {
      if (!reasonCodeValues.includes(reasonCode)) {
        failureCodes.push(`invalid_reason_code:${claimId}:${reasonCode}`);
      }
    }
    if (
      shape.source_refs.length === 0 &&
      !shape.source_coverage_boundary_note &&
      !shape.reason_codes.includes("source_ref_missing")
    ) {
      failureCodes.push(`missing_source_ref_reason:${claimId}`);
    }
    if (
      shape.logical_status === "well_structured_candidate" &&
      !shape.reason_codes.includes("premise_present")
    ) {
      failureCodes.push(`well_structured_without_premise:${claimId}`);
    }
    if (
      shape.logical_status === "well_structured_candidate" &&
      !shape.reason_codes.includes("conclusion_present")
    ) {
      failureCodes.push(`well_structured_without_conclusion:${claimId}`);
    }
    if (
      shape.logical_status === "well_structured_candidate" &&
      shape.reason_codes.includes("contradiction_present")
    ) {
      failureCodes.push(`well_structured_with_contradiction:${claimId}`);
    }
    if (forbiddenShapeSummaryPattern.test(shape.shape_summary)) {
      failureCodes.push(`forbidden_shape_summary_authority:${claimId}`);
    }
    failureCodes.push(
      ...validateAuthorityBoundary(
        shape.authority_boundary,
        `shape_authority_boundary:${claimId}`,
      ),
    );
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes.sort(),
  };
}

export function createLogicalClaimShapeFingerprint(
  report: LogicalClaimShapePreviewReport,
): string {
  const { shape_fingerprint: _fingerprint, ...hashInput } = report;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function buildClaimShape(args: {
  input: LogicalClaimShapePreviewBuilderInput;
  claim: CandidateRecord;
  claimRecords: CandidateRecord[];
  evidenceRecords: CandidateRecord[];
  tensionRecords: CandidateRecord[];
  knowledgeGapRecords: CandidateRecord[];
  calibrationDiagnostics: CalibrationDiagnosticRecord[];
}): LogicalClaimShapePreview {
  const {
    input,
    claim,
    claimRecords,
    evidenceRecords,
    tensionRecords,
    knowledgeGapRecords,
    calibrationDiagnostics,
  } = args;
  const calibration = calibrationDiagnostics.find(
    (diagnostic) =>
      diagnostic.candidateId === claim.id && diagnostic.candidateFamily === "claim",
  );
  const calibrationReasonCodes = uniqueSorted(
    stringArrayField(calibration?.object ?? {}, "readiness_reason_codes"),
  );
  const calibrationRiskFlags = uniqueSorted(
    stringArrayField(calibration?.object ?? {}, "risk_flags"),
  );
  const calibrationReadinessLabel = stringField(
    calibration?.object ?? {},
    "readiness_label",
  );
  const sourceRefs = uniqueSorted([
    ...candidateSourceRefs(claim.object),
    ...stringArrayField(calibration?.object ?? {}, "source_refs"),
  ]);
  const sourceCoverageBoundaryNote =
    stringField(claim.object, "source_coverage_boundary_note") ??
    stringField(calibration?.object ?? {}, "source_coverage_boundary_note");
  const claimText = claimTextForClaim(claim.object);
  const conclusionText = conclusionTextForClaim(claim.object);
  const inferenceType = inferenceTypeForClaim(claim.object);
  const evidencePremises = evidencePremiseSummaries(claim, evidenceRecords);
  const claimPremises = claimPremiseSummaries(claim, claimRecords);
  const premiseCandidateIds = uniqueSorted([
    ...claimPremises.ids,
    ...evidencePremises.ids,
  ]);
  const premiseSummaries = uniqueSorted([
    ...stringArrayField(claim.object, "premise_summaries"),
    ...evidencePremises.summaries,
    ...claimPremises.summaries,
  ]);
  const evidencePresent = evidencePremises.ids.length > 0;
  const possibleCounterclaimCandidateIds = uniqueSorted([
    ...stringArrayField(claim.object, "possible_counterclaim_candidate_ids"),
    ...stringArrayField(claim.object, "counterclaim_candidate_ids"),
    ...stringArrayField(claim.object, "contradicting_claim_candidate_ids"),
  ]);
  const relatedTensionCandidateIds = relatedTensionIdsForClaim(claim, tensionRecords);
  const contradictionCandidateIds = contradictionIdsForClaim({
    claim,
    tensionRecords,
    calibrationReasonCodes,
    calibrationRiskFlags,
  });
  const relatedKnowledgeGapCandidateIds = relatedKnowledgeGapIdsForClaim(
    claim,
    knowledgeGapRecords,
    calibrationReasonCodes,
  );
  const missingAssumptionNotes = missingAssumptionNotesForClaim({
    claim,
    hasPremise: premiseCandidateIds.length > 0 || premiseSummaries.length > 0,
    hasConclusion: conclusionText.length > 0,
  });
  const logicalStatus = chooseLogicalStatus({
    sourceRefs,
    sourceCoverageBoundaryNote,
    claimText,
    conclusionText,
    premiseCandidateIds,
    premiseSummaries,
    contradictionCandidateIds,
    calibrationReasonCodes,
    calibrationRiskFlags,
    missingAssumptionNotes,
    evidencePresent,
  });
  const reviewCues = buildReviewCues({
    logicalStatus,
    possibleCounterclaimCandidateIds,
    calibrationReadinessLabel,
    calibrationReasonCodes,
  });
  const reasonCodes = buildReasonCodes({
    sourceRefs,
    claimText,
    conclusionText,
    premiseCandidateIds,
    premiseSummaries,
    evidencePresent,
    possibleCounterclaimCandidateIds,
    contradictionCandidateIds,
    relatedTensionCandidateIds,
    relatedKnowledgeGapCandidateIds,
    missingAssumptionNotes,
    calibrationReadinessLabel,
    calibrationReasonCodes,
  });

  return {
    shape_version: shapeVersion,
    scope: input.scope,
    status: shapeStatus,
    as_of: input.as_of,
    claim_candidate_id: claim.id,
    source_refs: sourceRefs,
    ...(sourceCoverageBoundaryNote
      ? { source_coverage_boundary_note: sourceCoverageBoundaryNote }
      : {}),
    claim_text: claimText,
    inference_type: inferenceType,
    premise_candidate_ids: premiseCandidateIds,
    premise_summaries: premiseSummaries,
    conclusion_text: conclusionText,
    missing_assumption_notes: missingAssumptionNotes,
    possible_counterclaim_candidate_ids: possibleCounterclaimCandidateIds,
    contradiction_candidate_ids: contradictionCandidateIds,
    related_tension_candidate_ids: relatedTensionCandidateIds,
    related_knowledge_gap_candidate_ids: relatedKnowledgeGapCandidateIds,
    ...(calibration
      ? { calibration_ref: `calibration:${calibration.candidateId}` }
      : {}),
    ...(calibrationReadinessLabel
      ? { calibration_readiness_label: calibrationReadinessLabel }
      : {}),
    calibration_reason_codes: calibrationReasonCodes,
    logical_status: logicalStatus,
    review_cues: reviewCues,
    reason_codes: reasonCodes,
    shape_summary: createShapeSummary(claim.id, logicalStatus, reviewCues),
    authority_boundary: getLogicalClaimShapeAuthorityBoundary(),
  };
}

function chooseLogicalStatus(args: {
  sourceRefs: string[];
  sourceCoverageBoundaryNote?: string;
  claimText: string;
  conclusionText: string;
  premiseCandidateIds: string[];
  premiseSummaries: string[];
  contradictionCandidateIds: string[];
  calibrationReasonCodes: string[];
  calibrationRiskFlags: string[];
  missingAssumptionNotes: string[];
  evidencePresent: boolean;
}): LogicalClaimStatus {
  if (args.sourceRefs.length === 0 && !args.sourceCoverageBoundaryNote) {
    return "blocked";
  }
  if (args.calibrationReasonCodes.includes("lifecycle_blocked")) {
    return "blocked";
  }
  if (args.claimText.length === 0) return "underspecified";
  if (args.conclusionText.length === 0) return "missing_conclusion";
  if (args.premiseCandidateIds.length === 0 && args.premiseSummaries.length === 0) {
    return "missing_premise";
  }
  if (
    args.contradictionCandidateIds.length > 0 ||
    args.calibrationReasonCodes.includes("contradiction_present") ||
    args.calibrationReasonCodes.includes("unresolved_tension_present") ||
    args.calibrationRiskFlags.includes("contradiction_or_tension")
  ) {
    return "contradicted_by_candidate";
  }
  if (
    args.conclusionText.length > 0 &&
    args.premiseCandidateIds.length === 0 &&
    !args.evidencePresent
  ) {
    return "possible_non_sequitur";
  }
  if (args.missingAssumptionNotes.length > 0) return "underspecified";
  return "well_structured_candidate";
}

function buildReviewCues(args: {
  logicalStatus: LogicalClaimStatus;
  possibleCounterclaimCandidateIds: string[];
  calibrationReadinessLabel?: string;
  calibrationReasonCodes: string[];
}): LogicalClaimReviewCue[] {
  const cues = new Set<LogicalClaimReviewCue>();
  if (args.logicalStatus === "blocked") cues.add("inspect_source");
  if (args.logicalStatus === "missing_conclusion") cues.add("clarify_conclusion");
  if (args.logicalStatus === "missing_premise") cues.add("add_premise");
  if (args.logicalStatus === "possible_non_sequitur") {
    cues.add("state_missing_assumption");
  }
  if (args.logicalStatus === "underspecified") {
    cues.add("state_missing_assumption");
  }
  if (args.logicalStatus === "contradicted_by_candidate") {
    cues.add("resolve_contradiction");
    if (args.possibleCounterclaimCandidateIds.length > 0) {
      cues.add("resolve_counterclaim");
    }
  }
  if (args.calibrationReadinessLabel === "blocked") cues.add("inspect_source");
  if (
    args.calibrationReadinessLabel === "ready_with_tensions" &&
    args.calibrationReasonCodes.includes("unresolved_tension_present")
  ) {
    cues.add("resolve_contradiction");
  }
  if (args.calibrationReasonCodes.includes("readiness_overclaim_risk")) {
    cues.add("add_evidence");
    cues.add("state_missing_assumption");
  }
  if (args.calibrationReasonCodes.includes("evidence_missing")) {
    cues.add("add_evidence");
  }
  if (args.calibrationReasonCodes.includes("source_ref_missing")) {
    cues.add("inspect_source");
  }
  if (args.calibrationReasonCodes.includes("knowledge_gap_present")) {
    cues.add("add_evidence");
  }
  if (args.logicalStatus === "well_structured_candidate" && cues.size === 0) {
    cues.add("no_action");
  }
  return Array.from(cues).sort() as LogicalClaimReviewCue[];
}

function buildReasonCodes(args: {
  sourceRefs: string[];
  claimText: string;
  conclusionText: string;
  premiseCandidateIds: string[];
  premiseSummaries: string[];
  evidencePresent: boolean;
  possibleCounterclaimCandidateIds: string[];
  contradictionCandidateIds: string[];
  relatedTensionCandidateIds: string[];
  relatedKnowledgeGapCandidateIds: string[];
  missingAssumptionNotes: string[];
  calibrationReadinessLabel?: string;
  calibrationReasonCodes: string[];
}): LogicalClaimShapeReasonCode[] {
  return uniqueSorted([
    args.claimText.length > 0 ? "claim_text_present" : "claim_text_missing",
    args.sourceRefs.length > 0 ? "source_ref_present" : "source_ref_missing",
    args.premiseCandidateIds.length > 0 || args.premiseSummaries.length > 0
      ? "premise_present"
      : "premise_missing",
    args.conclusionText.length > 0 ? "conclusion_present" : "conclusion_missing",
    args.evidencePresent ||
    args.calibrationReasonCodes.includes("evidence_present")
      ? "evidence_present"
      : "evidence_missing",
    ...(args.possibleCounterclaimCandidateIds.length > 0
      ? ["counterclaim_present"]
      : []),
    ...(args.contradictionCandidateIds.length > 0 ||
    args.calibrationReasonCodes.includes("contradiction_present")
      ? ["contradiction_present"]
      : []),
    ...(args.relatedTensionCandidateIds.length > 0 ||
    args.calibrationReasonCodes.includes("unresolved_tension_present")
      ? ["tension_present"]
      : []),
    ...(args.relatedKnowledgeGapCandidateIds.length > 0 ||
    args.calibrationReasonCodes.includes("knowledge_gap_present")
      ? ["knowledge_gap_present"]
      : []),
    ...(args.missingAssumptionNotes.length > 0
      ? ["missing_assumption_present"]
      : []),
    ...(args.calibrationReadinessLabel === "blocked" ? ["calibration_blocked"] : []),
    ...(args.calibrationReadinessLabel === "ready_with_tensions"
      ? ["calibration_ready_with_tensions"]
      : []),
    ...(args.calibrationReasonCodes.includes("readiness_overclaim_risk")
      ? ["calibration_overclaim_risk"]
      : []),
    "structure_only_not_proof",
  ] as LogicalClaimShapeReasonCode[]);
}

function collectCandidateRecords(
  candidateReview: LogicalClaimShapeCandidateReviewInput,
): CandidateRecord[] {
  return familyConfigs.flatMap((config) =>
    (candidateReview[config.collectionKey] ?? [])
      .map((candidate) => asRecord(candidate))
      .filter(isPresent)
      .map((candidate) => ({
        family: config.family,
        id: candidateId(candidate, config.idField),
        object: candidate,
      }))
      .filter((candidate) => candidate.id.length > 0),
  );
}

function collectCalibrationDiagnostics(values: unknown[]): CalibrationDiagnosticRecord[] {
  return values
    .map((value) => asRecord(value))
    .filter(isPresent)
    .map((diagnostic) => ({
      candidateId: stringField(diagnostic, "candidate_id") ?? "",
      candidateFamily: stringField(diagnostic, "candidate_family") ?? "",
      object: diagnostic,
    }))
    .filter(
      (diagnostic) =>
        diagnostic.candidateId.length > 0 && diagnostic.candidateFamily.length > 0,
    );
}

function candidateId(candidate: Record<string, unknown>, idField: string): string {
  return (
    stringField(candidate, idField) ??
    stringField(candidate, "candidate_id") ??
    stringField(candidate, "id") ??
    ""
  );
}

function candidateSourceRefs(candidate: Record<string, unknown>): string[] {
  return uniqueSorted([
    ...stringArrayField(candidate, "source_refs"),
    ...stringArrayField(candidate, "source_ref_ids"),
    ...optionalStringArray(stringField(candidate, "source_ref_id")),
  ]);
}

function claimTextForClaim(claim: Record<string, unknown>): string {
  return (
    stringField(claim, "claim_text") ??
    stringField(claim, "summary") ??
    stringField(claim, "candidate_summary") ??
    stringField(claim, "proposed_update_summary") ??
    ""
  );
}

function conclusionTextForClaim(claim: Record<string, unknown>): string {
  return (
    stringField(claim, "conclusion_text") ??
    stringField(claim, "claim_text") ??
    stringField(claim, "proposed_update_summary") ??
    stringField(claim, "after_summary") ??
    ""
  );
}

function inferenceTypeForClaim(claim: Record<string, unknown>): LogicalClaimInferenceType {
  const explicitInferenceType = stringField(claim, "inference_type");
  if (
    explicitInferenceType &&
    inferenceTypeValues.includes(explicitInferenceType as LogicalClaimInferenceType)
  ) {
    return explicitInferenceType as LogicalClaimInferenceType;
  }
  const claimType = stringField(claim, "claim_type") ?? "";
  const epistemicStatus = stringField(claim, "epistemic_status") ?? "";
  if (claimType === "observation" || claimType === "direct_observation") {
    return "direct_observation";
  }
  if (claimType === "summary" || claimType === "source_summary") {
    return "source_summary";
  }
  if (claimType === "hypothesis" || epistemicStatus === "hypothesis_only") {
    return "abductive_hypothesis";
  }
  if (claimType === "analogy") return "analogy";
  if (claimType === "extrapolation") return "extrapolation";
  if (claimType === "operational_translation") return "operational_translation";
  if (claimType === "causal" || claimType === "causal_claim") return "causal_claim";
  if (claimType === "comparison") return "comparison";
  if (claimType === "definition") return "definition";
  return "unknown";
}

function evidencePremiseSummaries(
  claim: CandidateRecord,
  evidenceRecords: CandidateRecord[],
): { ids: string[]; summaries: string[] } {
  const explicitEvidenceIds = new Set([
    ...stringArrayField(claim.object, "premise_candidate_ids"),
    ...stringArrayField(claim.object, "basis_evidence_candidate_ids"),
    ...stringArrayField(claim.object, "supporting_evidence_candidate_ids"),
    ...stringArrayField(claim.object, "related_evidence_candidate_ids"),
  ]);
  const linkedEvidence = evidenceRecords.filter(
    (evidence) =>
      !evidenceIsContradicting(evidence) &&
      (explicitEvidenceIds.has(evidence.id) || evidenceLinksClaim(evidence, claim.id)),
  );
  return {
    ids: uniqueSorted(linkedEvidence.map((evidence) => evidence.id)),
    summaries: uniqueSorted(
      linkedEvidence
        .map((evidence) => evidencePremiseSummary(evidence.object))
        .filter(isPresent),
    ),
  };
}

function claimPremiseSummaries(
  claim: CandidateRecord,
  claimRecords: CandidateRecord[],
): { ids: string[]; summaries: string[] } {
  const premiseClaimIds = new Set([
    ...stringArrayField(claim.object, "premise_candidate_ids"),
    ...stringArrayField(claim.object, "premise_claim_candidate_ids"),
    ...stringArrayField(claim.object, "basis_claim_candidate_ids"),
    ...stringArrayField(claim.object, "supporting_claim_candidate_ids"),
  ]);
  const linkedClaims = claimRecords.filter(
    (candidate) => candidate.id !== claim.id && premiseClaimIds.has(candidate.id),
  );
  return {
    ids: uniqueSorted(linkedClaims.map((candidate) => candidate.id)),
    summaries: uniqueSorted(
      linkedClaims
        .map((candidate) => claimTextForClaim(candidate.object))
        .filter((value) => value.length > 0),
    ),
  };
}

function evidencePremiseSummary(
  evidence: Record<string, unknown>,
): string | undefined {
  const explicitSummary =
    stringField(evidence, "evidence_summary") ??
    stringField(evidence, "quality_note") ??
    stringField(evidence, "summary");
  if (explicitSummary) return explicitSummary;
  const locator =
    stringField(evidence, "locator") ??
    stringField(evidence, "source_locator") ??
    stringField(evidence, "source_locator_ref") ??
    stringField(evidence, "quote_locator") ??
    stringField(evidence, "evidence_locator");
  if (locator) return `Evidence locator ${locator}`;
  const sourceRef =
    stringField(evidence, "source_ref_id") ??
    stringArrayField(evidence, "source_refs")[0] ??
    stringArrayField(evidence, "source_ref_ids")[0];
  return sourceRef ? `Evidence source ${sourceRef}` : undefined;
}

function evidenceLinksClaim(evidence: CandidateRecord, claimId: string): boolean {
  return (
    stringField(evidence.object, "claim_candidate_id") === claimId ||
    stringArrayField(evidence.object, "related_claim_candidate_ids").includes(claimId) ||
    stringArrayField(evidence.object, "claim_candidate_ids").includes(claimId)
  );
}

function evidenceIsContradicting(evidence: CandidateRecord): boolean {
  const evidenceRole =
    stringField(evidence.object, "evidence_role") ??
    stringField(evidence.object, "role") ??
    "";
  return evidenceRole === "contradicts" || evidenceRole === "contradicting";
}

function relatedTensionIdsForClaim(
  claim: CandidateRecord,
  tensionRecords: CandidateRecord[],
): string[] {
  return uniqueSorted([
    ...stringArrayField(claim.object, "related_tension_candidate_ids"),
    ...tensionRecords
      .filter((tension) =>
        stringArrayField(tension.object, "related_claim_candidate_ids").includes(claim.id),
      )
      .map((tension) => tension.id),
  ]);
}

function contradictionIdsForClaim(args: {
  claim: CandidateRecord;
  tensionRecords: CandidateRecord[];
  calibrationReasonCodes: string[];
  calibrationRiskFlags: string[];
}): string[] {
  return uniqueSorted([
    ...stringArrayField(args.claim.object, "contradicting_claim_candidate_ids"),
    ...stringArrayField(args.claim.object, "contradicting_evidence_candidate_ids"),
    ...args.tensionRecords
      .filter(
        (tension) =>
          stringField(tension.object, "tension_type") === "contradiction" &&
          stringArrayField(tension.object, "related_claim_candidate_ids").includes(
            args.claim.id,
          ),
      )
      .map((tension) => tension.id),
    ...(args.calibrationReasonCodes.includes("contradiction_present") ||
    args.calibrationRiskFlags.includes("contradiction_or_tension")
      ? optionalStringArray("calibration:contradiction_or_tension")
      : []),
  ]);
}

function relatedKnowledgeGapIdsForClaim(
  claim: CandidateRecord,
  knowledgeGapRecords: CandidateRecord[],
  calibrationReasonCodes: string[],
): string[] {
  return uniqueSorted([
    ...stringArrayField(claim.object, "related_gap_candidate_ids"),
    ...stringArrayField(claim.object, "related_knowledge_gap_candidate_ids"),
    ...knowledgeGapRecords
      .filter((gap) =>
        stringArrayField(gap.object, "related_claim_candidate_ids").includes(claim.id),
      )
      .map((gap) => gap.id),
    ...(calibrationReasonCodes.includes("knowledge_gap_present")
      ? optionalStringArray("calibration:knowledge_gap")
      : []),
  ]);
}

function missingAssumptionNotesForClaim(args: {
  claim: CandidateRecord;
  hasPremise: boolean;
  hasConclusion: boolean;
}): string[] {
  const explicitNotes = uniqueSorted([
    ...stringArrayField(args.claim.object, "missing_assumption_notes"),
    ...stringArrayField(args.claim.object, "assumption_gaps"),
    ...stringArrayField(args.claim.object, "unresolved_assumptions"),
  ]);
  if (explicitNotes.length > 0) return explicitNotes;
  if (!args.hasPremise || !args.hasConclusion) {
    return [
      "No explicit assumption notes were supplied; operator review should inspect whether the conclusion follows from the listed premises.",
    ];
  }
  return [];
}

function createLogicalStatusCounts(): Record<LogicalClaimStatus, number> {
  return Object.fromEntries(logicalStatusValues.map((status) => [status, 0])) as Record<
    LogicalClaimStatus,
    number
  >;
}

function createReviewCueCounts(): Record<LogicalClaimReviewCue, number> {
  return Object.fromEntries(reviewCueValues.map((cue) => [cue, 0])) as Record<
    LogicalClaimReviewCue,
    number
  >;
}

function createShapeSummary(
  claimId: string,
  logicalStatus: LogicalClaimStatus,
  reviewCues: LogicalClaimReviewCue[],
): string {
  const cueText = reviewCues.length > 0 ? reviewCues.join(", ") : "none";
  return `Logical shape cue for claim ${claimId}: logical_status=${logicalStatus}; review_cues=${cueText}; structure-only explanation for operator review.`;
}

function validateAuthorityBoundary(
  boundary: LogicalClaimShapeAuthorityBoundary,
  prefix: string,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.structure_preview_only !== true) {
    failureCodes.push(`${prefix}:not_structure_preview_only`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (boundary?.[field] !== false) {
      failureCodes.push(`${prefix}:forbidden_authority:${field}`);
    }
  }
  return failureCodes;
}

const forbiddenShapeSummaryPattern =
  /\bproof\b|\bproven\b|\btheorem\b|verified truth|\bpromoted\b|evidence record created|state committed|product write|\btruth\b/i;

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(null);
}

function stringField(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function stringArrayField(record: Record<string, unknown>, field: string): string[] {
  const value = record[field];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function optionalStringArray(value: string | undefined): string[] {
  return value ? [value] : [];
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter((value) => value.length > 0))).sort();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
