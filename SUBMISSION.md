# Submission Message

Submission: Augnes - Temporal State Trajectories for AI Work

GitHub: https://github.com/Aurna-code/augnes

Augnes turns AI-assisted work into temporal state trajectories: the model interprets, the runtime owns state, user gates commit/reject, Work IDs anchor traces, and the graph shows proof of change.

What I built:

- A local-first Next.js + SQLite runtime cockpit for project/work state.
- Typed temporal state delta proposals with commit/reject gates.
- A Temporal State Graph showing committed transitions and recorded proof.
- Work Focus / Trace Spine views for AG-xxx work context.
- MCP / ChatGPT App bridge proof that reads state and records gated proof without commit/reject authority.

How it uses OpenAI APIs:

- `POST /api/observe` uses the OpenAI Responses API to compile natural language into typed temporal state delta proposals when `OPENAI_API_KEY` is set.
- `POST /api/plan` uses committed state to generate grounded next-action recommendations when `OPENAI_API_KEY` is set.
- `POST /api/temporal-interpretation/preview` uses OpenAI to generate a read-only temporal interpretation preview when `OPENAI_API_KEY` is set.
- If `OPENAI_API_KEY` is unset, deterministic mock fallbacks keep the local demo runnable.

How to run locally:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Bridge proof:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

Screenshots and proof are committed under `screenshots/`, including the Temporal State Graph, `/api/state/brief` JSON with `agent_handoff`, MCP Inspector state brief success, MCP Inspector action record success, and the bridge-recorded proof node in the graph.

Why AI was necessary: Augnes uses the model for the interpretive work of turning messy project conversation into structured proposals, grounded next actions, and reviewable temporal interpretation while keeping durable state under runtime/user authority.

Boundaries: no API keys are committed. The model does not directly mutate durable state. The bridge remains read-first plus gated proof recording. This is local-first, not hosted production, not autonomous execution, and not ChatGPT App commit/reject authority.
