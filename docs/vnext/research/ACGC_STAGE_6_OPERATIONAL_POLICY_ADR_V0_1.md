# ACGC Stage 6 Operational-Policy Non-Activation ADR v0.1

## 1. Status

```text
Decision ID: ACGC6B
Date: 2026-08-16
Status: accepted for the current evidence state
Lifecycle: Completed by PR #180 at cfcf0674ca682fd647fe166b23e47bcb511a62bf
Scope: ACGC Stage 6 operational-policy architecture decision
Related issue: Issue #179
Evidence predecessor: ACGC6A, Issue #177 / PR #178
```

This status accepts a no-activation architecture decision for the evidence that
exists now. It does not claim that an operational policy exists, that Stage 6
has demonstrated policy fitness, or that later implementation is approved.

ACGC6B merged in PR #180, so Stage 6 is Completed. That closeout does not
authorize or start Stage 7; Stage 7 remains unstarted and separately
authorized only through a future explicit issue and decision.

## 2. Classification and authority

This document is a **supporting ACGC research/architecture decision**. It
records how the current evidence is interpreted and supports the
[ACGC research program](./AUGNES_ADAPTIVE_CONTINUITY_AND_GOVERNED_COMPOUNDING_RND_PROGRAM_V0_1.md).

It is not:

- Core semantic authority;
- runtime authority;
- product policy;
- an implementation status owner;
- evaluation authority; or
- permission to begin Stage 7.

The active product, protocol, sequencing, and evaluation owners remain the
[Masterplan](../01_AUGNES_VNEXT_MASTERPLAN.md),
[Architecture and Protocol](../02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md),
[Transition Roadmap](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md), and
[Evaluation and Maturity](../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md).
Checked-in code and configuration remain the truth for implemented behavior.

No-policy is an explicit architecture decision, not an implementation
omission. Proof is review material rather than approval, and Stage 6 completion
does not grant Stage 7 authority.

## 3. Context

ACGC Stage 5 exercised one explicit continuation path:

```text
Run A
-> exact source-bound OperationalContextSelection
-> explicit Packet B
-> explicit current-lineage admission
-> fresh Browser-confirmed Start grant
-> Run B
-> source-linked attribution and comparison
```

ACGC6A then rebuilt the exact public-safe Stage 5 case across deterministic
model/host route profiles, capability narrowing, zero-model availability, and
fresh predecessor replay. Its profiles, fallback plans, executions, and
benchmark were bounded research artifacts. They did not become product
activation state.

Issue #179 asks whether those completed mechanisms and research artifacts now
justify a live operational-policy owner, schema, active pointer, activation or
rollback receipts, or automatic behavior. They do not. The existing explicit
path is sufficient for the current product/research need, while the evidence
does not support reserving durable architecture for a live policy.

## 4. Evidence baseline

### 4.1 Stage 5 conclusion

The exact Stage 5 conclusion is preserved:

- the end-to-end continuation mechanism worked;
- one selected operational entry was delivered and referenced;
- item actual use remained unknown;
- support validation remained unknown;
- outcome association remained unknown;
- causal contribution remained unknown;
- task and verification results were equal in the deciding exact case;
- structural coordination and complete-path review burden favored the one-run
  baseline;
- usage, monetary cost, required human intervention, and genuine performance
  latency were unobserved;
- the exact-case result was `inconclusive`; and
- no general benefit, general failure, harmful Packet B transfer, or policy
  fitness was established.

The working mechanism is therefore evidence that the explicit continuation
path is viable. It is not evidence that an active policy would improve results.

### 4.2 ACGC6A conclusion

The exact ACGC6A conclusion is also preserved:

- the same-model cold-session-shaped route was contract-compatible;
- capability narrowing failed closed and required explicit fallback;
- the alternate provider/host-shaped route preserved normalized contracts
  without a real provider call;
- deterministic zero-model execution remained available;
- predecessor replay was actually reconstructed after exact candidate
  settlement with fresh identities;
- unavailable and `not_executed` routes were represented without fabricated
  execution residue;
- fallback source and chronology were exact-bound;
- model quality, provider reliability, broad capability equivalence, usage,
  cost, genuine latency, retention, and human intervention remained
  unobserved;
