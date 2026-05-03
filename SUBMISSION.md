# Submission Message

Submission: Augnes — Temporal State Trajectories for AI Work

GitHub: https://github.com/Aurna-code/augnes

Augnes is not a chatbot with memory. It is a temporal state runtime for AI-assisted work.

OpenAI APIs interpret natural language and propose typed, time-aware state deltas. The Augnes runtime validates those proposals, asks for commit/reject, records accepted transitions in a temporal ledger, and visualizes each state key as a trajectory over time.

Demo flow:
1. User describes project goals, constraints, and future plans.
2. Augnes proposes temporal state deltas.
3. User commits/rejects proposals.
4. State Snapshot and State Trajectory View update.
5. Planner recommends actions grounded in active committed state.
6. Local tools create real checklist/demo files.
7. Action results become after-action state transitions.
8. Codex or another agent can read `/api/state/brief` for compact cross-agent state continuity.

The model interprets.
The runtime owns state.
The timeline shows how work evolves.
