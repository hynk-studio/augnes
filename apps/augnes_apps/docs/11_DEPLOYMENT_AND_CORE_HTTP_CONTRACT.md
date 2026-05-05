# Deployment And Core HTTP Contract

Status: Sprint 4D/4E planning baseline  
Date: 2026-04-28  
Scope: Augnes Evidence & Continuity Console, read-only v1

This document turns the current file-backed Augnes Console into the next deployable target:

1. give the ChatGPT Developer Mode app a stable HTTPS URL, and
2. define the read-only Augnes Core HTTP API contract that can replace local JSON fixtures one endpoint at a time.

The goal is not to add authority. The goal is to make the existing read-first surface stable enough to connect to a real Core without smuggling ChatGPT session state into canonical Augnes memory.

## Current Baseline

Remote repository baseline:

- repository: `Aurna-code/augnes/apps/augnes_apps`
- default branch: `main`
- app package: `augnes-console-starter`
- public tool count: exactly nine
- modes: `mock`, `file`, `http`
- default profile: `public`
- lab profile: `chrono_lab`
- local dev endpoint: `/mcp`
- health endpoint: `/healthz`

Current constraints remain binding:

- no write tools
- no commit tools
- no action, job, automation, or trigger tools
- no canonical memory writes from ChatGPT
- no narrator text promoted to Evidence
- no strategy rationale promoted to truth
- repo Search/Explore remains view-only; Fetch is the only evidence-candidate path

## Sprint 4D: Stable Deployment URL

### Preferred First Deployment Shape

Use one stable HTTPS endpoint for the MCP server, then register a fresh ChatGPT Developer Mode app against:

```text
https://<stable-host>/mcp
```

Initial deployed mode should stay file-backed:

```env
AUGNES_CORE_MODE=file
AUGNES_APP_PROFILE=public
PORT=8787
```

Reason: stable URL validation should isolate host, HTTPS, MCP, widget resource, and CSP behavior before introducing real Core network dependency. Humans love changing five variables at once and then blaming the stars. Do not do that here.

### Acceptable Hosting Targets

Any target is acceptable if it satisfies the checks below:

- Cloudflare named tunnel
- Render / Fly.io / Railway style Node service
- VPS with reverse proxy and HTTPS
- personal domain pointing to a Node service

The deployment target must provide:

- stable HTTPS origin
- support for long enough MCP HTTP request handling
- public access to `GET /healthz`
- public access to `/mcp`
- environment variable configuration
- restart logs
- no forced response body rewriting
- no injected analytics/scripts into widget resources

### Runtime Environment

Minimum file-backed public deployment env:

```env
PORT=8787
AUGNES_CORE_MODE=file
AUGNES_APP_PROFILE=public
AUGNES_WORKING_VIEW_FILE=./data/working-view.example.json
AUGNES_CASEFILE_FILE=./data/casefile.example.json
AUGNES_EVIDENCE_INDEX_FILE=./data/evidence-index.example.json
AUGNES_CONTINUITY_REPORT_FILE=./data/continuity-report.example.json
AUGNES_BOUNDARY_PACKET_FILE=./data/boundary-packet.example.json
AUGNES_STRATEGY_RATIONALE_FILE=./data/strategy-rationale.example.json
AUGNES_GOVERNANCE_AUDIT_FILE=./data/governance-audit.example.json
AUGNES_REPO_NAVIGATION_FILE=./data/repo-navigation.example.json
AUGNES_APP_DOMAIN=https://<stable-host>
AUGNES_CONNECT_DOMAIN=https://<stable-host>
AUGNES_RESOURCE_DOMAIN=https://<stable-host>
```

If the host requires a dynamic port, let the platform set `PORT` and do not hardcode it.

### Build And Start Contract

The deployed service must be able to run:

```bash
npm install
npm run typecheck
npm run smoke
npm run invariants
npm run start:file
```

For platforms that separate build and start:

```bash
# build/check phase
npm install && npm run typecheck && npm run smoke && npm run invariants

# start phase
npm run start:file
```

### Health Check

Stable URL must pass:

```bash
curl -sS https://<stable-host>/healthz
```

Expected public response:

```json
{
  "ok": true,
  "name": "augnes-console",
  "version": "0.1.0",
  "mode": "file",
  "readOnly": true,
  "profile": "public"
}
```

Chrono Lab check:

```env
AUGNES_APP_PROFILE=chrono_lab
```

Expected difference:

```json
{
  "profile": "chrono_lab"
}
```

