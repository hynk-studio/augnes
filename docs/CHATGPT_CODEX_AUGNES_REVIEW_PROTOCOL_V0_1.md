# ChatGPT / Codex / Augnes Review Protocol v0.1

## Purpose

This protocol defines how ChatGPT, Augnes, Codex, GitHub, Cockpit, and the user
should cooperate during Augnes development work. It turns the desired workflow
into a review checklist that preserves authority boundaries.

## Protocol Summary

Use this loop:

```text
1. ChatGPT drafts or reviews from Augnes context.
2. Augnes records committed state, pending proposals, proof, and evidence.
3. Codex implements, tests, records proof when available, and opens a PR.
4. ChatGPT reviews the PR result against the handoff and Augnes evidence.
5. The user decides whether to merge or make Core-gated durable approvals.
```

## Roles

### ChatGPT

ChatGPT may:

- read Augnes state/work briefs through bridge tools when available
- draft Codex handoffs
- review Codex-reported files, checks, skipped checks, and proof refs
- prepare action-record or work-event drafts
- summarize pending approval needs for the user

ChatGPT must not:

- execute Codex
- approve, publish, merge, or commit/reject Augnes state
- treat draft records as durable facts
- hide skipped checks or missing evidence

### Augnes Core

Augnes Core may:

- store committed state
- keep pending proposals distinct from accepted state
- store proof records, work events, evidence rows, session traces, mailbox
  records, publication drafts, delivery records, and gate records
- enforce commit/reject and approve/publish gates

Augnes Core remains the durable authority runtime.

### Codex

Codex may:

- read repo files and Augnes handoff context
- edit workspace files within task scope
- run checks and browser verification when relevant
- record verification evidence and proof-only completion when available
- commit, push, and open PRs through normal GitHub workflow

Codex must not:

- commit/reject Augnes state
- approve, publish, merge, or make durable approval decisions
- call GitHub publication adapter routes during normal implementation work
- claim evidence was recorded when helper calls were skipped or failed

### User

The user may:

- decide task direction
- approve durable state transitions through Core-gated surfaces
- approve publication when explicitly requested
- merge PRs
- decide whether skipped checks or missing proof are acceptable

## Start-Of-Work Protocol

Before Codex implementation starts, the handoff should identify:

- Augnes scope, usually `project:augnes`
- Work ID when available
- expected files or file classes
- expected state keys or proof/evidence refs
- expected checks
- forbidden changes
- completion record fields
- authority boundary statement

If ChatGPT drafts the handoff, it should use Augnes state/work context when
available and should say when runtime context is unavailable.

## Codex Implementation Protocol

Codex should:

- read the required repo context and task-specific handoff
- inspect the current git status before editing
- keep changes scoped to the requested files and behavior
- avoid unrelated refactors
- run `npm run typecheck` unless the task explicitly says otherwise or the
  environment makes it impossible
- record skipped checks with concrete reasons
- prefer proof-only closeout when runtime and work ID are available
- prepare a PR body with Summary, Files changed, Authority boundary statement,
  Verification, and Skipped checks

For documentation-only PRs, Codex must not modify:

- runtime behavior
- database schema
- API routes
- app tools
- hooks
- package scripts

## Proof And Evidence Protocol

Evidence must remain explicit:

- A command result is evidence only if the command was run and reported.
- An evidence row exists only if the helper returned an evidence ID.
- A completion proof exists only if proof-only closeout succeeded.
- A skipped check must include the check name and concrete reason.
- A ChatGPT review is review guidance, not committed state.
- A PR is code review state, not Augnes approval.

Preferred Codex closeout path:

```text
npm run codex:record-evidence
npm run codex:record-completion-proof
Evidence Pack read-only review
Session Trace read-only review when session context exists
```

If local runtime, work ID, session ID, or evidence API is unavailable, Codex
should report that exact gap.

## ChatGPT Result Review Protocol

After Codex reports a result or opens a PR, ChatGPT should review against the
handoff:

- expected files vs actual files
- expected state keys vs actual state/proof references
- expected checks vs actual checks
- skipped checks and concrete reasons
- blockers, failures, or partial work
- proof-only completion status
- Evidence Pack or Session Trace visibility when available
- authority boundaries in the PR body

The review outcome should be one of:

- `completed`: expected work and checks are satisfied
- `needs_review`: work appears complete but requires user/Core decision
- `partial`: some expected work is missing or intentionally deferred
- `blocked`: work cannot proceed without external input or unavailable runtime
- `failed`: implementation or verification failed

ChatGPT may recommend a status, but it must not mark durable Augnes state as
accepted.

## PR Body Protocol

Every PR in this workflow should include:

```text
Summary
Files changed
Authority boundary statement
Verification
Skipped checks
```

The authority boundary statement should say whether the PR changed runtime
behavior, schema, routes, app tools, hooks, package scripts, approval behavior,
publication behavior, merge behavior, or Augnes commit/reject authority.

For docs-only PRs, the statement should explicitly say that the PR is
documentation-only and does not modify those runtime surfaces.

## Staged PR Roadmap

### PR 0: Protocol Baseline

- Add this protocol and related strategy/roadmap docs.
- No runtime behavior changes.
- Verify with `npm run typecheck`.

### PR 1: ChatGPT Review Template

- Add a reusable ChatGPT review prompt/template grounded in this protocol.
- Include expected-vs-actual comparison and skipped-check language.
- Keep it documentation-only unless separately approved.

Acceptance criteria:

- Template distinguishes review from approval.
- Template includes proof/evidence gap handling.
- No runtime changes.

### PR 2: Codex PR Body Template

- Add or update a Codex PR body helper/template.
- Include authority boundary and skipped checks as required sections.

Acceptance criteria:

- Template supports docs-only and runtime PRs.
- Template does not imply merge or approval authority.
- Typecheck passes.

### PR 3: Handoff Review Dogfood

- Run the protocol on one bounded Augnes task.
- Capture ChatGPT handoff, Codex result, evidence/proof status, review
  outcome, and user decision.

Acceptance criteria:

- Missing runtime or proof gaps are visible.
- Review outcome uses the protocol status vocabulary.
- User/Core decisions remain separate.

### PR 4: Protocol Refinement

- Adjust the protocol based on dogfood findings.
- Keep changes documentation-only unless a separate implementation PR is
  approved.

Acceptance criteria:

- Changes cite the specific friction they address.
- Authority boundaries do not regress.

## Future PR Acceptance Criteria

Future PRs that use or modify this protocol must:

- identify the handoff source
- identify the review surface
- include expected-vs-actual review when Codex output is involved
- state verification commands and results
- state skipped checks with concrete reasons
- state proof-only closeout status or skipped reason
- preserve ChatGPT/Codex/Augnes authority boundaries
- avoid runtime changes in docs-only PRs

## Non-Goals

- autonomous Codex execution
- ChatGPT task dispatch without user intent
- ChatGPT approval, publish, merge, or commit/reject authority
- Codex approval, publish, merge, or commit/reject authority
- treating proof as accepted state
- treating a PR as durable Augnes approval
- replacing Cockpit or Augnes Core gates

## Forbidden Changes

This protocol forbids:

- ChatGPT executing Codex directly
- Codex approving or rejecting Augnes state
- Codex publishing externally or merging PRs
- ChatGPT or Codex bypassing Core approval gates
- PRs that claim skipped checks were successful
- PRs that hide runtime, work ID, or evidence API gaps
- documentation-only PRs that modify runtime behavior, database schema, API
  routes, app tools, hooks, or package scripts

