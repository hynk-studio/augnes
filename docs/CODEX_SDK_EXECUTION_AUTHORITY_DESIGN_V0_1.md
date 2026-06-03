# Codex SDK Execution Authority Design v0.1

## 1. Status and Scope

This is a repo-local, docs-only, non-SSOT, design-only pointer for future Codex
SDK execution authority in Augnes. It is docs/smoke/package-pointer only.

This document maps official Codex SDK thread/run/resume, sandbox, permission
profile, and approval concepts into Augnes vocabulary. It does not grant runtime
authority, does not add a provider, does not add TypeScript execution types,
does not import or call the Codex SDK, and does not change UI, API, schema, MCP,
plugin runtime, AG Resume, Project Constellation, Perspective Capsule, proof, or
evidence behavior.

The intended output of this PR is a bounded vocabulary and validation smoke for
future design discussion. It is not an Active-set expansion and is not an
authorization mechanism.

## 2. Purpose

Augnes needs a conservative default model for Codex execution while preserving
user agency. Future Augnes surfaces may need to describe when a local Codex
agent should plan, edit, test, resume work, or request elevated capability. This
document defines how those requests should be represented before any live SDK
execution exists.

The product principle is user responsibility with traceability: Augnes should
not silently block a knowingly requested escalation, but it should require
explicit approval, record the purpose and scope, keep risks visible, and separate
approval from proof, readiness, publishing, replay, retry, or merge authority.

## 3. External Reference Boundary

These official OpenAI references anchor terminology only. They are external
references, not repo authority, and this repo does not inherit runtime behavior
from them in this PR:

- OpenAI Codex SDK: https://developers.openai.com/codex/sdk
- OpenAI Codex Permissions: https://developers.openai.com/codex/permissions
- OpenAI Codex Sandboxing: https://developers.openai.com/codex/concepts/sandboxing
- OpenAI Codex Agent Approvals & Security: https://developers.openai.com/codex/agent-approvals-security

If official terminology changes, Augnes should update this document or a
successor design in a separate scoped docs/smoke change before adding runtime
behavior.

## 4. Official Codex SDK Concepts

The Codex SDK can programmatically control local Codex agents. Official examples
show starting a thread, running prompts on that thread, continuing with another
run, and resuming a past thread by thread ID. In SDK terms, a thread is the
ongoing agent conversation/work context, a run is a turn of execution against a
prompt, and resume reconnects to a prior thread so more work can continue from
that context.

The SDK also exposes sandbox presets for filesystem authority:

- `Sandbox.read_only`: read files without allowing writes.
- `Sandbox.workspace_write`: read files and write inside the workspace and
  configured writable roots.
- `Sandbox.full_access`: run without filesystem access restrictions.

Codex permission profiles are related but not identical terminology:

- `:read-only` keeps local command execution read-only.
- `:workspace` allows writes inside active workspace roots.
- `:danger-full-access` removes local sandbox restrictions and is only for
  intentional broad access.

Sandbox and approval controls are separate. Sandbox describes technical
boundaries; approval policy describes when Codex must stop and ask before
crossing a boundary such as network access, outside-workspace access, or
side-effecting tool calls.

## 5. Augnes Interpretation

In Augnes, SDK thread/run/resume maps conceptually to future execution records,
not to runtime authority in this PR. A future Augnes execution record may refer
to a Codex thread reference, a run result, and a resume candidate, but this
document does not create, store, launch, resume, or replay any thread or run.

Augnes vocabulary should treat execution as something that can be requested,
bounded, approved, recorded, reviewed, and linked to evidence pointers. The
record is the product boundary; the SDK call is a future implementation detail
behind a separately approved provider boundary.

## 6. User Agency and Responsibility Principle

Augnes should be conservative by default, but user agency must be preserved
through explicit escalation and traceability. `:danger-full-access` and
`Sandbox.full_access` are explicit user-responsibility escalation states, not
defaults.

