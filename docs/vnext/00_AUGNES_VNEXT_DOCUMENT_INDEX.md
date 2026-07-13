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
- minimal Model Gateway and OpenAI reference adapter
- Codex/native-host context and receipt round trip
- `RunReceipt → Delta → Decision → later context` closed loop
- Project Home, Semantic Workbench, and shared Inspector
- migration, backup, restore, update, and recovery

## Active implementation order

```text
R1 Development Authority and Operability Reset
R2 Zero-config Runtime Spine
R3 Project Onboarding and Project Home
R4 Minimal Model Gateway
R5 Codex Host Round Trip
R6 Core Closed Loop
R7 Semantic Workbench and Inspector Consolidation
R8 Packaging, Update, Backup, Restore, and Recovery
Alpha: short real-user verification
Post-Alpha: usefulness and product-fit validation
```

## Deferred work

The following are not mainline prerequisites for R2–R8:

- Generic CLI second adapter
- AutomationPolicy / Autohunt expansion
- Personal Perspective / Perspective Arena productization
- advanced multi-provider routing
- autonomous evidence-runner expansion
- long-form qualification infrastructure

They may be reconsidered after the core product is feature-complete.

## Historical documents

Older plans, milestone snapshots, PR-by-PR checkpoint narratives, dogfood reports, closeout records, runbooks, and compatibility documents are not active sequencing authority. Read them only when modifying the historical compatibility path they describe.

Git history is the archive. New work should not preserve obsolete process residue solely for historical completeness.

## Development rule

A PR should either:

- move the active product flow forward,
- improve operability or reliability,
- preserve a real data/authority safety invariant, or
- remove verified obsolete residue.

New planning-only documents, passive workflow-stage panels, manual copy/paste flows, and feature-specific package smoke commands are not default work.
