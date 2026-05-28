# Codex Skills For Augnes v0.1

## Purpose

This document describes the first repo-local Codex skills for the Augnes
workflow. These skills are concise instruction/workflow aids under
`.agents/skills/`; they are not runtime authority and do not implement hooks,
plugins, MCP config, helper scripts, API routes, database schema, or app tools.

The goal is to make Codex work more repeatable while preserving the Augnes
authority model: ChatGPT does not execute Codex, Codex does not commit/reject
Augnes state, Codex does not merge PRs, and durable approval remains user/Core
gated.

## Skills

- `augnes-read-brief`: read Augnes state/work context before implementation
  with `npm run codex:read-brief`, preserving concrete skipped reasons when
  runtime or work context is unavailable.
- `augnes-implementation-slice`: keep edits bounded to the requested task,
  expected files, relevant checks, and forbidden-change list.
- `augnes-record-evidence`: record or report verification evidence using
  `npm run codex:record-evidence` when runtime, `CODEX_WORK_ID`, and evidence
  API are available.
- `augnes-closeout-proof`: prefer proof-only completion with
  `npm run codex:record-completion-proof`; treat `codex:record-completion` as
  legacy compatibility unless explicitly instructed.
- `augnes-authority-audit`: check a PR before closeout for forbidden authority
  changes and produce a pass/warn/fail checklist.

## Relationship To AGENTS.md

`AGENTS.md` is the root operating contract for Codex behavior in this repo. The
skills break that contract into task-specific workflows:

- read context before implementation
- keep implementation bounded
- record or report evidence
- close out with proof-only completion
- audit authority before PR closeout

The skills do not replace `AGENTS.md`; they make its rules easier to apply at
the right moment.

## Relationship To Codex Session Adapter

`docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` defines the underlying helper
workflow. The skills use the existing helper names from that workflow:

- `npm run codex:read-brief`
- `npm run codex:record-evidence`
- `npm run codex:record-completion-proof`
- legacy `npm run codex:record-completion` only when explicitly instructed

The skills preserve the Session Adapter rule that missing runtime, missing work
ID, unknown work ID, missing session ID, evidence API gaps, and skipped checks
must remain explicit gaps.

## Relationship To Canonical Harness Roadmap

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` defines these repo-local skills as
PR 2 in the canonical harness roadmap:

- `augnes-read-brief`
- `augnes-implementation-slice`
- `augnes-record-evidence`
- `augnes-closeout-proof`
- `augnes-authority-audit`

This slice is skills documentation only. The plugin scaffold, hooks, MCP
config, closeout/evidence checklist helper, Work Contract Card,
browser/computer-use verification runbook, and dogfood episode capture remain
later roadmap slices.

## Relationship To Review Protocol

`docs/CHATGPT_CODEX_AUGNES_REVIEW_PROTOCOL_V0_1.md` defines the review loop:
ChatGPT drafts or reviews, Augnes keeps state/proof/evidence lanes distinct,
Codex implements and opens PRs, ChatGPT reviews, and the user decides whether
to merge or make Core-gated durable approvals.

The skills support that protocol by helping Codex produce reviewable context:
changed files, verification results, skipped checks, proof-only closeout status,
and authority-audit notes.

## Instruction Aids, Not Runtime Authority

These skills are Markdown instructions. They do not:

- change runtime behavior
- create database/schema changes
- add API routes
- add or modify MCP/App tool schemas
- change package scripts
- implement hooks
- implement plugins
- implement helper scripts
- add MCP config
- create ChatGPT App UI/operator cards
- create browser/computer-use runbooks
- create dogfood episode helpers
- change secret handling
- approve, publish, retry, replay, externally post, merge, or auto-merge
- commit/reject Augnes state

Proof is not approval. A PR is not merge authority. A skill invocation is not a
durable Core decision.

## Non-Goals

- autonomous Codex execution
- ChatGPT direct Codex execution
- Codex Augnes commit/reject authority
- Codex merge authority
- approve/publish/retry/replay/external posting automation
- secret handling changes
- runtime enforcement
- replacing Augnes Core gates with Markdown instructions

## Forbidden Changes For This Slice

This PR 2 slice forbids:

- runtime behavior changes
- database/schema changes
- API route changes
- MCP/App tool schema changes
- package script changes
- hook implementation
- plugin implementation
- closeout helper implementation
- MCP config
- ChatGPT App UI/operator card implementation
- browser/computer-use runbook implementation
- dogfood episode helper implementation
- secret handling changes

