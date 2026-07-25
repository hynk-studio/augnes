# AGENTS.md

## Role

The role split in this file is a temporary and replaceable repository-development convention. It is not an Augnes product, Core, protocol, UX, provider, host, or long-term development principle.

For the current repository workflow, Codex implements, tests, and opens pull requests for Augnes. ChatGPT and the user set product direction and review scope. Codex does not merge pull requests or claim user decisions. Roles and delivery mechanics may change as tools and project conditions change.

## Repository identity and interaction boundary

- This repository is a temporary development location for Augnes. The product,
  Core, protocols, documentation, schemas, UI, tests, and all development work
  must use **Augnes** as their name and product frame.
- Do not create or preserve a separate `Perspective Lab` product identity,
  terminology, architecture, roadmap, or user-facing concept. The repository
  name is only a repository location and does not name a separate product.
- `hynk-studio/augnes-perspective-lab` is the sole repository target for work
  performed under this policy.
- Do not interact with `hynk-studio/augnes` in any way. This prohibition
  includes reading, fetching, searching, cloning, pulling, comparing,
  inspecting current state, pushing, opening or editing issues or pull
  requests, commenting, reviewing, merging, tagging, releasing, dispatching
  workflows, or changing repository settings.
- Do not configure remotes, automation, CI, scripts, connectors, or other
  tooling that contacts `hynk-studio/augnes`.
- Use only the files, history, branches, issues, pull requests, and CI state in
  this repository as the working development source. Existing textual
  references to another Augnes repository are historical context only and do
  not grant permission to access it.
- This boundary remains in force until this repository policy is explicitly
  changed.

## Active product path

