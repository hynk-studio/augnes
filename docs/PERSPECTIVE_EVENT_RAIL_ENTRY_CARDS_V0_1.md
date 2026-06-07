# Perspective Event Rail Entry Cards v0.1

This is a temporal entry card polish slice for the Perspective Observatory Event Rail. It clarifies the selected Event Rail card after the main observatory layout restoration from PR #436, without adding new storage, execution, provider, or mutation authority.

## Event Rail Roles

- Past = Archive/reference. Past entries include Session, Decision, Handoff, PR, Review, and Closeout context.
- Present = Active local preview. The Current View entry reflects the active local PerspectiveUnitPreview / FormationReceiptV0 context.
- Future = Advisory candidate. The Next Perspective entry shows candidate next-context only.

## Archive Cards

Archive cards can:

- Keep session, decision, handoff, PR, review, and closeout refs visible.
- Explain why past material matters to the current Perspective view.
- Support local inspection as reference material only.

Archive cards cannot:

- Store a frozen historical snapshot.
- Compare archive material to Current View with a delta engine.
- Write proof, evidence, readiness, graph DB, or persistence records.

## Current View Card

Current View card can:

- Show the active local PerspectiveUnitPreview / FormationReceiptV0 context.
- Keep current graph refs visible for local inspection.
- Reflect the selected Formation Basis without persisting a snapshot.

Current View card cannot:

- Persist the view as a frozen historical snapshot.
- Compute a delta against archive entries.
- Call providers, GitHub, Codex, APIs, or mutate runtime state.

## Future Candidate Card

Future Candidate card can:

- Show possible next Perspective context.
- Name candidate source refs and blockers.
- Keep next actions inspectable without granting execution authority.

Future Candidate card cannot:

- Execute Codex, call GitHub, or create PRs.
- Call providers, models, APIs, or trigger API billing.
- Generate Auto Proposal output or mutate Augnes state.

## Authority Boundaries

- No frozen snapshot persistence.
- No delta view.
- No provider/model/API billing.
- No GitHub mutation.
- No Codex execution.
- No Rulecraft exposure.
- No new API routes.
- No DB schema changes.
- No graph DB writes.
- No proof/evidence/readiness writes.
- No Auto Proposal implementation.

The Event Rail remains local-only, read-only, preview-only, and informational. Related refs are shown for inspection, not as persistence, provenance certification, or execution authority.

## Validation

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-capsule-contract`
- `npm run smoke:cockpit-perspective-ia`
- `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- `npm run smoke:cockpit-perspective-observatory-layout`
- `npm run smoke:cockpit-perspective-event-rail-entry-cards`
- `git diff --check`
