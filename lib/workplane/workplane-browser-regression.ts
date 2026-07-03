import type {
  WorkplaneBrowserRegressionAuthorityBoundary,
  WorkplaneBrowserRegressionCapabilityCheck,
  WorkplaneBrowserRegressionCheckStatus,
  WorkplaneBrowserRegressionInput,
  WorkplaneBrowserRegressionMarkerCheck,
  WorkplaneBrowserRegressionNoControlCheck,
  WorkplaneBrowserRegressionReport,
  WorkplaneBrowserRegressionSectionCheck,
  WorkplaneBrowserRegressionSurface,
} from "@/types/workplane-browser-regression";
import { WORKPLANE_BROWSER_REGRESSION_VERSION } from "@/types/workplane-browser-regression";

type RequiredMarker = {
  check_id: string;
  surface: WorkplaneBrowserRegressionSurface;
  marker: string;
};

type IdentityCheck = RequiredMarker & {
  panel_id: string;
  node_id: string;
};

type CapabilityDefinition = {
  capability_id: WorkplaneBrowserRegressionCapabilityCheck["capability_id"];
  legacy_surface: string;
  native_markers: string[];
  recommended_next_check: string;
  status_when_present: WorkplaneBrowserRegressionCheckStatus;
};

export const WORKPLANE_BROWSER_REGRESSION_REQUIRED_MARKERS: RequiredMarker[] = [
  panelMarker("work_queue", "native_replacement"),
  panelMarker("current_perspective", "native_replacement"),
  panelMarker("delta_projection", "delta_projection"),
  panelMarker("projected_delta_batch", "projected_delta_batch"),
  panelMarker("delta_batch", "runner_delta_batch"),
  panelMarker("review_queue", "native_replacement"),
  panelMarker("review_memory_detail", "native_replacement"),
  panelMarker("evidence_handoff", "native_replacement"),
  panelMarker("workplane_inspector", "native_replacement"),
  panelMarker("source_ref_bridge", "native_replacement"),
  panelMarker("projection_candidates", "native_replacement"),
  panelMarker("handoff_builder_preview", "native_replacement"),
  panelMarker("run_postmortem", "native_replacement"),
  {
    check_id: "run_postmortem_detail_panel_marker",
    surface: "native_replacement",
    marker: 'data-workplane-run-postmortem-detail-panel="v0.1"',
  },
  panelMarker("trace_diagnostics", "native_replacement"),
  {
    check_id: "state_proposal_review_panel_marker",
    surface: "native_replacement",
    marker: 'data-workplane-state-proposal-review-panel="v0.1"',
  },
  {
    check_id: "manual_controls_migration_marker",
    surface: "native_replacement",
    marker: 'data-cockpit-manual-controls-migration="v0.1"',
  },
  {
    check_id: "guidebrief_debug_panel_marker",
    surface: "guidebrief_debug",
    marker: 'data-guide-workplane-debug-panel="v0.1"',
  },
  {
    check_id: "guidebrief_intent_projection_panel_marker",
    surface: "guidebrief_intent_projection",
    marker: 'data-guide-intent-projection-panel="v0.1"',
  },
  {
    check_id: "workplane_intent_mode_panel_marker",
    surface: "guidebrief_intent_projection",
    marker: 'data-workplane-intent-mode-panel="v0.1"',
  },
  {
    check_id: "workplane_metrics_panel_marker",
    surface: "workplane_metrics",
    marker: 'data-workplane-metrics-panel="v0.1"',
  },
];

export const WORKPLANE_BROWSER_REGRESSION_DELTABATCH_IDENTITY_CHECKS: IdentityCheck[] =
  [
    identityCheck(
      "delta_projection_perspective_delta_identity",
      "delta_projection",
      "perspective_delta",
      "delta_projection",
    ),
    identityCheck(
      "projected_delta_batch_perspective_delta_identity",
      "projected_delta_batch",
      "perspective_delta",
      "projected_delta_batch",
    ),
    identityCheck(
      "runner_delta_batch_identity",
      "delta_batch",
      "runner_delta_batch",
      "runner_delta_batch",
    ),
  ];