- the summary was `inconclusive`; and
- no active route, route winner, policy fitness, or automatic fallback
  authority was created.

ACGC6A established route-contract and fallback readiness only. Fallback
readiness is not automatic fallback authority.

## 5. Decision

Do not introduce or activate a live operational policy owner,
operational-policy contract or schema, Project Controls extension, immutable
operational ledger, active route pointer, activation receipt, rollback receipt,
automatic fallback, automatic context injection, or automatic execution
behavior now.

### 5.1 Current sufficiency boundary

Current code and configuration are sufficient for the explicit current
product/research path:

- explicit per-invocation route preparation;
- exact model/host and receipt identity;
- explicit Packet B admission;
- fresh Browser-confirmed Start grants;
- explicit benchmark fallback plans;
- fresh predecessor replay;
- deterministic zero-model continuity; and
- rebuildable research comparison.

Current code and configuration are not sufficient for a durable active
operational policy with:

- a durable active policy pointer;
- policy revision and expiry;
- live policy fallback and rollback;
- automatic route selection; or
- automatic context-policy application.

The first answer is **yes** for the explicit current product/research path. The
second answer is **no** for a durable active operational policy. The missing
live-policy owner does not justify creating one now, and this list of absent
capabilities is not implementation authorization.

### 5.2 Project Controls

Do not extend Project Controls.

`ProjectAutomationControlV01` owns project automation
enable/disable/pause. Its policy is fixed and conservative, and it acts as an
outer automation-admission gate. It does not own context ranking,
provider/model route selection, TTL, a fallback target, or rollback.

Personal Perspective project scope owns an explicit project-level
include/exclude selection. It is also not an operational-policy owner.
Extending either owner would conflate distinct durable meanings.

### 5.3 Immutable operational ledger

Do not add a separate immutable operational ledger now:

- no live operational policy is authorized;
- Stage 5 benefit was not established;
- ACGC6A proved contract and fallback readiness, not policy fitness;
- ACGC6A profiles, plans, and benchmarks are research artifacts;
- `EpisodeDeltaProposal` and proposal-only `ReviewDecision` are not
  activation; and
- speculative record kinds would reserve architecture without a supported
  product need.

### 5.4 Current ownership answer

There is no current owner for an active pointer, policy revision, policy
expiry, live-policy fallback, or rollback, because no live operational policy
exists.

The absence is intentional. It is neither an owner gap that must be filled now
nor permission to assign the responsibility to a nearby record or service.

## 6. Current owner audit

The owner audit preserves these current responsibilities:

- Model Gateway owns per-invocation model execution and receipt identity.
- Native Host owns adapter capability and execution-result contracts.
- `TaskContextPacket` is immutable run context.
- `OperationalContextSelection` is a rebuildable bounded selection.
- operational continuation admission owns exact Packet B current-lineage
  admission.
- Project Automation Control is a coarse automation gate.
- semantic `Decision` and `Transition` own semantic meaning only.
- ACGC6A profiles, plans, and benchmark are pure research output.

None owns a live operational policy.

