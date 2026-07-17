# Augnes Codex Worker Bootstrap v0.1

## Purpose

This bootstrap tells a Codex worker how to discover the next Augnes work item,
read a Work Brief when runtime access is available, and fall back to
deterministic repo-backed sources when runtime access is unavailable.

It exists so a prompt such as `Use Augnes to find the next work item and
proceed` does not require broad repo archaeology every time. It is a
discovery and reporting contract only.

## When Codex Should Use This Bootstrap

Use this bootstrap at the start of an Augnes Codex worker session when:

- the user asks Codex to use Augnes to find the next work item
- the user gives only a scope such as `project:augnes`
- the user asks for the current research capability preparation work item
- a live Work Brief is unavailable and deterministic fallback discovery is needed
- Codex needs to report honestly whether runtime Work Brief retrieval happened

When the native-host run starts from Project Home, the persisted
`TaskContextPacket` is the primary execution context. This bootstrap remains a
read-only discovery fallback; it does not export or transport that packet.

## Quick Start

From the repo root:

```sh
npm run codex:next-work -- --scope project:augnes
```

The helper prints a short human summary and a bounded JSON block. The JSON
block is the machine-readable result Codex should use to decide the next safe
step.

## Recommended Command

For the default Augnes project scope:

```sh
npm run codex:next-work -- --scope project:augnes
```

Without `--work-id` or `--prefer-research`, the helper follows the Work Picker
style of selecting the first active seeded work item for the scope. That is the
repo-backed approximation of the active/recommended work item when runtime
Work Picker access is unavailable. The default fallback currently selects
`AG-006` and returns concrete expected files/checks plus implementation anchors
for the coordination event spine, so Codex can proceed when the repo seed is
bounded and the user has not provided a tighter scope fence.

For a known work item:

```sh
npm run codex:next-work -- --scope project:augnes --work-id AG-RESEARCH-CAPABILITY-LANES-001
```

For the current research capability preparation lane:

```sh
npm run codex:next-work -- --scope project:augnes --prefer-research
```

## How To Target The Current Research Preparation Item

`AG-RESEARCH-CAPABILITY-LANES-001` is the current repo-backed research
capability preparation work item. It routes to the product-facing preparation
contract at:

```text
docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md
```

The manifest-backed seeded item also points back to:

```text
fixtures/work-items.project-augnes.v0.json
```

`scripts/demo-seed.mjs` consumes the same manifest for deterministic local demo
seeding; it is no longer the implicit work item source for Codex fallback
discovery.

Use `--prefer-research` when the user asks for the current research work item
but does not name a work ID. Use
`--work-id AG-RESEARCH-CAPABILITY-LANES-001` when the user names the current
preparation item directly.

## Historical Research Dogfood Item

`AG-DOGFOOD-RESEARCH-001` is preserved as repo-backed research accumulation
dogfood evidence. It still routes to the preview-only Research Accumulation
Scenario Pack at:

```text
docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md
```

Use `--work-id AG-DOGFOOD-RESEARCH-001` only when the user explicitly names
that historical item. `--prefer-research` does not select the historical
dogfood item.

## Runtime Work Brief Path

Runtime Work Brief retrieval is preferred when available.

Codex should use the live Work Brief path when the existing environment or the
user clearly provides a runtime base URL. The bootstrap helper treats
`AUGNES_API_BASE_URL` or `--api-base-url` as that signal. It then requests the
read-only work brief route for the selected work item.

If runtime retrieval succeeds, the helper reports:

```text
source: runtime_work_brief
runtime_attempted: true
runtime_available: true
fallback_reason: none
```

The runtime Work Brief remains a read-only discovery source. It does not grant
write authority, close authority, or permission to widen implementation scope.

## Repo-Backed Fallback Path

Repo seed/docs fallback is acceptable only when runtime is unavailable or not
configured. The fallback path is deterministic and must be reported honestly.

The fallback sources are:

- `fixtures/work-items.project-augnes.v0.json`
- `scripts/demo-seed.mjs` as the deterministic local demo seed consumer of
  that manifest
- linked docs in the seeded work item
- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md` for
  `AG-RESEARCH-CAPABILITY-LANES-001`
- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md` for
  historical `AG-DOGFOOD-RESEARCH-001` discovery context

If runtime is not configured, the helper reports:

```text
source: repo_seed_fallback
runtime_attempted: false
runtime_available: false
fallback_reason: runtime_not_configured
```

If runtime was configured but unavailable, the helper reports
`runtime_attempted: true`, `runtime_available: false`, and the concrete
runtime failure as `fallback_reason`.

Codex must not pretend a live Work Brief was retrieved when it used this
fallback.

For the default `AG-006` fallback, the manifest supplies implementation
anchors, expected files, and expected checks for the event spine schema,
storage helper, read-only event API, work brief/read integration, seed data,
and authority smoke coverage. If a future seeded item has no expected files,
expected checks, implementation anchors, or task-specific docs, Codex should
stop and request a bounded scope instead of inventing one.

