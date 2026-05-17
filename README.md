# Augnes

## What it is

Augnes gives AI-assisted work a shared temporal state backend. ChatGPT Apps and
MCP clients can read the same committed project state, Codex can record
implementation proof, and the Cockpit shows what changed over time.

The model interprets; the runtime stores; the user gates; the graph proves.
OpenAI output is never treated as durable context by itself. Augnes turns
conversation into typed, time-aware state proposals, keeps commit/reject behind
a user/runtime gate, records accepted transitions in SQLite, anchors work with
`AG-xxx` trace IDs, and surfaces state trajectories over time.

Cockpit is the local operator, audit, and proof UI. ChatGPT App / MCP tools are
bridge surfaces. Codex records implementation results, evidence, and work trace
notes. All of those surfaces point at the same runtime-owned state.

## Why it exists

AI-assisted project work often gets split across chat memory, local code
changes, GitHub history, screenshots, and human handoffs. ChatGPT can plan and
review, Codex can implement and test, and GitHub can store the code, but the
current project state can still live in the operator's head.

Augnes replaces that message-bus work with explicit temporal state, work trace
anchors, and recorded proof. It keeps useful interpretation from the model while
leaving durable project authority with the runtime and the user.

## What it does

- Compiles natural language into typed temporal state delta proposals.
- Keeps committed state behind an explicit commit/reject gate.
- Stores accepted transitions in a local SQLite ledger and renders them in a
  Temporal State Graph.
- Shows State Snapshot, Current Work, and `/api/state/brief` / `agent_handoff`
  views for external-agent continuity.
- Uses Work IDs and Work Trace Spine views to anchor AG-xxx task context.
- Provides a five-tab Cockpit operator UI: Overview, Work, Perspective,
  Bridge, and Operator. Perspective contains Ledger Basis, Evidence, Tensions,
  and Boundary / Next sections.
- Exposes MCP / ChatGPT App bridge tools for read-first state access and gated
  proof recording.
- Includes Codex handoff, completion, evidence, and session helper scripts.
- Provides a read-only Temporal Interpretation Preview for structured
  project-context interpretation.

## How it uses OpenAI APIs

OpenAI APIs are used for interpretation, planning, and preview generation, not
direct mutation of durable state.

- `POST /api/observe` uses the OpenAI Responses API to compile natural language
  into typed temporal state delta proposals when `OPENAI_API_KEY` is set.
- `POST /api/plan` uses committed Augnes state to generate grounded
  next-action recommendations when `OPENAI_API_KEY` is set.
- `POST /api/temporal-interpretation/preview` uses OpenAI to generate a
  read-only temporal interpretation preview when `OPENAI_API_KEY` is set.
- Deterministic mock fallbacks keep the local demo runnable when
  `OPENAI_API_KEY` is unset.

The runtime validates model output before saving proposals. Only accepted
transitions become committed state.

## Quick start

Run the local runtime:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Then open:

```text
http://localhost:3000
```

`OPENAI_API_KEY` is optional for the local demo because deterministic mock
fallbacks are included. To test OpenAI-backed observe, plan, and preview flows,
set `OPENAI_API_KEY` in your local environment. Do not commit `.env` or
`.env.local`.

## Bridge proof

Start the MCP / ChatGPT App bridge in a second terminal:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

The bridge listens at:

```text
http://localhost:8787/mcp
```

With MCP Inspector, run `augnes_get_state_brief` for `project:augnes`, then run
`augnes_record_action_result` with a safe proof action. The committed graph node
shows that an external MCP-compatible client read Augnes state and recorded an
action result back into the runtime without gaining commit/reject authority.

### ChatGPT App / Developer Mode use

After the bridge is running, connect ChatGPT Developer Mode or any
MCP-compatible client to:

```text
http://localhost:8787/mcp
```

Useful calls:

- `augnes_get_state_brief` with args `{ "scope": "project:augnes" }`
- `augnes_get_work_brief` with args `{ "scope": "project:augnes", "work_id": "AG-001" }`

