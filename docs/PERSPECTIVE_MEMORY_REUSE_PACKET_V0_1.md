# Perspective Memory Reuse Packet v0.1

## Status

Perspective Memory Reuse Packet v0.1 adds a deterministic local workspace at
`/cockpit/perspective/memory-items/reuse`.

The workspace is intentionally not automated behavior. It reads persisted
perspective-memory items through the existing item API, lets the user select
items and add task-specific reuse notes, and produces copyable text artifacts
for a Codex worker.

## Product Goal

The first concrete reuse loop is:

1. persisted perspective-memory item
2. selected or retrieved memory
3. reuse packet
4. Codex Memory Brief
5. later Codex output returns with changed files, verification, skipped checks,
   and remaining friction

This slice stops at the copyable reuse packet and brief. It does not ingest the
later Codex output or write any new memory.

## Route

`/cockpit/perspective/memory-items/reuse`

The route loads persisted perspective-memory items from
`/api/perspective/memory/items?limit=100` using `GET`.

Supported query parameters:

- `item_id`: preselect one persisted memory item.
- `item_ids`: preselect comma-separated persisted memory items.

## Inputs

The user can enter:

- task title
- task description
- selected persisted perspective-memory items
- `why_selected` per selected item
- `reuse_boundary` per selected item

The per-item notes are task-local guidance. They are not written back to the
perspective-memory item store.

## Packet Shape

The helper is
`lib/perspective-ingest/perspective-memory-item-reuse-packet.ts`.

The packet uses:

- `packet_type: perspective_memory_reuse_packet.v0.1`
- `packet_id`
- `created_at`
- `task.title`
- `task.description`
- `target_mode: codex`
- `selected_memory_items`
- `missing_memory_item_ids`
- `reuse_instructions`
- `known_boundaries`
- `return_expectations`
- `authority_boundary`

Each selected item includes:

- `memory_item_id`
- `title`
- `summary`
- `derived_tags`
- `source_ref`
- `why_selected`
- `reuse_boundary`

Derived tags come only from existing persisted item fields such as status, kind,
source validation state, source refs, risk notes, and carry-forward questions.
The helper does not create new semantic tags through synthesis.

## Codex Memory Brief

The brief is human-readable markdown intended to be pasted into Codex. It
includes:

- Task
- Relevant Augnes Perspective Memory
- Why relevant for each item
- Boundary for each item
- Reuse instructions
- Return expectations
- Authority boundary

The brief tells the next worker:

Use these memories to avoid repeating closed work, preserve Augnes direction,
identify next implementation slice, and report back changed files,
verification, skipped checks, and remaining friction.

It also states:

Do not create memory items, mutate Augnes state, run provider/model calls, call
MCP tools, use Codex SDK, or perform GitHub mutation.

## Codex Memory Brief metadata

The helper also returns deterministic Codex Memory Brief metadata next to the
brief output:

- `selected_item_count`
- `codex_memory_brief_character_count`
- `codex_memory_brief_line_count`
- `has_large_selection_warning`
- `compact_brief_recommended`

The full Codex Memory Brief remains available. The metadata is a local size and
selection hint for the reuse workspace UI; it does not create compact output,
persist return bindings, write perspective-memory persistence, or call any
provider/model, MCP, OpenAI API, Codex SDK, or GitHub API surface.

## Authority Boundary

This is a deterministic local builder only.

It does not:

- run provider/model calls
- call OpenAI APIs
- execute Codex SDK
- call MCP tools
- synthesize automatically
- create memory items automatically
- write perspective-memory persistence
- change DB schema or migrations
- create a reuse packet persistence table
- create product boundary records
- write proof/evidence rows
- commit or reject Augnes state
- perform GitHub API mutation from scripts
- perform runtime startup
- perform MCP bridge startup
- create hidden background daemons

The prepare/setup layer is not changed by this feature.

## Review Notes

The workspace mirrors the existing read-only memory item search and review
workspace patterns:

- same persisted item API
- same route-level boundary copy
- same visible no-Core/no-runtime/no-provider/no-GitHub framing
- same static smoke approach

The packet is deliberately copyable rather than persisted.

## Next recommended PR

Dogfood the packet with a real Codex task and report whether it prevented
repeated work, preserved Augnes direction, or exposed stale or misleading
memory.
