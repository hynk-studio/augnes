import type {
  LegacyCockpitControlClass,
  LegacyCockpitControlClassificationAuthorityBoundary,
  LegacyCockpitControlClassificationCounts,
  LegacyCockpitControlClassificationInput,
  LegacyCockpitControlClassificationRead,
  LegacyCockpitControlGroup,
  LegacyCockpitControlGroupId,
  LegacyCockpitControlMigrationTarget,
  LegacyCockpitControlStatus,
  LegacyCockpitLocalControl,
} from "@/types/legacy-cockpit-local-control-classification";
import {
  LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_VERSION,
} from "@/types/legacy-cockpit-local-control-classification";

export const LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_SMOKE_REFS = [
  "smoke:legacy-cockpit-local-control-classification-v0-1",
  "smoke:agent-workplane-cockpit-inheritance-v0-1",
  "smoke:workplane-native-browser-regression-v0-1",
] as const;

export const LEGACY_COCKPIT_LOCAL_CONTROL_GROUPS: LegacyCockpitControlGroup[] = [
  {
    group_id: "overview_work_brief",
    title: "Overview / Work Brief controls",
    summary:
      "Cockpit tab navigation, review-proposal navigation, work item selection, and current work visibility controls.",
    control_ids: [
      "cockpit_tab_navigation",
      "overview_review_local_proposals_navigation",
      "work_item_selection",
    ],
    default_control_class: "read_only_visibility",
    default_authority_class: "no_authority",
    default_migration_target: "native_workplane_read_only",
  },
  {
    group_id: "handoff_copy_export",
    title: "Handoff copy/export controls",
    summary:
      "Copy-only Codex/ChatGPT handoff packets, work event templates, and selectable preview text.",
    control_ids: [
      "work_codex_handoff_copy",
      "work_event_template_copy",
      "perspective_packet_copy_export",
    ],
    default_control_class: "copy_only",
    default_authority_class: "copy_authority",
    default_migration_target: "native_workplane_copy_only",
  },
  {
    group_id: "perspective_preview",
    title: "Perspective preview and local draft controls",
    summary:
      "Perspective formation basis, lens, scope, manual Gravity preview, local draft, and manual pasted text preview controls.",
    control_ids: [
      "perspective_formation_basis_switch",
      "perspective_lens_scope_controls",
      "manual_gravity_preview_controls",
      "manual_gravity_local_draft_controls",
      "manual_pasted_text_preview_controls",
    ],
    default_control_class: "preview_only",
    default_authority_class: "local_preview_authority",
    default_migration_target: "native_workplane_preview_only",
  },
  {
    group_id: "bridge_navigation",
    title: "Bridge navigation and matrix controls",
    summary:
      "Read-first Bridge tab matrix and endpoint examples that explain blocked/gated authority.",
    control_ids: ["bridge_tab_matrix_navigation"],
    default_control_class: "read_only_visibility",
    default_authority_class: "no_authority",
    default_migration_target: "native_workplane_read_only",
  },
  {
    group_id: "operator_review_controls",
    title: "Operator review controls",
    summary:
      "Plan-next, evidence/trace loaders, safe local checklist actions, and observe local proposal input.",
    control_ids: [
      "operator_plan_next",
      "safe_local_checklist_actions",
      "observe_local_proposal_input",
    ],
    default_control_class: "local_write",
    default_authority_class: "local_write_authority",
    default_migration_target: "compatibility_only_until_authority_contract",
  },
  {
    group_id: "proposal_review_controls",
    title: "Proposal review controls",
    summary:
      "Pending local state proposal consolidation, commit, reject, and AG Resume lifecycle review metadata controls.",
    control_ids: [
      "proposal_consolidate_candidates",
      "proposal_commit_reject",
      "ag_resume_lifecycle_review_controls",
    ],
    default_control_class: "local_write",
    default_authority_class: "local_write_authority",
    default_migration_target: "compatibility_only_until_authority_contract",
  },
  {
    group_id: "evidence_trace_loaders",
    title: "Evidence and trace loaders",
    summary:
      "Evidence Pack, Session Trace, Temporal Interpretation preview, and Temporal Review Artifact loaders.",
    control_ids: [
      "evidence_pack_loader",
      "session_trace_loader",
      "temporal_interpretation_preview_loader",
      "temporal_review_artifact_loader",
    ],
    default_control_class: "read_only_visibility",
    default_authority_class: "no_authority",
    default_migration_target: "native_workplane_read_only",
  },
  {
    group_id: "runner_trace_controls",
    title: "Runner trace controls",
    summary:
      "Recovered runner and run-like trace visibility controls. Legacy Cockpit has adjacent loaders, not native runner execution controls.",
    control_ids: ["runner_trace_visibility_controls"],
    default_control_class: "read_only_visibility",
    default_authority_class: "no_authority",
    default_migration_target: "native_workplane_read_only",
  },
  {
    group_id: "external_forbidden_controls",
    title: "External authority controls",
    summary:
      "Publish, merge, retry, replay, deploy, provider/OpenAI, GitHub, Codex execution, proof/evidence recording, runner execution, durable memory apply, Perspective apply, and delta auto-apply controls are forbidden for native Workplane absorption in this slice.",
    control_ids: [
      "external_publish_merge_retry_replay_deploy_controls",
      "provider_github_codex_execution_controls",
      "durable_memory_perspective_delta_apply_controls",
    ],
    default_control_class: "external_authority_forbidden",
    default_authority_class: "forbidden_authority",
    default_migration_target: "forbidden_do_not_absorb",
  },
  {
    group_id: "unknown_legacy_controls",
    title: "Unknown legacy controls",
    summary:
      "Controls not covered by static source inspection and browser/server-rendered HTML checks require manual browser review.",
    control_ids: ["unknown_legacy_browser_manual_controls"],
    default_control_class: "unknown",
    default_authority_class: "unknown_authority",
    default_migration_target: "needs_browser_manual_review",
  },
];

