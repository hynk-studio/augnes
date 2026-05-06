# Developer Mode Runbook

Use this runbook to validate the public Augnes ChatGPT App surface in ChatGPT Developer Mode.

## Preconditions

- The app remains strictly read-only.
- The public tool list is exactly `search`, `fetch`, `open_casefile`, `get_working_view`, `explain_strategy`, `get_boundary_packet`, `get_continuity_report`, `navigate_repo`, and `get_governance_audit`.
- `npm run typecheck`, `npm run smoke`, and `npm run invariants` pass locally before Developer Mode validation.

## Local Server

```bash
npm install
npm run typecheck
npm run smoke
npm run invariants
npm run dev
```

Confirm health:

```bash
curl http://localhost:8787/healthz
```

Default mode is `mock`. Use `AUGNES_USE_MOCK=false` only when validating against a reachable read-only Augnes Core backend.

## Live Agent Bridge Checklist

Use this checklist only for local Developer Mode validation of the ChatGPT App coordination layer. The public default app remains read-only unless `AUGNES_ENABLE_AGENT_BRIDGE=true` is set.

1. Start the Augnes runtime from the repository root on port `3000`.

```bash
npm run dev -- --port 3000
```

Confirm the runtime state brief responds:

```bash
curl "http://localhost:3000/api/state/brief?scope=project:augnes"
```

2. Start the MCP bridge from `apps/augnes_apps` on port `8787` with the agent bridge enabled.

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm run dev
```

Confirm bridge health:

```bash
curl http://localhost:8787/healthz
```

3. Expose the local bridge through an HTTPS tunnel for ChatGPT Developer Mode.

```text
https://<tunnel-host>/mcp
```

4. Add the HTTPS `/mcp` endpoint in ChatGPT Developer Mode and confirm the bridge-only tools appear, including `augnes_get_state_brief` and `augnes_record_action_result`.

5. Call `augnes_get_state_brief` with:

```json
{
  "scope": "project:augnes"
}
```

6. Ask ChatGPT for a state summary and verify it answers from `structuredContent.brief.agent_handoff`, especially:

- `current_status`
- `next_recommended_action`
- `blockers_or_tensions`

7. Ask ChatGPT to generate a Codex handoff and verify it uses:

- `codex_handoff.task_brief`
- `codex_handoff.constraints`
- `codex_handoff.verification_commands`
- `codex_handoff.action_record_template`

8. After Codex or a human completes the task, call `augnes_record_action_result` with a payload based on the handoff template.

9. Verify the Temporal State Graph action node:

- Refresh `http://localhost:3000`.
- Confirm the external action is visible in the Runtime Cockpit graph.
- Or fetch `/api/state/brief` again and confirm `recent_actions` reflects the recorded action.

## HTTPS Exposure

Expose the local MCP endpoint through an HTTPS tunnel such as ngrok or Cloudflare Tunnel.

The Developer Mode endpoint should be:

```text
https://<tunnel-host>/mcp
```

Do not expose any additional write-capable profile from this app during submission validation.

## Developer Mode Checks

1. Add the HTTPS `/mcp` endpoint in ChatGPT Developer Mode.
2. Confirm the app registers without extra tools.
3. Invoke all nine public tools once.
4. Confirm widget-backed tools render in the Augnes console shell.
5. Confirm model-only tools return useful text and structured content.
6. Confirm no tool offers create, update, delete, send, job, action, promote, apply, or automation behavior.
7. Save screenshots or notes under `validation/` if evidence is needed; do not commit transient validation artifacts unless intentionally requested.

## Failure Handling

- If a tool fails in HTTP mode, confirm the returned error is sanitized and does not include provider/session/auth/debug values.
- If the widget fails to render, first recheck tunnel HTTPS, CSP origins, and `AUGNES_APP_DOMAIN`.
- If Developer Mode shows an unexpected tool, stop and fix the registered tool surface before continuing.
