import { createHash } from "node:crypto";

import type {
  FeedbackToRuleAffectedSurface,
  FeedbackToRuleAuthorityBoundary,
  FeedbackToRuleCandidate,
  FeedbackToRuleCandidateBuilderInput,
  FeedbackToRuleCandidateBundle,
  FeedbackToRuleCandidateOverride,
  FeedbackToRuleCandidateReasonCode,
  FeedbackToRuleCandidateReviewStatus,
  FeedbackToRuleCandidateValidationResult,
  FeedbackToRuleFeedbackPatternKind,
  FeedbackToRuleRawFeedbackEvent,
  FeedbackToRuleRiskLevel,
  FeedbackToRuleSourceFeedbackRef,
} from "../../types/feedback-to-rule-candidate";

type NormalizedFeedbackEvent = {
  eventId: string;
  eventType: string;
  targetKind?: string;
  targetId: string;
  affectedSurface: FeedbackToRuleAffectedSurface;
  sourceRefIds: string[];
  noteText: string;
  createdAt: string;
  redactionStatus: FeedbackToRuleSourceFeedbackRef["redaction_status"];
};

type FeedbackGroup = {
  affectedSurface: FeedbackToRuleAffectedSurface;
  targetId: string;
  events: NormalizedFeedbackEvent[];
};

const candidateVersion = "feedback_to_rule_candidate.v0.1" as const;
const bundleVersion = "feedback_to_rule_candidate_bundle.v0.1" as const;
const contractStatus = "candidate_contract_only" as const;

const affectedSurfaceValues: FeedbackToRuleAffectedSurface[] = [
  "manual_note_parser",
  "research_candidate_review",
  "research_candidate_lifecycle_read_model",
  "research_candidate_calibration_diagnostic",
  "logical_claim_shape_preview",
  "perspective_geometry_digest",
  "agent_perspective_substrate",
  "ai_context_packet",
  "codex_handoff_draft",
  "feedback_event_store",
  "foundation_status_review",
  "unknown",
];

const feedbackPatternValues: FeedbackToRuleFeedbackPatternKind[] = [
  "repeated_dismissal",
  "repeated_pin",
  "repeated_correction",
  "repeated_invalidation",
  "needs_more_evidence_pattern",
  "scope_overreach_pattern",
  "missing_source_pattern",
  "overclaim_risk_pattern",
  "logical_structure_gap_pattern",
  "handoff_not_done_pattern",
  "authority_boundary_confusion",
  "other",
];

const reviewStatusValues: FeedbackToRuleCandidateReviewStatus[] = [
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_pr",
  "superseded",
];

const riskLevelValues: FeedbackToRuleRiskLevel[] = ["low", "medium", "high"];

const reasonCodeValues: FeedbackToRuleCandidateReasonCode[] = [
  "feedback_refs_present",
  "feedback_refs_missing",
  "source_refs_present",
  "source_refs_missing",
  "operator_note_redacted",
  "secret_like_pattern_blocked",
  "affected_surface_supported",
  "affected_surface_unknown",
  "pattern_kind_supported",
  "proposed_change_present",
  "proposed_change_missing",
  "authority_boundary_preserved",
  "rule_mutation_not_executed",
  "future_pr_not_created",
  "candidate_only_not_truth",
  "accepted_for_future_pr_not_pr_authority",
];

