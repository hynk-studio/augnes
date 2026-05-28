# Augnes AI Surface Maximization Strategy v0.1

## Purpose

This document defines the initial strategy for making Augnes useful across
ChatGPT, Codex, GitHub, Cockpit, browser verification, and MCP surfaces without
moving durable authority out of Augnes Core or away from the user.

The goal is to maximize useful AI surface area, not autonomous control. ChatGPT
should help draft, interpret, and review. Augnes should preserve committed
state, proof, evidence, work traces, and handoff context. Codex should
implement, verify, and prepare PRs. GitHub should host code review. The user
and Augnes Core remain the durable approval boundary.

## Desired Workflow

The target operating loop is:

```text
ChatGPT drafts or reviews
-> Augnes records state, proof, and evidence
-> Codex implements, tests, and opens PRs
-> ChatGPT reviews the result against Augnes context
-> user approves, publishes, or merges through explicit gates
```

The loop should reduce copy-paste coordination while keeping each surface in
its lane:

- ChatGPT reads committed Augnes context, drafts handoffs, reviews Codex
  outputs, summarizes skipped checks, and prepares record drafts.
- Augnes records committed state, pending proposals, proof-only action records,
  work events, evidence rows, session traces, mailbox summaries, publication
  previews, delivery status, and gate state.
- Codex reads the repo and Augnes briefs, edits workspace files, runs checks,
  records proof when explicitly available, commits, pushes, and opens PRs.
- GitHub stores code history and PR review context.
- Cockpit renders operator-visible state, work, evidence, bridge activity, and
  gate state.
- The user decides what becomes durable approved state, what is published, and
  what is merged.

## Authority Boundaries

This strategy preserves the authority model in `docs/AUTHORITY_MATRIX.md`:

- ChatGPT does not execute Codex.
- ChatGPT does not approve, publish, merge, or commit/reject Augnes state.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, merge, or make durable approval decisions.
- Codex may record proof/trace through approved proof-only helpers and bridge
  tools when local runtime context is available.
- Durable approval remains user/Core gated.
- Augnes Core remains the source of truth for committed state, proof records,
  event spine, mailbox, publication drafts, delivery ledger, and gate
  validation.
- GitHub PR comments and other external posts remain preview-first and
  approval-gated.

Proof is not approval. A handoff is not execution. A PR is not merge authority.
A ChatGPT review is not a durable Core decision.

## Surface Maximization Strategy

Surface maximization means every agent-facing and operator-facing surface should
receive the context it needs to do useful work while exposing the smallest
authority required for that work.

### ChatGPT Surface

ChatGPT should be strengthened as the primary conversational review and handoff
surface:

- read `augnes_get_state_brief` and `augnes_get_work_brief` output when the
  bridge is available
- inspect Evidence Pack, Session Trace, and verification evidence read models
- draft Codex handoffs from committed state, work context, open tensions, and
  expected checks
- review Codex results against expected files, state keys, checks, execution
  surfaces, and skipped-check reasons
- prepare Augnes record drafts without pretending draft records are committed
  state
- summarize pending approvals and risky outcomes for the user

ChatGPT should not receive direct Codex execution controls. If a user wants
Codex work, ChatGPT should produce an explicit handoff packet or review note
that a Codex session can use.

### Augnes Surface

Augnes should be strengthened as the continuity and proof layer:

- committed state remains behind commit/reject gates
- pending proposals remain distinct from accepted state
- Work IDs remain trace anchors
- action records and work events remain proof/trace records
- proof-only closeout should use `/api/actions/record-proof` instead of legacy
  state-marker behavior
- evidence rows, Evidence Pack, Session Trace, mailbox summaries, publication
  summaries, and decision cards remain derived or gated views with explicit
  authority boundaries

Augnes should make missing evidence visible instead of filling gaps with model
confidence.

### Codex Surface

Codex should be strengthened as a repo execution and verification worker:

- start from current repo instructions and Augnes state/work briefs when
  available
- consume explicit ChatGPT or Augnes handoff packets
- edit files, run checks, and inspect diffs
- record structured evidence and proof-only completion when runtime context and
  work IDs are available
- open draft PRs with clear scope, verification, skipped checks, and authority
  boundary statements

Codex should not become a durable Augnes state authority. It should report what
it did and what it verified, then leave approval and merge decisions to the
user/Core/GitHub review flow.

### GitHub And PR Review Surface

GitHub should remain the code review and history surface:

- commits and PRs are review artifacts and code history
- PR descriptions should carry summary, file list, authority boundary,
  verification, and skipped checks
- review comments may be evidence, but they are not Augnes committed state
  unless Augnes Core records a corresponding durable decision

### Cockpit Surface

Cockpit should remain the local operator review surface:

- show state, work, evidence, tensions, bridge activity, publication/delivery
  status, and gate state
- avoid hidden write authority
- any future write controls must be separately scoped, Core-gated, and reviewed
  against `docs/AUTHORITY_MATRIX.md`

## Why Strengthen Codex Through Harness Surfaces

Codex can do better work when its operating environment is explicit and
repeatable. The recommended strengthening surfaces are:

- `AGENTS.md`: repo-local instruction anchor for how Codex should operate in
  this repository, including docs-only boundaries, verification expectations,
  skipped-check policy, and proof-only closeout habits.
- Skills: reusable local workflows for Augnes handoff reading, proof recording,
  PR preparation, browser verification, or review packet generation.
- Plugin: a packaged Codex/Augnes workflow surface that can install skills,
  commands, and stable conventions without relying on one chat transcript.
