# ACGC-CW1 terminal closeout and salvage boundary v0.1

## Status and role

This document records the terminal disposition of the ACGC-CW1 commissioned
controlled-work track and separates reusable Augnes material from CW1-specific
historical machinery.

It is a closeout and reduction aid only. It is not product doctrine, Core or
protocol authority, current/next sequencing authority, an execution grant, a
scientific result, or authorization to delete source. The active owners in the
vNext authority map remain authoritative for their topics, and Git history
remains the primary archive.

## Terminal disposition

CW1 is terminated without obtaining its empirical objective.

The terminal operating report was:

- the CW1 code and sealed schedule remained prepared;
- ChatGPT file-backed Codex authentication was working;
- the only confirmed execution blocker at termination was OpenAI Codex 0.150.1
  Agent Identity registration retry exhaustion;
- no usable commissioned training cohort result was obtained.

Therefore the track establishes **no** positive or negative result about the
continuity hypothesis. It does not establish behavioral conditioning,
continuity benefit or harm, support validation, outcome association,
intervention sensitivity, repeatability, held-out transfer, usefulness, policy
fitness, or Stage 7 readiness.

The terminal classification is:

```text
empirical_objective = not_achieved
usable_experimental_result = none
termination_stage = pre_empirical_operational_execution
confirmed_terminal_blocker = codex_0_150_1_agent_identity_registration_retry_exhaustion
scientific_disposition = not_tested
track_disposition = terminal_history
```

The operational blocker is failure-cause history, not scientific evidence and
not a reason to reinterpret synthetic/conformance results as empirical output.
No retry, replacement cohort, new authentication route, holdout access, or CW1
requalification follows from this closeout.

## Salvage test

Material is worth preserving as current code only when it solves a problem that
remains independently useful after removing the CW1 experiment, corpus,
schedule, and future-live execution goal.

Origin in CW1 is not itself a preservation reason. Conversely, a component is
not historical merely because CW1 caused it to be implemented.

Use these classes:

```text
KEEP_CURRENT_GENERIC
  already owns a general Augnes/native-host responsibility independent of CW1

KEEP_PROVISIONAL_GENERIC
  contains independently useful mechanisms but still carries CW1 or brittle
  upstream-Codex assumptions that require a later reduction audit

METHOD_ONLY
  preserve the research/evaluation rule, not the current CW1 runtime/type
  surface

HISTORICAL_CW1
  exists to implement, seal, execute, evaluate, or preserve the failed CW1
  experiment and should not remain a default current runtime burden after
  consumer-safe retirement
```

## Keep current: general native-host provenance

The request-source binding already owned by the Codex App Server adapter is a
general Augnes primitive rather than CW1 machinery.

Preserve the ability to bind a native-host execution to the exact request,
TaskContextPacket, project/root scope, and operation/capability request shape,
and to carry that bounded provenance on the lifecycle event that actually
starts the turn.

This supports source/temporal lineage and later verification regardless of
whether CW1 exists.

Classification:

```text
CodexAppServerRequestSourceBindingV01 = KEEP_CURRENT_GENERIC
```

## Keep provisionally: credential isolation and exact process ownership

The following mechanisms solve an independently useful problem: launching an
authenticated Codex App Server without sharing ordinary mutable Codex state or
exposing raw credential material to protocol, logs, argv, artifacts, or child
repository commands.

Preserve provisionally:

- bounded file-backed credential source handling;
- attempt-private `HOME`, `CODEX_HOME`, `CODEX_SQLITE_HOME`, and `TMPDIR`;
- no ordinary config/history/skill inheritance;
- opaque source-owned credential/broker bindings;
- one-time private child-launch capability;
- child process-birth and ownership checks;
- rollback and cleanup of exactly owned process/state material;
- secret/material scanning and non-persistence boundaries.

These mechanisms are not evidence that the current Agent Identity execution
route is a durable Augnes requirement.

The current isolated-auth family also hard-binds upstream details including
Codex 0.150.1, an exact upstream commit/executable profile, Agent Identity,
config/feature projection, and provider-route assumptions. Those details were
part of the failed execution seam and must not be promoted into permanent Core
or product invariants merely because the lower isolation mechanisms are useful.

Classification:

```text
credential/state/process isolation mechanisms = KEEP_PROVISIONAL_GENERIC
Codex 0.150.1 Agent Identity exact profile = compatibility/history unless a
  separate current consumer independently justifies it
```

A later reduction must audit real consumers before deciding whether to simplify,
replace, or retire the exact Agent Identity profile.

## Preserve as method, not CW1 runtime

CW1 produced several research-method rules worth reusing, but the experiment did
not validate its own candidate components or runtime abstractions.

Preserve these rules as methodology:

1. executor completion or self-report is not objective outcome truth;
2. treatment/candidate identity should remain blinded from the objective
   evaluator until the outcome observation is sealed;
3. evaluate actual repository state, deterministic required checks,
   source-currentness, and negative-space obligations where applicable;
4. hard failures are non-compensable rather than ingredients in one scalar
   score;
