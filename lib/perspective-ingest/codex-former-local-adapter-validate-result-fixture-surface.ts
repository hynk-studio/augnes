import type {
  CodexFormerLocalAdapterValidateResultInboxItemV0,
  CodexFormerLocalAdapterValidateResultReviewability,
  CodexFormerLocalAdapterValidateResultScenarioId,
  CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
  CodexFormerLocalAdapterValidateResultSnapshotSummaryV0,
  CodexFormerLocalAdapterValidateResultState,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-result-snapshots";

export const CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE =
  "/perspective/codex-former/local-adapter-validate-result-fixture";

export type ValidateResultFixtureSurfaceFilter =
  | "all"
  | "reviewable"
  | "reviewable_with_follow_up"
  | "blocked";

export type ValidateResultFixtureSurfaceInput = {
  sessionPanelSnapshots: {
    pass: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
    passWithFollowUp: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
    blocked: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0;
  };
  inboxItems: {
    pass: CodexFormerLocalAdapterValidateResultInboxItemV0;
    passWithFollowUp: CodexFormerLocalAdapterValidateResultInboxItemV0;
    blocked: CodexFormerLocalAdapterValidateResultInboxItemV0;
  };
  snapshotSummary: CodexFormerLocalAdapterValidateResultSnapshotSummaryV0;
};

export type ValidateResultFixtureSurfaceValidation = {
  valid: boolean;
  errors: string[];
};

export type ValidateResultAuthorityFlagRow = {
  label: string;
  value: string;
  boundary: "non-authorizing" | "review-only boundary" | "unexpected";
};

export const forbiddenValidateResultExecutableControlTerms = [
  "Accept",
  "Approve",
  "Promote",
  "Reject",
  "Merge",
  "Deploy",
  "Persist",
  "Export",
  "Run Codex",
  "Call Codex",
  "Call Provider",
  "Call provider/model",
  "Create review decision",
  "Create accepted state",
  "Handoff to runtime",
  "Create readiness",
  "Create evidence",
  "Create proof",
] as const;

const expectedScenarios = [
  {
    key: "pass",
    scenarioId: "validation-pass",
    resultState: "PASS",
    primaryStatus: "PASS, review-only",
  },
  {
    key: "passWithFollowUp",
    scenarioId: "validation-pass-with-follow-up",
    resultState: "PASS with follow-up",
    primaryStatus: "PASS with follow-up, review-only",
  },
  {
    key: "blocked",
    scenarioId: "validation-blocked",
    resultState: "BLOCKED",
    primaryStatus: "BLOCKED, review-only finding",
  },
] as const;

const expectedInboxItems = [
  {
    key: "pass",
    itemId: "local-adapter-validation-pass",
    resultState: "PASS",
    reviewability: "reviewable",
  },
  {
    key: "passWithFollowUp",
    itemId: "local-adapter-validation-pass-with-follow-up",
    resultState: "PASS with follow-up",
    reviewability: "reviewable_with_follow_up",
  },
  {
    key: "blocked",
    itemId: "local-adapter-validation-blocked",
    resultState: "BLOCKED",
    reviewability: "blocked",
  },
] as const;

const summaryAuthorityFalseFields = [
  "accepted_state_created",
  "review_decision_created",
  "proof_evidence_readiness_records_created",
  "persistence",
  "runtime_product_state_created",
  "surface_export",
  "github_mutation",
  "provider_model_api_calls",
  "codex_calls",
  "codex_sdk_calls",
  "db_writes",
  "network_calls",
  "clipboard_automation",
  "core_decision",
] as const;

export const validateResultFixtureSurfaceFilters: ValidateResultFixtureSurfaceFilter[] =
  ["all", "reviewable", "reviewable_with_follow_up", "blocked"];

export const defaultValidateResultScenarioId: CodexFormerLocalAdapterValidateResultScenarioId =
  "validation-pass-with-follow-up";

export const defaultValidateResultInboxItemId =
  "local-adapter-validation-pass-with-follow-up";

export function getValidateResultSessionPanelScenarios(
  input: ValidateResultFixtureSurfaceInput,
) {
  return [
    input.sessionPanelSnapshots.pass,
    input.sessionPanelSnapshots.passWithFollowUp,
    input.sessionPanelSnapshots.blocked,
  ];
}

export function getValidateResultInboxItems(
  input: ValidateResultFixtureSurfaceInput,
) {
  return [
    input.inboxItems.pass,
    input.inboxItems.passWithFollowUp,
    input.inboxItems.blocked,
  ];
}

export function filterValidateResultInboxItems(
  items: CodexFormerLocalAdapterValidateResultInboxItemV0[],
  filter: ValidateResultFixtureSurfaceFilter,
) {
  if (filter === "all") return items;
  return items.filter((item) => item.reviewability === filter);
}

export function getValidateResultTone(
  resultState: CodexFormerLocalAdapterValidateResultState,
) {
  if (resultState === "PASS") return "pass";
  if (resultState === "PASS with follow-up") return "followUp";
  return "blocked";
}

export function normalizeValidateResultAuthorityFlagsForDisplay(flags: object) {
  return Object.entries(flags as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]): ValidateResultAuthorityFlagRow => {
      if (value === false) {
        return {
          label,
          value: "false",
          boundary: "non-authorizing",
        };
      }
      if (label === "review_only" && value === true) {
        return {
          label,
          value: "true",
          boundary: "review-only boundary",
        };
      }
      return {
        label,
        value: String(value),
        boundary: "unexpected",
      };
    });
}