- Hooks: guardrails that can remind or block unsafe closeout patterns, such as
  missing skipped-check reasons, accidental runtime changes in docs-only PRs, or
  legacy completion helpers when proof-only closeout is expected.
- MCP config: stable bridge access for read-first Augnes context, evidence
  views, session traces, and gated proof tools.
- Proof-only closeout: the preferred completion path should record what Codex
  did without creating `external.*` committed state markers or treating
  execution proof as accepted project state.

These surfaces should improve consistency and evidence quality. They must not
grant Codex approval, publication, merge, or Augnes commit/reject authority.

## Staged PR Roadmap

### PR 0: Strategy And Protocol Docs

Status: this documentation-only baseline.

- Add the AI surface maximization strategy.
- Add the Codex Agent Harness roadmap.
- Add the ChatGPT/Codex/Augnes review protocol.
- Do not modify runtime behavior, database schema, routes, tools, hooks, or
  package scripts.

Acceptance criteria:

- New docs explain the ChatGPT -> Augnes -> Codex -> ChatGPT -> user workflow.
- Authority boundaries are explicit.
- Future harness surfaces are documented as design targets only.
- `npm run typecheck` passes.

### PR 1: AGENTS.md Operating Contract

- Add or update repo-local Codex operating instructions.
- Encode docs-only PR rules, skipped-check reporting, proof-only closeout
  preference, and authority boundary language.
- Avoid runtime code changes.

Acceptance criteria:

- Codex can read one repo-local contract before implementation.
- Instructions do not grant new authority.
- Existing typecheck remains green.

### PR 2: Codex Skill Skeletons

- Add narrowly scoped skills for Augnes context intake, proof-only closeout,
  PR body preparation, and review packet generation.
- Skills should call existing helpers or document existing manual checks.
- No new runtime routes or DB schema.

Acceptance criteria:

- Skills reference existing Augnes docs and helper commands.
- Skills preserve proof-only and skipped-check policies.
- No package script changes unless explicitly approved in a later non-docs PR.

### PR 3: Personal Plugin / Harness Packaging

- Package the Codex harness conventions as an installable local plugin or
  equivalent Codex-facing bundle.
- Include skills and stable metadata.
- Keep installation separate from runtime behavior.

Acceptance criteria:

- Plugin metadata is valid.
- Plugin does not execute Augnes, GitHub publication, or merge actions.
- Any generated cache or installation artifacts are intentionally scoped.

### PR 4: Hook Design Before Hook Enforcement

- Document proposed Codex hooks for docs-only boundary checks, proof-only
  closeout prompts, skipped-check enforcement, and PR body linting.
- Do not add enforcement until the design is reviewed.

Acceptance criteria:

- Hook triggers, inputs, outputs, failure modes, and bypass rules are specified.
- Hooks cannot approve, publish, merge, or commit/reject state.
- Hooks identify false-positive and local-development risks.

### PR 5: Hook Implementation

- Implement approved local hooks only after PR 4 is accepted.
- Keep hooks focused on Codex workflow quality and safety.

Acceptance criteria:

- Hooks are testable locally.
- Hooks fail with actionable messages.
- Hooks do not mutate runtime state or call external publication routes.

### PR 6: MCP Config And Bridge Runbook Hardening

- Add stable MCP setup guidance for ChatGPT Developer Mode, MCP Inspector, and
  Codex-readable bridge context.
- Keep public profile read-only and bridge tools explicitly gated.

Acceptance criteria:

- Config examples are safe by default.
- Tool authority boundaries are documented next to each recommended use.
- No secrets are committed.

### PR 7: Proof-Only Closeout Dogfood

- Dogfood the full loop on a bounded work item.
- Capture evidence rows, proof-only completion, Evidence Pack review, Session
  Trace gaps, ChatGPT review notes, and final user/Core decisions.

Acceptance criteria:

- Proof records are visible without legacy `external.*` state markers.
- Skipped checks include concrete reasons.
- ChatGPT review does not claim authority it does not have.
- User/Core durable decisions remain separate from proof.

## Future PR Acceptance Criteria

Every future PR in this line should satisfy:

- It states which surface is being strengthened and why.
- It names the actor authority affected by the change.
- It preserves the rule that ChatGPT does not execute Codex.
- It preserves the rule that Codex does not approve, publish, merge, or
  commit/reject Augnes state.
- It distinguishes proof, evidence, proposals, and committed state.
- It includes verification and concrete skipped-check reasons.
- It keeps docs-only PRs docs-only.
- It records proof-only completion when runtime, work ID, and helper context are
  available, or states why that was skipped.
- It avoids introducing secrets, hidden external side effects, or implicit
  publication.

## Non-Goals

- autonomous Codex execution from ChatGPT
- ChatGPT-controlled task dispatch
- ChatGPT App commit/reject authority
- Codex commit/reject authority over Augnes state
- Codex approve/publish/merge authority
- automatic GitHub or Discord posting by default
- automatic PR merge
- replacing Cockpit with ChatGPT Apps
- treating chat transcript text as canonical Augnes memory
- hosted auth, multi-user auth, or secret handling changes

## Forbidden Changes In This Strategy Line

Unless a future explicit architecture decision says otherwise, this strategy
forbids:

- adding ChatGPT App tools that directly execute Codex
- adding bridge tools that approve, publish, merge, or commit/reject state
- changing database schema as part of docs-only protocol work
- changing runtime routes, app tools, hooks, or package scripts in docs-only PRs
- using legacy action records as durable accepted project facts
- creating external publication side effects without explicit Core gates
- treating missing runtime evidence as if it were recorded
- hiding skipped checks behind generic `N/A` language

