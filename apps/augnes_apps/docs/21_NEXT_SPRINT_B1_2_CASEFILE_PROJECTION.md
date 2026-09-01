# Next Sprint B1-2: Evidence Projection Base + Casefile Projection

Status: planned  
Scope: `Aurna-code/augnes/apps/augnes_apps` App Read Projection Model  
Phase: B1-2 after Working View projection validation

This sprint narrows the next development step after `GET /working-view` started using the App Read Projection Model.

The goal is not to define the real Augnes Core internal ontology. The goal is to make the app-facing read projection safer by introducing a shared Evidence projection base before deriving Casefile output from the snapshot.

## 1. Current Baseline

Already completed:

- HTTP local shim supports all nine public read-only tools.
- `GET /working-view` is routed through App Read Projection Model.
- `projectWorkingView()` validates claim/evidence/pointer ID references.
- Quick Tunnel remains the development transport.
- Legacy `augnes-core` repository is not used.

Relevant existing files:

```text
data/read-model-snapshot.example.json
src/read-model-projection/schemas.ts
src/read-model-projection/load-snapshot.ts
src/read-model-projection/working-view.ts
scripts/dev-read-api.ts
```

Relevant validation docs:

```text
docs/19_HTTP_LOCAL_SHIM_COMPLETION.md
docs/20_APP_READ_PROJECTION_WORKING_VIEW_VALIDATION.md
```

## 2. Sprint Goal

Create an Evidence projection base and move `POST /casefile` to derive from the App Read Projection Model.

The important outcome is that Casefile evidence references and future Fetch/Search evidence records can be resolved from one shared projection source instead of drifting between separate fixtures.

## 3. Non-goals

This sprint must not add:

- write tools
- proposal tools
- commit/apply/promote/update/delete paths
- automation/action/job/trigger tools
- canonical memory writes
- real Augnes Core ontology definitions
- Evidence Registry/JML/STATE_SNAPSHOT internals
- autonomous action selection
- Gate/SRF execution semantics
- OAuth/auth implementation
- stable hosted deployment

This sprint also does not move Search/Fetch to projection yet. It prepares the Evidence base so Search/Fetch can move in the next sprint without split-brain source drift.

## 4. Authority Boundaries

Keep these boundaries explicit:

- ChatGPT App remains `surface_host`.
- App Read Projection Model is app-facing read projection only.
- App Read Projection Model is not canonical Augnes Core state.
- Narrator text is not Evidence.
- Strategy Rationale is Control/View only, not truth/evidence.
- Governance Audit is a read-only review surface, not a policy writer.
- Search/Explore are View-only.
- Fetch remains the path for evidence/repo candidate retrieval.
- Provider/session/thread/workspace/run/auth/debug IDs remain raw/debug only and must not enter projection output.

## 5. Key Risk Being Addressed

Without this sprint, Casefile projection could start reading evidence references from `read-model-snapshot.example.json` while `fetch(id)` still reads from `data/evidence-index.example.json`.

That creates a small split-brain:

```text
Casefile supporting/contradicting evidence refs
  -> read-model-snapshot.example.json

Fetch(id)
  -> evidence-index.example.json
```

The sprint prevents that by introducing a shared Evidence projection base first.

## 6. Data Model Changes

### 6.1 Add Snapshot Metadata Now

Update `data/read-model-snapshot.example.json` with app projection metadata.

Recommended fields:

```json
{
  "schemaVersion": "app-read-projection.snapshot.v1",
  "projectionVersion": "app-read-projection.v1",
  "snapshotId": "read-model-snapshot-app-v1",
  "generatedAt": "2026-05-02T00:00:00.000Z",
  "sourceRevision": "fixture:read-model-snapshot.example.json",
  "staleStatus": "unknown"
}
```

Notes:

- `schemaVersion` is the snapshot schema version.
- `projectionVersion` is the app-facing projection contract version.
- `snapshotId` identifies the app-facing read snapshot.
- `generatedAt` is fixture metadata, not Core time authority.
- `sourceRevision` or `sourceHash` identifies the fixture/source used for the read snapshot.
- `staleStatus` should start as `unknown`, not `fresh`, because this is still fixture-backed.

### 6.2 Expand Evidence Records

Update `snapshot.evidence` so each evidence record can derive both `EvidenceRef` and `FetchResult` later.

Recommended shape:

```json
{
  "id": "evidence-readonly-public-surface",
  "title": "Public tool surface remains exactly nine read-only tools",
  "text": "Fixture evidence that the Augnes Console public app exposes only the intended nine tools...",
  "url": "augnes://evidence/evidence-readonly-public-surface",
  "kind": "evidence",
  "status": "active",
  "tags": ["read-only", "public-tools", "invariants"],
  "source": "augnes"
}
```

Policy:

- `status: active` can be used by Working View and Casefile projection.
- `inactive` and `archived` must not be referenced by Working View or public Casefile projection.
- Archived/historical reads require a future explicit surface and are not part of public v1.

### 6.3 Add Casefile Projection Records

Add a casefile projection section to the snapshot.

Recommended shape:

```json
{
  "casefiles": [
    {
      "id": "casefile-augnes-console-public-app",
      "subject": "Augnes Console public read-only app",
      "summary": "Fixture-safe casefile for the Augnes Console starter...",
      "supportingEvidenceIds": [
        "evidence-readonly-public-surface",
        "evidence-file-backed-working-view",
        "evidence-file-backed-casefile"
      ],
      "contradictingEvidenceIds": [
        "evidence-http-api-not-final"
      ],
      "unresolvedQuestions": [
        "Which Augnes Core casefile endpoint contract should replace the file-backed seam?",
        "How should casefile lookup by subject map to canonical Augnes identifiers once HTTP mode is finalized?"
      ],
      "recentChanges": [
        "Sprint 2A validated all nine read-only tools in ChatGPT Developer Mode.",
        "Sprint 3A connected get_working_view to a file-backed read source.",
        "Sprint 3B connects open_casefile to a file-backed read source."
      ]
    }
  ]
}
```

## 7. Code Changes

### 7.1 Extend Projection Schemas

Update:

```text
src/read-model-projection/schemas.ts
```

Add schemas for:

- snapshot metadata
- projection evidence record
- projection casefile record
- allowed `staleStatus`
- active/inactive/archived status policy

Recommended status values:

```text
active | inactive | archived
```

Recommended stale values:

```text
fresh | stale | unknown
```

### 7.2 Add Evidence Resolver

Create:

```text
src/read-model-projection/evidence.ts
```

Responsibilities:

- `resolveProjectionEvidence(snapshot, id)`
- `resolveEvidenceRef(snapshot, id, stance, note?)`
- `resolveFetchResult(snapshot, id)` preparation for next sprint
- active status enforcement for public projection
- missing evidence ID failure

Initial exported functions:

```ts
resolveProjectionEvidence(snapshot, id)
resolveEvidenceRef(snapshot, id, stance, note?)
assertActiveProjectionEvidence(record)
```

`resolveFetchResult()` may be added now but not wired to `GET /fetch/:id` until the next sprint.

### 7.3 Add Casefile Projection

Create:

```text
src/read-model-projection/casefile.ts
```

Responsibilities:

- look up casefile by subject/id
- resolve supporting evidence refs
- resolve contradicting evidence refs
- preserve unresolved questions
- preserve recent changes
- validate final result with `CasefileSchema`

Expected exported function:

```ts
projectCasefile(snapshot, subjectOrQuery)
```

Lookup policy:

- exact `id` match first
- exact `subject` match second
- if subject is `latest` or empty-like fallback, use the first casefile only for dev fixture mode
- missing casefile should fail clearly

### 7.4 Route `POST /casefile` Through Projection

Update:

```text
scripts/dev-read-api.ts
```

Change only `readCasefile()` so it uses:

```text
loadReadModelSnapshot(readModelSnapshotFile)
projectCasefile(snapshot, subject)
```

Do not change other endpoints yet.

## 8. Tests

### 8.1 Projection Tests

Create:

```text
scripts/projection-tests.ts
```

Add package script:

```json
{
  "scripts": {
    "projection": "tsx scripts/projection-tests.ts"
  }
}
```

Minimum tests:

- valid snapshot passes `ReadModelSnapshotSchema`
- `projectWorkingView(validSnapshot)` returns `WorkingViewSchema` shape
- missing working view claim ID fails
- missing working view evidence ID fails
- missing working view pointer ID fails
- inactive claim in Working View fails
- archived evidence in Working View fails
- evidence resolver resolves active evidence
- evidence resolver fails missing evidence ID
- evidence resolver rejects inactive/archived evidence for public projection
- `projectCasefile(validSnapshot)` returns `CasefileSchema` shape
- missing supporting evidence fails
- missing contradicting evidence fails
- inactive/archived casefile evidence fails
- invalid JSON fails clearly
- invalid schema fails clearly

