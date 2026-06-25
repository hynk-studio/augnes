import { createHash } from "node:crypto";

import type {
  ResearchCandidateFamily,
  ResearchCandidateLifecycleAuthorityBoundary,
  ResearchCandidateLifecycleBuilderInput,
  ResearchCandidateLifecycleCandidateReviewInput,
  ResearchCandidateLifecycleFeedbackEvent,
  ResearchCandidateLifecycleHandoffRef,
  ResearchCandidateLifecyclePacketRef,
  ResearchCandidateLifecycleReadModel,
  ResearchCandidateLifecycleStatusLabel,
  ResearchCandidateLifecycleSummary,
  ResearchCandidateLifecycleValidationResult,
  ResearchCandidateNextReviewAction,
} from "../../types/research-candidate-lifecycle";

type CandidateCollectionKey = keyof ResearchCandidateLifecycleCandidateReviewInput;

type CandidateFamilyConfig = {
  family: ResearchCandidateFamily;
  collectionKey: CandidateCollectionKey;
  idField: string;
};

type CandidateRecord = {
  family: ResearchCandidateFamily;
  id: string;
  object: Record<string, unknown>;
};

const lifecycleVersion = "research_candidate_lifecycle.v0.1" as const;
const lifecycleStatus = "derived_read_model_only" as const;

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
  {
    family: "perspective_delta",
    collectionKey: "perspective_delta_candidates",
    idField: "perspective_delta_candidate_id",
  },
  {
    family: "follow_up_work",
    collectionKey: "follow_up_work_candidates",
    idField: "follow_up_work_candidate_id",
  },
];

const familyValues: ResearchCandidateFamily[] = [
  "claim",
  "evidence",
  "tension",
  "knowledge_gap",
  "perspective_delta",
  "follow_up_work",
];

const lifecycleStatusValues: ResearchCandidateLifecycleStatusLabel[] = [
  "new_candidate",
  "needs_review",
  "operator_corrected",
  "operator_pinned",
  "operator_dismissed",
  "invalidated",
  "superseded",
  "stale",
  "ready_for_review",
  "blocked",
];

const nextReviewActionValues: ResearchCandidateNextReviewAction[] = [
  "inspect_source",
  "resolve_tension",
  "add_evidence",
  "review_feedback",
  "prepare_handoff",
  "defer",
  "reject_candidate",
  "no_action",
];

