import type {
  LegacyCockpitControlInventoryAuthorityBoundary,
  LegacyCockpitControlInventoryControlClass,
  LegacyCockpitControlInventoryEvidence,
  LegacyCockpitControlInventoryEvidenceStatus,
  LegacyCockpitControlInventoryInput,
  LegacyCockpitControlInventoryItem,
  LegacyCockpitControlInventoryComparison,
  LegacyCockpitControlInventoryReport,
  LegacyCockpitProposalDiffPreflight,
} from "@/types/legacy-cockpit-control-inventory";
import {
  LEGACY_COCKPIT_CONTROL_INVENTORY_VERSION,
} from "@/types/legacy-cockpit-control-inventory";
import type {
  LegacyCockpitLocalControl,
  LegacyCockpitControlClassificationRead,
} from "@/types/legacy-cockpit-local-control-classification";
import {
  buildLegacyCockpitLocalControlClassification,
} from "@/lib/workplane/legacy-cockpit-local-control-classification";

export const LEGACY_COCKPIT_CONTROL_INVENTORY_SMOKE_REFS = [
  "smoke:legacy-cockpit-control-inventory-v0-1",
  "smoke:legacy-cockpit-local-control-classification-v0-1",
  "smoke:workplane-native-browser-regression-v0-1",
] as const;

export const LEGACY_COCKPIT_CONTROL_INVENTORY_REQUIRED_DOCS = [
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
  "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md",
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
] as const;

export const LEGACY_COCKPIT_CONTROL_INVENTORY_AUTHORITY_BOUNDARY: LegacyCockpitControlInventoryAuthorityBoundary =
  {
    surface: "legacy_cockpit_control_inventory",
    inventory_is_evidence_not_shrink_authority: true,
    proposal_diff_preflight_is_read_only: true,
    can_write_product_db: false,
    can_delete_legacy_cockpit: false,
    can_shrink_legacy_cockpit: false,
    can_hide_legacy_cockpit: false,
    can_change_product_ui_behavior: false,
    can_add_product_route: false,
    can_add_api_write_route: false,
    can_add_server_action: false,
    can_add_chat_composer: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_actuate_github: false,
    can_execute_codex: false,
    can_execute_runner_in_product: false,
    can_tick_runner_in_product: false,
    can_recover_delta_batch_in_product: false,
    can_schedule_runner_in_product: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_apply_durable_memory: false,
    can_apply_perspective: false,
    can_auto_apply_delta: false,
    can_merge_publish_retry_replay_deploy: false,
    can_absorb_local_write_control_without_contract: false,
    can_approve_proposal: false,
    can_reject_proposal: false,
    can_commit_proposal: false,
    notes: [
      "Inventory and proposal diff preflight are read-only evidence only.",
      "No Legacy Cockpit deletion, shrink, hide, disable, native absorption, apply, commit, reject, route, provider, GitHub, Codex, runner, DB, proof, evidence, memory, Perspective, or delta authority is granted.",
    ],
  };

export const LEGACY_COCKPIT_CONTROL_INVENTORY_EVIDENCE_LABELS: Record<
  string,
  readonly string[]
