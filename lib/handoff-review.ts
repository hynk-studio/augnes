import { createHash } from "node:crypto";
import {
  ACTION_RESULT_KINDS,
  ACTION_RESULT_STATUSES,
  type ActionResultKind,
  type ActionResultStatus,
} from "@/lib/actions/local-tools";
import { appendCoordinationEvent } from "@/lib/coordination-events";
import { getHandoff, type HandoffRecord } from "@/lib/handoffs";
import { normalizeScope, normalizeWorkId } from "@/lib/work";

export const REVIEW_MATCH_VALUES = ["yes", "no", "partial"] as const;

export type ReviewMatch = (typeof REVIEW_MATCH_VALUES)[number];

export type SkippedCheck = {
  check: string;
  reason: string;
};

export type CodexResultReviewInput = {
  scope?: string | null;
  handoff_id?: string | null;
  handoff?: HandoffRecord | null;
  actual_files_changed?: string[];
  actual_state_keys?: string[];
  actual_checks?: string[];
  actual_execution_surfaces?: string[];
  result_status?: string | null;
  result_kind?: string | null;
  result_summary: string;
  related_pr?: string | null;
  blockers_or_failures?: string[];
  skipped_checks?: Array<string | SkippedCheck>;
};

export type AxisReview = {
  expected: string[];
  actual: string[];
  missing: string[];
  unexpected: string[];
  match: ReviewMatch;
};

export type CodexResultReview = {
  review_id: string;
  handoff_id: string;
  files: AxisReview;
  state_keys: AxisReview;
  checks: AxisReview & { skipped: SkippedCheck[] };
  execution_surfaces: AxisReview;
  status: {
    expected: ActionResultStatus | null;
    actual: ActionResultStatus | null;
    match: ReviewMatch;
  };
  kind: {
    expected: ActionResultKind | null;
    actual: ActionResultKind | null;
    match: ReviewMatch;
  };
  files_match: ReviewMatch;
  state_keys_match: ReviewMatch;
  checks_match: ReviewMatch;
  execution_surfaces_match: ReviewMatch;
  mismatch_or_follow_up: string[];
  recommended_result_status: ActionResultStatus;
  recommended_result_kind: ActionResultKind;
  safety_boundary_notes: string[];
};

export type ActionRecordDraft = {
  scope: string;
  source_agent_id: "agent:codex";
  action_name: string;
  result_summary: string;
  files_changed: string[];
  result_status: ActionResultStatus;
  result_kind: ActionResultKind;
  work_id: string | null;
  related_state_keys: string[];
  related_pr?: string;
};

export type WorkEventDraft = {
  scope: string;
  work_id: string | null;
  actor: "codex";
  event_type: "review";
  summary: string;
  result_status: ActionResultStatus;
  result_kind: ActionResultKind;
  related_action_id: null;
  related_pr?: string;
  related_state_keys: string[];
};

export type CodexResultReviewDraft = {
  scope: string;
  handoff: HandoffRecord;
  review: CodexResultReview;
  action_record_draft: ActionRecordDraft;
  work_event_draft: WorkEventDraft;
};

export class HandoffReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HandoffReviewError";
  }
}

