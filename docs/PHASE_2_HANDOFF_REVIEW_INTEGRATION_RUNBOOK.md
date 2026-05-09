# Phase 2 Handoff Review Integration Runbook

This runbook documents the completed Phase 2 handoff and review loop before Phase 3 Mailbox Lite begins. It ties together the handoff registry, deterministic handoff generation, ChatGPT App bridge tools, Codex result review drafts, and the coordination event spine.

## Purpose

Phase 2 makes Augnes able to generate durable Codex handoff drafts and review reported Codex results against those handoffs.

It does not:

- execute Codex
- commit or reject Augnes state
- record proof automatically from result review
- publish externally
- create mailbox behavior

Handoff generation creates guidance. Result review creates interpretation and record drafts. Durable approval and official proof remain separate user-directed steps.

## Actor Boundaries

- User: owns durable approval and decides when proof should be recorded or state should be committed/rejected.
- Augnes Core: owns committed state, proof storage, handoff registry, coordination event spine, and commit/reject routes.
- ChatGPT Apps bridge: provides bridge-gated handoff draft and result review surfaces. It does not execute Codex or approve state.
- Codex: executes repo work, verification, and PR preparation outside the ChatGPT App tools.
- Cockpit: provides operator review and visualization. Phase 2 adds no Cockpit write controls.
- GitHub, Browser/Chrome, ChatGPT Developer Mode, and MCP Inspector: execution or verification surfaces only. They are not durable state authorities.

## End-To-End Phase 2 Flow

1. Start the local runtime from the repo root:

```bash
npm run db:reset
npm run db:migrate
npm run demo:seed
npm run dev -- --port 3000
```

2. Generate a durable draft handoff for a work ID:

```bash
curl -sS -X POST "http://localhost:3000/api/handoffs/generate" \
  -H "content-type: application/json" \
  -d '{
    "scope": "project:augnes",
    "work_id": "AG-006",
    "target_agent": "codex",
    "created_by": "chatgpt"
  }' | jq .
```

3. Confirm the durable draft handoff:

```bash
curl -sS "http://localhost:3000/api/handoffs?scope=project:augnes&work_id=AG-006" | jq .
```

4. Confirm the event spine recorded handoff creation:

```bash
curl -sS "http://localhost:3000/api/events?scope=project:augnes&event_type=handoff_created" | jq .
```

5. In bridge mode, use `augnes_generate_codex_handoff_draft` with:

```json
{
  "scope": "project:augnes",
  "workId": "AG-006",
  "targetAgent": "codex",
  "createdBy": "chatgpt"
}
```

The bridge tool calls `POST /api/handoffs/generate` and returns `structuredContent.handoff`, `structuredContent.packet_text`, expected impact fields, safety boundaries, and completion record fields.

6. Codex executes outside this tool. The handoff is copyable guidance for user-directed Codex work, not an execution trigger.

7. Review the reported Codex result:

```bash
curl -sS -X POST "http://localhost:3000/api/handoffs/review" \
  -H "content-type: application/json" \
  -d '{
    "scope": "project:augnes",
    "handoff_id": "handoff:...",
    "actual_files_changed": ["docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md"],
    "actual_state_keys": [
      "coordination.handoff_registry",
      "coordination.event_spine",
      "integration.chatgpt_app"
    ],
    "actual_checks": ["npm run typecheck"],
    "actual_execution_surfaces": ["local_runtime", "github"],
    "result_status": "completed",
    "result_kind": "documentation",
    "result_summary": "Documented the completed Phase 2 handoff and review loop.",
    "related_pr": "https://github.com/Aurna-code/augnes/pull/___",
    "skipped_checks": [
      {
        "check": "ChatGPT Developer Mode",
        "reason": "No tunnel or Developer Mode session was available."
      }
    ]
  }' | jq .
```

8. In bridge mode, use `augnes_review_codex_result_draft` with the camelCase equivalent:

```json
{
  "scope": "project:augnes",
  "handoffId": "handoff:...",
  "actualFilesChanged": ["docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md"],
  "actualStateKeys": [
    "coordination.handoff_registry",
    "coordination.event_spine",
    "integration.chatgpt_app"
  ],
  "actualChecks": ["npm run typecheck"],
  "actualExecutionSurfaces": ["local_runtime", "github"],
  "resultStatus": "completed",
  "resultKind": "documentation",
  "resultSummary": "Documented the completed Phase 2 handoff and review loop.",
  "relatedPr": "https://github.com/Aurna-code/augnes/pull/___"
}
```

9. Confirm the review output includes:

- `review`
- `action_record_draft`
- `work_event_draft`

10. Confirm review does not create:

- `action_records`
- `work_events`
- state commits or rejections
- handoff status updates

11. Only after explicit user decision, proof may be recorded separately through:

- `augnes_record_action_result`
- `augnes_record_work_event`
- `npm run codex:record-completion`

## API Summary

### `POST /api/handoffs/generate`

Request:

```json
{
  "scope": "project:augnes",
  "work_id": "AG-006",
  "target_agent": "codex",
  "created_by": "chatgpt"
}
```

Response shape:

