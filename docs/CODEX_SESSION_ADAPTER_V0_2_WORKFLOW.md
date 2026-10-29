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

## Host composition and execution binding

`native-host-execution-composition.ts` owns the fixed host selection at the
existing injection boundary. The default live route constructs the Codex App
Server adapter lazily. An explicitly injected unscoped adapter uses the same
run service without resolving that constructor through the composition edge.
Capability readers remain synchronous; the existing `adapter_factory` and
source-owned `scoped_task` signatures remain compatible.

`codex-live-host-composition.ts` owns scoped window authenticity, attempt
admission, timeout caps, adapter-to-scope identity, attempt settlement, and
snapshot release. `codex-native-host-round-trip-binding.ts` owns authored-scope
checks, binding the real admitted request to the snapshot, and snapshot/source
validation of the returned result. These are fixed trusted implementations,
not caller-supplied validators or a mutable host registry.

The reusable live service owns controllers, approvals, cancellation, resume,
settlement, and project readers. The common round trip retains packet/project
and execution-authority admission, run claims, result normalization and receipt
admission. It binds scoped input before admission callbacks or provider egress;
the adapter retains its point-of-use and one-use checks. Return validation still precedes
receipt admission and retains the original failed/blocked outcomes and snapshot
observations. Shared terminal-result construction keeps the existing receipt
identities and public errors.

This boundary does not change authentication, provider selection, Core records,
persisted schemas, execution grants, or the meaning of a completed result.
Dependency checks cover the exercised service/composition edges and their
observed side effects; they do not establish universal absence of Codex modules
from unrelated transitive imports, or a performance or usefulness improvement.

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
