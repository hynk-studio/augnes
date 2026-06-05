# Perspective Ingest Constellation Preview v0.1

## Status and scope

This PR adds a local-only graph-first ingest preview for Project Constellation
and Perspective Capsule review.

The preview path is:

- synthetic ChatGPT/Codex record fixture
- SessionEpisode-like normalized input
- `PerspectiveIngestConstellationPreviewResponse`
- Cockpit minimal SVG constellation preview
- copyable ChatGPT review packet
- copyable Codex handoff packet

This is a first useful preview loop. It is fixture-backed, deterministic,
read-only, and local-only.

## Source fixtures

The source fixtures are:

- `fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json`
- `fixtures/perspective-ingest/codex-record-to-constellation.sample.v0.1.json`

Both fixtures are synthetic and public-safe.

Both fixtures are sample fixture only.

Both fixtures are not raw private history.

Both fixtures include no credential/secrets.

Both fixtures include no proof/evidence/readiness write.

Both fixtures include no external call.

Both fixtures include no Codex execution authority.

## Normalization model

ChatGPT/Codex records become `PerspectiveIngestSessionEpisode` objects through
the fixture adapters in `lib/perspective-ingest/`.

The helper converts episodes into a
`PerspectiveIngestConstellationPreviewResponse` with:

- source refs
- ingest batch metadata
- nodes
- edges
- clusters
- evidence pointers
- unresolved tensions
- next action candidates
- Perspective Capsule preview
- ChatGPT rendering packet
- Codex handoff packet

The generation is deterministic from fixture data.

## Cockpit preview

Cockpit renders the preview in the Perspective tab.

The section id is:

```text
perspective-ingest-constellation-preview
```

The Cockpit section shows:

- source controls for `sample:chatgpt` and `sample:codex`
- source kind, episode count, node count, edge count, tension count, and next
  action count
- a minimal SVG node-edge constellation
- selected node detail
- a non-SVG node list fallback
- edge, evidence pointer, unresolved tension, and next action lists
- capsule thesis
- ChatGPT rendering packet summary
- Codex handoff packet summary
- copy controls for the ChatGPT and Codex packets
- readonly textarea fallback for manual packet copy

The SVG preview does not add a graph dependency.

The SVG preview does not implement drag/save/manual gravity.

## Manual pasted-text follow-up path

The fixture preview now has a manual pasted-text local preview follow-up path:

```text
POST /api/augnes/read/perspective-ingest-local-preview?scope=project:augnes
```

The follow-up path is documented in
`docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md`. It accepts only
`manual:pasted_text`, uses a POST-only local preview guard, rejects obvious
secret-like input without echoing payload content, and reuses the same Cockpit
SVG graph/detail/packet display path.

## Route

The local read route is:

```text
GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample:chatgpt
GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample:codex
```

Required header:

```text
x-augnes-local-readonly: perspective-ingest-constellation-preview-v0.1
```

The route uses the existing local read-only access guard and optional strict
local dev auth adapter pattern.

The route fails closed for unsupported source, missing/incorrect scope, missing
marker header, non-local host, or unexpected internal error.

## Authority boundary

This preview has no raw private history persistence.

This preview has no automatic ChatGPT account scraping.

This preview has no OAuth.

This preview has no external calls.

This preview has no OpenAI calls.

This preview has no GitHub calls.

This preview has no DB writes.

This preview has no graph DB.

This preview has no proof/evidence/readiness writes.

This preview has no Codex execution.

This preview has no branch/PR/merge/publish/approval authority.

This preview has no deploy authority.

This preview has no approval/merge/publish/deploy authority.

This preview has no production auth.

This preview has no real ChatGPT export zip parser.

This preview has no real Codex thread import.

This preview has no full graph editor.

The ChatGPT and Codex packets are manual handoff material only.

The evidence pointers are pointers only.

The next action candidates are advisory only.

## Validation

Focused smoke:

```text
npm run smoke:perspective-ingest-constellation-preview
```

Expected companion checks:

```text
npm run typecheck
npm run smoke:readonly-api-route-constellation-preview
npm run smoke:cockpit-local-only-constellation-route-preview
npm run smoke:perspective-capsule-contract
git diff --check
```

## Next slice

The next suggested feature slice should be real local user-provided import,
still manual and local-only.

It should not add automatic account scraping.

It should not add OAuth.

It should not persist raw private history.

It should not add external calls.

It should not add graph DB persistence.
