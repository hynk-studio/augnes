import {
  CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION,
  type LocalAdapterInboxSurfaceItem,
  type LocalAdapterInboxSurfaceViewModels,
  type LocalAdapterSessionPanelSurfaceScenario,
  type LocalAdapterSessionPanelSurfaceViewModels,
  type LocalAdapterSnapshotSurfaceIntegrationReadiness,
} from "@/lib/perspective-ingest/codex-former-local-adapter-snapshot-surface-integration";

export const CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_FIXTURE_SURFACE_ROUTE =
  "/perspective/codex-former/local-adapter-snapshot-fixture";

export type LocalAdapterSnapshotFixtureSurfaceFilter =
  | "all"
  | "not_ready"
  | "waiting"
  | "prepared";

export type LocalAdapterSnapshotFixtureSurfaceInput = {
  sessionViewModels: LocalAdapterSessionPanelSurfaceViewModels;
  inboxViewModels: LocalAdapterInboxSurfaceViewModels;
  readiness: LocalAdapterSnapshotSurfaceIntegrationReadiness;
};

export type LocalAdapterSnapshotFixtureSurfaceValidation = {
  valid: boolean;
  errors: string[];
};

const expectedSessionScenarioIds = [
  "not-prepared",
  "waiting-for-candidate",
  "prepared-waiting-for-codex-return",
] satisfies Array<LocalAdapterSessionPanelSurfaceScenario["scenario_id"]>;

const expectedSnapshotStates = [
  "not_ready",
  "waiting",
  "prepared_waiting_for_codex_return",
] satisfies Array<LocalAdapterSessionPanelSurfaceScenario["snapshot_state"]>;

const uiForbiddenControlCopy = [
  "Accept",
  "Approve",
  "Promote",
  "Reject",
  "Merge",
  "Deploy",
  "Validate",
  "Run Codex",
  "PASS",
  "BLOCKED",
];

export const FORBIDDEN_INTERACTIVE_CONTROL_COPY = uiForbiddenControlCopy;

export type LocalAdapterAuthorityFlagDisplay = {
  label: string;
  value: "false" | "operational provenance only";
};

const authorityFlagDisplayOrder = [
  "accepted_state_created",
  "proof_evidence_readiness_created",
  "review_decision_created",
  "surface_export_created",
  "validate_helper_executed",
  "prepare_helper_executed",
  "provider_model_calls",
  "codex_sdk_calls",
  "github_api_calls",
  "network_calls",
  "db_writes",
  "clipboard_automation",
  "live_codex_capture",
  "runtime_fixture_mutation",
  "core_decision",
];

export function normalizeAuthorityFlagsForDisplay(
  flags: Record<string, boolean | undefined> = {},
): LocalAdapterAuthorityFlagDisplay[] {
  return authorityFlagDisplayOrder.map((label) => {
    const rawValue = flags[label] === true;
    return {
      label,
      value:
        label === "prepare_helper_executed" && rawValue
          ? "operational provenance only"
          : "false",
    };
  });
}

