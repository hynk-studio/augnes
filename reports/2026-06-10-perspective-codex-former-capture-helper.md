# Perspective Codex Former Capture Helper

Conclusion: PASS with follow-up

## Summary

This PR adds a local operator-facing CLI wrapper for the manual Codex Former
capture workflow from PR #493. The helper prepares a copyable prompt, a capture
return envelope template, and machine-readable metadata, then validates a
returned envelope against that metadata and the same former input packet.

The prior recommended next implementation PR title from PR #493 was:
`Add operator-facing capture helper or CLI wrapper`. This PR implements that
local helper slice.

## Why Follows PR #493

PR #493 promoted the proven separate-session capture path into manual workflow
docs. The next unfinished step was reducing operator mistakes around ids, prompt
hashes, envelope shape, and local validation order. This helper keeps the same
manual workflow and authority boundary, but makes the repeatable local steps
easier to run.

## What The Helper Does

- `npm run perspective:codex-former:capture-packet` generates the existing
  Manual Codex Former Draft Copy Packet through the established local prep
  builder.
- Prepare mode writes the copyable prompt file, capture return envelope template
  file, and metadata file.
- Prepare mode prints `source_manual_copy_packet_id`,
  `source_former_input_packet_id`, `source_prompt_hash`, and output file paths.
- Prepare mode fails if the stable prompt contract label is absent, stale
  PR #479 wording appears, or generated provenance is missing.
- `npm run perspective:codex-former:validate-capture` reads a returned envelope
  plus generated metadata, verifies provenance, extracts exactly one returned
  candidate draft object, runs contract-fit, runs direct validation, runs schema
  alignment only as a safety-net comparison, and runs Worker-Facing Guidance
  only after direct validation returns candidate-compatible material.

## What The Helper Still Does Not Do

The helper does not paste into Codex, capture a transcript, execute Codex from
Augnes, call the Codex SDK, call provider/model APIs, use implementation network
behavior, write DB state, add runtime routes, add UI, use clipboard automation,
create proof/evidence/readiness records, approve, merge, publish, deploy, or
make Core decisions.

It also does not turn returned material into accepted Augnes state. Returned
candidate-compatible material remains review-only and non-committed.

## Pointer Warning Caveat

PR #492 proved that pointer warnings can coexist with candidate-compatible
review material. This helper preserves that caveat. Validate mode reports
pointer warnings, including unknown pointer refs, and uses `PASS with follow-up`
when candidate-compatible material exists but review work remains.

Only retained, known pointer refs should be treated as usable evidence pointers.
Basis quality may remain `needs_review`.

## Authority Boundary

This PR is pure local CLI/docs/report/smoke/package work. It creates no accepted
state and grants no approval, merge, publication, retry, replay, deployment, or
Core decision authority.

## Privacy/Redaction Handling

Prepare mode uses the existing bounded packet builder. Validate mode accepts
only a bounded returned envelope and candidate draft object. Public docs and
reports summarize omitted unsafe/private marker names instead of echoing raw
marker literals.

If returned candidate material includes unsafe private, source, provider, or
credential-like material, existing local validators block candidate-compatible
material and the helper reports `BLOCKED with useful findings`.

## Verification

Verification run:

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-codex-former-manual-workflow-docs`
- PASS: `npm run smoke:perspective-codex-former-manual-copy-packet`
- PASS: `npm run smoke:perspective-codex-former-separate-session-capture-packet-prep`
- PASS: `npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture`
- PASS: `npm run smoke:perspective-codex-former-capture-helper`
- PASS: `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture-helper-pr --generated-at 2026-06-10T00:00:00.000Z`
- PASS: `npm run perspective:codex-former:validate-capture -- --envelope /tmp/augnes-codex-former-capture-helper-smoke/returned-envelope.txt --metadata /tmp/augnes-codex-former-capture-helper-smoke/codex-former-capture-metadata.json --summary-out /tmp/augnes-codex-former-capture-helper-pr/validation-summary.json`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

The validate helper fixture concluded `PASS with follow-up`: provenance matched,
direct validation returned non-committed candidate-compatible material, pointer
warnings were surfaced, and schema alignment remained a safety-net result rather
than the direct success path.

## Skipped Checks With Reasons

- Browser/computer-use validation: not run because this PR adds no UI, route,
  browser-visible surface, clipboard automation, or browser/computer-use capture.
- Transcript dogfood: not run just to create a new transcript because this PR is
  a local helper for the already-merged manual workflow docs, not a new capture
  dogfood.
- DB validation: not run because this PR adds no DB schema, persistence path, or
  state writer.

## Remaining Caveats

- A returned envelope can still produce `BLOCKED with useful findings` if
  provenance is missing, ids/hash mismatch, direct validation blocks, authority
  flags are not false, or unsafe material survives.
- Pointer warnings and `needs_review` basis quality remain review work, not
  product readiness.
- Human/Core decisions remain outside the returned draft and outside the helper.
