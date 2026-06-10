# Perspective Codex Former Separate-Session Provenance-Clean Capture v0.1

## Purpose

This slice follows PR #491 by using the supplied real separate-session transcript
envelope to complete the provenance-clean Codex former capture dogfood.

PR #491 prepared the copyable prompt and return envelope, then merged after
recording that the transcript was not yet available. This slice keeps that
prepared packet metadata immutable and validates the supplied return envelope
against it.

Expected conclusion: `PASS with follow-up`.

Reason: provenance is complete and direct validation produces non-committed
candidate-compatible review material, while the returned draft still carries
needs-review basis quality and concrete pointer warnings.

## Provenance Inputs

The supplied envelope must match the PR #491 packet metadata:

- `capture_method: human_manual`
- `codex_surface_label: separate user-started Codex session`
- `source_manual_copy_packet_id: manual-codex-former-copy:v0.1:okr3cu`
- `source_former_input_packet_id: codex-perspective-former-input:v0.1:project-augnes-ag-separate-session-provenance-cl:3elrni`
- `source_prompt_hash: 3jveop`

The dogfood rejects missing provenance, mismatched ids, `not_supplied_in_chat`
values, fabricated metadata, or same-session fallback labeling.

## Validation Coverage

Run:

```sh
npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture
npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture
```

The dogfood scenarios are:

- `separate_session_transcript_provenance`
- `generated_packet_match`
- `contract_fit_and_validation`
- `drift_regression`
- `alignment_safety_net`
- `downstream_guidance`
- `unsafe_authority_regression`

Direct validation must run before alignment. Alignment may be reported as a
separate safety net, but it is not counted as direct success.

## Privacy Handling

The supplied envelope reported omitted unsafe/private marker names. Public
artifacts preserve the semantic fact that unsafe/private material was omitted,
but they use a sanitized marker-count summary instead of echoing the raw marker
names.

## Authority Boundary

This PR is a pure local separate-session transcript dogfood/docs/report/smoke
slice. It does not call Codex from implementation, execute Codex from Augnes,
call the Codex SDK, call OpenAI/provider/model APIs from implementation, call
GitHub APIs from implementation behavior, use implementation network behavior,
write DB state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Recommended Next Implementation PR Title

`Promote provenance-clean Codex former capture path to manual workflow docs`

If validation becomes blocked in a future edit, use:

`Refine separate-session capture packet pointers or privacy redaction from blocked findings`
