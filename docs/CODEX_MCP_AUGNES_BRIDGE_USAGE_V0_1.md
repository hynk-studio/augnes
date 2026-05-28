# Codex MCP / Augnes Bridge Usage v0.1

## Purpose

This is PR 6 in the canonical Codex Agent Harness roadmap. It documents safe
local Codex MCP / Augnes bridge usage for Codex and ChatGPT Developer Mode.

This document does not activate MCP config in the `augnes-operator` plugin. It
does not add runtime routes, bridge tools, app mappings, hooks, schema changes,
or authority. The companion example config is inert and example-only.

## Local Startup

Start the Augnes runtime from the repository root:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Start the Augnes App / MCP bridge in a second terminal:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

The local bridge endpoint is:

```text
http://localhost:8787/mcp
```

## Codex MCP Example

An inert example lives at:

```text
docs/examples/codex-augnes-mcp.example.toml
```

Codex MCP config should be local, reviewed before use, and adapted to the
currently installed Codex config shape. The example is not automatically
active, is not a plugin MCP config, and must not be copied with secrets,
credentials, hosted URLs, bearer tokens, or remote endpoints.

If the exact Codex MCP config shape differs in a local Codex release, treat
the file as a reference for authority boundaries and endpoint intent only.
Do not add `.codex/config.toml` or plugin MCP config in this PR line unless a
future task explicitly scopes it.

## Tool Boundaries

### Safe Read Tools

These tools are read-only or derived-view-only. They should be used only when
the local runtime and bridge are available, and their output should not be
reconstructed when unavailable.

- `augnes_get_state_brief`: read the compact state brief for a scope.
- `augnes_get_work_brief`: read a work packet for a known work ID.
- `augnes_get_evidence_pack`: read the derived Evidence Pack.
- `augnes_get_session_trace`: read bounded session trace context.
- `augnes_get_verification_evidence_records`: read verification evidence rows.
- `augnes_get_mailbox_summary`: read derived mailbox summary buckets.
- `augnes_get_publication_summary`: read publication preview and delivery
  summary buckets.
- `augnes_get_publication_decision_card`: read a publication decision card.

Read tools do not commit or reject Augnes state, execute Codex, merge PRs,
approve, publish, retry, replay, externally post, or grant durable decisions.
Proof is not approval. A PR is not merge authority.

### Draft, Review, Proof, And Proposal Tools

These tools are stronger than simple reads and should be used only with clear
operator intent and local bridge availability:

- `augnes_generate_codex_handoff_draft`: draft-only handoff guidance for Codex.
  It creates or returns guidance; it does not execute Codex.
- `augnes_review_codex_result_draft`: draft-only review material for a reported
  Codex result. It does not record proof or approve the result.
- `augnes_record_action_result`: proof/action-result record path. It records
  what happened; proof is not approval and it does not commit state.
- `augnes_record_work_event`: work trace event path. It records trace context,
  not committed state or approval.
- `augnes_observe`: pending proposal behavior. It may ask the runtime to create
  pending proposals, but it does not commit or reject them.
- `augnes_plan`: draft/recommendation behavior grounded in current state. It
  does not commit state or execute a plan.
- `augnes_list_pending_proposals`: read pending proposals without accepting or
  rejecting them.

For every category:

- no commit/reject authority is granted
- no direct Codex execution is granted
- no merge authority is granted
- no publish, approve, retry, replay, or external posting is allowed unless a
  future Core-gated route and explicit user approval are separately scoped
- bridge reads, drafts, proof records, and pending proposals do not equal
  durable approval
- durable approval remains user/Core gated

## Codex Usage Workflow

1. Start by reading `AGENTS.md` and task-relevant docs.
2. Use the `augnes-read-brief` skill first for Augnes workflow tasks.
3. Use MCP bridge read tools only when the local runtime and bridge are
   available.
