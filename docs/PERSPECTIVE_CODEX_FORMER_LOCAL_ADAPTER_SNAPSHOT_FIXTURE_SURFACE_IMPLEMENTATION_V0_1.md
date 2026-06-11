# Perspective Codex Former Local Adapter Snapshot Fixture Surface Implementation v0.1

## Purpose

This document records the read-only UI implementation that renders the PR #519 local Codex adapter snapshot surface view-model fixtures. The surface lets an operator inspect Session Panel adapter snapshot scenarios, Capture Review Inbox adapter snapshot items, and the integration readiness summary without executing helpers or creating product state.

## Why Follows PR #519

PR #519 added the non-UI local adapter snapshot surface integration readiness layer. It committed deterministic Session Panel view-model fixtures, Capture Review Inbox view-model fixtures, and a readiness fixture for the next UI layer.

This PR follows that recommendation by adding the first browser-visible route for those committed fixtures. It does not regenerate fixtures, reread user paths, or reinterpret source material at runtime.

## Implementation Scope

The implementation scope is UI route/component/CSS/helper/docs/report/smoke/package only.

The UI is read-only, fixture-backed only, local-only, non-persistent, and non-authorizing. It uses local React state for scenario selection, inbox filtering, inbox item selection, and expanded details only.

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

Files:

- `app/cockpit/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx`
- `components/codex-former-local-adapter-snapshot-fixture.tsx`
- `lib/perspective-ingest/codex-former-local-adapter-snapshot-fixture-surface.ts`

## Fixture Inputs

The route imports only committed PR #519 fixture JSON:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json`

It does not load files dynamically from user paths.

## Session Panel Preview

The Session Panel Preview renders exactly three scenario choices:

- `not_ready`
- `waiting`
- `prepared_waiting_for_codex_return`

The default selected scenario is `prepared-waiting-for-codex-return`. The prepared scenario displays `Prepared, waiting for Codex return`, the caveat `Manual Codex return has not been captured.`, and the next safe action requiring a separate user-started Codex session with exactly one candidate envelope returned.

The prepared scenario keeps accepted state false, Constellation available false, validation available false, returned candidate available false, and review-only true visible in the status card. `prepare_helper_executed true` is shown as operational provenance only.

## Capture Review Inbox Preview

The Capture Review Inbox Preview renders the three adapter snapshot items:

- `not_ready`
- `waiting`
- `prepared_waiting_for_codex_return`

Filters are `all`, `not_ready`, `waiting`, and `prepared`. The `waiting` filter includes both the waiting item and the prepared item because the prepared item remains `reviewability: waiting`.

The prepared item displays reviewability as waiting, not reviewable. It shows `candidate_count 0`, `blocked_reason_count 0`, and `reviewable count 0`. Disabled safe links render as informational text, not clickable controls.

## Integration Readiness Section

The Integration Readiness section renders:

- status `ready_for_ui_implementation`;
- surfaces `session_panel` and `capture_review_inbox`;
- scenario coverage `not_ready`, `waiting`, and `prepared_waiting_for_codex_return`;
- UI scope `read_only`, `fixture_backed`, `local_only`, `no_persistence`, and `no_runtime_mutation`;
- browser validation required true;
- browser validation matrix;
- copy and density policy;
- accessibility plan;
- caveats/blockers;
- authority boundary flags.

The policy denylist terms `Accept`, `Approve`, `Promote`, `Reject`, `Merge`, `Deploy`, `Validate`, and `Run Codex` appear only inside the clearly labeled Prohibited Control Copy / Denylist policy section. They are not rendered as buttons, links, next actions, or commands.

## Interaction Behavior

All interaction uses local component state only:

- selected session scenario;
- selected inbox filter;
- selected inbox item;
- expanded/collapsed details.

The implementation does not use localStorage, sessionStorage, indexedDB, cookies, URL mutation, clipboard APIs, fetch, or XMLHttpRequest.

## Copy and Density Handling

Default cards show one primary status, one caveat, one next safe action or compact status summary, timeline/status counts, warning/candidate counts, and compact authority details.

Evidence cards, helper output refs, hashes, and full authority flags are placed in collapsible details sections. The UI does not render raw prompt, source input, packet, transcript, or private marker content.

Prepared copy always pairs prepared with waiting for Codex return. Local snapshot availability is not presented as product approval, validation, acceptance, reviewability, or graph handoff.

## Accessibility Notes

The surface uses semantic headings, native buttons, `aria-pressed` selected state, native `details` / `summary` collapsible sections, and visible focus styling through scoped CSS. Status does not rely on color alone; visible copy includes waiting, caveat, counts, and boundary text.

The prepared/waiting state is textually distinct from approved, accepted, or reviewable.

## Browser/Computer-Use Validation

Browser validation is required for this UI PR and is recorded in:

`reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface.md`

The validation target is:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

## Privacy / Redaction Boundary

The UI renders bounded labels, statuses, caveats, paths, hashes, counts, and authority flags from committed fixtures. It does not render raw prompt/source/packet content, returned candidate content, transcript content, or private marker values.

## Authority Boundary

This implementation has no helper execution, no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, and no surface export to runtime/product state.

The prepared state is still waiting for human-started Codex return. prepare_helper_executed true is operational provenance only.

## What This Does Not Do

This does not run the prepare helper, run the validate helper, call Codex, integrate the Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve/merge/deploy/make Core decisions, capture live Codex sessions, mutate runtime fixtures, automate clipboard, implement validate orchestration, export surface state to runtime/product state, modify capture helper behavior, or imply PASS/BLOCKED or graph handoff for prepared state.

## Future Work

- Harden adapter snapshot fixture UI.
- Consider read-only integration into existing Session Panel / Inbox fixture routes.
- Design validate orchestration mode.
- PASS/BLOCKED validate-summary modeling.

## Recommended Next PR

Harden read-only adapter snapshot fixture surface.

## Conclusion

PASS with follow-up.
