# Augnes vNext document index

## Active authority

Use this order when current documents disagree:

1. `01_AUGNES_VNEXT_MASTERPLAN.md` — product identity and strategic invariants
2. `07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md` — post-Build Week
   user-facing topology, navigation, progressive disclosure, GuideBrief product
   responsibility, UX merge gates, and replacement-versus-addition discipline
3. `02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` — Core and protocol meaning
4. `03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` — active implementation order
5. `04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md` — development and post-Alpha evaluation
6. `../REPOSITORY_REDUCTION_SCOPE.md` — repository retention and deletion policy

The C0 charter takes precedence over older surface-topology planning where it
conflicts, but it does not redefine Core protocol semantics or durable
authority. Code and current runtime behavior remain the source of truth for
what is implemented today until later correction PRs change them.

## Product commitments

The vNext commitments that remain active are:

- provider-neutral, local-first temporal project substrate
- Resume / Verify / Decide
- native hosts execute; Augnes preserves meaning, lineage, reviewed decisions, and durable state
- project identity and isolation
- `TaskContextPacket`, `RunReceipt`, `EpisodeDeltaProposal`, and `ReviewDecision`
- a bounded Automation Spine using policy, grants, runs, receipts, stop conditions, and user control
- minimal Model Gateway and OpenAI reference adapter
- Codex/native-host context and receipt round trip for interactive and unattended runs
- `TaskContextPacket` intent + `RunReceipt` operational residue → source-linked,
  non-authoritative assessment/comparison → `EpisodeDeltaProposal` →
  `ReviewDecision` → authorized Transition → later context
- required criterion assessment plus optional bounded `strategic_advantage_transfer`
  analysis inside that same assessment boundary, never as a separate authority or subsystem
- later `ContextUseReview` feedback that traces whether accepted context or
  strategic transfers were helpful, stale, or misleading
- target post-Build Week surfaces: Blank State, embedded GuideBrief, AI
  Workplane, contextual Inspector, and the Provider / Runner / Tool Layer
- target default top-level navigation limited to Blank State and AI Workplane
- GuideBrief as an active, non-authoritative cross-surface interpretation and
  guidance responsibility, distinct from `TaskContextPacket`
- current Project Home, Semantic Workbench, Shared Inspector, Portability, and
  Recovery as implemented reference operator surfaces until later correction
  PRs absorb, demote, relocate, redirect, or remove them with replacement proof
- a bounded Personal Perspective lane that reuses existing Core review, context-selection, lineage, and feedback contracts
- migration, backup, restore, update, recovery, and automated-run reconciliation

## Active post-Build Week correction order

```text
C0 Product UX charter and hard invariants — documentation authority only
C1 Top-level IA reduction — next runtime step after C0 review and merge
C2 Blank State restoration and Project Home absorption
C3 GuideBrief active-path restoration
C4 AI Workplane reprojection
C5 Delegated Codex work timeline and resumption
C6 Contextual Inspector demotion
C7 Portability and Recovery management/safety relocation
C8 Visual system after IA correction
C9 Compatibility and obsolete-surface reduction
```

C1–C9 are not implemented, complete, or runtime-active. The R1–R8 sequence in
the Roadmap records the operational Core and reference operator implementation
that C0 preserves and reprojects; it is not the next user-facing correction
order.

## Active versus deferred scope

Active during R2–R8:

- minimal Automation Spine integrated into the shared Core path
- bounded policy-triggered execution
- capability grants, budgets, stop conditions, pause/cancel, receipts, and reconciliation
- bounded source-linked strategic review inside the required R6 assessment boundary
- condition-bound advantage extraction, strategy-patch and regression candidates,
  and later-outcome feedback for accepted transfers
- Personal Perspective work that reuses existing candidate, review, scoped state, context-selection, receipt, and feedback contracts

Deferred until the core product and minimal Automation Spine are feature-complete:

- Generic CLI second adapter
- advanced Autohunt heuristics and work-discovery optimization
- generic scheduler implementation inside Augnes
- unrestricted retry, self-modification, authority expansion, and automatic semantic commit
- broad Personal Vault and Perspective Arena productization
- persistent strategic actors; actor mutation, branching, merging, or population evolution
- unrestricted multi-round debate, automatic winner or fitness-based selection,
  consensus- or model-count-based promotion, and automatic strategy mutation
- advanced model routing used merely to simulate diversity
- hidden or automatic cross-project Personal Perspective injection
- advanced multi-provider routing
- autonomous evidence-chain expansion
- long-form qualification infrastructure

## Historical documents

Older plans, milestone snapshots, PR-by-PR checkpoint narratives, dogfood reports, closeout records, runbooks, and compatibility documents are not active sequencing authority. Read them only when modifying the historical compatibility path they describe.

Git history is the archive. New work should not preserve obsolete process residue solely for historical completeness.

## Development rule

A PR should either:

- move the active interactive or bounded automated product flow forward,
- advance the bounded Personal Perspective lane without blocking the mainline flow,
- improve operability or reliability,
- preserve a real data/authority safety invariant, or
- remove verified obsolete residue.

New planning-only documents, passive workflow-stage panels, manual copy/paste flows, duplicated automation/perspective subsystems, and feature-specific package smoke commands are not default work.
