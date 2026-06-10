# Perspective Codex Former Capture Helper Parameterized Input

Conclusion: PASS with follow-up

## Summary

This PR extends the local Codex Former capture helper from PR #494 so prepare
mode can build a fresh Manual Codex Former Draft Copy Packet from a bounded
local source input JSON file. The existing default proven prep path remains
available for backward compatibility.

Validate mode is also hardened with smoke coverage for prose-wrapped returned
responses that contain exactly one candidate JSON object, plus a blocking case
for returned responses with multiple candidate objects.

## Why Follows PR #494

PR #494 reduced operator provenance and copy mistakes for the already-proven
separate-session capture path. Its remaining caveat was that prepare mode still
used the existing packet-prep builder directly. This PR keeps that default path
but adds a bounded source-input adapter so operators can prepare packets from
fresh local work material without widening authority.

## What Changed

- Added `--source-input <path>` to
  `npm run perspective:codex-former:capture-packet`.
- Added deterministic source input hashing to prepare metadata.
- Preserved all existing PR #494 metadata fields.
- Kept the existing prepare and validate package scripts unchanged.
- Extended helper smoke coverage for parameterized prepare and extractor
  behavior.
- Updated the manual workflow doc with default and parameterized helper usage.

## Parameterized Source Input Behavior

When `--source-input` is omitted, metadata records
`capture_source_kind: separate_session_capture_packet_prep_builder` and does not
invent a source input hash.

When `--source-input` is supplied, the file must be local JSON with bounded
Formation Input Bundle material: scope, work id or PR refs, changed files,
bounded summary, check or skipped-check material, and optional gap or pointer
refs. The helper records:

- `capture_source_kind: bounded_source_input_file`
- `source_input_path`
- `source_input_hash`
- source input scope
- source input work id
- generated former input packet
- manual copy packet id
- former input packet id
- prompt hash

The helper blocks when the file is missing, not JSON, not object-shaped, lacks
the minimum bounded work material, or contains unsafe private/provider/source
material markers.

## Validate Extraction Hardening

Validate mode still accepts a returned JSON object directly. It now also has
smoke coverage for bounded prose that contains exactly one balanced
CodexPerspectiveCandidateDraft JSON object.

Returned responses with multiple candidate objects block with
`BLOCKED with useful findings`. Schema alignment remains a safety-net comparison
and is not counted as direct success.

## Authority Boundary

This PR is pure local CLI/docs/report/smoke/package work. It creates no accepted
Augnes state, proof/evidence/readiness record, DB write, runtime route, UI,
clipboard automation, provider/model call, Codex SDK call, GitHub mutation,
approval, merge, deployment, or Core decision.

## Privacy/Redaction Handling

Source input must be bounded local JSON. Prepare mode rejects source inputs that
contain unsafe private/provider/source or credential-like material markers.
Validate mode continues to rely on the existing local contract-fit and direct
validation paths for returned material.

Public docs and reports summarize unsafe marker handling without echoing raw
marker literals.

## Pointer Warning / Needs Review Caveat

Pointer warnings remain review work, not failure by default and not product
readiness. The smoke fixture preserves an unknown pointer warning and confirms
candidate-compatible material remains `non_committed` when direct validation
returns it.

Basis quality may remain `needs_review`.

## Verification

Verification run:

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-codex-former-manual-workflow-docs`
- PASS: `npm run smoke:perspective-codex-former-manual-copy-packet`
- PASS: `npm run smoke:perspective-codex-former-separate-session-capture-packet-prep`
- PASS: `npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture`
- PASS: `npm run smoke:perspective-codex-former-capture-helper`
- PASS: `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture-helper-default --generated-at 2026-06-10T00:00:00.000Z`
- PASS: `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture-helper-parameterized --source-input /tmp/augnes-codex-former-capture-helper-smoke-parameterized/bounded-source-input.json --generated-at 2026-06-10T00:00:00.000Z`
- PASS: `npm run perspective:codex-former:validate-capture -- --envelope /tmp/augnes-codex-former-capture-helper-smoke-parameterized/returned-envelope.txt --metadata /tmp/augnes-codex-former-capture-helper-parameterized/codex-former-capture-metadata.json --summary-out /tmp/augnes-codex-former-capture-helper-parameterized/validation-summary.json`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

The validate helper fixture concluded `PASS with follow-up`: the prose-wrapped
single-candidate response extracted exactly one candidate, provenance matched,
direct validation returned non-committed candidate-compatible material, and
unknown pointer warnings remained visible.

## Skipped Checks With Reasons

- Browser/computer-use validation: not run because this PR adds no UI, route,
  browser-visible surface, clipboard automation, or browser/computer-use capture.
- Transcript dogfood: not run because this PR parameterizes the local helper and
  hardens extraction smoke coverage; it does not need a new separate-session
  transcript.
- DB validation: not run because this PR adds no DB schema, persistence path, or
  state writer.

## Remaining Caveats

- This remains a bounded local review helper, not generic automatic acceptance.
- Source input JSON still needs operator judgment; bad source selection can
  produce `needs_review` or blocked material.
- Pointer warnings and basis quality warnings remain visible review work.
- Human/Core decisions remain outside the helper.
