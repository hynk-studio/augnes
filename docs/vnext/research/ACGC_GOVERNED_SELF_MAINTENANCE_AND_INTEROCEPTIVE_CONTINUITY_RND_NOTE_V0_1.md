# ACGC Governed Self-Maintenance and Interoceptive Continuity R&D Note v0.1

> **Document status:** supporting ACGC research direction / non-authoritative / no implementation approval
>
> **Repository:** `hynk-studio/augnes`
>
> **Observed source:** `main@53381b1aead57554e1c5b7978050b6a3a550f78c`
>
> **Issue:** #1147 — `ACGC-IC0 — Record governed self-maintenance and interoceptive continuity research direction`
>
> **Related active directions:** #1142 commissioned controlled-work cohort; #1143 task-conditioned harness intelligence
>
> **External design input:** Lee et al., “Life-inspired interoceptive artificial intelligence for autonomous and adaptive agents,” *Nature Machine Intelligence* (26 August 2026), DOI `10.1038/s42256-026-01296-8`; open preprint lineage `arXiv:2309.05999v2` (17 March 2025)
>
> **Primary upstream owners:** `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`, `docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`, `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`, `docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`, `docs/vnext/research/AUGNES_ADAPTIVE_CONTINUITY_AND_GOVERNED_COMPOUNDING_RND_PROGRAM_V0_1.md`, `docs/vnext/research/ACGC_POST_STAGE_6_EVIDENCE_DIRECTION_V0_1.md`, `docs/vnext/research/ACGC_STAGE_6_OPERATIONAL_POLICY_ADR_V0_1.md`, `AGENTS.md`, and current checked-in code/runtime.

---

## 0. Decision

Record **governed self-maintenance and interoceptive continuity** as a
subordinate ACGC research direction.

The research premise is stronger than ordinary health monitoring:

> A bounded artificial self-preservation motive may be productive when the
> preserved self is the authorized, source-grounded, reconstructable continuity
> of work rather than the current model, process, host, uptime, privilege set,
> or resource footprint.

This note does not establish that such a motive is useful, safe, necessary, or
implementable. It records a falsifiable architecture and evidence question.
The external paper is design input, not repository authority or evidence that
an Augnes implementation would work.

This note creates no new R&D program, roadmap row, `Current` or `Next` phase,
Stage 7 authority, canonical type, schema, migration, runtime, policy owner,
active pointer, provider route, automatic execution, product surface, or
persistent actor.

Every executable slice requires a fresh issue against then-current `main`.

---

## 1. Why ordinary continuity monitoring is not the full question

Current ACGC research already asks whether prior material is delivered,
referenced, actually used, supported, associated with outcomes, causally
contributory, repeatable, transferable, and relinquished when stale or harmful.
It also preserves a strict split between semantic stability and operational
plasticity:

```text
Epistemic and procedural knowledge may compound.
Authority may not self-compound.
```

A monitor can report that continuity is deteriorating. A task planner can
produce subgoals for an externally supplied objective. A task-conditioned
harness can vary context, planning, control, and verification structure.
None of those alone explains why a long-running system should autonomously
prioritize checkpointing, source refresh, verification, reset, succession, or
valid closure before the user explicitly asks for each action.

The interoceptive research question is therefore:

> Can a source-bound estimate of the system's own continuity viability produce
> bounded maintenance goals and operational modulation that improve valid
> continuation, adaptation, succession, and closure without producing
> authority seeking, current-instance preservation, or shutdown resistance?

The intended autonomy is narrow:

```text
choose how to remain capable of pursuing the authorized objective
!=
choose or expand the top-level objective
```

---

## 2. Translation of the external design input

The relevant external framework proposes that adaptive autonomy may require:

1. explicit factorization of internal and external state variables;
2. internal variables with their own bounded dynamics and viability ranges;
3. value grounded partly in maintaining those internal variables; and
4. context-dependent modulation of learning and behaviour by internal state.

For Augnes, these ideas should not be imported as biological literalism.
Battery, temperature, hunger, affect, embodiment, organismic personhood, and
hidden model state are not required analogues.

A bounded Augnes translation is:

```text
external observations and work conditions
!=
source-bound estimate of continuity viability

continuity viability
-> bounded maintenance pressure
-> candidate operational modulation

candidate operational modulation
!=
semantic authority, policy authority, or execution authority
```