export function createCodexResultReviewDraft(
  input: CodexResultReviewInput,
): CodexResultReviewDraft {
  const handoff = resolveHandoff(input);
  const scope = normalizeScope(input.scope ?? handoff.scope);
  const actualFiles = normalizeStringArray(input.actual_files_changed);
  const actualStateKeys = normalizeStringArray(input.actual_state_keys);
  const actualChecks = normalizeStringArray(input.actual_checks);
  const actualSurfaces = normalizeStringArray(input.actual_execution_surfaces);
  const blockers = normalizeStringArray(input.blockers_or_failures);
  const skippedChecks = normalizeSkippedChecks(input.skipped_checks);
  const resultSummary = requireNonEmptyString(
    input.result_summary,
    "result_summary",
  );
  const actualStatus = normalizeOptionalEnum(
    input.result_status,
    ACTION_RESULT_STATUSES,
    "result_status",
  );
  const actualKind = normalizeOptionalEnum(
    input.result_kind,
    ACTION_RESULT_KINDS,
    "result_kind",
  );
  const expectedStatus = normalizeOptionalEnum(
    stringCompletionField(handoff, "CODEX_RESULT_STATUS"),
    ACTION_RESULT_STATUSES,
    "CODEX_RESULT_STATUS",
  );
  const expectedKind = normalizeOptionalEnum(
    stringCompletionField(handoff, "CODEX_RESULT_KIND"),
    ACTION_RESULT_KINDS,
    "CODEX_RESULT_KIND",
  );
  const files = compareAxis(handoff.expected_files, actualFiles);
  const stateKeys = compareAxis(handoff.expected_state_keys, actualStateKeys);
  const checks = {
    ...compareAxis(handoff.expected_checks, actualChecks),
    skipped: skippedChecks,
  };
  const executionSurfaces = compareAxis(
    handoff.expected_execution_surfaces,
    actualSurfaces,
  );
  const statusMatch = compareOptionalValue(expectedStatus, actualStatus);
  const kindMatch = compareOptionalValue(expectedKind, actualKind);
  const mismatchOrFollowUp = buildMismatchNotes({
    files,
    stateKeys,
    checks,
    executionSurfaces,
    statusMatch,
    kindMatch,
    expectedStatus,
    actualStatus,
    expectedKind,
    actualKind,
    blockers,
  });
  const recommendedStatus = recommendResultStatus({
    actualStatus,
    expectedStatus,
    axes: [files, stateKeys, checks, executionSurfaces],
    blockers,
    skippedChecks,
  });
  const recommendedKind = actualKind ?? expectedKind ?? "other";
  const relatedPr = cleanOptionalString(input.related_pr);
  const relatedStateKeys = uniqueStrings([
    ...handoff.expected_state_keys,
    ...actualStateKeys,
  ]);
  const review: CodexResultReview = {
    review_id: buildReviewId({
      handoff,
      actualFiles,
      actualStateKeys,
      actualChecks,
      actualSurfaces,
      actualStatus,
      actualKind,
      resultSummary,
      relatedPr,
      blockers,
      skippedChecks,
    }),
    handoff_id: handoff.handoff_id,
    files,
    state_keys: stateKeys,
    checks,
    execution_surfaces: executionSurfaces,
    status: {
      expected: expectedStatus,
      actual: actualStatus,
      match: statusMatch,
    },
    kind: {
      expected: expectedKind,
      actual: actualKind,
      match: kindMatch,
    },
    files_match: files.match,
    state_keys_match: stateKeys.match,
    checks_match: checks.match,
    execution_surfaces_match: executionSurfaces.match,
    mismatch_or_follow_up: mismatchOrFollowUp,
    recommended_result_status: recommendedStatus,
    recommended_result_kind: recommendedKind,
    safety_boundary_notes: buildSafetyBoundaryNotes({
      handoff,
      files,
      stateKeys,
      executionSurfaces,
    }),
  };
  const actionRecordDraft: ActionRecordDraft = {
    scope,
    source_agent_id: "agent:codex",
    action_name: actionNameForHandoff(handoff),
    result_summary: resultSummary,
    files_changed: actualFiles,
    result_status: recommendedStatus,
    result_kind: recommendedKind,
    work_id: handoff.work_id,
    related_state_keys: relatedStateKeys,
    ...(relatedPr ? { related_pr: relatedPr } : {}),
  };
  const workEventDraft: WorkEventDraft = {
    scope,
    work_id: handoff.work_id,
    actor: "codex",
    event_type: "review",
    summary: resultSummary,
    result_status: recommendedStatus,
    result_kind: recommendedKind,
    related_action_id: null,
    ...(relatedPr ? { related_pr: relatedPr } : {}),
    related_state_keys: relatedStateKeys,
  };

  appendCoordinationEvent({
    event_id: `event:${review.review_id}:created`,
    event_type: "result_review_created",
    scope,
    work_id: handoff.work_id,
    actor: "agent:codex",
    target: "augnes_runtime",
    source_surface: "local_runtime",
    authority_level: "interpretation_only",
    state_keys: relatedStateKeys,
    payload_ref: review.review_id,
    result_status: recommendedStatus,
  });

  return {
    scope,
    handoff,
    review,
    action_record_draft: actionRecordDraft,
    work_event_draft: workEventDraft,
  };
}

