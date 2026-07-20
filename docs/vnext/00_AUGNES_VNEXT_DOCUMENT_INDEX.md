# Augnes vNext document index

## Active authority

Use this order when current documents disagree:

1. `01_AUGNES_VNEXT_MASTERPLAN.md` — product identity and strategic invariants
2. `02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` — Core and protocol meaning
3. `03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` — active implementation order
4. `04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md` — development and post-Alpha evaluation
5. `../REPOSITORY_REDUCTION_SCOPE.md` — repository retention and deletion policy

Code and current runtime behavior remain the source of truth for what is implemented today.

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
- Project Home, Semantic Workbench, and shared Inspector
- Project Home owns Resume/current coordination; Semantic Workbench owns Verify
  and Decide; the shared Inspector owns exact authenticated read-only drill-down
  and gains no mutation or semantic authority from its name
- a bounded Personal Perspective lane that reuses existing Core review, context-selection, lineage, and feedback contracts
- migration, backup, restore, update, recovery, and automated-run reconciliation

## Active implementation order

```text
R1 Development Authority and Operability Reset
R2 Zero-config Runtime Spine + automation lifecycle primitives
R3 Project Onboarding and Project Home + project automation state
R4 Minimal Model Gateway + budget/timeout/cancellation
R5 Codex Host Round Trip + unattended run mode
R6 Core Closed Loop + first bounded Autohunt
  R6-A source-linked criterion assessment
  R6-B production EpisodeDeltaProposal creation
  R6-C operation-aware review and Transition closure
  R6-D bounded strategic advantage-transfer profile
  R6-E bounded automation and later-context feedback
R6-P Parallel bounded Personal Perspective slice
R7 Semantic Workbench and Inspector + automation control/readback
R8 Packaging, Update, Backup, Restore, Recovery, and run reconciliation
Alpha: short interactive, automated, and available perspective-assisted verification
Post-Alpha: usefulness and product-fit validation
```

R7 completion is claimed only after the user merges its final shared-Inspector
PR. R8 is a separate phase and does not begin as part of that final R7 vertical.

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