no silent denial: if a user knowingly requests escalation, Augnes should record
and gate the request rather than silently block it. The system may refuse only
when repo policy, managed policy, unavailable capability, or explicit forbidden
scope blocks the action. User approval is necessary for elevated execution, but
it is not the same as proof, evidence, readiness, publish authority, retry
authority, replay authority, or merge authority.

## 7. Permission Profile Mapping

Augnes conceptual permission names:

| Augnes concept | Intended use | Official concept relationship |
| --- | --- | --- |
| `read_only` | Planning, review, inspection, and explanation. | Closest to `Sandbox.read_only` and `:read-only`. |
| `workspace_write` | Implementation and local tests inside the workspace. | Closest to `Sandbox.workspace_write` and `:workspace`. |
| `network_limited` | Dependency or network work under an explicit allowlist and approval. | Future Augnes concept; not an SDK sandbox preset. |
| `full_access` | Broad local filesystem access when scoped and approved. | Closest to `Sandbox.full_access`. |
| `danger_full_access` | Highest-risk local authority with explicit user responsibility. | Closest to `:danger-full-access` and `danger-full-access` sandbox mode. |

Official terminology differs from Augnes terminology. The SDK names are
`Sandbox.read_only`, `Sandbox.workspace_write`, and `Sandbox.full_access`.
Codex permission profiles are `:read-only`, `:workspace`, and
`:danger-full-access`. Augnes should not pretend these are the same type system;
it should map them explicitly in future request/result records.

## 8. Turn-Level Permission Model

Future Augnes requests should choose the least permission needed for a turn:

- planning/review: `read_only`
- implementation/tests: `workspace_write`
- dependency/network work: `network_limited` with explicit approval
- outside-workspace or full local access: `full_access` / `danger_full_access`
  with explicit approval

A permission chosen for one turn should not become a permanent default. Future
execution records should preserve the turn-level permission profile actually
requested and the approval context used for that turn.

## 9. Escalation Flow

A future escalation flow should:

1. Capture the user's requested intent and scope.
2. Classify the requested capability and least sufficient permission profile.
3. Attach a risk note and rollback or reversibility note.
4. Check repo policy, managed policy, and forbidden scope.
5. Ask for explicit approval when the request crosses the current boundary.
6. Record the approval event before any future provider executes.
7. Record the run/thread reference, result summary, changed files, tests/checks,
   evidence pointers, and next action candidates after execution.

If policy blocks the request, Augnes should report the concrete blocker. If the
capability is unavailable, Augnes should report that unavailable capability
rather than pretending the user did not ask. Approval gates execution; it does
not grant proof/evidence/readiness/merge authority.

## 10. Execution Record Vocabulary

User-approved elevated execution should record:

- intent
- scope
- permission profile
- requested capability
- risk note
- rollback or reversibility note
- user approval record
- run/thread reference
- result summary
- changed files
- tests/checks
- evidence pointers
- next action candidates

This vocabulary is conceptual in this PR. It does not create proof records,
evidence records, readiness records, database rows, API payloads, MCP tool
results, or AG Resume writer output.

## 11. Evidence Pointer Semantics

A future Codex execution result may point to future proof/evidence records. This
PR does not create proof/evidence/readiness records, does not write evidence,
and does not modify proof-only closeout behavior.

Execution logs are not automatically proof. Logs may become review inputs, but a
separate proof/evidence gate must decide whether any output is evidence, whether
it is ready, and whether it should be linked from AG Resume, Project
Constellation, or a Perspective Capsule.

## 12. AG Resume Relationship

Future AG Resume records may refer to Codex thread IDs, last run state,
interruption reason, next resume candidate, permission escalation need, and
related evidence pointers.

This PR does not update AG Resume schema, writer behavior, helper behavior,
route behavior, proof/evidence recording gates, or resume execution behavior.

## 13. Project Constellation Relationship

Future Project Constellation nodes may reference Codex execution records, PRs,
permission history, user approval event, execution status, and next suggested
action.

