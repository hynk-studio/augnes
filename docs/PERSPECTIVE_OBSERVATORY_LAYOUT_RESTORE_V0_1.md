# Perspective Observatory Layout Restore v0.1

This slice is a layout restoration, not a new capability slice. It restores Perspective as a constellation-first observatory: the user sees the current perspective sky before boundary copy, packet text, local draft metadata, or archive machinery.

## Layout

- Compact identity: `AUGNES / Perspective Observatory`, current formation summary, and local-only / read-only / preview-only status.
- Left controls: Formation Basis, Lens, Scope, and Source are grouped as observatory controls.
- Center starmap: the central surface is the `Current Perspective Starmap`, with node / edge / tension metrics visible near the graph.
- Right inspector: the default view is Selected, Why here, Evidence / Tensions / Next, and Actions.
- Bottom event rail: Archive, Present, and Future remain visible as the temporal layer below the starmap workspace.

## What Moved

Long authority explanations and anchor links moved into the collapsed advanced boundaries block after the observatory shell. Manual Gravity, local draft metadata, conflict notices, resolution proposal cards, and packet textarea content remain reachable through advanced/details areas rather than dominating the first inspector view.

## Formation Basis, Lens, And Scope

Formation Basis explains how the constellation was formed. Lens explains how the user inspects the starmap. Scope explains which graph material is selected. Current remains the active receipt basis. Manual Selection remains local preview context only when supported by selected material. Historical Snapshot, Auto Proposal, and Experimental stay future/disabled explanation-only choices in this slice.

Rulecraft remains unexposed as product UI. Auto Proposal remains future/disabled: there is no provider, model, API call, or billing. Historical Snapshot remains archive-card-only: no frozen snapshot, delta engine, or archive persistence is introduced.

## Authority Boundaries

This restore does not add API routes, DB schema changes, persistence, graph DB writes, proof/evidence/readiness writes, Codex execution, GitHub mutation, provider/model calls, API billing, Rulecraft UI, historical snapshot persistence, or an actual Auto Proposal generator.

The restored UI continues to use explicit local-only, read-only, preview-only, no external calls, no persistence, no graph DB, and no Codex execution language.

## Validation

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-capsule-contract`
- `npm run smoke:cockpit-perspective-ia`
- `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- `npm run smoke:cockpit-perspective-observatory-layout`
- `git diff --check`
