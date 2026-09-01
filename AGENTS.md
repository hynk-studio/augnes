# AGENTS.md

## Purpose and collaboration

This file is the small, durable repository constitution for Augnes. It owns
repository identity, collaboration, development, authority, safety, and
verification principles. Product doctrine, Core/protocol meaning,
implementation status, evaluation, and temporary program history belong to
their active owners.

- ChatGPT and the user own the goal, scope, invariants, authority, non-goals,
  and deciding-evidence requirements. ChatGPT and the user also own
  post-implementation audit and evidence review.
- Codex owns current-source inspection, implementation search, file, function,
  and test choice, implementation, verification, and Draft pull-request
  creation.
- Issues and pull requests constrain outcomes and invariants. They do not force
  stale preselected mechanisms unless a current compatibility or authority
  boundary fixes the mechanism.
- Codex does not claim user judgments, repository approval, or merge authority.

## Repository and workspace identity

- The sole current repository/root pair is `hynk-studio/augnes` and
  `/Users/hynk/code/augnes`.
- `hynk-studio/augnes-perspective-lab` and
  `/Users/hynk/code/augnes-temp` are historical provenance and rollback
  material only. They grant no current development, project, execution,
  verification, provider, or GitHub-write authority.
- Before repository work and again before deciding verification, resolve the
  exact repository root, origin, branch, `HEAD`, base, and clean/dirty
  worktree state. Stop on a mismatch.
- Preserve unrelated user work. Do not reset, stash, discard, overwrite, or
  relocate it to make a task or verification pass.
- New development, issues, pull requests, and verification target only the
  current repository. Historical links remain historical and must not be
  blanket-retargeted.
- Checked-in source and runtime behavior are the truth for what is implemented.
  Git history is the primary archive.

## Active authority owners

Read only the owners relevant to the task. Start with the
[authority map](docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md) when ownership is
unclear.

- [README.md](README.md) owns the product entry and supported usage.
- [Product and continuity doctrine](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md)
  owns product identity, cross-surface meaning, complexity compression, and the
  product feature-change test.
- [Architecture and protocol](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md)
  is the sole semantic owner for Core records, persistence, lineage, evidence,
  proposals, decisions, Transitions, execution authority, and provider-neutral
  protocol boundaries.
- [Implementation and sequence](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md)
  owns completed, current, next, later, research, and compatibility status.
- [Evaluation and maturity](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)
  owns correctness, product-continuity, maturity, outcome, and usefulness
  evaluation.
- The [temporary correction charter](docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md)
  owns only C0-C9 history, status, proof boundary, and closeout.
- The [reduction policy](docs/REPOSITORY_REDUCTION_SCOPE.md) applies only to an
  explicitly authorized retention, reduction, or deletion task.

Implementation contracts, operator manuals, research, compatibility material,
fixtures, closeouts, and historical plans may constrain their bounded surfaces.
They do not silently override an active owner or create current authority. An
unknown conflict fails closed: preserve current behavior and data, record the
uncertainty, and obtain separate authority before changing semantics,
compatibility, or runtime behavior.

## Development operating model

- Inspect current source before choosing an implementation. Prefer the active
  owner and current behavior over stale file, function, or phase prescriptions.
- Keep changes bounded, reversible, reviewable, and attributable. Do not widen a
  task because adjacent cleanup is convenient.
- Preserve current user data, behavior, compatibility, and recovery until an
  explicitly authorized replacement proves parity and rollback.
- Independent source-first audit, review, verification, investigation, and
  claim checking do not automatically require continuity priming.
- Explicit resume, continue, recovery, or current-state intent uses the
  repository-owned [current-continuity contract](docs/CODEX_CURRENT_CONTINUITY_V0_1.md)
  and [Companion tooling](docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md). Those
  active owners define the exact lifecycle and tool mechanics; do not duplicate
  them here.

## Durable technical principles

- Keep Core semantics provider-neutral. Provider-specific behavior belongs in
  adapters.
- Preserve zero-model continuity, review, decision, Transition, restore, and
  recovery paths. Model unavailability may remove enrichment, not Core
  correctness.
- Preserve project isolation; source and temporal lineage; idempotency and
  replay/stale-state refusal; credential safety; and migration, backup, restore,
  and recovery.
- Recommendation is not decision. Execution completion is not verified success.
  Candidate, projection, assessment, and research output are not accepted state,
  truth, a Core record, or authority. `ReviewDecision` is not an applied
  Transition.
- Semantic, execution, external-effect, and repository merge authority remain
  distinct.
- Automation operates only within its approved scope and grant. It may not
  expand budget, capability, semantic authority, execution authority, or
  external-effect authority.
- Do not persist raw prompts, hidden reasoning, raw provider payloads, broad
  transcripts, or secrets as durable product state by default.
- Retire current material only through a separately authorized, consumer-audited,
  proof-backed change.

## Authority and safety

- Never fabricate tests, evidence, IDs, receipts, observations, state changes,
  or pull-request state.
- Durable semantic changes and irreversible external effects require exact user
  authority. Host permission, model confidence, agreement, formalization, or
  execution completion never expands authority.
- Evidence is review material, not approval, publication authority, or merge
  authority.
- Do not merge, mark Ready, enable auto-merge, release, deploy, publish evidence,
  or change repository settings without exact user authority for that action.

## Verification

- Run focused checks owned by the changed behavior or documentation contract.
  Report exact commands and results, plus concrete reasons for skipped checks.
- For deciding pull-request verification, ask the repository-owned Local
  Canonical planner for the final exact head and follow the
  [Local Canonical verification policy](.github/LOCAL_CANONICAL_VERIFICATION.md).
- Deciding evidence binds the exact clean repository, origin, base, head,
  environment, selected plan, and completed cleanup. It does not transfer to a
  different source head or environment.
- Repository-owned process tests must use bounded lifecycle and cleanup owners
  and leave no owned process, port, database, runtime-state, or temporary-file
  residue.
- Do not retry a failed exact-head deciding run merely to obtain a pass. A
  source change creates a new verification target and requires a new deciding
  run.

## Pull requests

Use the user-authorized branch, stage only intended files, and keep the pull
request Draft unless the user explicitly authorizes otherwise. Report the
changed files, user/workflow and authority impact, data/Core/execution/
compatibility impact, focused checks, planner-selected exact-head verification,
skipped checks, and unresolved risks. Never merge or enable auto-merge.
