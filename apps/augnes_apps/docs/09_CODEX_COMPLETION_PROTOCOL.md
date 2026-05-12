# Codex Completion Protocol

Use this runbook when Codex finishes repo work, verification, review, screenshots, or a handoff that should be visible in Augnes after the PR/task.

The protocol records two linked layers:

- `action_records` are official execution proof. They feed recent actions and the Temporal State Graph.
- `work_events` are human-readable trace notes attached to a `work_id`.

`work_id` is only a trace anchor. Durable state authority remains Augnes committed state, and this protocol does not commit or reject state proposals.

## Related Trace Docs

Use the root docs and PR template when preparing Codex work:

- `docs/AUTHORITY_MATRIX.md` defines which actor can read state, propose, record proof, commit/reject, edit repo, use Browser/Chrome, and open PRs.
- `docs/CODEX_HANDOFF_PACKET.md` defines the copy-pasteable packet ChatGPT App or Augnes can give Codex without turning ChatGPT App into a Codex controller.
- `docs/VERIFICATION_EVIDENCE_PACK.md` defines command, Browser/Chrome, ChatGPT Developer Mode, MCP/widget, and artifact evidence expectations.
- `docs/EXECUTION_SURFACE_RECORD.md` defines canonical execution surface names such as `github`, `browser`, `chrome`, `chatgpt_developer_mode`, `mcp_inspector`, and `local_runtime`.
- `docs/EXPECTED_IMPACT_CHECK.md` defines the expected files/state keys/surfaces/checks vs actual files/state keys/surfaces/checks comparison.
- `.github/pull_request_template.md` captures the PR Trace Template for review.

## Helper Command

Start the local runtime from the repository root:

```bash
npm run db:reset
npm run db:migrate
npm run demo:seed
npm run dev -- --port 3000
```

If local Turbopack root inference fails, use:

```bash
npm run dev -- --port 3000 --webpack
```

Record completion:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_SOURCE_AGENT_ID=agent:codex \
CODEX_ACTION_NAME=ag_004_codex_completion_protocol \
CODEX_RESULT_SUMMARY="Codex implemented and verified the AG-004 completion protocol." \
CODEX_FILES_CHANGED="apps/augnes_apps/scripts/codex-record-completion.ts,apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md,apps/augnes_apps/README.md,apps/augnes_apps/package.json,package.json,scripts/demo-seed.mjs" \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=implementation \
CODEX_RELATED_PR="https://github.com/Aurna-code/augnes/pull/..." \
CODEX_RELATED_STATE_KEYS="integration.chatgpt_app,implementation.stack" \
npm run codex:record-completion
```

`CODEX_WORK_ID` is normalized to uppercase. Before writing any action record, the helper preflights the trace anchor with `GET /api/work/{CODEX_WORK_ID}?scope=<scope>`. Unknown or unavailable work IDs fail before `/api/actions/record`, which prevents orphan `action_records` caused by mistyped work IDs.

`CODEX_FILES_CHANGED=""` records an empty file list. `CODEX_FILES_CHANGED` and `CODEX_RELATED_STATE_KEYS` may be comma-separated strings or JSON string arrays.

`CODEX_RELATED_PR` and `CODEX_RELATED_STATE_KEYS` are the core trace fields that connect GitHub history back to Augnes continuity. `CODEX_RELATED_PR` points from the work event to the PR where Codex changed or verified the repo. `CODEX_RELATED_STATE_KEYS` names the committed state lanes or expected state lanes the work depended on, affected, or verified. Together with `CODEX_WORK_ID`, they let reviewers move from PR, to work trace, to state graph without giving GitHub or ChatGPT App authority over committed Augnes state.

Allowed `CODEX_RESULT_STATUS` values:

- `completed`
- `failed`
- `blocked`
- `partial`
- `needs_review`

Allowed `CODEX_RESULT_KIND` values:

- `implementation`
- `verification`
- `documentation`
- `screenshot`
- `handoff`
- `review`
- `other`

Preserve the real result status. Failed, blocked, partial, and needs-review work must not be dressed up as completed.

The helper checks that `CODEX_WORK_ID` exists, then records `/api/actions/record`, then records `/api/work/{work_id}/events`. If the work ID preflight fails, no action record is created. If action recording fails, it stops and does not record the work event. If the action response includes an action record ID, the helper passes it to the work event as `related_action_id`.

The helper never calls commit/reject routes and never creates autonomous execution, GitHub sync, Discord sync, or workflow orchestration.

## Structured Verification Evidence

When the local runtime is available, Codex may also record bounded verification
observations through:

```bash
curl -sS -X POST "http://localhost:3000/api/evidence/records" \
  -H "content-type: application/json" \
  -d '{
    "scope": "project:augnes",
    "work_id": "AG-004",
    "evidence_kind": "command_run",
    "label": "Root typecheck",
    "status": "passed",
    "command": "npm run typecheck",
    "result_summary": "TypeScript completed with no errors.",
    "source_surface": "codex",
    "source_ref": "PR verification log",
    "created_by": "codex"
  }' | jq .