## What Counts As Successful Discovery

Discovery is successful when the helper can identify, without invention:

- `work_id`
- `scope`
- `title`
- `current_task`
- `expected_files`
- `expected_checks`
- `stop_conditions`
- `authority_boundary_summary`
- `next_return_path`
- `codex_worker_next_action`

For `AG-RESEARCH-CAPABILITY-LANES-001`, the expected files and checks come
from the seeded work item and repo docs. Result return is owned by the
automatic native-host lifecycle, not a repo template.

## What Counts As Blocked

Codex is blocked when no live Work Brief, seeded work item, or documented
repo fallback identifies a usable work item.

Blocked discovery must not be repaired by guessing. Codex must not invent work
IDs, expected files, expected checks, implementation anchors, proof/evidence
rows, PR URLs, host observations, event rows, state changes, or close status.

## Expected Output Shape

The helper output includes these fields:

- `source`
- `runtime_attempted`
- `runtime_available`
- `fallback_reason`
- `work_id`
- `scope`
- `title`
- `current_task`
- `expected_files`
- `expected_checks`
- `stop_conditions`
- `authority_boundary_summary`
- `next_return_path`
- `codex_worker_next_action`

`source` must be one of:

- `runtime_work_brief`
- `repo_seed_fallback`
- `docs_fallback`
- `blocked`

`docs_fallback` is reserved for a future documented repo-only fallback that is
not backed by a seeded work item. Do not use it to invent a task.

## How Codex Decides Whether Implementation Is Allowed

Implementation is allowed when the discovered Work Brief, seed, or docs
fallback provides a bounded task through expected files, expected checks,
implementation anchors, or task-specific docs. Codex should still respect the
newest user request and any tighter scope fences.

If expected files/checks are missing but implementation anchors and task docs
exist, Codex may use those anchors to bound a product-forward slice. If all of
those bounding sources are missing, Codex should stop or ask for human
direction instead of guessing.

For the current `AG-RESEARCH-CAPABILITY-LANES-001` research preparation item,
follow that work item's manifest and task-specific docs when it is explicitly
selected through `--prefer-research` or `--work-id`. It is not the active
default task merely because research capability work was previously discussed.

## How Codex Reports Fallback Use

Codex final reports must include which discovery path was used. If fallback was
used, the report should state that runtime Work Brief retrieval was skipped or
failed with the concrete reason.

Native-host results return automatically through the structured host contract,
complete receipt normalizer, canonical `RunReceipt` writer, and project result
readers. Do not copy a packet or paste a result report into Augnes.

Do not claim live runtime, MCP Inspector, ChatGPT Developer Mode, proof/evidence
rows, event rows, work-status changes, state commits, GitHub review actions, or
provider calls unless they actually happened.

## Authority Boundaries

This bootstrap adds a read-only Codex worker discovery path. It adds:

- no automatic Codex execution
- no automatic report generation
- no automatic GitHub fetch
- no proof/evidence write
- no work close/status mutation
- no event creation/mutation
- no state commit/reject
- no unscoped paper ingestion
- no unscoped paper/source fetching
- no unscoped provider/OpenAI calls
- no unscoped embeddings, RAG, vector search, FTS, or retrieval indexes
- no unscoped crawlers or indexing
- no DB migration in the current preparation slice
- no durable research candidate memory write
- no perspective update commit
- no automatic work item creation
- no shell execution from App/MCP
- no branch or PR creation from App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no new user-facing App/MCP tools
- no widening of the `work_loop_readonly` Developer Mode tool surface

Those omissions describe the bootstrap helper itself. They are not blanket
development prohibitions when a user, Work Brief, persisted packet, or seeded
work item provides a bounded implementation scope.

## Skipped Checks Policy

Skipped checks must have concrete reasons. Do not write `N/A` and do not mark
skipped checks as passing.

If live runtime is unavailable, say whether runtime was not configured or was
attempted and failed. If no live MCP Inspector or ChatGPT Developer Mode session
was started, say so directly.

Fallback honesty is required. Codex must not use repo-backed fallback while
reporting that a live Work Brief was retrieved.

## What This Bootstrap Does Not Do

This bootstrap does not by itself ingest papers, fetch papers, call providers,
generate embeddings, run RAG, perform vector search, crawl, index, create DB
migrations, write durable research candidate memory, write proof/evidence
rows, mutate events, mutate work status, commit/reject state, create App/MCP
tools, widen `work_loop_readonly`, execute Codex automatically, fetch GitHub
automatically, submit GitHub reviews, merge, publish, retry, replay, deploy, or
create PRs. Those omissions describe this bootstrap and the current
discovery helper; they are not blanket development prohibitions when a user,
Work Brief, persisted packet, or seeded work item provides a bounded product scope.

## Next Recommended Step

Run the bootstrap helper, use a live Work Brief when available, otherwise use
the reported deterministic fallback honestly. Normal native-host work should
start from Project Home so the exact persisted packet and structured result are
admitted automatically without manual transport.
