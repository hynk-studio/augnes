# Perspective Codex Former Local Adapter Snapshot Fixture Surface Implementation

## Summary

Implemented a read-only, fixture-backed UI route for inspecting PR #519 local Codex adapter snapshot surface view-model fixtures. The surface renders Session Panel scenarios, Capture Review Inbox items, and the integration readiness summary without executing helpers or mutating runtime/product state.

## Why Follows PR #519

PR #519 added deterministic Session Panel surface view-model fixtures, Capture Review Inbox surface view-model fixtures, and an integration readiness fixture. It recommended the next PR implement a read-only adapter snapshot fixture surface.

This implementation consumes those committed fixtures directly and keeps the prepared state visibly waiting for a human-started Codex return.

## Implementation Scope

Changed scope:

- route/component/CSS for the read-only browser-visible fixture surface;
- pure helper validation/filter module;
- implementation docs/report/browser report;
- static smoke and browser-report smoke;
- package script registrations.

No helper execution, fixture regeneration, DB/schema/runtime, provider/model, Codex SDK, GitHub API, network, or capture-helper behavior changed.

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

Local validation URL:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

## Fixture Inputs

The route imports only:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json`

No dynamic user-path file loading was added.

## Session Panel Preview Result

The surface renders the three adapter snapshot scenarios:

- `not_ready`
- `waiting`
- `prepared_waiting_for_codex_return`

The default scenario is prepared. Prepared displays `Prepared, waiting for Codex return`, the visible caveat `Manual Codex return has not been captured.`, and the next safe action requiring a separate user-started Codex session plus exactly one candidate envelope.

Accepted state false, review-only true, Constellation available false, validation available false, returned candidate available false, and `prepare_helper_executed` operational provenance only are visible.

## Capture Review Inbox Preview Result

The surface renders the three adapter snapshot items with filters:

- `all`
- `not_ready`
- `waiting`
- `prepared`

The prepared item remains `reviewability: waiting`, not reviewable. It shows `candidate_count 0`, `blocked_reason_count 0`, and `reviewable count 0`. Safe links with available false are informational text, not clickable actions.

## Integration Readiness Result

The readiness section renders status `ready_for_ui_implementation`, covered surfaces, scenario coverage, UI scope, browser validation required true, browser validation matrix, copy/density policy, accessibility plan, caveats/blockers, and authority boundary flags.

The Prohibited Control Copy / Denylist policy is displayed as policy text only. The denylist terms are not buttons, links, commands, or next actions.

## Interaction Behavior

Interaction uses local React state only:

- session scenario selection;
- inbox filter selection;
- inbox item selection;
- details expansion.

No localStorage, sessionStorage, indexedDB, cookies, URL mutation, clipboard API, fetch, or XMLHttpRequest behavior was added.

## Accessibility Notes

The surface uses semantic headings, native buttons with `aria-pressed`, native `details` / `summary`, visible focus styles, non-color-only status text, and visible caveat/boundary/count copy. Prepared and waiting states are textually distinct from approved, accepted, validated, and reviewable states.

## Browser/Computer-Use Validation

Browser validation is recorded in:

`reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface.md`

The route was validated locally through `npm run dev -- -H 127.0.0.1 -p 3000`, then inspected at the local target URL.

Computer Use was not separately required because the browser-visible surface was fully covered through local browser interaction and DOM/resource inspection.

## Privacy/Redaction Handling

The UI renders bounded statuses, labels, caveats, paths, hashes, counts, safe-link availability, and authority flags. It does not render raw prompt/source/packet content, returned candidate content, transcript content, or private marker values.

## Authority Boundary

This implementation is read-only, fixture-backed only, local-only, non-persistent, and non-authorizing.

There is no helper execution, no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, and no surface export to runtime/product state.

The prepared state is still waiting for human-started Codex return. prepare_helper_executed true is operational provenance only.

## Verification

Passed:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation`
- `npm run browser:perspective-codex-former-local-adapter-snapshot-fixture-surface`
- `git diff --check`
- `git diff --cached --check`

Browser validation passed at `http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`. The report records route load, scenario switching, filter switching, prepared item selection, no executable controls, denylist terms only in policy copy, no console warnings/errors, no observed external traffic, and 390px no horizontal overflow.

Ran with expected historical guard failure:

- `npm run smoke:perspective-codex-former-local-adapter-snapshot-surface-integration`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-output-snapshots`

Both older upstream smokes reached their final changed-file boundary assertions and failed because this branch legitimately adds UI implementation files such as `app/cockpit/perspective/codex-former/local-adapter-snapshot-fixture/page.tsx`. The older smokes are scoped to earlier non-UI snapshot/readiness slices and do not include this UI route/component/doc/report/smoke file set. No unrelated historical guardrails were widened.

## Skipped Checks With Reasons

No helper, validate helper, Codex SDK, provider/model API, GitHub API, network, DB, persistence, clipboard, capture-helper, runtime fixture mutation, review decision, or surface-export path was run because those actions are outside this read-only fixture-surface scope.

Computer Use was not separately run because the in-app Browser validation covered the browser-visible route interactions, DOM semantics, console logs, resource inspection, and 390px layout proof.

## Recommended Next PR

Harden read-only adapter snapshot fixture surface.

## What Codex Did Not Do

Codex did not run prepare helper, run validate helper, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs for app behavior, call network from the app, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve/merge/deploy/make Core decisions, capture live Codex sessions, mutate runtime fixtures, automate clipboard, implement validate orchestration, export surface state to runtime/product state, or modify capture helper behavior.
