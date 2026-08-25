# ACGC Post-RW1 Research Obligation Classification v0.1

> **Document status:** supporting R&D classification / non-authoritative / no implementation approval
>
> **Repository:** `hynk-studio/augnes-perspective-lab`
>
> **Reviewed source:** `main@44557e353bb7a949457abafcbd8a37f221a29f1f`
>
> **Related merged work:** PR #264 — `ACGC-RW1 — Build real-work continuity benefit pilot`
>
> **Primary upstream owners:** `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`, `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`, `docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`, `docs/vnext/research/AUGNES_ADAPTIVE_CONTINUITY_AND_GOVERNED_COMPOUNDING_RND_PROGRAM_V0_1.md`, and current checked-in code/runtime.
>
> **Source input:** post-RW1 domain/exposure expansion proposal reviewed after PR #264 merge.

---

## 0. Decision

The post-RW1 proposal contains three different kinds of future work that must not be collapsed into one backlog.

```text
Current research obligation
!=
Long-term research obligation
!=
Trigger-conditioned implementation candidate
```

The durable rule is:

> **A long-term research obligation records a problem Augnes must eventually be able to answer or survive if its product doctrine is to hold. It does not pre-approve any particular schema, enum, artifact, subsystem, policy, or implementation sequence.**

Likewise:

> **A proposed taxonomy or artifact shape is not a future obligation merely because it is a plausible way to represent the problem today.**

This note exists to preserve that distinction after RW1 and to avoid both failure modes:

1. losing genuinely necessary long-horizon research questions because an implementation was deferred; and
2. turning every useful proposal into a permanent implementation backlog.

---

## 1. Current / near-term research obligation

### 1.1 RW1 pre-action condition integrity

Before authentic RW1 collection begins, the current comparison must be able to distinguish at least:

```text
C1 continuity identity available
from
C1 continuity actually retrieved/presented before the first meaningful action
```

and must be able to detect material B0 contamination / ambient overlap rather than assuming condition contrast.

A narrow work-context annotation is also justified so task-family results are not silently interpreted as condition effects when B0 and C1 occur in materially different work mixes.

The preferred near-term slice is therefore bounded to:

```text
work domain / work phase annotation
+ pre-action C1 exposure observation
+ B0 ambient-overlap / contamination observation
+ derived condition-integrity status
+ task-mix comparability
```

This must remain additive to merged RW1 v0.1 and must not rewrite its condition meanings, ABBA schedule, episode identity, freeze fingerprint, current report, or authority semantics.

### 1.2 Kickoff gate

This pre-collection hardening applies to the current RW1 protocol only if local ignored pilot artifacts still show:

```text
authentic_real_work episodes = 0
```

If any authentic episode has already been frozen, RW1 v0.1 remains frozen for those episodes. Existing artifacts must not be rewritten or reinterpreted under a newly added field set. Any stronger overlay then requires a separately versioned follow-up lane.

---

## 2. Long-term research obligations

The following are problem-level obligations derived from Augnes's continuous-work doctrine. They should remain visible across future sequencing even if the current implementation proposal is rejected or replaced.

### 2.1 Negative-space continuity

Augnes must eventually demonstrate that continuity preserves not only what should remain available, but also the status of material that should **not** silently return as current truth or direction.

Representative problem forms include:

```text
rejected option revival
superseded plan revival
stale source treated as current
rejected hypothesis resurrection
removed artifact/section revival
lost rejection rationale
unknown silently converted into a negative fact
```

This obligation follows from Resume requiring accepted, rejected, stale, conflicted, and unresolved material to remain meaningfully distinct.

It does **not** require a canonical rejected-item blacklist, a dedicated negative-memory database, or automatic suppression policy.

### 2.2 Semantic-status and provenance preservation

Augnes must eventually demonstrate that long-running work does not silently change the epistemic or authority status of material while it is transferred, summarized, resumed, or projected across hosts and tasks.

Representative status boundaries include:

```text
hypothesis != established fact
model proposal != user acceptance
user consideration != user decision
recommendation != authorization
execution completion != verified success
Decision != Transition
unknown != negative fact
```

This obligation is broader than one proposed `semantic_origin_summary` object. Existing evidence, provenance, lineage, review, and authority owners should be reused whenever they can express the required distinction.

### 2.3 Artifact-identity continuity beyond Git

If Augnes is to support long-horizon work outside repository-centric software development, it must eventually demonstrate that it can preserve the identity/currentness/relation of the artifact the user is actually continuing.

Representative domains include writing, design, research synthesis, planning, analysis, casework, and long-running selection.

The problem is not to invent a universal artifact graph. The required property is narrower:

```text
what artifact/state is current
what was superseded or rejected
what relation a successor has to prior material
what constraints/rationale still govern the current artifact
```

A dedicated artifact object is therefore optional. The obligation is to preserve the meaning, not to standardize one representation prematurely.

### 2.4 Cross-domain meaning and status preservation

Long-horizon work often crosses domains, for example:

```text
research -> planning -> writing
investigation -> data analysis -> decision
research finding -> design constraint
planning option -> operational commitment
```

