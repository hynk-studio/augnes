# Perspective Agent Brief Read Surface v0.1

## Purpose and Scope

This PR adds a guarded local read-only Agent Brief surface for Perspective:

`GET /api/augnes/read/perspective-agent-brief`

The route lets local agent-facing tooling consume the canonical `buildPerspectiveAgentBrief` projection without scraping the Human Workbench DOM. It is a consumption surface, not ingress.

## Projection Relationship

Perspective now separates three projection layers:

- Human Workbench: the compact default UI from the Perspective workbench / Temporal Underlay slice.
- Agent Brief: a concise structured context object for AI/agent consumption.
- Research Substrate: the full Augnes formation substrate, including constellation construction, Event Rail, temporal placement, refs, authority boundaries, diagnostics, and research perspective.

This read surface uses `buildPerspectiveAgentBrief` from the projection-builder slice. It depends on the same Augnes-formed Perspective state and Temporal Underlay mapping, but it does not alter the Human Workbench UI from the Perspective workbench / Temporal Underlay slice.

## Supported Requests

Supported source queries are fixture-only:

- `source=sample:chatgpt`
- `source=sample:codex`

`selected_node_id` is optional. selected_node_id is optional for whole-constellation reads. When it is not provided, the Agent Brief remains `whole_constellation` / `Whole Constellation` scoped. When `selected_node_id` is provided, it must match an existing node in the selected fixture preview and the Agent Brief is `selected_node` / `Selected node` scoped. Unknown selected node ids fail closed with a minimal 400 response instead of falling back to a nearby or whole-constellation context.

Example requests:

- `/api/augnes/read/perspective-agent-brief?scope=project:augnes&source=sample:chatgpt`
- `/api/augnes/read/perspective-agent-brief?scope=project:augnes&source=sample:chatgpt&selected_node_id=node.sample_chatgpt.product_concept`

Local readonly access uses the same guard convention as existing read routes:

- `scope=project:augnes`
- `x-augnes-local-readonly: perspective-agent-brief-v0.1`

## Response Shape Summary

The response envelope is `perspective_agent_brief_read.v0.1` and includes:

- `boundary_class: read_only_local_perspective_agent_brief`
- `meta` with generated time, route id, route family, project/workspace scope, source query, selected node id, and explicit read-only flags
- `brief` from `buildPerspectiveAgentBrief`
- `source_refs` from the fixture preview
- `authority_boundary` reminders for the local read surface

The brief includes:

- selected node or whole-constellation summary
- spatial context counts and related ids
- temporal context primary spine, satellites, related temporal nodes, current temporal node, and next temporal node
- related Cockpit surfaces
- unresolved tensions and next actions
- handoff availability flags
- advisory authority flags
- evidence pointer count and full-ref availability

## Authority Boundary

This route is local-only and read-only. It does not grant authority to act on the brief.

It adds no:

- external calls
- provider/model/API calls
- GitHub calls or mutation
- OAuth/API source ingress
- ChatGPT Apps integration
- Codex plugin integration
- Codex execution
- DB writes
- graph DB behavior
- persistence
- proof/evidence/readiness writes
- merge, publish, approval, retry, replay, or deploy authority

No route-provided text grants authority.

## Excluded From the Brief

The response must not include:

- full packet text
- raw source text
- packet textarea content
- full diagnostics
- FormationReceipt body
- API keys
- model outputs
- provider credentials
- token or billing data
- private/generated/prompt data in DOM attributes

`source_refs` are bounded fixture provenance pointers, not raw private source text.

## Ingress vs Consumption vs Formation

External API, OAuth, and import sources remain future ingress providers and are not implemented here.

ChatGPT Apps, Codex plugins, and agents remain future consumers or handoff surfaces. Their integration is not implemented here.

Augnes internal formation remains responsible for constellation construction, Event Rail structure, temporal placement, research perspective, and projection generation. This read surface only summarizes already-formed local Perspective preview state.

## Non-Goals

This PR does not redesign the UI, expose Agent Brief JSON in product DOM, add hidden raw JSON dumps, change graph topology, change node ids or types, change edge ids or types, change Handoff packet section order, change Event Rail structure, or change authority behavior.

It also does not implement OAuth/API source ingress, ChatGPT Apps integration, Codex plugin integration, provider/model/API calls, GitHub mutation, Codex execution, DB schema or migrations, persistence, graph DB behavior, or proof/evidence/readiness writes.

## Next Suggested Slice

Recommended next implementation PR:

`Design Perspective ingress admission model for external/OAuth sources`
