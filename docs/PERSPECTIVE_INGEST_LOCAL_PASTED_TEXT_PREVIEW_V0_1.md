# Perspective Ingest Local Pasted Text Preview v0.1

## Status and scope

This slice adds the smallest real user-provided Perspective ingest loop:

- manual pasted text
- POST-only local preview guard
- deterministic pasted-text parser
- `PerspectiveIngestSessionEpisode`
- `PerspectiveIngestConstellationPreviewResponse`
- Cockpit SVG graph, selected node detail, and copyable packets

The preview is local-only, read-only, deterministic, non-persistent, and
bounded. It stores no raw private history.

## Why pasted text comes before export zip parsing

Manual pasted text comes before ChatGPT export zip parsing because it proves the
human review loop with the smallest surface area. A user can paste a short
public-safe/redacted summary, inspect the generated graph, and copy packets
without adding file upload handling, archive parsing, account scraping, OAuth,
or source-specific import authority.

This keeps the first real input path easy to reject safely, easy to inspect in
Cockpit, and easy to replace later if a local file import or ChatGPT export
parser stub becomes the next stable slice.

## Route

The local preview route is:

```text
POST /api/augnes/read/perspective-ingest-local-preview?scope=project:augnes
```

Required header:

```text
x-augnes-local-readonly: perspective-ingest-local-preview-v0.1
```

Request body:

```json
{
  "input_kind": "manual:pasted_text",
  "input_text": "Intent: Turn a short local work summary into a Perspective graph.",
  "source_label": "Optional local source label"
}
```

The route uses `lib/readonly-api/local-preview-post-guard.ts`. The guard is
POST-only and validates URL parse, method POST only, required scope
`project:augnes`, allowed local host values `localhost`, `127.0.0.1`, and
`::1`, the Host header, the X-Forwarded-Host header when present, and the exact
marker header.

The existing GET-only readonly guard remains GET-only.

## Request validation

The validator accepts only `input_kind: "manual:pasted_text"`.

`input_text` must be a non-empty string after trim and must be at most 12000
characters.

`source_label` is optional and must be at most 120 characters when supplied.

The validator rejects obvious secret-like input with safe error codes and
summaries only. It does not echo rejected input text.

Rejected markers include:

- `OPENAI_API_KEY`
- `sk-`
- `ghp_`
- `github_pat_`
- `BEGIN PRIVATE KEY`
- `bearer token`
- `AWS_ACCESS_KEY_ID`
- `SECRET_ACCESS_KEY`
- `password=`
- `api_key=`
- `access_token=`

## Deterministic parsing

The parser recognizes optional line prefixes:

- `Intent:`
- `Concept:`
- `Decision:`
- `Work:`
- `Changed:`
- `Validation:`
- `Evidence:`
- `Tension:`
- `Next:`
- `Report:`

Each recognized prefix creates one bounded extracted entry in the corresponding
SessionEpisode field. Multiple lines with the same prefix accumulate entries.

Unknown lines contribute only to the bounded 300-character summary. The parser
does not preserve the full raw input in the episode.

If prefixes are absent, the adapter supplies bounded defaults for intent,
concept, decision, evidence, unresolved tension, and next action. Work units,
changed files, validations, and final report points stay empty unless supplied.

If prefixes are present, the adapter uses them and fills only missing critical
fields with bounded defaults.

## SessionEpisode mapping

The adapter creates a `PerspectiveIngestSessionEpisode` with:

- `source_kind: manual_pasted_text`
- `source_ref: local-user-provided:manual-pasted-text`
- `source_label` from the request or `Manual pasted text preview`
- bounded `summary`
- extracted intent, concept, decision, work, changed file, validation,
  evidence, tension, next action, and report fields

It calls no LLM and no external service. It persists nothing.

## Cockpit reuse

Cockpit reuses the existing Perspective Ingest Constellation display path:

- existing sample source controls for `sample:chatgpt` and `sample:codex`
- manual pasted text preview textarea
- optional source label input
- Load safe pasted text example
- Clear pasted text
- Preview pasted text
- existing SVG node-edge graph
- selected node detail
- ChatGPT review packet summary
- Codex handoff packet summary
- Copy ChatGPT review packet
- Copy Codex handoff packet
- readonly selected packet text fallback

The UI distinguishes selected sample source, currently loaded preview source
kind, sample fixture preview, and manual pasted text preview.

## Packets

The ChatGPT review packet contains graph nodes, edges, unresolved tensions, next
action candidates, and boundary reminders for manual review.

The Codex handoff packet contains repo/base/branch/title context, task goal,
context anchors, expected changed files, constraints, checks, PR-body
requirements, final-report requirements, and graph summary.

For `manual:pasted_text`, expected changed files are empty unless the user
provided `Changed:` lines.

The Codex handoff packet says it is a preview packet, not an instruction to
execute unless the user manually gives it to Codex.

## Authority boundary

This preview has no raw private history persistence.

This preview has no automatic ChatGPT account scraping.

This preview has no OAuth.

This preview has no export zip parser.

This preview has no real Codex thread import.

This preview has no file upload.

This preview has no external calls.

This preview has no OpenAI calls.

This preview has no GitHub calls.

This preview has no DB query.

This preview has no DB writes.

This preview has no graph DB.

This preview has no proof/evidence/readiness writes.

This preview has no Codex execution.

This preview has no approval/merge/publish/deploy authority.

This preview has no branch/PR/merge/publish/deploy/approval controls.

This preview has no manual:structured_json support.

This preview has no full graph editor.

This preview has no drag/save/manual gravity.

## Validation

Focused smoke:

```text
npm run smoke:perspective-ingest-local-pasted-text-preview
```

Expected companion checks:

```text
npm run typecheck
npm run smoke:perspective-ingest-constellation-preview
npm run smoke:readonly-api-route-constellation-preview
npm run smoke:cockpit-local-only-constellation-route-preview
npm run smoke:perspective-capsule-contract
git diff --check
```

## Next slice

The next suggested feature slice is either local file import or a ChatGPT export
parser stub only after pasted text preview is stable.

The next slice should not add automatic account scraping, OAuth, raw private
history persistence, external calls, provider calls, graph DB persistence,
proof/evidence/readiness writes, Codex execution, or approval/merge/publish/
deploy authority.
