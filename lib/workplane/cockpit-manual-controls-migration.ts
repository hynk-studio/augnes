import {
  COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION,
  type CockpitManualControlMigrationAuthorityBoundary,
  type CockpitManualControlMigrationRead,
  type CockpitManualControlMigrationRecord,
} from "@/types/cockpit-manual-controls-migration";

const migrationMapDoc =
  "docs/LEGACY_COCKPIT_REMAINING_CAPABILITY_MIGRATION_V0_1.md";
const stateProposalReviewDoc = "docs/WORKPLANE_STATE_PROPOSAL_REVIEW_V0_1.md";
const manualControlsMigrationDoc =
  "docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md";

export const COCKPIT_MANUAL_CONTROLS_MIGRATED_RECORDS: CockpitManualControlMigrationRecord[] =
  [
    migratedRecord({
      control_id: "manual_preview_editor",
      title: "Manual preview editor",
      control_class: "preview_only",
      authority_class: "preview_authority",
      reason:
        "Manual preview material is now represented as native State Proposal Review context rather than a Cockpit-only editor dependency.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Preview-only review row; no product DB write, local draft persistence, commit, reject, or apply authority.",
    }),
    migratedRecord({
      control_id: "manual_gravity_preview",
      title: "Manual gravity preview",
      control_class: "preview_only",
      authority_class: "preview_authority",
      reason:
        "Manual gravity inspection is native review context for prioritization pressure without applying Perspective gravity.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Preview-only review row; no Perspective apply, durable memory apply, or delta auto-apply authority.",
    }),
    migratedRecord({
      control_id: "formation_basis_preview",
      title: "Formation basis preview",
      control_class: "preview_only",
      authority_class: "review_only_authority",
      reason:
        "Formation basis evidence is visible in Workplane review so humans and agents can inspect why a state proposal exists.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Review-only row; no FormationReceipt persistence, Perspective apply, or state mutation authority.",
    }),
    migratedRecord({
      control_id: "local_draft_review_visibility",
      title: "Local draft review visibility",
      control_class: "local_draft_review",
      authority_class: "review_only_authority",
      reason:
        "Local draft visibility is represented as review context while commit/reject and local write controls remain blocked.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Draft visibility only; no commit, reject, localStorage write, sessionStorage write, or product DB write.",
    }),
    migratedRecord({
      control_id: "copy_export_review_packet",
      title: "Copy/export review packet",
      control_class: "copy_only",
      authority_class: "copy_authority",
      reason:
        "Copy/export review packet affordance is represented as copy-only review context, not a send, launch, execute, or publish action.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Copy-only label; no clipboard write is performed by this server-rendered panel and no external action is triggered.",
    }),
    migratedRecord({
      control_id: "manual_source_ref_review",
      title: "Manual source ref review",
      control_class: "read_only",
      authority_class: "review_only_authority",
      reason:
        "Manual evidence and source refs are now visible as native review rows so Cockpit is not required for provenance inspection.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Source-ref review only; no proof, evidence, provider, GitHub, Codex, runner, or product write authority.",
    }),
    migratedRecord({
      control_id: "proposal_preview_gap_review",
      title: "Proposal preview gap review",
      control_class: "read_only",
      authority_class: "review_only_authority",
      reason:
        "Preview gaps are native Workplane review rows so missing before/after or manual evidence remains explicit.",
      source_refs: [migrationMapDoc, stateProposalReviewDoc],
      validation_refs: [
        "smoke:cockpit-manual-controls-migration-v0-1",
        "smoke:workplane-state-proposal-review-v0-1",
      ],
      authority_note:
        "Gap review only; a missing source is not permission to apply, commit, reject, or fabricate state.",
    }),
  ];