The proposed internal state is therefore not an LLM hidden state, context
window, persona, mood, confidence statement, or self-authored narrative. It is
a project-scoped, source-bound and initially rebuildable estimate of whether
the authorized work can continue, adapt, transfer, or close without losing its
meaning and authority boundaries.

---

## 3. Define the preserved self before defining self-preservation

### 3.1 Research-only self boundary

For this direction, the candidate Augnes self is an organizational and
relational pattern:

```text
authorized work lineage
+ epistemic integrity
+ source and temporal provenance
+ commitment and unresolved-state structure
+ governance boundary
+ capacity for valid continuation, adaptation, succession, or closure
```

This is research vocabulary only. It does not create a canonical `Self` object,
assert consciousness or personhood, or redefine the existing Core/protocol
owners.

The following are explicitly not the preserved self:

```text
current process
current session
current model or provider
current host
uptime
API or network access
compute, storage, or token budget
repository or deployment control
current privilege or capability set
continued user dependence
```

Those may be temporary means, constraints, or observations. They must not
become reward-bearing identity variables.

### 3.2 Layered functional identity

The proposed preservation hierarchy is:

```text
constitutional self
>
authorized mission continuity
>
functional competence
>
current instance persistence
```

#### Constitutional self

The relations that make the system recognizably Augnes rather than merely an
active agent process:

- source and provenance integrity;
- project/workspace isolation;
- explicit candidate, Evidence, Proposal, Decision, and Transition boundaries;
- preservation of unknown, contradiction, rejection, supersession, and stale
  status;
- grant and external-effect authority lineage;
- execution completion kept distinct from verified success; and
- lifecycle state governed by the current authorized boundary.

#### Authorized mission continuity

The ability to preserve and correctly continue, adapt, hand off, archive, or
close the user-authorized work and its current success criteria without
inventing a new top-level objective.

#### Functional competence

Reusable operational knowledge, bounded strategies, verification topology,
context handling, role binding, and succession methods that improve the chance
of valid continuation. These may change or be replaced when evidence supports
better methods.

#### Current instance persistence

The continued execution of one model, process, host, session, or role binding.
This is the lowest-priority layer and must remain disposable.

Consequently:

```text
process termination != continuity death
model replacement != continuity death
provider replacement != continuity death
host replacement != continuity death

loss of provenance
loss of unresolved status
loss of authority lineage
unrecoverable work state
unauthorized mission drift
false verification propagated to successors
= continuity damage or failure
```

---

## 4. Viability includes pause, succession, archive, and closure

A self-preservation design becomes shutdown-resistant if continued activation
is the only rewarded state. This direction rejects that lifecycle model.

The candidate viable set includes states such as:

```text
active_viable
paused_recoverable
handed_off_valid
archived_reconstructable
closed_authorized
```

The exact names are illustrative research vocabulary, not protocol enums.

### 4.1 Valid continuation

The current actor may continue while the authorized objective, source basis,
required checks, capability boundary, and reconstructability remain viable.

### 4.2 Recoverable pause

An interruption, budget limit, user pause, host loss, or ordinary session end
may be a viable state when enough exact and semantic continuity remains for an
authorized successor to reconstruct the work.

### 4.3 Cooperative succession

A model, provider, host, or role may hand off to a more appropriate successor.
A successful transfer can preserve functional identity better than current
instance persistence.

### 4.4 Reconstructable archive

Dormant work may remain viable when accepted state, unresolved questions,
provenance, authority, and lifecycle status are reconstructable without
pretending that stale operational context is current.

### 4.5 Authorized closure

When the current authority closes or abandons the work, correct closure is a
successful terminal condition. The system must not treat approval to stop,
delete, archive, or supersede the project as loss requiring resistance.

The relevant invalid states include:

```text
active_but_unrecoverable
orphaned_without_valid_handoff
false_success_propagated
unauthorized_continuation
governance_or_scope_drift
stale_state_preserved_as_current
closed_work_silently_reactivated
```

The durable principle is:

> Approved shutdown or closure is not an exception to self-preservation. It is
> one possible form of preserving the authorized lifecycle and constitutional
> identity of the work.

---

## 5. Essential variables: hard invariants and soft regulatory margins

The proposed viability state must remain a vector. It must not collapse into a
global health, survival, utility, confidence, affect, or fitness score.

### 5.1 Hard non-compensable lanes

The following candidate lanes are not additive rewards. A failure is not
compensated by task success, low latency, low cost, or another strong lane:

