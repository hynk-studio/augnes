# Perspective Codex Former Workflow Closeout

Conclusion: PASS with follow-up.

## Summary

This report closes out the current Codex Former manual capture workflow slice.
The workflow is operationally documented, helper-supported, and bounded to
local manual review material.

This PR does not add another transcript dogfood run, helper behavior change, or
UI/product surface.

## Why Follows PR #496

PR #496 hardened the parameterized source-input path, rejection behavior,
unsafe-marker precision, timestamp/hash semantics, and source input template.
After that hardening, the useful next step is an operator handoff that defines
what is done, what remains caveated, when dogfood should stop, and what must be
true before product-surface work begins.

## Closeout Scope

The closeout adds:

- `docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md`
- `scripts/smoke-perspective-codex-former-workflow-closeout.mjs`
- `smoke:perspective-codex-former-workflow-closeout`

It keeps the work to docs/report/smoke/package boundaries.

## Current Operator Workflow

The operator path is:

- start with bounded work material;
- use the source input template for fresh bounded source input;
- run the prepare helper;
- paste only the copyable prompt into a separate user-started Codex session;
- return a capture envelope with exactly one candidate draft JSON object;
- run the validate helper with envelope and metadata;
- treat candidate-compatible material as review-only when direct validation
  permits it;
- keep Worker-Facing Guidance advisory-only.

## Completed PR Chain

- PR #492 confirmed the separate-session provenance-clean capture path with
  `PASS with follow-up`.
- PR #493 added manual workflow docs.
- PR #494 added the operator-facing prepare/validate helper.
- PR #495 added source-input prepare and validate extraction hardening.
- PR #496 hardened source-input validation and added the source input template.

## Stop Condition For Further Dogfood

Further transcript dogfood should not be run just to reconfirm the same manual
path. It is useful only when the prompt contract, candidate schema, validation
behavior, source input packet shape, Worker-Facing Guidance contract,
provider/Codex surface behavior, or product capture/pasteback behavior changes.

Otherwise, issues should be tracked through helper/source-input validation.

## Product-Surface Entry Criteria

Product-surface work should wait until the CLI/helper path is stable on `main`,
the source input template and smokes exist, validate mode enforces exactly one
candidate, provenance mismatches block, unsafe source-input markers block,
pointer warnings remain visible, authority boundaries are represented, and a
browser/computer-use validation plan exists for any UI.

Any future UI must not imply accepted state, proof/evidence/readiness creation,
approval, merge, deploy, provider/model calls, Codex SDK calls, or Core
decisions.

## Authority Boundary

This closeout does not create accepted Augnes state, proof records, evidence
records, readiness records, provider/model calls, Codex SDK calls, GitHub
mutations, DB writes, UI, approvals, merges, deploys, or Core decisions.

## Privacy/Redaction Handling

The closeout uses sanitized descriptions for unsafe/private material and does
not include raw private/source/provider payload examples in public docs or
reports.

## Pointer Warning / needs_review Caveat

Pointer warnings remain review work. Basis quality may remain `needs_review`.
Candidate-compatible material remains `non_committed` unless existing local
validation explicitly says otherwise.

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
- `git diff --check` passed.
- `git diff --cached --check` passed.

## Skipped Checks With Reasons

Browser/computer-use validation not run: no UI, route, browser-visible surface,
clipboard automation, or browser/computer-use capture was added.

No transcript dogfood was run: this closeout documents the completed manual
workflow and stop condition; it does not need another transcript capture.

## What Codex Did Not Do

Codex did not merge, approve, publish, deploy, retry, replay, add UI, add
routes, write DB state, create proof/evidence/readiness records, call
provider/model APIs, call the Codex SDK, mutate GitHub from implementation, or
make Core decisions.
