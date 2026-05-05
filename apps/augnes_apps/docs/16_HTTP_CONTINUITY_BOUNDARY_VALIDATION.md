# HTTP Continuity And Boundary Validation

Status: passed  
Date: 2026-04-29  
Scope: Sprint 4E fourth slice, `GET /continuity-report` and `GET /boundary-packet`

This note records HTTP-mode validation for Augnes Console continuity and boundary linkage using the local development read API shim inside `Aurna-code/augnes/apps/augnes_apps`.

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
Use the Augnes app only. Show my current working view.
Use the Augnes app only. Open the latest casefile.
Use the Augnes app only. Search Augnes records for "read-only".
Use the Augnes app only. Fetch evidence-readonly-public-surface.
```

Observed result:

- Working View widget still rendered successfully.
- Casefile widget still rendered successfully.
- Search/fetch still worked.
- Profile remained `public`.
- HTTP mode remained active.

This confirms the previous Working View, Casefile, Search, and Fetch slices remained intact after adding continuity and boundary endpoints.

## Successful Continuity Read

Developer Mode prompt:

```text
Use the Augnes app only. Show the latest continuity report.
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Continuity Report`
- baseline class: `same_self`
- latest boundary: `boundary:read-first-v1`
- canary status: `warn`
- fail axes count: 1
- hard invariants count: 3
- transition retention count: 2

The visible payload matched the `ContinuityReportSchema` fixture returned through the local HTTP read API shim.

## Successful Boundary Read

Developer Mode prompt:

```text
Use the Augnes app only. Show the latest boundary packet.
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Boundary Packet`
- boundary id: `boundary:read-first-v1`
- snapshot id: `snapshot-read-first-v1`
- carry-forward candidates count: 3
- trace capsule candidates count: 1

Visible carry-forward candidates included:

- `carry-forward-read-first-public-app`
- `carry-forward-evidence-index-resolves`
- `carry-forward-continuity-file-mode`

This confirms that continuity `latestBoundaryId` resolves through the boundary packet endpoint.

## Runtime Outage Behavior

The local read API shim was stopped while the MCP app remained running in HTTP mode.

Developer Mode prompts:

```text
Use the Augnes app only. Show the latest continuity report.
Use the Augnes app only. Show the latest boundary packet.
```

Observed result for continuity outage:

- tool call failed at runtime
- tool: `get_continuity_report`
- profile: `public`
- mode: `http`
- read-only: `true`
- error message: `Augnes Core continuity report endpoint is unavailable. Check the API base URL and server status.`

Observed result for boundary outage:

- tool call failed at runtime
- tool: `get_boundary_packet`
- profile: `public`
- mode: `http`
- read-only: `true`
- error message: `Augnes Core boundary packet endpoint is unavailable. Check the API base URL and server status.`

This confirms the desired failure boundary:

- read API outage does not break app startup
- failure is reported at tool-call time
- error payload is sanitized
- no secrets, provider session IDs, thread IDs, workspace IDs, run IDs, trace IDs, or auth identifiers are exposed

## Result Summary

| Check | Result |
|---|---|
| Previous `GET /working-view` behavior | pass |
| Previous `POST /casefile` behavior | pass |
| Previous search/fetch behavior | pass |
| Dev read API `GET /continuity-report` | pass |
| Dev read API `GET /boundary-packet` | pass |
| Developer Mode continuity success path | pass |
| Developer Mode boundary success path | pass |
| `latestBoundaryId` resolves to boundary packet | pass |
| Runtime outage returns sanitized continuity error | pass |
| Runtime outage returns sanitized boundary error | pass |
| Runtime outage does not kill MCP app | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

Sprint 4E fourth slice is complete.

The app can now validate Working View, Casefile, Search, Fetch, Continuity Report, and Boundary Packet through HTTP mode against the local read API shim.

## Next Step

Proceed to Control/View and governance endpoints as a paired slice:

```http
POST /strategy
GET /governance-audit
```

Acceptance criteria for the next slice:

- local read API implements `POST /strategy`
- local read API implements `GET /governance-audit`
- strategy response validates against `StrategyRationaleSchema`
- governance response validates against `GovernanceAuditSchema`
- MCP app in HTTP mode can call `explain_strategy`
- MCP app in HTTP mode can call `get_governance_audit`
- strategy remains Control/View only and is not promoted to truth or evidence
- governance remains read-only review surface and is not a policy writer
- stopping the read API returns sanitized runtime tool errors
- existing Working View, Casefile, Search, Fetch, Continuity, and Boundary behavior remains unchanged
