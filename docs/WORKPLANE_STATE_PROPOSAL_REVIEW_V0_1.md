# Workplane State Proposal Review v0.1

## Status And Scope

Status: PR 3 implementation for Legacy Cockpit decomposition.

This slice adds a native Agent Workplane panel named Workplane State Proposal
Review. It follows PR #939 by giving the Blank State review entries a native
Workplane destination for research-critical proposal review context.

The panel migrates the `workplane_state_proposal_review` capabilities from the
Legacy Cockpit migration map into `/workbench` as read-only, preview-only
review context. It does not preserve Cockpit as the place for these
capabilities, and it does not delete `/cockpit` yet.

## Research-Critical Capabilities Migrated

The panel renders grouped lanes for:

- `field_level_proposal_diff`
- `before_after_state_preview`
- `proposal_impact_analysis`
- `memory_proposal_review`
- `perspective_lens_detail_edit`
- `local_draft_review`
- `manual_preview_editor`
- `manual_gravity_preview`
- `formation_basis_preview`
- `proposal_status_history`
- `needs_user_judgment_lane`
- `stale_fallback_warning_review`
- `authority_boundary_review`

Each lane has a status, summary, source refs, gaps, authority note, and at
least one review row or explicit empty/fallback row.

PR 4 follow-on: Cockpit Manual Controls Migration v0.1 is documented in
`docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md`. The State Proposal Review
read model now also renders `manual_control_migration_review` so safe manual
preview/copy controls, blocked local-write/apply controls, and obsolete
Cockpit manual controls are visible as native Workplane review rows.

## Data Model

`types/workplane-state-proposal-review.ts` defines
`WorkplaneStateProposalReviewRead` with:

- `review_version`
- `scope`
- `as_of`
- `status`
- `source_status`
- `fallback_reason`
- `summary`
- `proposal_groups`
- `field_level_diffs`
- `before_after_previews`
- `impact_items`
- `memory_proposal_reviews`
- `perspective_lens_reviews`
- `local_draft_reviews`
- `manual_preview_reviews`
- `proposal_status_history`
- `needs_user_judgment`
- `stale_fallback_warnings`
- `manual_control_migration_summary`
- `migrated_manual_control_reviews`
- `blocked_manual_control_reviews`
- `obsolete_manual_control_reviews`
- `authority_boundary`
- `source_refs`
- `validation_summary`
- `next_review_targets`

`lib/workplane/workplane-state-proposal-review.ts` builds the read model from
existing Workplane context, node context, Delta Projection context, Current
Perspective context, and Review Memory Detail. It performs no fetch, route
call, provider call, GitHub call, Codex execution, runner execution, product DB
write, proof/evidence write, durable memory apply, Perspective apply, or delta
auto-apply.

## Source And Fallback Behavior

If source-backed proposal data is missing, the read model returns explicit
empty or fallback review rows. It does not throw and does not fabricate live
proposal counts. Missing before-values, missing manual preview text, empty
local draft rows, and stale/fallback source state are visible as gaps.

The v0.1 helper may synthesize review rows from read-only Delta Projection,
Current Perspective, and Review Memory Detail context. Those rows are labeled
as previews or gaps when the richer source record is not materialized.

## UI Markers

`components/workplane/state-proposal-review-panel.tsx` renders in `/workbench`
near Review Queue and Review Memory Detail.

The panel root exposes:

- `data-workplane-state-proposal-review-panel="v0.1"`
- `data-workplane-panel-id="state_proposal_review"`
- `data-workplane-node-id="state_proposal_review"`
- `data-workplane-node-kind="proposal_review_context"`
- `data-workplane-node-status`
- `data-state-proposal-review-authority-boundary="read_only_no_apply"`
- `data-state-proposal-review-source-status`

Inside the panel, group and item markers use:

- `data-state-proposal-review-group-id`
- `data-state-proposal-review-item-kind`

Manual controls migration rows additionally expose:

- `data-cockpit-manual-controls-migration="v0.1"`
- `data-cockpit-manual-control-id`
- `data-cockpit-manual-control-migration-status`
- `data-cockpit-manual-control-destination`
- `data-cockpit-manual-control-authority-class`

## Authority Boundary

State Proposal Review is for reviewing proposed state changes before they
become durable state. Field-level diffs, before/after previews, source refs,
impact, stale/fallback warnings, and authority boundaries are visible here.

This panel does not approve, reject, commit, apply memory, apply Perspective,
or auto-apply deltas.

The authority boundary explicitly denies:

- `can_approve_proposal`
- `can_reject_proposal`
- `can_commit_proposal`
- `can_apply_memory`
- `can_apply_perspective`
- `can_auto_apply_delta`
- `can_write_product_db`
- `can_create_evidence`
- `can_record_proof`
- `can_call_provider_openai`
- `can_call_github`
- `can_actuate_github`
- `can_execute_codex`
- `can_execute_runner`
- `can_tick_runner`
- `can_recover_delta_batch`
- `can_schedule_runner`
- `can_merge_publish_retry_replay_deploy`
- `can_use_local_storage_durable_mode`

The panel renders no form, input, textarea, button, `onClick`, `formAction`,
server action, API write route, provider/OpenAI call, GitHub call, Codex
execution, runner execution/tick/recovery/scheduling, product DB write,
proof/evidence write, durable memory apply, Perspective apply, delta
auto-apply, or localStorage/sessionStorage write.

## Validation

Primary smoke:

```bash
npm run smoke:workplane-state-proposal-review-v0-1
```

Related checks:

```bash
npm run smoke:agent-workplane-node-contract-v0-1
npm run smoke:agent-workplane-panels-v0-1
npm run smoke:agent-workplane-review-memory-detail-v0-1
npm run smoke:blank-state-review-entry-absorption-v0-1
npm run smoke:legacy-cockpit-remaining-capability-migration-v0-1
npm run smoke:agent-workplane-legacy-cockpit-shrink-v0-1
```

Runtime validation may additionally start a temp-DB dev server and verify
server-rendered `/workbench` contains the State Proposal Review panel markers
and all required group IDs.

## Next PR

Next PR: Cockpit Manual Controls Migration v0.1.

That follow-on is now implemented in
`docs/COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md`. Local-write, apply, commit,
reject, durable memory apply, and Perspective apply controls remain blocked
until a separate authority contract exists. Cockpit route removal remains gated
until unique useful capability count is verified as 0.

Route-removal readiness follow-on:
`docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md` verifies
`unique_useful_cockpit_capability_count: 0` and `zero_count_verified: true`,
while keeping route and component deletion disabled for that readiness-only PR.
