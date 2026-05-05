# HTTP Working View Validation

Status: passed  
Date: 2026-04-29  
Scope: Sprint 4E first slice, `GET /working-view`

This note records the first HTTP-mode validation slice for the Augnes Evidence & Continuity Console.

The validation intentionally does not reference the legacy `augnes-core` repository. The HTTP seam is validated inside `Aurna-code/augnes/apps/augnes_apps` using the local development read API shim.

## Runtime Topology

Terminal 1: local development read API shim.

```bash
npm run dev:read-api
```

Expected local read API endpoints:

```text
GET /healthz
GET /working-view
```

Terminal 2: Augnes MCP app in HTTP mode.

```bash
AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://127.0.0.1:3000 \
npm start
```

Expected MCP health:

```json
{
  "mode": "http",
  "readOnly": true,
  "profile": "public"
}
```

Terminal 3: Quick Tunnel for ChatGPT Developer Mode.

```bash
cloudflared tunnel --url http://localhost:8787
```

Developer Mode MCP URL shape:

```text
https://<trycloudflare-host>/mcp
```

## Successful Working View Read

Developer Mode prompt:

```text
Use the Augnes app only. Show my current working view.
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Working View`
- claims count: 2
- top evidence count: 2
- active pointers count: 3
- active pointers included:
  - `casefile:casefile-augnes-console-public-app`
  - `boundary:read-first-v1`
  - `repo:src/adapters/file-core.ts`

The visible payload matched the `WorkingViewSchema` fixture returned through the local HTTP read API shim.

## Runtime Outage Behavior

The local read API shim was stopped while the MCP app remained running in HTTP mode.

Developer Mode prompt:

```text
Use the Augnes app only. Show my current working view.
```

Observed result:

- MCP app stayed alive
- widget rendered a `Tool Error` panel
- tool: `get_working_view`
- mode: `http`
- profile: `public`
- read-only: `true`
- error message: `Augnes Core working view endpoint is unavailable. Check the API base URL and server status.`

This confirms the desired failure boundary:

- Core/read API outage does not break app startup.
- Failure is reported at tool-call time.
- Error payload is sanitized and does not expose secrets, tokens, provider session IDs, thread IDs, workspace IDs, run IDs, or auth identifiers.

## Result Summary

| Check | Result |
|---|---|
| Dev read API `GET /working-view` | pass |
| MCP app `AUGNES_CORE_MODE=http` | pass |
| Developer Mode `get_working_view` success path | pass |
| Widget render on success | pass |
| Text fallback on success | pass |
| Runtime outage does not kill MCP app | pass |
| Runtime outage returns tool error | pass |
| Error panel preserves mode/profile/read-only fields | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

Sprint 4E first slice is complete.

The app can now validate `get_working_view` through HTTP mode against a local read API shim. This provides the seam needed to replace file-backed fixtures endpoint-by-endpoint without introducing startup dependency on a live Core backend.

## Next Step

Proceed to the second HTTP read endpoint:

```http
POST /casefile
```

Acceptance criteria for the next slice:

- local read API implements `POST /casefile` with `{ "subject": "..." }`
- response validates against `CasefileSchema`
- MCP app in HTTP mode can call `open_casefile`
- success widget renders the casefile panel
- stopping the read API returns a sanitized runtime tool error
- existing `GET /working-view` behavior remains unchanged

Implementation order remains:

1. `GET /working-view` — complete
2. `POST /casefile`
3. `POST /search`
4. `GET /fetch/:id`
5. `GET /continuity-report`
6. `GET /boundary-packet`
7. `POST /strategy`
8. `GET /governance-audit`
9. `POST /repo/navigate`