> = {
  cockpit_tab_navigation: ["Overview", "Work", "Perspective", "Bridge", "Operator"],
  overview_review_local_proposals_navigation: ["Review Local Proposals"],
  work_item_selection: ["Work ID", "AG-001"],
  work_codex_handoff_copy: ["Codex handoff", "Copy"],
  work_event_template_copy: ["work event template", "Copy"],
  perspective_packet_copy_export: ["Copyable", "Codex handoff", "packet"],
  perspective_formation_basis_switch: ["Formation Basis", "Apply View"],
  perspective_lens_scope_controls: [
    "Whole Constellation",
    "Connected Node",
    "Cluster",
    "Manual Selection",
  ],
  manual_gravity_preview_controls: ["Manual Gravity", "Preview"],
  manual_gravity_local_draft_controls: ["local draft", "Manual Gravity"],
  manual_pasted_text_preview_controls: ["Manual pasted note", "textarea", "Preview"],
  bridge_tab_matrix_navigation: ["Bridge", "capability matrix"],
  operator_plan_next: ["Plan Next"],
  safe_local_checklist_actions: ["README Checklist", "Security Checklist", "Demo Script"],
  observe_local_proposal_input: ["Observe", "proposal"],
  proposal_consolidate_candidates: ["Consolidate Candidates"],
  proposal_commit_reject: ["Commit", "Reject"],
  ag_resume_lifecycle_review_controls: ["AG Resume", "lifecycle"],
  evidence_pack_loader: ["Evidence Pack"],
  session_trace_loader: ["Session Trace"],
  temporal_interpretation_preview_loader: ["Temporal Interpretation Preview", "OpenAI"],
  temporal_review_artifact_loader: ["Temporal Review Artifacts"],
  runner_trace_visibility_controls: ["Runner DeltaBatch", "Run Postmortem"],
  external_publish_merge_retry_replay_deploy_controls: [
    "publish",
    "merge",
    "retry",
    "replay",
    "deploy",
  ],
  provider_github_codex_execution_controls: ["OpenAI", "GitHub", "Codex"],
  durable_memory_perspective_delta_apply_controls: [
    "durable memory",
    "Perspective apply",
    "delta auto-apply",
  ],
  unknown_legacy_browser_manual_controls: [
    "legacy_cockpit_compatibility",
    "Legacy Cockpit remains reachable",
  ],
};

const DEFAULT_AS_OF = "2026-07-03T00:00:00.000Z";

const CLASS_VALUES: LegacyCockpitControlInventoryControlClass[] = [
  "read_only",
  "copy_only",
  "preview_only",
  "local_write",
  "forbidden",
  "unknown",
];

const EVIDENCE_STATUS_VALUES: LegacyCockpitControlInventoryEvidenceStatus[] = [
  "observed",
  "inferred",
  "not_observed",
  "needs_manual_review",
];

