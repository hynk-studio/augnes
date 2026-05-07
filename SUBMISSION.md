# Submission Message

Submission: Augnes - Temporal State Trajectories for AI Work

GitHub: https://github.com/Aurna-code/augnes

Augnes started from a practical annoyance: I was tired of being the human message bus between ChatGPT, Codex, GitHub, and local project state.

ChatGPT could plan and review. Codex could implement and test. GitHub could store the code. But the actual project state, next action, blockers, and proof trail still lived in my head.

Augnes makes that coordination explicit. It turns AI work into temporal state trajectories: the model interprets, the runtime owns state, the bridge lets agents act, work IDs anchor task traces, and the graph shows what changed.

It is not chatbot memory, a prompt wrapper, a generic task tracker, or an autonomous agent swarm.

It is a temporal state runtime, a project/work coordination layer, a bridge between ChatGPT, Codex, GitHub work, and user decisions, and a proof trail for what changed and why.

Current product shape:

1. Current Work card: project-level status, next action, blockers/tensions, and Codex handoff from `/api/state/brief` and `agent_handoff`.
2. Work Focus / Trace Spine: AG-xxx task-level context, recent events, related proof, related state keys, and work-specific Codex handoff.
3. ChatGPT App bridge tools: state brief and work brief access through Developer Mode, with write tools gated behind local bridge mode.
4. Codex completion protocol: `npm run codex:record-completion` records both official action proof and human-readable work trace notes.
5. Temporal State Graph: the time-oriented view of committed state transitions and recorded proof.

Authority stays explicit:

- committed Augnes state is the source of truth
- `work_id` is only a trace anchor
- `action_records` are official execution proof
- `work_events` are human-readable trace notes
- the ChatGPT App does not get commit/reject authority

Live validation completed:

- ChatGPT Developer Mode state brief validation through the local bridge/tunnel flow.
- ChatGPT Developer Mode Work tools validation through the local bridge/tunnel flow.
- Codex completion recording validated against the local runtime.

This is still local-first, not a hosted production deployment.