export const COCKPIT_MANUAL_CONTROLS_BLOCKED_RECORDS: CockpitManualControlMigrationRecord[] =
  [
    blockedRecord({
      control_id: "local_write_manual_controls",
      title: "Local write manual controls",
      control_class: "local_write",
      authority_class: "local_write_authority_blocked",
      reason:
        "Local manual write controls can mutate local state and are not native Workplane authority in PR 4.",
      authority_note:
        "Blocked until a separate authority contract defines local-write ownership, persistence, validation, and user consent.",
    }),
    blockedRecord({
      control_id: "local_storage_draft_controls",
      title: "Local storage draft controls",
      control_class: "local_write",
      authority_class: "local_write_authority_blocked",
      reason:
        "Local storage draft controls blur preview state and durable state unless a separate draft authority contract exists.",
      authority_note:
        "Blocked until a separate authority contract defines localStorage/sessionStorage use and draft lifecycle semantics.",
    }),
    blockedRecord({
      control_id: "proposal_commit_reject_controls",
      title: "Proposal commit/reject controls",
      control_class: "commit_reject_control",
      authority_class: "durable_apply_authority_blocked",
      reason:
        "Commit/reject changes proposal lifecycle state and must not be inherited by Workplane review without authority.",
      authority_note:
        "Blocked until a separate authority contract defines proposal approve, reject, commit, audit, and rollback semantics.",
    }),
    blockedRecord({
      control_id: "durable_memory_apply_controls",
      title: "Durable memory apply controls",
      control_class: "apply_control",
      authority_class: "durable_apply_authority_blocked",
      reason:
        "Durable memory apply controls mutate memory state and remain outside native review authority.",
      authority_note:
        "Blocked until a separate authority contract defines durable memory apply ownership and validation.",
    }),
    blockedRecord({
      control_id: "perspective_apply_controls",
      title: "Perspective apply controls",
      control_class: "apply_control",
      authority_class: "durable_apply_authority_blocked",
      reason:
        "Perspective apply controls mutate Perspective state and remain blocked in Workplane review.",
      authority_note:
        "Blocked until a separate authority contract defines Perspective apply ownership, persistence, and validation.",
    }),
  ];

export const COCKPIT_MANUAL_CONTROLS_OBSOLETE_RECORDS: CockpitManualControlMigrationRecord[] =
  [
    obsoleteRecord({
      control_id: "obsolete_external_execution_controls",
      title: "Obsolete external execution controls",
      control_class: "external_execution_forbidden",
      authority_class: "external_execution_forbidden",
      reason:
        "Launch, execute, publish, merge, retry, replay, and deploy residue is not a native migration target.",
      authority_note:
        "Forbidden external execution residue; delete during obsolete shell cleanup or Cockpit route removal.",
    }),
    obsoleteRecord({
      control_id: "duplicate_cockpit_manual_explainer_copy",
      title: "Duplicate Cockpit manual explainer copy",
      control_class: "obsolete",
      authority_class: "no_authority",
      reason:
        "Duplicate Cockpit-only manual explanation is superseded by State Proposal Review rows and authority notes.",
      authority_note:
        "Obsolete copy; delete during Cockpit route removal or shell cleanup.",
    }),
    obsoleteRecord({
      control_id: "legacy_cockpit_manual_tab_shell_copy",
      title: "Legacy Cockpit manual tab shell copy",
      control_class: "obsolete",
      authority_class: "no_authority",
      reason:
        "The manual tab shell is a legacy organization artifact, not a long-term product surface.",
      authority_note:
        "Obsolete shell copy; delete when the Cockpit shell is removed.",
    }),
  ];

export const COCKPIT_MANUAL_CONTROLS_MIGRATION_REQUIRED_RECORDS = [
  ...COCKPIT_MANUAL_CONTROLS_MIGRATED_RECORDS,
  ...COCKPIT_MANUAL_CONTROLS_BLOCKED_RECORDS,
  ...COCKPIT_MANUAL_CONTROLS_OBSOLETE_RECORDS,
] as const;

export const COCKPIT_MANUAL_CONTROLS_MIGRATION_AUTHORITY_BOUNDARY: CockpitManualControlMigrationAuthorityBoundary =
  {
    marker: "read_only_preview_only_no_apply",
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
    can_delete_cockpit_route: false,
    can_delete_augnes_cockpit_component: false,
  };