export function validateCodexFormerLocalAdapterSnapshotFixtureSurface(
  input: LocalAdapterSnapshotFixtureSurfaceInput,
): LocalAdapterSnapshotFixtureSurfaceValidation {
  const errors: string[] = [];
  const { inboxViewModels, readiness, sessionViewModels } = input;

  if (
    sessionViewModels.view_model_version !==
    CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION
  ) {
    errors.push("unsupported session view-model version");
  }
  if (
    inboxViewModels.view_model_version !==
    CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION
  ) {
    errors.push("unsupported inbox view-model version");
  }
  if (
    readiness.readiness_version !==
    CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION
  ) {
    errors.push("unsupported readiness version");
  }

  if (sessionViewModels.scenarios.length !== 3) {
    errors.push("expected exactly 3 session scenarios");
  }
  if (inboxViewModels.items.length !== 3) {
    errors.push("expected exactly 3 inbox items");
  }
  if (
    sessionViewModels.default_scenario_id !==
    "prepared-waiting-for-codex-return"
  ) {
    errors.push("prepared session scenario must be the default");
  }
  if (
    inboxViewModels.default_selected_item_id !==
    "local-adapter-prepared-waiting-for-codex-return"
  ) {
    errors.push("prepared inbox item must be the default");
  }

  const sessionIds = sessionViewModels.scenarios.map(
    (scenario) => scenario.scenario_id,
  );
  for (const expectedId of expectedSessionScenarioIds) {
    if (!sessionIds.includes(expectedId)) {
      errors.push(`missing session scenario: ${expectedId}`);
    }
  }

  const preparedScenario = getPreparedSessionScenario(
    sessionViewModels.scenarios,
  );
  if (!preparedScenario) {
    errors.push("missing prepared session scenario");
  } else {
    if (
      preparedScenario.primary_status_label !==
      "Prepared, waiting for Codex return"
    ) {
      errors.push("prepared scenario status must stay waiting for Codex return");
    }
    if (
      preparedScenario.caveat_label !==
      "Manual Codex return has not been captured."
    ) {
      errors.push("prepared scenario caveat must remain visible");
    }
    if (!preparedScenario.review_only) {
      errors.push("prepared scenario must remain review-only");
    }
    if (preparedScenario.accepted_state !== false) {
      errors.push("prepared scenario must not create accepted state");
    }
    if (!preparedScenario.authority_summary.prepare_helper_executed_operational_only) {
      errors.push("prepare helper execution must be operational provenance only");
    }
    if (preparedScenario.handoff_status.constellation_available !== false) {
      errors.push("prepared scenario must not expose Constellation handoff");
    }
    if (preparedScenario.handoff_status.validation_available !== false) {
      errors.push("prepared scenario must not expose validation");
    }
    if (preparedScenario.handoff_status.returned_candidate_available !== false) {
      errors.push("prepared scenario must not expose returned candidate");
    }
  }

  const preparedItem = getPreparedInboxItem(inboxViewModels.items);
  if (!preparedItem) {
    errors.push("missing prepared inbox item");
  } else {
    if (preparedItem.reviewability !== "waiting") {
      errors.push("prepared inbox item must remain waiting");
    }
    if (preparedItem.candidate_count !== 0) {
      errors.push("prepared inbox item must show candidate_count 0");
    }
    if (preparedItem.blocked_reason_count !== 0) {
      errors.push("prepared inbox item must show blocked_reason_count 0");
    }
    if (preparedItem.safe_links.constellation_preview.available !== false) {
      errors.push("prepared inbox item must not link Constellation handoff");
    }
  }

  if (inboxViewModels.counts.reviewable !== 0) {
    errors.push("reviewable count must remain 0");
  }
  if (inboxViewModels.counts.blocked !== 0) {
    errors.push("blocked count must remain 0");
  }

  if (
    readiness.status !== "ready_for_ui_implementation" ||
    readiness.browser_validation_required_for_next_ui_pr !== true ||
    readiness.next_ui_pr_browser_validation_matrix.length === 0
  ) {
    errors.push("readiness fixture must include UI status and browser matrix");
  }
  for (const state of expectedSnapshotStates) {
    if (!readiness.scenario_coverage.includes(state)) {
      errors.push(`readiness missing scenario coverage: ${state}`);
    }
  }
  if (
    !readiness.surfaces.includes("session_panel") ||
    !readiness.surfaces.includes("capture_review_inbox")
  ) {
    errors.push("readiness must cover session panel and capture review inbox");
  }
  for (const [label, enabled] of Object.entries(readiness.authority_flags)) {
    if (enabled !== false) {
      errors.push(`authority flag must remain false: ${label}`);
    }
  }
  if (
    readiness.prepared_operational_provenance.prepare_helper_executed !== true ||
    readiness.prepared_operational_provenance.operational_provenance_only !== true
  ) {
    errors.push("prepared operational provenance must stay non-authorizing");
  }
  for (const scenario of sessionViewModels.scenarios) {
    const normalizedFlags = normalizeAuthorityFlagsForDisplay(
      scenario.authority_details.flags,
    );
    if (
      normalizedFlags.some(
        (flag) =>
          flag.label !== "prepare_helper_executed" &&
          flag.value !== "false",
      )
    ) {
      errors.push(`authority flags must not normalize to true: ${scenario.scenario_id}`);
    }
  }

  const policyTerms =
    readiness.copy_and_density_policy.prohibited_control_copy ?? [];
  for (const term of uiForbiddenControlCopy.filter(
    (term) => term !== "PASS" && term !== "BLOCKED",
  )) {
    if (!policyTerms.includes(term)) {
      errors.push(`missing prohibited control-copy policy term: ${term}`);
    }
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

export function filterLocalAdapterSnapshotInboxItems(
  items: LocalAdapterInboxSurfaceItem[],
  filter: LocalAdapterSnapshotFixtureSurfaceFilter,
): LocalAdapterInboxSurfaceItem[] {
  if (filter === "all") return items;
  if (filter === "prepared") {
    return items.filter(
      (item) => item.stage === "prepared_waiting_for_codex_return",
    );
  }
  if (filter === "waiting") {
    return items.filter((item) => item.reviewability === "waiting");
  }
  return items.filter((item) => item.snapshot_state === filter);
}

export function getPreparedSessionScenario(
  scenarios: LocalAdapterSessionPanelSurfaceScenario[],
): LocalAdapterSessionPanelSurfaceScenario | null {
  return (
    scenarios.find(
      (scenario) =>
        scenario.scenario_id === "prepared-waiting-for-codex-return",
    ) ?? null
  );
}

export function getPreparedInboxItem(
  items: LocalAdapterInboxSurfaceItem[],
): LocalAdapterInboxSurfaceItem | null {
  return (
    items.find(
      (item) => item.item_id === "local-adapter-prepared-waiting-for-codex-return",
    ) ?? null
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