### ChatGPT Developer Mode Validation

Create a fresh Developer Mode app after stable deployment. Do not reuse a Quick Tunnel app registration.

Registration:

```text
Name: Augnes
Description: Evidence & Continuity Console
MCP Server URL: https://<stable-host>/mcp
Authentication: No Authentication
```

Required public-profile prompts:

```text
Use the Augnes app only. Show my current working view.
Use the Augnes app only. Show the governance audit.
Use the Augnes app only. Show the latest continuity report.
Use the Augnes app only. Show the latest boundary packet.
Use the Augnes app only. Search Augnes records for "read-only".
Use the Augnes app only. Fetch evidence-readonly-public-surface.
Use the Augnes app only. Navigate the repo for "file adapter".
```

Pass criteria:

- tool calls occur
- widget renders
- text fallback is usable
- profile badge shows `public`
- all nine tools remain callable
- no write/action/automation tools appear
- search/fetch linkage works
- repo navigation remains view-only
- CSP badge state is recorded

Chrono Lab validation:

- redeploy or restart with `AUGNES_APP_PROFILE=chrono_lab`
- create a fresh Developer Mode app or refresh the draft app metadata
- verify `profile: chrono_lab` in `/healthz`
- verify widget badge and detailed governance/boundary/continuity panels

### CSP Badge Decision Rule

The current repo already declares narrow SDK-native CSP metadata and OpenAI-compatible widget CSP metadata. If `CSP off` still appears after stable deployment:

- record the host URL
- record widget URI
- record app profile
- record whether the app was newly created or refreshed
- treat it as a Developer Mode / host metadata issue until proven otherwise
- do not block Core HTTP contract work unless the widget actually gains external network/storage behavior

Do not weaken the widget to chase the badge. That is how review surfaces become ornamental theater with extra paperwork.

## Sprint 4E: Core HTTP Read API Contract

The HTTP contract mirrors the current adapter and schema shapes. All successful responses must match the TypeScript/Zod schemas already used by the app.

### General Rules

- HTTP API is read-only.
- Successful responses use `application/json`.
- The app must tolerate Core outage at startup.
- Runtime Core failures become sanitized tool-call errors.
- Provider session IDs, ChatGPT thread IDs, workspace IDs, run IDs, trace IDs, and auth identifiers must not appear in public successful payloads.
- Debug/raw-first identifiers, when needed later, belong only in gated debug fields and must still pass sanitizer review.
- `Cache-Control: no-store` is recommended for dynamic Core state.
- Timestamps should be ISO-8601 strings if later added.
- IDs should be stable, opaque strings, not provider session IDs.

### Error Contract

The current adapter only requires status-code-level handling. Error bodies may be added for observability, but the app must not depend on them yet.

Recommended error body:

```json
{
  "error": {
    "code": "AUGNES_CORE_UNAVAILABLE",
    "message": "Working view is unavailable.",
    "retryable": true
  }
}
```

Allowed status codes:

- `400` invalid request shape
- `401` unauthenticated, after auth is added
- `403` authenticated but not allowed
- `404` requested fetch ID or casefile target not found
- `409` Core state conflict or unavailable snapshot lineage
- `422` request is syntactically valid but semantically unsupported
- `500` internal Core error
- `503` Core dependency unavailable

Do not return secrets, raw tokens, provider session IDs, stack traces, or full upstream payloads in errors.

## Endpoint 1: Working View

### Request

```http
GET /working-view?scope=<optional-scope>
```

### Response 200

```json
{
  "claimIds": ["claim-read-first-console"],
  "summary": "Current read-first Augnes Console state.",
  "topEvidenceIds": ["evidence-readonly-public-surface"],
  "activePointers": ["casefile-augnes-console-public-app"]
}
```

### Notes

- This is the first real Core endpoint to implement.
- It should be safe to expose in public profile.
- `activePointers` may point to casefiles, evidence records, or repo fetch IDs, but must not include raw provider/session IDs.

## Endpoint 2: Casefile

### Request

Current adapter shape:

```http
POST /casefile
Content-Type: application/json
```

```json
{
  "subject": "casefile-augnes-console-public-app"
}
```

Optional future REST-compatible shape:

```http
GET /casefile/:id
```

### Response 200

