# Perspective Codex Former Constellation Fixture Preview

Conclusion: PASS with follow-up.

## Summary

This report records deterministic Codex Former constellation projection fixture preview artifacts for future Constellation Preview work. The fixture preview is read-only, uses sanitized local fixture inputs, and writes review-only projection JSON artifacts.

## Why Follows PR #499

PR #499 defined the read-only Codex Former constellation projection contract and recommended the next PR: Add Codex Former constellation projection fixture preview. This slice exercises that projection contract with committed PASS with follow-up and BLOCKED fixtures without changing the projection builder.

## Fixture Preview Scope

The fixture preview is data-level material, not a visual UI. It shows which nodes and edges appear, which compact badges future UI would see, which authority boundaries are present, how PASS with follow-up differs from BLOCKED, and which detail-drawer fields future UI should expose.

Generated artifacts:

- reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json
- reports/fixtures/2026-06-10-codex-former-constellation-blocked.json

## PASS with follow-up Fixture Summary

- overall_status: pass_with_follow_up
- nodes: 11 (candidate_draft, codex_session, manual_copy_packet, next_action, review_candidate, source_input, validation_summary, warning, work, worker_guidance)
- edges: 10 (informs, pasted_by_human, pointer_only, prepared, returned, suggests, validated)
- review_candidate node: true
- worker_guidance node: true
- next_action node: true
- warning node: true
- candidate authority: non_committed
- review_only: true

## BLOCKED Fixture Summary

- overall_status: blocked
- nodes: 9 (candidate_draft, codex_session, manual_copy_packet, source_input, validation_summary, warning, work)
- edges: 8 (blocked_by, informs, pasted_by_human, prepared, returned, validated)
- validation_summary node: true
- warning node: true
- blocked_by edge: true
- review_candidate node: false
- worker_guidance node: false
- next_action node: false

## Node/Edge Readability Notes

The PASS with follow-up fixture stays small enough for a first graph preview while still showing the full path from source input through review candidate, worker guidance, and next action. The BLOCKED fixture keeps the graph shorter by stopping at validation summary and blocking warnings, so future UI can compare usable review-only material against blocked material without implying acceptance.

Every node uses at most two primary badges. Edges reference explicit node ids and use only the PR #499 relation taxonomy. Detail refs carry bounded summaries, changed-file references, hashes, and provenance pointers intended for a future detail drawer rather than default graph labels.

## Authority Boundary

This fixture preview is read-only review data. It does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, UI, approvals, merges, deploys, or Core decisions.

The projection artifacts are review-only preview data. The fixture preview is not accepted-state automation.

## Privacy/Redaction Handling

The fixtures use bounded summaries only and contain no raw private/source/provider payload examples. The generated projection privacy fields keep raw_payloads_included false and bounded_summaries_only true.

## Verification

The generator writes deterministic projection JSON from the PR #499 builder. The paired smoke verifies package scripts, artifact existence, projection version and kind, fixture graph readability, authority flags, privacy/redaction boundaries, and changed-file scope.

## Skipped Checks With Reasons

- Browser/computer-use validation: No browser/computer-use validation was run because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.
- Runtime UI validation: Not applicable because no UI, route, browser-visible surface, clipboard automation, or interactive product surface was added.
- Provider/model, Codex SDK, DB, and GitHub mutation checks: Not applicable because this PR adds no such integration behavior.

## Recommended Next PR

Add read-only Codex Former constellation preview data adapter

## What Codex Did Not Do

Codex did not implement UI, routes, runtime browser surfaces, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.
