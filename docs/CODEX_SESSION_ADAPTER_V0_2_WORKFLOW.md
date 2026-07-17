# Native-Host Session Adapter Workflow

## Purpose

This compatibility filename now documents the current provider-neutral R5 host
boundary. Native-host sessions are owned by the shared run lifecycle; operators
do not bind a session, copy a packet, paste a result, or enter provider/session
identifiers into Augnes.

## Current flow

```text
active project and work
→ persisted TaskContextPacket admission
→ deterministic or live native-host adapter
→ bounded lifecycle and approvals
→ structured NativeHostResult
→ complete receipt normalization
→ canonical RunReceipt admission
→ Project Home, Workbench, and Inspector readers
```

The deterministic adapter and Codex App Server reference adapter share the same
provider-neutral contract. Interactive and policy-triggered modes share packet
admission, lifecycle, result normalization, receipt authority, and project
readers. Provider-specific session, thread, turn, and approval IDs remain
bounded `ExternalRef` values produced by the adapter; users do not transfer
them.

## Lifecycle and safety

- startup capability is lazy and optional;
- packet identity, fingerprint, freshness, lineage, and project binding fail
  closed before execution;
- approvals grant only the exact requested host action;
- timeout, cancellation, disconnect, reconnect, settlement, replay, and
  conflict refusal use the shared lifecycle;
- exact replay creates no duplicate receipt;
- the runtime owns and cleans up the verified process tree;
- native-host completion creates execution residue only, not a proposal,
  `ReviewDecision`, semantic transition, Evidence acceptance, or work closure.

## Retained helper surface

These helpers are separate from native-host result intake:

- `npm run codex:read-brief` reads bounded work context when runtime discovery
  is explicitly requested.
- `npm run codex:next-work` provides honest runtime-or-repo discovery fallback.
- `npm run codex:record-evidence` optionally records authorized verification
  observations.
- `npm run codex:record-completion-proof` optionally records proof-only
  operator closeout trace.

The evidence and proof helpers do not create a native-host `RunReceipt`, bind a
host session, or mutate semantic project truth. Their use requires a concrete
work item, available runtime, and explicit authority where applicable.

## Review surfaces

Project Home shows the current run and latest project-scoped result. Workbench
opens that result read-only. Inspector shows packet, run, host, approval,
artifact, action, check, trust, coverage, privacy, and lineage detail. Missing
historical fields remain truthfully absent; no prose parser reconstructs them.

## Verification

The canonical R5 verification surface is:

```bash
npm run typecheck
npm run build
npm test
npm run test:integration
npm run test:authority
npm run test:operability
npm run test:e2e
```

Deterministic fakes make zero live provider requests. Live remote-host
qualification remains Alpha/RC scope.