Advance this operational Core flow. It describes implemented engine continuity,
not the target default user navigation or an obligation to expose each protocol
step to a human:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run the native host / Codex interactively or through bounded automation
→ RunReceipt
→ source-linked, non-authoritative assessment/comparison
→ EpisodeDeltaProposal
→ ReviewDecision
→ authorized Transition
→ later TaskContextPacket
→ later ContextUseReview feedback
```

Read only the documents needed for the task:

- `README.md`
- `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md` for product identity
- `docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` for Core or protocol changes
- `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` for sequencing
- `docs/REPOSITORY_REDUCTION_SCOPE.md` for retention and deletion work

Older plans, handoff documents, dogfood reports, closeout records, and runbooks are historical unless the task explicitly targets a compatibility path.

## Merge-blocking product UX authority

`docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md` governs
post-Build Week user-facing topology, navigation, progressive disclosure,
GuideBrief product responsibility, UX merge gates, and replacement discipline.
It does not redefine Core protocol or durable authority.

The current runtime demonstrates the operational Core and a reference operator
interface. C0–C8 are merged. C7 removed the
permanent shared-shell Project tools menu and relocates project transfer plus
local-data safety into Blank State management contexts while preserving every
existing portability and recovery authority:

- **Blank State** — default simple human entry and resumption surface
- **GuideBrief** — embedded cross-surface interpretation and guidance layer
- **AI Workplane** — complex AI/operator work layer
- **Inspector** — contextual, optional, exact read-only drill-down
- **Provider / Runner / Tool Layer** — execution power without user-facing IA authority

Default top-level navigation is limited to **Blank State** and **AI Workplane**.
Project selection remains in Blank State. Project transfer/import and ordinary
backups/recovery are reached from Blank State’s closed **Manage and protect**
context; forced recovery remains condition-triggered by the runtime proxy.
Inspector is contextual beneath AI Workplane and is not a Project tool.
GuideBrief is not a peer destination. C1 established the two-zone shell. C2
renders `/` as the canonical Blank State; `/projects` and
`/projects/[projectId]` are compatible views of the same surface, while
`/overview` redirects to `/`. The `ProjectHomeProjectionV01` name may remain as
an internal source-model term, but Project Home and standalone onboarding are
not parallel user-facing products. C3 made GuideBrief v0.2 the active bounded
current-project View without replacing `TaskContextPacket` or granting
authority. C4 makes `/workbench/semantic-review` the canonical
human-facing AI Workplane, redirects `/workbench` there, and moves exact
protocol detail behind advanced or contextual paths. C5 made AI Workplane the
single live-Codex controller, added a bounded durable progress timeline over
the existing ledger, and gave Blank State a compact return path.
Leaving the page does not cancel admitted local work; lost local-runtime
ownership requires explicit exact resume. C6 makes
`/workbench/inspector` a concrete-target contextual Exact details surface,
removes generic active Inspector navigation, and provides deterministic related
return links. C7 keeps `/portability` and `/recovery` compatible while
presenting focused management and safety work with at most one primary action.
C8 applies one semantic visual hierarchy—situation, primary
action, AI summary, risk, supporting information, then raw record—across the
actual owning surfaces. RR0 is an inventory-and-planning phase only. C9 remains
pending and requires separate explicit authorization. Current code remains
authoritative for implemented behavior until each later correction PR changes
it.

### Hard UX invariants

These are repository operating rules, not aspirations. A user-facing PR that
violates them is blocked even when technical checks pass.

1. The default user surface exposes only the user goal, current meaningful work
   state, AI result or conclusion, important uncertainty/risk/blocker, and the
   next meaningful decision or action.
2. A normal user must not learn or manage `TaskContextPacket`, `RunReceipt`,
   `CriterionAssessment`, raw Evidence/Claim relations, fingerprints, nonces,
   TTLs, gate records, receipt identities, lineage IDs, internal current-head
   selection, or raw `ReviewDecision` and `Transition` concepts. Internal
   distinctions remain truthful; GuideBrief and user-facing projections
   translate them into ordinary language.
3. Hiding, translating, summarizing, and progressively disclosing internal
   complexity is the default. Raw structure requires a specific user need and
   explicit justification.
4. The existence of a Core record, protocol stage, schema, capability,
   subsystem, route, read model, or diagnostic does not entitle it to a page,
   top-level navigation item, permanent card, dashboard region, or new
   user-visible concept.
5. Navigation follows user intentions, not system architecture. Adding a third
   default destination is a product-architecture change requiring explicit user
   authorization and justification.
6. A replacement redesign must remove, absorb, redirect, hide, or explicitly
   demote the superseded surface within the approved correction program. It must
   not silently become additive navigation or page expansion.
7. Each default state has one visually and semantically primary action.
   Secondary actions must not compete with the primary next step.
8. Inspector must never be required for normal delegation, progress, result
   review, or the important-decision path.
9. Raw protocol vocabulary is zero by default on the normal path. An unavoidable
   term must be explained in ordinary language, help a consequential decision,
   and not require understanding the full protocol model. Protocol-vocabulary
   leakage is a merge-blocking UX regression.
10. Internal accuracy, authority correctness, source binding, tests, and CI are
    necessary but insufficient. Increasing default user complexity, obscuring
    product purpose, or transferring interpretation work from AI to the user is
    a product regression.
11. Basic UX correctness cannot be deferred entirely to Alpha or broad
    post-Alpha usefulness testing. A user-facing PR may be blocked on UX even
    when types, build, protocol tests, authority tests, E2E, and CI pass.
12. Broad visual polish must not precede correction of product topology,
    navigation, information hierarchy, surface responsibility, and progressive
    disclosure. Polish does not legitimize unresolved IA.

### Required user-facing PR questions

Every user-facing PR body must answer:

1. What concrete user intention does this change serve?
2. What complexity does the AI or system handle instead of transferring to the user?
3. What is the single primary action in the affected default state?
4. Does this change add a route, top-level destination, permanent card, dashboard region, or user-visible concept?
5. Why can the existing Blank State or AI Workplane not absorb it?
6. What existing surface is replaced, merged, redirected, hidden, or demoted?
7. Which protocol terms appear by default, and why are they unavoidable?
8. How does GuideBrief summarize or translate the underlying engine state?
9. Can a new user explain the current situation and next action within roughly ten seconds?
10. Can the normal path complete without opening Inspector?
11. Does the change preserve current runtime truth while moving toward the target topology?
12. Does this PR increase or reduce the number of concepts the user must understand?

An unsatisfactory answer blocks the PR. C0–C8 are merged. RR0 does not authorize
C9 or any runtime cleanup. Do not start C9 without explicit authorization.

## Development defaults

- Prefer a working vertical slice over planning, preview, boundary, or smoke-only work.
- Each PR should move the active product path forward or remove verified obsolete residue.
- Implement R6 in this order: R6-A source-linked criterion assessment; R6-B
  production `EpisodeDeltaProposal` creation; R6-C operation-aware review and
  Transition closure; R6-D bounded strategic advantage-transfer profile; R6-E
  bounded automation and later-context feedback. These are R6 slices, not new
  top-level phases.
- Treat the minimal Automation Spine as a cross-cutting core capability across R2–R8: policy evaluation, bounded grants, run lifecycle, timeout/cancel/stop conditions, receipts, reconciliation, and user-visible pause/retry state.
- Do not defer automation architecture until after the manual path. Interactive and policy-triggered runs should converge on the same Core contracts and receipts.
- Defer only advanced automation: generic scheduler replication, broad hunt heuristics, unrestricted retry, self-modification, automatic semantic commit, and automation-specific product sprawl.
- Personal Perspective may advance as a bounded parallel lane when it reuses existing candidate, review, scoped state, context-selection, receipt, and feedback contracts. Do not create a separate Personal Perspective substrate or make it a blocker for the mainline path.
- Do not add a new planning-only document, workflow-stage table, passive panel, manual copy/paste flow, native execution replica, or feature-specific package smoke command by default.
- Reuse native host task, terminal, browser, diff, PR, worktree, and scheduler UX instead of rebuilding them in Augnes.
- Keep provider-neutral Core semantics; provider-specific behavior belongs in adapters.
- Keep `criterion_assessment` required and `strategic_advantage_transfer` optional
  inside the same non-authoritative R6 assessment boundary. Do not create a
  separate strategic engine, Arena, actor store, debate table, or authority layer.
- Source-bind every strategic base to the exact packet, applicable receipt,
  project, working frame, source refs, fingerprint, profile/version, and budget.
  Require applicability condition, expected effect, transfer cost, falsifier,
  uncertainty, introduced risks, and regression material for a transferable
  advantage.
- Downgrade insufficiently supported strategy patches to `research_delta` or
  `validation_delta` candidates rather than applying plan or Perspective changes.
- Preserve zero-model Core behavior. Model unavailability may remove strategic
  enrichment but must not disable criterion assessment, proposal review, or Core
  transitions.
- Do not persist raw prompts, debate transcripts, raw provider or challenger
  output, hidden reasoning, or internal strategic scores.
- Model confidence, model agreement, agent count, and provider count are not
  semantic authority. Never automatically select, accept, apply, or inject a
  strategy, expand a strategic budget, or retry beyond explicit policy.
- Preserve current user data, migration history, recovery paths, and working runtime behavior unless the task explicitly replaces them.
- When replacing compatibility behavior, remove the old path in the same PR after the replacement is tested.

## Authority and safety

- Never merge a PR or enable auto-merge.
- Never fabricate tests, evidence, IDs, host observations, state changes, or PR URLs.
- Durable semantic changes and irreversible external actions require explicit user authority.
- Bounded automation may select work, start hosts, run tests, ingest results, and create proposals within an approved policy/grant; it must not silently expand its own authority.
- Keep model/provider egress bounded and explicit.
- Preserve project isolation, idempotency, replay refusal, credential safety, migration safety, backup, and restore behavior.
- Do not turn internal nonce, fingerprint, TTL, DB path, checksum, or process-management details into normal user tasks.

## Verification

For ordinary PRs:

- run focused tests for the changed behavior
- run `npm run typecheck` for behavior changes
- run `npm run build` when routes, runtime composition, or packaging are affected
- use `npm test`, `npm run test:integration`, `npm run test:authority`,
  `npm run test:operability`, and `npm run test:e2e` as the canonical public
  test surface
- use disposable databases for destructive or migration tests
- use automated browser/CDP checks for affected user flows when practical
- cover both interactive and policy-triggered paths when changing shared run lifecycle behavior
- for strategic/R6 changes, verify exact packet, receipt where applicable,
  project, and base-strategy binding; cross-project and stale-base refusal;
  `insufficient → unknown`; skipped checks and host completion not becoming task
  success; interactive/policy-triggered parity; and model-unavailable fallback
- verify that no unreviewed assessment, strategic candidate, or pending proposal
  enters later context, and that proposal → decision → Transition → later packet
  → feedback lineage is complete
- report exact commands, results, and concrete skipped reasons

### Local Canonical verification lifecycle

- Operate only in the repository path explicitly opened or supplied by the
  user. Before mutation, resolve the repository root and verify its `origin`
  against the user-authorized repository. Stop on a mismatch.
- Use `npm run verify:local:quick` during implementation. Quick mode is
  non-deciding feedback and may truthfully record a dirty tree or noncanonical
  Node version.
- Before opening most pull requests, use
  `npm run verify:local:changed -- --base <exact-40-character-sha> --head <exact-40-character-sha>`.
  Use `npm run verify:local:full -- --base <exact-40-character-sha> --head <exact-40-character-sha>`
  when the planner selects `full-canonical`, before phase completion, or when
  package, runtime, process, browser, or authority boundaries change.
- Deciding local evidence requires Node 24.18.0, a clean worktree, and current
  `HEAD` equal to the requested head. Node 22 and 24 are compatibility lines;
  another version must not silently produce a Canonical pass.
- Treat root `next-env.d.ts` as ignored Next.js output. `npm run typecheck`
  owns `next typegen` before `tsc --noEmit`; development and production may
  generate references beneath `.next/dev/types` and `.next/types`. Never
  restore or mask this file in the executor, and continue to fail deciding
  verification for every unrelated tracked mutation.
- The package compatibility guard compares the dependency graph. Root package
  application/toolchain metadata is not graph identity, while the explicit
  root dependency-bearing fields and every non-root resolved package entry
  remain exact.
- Canonical tests that start processes, servers, browsers, listeners, or long-lived asynchronous work must use the repository's bounded test-harness lifecycle and declare a measured timeout.
- A timeout must terminate and await the complete verified owned process tree, close owned listeners, and leave zero owned process, runtime-state, database, port, or temporary-file residue.
- Do not add unbounded `spawn`, `spawnSync`, child waits, polling loops, or server-close paths to canonical tests. New process-owning fixtures must cover timeout and cleanup behavior automatically.
- GitHub Actions execution must remain absent. GitHub is source control,
  pull-request, review, and history infrastructure, not an active verification
  runner for this repository.
- Temporary deciding evidence is a completed successful local Canonical run for
  the exact pull-request head. Record the exact repository, base and head SHAs,
  clean/dirty state, OS and architecture, Node/npm versions, root and nested
  lockfile fingerprints, selected plan, every selected command/result and
  duration, cleanup/remaining-process result, and final pass or failure.
- Local evidence must name its shared-host environment and limitations. It does
  not provide an independent hosted reproduction or external status identity.
- Run process-owning, package, runtime, and browser lanes sequentially on the
  shared host. Core and continuity E2E must not run concurrently.
- Cite the exact repository-relative receipt path and SHA-256 content
  fingerprint in PR evidence. Validate it after the exact-head run. Never call
  the receipt hosted evidence, independent attestation, or an external status.
- Generated receipts and logs remain ignored local artifacts. Do not commit or
  upload them or create a GitHub status from them.
- Local Canonical PR evidence publication is never implicit. Codex may run
  `npm run verify:local:evidence:prepare` without a GitHub write, but may run
  `verify:local:evidence:publish` only when the user explicitly authorizes the
  exact task and current task Draft PR.
- Publish only after source is committed, the exact head is pushed, and a
  current changed/full receipt validates as deciding. Never publish quick,
  dirty, stale, failed, incomplete, noncanonical, or non-deciding evidence.
- Publish only the bounded dedicated marker comment to the current task Draft
  PR. Never publish to a historical PR or unrelated issue; never create a
  status, check, deployment, review, label, workflow, merge, ready-for-review
  transition, auto-merge action, or repository-setting change.
- Stop on duplicate marker comments, stale base/head/branch identity, a fork or
  non-Draft target, or an optimistic replacement fingerprint/body mismatch.
  Replacing different evidence requires the exact prior publication
  fingerprint and explicit publication confirmation. An identical fingerprint
  must be an idempotent no-write result.
- Call the comment a mutable local-evidence projection. Its SHA-256 fingerprints
  prove content integrity only, not a signature, hosted reproduction,
  GitHub-authenticated environment, or independent attestation.
- Do not add automatic retries, arbitrary sleeps, or wider timeouts to obtain a
  pass. Fix a failing child from its label and heartbeat, produce a new exact
  head when code changes, and rerun every affected selected command.
- Increase child or suite timeouts only from measured successful durations. Never widen a timeout merely to conceal a hang.

Long manual operator pilots, broad real-project usefulness evaluation, and extended qualification are Alpha/RC activities, not default merge gates for R2–R8. Bounded automation and Personal Perspective paths still require focused behavior tests as they are implemented.

## Pull requests

Use a dedicated branch. Keep the PR centered on one product advance or one audited reduction. Include:

- what now works or what verified residue was removed
- user/workflow impact
- changed files
- tests actually run
- data, authority, and compatibility impact
- remaining blocker

Do not hide breaking changes as cleanup.
Never merge, mark ready for review, or enable auto-merge.
