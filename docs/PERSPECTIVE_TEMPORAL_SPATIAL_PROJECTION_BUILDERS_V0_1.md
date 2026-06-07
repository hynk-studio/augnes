# Perspective Temporal-Spatial Projection Builders v0.1

## Purpose and Scope

This slice adds pure, local, read-only projection builders for the next Perspective redesign. It separates compact human-facing workbench data, concise agent-facing brief data, and temporal-spatial mapping data from the full research substrate that Augnes already preserves.

This PR does not redesign the Perspective UI. It adds data builders first so a later UI PR can render a lighter workbench without deleting temporal-spatial structure, evidence, tensions, refs, or authority boundaries.

## Human / Agent / Research Projection Model

Perspective now has three distinct consumers:

- Human Workbench: compact selected material, status counts, bounded tensions, bounded next actions, actions availability, and a derived Temporal Underlay.
- Agent Perspective Brief: concise structured context for AI or agent consumption surfaces, without handoff packet text or raw source text.
- Research Substrate: the full Augnes formation layer, including constellation nodes, typed edges, Event Rail structure, temporal placement, evidence pointers, tensions, refs, and authority boundaries.

The builders prepare these projections without changing graph topology, node ids, node types, edge ids, edge types, packet section order, or runtime authority.

## Why Builders Before UI Redesign

The current Perspective UI mixes human workbench needs, agent context needs, and research substrate detail in one DOM surface. A direct UI simplification would risk deleting important temporal-spatial formation detail. This PR adds stable builders first so the next UI slice can consume a compact projection while keeping the full Event Rail and constellation model available for research and handoff surfaces.

## Temporal Underlay Model

The Temporal Underlay is derived data, not UI DOM. It gives the future Human Workbench a compact time-oriented read model:

- Primary path: `session`, `decision`, `handoff`, `current_view`, `next_perspective`
- Satellites under `handoff`: `pr`, `review`, `closeout`
- Highlighted item ids: derived from the selected spatial node or selected material

The Temporal Underlay is a lighter temporal counterpart to the spatial constellation. It does not replace the Event Rail.

## Full Event Rail Preservation

Event Rail remains the full temporal counterpart to the spatial constellation. It preserves temporal node-edge structure, references, review/closeout placement, and authority boundaries. The Temporal Underlay is a compact projection derived from that model for future default workbench rendering; it is not a deletion, mutation, persistence layer, graph DB, snapshot store, or replacement for Event Rail.

## Spatial Node to Temporal Node Mapping

The sample ChatGPT constellation maps spatial nodes to temporal nodes as follows:

| Spatial node id | Temporal node ids |
| --- | --- |
| `node.sample_chatgpt.source` | `session` |
| `node.sample_chatgpt.user_intent` | `session`, `decision` |
| `node.sample_chatgpt.product_concept` | `decision`, `current_view` |
| `node.sample_chatgpt.decision` | `decision`, `closeout` |
| `node.sample_chatgpt.unresolved_tension` | `decision`, `next_perspective` |
| `node.sample_chatgpt.next_move` | `next_perspective` |
| `node.sample_chatgpt.packet` | `handoff`, `review`, `pr` |

Fallback node type mapping supports future non-sample source support:

| Spatial node type | Temporal node ids |
| --- | --- |
| `source` | `session` |
| `user_intent` | `session`, `decision` |
| `product_concept` | `decision`, `current_view` |
| `decision` | `decision`, `closeout` |
| `unresolved_tension` | `decision`, `next_perspective` |
| `next_move` | `next_perspective` |
| `packet` | `handoff`, `review`, `pr` |
| `work_unit` | `decision`, `closeout` |
| `changed_files` | `closeout` |
| `validation` | `review`, `closeout` |
| `final_report` | `review`, `closeout` |
| `blocker_risk` | `decision`, `next_perspective` |

## Temporal Node to Cockpit Surface Mapping

Temporal nodes map to Cockpit surfaces as hints, not navigation authority:

