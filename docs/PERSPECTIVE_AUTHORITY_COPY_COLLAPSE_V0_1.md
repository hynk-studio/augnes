# Perspective Authority Copy Collapse v0.1

## Status And Scope

This PR is UI copy and information architecture cleanup, not a new feature. It is PR 1: authority copy collapse for the default Perspective Observatory UI.

The safety and authority model remains unchanged. The existing local, read-only, advisory Perspective boundary is still sourced from the preview response metadata and FormationReceipt authority fields.

## What Changed

Visible boundary copy is consolidated into a compact authority capsule. The default UI now uses short summary labels such as safe preview, local read-only preview, advisory only, and details instead of repeating the same no-copy across the first viewport.

Full boundary details move behind a details disclosure. The disclosure keeps the structured boundary fields visible when expanded:

- local_only
- read_only
- external_calls
- persistence
- graph_db
- proof_evidence_readiness_writes
- codex_execution

The Current Perspective Starmap no longer repeats the old always-visible caption and chip set. The starmap points back to the compact authority capsule instead.

Formation Basis, Manual Gravity, and Event Rail keep their existing meanings, but repeated visible negative copy is compressed and detailed boundary language is details-gated.

## Preserved Authority

The Handoff packet Compact Authority principle is preserved. This PR does not heavily modify the legacy Boundary reminders inside Base Packet Text.

This PR adds no API route, DB schema, migration, persistence, graph DB behavior, provider/model/API call, GitHub mutation, Codex execution, or proof/evidence/readiness write.

Rulecraft remains unexposed in product-facing Cockpit UI.

## Explicitly Out Of Scope

Event Rail node-edge refactor is explicitly out of scope. The Event Rail remains a card/button surface in this PR.

Product node label humanization is explicitly out of scope. This PR does not rename Product concept labels, node labels, summaries, or product ontology text.

This PR does not add new functionality, runtime authority, API routes, DB persistence, graph DB behavior, provider/model calls, GitHub mutation, or Codex execution.

## Validation

Run:

```bash
npm run smoke:cockpit-perspective-authority-copy-collapse
```

The smoke checks that the compact authority capsule exists, the old repeated starmap caption was removed from the primary visible starmap block, the Handoff packet Compact Authority remains present, Rulecraft stays hidden, and no app/api, db, or migrations changes were introduced.
