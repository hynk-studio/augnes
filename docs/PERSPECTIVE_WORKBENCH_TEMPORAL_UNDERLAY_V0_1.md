# Perspective Workbench Temporal Underlay v0.1

## Purpose and Scope

This PR wires the Perspective projection builders into the default Perspective UI. It makes the first screen a compact Human Workbench for reviewing relationships, tensions, next steps, and handoff actions while preserving the full research substrate behind explicit details surfaces.

This is a UI projection wiring and information-density cleanup. It does not redesign graph data, change authority, or add new runtime capabilities.

## Human Workbench / Agent Brief / Research Substrate

Perspective now keeps three surfaces separate:

- Human Workbench: the default UI surface for compact local graph review.
- Agent Brief: a future structured consumption surface for AI/agent context.
- Research Substrate: Augnes formation data, Event Rail, FormationReceipt, refs, evidence, tensions, diagnostics, and authority boundaries.

This PR uses the Human Workbench projection in the default UI. It does not expose an Agent Brief read surface and does not remove the Research Substrate.

## Why Projection Builders Before UI Redesign

PR #447 added builders for the Human Workbench projection, Temporal Underlay projection, Agent Brief projection, temporal-spatial mapping, and temporal node to Cockpit surface mapping. This PR consumes those builders so the UI can become lighter without deleting formation, temporal, or handoff structures.

The default screen is now driven by `buildPerspectiveWorkbenchProjection`, including source/status, selected material, capped tensions, capped next actions, primary action availability, and the Temporal Underlay.

## Temporal Underlay Model

Temporal Underlay is the default temporal counterpart to the Starmap. It is derived from the full Event Rail projection and renders a compact path:

`Session -> Decision -> Handoff -> Current View -> Next Perspective`

The Handoff node keeps subordinate satellites:

`PR`, `Review`, `Closeout`

Highlights come from the projection's highlighted temporal item ids. The underlay is a compact rail/timeline surface, not another large constellation graph and not a prose replacement for Event Rail.

## Full Event Rail Preservation

Full Event Rail node-edge remains available behind Temporal details. The existing node ids, edge ids, node-edge hooks, PR passive reference node, and selected temporal entry card remain preserved.

Temporal details retains the full Archive / Present / Future temporal structure. Event Rail is moved out of the default bottom surface so the first screen is no longer dominated by a second large graph.

## View Settings

Formation Basis, Lens, Scope, and source controls move behind View settings. Current behavior is preserved, including lens controls, scope controls, formation basis explanation, local switch overlay behavior, cached acknowledgement behavior, keyboard/focus behavior, and future/disabled basis states.

## Observatory Details

FormationReceipt, formation identity, authority fields, full refs, attributions, evidence pointer walls, and full criteria details move behind Observatory details or Full refs and formation details.

The default workbench keeps only the compact source/status row and compact authority capsule.

## Advanced Preview Controls

Manual Gravity Preview, focus marks, pin/watch/defer/boost buttons, local draft controls, restore notices, overwrite boundaries, and related advisory controls move behind Advanced preview controls.

Manual Gravity remains available and remains advisory/local. It is not removed and does not gain write authority.

## Packet Preview

The packet textarea is not rendered by default. Primary copy actions remain visible and copy directly from the packet strings. The textarea and full packet text render only after opening packet preview.

Packet section order remains unchanged.

## Starmap Density

The default Starmap keeps the current sample constellation counts, node selection behavior, and humanized node labels. It hides edge labels and edge summaries by default so the graph reads as a compact human review surface.

Full relationship details remain available through selected material, details surfaces, and the preserved research substrate.

## Unchanged Contracts

This PR does not change:

- graph topology
- node ids
- node types
- edge ids
- edge types
- Handoff packet section order
- authority behavior
- Event Rail structure
- PR passive reference behavior
- FormationReceipt semantics

## Not Added

This PR adds no API routes, DB schema, migrations, persistence, graph DB behavior, provider/model/API calls, GitHub mutation, Codex execution, proof/evidence/readiness writes, OAuth/API source ingress, or ChatGPT Apps/Codex plugin integration.

Rulecraft remains unexposed in product UI. Hidden raw JSON dumps are not added. Raw/private/generated/prompt/model/token/API key/billing data are not exposed in DOM attributes.

## Next Implementation PR

Recommended next implementation PR: `Add Perspective Agent Brief read surface`.
