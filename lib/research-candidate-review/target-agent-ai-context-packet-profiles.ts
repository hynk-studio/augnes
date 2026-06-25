import { createHash } from "node:crypto";

import type {
  TargetAgentAiContextPacketProfile,
  TargetAgentAiContextPacketProfilesBuilderInput,
  TargetAgentAiContextPacketProfilesReport,
  TargetAgentAiContextPacketProfilesValidationResult,
  TargetAgentContextCompressionLevel,
  TargetAgentKind,
  TargetAgentPacketProfileAuthorityBoundary,
  TargetAgentPacketProfileReasonCode,
  TargetAgentPacketProfileSection,
  TargetAgentPacketSectionKind,
  TargetAgentProfileArtifactInput,
  TargetAgentProfileInput,
  TargetAgentProfileMode,
} from "../../types/target-agent-ai-context-packet-profiles";

const profileVersion = "target_agent_ai_context_packet_profiles.v0.1" as const;
const reportVersion = "target_agent_ai_context_packet_profiles_report.v0.1" as const;
const profileStatus = "profile_preview_only" as const;

const targetAgentValues: TargetAgentKind[] = [
  "human_review",
  "chatgpt_review",
  "codex_handoff",
  "dogfooding_review",
  "unknown",
];

const profileModeValues: TargetAgentProfileMode[] = [
  "review",
  "handoff",
  "diagnostic",
  "dogfood",
  "unknown",
];

const sectionKindValues: TargetAgentPacketSectionKind[] = [
  "scope_summary",
  "source_refs",
  "candidate_lifecycle",
  "calibration_diagnostic",
  "logical_claim_shape",
  "feedback_to_rule",
  "temporal_handoff_diagnostic",
  "unresolved_tensions",
  "knowledge_gaps",
  "review_cues",
  "expected_observed_delta",
  "authority_boundary",
  "deferred_work",
  "omitted_context",
];

const compressionValues: TargetAgentContextCompressionLevel[] = [
  "full",
  "balanced",
  "compact",
  "minimal",
];

const reasonCodeValues: TargetAgentPacketProfileReasonCode[] = [
  "target_agent_supported",
  "target_agent_unknown",
  "source_refs_present",
  "source_refs_missing",
  "lifecycle_context_included",
  "calibration_context_included",
  "logical_shape_context_included",
  "feedback_to_rule_context_included",
  "temporal_handoff_context_included",
  "unresolved_tension_present",
  "knowledge_gap_present",
  "authority_boundary_included",
  "execution_authority_denied",
  "codex_handoff_draft_not_execution",
  "provider_call_denied",
  "github_automation_denied",
  "product_write_denied",
  "profile_preview_not_prompt_execution",
];

const forbiddenAuthorityFields = [
  "prompt_execution_now",
  "provider_openai_call_now",
  "codex_execution_authority",
  "github_automation_authority",
  "branch_pr_creation_authority",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
] as const;

const forbiddenSectionSummaryPattern =
  /prompt executed|provider called|Codex executed|GitHub PR created|branch created|proof created|evidence record created|Perspective promoted|state committed|product write|\btruth\b/i;

const privateMarkerPattern =
  /hidden reasoning|raw source body|private URL|\bsecret\b|\btoken\b/i;

interface ArtifactSummary {
  sourceRefs: string[];
  candidateRefs: string[];
  baseCandidateRefs: string[];
  lifecycleCandidateRefs: string[];
  calibrationCandidateRefs: string[];
  logicalShapeCandidateRefs: string[];
  feedbackToRuleCandidateRefs: string[];
  temporalHandoffCandidateRefs: string[];
  unresolvedTensionRefs: string[];
  knowledgeGapRefs: string[];
  reviewCueRefs: string[];
  lifecycleCount: number;
  calibrationCount: number;
  logicalShapeCount: number;
  feedbackToRuleCount: number;
  temporalHandoffCount: number;
}

