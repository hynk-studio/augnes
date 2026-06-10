# Perspective Codex Former Product Surface Design

Conclusion: PASS with follow-up.

## Summary

This PR adds the first product-surface design direction after the merged Codex
Former manual capture workflow closeout. It defines how review-only Codex Former
candidate material could later appear in a Codex Session Perspective Panel,
Capture Review Inbox, and Constellation Preview.

The PR stays docs/report/smoke/package only. It does not implement UI, routes,
runtime behavior, DB writes, provider/model calls, Codex SDK calls, GitHub
mutation behavior, clipboard automation, accepted Augnes state,
proof/evidence/readiness records, approvals, merges, deploys, or Core
decisions.

## Why Follows PR #497

PR #497 closed the current manual capture workflow and stated the entry criteria
for product-surface work. With the CLI/helper path stable on `main`, source
input template coverage in place, exactly-one-candidate validation enforced,
provenance and unsafe source-input blocking documented, and pointer warnings
remaining visible, the next safe step is a design contract for future product
surfaces.

## Design Scope

The new design document is:

- `docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md`

It defines product direction only. It intentionally avoids implementation,
accepted-state automation, proof/evidence/readiness creation, provider/model or
Codex SDK calls, DB writes, GitHub mutations, approvals, merges, deploys, and
Core decisions.

## Product Thesis

Codex performs work, Augnes captures and validates the perspective candidate
produced by that work, and the constellation UI shows how the candidate relates
to work, source input, validation, warnings, and next actions.

## Surfaces

The design defines three future user-facing surfaces:

- Codex Session Perspective Panel: shows formation status while working with
  Codex without implying acceptance.
- Capture Review Inbox: collects validated, blocked, and needs_review
  candidates for human inspection.
- Constellation Preview: maps work, source input, manual packet, Codex session,
  candidate draft, validation, warnings, worker guidance, and next actions into
  relationships.

## Node/Edge Model

The node taxonomy covers `work`, `source_input`, `manual_copy_packet`,
`codex_session`, `candidate_draft`, `validation_summary`, `review_candidate`,
`warning`, `worker_guidance`, and `next_action`.

The edge taxonomy covers `prepared`, `pasted_by_human`, `returned`,
`validated`, `informs`, `suggests`, `pointer_only`, and `blocked_by`.

Both models keep status, authority, warning count, and provenance refs explicit
without treating review material as accepted state.

## Authority Display Policy

The design defines a three-level disclosure policy:

- default view: compact node label, status, and at most two badges;
- hover/focus view: short validation and caveat summary;
- detail drawer: full provenance, hashes, authority flags, warnings, candidate
  count, and validation result.

Default badges should prefer review-only, needs_review, blocked,
pointer_warning, and provenance_mismatch. Red is reserved for blocked states,
amber for needs_review or warning states, and neutral/blue treatment for
review-only states.

Authority Lens is a future expert mode that emphasizes review-only,
non_committed, blocked, provenance mismatch, unsafe source input, pointer-only,
and advisory-only boundaries without overwhelming the normal workflow view.

## Browser Validation Plan

Browser/computer-use validation was not run for this PR because no UI, route,
browser-visible surface, clipboard automation, or browser/computer-use capture
was added.

For future UI work, the design requires browser/computer-use validation for
badge density, hover/focus summaries, detail drawer authority flags, blocked,
needs_review, PASS with follow-up visual states, absence of accepted-state
implication by default, keyboard navigation, readable warning states, and
Authority Lens caveat visibility.

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
- `git diff --check` passed.
- `git diff --cached --check` passed.

## Skipped Checks

- Browser/computer-use validation: skipped because no UI, route,
  browser-visible surface, clipboard automation, or browser/computer-use capture
  was added.
- Transcript dogfood: skipped because the closeout stop condition says not to
  keep running transcript dogfood just to reconfirm the same manual path.
- Proof/evidence/readiness record creation: skipped because this design-only PR
  explicitly does not create proof/evidence/readiness records.

## What Codex Did Not Do

Codex did not implement UI, routes, runtime behavior, DB writes,
provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard
automation, accepted Augnes state, proof/evidence/readiness records, approvals,
merges, deploys, or Core decisions.