| Owner or candidate | Current responsibility | Explicitly not owned | ACGC6B disposition |
| --- | --- | --- | --- |
| Project Automation Control | Project-level automation enable/disable/pause and conservative outer admission | Context ranking, provider/model route selection, TTL, fallback target, rollback, or active policy revision | Keep unchanged; reject extension |
| Personal Perspective project scope | Explicit project-level inclusion or exclusion of Personal Perspective material | Operational policy, automatic context injection, route selection, TTL, fallback, or rollback | Keep unchanged; not an operational-policy owner |
| Model Gateway | One bounded invocation, explicit execution envelope, model/provider identity, and invocation receipt | Persistent active route, project policy pointer, context policy, activation, expiry, or rollback | Keep per-invocation behavior unchanged |
| Native Host adapter/result | Adapter identity, capability reporting, bounded request, and execution result | Active policy, semantic acceptance, durable route choice, activation, or rollback | Keep host contracts unchanged |
| `TaskContextPacket` | Immutable bounded context for one run, including selected/excluded material and constraints | Mutable policy, active pointer, automatic injection, fallback target, or rollback | Keep immutable packet meaning unchanged |
| `OperationalContextSelection` and Packet B materialization | Pure, rebuildable bounded selection and explicit candidate packet materialization | Durable product state, activation, execution authority, or automatic injection | Keep rebuildable and non-authoritative |
| Operational continuation admission | Exact current-lineage Packet B admission under an authenticated action | Inherited Start authority, persistent policy, route choice, automatic continuation, or semantic Transition | Keep explicit admission unchanged |
| ACGC6A route profile, fallback plan, and benchmark | Pure deterministic research description, explicit plans, exact executions, and inconclusive comparison | Product route winner, active pointer, policy fitness, activation, or automatic fallback authority | Keep as research output only |
| Semantic `Decision` / `Transition` | Accepted semantic meaning and its explicit state change | Operational activation, provider/model routing, policy TTL, fallback, or rollback | Reject reuse for operational activation |
| Future dedicated project-local operational-policy owner | No current responsibility; this owner does not exist | No schema, table, record kind, API, route, or broad provider/model policy is authorized by ACGC6B | Deferred candidate only if Stage 7 is separately authorized and first nominates the owner |

## 7. Options considered

### 7.1 Keep current explicit code/config only

**Selected now.** It supports the currently evidenced explicit route,
admission, grant, fallback-plan, replay, zero-model, and comparison paths
without inventing durable policy state.

### 7.2 Extend `ProjectAutomationControlV01`

**Rejected now.** It would conflate coarse automation admission with context
selection, route policy, revision, expiry, fallback, and rollback.

### 7.3 Persist ACGC6A profiles or plans as active policy

**Rejected.** Research observations and benchmark inputs are not product
activation state, and ACGC6A established no winner or policy fitness.

### 7.4 Add a generic operational-policy ledger and pointer now

**Rejected.** The product need and benefit remain unproven. A generic ledger
would reserve broad architecture before a narrow policy domain is justified.

### 7.5 Reuse semantic `Decision` / `Transition`

**Rejected.** Operational activation is not accepted semantic meaning.
Conflating them would change Core meaning and authority.

### 7.6 Let Model Gateway own a persistent active route

**Rejected.** Model Gateway owns bounded invocations and receipts, not a
project-local durable policy lifecycle.

### 7.7 Design a dedicated project-local owner in Stage 7

**Deferred candidate only.** No owner design, schema, table, record kind, API,
route, or implementation is authorized now.

## 8. Backup, restore, portability, package, and migration consequences

The current impact is **none** because ACGC6B adds no runtime state. It changes
no schema, migration, recovery contract, backup contract, portable-project
contract, package manifest, platform support, or startup behavior.

The current owners already preserve important separations: portable import is
transactional and creates no semantic or automation authority; machine-local
provider and execution bindings are excluded from portable export; recovery
validates exact backup identity and compatible database contracts; and package
manifests bind explicit runtime and migration compatibility. Those observations
do not make a future policy portable or restorable automatically.

If later separately authorized work creates live policy state, it must satisfy
all of these constraints:

- future live policy state must restore atomically or fail closed;
- revision, pointer, activation provenance, predecessor, expiry, and rollback
  relation may not be partially reconstructed;
- missing or incompatible dependencies disable activation;
- provider-, host-, or machine-specific active route bindings must be excluded
  from portable export by default;
- portable import must never activate a policy;
- startup must never implicitly activate imported or restored state;
- provider-neutral policy material would require a separate portability audit;
  and
- Windows, Linux, and packaged-runtime behavior require actual platform
  evidence.

These are future constraints, not a schema or implementation plan. ACGC6B does
not change portability, recovery, backup, restore, package, or migration code.

## 9. Conditional future constraints

If Stage 7 is separately authorized, it must first nominate one dedicated
project-local operational-policy owner distinct from Project Controls, Personal
Perspective scope, Model Gateway, Native Host, `TaskContextPacket`,
`OperationalContextSelection`, continuation admission, semantic
`Decision`/`Transition`, and ACGC6A research artifacts.