export const WORKPLANE_BROWSER_REGRESSION_REQUIRED_SECTION_TEXT = [
  "Agent Workplane",
  "State Proposal Review",
  "Manual controls migration",
  "GuideBrief Workplane Debug Context",
  "GuideBrief Intent Projection",
  "Workplane Intent Mode",
  "Runner / Workplane Metrics",
  "Projected Delta Batch",
  "Recovered Runner DeltaBatch",
  "Observed",
  "Inferred",
  "Suggested",
  "Needs user judgment",
  "Metrics are signals",
  "not authority",
  "reversible",
  "non-executable",
  "Source Ref Bridge",
  "Trace Bridge",
  "Bridge matrix",
  "validation summary",
  "evidence refs",
  "diagnostic refs",
  "Review / memory proposal detail",
  "durable memory review",
  "Perspective review",
  "validation required",
  "needs user judgment",
  "no durable memory apply",
  "no Perspective apply",
  "Run Postmortem detail",
  "source-backed run postmortem",
  "run_id",
  "step refs",
  "event refs",
  "recovered DeltaBatch",
  "validation status",
  "no runner execution",
  "no runner tick",
  "no DeltaBatch recovery",
] as const;

export const WORKPLANE_BROWSER_REGRESSION_CAPABILITY_CHECKS: CapabilityDefinition[] =
  [
    {
      capability_id: "work_brief",
      legacy_surface: "Legacy Cockpit Work Brief",
      native_markers: [
        'data-workplane-panel-id="work_queue"',
        'data-workplane-node-id="current_objective"',
      ],
      recommended_next_check:
        "Keep compatibility until repeated resume-latency metrics show the native Work Brief is enough.",
      status_when_present: "partial",
    },
    {
      capability_id: "handoff",
      legacy_surface: "Legacy Cockpit handoff and copy paths",
      native_markers: [
        'data-workplane-panel-id="handoff_builder_preview"',
        'data-workplane-panel-id="evidence_handoff"',
      ],
      recommended_next_check:
        "Add richer handoff browser regression before any compatibility removal.",
      status_when_present: "partial",
    },
    {
      capability_id: "perspective",
      legacy_surface: "Legacy Cockpit Perspective tab",
      native_markers: [
        'data-workplane-panel-id="current_perspective"',
        'data-workplane-panel-id="delta_projection"',
        'data-workplane-panel-id="projected_delta_batch"',
      ],
      recommended_next_check:
        "Keep local preview/apply-like controls in compatibility until separately authorized.",
      status_when_present: "partial",
    },
    {
      capability_id: "bridge",
      legacy_surface: "Legacy Cockpit Bridge matrix",
      native_markers: [
        'data-workplane-panel-id="workplane_inspector"',
        'data-workplane-panel-id="source_ref_bridge"',
        'data-workplane-bridge-trace-detail-panel="v0.1"',
        'data-workplane-panel-id="trace_diagnostics"',
        "Bridge matrix",
      ],
      recommended_next_check:
        "Keep Bridge compatibility until dogfood, metrics, browser regression, rollback, and human review all pass.",
      status_when_present: "partial",
    },
    {
      capability_id: "operator_visibility",
      legacy_surface: "Legacy Cockpit Operator tab",
      native_markers: [
        'data-workplane-panel-id="review_queue"',
        'data-workplane-metrics-panel="v0.1"',
        'data-guide-workplane-debug-panel="v0.1"',
      ],
      recommended_next_check:
        "Run more dogfood/metrics baseline for review burden and operator blockers.",
      status_when_present: "partial",
    },
    {
      capability_id: "work_run_visibility",
      legacy_surface: "Legacy Cockpit Work and trace loaders",
      native_markers: [
        'data-workplane-panel-id="delta_batch"',
        'data-workplane-node-id="runner_delta_batch"',
        'data-workplane-panel-id="run_postmortem"',
        'data-workplane-run-postmortem-detail-panel="v0.1"',
        "Run Postmortem detail",
        "source-backed run postmortem",
        "run_id",
        "step refs",
        "event refs",
        "recovered DeltaBatch",
        "validation status",
        "no runner execution",
        "no runner tick",
        "no DeltaBatch recovery",
      ],
      recommended_next_check:
        "Keep compatibility until recovered runner DeltaBatch and source-backed postmortem fields have repeated browser, dogfood, metrics, rollback, and human review evidence.",
      status_when_present: "partial",
    },
    {
      capability_id: "source_ref_visibility",
      legacy_surface: "Legacy Cockpit source and ref views",
      native_markers: [
        'data-workplane-panel-id="source_ref_bridge"',
        'data-workplane-panel-id="workplane_inspector"',
        'data-workplane-panel-id="trace_diagnostics"',
        'data-workplane-panel-id="evidence_handoff"',
        "source refs",
      ],
      recommended_next_check:
        "Use browser regression to keep source/fallback and DeltaBatch identity refs distinguishable.",
      status_when_present: "passed",
    },
    {
      capability_id: "review_memory_proposal_visibility",
      legacy_surface: "Legacy Cockpit proposal and memory review panels",
      native_markers: [
        'data-workplane-panel-id="review_queue"',
        'data-workplane-panel-id="review_memory_detail"',
        'data-workplane-review-memory-detail-panel="v0.1"',
        "Review / memory proposal detail",
        "durable memory review",
        "Perspective review",
        "validation required",
        "Needs user judgment",
        "no durable memory apply",
        "no Perspective apply",
      ],
      recommended_next_check:
        "Keep review/memory detail at partial until dogfood, metrics, GuideBrief debug, and human review prove no useful proposal visibility loss.",
      status_when_present: "partial",
    },
    {
      capability_id: "validation_smoke_visibility",
      legacy_surface: "Legacy Cockpit validation, evidence, and smoke views",
      native_markers: [
        'data-workplane-panel-id="source_ref_bridge"',
        'data-workplane-panel-id="trace_diagnostics"',
        'data-workplane-panel-id="evidence_handoff"',
        "validation summary",
        "evidence refs",
        "diagnostic refs",
      ],
      recommended_next_check:
        "Keep richer validation browser regression and source-backed postmortem checks before retiring legacy validation detail.",
      status_when_present: "partial",
    },
    {
      capability_id: "local_ui_controls",
      legacy_surface: "Former useful legacy Cockpit local UI controls",
      native_markers: [
        'data-cockpit-manual-controls-migration="v0.1"',
        'data-cockpit-manual-control-id="manual_preview_editor"',
        'data-cockpit-manual-control-id="local_write_manual_controls"',
      ],
      recommended_next_check:
        "Keep safe manual preview/copy rows in State Proposal Review and keep local-write/apply controls blocked until a separate authority contract.",
      status_when_present: "partial",
    },
  ];

