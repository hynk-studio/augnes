import {
  COCKPIT_ROUTE_REMOVAL_READINESS_VERSION,
  type CockpitRouteRemovalAuthorityBoundary,
  type CockpitRouteRemovalCapabilityDisposition,
  type CockpitRouteRemovalCapabilityRecord,
  type CockpitRouteRemovalReadinessRead,
  type CockpitRouteRemovalReadinessStatus,
} from "@/types/cockpit-route-removal-readiness";

const migrationMapDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const blankStateDoc = "docs/BLANK_STATE_REVIEW_ENTRY_ABSORPTION_V0_1.md";
const workplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const stateProposalReviewDoc = "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md";
const manualControlsMigrationDoc =
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md";
const routeRemovalReadinessDoc =
  "docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md";

const blankStateCapabilityIds = [
  ["continue_current_work_entry", "Continue Current Work entry"],
  ["review_pending_proposals_entry", "Review Pending Proposals entry"],
  ["choose_perspective_lens_entry", "Choose Perspective Lens entry"],
  ["prepare_codex_handoff_entry", "Prepare Codex Handoff entry"],
  ["review_runner_deltabatch_entry", "Review Runner DeltaBatch entry"],
  ["automation_mode_entry", "Automation Mode entry"],
  ["user_judgment_summary_entry", "User Judgment Summary entry"],
] as const;

const workplaneCapabilityIds = [
  ["work_brief_detail", "Work Brief detail"],
  ["work_queue_detail", "Work Queue detail"],
  ["current_perspective_detail", "Current Perspective detail"],
  ["delta_projection_detail", "Delta Projection detail"],
  ["projected_delta_batch_detail", "Projected DeltaBatch detail"],
  ["recovered_runner_deltabatch_detail", "Recovered Runner DeltaBatch detail"],
  ["run_postmortem_detail", "Run Postmortem detail"],
  ["source_ref_bridge_detail", "Source Ref Bridge detail"],
  ["trace_diagnostics_detail", "Trace Diagnostics detail"],
  ["validation_smoke_detail", "Validation Smoke detail"],
  ["handoff_builder_detail", "Handoff Builder detail"],
  ["guidebrief_debug_context_detail", "GuideBrief Debug Context detail"],
  ["intent_projection_detail", "Intent Projection detail"],
  ["review_queue_detail", "Review Queue detail"],
] as const;

const stateProposalReviewCapabilityIds = [
  ["field_level_proposal_diff", "Field-level proposal diff"],
  ["before_after_state_preview", "Before/after state preview"],
  ["proposal_impact_analysis", "Proposal impact analysis"],
  ["memory_proposal_review", "Memory proposal review"],
  ["perspective_lens_detail_edit", "Perspective lens detail edit"],
  ["local_draft_review", "Local draft review"],
  ["manual_preview_editor", "Manual preview editor"],
  ["manual_gravity_preview", "Manual gravity preview"],
  ["formation_basis_preview", "Formation basis preview"],
  ["proposal_status_history", "Proposal status history"],
  ["needs_user_judgment_lane", "Needs-user-judgment lane"],
  ["stale_fallback_warning_review", "Stale/fallback warning review"],
  ["authority_boundary_review", "Authority boundary review"],
] as const;

const manualMigrationCapabilityIds = [
  ["local_draft_review_visibility", "Local draft review visibility"],
  ["copy_export_review_packet", "Copy/export review packet"],
  ["manual_source_ref_review", "Manual source ref review"],
  ["proposal_preview_gap_review", "Proposal preview gap review"],
] as const;

const blockedCapabilityIds = [
  ["local_write_manual_controls", "Local write manual controls"],
  ["local_storage_draft_controls", "Local storage draft controls"],
  ["proposal_commit_reject_controls", "Proposal commit/reject controls"],
  ["durable_memory_apply_controls", "Durable memory apply controls"],
  ["perspective_apply_controls", "Perspective apply controls"],
] as const;

const obsoleteCapabilityIds = [
  ["six_tab_cockpit_shell", "Six-tab Cockpit shell"],
  ["legacy_cockpit_tab_navigation", "Legacy Cockpit tab navigation"],
  ["duplicate_work_brief_cards", "Duplicate Work Brief cards"],
  ["duplicate_perspective_summary_cards", "Duplicate Perspective summary cards"],
  ["duplicate_bridge_summary_copy", "Duplicate Bridge summary copy"],
  ["duplicate_operator_visibility_copy", "Duplicate operator visibility copy"],
  ["compatibility_island_explainer_copy", "Compatibility island explainer copy"],
  [
    "duplicate_cockpit_manual_explainer_copy",
    "Duplicate Cockpit manual explainer copy",
  ],
  ["legacy_cockpit_manual_tab_shell_copy", "Legacy Cockpit manual tab shell copy"],
] as const;

