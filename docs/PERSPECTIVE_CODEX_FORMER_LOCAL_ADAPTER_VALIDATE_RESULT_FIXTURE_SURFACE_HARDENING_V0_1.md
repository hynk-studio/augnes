# Local Codex Adapter Validate Result Fixture Surface Hardening v0.1

## Why This Follows PR #526

PR #526 added the read-only local Codex adapter validate result fixture surface at:

`/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

It rendered PR #525 validate result snapshots for the Session Panel preview, Capture Review Inbox preview, and snapshot readiness / authority summary. The PR #526 browser report also recorded that synthetic Tab dispatch in the in-app browser wrapper did not advance focus, while native focusable-order inspection covered the controls. This hardening pass treats that note as a concrete evidence target.

## Hardening Scope

This pass is still read-only UI hardening. It changes only the existing validate result fixture surface, its helper, CSS, static/browser hardening smokes, docs/report artifacts, package script registration, and browser validation report.

It does not add accepted state, review decisions, persistence, DB access, provider/model API calls, Codex calls, Codex SDK use, GitHub mutation, app-side network behavior, clipboard behavior, runtime fixture mutation, surface export, proof/evidence/readiness records, automation, product state, runtime state, or Core decision behavior.

## Route Path

`/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

The route continues to import the committed PR #525 validate result fixtures directly. There is no dynamic user-path loading.

## Accessibility / Focus Changes

The surface now provides visible selected-state evidence for the active scenario and selected inbox item. Scenario buttons, filter buttons, and item buttons retain native button semantics and `aria-pressed`, and now include `aria-current`, `aria-describedby`, and clearer `aria-label` text.

The selected scenario text says it is review-only fixture material and not approval, acceptance, mergeability, product readiness, persistence, export, runtime state, or Core decision. The selected inbox text clarifies that reviewability means local review material only, not approval, acceptance, persistence, mergeability, product readiness, review decision, or Core decision.

Details remain native `details` / `summary` controls. Focus styling is stronger for buttons and summaries, and selected controls have visible `aria-current` styling.

## Copy / Denylist Hardening

PASS remains review-only and not approval, acceptance, mergeability, product readiness, persistence, export, runtime state, or Core decision.

PASS with follow-up remains review material only and visibly carries warning/follow-up pressure.

BLOCKED remains a validation result, not automated rejection.

The helper exposes `forbiddenValidateResultExecutableControlTerms` and `findForbiddenValidateResultExecutableControlCopy` so static smoke can inspect button text and accessible-control labels. Forbidden terms may appear only in the clearly non-executable policy disclosure.

## Safe-Link Non-Navigation

Safe links remain availability text only. The safe-link disclosure now states there is no href and no navigation target.

The validation_summary path/hash are labeled as local fixture reference only. `read_only_validate_result_ui` and `runtime_handoff` remain unavailable with no href, no navigation, and no product/runtime authority.

No anchors, external links, URL mutation, router mutation, `window.location`, or href navigation are added.

## Responsive Behavior

The route keeps the PR #526 responsive layout and adds stronger wrapping for long labels, tags, hashes, and details. Browser validation covers 390px, 768px, and 1280px desktop viewports with scrollWidth/clientWidth evidence.

## Browser / Computer-Use Validation Results

Browser/computer-use validation uses the actual browser-visible route and the server command:

`npm run dev -- -H 127.0.0.1 -p 3000`

The hardening browser report records the route URL, tested viewports, scenario/filter/item interaction matrix, console result, network/resource observation, focus/keyboard evidence, synthetic Tab limitation if still present, native focusable-order evidence, no-overflow evidence with scrollWidth/clientWidth, forbidden-controls check, safe-link non-navigation check, authority boundary observations, privacy/raw-material visibility check, and skipped checks with reasons.

## Synthetic Tab Limitation

If the in-app browser wrapper still cannot advance focus with synthetic Tab dispatch, the browser report records that limitation honestly. The hardening evidence must still inspect native focusable order and element roles for scenario buttons, filter buttons, item buttons, and details.

## Authority Boundary

The surface remains non-authorizing. It renders bounded statuses, counts, labels, caveats, paths, hashes, authority tags, and false authority flags only.

It does not create accepted state, review decisions, product readiness, proof/evidence/readiness records, persistence, DB writes, provider/model calls, Codex calls, GitHub mutation, network behavior, clipboard behavior, runtime fixture mutation, surface export, automation, runtime state, product state, or Core decisions.

## Privacy / Redaction Handling

The surface must not render raw returned candidate content, raw prompt text, raw source packet, raw packet content, hidden reasoning, provider logs, secrets, cookies, tokens, API keys, browser dumps, raw diffs, raw review payloads, raw source payloads, raw candidate payloads, private markers, or unsafe marker values.

Static and browser smokes check that the visible surface stays bounded to statuses, counts, labels, caveats, paths, hashes, authority tags, and false authority flags.

## Skipped Checks

No product-authority checks are run because this hardening pass intentionally does not add accepted-state, persistence, DB, provider/model, Codex, GitHub, clipboard, runtime/product state, proof/evidence/readiness records, automation, or Core decision behavior.

## Recommended Next PR

recommended next PR: v0.1 closeout / end-to-end local Codex Former Local Adapter report, unless this hardening reveals a concrete blocker.