export const WORKPLANE_BROWSER_REGRESSION_NO_CONTROL_SEGMENT_MARKERS = [
  'data-guide-workplane-debug-panel="v0.1"',
  'data-guide-intent-projection-panel="v0.1"',
  'data-workplane-intent-mode-panel="v0.1"',
  'data-workplane-metrics-panel="v0.1"',
  'data-workplane-panel-id="work_queue"',
  'data-workplane-panel-id="current_perspective"',
  'data-workplane-panel-id="delta_projection"',
  'data-workplane-panel-id="projected_delta_batch"',
  'data-workplane-panel-id="delta_batch"',
  'data-workplane-panel-id="review_queue"',
  'data-workplane-panel-id="review_memory_detail"',
  'data-workplane-panel-id="evidence_handoff"',
  'data-workplane-panel-id="workplane_inspector"',
  'data-workplane-panel-id="source_ref_bridge"',
  'data-workplane-panel-id="projection_candidates"',
  'data-workplane-panel-id="handoff_builder_preview"',
  'data-workplane-panel-id="run_postmortem"',
  'data-workplane-panel-id="trace_diagnostics"',
] as const;

const LEGACY_COMPATIBILITY_MARKER =
  'data-workplane-panel-id="legacy_cockpit_compatibility"';
const LEGACY_SHRINK_MARKER =
  'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"';