These calls let ChatGPT read committed Augnes project state, `agent_handoff`,
work status, proof links, and Codex handoff context without receiving
commit/reject authority.

For Codex-side usage, see the [Codex Session Adapter workflow](docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md),
which covers `codex:read-brief`, `codex:record-evidence`, and
`codex:record-completion`.

## Screenshots

### Cockpit

| Cockpit Overview | Perspective-centered IA |
|---|---|
| <img src="screenshots/12-final-cockpit-overview.png" width="520" alt="Cockpit Overview with five top-level tabs"> | <img src="screenshots/17-final-perspective-current-frame.png" width="520" alt="Perspective tab showing current frame, Ledger Basis, Evidence, Tensions, and Boundary / Next"> |

### AI surfaces using Augnes

| ChatGPT state brief | ChatGPT work brief | Codex completion proof |
|---|---|---|
| <img src="screenshots/13-final-chatgpt-state-brief.png" width="320"> | <img src="screenshots/14-final-chatgpt-work-brief.png" width="320"> | <img src="screenshots/15-final-codex-terminal-completion-proof.png" width="320"> |

More screenshots and supporting proof captures are listed in [screenshots/README.md](screenshots/README.md).

## Demo flow

1. Run the quick-start commands and open the Cockpit.
2. Review the Overview tab and Temporal State Graph.
3. Open Work to see AG-xxx Work Focus / Trace Spine context.
4. Open Perspective to inspect the current frame, Ledger Basis, Evidence,
   Tensions, and Boundary / Next.
5. Open Bridge to review read-first / no direct external-control boundaries.
6. Open Operator to see safe local runtime controls.
7. Fetch `/api/state/brief?scope=project:augnes` and inspect `agent_handoff`.
8. Start the MCP bridge and verify state brief + action record proof through
   MCP Inspector.

## Security and boundaries

- No API keys are committed. `.env` and `.env*.local` are ignored.
- Augnes is local-first and is not a hosted production deployment.
- Production auth, OAuth, and multi-user support are intentionally out of
  scope for this challenge build.
- The model does not directly mutate durable state.
- Commit/reject authority remains user/runtime gated.
- The bridge remains read-first plus gated proof recording.
- Work IDs are trace anchors, not state authority.
- Action records are execution proof.
- GitHub App installation-token exchange remains future/design-boundary work;
  this repo does not implement a live GitHub App token provider.

## Limitations

- The app is a local challenge build, not a hosted service.
- The bridge proof uses local MCP / Inspector workflows.
- OpenAI-backed flows require a locally supplied `OPENAI_API_KEY`.
- Mock fallbacks are deterministic and useful for demos, but they are not a
  replacement for evaluating OpenAI-backed behavior.
- The runtime is single-operator/local-first and does not implement production
  auth or multi-user collaboration.

## Deep docs

- [Temporal Interpretation Preview runbook](docs/TEMPORAL_INTERPRETATION_PREVIEW_RUNBOOK.md)
- [Temporal Interpretation v0.2 status and roadmap](docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md)
- [Codex Session Adapter workflow](docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md)
- [Evidence Pack / verification evidence](docs/VERIFICATION_EVIDENCE_PACK.md)
- [Cockpit Perspective IA](docs/COCKPIT_PERSPECTIVE_IA_V0_1.md)
- [Superseded Cockpit six-tab functional map](docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md)
- [GitHub token management boundary](docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1.md)
- [GitHub App installation-token config boundary](docs/GITHUB_APP_INSTALLATION_TOKEN_CONFIG_BOUNDARY_V0_1.md)
- [Authority matrix](docs/AUTHORITY_MATRIX.md)
- [Development onboarding](DEVELOPMENT_ONBOARDING.md)
- [Latest docs index](docs/00_INDEX_LATEST.md)

## Submission tagline

Augnes turns AI-assisted work into temporal state trajectories: the model
interprets, the runtime owns state, the user gates changes, Work IDs anchor
traces, and the graph shows proof over time.
