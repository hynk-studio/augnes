# HTTP Local Shim Completion

Status: complete  
Date: 2026-04-29  
Scope: Sprint 4E, full local HTTP read-contract validation for Augnes Evidence & Continuity Console

This document consolidates the Sprint 4E HTTP-mode validation work for `Aurna-code/augnes/apps/augnes_apps`.

The legacy `augnes-core` repository was not used or referenced for this phase. All validation was performed inside `apps/augnes_apps` using the local development read API shim and the existing MCP app HTTP adapter.

## Executive Summary

Sprint 4E is complete at the local HTTP-contract level.

The Augnes MCP app can now run with:

```bash
AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://127.0.0.1:3000 \
npm start
```

and read all nine public tools through the local development read API shim started with:

```bash
npm run dev:read-api
```

The read API shim is not the final Augnes Core. It is a local HTTP contract harness that proves the MCP app can move from file-backed fixtures to HTTP-backed read endpoints without changing the public tool surface, adding write authority, or introducing startup dependency on a live backend.

## Final Endpoint Map

| Public tool | HTTP endpoint | Status |
|---|---|---|
| `get_working_view` | `GET /working-view` | complete |
| `open_casefile` | `POST /casefile` | complete |
| `search` | `POST /search` | complete |
| `fetch` | `GET /fetch/:id` | complete |
| `get_continuity_report` | `GET /continuity-report` | complete |
| `get_boundary_packet` | `GET /boundary-packet` | complete |
| `explain_strategy` | `POST /strategy` | complete |
| `get_governance_audit` | `GET /governance-audit` | complete |
| `navigate_repo` | `POST /repo/navigate` | complete |

## Runtime Topology

### Terminal 1: local development read API shim

```bash
cd /path/to/augnes/apps/augnes_apps
npm run dev:read-api
```

Expected health:

```bash
curl -sS http://127.0.0.1:3000/healthz
```

Expected endpoint list:

```json
{
  "ok": true,
  "name": "augnes-dev-read-api",
  "readOnly": true,
  "endpoints": [
    "GET /working-view",
    "POST /casefile",
    "POST /search",
    "GET /fetch/:id",
    "GET /continuity-report",
    "GET /boundary-packet",
    "POST /strategy",
    "GET /governance-audit",
    "POST /repo/navigate"
  ]
}
```

### Terminal 2: MCP app in HTTP mode

```bash
cd /path/to/augnes/apps/augnes_apps

AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://127.0.0.1:3000 \
npm start
```

Expected health:

```bash
curl -sS http://127.0.0.1:8787/healthz
```

Expected response shape:

```json
{
  "ok": true,
  "name": "augnes-console",
  "version": "0.1.0",
  "mode": "http",
  "readOnly": true,
  "profile": "public"
}
```

### Terminal 3: Quick Tunnel for Developer Mode

```bash
cloudflared tunnel --url http://localhost:8787
```

Developer Mode MCP URL shape:

```text
https://<trycloudflare-host>/mcp
```

Quick Tunnel remains the chosen development path for now. Stable URL, domain, OAuth, auth, and app directory readiness are separate deployment-readiness work.

## Source Fixtures Used By The Shim

The local read API shim reads the same fixture data that previously powered file mode:

| Fixture | Used by |
|---|---|
| `data/working-view.example.json` | `GET /working-view` |
| `data/casefile.example.json` | `POST /casefile` |
| `data/evidence-index.example.json` | `POST /search`, `GET /fetch/:id` |
| `data/continuity-report.example.json` | `GET /continuity-report` |
| `data/boundary-packet.example.json` | `GET /boundary-packet` |
| `data/strategy-rationale.example.json` | `POST /strategy` |
| `data/governance-audit.example.json` | `GET /governance-audit` |
| `data/repo-navigation.example.json` | `POST /repo/navigate` |

Each endpoint validates its response against the existing app schemas before returning JSON.

## Slice Validation Record

### Slice 1: Working View

Documented in:

```text
./docs/13_HTTP_WORKING_VIEW_VALIDATION.md
```

Validated:

- `GET /working-view`
- Developer Mode `get_working_view`
- widget render
- text fallback
- runtime outage error path
- no startup dependency on the read API

Decision: complete.

### Slice 2: Casefile

Documented in:

```text
./docs/14_HTTP_CASEFILE_VALIDATION.md
```

Validated:

- `POST /casefile`
- Developer Mode `open_casefile`
- supporting evidence display
- contradicting evidence display
- unresolved questions display
- recent changes display
- runtime outage error path

Decision: complete.

### Slice 3: Search And Fetch

Documented in:

```text
./docs/15_HTTP_SEARCH_FETCH_VALIDATION.md
```

Validated:

- `POST /search`
- `GET /fetch/:id`
- Developer Mode `search`
- Developer Mode `fetch`
- search/fetch linkage for `evidence-readonly-public-surface`
- fetch for `repo:src/adapters/file-core.ts`
- runtime outage error path

Decision: complete.

### Slice 4: Continuity And Boundary

Documented in:

```text
./docs/16_HTTP_CONTINUITY_BOUNDARY_VALIDATION.md
```

Validated:

- `GET /continuity-report`
- `GET /boundary-packet`
- Developer Mode `get_continuity_report`
- Developer Mode `get_boundary_packet`
- continuity `latestBoundaryId` resolving to `boundary:read-first-v1`
- runtime outage error path

Decision: complete.

### Slice 5: Strategy And Governance

Documented in:

```text
./docs/17_HTTP_STRATEGY_GOVERNANCE_VALIDATION.md
```

Validated:

- `POST /strategy`
- `GET /governance-audit`
- Developer Mode `explain_strategy`
- Developer Mode `get_governance_audit`
- strategy remains Control/View only
- governance remains read-only review surface
- runtime outage error path

Decision: complete.

### Slice 6: Repo Navigation

Documented in:

```text
./docs/18_HTTP_REPO_NAVIGATION_VALIDATION.md
```

Validated:

- `POST /repo/navigate`
- Developer Mode `navigate_repo`
- repo navigation remains view-only
- fetch linkage for `repo:src/adapters/file-core.ts`
- runtime outage error path

Decision: complete.

## Confirmed Invariants

The following invariants remained intact across all slices:

- The public tool list remains exactly nine tools.
- All public tools remain read-only.
- No write, commit, action, automation, job, send, trigger, promote, apply, create, update, or delete tools were added.
- ChatGPT remains a surface host only.
- Augnes Core remains the intended authority holder.
- ChatGPT thread/session/workspace state is not treated as canonical Augnes memory.
- Narrator text is not Evidence.
- Strategy Rationale is Control/View context only, not truth or evidence.
- Governance Audit is a read-only review surface, not a policy writer.
- Repo Search/Explore remains view-only.
- Fetch remains the path for evidence/repo candidate retrieval.
- The MCP app starts even if the read API is unavailable.
- Backend outage is reported at tool-call time with sanitized error payloads.
- No secrets, provider session IDs, thread IDs, workspace IDs, run IDs, trace IDs, auth identifiers, or raw tokens were exposed in successful or error payloads.
- The legacy `augnes-core` repository was not used.

## Known Issue: CSP Badge

The ChatGPT Developer Mode UI still shows `CSP off` during Quick Tunnel validation.

This remains a known issue and is not considered a blocker for local HTTP-contract validation.

Current interpretation:

- widget render works
- tool calls work
- text fallback works
- public profile works
- widget security hardening remains in place
- Quick Tunnel is not a final production or app-review host

The CSP badge must be rechecked later on a stable deployment URL or a fresh stable draft app.

## Completion Criteria Met

Sprint 4E local HTTP shim completion criteria:

- all nine public tools have matching local HTTP endpoints
- all endpoints return schema-valid fixture-backed payloads
- all endpoints work through MCP app HTTP mode
- Developer Mode validates success path for each public tool
- Developer Mode validates runtime outage behavior for each endpoint family
- the MCP app does not require the read API at startup
- read-only governance posture is preserved
- no legacy Core dependency is introduced

Result: complete.

## What This Does Not Mean

This does not mean production readiness.

Still not complete:

- stable deployment URL
- OAuth/auth boundary
- actual Core-backed registry/JML/state snapshot reads
- production CSP badge resolution
- app directory submission readiness
- multi-tenant workspace isolation
- persistent hosted backend uptime

The shim proves the app-side HTTP contract. It does not replace the real Core.

## Recommended Next Step

The next technical decision is between two paths.

### Path B1: continue local Core-side implementation behind the shim contract

Use the existing endpoint shapes as the contract and start replacing fixture reads with real Core-side read models one endpoint at a time.

Recommended order:

1. `GET /working-view`
2. `POST /casefile`
3. `POST /search` + `GET /fetch/:id`
4. `GET /continuity-report` + `GET /boundary-packet`
5. `POST /strategy` + `GET /governance-audit`
6. `POST /repo/navigate`

### Path C: deploy stable hosted dev environment

Use a hosted environment or stable tunnel to validate `/mcp` and the read API over a persistent URL.

This is useful before:

- external review
- OAuth/auth callback configuration
- stable CSP badge validation
- app directory preparation

## Final Decision

Keep Quick Tunnel as the development transport for now.

Do not buy a domain just for this stage.

Proceed next with either:

- a real Core-side implementation behind `GET /working-view`, or
- a small hardening pass on the dev read API shim before replacing fixture reads.
