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
observations with the Codex evidence helper:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root typecheck" \
CODEX_COMMAND="npm run typecheck" \
CODEX_RESULT_SUMMARY="TypeScript completed with no errors." \
npm run codex:record-evidence
```

The helper validates environment input before POST, defaults
`AUGNES_API_BASE_URL` to `http://localhost:3000`, defaults `CODEX_SCOPE` to
`project:augnes`, defaults `CODEX_SOURCE_SURFACE` to `codex`, defaults
`CODEX_CREATED_BY` to `codex`, validates `CODEX_METADATA_JSON` as a JSON object
string when provided, and then calls only `POST /api/evidence/records`.

Inputs:

- `CODEX_SCOPE`, optional, defaults to `project:augnes`
- `CODEX_WORK_ID`, `CODEX_PUBLICATION_ID`, `CODEX_DELIVERY_ID`, optional trace links
- `CODEX_TARGET_SURFACE`, `CODEX_TARGET_REF`, optional target links
- `CODEX_EVIDENCE_KIND`, required
- `CODEX_EVIDENCE_STATUS`, required
- `CODEX_EVIDENCE_LABEL`, required
- `CODEX_COMMAND`, required only for `command_run`
- `CODEX_RESULT_SUMMARY`, required
- `CODEX_SKIPPED_REASON`, required only for `check_skipped`
- `CODEX_OBSERVED_BEHAVIOR`, optional
- `CODEX_SOURCE_SURFACE`, optional, defaults to `codex`
- `CODEX_SOURCE_REF`, optional
- `CODEX_RELATED_ACTION_ID`, `CODEX_RELATED_WORK_EVENT_ID`, optional
- `CODEX_METADATA_JSON`, optional JSON object string
- `CODEX_CREATED_BY`, optional, defaults to `codex`

Allowed `evidence_kind` values are `command_run`, `check_passed`,
`check_failed`, `check_skipped`, `replay_observed`, and
`duplicate_block_observed`. `command_run` requires `command`; `check_skipped`
requires `skipped_reason`. Replay and duplicate-block records describe behavior
explicitly observed elsewhere; creating the record must not execute replay or
attempt a duplicate publish.

Common examples:

```bash
CODEX_EVIDENCE_KIND=check_passed \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Evidence Pack smoke" \
CODEX_RESULT_SUMMARY="npm run smoke:evidence-pack passed with fetch_calls: 0." \
npm run codex:record-evidence
```

```bash
CODEX_EVIDENCE_KIND=check_skipped \
CODEX_EVIDENCE_STATUS=skipped \
CODEX_EVIDENCE_LABEL="Browser screenshot check" \
CODEX_RESULT_SUMMARY="Browser screenshot check was not run." \
CODEX_SKIPPED_REASON="No browser runtime was available in this environment." \
npm run codex:record-evidence
```

```bash
CODEX_EVIDENCE_KIND=replay_observed \
CODEX_EVIDENCE_STATUS=observed \
CODEX_EVIDENCE_LABEL="Same-key replay observation" \
CODEX_PUBLICATION_ID="publication:..." \
CODEX_RESULT_SUMMARY="Same-key replay was observed outside this helper and returned the stored delivery artifact." \
CODEX_OBSERVED_BEHAVIOR="idempotent_replay=true and posted=false" \
npm run codex:record-evidence
```

```bash
CODEX_EVIDENCE_KIND=duplicate_block_observed \
CODEX_EVIDENCE_STATUS=blocked \
CODEX_EVIDENCE_LABEL="Different-key duplicate block observation" \
CODEX_TARGET_REF="Aurna-code/augnes#..." \
CODEX_RESULT_SUMMARY="A duplicate publish attempt observed outside this helper was blocked before posting." \
CODEX_OBSERVED_BEHAVIOR="HTTP 409 duplicate block" \
npm run codex:record-evidence
```

These records are observation traces only. They do not approve, publish, retry,
commit/reject state, mutate mailbox, call GitHub, call OpenAI, or create broad
correctness proof. Evidence Pack v0.1 reads matching records to distinguish
observed facts from remaining gaps.

The helper also accepts `CODEX_EVIDENCE_BATCH_JSON` as a JSON array of evidence
record inputs for low-friction batch recording. Batch mode still posts records
one at a time to the same local endpoint and does not add execution authority.

## Structured Evidence Recording Closeout

Every Codex implementation or review PR should try to leave structured
verification evidence rows after running checks. Use `npm run codex:record-evidence`
when a local Augnes runtime is available and the evidence API is reachable.
Keep the PR prose too; the rows make the same observations machine-readable for
Core and Evidence Pack.

Use these kinds consistently:

- `command_run`: exact command execution, such as `npm run typecheck` or
  `npm run build`, with `CODEX_COMMAND`.
- `check_passed`: higher-level check passed, such as a smoke script or Evidence
  Pack verification summary.
- `check_failed`: higher-level check failed, preserving the exact failure in
  `CODEX_RESULT_SUMMARY`.
- `check_skipped`: expected or requested check was skipped, with
  `CODEX_SKIPPED_REASON`.
- `replay_observed`: same-key replay behavior was actually observed elsewhere.
- `duplicate_block_observed`: duplicate-block behavior was actually observed
  elsewhere.

Command examples:

```bash
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root typecheck" \
CODEX_COMMAND="npm run typecheck" \
CODEX_RESULT_SUMMARY="npm run typecheck passed." \
npm run codex:record-evidence
```

```bash
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root build" \
CODEX_COMMAND="npm run build" \
CODEX_RESULT_SUMMARY="npm run build completed successfully." \
npm run codex:record-evidence
```

Smoke and skipped-check examples:

```bash
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=check_passed \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Evidence Pack smoke" \
CODEX_RESULT_SUMMARY="npm run smoke:evidence-pack passed with fetch_calls: 0." \
npm run codex:record-evidence
```

```bash
CODEX_WORK_ID=AG-___ \
CODEX_EVIDENCE_KIND=check_skipped \
CODEX_EVIDENCE_STATUS=skipped \
CODEX_EVIDENCE_LABEL="Browser screenshot check" \
CODEX_RESULT_SUMMARY="Browser screenshot check was not run." \
CODEX_SKIPPED_REASON="No browser runtime was available in this environment." \
npm run codex:record-evidence
```

Replay and duplicate examples are observation-only. Record them only after the
behavior was observed through another explicit, approved process; the evidence
helper must not execute replay or attempt duplicate publish:

```bash
CODEX_PUBLICATION_ID="publication:..." \
CODEX_EVIDENCE_KIND=replay_observed \
CODEX_EVIDENCE_STATUS=observed \
CODEX_EVIDENCE_LABEL="Same-key replay observation" \
CODEX_RESULT_SUMMARY="Same-key replay was observed elsewhere and returned the stored artifact." \
CODEX_OBSERVED_BEHAVIOR="idempotent_replay=true and posted=false" \
npm run codex:record-evidence
```

After recording, copy the returned `evidence_id` values into the PR template's
Structured Evidence Records section and the Reality Feedback Report. If local
runtime or `/api/evidence/records` is unavailable, do not fabricate rows. State
the exact skipped reason, such as `local runtime unavailable`, `evidence API
unavailable`, `docs-only PR`, or `external check not applicable`.

Evidence records are observation traces. They do not approve, publish, replay,
retry, commit or reject state, call GitHub, call OpenAI, mutate mailbox, or
prove broad correctness beyond the exact command/check summary recorded.

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