The first eligible future policy domain remains the narrow project-local
`context_selection_policy` described by the ACGC research program. It must not
be expanded into a general provider/model routing policy.

No activation receipt is required now because no activation exists. If Stage 7
creates a live active policy, explicit immutable activation provenance or an
exact equivalent will be required unless the Stage 7 owner proves that an
existing immutable owner already binds:

- actor;
- action time;
- policy revision;
- exact predecessor;
- expected pointer revision;
- expiry; and
- activation effect.

Rollback must also be explicit and auditable. ACGC6B does not select or
implement a schema for either activation or rollback.

## 10. Stage 7 re-entry boundary

- Stage 7 is not authorized.
- Stage 7 is not Current.
- Stage 7 has not started.
- The repeated-benefit gate is not satisfied.
- Stage 5 remained inconclusive with observed baseline-favoring overhead.
- ACGC6A established route-contract and fallback readiness only.
- No live-provider quality/resource cohort exists.

Possible later evidence tracks remain separate and unauthorized:

- additional independent Stage 5 benefit cases with complete resource
  observations;
- an optional live-provider/model-host succession cohort with explicit cost and
  egress authority; or
- one concrete context-selection failure showing that the explicit current
  path is inadequate.

This decision defines no new numeric evaluation threshold. Re-entry requires a
separate issue and authorization, then a fresh reading of the active product,
protocol, sequencing, and evaluation owners.

## 11. Authority/effect ledger

The following ledger records the product/runtime effect of ACGC6B. Authorized
repository synchronization, commit, push, and Draft PR transport are
administrative provenance outside this product/runtime ledger.

```text
runtime code changed = false
schema/migration changed = false
Core record kind added = false
project-control meaning changed = false
Model Gateway route behavior changed = false
Native Host behavior changed = false
TaskContextPacket changed = false
semantic state/Decision/Transition changed = false
policy definition persisted = false
active pointer created = false
activation receipt created = false
rollback receipt created = false
automatic context injection authorized = false
automatic Start/Resume authorized = false
automatic fallback/rollback authorized = false
provider/model/network/GitHub/external calls = 0
Stage 7 authorized = false
```

## 12. Consequences and limitations

### Consequences

- The explicit per-invocation, explicit Packet B admission, fresh Start-grant,
  explicit fallback-plan, predecessor-replay, and zero-model paths remain the
  current boundary.
- No neighboring owner gains operational-policy meaning.
- No speculative state needs migration, recovery, portability, package, or
  cross-platform support.
- A future policy cannot enter indirectly through a research artifact, semantic
  decision, project-control extension, packet field, gateway default, import,
  restore, or startup behavior.

### Limitations

- There is no durable policy pointer, revision, expiry, activation, fallback,
  rollback, or automatic context application.
- No policy fitness, model quality, provider reliability, benefit, cost,
  resource, latency, retention, or intervention conclusion is available.
- The ADR does not resolve whether a future narrow policy would be useful; it
  records that the present evidence does not justify creating one.
- Stage 7, a live-provider cohort, Packet C, a second continuation, retry,
  scheduling, automatic Start/Resume/fallback/rollback, and publication remain
  outside this decision.

## 13. Links

- [Issue #179 — ACGC6B: Record the operational-policy non-activation ADR and close Stage 6](https://github.com/hynk-studio/augnes-perspective-lab/issues/179)
- [PR #180 — ACGC6B operational-policy non-activation ADR](https://github.com/hynk-studio/augnes-perspective-lab/pull/180)
- [PR #178 — ACGC6A model and host succession benchmark](https://github.com/hynk-studio/augnes-perspective-lab/pull/178)
- [ACGC Post-Stage-6 Evidence Direction v0.1](./ACGC_POST_STAGE_6_EVIDENCE_DIRECTION_V0_1.md)
- [Adaptive Continuity and Governed Compounding R&D Program v0.1](./AUGNES_ADAPTIVE_CONTINUITY_AND_GOVERNED_COMPOUNDING_RND_PROGRAM_V0_1.md)
- [Augnes vNext authority map](../00_AUGNES_VNEXT_DOCUMENT_INDEX.md)
- [Augnes vNext transition roadmap](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md)