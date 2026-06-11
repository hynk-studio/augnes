# Perspective Codex Former Local Adapter Snapshot Fixture Surface Hardening

## Summary

Hardened the read-only local Codex adapter snapshot fixture surface after PR #520. The changes improve accessibility labels, keyboard/focus evidence, denylist-control detection, prepared-as-waiting copy, authority flag rendering, local snapshot versus handoff copy, responsive coverage, and browser validation reporting.

## Why Follows PR #520

PR #520 implemented the browser-visible route `/cockpit/perspective/codex-former/local-adapter-snapshot-fixture` and recommended a follow-up hardening PR before broader integration work.

## Hardening Scope

Changed scope:

- component accessibility labels and visible copy;
- pure helper authority-flag normalization;
- scoped CSS wrapping/focus/layout hardening;
- hardening doc/report/browser report;
- hardening static smoke and browser-report smoke;
- package script registrations;
- existing implementation smoke changed-file compatibility for this follow-up only.

No unrelated fixture routes, generation code, capture/prepare/validate helpers, DB schema, provider/model code, Codex SDK code, or GitHub mutation code changed.

## Accessibility and Keyboard Traversal

The surface keeps semantic heading structure. Scenario and filter controls expose explicit group labels. Buttons use `aria-pressed`. Prepared status has an accessible label containing prepared/waiting status, caveat, review-only boundary, accepted state false, validation unavailable, and Constellation unavailable.

Prepared inbox items expose accessible label text for reviewability waiting, candidate count 0, not reviewable, and no Constellation handoff.

Native `details` / `summary` sections remain the collapsible controls.

## Denylist Control Detection

The hardening adds a shared denylist that includes `Accept`, `Approve`, `Promote`, `Reject`, `Merge`, `Deploy`, `Validate`, `Run Codex`, `PASS`, and `BLOCKED`.

Those terms render only inside the policy/denylist section as non-interactive badges/list content. Static smoke and browser validation inspect buttons, anchors, and interactive aria labels for forbidden action labels.

## Prepared-as-Waiting Copy

Prepared still renders as `Prepared, waiting for Codex return`.

The caveat `Manual Codex return has not been captured.` remains visible without expansion. Next safe action still mentions a separate user-started Codex session and exactly one candidate envelope.

The selected prepared inbox summary now shows reviewability waiting, not reviewable, candidate count 0, validation unavailable, Constellation unavailable, accepted state false, and review candidate unavailable.

Readiness copy is framed as implementation readiness only, not product readiness, validation, acceptance, or runtime handoff.

## Authority Flag Rendering

Added `normalizeAuthorityFlagsForDisplay(flags)` in the fixture-surface helper.

Missing flags display as false and never as permission. `prepare_helper_executed` displays only as operational provenance. Session scenario authority flags and selected Inbox item authority flags now use normalized rendering.

## Local Snapshot Availability vs Handoff Availability

Added explicit Local Snapshot / Handoff Boundary copy. The UI distinguishes local snapshot inspection from graph/review handoff, validation handoff, review candidate, and runtime/product navigation availability.

Unavailable handoffs render as rows or informational pills, not anchors.

## Responsive/Layout Hardening

Scoped CSS now applies stronger wrapping to the adapter snapshot surface, including long hashes, paths, refs, details sections, and item cards. Focus-visible and selected states are more obvious.

Browser validation covers 390px, 768px, and desktop width with no horizontal overflow.

## Browser Validation

Browser validation is recorded in:

`reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md`

Validated target:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

Browser result: PASS.

Observed coverage included route load, default prepared scenario, not_ready /
waiting / prepared scenario switching, all/not_ready/waiting/prepared inbox
filters, selected prepared item details, details open/close, no app anchors for
unavailable handoffs, no denylisted action controls, no console warnings/errors,
no external/provider/model/GitHub/Codex/OpenAI traffic, no fetch/XHR route
behavior, no raw prompt/source/packet/private marker text, and no horizontal
overflow at 1280px, 768px, or 390px.

Keyboard note: the in-app Browser runtime exposed the expected focusable DOM
order, but synthetic Tab injection through CUA, DOM CUA, and Playwright keypress
stayed pinned to the focused not_ready scenario button. The browser report
therefore records DOM focusability/order evidence and successful click
activation rather than claiming a successful synthetic Tab-key walk.

## Static Smoke Hardening

The hardening smoke verifies files/package scripts, accessibility labels, conservative authority normalization, denied runtime/browser APIs, prepared-as-waiting copy, unavailable handoff copy, denylist-control boundaries, raw marker absence, responsive CSS, browser report coverage, and changed-file boundaries.

## Privacy/Redaction Handling

The UI continues to render bounded labels, caveats, paths, hashes, counts, safe-link availability, and authority flags. It does not render raw prompt/source/packet content, returned candidate content, transcript content, or private marker values.

## Authority Boundary

The UI remains read-only, fixture-backed only, deterministic, local-only, non-persistent, and non-authorizing.

There is no helper execution, no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, and no surface export to runtime/product state.

The prepared state is still waiting for human-started Codex return. prepare_helper_executed true is operational provenance only.

## Verification

Completed verification:

- PASS `npm run typecheck`
- PASS `npm run build`
- PASS `npm run smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-implementation`
- PASS `npm run smoke:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening`
- PASS `npm run browser:perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening`
- PASS `npm run browser:perspective-codex-former-local-adapter-snapshot-fixture-surface`
- HOLD `npm run smoke:perspective-codex-former-local-adapter-snapshot-surface-integration`
- PASS `git diff --check`
- PASS `git diff --cached --check`

## Skipped Checks With Reasons

No helper, validate helper, Codex SDK, provider/model API, GitHub API, network, DB, persistence, clipboard, capture-helper, runtime fixture mutation, review decision, or surface-export path is run because those actions are outside this read-only fixture-surface scope.

`npm run smoke:perspective-codex-former-local-adapter-snapshot-surface-integration`
was run as an optional companion check and stopped on its historical changed-file
guard: `snapshot surface integration changed an out-of-scope file:
app/globals.css`. This hardening PR intentionally changes component/CSS/report
surface files and uses its own hardening smoke allowlist; the older integration
smoke was not widened.

## Recommended Next PR

Design validate orchestration mode.

## What Codex Did Not Do

Codex did not run prepare helper, run validate helper, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs for app behavior, call network from the app, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve/merge/deploy/make Core decisions, capture live Codex sessions, mutate runtime fixtures, automate clipboard, implement validate orchestration, export surface state to runtime/product state, or modify capture helper behavior.
