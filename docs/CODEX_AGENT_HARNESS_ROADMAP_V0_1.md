# Codex Agent Harness Roadmap v0.1

## Purpose

This roadmap defines the initial plan for a Codex Agent Harness for Augnes. The
harness is a set of repo instructions, skills, plugin packaging, optional local
hooks, MCP configuration, and proof-only closeout practices that make Codex work
more repeatable and reviewable.

The harness does not create a new runtime, does not execute Codex from
ChatGPT, and does not grant Codex durable approval authority.

## Harness Operating Model

Codex should operate as a specialist worker inside this loop:

```text
ChatGPT drafts/reviews
-> Augnes records state/proof/evidence
-> Codex implements/tests/PRs
-> ChatGPT reviews
-> user merges or sends decisions through Core-gated surfaces
```

The harness should help Codex answer these questions before closeout:

- What Augnes scope and work ID am I working against?
- What files and behavior are in scope?
- Which checks did I run?
- Which checks did I skip, and for what concrete reason?
- Did I change only the files allowed by the task?
- Is proof-only completion available?
- What should the PR body say about authority boundaries?

## Current Inputs To Respect

The harness should build on existing project contracts:

- `README.md` describes Augnes as a local runtime for AI-assisted project work
  with committed state, work traces, proof records, ChatGPT/MCP bridge access,
  and Codex helper scripts.
- `docs/AUTHORITY_MATRIX.md` defines actor authority and the core rule that
  Augnes Core and the user own durable decisions.