const forbiddenAuthorityFields = [
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

export function getResearchCandidateLifecycleAuthorityBoundary(): ResearchCandidateLifecycleAuthorityBoundary {
  return {
    derived_read_model_only: true,
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

export function buildResearchCandidateLifecycleReadModel(
  input: ResearchCandidateLifecycleBuilderInput,
): ResearchCandidateLifecycleReadModel {
  const candidateRecords = collectCandidateRecords(input.candidate_review);
  const tensionRecords = candidateRecords.filter(
    (candidate) => candidate.family === "tension",
  );
  const knowledgeGapRecords = candidateRecords.filter(
    (candidate) => candidate.family === "knowledge_gap",
  );
  const feedbackEvents = sortFeedbackEvents(input.feedback_events ?? []);
  const packetRefs = [...(input.packet_refs ?? [])];
  const handoffRefs = [...(input.handoff_refs ?? [])];

  const candidateSummaries = candidateRecords
    .map((candidate) =>
      buildCandidateSummary({
        input,
        candidate,
        tensionRecords,
        knowledgeGapRecords,
        feedbackEvents,
        packetRefs,
        handoffRefs,
      }),
    )
    .sort((left, right) =>
      left.candidate_family.localeCompare(right.candidate_family) ||
      left.candidate_id.localeCompare(right.candidate_id),
    );

  const familyCounts = createFamilyCounts();
  const lifecycleStatusCounts = createLifecycleStatusCounts();
  const reviewQueue = {
    needs_review: [] as string[],
    blocked: [] as string[],
    stale: [] as string[],
    ready_for_review: [] as string[],
  };

  for (const summary of candidateSummaries) {
    familyCounts[summary.candidate_family] += 1;
    lifecycleStatusCounts[summary.lifecycle_status] += 1;
    if (summary.lifecycle_status === "needs_review") {
      reviewQueue.needs_review.push(summary.candidate_id);
    }
    if (summary.lifecycle_status === "blocked") {
      reviewQueue.blocked.push(summary.candidate_id);
    }
    if (summary.lifecycle_status === "stale") {
      reviewQueue.stale.push(summary.candidate_id);
    }
    if (summary.lifecycle_status === "ready_for_review") {
      reviewQueue.ready_for_review.push(summary.candidate_id);
    }
  }

  reviewQueue.needs_review.sort();
  reviewQueue.blocked.sort();
  reviewQueue.stale.sort();
  reviewQueue.ready_for_review.sort();

  const model: ResearchCandidateLifecycleReadModel = {
    lifecycle_version: lifecycleVersion,
    scope: input.scope,
    status: lifecycleStatus,
    as_of: input.as_of,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    candidate_summaries: candidateSummaries,
    family_counts: familyCounts,
    lifecycle_status_counts: lifecycleStatusCounts,
    review_queue: reviewQueue,
    boundary_notes: [
      "Candidate lifecycle is a derived read model only.",
      "Feedback is operator signal, not truth.",
      "Dismissed is not rejected.",
      "Pinned is not promoted.",
      "Invalidated is not proof.",
      "Ready for review is not promotion.",
      "next_review_action is a review cue, not execution authority.",
      "Product-write remains parked by #686.",
    ].sort(),
    lifecycle_fingerprint: "",
    authority_boundary: getResearchCandidateLifecycleAuthorityBoundary(),
  };

  return {
    ...model,
    lifecycle_fingerprint: createResearchCandidateLifecycleFingerprint(model),
  };
}

export function validateResearchCandidateLifecycleReadModel(
  model: ResearchCandidateLifecycleReadModel,
): ResearchCandidateLifecycleValidationResult {
  const failureCodes: string[] = [];
  if (model.lifecycle_version !== lifecycleVersion) {
    failureCodes.push("invalid_lifecycle_version");
  }
  if (model.status !== lifecycleStatus) {
    failureCodes.push("invalid_status");
  }
  if (!model.scope) {
    failureCodes.push("empty_scope");
  }
  if (!Array.isArray(model.candidate_summaries) || model.candidate_summaries.length === 0) {
    failureCodes.push("empty_candidate_summaries");
  }
  if (!model.lifecycle_fingerprint) {
    failureCodes.push("empty_lifecycle_fingerprint");
  }
  if (model.lifecycle_fingerprint) {
    const expectedFingerprint = createResearchCandidateLifecycleFingerprint(model);
    if (model.lifecycle_fingerprint !== expectedFingerprint) {
      failureCodes.push("lifecycle_fingerprint_mismatch");
    }
  }
  failureCodes.push(
    ...validateAuthorityBoundary(model.authority_boundary, "model_authority_boundary"),
  );

  const seenCandidateKeys = new Set<string>();
  for (const summary of model.candidate_summaries ?? []) {
    const candidateKey = `${summary.candidate_family}:${summary.candidate_id}`;
    if (seenCandidateKeys.has(candidateKey)) {
      failureCodes.push(`duplicate_candidate:${candidateKey}`);
    }
    seenCandidateKeys.add(candidateKey);
    if (
      (!Array.isArray(summary.source_refs) || summary.source_refs.length === 0) &&
      !summary.source_coverage_boundary_note
    ) {
      failureCodes.push(`missing_source_boundary:${candidateKey}`);
    }
    failureCodes.push(
      ...validateAuthorityBoundary(
        summary.authority_boundary,
        `summary_authority_boundary:${candidateKey}`,
      ),
    );
    if (
      summary.lifecycle_status === "operator_pinned" &&
      /promot(?:ed|ion)/i.test(summarySemanticText(summary))
    ) {
      failureCodes.push(`pinned_marked_promoted:${candidateKey}`);
    }
    if (
      summary.lifecycle_status === "operator_dismissed" &&
      /reject(?:ed|ion)?/i.test(summarySemanticText(summary))
    ) {
      failureCodes.push(`dismissed_marked_rejected:${candidateKey}`);
    }
    if (
      summary.lifecycle_status === "invalidated" &&
      /proof|evidence record/i.test(summarySemanticText(summary))
    ) {
      failureCodes.push(`invalidated_marked_proof_or_evidence:${candidateKey}`);
    }
    if (!nextReviewActionValues.includes(summary.next_review_action)) {
      failureCodes.push(`invalid_next_review_action:${candidateKey}`);
    }
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes.sort(),
  };
}

export function createResearchCandidateLifecycleFingerprint(
  model: ResearchCandidateLifecycleReadModel,
): string {
  const { lifecycle_fingerprint: _fingerprint, ...hashInput } = model;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function buildCandidateSummary(args: {
  input: ResearchCandidateLifecycleBuilderInput;
  candidate: CandidateRecord;
  tensionRecords: CandidateRecord[];
  knowledgeGapRecords: CandidateRecord[];
  feedbackEvents: ResearchCandidateLifecycleFeedbackEvent[];
  packetRefs: ResearchCandidateLifecyclePacketRef[];
  handoffRefs: ResearchCandidateLifecycleHandoffRef[];
}): ResearchCandidateLifecycleSummary {
  const {
    input,
    candidate,
    tensionRecords,
    knowledgeGapRecords,
    feedbackEvents,
    packetRefs,
    handoffRefs,
  } = args;
  const relatedFeedbackEvents = feedbackEvents.filter(
    (event) => feedbackEventTargetsCandidate(event, candidate),
  );
  const relatedPacketRefs = packetRefs.filter((packet) =>
    packet.candidate_refs.includes(candidate.id),
  );
  const relatedHandoffRefs = handoffRefs.filter((handoff) =>
    handoff.candidate_refs.includes(candidate.id),
  );
  const sourceRefs = uniqueSorted([
    ...candidateSourceRefs(candidate.object),
    ...relatedFeedbackEvents.flatMap((event) => event.source_ref_ids ?? []),
    ...relatedPacketRefs.flatMap((packet) => packet.source_refs ?? []),
    ...relatedHandoffRefs.flatMap((handoff) => handoff.source_refs ?? []),
  ]);
  const explicitSourceCoverageBoundaryNote = stringField(
    candidate.object,
    "source_coverage_boundary_note",
  );
  const outputSourceCoverageBoundaryNote =
    sourceRefs.length === 0
      ? explicitSourceCoverageBoundaryNote ??
        "No source refs were provided by input candidate or linked refs; lifecycle read model records missing source coverage without fetching sources."
      : undefined;
  const unresolvedTensionCount = countUnresolvedTensions(candidate, tensionRecords);
  const knowledgeGapCount = countKnowledgeGaps(candidate, knowledgeGapRecords);
  const currentReviewStatus = stringField(candidate.object, "current_review_status")
    ?? stringField(candidate.object, "review_status")
    ?? "candidate_only";
  const currentEpistemicStatus =
    stringField(candidate.object, "current_epistemic_status") ??
    stringField(candidate.object, "epistemic_status");
  const lifecycleStatus = chooseLifecycleStatus({
    candidate,
    currentReviewStatus,
    relatedFeedbackEvents,
    sourceRefs,
    explicitSourceCoverageBoundaryNote,
  });
  const nextReviewAction = chooseNextReviewAction({
    lifecycleStatus,
    unresolvedTensionCount,
    knowledgeGapCount,
    sourceRefCoverageRatio: sourceRefs.length === 0 ? 0 : 1,
  });
  const latestFeedbackEvent = relatedFeedbackEvents.at(-1);
  const reasonCodes = buildReasonCodes({
    candidate,
    lifecycleStatus,
    nextReviewAction,
    sourceRefs,
    sourceCoverageBoundaryNote: outputSourceCoverageBoundaryNote,
    sourceCoverageBoundaryNoteWasExplicit:
      sourceRefs.length === 0 && Boolean(explicitSourceCoverageBoundaryNote),
    unresolvedTensionCount,
    knowledgeGapCount,
    relatedFeedbackEvents,
    relatedPacketRefs,
    relatedHandoffRefs,
  });

  return {
    lifecycle_version: lifecycleVersion,
    scope: input.scope,
    as_of: input.as_of,
    candidate_id: candidate.id,
    candidate_family: candidate.family,
    source_refs: sourceRefs,
    ...(outputSourceCoverageBoundaryNote
      ? { source_coverage_boundary_note: outputSourceCoverageBoundaryNote }
      : {}),
    current_review_status: currentReviewStatus,
    ...(currentEpistemicStatus
      ? { current_epistemic_status: currentEpistemicStatus }
      : {}),
    lifecycle_status: lifecycleStatus,
    first_seen_ref:
      stringField(candidate.object, "first_seen_ref") ??
      `${candidate.family}:${candidate.id}`,
    ...(latestFeedbackEvent
      ? { latest_feedback_event_ref: latestFeedbackEvent.event_id }
      : {}),
    related_packet_refs: uniqueSorted(relatedPacketRefs.map((packet) => packet.packet_ref)),
    related_handoff_refs: uniqueSorted(
      relatedHandoffRefs.map((handoff) => handoff.handoff_ref),
    ),
    related_feedback_event_refs: uniqueSorted(
      relatedFeedbackEvents.map((event) => event.event_id),
    ),
    unresolved_tension_count: unresolvedTensionCount,
    knowledge_gap_count: knowledgeGapCount,
    source_ref_coverage_ratio: sourceRefs.length === 0 ? 0 : 1,
    next_review_action: nextReviewAction,
    reason_codes: reasonCodes,
    authority_boundary: getResearchCandidateLifecycleAuthorityBoundary(),
  };
}

function chooseLifecycleStatus(args: {
  candidate: CandidateRecord;
  currentReviewStatus: string;
  relatedFeedbackEvents: ResearchCandidateLifecycleFeedbackEvent[];
  sourceRefs: string[];
  explicitSourceCoverageBoundaryNote?: string;
}): ResearchCandidateLifecycleStatusLabel {
  const feedbackTypes = new Set(args.relatedFeedbackEvents.map((event) => event.event_type));
  if (feedbackTypes.has("invalidate_preview")) return "invalidated";
  if (feedbackTypes.has("correct_preview")) return "operator_corrected";
  if (feedbackTypes.has("pin_preview")) return "operator_pinned";
  if (feedbackTypes.has("dismiss_preview")) return "operator_dismissed";
  if (args.sourceRefs.length === 0 && !args.explicitSourceCoverageBoundaryNote) {
    return "blocked";
  }
  if (args.currentReviewStatus === "stale") return "stale";
  if (
    args.currentReviewStatus === "needs_review" ||
    args.currentReviewStatus === "candidate_only"
  ) {
    return "needs_review";
  }
  if (
    args.candidate.family === "perspective_delta" &&
    ["ready", "ready_with_tensions"].includes(
      stringField(args.candidate.object, "promotion_readiness") ?? "",
    )
  ) {
    return "ready_for_review";
  }
  return "new_candidate";
}

function chooseNextReviewAction(args: {
  lifecycleStatus: ResearchCandidateLifecycleStatusLabel;
  unresolvedTensionCount: number;
  knowledgeGapCount: number;
  sourceRefCoverageRatio: number;
}): ResearchCandidateNextReviewAction {
  if (args.lifecycleStatus === "invalidated") return "review_feedback";
  if (args.lifecycleStatus === "operator_corrected") return "review_feedback";
  if (args.lifecycleStatus === "operator_pinned") return "prepare_handoff";
  if (args.lifecycleStatus === "operator_dismissed") return "defer";
  if (args.lifecycleStatus === "blocked") return "inspect_source";
  if (args.lifecycleStatus === "needs_review" && args.unresolvedTensionCount > 0) {
    return "resolve_tension";
  }
  if (args.lifecycleStatus === "needs_review" && args.sourceRefCoverageRatio === 0) {
    return "inspect_source";
  }
  if (args.lifecycleStatus === "needs_review" && args.knowledgeGapCount > 0) {
    return "add_evidence";
  }
  if (args.lifecycleStatus === "ready_for_review") return "prepare_handoff";
  if (args.lifecycleStatus === "stale") return "inspect_source";
  return "no_action";
}

function collectCandidateRecords(
  candidateReview: ResearchCandidateLifecycleCandidateReviewInput,
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

function countUnresolvedTensions(
  candidate: CandidateRecord,
  tensionRecords: CandidateRecord[],
): number {
  if (candidate.family === "claim") {
    return tensionRecords.filter((tension) =>
      stringArrayField(tension.object, "related_claim_candidate_ids").includes(
        candidate.id,
      ),
    ).length;
  }
  if (candidate.family === "evidence") {
    return tensionRecords.filter((tension) =>
      stringArrayField(tension.object, "related_evidence_candidate_ids").includes(
        candidate.id,
      ),
    ).length;
  }
  if (candidate.family === "tension") {
    return candidate.object.blocks_or_qualifies_promotion === true ? 1 : 0;
  }
  if (candidate.family === "perspective_delta") {
    return stringArrayField(candidate.object, "related_tension_candidate_ids").length;
  }
  return stringArrayField(candidate.object, "related_tension_candidate_ids").length;
}

function countKnowledgeGaps(
  candidate: CandidateRecord,
  knowledgeGapRecords: CandidateRecord[],
): number {
  if (candidate.family === "knowledge_gap") return 1;
  if (candidate.family === "perspective_delta") {
    return stringArrayField(candidate.object, "related_gap_candidate_ids").length;
  }
  if (candidate.family === "claim") {
    return knowledgeGapRecords.filter((gap) =>
      stringArrayField(gap.object, "related_claim_candidate_ids").includes(candidate.id),
    ).length;
  }
  if (candidate.family === "tension") {
    return knowledgeGapRecords.filter((gap) =>
      stringArrayField(gap.object, "related_tension_candidate_ids").includes(
        candidate.id,
      ),
    ).length;
  }
  if (candidate.family === "evidence") {
    return knowledgeGapRecords.filter((gap) =>
      stringArrayField(gap.object, "related_evidence_candidate_ids").includes(
        candidate.id,
      ),
    ).length;
  }
  return stringArrayField(candidate.object, "related_gap_candidate_ids").length;
}

function buildReasonCodes(args: {
  candidate: CandidateRecord;
  lifecycleStatus: ResearchCandidateLifecycleStatusLabel;
  nextReviewAction: ResearchCandidateNextReviewAction;
  sourceRefs: string[];
  sourceCoverageBoundaryNote?: string;
  sourceCoverageBoundaryNoteWasExplicit: boolean;
  unresolvedTensionCount: number;
  knowledgeGapCount: number;
  relatedFeedbackEvents: ResearchCandidateLifecycleFeedbackEvent[];
  relatedPacketRefs: ResearchCandidateLifecyclePacketRef[];
  relatedHandoffRefs: ResearchCandidateLifecycleHandoffRef[];
}): string[] {
  return uniqueSorted([
    `family:${args.candidate.family}`,
    `lifecycle_status:${args.lifecycleStatus}`,
    `next_review_action:${args.nextReviewAction}`,
    args.sourceRefs.length > 0 ? "source_refs:present" : "source_refs:missing",
    ...(args.sourceCoverageBoundaryNote
      ? [
          args.sourceCoverageBoundaryNoteWasExplicit
            ? "source_boundary_note:explicit"
            : "source_boundary_note:synthesized",
        ]
      : []),
    ...(args.unresolvedTensionCount > 0 ? ["unresolved_tension:present"] : []),
    ...(args.knowledgeGapCount > 0 ? ["knowledge_gap:present"] : []),
    ...(args.relatedFeedbackEvents.length > 0 ? ["feedback:present"] : []),
    ...args.relatedFeedbackEvents.map((event) => `feedback_type:${event.event_type}`),
    ...(args.relatedPacketRefs.length > 0 ? ["packet_ref:present"] : []),
    ...(args.relatedHandoffRefs.length > 0 ? ["handoff_ref:present"] : []),
  ]);
}

function feedbackEventTargetsCandidate(
  event: ResearchCandidateLifecycleFeedbackEvent,
  candidate: CandidateRecord,
): boolean {
  if (event.target_id !== candidate.id) return false;
  const normalizedFamily = normalizeFeedbackTargetFamily(event.target_kind);
  if (normalizedFamily === null) {
    // Legacy fixtures sometimes only scoped feedback by target_id. Preserve that
    // behavior only when target_kind is absent or empty.
    return true;
  }
  return normalizedFamily === candidate.family;
}

function normalizeFeedbackTargetFamily(
  targetKind: string | undefined,
): ResearchCandidateFamily | null | undefined {
  if (!targetKind || targetKind.trim().length === 0) return null;
  const normalized = targetKind.trim().toLowerCase();
  if (normalized === "claim" || normalized === "claim_candidate") return "claim";
  if (normalized === "evidence" || normalized === "evidence_candidate") {
    return "evidence";
  }
  if (normalized === "tension" || normalized === "tension_candidate") {
    return "tension";
  }
  if (
    normalized === "knowledge_gap" ||
    normalized === "gap" ||
    normalized === "knowledge_gap_candidate"
  ) {
    return "knowledge_gap";
  }
  if (
    normalized === "perspective_delta" ||
    normalized === "perspective_delta_candidate"
  ) {
    return "perspective_delta";
  }
  if (
    normalized === "follow_up_work" ||
    normalized === "follow_up_work_candidate"
  ) {
    return "follow_up_work";
  }
  return undefined;
}

function sortFeedbackEvents(
  events: ResearchCandidateLifecycleFeedbackEvent[],
): ResearchCandidateLifecycleFeedbackEvent[] {
  return [...events].sort(
    (left, right) =>
      (left.created_at ?? "").localeCompare(right.created_at ?? "") ||
      left.event_id.localeCompare(right.event_id),
  );
}

function createFamilyCounts(): Record<ResearchCandidateFamily, number> {
  return Object.fromEntries(familyValues.map((family) => [family, 0])) as Record<
    ResearchCandidateFamily,
    number
  >;
}

function createLifecycleStatusCounts(): Record<
  ResearchCandidateLifecycleStatusLabel,
  number
> {
  return Object.fromEntries(lifecycleStatusValues.map((status) => [status, 0])) as Record<
    ResearchCandidateLifecycleStatusLabel,
    number
  >;
}

function validateAuthorityBoundary(
  boundary: ResearchCandidateLifecycleAuthorityBoundary,
  prefix: string,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.derived_read_model_only !== true) {
    failureCodes.push(`${prefix}:not_derived_read_model_only`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (boundary?.[field] !== false) {
      failureCodes.push(`${prefix}:forbidden_authority:${field}`);
    }
  }
  return failureCodes;
}

function summarySemanticText(summary: ResearchCandidateLifecycleSummary): string {
  return [
    summary.current_review_status,
    summary.current_epistemic_status ?? "",
    summary.lifecycle_status,
    summary.next_review_action,
    ...summary.reason_codes,
  ].join(" ");
}

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

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.length > 0))).sort();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
