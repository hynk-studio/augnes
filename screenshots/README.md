# Historical OpenAI Dev Challenge Screenshots

These screenshots were captured from earlier local Augnes demo runtimes for the
OpenAI Dev Challenge submission and related proof captures.

They are historical evidence of earlier Cockpit-era, Perspective, MCP bridge,
and Codex flows. They are not the current product information architecture.
Current public-facing structure is Blank State + Agent Workplane + GuideBrief,
with Legacy Cockpit removed as a product surface.

- `01-overview-temporal-state-graph.png`: Historical Overview tab with the five-tab Cockpit IA and Temporal State Graph visible.
- `02-work-trace-spine.png`: Historical Work tab showing Work Focus and AG-xxx trace context.
- `03-perspective-ledger-basis.png`: Perspective section showing Ledger Basis as committed runtime state.
- `04-perspective-evidence-boundary.png`: Perspective tab showing Evidence as a summary-first, read-only proof surface.
- `05-bridge-read-first-boundary.png`: Bridge tab showing read-first authority and blocked external-control boundaries.
- `06-state-brief-json.png`: Live `/api/state/brief?scope=project:augnes` response rendered from `curl`, showing `runtime`, `scope`, `agent_handoff`, and state groups.
- `07-perspective-current-frame.png`: Perspective tab showing the Current Perspective Frame and read-only interpretation boundary.
- `08-operator-pending-proposals.png`: Historical Operator tab showing safe local runtime controls and the pending local proposal queue.
- `09-bridge-state-brief-success.png`: MCP Inspector connected to `http://localhost:8787/mcp` and successfully ran `augnes_get_state_brief` for `project:augnes`, showing the state brief and `agent_handoff`.
- `10-bridge-action-record-success.png`: MCP Inspector successfully ran `augnes_record_action_result` with the safe `final_bridge_proof_check` action and received the no-commit/no-reject proof response.
- `11-bridge-action-node-in-graph.png`: Historical Runtime Cockpit Overview showing the bridge-recorded `external.final_bridge_proof_check_recorded` completion node in the Temporal State Graph.
- `12-final-cockpit-overview.png`: Historical Cockpit Overview showing the five-tab product flow and Temporal State Graph.
- `13-final-chatgpt-state-brief.png`: Actual ChatGPT Developer Mode call to `augnes_get_state_brief`, showing `agent_handoff` from Augnes.
- `14-final-chatgpt-work-brief.png`: Actual ChatGPT Developer Mode call to `augnes_get_work_brief` for AG-001, showing completed status, PR proof, recent events, and Codex handoff.
- `15-final-codex-terminal-completion-proof.png`: Actual terminal screenshot showing `codex:record-completion` recording completion proof into Augnes.
- `16-final-mcp-bridge-proof-summary.png`: Supporting bridge proof summary showing MCP-compatible state brief access and exposed Augnes bridge tools.
- `17-final-perspective-current-frame.png`: Actual Perspective tab screenshot showing the Current Perspective Frame and Perspective-centered IA.
- `18-final-perspective-mobile.png`: Mobile Perspective screenshot showing the historical five-tab nav wrapping cleanly.
- `19-final-perspective-evidence.png`: Perspective Evidence section showing summary-first read-only proof context.
- `20-final-perspective-tensions.png`: Perspective Tensions section showing unresolved counter-pressure without clipped cards.
- `21-final-perspective-boundary-next.png`: Perspective Boundary / Next section showing read-only navigation and authority boundaries.

Capture environment:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-final-submission.db npm run dev -- --port 3000
```

Bridge proof environment:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-bridge-proof.db npm run dev -- --port 3000
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```
