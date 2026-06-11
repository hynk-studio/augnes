# Perspective Codex Former Constellation Preview Fixture Surface Implementation

## Summary

Implemented the first read-only, fixture-backed Constellation Preview surface for Codex Former preview data.

The surface renders PASS with follow-up and BLOCKED adapted preview-data fixtures through a local deterministic Cockpit/Perspective route. It adds no runtime ingestion, provider/model calls, Codex SDK calls, GitHub mutations, DB writes, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.

## Why Follows PR #502

PR #502 defined the fixture surface design contract after PR #501 added the adapted preview-data fixtures. This PR implements that design contract as a first UI surface.

The implementation follows the PR #502 surface regions: Summary Strip, Graph Canvas, Warning Panel, Authority Lens, Detail Drawer / Details Panel, Legend, empty state, unsupported version validation, and invalid graph edge validation.

## Implementation Scope

Changed scope:

- Next route for the read-only fixture surface
- React component for local fixture selection and inspection
- scoped CSS in `app/globals.css`
- pure validation/helper file for unsupported version and invalid edge reference checks
- implementation doc
- implementation report
- smoke script
- browser-validation report smoke script
- package scripts

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/constellation-preview-fixture`

The route is under Cockpit/Perspective conventions while keeping the implementation separate from the main Cockpit component.

## Fixture Inputs

Rendered fixture inputs:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

The surface imports only those committed JSON files.

## PASS with follow-up Surface Result

PASS with follow-up is the default selected fixture.

Visible result:

- Summary Strip shows PASS with follow-up.
- Review-only appears as normal review state.
- accepted-state false is visible.
- next action is advisory text, not a command.
- Warning Panel is collapsed by default but warning pressure remains visible.
- Graph Canvas includes `review_candidate`, `worker_guidance`, and `next_action`.
- Authority Lens exists and is collapsed by default.
- Detail Panel opens for summary, warnings, Authority Lens, nodes, and edges.

## BLOCKED Surface Result

BLOCKED is selectable through the fixture selector.

Visible result:

- Summary Strip shows BLOCKED as a stopped validation result.
- Warning Panel is open by default.
- blocked reasons are prominent.
- blocked graph stops at validation / warning nodes.
- `review_candidate`, `worker_guidance`, and `next_action` are not shown as usable material.
- BLOCKED is treated as a valid review result, not a system failure.

## Accessibility Notes

The surface includes semantic headings, keyboard-accessible fixture selection, keyboard-accessible graph node and edge buttons, keyboard-accessible `details` expand/collapse controls, visible focus states, non-color warning/blocked text indicators, and bounded detail rows.

Graph node and edge accessible labels include label/status/authority/tone or relation/line-style/tone without dumping every authority flag.

## Browser/Computer-Use Validation

Validation target:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/constellation-preview-fixture`

Local command:

`npm run dev -- -H 127.0.0.1 -p 3000`

Browser report:

`reports/browser/2026-06-11-perspective-codex-former-constellation-preview-fixture-surface.md`

Result: PASS after live browser validation.

## Privacy/Redaction Handling

The UI renders bounded fixture summaries only.

It does not render raw private/source/provider payloads, unsafe omitted values, external data, or browser-captured material. It does not call storage, network, capture helper, runtime ingestion, provider/model, Codex SDK, GitHub, or DB paths.

## Authority Boundary

The implementation is read-only, fixture-backed, local/static/deterministic, non-persistent, and non-authorizing.

It does not add accepted Augnes state, proof/evidence/readiness record creation, provider/model calls, Codex SDK calls, GitHub mutation behavior, DB writes or migrations, clipboard automation, approval, merge, deploy, or Core decision behavior.

## Verification

Passed:

- `npm run typecheck`
- `npm run build`
- `npm run dogfood:perspective-codex-former-constellation-fixture-preview`
- `npm run dogfood:perspective-codex-former-constellation-preview-data-adapter`
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation`
- `npm run browser:perspective-codex-former-constellation-preview-fixture-surface`
- `git diff --check`
- `git diff --cached --check`

Ran and failed only on historical changed-file boundary guards:

- `npm run smoke:perspective-codex-former-manual-workflow-docs`
- `npm run smoke:perspective-codex-former-manual-copy-packet`
- `npm run smoke:perspective-codex-former-separate-session-capture-packet-prep`
- `npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture`
- `npm run smoke:perspective-codex-former-capture-helper`
- `npm run smoke:perspective-codex-former-workflow-closeout`
- `npm run smoke:perspective-codex-former-product-surface-design`
- `npm run smoke:perspective-codex-former-constellation-projection`
- `npm run smoke:perspective-codex-former-constellation-fixture-preview`
- `npm run smoke:perspective-codex-former-constellation-preview-data-adapter`
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-design`

Failure reason: those predecessor smokes include hardcoded allowed-file lists for their original docs/helper/design/data slices. This implementation PR intentionally changes `app/`, `components/`, `app/globals.css`, package scripts, docs, reports, browser report, and new implementation smokes, so the predecessor guards report out-of-scope files even though their generated fixture/report content remained deterministic and left no additional diff.

## Skipped Checks With Reasons

No DB-backed, provider/model, Codex SDK, GitHub mutation, approval, merge, deploy, or Core decision checks were added because those paths are out of scope and intentionally absent.

No predecessor smoke guard files were widened in this PR. Their failures are reported as caveats instead of changing historical guard ownership.

## Recommended Next PR

Design Codex Session Perspective Panel fixture surface.

## What Codex Did Not Do

Codex did not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, GitHub mutations, DB writes, migrations, clipboard automation, approval behavior, merge behavior, deploy behavior, Core decision behavior, or runtime fixture mutation.