export function findForbiddenValidateResultExecutableControlCopy(
  controls: readonly string[],
) {
  return controls.flatMap((control) =>
    forbiddenValidateResultExecutableControlTerms
      .filter((term) => control.includes(term))
      .map((term) => ({ control, term })),
  );
}

export function validateCodexFormerLocalAdapterValidateResultFixtureSurface(
  input: ValidateResultFixtureSurfaceInput,
): ValidateResultFixtureSurfaceValidation {
  const errors: string[] = [];

  const scenarios = getValidateResultSessionPanelScenarios(input);
  const inboxItems = getValidateResultInboxItems(input);

  if (scenarios.length !== 3) {
    errors.push("expected exactly 3 validate result Session Panel scenarios");
  }
  if (inboxItems.length !== 3) {
    errors.push("expected exactly 3 validate result Capture Review Inbox items");
  }

  for (const expected of expectedScenarios) {
    const snapshot = input.sessionPanelSnapshots[expected.key];
    validateSessionPanelSnapshot(snapshot, expected, errors);
  }

  for (const expected of expectedInboxItems) {
    const item = input.inboxItems[expected.key];
    validateInboxItem(item, expected, errors);
  }

  validateSnapshotSummary(input.snapshotSummary, errors);

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

function validateSessionPanelSnapshot(
  snapshot: CodexFormerLocalAdapterValidateResultSessionPanelSnapshotV0,
  expected: (typeof expectedScenarios)[number],
  errors: string[],
) {
  if (snapshot.scenario_id !== expected.scenarioId) {
    errors.push(`${expected.key} scenario_id must be ${expected.scenarioId}`);
  }
  if (snapshot.result_state !== expected.resultState) {
    errors.push(`${expected.key} result_state must be ${expected.resultState}`);
  }
  if (snapshot.primary_status !== expected.primaryStatus) {
    errors.push(`${expected.key} primary status must stay review-only`);
  }
  if (!hasText(snapshot.caveat)) {
    errors.push(`${expected.key} caveat text is required`);
  }
  if (!hasText(snapshot.next_safe_action)) {
    errors.push(`${expected.key} next_safe_action is required`);
  }
  if (snapshot.review_only !== true) {
    errors.push(`${expected.key} review_only must be true`);
  }
  if (snapshot.accepted_state !== false) {
    errors.push(`${expected.key} accepted_state must remain false`);
  }
  if (snapshot.review_decision_created !== false) {
    errors.push(`${expected.key} review_decision_created must remain false`);
  }
  if (snapshot.product_readiness_created !== false) {
    errors.push(`${expected.key} product_readiness_created must remain false`);
  }
  if (snapshot.constellation_handoff_available !== false) {
    errors.push(`${expected.key} constellation_handoff_available must remain false`);
  }
  if (snapshot.runtime_handoff_available !== false) {
    errors.push(`${expected.key} runtime_handoff_available must remain false`);
  }
  if (!isSha256(snapshot.validation_summary_hash)) {
    errors.push(`${expected.key} validation_summary_hash must be sha256`);
  }
  if (!isSha256(snapshot.source_input_hash)) {
    errors.push(`${expected.key} source_input_hash must be sha256`);
  }
  if (!isSha256(snapshot.prepare_execution_summary_hash)) {
    errors.push(`${expected.key} prepare_execution_summary_hash must be sha256`);
  }
  if (!isSha256(snapshot.returned_envelope_hash)) {
    errors.push(`${expected.key} returned_envelope_hash must be sha256`);
  }
  assertAllAuthorityFieldsFalse(
    snapshot.authority_flags,
    `${expected.key} Session Panel authority`,
    errors,
  );
}

function validateInboxItem(
  item: CodexFormerLocalAdapterValidateResultInboxItemV0,
  expected: (typeof expectedInboxItems)[number],
  errors: string[],
) {
  if (item.item_id !== expected.itemId) {
    errors.push(`${expected.key} inbox item_id must be ${expected.itemId}`);
  }
  if (item.result_state !== expected.resultState) {
    errors.push(`${expected.key} inbox result_state must be ${expected.resultState}`);
  }
  if (item.reviewability !== expected.reviewability) {
    errors.push(`${expected.key} inbox reviewability must be ${expected.reviewability}`);
  }
  if (!hasText(item.title)) {
    errors.push(`${expected.key} inbox title is required`);
  }
  if (!hasText(item.caveat)) {
    errors.push(`${expected.key} inbox caveat is required`);
  }
  if (!hasText(item.next_safe_action)) {
    errors.push(`${expected.key} inbox next_safe_action is required`);
  }
  if (item.safe_links.validation_summary.href !== null) {
    errors.push(`${expected.key} validation_summary safe link href must be null`);
  }
  if (item.safe_links.read_only_validate_result_ui.available !== false) {
    errors.push(
      `${expected.key} read_only_validate_result_ui availability must stay false`,
    );
  }
  if (item.safe_links.read_only_validate_result_ui.href !== null) {
    errors.push(`${expected.key} read_only_validate_result_ui href must be null`);
  }
  if (item.safe_links.runtime_handoff.available !== false) {
    errors.push(`${expected.key} runtime_handoff availability must stay false`);
  }
  if (item.safe_links.runtime_handoff.href !== null) {
    errors.push(`${expected.key} runtime_handoff href must be null`);
  }
  if (item.accepted_state !== false) {
    errors.push(`${expected.key} inbox accepted_state must remain false`);
  }
  if (item.review_decision_created !== false) {
    errors.push(`${expected.key} inbox review_decision_created must remain false`);
  }
  if (item.review_only !== true) {
    errors.push(`${expected.key} inbox review_only must remain true`);
  }
  if (!isSha256(item.validation_summary_hash)) {
    errors.push(`${expected.key} inbox validation_summary_hash must be sha256`);
  }
}

function validateSnapshotSummary(
  summary: CodexFormerLocalAdapterValidateResultSnapshotSummaryV0,
  errors: string[],
) {
  if (summary.mode !== "validate-result-snapshots") {
    errors.push("snapshot summary mode must be validate-result-snapshots");
  }
  assertExactStringArray(summary.covered_result_states, [
    "PASS",
    "PASS with follow-up",
    "BLOCKED",
  ], "snapshot summary covered result states", errors);
  assertExactStringArray(summary.covered_surfaces, [
    "Session Panel",
    "Capture Review Inbox",
    "future read-only validate result UI",
  ], "snapshot summary covered surfaces", errors);
  if (summary.authority_boundary.review_only !== true) {
    errors.push("snapshot summary review_only authority boundary must be true");
  }
  for (const field of summaryAuthorityFalseFields) {
    if (summary.authority_boundary[field] !== false) {
      errors.push(`snapshot summary authority boundary ${field} must be false`);
    }
  }
  if (!hasText(summary.future_ui_path)) {
    errors.push("snapshot summary future_ui_path is required");
  }
  if (!hasText(summary.browser_validation_requirement)) {
    errors.push("snapshot summary browser_validation_requirement is required");
  }
}

function assertAllAuthorityFieldsFalse(
  flags: object,
  label: string,
  errors: string[],
) {
  for (const [field, value] of Object.entries(flags as Record<string, unknown>)) {
    if (value !== false) {
      errors.push(`${label} flag ${field} must be false`);
    }
  }
}

function assertExactStringArray(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
  errors: string[],
) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    errors.push(`${label} must be ${expected.join(", ")}`);
  }
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

export default {
  CODEX_FORMER_LOCAL_ADAPTER_VALIDATE_RESULT_FIXTURE_SURFACE_ROUTE,
  defaultValidateResultInboxItemId,
  defaultValidateResultScenarioId,
  findForbiddenValidateResultExecutableControlCopy,
  filterValidateResultInboxItems,
  forbiddenValidateResultExecutableControlTerms,
  getValidateResultInboxItems,
  getValidateResultSessionPanelScenarios,
  getValidateResultTone,
  normalizeValidateResultAuthorityFlagsForDisplay,
  validateCodexFormerLocalAdapterValidateResultFixtureSurface,
  validateResultFixtureSurfaceFilters,
};