const forbiddenAuthorityFields = [
  "rule_mutation_executed_now",
  "future_pr_created_now",
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

const forbiddenCandidateTextPattern =
  /rule was applied|PR was created|branch was created|proof created|evidence record created|perspective promoted|state committed|product write|\btruth\b|automatic mutation/i;

export function getFeedbackToRuleAuthorityBoundary(): FeedbackToRuleAuthorityBoundary {
  return {
    candidate_only: true,
    rule_mutation_executed_now: false,
    future_pr_created_now: false,
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

export function buildFeedbackToRuleCandidateBundle(
  input: FeedbackToRuleCandidateBuilderInput,
): FeedbackToRuleCandidateBundle {
  const normalizedEvents = input.feedback_events
    .map(normalizeFeedbackEvent)
    .sort(compareFeedbackEvents);
  const candidateOverrides = input.candidate_overrides ?? [];
  const groups = groupFeedbackEvents(normalizedEvents);
  const candidates = groups
    .map((group) => buildCandidate(group, input.scope, candidateOverrides))
    .sort(compareCandidates);

  const bundle: FeedbackToRuleCandidateBundle = {
    bundle_version: bundleVersion,
    scope: input.scope,
    status: contractStatus,
    as_of: input.as_of,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    candidates,
    affected_surface_counts: countByValues(
      affectedSurfaceValues,
      candidates.map((candidate) => candidate.affected_surface),
    ),
    feedback_pattern_counts: countByValues(
      feedbackPatternValues,
      candidates.map((candidate) => candidate.feedback_pattern_kind),
    ),
    review_status_counts: countByValues(
      reviewStatusValues,
      candidates.map((candidate) => candidate.review_status),
    ),
    risk_level_counts: countByValues(
      riskLevelValues,
      candidates.map((candidate) => candidate.risk_level),
    ),
    boundary_notes: [
      "Feedback is operator signal, not truth.",
      "Rule candidate is not rule mutation.",
      "accepted_for_future_pr is not PR creation authority.",
      "proposed_rule_change is review text, not execution.",
      "Secret-like operator notes must be blocked or redacted.",
      "Product-write remains parked by #686.",
    ].sort(),
    authority_boundary: getFeedbackToRuleAuthorityBoundary(),
    bundle_fingerprint: "",
  };

  return {
    ...bundle,
    bundle_fingerprint: createFeedbackToRuleCandidateBundleFingerprint(bundle),
  };
}

export function validateFeedbackToRuleCandidateBundle(
  bundle: FeedbackToRuleCandidateBundle,
): FeedbackToRuleCandidateValidationResult {
  const failureCodes: string[] = [];
  if (bundle.bundle_version !== bundleVersion) failureCodes.push("invalid_bundle_version");
  if (bundle.status !== contractStatus) failureCodes.push("invalid_status");
  if (!bundle.scope) failureCodes.push("empty_scope");
  if (!Array.isArray(bundle.candidates) || bundle.candidates.length === 0) {
    failureCodes.push("empty_candidates");
  }
  if (!bundle.bundle_fingerprint) {
    failureCodes.push("empty_bundle_fingerprint");
  } else if (
    bundle.bundle_fingerprint !== createFeedbackToRuleCandidateBundleFingerprint(bundle)
  ) {
    failureCodes.push("bundle_fingerprint_mismatch");
  }
  failureCodes.push(
    ...validateAuthorityBoundary(bundle.authority_boundary, "bundle_authority_boundary"),
  );

  const seenCandidateIds = new Set<string>();
  for (const candidate of bundle.candidates ?? []) {
    const candidateId = candidate.candidate_id;
    if (seenCandidateIds.has(candidateId)) {
      failureCodes.push(`duplicate_candidate_id:${candidateId}`);
    }
    seenCandidateIds.add(candidateId);
    if (candidate.candidate_version !== candidateVersion) {
      failureCodes.push(`invalid_candidate_version:${candidateId}`);
    }
    if (candidate.status !== contractStatus) {
      failureCodes.push(`invalid_candidate_status:${candidateId}`);
    }
    if (!affectedSurfaceValues.includes(candidate.affected_surface)) {
      failureCodes.push(`invalid_affected_surface:${candidateId}`);
    }
    if (!feedbackPatternValues.includes(candidate.feedback_pattern_kind)) {
      failureCodes.push(`invalid_feedback_pattern_kind:${candidateId}`);
    }
    if (!reviewStatusValues.includes(candidate.review_status)) {
      failureCodes.push(`invalid_review_status:${candidateId}`);
    }
    if (!riskLevelValues.includes(candidate.risk_level)) {
      failureCodes.push(`invalid_risk_level:${candidateId}`);
    }
    for (const reasonCode of candidate.reason_codes ?? []) {
      if (!reasonCodeValues.includes(reasonCode)) {
        failureCodes.push(`invalid_reason_code:${candidateId}:${reasonCode}`);
      }
    }
    for (const field of [
      "observed_pattern",
      "proposed_rule_change",
      "expected_benefit",
      "risk_note",
    ] as const) {
      if (!candidate[field]) failureCodes.push(`empty_${field}:${candidateId}`);
    }
    const feedbackEventRefs = uniqueSorted(candidate.feedback_event_refs ?? []);
    const sourceFeedbackEventRefs = uniqueSorted(
      (candidate.source_feedback_refs ?? []).map((ref) => ref.feedback_event_ref),
    );
    if (feedbackEventRefs.length === 0) {
      failureCodes.push(`empty_feedback_event_refs:${candidateId}`);
    }
    if (JSON.stringify(feedbackEventRefs) !== JSON.stringify(sourceFeedbackEventRefs)) {
      failureCodes.push(`source_feedback_ref_mismatch:${candidateId}`);
    }
    if (candidate.feedback_pattern_kind.startsWith("repeated_")) {
      if (feedbackEventRefs.length < 2) {
        failureCodes.push(`repeated_pattern_insufficient_feedback_refs:${candidateId}`);
      }
      if ((candidate.source_feedback_refs ?? []).length < 2) {
        failureCodes.push(`repeated_pattern_insufficient_source_feedback_refs:${candidateId}`);
      }
    }
    if (candidate.review_status === "accepted_for_future_pr") {
      for (const reasonCode of [
        "future_pr_not_created",
        "rule_mutation_not_executed",
        "accepted_for_future_pr_not_pr_authority",
      ] as const) {
        if (!candidate.reason_codes.includes(reasonCode)) {
          failureCodes.push(`accepted_for_future_pr_missing_${reasonCode}:${candidateId}`);
        }
      }
    }
    failureCodes.push(
      ...validateAuthorityBoundary(
        candidate.authority_boundary,
        `candidate_authority_boundary:${candidateId}`,
      ),
    );
    if (candidateTextHasUnredactedSecret(candidate)) {
      failureCodes.push(`candidate_text_unredacted_secret_like_pattern:${candidateId}`);
    }
    if (candidateTextHasForbiddenAuthority(candidate)) {
      failureCodes.push(`candidate_text_forbidden_authority:${candidateId}`);
    }
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes.sort(),
  };
}

export function createFeedbackToRuleCandidateBundleFingerprint(
  bundle: FeedbackToRuleCandidateBundle,
): string {
  const { bundle_fingerprint: _fingerprint, ...hashInput } = bundle;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function buildCandidate(
  group: FeedbackGroup,
  scope: FeedbackToRuleCandidateBuilderInput["scope"],
  overrides: FeedbackToRuleCandidateOverride[],
): FeedbackToRuleCandidate {
  const patternKind = derivePatternKind(group.events);
  const feedbackEventRefs = uniqueSorted(group.events.map((event) => event.eventId));
  const candidateId = createCandidateId(group, patternKind, feedbackEventRefs);
  const override = findOverride(overrides, candidateId, group, patternKind);
  const riskLevel = controlledRiskLevel(override?.risk_level) ?? deriveRiskLevel(group, patternKind);
  const reviewStatus = deriveReviewStatus(group, patternKind, riskLevel, override);
  const sourceFeedbackRefs = group.events.map(sourceFeedbackRef).sort(compareSourceFeedbackRefs);
  const reasonCodes = buildReasonCodes({
    affectedSurface: group.affectedSurface,
    patternKind,
    feedbackEventRefs,
    sourceFeedbackRefs,
    proposedRuleChange: override?.proposed_rule_change,
    reviewStatus,
  });

  return {
    candidate_version: candidateVersion,
    scope,
    status: contractStatus,
    candidate_id: candidateId,
    affected_surface: group.affectedSurface,
    feedback_pattern_kind: patternKind,
    feedback_event_refs: feedbackEventRefs,
    source_feedback_refs: sourceFeedbackRefs,
    observed_pattern: override?.observed_pattern ?? observedPattern(group, patternKind),
    proposed_rule_change:
      override?.proposed_rule_change ?? proposedRuleChange(group.affectedSurface, patternKind),
    expected_benefit:
      override?.expected_benefit ?? expectedBenefit(group.affectedSurface, patternKind),
    risk_level: riskLevel,
    risk_note: override?.risk_note ?? riskNote(group.affectedSurface, patternKind, riskLevel),
    review_status: reviewStatus,
    reason_codes: reasonCodes,
    boundary_notes: [
      "Feedback remains operator signal.",
      "Rule candidate is not rule mutation.",
      "proposed_rule_change is review text, not execution.",
      "accepted_for_future_pr is not PR creation authority.",
    ].sort(),
    authority_boundary: getFeedbackToRuleAuthorityBoundary(),
  };
}

function normalizeFeedbackEvent(event: FeedbackToRuleRawFeedbackEvent): NormalizedFeedbackEvent {
  const noteText = `${event.operator_note_summary ?? ""} ${event.operator_note ?? ""}`.trim();
  return {
    eventId: event.event_id,
    eventType: event.event_type,
    targetKind: event.target_kind,
    targetId: event.target_id ?? "global",
    affectedSurface: normalizeAffectedSurface(event.target_kind),
    sourceRefIds: uniqueSorted(event.source_ref_ids ?? []),
    noteText,
    createdAt: event.created_at ?? "",
    redactionStatus: redactionStatus(noteText),
  };
}

function compareFeedbackEvents(
  left: NormalizedFeedbackEvent,
  right: NormalizedFeedbackEvent,
): number {
  return (
    (left.targetKind ?? "").localeCompare(right.targetKind ?? "") ||
    left.targetId.localeCompare(right.targetId) ||
    left.eventType.localeCompare(right.eventType) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.eventId.localeCompare(right.eventId)
  );
}

function groupFeedbackEvents(events: NormalizedFeedbackEvent[]): FeedbackGroup[] {
  const groups = new Map<string, FeedbackGroup>();
  for (const event of events) {
    const key = `${event.affectedSurface}::${event.targetId}`;
    const group =
      groups.get(key) ??
      ({
        affectedSurface: event.affectedSurface,
        targetId: event.targetId,
        events: [],
      } satisfies FeedbackGroup);
    group.events.push(event);
    groups.set(key, group);
  }
  return Array.from(groups.values()).map((group) => ({
    ...group,
    events: group.events.sort(compareFeedbackEvents),
  }));
}

function normalizeAffectedSurface(targetKind?: string): FeedbackToRuleAffectedSurface {
  const normalized = (targetKind ?? "unknown").toLowerCase();
  if (normalized === "manual_note_parser") return "manual_note_parser";
  if (normalized === "research_candidate_review") return "research_candidate_review";
  if (
    normalized === "research_candidate_lifecycle_read_model" ||
    normalized === "lifecycle"
  ) {
    return "research_candidate_lifecycle_read_model";
  }
  if (
    normalized === "research_candidate_calibration_diagnostic" ||
    normalized === "calibration"
  ) {
    return "research_candidate_calibration_diagnostic";
  }
  if (normalized === "logical_claim_shape_preview" || normalized === "logical_claim_shape") {
    return "logical_claim_shape_preview";
  }
  if (normalized === "ai_context_packet") return "ai_context_packet";
  if (normalized === "codex_handoff_draft" || normalized === "handoff") {
    return "codex_handoff_draft";
  }
  if (normalized === "perspective_geometry_digest") return "perspective_geometry_digest";
  if (normalized === "agent_perspective_substrate") return "agent_perspective_substrate";
  if (normalized === "feedback_event_store") return "feedback_event_store";
  if (normalized === "foundation_status_review") return "foundation_status_review";
  return "unknown";
}

function derivePatternKind(events: NormalizedFeedbackEvent[]): FeedbackToRuleFeedbackPatternKind {
  if (countEvents(events, "correct_preview") >= 2) return "repeated_correction";
  if (countEvents(events, "invalidate_preview") >= 2) return "repeated_invalidation";
  if (countEvents(events, "dismiss_preview") >= 2) return "repeated_dismissal";
  if (countEvents(events, "pin_preview") >= 2) return "repeated_pin";

  const note = events.map((event) => event.noteText.toLowerCase()).join(" ");
  if (/needs more evidence|more evidence|evidence missing|add evidence/.test(note)) {
    return "needs_more_evidence_pattern";
  }
  if (/scope overreach|out of scope|overreach/.test(note)) return "scope_overreach_pattern";
  if (/missing source|source missing|source coverage|no source refs/.test(note)) {
    return "missing_source_pattern";
  }
  if (/overclaim|readiness|confidence|too ready/.test(note)) {
    return "overclaim_risk_pattern";
  }
  if (/premise|conclusion|assumption|contradiction cue|logical structure/.test(note)) {
    return "logical_structure_gap_pattern";
  }
  if (/not done|incomplete handoff|expected checks missing/.test(note)) {
    return "handoff_not_done_pattern";
  }
  if (/authority|approval|execution approval|automation|github|pr creation|branch creation/.test(note)) {
    return "authority_boundary_confusion";
  }
  return "other";
}

function countEvents(events: NormalizedFeedbackEvent[], eventType: string): number {
  return new Set(
    events.filter((event) => event.eventType === eventType).map((event) => event.eventId),
  ).size;
}

function deriveRiskLevel(
  group: FeedbackGroup,
  patternKind: FeedbackToRuleFeedbackPatternKind,
): FeedbackToRuleRiskLevel {
  if (group.events.some((event) => event.redactionStatus === "blocked_secret_like_pattern")) {
    return "high";
  }
  if (
    patternKind === "authority_boundary_confusion" ||
    patternKind === "repeated_invalidation" ||
    patternKind === "scope_overreach_pattern"
  ) {
    return "high";
  }
  if (
    patternKind === "repeated_correction" ||
    patternKind === "needs_more_evidence_pattern" ||
    patternKind === "missing_source_pattern" ||
    patternKind === "overclaim_risk_pattern" ||
    patternKind === "logical_structure_gap_pattern" ||
    patternKind === "handoff_not_done_pattern"
  ) {
    return "medium";
  }
  return "low";
}

function deriveReviewStatus(
  group: FeedbackGroup,
  patternKind: FeedbackToRuleFeedbackPatternKind,
  riskLevel: FeedbackToRuleRiskLevel,
  override?: FeedbackToRuleCandidateOverride,
): FeedbackToRuleCandidateReviewStatus {
  const hasBlockedSecret = group.events.some(
    (event) => event.redactionStatus === "blocked_secret_like_pattern",
  );
  const controlledOverride = controlledReviewStatus(override?.review_status);
  if (controlledOverride === "accepted_for_future_pr") return "accepted_for_future_pr";
  if (hasBlockedSecret) {
    return controlledOverride === "needs_review" ? "needs_review" : "rejected";
  }
  if (controlledOverride) return controlledOverride;
  if (riskLevel === "high" || patternKind === "authority_boundary_confusion") {
    return "needs_review";
  }
  return "candidate_only";
}

function sourceFeedbackRef(event: NormalizedFeedbackEvent): FeedbackToRuleSourceFeedbackRef {
  return {
    feedback_event_ref: event.eventId,
    event_type: event.eventType,
    ...(event.targetKind ? { target_kind: event.targetKind } : {}),
    target_id: event.targetId,
    source_ref_ids: event.sourceRefIds,
    operator_note_summary: summarizedNote(event),
    redaction_status: event.redactionStatus,
  };
}

function summarizedNote(event: NormalizedFeedbackEvent): string {
  if (event.redactionStatus === "blocked_secret_like_pattern") {
    return "Operator note contained secret-like material and was blocked from summary.";
  }
  if (event.redactionStatus === "redacted") {
    return "Operator note contained public redacted marker and was redacted from summary.";
  }
  return `Operator note summarized for ${event.affectedSurface} ${event.targetId}.`;
}

function compareSourceFeedbackRefs(
  left: FeedbackToRuleSourceFeedbackRef,
  right: FeedbackToRuleSourceFeedbackRef,
): number {
  return (
    left.feedback_event_ref.localeCompare(right.feedback_event_ref) ||
    left.event_type.localeCompare(right.event_type)
  );
}

function createCandidateId(
  group: FeedbackGroup,
  patternKind: FeedbackToRuleFeedbackPatternKind,
  feedbackEventRefs: string[],
): string {
  const targetSegment = sanitizeIdSegment(group.targetId);
  const hash = createHash("sha256")
    .update(`${group.affectedSurface}|${patternKind}|${group.targetId}|${feedbackEventRefs.join("|")}`)
    .digest("hex")
    .slice(0, 8);
  return `feedback-rule:${group.affectedSurface}:${patternKind}:${targetSegment}:${hash}`;
}

function sanitizeIdSegment(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return sanitized || "global";
}

function findOverride(
  overrides: FeedbackToRuleCandidateOverride[],
  candidateId: string,
  group: FeedbackGroup,
  patternKind: FeedbackToRuleFeedbackPatternKind,
): FeedbackToRuleCandidateOverride | undefined {
  return overrides.find((override) => {
    if (
      override.target_candidate_id &&
      (override.target_candidate_id === candidateId ||
        override.target_candidate_id === group.targetId)
    ) {
      return true;
    }
    return (
      override.affected_surface === group.affectedSurface &&
      override.feedback_pattern_kind === patternKind
    );
  });
}

function controlledRiskLevel(value?: string): FeedbackToRuleRiskLevel | undefined {
  return riskLevelValues.includes(value as FeedbackToRuleRiskLevel)
    ? (value as FeedbackToRuleRiskLevel)
    : undefined;
}

function controlledReviewStatus(
  value?: string,
): FeedbackToRuleCandidateReviewStatus | undefined {
  return reviewStatusValues.includes(value as FeedbackToRuleCandidateReviewStatus)
    ? (value as FeedbackToRuleCandidateReviewStatus)
    : undefined;
}

function observedPattern(
  group: FeedbackGroup,
  patternKind: FeedbackToRuleFeedbackPatternKind,
): string {
  const count = group.events.length;
  const eventWord = count === 1 ? "signal" : "signals";
  if (patternKind === "repeated_correction") {
    return `Two correction signals target ${group.affectedSurface} ${group.targetId}.`;
  }
  if (patternKind === "repeated_invalidation") {
    return `Two invalidation signals target ${group.affectedSurface} ${group.targetId}.`;
  }
  if (patternKind === "needs_more_evidence_pattern") {
    return `Operator feedback asks for more evidence on ${group.affectedSurface} ${group.targetId}.`;
  }
  if (patternKind === "missing_source_pattern") {
    return `Operator feedback asks for missing source coverage to remain visible on ${group.affectedSurface} ${group.targetId}.`;
  }
  if (patternKind === "scope_overreach_pattern") {
    return `Operator feedback flags scope overreach on ${group.affectedSurface} ${group.targetId}.`;
  }
  if (patternKind === "authority_boundary_confusion") {
    return `Operator feedback flags authority boundary confusion on ${group.affectedSurface} ${group.targetId}.`;
  }
  if (patternKind === "overclaim_risk_pattern") {
    return `Operator feedback flags overclaim risk on ${group.affectedSurface} ${group.targetId}.`;
  }
  return `Operator feedback produced ${count} candidate-only ${eventWord} for ${group.affectedSurface} ${group.targetId}.`;
}

function proposedRuleChange(
  affectedSurface: FeedbackToRuleAffectedSurface,
  patternKind: FeedbackToRuleFeedbackPatternKind,
): string {
  if (patternKind === "repeated_correction" && affectedSurface === "ai_context_packet") {
    return "Candidate-only future rule text could require packet summaries to label review cues as cues, not approvals.";
  }
  if (
    patternKind === "repeated_invalidation" &&
    affectedSurface === "logical_claim_shape_preview"
  ) {
    return "Candidate-only future rule text could require contradiction cues to remain visible whenever contradiction refs exist.";
  }
  if (
    patternKind === "missing_source_pattern" &&
    affectedSurface === "research_candidate_lifecycle_read_model"
  ) {
    return "Candidate-only future rule text could keep missing source refs blocked until an explicit boundary note exists.";
  }
  if (
    patternKind === "authority_boundary_confusion" &&
    affectedSurface === "codex_handoff_draft"
  ) {
    return "Candidate-only future rule text could require handoff drafts to state that copyable text is not execution approval.";
  }
  if (patternKind === "needs_more_evidence_pattern") {
    return "Candidate-only future rule text could keep evidence gaps visible before ready-like wording is displayed.";
  }
  if (patternKind === "scope_overreach_pattern") {
    return "Candidate-only future rule text could keep scope-overreach feedback blocked from automatic rule changes.";
  }
  return "Candidate-only future rule text could preserve this feedback pattern for operator review.";
}

function expectedBenefit(
  affectedSurface: FeedbackToRuleAffectedSurface,
  patternKind: FeedbackToRuleFeedbackPatternKind,
): string {
  if (patternKind === "authority_boundary_confusion") {
    return "Could reduce confusion between review text and execution authority.";
  }
  if (patternKind === "missing_source_pattern") {
    return "Could make source coverage gaps more visible during operator review.";
  }
  if (patternKind === "needs_more_evidence_pattern") {
    return "Could help reviewers see evidence gaps before considering the candidate further.";
  }
  if (affectedSurface === "unknown") {
    return "Could preserve an unknown-surface signal for later manual triage.";
  }
  return "Could make repeated operator feedback easier to review without applying a rule change.";
}

function riskNote(
  affectedSurface: FeedbackToRuleAffectedSurface,
  patternKind: FeedbackToRuleFeedbackPatternKind,
  riskLevel: FeedbackToRuleRiskLevel,
): string {
  if (riskLevel === "high") {
    return `High risk because ${patternKind} can be misread as authority if applied automatically.`;
  }
  if (riskLevel === "medium") {
    return `Medium risk because ${patternKind} affects review wording for ${affectedSurface}.`;
  }
  return `Low risk because ${patternKind} is retained as candidate-only review text.`;
}

function buildReasonCodes(args: {
  affectedSurface: FeedbackToRuleAffectedSurface;
  patternKind: FeedbackToRuleFeedbackPatternKind;
  feedbackEventRefs: string[];
  sourceFeedbackRefs: FeedbackToRuleSourceFeedbackRef[];
  proposedRuleChange?: string;
  reviewStatus: FeedbackToRuleCandidateReviewStatus;
}): FeedbackToRuleCandidateReasonCode[] {
  const hasSourceRefs = args.sourceFeedbackRefs.some((ref) => ref.source_ref_ids.length > 0);
  const redactionStatuses = args.sourceFeedbackRefs.map((ref) => ref.redaction_status);
  return uniqueSorted([
    args.feedbackEventRefs.length > 0 ? "feedback_refs_present" : "feedback_refs_missing",
    hasSourceRefs ? "source_refs_present" : "source_refs_missing",
    ...(redactionStatuses.includes("redacted") ? ["operator_note_redacted"] : []),
    ...(redactionStatuses.includes("blocked_secret_like_pattern")
      ? ["secret_like_pattern_blocked"]
      : []),
    args.affectedSurface === "unknown"
      ? "affected_surface_unknown"
      : "affected_surface_supported",
    "pattern_kind_supported",
    args.proposedRuleChange === "" ? "proposed_change_missing" : "proposed_change_present",
    "authority_boundary_preserved",
    "rule_mutation_not_executed",
    "future_pr_not_created",
    "candidate_only_not_truth",
    ...(args.reviewStatus === "accepted_for_future_pr"
      ? ["accepted_for_future_pr_not_pr_authority"]
      : []),
  ] as FeedbackToRuleCandidateReasonCode[]);
}

function redactionStatus(
  note: string,
): FeedbackToRuleSourceFeedbackRef["redaction_status"] {
  if (hasUnredactedSecretLikePattern(note)) return "blocked_secret_like_pattern";
  if (hasSecretLikePattern(note)) return "redacted";
  return "not_needed";
}

function hasSecretLikePattern(value: string): boolean {
  return /OPENAI_API_KEY=|GITHUB_TOKEN=|ghp_|sk-|password:|secret:|-----BEGIN PRIVATE KEY-----|-----BEGIN RSA PRIVATE KEY-----|-----BEGIN OPENSSH PRIVATE KEY-----/i.test(
    value,
  );
}

function hasUnredactedSecretLikePattern(value: string): boolean {
  return (
    /OPENAI_API_KEY=(?!REDACTED)[A-Za-z0-9_./+=-]+/.test(value) ||
    /GITHUB_TOKEN=(?!REDACTED)[A-Za-z0-9_./+=-]+/.test(value) ||
    /ghp_(?!REDACTED)[A-Za-z0-9_]+/.test(value) ||
    /sk-(?!REDACTED)[A-Za-z0-9_]+/.test(value) ||
    /\bpassword:\s*\S+/i.test(value) ||
    /\bsecret:\s*\S+/i.test(value) ||
    /-----BEGIN PRIVATE KEY-----/i.test(value) ||
    /-----BEGIN RSA PRIVATE KEY-----/i.test(value) ||
    /-----BEGIN OPENSSH PRIVATE KEY-----/i.test(value)
  );
}

function candidateTextHasUnredactedSecret(candidate: FeedbackToRuleCandidate): boolean {
  return [
    candidate.candidate_id,
    candidate.observed_pattern,
    candidate.proposed_rule_change,
    candidate.expected_benefit,
    candidate.risk_note,
    ...candidate.source_feedback_refs.map((ref) => ref.operator_note_summary ?? ""),
  ].some(hasUnredactedSecretLikePattern);
}

function candidateTextHasForbiddenAuthority(candidate: FeedbackToRuleCandidate): boolean {
  return [
    candidate.observed_pattern,
    candidate.proposed_rule_change,
    candidate.expected_benefit,
    candidate.risk_note,
  ].some((value) => forbiddenCandidateTextPattern.test(value));
}

function validateAuthorityBoundary(boundary: FeedbackToRuleAuthorityBoundary, label: string): string[] {
  const failureCodes: string[] = [];
  if (boundary?.candidate_only !== true) {
    failureCodes.push(`${label}:candidate_only_not_true`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (boundary?.[field] !== false) {
      failureCodes.push(`${label}:${field}_not_false`);
    }
  }
  return failureCodes;
}

function compareCandidates(
  left: FeedbackToRuleCandidate,
  right: FeedbackToRuleCandidate,
): number {
  return (
    left.affected_surface.localeCompare(right.affected_surface) ||
    left.feedback_pattern_kind.localeCompare(right.feedback_pattern_kind) ||
    left.candidate_id.localeCompare(right.candidate_id)
  );
}

function countByValues<T extends string>(values: T[], observed: T[]): Record<T, number> {
  const counts = Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
  for (const value of observed) {
    counts[value] += 1;
  }
  return counts;
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