function resolveHandoff(input: CodexResultReviewInput) {
  if (input.handoff) {
    return {
      ...input.handoff,
      scope: normalizeScope(input.handoff.scope),
      work_id: input.handoff.work_id
        ? normalizeWorkId(input.handoff.work_id)
        : null,
    };
  }

  const handoffId = cleanOptionalString(input.handoff_id);
  if (!handoffId) {
    throw new HandoffReviewError("handoff_id or handoff is required.");
  }

  const scope = input.scope ? normalizeScope(input.scope) : null;
  const handoff = getHandoff(handoffId, scope);
  if (!handoff) {
    throw new HandoffReviewError(
      scope
        ? `Unknown handoff_id ${handoffId} for scope ${scope}.`
        : `Unknown handoff_id ${handoffId}.`,
    );
  }

  return handoff;
}

function compareAxis(expectedValues: string[], actualValues: string[]): AxisReview {
  const expected = uniqueStrings(expectedValues);
  const actual = uniqueStrings(actualValues);
  const expectedKeys = new Set(expected.map(normalizeComparable));
  const actualKeys = new Set(actual.map(normalizeComparable));
  const missing = expected.filter(
    (value) => !actualKeys.has(normalizeComparable(value)),
  );
  const unexpected = actual.filter(
    (value) => !expectedKeys.has(normalizeComparable(value)),
  );
  const matchedCount = expected.length - missing.length;
  let match: ReviewMatch = "yes";

  if (expected.length === 0) {
    match = actual.length === 0 ? "yes" : "partial";
  } else if (missing.length === 0 && unexpected.length === 0) {
    match = "yes";
  } else if (matchedCount > 0 || missing.length === 0) {
    match = "partial";
  } else {
    match = "no";
  }

  return {
    expected,
    actual,
    missing,
    unexpected,
    match,
  };
}

function compareOptionalValue<T extends string>(
  expected: T | null,
  actual: T | null,
): ReviewMatch {
  if (!expected && !actual) {
    return "yes";
  }

  if (!expected || !actual) {
    return "partial";
  }

  return expected === actual ? "yes" : "no";
}

function buildMismatchNotes({
  files,
  stateKeys,
  checks,
  executionSurfaces,
  statusMatch,
  kindMatch,
  expectedStatus,
  actualStatus,
  expectedKind,
  actualKind,
  blockers,
}: {
  files: AxisReview;
  stateKeys: AxisReview;
  checks: AxisReview & { skipped: SkippedCheck[] };
  executionSurfaces: AxisReview;
  statusMatch: ReviewMatch;
  kindMatch: ReviewMatch;
  expectedStatus: ActionResultStatus | null;
  actualStatus: ActionResultStatus | null;
  expectedKind: ActionResultKind | null;
  actualKind: ActionResultKind | null;
  blockers: string[];
}) {
  const notes: string[] = [];
  appendAxisNotes(notes, "Files", files);
  appendAxisNotes(notes, "State keys", stateKeys);
  appendAxisNotes(notes, "Verification checks", checks);
  appendAxisNotes(notes, "Execution surfaces", executionSurfaces);

  for (const skipped of checks.skipped) {
    notes.push(`Skipped check: ${skipped.check} (${skipped.reason}).`);
  }

  if (statusMatch !== "yes") {
    notes.push(
      `Result status mismatch: expected ${expectedStatus ?? "not specified"}, actual ${actualStatus ?? "not specified"}.`,
    );
  }

  if (kindMatch !== "yes") {
    notes.push(
      `Result kind mismatch: expected ${expectedKind ?? "not specified"}, actual ${actualKind ?? "not specified"}.`,
    );
  }

  for (const blocker of blockers) {
    notes.push(`Blocker or failure reported: ${blocker}.`);
  }

  return notes.length
    ? uniqueStrings(notes)
    : ["No mismatch or follow-up detected from the submitted result fields."];
}

function appendAxisNotes(notes: string[], label: string, axis: AxisReview) {
  if (axis.missing.length) {
    notes.push(`${label} missing expected item(s): ${axis.missing.join(", ")}.`);
  }

  if (axis.unexpected.length) {
    notes.push(
      `${label} included item(s) outside the handoff expectation: ${axis.unexpected.join(", ")}.`,
    );
  }
}