```json
{
  "id": "casefile-augnes-console-public-app",
  "subject": "Augnes Console public app",
  "summary": "Read-only console casefile.",
  "supportingEvidence": [
    {
      "id": "evidence-readonly-public-surface",
      "title": "Read-only public surface",
      "url": "augnes://evidence/evidence-readonly-public-surface",
      "stance": "supporting",
      "note": "Public tools are read-only."
    }
  ],
  "contradictingEvidence": [],
  "unresolvedQuestions": ["Stable deployment URL is not finalized."],
  "recentChanges": ["File-backed casefile was connected."]
}
```

### Notes

- Evidence refs are pointers, not full evidence payloads.
- Full evidence text must still go through `fetch`.

## Endpoint 3: Search

### Request

```http
POST /search
Content-Type: application/json
```

```json
{
  "query": "read-only",
  "scope": ["evidence", "casefile", "repo"],
  "timeRange": "optional"
}
```

### Response 200

```json
[
  {
    "id": "evidence-readonly-public-surface",
    "title": "Read-only public surface",
    "url": "augnes://evidence/evidence-readonly-public-surface"
  }
]
```

### Notes

- Search is a view.
- Search results are not evidence by themselves.
- The model/user must call `fetch(id)` before treating a result as an evidence candidate.

## Endpoint 4: Fetch

### Request

```http
GET /fetch/:id
```

### Response 200

```json
{
  "id": "evidence-readonly-public-surface",
  "title": "Read-only public surface",
  "text": "The Augnes Console exposes only read-only public tools.",
  "url": "augnes://evidence/evidence-readonly-public-surface",
  "metadata": {
    "kind": "evidence",
    "source": "core"
  }
}
```

### Response 404

The current adapter maps HTTP 404 to `null` internally and the tool returns a not-found payload.

### Notes

- `metadata` values must be primitive JSON values only: string, number, boolean, or null.
- Do not put nested raw traces into metadata.

## Endpoint 5: Continuity Report

### Request

```http
GET /continuity-report
```

### Response 200

```json
{
  "baselineClass": "same_self",
  "identityGoal": "Preserve read-first Augnes continuity across sessions.",
  "hardInvariants": ["Core sovereignty", "No canonical writes from ChatGPT"],
  "latestBoundaryId": "boundary:read-first-v1",
  "canaryStatus": "warn",
  "failAxis": ["deployment_stability"],
  "transitionRetention": [
    {
      "scenario": "tool_wait_resume",
      "status": "pass",
      "note": "Working view and casefile pointers survive tool wait."
    }
  ]
}
```

### Notes

- v1 displays continuity. It does not use continuity as an online action selector.
- `latestBoundaryId` should resolve through `/boundary-packet`.

## Endpoint 6: Boundary Packet

### Request

```http
GET /boundary-packet?boundaryId=<optional-boundary-id>
```

### Response 200

```json
{
  "boundaryId": "boundary:read-first-v1",
  "snapshotId": "snapshot-read-first-v1",
  "carryForwardCandidates": [
    {
      "id": "carry-read-only-surface",
      "title": "Read-only surface",
      "stage": "boundary_committed",
      "why": "Prevents accidental tool authority expansion."
    }
  ],
  "traceCapsuleCandidates": [
    {
      "id": "trace-console-first-run",
      "title": "Console first run",
      "reuseValue": "Developer Mode validation trail."
    }
  ],
  "revisionOperators": ["reinterpret", "revise", "carry_forward"],
  "lineageNotes": ["Narrator summary remains view-only."]
}
```

### Notes

- Boundary packet is a continuity/governance object, not a write command.
- `stage` must be one of `provisional`, `boundary_committed`, `canary_or_reviewed`, or `promoted`.

## Endpoint 7: Strategy Rationale

### Request

```http
POST /strategy
Content-Type: application/json
```

```json
{
  "subject": "casefile-augnes-console-public-app"
}
```

### Response 200

```json
{
  "subject": "casefile-augnes-console-public-app",
  "recommendedAction": "VERIFY",
  "why": ["Stable deployment is not yet verified."],
  "metaWm": {
    "wmStrength": 0.68,
    "uncertainty": 0.24,
    "dependencyHat": 0.52
  },
  "eop": {
    "expected": "Stable /healthz and /mcp work from public URL.",
    "observed": "Quick Tunnel works but changes URL.",
    "delta": "Need stable URL validation."
  },
  "rubric": {
    "score": 0.82,
    "notes": ["Read-only invariants are strong."]
  },
  "estimatedCost": 2,
  "estimatedSteps": 4
}
```

### Notes

- Strategy Rationale is Control/View only.
- It must not be promoted to truth or Evidence.
- The first Core implementation may return a general rationale; subject-specific strategy can come later.

## Endpoint 8: Governance Audit