5. unknown resource or evidence lanes remain unknown and are never imputed as
   zero;
6. intervention/treatment assignment is sealed before outcomes are visible;
7. a derived candidate is frozen before holdout material is evaluated;
8. repeated derivatives from one origin do not become independent support;
9. whole-bundle success does not automatically credit each component;
10. attempts, failures, incomplete closeout, and consumed authority should be
    preserved append-only when a real experiment requires that evidence.

Classification:

```text
blind objective evaluation principles = METHOD_ONLY
hard-gate/vector/unknown semantics = METHOD_ONLY
freeze-before-holdout chronology = METHOD_ONLY
append-only attempt/failure evidence = METHOD_ONLY
```

Future research should reuse these rules through the smallest suitable current
owner rather than restoring the CW1 type family by default.

## Historicalize: CW1-specific experimental machinery

The following material is intrinsically tied to the terminated experiment and
has no preservation entitlement as current runtime merely because it is
implemented and tested:

- the commissioned controlled-workbench family and CW1-specific report/candidate
  surface;
- the Amber/Cobalt/Cedar/Quartz four-case corpus and holdout commitment;
- the fixed CW1 treatment schedule and 15-primary-slot live-training plan;
- replacement ceilings and CW1-specific attempt registry;
- CW1-specific candidate component assessment;
- CW1 live-training runner and CLI;
- CW1 production owner glue;
- CW1-specific cohort/external-execution authorization chain;
- CW1 artifact schemas, fixed slot/index expectations, and holdout artifacts;
- CW1 fake/conformance adapters and fixture-only execution material;
- CW1-specific Local Canonical children and their recurring verification cost.

Representative source families currently include:

```text
types/vnext/commissioned-controlled-workbench.ts
types/vnext/commissioned-controlled-live-training.ts
lib/vnext/commissioned-controlled-workbench*.ts
lib/vnext/commissioned-controlled-live-training*.ts
fixtures/vnext/research/commissioned-controlled-workbench*.ts
scripts/run-commissioned-controlled-live-training.ts
scripts/test-commissioned-controlled-workbench*.ts
scripts/test-commissioned-controlled-live-training.ts
scripts/fixtures/commissioned-live-training-*.ts
```

This list is an audit inventory, not authorization to delete every matching
path mechanically. Shared consumers and generic owners must be checked first.

Classification:

```text
CW1 experiment/corpus/schedule/result machinery = HISTORICAL_CW1
```

The corpus should not be treated as a privileged future benchmark. Reusing the
same known fixtures in a later experiment may itself weaken independence.

## Known shared seams that must be disentangled before deletion

Current source contains generic-looking owners with direct CW1 dependencies.
They must be separated by responsibility rather than deleted or retained by
filename alone.

In particular:

- the general Codex App Server adapter currently imports the CW1-specific
  external execution authorization owner;
- isolated-auth test/config material contains CW1 fixture controls;
- Local Canonical registers both general isolated-auth children and CW1-specific
  commissioned-work children.

A later implementation may choose the smallest compatible way to remove these
couplings. This closeout does not prescribe files/functions or a replacement
architecture. The required outcome is that generic native-host/auth behavior no
longer depends on a terminated research track.

## Authority after closeout

CW1 historical material grants no current or future authority to:

- retry or resume the cohort;
- create a new CW1 authorization;
- access, materialize, freeze, or execute the Quartz holdout;
- treat the three candidate components as learned or validated knowledge;
- require Agent Identity as a product/Core invariant;
- automatically restore CW1 code because a later experiment needs similar
  functionality;
- claim continuity benefit, harm, or scientific failure from the operational
  termination.

Any future controlled continuity experiment is a new experiment. It requires a
fresh question, current source audit, current execution route, new authorization
where applicable, and an independently justified corpus/holdout design.

## Reduction sequence

After this closeout is reviewed, reduction should proceed through separate,
auditable implementation work rather than one destructive cleanup:

1. audit consumers of every CW1-specific runtime/test family and every shared
   seam listed above;
2. detach general native-host/auth owners from CW1-specific authorization and
   fixture vocabulary while preserving current supported behavior;
3. remove CW1-specific Canonical registration so unrelated full verification no
   longer pays for a terminated experiment;
4. retire CW1-only runner/types/fixtures/artifact machinery once no current
   consumer depends on them;
5. separately reassess the remaining exact Codex 0.150.1 Agent Identity profile
   and keep only what current supported usage independently requires;
6. verify that current product, Core/protocol, continuity, managed execution,
   recovery, and provider-neutral paths remain intact.

Deletion evidence should prove absence of current consumers and preservation of
any surviving generic responsibility. Git history, merged PRs, Issues, and
receipts remain the archive; current source should not serve as an expensive
museum for a terminated experiment.

## This closeout changes no runtime

This document intentionally performs no source deletion, test deregistration,
runtime behavior change, provider/auth action, credential read, cohort action,
holdout action, semantic Transition, publication, Ready transition, or merge.

Its only effect is to make the terminal outcome and the salvage boundary
reviewable before a later code reduction.