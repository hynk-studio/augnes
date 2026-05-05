# HTTP Casefile Validation

Status: passed  
Date: 2026-04-29  
Scope: Sprint 4E second slice, `POST /casefile`

This note records HTTP-mode validation for the Augnes Console `open_casefile` tool using the local development read API shim inside `Aurna-code/augnes/apps/augnes_apps`.

The legacy `augnes-core` repository was not used.

## Runtime Topology

Terminal 1: local development read API shim.

```bash
npm run dev:read-api
```

Expected local read API endpoints after this slice:

```text
GET /healthz
GET /working-view
POST /casefile
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

## Regression: Working View

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

This confirms the previous `GET /working-view` slice remained intact after adding `POST /casefile`.

## Successful Casefile Read

Developer Mode prompt:

```text
Use the Augnes app only. Open the latest casefile.
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Casefile`
- subject: `Augnes Console public read-only app`
- casefile id: `casefile-augnes-console-public-app`
- supporting evidence count: 3
- contradicting evidence count: 1
- unresolved questions count: 2
- recent changes count: 3

Visible supporting evidence:

- `evidence-readonly-public-surface`
- `evidence-file-backed-working-view`
- `evidence-file-backed-casefile`

Visible contradicting evidence:

- `evidence-http-api-not-final`

The visible payload matched the `CasefileSchema` fixture returned through the local HTTP read API shim.

## Runtime Outage Behavior

The local read API shim was stopped while the MCP app remained running in HTTP mode.

Developer Mode prompt:

```text
Use the Augnes app only. Open the latest casefile.
```

Observed result:

- MCP app stayed alive
- widget rendered a `Tool Error` panel
- tool: `open_casefile`
- mode: `http`
- profile: `public`
- read-only: `true`
- error message: `Augnes Core casefile endpoint is unavailable. Check the API base URL and server status.`

This confirms the desired failure boundary:

- read API outage does not break app startup
- failure is reported at tool-call time
- error payload is sanitized
- no secrets, provider session IDs, thread IDs, workspace IDs, run IDs, trace IDs, or auth identifiers are exposed

## Result Summary

| Check | Result |
|---|---|
| Previous `GET /working-view` behavior | pass |
| Dev read API `POST /casefile` | pass |
| MCP app `AUGNES_CORE_MODE=http` | pass |
| Developer Mode `open_casefile` success path | pass |
| Widget render on success | pass |
| Text fallback on success | pass |
| Runtime outage does not kill MCP app | pass |
| Runtime outage returns tool error | pass |
| Error panel preserves mode/profile/read-only fields | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

Sprint 4E second slice is complete.

The app can now validate both `get_working_view` and `open_casefile` through HTTP mode against the local read API shim.

## Next Step

Proceed to evidence linkage endpoints as a paired slice:

```http
POST /search
GET /fetch/:id
```

Acceptance criteria for the next slice:

- local read API implements `POST /search` with `{ "query": "...", "scope": [...], "timeRange": "..." }`
- local read API implements `GET /fetch/:id`
- search response validates against `SearchResultSchema.array()`
- fetch response validates against `FetchResultSchema`
- MCP app in HTTP mode can call `search`
- MCP app in HTTP mode can call `fetch`
- search/fetch linkage works for `evidence-readonly-public-surface`
- fetch works for `repo:src/adapters/file-core.ts`
- stopping the read API returns sanitized runtime tool errors
- existing `GET /working-view` and `POST /casefile` behavior remains unchanged