export function buildCockpitManualControlsMigrationRead(): CockpitManualControlMigrationRead {
  const migratedRecords = [...COCKPIT_MANUAL_CONTROLS_MIGRATED_RECORDS];
  const blockedRecords = [...COCKPIT_MANUAL_CONTROLS_BLOCKED_RECORDS];
  const obsoleteRecords = [...COCKPIT_MANUAL_CONTROLS_OBSOLETE_RECORDS];
  const records = [...migratedRecords, ...blockedRecords, ...obsoleteRecords];

  return {
    migration_version: COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION,
    scope: "cockpit_manual_controls_migration_v0_1",
    source_status: "static_migration_evidence",
    status: "ready",
    summary: {
      migrated_native_review_count: migratedRecords.length,
      retained_blocked_count: blockedRecords.filter(
        (record) => record.migration_status === "retained_blocked",
      ).length,
      obsolete_delete_count: obsoleteRecords.length,
      retained_temporarily_count: records.filter(
        (record) => record.migration_status === "retained_temporarily",
      ).length,
      needs_authority_contract_count: blockedRecords.filter(
        (record) => record.migration_status === "needs_authority_contract",
      ).length,
      total_record_count: records.length,
    },
    migrated_records: migratedRecords,
    blocked_records: blockedRecords,
    obsolete_records: obsoleteRecords,
    records,
    authority_boundary: COCKPIT_MANUAL_CONTROLS_MIGRATION_AUTHORITY_BOUNDARY,
    source_refs: uniqueStrings(records.flatMap((record) => record.source_refs)),
    validation_refs: uniqueStrings(
      records.flatMap((record) => record.validation_refs),
    ),
    notes: [
      "Safe manual preview/copy controls are represented as Workplane State Proposal Review rows.",
      "Local-write, apply, commit, and reject controls remain blocked until a separate authority contract exists.",
      "Obsolete external execution and duplicate Cockpit shell controls are delete candidates, not native migration targets.",
    ],
  };
}

function migratedRecord({
  control_id,
  title,
  control_class,
  authority_class,
  reason,
  source_refs,
  validation_refs,
  authority_note,
}: Pick<
  CockpitManualControlMigrationRecord,
  | "control_id"
  | "title"
  | "control_class"
  | "authority_class"
  | "reason"
  | "source_refs"
  | "validation_refs"
  | "authority_note"
>): CockpitManualControlMigrationRecord {
  return {
    control_id,
    title,
    control_class,
    authority_class,
    migration_status: "migrated_native_review",
    destination: "workplane_state_proposal_review",
    source_refs,
    review_surface: "workplane_state_proposal_review",
    reason,
    validation_refs,
    delete_when:
      "Delete the Cockpit dependency when Workplane State Proposal Review rows are validated and Cockpit route removal proves unique useful capability count is 0.",
    blocked_until: "not blocked; represented as read-only native review context",
    authority_note,
  };
}

function blockedRecord({
  control_id,
  title,
  control_class,
  authority_class,
  reason,
  authority_note,
}: Pick<
  CockpitManualControlMigrationRecord,
  | "control_id"
  | "title"
  | "control_class"
  | "authority_class"
  | "reason"
  | "authority_note"
>): CockpitManualControlMigrationRecord {
  return {
    control_id,
    title,
    control_class,
    authority_class,
    migration_status: "needs_authority_contract",
    destination: "blocked_until_authority_contract",
    source_refs: [migrationMapDoc, manualControlsMigrationDoc],
    review_surface: "none",
    reason,
    validation_refs: ["smoke:cockpit-manual-controls-migration-v0-1"],
    delete_when:
      "Delete or reconsider only after a separate authority contract decides whether the control should exist outside Cockpit.",
    blocked_until:
      "Blocked until a separate authority contract exists and is validated independently.",
    authority_note,
  };
}

function obsoleteRecord({
  control_id,
  title,
  control_class,
  authority_class,
  reason,
  authority_note,
}: Pick<
  CockpitManualControlMigrationRecord,
  | "control_id"
  | "title"
  | "control_class"
  | "authority_class"
  | "reason"
  | "authority_note"
>): CockpitManualControlMigrationRecord {
  return {
    control_id,
    title,
    control_class,
    authority_class,
    migration_status: "obsolete_delete",
    destination: "delete",
    source_refs: [migrationMapDoc, manualControlsMigrationDoc],
    review_surface: "none",
    reason,
    validation_refs: ["smoke:cockpit-manual-controls-migration-v0-1"],
    delete_when:
      "Delete during Cockpit route removal or obsolete shell cleanup after native review rows are validated.",
    blocked_until: "not blocked; obsolete delete candidate",
    authority_note,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
