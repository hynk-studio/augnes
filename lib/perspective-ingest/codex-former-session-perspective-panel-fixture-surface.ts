import type { CodexFormerPreviewData } from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";

export type CodexFormerSessionPanelScenarioId =
  | "not-prepared"
  | "waiting-for-candidate"
  | "pass-with-follow-up"
  | "blocked";

export type CodexFormerSessionPanelTimelineStatus =
  | "not_started"
  | "ready"
  | "waiting"
  | "complete"
  | "needs_review"
  | "blocked";

export type CodexFormerSessionPanelTone =
  | "neutral"
  | "review"
  | "warning"
  | "blocked";

export type CodexFormerSessionPanelTimelineStep = {
  id: string;
  label: string;
  status: CodexFormerSessionPanelTimelineStatus;
  description: string;
};

export type CodexFormerSessionPanelWarningGroup = {
  id: string;
  label: string;
  count: number;
  tone: CodexFormerSessionPanelTone;
  examples: string[];
};

export type CodexFormerSessionPanelAuthorityFact = {
  label: string;
  value: string;
};

export type CodexFormerSessionPanelScenario = {
  id: CodexFormerSessionPanelScenarioId;
  label: string;
  workSessionLabel: string;
  scenarioLabel: string;
  primaryStatusLabel: string;
  caveatLabel: string;
  nextSafeActionLabel: string;
  reviewOnly: boolean;
  acceptedState: false;
  tone: CodexFormerSessionPanelTone;
  timeline: CodexFormerSessionPanelTimelineStep[];
  evidence: {
    sourceInputHash: string;
    sourcePromptHash: string;
    metadataMatch: string;
    candidateCount: string;
    fixturePath: string;
    prRefs: string[];
  };
  warnings: {
    pointerWarningCount: number;
    generalWarningCount: number;
    blockedReasonCount: number;
    hasBlockingWarnings: boolean;
    defaultOpen: boolean;
    missingPrerequisites: string[];
    groups: CodexFormerSessionPanelWarningGroup[];
    blockedReasons: CodexFormerSessionPanelWarningGroup[];
  };
  authority: {
    summary: string;
    tags: string[];
    facts: CodexFormerSessionPanelAuthorityFact[];
    flags: Record<string, boolean>;
  };
  actionGuidance: string;
  handoff: {
    label: string;
    detail: string;
    available: boolean;
    href: string | null;
  };
  privacy: {
    boundedSummariesOnly: boolean;
    rawPayloadsIncluded: false;
    unsafeInputMaterialOmitted: boolean;
  };
};

export type CodexFormerSessionPanelScenarioValidation = {
  valid: boolean;
  errors: string[];
};

const PASS_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
const BLOCKED_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
export const CODEX_FORMER_SESSION_PANEL_FIXTURE_ROUTE =
  "/cockpit/perspective/codex-former/session-perspective-panel-fixture";
export const CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_ROUTE =
  "/cockpit/perspective/codex-former/constellation-preview-fixture";

const supportedScenarioIds: CodexFormerSessionPanelScenarioId[] = [
  "not-prepared",
  "waiting-for-candidate",
  "pass-with-follow-up",
  "blocked",
];

const supportedTimelineStatuses: CodexFormerSessionPanelTimelineStatus[] = [
  "not_started",
  "ready",
  "waiting",
  "complete",
  "needs_review",
  "blocked",
];

const baseAuthorityFlags = {
  review_only: true,
  accepted_state_created: false,
  proof_evidence_readiness_created: false,
  provider_model_calls: false,
  codex_sdk_calls: false,
  github_mutation: false,
  db_writes: false,
  core_decision: false,
  runtime_fixture_mutation: false,
  live_codex_session_capture: false,
  local_storage: false,
  session_storage: false,
  indexed_db: false,
};

const baseAuthorityTags = [
  "review_only",
  "advisory_only",
  "no_accepted_state",
  "no_db_write",
  "no_provider_call",
  "no_codex_sdk_call",
  "no_github_mutation",
  "no_core_decision",
];