### 8.2 Parity Test

Keep `data/working-view.example.json` for now as a parity/legacy fixture.

Add parity assertion:

```text
projectWorkingView(read-model-snapshot.example.json)
  equals data/working-view.example.json
```

For this sprint, add casefile parity if feasible:

```text
projectCasefile(read-model-snapshot.example.json)
  equals data/casefile.example.json after ignoring legacy-only fields if needed
```

If exact parity is blocked by legacy fields, document the diff explicitly.

### 8.3 CI Hook

Projection tests should be added to CI after the minimal CI workflow exists.

For this sprint, local completion requires:

```bash
npm run typecheck
npm run smoke
npm run invariants
npm run projection
```

## 9. Manual Validation

Run read API:

```bash
npm run dev:read-api
```

Run MCP app in HTTP mode:

```bash
AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://127.0.0.1:3000 \
npm start
```

Run Quick Tunnel:

```bash
cloudflared tunnel --url http://localhost:8787
```

Developer Mode prompts:

```text
Use the Augnes app only. Show my current working view.
Use the Augnes app only. Open the latest casefile.
Use the Augnes app only. Show the governance audit.
```

Expected:

- Working View still renders.
- Casefile still renders.
- Governance Audit still renders.
- `profile: public` remains visible.
- `readOnly: true` remains preserved in outage path.
- No write/proposal tools appear.

## 10. Outage Validation

Stop the dev read API while MCP app stays running.

Developer Mode prompt:

```text
Use the Augnes app only. Open the latest casefile.
```

Expected:

- MCP app stays alive.
- Tool error is returned at runtime.
- tool: `open_casefile`
- mode: `http`
- profile: `public`
- read-only: `true`
- no provider/session/thread/workspace/run/auth/debug identifiers leak

## 11. Completion Criteria

B1-2 is complete when:

- `data/read-model-snapshot.example.json` has projection metadata.
- Evidence projection records can derive `EvidenceRef`.
- Casefile projection records derive `Casefile` output.
- `POST /casefile` uses App Read Projection Model.
- `GET /working-view` remains unchanged.
- Other endpoints remain on the existing shim path.
- Projection negative tests exist and pass.
- Working View parity test passes.
- Casefile projection parity passes or documented diff exists.
- Developer Mode Working View / Casefile / Governance smoke passes.
- Runtime outage behavior remains sanitized.
- Legacy `augnes-core` repo is not used.

## 12. Stop Point After This Sprint

After B1-2, do not immediately expand all remaining projection surfaces.

Recommended next step:

```text
B1-3: Search/Fetch projection using the same Evidence projection base
```

After B1-3:

```text
STOP / REVIEW
Draft Real Core read contract review
Decide whether to extend projection to Continuity/Boundary/Strategy/Governance/Repo
```

Reason:

Working View + Evidence + Casefile + Search/Fetch form the basic read projection skeleton. Continuity, Boundary, Strategy, Governance, and Repo carry heavier authority-boundary implications and should not be expanded casually.

## 13. Forbidden During This Sprint

Do not add:

- public write tools
- proposal tools
- commit/apply/promote/update/delete paths
- automation/action/job/trigger paths
- ChatGPT thread/session/workspace as memory
- widget state as canonical state
- narrator text as Evidence
- Strategy Rationale as truth/evidence
- Governance Audit as policy writer
- Search/Explore as evidence candidate without Fetch
- remote reasoning score as Claim confidence
- remote reasoning score as `tau_stop` or self-succession signal

## 14. Notes For Codex Or Local Implementation

Keep the implementation small.

Expected first code PR or direct commit should touch only:

```text
data/read-model-snapshot.example.json
src/read-model-projection/schemas.ts
src/read-model-projection/evidence.ts
src/read-model-projection/casefile.ts
scripts/dev-read-api.ts
scripts/projection-tests.ts
package.json
```

Documentation update should touch:

```text
docs/21_NEXT_SPRINT_B1_2_CASEFILE_PROJECTION.md
```

Avoid opportunistic refactors in `server.ts`, widget HTML, or HTTP adapter unless tests prove they are necessary.