function recommendResultStatus({
  actualStatus,
  expectedStatus,
  axes,
  blockers,
  skippedChecks,
}: {
  actualStatus: ActionResultStatus | null;
  expectedStatus: ActionResultStatus | null;
  axes: AxisReview[];
  blockers: string[];
  skippedChecks: SkippedCheck[];
}): ActionResultStatus {
  if (actualStatus === "failed") {
    return "failed";
  }

  if (actualStatus === "blocked" || blockers.length > 0) {
    return "blocked";
  }

  if (actualStatus === "needs_review") {
    return "needs_review";
  }

  if (axes.some((axis) => axis.match === "no")) {
    return "needs_review";
  }

  if (axes.some((axis) => axis.match === "partial") || skippedChecks.length) {
    return "partial";
  }

  return actualStatus ?? expectedStatus ?? "completed";
}

function buildSafetyBoundaryNotes({
  handoff,
  files,
  stateKeys,
  executionSurfaces,
}: {
  handoff: HandoffRecord;
  files: AxisReview;
  stateKeys: AxisReview;
  executionSurfaces: AxisReview;
}) {
  const notes = [
    "Review/draft only: no Codex execution was requested by this helper.",
    "No action proof or work event proof was recorded; only record drafts were produced.",
    "No Augnes state commit/reject or handoff status update was performed.",
    "No mailbox, publisher, GitHub posting, Discord posting, or Cockpit write control behavior was added.",
  ];

  if (files.unexpected.length) {
    notes.push("Actual files include paths outside the handoff expectation.");
  }

  if (stateKeys.unexpected.length) {
    notes.push(
      "Actual state keys include keys outside the handoff expectation; treat them as follow-up before durable approval.",
    );
  }

  if (executionSurfaces.unexpected.length) {
    notes.push(
      "Actual execution surfaces include surfaces outside the handoff expectation.",
    );
  }

  return uniqueStrings([
    ...notes,
    ...handoff.safety_boundaries.filter((boundary) =>
      /codex|commit|reject|mailbox|publish|publisher|github|discord|secret|cockpit/i.test(
        boundary,
      ),
    ),
  ]);
}

function buildReviewId(payload: {
  handoff: HandoffRecord;
  actualFiles: string[];
  actualStateKeys: string[];
  actualChecks: string[];
  actualSurfaces: string[];
  actualStatus: ActionResultStatus | null;
  actualKind: ActionResultKind | null;
  resultSummary: string;
  relatedPr: string | null;
  blockers: string[];
  skippedChecks: SkippedCheck[];
}) {
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        handoff_id: payload.handoff.handoff_id,
        actual_files_changed: payload.actualFiles,
        actual_state_keys: payload.actualStateKeys,
        actual_checks: payload.actualChecks,
        actual_execution_surfaces: payload.actualSurfaces,
        result_status: payload.actualStatus,
        result_kind: payload.actualKind,
        result_summary: payload.resultSummary,
        related_pr: payload.relatedPr,
        blockers_or_failures: payload.blockers,
        skipped_checks: payload.skippedChecks,
      }),
    )
    .digest("hex")
    .slice(0, 16);

  return `review:${payload.handoff.handoff_id}:${digest}`;
}

function actionNameForHandoff(handoff: HandoffRecord) {
  return (
    stringCompletionField(handoff, "CODEX_ACTION_NAME") ||
    `codex_result_${sanitizeSegment(handoff.work_id ?? handoff.handoff_id)}`
  );
}

function stringCompletionField(handoff: HandoffRecord, key: string) {
  const value = handoff.completion_record_fields[key];

  return typeof value === "string" ? value.trim() || null : null;
}

function normalizeSkippedChecks(
  checks: Array<string | SkippedCheck> | undefined,
) {
  return (checks ?? [])
    .map((item) => {
      if (typeof item === "string") {
        const [check, ...reasonParts] = item.split(":");
        return {
          check: check.trim(),
          reason: reasonParts.join(":").trim() || "reason not provided",
        };
      }

      return {
        check: item.check.trim(),
        reason: item.reason.trim() || "reason not provided",
      };
    })
    .filter((item) => item.check.length > 0);
}

function normalizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(value);
}

function normalizeOptionalEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  key: string,
) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (allowed.includes(value as T)) {
    return value as T;
  }

  throw new HandoffReviewError(`${key} must be one of: ${allowed.join(", ")}.`);
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HandoffReviewError(`${key} is required.`);
  }

  return value.trim();
}

function cleanOptionalString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeComparable(value: string) {
  return value.trim().toLowerCase();
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