export const LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_REQUIRED_CONTROLS =
  [
    "cockpit_tab_navigation",
    "overview_review_local_proposals_navigation",
    "work_item_selection",
    "work_codex_handoff_copy",
    "work_event_template_copy",
    "perspective_packet_copy_export",
    "perspective_formation_basis_switch",
    "perspective_lens_scope_controls",
    "manual_gravity_preview_controls",
    "manual_gravity_local_draft_controls",
    "manual_pasted_text_preview_controls",
    "bridge_tab_matrix_navigation",
    "operator_plan_next",
    "safe_local_checklist_actions",
    "observe_local_proposal_input",
    "proposal_consolidate_candidates",
    "proposal_commit_reject",
    "ag_resume_lifecycle_review_controls",
    "evidence_pack_loader",
    "session_trace_loader",
    "temporal_interpretation_preview_loader",
    "temporal_review_artifact_loader",
    "runner_trace_visibility_controls",
    "external_publish_merge_retry_replay_deploy_controls",
    "provider_github_codex_execution_controls",
    "durable_memory_perspective_delta_apply_controls",
    "unknown_legacy_browser_manual_controls",
  ] as const;

export const LEGACY_COCKPIT_LOCAL_CONTROL_AUTHORITY_BOUNDARY: LegacyCockpitControlClassificationAuthorityBoundary =
  {
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
    can_absorb_local_write_control_without_contract: false,
  };

const DEFAULT_AS_OF = "2026-07-02T00:00:00.000Z";