| Temporal node id | Cockpit surface ids |
| --- | --- |
| `session` | `overview`, `perspective` |
| `decision` | `work`, `perspective` |
| `handoff` | `bridge` |
| `pr` | `bridge`, `work` |
| `review` | `perspective`, `bridge` |
| `closeout` | `work`, `overview` |
| `current_view` | `perspective` |
| `next_perspective` | `operator`, `work` |

## Human Workbench Projection Shape

`buildPerspectiveWorkbenchProjection` returns:

- `projection_version: "perspective_workbench_projection.v0.1"`
- `source`: query, kind, label
- `status`: scope label, selected title, node count, edge count, tension count, and `Local preview` authority label
- `selected`: compact title, type, summary, node ids, and edge ids
- `tensions`: capped to two visible items by default
- `next_actions`: capped to two visible items by default
- `actions`: copy/review/handoff availability flags
- `temporal_underlay`: primary path, satellites, and highlighted item ids
- `authority`: advisory local preview, no external calls, no persistence, no Codex execution

The projection intentionally excludes full packet text, full source refs, FormationReceipt details, raw private/source text, and hidden JSON dumps.

## Agent Brief Projection Shape

`buildPerspectiveAgentBrief` returns:

- `brief_version: "perspective_brief.v0.1"`
- `surface: "Perspective"`
- `scope`: mode and label
- `source`: query and kind
- `selected`: id, label, type, summary
- `spatial_context`: node count, edge count, related node ids, related edge ids
- `temporal_context`: primary spine, satellites, related temporal nodes, current temporal node, next temporal node
- `surface_context`: related Cockpit surface hints
- `tensions` and `next_actions`
- `handoff`: ChatGPT review and Codex handoff availability
- `authority`: advisory local preview, no external calls, no persistence, no Codex execution
- `refs`: evidence pointer count and `full_refs_available: true`

The brief is an agent consumption surface, not an ingress surface. It does not include full handoff packet text, raw source text, packet textarea content, or full diagnostics. It does not grant authority, imply Codex execution, create a route, or mutate any Augnes state.

## External Ingress vs Agent Consumption vs Augnes Formation

External API, OAuth, import, and export sources are future ingress providers. They are not implemented here.

ChatGPT Apps, Codex plugins, and agents are future consumption or handoff surfaces. They are not implemented here.

Augnes internal formation remains responsible for constellation construction, Event Rail structure, temporal placement, research perspective, and projection generation. These builders prepare future ingress and consumption surfaces without coupling them to each other.

## Authority and Runtime Boundaries

These builders are pure/local/read-only. They add no API route, DB schema, migration, persistence, graph DB behavior, provider/model/API call, GitHub mutation, Codex execution, proof/evidence/readiness write, hidden raw JSON dump, raw/private/generated/prompt/model/token/API key/billing DOM exposure, or Rulecraft product UI.

The returned authority model remains `advisory_local_preview` with `external_calls: false`, `persistence: false`, and `codex_execution: false`.

## Out of Scope

- Perspective UI redesign.
- Moving, hiding, or deleting current Perspective UI sections.
- Graph topology changes.
- Node id, node type, edge id, or edge type changes.
- Handoff packet section order changes.
- API routes.
- DB schema changes or migrations.
- Persistence, graph DB behavior, snapshots, or delta engine behavior.
- Provider, model, external API, OAuth, or import-source integration.
- GitHub mutation.
- Codex execution.
- Proof, evidence, or readiness writes.
- Rulecraft exposure in product UI.
- ChatGPT Apps or Codex plugin integration.
- Hidden raw JSON dumps or raw/private/source/prompt/model/token/billing payload exposure.

## Next Implementation PR Recommendation

Recommended next PR title: **Simplify Perspective workbench with Temporal Underlay projection**.

That PR should wire the Human Workbench projection into the Perspective surface, keep Event Rail available as the full temporal view, and verify that the default UI becomes lighter without removing research substrate detail.
