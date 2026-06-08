# Perspective Agent Brief Manual Ingress Context v0.1

## Purpose and Scope

This PR extends the Perspective Agent Brief with optional `ingress_context`
when the input preview already has `ingress_admission` metadata. It lets future
agent consumers understand that a Perspective preview came from a local manual
ingress candidate and whether that candidate passed preview readiness without
scraping the Human Workbench DOM or Observatory details.

This follows PR #451, which added bounded local manual ingress admission
metadata to manual pasted-text preview responses, and PR #452, which displays a
compact human-readable version inside Observatory details.

## Projection Separation

The Human Workbench remains the compact human UI. Observatory details remain the
human-readable details surface for formation and ingress admission summaries.
The Agent Brief remains a structured read surface for agent consumption. The
Research Substrate remains responsible for the full formation, Event Rail,
admission model, refs, authority boundaries, and diagnostics.

Agent consumption remains separate from ingress. Ingress remains separate from
Formation. Augnes internal formation remains responsible for constellation
construction, Event Rail structure, temporal placement, research perspective,
and projection generation.

## Agent Brief ingress_context

When `preview.ingress_admission` exists, `buildPerspectiveAgentBrief` adds:

- `context_version: perspective_agent_brief_ingress_context.v0.1`
- `present: true`
- `ingress_kind: manual_pasted_text`
- `trust_level: user_provided_local`
- admission and redaction states
- decision target state and allowed flag
- readiness eligibility booleans and reason count
- local read-only ingress candidate authority flags
- pointer count and booleans for source ref and candidate id availability

When `preview.ingress_admission` is absent, `ingress_context` is omitted. Sample
fixture Agent Brief responses for `source=sample:chatgpt` and
`source=sample:codex` remain unchanged and omit `ingress_context`. Each sample
fixture response omits `ingress_context`.

## Manual Preview to Agent Brief Flow

A caller that already has a local manual pasted-text preview response can pass
that preview to `buildPerspectiveAgentBrief`. The builder then exposes the
preview-level ingress context alongside the normal spatial, temporal, surface,
tension, next action, handoff, authority, and refs fields.

If a selected node id is provided, selected-node scope behavior remains
unchanged. The `ingress_context` still describes the preview-level manual
admission, not a selected-node-specific admission.

## Intentionally Excluded

The Agent Brief ingress context intentionally excludes:

- raw pasted text
- raw `ingress_admission` JSON
- candidate id value
- source ref value
- pointer refs values
- actor refs values
- consent ref
- bounded summary
- packet text
- FormationReceipt body
- provider/model/API data
- GitHub data or mutation details
- Codex execution data
- OAuth/token/billing data
- raw/private/generated/prompt/model/token/API key data

The context is a compact machine-readable admission summary, not a raw admission
payload and not Formation authority.

## Route Behavior

The existing Agent Brief read route remains a sample-fixture read route. It
continues to support only:

- `source=sample:chatgpt`
- `source=sample:codex`
- optional valid `selected_node_id`

This PR does not add `source=manual:pasted_text` support to the Agent Brief GET
route. It does not add a POST Agent Brief route. The existing local manual
preview route remains the only route in this slice that accepts raw manual
pasted text.

## Out of Scope

This PR does not add a manual Agent Brief route, POST Agent Brief route,
OAuth/API source ingress, provider/model/API calls, GitHub calls or mutation,
Codex execution, ChatGPT Apps integration, Codex plugin integration, DB schema
or migrations, persistence, graph DB behavior, proof/evidence/readiness writes,
Human Workbench redesign, Observatory details UI changes, Agent Brief JSON in
product DOM, hidden raw JSON dumps, graph topology changes, node id/type
changes, edge id/type changes, or Handoff packet section order changes.

Rulecraft remains unexposed in product UI.

## Next Suggested Slice

Prototype manual Agent Brief handoff packet dogfood.
