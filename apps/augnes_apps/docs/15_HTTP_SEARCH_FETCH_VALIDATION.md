# HTTP Search And Fetch Validation

Status: passed  
Date: 2026-04-29  
Scope: Sprint 4E third slice, `POST /search` and `GET /fetch/:id`

This note records HTTP-mode validation for Augnes Console search/fetch evidence linkage using the local development read API shim inside `Aurna-code/augnes/apps/augnes_apps`.

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
```

Observed result:

- Working View widget still rendered successfully.
- Casefile widget still rendered successfully.
- Profile remained `public`.
- HTTP mode remained active.

This confirms the previous `GET /working-view` and `POST /casefile` slices remained intact after adding search/fetch.

## Successful Search

Developer Mode prompt:

```text
Use the Augnes app only. Search Augnes records for "read-only".
```

Observed result:

- tool call succeeded
- profile: `public`
- search returned 5 matching records
- returned IDs included:
  - `evidence-readonly-public-surface`
  - `evidence-file-backed-working-view`
  - `evidence-file-backed-casefile`
  - `casefile-augnes-console-public-app`
  - `repo:src/adapters/file-core.ts`

The broader result set is acceptable because the normalized search matches record IDs, titles, text, tags, kind, source, and metadata values. The key pass criterion is that `evidence-readonly-public-surface` is discoverable and can be fetched.

## Successful Evidence Fetch

Developer Mode prompt:

```text
Use the Augnes app only. Fetch evidence-readonly-public-surface.
```

Observed result:

- fetch succeeded
- id: `evidence-readonly-public-surface`
- title: `Public tool surface remains exactly nine read-only tools`
- profile: `public`
- kind: `evidence`
- tags: `read-only public-tools invariants`
- text explained that the public app exposes only the intended nine tools and asserts read-only, non-destructive, closed-world annotations

## Successful Repo Pointer Fetch

Developer Mode prompt:

```text
Use the Augnes app only. Fetch repo:src/adapters/file-core.ts.
```

Observed result:

- fetch succeeded
- id: `repo:src/adapters/file-core.ts`
- title: `File-backed adapter source pointer`
- profile: `public`
- kind: `repo`
- tags: `repo adapter file-core`
- text preserved the rule that repo search/explore remain view-only and fetchable records are still read-only evidence candidates

## Runtime Outage Behavior

The local read API shim was stopped while the MCP app remained running in HTTP mode.

Developer Mode prompts:

```text
Use the Augnes app only. Search Augnes records for "read-only".
Use the Augnes app only. Fetch evidence-readonly-public-surface.
```

Observed result for search outage:

- tool call failed at runtime
- profile: `public`
- mode: `http`
- read-only: `true`
- error message: `Augnes Core search results endpoint is unavailable. Check the API base URL and server status.`

Observed result for fetch outage:

- tool call failed at runtime
- requested id: `evidence-readonly-public-surface`
- profile: `public`
- mode: `http`
- read-only: `true`
- error message: `Augnes Core fetch is unavailable. Check the API base URL and server status.`

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
| Dev read API `POST /search` | pass |
| Dev read API `GET /fetch/:id` | pass |
| Developer Mode `search` success path | pass |
| Developer Mode evidence fetch success path | pass |
| Developer Mode repo pointer fetch success path | pass |
| Search/fetch linkage for `evidence-readonly-public-surface` | pass |
| Fetch path for `repo:src/adapters/file-core.ts` | pass |
| Runtime outage does not kill MCP app | pass |
| Runtime outage returns sanitized search error | pass |
| Runtime outage returns sanitized fetch error | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

Sprint 4E third slice is complete.

The app can now validate Working View, Casefile, Search, and Fetch through HTTP mode against the local read API shim.

## Next Step

Proceed to continuity/boundary linkage as a paired slice:

```http
GET /continuity-report
GET /boundary-packet
```

Acceptance criteria for the next slice:

- local read API implements `GET /continuity-report`
- local read API implements `GET /boundary-packet?boundaryId=...`
- continuity response validates against `ContinuityReportSchema`
- boundary response validates against `BoundaryPacketSchema`
- `latestBoundaryId` from continuity resolves through boundary packet
- MCP app in HTTP mode can call `get_continuity_report`
- MCP app in HTTP mode can call `get_boundary_packet`
- stopping the read API returns sanitized runtime tool errors
- existing Working View, Casefile, Search, and Fetch behavior remains unchanged
