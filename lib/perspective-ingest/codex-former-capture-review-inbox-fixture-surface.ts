import type { CodexFormerPreviewData } from "@/lib/perspective-ingest/codex-former-constellation-preview-fixture-surface";

export type CodexFormerCaptureReviewability =
  | "empty"
  | "not_ready"
  | "waiting"
  | "reviewable_with_follow_up"
  | "blocked"
  | "invalid_data";

export type CodexFormerCaptureReviewFilter =
  | "all"
  | "not_ready"
  | "waiting"
  | "reviewable"
  | "blocked";

export type CodexFormerCaptureReviewTone =
  | "neutral"
  | "review"
  | "warning"
  | "blocked";

export type CodexFormerCaptureReviewAuthorityFact = {
  label: string;
  value: string;
};

export type CodexFormerCaptureReviewLink = {
  label: string;
  href: string | null;
  available: boolean;
  detail: string;
};

export type CodexFormerCaptureReviewInboxItem = {
  id: string;
  title: string;
  sourceSessionLabel: string;
  primaryStatus: string;
  reviewability: CodexFormerCaptureReviewability;
  caveat: string;
  nextSafeAction: string;
  reviewOnly: boolean;
  acceptedState: false;
  candidateCount: number;
  metadataMatch: boolean | "not_run" | "unavailable";
  warningCount: number;
  blockedReasonCount: number;
  badges: string[];
  tone: CodexFormerCaptureReviewTone;
  authorityTags: string[];
  authorityFacts: CodexFormerCaptureReviewAuthorityFact[];
  warningSummary: {
    label: string;
    examples: string[];
  };
  blockedReasonSummary: {
    label: string;
    examples: string[];
  };
  safeLinks: {
    sessionPanel: CodexFormerCaptureReviewLink;
    constellationPreview: CodexFormerCaptureReviewLink;
  };
  privacy: {
    boundedSummariesOnly: boolean;
    rawPayloadsIncluded: false;
    unsafeInputMaterialOmitted: boolean;
  };
};

export type CodexFormerCaptureReviewInboxFixture = {
  title: string;
  boundaryLabel: string;
  acceptedState: false;
  noDecisionAuthority: true;
  emptyState: {
    reviewability: "empty";
    title: string;
    detail: string;
    nextSafeAction: string;
  };
  invalidState: {
    reviewability: "invalid_data";
    title: string;
    detail: string;
    nextSafeAction: string;
  };
  filters: CodexFormerCaptureReviewFilter[];
  items: CodexFormerCaptureReviewInboxItem[];
};

export type CodexFormerCaptureReviewInboxValidation = {
  valid: boolean;
  errors: string[];
};

const PASS_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
const BLOCKED_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";

export const CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_ROUTE =
  "/cockpit/perspective/codex-former/capture-review-inbox-fixture";
export const CODEX_FORMER_SESSION_PANEL_FIXTURE_ROUTE =
  "/cockpit/perspective/codex-former/session-perspective-panel-fixture";
export const CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_ROUTE =
  "/cockpit/perspective/codex-former/constellation-preview-fixture";

const supportedReviewabilities: CodexFormerCaptureReviewability[] = [
  "empty",
  "not_ready",
  "waiting",
  "reviewable_with_follow_up",
  "blocked",
  "invalid_data",
];

const supportedFilters: CodexFormerCaptureReviewFilter[] = [
  "all",
  "not_ready",
  "waiting",
  "reviewable",
  "blocked",
];

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

export function buildCodexFormerCaptureReviewInboxFixture({
  blockedPreviewData,
  passWithFollowUpPreviewData,
}: {
  passWithFollowUpPreviewData: CodexFormerPreviewData;
  blockedPreviewData: CodexFormerPreviewData;
}): CodexFormerCaptureReviewInboxFixture {
  return {
    title: "Codex Former Capture Review Inbox Fixture",
    boundaryLabel: "read-only / review-only / no decision authority",
    acceptedState: false,
    noDecisionAuthority: true,
    filters: supportedFilters,
    emptyState: {
      reviewability: "empty",
      title: "Empty inbox",
      detail: "No capture review items are available yet. Empty inbox is not an error.",
      nextSafeAction:
        "Prepare bounded source input or run the capture helper before review.",
    },
    invalidState: {
      reviewability: "invalid_data",
      title: "Invalid fixture data",
      detail:
        "The inbox fixture data cannot be trusted until unsupported versions or malformed references are corrected.",
      nextSafeAction: "Correct fixture data before review.",
    },
    items: [
      buildPendingPreparationItem(),
      buildWaitingForCandidateItem(),
      buildPassWithFollowUpItem(passWithFollowUpPreviewData),
      buildBlockedItem(blockedPreviewData),
    ],
  };
}

