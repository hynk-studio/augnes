# AG Work Resume Target Preview v0.1

## Purpose

`lib/ag-work-resume-target-preview.ts` provides a pure read-only Target Local B
AG Resume Packet preview/gap checker. It compares an already validated AG
Resume Packet against explicitly supplied local runtime, repo, and work mapping
context, then reports gaps, conflicts, warnings, recommendations, and the next
safe review step.

The target preview is a review aid. It is not approval, not import, not
persistence, not proof/evidence authorization, not Codex execution authority,
and not merge/publish authority.

## Relationship To Packet Preflight And Builder Preview

`scripts/ag-work-resume-packet-preflight.mjs` remains the packet validation
layer. Local B should run or trust a prior strict `ag:resume-preflight` result
before using a packet in this target preview checker.

`lib/ag-work-resume-packet.ts` builds sanitized packet previews from explicit
Local A context. The target preview checker is the next Local B step: it does
not build packets and does not validate raw JSON. It assumes the caller has
already parsed and validated the packet.

## Pure Checker Boundary

The checker is a pure function over explicitly supplied objects:

- `packet`
- local runtime context
- local repo context
- explicit work mapping context

It does not call the Augnes runtime, call GitHub, call OpenAI, call browser,
network, shell, git, or external services, read the filesystem, call
`buildWorkBrief`, call `buildStateBrief`, import DB helpers, import route
handlers, persist data, create work events, create work items, create mapping
records, record proof, record evidence, bind sessions, execute Codex, approve,
publish, retry, replay, externally post, merge, auto-merge, or mutate committed
state.

## Inputs

`AgWorkResumeTargetPreviewInput` includes:

- `packet`: an `AgWorkResumePacketV02` object that the caller has already
  parsed and validated.
- `local.runtime`: explicit runtime facts supplied by the caller, including
  runtime availability, optional local work item details, work brief command
  availability, and evidence/proof/session authorization flags.
- `local.repo`: explicit repo facts supplied by the caller, including remote,
  base-commit reachability, current branch, dirty-worktree state, and expected
  file presence/missing lists.
- `local.known_local_work_mappings`: explicit foreign-to-local work mappings
  with `proposed`, `confirmed`, or `rejected` status.
- `strict`: optional stricter repo interpretation for dirty worktrees and
  unreachable base commits.

The checker never discovers these inputs on its own.

## Output

`AgWorkResumeTargetPreview` reports:

- `status`: `ready_for_user_core_review`, `blocked`, `needs_mapping`,
  `context_only`, or `conflict`.
- `ok_to_continue`: true only when it is OK to continue to user/Core review,
  not when it is OK to execute Codex.
- `packet_summary`: source work, Git refs, expected files/checks, and foreign
  refs that remain foreign.
- `local_context_summary`: runtime, repo, mapping, and authorization facts.
- `gaps`: blocking or informational gaps.
- `conflicts`: identity, repo, target-policy, or strict-mode conflicts.
- `warnings`: non-blocking review concerns.
- `recommendations`: deterministic safe next actions.
- `authority_boundary`: explicit no-import/no-execution/no-state-mutation
  boundary text.
- `next_step`: the immediate human/Core review action.

## Local B Workflow

1. Run or trust a prior `ag:resume-preflight` result for the packet.
2. Build target preview from explicit local runtime, repo, and mapping context.
3. Inspect gaps, conflicts, warnings, and recommendations.
4. User/Core confirms whether the foreign work maps to an existing local work
   item.
5. Only later run `codex:read-brief` against a confirmed local runtime/work
   mapping.

Even when the preview status is `ready_for_user_core_review`, the next step is
user/Core confirmation, not Codex execution.

## Conflict Handling

The checker reports conflicts for:

- work identity mismatch when the same scope/work ID exists but title, status,
  or next action differs
- confirmed mapping target mismatch
- rejected local work mappings
- repo remote mismatch
- base commit unreachable in strict mode
- dirty worktree in strict mode
- unsafe target runtime policy values that allow or ambiguously allow
  execution, merge/publish, state mutation, work creation, session binding, or
  direct proof/evidence recording

The checker reports blocking gaps for:

- missing local runtime context
- unavailable local runtime
- missing or unconfirmed local work mapping
- confirmed mapping without supplied local work item context
- base commit unreachable in default mode
- missing expected files

Dirty worktrees are warnings by default and conflicts in strict mode. Missing
repo context is a warning because the checker does not run git.

## Foreign Refs

Foreign action, evidence, evidence-pack, and session refs remain foreign refs.
The preview does not convert them into local proof records, local evidence
rows, local evidence packs, or bound local sessions. Proof/evidence/session
choices remain separate future user/Core decisions for a confirmed local work
item.

## Recommendations

The checker emits deterministic human-readable recommendations such as:

- `Run ag:resume-preflight before target preview if not already done.`
- `Confirm whether foreign work <scope>/<work_id> maps to an existing local work item.`
- `Run codex:read-brief only after local runtime/work mapping is confirmed.`
- `Use packet as context only because local runtime context is missing.`
- `Resolve repo remote/base commit mismatch before implementation.`
- `Do not record evidence/proof unless user/Core authorizes it for the local work item.`
- `Do not create a local work item automatically from this packet.`

## Authority Boundary

- Target preview is read-only.
- Target preview does not import or persist.
- Target preview does not create or map work items.
- Target preview does not record proof/evidence.
- Target preview does not bind sessions.
- Target preview does not execute Codex.
- Target preview does not approve, publish, retry, replay, externally post,
  merge, auto-merge, or mutate committed state.
- Durable approval remains user/Core gated.

## Non-Goals

- No route.
- No DB/schema changes.
- No persistence.
- No import.
- No work item creation.
- No mapping record creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code route.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.

## Future Route Or Helper Note

A later PR may wire this pure checker into a read-only route, local helper,
Cockpit panel, or ChatGPT App read-only bridge only after user/Core scopes that
surface and preserves the same no-import, no-persistence, no-proof/evidence,
no-session-binding, no-Codex-execution, no-merge, and no-state-mutation
boundaries.
