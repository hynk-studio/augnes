# Perspective Codex Former Constellation Preview Data Adapter

Conclusion: PASS with follow-up.

## Summary

This report records the read-only Codex Former constellation preview data adapter and deterministic adapted fixture artifacts. The adapter transforms PR #500 projection fixture JSON into a future UI read model without rendering UI.

## Why Follows PR #500

PR #500 added deterministic PASS with follow-up and BLOCKED projection fixture previews and recommended the next PR: Add read-only Codex Former constellation preview data adapter. This PR follows that recommendation by adapting the committed projection fixtures into compact display data, warning panels, Authority Lens data, detail drawers, and legends.

## Adapter Scope

The adapter is data-only. It accepts an existing projection object, copies it, derives preview data, and returns a new object. It does not mutate the projection, write state, render UI, add a route, or create accepted Augnes state.

## Preview Data Shape

The preview data includes:

- source projection summary
- display policy
- graph nodes and edges
- summary panel
- warning panel
- Authority Lens
- detail drawers
- legend
- privacy and authority flags

## PASS with follow-up Adapted Fixture

- fixture: reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json
- overall_status: pass_with_follow_up
- graph nodes: 11
- graph edges: 10
- review_candidate display node: true
- worker_guidance display node: true
- next_action display node: true
- pointer warning pressure: true
- is_review_only: true
- is_accepted_state: false

## BLOCKED Adapted Fixture

- fixture: reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json
- overall_status: blocked
- graph nodes: 9
- graph edges: 8
- validation_summary display node: true
- review_candidate display node: false
- worker_guidance display node: false
- next_action display node: false
- blocking warnings: true

## Warning Grouping

The adapter keeps graph nodes one-to-one with projection nodes while grouping warning pressure in the warning panel. PASS with follow-up groups pointer warning pressure without making the graph blocked. BLOCKED groups blocking reasons separately from review warnings so future UI can show the block compactly.

## Authority Lens

Authority Lens data is separate from default graph labels. It includes compact tags such as review_only, non_committed, pointer_only, blocked, provenance_mismatch, no_accepted_state, no_db_write, no_provider_call, no_codex_sdk_call, no_github_mutation, and no_core_decision.

## Detail Drawer Payloads

Detail drawers are generated for summary, warning panel, Authority Lens, every display node, and every display edge. Rows expose bounded provenance refs, detail refs, source hashes, candidate count, metadata match, warning summaries, blocked reasons, validation status, privacy status, and false authority flags.

## Privacy/Redaction Handling

The adapted fixtures preserve raw_payloads_included false and bounded_summaries_only true. The adapter uses bounded strings and does not include raw private/source/provider payload examples.

## Authority Boundary

This preview data adapter is read-only. It transforms existing projection JSON into a future UI read model and does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, UI, approvals, merges, deploys, or Core decisions.

## Verification

The dogfood script writes deterministic adapted preview-data JSON from the PR #500 projection fixtures. The smoke verifies package scripts, adapter exports, fixture determinism, graph shape, display nodes and edges, warning grouping, Authority Lens tags, detail drawers, privacy, authority flags, changed-file scope, and absence of forbidden implementation surfaces.

## Skipped Checks With Reasons

- Browser/computer-use validation: No browser/computer-use validation was run because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.
- Runtime UI validation: Not applicable because no UI, route, browser-visible surface, clipboard automation, or interactive product surface was added.
- Provider/model, Codex SDK, DB, and GitHub mutation checks: Not applicable because this PR adds no such integration behavior.

## Recommended Next PR

Add read-only Constellation Preview fixture surface design

## What Codex Did Not Do

Codex did not implement UI, routes, runtime browser surfaces, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.