This PR does not add Project Constellation runtime behavior, persistence, graph
DB, graph engine, node creation, route behavior, or UI behavior. Project
Constellation remains a read-only, non-authoritative, evidence-pointer-based
design layer.

`fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json` includes a
`codex_execution_authority_preview` object as conceptual only. It is a sample
fixture preview for docs/smoke validation and does not add a live SDK call,
does not add provider implementation, and does not add runtime execution. This
preview preserves no live SDK call, no provider implementation, and no runtime
execution.

## 14. Perspective Capsule Relationship

A Perspective Capsule may later carry Codex execution intent into a Handoff
Capsule so another surface can understand the requested work, constraints,
approval needs, and evidence pointers.

This PR does not launch Codex tasks, create runtime capsules, execute handoff
packets, add plugin runtime actions, or grant hosted transfer, relay, direct
resume, publish, retry, replay, approval, or merge authority.

## 15. Proposed Future Type Boundary

Future type-only work may introduce names such as:

- `CodexExecutionIntent`
- `CodexPermissionProfile`
- `CodexExecutionRequest`
- `CodexExecutionResult`
- `CodexUserApprovalRecord`
- `CodexEvidenceLink`
- `CodexExecutionProvider`

These are proposed future names only. This PR does not create TypeScript files,
does not add TypeScript execution types, and does not add schema/API contracts.

## 16. Proposed Future Provider Boundary

Future provider design may introduce names such as:

- `CodexExecutionProvider`
- `MockCodexExecutionProvider`
- `RealCodexSdkExecutionProvider`
- `createCodexExecutionRequest`
- `recordCodexExecutionResult`

These are future concepts only and are not implemented in this PR. A real
provider would require separate approved scope for credentials/auth/env review,
runtime invocation, sandbox and permission mapping, approval capture, result
recording, tests, and rollback behavior.

## 17. Mock-to-Real Roadmap

- Phase 1: docs/smoke execution authority design
- Phase 2: type-only boundary
- Phase 3: mock execution record flow
- Phase 4: real SDK invocation behind explicit flag
- Phase 5: Project Constellation / AG Resume read-only display
- Phase 6: user-configurable authority profiles with explicit approval ledger

Each phase must preserve the distinction between user approval, execution
result, evidence, readiness, and merge authority.

## 18. Validation and Smoke Plan

Required validation for this PR:

- `npm run typecheck`
- `npm run smoke:codex-sdk-execution-authority-design`
- `git diff --check`
- `git diff --cached --check`

Supplemental cross-PR content-only diagnostics after PR #363:

- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:augnes-operator-plugin-v2`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`

`npm run smoke:codex-sdk-execution-authority-design` is a deterministic static
read smoke. It performs no network calls, no DB access, no runtime imports, no
Codex SDK import, and no GitHub/OpenAI/Augnes runtime calls. It checks this
document, the index pointer, the package script pointer, required vocabulary,
non-goals, and the changed-file boundary.

Browser/computer-use may be skipped because this PR is
docs/smoke/package-pointer only, with no UI/runtime/API/schema/MCP/App/routes/
browser/external/interactive behavior. Proof-only closeout may be skipped when
no runtime/work ID context is available and this PR performs no proof/evidence
writes.

## 19. Non-Goals

- no live Codex SDK call
- no @openai/codex-sdk import
- no TypeScript execution types
- no provider implementation
- no API route
- no DB schema or migration
- no MCP/App tool change
- no plugin runtime action
- no hooks
- no credentials/auth/env changes
- no background daemon
- no full_access default
- no danger_full_access default
- no proof/evidence/readiness writes
- no AG Resume writer/helper/route changes
- no Project Constellation runtime/UI behavior
- no Perspective Capsule runtime behavior
- no Codex task launch
- no GitHub/OpenAI/Augnes runtime/network calls
- no approval/publish/retry/replay/merge authority
