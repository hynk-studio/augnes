# Current Runtime Dogfood Readiness Runbook v0.1

## Purpose

This runbook prepares the next phase after ephemeral demo DB validation: a real
current-runtime Augnes dogfood work item.

The next phase must use a user/Core-provided current runtime and a real work
item. The required runtime URL, scope, work ID, authorization choices, and
change boundaries must come from the user/Core before Codex touches the current
runtime.

This readiness PR is preparation only. It does not call the runtime, does not
record evidence, does not record proof, does not create a current-runtime
dogfood episode, and does not use an ephemeral demo DB as if it were the
current runtime.

## Required User/Core Inputs

Before a future Codex run starts, the user/Core must provide:

- `AUGNES_API_BASE_URL`.
- `CODEX_SCOPE`.
- `CODEX_WORK_ID`.
- Whether `CODEX_SESSION_ID` is available.
- Whether evidence recording is allowed.
- Whether proof-only closeout is allowed.
- Whether browser/computer-use verification is required.
- Expected change scope.
- Forbidden files or surfaces.
- Expected verification commands.
- Whether the runtime is production/current local, current remote, or another
  explicitly named current environment.
- Whether the work item is safe for Codex implementation.
- Whether the work item requires user/Core approval before any publication,
  approval, retry, replay, or external posting.

Use `docs/templates/current-runtime-work-item-intake.md` to collect these
inputs before starting implementation.

## Current Runtime Vs Demo Runtime

The current runtime is the user/Core-provided Augnes environment for the real
work item. It may be production/current local, current remote, or another
explicitly named current environment. The current runtime is not an ephemeral
demo runtime.

Ephemeral demo DB refs from `/tmp/augnes-runtime-dogfood.db` or
`/tmp/augnes-browser-verification.db` must not be mixed with current runtime
refs. Demo refs are useful for rehearsal only. Current runtime refs must come
from the provided current runtime URL and work item.

Do not reuse seeded demo work IDs, demo evidence IDs, demo proof/action IDs, or
demo work-event IDs as current-runtime facts. A future current-runtime dogfood
report may reference prior demo reports for background, but the current run's
trace refs must be returned by the provided current runtime.

## Start Gate For The Future Codex Run

The future run must start with:

```bash
git status --short
AUGNES_API_BASE_URL=<provided> CODEX_SCOPE=<provided> CODEX_WORK_ID=<provided> npm run codex:read-brief
```

If `codex:read-brief` fails, stop, report blocked, do not implement, do not open
a PR, and do not record proof/evidence.

If the work ID is missing or unknown, stop and report blocked. Do not guess a
work ID, substitute a demo work ID, or reconstruct missing work brief output.

If `codex:read-brief` succeeds, proceed only within the provided work brief and
the user/Core scope.

## Evidence Policy

Evidence recording is allowed only if the provided current runtime and
`CODEX_WORK_ID` are available and the user/Core explicitly allows evidence
recording.

Only report evidence IDs returned by the helper. Do not fabricate evidence IDs,
work IDs, action IDs, work-event IDs, session IDs, PR refs, or skipped check
results.

Evidence is not approval. Evidence rows are verification material only; they do
not commit/reject Augnes state, approve publication, approve retries or replays,
externally post, merge, or enable auto-merge.

## Proof-Only Closeout Policy

Proof-only closeout is allowed only if the current runtime and `CODEX_WORK_ID`
are available and the user/Core explicitly allows proof recording.

`CODEX_RESULT_KIND` must be accepted by `codex:record-completion-proof`, for
example `documentation` or `verification`. Dogfood labels such as
`runtime_backed_dogfood` belong in PR/report summaries, not as proof result
kind.

Only report proof/action IDs and work-event IDs returned by the helper. Proof
is not approval. Proof-only closeout records what Codex did; it does not create
committed Augnes state, durable approval, publication readiness, merge
authority, or user/Core approval.

## Browser Verification Policy

If the future work item changes UI/operator surfaces, use
`docs/templates/codex-browser-verification-report.md`.

If browser/computer-use verification is not applicable, the skipped reason must
be concrete, such as `browser verification skipped: docs-only change with no
rendered UI surface` or `browser verification skipped: no browser runtime
available`.

Browser/computer-use verification is observation only. It does not approve,
publish, retry, replay, externally post, merge, enable auto-merge, commit/reject
Augnes state, record proof, or record evidence.

## Authority Boundaries

- ChatGPT does not execute Codex.
- Codex does not commit/reject Augnes state.
- Codex does not approve, publish, retry, replay, externally post, merge, or
  enable auto-merge.
- Proof is not approval.
- Evidence is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.

## Recommended Future Run Outline

1. Read brief.
2. Make a tiny scoped change.
3. Run verification.
4. Record evidence if allowed.
5. Open a draft PR.
6. Record proof-only closeout if allowed.
7. Create a dogfood report.
8. If UI changed, create a browser verification report.
9. Stop and report any missing prerequisites instead of guessing.

## Non-Goals

This readiness PR does not create the current-runtime episode. It does not
create a work item. It does not call the runtime. It does not record
evidence/proof. It does not add active MCP config. It does not modify runtime,
schemas, routes, app tools, hooks, plugins, or UI.

This runbook also does not add database or schema changes, API route changes,
MCP/App tool schema changes, active MCP config, plugin MCP config, app mappings,
ChatGPT App UI/operator card implementation, browser automation,
screenshot-capture implementation, dependency changes, or secret-handling
changes.

## Blocked Outcomes

Stop and report blocked when any required input is missing or unsafe:

- `AUGNES_API_BASE_URL` missing.
- `CODEX_SCOPE` missing.
- `CODEX_WORK_ID` missing.
- `codex:read-brief` fails.
- Work ID is unknown to the provided current runtime.
- User/Core does not confirm the work item is safe for Codex implementation.
- Expected scope or forbidden files/surfaces are ambiguous.
- Evidence recording is requested but not explicitly allowed.
- Proof-only closeout is requested but not explicitly allowed.
- Publication, approval, retry, replay, or external posting is requested
  without explicit user/Core approval for that exact action.