export function validateCodexFormerCaptureReviewInboxItem(
  item: Pick<CodexFormerCaptureReviewInboxItem, "id" | "reviewability" | "badges">,
): CodexFormerCaptureReviewInboxValidation {
  const errors: string[] = [];

  if (!item.id || !item.id.startsWith("capture-review:")) {
    errors.push(`unsupported inbox item id: ${item.id}`);
  }

  if (!supportedReviewabilities.includes(item.reviewability)) {
    errors.push(`unsupported reviewability: ${item.reviewability}`);
  }

  if ((item.badges ?? []).length > 2) {
    errors.push(`too many default item badges: ${item.id}`);
  }

  return { valid: errors.length === 0, errors };
}

export function filterCodexFormerCaptureReviewItems(
  items: CodexFormerCaptureReviewInboxItem[],
  filter: CodexFormerCaptureReviewFilter,
) {
  if (filter === "all") {
    return items;
  }

  if (filter === "reviewable") {
    return items.filter(
      (item) => item.reviewability === "reviewable_with_follow_up",
    );
  }

  return items.filter((item) => item.reviewability === filter);
}

function buildPendingPreparationItem(): CodexFormerCaptureReviewInboxItem {
  return {
    id: "capture-review:pending-preparation",
    title: "Pending preparation",
    sourceSessionLabel: "Local deterministic fixture: source not prepared",
    primaryStatus: "Pending preparation",
    reviewability: "not_ready",
    caveat: "Source input and prepare packet are missing.",
    nextSafeAction: "Create bounded source input and run the prepare helper.",
    reviewOnly: true,
    acceptedState: false,
    candidateCount: 0,
    metadataMatch: "not_run",
    warningCount: 0,
    blockedReasonCount: 0,
    badges: ["not_ready", "review_only"],
    tone: "neutral",
    authorityTags: baseAuthorityTags,
    authorityFacts: authorityFacts({ nonCommitted: false }),
    warningSummary: {
      label: "Pending prerequisites",
      examples: [
        "Source input is pending.",
        "Prompt/manual copy packet is pending.",
      ],
    },
    blockedReasonSummary: {
      label: "No blocked reasons",
      examples: [],
    },
    safeLinks: {
      sessionPanel: sessionPanelLink("Available for status inspection"),
      constellationPreview: noConstellationLink("Not ready"),
    },
    privacy: boundedPrivacy(),
  };
}

function buildWaitingForCandidateItem(): CodexFormerCaptureReviewInboxItem {
  return {
    id: "capture-review:waiting-for-candidate",
    title: "Waiting for returned candidate",
    sourceSessionLabel: "Local deterministic fixture: packet prepared",
    primaryStatus: "Waiting for returned candidate",
    reviewability: "waiting",
    caveat: "Returned candidate envelope is missing.",
    nextSafeAction: "Return exactly one candidate envelope.",
    reviewOnly: true,
    acceptedState: false,
    candidateCount: 0,
    metadataMatch: "not_run",
    warningCount: 0,
    blockedReasonCount: 0,
    badges: ["waiting", "review_only"],
    tone: "review",
    authorityTags: baseAuthorityTags,
    authorityFacts: authorityFacts({ nonCommitted: false }),
    warningSummary: {
      label: "Waiting state",
      examples: [
        "Source input and manual packet are prepared.",
        "Returned candidate envelope has not arrived.",
      ],
    },
    blockedReasonSummary: {
      label: "No blocked reasons",
      examples: [],
    },
    safeLinks: {
      sessionPanel: sessionPanelLink("Available for status inspection"),
      constellationPreview: noConstellationLink("Not ready"),
    },
    privacy: boundedPrivacy(),
  };
}

