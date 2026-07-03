# Cockpit Manual Controls Migration v0.1

## Status And Scope

Status: PR 4 implementation for Legacy Cockpit decomposition.

This slice migrates safe Legacy Cockpit manual preview/copy review affordances
into native Workplane State Proposal Review rows. This PR did not delete
`/cockpit` or `components/augnes-cockpit.tsx`; Cockpit Route Removal v0.1 later
removed both after zero-count readiness was verified in
`docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md`.

The migrated rows are read-only, preview-only, or copy-only review context.
They are not apply, approve, reject, commit, local-write, durable-memory apply,
Perspective apply, delta auto-apply, runner, Codex, GitHub, provider, proof, or
evidence authority.

## Why This Follows PR #940

PR #940 added Workplane State Proposal Review v0.1 as the native Workplane lane
for proposal, preview, memory, Perspective, local draft, source refs,
stale/fallback, and authority-boundary inspection.

This PR uses that lane as the destination for safe manual controls that
previously made Legacy Cockpit feel necessary. It does not preserve Cockpit as
the review surface for those safe controls.

## Safe Migrated Controls

The following records are represented as native Workplane State Proposal Review
rows with destination `workplane_state_proposal_review` and status
`migrated_native_review`:

- `manual_preview_editor`
- `manual_gravity_preview`
- `formation_basis_preview`
- `local_draft_review_visibility`
- `copy_export_review_packet`
- `manual_source_ref_review`
- `proposal_preview_gap_review`

These rows use `preview_authority`, `copy_authority`, `review_only_authority`,
or `no_authority`. They do not write local storage, product DB state,
proof/evidence, durable memory, Perspective, or deltas.

## Blocked Controls

The following records remain blocked until a separate authority contract exists:

- `local_write_manual_controls`
- `local_storage_draft_controls`
- `proposal_commit_reject_controls`
- `durable_memory_apply_controls`
- `perspective_apply_controls`

Their destination is `blocked_until_authority_contract`. They are visible in
State Proposal Review only as blocked review rows. No native local-write,
apply, approve, reject, or commit control is added.

## Obsolete/Delete Controls

The following records are delete candidates, not migration targets:

- `obsolete_external_execution_controls`
- `duplicate_cockpit_manual_explainer_copy`
- `legacy_cockpit_manual_tab_shell_copy`

Obsolete external execution, duplicate Cockpit-only manual explainer copy, and
legacy manual tab shell copy should be removed during obsolete shell cleanup or
Cockpit route removal once native coverage is validated.

## Integration With Workplane State Proposal Review

`types/workplane-state-proposal-review.ts` adds:

- `manual_control_migration_review`
- `manual_control_migration`
- `blocked_local_write_control`
- `obsolete_cockpit_control`
- `copy_export_review`
- `manual_control_migration_summary`
- `migrated_manual_control_reviews`
- `blocked_manual_control_reviews`
- `obsolete_manual_control_reviews`

`lib/workplane/workplane-state-proposal-review.ts` imports the pure manual
controls migration helper and adds a fourteenth State Proposal Review group:

- `manual_control_migration_review`

`components/workplane/state-proposal-review-panel.tsx` renders:

- `data-cockpit-manual-controls-migration="v0.1"`
- `data-cockpit-manual-control-id`
- `data-cockpit-manual-control-migration-status`
- `data-cockpit-manual-control-destination`
- `data-cockpit-manual-control-authority-class`

## Source And Static Migration Evidence Behavior

The manual controls migration helper is pure and deterministic. It does not
read or write DB state, call routes, call providers/OpenAI, call GitHub,
execute Codex, execute/tick/recover/schedule runner work, write proof/evidence,
apply durable memory, apply Perspective, auto-apply deltas, or use
localStorage/sessionStorage.

The rows are labeled as `static_migration_evidence`. They prove native review
representation, not live migrated product actions or authority grants.

## Authority Boundary

The migration authority boundary explicitly denies:

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
- `can_delete_cockpit_route`
- `can_delete_augnes_cockpit_component`

The panel renders no form, input, textarea, button, `onClick`, `formAction`,
server action, API write route, provider/OpenAI call, GitHub call, Codex
execution, runner execution/tick/recovery/scheduling, product DB write,
proof/evidence write, durable memory apply, Perspective apply, delta
auto-apply, or localStorage/sessionStorage write.

## Route Removal Follow-Up

This PR did not declare the Cockpit unique useful capability count to be 0.
Safe manual preview/copy controls are now represented natively, blocked
local-write/apply/commit/reject controls remain blocked until a separate
authority contract, and obsolete controls are delete candidates.

PR 5 must still verify that unique useful Cockpit capability count is 0 before
removing `/cockpit` or deleting `components/augnes-cockpit.tsx`.

PR 5 readiness follow-on: `docs/COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md`
performs that zero-count verification. It reports
`unique_useful_cockpit_capability_count: 0` and `zero_count_verified: true`
while keeping `route_removal_allowed: false` and
`component_removal_allowed: false` because the readiness PR does not delete the
route or component.

Route removal follow-on: `docs/COCKPIT_ROUTE_REMOVAL_V0_1.md` removed
`/cockpit`, `components/augnes-cockpit.tsx`, and the Workplane compatibility
pointer after that zero-count verification.

## Validation

Primary smoke:

```bash
npm run smoke:cockpit-manual-controls-migration-v0-1
```

Related checks:

```bash
npm run smoke:workplane-state-proposal-review-v0-1
npm run smoke:legacy-cockpit-remaining-capability-migration-v0-1
npm run smoke:agent-workplane-legacy-cockpit-shrink-v0-1
npm run smoke:blank-state-review-entry-absorption-v0-1
```

Runtime validation may start a temp-DB dev server and verify server-rendered
`/workbench` contains the State Proposal Review panel marker, manual migration
marker, required manual control IDs, and no native migrated status for blocked
local-write controls.

## Route Removal

Route removal is documented in `docs/COCKPIT_ROUTE_REMOVAL_V0_1.md`.
