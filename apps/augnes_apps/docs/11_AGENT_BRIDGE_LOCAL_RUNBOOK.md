# Agent Bridge Local Runbook

## Boundary

The ChatGPT App bridge is a read-only project and work context surface. Augnes
Core owns canonical state and native-host `RunReceipt` admission. Project Home
starts native-host work from the exact persisted `TaskContextPacket`; the App
does not copy/export that packet, execute the host, accept pasted result prose,
bind host sessions, or request users to enter internal identifiers.

Bridge-gated readers may summarize state, work, evidence, traces, mailbox, and
publication previews. They do not approve, publish, replay, record proof,
execute Codex, call GitHub/OpenAI, or mutate semantic state.

## Prerequisites

- Node.js and repository dependencies installed
- a local Augnes runtime when HTTP-backed bridge reads are required
- bridge mode enabled only for explicit local operator use

## Start the runtime and bridge

From the repository root:

```bash
npm run augnes
```

From `apps/augnes_apps`:

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_CORE_MODE=http \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run dev
```

Mock mode remains the safe default when no runtime is available:

```bash
AUGNES_USE_MOCK=true npm run dev
```

## Verify bridge health

```bash
curl -sS http://localhost:8787/healthz
npm run inspect
```

Public/default mode must expose only the documented read-only public tools.
Bridge mode may add its documented read-only operator tools. Neither mode may
expose packet-copy, result-paste, handoff-generation, host-session-binding, or
native-host receipt mutation tools.

## ChatGPT Developer Mode

For an explicitly authorized local test, expose the MCP server over a bounded
HTTPS tunnel and register the resulting `/mcp` URL in a fresh Developer Mode
app. Tunnel hostnames and screenshots may be sensitive; do not commit them.
The in-app widget remains read-only and uses no clipboard, storage, eval,
external scripts, or direct browser network APIs.

## Human-facing answers

Call `augnes_get_state_brief` or the relevant bounded read tool, then answer in
plain language: current status, next step, rationale, and decisions or blockers
that still require the user. Raw state keys and identifiers are secondary
grounding only. Do not generate a transport packet or ask the user to paste a
native-host result.

The automatic execution result is reviewed in Project Home, read-only
Workbench result review, and Inspector. App summaries do not replace those
durable project-scoped readers.

## Verification

```bash
npm --prefix apps/augnes_apps run typecheck
node --import tsx apps/augnes_apps/scripts/smoke.ts
node --import tsx apps/augnes_apps/scripts/invariants.ts
npm run typecheck
```

Normal tests use deterministic fixtures and make zero live provider requests.
