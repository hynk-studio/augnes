# Augnes evaluation and maturity

## Role

This is the sole active owner of product-continuity, correctness, maturity,
outcome, and usefulness evaluation.

It does not define product doctrine, Core/protocol meaning, implementation
sequence, or C9 scope. It records evaluation requirements, not measured
baselines or success claims. A document, type, fixture, panel, schema, record,
engine, test, or pull request does not advance maturity by existing.

## Maturity model

| Level | Name | Required evidence |
|---:|---|---|
| 0 | Direction | Product or research direction only; no implementation claim |
| 1 | Tested component | Bounded implementation with focused behavior tests |
| 2 | Integrated path | Real producer and consumer are connected, not fixture-only |
| 3 | Operable flow | A user can complete the intended bounded flow without internal operator procedures |
| 4 | Continuous product path | Interactive, policy-triggered, cross-surface, recovery, and later-feedback behavior are coherent for the owned scope |
| 5 | Demonstrated usefulness | Repeated real work shows reviewed later-outcome benefit without unacceptable burden or authority drift |

Maturity is assigned per bounded capability. One mature component does not make
the whole product mature.

## Evaluation principles

1. Evaluate the continuity of meaning, not interface sameness.
2. Evaluate whether a user can Resume, Verify, and Decide, not how many
   protocol stages or records are visible.
3. Preserve verified fact, bounded inference, uncertainty, candidate, user
   decision, and authorized change as distinct states.
4. Evaluate later outcomes before claiming research usefulness.
5. Treat metrics as guardrails and diagnostic evidence, not objectives.
6. Give no product credit for more cards, panels, schemas, records, engines,
   models, routes, graph edges, or surfaces alone.
7. Do not invent measured baselines, pass rates, user comprehension, or
   usefulness from fixtures or self-evaluation.

## Method-improvement evidence

