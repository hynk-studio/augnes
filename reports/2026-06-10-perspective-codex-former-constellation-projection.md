# Perspective Codex Former Constellation Projection

Conclusion: PASS with follow-up.

## Summary

This PR adds a read-only Codex Former constellation projection contract. The
contract maps bounded local capture/validation/review summary material into a
future Constellation Preview view model with nodes, edges, status summaries,
warning summaries, authority summaries, and privacy summaries.

## Why Follows PR #498

PR #498 defined the product-surface design direction for the Codex Session
Perspective Panel, Capture Review Inbox, Constellation Preview, display density
policy, and Authority Lens. This PR is the next implementation-facing contract:
a pure derived projection shape that future fixture and UI work can consume.

## Projection Contract

The new module is:

- `lib/perspective-ingest/perspective-codex-former-constellation-projection.ts`

It exports `buildCodexFormerConstellationProjection` and versioned projection
types. The builder accepts a narrow validation-like input and returns
`codex_former_constellation_projection.v0.1` with source, nodes, edges,
status, warning, authority, privacy, and false-authority flags.

## Node/Edge Model

The node model covers `work`, `source_input`, `manual_copy_packet`,
`codex_session`, `candidate_draft`, `validation_summary`, `review_candidate`,
`warning`, `worker_guidance`, and `next_action`.

The edge model covers `prepared`, `pasted_by_human`, `returned`, `validated`,
`informs`, `suggests`, `pointer_only`, and `blocked_by`.

`accepted_future_only` is present only as a future enum value in the schema and
docs. The builder does not emit it for current workflow fixtures.

## PASS With Follow-Up Fixture

The smoke fixture verifies that a `PASS with follow-up` input with one
non-committed candidate emits source, packet, Codex session, candidate draft,
validation summary, review candidate, warning, worker guidance, and next action
nodes. It also verifies prepared, pasted_by_human, returned, validated, informs,
pointer_only, and suggests edges.

## BLOCKED Fixture

The smoke fixture verifies that a blocked input emits validation and
warning/blocking nodes, emits a `blocked_by` edge, and does not emit review
candidate or worker guidance nodes.

## Authority Boundary

This PR does not create accepted Augnes state, DB writes, persistence,
proof/evidence/readiness records, provider/model calls, Codex SDK calls, GitHub
mutation behavior, clipboard automation, UI implementation, approvals, merges,
deploys, or Core decisions.

The projection is a derived read-only contract only.

## Privacy/Redaction Handling

The builder reuses local Codex Former sanitization helpers for bounded strings.
Unsafe marker-like material in warning, blocking, title, badge, provenance, and
detail strings is omitted, and omitted fields are reported through projection
privacy metadata.

Public docs and reports use sanitized descriptions instead of raw
unsafe/private marker literals.

## Verification

Completed verification:

- `npm run typecheck` passed.
- `npm run smoke:perspective-codex-former-manual-workflow-docs` passed.
- `npm run smoke:perspective-codex-former-manual-copy-packet` passed.
- `npm run smoke:perspective-codex-former-separate-session-capture-packet-prep`
  passed.
- `npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture`
  passed.
- `npm run smoke:perspective-codex-former-capture-helper` passed.
- `npm run smoke:perspective-codex-former-workflow-closeout` passed.
- `npm run smoke:perspective-codex-former-product-surface-design` passed.
- `npm run smoke:perspective-codex-former-constellation-projection` passed.
- `git diff --check` passed.
- `git diff --cached --check` passed.

## Skipped Checks With Reasons

- Browser/computer-use validation: skipped because no UI, route,
  browser-visible surface, clipboard automation, or browser/computer-use capture
  was added.
- Runtime-backed Augnes brief/proof/evidence/readiness recording: skipped when
  local runtime is unavailable or because this PR does not create such records.

## What Codex Did Not Do

Codex did not implement UI, routes, runtime browser surfaces, DB persistence,
provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard
automation, accepted Augnes state, proof/evidence/readiness records, approvals,
merges, deploys, or Core decisions.

## Recommended Next PR

Add Codex Former constellation projection fixture preview.
