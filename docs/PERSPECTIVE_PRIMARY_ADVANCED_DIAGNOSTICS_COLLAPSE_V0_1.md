# Perspective Primary Advanced Diagnostics Collapse v0.1

Status: primary/advanced information-architecture cleanup slice.

This slice restores the Perspective tab as an Observatory-first surface by moving the long secondary diagnostic wall behind one collapsed Advanced Diagnostics entry point. It reduces default Perspective scroll while keeping the existing diagnostic content available on demand.

## Purpose

The default Perspective view should show the human and agent-readable Observatory flow first:

- compact Perspective Observatory header
- Formation identity strip
- Observatory Controls
- Current Perspective Starmap
- Inspector
- Event Rail
- one compact collapsed Advanced Diagnostics entry

The default view should not immediately inline Frame, Ledger Basis, Evidence, Tensions, Boundary / Next, route preview, ingest graph, constellation preview, Formation / Archive details, research diagnostics, or long boundary explanations.

## Advanced Diagnostics

Advanced Diagnostics is a containment surface, not a new feature. It does not remove, rewrite, or expand diagnostics. It keeps secondary diagnostic sections discoverable after explicit user intent.

Contained groups:

- Formation / Archive
- Advanced Boundaries / Section Links
- Frame / Ledger
- Evidence / Tensions
- Boundary / Next
- Route Preview
- Ingest Graph
- Constellation Preview
- Research / Temporal Diagnostics

The body is conditionally rendered only when `advancedDiagnosticsOpen` is true. This keeps the default DOM, accessibility flow, and browser text extraction focused on the primary Observatory.

## AI And Agent Access

The collapsed entry uses stable semantic hooks:

- `data-augnes-region="advanced-diagnostics"`
- `data-augnes-diagnostics-state`
- `data-augnes-authority="read-only local-only preview-only"`
- `data-augnes-external-calls="false"`
- `data-augnes-persistence="false"`
- `data-augnes-codex-execution="false"`

When open, diagnostic groups use `data-augnes-diagnostics-group` categories so agents can find secondary sections without those sections becoming the default page flow.

## Boundaries

This slice adds no new authority or capability. It does not add a new API route, DB schema, migration, persistence path, graph DB, proof/evidence/readiness write, Codex execution, GitHub mutation, provider/model/API call, API billing path, Auto Proposal generation, Rulecraft exposure, historical snapshot persistence, delta engine, hidden raw JSON dump, raw graph/source/prompt/model/private payload, policy gate, or permission framework.

It intentionally avoids boundary text growth. Existing diagnostic/boundary material is placed behind user intent instead of multiplied.

## Preserved Behavior

- Handoff packet structure and copy flow remain unchanged.
- Formation Basis switch overlay behavior remains unchanged.
- Cached local acknowledgement behavior remains unchanged.
- Event Rail behavior remains unchanged.
- Lens and Scope handler behavior remains unchanged.
- Manual Gravity local storage behavior remains unchanged.

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
- `npm run smoke:perspective-handoff-packet-copy-to-agent-dogfood`
- `npm run smoke:cockpit-perspective-primary-advanced-diagnostics-collapse`
- `git diff --check`
