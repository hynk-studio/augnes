# Perspective Handoff Packet Structure Review v0.1

Status: structure/readability review for the existing Perspective handoff packet.

This slice lightly improves the selected Perspective handoff packet so human and AI readers can reuse it more reliably. It is not an authority, safety, permission, policy, or execution expansion.

## Purpose

The packet should make the selected Perspective material easy to scan, copy, review, and hand to another reader without turning the UI into boundary boilerplate.

The structure should help ChatGPT, Codex, and future AI agents understand:

- what the selected Perspective material is
- what source or evidence pointers support it
- what unresolved tensions remain
- what next actions are advisory candidates
- what the user expects the next worker to do
- what remains user-reviewed

## Packet Structure

Scoped packets use stable, human-readable section headers:

1. Purpose
2. Selected Perspective Material
3. Evidence
4. Unresolved Tensions
5. Next Action Candidates
6. Suggested Use
7. Compact Authority
8. Base Packet Text

Evidence, tensions, and next actions remain separate. Evidence pointers stay pointer-only and do not become claim bodies. Tensions are not smoothed into the selected summary. Next actions remain advisory and do not imply execution.

Fallback text remains explicit when the selected scope has no matching material:

- No scoped evidence pointers
- No scoped unresolved tensions
- No scoped next action candidates

## Target Purposes

ChatGPT review and Codex handoff purposes remain distinct.

The ChatGPT review packet is for review, interpretation, critique, refinement, and next prompt construction. It should not read like a coding task by default.

The Codex handoff packet is implementation context only when the user separately sends it to Codex as part of a user-reviewed task. It should help shape a PR-centered workflow without creating execution authority by itself.

## Compact Authority

Compact Authority should be short and appear once near the end of the scoped wrapper.

The purpose of this line is to prevent a human or AI reader from mistaking a read-only/advisory packet for an executing, writing, billable, or externally mutating surface. It should not become repeated boundary copy under every section.

## UI Boundary

The packet remains behind the existing Preview Handoff Packet details disclosure. No new visible UI clutter is added. This slice adds no new always-visible packet panel, no new boundary panel, and no Observatory first-viewport clutter.

## Content Boundary

No hidden JSON dumps or raw/private/generated content are added.

The packet must not expose:

- raw graph JSON
- raw source text
- raw pasted text
- private history
- prompt or model output dumps
- provider, token, API key, or billing metadata
- FormationReceipt serialization

No API/DB/provider/GitHub/Codex/Rulecraft/snapshot/delta behavior is added. This slice adds no API route, DB schema, migration, persistence, graph DB, proof/evidence/readiness write, Codex execution, GitHub mutation, provider/model/API call, API billing path, Auto Proposal generation, Rulecraft exposure, historical snapshot persistence, or delta engine.

## Validation

Required checks:

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-capsule-contract`
- `npm run smoke:cockpit-perspective-ia`
- `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- `npm run smoke:cockpit-perspective-observatory-layout`
- `npm run smoke:cockpit-perspective-event-rail-entry-cards`
- `npm run smoke:cockpit-perspective-formation-switch-overlay`
- `npm run smoke:cockpit-perspective-scope-handler-cleanup`
- `npm run smoke:cockpit-perspective-overlay-focus-agent-semantics`
- `npm run smoke:perspective-handoff-packet-structure-review`
- `git diff --check`

Browser validation should use a temp SQLite DB and check that Perspective opens by default, Observatory remains clean, the packet remains details-gated, ChatGPT/Codex target switching works, stable section order is visible, Evidence/Tensions/Next remain separate, Compact Authority appears once near the end, console output is clean, traffic stays local-only, and a 390px mobile viewport has no horizontal page overflow.
