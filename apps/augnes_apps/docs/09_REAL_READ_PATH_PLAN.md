# Real Read Path Plan

Sprint 3A through 3H introduced file-backed read paths for all nine public tools. Sprint 4A added file-mode run presets. Sprint 4B splits presentation profiles without changing the public tool surface. Sprint 4C hardens widget CSP and review posture.

## Modes

Mock mode remains the safe default:

```bash
npm start
```

or:

```bash
AUGNES_CORE_MODE=mock npm start
```

File mode wires all nine public tools to local read-only JSON files:

```bash
npm run start:file
```

Watch mode uses the same file-backed env preset:

```bash
npm run dev:file
```

Presentation can be switched without changing adapter behavior or tool authority:

```bash
AUGNES_APP_PROFILE=chrono_lab npm run start:file
```

HTTP mode keeps the existing real adapter seam:

```bash
AUGNES_CORE_MODE=http AUGNES_API_BASE_URL=http://localhost:3000 npm start
```

For backward compatibility, `AUGNES_USE_MOCK=true` still selects mock mode when `AUGNES_CORE_MODE` is unset, and `AUGNES_USE_MOCK=false` still selects HTTP mode when `AUGNES_CORE_MODE` is unset.

## Sprint 4B Status

All nine public tools are non-mock in file mode.

`search` is file-backed in file mode via `AUGNES_EVIDENCE_INDEX_FILE`.

`fetch` is file-backed in file mode via `AUGNES_EVIDENCE_INDEX_FILE`.

`open_casefile` is file-backed in file mode via `AUGNES_CASEFILE_FILE`.

`get_working_view` is file-backed in file mode via `AUGNES_WORKING_VIEW_FILE`.

`explain_strategy` is file-backed in file mode via `AUGNES_STRATEGY_RATIONALE_FILE`.

`get_boundary_packet` is file-backed in file mode via `AUGNES_BOUNDARY_PACKET_FILE`.

`get_continuity_report` is file-backed in file mode via `AUGNES_CONTINUITY_REPORT_FILE`.

`navigate_repo` is file-backed in file mode via `AUGNES_REPO_NAVIGATION_FILE`.

`get_governance_audit` is file-backed in file mode via `AUGNES_GOVERNANCE_AUDIT_FILE`.

`start:file` and `dev:file` load `.env.file` when present, otherwise they use the built-in checked-in fixture defaults. Both presets validate that all configured fixture paths exist before starting the server.

Sprint 4B splits presentation into two profiles without changing public tool names, read-only behavior, adapter behavior, or Core sovereignty.

`public` is the safe default. It keeps all nine tools callable, keeps evidence IDs, claim IDs, boundary IDs, and active pointers visible, and presents governance, boundary, and continuity panels summary-first.

`chrono_lab` is developer/lab-facing. It keeps detailed governance audit sections, boundary lineage details, continuity fail axes, and transition retention details expanded.

The profile is exposed through `/healthz` as `profile` and is included in tool `structuredContent`/`_meta` for widget presentation. It does not expose secrets, provider session IDs, thread IDs, workspace IDs, run IDs, trace IDs, or auth identifiers.

Patch 3 confirms profile propagation for every public tool response through both `structuredContent.profile` and `_meta.profile`. The widget resource URI is bumped to `ui://widget/augnes-console.v2.html` to avoid stale ChatGPT resource caching during profile validation.

Sprint 4C keeps the same widget URI and adds narrow CSP metadata:

- SDK-native `_meta.ui.csp` with empty `connectDomains`, `resourceDomains`, `frameDomains`, and `baseUriDomains`.
- OpenAI-compatible `openai/widgetCSP` with empty `connect_domains` and `resource_domains`.
- Stable widget domain from `AUGNES_RESOURCE_DOMAIN`.

The widget remains self-contained and does not use direct browser network APIs, external scripts/fonts, browser storage, analytics, `eval`, or `new Function`.

## File-Backed Behavior

Each file-backed tool reads its configured JSON file at method call time and validates the JSON against the existing schema for that payload.

`search` performs simple case-insensitive matching over record id, title, text, kind, source, and metadata values. `fetch` returns exact ID matches and returns `null` when absent.

`get_boundary_packet` reads `AUGNES_BOUNDARY_PACKET_FILE` at method call time and validates the JSON against the existing `BoundaryPacket` schema. Omitted `boundaryId` returns the default fixture. `boundary:read-first-v1` and `read-first-v1` both resolve to the same fixture.

`explain_strategy` reads `AUGNES_STRATEGY_RATIONALE_FILE` at method call time and validates the JSON against the existing `StrategyRationale` schema. The current file adapter returns the configured fixture for any subject; subject-specific resolution is planned for a later adapter pass. Strategy remains a Control/View surface and is not fetchable evidence.

`get_governance_audit` reads `AUGNES_GOVERNANCE_AUDIT_FILE` at method call time and validates the JSON against the existing `GovernanceAudit` schema. It is a read-only safety and review surface, not a policy writer or hidden enforcement engine.

`navigate_repo` reads `AUGNES_REPO_NAVIGATION_FILE` at method call time and validates the JSON against the existing `RepoNavigationResult` schema. Search/Explore results remain view-only. Fetch remains the only path that can later become an evidence candidate.

All responses still pass through the existing tool sanitizer path, and the adapter never writes to disk.

The current `ContinuityReport`, `BoundaryPacket`, and `StrategyRationale` schemas have no evidence-reference fields, so continuity, boundary, and strategy evidence linkage are planned for a later schema pass instead of adding unsupported fixture fields.

Remaining mock-backed tools in file mode: none. Mock mode itself remains available.

## Difference From Mock

Mock mode returns the built-in `MockAugnesCoreAdapter` records. File mode returns the contents of the configured JSON files, so operators can test real read seams before the Augnes HTTP API is finalized.

Missing or invalid files fail at tool call time with clear errors when the file adapter is constructed directly. The `start:file` and `dev:file` presets perform an upfront fixture-path check for developer ergonomics before starting the server.

## Next Phase

Planned next work after Sprint 4C:

- Establish a stable deployment URL for Developer Mode and review.
- Define the Core HTTP adapter contract for the same nine read-only tools.
- Map each file-backed schema to a concrete Augnes Core read endpoint, request payload, response payload, and runtime error contract.
- Keep startup tolerant of unavailable Core HTTP backends while returning clear sanitized tool-call errors at runtime.

The public tool list remains exactly the same nine tools, and all tools remain read-only.
