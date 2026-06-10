# Perspective Codex Former Workflow Closeout v0.1

## Purpose

This closes the current Codex Former manual capture workflow slice. The workflow
is local, manual, and review-only: it helps an operator prepare bounded material,
capture a separate-session Codex Former response, and validate the returned
candidate before any downstream review use.

This workflow does not create accepted Augnes state, proof records, evidence
records, readiness records, provider/model calls, Codex SDK calls, GitHub
mutations, DB writes, UI, approvals, merges, deploys, or Core decisions.

## Completed PR Chain

- PR #492: confirmed the separate-session provenance-clean capture path with
  `PASS with follow-up`.
- PR #493: promoted the proven path into manual workflow docs.
- PR #494: added the local operator-facing prepare/validate helper.
- PR #495: added parameterized source-input prepare mode and hardened validate
  extraction for prose-wrapped single-candidate returns plus multiple-candidate
  blocking.
- PR #496: hardened source-input validation, unsafe marker precision,
  generated timestamp/hash semantics, and added the source input template.

Historical setup came from PR #489 through PR #491: provenance envelope cleanup,
same-session fallback comparison, and separate-session packet prep.

## Current Operator Workflow

Start with bounded work material. When preparing fresh bounded material, use
`docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md` to create
a local source input JSON file.

Run the prepare helper:

npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture --source-input /tmp/augnes-codex-former-capture/bounded-source-input.json --generated-at 2026-06-10T00:00:00.000Z

The human operator pastes only the copyable prompt into a separate user-started
Codex session. The human returns a capture envelope containing exactly one
CodexPerspectiveCandidateDraft JSON object.

Run the validate helper with the returned envelope and metadata:

npm run perspective:codex-former:validate-capture -- --envelope /tmp/augnes-codex-former-capture/returned-envelope.txt --metadata /tmp/augnes-codex-former-capture/codex-former-capture-metadata.json --summary-out /tmp/augnes-codex-former-capture/validation-summary.json

Treat the result as review-only candidate-compatible material only when direct
validation permits it. Worker-Facing Guidance remains advisory-only.

## Current Artifacts

Canonical workflow docs and scripts:

- `docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md`
- `scripts/perspective-codex-former-capture-helper.mjs`
- `scripts/smoke-perspective-codex-former-capture-helper.mjs`

Canonical reports for this workflow slice:

- `reports/2026-06-10-perspective-codex-former-manual-workflow-docs.md`
- `reports/2026-06-10-perspective-codex-former-capture-helper.md`
- `reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md`
- `reports/2026-06-10-perspective-codex-former-source-input-hardening.md`

## Known Caveats

- Pointer warnings may remain and must be reviewed.
- Basis quality may remain `needs_review`.
- Candidate material remains `non_committed` unless existing local validation
  explicitly says otherwise.
- Source input is bounded local JSON and still requires operator judgment.
- The workflow does not automatically accept, persist, prove, evidence, or
  decide anything.
- No provider/model or Codex SDK integration exists.
- No product UI exists yet.
- No browser/computer-use validation is needed for this closeout unless UI or
  routes are added.

## Stop Condition For Further Dogfood

Do not keep running more transcript dogfood just to reconfirm the same manual
path.

Further transcript dogfood is useful only if one of these changes:

- prompt contract;
- candidate draft schema;
- validation or normalization behavior;
- source input packet shape;
- Worker-Facing Guidance contract;
- provider/Codex surface behavior;
- product surface capture or pasteback behavior.

Otherwise, operator/helper issues should be tracked through source-input and
helper validation, not repeated transcript collection.

## Product-Surface Entry Criteria

Before building UI or product surface, all of these must be true:

- the CLI/helper path is stable on `main`;
- the source input template exists and has smoke coverage;
- validate helper handles the exactly-one-candidate invariant;
- missing or mismatched provenance blocks;
- unsafe source-input markers block;
- pointer warnings remain visible;
- authority boundary is represented in output;
- browser/computer-use validation plan exists for any UI;
- UI must not imply accepted state, proof/evidence/readiness creation,
  approval, merge, deploy, provider/model calls, Codex SDK calls, or Core
  decisions.

## Recommended Next Work

Recommended next PR title:
`Start product-surface design for Codex Former capture review`.

Alternative:
`Add a read-only Cockpit design packet for Codex Former capture review`.

The next PR should be design-only unless the user explicitly asks to implement
UI.

## Authority And Privacy Boundary

This closeout preserves the local-only review boundary. The workflow does not
capture private/source/provider payloads in public artifacts, does not paste
from Augnes into Codex, does not automate clipboard behavior, and does not
perform network/provider/model/GitHub mutation behavior from implementation.

Public docs and reports should use sanitized descriptions for unsafe/private
material instead of echoing raw marker literals.

## Conclusion

Conclusion: `PASS with follow-up`.

Meaning:

- the local manual capture workflow is operationally documented and
  helper-supported;
- it is ready for operator handoff and product-surface design consideration;
- it is not accepted-state automation or product UI.