export function buildLegacyCockpitControlInventoryReport(
  input: LegacyCockpitControlInventoryInput = {},
): LegacyCockpitControlInventoryReport {
  const previous =
    input.previous_classification ??
    buildLegacyCockpitLocalControlClassification({
      as_of: input.as_of,
      source_text: input.source_text,
      html: input.workbench_html ?? input.compatibility_island_html,
    });
  const source = collectSourceText(input);
  const compatibilityMarkerPresent =
    hasText(source, 'data-workplane-panel-id="legacy_cockpit_compatibility"') ||
    hasText(source, "legacy_cockpit_compatibility");
  const embeddedCompatibilityContentPresent =
    compatibilityMarkerPresent &&
    hasText(source, "Legacy Cockpit remains reachable") &&
    hasText(source, "Existing Cockpit compatibility content");
  const routeSplitCompatibilityContentPresent =
    compatibilityMarkerPresent &&
    hasText(source, 'data-workplane-legacy-cockpit-route="/cockpit"') &&
    hasText(source, 'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"') &&
    hasText(source, "Full Legacy Cockpit remains reachable at /cockpit");
  const serverRenderedCompatibilityContentPresent =
    embeddedCompatibilityContentPresent || routeSplitCompatibilityContentPresent;
  const augnesCockpitComponentPresent =
    hasText(source, "AugnesCockpit") ||
    hasText(source, "export function AugnesCockpit") ||
    hasText(source, "six-tab-cockpit");
  const unknownReductionEvidence = hasUnknownReductionEvidence(input, source);
  const controls = previous.controls.map((control) =>
    buildInventoryItem({
      control,
      source,
      input,
      unknownReductionEvidence,
    }),
  );
  const counts = {
    by_class: countInventoryBy(controls, CLASS_VALUES, (item) => item.control_class),
    by_evidence_status: countInventoryBy(
      controls,
      EVIDENCE_STATUS_VALUES,
      (item) => item.evidence_status,
    ),
  };
  const comparison = compareAgainstLegacyCockpitLocalControlClassification({
    previous,
    controls,
  });
  const proposalDiffPreflight = buildLegacyCockpitProposalDiffPreflight(input);
  const blockers = [
    ...(comparison.after_unknown_count > 0
      ? ["unknown legacy controls remain unclassified"]
      : []),
    "local-write controls remain compatibility-only until a separate authority contract exists",
    ...(proposalDiffPreflight.needs_richer_proposal_diff_detail
      ? ["proposal diff preflight says richer read-only proposal diff detail is still needed"]
      : []),
    "browser regression, metrics, dogfood, local-control inventory, rollback, and human review must all be green before shrink",
  ];

  return {
    report_version: LEGACY_COCKPIT_CONTROL_INVENTORY_VERSION,
    status: comparison.after_unknown_count > 0 ? "needs_review" : "partial",
    as_of: input.as_of ?? DEFAULT_AS_OF,
    compatibility_marker_present: compatibilityMarkerPresent,
    augnes_cockpit_component_present: augnesCockpitComponentPresent,
    server_rendered_compatibility_content_present:
      serverRenderedCompatibilityContentPresent,
    controls,
    counts,
    comparison_to_v0_1_classification: comparison,
    proposal_diff_preflight: proposalDiffPreflight,
    shrink_readiness: {
      status: "gated",
      summary:
        "Control inventory can reduce the #933 unknown bucket only for evidence-backed inspected surfaces; it is not shrink authority.",
      blockers,
    },
    authority_boundary: LEGACY_COCKPIT_CONTROL_INVENTORY_AUTHORITY_BOUNDARY,
    recommended_next_reviews: [
      ...(comparison.after_unknown_count > 0
        ? ["complete DOM/manual inventory for remaining unknown controls"]
        : ["review the evidence-backed unknown reduction and keep compatibility rollback"]),
      ...(proposalDiffPreflight.needs_richer_proposal_diff_detail
        ? ["add richer read-only proposal diff detail before claiming review burden improvement"]
        : ["keep proposal diff preflight in the repeated dogfood/metrics baseline"]),
      "separate authority contract before any local-write native absorption",
      "future shrink candidate only after every shrink gate is green",
    ],
    caveats: [
      "Server-rendered HTML can only observe currently rendered compatibility content.",
      "DOM/manual evidence is used to classify visibility, copy, preview, local-write, forbidden, or unknown status; it does not add any product authority.",
      ...(input.caveats ?? []),
    ],
    source_refs: uniqueStrings([
      "components/augnes-cockpit.tsx",
      "components/workplane/legacy-cockpit-compatibility-panel.tsx",
      "components/workplane/agent-workplane.tsx",
      "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md",
      ...LEGACY_COCKPIT_CONTROL_INVENTORY_REQUIRED_DOCS,
      ...(input.source_refs ?? []),
    ]),
    validation_summary: {
      smoke_refs: [...LEGACY_COCKPIT_CONTROL_INVENTORY_SMOKE_REFS],
      docs_refs: [...LEGACY_COCKPIT_CONTROL_INVENTORY_REQUIRED_DOCS],
      notes: [
        "smoke:legacy-cockpit-control-inventory-v0-1 validates static contract, helper behavior, compatibility rendering, proposal diff preflight, and authority boundary.",
      ],
    },
  };
}