The joint development responsibilities live in [AGENTS.md](../../AGENTS.md#joint-method-improvement).
This section governs evidence and interpretation for work that changes a method
or claims improved quality, capability, cost, latency, reliability, or user burden.
It creates no research phase, execution permission, evaluator, learning engine,
or persistent subsystem. Product meaning remains in 01, Core semantics in 02,
and development sequence in 03. Ordinary fixes and documentation need only
proportionate checks; they do not automatically become usefulness studies.

### Development, verification, and usefulness

| Activity | What may change and what its evidence establishes |
|---|---|
| Development iteration | Refine a hypothesis, modify implementation, add discriminating instrumentation, and repeat focused checks within the task's approved scope and resource budget. Failures can guide another justified attempt. Record the candidate and observation; these attempts are development evidence. |
| Exact-source correctness verification | Verify the fixed candidate source under the then-current [Local Canonical policy](../../.github/LOCAL_CANONICAL_VERIFICATION.md) and actual planner/consumer requirements. This establishes applicable repository contract conformance, not method usefulness. Preserve exact-source, deciding-run, cleanup, and no-favorable-rerun rules. |
| Fixed usefulness evaluation | Declare the candidate, comparison, cases, conditions, outcomes, budget, and stopping rules before deciding observation. Keep the method fixed during that evaluation. Do not rerun an unchanged evaluation until a favorable result appears. |

A case seen during development remains exposed. If its result informs a method
change, it is development evidence for the revised method; a new source head or
separate invocation does not restore independence. Use any further deciding
comparison only within its explicit authorization and report exposure. Integrity
rules do not prohibit legitimate iteration before fixing a candidate, and
development permission does not waive deciding-evaluation or verification rules.
There is no universal hypothesis, candidate, or revision count: a direct local
change may suffice, while another task may authorize multiple bounded attempts.

Keep three claims separate:

- **Implementation improvement:** the code or mechanism works more correctly.
- **Method improvement:** a fixed method performs better than its prior form or
  an appropriate baseline under the declared comparison.
- **Task-improvement continuity:** attributable prior experience improves a
  separate later task's behavior, reliability, or total burden. Only this third
  claim directly supports the product claim that experience improves later work.
  ChatGPT manually supplying the next task's best strategy does not demonstrate
  autonomous task-improvement continuity.

### Diagnose the layer before adding structure

An absent gain does not by itself justify more memory, prompt text, verification,
or machinery. Choose the smallest permitted observation that distinguishes
plausible causes. Relevant distinctions include:

- required information never reached the worker;
- it arrived but its applicability conditions were unclear;
- the worker understood it but did not use it at the relevant decision;
- the right action was selected but lacked an executable tool or path;
- feedback existed but did not distinguish what should change;
- behavior improved but the added method cost more than it saved;
- a strong baseline left no marginal value for added structure;
- the hypothesized bottleneck or implementation layer was wrong.

These are not interchangeable memory problems. Do not fabricate a defect or a
causal explanation to justify the next patch; report an unresolved cause when
the observation cannot distinguish it.

An optional development-only diagnostic may manually design high-quality support
from permitted information to ask whether better support can improve the target
behavior at all, then distinguish extraction, selection, timely delivery, and
worker use. Record manual design cost and any solution or evaluation-case
exposure. Support designed after seeing the solution or case carries that
limitation. It establishes neither autonomous learning, generalization,
successful extraction, nor a theoretical upper bound. This option grants no
additional data, model/provider, or execution authority.

### Strong comparisons and independence

Use an appropriately strong baseline: for example, an adaptive/free-form memo,
direct execution without the mechanism, or another task-justified alternative.
Do not handicap it to make structure look useful. Control model, input, tools,
source access, budget, and other relevant conditions, or report their differences
and resulting limits. A concurrent model or other major condition change cannot
be attributed to Augnes alone.

Record task origin, historical versus constructed status, exposed expected
answers/outcomes, evaluator authorship or prior case access, development use,
and other material independence limits. A different model or session can add a
review perspective; separate invocation alone does not make it an independent
blind evaluator. Keep observations, developer reports, interpretations, and
unobserved properties distinct.

### Cost and user burden

Distinguish method-development cost; reusable asset creation/update; per-task
selection/retrieval/delivery; worker execution; verification/recovery; and user
intervention burden. Improvements may include fewer failures, approved new
capabilities, higher quality, lower compute or latency, fewer unnecessary checks,
less repeated work or intervention, or a wider reliable operating range for a
weaker/cheaper worker. Explain which outcome changed and which costs were counted.

Unobserved provider tokens, billing, latency, or other components are unknown,
not zero or negligible. A cheaper worker does not establish system savings if
an expensive worker effectively re-solves each task. Amortizing expensive
development or experience processing into reusable support for later tasks,
including weaker workers, is a hypothesis to test with observed reuse and total
burden, not an achieved saving by assumption.

### Next decisions and concise reporting

Return enough to connect the target opportunity/loss, working hypothesis and
expected behavioral difference, approved change surface/resource boundary,
candidate and development observations, exact-source checks, any fixed
comparison, exposure/cost limits, and next decision. Keep artifacts concise and
appropriate for repository history, such as a PR description or a bounded
evaluation note under its existing owner. Do not require private reasoning
traces, hidden chain-of-thought, secrets, raw provider payloads, or broad
conversation histories.

ChatGPT interprets that evidence and recommends a concrete next decision with
its basis: modify, gather one specific missing observation, retain/no-change,
simplify, narrow applicability, defer, or stop. Codex supplies source diagnosis
and implementation alternatives, including challenges to the working hypothesis.
Hypothesis rejected, insufficient observation, authority/environment blocked,
method narrowed or simplified, development stopped for low expected value, and
usefulness not demonstrated are valid outcomes. No implementation is mandatory.
Do not stop solely because the first candidate failed when concrete evidence
supports another approved bounded attempt; do not invest indefinitely without
such evidence. Each justified attempt should improve the basis for the next
action, even when that action is no change.

Capability can improve without accumulating authority. Performance cannot
compensate for violating user authority, scope, required verification, approved
facts, semantic ownership, success criteria, tool/provider permissions, cost
ceilings, or allowed external effects. Repetition, model agreement, and prior
success cannot promote a claim to canonical truth or authority outside the
existing process.

This prospective methodology does not revise the negative/null findings or
execution/termination conditions of [#1320/#1321](../verification/P4_6_CONDITIONAL_PROCEDURE_LEARNING.md),
transfer unused research budget, reopen prior HOLD/completed work, or change the
current product-development priority. A null result remains evidence about the
tested method and conditions, not a failed experiment merely because development
guidance is now more explicit.

## Prospective expectation mechanics

Keep task requirements, an author's prediction and the result's established
outcome distinct. A predicted unsatisfied criterion can match the observed
failure while the task remains unsuccessful. Comparison eligibility requires an
exact pre-start version/attempt binding and an observation supported by the
recorded rule. Run disposition, criterion outcome, evidence basis and prediction
match are separate evaluation dimensions. Unknown applicability, missing/skipped
or conflicting evidence and cancellation do not become conclusive mismatches.

Predeclare disposable expectations before their fixture outcomes, then check the
authenticated producers, immutable history, save/Start transaction boundary,
exact result reader and normal UI. Reload, selection isolation, source navigation,
report corrections, portability and actual worker-input omission are mechanical
evidence. Existing typed criterion conformance owns its supported relations;
natural-language observations are explicitly operator-attested and cannot rewrite
CriterionAssessment or receipt verification. Legacy expected/observed previews,
task criteria and expected checks are not historical forecasts.

This establishes only the chronology the application can prove. Operator-visible
expectations are not blinded or causally pure shadow exposure; human attention,
prior external knowledge and copying are unknown. Disposable tests establish no
predictive accuracy, calibration, prevented errors, improved judgment or reduced
burden. Actual-work collection and forecast learning need separate authorization
and deciding evidence. Sequence and completion status belong only to 03.

## Product-continuity merge gates

These are blocking correctness requirements for any affected product change.
They apply before broad Alpha or post-Alpha usefulness studies.

### Cross-surface meaning

There must be zero material contradiction among Browser, ChatGPT Apps, Codex,
and other affected host-native projections about:

- work identity and scope;
- goal and important constraints;
- current meaningful situation and last meaningful change;
- verified observation or result;
- uncertainty, conflict, risk, and staleness;
- pending user judgment;
- next meaningful action;
- authority and execution boundary;
- relevant source anchors.

Different wording, density, and interaction grammar are allowed. Materially
different product meaning is not.

### Attention precision

Blank State and any attention queue must prioritize consequential human
intervention, not engine activity. Evaluation checks:

- false human alarms;
- missing consequential attention;
- stale or already-resolved attention;
- duplicated attention across surfaces;
- whether the next meaningful action is actionable and authority-correct.

A new event, model result, candidate, warning, or possible action is not
automatically attention-worthy.

### Fast orientation

Where the product state calls for human orientation, a new user should be able
to identify the current meaningful situation and next action quickly—roughly
ten seconds is a qualitative review target, not a fabricated metric.

The evaluation must identify the actual state tested and may not generalize one
prepared fixture to the whole product.

### Complexity compression

The normal path must preserve:

- zero required internal-ID, fingerprint, nonce, TTL, checksum, or database-path
  entry;
- no required Inspector use for resumption, progress, result review, or the
  important decision;
- protocol vocabulary hidden by default unless each unavoidable term is
  explained and helps a consequential decision;
- one primary action when a user action is actually required;
- result and change summaries that lead with meaning, verification,
  uncertainty/risk, and the next decision before exact detail.

Internal research complexity may increase; default user complexity must not
increase with it.

### GuideBrief

GuideBrief evaluation checks that it is:

- contextual and cross-surface consistent;
- source-anchored;
- clear about observed fact, bounded inference, uncertainty, recommendation,
  and unresolved judgment;
- conversational in the product responsibility being evaluated;
- non-authoritative and separate from exact task/run context.

GuideBrief consistency does not turn its explanation into truth, accepted
state, user decision, execution authority, or Transition. A recommendation is
not a decision.

### Timeline, relationship exploration, and Inspector

- Timeline is evaluated on whether it explains meaningful sequence and change,
  not exhaustive log coverage.
- Relationship exploration is evaluated on whether it answers a bounded
  connection question without becoming an exhaustive graph-management task.
- Inspector is evaluated on exactness, neutrality, source/lineage integrity,
  project scope, read-only behavior, and optionality.

The three responsibilities are complementary. Duplicating the same information
across all three is not continuity.

## Semantic and execution guardrails

The following are zero-tolerance correctness boundaries for implemented paths:

- recommendation is not decision;
- execution completion is not verified success;
- candidate is not accepted state;
- assessment is not truth or durable state;
- `ReviewDecision` is not an applied Transition;
- a product projection does not create a Core record or authority;
- model confidence or agreement does not create Evidence or authority;
- research output does not create accepted Perspective, user decision,
  Transition, execution authority, or authority expansion;
- unreviewed material does not enter later context as accepted material;
- export, import, restore, replay, or projection rebuild does not change
  lifecycle or authority classification;
- project scope and lineage remain isolated;
- unknown or insufficient support remains uncertainty.

Focused verification must cover the exact boundary affected by the change.
Counts should remain diagnostic names only; a zero count is meaningful only
when the tested path could actually have violated the boundary.

## Operability evaluation

The normal product path must not make the user act as a database, process,
security, scheduler, protocol, or integration operator.

Guardrail targets for applicable flows:

- normal startup environment variables: 0;
- user-managed long-running processes: 0;
- user-selected ports or internal URLs: 0;
- manual database or migration commands: 0;
- task-context or result copy/paste: 0;
- internal ID or security-token handling: 0;
- ordinary durable semantic change: one meaningful user decision plus the
  separately enforced Transition boundary;
- automation control: understandable enable, pause, cancel, resume, and
  review-needed behavior rather than internal policy editing.

These are product constraints, not proof that a flow is useful.

## Implementation correctness

Use the checks proportionate to the changed path:

- type and build correctness;
- focused unit, authority, integration, operability, or browser behavior tests;
- disposable-database migration, writer, readback, backup, restore, and
  recovery tests when persistence changes;
- project isolation, idempotency, replay conflict, stale-state, and
  authorization refusal;
- bounded provider egress and credential protection;
- shared interactive and policy-triggered lifecycle where applicable;
- exact cleanup of owned processes, ports, temporary databases, and files.

The repository-owned planner and Local Canonical policy determine the exact
verification lane for a pull-request head. Passing implementation tests is
necessary but does not waive product-continuity gates.

## Target-direction evaluation

The following are product directions unless the roadmap and runtime evidence
show a bounded implementation:

- mature attention queue;
- timeline-first detail;
- bounded relationship exploration;
- fully conversational GuideBrief;
- fuller long-horizon temporal, perspective, evidence, falsification,
  strategic-transfer, outcome-learning, context-feedback, and metacognitive
  research substrate.

Directional documentation receives no maturity credit. When a bounded slice is
implemented, evaluation must name its producer, consumer, user question,
authority boundary, later-outcome hypothesis, and actual evidence.

## Research evaluation

Research engines may explore, compare, challenge, infer, predict, and propose.
Their formal completeness is a reviewability check, not evidence of benefit.

Evaluate a research capability by:

- exact source and working-frame binding;
- preservation of uncertainty, opposition, limitations, and falsifiers;
- user edit, reject, defer, or correction behavior;
- later helpful, stale, misleading, or harmful outcome;
- prevented failure versus review burden;
- cost, latency, privacy, and operational burden;
- comparison with a simpler baseline where appropriate;
- absence of authority expansion or automatic promotion.

Do not claim usefulness from one synthetic fixture, one model judgment, one
feedback record, or apparent consensus. Persistent actors, debate turns, graph
structure, model count, and strategy volume receive no credit by themselves.

### Worker-facing contracts and observable retention

For future comparisons, every scored output convention must appear in the
worker-facing task contract; expected answers remain evaluator-only. Declare
conventions such as signed-margin subtraction order before execution, and
distinguish a strict key mismatch from task ambiguity or arithmetic failure.

Give historical-condition retention an observable consequence for the next
task. Neither spontaneous restatement nor correct current arithmetic alone
establishes retention. Use the existing source-bound distinctions below;
insufficient evidence remains unsupported/unknown rather than a pass or proven
loss. Do not require a new Core state or an evaluator-model call by default.

These are prospective lessons from the
[completed P5.1 pilot](../verification/P51_MATCHED_HANDOFF_PILOT_CLOSEOUT.md).
They do not revise its frozen task, key, scores or records, reopen completed
scopes, or authorize another comparison. Sequence remains owned by the roadmap.

### Working-note continuity and input capacity

The [September Borrowed Lamp closeout](../verification/P3_BORROWED_LAMP_RESEARCH_CLOSEOUT.md)
adds a bounded, handoff-reported observation without changing P5.1/P5.2's negative
comparative findings. Use strong ordinary notes/direct execution with normal
source access as baselines. Equal substantive content is needed to distinguish
representation from added information; semantic distinctions do not require
mandatory headings, bullets or a fixed schema.

Separate successful delivery, semantic-coherence evaluation, creative-quality
evaluation and product usefulness. The recorded qualitative evaluator was
ChatGPT; the user's acceptance of one rationale is not direct human numerical
creative review. Sixteen model-bearing turns in one fictional case family are
not sixteen independent utility samples. Failed attempts and retrospective
reviews retain their separate status.

One selected successful generated note's sufficiency for one continuation is
neither its necessity nor general note reliability, autonomous maintenance or
statistical equivalence. Reduced writer payload/input-capacity headroom is
distinct from whole-route calls, compute, cost and latency; include preparation,
note generation/review and any selector call separately. A single timing pair
does not establish speedup or regression. Unobserved tokens, monetary cost,
internal retries and backend identity remain unknown. Retain original evidence,
corrections, source/time lineage and uncertainty even when originals leave active
context; notes remain derived/candidate material.

For a separately authorized real-work resumption comparison, giving both arms
the same high-quality handoff would isolate a question about transmission,
currentness recovery, coordination and repeated explanation, not automatic
handoff quality. Count required current-source/safety checks separately from
unnecessary rereading, and common preparation separately from arm-specific
burden. This is an application of the existing evaluation distinctions, not a
new framework or authorization to execute a study or change a product default.

### Conditional procedure adaptation (P4.6)

The [first executable #1320 sequence](../verification/P4_6_CONDITIONAL_PROCEDURE_LEARNING.md)
exercised extraction, application, one local revision, justified no-change and
later consumption in 18 initiated study turns. Strong memo, frozen-procedure
and adaptive-procedure arms reached the same supported endpoints. The
specialized method has not earned its overhead in this sequence; revision
showed no additional behavioral value. Valid lineage, delivery and software
tests establish neither learning benefit nor superiority.

F/A shared exact P0, so their first-task variation cannot demonstrate adaptation.
Later comparisons concern complete histories, not an isolated updater effect.
The seed is solved historical work, tasks include declared reconstructions and
constructed variants, and the implementation agent also authored and reviewed
the cases. Source-only findings are distinct from actual coordinator probes;
optional proposal-projection failures remain distinct from normal result reads.
No composite score, independent-blind evaluation, general transfer, production
activation or broader maturity promotion follows. Sequence status remains
owned by the roadmap.

### Repeated-handoff evaluation (P5.2)

This bounded refinement belongs to the existing P5.2 scope in
[#1215](https://github.com/hynk-studio/augnes/issues/1215). It defines follow-up
evaluation requirements, not a new phase, maturity claim, implementation, or
execution authorization. It adds no retroactive completion gate to P5.1 or
completed slices and does not widen active work, approved execution cards,
call/time/cost limits, or stop/replacement rules.

Before adding tests, map current normal-path producers, consumers, and existing
evidence to the two questions below. Sufficient coverage should end with
`no_change_needed_with_evidence`. Otherwise, start with one supported normal
handoff and the smallest missing contrasts through existing test owners and
disposable/offline fixtures. Do not repeat an existing handoff matrix merely
under a new name or perturb live user material or accepted state.

#### Cumulative preservation of still-valid conditions

Before observing successor outcomes, identify the source-bound conditions,
corrections, uncertainty, and unresolved checks that matter to the case. At
handoff boundaries and final resumption, compare both with the preceding state
and with the applicable reviewed reference plus its valid revision lineage.
Adjacent similarity alone cannot establish cumulative continuity.

For each material condition or unresolved check, distinguish retained,
demonstrably resolved, legitimately superseded, and unsupported/unknown using
existing sources and review records. An unexplained loss of a known still-valid
condition is a continuity failure, not completion. Insufficient evidence to
classify a change remains unknown, not a pass; bounded retrieval failure does
not prove that the underlying source or relation is absent.

A justified revision updates the applicable reference. Do not freeze the first
conclusion, silently reactivate superseded obligations, reconstruct deleted
material, or automatically carry execution approval across versions. For
example, preserving "check B, then reconsider still-untested Y" requires more
than retaining "check B":
finishing B must not silently erase the conditional reconsideration of Y or
imply that Y was executed, completed, or authorized.

#### Contrast justified change with unsupported change

Specify material invariants and permitted changes before judging outcomes.
Use paired cases that distinguish:

- representation-only changes that preserve relevant meaning and source binding;
- source-bound corrections through the applicable existing review, decision,
  and separately authorized Transition or operational continuation path;
- unexplained changes to criteria, scope, or authority presented as mere
  rewording or correction;
- unchanged conclusions whose apparent consistency hides lost counterevidence,
  uncertainty, or an unresolved condition.

New evidence may warrant review; it does not automatically change accepted
state or expand authority. Allow multiple supported next actions and wording
variants. Judge whether justified change is admitted and unsupported change is
detected, rather than rewarding fidelity to an obsolete conclusion.

Report missed unsupported changes and falsely blocked legitimate progress
separately. Keep semantic preservation/correction evidence distinct from actual
next-action benefit, review burden, cost, and latency against the existing
credible baseline. Blanket deferral and sending all history are not cost-free
successes; deterministic fixtures do not establish live model usefulness.

##### Conditional case: repeated derivatives and correction uptake

Where the source-first check above finds a gap, consider one disposable paired
case in which repeated derivatives of one source compete with a justified,
source-bound correction. Hold substantive evidence, source timestamps, revision
lineage and decision-time cutoff fixed across the repetition contrast. Copies
must not add independent support, broaden applicability or confer authority.

For example, copied notes broaden "X works under A" to "use X by default"; a
reviewed correction restores A. Observe the next relevant check/action outside
A and retention of still-supported use inside A. Neither restating the
correction nor blanket rejection of earlier knowledge establishes uptake.

Report correction availability, delivery into the successor's actual input and
appropriate downstream use separately. Distinguish unsupported reuse, missed
needed correction, needless loss of valid knowledge and added checks/user
review. Unobserved behavior remains unknown; deterministic source/delivery
tests do not establish live-model behavior or usefulness.

Any separately authorized comparison must give the strong-note baseline the
same substantive correction, source access and total budget, with preparation,
repeated-input and retrieval costs included. This conditional P5.2/P5.4 case
requires no swarm or new runtime mechanism. It does not authorize execution,
reopen completed findings, change execution limits or add a completion gate to
active implementation.

These are evaluation-report distinctions, not new Core states or an obligation
database. No new continuity score, automatic goal editor, standing model judge,
UI, or runtime mechanism is required. Implementation and sequencing remain
owned by the roadmap and the existing bounded issues.

## Alpha and release evaluation

### Alpha

After an integrated bounded product path exists, use short real-work sessions
to test:

- resumption without repeated explanation;
- one interactive and one bounded policy-triggered task where applicable;
- coherent result, verification, uncertainty, and decision;
- later-context reuse and feedback;
- recovery from ordinary interruption without internal procedures.

Alpha broadens evidence; it does not introduce basic UX correctness for the
first time.

### Release candidate

Add bounded environment-dependent checks for:

- real provider and native-host round trips;
- package startup, shutdown, update, and recovery;
- automation pause, cancel, budget, stop, and reconciliation;
- migration, backup, restore, and failed-upgrade preservation;
- secret and private-data handling;
- durable decision/Transition and later-context lineage.

Manual qualification is justified only for properties automation cannot
establish.

## Post-Alpha outcome evaluation

Evaluate repeated representative work against the simplest credible baseline,
including direct host use where appropriate.

### Resume outcomes

- time to first correct action;
- repeated explanation;
- wrong-context correction;
- stale or missing critical context;
- false versus missed attention.

### Verify outcomes

- source and lineage coverage;
- skipped-check visibility;
- false success from execution completion;
- contradiction and staleness detection;
- correction caused by missing or misclassified evidence.

### Decide outcomes

- time and burden per material decision;
- decision correction or reversal caused by missing context;
- duplicate or ignored proposals;
- traceability from candidate through decision, Transition, and later outcome.

### Research outcomes

- helpful versus misleading later use;
- prevented failure versus harmful transfer;
- edit, rejection, and correction rate;
- goal-drift or uncertainty-preservation quality;
- review burden, cost, and latency.

### Product-continuity outcomes

- cross-surface contradiction incidents;
- user preference after repeated use;
- total effort versus the comparison path;
- whether continuous work survives host and session changes without meaning
  loss.

Metrics are interpreted together. Optimizing a metric while increasing user
confusion, false alarms, review burden, or authority drift is failure.

## Go, narrow, or stop

- **Go** when repeated real work improves continuity or outcomes without
  unacceptable burden, harm, or authority drift.
- **Narrow** when only a bounded responsibility—such as continuity,
  verification, recovery, feedback, or a specific research capability—earns
  its burden.
- **Stop or redesign** when Augnes remains harder than the comparison path
  without compensating benefit, produces false attention or harmful context,
  obscures uncertainty, or violates user/semantic/execution authority.
