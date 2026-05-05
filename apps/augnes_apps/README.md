# Augnes: Evidence & Continuity Console

Starter repo for the first review-safe ChatGPT App shell of Augnes.

## Product stance

This app is intentionally narrow:

- ChatGPT is the surface host only.
- Augnes Core remains the authority holder.
- v1 is strictly read-only.
- No canonical memory writes happen from ChatGPT.
- Narrator text is never treated as Evidence.
- Repo search/explore stay view-only; fetch is the only repo path that can later become an evidence candidate.

The public tool surface remains exactly:

- `search`
- `fetch`
- `open_casefile`
- `get_working_view`
- `explain_strategy`
- `get_boundary_packet`
- `get_continuity_report`
- `navigate_repo`
- `get_governance_audit`

## Local run

```bash
npm install
npm run typecheck
npm run smoke
npm run invariants
npm run dev
```

Default mock mode uses the built-in `MockAugnesCoreAdapter`:

```bash
npm start
```

Health route:

```bash
curl http://localhost:8787/healthz
```

Expected response:

```json
{
  "ok": true,
  "name": "augnes-console",
  "version": "0.1.0",
  "mode": "mock",
  "readOnly": true,
  "profile": "public"
}
```

## Modes

### Mock mode

Safe default:

```env
AUGNES_USE_MOCK=true
```

Or explicitly:

```env
AUGNES_CORE_MODE=mock
```

This uses `MockAugnesCoreAdapter` and does not require a live Augnes Core backend.

### File mode

File mode adds non-mock read paths for all nine public tools: `get_working_view`, `open_casefile`, `search`, `fetch`, `get_continuity_report`, `get_boundary_packet`, `explain_strategy`, `get_governance_audit`, and `navigate_repo`:

```bash
npm run start:file
```

For watch mode with the same file-backed fixtures:

```bash
npm run dev:file
```

`start:file` and `dev:file` load `.env.file` when present, otherwise they use the built-in checked-in fixture defaults. To customize local fixture paths, create an untracked `.env.file`.

In file mode, `FileAugnesCoreAdapter` reads configured JSON files for all nine public tools, including the Repo Navigation JSON file on `navigate_repo` calls. Payloads are validated against existing schemas. The adapter never writes to files.

Remaining mock-backed tools in file mode: none. Mock mode itself remains available.

The current `ContinuityReport`, `BoundaryPacket`, and `StrategyRationale` schemas have no evidence-reference fields, so continuity, boundary, and strategy evidence linkage are planned for a later schema pass. File-backed strategy currently returns the configured fixture for any subject; subject-specific resolution is planned for a later adapter pass.

## Presentation profiles

`AUGNES_APP_PROFILE` controls presentation only. It does not change tool authority, adapter behavior, Core sovereignty, read-only annotations, or the public tool list.

Default public file mode:

```bash
npm run start:file
```

Chrono Lab file mode:

```bash
AUGNES_APP_PROFILE=chrono_lab npm run start:file
```

Profiles:

- `public`: directory-safe, concise, user-facing. Governance, boundary, and continuity panels lead with summaries while preserving IDs, pointers, safety warnings, and promotion bans.
- `chrono_lab`: developer/lab-facing. Panels keep detailed governance audit fields, boundary lineage, continuity fail axes, and transition retention visible.

The widget resource URI is versioned as `ui://widget/augnes-console.v2.html` so ChatGPT does not reuse stale profile-rendering HTML across local validation runs.

## Widget security

The widget is a self-contained read-only HTML resource. It does not make direct browser network calls, load external scripts or fonts, use analytics, use `localStorage`/`sessionStorage`, or use `eval`/`new Function`.

Widget state is UI-only: last panel, expanded/collapsed sections, profile badge, and last update display. It is not canonical Augnes state, and ChatGPT thread/session/workspace state is not treated as Augnes memory.

The resource declares a narrow SDK-native CSP plus OpenAI-compatible widget CSP metadata with empty connect and resource domain allowlists. The stable widget domain comes from `AUGNES_RESOURCE_DOMAIN`.

Known issue: `CSP off` may still show in ChatGPT Developer Mode even with CSP metadata present. Do not treat this as production-ready until verified on a stable deployment URL with a refreshed app registration or new draft.

Manual Developer Mode security checklist:

- Create a fresh Developer Mode app after widget URI changes.
- Verify `/healthz` reports the intended `profile`.
- Verify the widget resource URI is `ui://widget/augnes-console.v2.html`.
- Verify the widget uses no external network APIs.
- Verify the Developer Mode CSP badge state.

### HTTP mode

Switch to the real adapter seam:

```env
AUGNES_USE_MOCK=false
AUGNES_API_BASE_URL=http://localhost:3000
```

Or explicitly:

```env
AUGNES_CORE_MODE=http
```

`HttpAugnesCoreAdapter` uses this proposed read-only contract:

- `POST /search` with `{ query, scope, timeRange }`
- `GET /fetch/:id`
- `POST /casefile` with `{ subject }`
- `GET /working-view?scope=...`
- `POST /strategy` with `{ subject }`
- `GET /boundary-packet?boundaryId=...`
- `GET /continuity-report`
- `POST /repo/navigate` with `{ query }`
- `GET /governance-audit`