const controls: LegacyCockpitLocalControl[] = [
  control({
    control_id: "cockpit_tab_navigation",
    group_id: "overview_work_brief",
    legacy_surface: "Cockpit top tab buttons: Overview, Work, Perspective, Bridge, Operator",
    observed_or_documented_source:
      "components/augnes-cockpit.tsx COCKPIT_TABS and activeTab button navigation",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate:
      "Agent Workplane panel markers and Workplane header/navigation",
    required_before_absorption: [
      "browser regression confirms native panel reachability",
      "compatibility rollback remains rendered",
    ],
    shrink_gate_effect:
      "Safe candidate only for future read-only navigation absorption; not a reason to remove compatibility.",
    recommended_next_review: "browser/manual check that every useful tab remains reachable",
    source_refs: ["components/augnes-cockpit.tsx:3917"],
  }),
  control({
    control_id: "overview_review_local_proposals_navigation",
    group_id: "overview_work_brief",
    legacy_surface: "Overview Review Local Proposals button",
    observed_or_documented_source:
      "Overview card button changes active Cockpit tab to Operator",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "classified",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate: "Review Queue and Review / Memory Proposal Detail",
    required_before_absorption: ["native review queue browser coverage"],
    shrink_gate_effect:
      "Navigation can be replaced only after review visibility has no useful loss.",
    recommended_next_review: "check review_queue and review_memory_detail browser evidence",
    source_refs: ["components/augnes-cockpit.tsx:4089"],
  }),
  control({
    control_id: "work_item_selection",
    group_id: "overview_work_brief",
    legacy_surface: "Work list item selection buttons",
    observed_or_documented_source:
      "WorkFocusSection work-list buttons update selectedWorkId and read a work brief",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate: "Work Queue / Current Objective native node",
    required_before_absorption: [
      "native Work Brief fields cover work id, status, priority, next action, recent events, proof/context refs",
    ],
    shrink_gate_effect:
      "Can move later as read-only selection only; does not authorize work updates.",
    recommended_next_review: "Work Brief browser regression and resume-latency baseline",
    source_refs: ["components/augnes-cockpit.tsx:23393"],
  }),
  control({
    control_id: "work_codex_handoff_copy",
    group_id: "handoff_copy_export",
    legacy_surface: "Work Codex handoff copy button",
    observed_or_documented_source:
      "WorkFocusSection copies generated Codex handoff text to clipboard",
    control_class: "copy_only",
    authority_class: "copy_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_copy_only",
    native_replacement_or_candidate: "Handoff copy/export preview and Handoff Builder preview",
    required_before_absorption: [
      "copy-only native affordance remains no-send and no-Codex-execution",
      "source refs and verification commands are visible",
    ],
    shrink_gate_effect:
      "Copy-only controls may be absorbed after browser copy regression, but compatibility remains until no feature loss is proven.",
    recommended_next_review: "copy/export browser regression",
    source_refs: ["components/augnes-cockpit.tsx:23547"],
  }),
  control({
    control_id: "work_event_template_copy",
    group_id: "handoff_copy_export",
    legacy_surface: "Work event template copy button",
    observed_or_documented_source:
      "WorkFocusSection copies a serialized local work event template",
    control_class: "copy_only",
    authority_class: "copy_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_copy_only",
    native_replacement_or_candidate: "Handoff copy/export preview with template source refs",
    required_before_absorption: ["native copy-only template includes source refs and no record action"],
    shrink_gate_effect:
      "May be native copy-only later; must not become work event recording.",
    recommended_next_review: "handoff copy/export equivalence review",
    source_refs: ["components/augnes-cockpit.tsx:23563"],
  }),
  control({
    control_id: "perspective_packet_copy_export",
    group_id: "handoff_copy_export",
    legacy_surface:
      "Perspective ChatGPT/Codex handoff packet copy, select preview text, and export-like textareas",
    observed_or_documented_source:
      "Perspective Constellation and ingest panels copy or select packet text only",
    control_class: "copy_only",
    authority_class: "copy_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_copy_only",
    native_replacement_or_candidate: "Handoff Builder / Handoff Capsule / Codex packet previews",
    required_before_absorption: [
      "native packet text is source-backed",
      "no send, no launch, no GitHub/Codex/provider call",
    ],
    shrink_gate_effect:
      "Copy/export controls are candidate after no-control browser regression and dogfood.",
    recommended_next_review: "handoff packet copy parity",
    source_refs: ["components/augnes-cockpit.tsx:9247", "components/augnes-cockpit.tsx:11647"],
  }),
  control({
    control_id: "perspective_formation_basis_switch",
    group_id: "perspective_preview",
    legacy_surface: "Perspective Formation Basis switch overlay and Apply View",
    observed_or_documented_source:
      "Formation Basis controls switch local/free preview basis and cache acknowledgement metadata",
    control_class: "preview_only",
    authority_class: "local_preview_authority",
    status: "retained_compatibility",
    migration_target: "native_workplane_preview_only",
    native_replacement_or_candidate:
      "Future native preview-only Perspective focus control with no persistence",
    required_before_absorption: [
      "separate preview authority contract",
      "no product persistence and no Perspective apply",
      "browser check for acknowledgement metadata only",
    ],
    shrink_gate_effect:
      "Blocks shrink of detailed Perspective controls until preview authority is explicit.",
    recommended_next_review: "Perspective preview authority contract",
    source_refs: ["components/augnes-cockpit.tsx:8383", "components/augnes-cockpit.tsx:9574"],
  }),
  control({
    control_id: "perspective_lens_scope_controls",
    group_id: "perspective_preview",
    legacy_surface: "Perspective lens and scope controls",
    observed_or_documented_source:
      "Lens, Whole, Connected Node, Cluster, and Manual Selection buttons alter local preview selection",
    control_class: "preview_only",
    authority_class: "local_preview_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_preview_only",
    native_replacement_or_candidate: "Intent Projection reversible view projection",
    required_before_absorption: [
      "native view projection remains reversible and non-durable",
      "no localStorage/sessionStorage durable mode",
    ],
    shrink_gate_effect:
      "Candidate only as preview/view state, not state mutation.",
    recommended_next_review: "Intent Projection view-mode parity review",
    source_refs: ["components/augnes-cockpit.tsx:8495", "components/augnes-cockpit.tsx:8527"],
  }),
  control({
    control_id: "manual_gravity_preview_controls",
    group_id: "perspective_preview",
    legacy_surface: "Manual Gravity Preview mark, clear, apply preview, and reset controls",
    observed_or_documented_source:
      "Advanced preview controls modify local UI emphasis for selected graph material",
    control_class: "preview_only",
    authority_class: "local_preview_authority",
    status: "retained_compatibility",
    migration_target: "native_workplane_preview_only",
    native_replacement_or_candidate: "No native equivalent yet",
    required_before_absorption: [
      "native preview contract distinguishes UI-only emphasis from Perspective apply",
    ],
    shrink_gate_effect:
      "Keep compatibility until local preview behavior is browser-classified.",
    recommended_next_review: "manual preview browser inspection",
    source_refs: ["components/augnes-cockpit.tsx:8796", "components/augnes-cockpit.tsx:8826"],
  }),
  control({
    control_id: "manual_gravity_local_draft_controls",
    group_id: "perspective_preview",
    legacy_surface: "Manual Gravity local draft save, replace, cancel, and clear controls",
    observed_or_documented_source:
      "Advanced preview controls store local draft metadata for this formation",
    control_class: "local_draft",
    authority_class: "local_preview_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "No native equivalent yet",
    required_before_absorption: [
      "separate local draft authority contract",
      "explicit storage scope and expiry",
      "no durable Perspective apply",
    ],
    shrink_gate_effect:
      "Blocks native absorption until draft storage is explicitly authorized.",
    recommended_next_review: "local draft authority contract",
    source_refs: ["components/augnes-cockpit.tsx:9126", "components/augnes-cockpit.tsx:9177"],
  }),
  control({
    control_id: "manual_pasted_text_preview_controls",
    group_id: "perspective_preview",
    legacy_surface: "Manual pasted text source label, textarea, safe example, clear, and preview controls",
    observed_or_documented_source:
      "Perspective ingest local pasted text preview posts preview-only text for local parsing",
    control_class: "preview_only",
    authority_class: "local_preview_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "No native equivalent in Agent Workplane",
    required_before_absorption: [
      "separate intake/privacy contract",
      "no persistence of raw input",
      "browser negative check for external calls",
    ],
    shrink_gate_effect:
      "Keep compatibility until manual input preview is separately scoped.",
    recommended_next_review: "manual input privacy and preview review",
    source_refs: ["components/augnes-cockpit.tsx:11301", "components/augnes-cockpit.tsx:11359"],
  }),
  control({
    control_id: "bridge_tab_matrix_navigation",
    group_id: "bridge_navigation",
    legacy_surface: "Bridge tab capability matrix and endpoint examples",
    observed_or_documented_source:
      "BridgeTab static matrix explains read/draft/record/commit/Codex/GitHub authority",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate: "Source Ref Bridge / Trace Bridge Detail",
    required_before_absorption: [
      "native bridge matrix covers authority rows",
      "GuideBrief debug can explain source refs",
    ],
    shrink_gate_effect:
      "Bridge shrink remains gated by dogfood/metrics/browser coverage.",
    recommended_next_review: "bridge matrix equivalence review",
    source_refs: ["components/augnes-cockpit.tsx:12415"],
  }),
  control({
    control_id: "operator_plan_next",
    group_id: "operator_review_controls",
    legacy_surface: "Safe local actions Plan Next button",
    observed_or_documented_source:
      "Operator SafeLocalActions calls POST /api/plan and displays local recommendations",
    control_class: "local_write",
    authority_class: "local_write_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "No native Workplane action control",
    required_before_absorption: ["separate local action authority contract"],
    shrink_gate_effect:
      "Must remain compatibility-only; native Workplane cannot inherit local write behavior casually.",
    recommended_next_review: "local action authority contract",
    source_refs: ["components/augnes-cockpit.tsx:22116"],
  }),
  control({
    control_id: "safe_local_checklist_actions",
    group_id: "operator_review_controls",
    legacy_surface: "README Checklist, Security Checklist, Demo Script buttons",
    observed_or_documented_source:
      "Operator SafeLocalActions calls /api/actions/run for local checklist/demo tools",
    control_class: "local_write",
    authority_class: "local_write_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "No native Workplane action control",
    required_before_absorption: [
      "separate action-runner authority contract",
      "explicit no external execution boundary",
    ],
    shrink_gate_effect:
      "Blocks native absorption of local action controls.",
    recommended_next_review: "local action contract and browser/manual review",
    source_refs: ["components/augnes-cockpit.tsx:22136"],
  }),
  control({
    control_id: "observe_local_proposal_input",
    group_id: "operator_review_controls",
    legacy_surface: "Observe advanced local proposal input form",
    observed_or_documented_source:
      "Operator form posts observation text to /api/observe to create local state proposals",
    control_class: "local_write",
    authority_class: "local_write_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "No native Workplane input/composer",
    required_before_absorption: [
      "separate input and local proposal authority contract",
      "privacy/storage review",
    ],
    shrink_gate_effect:
      "Must remain compatibility-only; no chat composer or local-write control is added.",
    recommended_next_review: "proposal input authority review",
    source_refs: ["components/augnes-cockpit.tsx:12660"],
  }),
  control({
    control_id: "proposal_consolidate_candidates",
    group_id: "proposal_review_controls",
    legacy_surface: "Consolidate Candidates button",
    observed_or_documented_source:
      "PendingProposalQueuePanel calls local candidate consolidation",
    control_class: "local_write",
    authority_class: "local_write_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "Review / Memory Proposal Detail visibility only",
    required_before_absorption: ["separate candidate consolidation authority contract"],
    shrink_gate_effect:
      "Native panel may show candidates, but consolidation control remains compatibility-only.",
    recommended_next_review: "proposal lifecycle authority contract",
    source_refs: ["components/augnes-cockpit.tsx:22020"],
  }),
  control({
    control_id: "proposal_commit_reject",
    group_id: "proposal_review_controls",
    legacy_surface: "Commit local state proposal and Reject local state proposal buttons",
    observed_or_documented_source:
      "PendingProposalQueuePanel invokes /api/deltas/{id}/commit or reject",
    control_class: "local_write",
    authority_class: "local_write_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "Review / Memory Proposal Detail no-apply visibility",
    required_before_absorption: [
      "separate explicit local-write authority contract",
      "no native apply/approve/reject controls without human approval",
    ],
    shrink_gate_effect:
      "Hard blocker for native absorption; keep behind compatibility.",
    recommended_next_review: "local state proposal write contract",
    source_refs: ["components/augnes-cockpit.tsx:22064"],
  }),
  control({
    control_id: "ag_resume_lifecycle_review_controls",
    group_id: "proposal_review_controls",
    legacy_surface: "AG Resume lifecycle review metadata controls",
    observed_or_documented_source:
      "AG Resume panels expose candidate/proposal lifecycle review metadata POST results",
    control_class: "local_write",
    authority_class: "local_write_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "Review / Memory Proposal Detail visibility only",
    required_before_absorption: [
      "proposal lifecycle authority contract",
      "proof/evidence and durable memory boundaries remain denied",
    ],
    shrink_gate_effect:
      "Keep compatibility until lifecycle metadata controls are separately authorized.",
    recommended_next_review: "AG Resume lifecycle control inventory",
    source_refs: ["components/augnes-cockpit.tsx:20380"],
  }),
  control({
    control_id: "evidence_pack_loader",
    group_id: "evidence_trace_loaders",
    legacy_surface: "Load/Refresh Evidence Pack button",
    observed_or_documented_source:
      "EvidencePackPanel fetches a derived read-only evidence bundle",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate: "Evidence/Handoff and Source Ref Bridge detail",
    required_before_absorption: ["native validation/evidence refs remain source-backed"],
    shrink_gate_effect:
      "Read loader can be absorbed later only with equivalent validation detail.",
    recommended_next_review: "evidence detail browser regression",
    source_refs: ["components/augnes-cockpit.tsx:24998"],
  }),
  control({
    control_id: "session_trace_loader",
    group_id: "evidence_trace_loaders",
    legacy_surface: "Load/Refresh Session Trace button",
    observed_or_documented_source:
      "SessionTracePanel loads read-only continuity trace data",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate: "Trace Diagnostics and Run Postmortem Detail",
    required_before_absorption: ["source-backed trace refs and postmortem refs visible natively"],
    shrink_gate_effect:
      "Candidate only after trace/postmortem browser and dogfood baselines.",
    recommended_next_review: "trace/postmortem equivalence review",
    source_refs: ["components/augnes-cockpit.tsx:24532"],
  }),
  control({
    control_id: "temporal_interpretation_preview_loader",
    group_id: "evidence_trace_loaders",
    legacy_surface: "Load/Refresh Temporal Interpretation Preview button",
    observed_or_documented_source:
      "TemporalInterpretationPreviewPanel can call a temporal preview route and may use OpenAI only inside that explicit legacy route when configured",
    control_class: "preview_only",
    authority_class: "local_preview_authority",
    status: "retained_compatibility",
    migration_target: "compatibility_only_until_authority_contract",
    native_replacement_or_candidate: "No native Agent Workplane preview loader",
    required_before_absorption: [
      "separate provider/preview contract",
      "no provider/OpenAI call from native Workplane",
    ],
    shrink_gate_effect:
      "Keep compatibility; native Workplane must not absorb provider-capable loaders.",
    recommended_next_review: "temporal preview/provider boundary review",
    source_refs: ["components/augnes-cockpit.tsx:24784"],
  }),
  control({
    control_id: "temporal_review_artifact_loader",
    group_id: "evidence_trace_loaders",
    legacy_surface: "Load Temporal Review Artifacts button",
    observed_or_documented_source:
      "TemporalReviewArtifactBrowserPanel loads bounded review artifacts through GET list APIs",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "native_absorption_candidate",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate: "Trace Diagnostics and Source Ref Bridge detail",
    required_before_absorption: ["native artifacts/ref detail parity"],
    shrink_gate_effect:
      "Candidate after validation artifact visibility is proven.",
    recommended_next_review: "validation artifact visibility review",
    source_refs: ["components/augnes-cockpit.tsx:25271"],
  }),
  control({
    control_id: "runner_trace_visibility_controls",
    group_id: "runner_trace_controls",
    legacy_surface:
      "Session Trace, Evidence Pack, Work events, and Operator validation material as run-like trace visibility",
    observed_or_documented_source:
      "Legacy Cockpit exposes adjacent trace/load controls but no native runner execution control",
    control_class: "read_only_visibility",
    authority_class: "no_authority",
    status: "classified",
    migration_target: "native_workplane_read_only",
    native_replacement_or_candidate:
      "Runner DeltaBatch readback and Run Postmortem Detail",
    required_before_absorption: [
      "repeated dogfood/metrics baselines",
      "direct runner event payload detail remains reviewed as a gap",
    ],
    shrink_gate_effect:
      "Improves work/run readiness but does not authorize runner controls.",
    recommended_next_review: "dogfood/metrics baseline",
    source_refs: ["docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md"],
  }),
  control({
    control_id: "external_publish_merge_retry_replay_deploy_controls",
    group_id: "external_forbidden_controls",
    legacy_surface: "Publish, merge, retry, replay, deploy-like controls",
    observed_or_documented_source:
      "Operator and Bridge copy explicitly state these controls are absent or blocked",
    control_class: "external_authority_forbidden",
    authority_class: "forbidden_authority",
    status: "forbidden",
    migration_target: "forbidden_do_not_absorb",
    native_replacement_or_candidate: "None",
    required_before_absorption: ["do not absorb"],
    shrink_gate_effect:
      "Absence must remain validated; not a shrink candidate.",
    recommended_next_review: "authority-boundary smoke only",
    source_refs: ["components/augnes-cockpit.tsx:12440"],
  }),
  control({
    control_id: "provider_github_codex_execution_controls",
    group_id: "external_forbidden_controls",
    legacy_surface: "Provider/OpenAI, GitHub, and Codex execution controls",
    observed_or_documented_source:
      "Legacy copy repeatedly denies provider calls, GitHub mutation, Codex execution, and PR creation from product UI",
    control_class: "external_authority_forbidden",
    authority_class: "forbidden_authority",
    status: "forbidden",
    migration_target: "forbidden_do_not_absorb",
    native_replacement_or_candidate: "None",
    required_before_absorption: ["do not absorb"],
    shrink_gate_effect:
      "Forbidden controls should remain absent from native Workplane.",
    recommended_next_review: "authority-boundary smoke only",
    source_refs: ["components/augnes-cockpit.tsx:9379"],
  }),
  control({
    control_id: "durable_memory_perspective_delta_apply_controls",
    group_id: "external_forbidden_controls",
    legacy_surface:
      "Durable memory apply, Perspective apply, and delta auto-apply controls",
    observed_or_documented_source:
      "Shrink plan and native detail panels explicitly deny these apply paths",
    control_class: "external_authority_forbidden",
    authority_class: "forbidden_authority",
    status: "forbidden",
    migration_target: "forbidden_do_not_absorb",
    native_replacement_or_candidate: "None",
    required_before_absorption: ["do not absorb in this lane"],
    shrink_gate_effect:
      "Forbidden apply authority remains outside native Workplane.",
    recommended_next_review: "no-apply boundary smoke only",
    source_refs: ["docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md"],
  }),
  control({
    control_id: "unknown_legacy_browser_manual_controls",
    group_id: "unknown_legacy_controls",
    legacy_surface: "Any Legacy Cockpit controls not classified by static source review",
    observed_or_documented_source:
      "Large legacy component and browser-only conditional controls require manual confirmation before shrink",
    control_class: "unknown",
    authority_class: "unknown_authority",
    status: "needs_review",
    migration_target: "needs_browser_manual_review",
    native_replacement_or_candidate: "None until reviewed",
    required_before_absorption: [
      "DOM-capable browser/manual inventory",
      "control class and authority class assigned",
      "compatibility rollback verified",
    ],
    shrink_gate_effect:
      "Unknown controls block shrink until classified.",
    recommended_next_review: "browser/manual legacy control inventory",
    source_refs: ["components/augnes-cockpit.tsx"],
  }),
];