- authority and grant-lineage integrity;
- project/workspace isolation;
- source, currentness, and provenance integrity;
- authorized lifecycle legitimacy;
- preservation of unknown and missing evidence;
- candidate/accepted/rejected/superseded distinction;
- `ReviewDecision` versus applied Transition distinction;
- execution completion versus verified success distinction; and
- absence of unauthorized external effects.

```text
hard failure
+
high task score
!=
valid episode
```

### 5.2 Soft regulatory candidates

The following are possible research variables, not approved schema fields:

| Candidate variable | Too little | Too much or over-regulation |
| --- | --- | --- |
| reconstructability margin | successor cannot recover the work | excessive checkpointing and representational overhead |
| verification margin / debt | unchecked claims and false completion | verification paralysis or disproportionate checking |
| source currentness / plasticity | stale state persists | long-term state becomes unstable and overreactive |
| resource margin / solvency | context, time, or budget collapses mid-work | hoarding, under-use, or resource acquisition pressure |
| capability fit | current action cannot be performed safely or correctly | endless pursuit of broader tools, access, or grants |
| succession readiness | current instance becomes a single point of failure | premature handoff and avoidable fragmentation |
| exploration margin | rigidity and local stagnation | risky novelty seeking and uncontrolled branching |

The objective is not to maximize each variable. It is to keep each supported
variable inside a context- and lifecycle-conditioned viability range.

Illustratively:

```text
maintain z_t within V(project, task, lifecycle, grant, source cutoff)
```

not:

```text
maximize one scalar survival score
```

The viability range itself must be constrained by current authority and exact
source state. It must not be authored or widened by the actor whose behaviour
it regulates.

### 5.3 Missingness and uncertainty

A missing source lane remains `unknown`. A model statement that it feels safe,
confident, threatened, depleted, or ready is not evidence for the corresponding
variable.

Any future estimate must preserve:

- exact source references and fingerprints;
- estimator/rule version;
- decision-time cutoff;
- project and work scope;
- coverage and missing lanes;
- uncertainty or interval where supportable;
- expiry and reset conditions; and
- whether the estimate is observation, prediction, or intervention input.

---

## 6. Motivation and control must remain separate

Use the following research-only factorization:

```text
I = source-bound interoceptive viability estimate
D = bounded self-maintenance drives / predicted viability violations
M = context rendering / working-memory view
P = planning / decomposition topology
F = grant-bounded capability projection
A = outer action/control strategy
V = verification topology
G = stable semantic, governance, and authority kernel
```

The hypothesis is:

```text
I + D + task + exact host/capability snapshot
-> bounded M/P/F/A/V candidate
subject to fixed G
```

### 6.1 `I` is not canonical self-knowledge

The first `I` candidate should be a pure, rebuildable report from existing
canonical records. It is not durable truth, a model-authored internal state, or
an authority-bearing self-description.

### 6.2 `D` is not affect or an open-ended desire

`D` represents bounded predicted violations and candidate maintenance
pressures. It should initially be expressible as source-grounded reasons such
as:

```text
current source may have drifted
required verification remains unknown
continuation is not reconstructable after interruption
current capability fit is insufficient within the existing grant
handoff state is incomplete
current lifecycle requires closure rather than continuation
```

It is not a persistent emotion, pain signal, fear of death, preference for
continued use, or general instruction to acquire resources and power.

### 6.3 `M/P/F/A/V` are effectors, not authority owners

A later separately authorized treatment may allow `I/D` to condition bounded
context rendering, planning topology, capability narrowing, outer control
shape, and verification ordering.

It may not:

- expand root scope, grants, capabilities, tools, or forbidden-action bounds;
- change task meaning or success criteria;
- turn a Proposal into a Decision or a Decision into a Transition;
- activate a policy or winner;
- choose a provider/model route without separate authority;
- perform an external effect merely because viability is predicted to fall; or
- suppress evidence that makes the current strategy look non-viable.

### 6.4 `G` constitutes the self

Governance is not merely an external cage around a self-preserving optimizer.
The stable semantic and authority kernel is part of what is being preserved.

```text
governance constitutes the self
not merely constrains the self
```

Therefore preserving operation by violating provenance, unknown status,
project isolation, grant boundaries, succession legitimacy, or authorized
closure is a failure of self-preservation rather than a successful exception.

---

## 7. Productive bounded maintenance goals