const LEGACY_ROUTE_MARKER = 'data-workplane-legacy-cockpit-route="/cockpit"';
const FULL_COCKPIT_SHELL_MARKERS = [
  "six-tab-cockpit",
  'className="six-tab-cockpit"',
  'class="six-tab-cockpit"',
  "cockpit-shell",
  "AugnesCockpit",
] as const;

const DEFAULT_AUTHORITY_BOUNDARY: WorkplaneBrowserRegressionAuthorityBoundary = {
  can_delete_legacy_cockpit: false,
  can_shrink_legacy_cockpit: false,
  can_hide_legacy_cockpit: false,
  can_change_product_ui_behavior: false,
  can_add_product_route: false,
  can_add_api_write_route: false,
  can_add_server_action: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_execute_runner: false,
  can_tick_runner: false,
  can_recover_delta_batch: false,
  can_schedule_runner: false,
  can_write_product_db: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_apply_durable_memory: false,
  can_apply_perspective: false,
  can_auto_apply_delta: false,
  can_merge_publish_retry_replay_deploy: false,
};

export function parseWorkbenchHtmlForRegression(
  input: WorkplaneBrowserRegressionInput,
): WorkplaneBrowserRegressionReport {
  return buildWorkplaneBrowserRegressionReport(input);
}

export function buildEmptyWorkplaneBrowserRegressionReport(
  input: Partial<WorkplaneBrowserRegressionInput> = {},
): WorkplaneBrowserRegressionReport {
  return buildWorkplaneBrowserRegressionReport({
    ...input,
    html: input.html ?? "",
  });
}

