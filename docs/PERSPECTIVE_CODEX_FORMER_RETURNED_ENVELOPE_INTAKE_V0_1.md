# Codex Former Returned Envelope Intake v0.1

## Purpose

The returned-envelope intake path automates the manual paste + manual local validation part of the Codex Former operator flow.

It reads one bounded returned envelope file from `reports/intake/codex-former-returned-envelopes/`, loads that text into the existing operator-flow returned-envelope textarea, and runs the same local validation bridge used by the manual textarea flow.

This is not candidate acceptance and not memory persistence. The candidate draft creation remains user-controlled after PASS or PASS with follow-up validation.

## Routes

- List intake refs: `GET /api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake`
- Validate selected intake ref: `POST /api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake/validate`
- Operator surface: `/cockpit/perspective/codex-former/local-adapter-operator-flow`

## Boundary

The intake helper has a path safety boundary: `returned_envelope_ref` must be a normalized relative project ref under `reports/intake/codex-former-returned-envelopes/`.

It rejects absolute refs, traversal refs, non-normalized refs, symlinks, non-files, empty files, and oversized files. The current bound is 20,000 bytes.

The intake path creates no DB write, no memory write, no Core/runtime/provider/GitHub mutation, no local candidate draft, no perspective-memory review queue item, no local write proposal, no checklist record, no product persistence boundary record, no vector search, and no embeddings.

## UI

The “Codex Returned Envelope Intake” panel shows the latest available returned envelope ref, content hash, file size, modified timestamp, invalid-file blocked reasons, and a bounded status.

Controls:

- `Refresh intake list`
- `Load latest Codex return + validate`
- returned-envelope ref selection when more than one valid intake file exists
- `Load selected Codex return + validate`

Validation results render in the same Validate Result panel as manual validation: `validation_source`, `result_state`, `execution_result`, `failure_kind`, candidate count, warnings, pointer warnings, blocked reasons, `next_safe_action`, review-material compatibility, hashes, and authority flags.

## Verification

- `npm run smoke:perspective-codex-former-local-adapter-returned-envelope-intake`
- `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- `npm run browser:perspective-codex-former-local-adapter-operator-flow`
