# Perspective Codex Former Source Input Hardening

Conclusion: PASS with follow-up.

## Summary

This PR hardens the parameterized Codex Former capture helper source-input path.
Prepare mode keeps the default proven prep builder, keeps the `--source-input`
path from PR #495, and now has focused smoke coverage for malformed,
incomplete, and unsafe bounded source input.

The helper remains local CLI/docs/report/smoke work. It reduces operator
provenance mistakes, but the output remains review-only and non-committed.

## Why Follows PR #495

PR #495 made prepare mode accept a bounded local source input file and hardened
validate extraction for prose-wrapped single candidates and multiple-candidate
blocking. This follow-up strengthens the source-input boundary before any UI or
product surface work.

## What Changed

- Replaced broad substring unsafe-marker checks with deterministic exact,
  prefix, phrase, and token-boundary matching.
- Added smoke rejection coverage for missing files, invalid JSON, non-object
  JSON, missing required anchors, empty changed files, absent verification
  material, invalid check status, missing check fields, missing skipped-check
  reasons, missing unresolved-gap summaries, and obvious unsafe marker input.
- Added an operator-readable source input template at
  `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md`.
- Documented and tested `--generated-at` override behavior and source input
  hash semantics.

## Source-Input Rejection Hardening

Parameterized prepare mode now blocks clear malformed input before building a
Formation Input Bundle. The smoke covers representative failures and asserts
clear error text rather than relying on documentation alone.

The successful fixture still exercises benign bounded wording, including words
that previously risked substring false positives.

## Unsafe Marker Precision

The helper still blocks obvious credential, raw source/review/browser,
provider-side, account/private, and non-visible reasoning markers. It now uses
more precise matching so ordinary bounded words and browser-skip statements do
not block.

No large dependency was added. The implementation is a small local helper in
the CLI wrapper.

## Source Input Template

The new template describes purpose, required fields, optional pointer/ref
fields, a sanitized JSON example, generated timestamp behavior, output metadata,
the exactly-one-candidate return invariant, and the review-only authority
boundary.

The template avoids raw private/provider/source examples. Operators should use
bounded summaries and pointer refs only.

## generated_at / Source Hash Behavior

When `--generated-at` is supplied, helper metadata and the generated Formation
Input Bundle path use that timestamp. This makes the generated former input
packet deterministic for the operator run.

`source_input_hash` remains the deterministic hash of the source input file as
supplied on disk. It is not a hash of the post-override builder input.

## Authority Boundary

This PR does not create accepted Augnes state. It does not create proof,
evidence, or readiness records. It does not write DB state, add runtime routes,
add UI, add clipboard automation, call provider/model APIs, call the Codex SDK,
execute Codex from Augnes, mutate GitHub from implementation behavior, approve,
merge, publish, deploy, or make Core decisions.

## Privacy/Redaction Handling

Source input must remain bounded local JSON. Public docs and reports use
sanitized descriptions instead of echoing raw unsafe marker literals. The smoke
continues to check public artifacts for raw marker leakage.

## Pointer Warning / needs_review Caveat

The PR #492 and PR #494 caveat remains: pointer warnings and `needs_review`
basis quality are review work, not product readiness. Validation can still
return candidate-compatible material as non-committed review material while
surfacing pointer warnings.

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
- `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture-helper-default --generated-at 2026-06-10T00:00:00.000Z`
  passed.
- `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture-helper-source-hardening --source-input /tmp/augnes-codex-former-capture-helper-smoke-parameterized/bounded-source-input.json --generated-at 2026-06-10T00:00:00.000Z`
  passed.
- `npm run perspective:codex-former:validate-capture -- --envelope /tmp/augnes-codex-former-capture-helper-smoke-parameterized/returned-envelope.txt --metadata /tmp/augnes-codex-former-capture-helper-source-hardening/codex-former-capture-metadata.json --summary-out /tmp/augnes-codex-former-capture-helper-source-hardening/validation-summary.json`
  passed with `PASS with follow-up`.
- `git diff --check` passed.
- `git diff --cached --check` passed.

## Skipped Checks With Reasons

Browser/computer-use validation not run: no UI, route, browser-visible surface,
clipboard automation, or browser/computer-use capture was added.

No transcript dogfood was run: this PR hardens the local helper source-input
path and validation smoke coverage; it does not need another transcript capture.

## Remaining Caveats

- The helper prepares and validates review material only.
- Operators still need to review pointer warnings before downstream use.
- The source-input schema is intentionally narrow; richer arbitrary bounded-work
  capture can be added later if the local Formation Input Bundle contract grows.
