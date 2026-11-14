# AGENTS.md

## Purpose and collaboration

This file is the small, durable repository constitution for Augnes. It owns
repository identity, collaboration, development, authority, safety, and
verification principles. Product doctrine, Core/protocol meaning,
implementation status, and evaluation belong to their active owners;
temporary program history belongs to supporting historical records.

- Task owners define the goal, acceptance criteria, scope, non-goals, invariants,
  authority, required evidence, total budget, and stopping conditions at a scale
  appropriate to the task. Reviewers independently audit source and evidence.
- Contributors own current-source inspection, implementation search, file,
  function, and test choice, implementation, verification, and Draft
  pull-request creation within their authorized scope.
- Issues and pull requests constrain outcomes and invariants. Proposed methods,
  files, and tests are revisable on evidence unless an explicit scope limit,
  current compatibility contract, or authority boundary fixes them.
- Implementation and verification do not grant user-decision, repository
  approval, or merge authority.

These responsibilities apply to human and automated contributors. Versioned
repository contracts remain the reference for development and review.

## Repository and workspace identity

- The sole current repository is `hynk-studio/augnes`. The registered reference
  installation and deciding verification host are defined by the
  [Local Canonical policy](.github/LOCAL_CANONICAL_VERIFICATION.md).
  Verification-only linked worktrees require explicit admission under that
  policy; they do not change installed-production identity or grant adoption
  authority.
- Use the checkout authorized for the task. Isolated development, including
  authorized Codex Cloud work, may inspect source, implement changes, run
  focused development tests, and create branches, commits, pushes, and Draft
  pull requests within scope. Development feedback is not actual reference-host
  integration evidence or a Local Canonical receipt; checkout access grants no
  additional production, provider, deployment, or merge authority.
- Historical repositories and retired workspaces, including
  `hynk-studio/augnes-perspective-lab`, remain provenance and rollback material
  only. They grant no current development, project, execution, verification,
  provider, or GitHub-write authority.
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

### Joint method improvement

For a method change or a claim of improved quality, capability, cost, latency,
reliability, or user burden, connect: observed loss or improvement opportunity
→ hypothesis → allowed change surface and resource boundary → development
iteration → observed behavioral/result change → next decision. An approved new
capability or simpler path can justify improvement without inventing a defect;
vague possibility alone cannot expand scope. Scale this to the task, without a
research form for ordinary fixes or documentation or universal search counts.

- Task owners and reviewers distinguish observation from interpretation,
  implementation or method failure, insufficient observation, and negative
  evidence. Contributors diagnose the actual path and may challenge a proposed
  cause, choose a simpler method, or find that no implementation is needed.
  Explain the expected behavioral effect and the evidence for continuing or
  stopping. Method exploration does not expand scope, authority, or resources.
- Keep development iteration, exact-source correctness verification, and fixed
  usefulness evaluation distinct. Read the
  [method-improvement evidence guidance](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md#method-improvement-evidence)
  for comparisons, exposure, burden, and next-decision reporting; existing
  verification, provenance, and deciding-run refusal rules still apply.

### Bounded completion and problem response

- Within the approved goal, contracts, authority, and budget, contributors choose
  methods, correct defects and affected callers, restore task-owned setup with
  fixed inputs, verify, self-review, and finish the PR handoff. Do not stop for
  repeated approval of already delegated work. Hold only the action that exceeds
  the grant unless an applicable stop instruction requires a wider stop. Changes
  to product meaning, public contracts, support, shared state, or external effects
  still need the applicable authority; do not weaken assertions or gates to pass.
- Before an additional check, rerun, or measurement, identify the concrete risk,
  what existing evidence cannot answer, and the decision the result could change.
  Keep this in the existing task or PR notes; no additional form is required.
  Count cumulative preparation, diagnosis, repair, verification, review, and user
  effort for the same problem across renamed tasks, candidates, and delegations.
- Distinguish a caller's wait timeout from actual termination, an observed test
  failure, a required deadline violation, and unknown completion. Inspect the
  existing execution and retained results before considering another invocation.
  A timeout alone establishes neither a product defect, a shared-tooling need,
  nor retry authority. Preserve observed failures and incomplete coverage.
- Shared verification changes need a demonstrated recurring cause, cumulative
  cost, material authority/data/evidence defect, or unreliable required check.
  Explain which existing procedure, duplicate check, or manual effort they reduce.
  An adjacent improvement does not automatically become a completion condition
  or a follow-up task. Existing gates, grants, and attempt limits remain binding;
  general guidance neither renews spent authority nor creates a new retry.

### Practical review and closure

- Block on material outcome, regression, or contract defects; missing or
  conflicting required evidence; or an applicable authority violation. State the
  evidence, consequence, and condition that resolves each blocker. A concrete
  source path can suffice; full incident reproduction is not universally needed.
  Mark optional improvements separately from required corrections.
- Collect material findings in the first review where possible. Accept sound
  rebuttals and smaller alternatives, withdrawing or downgrading unsupported
  findings. Follow-up review covers resolved blockers, the changed delta and its
  effects, including which prior evidence the change invalidates. Reopen settled
  conditions only for a concrete new reason.
- Independent review evaluates source and evidence independently; it need not
  duplicate every execution unless required or justified by a specific evidence
  concern. Reuse evidence only within its valid scope and still satisfy mandatory
  final-target verification. A missing report link can be repaired from existing
  results without rerunning the workload.
- When the goal and required conditions are met and no material blocker remains,
  accept and close the review. If budget or authority is exhausted, or another
  attempt cannot inform a decision, close the attempt with remaining blockers
  and resumption conditions. Optional suggestions do not prevent acceptance.
  Technical acceptance does not grant a state transition; already valid
  conditional authority need not be requested again once its conditions are met.

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
- Ordinary explanatory documentation needs exact diff review and appropriate
  content checks, not Local Canonical execution or a receipt. Authority/contracts and
  dispositions follow the documentation responsibilities in the policy below.
- Do not make explanatory wording, heading style, or PR-template length a test
  contract. Test executable behavior and actual machine-consumed interfaces;
  review document meaning directly. A documentation link alone does not require
  runtime verification or tests of unrelated implementation.
- For changes requiring deciding pull-request verification, ask the Local
  Canonical planner for the final exact head and follow the
  [Local Canonical verification policy](.github/LOCAL_CANONICAL_VERIFICATION.md).
- Deciding evidence binds the exact clean repository, origin, base, head,
  environment, selected plan, and completed cleanup. It does not transfer to a
  different source head or environment.
- Repository-owned process tests must use bounded lifecycle and cleanup owners
  and leave no owned process, port, database, runtime-state, or temporary-file
  residue.
- Do not retry a failed exact-head deciding run merely to obtain a pass. A
  source change creates a new verification target; when deciding execution is
  applicable, it requires a new deciding run. The Local Canonical policy permits
  at most one linked recovery invocation for a frozen candidate only after a
  substantiated infrastructure cause has been corrected and verified. Product
  failures, unknown timeouts, safety violations and cosmetic commits do not
  reset or acquire that allowance.

## Pull requests

Use the user-authorized branch, stage only intended files, and keep the pull
request Draft unless the user explicitly authorizes otherwise. Report the
changed files, user/workflow and authority impact, data/Core/execution/
compatibility impact, focused checks, planner-selected exact-head verification
when applicable (otherwise state why it is not applicable),
skipped checks, and unresolved risks. Ready, merge, and auto-merge remain subject
to the explicit authority requirements above.
