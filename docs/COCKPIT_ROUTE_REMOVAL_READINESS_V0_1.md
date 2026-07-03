# Cockpit Route Removal Readiness v0.1

## Status And Scope

Status: PR 5 readiness verification completed; Cockpit Route Removal v0.1
consumed the verified zero-count gate.

This readiness PR verified whether `/cockpit` could be removed after PR #941 Cockpit
Manual Controls Migration v0.1. It adds a deterministic route-removal
readiness model, a zero-count verification report, and smoke coverage.

The readiness PR did not delete `/cockpit`. It did not delete
`components/augnes-cockpit.tsx`. It does not change product UI, app routes,
Workplane panels, Blank State UI, API routes, DB/migrations, provider/OpenAI,
GitHub, Codex, runner, proof/evidence, memory, Perspective, or delta apply
paths.

The later explicit deletion PR is documented in
`docs/COCKPIT_ROUTE_REMOVAL_V0_1.md`. After that PR, `/cockpit` is removed as a
product surface.

## Why This Follows PR #941

PR #941 represented safe Cockpit manual preview/copy controls as native
Workplane State Proposal Review rows, kept local-write/apply/commit/reject
controls blocked until a separate authority contract, and marked obsolete
manual shell/execution residue as delete candidates.

That means the next required step is not deletion itself. The next required
step is to verify whether any useful capability remains available only in
Legacy Cockpit.

## Zero-Count Definition

`unique_useful_cockpit_capability_count` counts only capabilities that:

- are still available only in `/cockpit`
- are not represented in Blank State, Workplane, State Proposal Review, or
  Manual Controls Migration
- are not explicitly blocked until a separate authority contract
- are not obsolete, duplicate, shell-only, or forbidden-delete
- are not duplicate explanatory copy or compatibility navigation residue

A capability blocked until authority contract is not a reason to keep Cockpit
as a product surface unless the readiness model identifies a Cockpit-only
review surface requirement. This model identifies no such requirement.

## Capability Dispositions

Allowed dispositions:

- `migrated_to_blank_state`
- `migrated_to_workplane`
- `migrated_to_state_proposal_review`
- `migrated_to_manual_migration_review`
- `blocked_until_authority_contract`
- `obsolete_delete`
- `forbidden_delete`
- `retained_temporarily`

`retained_temporarily` would make the readiness result `not_ready`. The v0.1
readiness model has no `retained_temporarily` records.

## Full Capability Coverage

| disposition | capability_id |
| --- | --- |
| `migrated_to_blank_state` | `continue_current_work_entry` |
| `migrated_to_blank_state` | `review_pending_proposals_entry` |
| `migrated_to_blank_state` | `choose_perspective_lens_entry` |
| `migrated_to_blank_state` | `prepare_codex_handoff_entry` |
| `migrated_to_blank_state` | `review_runner_deltabatch_entry` |
| `migrated_to_blank_state` | `automation_mode_entry` |
| `migrated_to_blank_state` | `user_judgment_summary_entry` |
| `migrated_to_workplane` | `work_brief_detail` |
| `migrated_to_workplane` | `work_queue_detail` |
| `migrated_to_workplane` | `current_perspective_detail` |
| `migrated_to_workplane` | `delta_projection_detail` |
| `migrated_to_workplane` | `projected_delta_batch_detail` |
| `migrated_to_workplane` | `recovered_runner_deltabatch_detail` |
| `migrated_to_workplane` | `run_postmortem_detail` |
| `migrated_to_workplane` | `source_ref_bridge_detail` |
| `migrated_to_workplane` | `trace_diagnostics_detail` |
| `migrated_to_workplane` | `validation_smoke_detail` |
| `migrated_to_workplane` | `handoff_builder_detail` |
| `migrated_to_workplane` | `guidebrief_debug_context_detail` |
| `migrated_to_workplane` | `intent_projection_detail` |
| `migrated_to_workplane` | `review_queue_detail` |
| `migrated_to_state_proposal_review` | `field_level_proposal_diff` |
| `migrated_to_state_proposal_review` | `before_after_state_preview` |
| `migrated_to_state_proposal_review` | `proposal_impact_analysis` |
| `migrated_to_state_proposal_review` | `memory_proposal_review` |
| `migrated_to_state_proposal_review` | `perspective_lens_detail_edit` |
| `migrated_to_state_proposal_review` | `local_draft_review` |
| `migrated_to_state_proposal_review` | `manual_preview_editor` |
| `migrated_to_state_proposal_review` | `manual_gravity_preview` |
| `migrated_to_state_proposal_review` | `formation_basis_preview` |
| `migrated_to_state_proposal_review` | `proposal_status_history` |
| `migrated_to_state_proposal_review` | `needs_user_judgment_lane` |
| `migrated_to_state_proposal_review` | `stale_fallback_warning_review` |
| `migrated_to_state_proposal_review` | `authority_boundary_review` |
| `migrated_to_manual_migration_review` | `local_draft_review_visibility` |
| `migrated_to_manual_migration_review` | `copy_export_review_packet` |
| `migrated_to_manual_migration_review` | `manual_source_ref_review` |
| `migrated_to_manual_migration_review` | `proposal_preview_gap_review` |
| `blocked_until_authority_contract` | `local_write_manual_controls` |
| `blocked_until_authority_contract` | `local_storage_draft_controls` |
| `blocked_until_authority_contract` | `proposal_commit_reject_controls` |
| `blocked_until_authority_contract` | `durable_memory_apply_controls` |
| `blocked_until_authority_contract` | `perspective_apply_controls` |
| `obsolete_delete` | `six_tab_cockpit_shell` |
| `obsolete_delete` | `legacy_cockpit_tab_navigation` |
| `obsolete_delete` | `duplicate_work_brief_cards` |
| `obsolete_delete` | `duplicate_perspective_summary_cards` |
| `obsolete_delete` | `duplicate_bridge_summary_copy` |
| `obsolete_delete` | `duplicate_operator_visibility_copy` |
| `forbidden_delete` | `obsolete_external_execution_controls` |
| `obsolete_delete` | `compatibility_island_explainer_copy` |
| `obsolete_delete` | `duplicate_cockpit_manual_explainer_copy` |
| `obsolete_delete` | `legacy_cockpit_manual_tab_shell_copy` |