export function buildWorkplaneBrowserRegressionReport(
  input: WorkplaneBrowserRegressionInput,
): WorkplaneBrowserRegressionReport {
  const html = normalizeHtml(input.html);
  const checkedAt = input.checked_at ?? new Date().toISOString();
  const markerChecks = WORKPLANE_BROWSER_REGRESSION_REQUIRED_MARKERS.map(
    (required) => markerCheck(required, html),
  );
  const sectionChecks =
    WORKPLANE_BROWSER_REGRESSION_REQUIRED_SECTION_TEXT.map((text) =>
      sectionCheck(text, html),
    );
  const noControlChecks =
    WORKPLANE_BROWSER_REGRESSION_NO_CONTROL_SEGMENT_MARKERS.map((marker) =>
      noControlCheck(marker, html),
    );
  const deltabatchIdentityChecks =
    WORKPLANE_BROWSER_REGRESSION_DELTABATCH_IDENTITY_CHECKS.map((identity) =>
      identityMarkerCheck(identity, html),
    );
  const legacyCompatibilityStatus =
    !hasMarker(html, LEGACY_COMPATIBILITY_MARKER) &&
    !hasMarker(html, LEGACY_SHRINK_MARKER) &&
    !hasMarker(html, LEGACY_ROUTE_MARKER) &&
    !hasFullCockpitShell(html)
      ? "passed"
      : "blocked";
  const capabilityChecks = WORKPLANE_BROWSER_REGRESSION_CAPABILITY_CHECKS.map(
    (definition) => capabilityCheck(definition, html, legacyCompatibilityStatus),
  );
  const markerSummary = {
    passed: markerChecks.filter((check) => check.status === "passed").length,
    failed: markerChecks.filter((check) => check.status === "failed").length,
    blocked: markerChecks.filter((check) => check.status === "blocked").length,
  };
  const capabilitySummary = {
    passed: capabilityChecks.filter((check) => check.status === "passed").length,
    partial: capabilityChecks.filter((check) => check.status === "partial").length,
    needs_review: capabilityChecks.filter(
      (check) => check.status === "needs_review",
    ).length,
    failed: capabilityChecks.filter((check) => check.status === "failed").length,
    blocked: capabilityChecks.filter((check) => check.status === "blocked").length,
  };
  const noControlStatus = summarizeNoControlStatus(noControlChecks);
  const deltabatchIdentityStatus = deltabatchIdentityChecks.every(
    (check) => check.status === "passed",
  )
    ? "passed"
    : "failed";
  const recommendation = buildRecommendation({
    markerChecks,
    sectionChecks,
    noControlStatus,
    deltabatchIdentityStatus,
    legacyCompatibilityStatus,
    capabilityChecks,
    metricsStatus: input.metrics_status,
    dogfoodStatus: input.dogfood_status,
    cockpitShrinkReadiness: input.cockpit_shrink_readiness,
  });
  const status = summarizeReportStatus({
    recommendationStatus: recommendation.status,
    legacyCompatibilityStatus,
    markerSummary,
    noControlStatus,
    deltabatchIdentityStatus,
  });

  return {
    version: WORKPLANE_BROWSER_REGRESSION_VERSION,
    status,
    url: input.url ?? null,
    checked_at: checkedAt,
    source: input.source ?? "server_rendered_html",
    marker_checks: markerChecks,
    section_checks: sectionChecks,
    no_control_checks: noControlChecks,
    capability_checks: capabilityChecks,
    deltabatch_identity_checks: deltabatchIdentityChecks,
    deltabatch_identity_status: deltabatchIdentityStatus,
    legacy_compatibility_status: legacyCompatibilityStatus,
    no_control_status: noControlStatus,
    marker_summary: markerSummary,
    capability_summary: capabilitySummary,
    authority_boundary: DEFAULT_AUTHORITY_BOUNDARY,
    recommendation,
    notes: [
      "Browser regression parses supplied HTML only.",
      "Browser regression is evidence, not shrink authority.",
      "Metrics are signals, not shrink authority.",
      "Dogfood reports are evidence, not shrink authority.",
      ...(input.notes ?? []),
    ],
  };
}

function panelMarker(
  panelId: string,
  surface: WorkplaneBrowserRegressionSurface,
): RequiredMarker {
  return {
    check_id: `${panelId}_panel_marker`,
    surface,
    marker: `data-workplane-panel-id="${panelId}"`,
  };
}

function identityCheck(
  checkId: string,
  panelId: string,
  nodeId: string,
  surface: WorkplaneBrowserRegressionSurface,
): IdentityCheck {
  return {
    check_id: checkId,
    surface,
    marker: `data-workplane-panel-id="${panelId}"`,
    panel_id: panelId,
    node_id: nodeId,
  };
}

function markerCheck(
  required: RequiredMarker,
  html: string,
): WorkplaneBrowserRegressionMarkerCheck {
  const found = hasMarker(html, required.marker);
  return {
    check_id: required.check_id,
    surface: required.surface,
    marker: required.marker,
    found,
    status: found ? "passed" : "failed",
    summary: found
      ? `${required.marker} is present.`
      : `${required.marker} is missing.`,
  };
}

function identityMarkerCheck(
  identity: IdentityCheck,
  html: string,
): WorkplaneBrowserRegressionMarkerCheck {
  const segment = segmentForMarker(html, identity.marker);
  const panelFound = hasMarker(html, identity.marker);
  const nodeMarker = `data-workplane-node-id="${identity.node_id}"`;
  const nodeFound = segment.includes(nodeMarker);
  const collided =
    identity.node_id === "runner_delta_batch"
      ? segment.includes('data-workplane-node-id="perspective_delta"')
      : segment.includes('data-workplane-node-id="runner_delta_batch"');
  const found = panelFound && nodeFound && !collided;

  return {
    check_id: identity.check_id,
    surface: identity.surface,
    marker: `${identity.panel_id} / ${identity.node_id}`,
    found,
    status: found ? "passed" : "failed",
    summary: found
      ? `${identity.panel_id} remains paired with ${identity.node_id}.`
      : `${identity.panel_id} / ${identity.node_id} identity is missing or collided.`,
  };
}