function buildPassWithFollowUpItem(
  previewData: CodexFormerPreviewData,
): CodexFormerCaptureReviewInboxItem {
  return {
    id: "capture-review:pass-with-follow-up",
    title: "Reviewable PASS with follow-up",
    sourceSessionLabel: `Adapted fixture: ${PASS_FIXTURE_PATH}`,
    primaryStatus: previewData.summary_panel.primary_status_label,
    reviewability: "reviewable_with_follow_up",
    caveat: "needs_review / pointer warning pressure",
    nextSafeAction:
      "Inspect Session Panel or Constellation Preview, then human review.",
    reviewOnly: previewData.summary_panel.is_review_only,
    acceptedState: false,
    candidateCount: previewData.summary_panel.candidate_count,
    metadataMatch: previewData.summary_panel.metadata_match,
    warningCount: previewData.warning_panel.warning_count,
    blockedReasonCount: countBlockedReasons(previewData),
    badges: ["non_committed", "review_only"],
    tone: "warning",
    authorityTags: uniqueTags([
      ...previewData.authority_lens.tags,
      ...baseAuthorityTags,
    ]),
    authorityFacts: authorityFacts({ nonCommitted: true }),
    warningSummary: {
      label: "Pointer warning pressure",
      examples: collectExamples(previewData.warning_panel.grouped_warnings),
    },
    blockedReasonSummary: {
      label: "No blocked reasons",
      examples: [],
    },
    safeLinks: {
      sessionPanel: sessionPanelLink("Available for status inspection"),
      constellationPreview: {
        label: "Open read-only Constellation Preview",
        href: CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_ROUTE,
        available: true,
        detail: "Read-only graph inspection only; no promotion or acceptance.",
      },
    },
    privacy: {
      boundedSummariesOnly: previewData.privacy.bounded_summaries_only,
      rawPayloadsIncluded: false,
      unsafeInputMaterialOmitted: previewData.privacy.unsafe_input_material_omitted,
    },
  };
}

function buildBlockedItem(
  previewData: CodexFormerPreviewData,
): CodexFormerCaptureReviewInboxItem {
  return {
    id: "capture-review:blocked",
    title: "BLOCKED returned material",
    sourceSessionLabel: `Adapted fixture: ${BLOCKED_FIXTURE_PATH}`,
    primaryStatus: previewData.summary_panel.primary_status_label,
    reviewability: "blocked",
    caveat: "blocked validation / provenance or candidate-count issue",
    nextSafeAction:
      "Correct provenance/candidate count or rerun the bounded capture path.",
    reviewOnly: previewData.summary_panel.is_review_only,
    acceptedState: false,
    candidateCount: previewData.summary_panel.candidate_count,
    metadataMatch: previewData.summary_panel.metadata_match,
    warningCount: previewData.warning_panel.warning_count,
    blockedReasonCount: countBlockedReasons(previewData),
    badges: ["blocked", "review_only"],
    tone: "blocked",
    authorityTags: uniqueTags([
      ...previewData.authority_lens.tags,
      ...baseAuthorityTags,
    ]),
    authorityFacts: authorityFacts({ nonCommitted: false }),
    warningSummary: {
      label: "Warning pressure",
      examples: collectExamples(previewData.warning_panel.grouped_warnings),
    },
    blockedReasonSummary: {
      label: "Blocking validation reasons",
      examples: collectExamples(previewData.warning_panel.blocked_reasons),
    },
    safeLinks: {
      sessionPanel: sessionPanelLink("Available for status inspection"),
      constellationPreview: noConstellationLink(
        "Not available as usable candidate graph",
      ),
    },
    privacy: {
      boundedSummariesOnly: previewData.privacy.bounded_summaries_only,
      rawPayloadsIncluded: false,
      unsafeInputMaterialOmitted: previewData.privacy.unsafe_input_material_omitted,
    },
  };
}

function sessionPanelLink(detail: string): CodexFormerCaptureReviewLink {
  return {
    label: "Open read-only Session Panel",
    href: CODEX_FORMER_SESSION_PANEL_FIXTURE_ROUTE,
    available: true,
    detail,
  };
}

function noConstellationLink(detail: string): CodexFormerCaptureReviewLink {
  return {
    label: "Constellation Preview not ready",
    href: null,
    available: false,
    detail,
  };
}

function authorityFacts({
  nonCommitted,
}: {
  nonCommitted: boolean;
}): CodexFormerCaptureReviewAuthorityFact[] {
  return [
    fact("review_only", "true"),
    fact("non_committed", String(nonCommitted)),
    fact("advisory_only", "true"),
    fact("no_accepted_state", "true"),
    fact("no_db_write", "true"),
    fact("no_provider_call", "true"),
    fact("no_codex_sdk_call", "true"),
    fact("no_github_mutation", "true"),
    fact("no_core_decision", "true"),
  ];
}

function boundedPrivacy(): CodexFormerCaptureReviewInboxItem["privacy"] {
  return {
    boundedSummariesOnly: true,
    rawPayloadsIncluded: false,
    unsafeInputMaterialOmitted: false,
  };
}

function fact(
  label: string,
  value: string,
): CodexFormerCaptureReviewAuthorityFact {
  return { label, value };
}

function countBlockedReasons(previewData: CodexFormerPreviewData) {
  return previewData.warning_panel.blocked_reasons.reduce(
    (count, group) => count + group.count,
    0,
  );
}

function collectExamples(
  groups: CodexFormerPreviewData["warning_panel"]["grouped_warnings"],
) {
  return groups.flatMap((group) => group.examples).slice(0, 3);
}

function uniqueTags(tags: string[]) {
  return [...new Set(tags)].sort();
}
