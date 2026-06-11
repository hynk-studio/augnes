import {
  collectUnsafeCodexFormerLocalAdapterSourceInputMarkers,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";

export const CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION =
  "codex_former_local_adapter_session_panel_surface_view_models.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION =
  "codex_former_local_adapter_inbox_surface_view_models.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION =
  "codex_former_local_adapter_snapshot_surface_integration_readiness.v0.1";

type SnapshotState = "not_ready" | "waiting" | "prepared_waiting_for_codex_return";
type SessionScenarioId =
  | "not-prepared"
  | "waiting-for-candidate"
  | "prepared-waiting-for-codex-return";
type DisplayTone = "pending" | "waiting" | "prepared_waiting";

type SnapshotSource<T> = {
  path: string;
  hash: string;
  snapshot: T;
};

export type LocalAdapterSessionSnapshot = Record<string, unknown> & {
  snapshot_version: string;
  snapshot_kind: "session_panel";
  scenario_id: SessionScenarioId;
  primary_status_label: string;
  caveat_label: string;
  next_safe_action_label: string;
  review_only: true;
  accepted_state: false;
  timeline: Array<{
    id: string;
    label: string;
    status: string;
    description: string;
  }>;
  evidence: Record<string, unknown>;
  warnings: {
    warning_count: number;
    blocked_reason_count: number;
    missing_prerequisites: string[];
    groups: Array<Record<string, unknown>>;
  };
  authority: {
    tags: string[];
    facts: Array<{ label: string; value: string }>;
    flags: Record<string, boolean>;
  };
  handoff: {
    label: string;
    detail: string;
    available: false;
    href: null;
  };
  privacy: {
    bounded_summaries_only: boolean;
    raw_payloads_included: false;
    unsafe_input_material_omitted: boolean;
  };
};

export type LocalAdapterInboxSnapshot = Record<string, unknown> & {
  snapshot_version: string;
  snapshot_kind: "capture_review_inbox_item";
  item_id: string;
  title: string;
  source_session_label: string;
  primary_status: string;
  reviewability: "not_ready" | "waiting";
  stage?: "prepared_waiting_for_codex_return";
  caveat: string;
  next_safe_action: string;
  review_only: true;
  accepted_state: false;
  candidate_count: 0;
  metadata_match: "not_run";
  warning_count: number;
  blocked_reason_count: 0;
  badges: string[];
  authority_tags: string[];
  authority_facts: Array<{ label: string; value: string }>;
  authority_flags: Record<string, boolean>;
  warning_summary: {
    label: string;
    examples: string[];
  };
  blocked_reason_summary: {
    label: string;
    examples: string[];
  };
  safe_links: {
    session_panel: {
      label: string;
      href: null;
      available: false;
      detail: string;
    };
    constellation_preview: {
      label: string;
      href: null;
      available: false;
      detail: string;
    };
  };
  privacy: {
    bounded_summaries_only: boolean;
    raw_payloads_included: false;
    unsafe_input_material_omitted: boolean;
  };
  evidence?: Record<string, unknown>;
};

export type LocalAdapterSnapshotSurfaceIntegrationInput = {
  generatedAt: string;
  sessionViewModelsPath: string;
  inboxViewModelsPath: string;
  readinessPath: string;
  sessionSnapshots: {
    notReady: SnapshotSource<LocalAdapterSessionSnapshot>;
    waiting: SnapshotSource<LocalAdapterSessionSnapshot>;
    prepared: SnapshotSource<LocalAdapterSessionSnapshot>;
  };
  inboxSnapshots: {
    notReady: SnapshotSource<LocalAdapterInboxSnapshot>;
    waiting: SnapshotSource<LocalAdapterInboxSnapshot>;
    prepared: SnapshotSource<LocalAdapterInboxSnapshot>;
  };
};

export type LocalAdapterSessionPanelSurfaceViewModels = {
  view_model_version: typeof CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION;
  surface_kind: "session_panel";
  generated_at: string;
  source_kind: "local_adapter_snapshot_fixtures";
  default_scenario_id: "prepared-waiting-for-codex-return";
  scenarios: LocalAdapterSessionPanelSurfaceScenario[];
};

export type LocalAdapterSessionPanelSurfaceScenario = {
  scenario_id: SessionScenarioId;
  snapshot_state: SnapshotState;
  label: string;
  primary_status_label: string;
  secondary_status_label: string;
  caveat_label: string;
  next_safe_action_label: string;
  display_tone: DisplayTone;
  review_only: true;
  accepted_state: false;
  timeline: LocalAdapterTimelineSection[];
  evidence_cards: LocalAdapterEvidenceCard[];
  warning_groups: Array<Record<string, unknown>>;
  authority_summary: {
    label: string;
    review_only: true;
    accepted_state: false;
    prepare_helper_executed_operational_only: boolean;
  };
  authority_details: {
    tags: string[];
    facts: Array<{ label: string; value: string }>;
    flags: Record<string, boolean>;
  };
  handoff_status: LocalAdapterHandoffStatus;
  privacy_summary: LocalAdapterPrivacySummary;
  source_snapshot_path: string;
  source_snapshot_hash: string;
};

type LocalAdapterTimelineSection = {
  id: string;
  label: string;
  status: string;
  description: string;
};

type LocalAdapterEvidenceCard = {
  id: string;
  title: string;
  rows: Array<{ label: string; value: string }>;
};

type LocalAdapterHandoffStatus = {
  local_status_available: true;
  constellation_available: false;
  validation_available: false;
  returned_candidate_available: false;
  label: string;
  detail: string;
};

type LocalAdapterPrivacySummary = {
  bounded_summaries_only: boolean;
  raw_payloads_included: false;
  unsafe_input_material_omitted: boolean;
  no_raw_prompt_source_or_packet_content: true;
};

export type LocalAdapterInboxSurfaceViewModels = {
  view_model_version: typeof CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION;
  surface_kind: "capture_review_inbox";
  generated_at: string;
  source_kind: "local_adapter_snapshot_fixtures";
  default_filter: "all";
  default_selected_item_id: "local-adapter-prepared-waiting-for-codex-return";
  filters: Array<"all" | "not_ready" | "waiting" | "prepared">;
  counts: {
    total: 3;
    not_ready: 1;
    waiting: 1;
    prepared: 1;
    reviewable: 0;
    blocked: 0;
  };
  items: LocalAdapterInboxSurfaceItem[];
  selected_item_summary: {
    item_id: "local-adapter-prepared-waiting-for-codex-return";
    title: "Prepared, waiting for Codex return";
    reviewability: "waiting";
    returned_candidate_available: false;
    validation_available: false;
    graph_handoff_available: false;
    summary_lines: string[];
  };
};

export type LocalAdapterInboxSurfaceItem = {
  item_id: string;
  snapshot_state: SnapshotState;
  title: string;
  source_session_label: string;
  primary_status: string;
  reviewability: "not_ready" | "waiting";
  stage: "not_ready" | "waiting" | "prepared_waiting_for_codex_return";
  caveat: string;
  next_safe_action: string;
  display_tone: DisplayTone;
  candidate_count: 0;
  warning_count: number;
  blocked_reason_count: 0;
  badges: string[];
  compact_authority_tags: string[];
  evidence_summary: {
    rows: Array<{ label: string; value: string }>;
  };
  safe_links: LocalAdapterInboxSnapshot["safe_links"];
  privacy_summary: LocalAdapterPrivacySummary;
  source_snapshot_path: string;
  source_snapshot_hash: string;
};

export type LocalAdapterSnapshotSurfaceIntegrationReadiness = {
  readiness_version: typeof CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION;
  generated_at: string;
  status: "ready_for_ui_implementation";
  ui_implementation_scope: {
    read_only: true;
    fixture_backed: true;
    local_only: true;
    no_persistence: true;
    no_runtime_mutation: true;
  };
  surfaces: Array<"session_panel" | "capture_review_inbox">;
  scenario_coverage: SnapshotState[];
  generated_view_model_paths: {
    session_panel_surface_view_models_path: string;
    inbox_surface_view_models_path: string;
    readiness_path: string;
  };
  required_future_ui_routes: Array<{
    surface: "session_panel" | "capture_review_inbox";
    suggestion_only: true;
    route_created_in_this_pr: false;
    label: string;
  }>;
  browser_validation_required_for_next_ui_pr: true;
  next_ui_pr_browser_validation_matrix: string[];
  copy_and_density_policy: {
    session_panel: string[];
    inbox: string[];
    expanded_details: string[];
    prohibited_control_copy: string[];
  };
  accessibility_plan: {
    session_panel_keyboard_order: string[];
    inbox_keyboard_order: string[];
    requirements: string[];
  };
  authority_flags: {
    accepted_state_created: false;
    proof_evidence_readiness_created: false;
    review_decision_created: false;
    provider_model_calls: false;
    codex_sdk_calls: false;
    github_api_calls: false;
    network_calls: false;
    db_writes: false;
    clipboard_automation: false;
    live_codex_capture: false;
    runtime_fixture_mutation: false;
    surface_export_created: false;
    core_decision: false;
  };
  prepared_operational_provenance: {
    prepare_helper_executed: true;
    operational_provenance_only: true;
  };
  blockers: [];
  caveats: string[];
};

export type LocalAdapterSnapshotSurfaceIntegrationOutput = {
  sessionViewModels: LocalAdapterSessionPanelSurfaceViewModels;
  inboxViewModels: LocalAdapterInboxSurfaceViewModels;
  readiness: LocalAdapterSnapshotSurfaceIntegrationReadiness;
  sessionViewModelsJson: string;
  inboxViewModelsJson: string;
  readinessJson: string;
};

export type LocalAdapterSnapshotSurfaceIntegrationValidation = {
  valid: boolean;
  errors: string[];
};

const sessionSnapshotVersion =
  "codex_former_local_adapter_session_panel_snapshot.v0.1";
const inboxSnapshotVersion =
  "codex_former_local_adapter_inbox_item_snapshot.v0.1";

export function validateLocalAdapterSnapshotSurfaceIntegrationInputs(
  input: LocalAdapterSnapshotSurfaceIntegrationInput,
): LocalAdapterSnapshotSurfaceIntegrationValidation {
  const errors: string[] = [];
  if (!hasText(input.generatedAt)) {
    errors.push("surface integration generatedAt is required");
  }
  for (const [label, path] of [
    ["sessionViewModelsPath", input.sessionViewModelsPath],
    ["inboxViewModelsPath", input.inboxViewModelsPath],
    ["readinessPath", input.readinessPath],
  ]) {
    if (!hasText(path)) errors.push(`surface integration ${label} is required`);
  }

  const expectedSessions: Array<[keyof LocalAdapterSnapshotSurfaceIntegrationInput["sessionSnapshots"], SessionScenarioId]> = [
    ["notReady", "not-prepared"],
    ["waiting", "waiting-for-candidate"],
    ["prepared", "prepared-waiting-for-codex-return"],
  ];
  for (const [key, scenarioId] of expectedSessions) {
    const source = input.sessionSnapshots[key];
    errors.push(
      ...validateSessionSnapshotSource(source, scenarioId, key === "prepared")
        .errors,
    );
  }

  const expectedInbox: Array<[keyof LocalAdapterSnapshotSurfaceIntegrationInput["inboxSnapshots"], SnapshotState]> = [
    ["notReady", "not_ready"],
    ["waiting", "waiting"],
    ["prepared", "prepared_waiting_for_codex_return"],
  ];
  for (const [key, state] of expectedInbox) {
    const source = input.inboxSnapshots[key];
    errors.push(...validateInboxSnapshotSource(source, state).errors);
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

export function buildLocalAdapterSessionPanelSurfaceViewModels(
  input: LocalAdapterSnapshotSurfaceIntegrationInput,
): LocalAdapterSessionPanelSurfaceViewModels {
  assertValidInput(input);
  return {
    view_model_version:
      CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION,
    surface_kind: "session_panel",
    generated_at: input.generatedAt,
    source_kind: "local_adapter_snapshot_fixtures",
    default_scenario_id: "prepared-waiting-for-codex-return",
    scenarios: [
      buildSessionScenario(input.sessionSnapshots.notReady, "not_ready"),
      buildSessionScenario(input.sessionSnapshots.waiting, "waiting"),
      buildSessionScenario(
        input.sessionSnapshots.prepared,
        "prepared_waiting_for_codex_return",
      ),
    ],
  };
}

export function buildLocalAdapterInboxSurfaceViewModels(
  input: LocalAdapterSnapshotSurfaceIntegrationInput,
): LocalAdapterInboxSurfaceViewModels {
  assertValidInput(input);
  const items = [
    buildInboxItem(input.inboxSnapshots.notReady, "not_ready"),
    buildInboxItem(input.inboxSnapshots.waiting, "waiting"),
    buildInboxItem(input.inboxSnapshots.prepared, "prepared_waiting_for_codex_return"),
  ];
  return {
    view_model_version:
      CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION,
    surface_kind: "capture_review_inbox",
    generated_at: input.generatedAt,
    source_kind: "local_adapter_snapshot_fixtures",
    default_filter: "all",
    default_selected_item_id: "local-adapter-prepared-waiting-for-codex-return",
    filters: ["all", "not_ready", "waiting", "prepared"],
    counts: {
      total: 3,
      not_ready: 1,
      waiting: 1,
      prepared: 1,
      reviewable: 0,
      blocked: 0,
    },
    items,
    selected_item_summary: {
      item_id: "local-adapter-prepared-waiting-for-codex-return",
      title: "Prepared, waiting for Codex return",
      reviewability: "waiting",
      returned_candidate_available: false,
      validation_available: false,
      graph_handoff_available: false,
      summary_lines: [
        "No returned candidate has been captured.",
        "Validation has not run.",
        "No graph handoff is available for the prepared state.",
        "No review candidate exists.",
      ],
    },
  };
}

export function buildLocalAdapterSnapshotSurfaceIntegrationReadiness(
  input: LocalAdapterSnapshotSurfaceIntegrationInput,
): LocalAdapterSnapshotSurfaceIntegrationReadiness {
  assertValidInput(input);
  return {
    readiness_version:
      CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION,
    generated_at: input.generatedAt,
    status: "ready_for_ui_implementation",
    ui_implementation_scope: {
      read_only: true,
      fixture_backed: true,
      local_only: true,
      no_persistence: true,
      no_runtime_mutation: true,
    },
    surfaces: ["session_panel", "capture_review_inbox"],
    scenario_coverage: [
      "not_ready",
      "waiting",
      "prepared_waiting_for_codex_return",
    ],
    generated_view_model_paths: {
      session_panel_surface_view_models_path: input.sessionViewModelsPath,
      inbox_surface_view_models_path: input.inboxViewModelsPath,
      readiness_path: input.readinessPath,
    },
    required_future_ui_routes: [
      {
        surface: "session_panel",
        suggestion_only: true,
        route_created_in_this_pr: false,
        label: "Future read-only adapter snapshot Session Panel fixture route",
      },
      {
        surface: "capture_review_inbox",
        suggestion_only: true,
        route_created_in_this_pr: false,
        label: "Future read-only adapter snapshot Capture Review Inbox fixture route",
      },
    ],
    browser_validation_required_for_next_ui_pr: true,
    next_ui_pr_browser_validation_matrix: [
      "render session panel not_ready",
      "render session panel waiting",
      "render session panel prepared",
      "render inbox all",
      "render inbox not_ready filter",
      "render inbox waiting filter",
      "render inbox prepared filter",
      "select prepared item",
      "verify no accepted-state implication",
      "verify no reviewable implication",
      "verify no Constellation handoff for prepared",
      "verify no raw prompt/source/packet content",
      "verify keyboard navigation",
      "verify 390px no horizontal overflow",
      "verify no console errors",
      "verify no external provider/model/GitHub/Codex/OpenAI traffic",
    ],
    copy_and_density_policy: {
      session_panel: [
        "Show one primary status, one caveat, one next safe action, compact timeline, warning count, and authority summary.",
        "Prepared must stay paired with waiting for Codex return.",
        "Local snapshot available must not be rendered as product approval or graph handoff.",
      ],
      inbox: [
        "Show title, stage/reviewability, one caveat, max two badges, max three compact authority tags, and warning count.",
        "Do not show a full evidence dump by default.",
        "Prepared remains waiting and not reviewable.",
      ],
      expanded_details: [
        "Expanded details may show hashes, helper output refs, output sizes, and authority flags.",
        "Never show raw prompt, source input, packet, transcript, or private marker content.",
        "prepare_helper_executed must be labeled operational provenance only.",
      ],
      prohibited_control_copy: [
        "Accept",
        "Approve",
        "Promote",
        "Reject",
        "Merge",
        "Deploy",
        "Validate",
        "Run Codex",
      ],
    },
    accessibility_plan: {
      session_panel_keyboard_order: [
        "scenario selector",
        "status card",
        "timeline",
        "warning groups",
        "evidence cards",
        "authority details",
        "privacy/caveat details",
      ],
      inbox_keyboard_order: [
        "filter bar",
        "item list",
        "selected item summary",
        "warning/evidence details",
        "authority details",
      ],
      requirements: [
        "Status must not rely on color alone.",
        "Prepared/waiting must be textually distinct from approved/accepted/reviewable.",
        "Collapsed sections must expose expanded/collapsed state in future UI.",
        "No hover-only information.",
        "Screen reader labels must include status, caveat, review-only boundary, and next safe action.",
      ],
    },
    authority_flags: buildFalseReadinessAuthorityFlags(),
    prepared_operational_provenance: {
      prepare_helper_executed: true,
      operational_provenance_only: true,
    },
    blockers: [],
    caveats: [
      "UI not implemented.",
      "Runtime integration not implemented.",
      "Validation not implemented.",
      "Returned candidate capture not implemented.",
      "Constellation handoff not available for prepared state.",
    ],
  };
}

export function buildLocalAdapterSnapshotSurfaceIntegration(
  input: LocalAdapterSnapshotSurfaceIntegrationInput,
): LocalAdapterSnapshotSurfaceIntegrationOutput {
  const sessionViewModels =
    buildLocalAdapterSessionPanelSurfaceViewModels(input);
  const inboxViewModels = buildLocalAdapterInboxSurfaceViewModels(input);
  const readiness =
    buildLocalAdapterSnapshotSurfaceIntegrationReadiness(input);
  return {
    sessionViewModels,
    inboxViewModels,
    readiness,
    sessionViewModelsJson:
      stableStringifyLocalAdapterSurfaceIntegrationJson(sessionViewModels),
    inboxViewModelsJson:
      stableStringifyLocalAdapterSurfaceIntegrationJson(inboxViewModels),
    readinessJson:
      stableStringifyLocalAdapterSurfaceIntegrationJson(readiness),
  };
}

export function stableStringifyLocalAdapterSurfaceIntegrationJson(
  value: unknown,
) {
  return stableStringifyCodexFormerLocalAdapterJson(value);
}

export function hashLocalAdapterSurfaceIntegrationContent(content: string) {
  return hashCodexFormerLocalAdapterContent(content);
}

function buildSessionScenario(
  source: SnapshotSource<LocalAdapterSessionSnapshot>,
  snapshotState: SnapshotState,
): LocalAdapterSessionPanelSurfaceScenario {
  const snapshot = source.snapshot;
  const prepared = snapshotState === "prepared_waiting_for_codex_return";
  return {
    scenario_id: snapshot.scenario_id,
    snapshot_state: snapshotState,
    label: sessionLabel(snapshotState),
    primary_status_label: snapshot.primary_status_label,
    secondary_status_label: sessionSecondaryLabel(snapshotState),
    caveat_label: snapshot.caveat_label,
    next_safe_action_label: sessionNextSafeAction(snapshotState, snapshot),
    display_tone: toneForState(snapshotState),
    review_only: true,
    accepted_state: false,
    timeline: snapshot.timeline.map((step) => ({ ...step })),
    evidence_cards: buildSessionEvidenceCards(source, snapshotState),
    warning_groups: snapshot.warnings.groups.map((group) => ({ ...group })),
    authority_summary: {
      label: prepared
        ? "Review-only local snapshot; prepare helper execution is operational provenance only."
        : "Review-only local snapshot; no validation, acceptance, or graph handoff.",
      review_only: true,
      accepted_state: false,
      prepare_helper_executed_operational_only: prepared,
    },
    authority_details: {
      tags: snapshot.authority.tags,
      facts: snapshot.authority.facts,
      flags: snapshot.authority.flags,
    },
    handoff_status: handoffStatusForState(snapshotState),
    privacy_summary: privacySummary(snapshot.privacy),
    source_snapshot_path: source.path,
    source_snapshot_hash: source.hash,
  };
}

function buildInboxItem(
  source: SnapshotSource<LocalAdapterInboxSnapshot>,
  snapshotState: SnapshotState,
): LocalAdapterInboxSurfaceItem {
  const snapshot = source.snapshot;
  return {
    item_id: snapshot.item_id,
    snapshot_state: snapshotState,
    title: snapshot.title,
    source_session_label: snapshot.source_session_label,
    primary_status: snapshot.primary_status,
    reviewability: snapshot.reviewability,
    stage: inboxStage(snapshotState, snapshot),
    caveat: snapshot.caveat,
    next_safe_action: inboxNextSafeAction(snapshotState, snapshot),
    display_tone: toneForState(snapshotState),
    candidate_count: 0,
    warning_count: snapshot.warning_count,
    blocked_reason_count: 0,
    badges: snapshot.badges.slice(0, 2),
    compact_authority_tags: compactAuthorityTags(snapshot),
    evidence_summary: {
      rows: buildInboxEvidenceRows(source, snapshotState),
    },
    safe_links: snapshot.safe_links,
    privacy_summary: privacySummary(snapshot.privacy),
    source_snapshot_path: source.path,
    source_snapshot_hash: source.hash,
  };
}

function buildSessionEvidenceCards(
  source: SnapshotSource<LocalAdapterSessionSnapshot>,
  snapshotState: SnapshotState,
): LocalAdapterEvidenceCard[] {
  const evidence = source.snapshot.evidence;
  const baseCards: LocalAdapterEvidenceCard[] = [
    {
      id: "source-snapshot",
      title: "Source snapshot",
      rows: [
        { label: "Snapshot path", value: source.path },
        { label: "Snapshot hash", value: source.hash },
        { label: "Candidate count", value: String(evidence.candidate_count ?? 0) },
      ],
    },
    {
      id: "authority-boundary",
      title: "Authority boundary",
      rows: [
        { label: "Review only", value: "true" },
        { label: "Accepted state", value: "false" },
        { label: "Graph handoff", value: "unavailable" },
      ],
    },
  ];
  if (snapshotState !== "prepared_waiting_for_codex_return") {
    return baseCards;
  }
  const prepareEvidence = evidence.prepare_execution;
  if (!isRecord(prepareEvidence)) return baseCards;
  return [
    {
      id: "prepare-execution-summary",
      title: "Prepare execution summary",
      rows: [
        {
          label: "Summary hash",
          value: String(prepareEvidence.prepare_execution_summary_hash ?? ""),
        },
        {
          label: "Execution result",
          value: String(prepareEvidence.execution_result ?? ""),
        },
        {
          label: "Output discovery",
          value: String(prepareEvidence.output_discovery_status ?? ""),
        },
      ],
    },
    {
      id: "helper-output-refs",
      title: "Helper output refs",
      rows: rowsFromRecord(prepareEvidence.helper_output_refs),
    },
    {
      id: "helper-output-hashes",
      title: "Helper output hashes",
      rows: rowsFromRecord(prepareEvidence.helper_output_hashes),
    },
    ...baseCards,
  ];
}

function buildInboxEvidenceRows(
  source: SnapshotSource<LocalAdapterInboxSnapshot>,
  snapshotState: SnapshotState,
) {
  const rows = [
    { label: "Snapshot path", value: source.path },
    { label: "Snapshot hash", value: source.hash },
    { label: "Candidate count", value: "0" },
  ];
  if (snapshotState !== "prepared_waiting_for_codex_return") return rows;
  const evidence = source.snapshot.evidence;
  if (!isRecord(evidence)) return rows;
  rows.push(
    {
      label: "Prepare summary hash",
      value: String(evidence.prepare_execution_summary_hash ?? ""),
    },
    {
      label: "Output discovery",
      value: String(evidence.output_discovery_status ?? ""),
    },
    {
      label: "Operational provenance",
      value: "prepare_helper_executed true; not authority",
    },
  );
  return rows;
}

function validateSessionSnapshotSource(
  source: SnapshotSource<LocalAdapterSessionSnapshot>,
  scenarioId: SessionScenarioId,
  prepared: boolean,
) {
  const errors: string[] = [];
  if (!hasText(source.path)) errors.push(`missing session snapshot path for ${scenarioId}`);
  if (!isSha256(source.hash)) errors.push(`session snapshot hash must be sha256 for ${scenarioId}`);
  const snapshot = source.snapshot;
  if (!isRecord(snapshot)) {
    return { valid: false, errors: [`session snapshot must be an object for ${scenarioId}`] };
  }
  if (snapshot.snapshot_version !== sessionSnapshotVersion) {
    errors.push(`unsupported session snapshot version for ${scenarioId}`);
  }
  if (snapshot.snapshot_kind !== "session_panel") {
    errors.push(`unsupported session snapshot kind for ${scenarioId}`);
  }
  if (snapshot.scenario_id !== scenarioId) {
    errors.push(`session scenario_id mismatch for ${scenarioId}`);
  }
  errors.push(...validateCommonSnapshotAuthority(snapshot, `session ${scenarioId}`, prepared).errors);
  if (snapshot.handoff?.available !== false || snapshot.handoff?.href !== null) {
    errors.push(`session ${scenarioId} must not expose Constellation handoff`);
  }
  if (prepared) {
    if (!String(snapshot.primary_status_label).includes("waiting for Codex return")) {
      errors.push("prepared session status must remain waiting for Codex return");
    }
    const evidence = isRecord(snapshot.evidence) ? snapshot.evidence : {};
    const prepareEvidence = isRecord(evidence.prepare_execution)
      ? evidence.prepare_execution
      : {};
    if (prepareEvidence.validate_helper_executed !== false) {
      errors.push("prepared session must not imply validation");
    }
    if (prepareEvidence.prepare_helper_executed !== true) {
      errors.push("prepared session must record prepare helper operational provenance");
    }
  }
  errors.push(...unsafeMarkerErrors(snapshot, `session ${scenarioId}`));
  errors.push(...forbiddenLeakageErrors(snapshot, `session ${scenarioId}`));
  return { valid: errors.length === 0, errors };
}

function validateInboxSnapshotSource(
  source: SnapshotSource<LocalAdapterInboxSnapshot>,
  state: SnapshotState,
) {
  const errors: string[] = [];
  if (!hasText(source.path)) errors.push(`missing inbox snapshot path for ${state}`);
  if (!isSha256(source.hash)) errors.push(`inbox snapshot hash must be sha256 for ${state}`);
  const snapshot = source.snapshot;
  if (!isRecord(snapshot)) {
    return { valid: false, errors: [`inbox snapshot must be an object for ${state}`] };
  }
  if (snapshot.snapshot_version !== inboxSnapshotVersion) {
    errors.push(`unsupported inbox snapshot version for ${state}`);
  }
  if (snapshot.snapshot_kind !== "capture_review_inbox_item") {
    errors.push(`unsupported inbox snapshot kind for ${state}`);
  }
  errors.push(
    ...validateCommonSnapshotAuthority(
      snapshot,
      `inbox ${state}`,
      state === "prepared_waiting_for_codex_return",
    ).errors,
  );
  if (snapshot.reviewability !== (state === "not_ready" ? "not_ready" : "waiting")) {
    errors.push(`inbox ${state} reviewability is unsupported`);
  }
  if (snapshot.candidate_count !== 0) {
    errors.push(`inbox ${state} candidate_count must be 0`);
  }
  if (snapshot.blocked_reason_count !== 0) {
    errors.push(`inbox ${state} blocked_reason_count must be 0`);
  }
  if ((snapshot.badges ?? []).length > 2) {
    errors.push(`inbox ${state} badges exceed max two`);
  }
  if (snapshot.safe_links?.constellation_preview?.available !== false) {
    errors.push(`inbox ${state} must not expose Constellation handoff`);
  }
  if (state === "prepared_waiting_for_codex_return") {
    if (snapshot.stage !== "prepared_waiting_for_codex_return") {
      errors.push("prepared inbox stage mismatch");
    }
    if (snapshot.reviewability !== "waiting") {
      errors.push("prepared inbox reviewability must remain waiting");
    }
    if (!isRecord(snapshot.evidence)) {
      errors.push("prepared inbox evidence is required");
    } else if (snapshot.evidence.validate_helper_executed !== false) {
      errors.push("prepared inbox must not imply validation");
    }
  }
  errors.push(...unsafeMarkerErrors(snapshot, `inbox ${state}`));
  errors.push(...forbiddenLeakageErrors(snapshot, `inbox ${state}`));
  return { valid: errors.length === 0, errors };
}

function validateCommonSnapshotAuthority(
  snapshot: Record<string, unknown>,
  label: string,
  prepared: boolean,
) {
  const errors: string[] = [];
  if (snapshot.review_only !== true) errors.push(`${label} must be review_only`);
  if (snapshot.accepted_state !== false) errors.push(`${label} accepted_state must be false`);
  const flags = isRecord(snapshot.authority_flags)
    ? snapshot.authority_flags
    : isRecord(snapshot.authority) && isRecord(snapshot.authority.flags)
      ? snapshot.authority.flags
      : {};
  for (const [key, value] of Object.entries(flags)) {
    if (value === true && !(prepared && key === "prepare_helper_executed")) {
      errors.push(`${label} authority flag ${key} must be false`);
    }
  }
  if (flags.validate_helper_executed === true) {
    errors.push(`${label} validate_helper_executed must be false`);
  }
  if (flags.accepted_state_created === true) {
    errors.push(`${label} accepted_state_created must be false`);
  }
  if (flags.review_decision_created === true) {
    errors.push(`${label} review_decision_created must be false`);
  }
  if (flags.surface_export_created === true) {
    errors.push(`${label} surface_export_created must be false`);
  }
  return { valid: errors.length === 0, errors };
}

function assertValidInput(input: LocalAdapterSnapshotSurfaceIntegrationInput) {
  const validation = validateLocalAdapterSnapshotSurfaceIntegrationInputs(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
}

function sessionLabel(state: SnapshotState) {
  if (state === "not_ready") return "Not ready";
  if (state === "waiting") return "Waiting for candidate";
  return "Prepared, waiting for Codex return";
}

function sessionSecondaryLabel(state: SnapshotState) {
  if (state === "not_ready") return "Source input and prepare path are not ready.";
  if (state === "waiting") return "Source input/preflight exists; prepare execution has not completed.";
  return "Prepare execution complete; no returned candidate, validation, or graph handoff.";
}

function sessionNextSafeAction(
  state: SnapshotState,
  snapshot: LocalAdapterSessionSnapshot,
) {
  if (state === "not_ready") {
    return "Prepare bounded source input and complete local preflight before continuing.";
  }
  if (state === "waiting") {
    return "Complete prepare execution, then use the generated prompt in a separate user-started Codex session.";
  }
  return snapshot.next_safe_action_label;
}

function inboxNextSafeAction(
  state: SnapshotState,
  snapshot: LocalAdapterInboxSnapshot,
) {
  if (state === "not_ready") {
    return "Prepare bounded source input and complete local preflight before review.";
  }
  if (state === "waiting") {
    return "Complete prepare execution before waiting for a returned candidate envelope.";
  }
  return snapshot.next_safe_action;
}

function toneForState(state: SnapshotState): DisplayTone {
  if (state === "not_ready") return "pending";
  if (state === "waiting") return "waiting";
  return "prepared_waiting";
}

function handoffStatusForState(state: SnapshotState): LocalAdapterHandoffStatus {
  return {
    local_status_available: true,
    constellation_available: false,
    validation_available: false,
    returned_candidate_available: false,
    label:
      state === "prepared_waiting_for_codex_return"
        ? "Local snapshot ready; graph/review handoff not ready"
        : "Local snapshot available; graph/review handoff not ready",
    detail:
      state === "prepared_waiting_for_codex_return"
        ? "Prepared output can be inspected locally, but returned candidate validation and Constellation handoff are unavailable."
        : "Local adapter state can be inspected, but validation and Constellation handoff are unavailable.",
  };
}

function inboxStage(
  state: SnapshotState,
  snapshot: LocalAdapterInboxSnapshot,
): LocalAdapterInboxSurfaceItem["stage"] {
  if (state === "prepared_waiting_for_codex_return") {
    return "prepared_waiting_for_codex_return";
  }
  if (state === "waiting") return "waiting";
  return snapshot.reviewability === "not_ready" ? "not_ready" : "waiting";
}

function compactAuthorityTags(snapshot: LocalAdapterInboxSnapshot) {
  const preferred = ["review_only", "no_accepted_state", "no_review_decision"];
  const tags = preferred.filter((tag) => snapshot.authority_tags.includes(tag));
  for (const tag of snapshot.authority_tags) {
    if (tags.length >= 3) break;
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 3);
}

function privacySummary(
  privacy: LocalAdapterSessionSnapshot["privacy"] | LocalAdapterInboxSnapshot["privacy"],
): LocalAdapterPrivacySummary {
  return {
    bounded_summaries_only: privacy.bounded_summaries_only,
    raw_payloads_included: false,
    unsafe_input_material_omitted: privacy.unsafe_input_material_omitted,
    no_raw_prompt_source_or_packet_content: true,
  };
}

function rowsFromRecord(value: unknown) {
  if (!isRecord(value)) return [];
  return Object.entries(value).map(([label, rowValue]) => ({
    label,
    value: rowValue === null ? "null" : String(rowValue),
  }));
}

function buildFalseReadinessAuthorityFlags() {
  return {
    accepted_state_created: false as const,
    proof_evidence_readiness_created: false as const,
    review_decision_created: false as const,
    provider_model_calls: false as const,
    codex_sdk_calls: false as const,
    github_api_calls: false as const,
    network_calls: false as const,
    db_writes: false as const,
    clipboard_automation: false as const,
    live_codex_capture: false as const,
    runtime_fixture_mutation: false as const,
    surface_export_created: false as const,
    core_decision: false as const,
  };
}

function unsafeMarkerErrors(value: unknown, label: string) {
  return collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(value).map(
    (marker) =>
      `${label} contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
  );
}

function forbiddenLeakageErrors(value: unknown, label: string) {
  const text = JSON.stringify(value);
  const errors: string[] = [];
  for (const snippet of [
    "pass-with-follow-up",
    "reviewable_with_follow_up",
    "BLOCKED",
    "PASS",
  ]) {
    if (text.includes(snippet)) errors.push(`${label} leaks ${snippet}`);
  }
  for (const key of ["review_candidate", "worker_guidance"]) {
    if (text.includes(key)) errors.push(`${label} must not include ${key}`);
  }
  for (const key of [
    "raw_prompt",
    "prompt_text",
    "raw_packet",
    "packet_content",
    "raw_source",
    "source_input_dump",
  ]) {
    if (text.includes(key)) {
      errors.push(`${label} must not include raw prompt/source/packet content`);
    }
  }
  return errors;
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

export default {
  CODEX_FORMER_LOCAL_ADAPTER_INBOX_SURFACE_VIEW_MODELS_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SURFACE_VIEW_MODELS_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SNAPSHOT_SURFACE_INTEGRATION_READINESS_VERSION,
  buildLocalAdapterInboxSurfaceViewModels,
  buildLocalAdapterSessionPanelSurfaceViewModels,
  buildLocalAdapterSnapshotSurfaceIntegration,
  buildLocalAdapterSnapshotSurfaceIntegrationReadiness,
  hashLocalAdapterSurfaceIntegrationContent,
  stableStringifyLocalAdapterSurfaceIntegrationJson,
  validateLocalAdapterSnapshotSurfaceIntegrationInputs,
};