Augnes must eventually demonstrate that semantic status survives such transitions without laundering or inflation.

Representative failures include:

```text
hypothesis -> fact
option -> commitment
recommendation -> decision
historical constraint -> current requirement
exploratory result -> verified conclusion
```

This does **not** require a dedicated `cross_domain_transition` artifact unless real-work evidence shows existing lineage owners cannot express the transition adequately.

---

## 3. Trigger-conditioned implementation candidates

The following are possible implementation forms, not long-term obligations by themselves.

They should be opened only when real-work evidence shows a concrete representational or diagnostic gap that current owners cannot answer more directly.

### 3.1 Continuity-class taxonomy

Possible analytical categories such as work-state/handoff, epistemic, decision/authority, and reconciliation continuity may be useful.

The taxonomy itself is optional. Do not create canonical `C1`/`C2`/`C3`/`C4` enums merely to preserve the underlying problem classes, especially because `C1` is already an RW1 condition name.

### 3.2 Dedicated semantic-origin object

A separate semantic-origin summary may be justified only if existing source/provenance/evidence/review lineage cannot reconstruct the material status cheaply and unambiguously.

Do not create a second truth owner for user/model/source status merely for evaluation convenience.

### 3.3 Dedicated cross-domain transition artifact

Create one only if repeated cross-domain cases show that ordinary source/work/artifact lineage loses consequential status information.

### 3.4 Workstream cluster identity

Create a workstream-cluster owner only if project/work identity is repeatedly insufficient for real continuity joins and a second independent consumer demonstrates the same need.

### 3.5 Detailed incident taxonomy

Start with bounded critical-incident casebook evidence. Extract a stable incident family only after repeated real cases show the same failure mode.

Do not predeclare a large writing/design/data/casework incident ontology and then search for examples to fill it.

### 3.6 Dedicated canary subsystem

Important invariants should have focused deterministic or behavioral tests where applicable, but they do not require a generic canary framework.

A canary vocabulary is useful only when it has a real repeated consumer and proves behavior rather than merely restating an invariant.

---

## 4. Explicit non-obligations

The following are not implied future work:

```text
cover every proposed work domain
10-domain quota
factorial Condition x Task Family x Domain x Phase experiment
global continuity score
per-domain scalar fitness
winner/rank/promotion machinery
generic telemetry/evaluation platform
one schema/object per continuity responsibility
product UI for research metadata
automatic policy activation
Stage 7
actor/winner/population promotion
```

A domain can remain `not observed`. Absence of an authentic task is not a sampling defect to be repaired with filler work.

---

## 5. Trigger rule for future implementation issues

A future issue implementing one of the trigger-conditioned candidates should answer all of the following before source mutation:

1. **Which long-term research obligation does this address?**
2. **What repeated or material real-work evidence shows the current owners are insufficient?**
3. **What product or architecture decision depends on resolving the gap?**
4. **Why is this implementation the cheapest/cleanest way to answer it?**
5. **Can an existing source/provenance/lineage/authority owner absorb the responsibility instead?**
6. **Does a second real consumer justify a reusable abstraction?**
7. **What stop rule prevents the research instrument from becoming larger than the information value?**

If these questions cannot be answered, preserve the problem as a research obligation and do not create the implementation candidate yet.

---

## 6. Relationship to ACGC

This classification refines, rather than replaces, Adaptive Continuity and Governed Compounding.

It preserves the existing program principles:

```text
Semantic stability, operational plasticity.

Epistemic and procedural knowledge may compound.
Authority may not self-compound.
```

It also preserves the program's existing implementation discipline:

- use current owners rather than parallel truth systems;
- measure before automatic adaptation;
- compare against credible baselines;
- preserve unknown/harm/negative transfer;
- do not infer causal contribution from presence/reference alone;
- do not turn successful research output into product, policy, Decision, Transition, execution, or promotion authority.

The post-RW1 proposal is therefore retained as design input, while this note records only the durable obligation classification needed for future sequencing.

---

## 7. Authority boundary

This document creates no implementation or runtime authority.

It does not authorize:

- authentic RW1 episode collection;
- modification of merged RW1 v0.1 artifacts or validators;
- a new overlay implementation;
- provider/model/network calls;
- Core/product schema or persistence;
- Evidence, Proposal, ReviewDecision, Decision, or Transition;
- automatic context injection or suppression;
- policy activation;
- Stage 7;
- actor/winner/population promotion;
- Ready, merge, auto-merge, release, deployment, or publication.

Any implementation slice must be re-admitted from then-current `main` under a separate bounded issue and independently reviewed Draft PR.

---

## 8. Current sequencing implication

The immediate post-#264 development question is narrow:

```text
if authentic RW1 episodes are still zero at kickoff
-> consider one additive pre-action condition-integrity / work-context overlay
-> freeze that protocol
-> separately authorize authentic RW1 collection
```

The long-term obligations in Section 2 remain visible after RW1 regardless of whether that narrow overlay is implemented, redesigned, or later removed.

They are obligations to preserve and evaluate product meaning, not pre-approved implementation backlog.