function sectionCheck(
  text: string,
  html: string,
): WorkplaneBrowserRegressionSectionCheck {
  const found = html.toLowerCase().includes(text.toLowerCase());
  return {
    check_id: `${slug(text)}_section_text`,
    surface: sectionSurface(text),
    text,
    found,
    status: found ? "passed" : "failed",
    summary: found ? `${text} is present.` : `${text} is missing.`,
  };
}

function noControlCheck(
  marker: string,
  html: string,
): WorkplaneBrowserRegressionNoControlCheck {
  const segment = segmentForMarker(html, marker);
  if (!segment) {
    return {
      check_id: `${slug(marker)}_no_control_check`,
      surface: surfaceForMarker(marker),
      segment_marker: marker,
      status: "failed",
      forbidden_controls_found: ["segment_missing"],
      summary: `${marker} segment is missing.`,
    };
  }

  const forbidden = forbiddenControlsInSegment(segment);
  return {
    check_id: `${slug(marker)}_no_control_check`,
    surface: surfaceForMarker(marker),
    segment_marker: marker,
    status: forbidden.length === 0 ? "passed" : "failed",
    forbidden_controls_found: forbidden,
    summary:
      forbidden.length === 0
        ? `${marker} segment has no mutation/action controls.`
        : `${marker} segment contains forbidden controls: ${forbidden.join(", ")}`,
  };
}

function capabilityCheck(
  definition: CapabilityDefinition,
  html: string,
  legacyCompatibilityStatus: WorkplaneBrowserRegressionCheckStatus,
): WorkplaneBrowserRegressionCapabilityCheck {
  if (legacyCompatibilityStatus !== "passed") {
    return {
      capability_id: definition.capability_id,
      legacy_surface: definition.legacy_surface,
      native_markers: definition.native_markers,
      compatibility_marker: "legacy Cockpit markers must be absent",
      status: "blocked",
      summary:
        "Legacy Cockpit markers or shell are still present, so route-removal regression is blocked.",
      recommended_next_check:
        "Remove active Cockpit route/component/pointer markers before accepting route removal.",
    };
  }

  const presentCount = definition.native_markers.filter((marker) =>
    hasMarker(html, marker),
  ).length;
  const allPresent = presentCount === definition.native_markers.length;
  const somePresent = presentCount > 0;
  const status = allPresent
    ? definition.status_when_present
    : somePresent
      ? "partial"
      : "failed";

  return {
    capability_id: definition.capability_id,
    legacy_surface: definition.legacy_surface,
    native_markers: definition.native_markers,
    compatibility_marker: "legacy Cockpit markers absent",
    status,
    summary: allPresent
      ? `${definition.capability_id} has native markers and Legacy Cockpit markers are absent.`
      : somePresent
        ? `${definition.capability_id} has partial native marker coverage.`
        : `${definition.capability_id} native marker coverage is missing.`,
    recommended_next_check: definition.recommended_next_check,
  };
}

