# Local Codex Adapter Validate Result Fixture Surface Hardening Report

Date: 2026-06-12

## Summary

This PR performs one read-only hardening pass on the local Codex adapter validate result fixture surface added by PR #526.

Route:

`/cockpit/perspective/codex-former/local-adapter-validate-result-fixture`

The hardening pass improves accessibility/focus evidence, selected-state copy, safe-link clarity, denylist-control detection, responsive wrapping, static smoke coverage, browser report verification, and authority-boundary visibility. It does not add accepted state, persistence, DB, provider/model calls, Codex calls, GitHub mutation, clipboard behavior, runtime/product state, proof/evidence/readiness records, automation, or Core decision behavior.

## Hardening Scope

Changed files are limited to the existing route/component/CSS/helper, static/browser hardening smokes, docs/report artifacts, browser validation report, the existing base smoke allowlist, and `package.json` script registration.

## Accessibility / Focus Changes

- Added visible selected-state evidence for the current scenario and current inbox item.
- Added `aria-current`, `aria-describedby`, and clearer `aria-label` text to scenario buttons, filter buttons, and item buttons.
- Preserved native button semantics and native `details` / `summary` semantics.
- Strengthened visible focus styles for buttons and summary controls.
- Added selected-control styling keyed to `aria-current`.
- Kept PASS / PASS with follow-up / BLOCKED textually distinct so state does not rely on color.

## Copy / Denylist Hardening

PASS remains review-only and not approval, acceptance, mergeability, product readiness, persistence, export, runtime state, or Core decision.

PASS with follow-up remains review material only and keeps warning/follow-up pressure visible.

BLOCKED remains a validation result, not automated rejection.

Reviewability remains local review material only and does not imply approval, acceptance, persistence, mergeability, product readiness, review decision, or Core decision.

The helper now exports the forbidden executable control term list and a checker used by static smoke. The surface must not render executable controls with labels or accessible names containing Accept, Approve, Promote, Reject, Merge, Deploy, Persist, Export, Run Codex, Call Codex, Call Provider, Call provider/model, Create review decision, Create accepted state, Handoff to runtime, Create readiness, Create evidence, or Create proof.

## Safe-Link Non-Navigation

Safe links remain availability text only. The disclosure now states no href and no navigation target. `validation_summary` path/hash are labeled local fixture reference only. `read_only_validate_result_ui` and `runtime_handoff` remain unavailable with no href, no navigation, and no product/runtime authority.

No anchors, external links, URL mutation, router mutation, `window.location`, or href navigation are added.

## Responsive Behavior

The CSS keeps the existing responsive layout and strengthens wrapping for long detail labels, paths, hashes, and authority tags. Browser validation covers 390px, 768px, and 1280px desktop no-overflow checks.

## Browser / Computer-Use Validation Results

Browser/computer-use validation is recorded in:

`reports/browser/2026-06-12-perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening.md`

The report includes the route URL, server command, tested viewports, scenario/filter/item interaction matrix, console result, network/resource observation, focus/keyboard evidence, synthetic Tab limitation if still present, native focusable-order evidence, no-overflow evidence with scrollWidth/clientWidth, forbidden-controls check, safe-link non-navigation check, authority boundary observations, privacy/raw-material visibility check, and skipped checks with reasons.

## Authority Boundary

The surface still renders only bounded statuses, counts, labels, caveats, paths, hashes, authority tags, and false authority flags. It does not create accepted state, review decisions, product readiness, proof/evidence/readiness records, persistence, DB writes, network behavior, provider/model calls, Codex calls, GitHub mutation, clipboard behavior, runtime fixture mutation, surface export, automation, runtime state, product state, or Core decision behavior.

## Privacy / Redaction Handling

The surface does not render raw returned candidate content, raw prompt text, raw source packet, raw packet content, hidden reasoning, provider logs, secrets, cookies, tokens, API keys, browser dumps, raw diffs, raw review payloads, raw source payloads, raw candidate payloads, private markers, or unsafe marker values.

## Skipped Checks

Skipped checks: product-authority and persistence checks beyond negative-source/browser evidence, because this hardening pass intentionally adds no accepted-state, persistence, DB, provider/model, Codex, GitHub, clipboard, runtime/product state, proof/evidence/readiness records, automation, or Core decision behavior.

## Verification Plan

Required verification:

```bash
npm run typecheck
npm run build
npm run smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface
npm run smoke:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening
npm run browser:perspective-codex-former-local-adapter-validate-result-fixture-surface
npm run browser:perspective-codex-former-local-adapter-validate-result-fixture-surface-hardening
npm run smoke:perspective-codex-former-local-adapter-validate-result-snapshots
git diff --check
git diff --cached --check
```

## Recommended Next PR

recommended next PR: v0.1 closeout / end-to-end local Codex Former Local Adapter report, unless this hardening reveals a concrete blocker.
