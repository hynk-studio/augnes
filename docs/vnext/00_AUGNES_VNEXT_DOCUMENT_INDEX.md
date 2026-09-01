# Augnes vNext authority map

## Role

This file is the concise map of active repository authority. It does not own
product doctrine, Core semantics, implementation chronology, evaluation
criteria, or the C0–C9 program.

The governing rule is:

> One durable topic has one active owner. Other material may implement,
> constrain, research beyond, or preserve the history of that owner, but it
> does not silently become competing current authority.

## Active owners

| Durable topic | Active owner | Boundary |
|---|---|---|
| Product and continuity doctrine | [`01_AUGNES_VNEXT_MASTERPLAN.md`](./01_AUGNES_VNEXT_MASTERPLAN.md) | Defines what Augnes is, cross-surface continuity, product responsibilities, authority boundaries, and the feature-change test. It does not define Core records or claim implementation status. |
| Core and protocol semantics | [`02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](./02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md) | Sole semantic authority for Core records, identity, persistence, lineage, evidence, proposals, decisions, Transitions, execution authority, and provider-neutral protocol boundaries. |
| Current implementation status and sequence | [`03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](./03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) | Sole owner of completed, current, next, later, and research sequencing. Current code remains the truth for implemented behavior. |
| Evaluation and maturity | [`04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](./04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) | Owns correctness, product-continuity, outcome, maturity, and usefulness evaluation without inventing measured success. |
| Temporary C0–C9 correction program | [`07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md`](./07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md) | Owns only the reason, status, C9 proof boundary, and closeout of the temporary correction program. |
| Product entry and supported usage | [`../../README.md`](../../README.md) | Concise product introduction, supported startup/evaluation paths, current topology summary, and links to active authority. |
| Repository operating rules | [`../../AGENTS.md`](../../AGENTS.md) | Repository identity, collaboration, development, authority, safety, exact-head verification, and Draft pull-request principles. |
| Retention and deletion safety | [`../REPOSITORY_REDUCTION_SCOPE.md`](../REPOSITORY_REDUCTION_SCOPE.md) | Phase-neutral responsibility classes and proof requirements for authorized retention, reduction, and deletion work. It does not authorize an individual disposition. |

## Supporting layers

### Active implementation contracts

Versioned contracts such as
[`GUIDEBRIEF_CONTRACT_V0_2.md`](../GUIDEBRIEF_CONTRACT_V0_2.md), Local Canonical
verification policy, current review-window and operability contracts,
recovery/portability contracts, and active package contracts constrain actual
implementations. They implement canonical authority but do not override it.

### Temporary cleanup program

[Issue #1170](https://github.com/hynk-studio/augnes/issues/1170) is the current,
temporary repository-cleanup program and the explicit authorization to begin
proof-backed C9 dispositions. It is not permanent product or Core doctrine,
does not complete C9, and is not blanket deletion authority. `03` owns current
program sequencing, `07` owns the temporary C9 proof boundary, and the
repository reduction policy owns phase-neutral classification and disposition
proof.

### Active research

Research documents and research runtime families must identify themselves as an
implemented bounded capability, active research, paused research, deferred
candidate, or unresolved program. Formalization, model agreement, graph
structure, persistent artifacts, or runtime reachability do not create product
or semantic authority.

The current distinctions include limited implemented Personal Perspective
controls versus broader deferred R&D; bounded strategic transfer and
`ContextUseReview`; unresolved temporal, metacognitive, retrieval, and candidate
diagnostics; paused Sidecar residue; current native context reuse versus older
handoff compatibility; bounded automation versus legacy autonomy/Autohunt;
deferred Arena/actor/debate substrate; and current relationship responsibility
versus legacy “constellation” branding.

### Supporting decisions and research direction

The
[ACGC Stage 6 Operational-Policy Non-Activation ADR](./research/ACGC_STAGE_6_OPERATIONAL_POLICY_ADR_V0_1.md)
records the no-activation architecture choice accepted for the current evidence
state and supports the ACGC research program. It does not become a competing
product, protocol, sequencing, or evaluation authority.

The
[ACGC Post-Stage-6 Evidence Direction](./research/ACGC_POST_STAGE_6_EVIDENCE_DIRECTION_V0_1.md)
consolidates later design inputs under the existing ACGC owner. It is a
supporting research direction only: listing a preferred evidence sequence does
not make any slice Current or Next, authorize Stage 7, or create memory, policy,
actor, promotion, runtime, or product authority.

### Operator and developer manuals

Runbooks, setup guides, package manuals, skills, and verification manuals govern
their named operating path. They do not define product doctrine, Core semantics,
or current sequencing.

### Compatibility and historical material

Older plans, milestone snapshots, closeouts, submission records, fixtures,
archived packages, compatibility documents, and branch residue remain evidence
or support for the paths that still consume them. They are not active authority
unless an active owner explicitly delegates a bounded contract to them. Git
history is the primary archive; retirement requires separate reviewed proof.

The
[ACGC-CW1 terminal closeout and salvage boundary](./research/ACGC_CW1_TERMINAL_CLOSEOUT_AND_SALVAGE_V0_1.md)
records that CW1 terminated before obtaining a usable empirical cohort result,
separates independently useful generic mechanisms and research-method lessons
from CW1-specific historical machinery, and defines a consumer-audited
reduction boundary. It is closeout/history material only and does not own
current sequencing, authorize deletion, or create a scientific conclusion.
Its scientific disposition remains `not_tested`, and its track disposition
remains terminal history.

## Conflict resolution

1. Use the active owner for the topic in dispute.
2. Product projections in `01` cannot redefine Core/protocol meaning in `02`;
   `02` cannot invent product navigation or claim target product completion.
3. `03` is the only active sequencing document, and it must agree with
   checked-in runtime evidence about what is implemented.
4. `04` owns evaluation; a roadmap milestone, fixture, metric, or test count
   cannot claim product usefulness on its own.
5. `07` is temporary C0–C9 authority only. It cannot override durable doctrine,
   Core semantics, or evaluation, and it retires after C9 closeout.
6. Active implementation contracts may narrow an implementation but cannot
   expand product, semantic, execution, or user authority.
7. Research, compatibility, and historical material lose any conflict with an
   active owner.

Unknown conflicts fail closed: preserve the current implementation and data,
record the unresolved question, and obtain separate explicit authorization
before changing runtime, authority, or compatibility.
