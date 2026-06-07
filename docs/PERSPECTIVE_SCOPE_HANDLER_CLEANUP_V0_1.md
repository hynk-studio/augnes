# Perspective Scope Handler Cleanup v0.1

## Status and Scope

This is a handler-boundary cleanup slice for the Perspective Observatory. It does
not add a new user-visible capability. The restored Observatory UI, Event Rail
cards, and Formation Basis switch overlay remain the same product surfaces.

## Product Model

- Formation Basis = how the local preview was formed.
- Lens = how the current starmap is inspected.
- Scope = what graph material is selected.
- Selection = selected node, selected cluster, whole constellation, or local
  manual selected material.
- Handoff Target = ChatGPT Review or Codex Handoff packet preview target.

## Handler Responsibilities

The cleanup separates local transitions that were previously mixed together:

- `selectPerspectiveLensOnly` changes Lens state only and clears transient copy
  or Manual Gravity overwrite UI.
- `applyPerspectiveScope` changes Scope and selected graph material through
  explicit options.
- `selectWholeConstellationScope`, `selectConnectedNodeScope`,
  `selectPerspectiveNodeScope`, `selectPerspectiveClusterScope`, and
  `selectManualSelectionScope` own named graph-material transitions.
- `setPerspectiveHandoffTarget` controls only the packet preview target.
- `openPerspectiveConstellationHandoffPacket` opens packet details and sets the
  Codex Handoff target without changing Lens or Scope.

Lens controls may still coordinate more than one helper when that is the existing
user behavior. The coordination now happens in `handlePerspectiveLensControlClick`
instead of inside a mixed all-purpose Lens setter.

## Behavior That Remains Unchanged

- Perspective Observatory remains the default Cockpit tab.
- Current Perspective Starmap remains the primary Observatory surface.
- Left Controls still show Formation Basis, Lens, Scope, and Source.
- Inspector actions still include Inspect connected nodes, Preview Perspective
  Unit, Mark as Next Candidate Preview, and Open Handoff Packet.
- Event Rail entry cards remain passive, read-only, and local-only.
- Formation Basis switch overlay still supports Current and Manual Selection as
  local/free switch candidates.
- Cached local Formation Basis acknowledgement semantics remain unchanged.
- Manual Gravity remains local preview context, not FormationReceipt authority.

## Known Local Fallbacks

Dedicated Open Tensions (`open_tensions`) and Next Candidates
(`next_candidates`) scopes do not exist yet. Until they do, those Lens controls
still use `manual_selection` as an explicit local inspection fallback. That
fallback does not persist material, write a graph DB, or grant proposal
authority.

Manual Selection scope is local preview context. It does not create durable
FormationReceipt authority, graph persistence, or Manual Gravity storage
behavior.

## No New Authority

- No new API routes.
- No DB schema changes.
- No persistence changes.
- No graph DB.
- No proof, evidence, or readiness writes.
- No Codex execution.
- No GitHub mutation.
- No provider, model, or API call.
- No API billing.
- No Auto Proposal generation.
- No Rulecraft exposure.
- No historical snapshot persistence.
- No delta engine.

## Validation

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-capsule-contract`
- `npm run smoke:cockpit-perspective-ia`
- `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- `npm run smoke:cockpit-perspective-observatory-layout`
- `npm run smoke:cockpit-perspective-event-rail-entry-cards`
- `npm run smoke:cockpit-perspective-formation-switch-overlay`
- `npm run smoke:cockpit-perspective-scope-handler-cleanup`
- `git diff --check`