```json
{
  "scope": "project:augnes",
  "handoff": {
    "handoff_id": "handoff:...",
    "work_id": "AG-006",
    "status": "draft",
    "expected_files": [],
    "expected_state_keys": [],
    "expected_checks": [],
    "expected_execution_surfaces": [],
    "safety_boundaries": [],
    "completion_record_fields": {}
  },
  "packet_text": "Codex Handoff Packet\n..."
}
```

### `GET /api/handoffs`

Request:

```bash
curl -sS "http://localhost:3000/api/handoffs?scope=project:augnes&work_id=AG-006" | jq .
```

Response shape:

```json
{
  "scope": "project:augnes",
  "handoffs": [
    {
      "handoff_id": "handoff:...",
      "work_id": "AG-006",
      "status": "draft"
    }
  ]
}
```

### `POST /api/handoffs/review`

Request:

```json
{
  "scope": "project:augnes",
  "handoff_id": "handoff:...",
  "actual_files_changed": ["docs/example.md"],
  "actual_state_keys": ["coordination.handoff_registry"],
  "actual_checks": ["npm run typecheck"],
  "actual_execution_surfaces": ["local_runtime"],
  "result_status": "completed",
  "result_kind": "documentation",
  "result_summary": "Summarize the reported Codex result.",
  "related_pr": "https://github.com/Aurna-code/augnes/pull/___",
  "blockers_or_failures": [],
  "skipped_checks": []
}
```

Response shape:

```json
{
  "scope": "project:augnes",
  "handoff": {
    "handoff_id": "handoff:..."
  },
  "review": {
    "review_id": "review:handoff:...:...",
    "files_match": "yes",
    "state_keys_match": "partial",
    "checks_match": "yes",
    "execution_surfaces_match": "partial",
    "mismatch_or_follow_up": [],
    "recommended_result_status": "completed",
    "recommended_result_kind": "documentation",
    "safety_boundary_notes": []
  },
  "action_record_draft": {
    "scope": "project:augnes",
    "source_agent_id": "agent:codex",
    "action_name": "codex_result_ag_006",
    "result_summary": "Summarize the reported Codex result.",
    "files_changed": ["docs/example.md"],
    "result_status": "completed",
    "result_kind": "documentation",
    "work_id": "AG-006",
    "related_state_keys": ["coordination.handoff_registry"]
  },
  "work_event_draft": {
    "scope": "project:augnes",
    "work_id": "AG-006",
    "actor": "codex",
    "event_type": "review",
    "summary": "Summarize the reported Codex result.",
    "result_status": "completed",
    "result_kind": "documentation",
    "related_action_id": null,
    "related_state_keys": ["coordination.handoff_registry"]
  }
}
```

### `GET /api/events`

Request:

```bash
curl -sS "http://localhost:3000/api/events?scope=project:augnes&event_type=result_review_created" | jq .
```

Response shape:

```json
{
  "scope": "project:augnes",
  "events": [
    {
      "event_type": "result_review_created",
      "authority_level": "interpretation_only",
      "payload_ref": "review:handoff:...:...",
      "result_status": "completed"
    }
  ]
}
```

### Bridge Tool: `augnes_generate_codex_handoff_draft`

Input:

```json
{
  "scope": "project:augnes",
  "workId": "AG-006",
  "targetAgent": "codex",
  "createdBy": "chatgpt"
}
```

Output includes:

- plain text stating the result is a guidance packet only
- `structuredContent.handoff`
- `structuredContent.packet_text`
- expected files, state keys, checks, execution surfaces, safety boundaries, and completion record fields

### Bridge Tool: `augnes_review_codex_result_draft`

Input:

```json
{
  "scope": "project:augnes",
  "handoffId": "handoff:...",
  "actualFilesChanged": ["docs/example.md"],
  "actualStateKeys": ["coordination.handoff_registry"],
  "actualChecks": ["npm run typecheck"],
  "actualExecutionSurfaces": ["local_runtime"],
  "resultStatus": "completed",
  "resultKind": "documentation",
  "resultSummary": "Summarize the reported Codex result."
}
```

Output includes:

- plain text stating the result is review/draft only
- `structuredContent.review`
- `structuredContent.action_record_draft`
- `structuredContent.work_event_draft`

## Authority Warnings

- A handoff draft is guidance, not execution.
- A review draft is interpretation, not proof.
- `action_record_draft` and `work_event_draft` are drafts only.
- `result_review_created` has `interpretation_only` authority.
- `action_result_recorded` is official execution proof only when an action record is actually created.
- `work_event_recorded` is a human-readable trace note only when a work event is actually created.
- Durable state remains user-gated through Augnes Core and Cockpit.
- ChatGPT App bridge tools do not add commit/reject authority.
- Codex execution, Browser/Chrome verification, Developer Mode checks, MCP Inspector checks, and GitHub PRs remain separate execution or verification surfaces.

## Phase 3 Handoff Note

Phase 2 gives Phase 3 concrete typed objects to route: durable handoff records, result review drafts, and coordination events.

Mailbox Lite should:

- manage handoff and review-needed message status
- avoid becoming free-form agent chat
- use the existing handoff registry, review drafts, and event spine
- preserve all Phase 2 authority boundaries
- keep durable approval user-gated
- avoid publisher behavior unless a later publisher phase explicitly scopes it

The next likely implementation slice is Phase 3 / PR 3.1: Mailbox Lite storage and API.
