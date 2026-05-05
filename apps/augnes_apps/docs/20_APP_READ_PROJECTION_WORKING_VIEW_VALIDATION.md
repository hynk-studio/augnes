# App Read Projection Working View Validation

Status: passed  
Date: 2026-04-29  
Scope: B1-1, App Read Projection Model for `GET /working-view`

This note records the first App Read Projection Model validation slice.

This phase does not define or constrain the real internal Augnes Core structure. It only introduces an app-facing read projection layer for the ChatGPT Apps HTTP contract.

The legacy `augnes-core` repository was not used.

## What Changed

`GET /working-view` no longer reads `data/working-view.example.json` directly.

It now reads:

```text
data/read-model-snapshot.example.json
```

through:

```text
src/read-model-projection/load-snapshot.ts
src/read-model-projection/working-view.ts
```

The projection path is:

```text
read-model-snapshot.example.json
  -> loadReadModelSnapshot()
  -> projectWorkingView()
  -> WorkingViewSchema validation
  -> HTTP response
```

## Boundary Of Meaning

This is not the canonical Augnes Core model.

This is an app read projection harness used to verify that the ChatGPT App can consume a derived read view rather than a pre-baked endpoint response fixture.

The projection model does not add:

- canonical memory writes
- promotion logic
- commit logic
- autonomous action selection
- Gate/SRF execution semantics
- Evidence Registry/JML/STATE_SNAPSHOT internals

## Runtime Topology

Terminal 1: local development read API shim.

```bash
npm run dev:read-api
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
- claim IDs remained:
  - `claim-augnes-console-readonly-surface`
  - `claim-sprint-3a-file-backed-working-view`
- top evidence IDs remained:
  - `evidence-readonly-public-surface`
  - `evidence-file-backed-working-view`
- active pointers remained:
  - `casefile:casefile-augnes-console-public-app`
  - `boundary:read-first-v1`
  - `repo:src/adapters/file-core.ts`

The visible output stayed contract-compatible with the previous Working View fixture, while the internal data path moved to the App Read Projection Model.

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

This confirms that routing `GET /working-view` through the projection model did not break an unrelated HTTP-mode endpoint.

## Projection Integrity Check

`projectWorkingView()` validates that the projected IDs exist in the read-model snapshot:

- `workingViewProjection.claimIds` must resolve against `snapshot.claims`
- `workingViewProjection.topEvidenceIds` must resolve against `snapshot.evidence`
- `workingViewProjection.activePointers` must resolve against `snapshot.pointers`

This gives the Working View a minimal internal consistency check without pretending to define the real Augnes Core ontology.

## Result Summary

| Check | Result |
|---|---|
| `GET /working-view` via App Read Projection Model | pass |
| Developer Mode Working View render | pass |
| Working View external shape preserved | pass |
| Projection ID integrity check in code | pass |
| Governance Audit regression | pass |
| Legacy `augnes-core` dependency | not used |
| CSP badge | still visible as known issue |

## Decision

B1-1 is complete.

The App Read Projection Model can now derive the Working View from a projection snapshot while preserving the existing HTTP contract and public widget behavior.

## Next Step

Proceed to B1-2:

```text
POST /casefile through App Read Projection Model
```

Acceptance criteria:

- extend `data/read-model-snapshot.example.json` with casefile projection data
- derive `Casefile` from projection snapshot instead of directly reading `data/casefile.example.json`
- resolve supporting and contradicting evidence references from projection evidence records
- preserve the existing `CasefileSchema` output shape
- keep `GET /working-view` unchanged
- keep all other endpoints on the existing shim path for now
