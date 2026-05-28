# Codex Agent Instruction Policy v0.1

## Purpose

`AGENTS.md` is the root operating contract for Codex in this repository. It
turns the Augnes authority model and Codex closeout workflow into concise local
instructions that a Codex session can read before editing files.

The file exists to improve consistency, not to create new authority. It is an
instruction contract for repo work. It is not runtime behavior, not a database
schema, not an API route, not an MCP/App tool schema, not a hook, not a plugin,
not a skill, and not an approval gate.

## Policy Summary

`AGENTS.md` tells Codex to:

- read current repo instructions and task-relevant docs before editing
- preserve Augnes authority boundaries
- use `npm run codex:read-brief` when local runtime context is available
- use Work Brief context through `codex:read-brief` when `CODEX_WORK_ID` is set
- avoid fabricating work IDs, evidence IDs, action IDs, session IDs, PR refs, or
  skipped check results
- prefer proof-only completion through `npm run codex:record-completion-proof`
  when runtime and work ID are available
- treat `npm run codex:record-completion` as legacy compatibility unless
  explicitly instructed
- record concrete skipped reasons
- run `npm run typecheck` for behavior changes and when requested
- run relevant `npm run smoke:*` checks for touched areas
- close PRs with Summary, Files changed, Authority boundary statement,
  Verification, Skipped checks, and Proof-only closeout status or skipped reason

## Mapping To Authority Matrix

`docs/AUTHORITY_MATRIX.md` defines the actor boundaries that `AGENTS.md`
repeats operationally:

- The user owns durable approval.
- Augnes Core owns committed state storage and commit/reject gate
  implementation.
- Codex owns repo execution and verification.
- ChatGPT App owns conversational interpretation and handoff, not execution
  control.
- Codex may read state, edit repo files, open PRs, and record verification
  trace/proof through allowed helpers.
- Codex cannot commit/reject Augnes state, publish externally, merge PRs, or
  make durable approval decisions.

The root instructions intentionally repeat these boundaries because they are
the main failure mode for cross-surface agent work. Proof is not approval. PRs
are not merge authority. ChatGPT reviews are not durable Core decisions.

## Mapping To Codex Session Adapter Workflow

`docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` defines the concrete Codex
workflow that `AGENTS.md` summarizes:

- start by reading Augnes state/work context with `npm run codex:read-brief`
  when runtime is available
- include Work Brief context when `CODEX_WORK_ID` is set
- bind only existing sessions; do not create sessions automatically
- record structured evidence rows only when runtime and evidence API are
  available
- prefer `npm run codex:record-completion-proof` and `/api/actions/record-proof`
  for proof-only completion
- treat `npm run codex:record-completion` as legacy compatibility because it
  may create `external.*` marker state
- report missing runtime, missing work ID, missing session ID, unknown work ID,
  evidence API gaps, and skipped checks as explicit gaps

`AGENTS.md` does not require proof recording when prerequisites are missing. It
requires Codex to state the skipped reason instead of fabricating a proof or
evidence identifier.

## Mapping To Codex Agent Harness Roadmap

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` makes root `AGENTS.md` PR 1 in the
canonical harness roadmap. This policy is the explanatory companion for that
slice.

The roadmap says PR 1 should add a repo-local Codex operating contract with:

- authority contract
- docs-only rules
- runtime-change restrictions
- required context intake for Augnes tasks
- typecheck and smoke-check expectations
- skipped-check reporting
- proof-only closeout preference
- PR body requirements

This PR intentionally stops at the instruction contract and policy doc. It does
not implement `.agents/skills`, closeout helpers, plugin scaffolding, hooks, MCP
configuration, browser/computer-use runbooks, or dogfood episode helpers. Those
remain later roadmap slices.

## Mapping To Review Protocol

`docs/CHATGPT_CODEX_AUGNES_REVIEW_PROTOCOL_V0_1.md` defines the review loop:

```text
ChatGPT drafts or reviews from Augnes context
-> Augnes keeps committed state, pending proposals, proof-only action records,
   evidence rows, and Core-gated durable decisions distinct
-> Codex implements, tests, records proof when available, and opens a PR
-> ChatGPT reviews the PR result against the handoff and Augnes evidence
-> the user decides whether to merge or make Core-gated durable approvals
```

`AGENTS.md` supports that protocol by making Codex report scope, verification,
skipped checks, and proof-only closeout status in a consistent PR body. It also
keeps the review distinction clear: ChatGPT may review and recommend, but
ChatGPT does not execute Codex or approve durable state. Codex may implement and
verify, but Codex does not approve, publish, merge, or commit/reject state.

## Instruction Contract, Not Runtime Authority

`AGENTS.md` is plain documentation consumed by Codex sessions. It has no
runtime enforcement by itself. It does not:

- add or modify API routes
- add or modify MCP/App tools
- add hooks
- add skills
- add plugin behavior
- create database tables or migrations
- change package scripts
- change secret handling
- approve, publish, retry, replay, merge, or externally post
- commit/reject Augnes state

If a future PR adds enforcement through hooks, helper scripts, tools, or
runtime routes, that PR must be separately scoped and reviewed against
`docs/AUTHORITY_MATRIX.md`.

## Proof And Approval Boundary

Proof records, work events, evidence rows, and PRs are review material. They
help the user and Augnes Core decide what happened and what remains risky.

They are not approval:

- A proof-only action record is not committed state.
- An evidence row is not an approval decision.
- A ChatGPT review is not a durable Core decision.
- A PR is not merge authority.
- A merged PR is code history, not automatically an Augnes committed-state
  transition unless Augnes Core records one.

## Non-Goals

- autonomous Codex execution from ChatGPT
- ChatGPT direct Codex execution controls
- Codex Augnes commit/reject authority
- Codex approval, publication, retry, replay, merge, or external-posting
  authority
- hook implementation
- plugin implementation
- skills implementation
- MCP/App tool schema changes
- runtime behavior changes
- database or schema changes
- package script changes
- secret handling changes

## Forbidden Changes For This Slice

This PR 1 slice forbids:

- runtime behavior changes
- database/schema changes
- API route changes
- MCP/App tool schema changes
- package script changes
- hook implementation
- plugin implementation
- skills implementation
- ChatGPT direct Codex execution
- Codex Augnes commit/reject authority
- approve/publish/merge automation
- secret handling changes