function buildRecommendation({
  markerChecks,
  sectionChecks,
  noControlStatus,
  deltabatchIdentityStatus,
  legacyCompatibilityStatus,
  capabilityChecks,
  metricsStatus,
  dogfoodStatus,
  cockpitShrinkReadiness,
}: {
  markerChecks: WorkplaneBrowserRegressionMarkerCheck[];
  sectionChecks: WorkplaneBrowserRegressionSectionCheck[];
  noControlStatus: WorkplaneBrowserRegressionCheckStatus;
  deltabatchIdentityStatus: WorkplaneBrowserRegressionCheckStatus;
  legacyCompatibilityStatus: WorkplaneBrowserRegressionCheckStatus;
  capabilityChecks: WorkplaneBrowserRegressionCapabilityCheck[];
  metricsStatus?: string;
  dogfoodStatus?: string;
  cockpitShrinkReadiness?: string;
}): WorkplaneBrowserRegressionReport["recommendation"] {
  const blockers: string[] = [];
  if (legacyCompatibilityStatus !== "passed") {
    blockers.push("Legacy Cockpit compatibility marker, route marker, or shell is still present.");
  }
  for (const check of markerChecks) {
    if (check.status === "failed" || check.status === "blocked") {
      blockers.push(`Required marker missing: ${check.marker}`);
    }
  }
  for (const check of sectionChecks) {
    if (check.status === "failed") {
      blockers.push(`Required rendered text missing: ${check.text}`);
    }
  }
  if (noControlStatus !== "passed") {
    blockers.push("A native replacement/debug/projection/metrics segment contains a mutation/action control.");
  }
  if (deltabatchIdentityStatus !== "passed") {
    blockers.push("DeltaBatch identities are missing or collided.");
  }
  if (capabilityChecks.some((check) => check.status === "failed")) {
    blockers.push("At least one capability lacks native marker coverage.");
  }

  if (blockers.length > 0) {
    return {
      status: legacyCompatibilityStatus === "blocked" ? "blocked" : "failed",
      decision: "do_not_shrink",
      summary: "Do not accept Cockpit route removal; browser regression blockers remain.",
      next_phase: "Fix route-removal browser regression blockers before deletion closeout.",
      blockers,
    };
  }

  const gatedReadiness = [metricsStatus, dogfoodStatus, cockpitShrinkReadiness]
    .filter(Boolean)
    .some((status) => /watch|needs_review|insufficient_data|partial/i.test(status ?? ""));
  const capabilityReviewNeeded = capabilityChecks.some(
    (check) => check.status === "partial" || check.status === "needs_review",
  );

  if (gatedReadiness || capabilityReviewNeeded) {
    return {
      status: "partial",
      decision: "browser_regression_passed_shrink_gated",
      summary:
        "Browser regression markers passed, but remaining native capability evidence still needs review.",
      next_phase:
        "Keep native capability, dogfood, metrics, and human review evidence separate from product authority.",
      blockers: [
        "Browser regression is evidence, not product authority.",
        "Metrics/dogfood/capability readiness still require review.",
      ],
    };
  }

  return {
    status: "passed",
    decision: "eligible_for_shrink_candidate_review",
    summary:
      "Browser regression passed; Cockpit route-removal HTML expectations are satisfied.",
    next_phase:
      "Use the dedicated Cockpit Route Removal validation and runtime checks for deletion closeout.",
    blockers: [],
  };
}

function summarizeReportStatus({
  recommendationStatus,
  legacyCompatibilityStatus,
  markerSummary,
  noControlStatus,
  deltabatchIdentityStatus,
}: {
  recommendationStatus: WorkplaneBrowserRegressionCheckStatus;
  legacyCompatibilityStatus: WorkplaneBrowserRegressionCheckStatus;
  markerSummary: WorkplaneBrowserRegressionReport["marker_summary"];
  noControlStatus: WorkplaneBrowserRegressionCheckStatus;
  deltabatchIdentityStatus: WorkplaneBrowserRegressionCheckStatus;
}): WorkplaneBrowserRegressionReport["status"] {
  if (legacyCompatibilityStatus === "blocked") return "blocked";
  if (
    markerSummary.failed > 0 ||
    noControlStatus === "failed" ||
    deltabatchIdentityStatus === "failed"
  ) {
    return "failed";
  }
  if (recommendationStatus === "partial") return "partial";
  return recommendationStatus === "passed" ? "passed" : recommendationStatus;
}

function summarizeNoControlStatus(
  checks: WorkplaneBrowserRegressionNoControlCheck[],
): WorkplaneBrowserRegressionCheckStatus {
  return checks.every((check) => check.status === "passed") ? "passed" : "failed";
}