export const COCKPIT_ROUTE_REMOVAL_AUTHORITY_BOUNDARY: CockpitRouteRemovalAuthorityBoundary =
  {
    marker: "readiness_only_no_delete",
    can_delete_cockpit_route: false,
    can_delete_augnes_cockpit_component: false,
    can_write_product_db: false,
    can_create_evidence: false,
    can_record_proof: false,
    can_apply_memory: false,
    can_apply_perspective: false,
    can_auto_apply_delta: false,
    can_commit_proposal: false,
    can_reject_proposal: false,
    can_approve_proposal: false,
    can_write_local_storage: false,
    can_use_session_storage: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_actuate_github: false,
    can_execute_codex: false,
    can_execute_runner: false,
    can_tick_runner: false,
    can_recover_delta_batch: false,
    can_schedule_runner: false,
    can_merge_publish_retry_replay_deploy: false,
  };

export const COCKPIT_ROUTE_REMOVAL_CAPABILITY_RECORDS: CockpitRouteRemovalCapabilityRecord[] =
  [
    ...blankStateCapabilityIds.map(([capability_id, title]) =>
      readinessRecord({
        capability_id,
        title,
        source_stage: "PR #939 Blank State Review Entry Absorption v0.1",
        previous_destination: "blank_state",
        disposition: "migrated_to_blank_state",
        native_surface: "Blank State",
        evidence_refs: [migrationMapDoc, blankStateDoc],
        authority_note:
          "Human-facing entry is represented on Blank State as navigation and summary only.",
        verification_note:
          "Not Cockpit-only; covered by Blank State review entry markers and smoke.",
      }),
    ),
    ...workplaneCapabilityIds.map(([capability_id, title]) =>
      readinessRecord({
        capability_id,
        title,
        source_stage: "PR #940 Workplane State Proposal Review v0.1",
        previous_destination: "workplane",
        disposition: "migrated_to_workplane",
        native_surface: "Agent Workplane",
        evidence_refs: [migrationMapDoc, workplaneDoc],
        authority_note:
          "AI/Codex/runner operational context is represented as read-only Workplane context.",
        verification_note:
          "Not Cockpit-only; covered by Workplane panel and shrink smokes.",
      }),
    ),
    ...stateProposalReviewCapabilityIds.map(([capability_id, title]) =>
      readinessRecord({
        capability_id,
        title,
        source_stage: "PR #940 Workplane State Proposal Review v0.1",
        previous_destination: "workplane_state_proposal_review",
        disposition: "migrated_to_state_proposal_review",
        native_surface: "Workplane State Proposal Review",
        evidence_refs: [migrationMapDoc, stateProposalReviewDoc],
        authority_note:
          "Research-critical proposal review is represented as read-only and preview-only Workplane review context.",
        verification_note:
          "Not Cockpit-only; covered by State Proposal Review group and item smokes.",
      }),
    ),
    ...manualMigrationCapabilityIds.map(([capability_id, title]) =>
      readinessRecord({
        capability_id,
        title,
        source_stage: "PR #941 Cockpit Manual Controls Migration v0.1",
        previous_destination: "workplane_state_proposal_review",
        disposition: "migrated_to_manual_migration_review",
        native_surface: "Workplane State Proposal Review manual controls migration review",
        evidence_refs: [
          migrationMapDoc,
          stateProposalReviewDoc,
          manualControlsMigrationDoc,
        ],
        authority_note:
          "Safe manual preview/copy review affordance is represented as a native read-only review row.",
        verification_note:
          "Not Cockpit-only; covered by manual controls migration records and smoke.",
      }),
    ),
    ...blockedCapabilityIds.map(([capability_id, title]) =>
      readinessRecord({
        capability_id,
        title,
        source_stage: "PR #941 Cockpit Manual Controls Migration v0.1",
        previous_destination: "blocked_until_authority_contract",
        disposition: "blocked_until_authority_contract",
        native_surface: "No native mutation surface; separate authority contract required",
        evidence_refs: [migrationMapDoc, manualControlsMigrationDoc],
        blocked_reason:
          "Blocked until a separate authority contract exists; this does not require retaining Cockpit as a product surface.",
        authority_note:
          "No local-write, localStorage, commit, reject, durable memory apply, or Perspective apply authority is migrated.",
        verification_note:
          "Not useful Cockpit-only capability; represented as blocked review context and excluded from zero-count.",
      }),
    ),
    readinessRecord({
      capability_id: "obsolete_external_execution_controls",
      title: "Obsolete external execution controls",
      source_stage: "PR #941 Cockpit Manual Controls Migration v0.1",
      previous_destination: "delete",
      disposition: "forbidden_delete",
      native_surface: "None",
      evidence_refs: [migrationMapDoc, manualControlsMigrationDoc],
      authority_note:
        "Launch, execute, publish, merge, retry, replay, and deploy residue is forbidden and must not be migrated.",
      verification_note:
        "Not useful; forbidden external execution residue is a deletion candidate.",
    }),
    ...obsoleteCapabilityIds.map(([capability_id, title]) =>
      readinessRecord({
        capability_id,
        title,
        source_stage: "PR #938 migration map and PR #941 manual cleanup",
        previous_destination: "delete",
        disposition: "obsolete_delete",
        native_surface: "None",
        evidence_refs: [migrationMapDoc, manualControlsMigrationDoc],
        authority_note:
          "Obsolete shell, duplicate navigation, and duplicate explanatory copy are not migration targets.",
        verification_note:
          "Not useful; delete during the explicit route/component removal PR after this readiness check.",
      }),
    ),
  ];