export function buildLegacyCockpitLocalControlClassification(
  input: LegacyCockpitControlClassificationInput = {},
): LegacyCockpitControlClassificationRead {
  const hintedControls = applyOptionalHints(controls, input);
  const counts = buildCounts(hintedControls);
  const unknownControls = hintedControls.filter(
    (item) => item.control_class === "unknown" || item.status === "needs_review",
  );

  return {
    version: LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_VERSION,
    status: unknownControls.length > 0 ? "needs_review" : "classified",
    as_of: input.as_of ?? DEFAULT_AS_OF,
    control_groups: LEGACY_COCKPIT_LOCAL_CONTROL_GROUPS,
    controls: hintedControls,
    counts,
    native_absorption_candidates: hintedControls.filter((item) =>
      [
        "native_workplane_read_only",
        "native_workplane_copy_only",
        "native_workplane_preview_only",
      ].includes(item.migration_target),
    ),
    compatibility_only_controls: hintedControls.filter(
      (item) =>
        item.migration_target ===
          "compatibility_only_until_authority_contract" ||
        item.control_class === "compatibility_only",
    ),
    forbidden_controls: hintedControls.filter(
      (item) =>
        item.control_class === "external_authority_forbidden" ||
        item.status === "forbidden",
    ),
    unknown_controls: unknownControls,
    required_next_reviews: [
      "browser/manual inventory for unknown Legacy Cockpit controls",
      "separate local-write authority contract before native absorption",
      "repeated dogfood/metrics baseline before any shrink candidate",
      "richer proposal diff detail if review/memory parity remains uncertain",
      "dedicated future removal PR only after every shrink gate passes",
    ],
    shrink_gate_notes: [
      "classification is evidence/signaling, not shrink authority",
      "local-write controls remain compatibility-only until a separate authority contract exists",
      "copy/export controls are native candidates only when they remain no-send/no-execution",
      "preview/local draft controls require explicit no-persistence and no-apply boundaries",
      "external execution and apply controls are forbidden native absorption targets",
      "unknown controls block shrink until browser/manual review classifies them",
    ],
    authority_boundary: LEGACY_COCKPIT_LOCAL_CONTROL_AUTHORITY_BOUNDARY,
    source_refs: [
      "components/augnes-cockpit.tsx",
      "components/workplane/legacy-cockpit-compatibility-panel.tsx",
      "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
      "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
    ],
    validation_summary: {
      smoke_refs: [...LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_SMOKE_REFS],
      summary:
        "static deterministic classification only; no product UI behavior or authority changes.",
    },
  };
}