- `docs/AUGNES_COORDINATION_SPINE_ROADMAP.md` defines the broader coordination
  path across event spine, handoff registry, mailbox, publication, and gate
  state.
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` defines the current Codex
  start, verification, proof, Evidence Pack, and Session Trace workflow.
- `apps/augnes_apps/src/server.ts` defines public work-read tools and
  bridge-gated tools for state briefs, evidence views, session traces,
  observations, planning, proof/work events, handoff drafts, result-review
  drafts, mailbox summaries, publication summaries, and publication decision
  cards.

## Authority Contract

The harness must preserve these boundaries:

- ChatGPT does not execute Codex.
- ChatGPT does not approve, publish, merge, or commit/reject Augnes state.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, merge, or make durable approval decisions.
- Codex may edit repo files and open PRs through normal GitHub workflow.
- Codex may record verification evidence and proof-only completion when the
  runtime, work ID, and helper context are available.
- Durable approval remains user/Core gated.
- External publication remains explicit, preview-first, and Core-gated.

## Harness Components

### AGENTS.md

`AGENTS.md` should become the first local instruction contract Codex reads in
this repo.

Recommended content:

- Augnes authority summary
- docs-only PR rules
- runtime-change restrictions
- required context intake for Augnes tasks
- `npm run typecheck` as the baseline check unless a task specifies otherwise
- skipped-check reporting rules from the Session Adapter workflow
- proof-only closeout preference
- PR body requirements

Acceptance criteria:

- Codex can follow the file without reading a previous chat transcript.
- The file does not grant approval, publication, merge, or Augnes state
  authority.
- The file distinguishes proof from committed state.

### Skills

Skills should capture repeatable workflows that are easy to invoke from Codex.

Candidate skills:

- `augnes-context-intake`: read README, authority docs, state/work briefs, and
  task-specific handoff context.
- `augnes-proof-closeout`: run verification, record evidence when possible, and
  prefer proof-only completion.
- `augnes-pr-body`: create PR body sections for Summary, Files changed,
  Authority boundary statement, Verification, and Skipped checks.
- `augnes-review-packet`: prepare a ChatGPT-readable review packet with
  expected-vs-actual files, checks, state keys, proof refs, skipped checks, and
  blockers.

Acceptance criteria:

- Skills reuse existing helpers or documented routes.
- Skills do not invent new runtime authority.
- Skills state concrete skipped reasons when local runtime, work ID, or session
  context is unavailable.

### Plugin

A plugin can package the harness so it is installable and versioned instead of
being scattered across ad hoc prompts.

Recommended plugin contents:

- skill manifests
- stable descriptions for Augnes context intake and closeout
- optional docs templates
- no secrets
- no runtime mutation code

Acceptance criteria:

- Plugin installation does not change Augnes runtime behavior.
- Plugin commands do not call publication, approval, merge, or commit/reject
  paths.
- Plugin docs describe how to uninstall or ignore the harness if needed.

### Hooks

Hooks should be designed before enforcement. They are useful for local safety
checks, not authority expansion.

Candidate hook checks:

- docs-only PR changed only documentation files
- PR body includes authority boundary and skipped-check sections
- proof-only closeout was attempted or skipped with a concrete reason
- legacy completion helper use is called out when it happens
- package scripts were not modified in a docs-only task

Acceptance criteria:

- Hook behavior is documented before implementation.
- Hook failures are actionable.
- Hooks do not create evidence, publish, approve, merge, or commit/reject state.

### MCP Config

MCP configuration should make read-first Augnes context easy to reach from
ChatGPT Developer Mode, MCP Inspector, or other MCP-compatible clients.

Recommended configuration goals:

- clear local bridge URL
- safe default public profile
- explicit bridge-enabled mode for Augnes tools
- no committed secrets
- mapping from tools to authority boundaries

Acceptance criteria:

- Public tools remain safe and read-oriented.
- Bridge tools remain explicit and bounded.
- Config examples do not imply that ChatGPT can execute Codex.

### Proof-Only Closeout

Proof-only closeout should be the default Codex completion pattern when runtime
context is available.

Preferred behavior:

- record verification evidence rows after checks
- use `codex:record-completion-proof` and `/api/actions/record-proof`
- avoid legacy `external.*` marker-state behavior unless compatibility requires
  it and the PR clearly says so
- review Evidence Pack and Session Trace where applicable
- include exact skipped reasons for missing runtime, missing work ID, unknown
  work ID, missing session ID, or unavailable evidence API

Acceptance criteria:

- Proof records do not become accepted project state.
- Work events link to proof when available.
- Missing proof is described as a gap, not inferred.

## Staged PR Roadmap

### PR 0: Initial Strategy And Protocol Docs

This PR creates the baseline documentation only.

Allowed changes:

- `docs/AUGNES_AI_SURFACE_MAXIMIZATION_STRATEGY_V0_1.md`
- `docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md`
- `docs/CHATGPT_CODEX_AUGNES_REVIEW_PROTOCOL_V0_1.md`

Forbidden changes:

- runtime behavior
- database schema
- API routes
- app tools
- hooks
- package scripts

Verification:

- `npm run typecheck`
- confirm only docs changed

### PR 1: AGENTS.md Baseline

Add the repo-local Codex operating contract.

Acceptance criteria:

- Includes authority contract, docs-only rules, proof-only closeout, and
  skipped-check policy.
- Does not modify runtime files.
- `npm run typecheck` passes.

### PR 2: Skill Design Docs

Document the proposed harness skills before installation.

Acceptance criteria:

- Each skill has trigger conditions, inputs, outputs, and forbidden actions.
- Skills refer to existing docs and helpers.
- No generated plugin artifacts yet.

### PR 3: Skill Implementation

Add the approved skill files.

Acceptance criteria:

- Skills are small and task-focused.
- Skills do not call external publication or approval routes.
- Skills include fallback language for missing runtime context.

### PR 4: Plugin Packaging

Package the approved skills and metadata.

Acceptance criteria:

- Manifest validates.
- Plugin docs explain installation scope.
- No runtime, schema, route, or package-script changes unless explicitly
  approved.

### PR 5: Hook Design

Document proposed hooks and false-positive handling.

Acceptance criteria:

- Hooks are advisory or local quality gates only.
- No hook implementation yet.
- Authority boundaries are repeated in the design.

### PR 6: Hook Implementation

Implement approved hooks.

Acceptance criteria:

- Hooks are local, deterministic, and testable.
- Hooks do not mutate Augnes runtime state.
- Hooks do not call GitHub publication, approval, replay, or merge paths.

### PR 7: MCP Config And Runbook

Add safe local setup guidance for bridge usage.

Acceptance criteria:

- Includes ChatGPT Developer Mode and MCP Inspector usage.
- Separates public profile tools from bridge-enabled tools.
- No secrets or live tokens are committed.

### PR 8: Full Harness Dogfood

Use the harness on a bounded Augnes work item and record gaps.

Acceptance criteria:

- PR includes proof-only closeout status.
- Evidence Pack and Session Trace are reviewed or skipped with exact reasons.
- ChatGPT review packet compares expected vs actual work.
- User/Core approval remains separate from proof and merge.

## Future PR Acceptance Criteria

Every PR in this roadmap must include:

- Summary of the harness component being changed.
- Files changed.
- Authority boundary statement.
- Verification commands and results.
- Skipped checks with concrete reasons.
- Statement that no runtime behavior, schema, routes, app tools, hooks, or
  package scripts changed when the PR is docs-only.
- Proof-only closeout status or concrete skipped reason.

## Non-Goals

- new autonomous agent runtime
- ChatGPT-controlled Codex execution
- Codex approval authority
- Codex publish authority
- Codex merge authority
- Augnes committed-state mutation by Codex
- hidden GitHub posting
- automatic PR merge
- new hosted auth or secret management
- replacing Augnes Core gates with prompt policy

## Forbidden Changes

The harness must not:

- add a ChatGPT tool that starts Codex work
- add a Codex helper that commits/rejects Augnes state without explicit Core
  gate semantics
- add hooks that publish, approve, merge, or mutate durable state
- add MCP config that commits secrets
- treat proof-only records as accepted project facts
- hide failed or skipped checks
- modify runtime behavior in documentation-only PRs