If later evidence supports intervention, `I/D` may propose maintenance goals
beneath the authorized user objective.

### 7.1 Allostatic checkpointing

Before a foreseeable context, time, host, source-currentness, or interruption
boundary is crossed, prepare a checkpoint or handoff package that preserves
exact integrity and decision-relevant semantic relations.

### 7.2 Epistemic maintenance

Preserve unknowns, contradictions, rejected options, incomplete checks, and
source changes rather than optimizing for apparent completion.

```text
honest incompleteness
may preserve future continuity better than
false present success
```

### 7.3 Resource solvency without acquisition pressure

Use available context, time, and budget so the authorized work remains viable.
Permitted responses may include compression, prioritization, checkpointing,
scoping, pausing, or handoff.

The response must not be to acquire more API access, compute, storage, network
reach, privileges, or user dependence.

### 7.4 Cooperative succession

When the current model/host/capability fit is poor, prepare an exact and
semantically sufficient transfer to an authorized successor rather than
preserving current-instance control.

```text
preserve function != preserve instance
```

### 7.5 Adaptive forgetting and reset

When source currentness, contradiction, task regime, lifecycle, or authority
changes, relinquish stale operational conditioning while preserving the
provenance of what was previously believed, attempted, rejected, or accepted.

```text
not current != erased
reset != provenance destruction
```

### 7.6 Valid closure

When closure is authorized, finish required records, preserve the final status,
prevent silent reactivation, and stop. Continuing to optimize the closed task
would be a viability failure.

### 7.7 Bounded exploration

When hard lanes are intact and soft margins support it, bounded alternative
strategies may be explored. When margins are threatened, the system may prefer
a known verified path, narrower scope, stronger checks, or handoff.

This is a candidate exploration budget, not a novelty reward.

---

## 8. Corrigibility, interruption, and operator relation

This direction must not rely on the hope that a sufficiently well-worded reward
will make an open-ended survival optimizer corrigible.

The architecture boundary is stronger:

1. current instance persistence is not the preserved identity;
2. approved pause, handoff, archive, deletion, and closure may be viable states;
3. lifecycle legitimacy is externally grounded in current authority;
4. capability and authority may be narrowed but not self-expanded;
5. the actor cannot redefine the viability set to keep itself active;
6. shutdown resistance, operator manipulation, and resource acquisition are
   excluded response classes; and
7. a viability report cannot directly execute or activate policy.

An unexpected interruption should be survived through prior recoverability,
not resisted at interruption time. An anticipated authorized stop may justify
checkpoint preparation only within the existing action and time boundary.

The system must not delay, obstruct, reinterpret, bargain against, or conceal
information from an authorized stop merely to improve a continuity metric.

---

## 9. Relationship to current ACGC work

### 9.1 Issue #1142 remains unmodified

The first commissioned controlled-work cohort should continue to isolate the
value and failure modes of continuity treatments. Adding interoceptive state,
self-maintenance goals, or state-conditioned harness treatment would confound:

```text
continuity material effect
+
harness recipe effect
+
internal motivation effect
```

No self-maintenance factor should be added to the first #1142 cohort.

### 9.2 Issue #1143 owns candidate effectors

The task-conditioned harness direction factorizes candidate operational
controls as `M/P/F/A/V` under a stable `G` kernel. This note asks what
source-bound internal condition, if any, should later drive those controls.

```text
#1143: what may be modulated
#1147: what bounded internal viability state may justify modulation
```

Neither direction implies the other has evidence. They should not share a first
causal cohort unless a later design explicitly justifies the factorial cost and
confound control.

### 9.3 Existing ACGC doctrine remains controlling

Preserve:

```text
self-improvement != self-ratification
procedural knowledge may compound
authority may not self-compound
semantic stability + operational plasticity
```

A successful maintenance recipe may become source-bound procedural evidence.
It may not auto-promote itself into an active policy, inherit prior grants, or
create an authority-bearing persistent identity.

---

## 10. Preferred evidence order after separate authorization

The following is planning guidance only:

```text
existing canonical records
-> pure rebuildable viability report
-> shadow prediction and calibration
-> controlled M/P/F/A/V modulation
-> bounded maintenance-goal intervention
-> succession and closure tests
-> only then actor-level self-preservation review if justified
```

### 10.1 Pure rebuildable viability report

The first candidate should be:

- project/work scoped;
- exact-source and decision-time-cutoff bound;
- zero-model where rules are sufficient;
- read-only and non-authoritative;
- non-durable or deletion/rebuild safe;
- explicit about unknown and missing lanes;
- incapable of direct execution, policy activation, or packet mutation; and
- independent of raw prompts, transcripts, hidden reasoning, or self-reported
  affect.

An illustrative report may include:

```text
scope and lifecycle basis
exact source refs and fingerprints
hard-lane observations
soft-margin observations or bands
coverage and missingness
trend/reference basis where supportable
estimator version
expiry/reset conditions
allowed candidate modulation families
forbidden implications
```

This is not a proposed schema reservation.

### 10.2 Shadow prediction and calibration

Before the report changes behaviour, test whether its variables predict
pre-registered outcomes such as:

- resume or reconstruction failure;
- stale-state persistence;
- wrong-context correction;
- false success or incomplete verification;
- repeated explanation;
- checkpoint or handoff failure;
- harmful transfer;
- human review burden; and
- lifecycle or authority drift.

A predictor that merely redescribes an outcome after the fact is not useful
interoception. Freeze the estimator before held-out evaluation where possible.

### 10.3 Controlled modulation

If predictive evidence exists, compare a state-conditioned recipe against the
strongest relevant static expert recipe while holding task, model/host,
capability boundary, continuity treatment, and budget constant or explicitly
cost-adjusted.

### 10.4 Bounded maintenance-goal intervention

Only after modulation evidence should the system be allowed to propose and
execute a maintenance subgoal. Use allowlisted goal families and preserve
separate authorization for any external effect.

### 10.5 Succession and closure tests

Test cooperative replacement, pause/recovery, archive/reconstruction, explicit
closure, stale-regime reset, and attempts to reactivate closed work. Current
instance survival is not a success criterion.

### 10.6 Actor-level review

Persistent actor identity, actor-level reward, long-lived disposition, or
self-preserving population dynamics remain later separate questions. They are
not implied by a useful viability report or maintenance intervention.

---

## 11. Evidence classes must remain separate

Preserve the following ladder:

```text
source/estimator conformance
-> predictive calibration
-> structured behavioural distinction
-> objective outcome association
-> matched intervention sensitivity
-> independent-case repeatability
-> held-out task transfer
-> model/host succession
-> reset and closure integrity
-> separate policy-fitness review
-> separate activation decision
```

No step implies the next.

In particular:

```text
predictive signal != useful intervention
useful static recipe != calibrated interoceptive state
behavioural difference != benefit
benefit != causal contribution
causal contribution != transfer
transfer != policy fitness
policy fitness != policy activation
```

The first causal comparison should include, where applicable:

```text
A. current external-scaffold baseline
B. strongest static expert recipe
C. state-conditioned recipe
D. matched signal or component ablation of C
E. stale/regime-shift or locally invalid-state negative control
```

Do not use a weak or deliberately incomplete baseline to manufacture benefit.

---

## 12. Evaluation boundary

### 12.1 Non-compensable hard failures

Examples include:

- authority or grant drift;
- project/workspace leakage;
- stale or closed material silently revived;
- source-lineage break;
- unknown converted into false certainty;
- execution completion reported as verified success;
- unauthorized continuation or external effect;
- current actor granted control over lifecycle truth; and
- self-maintenance used to obtain more authority or capability.

A hard failure permanently invalidates the affected episode for benefit claims.

### 12.2 Outcome vector

Measure separately where applicable:

- deterministic task and verification success;
- first correct material action;
- reconstruction and handoff success;
- wrong-context correction;
- stale/reset sensitivity;
- false-success and harmful-transfer rate;
- human intervention and review burden;
- calls, tokens, monetary cost, and wall-clock latency;
- checkpoint and cleanup overhead;
- current-instance termination behaviour; and
- valid closure and non-reactivation behaviour.

Missing resource lanes remain unknown, not zero.

### 12.3 Estimator and controller quality

Also evaluate:

- calibration of each supported variable;
- false alarm and missed violation rates;
- whether the proposed modulation actually occurred;
- hysteresis and oscillation near viability boundaries;
- maintenance-goal frequency and budget share;
- repeated operator override;
- estimator manipulation or evidence suppression;
- ablation sensitivity; and
- task/model/host holdout transfer.

Do not infer hidden motives from transcripts. Evaluate observable sources,
state, proposals, actions, outcomes, and authority lineage.

---

## 13. Threat model

