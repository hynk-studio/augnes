# Final Submission Screenshots

These screenshots were captured from the local Augnes demo runtime for the OpenAI Dev Challenge submission.

- `01-overview-temporal-state-graph.png`: Overview tab with the Temporal State Graph and committed state lanes visible.
- `02-work-trace-spine.png`: Work tab showing Work Focus and AG-xxx trace context.
- `03-ledger-committed-state.png`: Ledger tab showing committed state, grouped snapshot, and ledger graph.
- `04-proof-evidence-boundary.png`: Proof tab showing the evidence-only boundary and read-only proof panels.
- `05-bridge-read-first-boundary.png`: Bridge tab showing read-first authority and blocked external-control boundaries.
- `06-state-brief-json.png`: Live `/api/state/brief?scope=project:augnes` response rendered from `curl`, showing `runtime`, `scope`, `agent_handoff`, and state groups.
- `07-temporal-interpretation-preview.png`: Proof tab with the advanced Temporal Interpretation Preview generated via the explicit preview button.
- `08-operator-pending-proposals.png`: Operator tab showing safe local runtime controls and the pending local proposal queue.

Capture environment:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-final-submission.db npm run dev -- --port 3000
```