export const COCKPIT_ROUTE_REMOVAL_REQUIRED_CAPABILITY_IDS =
  COCKPIT_ROUTE_REMOVAL_CAPABILITY_RECORDS.map(
    (record) => record.capability_id,
  );

export function buildCockpitRouteRemovalReadiness(): CockpitRouteRemovalReadinessRead {
  const capabilityRecords = [...COCKPIT_ROUTE_REMOVAL_CAPABILITY_RECORDS];
  const retainedRecords = capabilityRecords.filter(
    (record) => record.disposition === "retained_temporarily",
  );
  const uniqueUsefulCockpitOnlyRecords = capabilityRecords.filter(
    (record) => record.is_unique_useful_cockpit_only,
  );
  const uniqueUsefulCockpitCapabilityCount =
    uniqueUsefulCockpitOnlyRecords.length;
  const zeroCountVerified =
    uniqueUsefulCockpitCapabilityCount === 0 && retainedRecords.length === 0;
  const status: CockpitRouteRemovalReadinessStatus =
    retainedRecords.length > 0
      ? "not_ready"
      : zeroCountVerified
        ? "ready_for_route_removal"
        : "needs_manual_review";

  return {
    readiness_version: COCKPIT_ROUTE_REMOVAL_READINESS_VERSION,
    as_of: "2026-07-03T00:00:00.000Z",
    status,
    summary: zeroCountVerified
      ? "All required Legacy Cockpit capabilities are migrated, blocked until authority contract, obsolete, or forbidden-delete. Unique useful Cockpit-only capability count is 0."
      : "One or more Legacy Cockpit capabilities still require manual review before route removal.",
    unique_useful_cockpit_capability_count:
      uniqueUsefulCockpitCapabilityCount,
    zero_count_verified: zeroCountVerified,
    route_removal_allowed: false,
    component_removal_allowed: false,
    capability_records: capabilityRecords,
    blocking_conditions: retainedRecords.length
      ? [
          {
            condition_id: "retained_temporarily_capability_present",
            title: "Retained temporary Cockpit capability present",
            status: "open",
            blocks_route_removal: true,
            evidence_refs: retainedRecords.flatMap(
              (record) => record.evidence_refs,
            ),
            authority_note:
              "A retained temporary capability would keep route removal blocked until native coverage exists.",
          },
        ]
      : [],
    authority_boundary: COCKPIT_ROUTE_REMOVAL_AUTHORITY_BOUNDARY,
    validation_refs: [
      "smoke:cockpit-route-removal-readiness-v0-1",
      "smoke:cockpit-manual-controls-migration-v0-1",
      "smoke:workplane-state-proposal-review-v0-1",
      "smoke:legacy-cockpit-remaining-capability-migration-v0-1",
      "smoke:agent-workplane-legacy-cockpit-shrink-v0-1",
      "smoke:blank-state-review-entry-absorption-v0-1",
      routeRemovalReadinessDoc,
    ],
    next_pr_target:
      "Cockpit Route Removal v0.1 may delete /cockpit and components/augnes-cockpit.tsx only in a later explicit deletion PR.",
  };
}

function readinessRecord({
  capability_id,
  title,
  source_stage,
  previous_destination,
  disposition,
  native_surface,
  evidence_refs,
  blocked_reason = "not blocked for route removal readiness",
  authority_note,
  verification_note,
}: Pick<
  CockpitRouteRemovalCapabilityRecord,
  | "capability_id"
  | "title"
  | "source_stage"
  | "previous_destination"
  | "native_surface"
  | "evidence_refs"
  | "authority_note"
  | "verification_note"
> & {
  disposition: CockpitRouteRemovalCapabilityDisposition;
  blocked_reason?: string;
}): CockpitRouteRemovalCapabilityRecord {
  return {
    capability_id,
    title,
    source_stage,
    previous_destination,
    disposition,
    native_surface,
    evidence_refs,
    is_unique_useful_cockpit_only: false,
    deletion_safe: true,
    blocked_reason,
    authority_note,
    verification_note,
  };
}
