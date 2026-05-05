# HTTP Repo Navigation Validation

Status: passed  
Date: 2026-04-29  
Scope: Sprint 4E final slice, `POST /repo/navigate`

This note records HTTP-mode validation for Augnes Console repo navigation using the local development read API shim inside `Aurna-code/augnes/apps/augnes_apps`.

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
POST /repo/navigate
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

## Regression Check

Developer Mode prompt:

```text
Use the Augnes app only. Show the governance audit.
```

Observed result:

- Governance Audit widget rendered successfully.
- Read-only tools count remained 9.
- Gate-18: pass.
- Gate-19: pass.
- Gate-20: warn.
- Public profile summary-first rendering remained intact.

This confirms the previous strategy/governance slice remained intact after adding repo navigation.

## Successful Repo Navigation

Developer Mode prompt:

```text
Use the Augnes app only. Navigate the repo for "file adapter".
```

Observed result:

- widget rendered
- profile badge showed `profile: public`
- panel showed `Repo Navigation`
- query: `file adapter`
- search hits: 1
- explore hits: 0
- fetchable search hits: 1
- node: `repo:src/adapters/file-core.ts`
- node title: `src/adapters/file-core.ts file adapter`
- kind: `file`
- fetchable: `true`

Guidance remained visible:

- Search/Explore are view-only.
- Fetch source text before using a node as evidence.
- Repo navigation does not write canonical state.

This confirms repo navigation remains a view-only surface.

## Fetch Linkage

Developer Mode prompt:

```text
Use the Augnes app only. Fetch repo:src/adapters/file-core.ts.
```

Observed result:

- fetch succeeded
- id: `repo:src/adapters/file-core.ts`
- title: `File-backed adapter source pointer`
- profile: `public`
- tags: `repo`, `adapter`, `file-core`
- text confirmed this is a fixture repo index record pointing to `src/adapters/file-core.ts`
- text preserved the rule that repo search/explore remain view-only and fetchable records are still read-only evidence candidates

This confirms repo navigation and fetch linkage remain separated: navigation discovers pointers, while fetch retrieves the candidate record.

## Runtime Outage Behavior

The local read API shim was stopped while the MCP app remained running in HTTP mode.

Developer Mode prompt:

```text
Use the Augnes app only. Navigate the repo for "file adapter".
```

Observed result:

- tool call failed at runtime
- tool: `navigate_repo`
- profile: `public`
- mode: `http`
- read-only: `true`
- error message: `Augnes Core repo navigation endpoint is unavailable. Check the API base URL and server status.`

This confirms the desired failure boundary:

- read API outage does not break app startup
- failure is reported at tool-call time
- error payload is sanitized
- no secrets, provider session IDs, thread IDs, workspace IDs, run IDs, trace IDs, or auth identifiers are exposed

## Result Summary

| Check | Result |
|---|---|
| Previous governance behavior | pass |
| Dev read API `POST /repo/navigate` | pass |
| Developer Mode repo navigation success path | pass |
| Repo navigation remains view-only | pass |
| Fetch linkage for `repo:src/adapters/file-core.ts` | pass |
| Runtime outage returns sanitized repo navigation error | pass |
| Runtime outage does not kill MCP app | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

Sprint 4E final slice is complete.

The app can now validate all nine public tools through HTTP mode against the local development read API shim:

1. `get_working_view` -> `GET /working-view`
2. `open_casefile` -> `POST /casefile`
3. `search` -> `POST /search`
4. `fetch` -> `GET /fetch/:id`
5. `get_continuity_report` -> `GET /continuity-report`
6. `get_boundary_packet` -> `GET /boundary-packet`
7. `explain_strategy` -> `POST /strategy`
8. `get_governance_audit` -> `GET /governance-audit`
9. `navigate_repo` -> `POST /repo/navigate`

## Next Step

Create a consolidated HTTP local shim completion note, then decide between:

- continuing with Quick Tunnel while iterating on the Core-side implementation,
- deploying the MCP app and read API shim to a stable hosted environment,
- or moving directly into replacing shim-backed endpoints with real Core-backed read endpoints one at a time.

Production/stable URL, auth, OAuth, and CSP badge resolution remain separate deployment-readiness work, not blockers for local HTTP contract validation.
