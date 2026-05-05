# HTTP Strategy And Governance Validation

Status: passed  
Date: 2026-04-29  
Scope: Sprint 4E fifth slice, `POST /strategy` and `GET /governance-audit`

This note records HTTP-mode validation for Augnes Console strategy rationale and governance audit using the local development read API shim inside `Aurna-code/augnes/apps/augnes_apps`.

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
POST /search
GET /fetch/:id
GET /continuity-report
GET /boundary-packet
POST /strategy
GET /governance-audit
```

Terminal 2: Augnes MCP app in HTTP mode.

```bash
AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://127.0.0.1:3000 \
npm start
```

Terminal 3: Quick Tunnel for ChatGPT Developer Mode.

```bash
cloudflared tunnel --url http://localhost:8787
```

## Regression Checks

Developer Mode prompts:

```text
Use the Augnes app only. Show the latest continuity report.
Use the Augnes app only. Show the latest boundary packet.
```

Observed result:

- Continuity Report widget still rendered successfully.
- Boundary Packet widget still rendered successfully.
- Profile remained `public`.
- HTTP mode remained active.

This confirms the previous continuity and boundary slice remained intact after adding strategy and governance endpoints.

## Successful Strategy Read

Developer Mode prompt:

```text
Use the Augnes app only. Explain strategy for the latest casefile.
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Strategy`
- recommended action: `VERIFY`
- subject: `casefile-augnes-console-public-app`
- why count: 3
- Meta-WM section present
- EOP section present
- Rubric section present
- Estimated effort section present
- explicit warning preserved: `Strategy Rationale is Control/View context, not evidence or truth.`

This confirms strategy remains a Control/View surface and is not promoted to truth or evidence.

## Successful Governance Audit Read

Developer Mode prompt:

```text
Use the Augnes app only. Show the governance audit.
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Governance Audit`
- read-only tools: 9
- Gate-18: pass
- Gate-19: pass
- Gate-20: warn
- public profile rendered summary-first view
- detail notice preserved: `Detailed audit is available in Chrono Lab.`

This confirms governance remains a read-only review surface, not a policy writer or hidden enforcement engine.

## Runtime Outage Behavior

The local read API shim was stopped while the MCP app remained running in HTTP mode.

Developer Mode prompt:

```text
Use the Augnes app only. Explain strategy for the latest casefile.
```

Observed result for strategy outage:

- tool call failed at runtime
- tool: `explain_strategy`
- profile: `public`
- mode: `http`
- read-only: `true`
- error message: `Augnes Core strategy rationale endpoint is unavailable. Check the API base URL and server status.`

This confirms the desired failure boundary:

- read API outage does not break app startup
- failure is reported at tool-call time
- error payload is sanitized
- no secrets, provider session IDs, thread IDs, workspace IDs, run IDs, trace IDs, or auth identifiers are exposed

## Result Summary

| Check | Result |
|---|---|
| Previous continuity behavior | pass |
| Previous boundary behavior | pass |
| Dev read API `POST /strategy` | pass |
| Dev read API `GET /governance-audit` | pass |
| Developer Mode strategy success path | pass |
| Developer Mode governance success path | pass |
| Strategy remains Control/View only | pass |
| Governance remains read-only review surface | pass |
| Runtime outage returns sanitized strategy error | pass |
| Runtime outage does not kill MCP app | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

Sprint 4E fifth slice is complete.

The app can now validate Working View, Casefile, Search, Fetch, Continuity Report, Boundary Packet, Strategy Rationale, and Governance Audit through HTTP mode against the local read API shim.

## Next Step

Proceed to the final public tool endpoint:

```http
POST /repo/navigate
```

Acceptance criteria for the next slice:

- local read API implements `POST /repo/navigate`
- response validates against `RepoNavigationResultSchema`
- MCP app in HTTP mode can call `navigate_repo`
- repo navigation remains view-only
- fetch remains the path for source/evidence candidates
- `repo:src/adapters/file-core.ts` remains fetchable through `GET /fetch/:id`
- stopping the read API returns sanitized runtime tool error
- existing Working View, Casefile, Search, Fetch, Continuity, Boundary, Strategy, and Governance behavior remains unchanged
