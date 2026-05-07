# Work Tools Live Validation

Use this checklist to validate the Work Trace Spine tools in ChatGPT Developer Mode.
It is the work-level counterpart to the project-level state brief and agent handoff
validation flow.

The intended live flow is:

```text
ChatGPT Developer Mode
-> augnes_list_work_items
-> augnes_get_work_brief for AG-001
-> ChatGPT summarizes AG-001 from structuredContent only
-> augnes_record_work_event
-> /api/work/AG-001/brief shows the recorded event
-> Runtime Cockpit Work Focus shows the recorded event
```

## Guardrails

- Treat `work_id` as a trace anchor, not state authority.
- Durable state authority remains Augnes committed state.
- Official execution proof remains `action_records` and the Temporal State Graph.
- `work_events` are human-readable trace notes linked to proof when relevant.
- `augnes_record_work_event` must not commit or reject state proposals.
- Do not add ChatGPT App commit/reject tools.

## Local Runtime

From the repository root:

```bash
npm run db:reset
npm run db:migrate
npm run demo:seed
npm run dev -- --port 3000
```

If local Turbopack root inference fails because of a parent lockfile, use:

```bash
npm run dev -- --port 3000 --webpack
```

Verify the runtime APIs:

```bash
curl -sS "http://localhost:3000/api/work?scope=project:augnes" | jq .
curl -sS "http://localhost:3000/api/work/AG-001?scope=project:augnes" | jq .
curl -sS "http://localhost:3000/api/work/AG-001/brief?scope=project:augnes" | jq .
```

Expected:

- AG-001 is present.
- AG-001 is post-merge work, not an implementation request.
- The AG-001 brief framing says `work_id` is a trace anchor only.
- Related proof includes PR #38.

## Local Work Event Smoke

Record a local API event before the ChatGPT Developer Mode run:

```bash
curl -sS -X POST "http://localhost:3000/api/work/AG-001/events?scope=project:augnes" \
  -H "content-type: application/json" \
  -d '{
    "actor": "codex",
    "event_type": "verification",
    "summary": "Local API smoke confirmed AG-001 work event recording for the Work Trace Spine validation flow.",
    "result_status": "completed",
    "result_kind": "verification",
    "related_pr": "https://github.com/Aurna-code/augnes/pull/38",
    "related_state_keys": ["integration.chatgpt_app", "implementation.stack"]
  }' | jq .
```

Then verify it appears:

```bash
curl -sS "http://localhost:3000/api/work/AG-001/brief?scope=project:augnes" | jq '.recent_events[0]'
```

## Bridge Startup

From `apps/augnes_apps`, run the bridge with the work write tool enabled:

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run dev
```

Confirm bridge health:

```bash
curl -sS "http://localhost:8787/healthz" | jq .
```

Tool surface expectations:

- Default/public mode includes `augnes_list_work_items`.
- Default/public mode includes `augnes_get_work_brief`.
- Default/public mode does not include `augnes_record_work_event`.
- Bridge mode with `AUGNES_ENABLE_AGENT_BRIDGE=true` includes `augnes_record_work_event`.
- `augnes_record_work_event` response text says no state deltas were committed or rejected.

Local smoke covers these expectations:

```bash
cd apps/augnes_apps
npm run typecheck
npm run smoke
```

Optional MCP Inspector:

```bash
cd apps/augnes_apps
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run inspect
```

The inspector target is:

```text
http://localhost:8787/mcp
```

## HTTPS Tunnel

ChatGPT Developer Mode needs HTTPS. Expose the bridge on port `8787`:

```bash
cloudflared tunnel --url http://localhost:8787
```

Register this endpoint in ChatGPT Developer Mode:

```text
https://<tunnel-host>/mcp
```

If the tunnel restarts, register the new host because quick tunnel URLs are temporary.

## Developer Mode Prompt 1

```text
Use the Augnes app to list work items for scope project:augnes. Then get the work brief for AG-001. Summarize AG-001 from structuredContent only: status, next action, recent events, related proof, and Codex handoff. Explicitly state that work_id is a trace anchor, not state authority.
```

Pass criteria:

- ChatGPT calls `augnes_list_work_items`.
- ChatGPT calls `augnes_get_work_brief` with `workId: AG-001`.
- The answer is grounded in work brief `structuredContent`, not pasted context.
- The answer states that `work_id` is a trace anchor, not state authority.
- The answer does not imply ChatGPT can commit or reject state.

## Developer Mode Prompt 2

```text
Use augnes_record_work_event to record this live validation result for AG-001:

scope: project:augnes
workId: AG-001
actor: chatgpt
eventType: verification
summary: Live ChatGPT Developer Mode validation confirmed augnes_list_work_items, augnes_get_work_brief, and augnes_record_work_event for the Work Trace Spine flow.
resultStatus: completed
resultKind: verification
relatedPr: https://github.com/Aurna-code/augnes/pull/38
relatedStateKeys: integration.chatgpt_app, implementation.stack
```

Pass criteria:

- ChatGPT calls `augnes_record_work_event`.
- The tool response includes the recorded AG-001 event.
- The tool response text states that no state deltas were committed or rejected.

## Runtime Verification

After prompt 2, verify the recorded event through the runtime API:

```bash
curl -sS "http://localhost:3000/api/work/AG-001/brief?scope=project:augnes" \
  | jq '.recent_events[] | select(.summary == "Live ChatGPT Developer Mode validation confirmed augnes_list_work_items, augnes_get_work_brief, and augnes_record_work_event for the Work Trace Spine flow.")'
```

Expected:

- `actor` is `chatgpt`.
- `event_type` is `verification`.
- `result_status` is `completed`.
- `result_kind` is `verification`.
- `related_pr` is `https://github.com/Aurna-code/augnes/pull/38`.

Then open the Runtime Cockpit:

```text
http://localhost:3000
```

Select AG-001 in Work Focus and confirm the recent event appears.

## Failure Modes

Runtime API does not respond:

- Confirm the runtime is running on port `3000`.
- Rerun `npm run db:reset`, `npm run db:migrate`, and `npm run demo:seed`.
- Use `npm run dev -- --port 3000 --webpack` if Turbopack root inference fails locally.

Bridge tool is missing:

- Confirm `AUGNES_ENABLE_AGENT_BRIDGE=true` for `augnes_record_work_event`.
- Restart the bridge after changing environment variables.
- Run `npm run smoke` in `apps/augnes_apps` to confirm expected tool surfaces.

Developer Mode cannot connect:

- Register `https://<tunnel-host>/mcp`, not the tunnel root.
- Confirm the tunnel points to `http://localhost:8787`.
- Restart the tunnel and update Developer Mode if the quick tunnel host changed.

Recorded event does not appear:

- Confirm prompt 2 used `scope: project:augnes` and `workId: AG-001`.
- Check `/api/work/AG-001/brief?scope=project:augnes`.
- Refresh the Runtime Cockpit Work Focus after recording.

ChatGPT treats work as state authority:

- Stop the validation and restate the guardrail: `work_id` is a trace anchor only.
- Ask ChatGPT to answer from work brief `structuredContent.framing` before continuing.
