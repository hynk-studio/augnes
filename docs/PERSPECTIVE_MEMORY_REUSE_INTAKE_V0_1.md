# Perspective Memory Reuse Intake v0.1

Perspective Memory Reuse Intake v0.1 is the Codex-facing entrypoint for reuse. It lets a Codex worker turn a short task string into a deterministic local memory brief without opening the reuse workspace, manually selecting items, writing `why_selected`, writing `reuse_boundary`, or copying the brief by hand.

## Command

```bash
npm run perspective:memory-reuse-intake -- --task "Add Codex-facing Perspective Memory Reuse Intake v0.1"
```

Supported options:

- `--task`: combined task title/description.
- `--task-title`: short title when the task has separate title and body.
- `--task-description`: longer task description.
- `--limit 5`: maximum suggested accepted/reviewing memory items; default is 5.
- `--db-path /path/to/augnes.db`: explicit existing Augnes SQLite DB path.
- `--json`: print the full structured intake JSON.
- `--brief`: print only the copyable Codex Memory Brief plus quality review warning summary.

## Behavior

The helper reads persisted perspective-memory items through `listPerspectiveMemoryItems`, then mechanically matches task keywords against:

- `content.title`
- `content.summary`
- `content.source_refs`
- `content.evidence_refs`
- `content.risk_notes`
- `content.carry_forward_questions`
- `content.suggested_next_review_action`

Accepted and reviewing items are eligible for automatic suggestions. Deprecated, retracted, and superseded items can still appear as warning candidates, but they are excluded from automatic selection.

For every selected item, the intake emits:

- selected memory ID
- matched fields and keywords
- deterministic `why_selected` suggestion
- conservative `reuse_boundary` suggestion
- structured reuse packet JSON from `buildPerspectiveMemoryReusePacket`
- copyable Codex Memory Brief
- quality review preview and warning summary from `buildPerspectiveMemoryReuseQualityReview`

## Determinism

The default CLI output is deterministic for the same task string and same persisted memory items. The intake uses a fixed preview timestamp and deterministic packet/review IDs derived from the task, selected item IDs, and limit.

## Boundary

This is a local read-only preview surface. It has:

- No provider/model calls
- No OpenAI API calls
- No MCP tools
- No Codex SDK
- No GitHub mutation
- No persistence writes
- No reuse packet persistence
- No quality review persistence
- No memory item creation
- No automatic memory creation
- No memory item mutation
- No DB schema change
- No runtime startup
- No MCP bridge startup
- No Augnes state commit/reject authority

The quality review preview is mechanical only. It does not make a semantic truth claim about whether a memory is correct, fresh, or sufficient for the task.
