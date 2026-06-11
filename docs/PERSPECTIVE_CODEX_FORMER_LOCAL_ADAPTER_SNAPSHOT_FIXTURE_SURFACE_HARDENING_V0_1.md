# Perspective Codex Former Local Adapter Snapshot Fixture Surface Hardening v0.1

## Purpose

This document records the hardening pass for the read-only local Codex adapter snapshot fixture surface added in PR #520. The goal is to make the fixture UI safer and clearer before any broader integration work.

## Why Follows PR #520

PR #520 implemented `/cockpit/perspective/codex-former/local-adapter-snapshot-fixture` and browser-validated the first fixture-backed UI. It recommended a follow-up to harden keyboard/accessibility evidence, denylist-control detection, responsive coverage, prepared-as-waiting copy, authority flag rendering, and the distinction between local snapshot inspection and graph/review/runtime handoff availability.

## Hardening Scope

This PR hardens only the local adapter snapshot fixture surface, its pure fixture-surface helper, scoped CSS, docs, reports, browser report, smokes, and package scripts.

The UI remains read-only, fixture-backed only, deterministic, local-only, non-persistent, and non-authorizing.

## Accessibility and Keyboard Traversal

The page keeps one clear `h1` and semantic `h2` / `h3` structure.

The Session scenario selector and Inbox filter bar now use explicit group labels. Scenario, filter, and item controls use native buttons with `aria-pressed`. The prepared status card has an accessible label that includes prepared/waiting status, caveat, review-only boundary, accepted state false, validation unavailable, and Constellation unavailable.

Prepared inbox items expose accessible label text for reviewability waiting, candidate count 0, not reviewable, and no Constellation handoff.

Details sections remain native `details` / `summary` controls. Focus-visible styling is scoped and visible for scenario selectors, inbox filters, item selection, and details/summary controls.

## Denylist Control Detection

Forbidden control/action labels are:

- Accept
- Approve
- Promote
- Reject
- Merge
- Deploy
- Validate
- Run Codex
- PASS
- BLOCKED

Those terms may appear only in policy/denylist text. They must not appear in button accessible names, link text, interactive aria labels, primary status labels, next safe action labels, filter labels, scenario labels, or item selection labels.

The denylist is rendered as non-interactive policy badges/list content, not buttons or links.

## Prepared-as-Waiting Copy

Prepared status continues to say `Prepared, waiting for Codex return`.

The prepared caveat `Manual Codex return has not been captured.` remains visible without expansion. The next safe action still requires a separate user-started Codex session and exactly one candidate envelope.

The selected prepared inbox summary now explicitly shows reviewability waiting, not reviewable, candidate count 0, validation unavailable, Constellation unavailable, accepted state false, and review candidate unavailable.

Any readiness text is framed as implementation readiness only, not product readiness, validation, acceptance, or runtime handoff.

## Authority Flag Rendering

The fixture-surface helper now exposes `normalizeAuthorityFlagsForDisplay(flags)`.

Missing authority flags default to false for display and are never interpreted as permission. The only non-false display value is `prepare_helper_executed` as `operational provenance only`.

The UI renders normalized authority flags for every Session scenario and selected Inbox item. `validate_helper_executed`, `accepted_state_created`, `review_decision_created`, `surface_export_created`, network/provider/Codex/GitHub/DB/clipboard/runtime mutation flags, and Core decision flags never render true.

## Local Snapshot Availability vs Handoff Availability

The UI now has a Local Snapshot / Handoff Boundary section for Session scenarios and the selected Inbox item.

It distinguishes:

- local snapshot inspection is visible in this read-only fixture surface;
- graph/review handoff is unavailable;
- validation handoff is unavailable;
- review candidate is unavailable;
- runtime/product navigation is unavailable.

Unavailable handoffs render as status rows or informational pills, not anchors.

## Responsive/Layout Hardening

Scoped CSS keeps fixed-width assumptions out of the adapter snapshot surface, wraps long hashes/paths/refs, and keeps details sections and item cards within their containers.

Browser validation covers 390px, 768px, and desktop width with no horizontal overflow and key content present.

## Browser Validation

Browser validation is recorded in:

`reports/browser/2026-06-11-perspective-codex-former-local-adapter-snapshot-fixture-surface-hardening.md`

The validation target is:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-snapshot-fixture`

## Static Smoke Hardening

The hardening smoke verifies package scripts, expected files, accessibility labels, authority normalization, denied browser/runtime APIs, prepared-as-waiting copy, local snapshot versus handoff copy, denylist-control boundaries, raw marker absence, responsive CSS, browser report coverage, keyboard evidence, console/traffic evidence, and changed-file boundaries.

## Privacy / Redaction Boundary

The UI renders bounded labels, statuses, caveats, paths, hashes, counts, safe-link availability, and authority flags. It does not render raw prompt/source/packet content, returned candidate content, transcript content, or private marker values.

## Authority Boundary

This hardening has no helper execution, no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, and no surface export to runtime/product state.

The prepared state is still waiting for human-started Codex return. prepare_helper_executed true is operational provenance only.

## What This Does Not Do

This does not run the prepare helper, run the validate helper, call Codex, integrate the Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve/merge/deploy/make Core decisions, capture live Codex sessions, mutate runtime fixtures, automate clipboard, implement validate orchestration, export surface state to runtime/product state, modify capture helper behavior, or imply PASS/BLOCKED, validation, reviewability, accepted state, or Constellation handoff for prepared state.

## Future Work

- Consider integrating adapter snapshots into existing Session Panel / Inbox fixture routes.
- Design validate orchestration mode.
- PASS/BLOCKED validate-summary modeling.

## Recommended Next PR

Design validate orchestration mode.

## Conclusion

PASS with follow-up.