### Request

```http
GET /governance-audit
```

### Response 200

```json
{
  "readOnlyTools": [
    "search",
    "fetch",
    "open_casefile",
    "get_working_view",
    "explain_strategy",
    "get_boundary_packet",
    "get_continuity_report",
    "navigate_repo",
    "get_governance_audit"
  ],
  "rawFirstFields": ["provider session ids", "thread ids", "workspace ids", "run ids", "auth identifiers"],
  "promotionBans": [
    "no narrator text into Evidence Registry",
    "no ChatGPT thread/session metadata into canonical memory",
    "no Search/Explore RepoGraph result promoted as evidence without fetch",
    "no Strategy Rationale promoted as truth"
  ],
  "gateStatus": [
    {
      "gate": "Gate-18",
      "status": "pass",
      "note": "Read-only public surface preserved."
    },
    {
      "gate": "Gate-19",
      "status": "pass",
      "note": "Promotion bans visible."
    },
    {
      "gate": "Gate-20",
      "status": "warn",
      "note": "Stable deployment and auth remain pending."
    }
  ]
}
```

### Notes

- Governance Audit is a read-only safety/review surface.
- It does not enforce policy by itself.
- Public profile may render this summary-first; chrono_lab may render details.

## Endpoint 9: Repo Navigate

### Request

```http
POST /repo/navigate
Content-Type: application/json
```

```json
{
  "query": "file adapter"
}
```

### Response 200

```json
{
  "query": "file adapter",
  "search": [
    {
      "nodeId": "repo:src/adapters/file-core.ts",
      "title": "src/adapters/file-core.ts",
      "kind": "file",
      "fetchable": true
    }
  ],
  "explore": [
    {
      "nodeId": "repo:src/adapters/index.ts",
      "title": "src/adapters/index.ts",
      "kind": "file",
      "fetchable": true
    }
  ],
  "guidance": ["Fetch a repo node before treating it as evidence."]
}
```

### Notes

- Repo navigation is view-only.
- Fetchable repo node IDs should be accepted by `/fetch/:id`.
- Repo search should not leak private credentials or unreviewed local paths.

## Implementation Order

Implement real Core backing in this order:

1. `GET /working-view`
2. `POST /casefile`
3. `POST /search`
4. `GET /fetch/:id`
5. `GET /continuity-report`
6. `GET /boundary-packet`
7. `POST /strategy`
8. `GET /governance-audit`
9. `POST /repo/navigate`

Rationale:

- Working View proves the Core HTTP seam with the smallest response shape.
- Casefile and search/fetch establish evidence linkage.
- Continuity and boundary then attach temporal self-state to the read graph.
- Strategy and audit remain Control/View and safety/review surfaces.
- Repo navigation comes last because it tempts people to pretend search results are evidence. Naturally, the shiny button is also the dangerous one.

## HTTP Mode Acceptance Test

After the Core implements `GET /working-view`:

```bash
AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm start
```

Then:

```bash
curl -sS http://127.0.0.1:8787/healthz
```

Expected:

```json
{
  "mode": "http",
  "readOnly": true,
  "profile": "public"
}
```

ChatGPT prompt:

```text
Use the Augnes app only. Show my current working view.
```

Pass criteria:

- Augnes App calls `get_working_view`
- adapter calls Core `GET /working-view`
- payload validates against `WorkingViewSchema`
- widget renders
- text fallback renders
- no provider/thread/workspace/run/auth IDs leak
- Core outage produces a clear sanitized error at tool-call time, not startup failure

## Auth Boundary Placeholder

Do not add auth until stable URL and first HTTP read endpoint pass.

When auth is added:

- read-only scope only
- no write scope
- no token display in widgets
- no token display in tool responses
- no provider auth identifiers outside raw-first/debug review paths
- sanitizer tests must include token-like and session-like values

## Definition Of Done For Sprint 4D/4E

Sprint 4D is done when:

- stable HTTPS `/healthz` passes
- stable HTTPS `/mcp` connects in fresh Developer Mode app
- public profile works
- chrono_lab profile works
- nine tools call successfully in file mode
- CSP badge state is recorded after stable deployment

Sprint 4E first slice is done when:

- Core implements `GET /working-view`
- app runs with `AUGNES_CORE_MODE=http`
- `get_working_view` succeeds through HTTP mode
- missing Core produces sanitized runtime error
- no startup dependency on Core is introduced

Full Sprint 4E is done when all nine endpoints pass the existing schema validations through HTTP mode.