```

Allowed `evidence_kind` values are `command_run`, `check_passed`,
`check_failed`, `check_skipped`, `replay_observed`, and
`duplicate_block_observed`. `command_run` requires `command`; `check_skipped`
requires `skipped_reason`. Replay and duplicate-block records describe behavior
explicitly observed elsewhere; creating the record must not execute replay or
attempt a duplicate publish.

These records are observation traces only. They do not approve, publish, retry,
commit/reject state, mutate mailbox, call GitHub, call OpenAI, or create broad
correctness proof. Evidence Pack v0.1 reads matching records to distinguish
observed facts from remaining gaps.

## Manual Fallback

If the helper is unavailable, confirm the work ID exists before recording the action result:

```bash
curl -sS "http://localhost:3000/api/work/AG-004?scope=project:augnes" | jq .
```

Then record the action result:

```bash
curl -sS -X POST "http://localhost:3000/api/actions/record" \
  -H "content-type: application/json" \
  -d '{
    "scope": "project:augnes",
    "source_agent_id": "agent:codex",
    "action_name": "ag_004_codex_completion_protocol",
    "result_summary": "Codex implemented and verified the AG-004 completion protocol.",
    "files_changed": [
      "apps/augnes_apps/scripts/codex-record-completion.ts",
      "apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md"
    ],
    "result_status": "completed",
    "result_kind": "implementation"
  }' | jq .
```

Then record the trace note. Copy the returned action record ID into `related_action_id` when available:

```bash
curl -sS -X POST "http://localhost:3000/api/work/AG-004/events?scope=project:augnes" \
  -H "content-type: application/json" \
  -d '{
    "scope": "project:augnes",
    "actor": "codex",
    "event_type": "implementation",
    "summary": "Codex implemented and verified the AG-004 completion protocol.",
    "result_status": "completed",
    "result_kind": "implementation",
    "related_action_id": "action:...",
    "related_pr": "https://github.com/Aurna-code/augnes/pull/...",
    "related_state_keys": ["integration.chatgpt_app", "implementation.stack"]
  }' | jq .
```

`GET /api/work/{work_id}` and `POST /api/work/{work_id}/events` fail for an unknown work item. Do not hide that failure; use an existing seeded `work_id` or add a minimal deterministic seed item when that is the intended demo continuity path.

## Verification

Confirm the work event is attached to the trace anchor:

```bash
curl -sS "http://localhost:3000/api/work/AG-004/brief?scope=project:augnes" | jq '.recent_events[0]'
```

Confirm the action record is visible in recent actions:

```bash
curl -sS "http://localhost:3000/api/state/brief?scope=project:augnes" | jq '.recent_actions[0]'
```

Open the Runtime Cockpit and confirm Work Focus shows the event. When applicable, confirm the Temporal State Graph shows the official action result transition, such as:

```text
external.ag_004_codex_completion_protocol_recorded
```

For PR work, include the Verification Evidence Pack, Execution Surface Record, and Expected Impact vs Actual Result Check in the PR body or completion summary. If Browser/Chrome, ChatGPT Developer Mode, MCP Inspector, or local runtime checks are unavailable, record the exact skipped reason.