Startup does not fail if the backend is unavailable. Tool calls fail at runtime with a clear error payload instead.

## Environment variables

Set these in the shell or in an untracked local `.env` file:

- `PORT=8787`
- `AUGNES_USE_MOCK=true`
- `AUGNES_CORE_MODE=mock` (optional; allowed values are `mock`, `file`, `http`)
- `AUGNES_APP_PROFILE=public` (optional; allowed values are `public`, `chrono_lab`)
- `AUGNES_API_BASE_URL=http://localhost:3000`
- `AUGNES_WORKING_VIEW_FILE=./data/working-view.example.json`
- `AUGNES_CASEFILE_FILE=./data/casefile.example.json`
- `AUGNES_EVIDENCE_INDEX_FILE=./data/evidence-index.example.json`
- `AUGNES_CONTINUITY_REPORT_FILE=./data/continuity-report.example.json`
- `AUGNES_BOUNDARY_PACKET_FILE=./data/boundary-packet.example.json`
- `AUGNES_STRATEGY_RATIONALE_FILE=./data/strategy-rationale.example.json`
- `AUGNES_GOVERNANCE_AUDIT_FILE=./data/governance-audit.example.json`
- `AUGNES_REPO_NAVIGATION_FILE=./data/repo-navigation.example.json`
- `AUGNES_APP_DOMAIN=https://app.augnes.dev`
- `AUGNES_CONNECT_DOMAIN=https://app.augnes.dev`
- `AUGNES_RESOURCE_DOMAIN=https://persistent.oaistatic.com`

`AUGNES_RESOURCE_DOMAIN` is used for the widget resource domain. `AUGNES_APP_DOMAIN` and `AUGNES_CONNECT_DOMAIN` remain available for compatibility with earlier local app metadata, but the widget itself does not require external connect or resource domains. Only safe origins should be configured.

Backward compatibility: without `AUGNES_CORE_MODE`, `AUGNES_USE_MOCK=true` selects mock mode and `AUGNES_USE_MOCK=false` selects HTTP mode. The default remains mock.

## Inspector and ChatGPT

Run MCP Inspector against the local server:

```bash
npm run inspect
```

Typical developer-mode flow:

1. Start the app locally with `npm run dev` for mock mode or `npm run dev:file` for file mode.
2. Expose it over HTTPS with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:8787
```

3. Add the public Developer Mode endpoint in ChatGPT:

```text
https://<tunnel-host>/mcp
```

4. Confirm the widget renders while the plain text output remains useful on its own.

Runbooks:

- [Developer Mode Runbook](docs/07_DEVELOPER_MODE_RUNBOOK.md)
- [First Run Validation](docs/08_FIRST_RUN_VALIDATION.md)
- [Real Read Path Plan](docs/09_REAL_READ_PATH_PLAN.md)
- [Widget Security Review](docs/10_WIDGET_SECURITY_REVIEW.md)
- [Agent Bridge Local Runbook](docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md)
- [Codex Handoff Demo](docs/CODEX_HANDOFF_DEMO.md)

## ChatGPT App state assistant flow

When bridge mode is explicitly enabled with `AUGNES_ENABLE_AGENT_BRIDGE=true`, the ChatGPT App should answer human-facing Augnes state questions by calling `augnes_get_state_brief` first and prioritizing `structuredContent.brief.agent_handoff` when it exists.

Use the handoff for plain questions such as:

- Where are we?
- What should I do next?
- What should Codex do?
- What needs my approval?
- What is risky or blocked?

Answer in plain language first: current status, next step, why, Codex handoff, and needs-your-decision or blockers. Raw state keys belong only as secondary grounding under a short `Reference` or `Grounding` note.

The app must not add direct commit/reject tools, autonomous Codex execution, hosted auth flows, or new runtime lifecycle semantics. Public default behavior remains the original read-only nine-tool surface unless the bridge flag is enabled.

See [Using the ChatGPT App as the human-facing Augnes assistant](docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md#using-the-chatgpt-app-as-the-human-facing-augnes-assistant) for the full answer pattern and example.

## Verification

Local smoke coverage is intentionally small:

- config loads
- profile config defaults to `public`, accepts `chrono_lab`, and rejects invalid values clearly
- `/healthz` includes the active profile without unsafe identifiers
- widget resource declares the expected v2 URI and narrow CSP metadata
- widget avoids storage, eval, and direct browser network APIs
- sanitizer strips review-unsafe keys
- mock adapter returns all public read models
- public tool names remain the intended nine
- HTTP adapter failures return stable sanitized errors
- invariants assert exact tool names, read-only annotations, and sanitizer ID preservation
- file-backed Working View, Casefile, Search, Fetch, Continuity Report, Boundary Packet, Strategy Rationale, and Governance Audit read fixtures and fail clearly for missing or invalid files at method call time
- `start:file` env resolution points to existing fixture files

This is a read-first starter app, not a write-capable automation surface.
