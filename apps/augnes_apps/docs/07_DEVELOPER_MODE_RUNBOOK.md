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