Every capability record sets `is_unique_useful_cockpit_only: false`.

## Blocked Authority Controls

The following controls remain blocked until a separate authority contract:

- `local_write_manual_controls`
- `local_storage_draft_controls`
- `proposal_commit_reject_controls`
- `durable_memory_apply_controls`
- `perspective_apply_controls`

They do not keep Cockpit alive as a product surface because the native
Workplane review layer already exposes their blocked status and authority
boundary. They are not useful review capability that exists only in Cockpit.

## Obsolete And Forbidden Delete Controls

Obsolete shell, duplicate copy, duplicate navigation, and compatibility
explainer residue are not useful capability:

- `six_tab_cockpit_shell`
- `legacy_cockpit_tab_navigation`
- `duplicate_work_brief_cards`
- `duplicate_perspective_summary_cards`
- `duplicate_bridge_summary_copy`
- `duplicate_operator_visibility_copy`
- `compatibility_island_explainer_copy`
- `duplicate_cockpit_manual_explainer_copy`
- `legacy_cockpit_manual_tab_shell_copy`

`obsolete_external_execution_controls` is `forbidden_delete`. Launch,
execute, publish, merge, retry, replay, deploy, provider/OpenAI, GitHub, Codex,
and runner execution residue must not be migrated.

## Readiness Result

Readiness result:

- `status: ready_for_route_removal`
- `unique_useful_cockpit_capability_count: 0`
- `zero_count_verified: true`
- `route_removal_allowed: false`
- `component_removal_allowed: false`

The count is zero because every known useful capability is represented in
Blank State, Agent Workplane, Workplane State Proposal Review, or Manual
Controls Migration review, or is blocked/obsolete/forbidden-delete.

`route_removal_allowed` and `component_removal_allowed` remain false because
the readiness model itself does not grant runtime deletion authority. Actual
route and component removal was performed by the later explicit deletion PR:
`docs/COCKPIT_ROUTE_REMOVAL_V0_1.md`.

Post-removal state:

- `removal_completed: true`
- `cockpit_route_present: false`
- `augnes_cockpit_component_present: false`
- `legacy_workplane_compatibility_panel_present: false`

## Authority Boundary

The readiness authority boundary explicitly denies:

- `can_delete_cockpit_route`
- `can_delete_augnes_cockpit_component`
- `can_write_product_db`
- `can_create_evidence`
- `can_record_proof`
- `can_apply_memory`
- `can_apply_perspective`
- `can_auto_apply_delta`
- `can_commit_proposal`
- `can_reject_proposal`
- `can_approve_proposal`
- `can_write_local_storage`
- `can_use_session_storage`
- `can_call_provider_openai`
- `can_call_github`
- `can_actuate_github`
- `can_execute_codex`
- `can_execute_runner`
- `can_tick_runner`
- `can_recover_delta_batch`
- `can_schedule_runner`
- `can_merge_publish_retry_replay_deploy`

All fields are false.

## No Deletion In The Readiness PR

The readiness PR was read-only verification and docs/smoke only. It did not remove
`/cockpit`, delete `components/augnes-cockpit.tsx`, add redirects, change
routes, change Workplane panels, change Blank State UI, add mutation authority,
or add provider/GitHub/Codex/runner/product-write behavior.

Cockpit Route Removal v0.1 later removed `/cockpit`,
`components/augnes-cockpit.tsx`, and the Workplane compatibility pointer after
this zero-count verification.

Cockpit Post-Removal Cleanup v0.1
(`docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md`) later retired the temporary
retained-route smokes that only made sense before `/cockpit` was removed.

## Validation

Primary smoke:

```bash
npm run smoke:cockpit-route-removal-readiness-v0-1
```

Related checks:

```bash
npm run smoke:cockpit-manual-controls-migration-v0-1
npm run smoke:workplane-state-proposal-review-v0-1
npm run smoke:legacy-cockpit-remaining-capability-migration-v0-1
npm run smoke:cockpit-post-removal-cleanup-v0-1
npm run smoke:blank-state-review-entry-absorption-v0-1
```

## Route Removal

Route removal: `docs/COCKPIT_ROUTE_REMOVAL_V0_1.md`.

That PR removed `/cockpit`, `components/augnes-cockpit.tsx`, and obsolete
Cockpit shell/pointer code because `zero_count_verified` remained true. It did
not add apply/commit/reject/provider/GitHub/Codex/runner/product-write
authority.

Post-removal cleanup:
`docs/COCKPIT_POST_REMOVAL_CLEANUP_V0_1.md`.