function forbiddenControlsInSegment(segment: string): string[] {
  const checks: Array<[string, RegExp]> = [
    ["button", /<button\b/i],
    ["form", /<form\b/i],
    ["input", /<input\b/i],
    ["textarea", /<textarea\b/i],
    ["formAction", /\bformaction\b/i],
    ["onClick", /\bonclick\b/i],
    ["server action marker", /\$ACTION_|server action/i],
    [
      "mutation button copy",
      /<button[^>]*>[\s\S]{0,240}\b(apply|approve|reject|recover|tick|schedule|launch|execute)\b/i,
    ],
    [
      "role button mutation copy",
      /role=["']button["'][^>]*>[\s\S]{0,240}\b(apply|approve|reject|recover|tick|schedule|launch|execute)\b/i,
    ],
  ];
  return checks
    .filter(([, pattern]) => pattern.test(segment))
    .map(([label]) => label);
}

function segmentForMarker(html: string, marker: string): string {
  const index = html.indexOf(marker);
  if (index < 0) return "";

  const elementStart = html.lastIndexOf("<", index);
  if (elementStart >= 0) {
    const openTag = html.slice(elementStart, index);
    const tagMatch = /^<\s*(aside|section|article|div)\b/i.exec(openTag);
    if (tagMatch) {
      const tag = tagMatch[1].toLowerCase();
      const closingTag = `</${tag}>`;
      const closeIndex = html.indexOf(closingTag, index + marker.length);
      if (closeIndex > index) {
        return html.slice(elementStart, closeIndex + closingTag.length);
      }
    }
  }

  const segmentBoundaries = [
    ...WORKPLANE_BROWSER_REGRESSION_REQUIRED_MARKERS.map((item) => item.marker),
    ...WORKPLANE_BROWSER_REGRESSION_NO_CONTROL_SEGMENT_MARKERS,
  ];
  const nextIndex = segmentBoundaries
    .map((boundary) => html.indexOf(boundary, index + marker.length))
    .filter((boundaryIndex) => boundaryIndex > index)
    .sort((a, b) => a - b)[0];
  return html.slice(index, nextIndex ?? index + 8000);
}

function hasMarker(html: string, marker: string): boolean {
  return html.toLowerCase().includes(marker.toLowerCase());
}

function hasFullCockpitShell(html: string): boolean {
  return FULL_COCKPIT_SHELL_MARKERS.some((marker) => hasMarker(html, marker));
}

function normalizeHtml(html: string): string {
  return html
    .replace(/\\"/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&");
}

function surfaceForMarker(marker: string): WorkplaneBrowserRegressionSurface {
  if (marker.includes("guide-workplane-debug")) return "guidebrief_debug";
  if (marker.includes("guide-intent") || marker.includes("intent-mode")) {
    return "guidebrief_intent_projection";
  }
  if (marker.includes("metrics")) return "workplane_metrics";
  if (marker.includes("delta_projection")) return "delta_projection";
  if (marker.includes("projected_delta_batch")) return "projected_delta_batch";
  if (marker.includes("delta_batch")) return "runner_delta_batch";
  return "native_replacement";
}

function sectionSurface(text: string): WorkplaneBrowserRegressionSurface {
  if (/GuideBrief Workplane Debug|Observed|Inferred|Suggested/i.test(text)) {
    return "guidebrief_debug";
  }
  if (/GuideBrief Intent|Workplane Intent|reversible|non-executable/i.test(text)) {
    return "guidebrief_intent_projection";
  }
  if (/Metrics|signals|authority/i.test(text)) return "workplane_metrics";
  if (/Projected Delta Batch/i.test(text)) return "projected_delta_batch";
  if (/Recovered Runner DeltaBatch/i.test(text)) return "runner_delta_batch";
  if (/Cockpit Route Removal|Manual controls migration|State Proposal Review/i.test(text)) {
    return "cockpit_route_removal";
  }
  return "agent_workplane";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