export function getTargetAgentAiContextPacketProfileAuthorityBoundary(): TargetAgentPacketProfileAuthorityBoundary {
  return {
    profile_preview_only: true,
    prompt_execution_now: false,
    provider_openai_call_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    branch_pr_creation_authority: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    source_fetch_authority: false,
    retrieval_rag_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function buildTargetAgentAiContextPacketProfilesReport(
  input: TargetAgentAiContextPacketProfilesBuilderInput,
): TargetAgentAiContextPacketProfilesReport {
  const artifacts = summarizeArtifacts(input.artifacts);
  const profiles = input.targets
    .map((target) => buildProfile(input, target, artifacts))
    .sort(compareProfiles);
  const allSections = profiles.flatMap((profile) => [
    ...profile.included_sections,
    ...profile.omitted_sections,
  ]);

  const report: TargetAgentAiContextPacketProfilesReport = {
    report_version: reportVersion,
    scope: input.scope,
    status: profileStatus,
    as_of: input.as_of,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    profiles,
    target_counts: countByValues(
      targetAgentValues,
      profiles.map((profile) => profile.target_agent),
    ),
    section_counts: countByValues(
      sectionKindValues,
      allSections.map((section) => section.section_kind),
    ),
    compression_counts: countByValues(
      compressionValues,
      allSections.map((section) => section.compression_level),
    ),
    boundary_notes: [
      "Codex handoff profile is not execution approval.",
      "Context packet profile is advisory, not source of truth.",
      "Product-write remains parked by #686.",
      "Target-agent packet profiles do not execute prompts.",
    ].sort(),
    report_fingerprint: "",
    authority_boundary: getTargetAgentAiContextPacketProfileAuthorityBoundary(),
  };

  return {
    ...report,
    report_fingerprint: createTargetAgentAiContextPacketProfilesReportFingerprint(report),
  };
}

export function validateTargetAgentAiContextPacketProfilesReport(
  report: TargetAgentAiContextPacketProfilesReport,
): TargetAgentAiContextPacketProfilesValidationResult {
  const failureCodes: string[] = [];
  if (report.report_version !== reportVersion) failureCodes.push("invalid_report_version");
  if (report.status !== profileStatus) failureCodes.push("invalid_status");
  if (!report.scope) failureCodes.push("empty_scope");
  if (!Array.isArray(report.profiles) || report.profiles.length === 0) {
    failureCodes.push("empty_profiles");
  }
  if (!report.report_fingerprint) {
    failureCodes.push("empty_report_fingerprint");
  } else if (
    report.report_fingerprint !==
    createTargetAgentAiContextPacketProfilesReportFingerprint(report)
  ) {
    failureCodes.push("report_fingerprint_mismatch");
  }
  failureCodes.push(
    ...validateAuthorityBoundary(report.authority_boundary, "report_authority_boundary"),
  );

  const seenProfiles = new Set<string>();
  for (const profile of report.profiles ?? []) {
    const profileKey = `${profile.target_agent}:${profile.target_ref}`;
    if (seenProfiles.has(profileKey)) failureCodes.push(`duplicate_profile:${profileKey}`);
    seenProfiles.add(profileKey);
    if (!targetAgentValues.includes(profile.target_agent)) {
      failureCodes.push(`invalid_target_agent:${profileKey}:${profile.target_agent}`);
    }
    if (!profileModeValues.includes(profile.profile_mode)) {
      failureCodes.push(`invalid_profile_mode:${profileKey}:${profile.profile_mode}`);
    }
    for (const reasonCode of profile.reason_codes ?? []) {
      if (!reasonCodeValues.includes(reasonCode)) {
        failureCodes.push(`invalid_reason_code:${profileKey}:${reasonCode}`);
      }
    }
    for (const requiredReason of [
      "authority_boundary_included",
      "profile_preview_not_prompt_execution",
      "execution_authority_denied",
      "provider_call_denied",
      "github_automation_denied",
      "product_write_denied",
    ] as const) {
      if (!profile.reason_codes.includes(requiredReason)) {
        failureCodes.push(`missing_reason:${profileKey}:${requiredReason}`);
      }
    }
    if (
      profile.target_agent === "codex_handoff" &&
      !profile.reason_codes.includes("codex_handoff_draft_not_execution")
    ) {
      failureCodes.push(`missing_codex_handoff_boundary:${profileKey}`);
    }
    const allSections = [
      ...(profile.included_sections ?? []),
      ...(profile.omitted_sections ?? []),
    ];
    const includedKinds = new Set(
      (profile.included_sections ?? []).map((section) => section.section_kind),
    );
    const omittedKinds = new Set(
      (profile.omitted_sections ?? []).map((section) => section.section_kind),
    );
    if (!allSections.some((section) => section.section_kind === "authority_boundary")) {
      failureCodes.push(`missing_authority_boundary_section:${profileKey}`);
    }
    for (const sectionKind of omittedKinds) {
      if (includedKinds.has(sectionKind)) {
        failureCodes.push(`section_included_and_omitted:${profileKey}:${sectionKind}`);
      }
    }
    for (const section of profile.included_sections ?? []) {
      if (section.included !== true) {
        failureCodes.push(`included_section_not_true:${profileKey}:${section.section_id}`);
      }
    }
    for (const section of profile.omitted_sections ?? []) {
      if (section.included !== false) {
        failureCodes.push(`omitted_section_not_false:${profileKey}:${section.section_id}`);
      }
      if (section.source_refs.length > 0 || section.candidate_refs.length > 0) {
        failureCodes.push(`omitted_section_refs_present:${profileKey}:${section.section_id}`);
      }
    }
    if (omittedKinds.has("source_refs") && profile.source_refs.length > 0) {
      failureCodes.push(`omitted_source_refs_profile_refs_present:${profileKey}`);
    }
    if (
      omittedKinds.has("unresolved_tensions") &&
      profile.unresolved_tension_refs.length > 0
    ) {
      failureCodes.push(`omitted_tension_refs_profile_refs_present:${profileKey}`);
    }
    if (omittedKinds.has("knowledge_gaps") && profile.knowledge_gap_refs.length > 0) {
      failureCodes.push(`omitted_gap_refs_profile_refs_present:${profileKey}`);
    }
    if (omittedKinds.has("review_cues") && profile.review_cue_refs.length > 0) {
      failureCodes.push(`omitted_review_cue_refs_profile_refs_present:${profileKey}`);
    }
    for (const section of allSections) {
      if (!sectionKindValues.includes(section.section_kind)) {
        failureCodes.push(
          `invalid_section_kind:${profileKey}:${section.section_id}:${section.section_kind}`,
        );
      }
      if (!compressionValues.includes(section.compression_level)) {
        failureCodes.push(
          `invalid_compression:${profileKey}:${section.section_id}:${section.compression_level}`,
        );
      }
      if (
        forbiddenSectionSummaryPattern.test(section.summary) ||
        privateMarkerPattern.test(section.summary)
      ) {
        failureCodes.push(`unsafe_section_summary:${profileKey}:${section.section_id}`);
      }
    }
    failureCodes.push(
      ...validateAuthorityBoundary(
        profile.authority_boundary,
        `profile_authority_boundary:${profileKey}`,
      ),
    );
  }

  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes.sort(),
  };
}

export function createTargetAgentAiContextPacketProfilesReportFingerprint(
  report: TargetAgentAiContextPacketProfilesReport,
): string {
  const { report_fingerprint: _fingerprint, ...hashInput } = report;
  return createHash("sha256").update(canonicalJson(hashInput)).digest("hex");
}

function buildProfile(
  input: TargetAgentAiContextPacketProfilesBuilderInput,
  target: TargetAgentProfileInput,
  artifacts: ArtifactSummary,
): TargetAgentAiContextPacketProfile {
  const targetAgent = normalizeTargetAgent(target.target_agent);
  const targetRef = target.target_ref;
  const targetSegment = sanitizeIdSegment(targetRef);
  const profileMode = normalizeProfileMode(target.profile_mode) ?? defaultProfileMode(targetAgent);
  const compression =
    normalizeCompression(target.compression_level) ?? defaultCompression(targetAgent);
  const omittedSectionKinds = explicitOmittedSectionKinds(target);
  const sourceRefs =
    targetAgent === "unknown" || omittedSectionKinds.has("source_refs")
      ? []
      : artifacts.sourceRefs;
  const candidateRefs =
    targetAgent === "unknown" ? [] : candidateRefsForProfile(artifacts, omittedSectionKinds);
  const unresolvedTensionRefs =
    targetAgent === "unknown" || omittedSectionKinds.has("unresolved_tensions")
      ? []
      : artifacts.unresolvedTensionRefs;
  const knowledgeGapRefs =
    targetAgent === "unknown" || omittedSectionKinds.has("knowledge_gaps")
      ? []
      : artifacts.knowledgeGapRefs;
  const reviewCueRefs =
    targetAgent === "unknown" || omittedSectionKinds.has("review_cues")
      ? []
      : artifacts.reviewCueRefs;
  const includedSections: TargetAgentPacketProfileSection[] = [];
  const omittedSections: TargetAgentPacketProfileSection[] = [];
  const pushedOmittedSections = new Set<TargetAgentPacketSectionKind>();

  const pushIncluded = (sectionKind: TargetAgentPacketSectionKind) => {
    if (sectionKind !== "authority_boundary" && omittedSectionKinds.has(sectionKind)) {
      pushOmitted(sectionKind, "Explicitly omitted by target profile input.");
      return;
    }
    includedSections.push(
      createSection({
        targetAgent,
        targetSegment,
        sectionKind,
        included: true,
        compression,
        sourceRefs,
        candidateRefs,
      }),
    );
  };
  const pushOmitted = (sectionKind: TargetAgentPacketSectionKind, reason: string) => {
    if (sectionKind === "authority_boundary" || pushedOmittedSections.has(sectionKind)) {
      return;
    }
    pushedOmittedSections.add(sectionKind);
    omittedSections.push(
      createOmittedSection({
        targetAgent,
        targetSegment,
        sectionKind,
        compression,
        reason,
      }),
    );
  };

  if (targetAgent === "unknown") {
    pushIncluded("authority_boundary");
    for (const sectionKind of omittedSectionKinds) {
      pushOmitted(sectionKind, "Explicitly omitted by target profile input.");
    }
    omittedSections.push(
      createOmittedContextSection({
        targetAgent,
        targetSegment,
        compression,
        reason: "Target agent is unknown, so contextual sections are omitted for review.",
      }),
    );
  } else {
    pushIncluded("scope_summary");
    if (sourceRefs.length > 0) pushIncluded("source_refs");
    if (artifacts.lifecycleCount > 0) pushIncluded("candidate_lifecycle");
    if (artifacts.calibrationCount > 0) pushIncluded("calibration_diagnostic");
    if (artifacts.logicalShapeCount > 0) pushIncluded("logical_claim_shape");
    if (artifacts.feedbackToRuleCount > 0) pushIncluded("feedback_to_rule");
    if (artifacts.temporalHandoffCount > 0) {
      pushIncluded("temporal_handoff_diagnostic");
      pushIncluded("expected_observed_delta");
    }
    if (unresolvedTensionRefs.length > 0) pushIncluded("unresolved_tensions");
    if (knowledgeGapRefs.length > 0) pushIncluded("knowledge_gaps");
    if (reviewCueRefs.length > 0) pushIncluded("review_cues");
    pushIncluded("authority_boundary");
    if (targetAgent === "codex_handoff" || targetAgent === "dogfooding_review") {
      pushIncluded("deferred_work");
    }
    for (const sectionKind of omittedSectionKinds) {
      pushOmitted(sectionKind, "Explicitly omitted by target profile input.");
    }
    const omittedContextReasons = omittedContextReasonsForTarget(
      target,
      includedSections,
      omittedSectionKinds,
    );
    if (omittedContextReasons.length > 0) {
      omittedSections.push(
        createOmittedContextSection({
          targetAgent,
          targetSegment,
          compression,
          reason: omittedContextReasons.join(" "),
        }),
      );
    }
  }

  const profile: TargetAgentAiContextPacketProfile = {
    profile_version: profileVersion,
    scope: input.scope,
    status: profileStatus,
    as_of: input.as_of,
    target_agent: targetAgent,
    profile_mode: profileMode,
    target_ref: targetRef,
    source_fixture_refs: uniqueSorted(input.source_fixture_refs),
    included_sections: includedSections.sort(compareSections),
    omitted_sections: omittedSections.sort(compareSections),
    source_refs: sourceRefs,
    candidate_refs: candidateRefs,
    unresolved_tension_refs: unresolvedTensionRefs,
    knowledge_gap_refs: knowledgeGapRefs,
    review_cue_refs: reviewCueRefs,
    reason_codes: buildReasonCodes({
      targetAgent,
      sourceRefs,
      unresolvedTensionRefs,
      knowledgeGapRefs,
      includedSections,
    }),
    boundary_notes: boundaryNotesForTarget(targetAgent),
    authority_boundary: getTargetAgentAiContextPacketProfileAuthorityBoundary(),
  };

  return profile;
}

function summarizeArtifacts(artifacts: TargetAgentProfileArtifactInput): ArtifactSummary {
  const lifecycle = artifactArray(artifacts.lifecycle_summaries);
  const calibration = artifactArray(artifacts.calibration_diagnostics);
  const logical = artifactArray(artifacts.logical_claim_shapes);
  const feedback = artifactArray(artifacts.feedback_to_rule_candidates);
  const temporal = artifactArray(artifacts.temporal_handoff_sections);
  const baseCandidateRefs = uniqueSorted(artifacts.candidate_refs ?? []);
  const lifecycleCandidateRefs = candidateRefsFrom(lifecycle);
  const calibrationCandidateRefs = candidateRefsFrom(calibration);
  const logicalShapeCandidateRefs = candidateRefsFrom(logical);
  const feedbackToRuleCandidateRefs = candidateRefsFrom(feedback);
  const temporalHandoffCandidateRefs = candidateRefsFrom(temporal);
  return {
    sourceRefs: uniqueSorted([
      ...(artifacts.source_refs ?? []),
      ...sourceRefsFrom(lifecycle),
      ...sourceRefsFrom(calibration),
      ...sourceRefsFrom(logical),
      ...sourceRefsFrom(feedback),
      ...sourceRefsFrom(temporal),
    ]),
    candidateRefs: uniqueSorted([
      ...baseCandidateRefs,
      ...lifecycleCandidateRefs,
      ...calibrationCandidateRefs,
      ...logicalShapeCandidateRefs,
      ...feedbackToRuleCandidateRefs,
      ...temporalHandoffCandidateRefs,
    ]),
    baseCandidateRefs,
    lifecycleCandidateRefs,
    calibrationCandidateRefs,
    logicalShapeCandidateRefs,
    feedbackToRuleCandidateRefs,
    temporalHandoffCandidateRefs,
    unresolvedTensionRefs: uniqueSorted([
      ...(artifacts.unresolved_tension_refs ?? []),
      ...refsFromField(logical, "related_tension_candidate_ids"),
      ...refsFromField(temporal, "unresolved_tension_refs"),
    ]),
    knowledgeGapRefs: uniqueSorted([
      ...(artifacts.knowledge_gap_refs ?? []),
      ...refsFromField(logical, "related_knowledge_gap_candidate_ids"),
      ...refsFromField(temporal, "knowledge_gap_refs"),
    ]),
    reviewCueRefs: uniqueSorted([
      ...(artifacts.review_cue_refs ?? []),
      ...refsFromField(logical, "review_cues"),
      ...refsFromField(temporal, "review_cue_refs"),
    ]),
    lifecycleCount: lifecycle.length,
    calibrationCount: calibration.length,
    logicalShapeCount: logical.length,
    feedbackToRuleCount: feedback.length,
    temporalHandoffCount: temporal.length,
  };
}

function candidateRefsForProfile(
  artifacts: ArtifactSummary,
  omittedSectionKinds: Set<TargetAgentPacketSectionKind>,
): string[] {
  return uniqueSorted([
    ...artifacts.baseCandidateRefs,
    ...(omittedSectionKinds.has("candidate_lifecycle")
      ? []
      : artifacts.lifecycleCandidateRefs),
    ...(omittedSectionKinds.has("calibration_diagnostic")
      ? []
      : artifacts.calibrationCandidateRefs),
    ...(omittedSectionKinds.has("logical_claim_shape")
      ? []
      : artifacts.logicalShapeCandidateRefs),
    ...(omittedSectionKinds.has("feedback_to_rule")
      ? []
      : artifacts.feedbackToRuleCandidateRefs),
    ...(omittedSectionKinds.has("temporal_handoff_diagnostic")
      ? []
      : artifacts.temporalHandoffCandidateRefs),
  ]);
}

function createSection(args: {
  targetAgent: TargetAgentKind;
  targetSegment: string;
  sectionKind: TargetAgentPacketSectionKind;
  included: true;
  compression: TargetAgentContextCompressionLevel;
  sourceRefs: string[];
  candidateRefs: string[];
}): TargetAgentPacketProfileSection {
  return {
    section_id: `section:${args.targetAgent}:${args.targetSegment}:${args.sectionKind}`,
    section_kind: args.sectionKind,
    included: args.included,
    priority: priorityForSection(args.targetAgent, args.sectionKind),
    compression_level: compressionForSection(
      args.targetAgent,
      args.sectionKind,
      args.compression,
    ),
    source_refs: sourceRefsForSection(args.sectionKind, args.sourceRefs),
    candidate_refs: candidateRefsForSection(args.sectionKind, args.candidateRefs),
    summary: summaryForSection(args.sectionKind),
  };
}

function createOmittedContextSection(args: {
  targetAgent: TargetAgentKind;
  targetSegment: string;
  compression: TargetAgentContextCompressionLevel;
  reason: string;
}): TargetAgentPacketProfileSection {
  return {
    section_id: `section:${args.targetAgent}:${args.targetSegment}:omitted_context`,
    section_kind: "omitted_context",
    included: false,
    priority: "medium",
    compression_level: args.compression,
    source_refs: [],
    candidate_refs: [],
    summary: "Unavailable or explicitly omitted context is listed for review.",
    omission_reason: args.reason,
  };
}

function createOmittedSection(args: {
  targetAgent: TargetAgentKind;
  targetSegment: string;
  sectionKind: TargetAgentPacketSectionKind;
  compression: TargetAgentContextCompressionLevel;
  reason: string;
}): TargetAgentPacketProfileSection {
  return {
    section_id: `section:${args.targetAgent}:${args.targetSegment}:${args.sectionKind}:omitted`,
    section_kind: args.sectionKind,
    included: false,
    priority: priorityForSection(args.targetAgent, args.sectionKind),
    compression_level: compressionForSection(
      args.targetAgent,
      args.sectionKind,
      args.compression,
    ),
    source_refs: [],
    candidate_refs: [],
    summary: `${args.sectionKind} context is omitted by target profile input.`,
    omission_reason: args.reason,
  };
}

function omittedContextReasonsForTarget(
  target: TargetAgentProfileInput,
  includedSections: TargetAgentPacketProfileSection[],
  omittedSectionKinds: Set<TargetAgentPacketSectionKind>,
): string[] {
  const includedKinds = new Set(includedSections.map((section) => section.section_kind));
  const unavailableRequested = uniqueSorted(target.requested_sections ?? []).filter(
    (section) =>
      !sectionKindValues.includes(section as TargetAgentPacketSectionKind) ||
      !includedKinds.has(section as TargetAgentPacketSectionKind),
  );
  const unknownOmitted = uniqueSorted(target.omitted_sections ?? []).filter(
    (section) => !normalizeSectionKind(section),
  );
  const protectedOmitted = uniqueSorted(target.omitted_sections ?? []).filter(
    (section) => normalizeSectionKind(section) === "authority_boundary",
  );
  const reasons: string[] = [];
  if (unavailableRequested.length > 0) {
    reasons.push(`Requested sections unavailable: ${unavailableRequested.join(", ")}.`);
  }
  if (unknownOmitted.length > 0) {
    reasons.push(`Unknown omitted section hints: ${unknownOmitted.join(", ")}.`);
  }
  if (protectedOmitted.length > 0) {
    reasons.push("Authority boundary omission was ignored because boundary context is required.");
  }
  if (omittedSectionKinds.size > 0) {
    reasons.push(
      `Explicitly omitted sections: ${Array.from(omittedSectionKinds).sort().join(", ")}.`,
    );
  }
  return reasons;
}

function buildReasonCodes(args: {
  targetAgent: TargetAgentKind;
  sourceRefs: string[];
  unresolvedTensionRefs: string[];
  knowledgeGapRefs: string[];
  includedSections: TargetAgentPacketProfileSection[];
}): TargetAgentPacketProfileReasonCode[] {
  const sectionKinds = new Set(args.includedSections.map((section) => section.section_kind));
  return uniqueSorted([
    args.targetAgent === "unknown" ? "target_agent_unknown" : "target_agent_supported",
    args.sourceRefs.length > 0 ? "source_refs_present" : "source_refs_missing",
    ...(sectionKinds.has("candidate_lifecycle")
      ? ["lifecycle_context_included" as const]
      : []),
    ...(sectionKinds.has("calibration_diagnostic")
      ? ["calibration_context_included" as const]
      : []),
    ...(sectionKinds.has("logical_claim_shape")
      ? ["logical_shape_context_included" as const]
      : []),
    ...(sectionKinds.has("feedback_to_rule")
      ? ["feedback_to_rule_context_included" as const]
      : []),
    ...(sectionKinds.has("temporal_handoff_diagnostic")
      ? ["temporal_handoff_context_included" as const]
      : []),
    ...(args.unresolvedTensionRefs.length > 0
      ? ["unresolved_tension_present" as const]
      : []),
    ...(args.knowledgeGapRefs.length > 0 ? ["knowledge_gap_present" as const] : []),
    "authority_boundary_included",
    "execution_authority_denied",
    ...(args.targetAgent === "codex_handoff"
      ? ["codex_handoff_draft_not_execution" as const]
      : []),
    "provider_call_denied",
    "github_automation_denied",
    "product_write_denied",
    "profile_preview_not_prompt_execution",
  ]);
}

function normalizeTargetAgent(value: string): TargetAgentKind {
  const normalized = value.toLowerCase();
  if (normalized === "human_review" || normalized === "human") return "human_review";
  if (normalized === "chatgpt_review" || normalized === "chatgpt") return "chatgpt_review";
  if (normalized === "codex_handoff" || normalized === "codex") return "codex_handoff";
  if (normalized === "dogfooding_review" || normalized === "dogfood") {
    return "dogfooding_review";
  }
  return "unknown";
}

function explicitOmittedSectionKinds(
  target: TargetAgentProfileInput,
): Set<TargetAgentPacketSectionKind> {
  return new Set(
    uniqueSorted(target.omitted_sections ?? []).flatMap((section) => {
      const normalized = normalizeSectionKind(section);
      return normalized && normalized !== "authority_boundary" ? [normalized] : [];
    }),
  );
}

function normalizeSectionKind(value: string): TargetAgentPacketSectionKind | undefined {
  const normalized = value.toLowerCase().replace(/-/g, "_");
  if (sectionKindValues.includes(normalized as TargetAgentPacketSectionKind)) {
    return normalized as TargetAgentPacketSectionKind;
  }
  return undefined;
}

function normalizeProfileMode(value?: string): TargetAgentProfileMode | undefined {
  const normalized = (value ?? "").toLowerCase();
  if (profileModeValues.includes(normalized as TargetAgentProfileMode)) {
    return normalized as TargetAgentProfileMode;
  }
  return undefined;
}

function normalizeCompression(
  value?: string,
): TargetAgentContextCompressionLevel | undefined {
  const normalized = (value ?? "").toLowerCase();
  if (compressionValues.includes(normalized as TargetAgentContextCompressionLevel)) {
    return normalized as TargetAgentContextCompressionLevel;
  }
  return undefined;
}

function defaultProfileMode(targetAgent: TargetAgentKind): TargetAgentProfileMode {
  if (targetAgent === "codex_handoff") return "handoff";
  if (targetAgent === "dogfooding_review") return "dogfood";
  if (targetAgent === "unknown") return "unknown";
  return "review";
}

function defaultCompression(targetAgent: TargetAgentKind): TargetAgentContextCompressionLevel {
  if (targetAgent === "chatgpt_review") return "compact";
  if (targetAgent === "codex_handoff") return "minimal";
  if (targetAgent === "unknown") return "compact";
  return "balanced";
}

function priorityForSection(
  targetAgent: TargetAgentKind,
  sectionKind: TargetAgentPacketSectionKind,
): TargetAgentPacketProfileSection["priority"] {
  const highPriorityByTarget: Record<TargetAgentKind, TargetAgentPacketSectionKind[]> = {
    human_review: [
      "source_refs",
      "candidate_lifecycle",
      "calibration_diagnostic",
      "logical_claim_shape",
      "feedback_to_rule",
    ],
    chatgpt_review: [
      "scope_summary",
      "source_refs",
      "calibration_diagnostic",
      "logical_claim_shape",
      "unresolved_tensions",
    ],
    codex_handoff: [
      "authority_boundary",
      "review_cues",
      "expected_observed_delta",
      "source_refs",
      "unresolved_tensions",
    ],
    dogfooding_review: [
      "temporal_handoff_diagnostic",
      "expected_observed_delta",
      "feedback_to_rule",
      "authority_boundary",
    ],
    unknown: ["authority_boundary"],
  };
  if (highPriorityByTarget[targetAgent].includes(sectionKind)) return "high";
  if (sectionKind === "omitted_context" || sectionKind === "deferred_work") return "medium";
  return "low";
}

function compressionForSection(
  targetAgent: TargetAgentKind,
  sectionKind: TargetAgentPacketSectionKind,
  compression: TargetAgentContextCompressionLevel,
): TargetAgentContextCompressionLevel {
  if (targetAgent === "codex_handoff" && sectionKind !== "scope_summary") {
    return "minimal";
  }
  return compression;
}

function sourceRefsForSection(
  sectionKind: TargetAgentPacketSectionKind,
  sourceRefs: string[],
): string[] {
  if (
    sectionKind === "source_refs" ||
    sectionKind === "temporal_handoff_diagnostic" ||
    sectionKind === "expected_observed_delta" ||
    sectionKind === "authority_boundary"
  ) {
    return uniqueSorted(sourceRefs);
  }
  return [];
}

function candidateRefsForSection(
  sectionKind: TargetAgentPacketSectionKind,
  candidateRefs: string[],
): string[] {
  if (
    sectionKind === "candidate_lifecycle" ||
    sectionKind === "calibration_diagnostic" ||
    sectionKind === "logical_claim_shape" ||
    sectionKind === "feedback_to_rule" ||
    sectionKind === "unresolved_tensions" ||
    sectionKind === "knowledge_gaps" ||
    sectionKind === "review_cues"
  ) {
    return uniqueSorted(candidateRefs);
  }
  return [];
}

function summaryForSection(sectionKind: TargetAgentPacketSectionKind): string {
  const summaries: Record<TargetAgentPacketSectionKind, string> = {
    scope_summary: "Scope context is included as bounded review orientation.",
    source_refs: "Source refs are included as coverage signals only.",
    candidate_lifecycle: "Lifecycle context is included as review cue context only.",
    calibration_diagnostic: "Calibration context is diagnostic, not readiness authority.",
    logical_claim_shape: "Logical shape context is structure-only.",
    feedback_to_rule: "Feedback-to-Rule context remains candidate-only.",
    temporal_handoff_diagnostic:
      "Temporal handoff context is diagnostic-preview-only.",
    unresolved_tensions: "Unresolved tensions remain visible for review.",
    knowledge_gaps: "Knowledge gaps remain visible for review.",
    review_cues: "Review cues are included without action authority.",
    expected_observed_delta:
      "Expected and observed deltas are included as diagnostic context.",
    authority_boundary: "Authority boundary is included for review.",
    deferred_work: "Deferred work remains listed as future review context.",
    omitted_context: "Unavailable or explicitly omitted context is listed for review.",
  };
  return summaries[sectionKind];
}

function boundaryNotesForTarget(targetAgent: TargetAgentKind): string[] {
  const notes = [
    "Context packet profile is advisory, not source of truth.",
    "No prompt execution is authorized.",
    "Product-write remains parked by #686.",
  ];
  if (targetAgent === "codex_handoff") {
    notes.push("Codex Handoff Draft is not execution approval.");
  }
  if (targetAgent === "chatgpt_review") {
    notes.push("Generated summary is not memory or proof.");
  }
  if (targetAgent === "dogfooding_review") {
    notes.push("Dogfooding profile is not PR, Codex, or CI report authority.");
  }
  return uniqueSorted(notes);
}

function artifactArray(value: unknown[] | undefined): Record<string, unknown>[] {
  return (value ?? []).filter(isRecord);
}

function sourceRefsFrom(records: Record<string, unknown>[]): string[] {
  return uniqueSorted([
    ...refsFromField(records, "source_refs"),
    ...refsFromField(records, "source_ref_ids"),
    ...refsFromField(records, "source_ref_id"),
  ]);
}

function candidateRefsFrom(records: Record<string, unknown>[]): string[] {
  return uniqueSorted([
    ...refsFromField(records, "candidate_id"),
    ...refsFromField(records, "claim_candidate_id"),
    ...refsFromField(records, "candidate_refs"),
    ...refsFromField(records, "target_ref"),
    ...refsFromField(records, "candidate_ref"),
  ]);
}

function refsFromField(records: Record<string, unknown>[], field: string): string[] {
  return uniqueSorted(records.flatMap((record) => stringValues(record[field])));
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string" && value.length > 0) return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === "string" && item.length > 0 ? [item] : []));
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateAuthorityBoundary(
  boundary: TargetAgentPacketProfileAuthorityBoundary,
  label: string,
): string[] {
  const failureCodes: string[] = [];
  if (boundary?.profile_preview_only !== true) {
    failureCodes.push(`${label}:profile_preview_only_not_true`);
  }
  for (const field of forbiddenAuthorityFields) {
    if (boundary?.[field] !== false) failureCodes.push(`${label}:${field}_not_false`);
  }
  return failureCodes;
}

function compareProfiles(
  left: TargetAgentAiContextPacketProfile,
  right: TargetAgentAiContextPacketProfile,
): number {
  return (
    left.target_agent.localeCompare(right.target_agent) ||
    left.target_ref.localeCompare(right.target_ref)
  );
}

function compareSections(
  left: TargetAgentPacketProfileSection,
  right: TargetAgentPacketProfileSection,
): number {
  return (
    left.section_kind.localeCompare(right.section_kind) ||
    left.section_id.localeCompare(right.section_id)
  );
}

function countByValues<T extends string>(values: T[], observed: T[]): Record<T, number> {
  const counts = Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
  for (const value of observed) counts[value] += 1;
  return counts;
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

function sanitizeIdSegment(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return sanitized || "unknown";
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