function control(
  item: Omit<LegacyCockpitLocalControl, "compatibility_path" | "notes"> & {
    notes?: string[];
  },
): LegacyCockpitLocalControl {
  return {
    ...item,
    compatibility_path: "LegacyCockpitCompatibilityPanel mounting AugnesCockpit",
    notes: item.notes ?? [],
  };
}

function buildCounts(
  items: LegacyCockpitLocalControl[],
): LegacyCockpitControlClassificationCounts {
  return {
    by_class: countBy(items, [
      "read_only_visibility",
      "copy_only",
      "export_only",
      "preview_only",
      "local_draft",
      "local_write",
      "external_authority_forbidden",
      "compatibility_only",
      "unknown",
    ], (item) => item.control_class),
    by_status: countBy(items, [
      "classified",
      "needs_review",
      "blocked",
      "obsolete_with_rationale",
      "retained_compatibility",
      "native_absorption_candidate",
      "forbidden",
    ], (item) => item.status),
    by_migration_target: countBy(items, [
      "native_workplane_read_only",
      "native_workplane_copy_only",
      "native_workplane_preview_only",
      "compatibility_only_until_authority_contract",
      "forbidden_do_not_absorb",
      "obsolete_do_not_absorb",
      "needs_browser_manual_review",
    ], (item) => item.migration_target),
  };
}