4. If the bridge is unavailable, report the concrete skipped reason.
5. Do not reconstruct missing bridge output.
6. Keep implementation in the repo/worktree; MCP bridge usage is context,
   draft, proof, or review material, not Codex execution.
7. Use `npm run codex:closeout-preflight` before PR body closeout.

When proof or evidence recording is appropriate, prefer the existing Codex
helpers and skills. Do not fabricate work IDs, evidence IDs, action IDs,
session IDs, PR refs, or skipped check results.

## Skipped Reason Policy

Use concrete skipped reasons, for example:

- `local runtime unavailable`
- `bridge unavailable`
- `missing CODEX_WORK_ID`
- `missing session ID`
- `no Developer Mode tunnel/session`
- `evidence API unavailable`
- `external check not applicable to docs-only change`

Do not write `N/A`, `skipped`, or `not needed` without the specific reason.

## Authority Boundaries

- MCP bridge does not execute Codex.
- ChatGPT does not execute Codex.
- Codex does not commit/reject Augnes state.
- Codex does not merge PRs.
- MCP bridge reads, drafts, proof records, and pending proposal views do not
  equal durable approval.
- Durable approval remains user/Core gated.
- Future publish, approve, retry, replay, or external-posting flows must be
  separately scoped through Core-gated routes and explicit user approval.

## Relationship To AGENTS.md

`AGENTS.md` remains the root operating contract for Codex. This document gives
Codex a local MCP bridge usage path that preserves the same rules: read context,
keep scope bounded, report skipped reasons, prefer proof-only closeout when
available, and do not claim approval, publication, merge, or state authority.

## Relationship To Repo-Local Skills

The MCP bridge docs support the existing skills:

- `augnes-read-brief`: use bridge read tools only when local runtime and bridge
  are available.
- `augnes-record-evidence`: bridge or helper evidence recording requires real
  work context and returned IDs.
- `augnes-closeout-proof`: proof-only closeout remains distinct from approval.
- `augnes-authority-audit`: bridge usage must be reviewed for authority drift.

Skills are instruction/workflow aids, not runtime authority.

## Relationship To Augnes Operator Plugin

The `augnes-operator` plugin packages approved skills and local metadata. This
PR 6 document does not add plugin MCP config, app mappings, remote endpoints,
or active plugin behavior.

## Relationship To Plugin Hooks

Plugin hooks are local guardrails. They may remind or deny clear forbidden
tool-use patterns, but they are not complete enforcement. This document does
not add or modify hooks.

## Relationship To Closeout Preflight

`scripts/codex-closeout-preflight.mjs` remains the deterministic local closeout
check. Use it before PR body closeout to inspect closeout fields, skipped
reasons, file scope, and authority language. It does not call the runtime or
record proof.

## Relationship To Canonical Roadmap

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` defines this as PR 6: safe Codex
MCP / Augnes bridge usage docs. Later slices cover ChatGPT App operator card
design, browser/computer-use verification, and dogfood episode capture.

## Relationship To Authority Matrix

`docs/AUTHORITY_MATRIX.md` defines the actor boundaries this document
preserves:

- Augnes Core owns committed state and durable gates.
- ChatGPT App / MCP bridge can read and draft but does not execute Codex.
- Codex may implement, verify, and open PRs, but does not merge or commit/reject
  Augnes state.
- GitHub stores code review history; it is not Augnes approval authority.

## Non-Goals And Forbidden Changes

This PR 6 slice does not add:

- active MCP config
- plugin MCP config
- bridge tool changes
- runtime behavior changes
- database/schema changes
- API route changes
- app mappings
- ChatGPT App UI/operator card implementation
- browser/computer-use runbook implementation
- dogfood episode helper implementation
- secret handling changes
- hosted auth
- live posting
- merge or auto-merge behavior
- evidence recording
- proof recording
- OpenAI, GitHub, Augnes runtime, or network calls

MCP bridge usage is context and review support. It is not complete enforcement
and does not expand authority.