export function buildLegacyCockpitProposalDiffPreflight(
  input: LegacyCockpitControlInventoryInput = {},
): LegacyCockpitProposalDiffPreflight {
  const source = normalize(
    [
      input.proposal_diff_source_text,
      input.workbench_html,
      input.compatibility_island_html,
      input.source_text,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const proposalFieldPatterns: Array<[string, string[]]> = [
    ["proposal_diff_marker", ["proposal diff", "rich proposal diff"]],
    ["delta_summaries", ["delta summaries", "delta summary"]],
    ["source_refs", ["source refs", "source_ref"]],
    ["merge_policy", ["merge policy"]],
    ["non_goals", ["non-goals", "non goals"]],
    ["candidate_detail", ["candidate detail", "proposal candidate"]],
    ["before_after_detail", ["before", "after"]],
    ["field_level_change_detail", ["field-level", "field level"]],
    ["impact_detail", ["impact", "review burden"]],
  ];
  const observedFields = proposalFieldPatterns
    .filter(([, labels]) => labels.some((label: string) => source.includes(label)))
    .map(([field]) => field);

  if (!source.trim()) {
    return {
      status: "insufficient_data",
      needs_richer_proposal_diff_detail: true,
      can_apply_or_commit: false,
      observed_fields: [],
      missing_fields: [
        "proposal_diff_marker",
        "before_after_detail",
        "field_level_change_detail",
        "impact_detail",
      ],
      evidence_refs: input.proposal_diff_evidence_refs ?? [],
      recommendation:
        "Collect read-only proposal diff evidence before claiming review burden improvement.",
      notes: [
        "No proposal diff source was supplied; preflight cannot approve readiness.",
      ],
    };
  }

  const missingFields = [
    "proposal_diff_marker",
    "before_after_detail",
    "field_level_change_detail",
    "impact_detail",
  ].filter((field) => !observedFields.includes(field));
  const explicitGap =
    source.includes("missing_richer_proposal_diff_detail") ||
    source.includes("not a rich proposal diff") ||
    source.includes("richer proposal diff");
  const needsRicherDetail = explicitGap || missingFields.length > 0;

  return {
    status: needsRicherDetail ? "needs_richer_detail" : "sufficient_for_preflight",
    needs_richer_proposal_diff_detail: needsRicherDetail,
    can_apply_or_commit: false,
    observed_fields: observedFields,
    missing_fields: missingFields,
    evidence_refs: input.proposal_diff_evidence_refs ?? [
      "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md",
      "lib/workplane/workplane-review-memory-detail.ts",
    ],
    recommendation: needsRicherDetail
      ? "Add richer read-only proposal diff detail before using this as review-burden improvement evidence."
      : "Proposal diff detail is sufficient for this read-only preflight; it still grants no apply, commit, or reject authority.",
    notes: [
      "Proposal diff preflight is diagnostic only.",
      "It does not implement apply, approve, reject, commit, or proposal mutation.",
    ],
  };
}

export function compareAgainstLegacyCockpitLocalControlClassification({
  previous,
  controls,
}: {
  previous: LegacyCockpitControlClassificationRead;
  controls: LegacyCockpitControlInventoryItem[];
}): LegacyCockpitControlInventoryComparison {
  const previousUnknownCount = previous.unknown_controls.length;
  const afterUnknownCount = controls.filter(
    (item) => item.control_class === "unknown",
  ).length;
  const classifiedWithDomOrManualEvidence = controls.filter((item) =>
    item.evidence.some(
      (evidence) =>
        evidence.evidence_status === "observed" &&
        (evidence.evidence_kind === "server_rendered_html" ||
          evidence.evidence_kind === "manual_dom_review"),
    ),
  ).length;
  const localWriteControlsStillCompatibilityOnly = controls.filter(
    (item) => item.control_class === "local_write",
  ).length;
  const forbiddenControlsStillForbidden = controls.filter(
    (item) => item.control_class === "forbidden",
  ).length;

  const unknownReductionClaim: LegacyCockpitControlInventoryComparison["unknown_reduction_claim"] =
    afterUnknownCount < previousUnknownCount
      ? "reduced_with_evidence"
      : afterUnknownCount === previousUnknownCount
        ? "unchanged"
        : "blocked";

  return {
    previous_report_version: previous.version,
    previous_unknown_count: previousUnknownCount,
    after_unknown_count: afterUnknownCount,
    unknown_delta: afterUnknownCount - previousUnknownCount,
    unknown_reduction_claim: unknownReductionClaim,
    controls_compared: controls.length,
    classified_with_dom_or_manual_evidence: classifiedWithDomOrManualEvidence,
    local_write_controls_still_compatibility_only:
      localWriteControlsStillCompatibilityOnly,
    forbidden_controls_still_forbidden: forbiddenControlsStillForbidden,
    notes: [
      "Comparison is against Legacy Cockpit Local Control Classification v0.1.",
      "Unknown reduction is allowed only when DOM/manual evidence is present.",
      "Reducing unknown does not grant shrink authority.",
    ],
  };
}

function buildInventoryItem({
  control,
  source,
  input,
  unknownReductionEvidence,
}: {
  control: LegacyCockpitLocalControl;
  source: string;
  input: LegacyCockpitControlInventoryInput;
  unknownReductionEvidence: boolean;
}): LegacyCockpitControlInventoryItem {
  const labels =
    LEGACY_COCKPIT_CONTROL_INVENTORY_EVIDENCE_LABELS[control.control_id] ?? [];
  const evidence: LegacyCockpitControlInventoryEvidence[] = [];
  const matchedLabel = labels.find((label) => hasText(source, label));

  if (matchedLabel) {
    evidence.push({
      evidence_id: `${control.control_id}.server_rendered_html`,
      control_id: control.control_id,
      evidence_kind: "server_rendered_html",
      evidence_status: "observed",
      observed_label: matchedLabel,
      observed_in: "server-rendered /workbench compatibility island or supplied HTML",
      source_ref: "GET /workbench HTML",
      notes: ["Server-rendered HTML observation is read-only evidence."],
    });
  }

  if (hasText(input.source_text ?? "", control.control_id)) {
    evidence.push({
      evidence_id: `${control.control_id}.static_source`,
      control_id: control.control_id,
      evidence_kind: "static_source",
      evidence_status: "inferred",
      observed_label: control.control_id,
      observed_in: "supplied source text",
      source_ref: "source_text",
      notes: ["Static source hint is weaker than DOM/manual evidence."],
    });
  }

  evidence.push(
    ...(input.manual_evidence ?? []).filter(
      (item) => item.control_id === control.control_id,
    ),
  );

  const isPreviousUnknown =
    control.control_id === "unknown_legacy_browser_manual_controls";
  if (isPreviousUnknown && unknownReductionEvidence) {
    evidence.push({
      evidence_id: "unknown_legacy_browser_manual_controls.dom_manual_reduction",
      control_id: control.control_id,
      evidence_kind: input.manual_evidence?.some(
        (item) => item.control_id === control.control_id,
      )
        ? "manual_dom_review"
        : "server_rendered_html",
      evidence_status: "observed",
      observed_label: "no extra unclassified server-rendered compatibility controls",
      observed_in: "Legacy Cockpit compatibility island inventory",
      source_ref: "GET /workbench HTML + manual/static inventory preflight",
      notes: [
        "This reduces the #933 generic unknown bucket only for the inspected compatibility island.",
      ],
    });
  }

  const evidenceStatus = selectEvidenceStatus({
    evidence,
    isPreviousUnknown,
    unknownReductionEvidence,
  });
  const controlClass =
    isPreviousUnknown && unknownReductionEvidence
      ? "read_only"
      : mapClassificationClass(control.control_class);

  return {
    control_id: control.control_id,
    previous_control_id: control.control_id,
    label: isPreviousUnknown && unknownReductionEvidence
      ? "No extra unclassified server-rendered compatibility controls observed"
      : control.legacy_surface,
    control_class: controlClass,
    authority_class:
      isPreviousUnknown && unknownReductionEvidence
        ? "no_authority"
        : mapAuthorityClass(control.authority_class),
    evidence_status: evidenceStatus,
    evidence,
    previous_classification_class: control.control_class,
    previous_classification_status: control.status,
    previous_migration_target: control.migration_target,
    unknown_reduction_effect: isPreviousUnknown
      ? unknownReductionEvidence
        ? "reduces_previous_unknown"
        : "keeps_previous_unknown"
      : "not_unknown_related",
    shrink_gate_effect: isPreviousUnknown && unknownReductionEvidence
      ? "Reduces the inspected unknown bucket, but shrink remains gated by local-write controls, browser regression, dogfood/metrics, rollback, and human review."
      : control.shrink_gate_effect,
    recommended_next_review: isPreviousUnknown && unknownReductionEvidence
      ? "review DOM/manual evidence and keep compatibility rollback before any shrink candidate"
      : control.recommended_next_review,
  };
}

function selectEvidenceStatus({
  evidence,
  isPreviousUnknown,
  unknownReductionEvidence,
}: {
  evidence: LegacyCockpitControlInventoryEvidence[];
  isPreviousUnknown: boolean;
  unknownReductionEvidence: boolean;
}): LegacyCockpitControlInventoryEvidenceStatus {
  if (
    evidence.some((item) => item.evidence_status === "observed") ||
    (isPreviousUnknown && unknownReductionEvidence)
  ) {
    return "observed";
  }
  if (evidence.some((item) => item.evidence_status === "inferred")) {
    return "inferred";
  }
  return isPreviousUnknown ? "needs_manual_review" : "not_observed";
}

function hasUnknownReductionEvidence(
  input: LegacyCockpitControlInventoryInput,
  source: string,
): boolean {
  const manualUnknown = (input.manual_evidence ?? []).some(
    (evidence) =>
      evidence.control_id === "unknown_legacy_browser_manual_controls" &&
      evidence.evidence_status === "observed",
  );
  if (manualUnknown) {
    return true;
  }

  const serverRenderedSignals = [
    'data-workplane-panel-id="legacy_cockpit_compatibility"',
    "Legacy Cockpit remains reachable",
    "Existing Cockpit compatibility content",
    "six-tab-cockpit",
    "Formation Basis",
    "Manual Gravity",
    "Review / memory proposal detail",
  ].filter((label) => hasText(source, label));

  return serverRenderedSignals.length >= 5;
}

function mapClassificationClass(
  value: LegacyCockpitLocalControl["control_class"],
): LegacyCockpitControlInventoryControlClass {
  if (value === "read_only_visibility" || value === "export_only") {
    return "read_only";
  }
  if (value === "copy_only") {
    return "copy_only";
  }
  if (value === "preview_only") {
    return "preview_only";
  }
  if (value === "local_write" || value === "local_draft") {
    return "local_write";
  }
  if (value === "external_authority_forbidden") {
    return "forbidden";
  }
  if (value === "compatibility_only") {
    return "local_write";
  }
  return "unknown";
}

function mapAuthorityClass(value: LegacyCockpitLocalControl["authority_class"]) {
  if (value === "external_execution_authority") {
    return "forbidden_authority";
  }
  return value;
}

function collectSourceText(input: LegacyCockpitControlInventoryInput) {
  return [
    input.compatibility_island_html,
    input.workbench_html,
    input.source_text,
    input.proposal_diff_source_text,
  ]
    .filter(Boolean)
    .join("\n");
}

function hasText(source: string, needle: string) {
  return normalize(source).includes(normalize(needle));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function countInventoryBy<TValue extends string>(
  items: LegacyCockpitControlInventoryItem[],
  values: readonly TValue[],
  selector: (item: LegacyCockpitControlInventoryItem) => TValue,
): Record<TValue, number> {
  return values.reduce(
    (counts, value) => ({
      ...counts,
      [value]: items.filter((item) => selector(item) === value).length,
    }),
    {} as Record<TValue, number>,
  );
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))];
}

export type {
  LegacyCockpitControlInventoryControlClass,
  LegacyCockpitControlInventoryEvidenceStatus,
  LegacyCockpitProposalDiffPreflight,
};