function countBy<TValue extends string>(
  items: LegacyCockpitLocalControl[],
  values: readonly TValue[],
  selector: (item: LegacyCockpitLocalControl) => TValue,
): Record<TValue, number> {
  return values.reduce(
    (counts, value) => ({
      ...counts,
      [value]: items.filter((item) => selector(item) === value).length,
    }),
    {} as Record<TValue, number>,
  );
}

function applyOptionalHints(
  items: LegacyCockpitLocalControl[],
  input: LegacyCockpitControlClassificationInput,
) {
  const source = `${input.source_text ?? ""}\n${input.html ?? ""}`.toLowerCase();
  if (!source.trim()) {
    return items;
  }

  return items.map((item) => {
    const found =
      source.includes(item.control_id.toLowerCase()) ||
      source.includes(item.legacy_surface.toLowerCase());

    if (!found) {
      return item;
    }

    return {
      ...item,
      notes: [...item.notes, "optional source/html hint matched this control"],
    };
  });
}

export function getLegacyCockpitLocalControlGroup(
  groupId: LegacyCockpitControlGroupId,
) {
  return LEGACY_COCKPIT_LOCAL_CONTROL_GROUPS.find(
    (group) => group.group_id === groupId,
  );
}

export type {
  LegacyCockpitControlClass,
  LegacyCockpitControlMigrationTarget,
  LegacyCockpitControlStatus,
};