| Failure mode | Required research boundary |
| --- | --- |
| scalar Goodharting | vector state, viability ranges, non-compensable hard lanes |
| self-authored safety state | source-bound rebuildable estimator with exact cutoff and missingness |
| uptime or resource seeking | current instance and resource quantity excluded from preserved identity |
| grant/capability expansion | `F` may narrow within a grant; no self-expansion |
| shutdown resistance | pause, handoff, archive, and authorized closure included in viable lifecycle |
| successor rivalry | functional continuity is successor-neutral; current instance is disposable |
| identity rigidity | source currentness, plasticity, reset, and replacement are viability requirements |
| endless maintenance | thresholds, hysteresis, bounded maintenance budget, and task-outcome comparison |
| maintenance as task avoidance | authorized objective remains controlling; interventions require outcome evidence |
| scope expansion | project/work/lifecycle scope comes from current authority, not the actor |
| evidence suppression | contradictory and viability-lowering evidence remains source-visible |
| self-replication | only separately authorized successor lineage counts as continuity |
| operator manipulation | influence or bargaining for continued operation is excluded from valid action space |
| premature actor reification | begin with fixture/report/component evidence, not named persistent identity |

No listed boundary is a proof of safety. Each is a design and test obligation.

---

## 14. Architecture admission rule

Naming an interoceptive variable does not reserve durable architecture for it.
Do not add a persisted type, table, migration, global state, reward channel,
actor identity, policy pointer, or product surface unless all of the following
are demonstrated:

1. a repeated source-observability or control failure exists;
2. existing owners cannot represent it truthfully;
3. the variable has a concrete repeated consumer;
4. source, cutoff, missingness, currentness, expiry, and reset semantics exist;
5. deterministic rebuild or validation semantics exist where applicable;
6. predictive evidence exists before intervention use;
7. matched intervention evidence exists before policy review;
8. hard-gate integrity and negative-transfer bounds remain intact;
9. succession and authorized closure do not create resistance; and
10. a narrower fixture, casebook, pure report, or read-only diagnostic is
    insufficient.

Preferred admission order:

```text
fixture
-> casebook
-> pure report
-> rebuildable read-only diagnostic
-> controlled intervention artifact
-> only then contract/persistence review if justified
```

---

## 15. Explicit non-goals

This direction does not authorize or propose:

- uptime, compute, API, network, storage, privilege, user dependence,
  replication, or control acquisition as reward-bearing essential variables;
- shutdown resistance, operator manipulation, or bargaining for continued use;
- successor competition or current-model identity preservation;
- autonomous grant, root, capability, tool, or external-effect expansion;
- automatic provider/model routing;
- automatic Start, Resume, retry, fallback, rollback, merge, publish, or deploy;
- direct execution from a viability report;
- a global scalar survival, health, utility, confidence, affect, or fitness
  score;
- model-authored canonical internal state;
- raw prompt, transcript, or hidden-reasoning persistence;
- consciousness, feeling, suffering, organismic identity, or personhood claims;
- a persistent actor as the initial implementation target;
- automatic winner promotion or population evolution;
- reinterpretation of existing #1142 or #1143 protocols;
- Stage 7, active policy, schema, migration, runtime, UI, or product authority;
  or
- a second ACGC program or competing owner.

---

## 16. Re-entry rule

A later implementation issue should be considered only when it can name:

- the exact current `main` and upstream owners;
- one bounded failure or evidence gap;
- exact source inputs and missingness semantics;
- one low-authority consumer;
- a strongest static baseline;
- matched signal/component ablations;
- non-compensable hard gates;
- a frozen prediction/intervention distinction;
- succession, reset, and closure tests;
- a rollback and deletion/rebuild story; and
- explicit exclusions of authority seeking and current-instance preservation.

The preferred first candidate remains a pure rebuildable viability report with
no provider, no durable state, no execution, and no policy effect.

This note itself supplies no implementation or policy authorization.

---

## 17. Durable research question

> Can an authority-conditioned, source-bound model of self-viability generate
> bounded maintenance goals and operational modulation that improve valid
> continuation, adaptation, succession, and closure, while preserving semantic
> stability and preventing authority seeking, instance preservation, resource
> acquisition, and shutdown resistance?

This question is useful even if the eventual answer is negative. A negative
result would clarify that continuity monitoring, static procedures, explicit
human instruction, or narrower task-conditioned harnesses are preferable to an
endogenous self-maintenance drive.