export function buildCodexFormerSessionPanelScenarios({
  blockedPreviewData,
  passWithFollowUpPreviewData,
}: {
  passWithFollowUpPreviewData: CodexFormerPreviewData;
  blockedPreviewData: CodexFormerPreviewData;
}): CodexFormerSessionPanelScenario[] {
  return [
    buildNotPreparedScenario(),
    buildWaitingForCandidateScenario(),
    buildPassWithFollowUpScenario(passWithFollowUpPreviewData),
    buildBlockedScenario(blockedPreviewData),
  ];
}

export function isCodexFormerSessionPanelScenarioId(
  value: string,
): value is CodexFormerSessionPanelScenarioId {
  return supportedScenarioIds.includes(value as CodexFormerSessionPanelScenarioId);
}

export function validateCodexFormerSessionPanelScenario(
  scenario: Pick<CodexFormerSessionPanelScenario, "id" | "timeline">,
): CodexFormerSessionPanelScenarioValidation {
  const errors: string[] = [];

  if (!isCodexFormerSessionPanelScenarioId(scenario.id)) {
    errors.push(`unsupported scenario id: ${scenario.id}`);
  }

  for (const step of scenario.timeline ?? []) {
    if (
      !supportedTimelineStatuses.includes(
        step.status as CodexFormerSessionPanelTimelineStatus,
      )
    ) {
      errors.push(`unsupported timeline status: ${step.id}:${step.status}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function buildNotPreparedScenario(): CodexFormerSessionPanelScenario {
  return {
    id: "not-prepared",
    label: "Not prepared",
    workSessionLabel: "Codex Former fixture session",
    scenarioLabel: "Local deterministic scenario: not prepared",
    primaryStatusLabel: "Not prepared",
    caveatLabel: "Source input and prepare packet are not ready.",
    nextSafeActionLabel:
      "Create bounded source input JSON using the template, then run the prepare helper.",
    reviewOnly: true,
    acceptedState: false,
    tone: "neutral",
    timeline: [
      step("source-input", "Bounded source input", "not_started", "No source input prepared."),
      step("prepare-packet", "Prepare packet", "not_started", "No prompt/manual copy packet."),
      step("codex-session", "Separate Codex session", "not_started", "No user-started session handoff."),
      step("returned-candidate", "Returned candidate", "not_started", "No candidate envelope returned."),
      step("validation", "Validation", "not_started", "Validation has not run."),
      step("review-candidate", "Review candidate", "not_started", "No review candidate exists."),
      step("constellation-handoff", "Constellation handoff", "not_started", "No graph handoff."),
    ],
    evidence: {
      sourceInputHash: "not_ready",
      sourcePromptHash: "not_ready",
      metadataMatch: "not_run",
      candidateCount: "0",
      fixturePath: "local deterministic in-code fixture: not-prepared",
      prRefs: ["pr:hynk-studio/augnes#504"],
    },
    warnings: {
      pointerWarningCount: 0,
      generalWarningCount: 0,
      blockedReasonCount: 0,
      hasBlockingWarnings: false,
      defaultOpen: true,
      missingPrerequisites: [
        "Bounded source input is pending.",
        "Prepare packet is pending.",
        "Returned candidate is unavailable.",
      ],
      groups: [],
      blockedReasons: [],
    },
    authority: buildAuthority({
      tags: baseAuthorityTags,
      flags: { ...baseAuthorityFlags, non_committed_candidate: false },
      summary:
        "Read-only local fixture state; no Codex call, persistence, or accepted Augnes state.",
    }),
    actionGuidance:
      "Guidance only: create bounded source input JSON using the template, then run the prepare helper outside this panel.",
    handoff: {
      label: "Not ready",
      detail: "No Constellation Preview handoff is available before preparation.",
      available: false,
      href: null,
    },
    privacy: boundedPrivacy(),
  };
}

function buildWaitingForCandidateScenario(): CodexFormerSessionPanelScenario {
  return {
    id: "waiting-for-candidate",
    label: "Waiting for candidate",
    workSessionLabel: "Codex Former fixture session",
    scenarioLabel: "Local deterministic scenario: waiting for returned candidate",
    primaryStatusLabel: "Waiting for candidate",
    caveatLabel: "Returned Codex candidate envelope is missing.",
    nextSafeActionLabel:
      "Paste the copy packet into a separate user-started Codex session and return exactly one candidate envelope.",
    reviewOnly: true,
    acceptedState: false,
    tone: "review",
    timeline: [
      step("source-input", "Bounded source input", "complete", "Source input summary exists."),
      step("prepare-packet", "Prepare packet", "complete", "Prompt/manual copy packet exists."),
      step("codex-session", "Separate Codex session", "waiting", "Waiting on separate user-started Codex session."),
      step("returned-candidate", "Returned candidate", "waiting", "Candidate envelope has not returned."),
      step("validation", "Validation", "not_started", "Validation has not run."),
      step("review-candidate", "Review candidate", "not_started", "No review candidate exists."),
      step("constellation-handoff", "Constellation handoff", "not_started", "No graph handoff yet."),
    ],
    evidence: {
      sourceInputHash: "fixture-hash:waiting-source-input",
      sourcePromptHash: "fixture-hash:waiting-prompt",
      metadataMatch: "not_run",
      candidateCount: "0",
      fixturePath: "local deterministic in-code fixture: waiting-for-candidate",
      prRefs: ["pr:hynk-studio/augnes#504"],
    },
    warnings: {
      pointerWarningCount: 0,
      generalWarningCount: 0,
      blockedReasonCount: 0,
      hasBlockingWarnings: false,
      defaultOpen: true,
      missingPrerequisites: [
        "Returned candidate envelope is pending.",
        "Validation is pending until exactly one envelope returns.",
      ],
      groups: [],
      blockedReasons: [],
    },
    authority: buildAuthority({
      tags: baseAuthorityTags,
      flags: { ...baseAuthorityFlags, non_committed_candidate: false },
      summary:
        "Read-only waiting state; Augnes does not call Codex, providers, GitHub, or persistence surfaces.",
    }),
    actionGuidance:
      "Guidance only: paste the copy packet into a separate user-started Codex session and return exactly one candidate envelope.",
    handoff: {
      label: "Not ready",
      detail: "Constellation Preview inspection waits for one validated returned candidate.",
      available: false,
      href: null,
    },
    privacy: boundedPrivacy(),
  };
}

function buildPassWithFollowUpScenario(
  previewData: CodexFormerPreviewData,
): CodexFormerSessionPanelScenario {
  const source = extractSourceEvidence(previewData);

  return {
    id: "pass-with-follow-up",
    label: "PASS with follow-up",
    workSessionLabel: "Codex Former fixture session",
    scenarioLabel: "Adapted fixture: PASS with follow-up",
    primaryStatusLabel: "PASS with follow-up",
    caveatLabel: "needs_review / pointer warning pressure",
    nextSafeActionLabel: "Inspect read-only graph, then human review.",
    reviewOnly: previewData.summary_panel.is_review_only,
    acceptedState: false,
    tone: "warning",
    timeline: [
      step("source-input", "Bounded source input", "complete", "Source input is prepared."),
      step("prepare-packet", "Prepare packet", "complete", "Prompt/manual copy packet is prepared."),
      step("codex-session", "Separate Codex session", "complete", "Separate user-started Codex session returned material."),
      step("returned-candidate", "Returned candidate", "complete", "Exactly one candidate envelope returned."),
      step("validation", "Validation", "needs_review", "Validation completed with follow-up warnings."),
      step("review-candidate", "Review candidate", "needs_review", "Review candidate exists but remains non_committed."),
      step("constellation-handoff", "Constellation handoff", "ready", "Available for read-only graph inspection."),
    ],
    evidence: {
      sourceInputHash: source.sourceInputHash,
      sourcePromptHash: source.sourcePromptHash,
      metadataMatch: String(previewData.summary_panel.metadata_match),
      candidateCount: String(previewData.summary_panel.candidate_count),
      fixturePath: PASS_FIXTURE_PATH,
      prRefs: ["pr:hynk-studio/augnes#501", "pr:hynk-studio/augnes#504"],
    },
    warnings: {
      pointerWarningCount: previewData.warning_panel.pointer_warning_count,
      generalWarningCount: Math.max(
        0,
        previewData.warning_panel.warning_count -
          previewData.warning_panel.pointer_warning_count,
      ),
      blockedReasonCount: previewData.warning_panel.blocked_reasons.reduce(
        (count, group) => count + group.count,
        0,
      ),
      hasBlockingWarnings: previewData.warning_panel.has_blocking_warnings,
      defaultOpen: false,
      missingPrerequisites: [],
      groups: previewData.warning_panel.grouped_warnings.map(mapWarningGroup),
      blockedReasons: previewData.warning_panel.blocked_reasons.map(mapWarningGroup),
    },
    authority: buildAuthority({
      tags: uniqueTags([...previewData.authority_lens.tags, ...baseAuthorityTags]),
      flags: { ...baseAuthorityFlags, ...previewData.authority_lens.flags },
      summary: previewData.authority_lens.summary,
    }),
    actionGuidance:
      "Guidance only: inspect the read-only Constellation Preview graph, then keep the candidate under human review.",
    handoff: {
      label: "Available for read-only graph inspection",
      detail:
        "Open the existing fixture-backed Constellation Preview route for graph inspection only.",
      available: true,
      href: CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_ROUTE,
    },
    privacy: {
      boundedSummariesOnly: previewData.privacy.bounded_summaries_only,
      rawPayloadsIncluded: false,
      unsafeInputMaterialOmitted: previewData.privacy.unsafe_input_material_omitted,
    },
  };
}

function buildBlockedScenario(
  previewData: CodexFormerPreviewData,
): CodexFormerSessionPanelScenario {
  const source = extractSourceEvidence(previewData);

  return {
    id: "blocked",
    label: "BLOCKED",
    workSessionLabel: "Codex Former fixture session",
    scenarioLabel: "Adapted fixture: BLOCKED",
    primaryStatusLabel: "BLOCKED",
    caveatLabel: "blocked validation / provenance or candidate-count issue",
    nextSafeActionLabel:
      "Correct provenance/candidate count or rerun the bounded capture path.",
    reviewOnly: previewData.summary_panel.is_review_only,
    acceptedState: false,
    tone: "blocked",
    timeline: [
      step("source-input", "Bounded source input", "complete", "Source input was prepared."),
      step("prepare-packet", "Prepare packet", "complete", "Prompt/manual copy packet was prepared."),
      step("codex-session", "Separate Codex session", "complete", "Returned material exists for validation."),
      step("returned-candidate", "Returned candidate", "complete", "Returned material contains candidate-count/provenance caveats."),
      step("validation", "Validation", "blocked", "Validation blocked usable review material."),
      step("review-candidate", "Review candidate", "blocked", "No usable review candidate is available."),
      step("constellation-handoff", "Constellation handoff", "blocked", "Not available as usable material."),
    ],
    evidence: {
      sourceInputHash: source.sourceInputHash,
      sourcePromptHash: source.sourcePromptHash,
      metadataMatch: String(previewData.summary_panel.metadata_match),
      candidateCount: String(previewData.summary_panel.candidate_count),
      fixturePath: BLOCKED_FIXTURE_PATH,
      prRefs: ["pr:hynk-studio/augnes#501", "pr:hynk-studio/augnes#504"],
    },
    warnings: {
      pointerWarningCount: previewData.warning_panel.pointer_warning_count,
      generalWarningCount: previewData.warning_panel.warning_count,
      blockedReasonCount: previewData.warning_panel.blocked_reasons.reduce(
        (count, group) => count + group.count,
        0,
      ),
      hasBlockingWarnings: previewData.warning_panel.has_blocking_warnings,
      defaultOpen: true,
      missingPrerequisites: [],
      groups: previewData.warning_panel.grouped_warnings.map(mapWarningGroup),
      blockedReasons: previewData.warning_panel.blocked_reasons.map(mapWarningGroup),
    },
    authority: buildAuthority({
      tags: uniqueTags([...previewData.authority_lens.tags, ...baseAuthorityTags]),
      flags: { ...baseAuthorityFlags, ...previewData.authority_lens.flags },
      summary: previewData.authority_lens.summary,
    }),
    actionGuidance:
      "Guidance only: correct provenance/candidate-count issues or rerun the bounded capture path before graph inspection.",
    handoff: {
      label: "Not available as usable review candidate",
      detail: "Blocked material is visible as a stopped review result, not a usable graph handoff.",
      available: false,
      href: null,
    },
    privacy: {
      boundedSummariesOnly: previewData.privacy.bounded_summaries_only,
      rawPayloadsIncluded: false,
      unsafeInputMaterialOmitted: previewData.privacy.unsafe_input_material_omitted,
    },
  };
}

function buildAuthority({
  flags,
  summary,
  tags,
}: {
  summary: string;
  tags: string[];
  flags: Record<string, boolean>;
}): CodexFormerSessionPanelScenario["authority"] {
  return {
    summary,
    tags: uniqueTags(tags),
    flags,
    facts: [
      fact("review_only", String(flags.review_only)),
      fact("non_committed", String(Boolean(flags.non_committed_candidate))),
      fact("advisory_only", String(tags.includes("advisory_only"))),
      fact("no_accepted_state", String(flags.accepted_state_created === false)),
      fact("no_db_write", String(flags.db_writes === false)),
      fact("no_provider_call", String(flags.provider_model_calls === false)),
      fact("no_codex_sdk_call", String(flags.codex_sdk_calls === false)),
      fact("no_github_mutation", String(flags.github_mutation === false)),
      fact("no_core_decision", String(flags.core_decision === false)),
    ],
  };
}

function boundedPrivacy(): CodexFormerSessionPanelScenario["privacy"] {
  return {
    boundedSummariesOnly: true,
    rawPayloadsIncluded: false,
    unsafeInputMaterialOmitted: false,
  };
}

function step(
  id: string,
  label: string,
  status: CodexFormerSessionPanelTimelineStatus,
  description: string,
): CodexFormerSessionPanelTimelineStep {
  return { id, label, status, description };
}

function fact(label: string, value: string): CodexFormerSessionPanelAuthorityFact {
  return { label, value };
}

function mapWarningGroup(
  group: CodexFormerPreviewData["warning_panel"]["grouped_warnings"][number],
): CodexFormerSessionPanelWarningGroup {
  return {
    id: group.id,
    label: group.label,
    count: group.count,
    tone: group.tone === "blocked" ? "blocked" : "warning",
    examples: group.examples.slice(0, 3),
  };
}

function extractSourceEvidence(previewData: CodexFormerPreviewData) {
  const sourceRows =
    previewData.detail_drawers
      .find((drawer) => drawer.id === "drawer:summary")
      ?.sections.find((section) => section.heading === "Source")?.rows ?? [];

  return {
    sourceInputHash: findRowValue(sourceRows, "source_input_hash", "unavailable"),
    sourcePromptHash: findRowValue(sourceRows, "source_prompt_hash", "unavailable"),
  };
}

function findRowValue(
  rows: { label: string; value: string }[],
  label: string,
  fallback: string,
) {
  return rows.find((row) => row.label === label)?.value ?? fallback;
}

function uniqueTags(tags: string[]) {
  return [...new Set(tags)].sort();
}
