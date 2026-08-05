# AGENTS.md

## Role

This file owns repository operating rules. It does not define the complete
product doctrine, Core/protocol semantics, implementation roadmap, evaluation
model, or C0–C9 history.

For the current repository workflow, Codex implements, verifies, and opens pull
requests. ChatGPT and the user set product direction and review scope. Codex
does not merge, mark ready, enable auto-merge, or claim user decisions.

## Repository and workspace boundary

- `hynk-studio/augnes-perspective-lab` is the sole repository target authorized
  by this policy.
- Work only in the exact local repository path supplied by the current task.
  Resolve `git rev-parse --show-toplevel`, branch, `HEAD`, clean/dirty state, and
  `origin` before reading or changing repository material.
- Do not interact with `hynk-studio/augnes` or any other repository, checkout,
  clone, mirror, worktree, or folder. This includes reading, searching,
  fetching, comparing, pushing, opening or editing GitHub items, reviewing,
  merging, tagging, releasing, dispatching workflows, or changing settings.
- Do not configure remotes, scripts, connectors, automation, or CI that contact
  another repository.
- The repository name is a temporary development location, not a separate
  `Perspective Lab` product identity. Product, Core, protocol, UI, and
  documentation use **Augnes**.
- Existing textual references to another repository are historical context and
  do not grant access.

Stop on any repository, root, branch, baseline, or remote mismatch.

## Required reading and active owners

Read only the owners relevant to the task:

- [`README.md`](./README.md) — product and supported-usage entry;
- [`docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md`](./docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md)
  — authority and conflict-resolution map;
- [`docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`](./docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md)
  — product and continuity doctrine;
- [`docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](./docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md)
  — sole Core/protocol semantic authority;
- [`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](./docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md)
  — completed/current/next/later/research sequencing;
- [`docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](./docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)
  — product-continuity, correctness, maturity, and outcome evaluation;
- [`docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md`](./docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md)
  — temporary C0–C9 program and C9 proof boundary;
- [`docs/REPOSITORY_REDUCTION_SCOPE.md`](./docs/REPOSITORY_REDUCTION_SCOPE.md)
  — retention/deletion safety for an explicitly authorized reduction.

Implementation contracts, operator manuals, research, compatibility documents,
fixtures, closeouts, submissions, and historical plans do not override these
owners.

## Product-continuity operating rules

Use product doctrine rather than duplicating it here. These rules are
merge-blocking:

1. Preserve the same durable work meaning across affected host-native
   interfaces without requiring identical interfaces.
2. Default product projection prioritizes goal, current meaningful situation,
   meaningful change/result, uncertainty/risk, pending judgment, and next
   meaningful action.
3. Internal research complexity may increase; default user complexity must not
   increase with it.
4. The existence of a record, schema, engine, model, capability, route,
   diagnostic, or status creates no page, menu, card, badge, or default concept
   entitlement.
5. Navigation and product presence follow user intention. A replacement must
   absorb, redirect, hide, demote, or remove the superseded concept instead of
   silently adding another destination.
6. A default state has one primary action when action is required.
7. Normal resumption, progress, result review, and important decisions require
   no Inspector or internal-ID work.
8. Protocol vocabulary is hidden by default unless an unavoidable term is
   explained and helps a consequential decision.
9. Timeline explains sequence; relationship exploration explains connection;
   GuideBrief explains present meaning; Inspector exposes exact records.
10. GuideBrief remains contextual, source-anchored, conversational, and
    non-authoritative.
11. Research engines may explore, compare, challenge, infer, predict, and
    propose. Research output is not truth, accepted Perspective, user decision,
    Transition, execution authority, or authority expansion.
12. Recommendation is not decision. Execution completion is not verified
    success. Candidate is not accepted state. Product projections do not create
    new Core records or authority.

Technical correctness is necessary but does not excuse a product-continuity
regression.

## Required feature-change questions

Every product or research change must answer:

1. Which core user question does this improve?
2. What interpretation burden does the system absorb?
3. What durable product meaning must remain consistent across surfaces?
4. Why does this capability deserve any default user-facing presence?
5. Which existing surface absorbs it?
6. What existing surface, card, explanation, or concept is removed, demoted, or
   replaced?
7. How is uncertainty preserved?
8. How is user authority preserved?
9. How does the result return to long-term continuity?
10. What later outcome would demonstrate usefulness or reveal failure?

A capability that cannot answer these questions remains research, internal
capability, compatibility, or deferred work rather than default product UI.

## Development defaults

- For exact current-project continuity, use
  `npm run codex:current-continuity`. It reads only the running local Augnes
  canonical projection and never falls back to repository seeds, GuideBrief,
  or legacy Work Brief material. Exit `0` means the continuity and snapshot
  are exact, `2` means local runtime transport is unavailable, and `3` means
  canonical continuity is partial/unavailable or the route contract is invalid.
- Repository execution preparation is project-scoped and selection-independent.
  Reuse the canonical physical-root baseline, current work/packet, managed-run
  read, and bounded worktree owners. Never use Browser active selection,
  selection revision, or Git remote equality as attachment authority. Missing
  legacy baselines and intentional root moves require their exact explicit
  adoption/rebind actions; explicit revocation is separate. Those exceptional
  mutations require one expiring expected-state request and a one-time grant
  from the same-origin Browser confirmation surface. That surface requires its
  HttpOnly, SameSite=Strict decision-session cookie and exact request-bound
  rotating nonce; Origin and Fetch Metadata headers alone are insufficient.
  MCP literals, annotations, assistant prose, runtime manifests, Companion
  access records, and delegated environments are not confirmation and expose
  no Browser session capability. Ordinary exact preparation requires no confirmation.
- `repository_execution_attachment.v0.1` is immutable start-snapshot metadata.
  CDX2B2A may prepare, validate, stale, supersede, and revoke it. The CDX2B2B
  attachment-backed start owner may consume one exact prepared attachment into
  one admitted managed run only after one Browser-confirmed start decision.
  Grant validation, attachment consumption, and run-claim admission are one
  immediate transaction; physical/worktree reobservation and the final
  database read gate the first adapter invocation. Exact replay returns the
  same run. A consumed attachment never returns to prepared and cannot bind a
  second run. Non-Git work remains available for continuity but is not eligible
  for managed repository delegation in v0.1.
- The CDX2B2B execution envelope permits broad bounded local reversible work
  only inside the exact macOS repository root. Network project commands,
  dependency downloads, push/GitHub, release/deploy/publish, injected
  Browser/Companion/provider/database/runtime/OS credentials, outside-root
  secret material or writes, and semantic approval remain outside the
  envelope. Files already present inside the exact repository remain in its
  read scope; do not claim content-based secret unreadability without a
  separately enforced read-time owner.
  Existing operation approval is separate from Start, and result review,
  ReviewDecision, and Transition remain separate from both. A durable run
  without its exact controller is disconnected/paused and never auto-resumes.
  Risk-reducing cancellation binds only the immutable consumed attachment and
  exact run/controller ownership; packet, work, root, baseline, worktree, and
  Browser-selection drift must not prevent cancelling that owned run.
- CDX2B4A resume checkpoints are private node-local operational history, not a
  mutable attachment or portable project truth. Resume eligibility is an exact
  read-only projection over the same run, attachment, event/step/effect,
  approval, controller, provider binding, root/baseline, worktree, and envelope
  owners. It never resumes a repository run. Ambiguous effect or missing
  post-effect state requires reconciliation; pending approval stays the next
  action. Browser active selection is not binding material.
- CDX2B4B may turn only exact `resume_ready` material into one expiring
  Browser-only Resume decision and one atomic same-run attempt. Eligibility is
  not authority, Resume decision is not operation approval, and the consumed
  Start grant is never reused. The same run, attachment, execution envelope,
  checkpoint, and provider thread are preserved while controller generation
  advances exactly once. A durable provider-invocation-start marker precedes
  `thread/resume`; once present, controller/result loss is reconciliation and
  never a second provider call. The immutable attempt and mutable supervised
  runtime claim are separate: exact user replay may transfer only a pre-marker
  claim by CAS, while durable lost-controller cancellation forbids later
  reacquisition without claiming provider stop. Generic historical interactive/policy resume
  keeps its existing owner. Companion startup never resumes automatically.
- For a fresh Codex request to resume, continue, or inspect the current local
  repository, use the Augnes Operator `augnes_resume_repository` tool. It must
  resolve one verified live supervised Companion and one registered physical
  project root through the narrow generation-bound Companion channel; never
  substitute docs, seeds, GuideBrief, legacy Work Brief, mock data, repository
  reconstruction, or Browser active selection for project identity. The nested
  CDX2A projection still truthfully reports active-selection status and
  eligibility.
- Prefer a working vertical slice with a real producer, consumer, behavior
  test, and later-use signal over planning, preview, boundary, or presence-only
  work.
- Reuse native host task, terminal, browser, diff, pull-request, worktree, and
  scheduler UX instead of rebuilding them in Augnes.
- Keep provider-neutral Core semantics; provider-specific behavior belongs in
  adapters.
- Preserve zero-model Core behavior. Model unavailability may remove
  enrichment but not continuity, review, or authorized Transition paths.
- Use one Core loop for interactive and policy-triggered work.
- Bounded automation may select work, start hosts, run tests, ingest results,
  and create proposals only within an approved policy/grant. It may not expand
  budget, scope, capability, semantic authority, or external authority.
- Preserve project isolation, source and temporal lineage, idempotency,
  replay/stale-state refusal, credential safety, migration safety, backup,
  restore, and recovery.
- Do not persist raw prompts, hidden reasoning, raw provider/challenger output,
  or broad transcripts by default.
- Model confidence, agreement, agent count, provider count, graph structure,
  and formalization are not authority.
- Do not create a separate planning document, manual handoff/copy-paste path,
  native execution replica, feature-specific package smoke, parallel proposal
  store, durable actor/debate substrate, or new authority layer by default.
- Preserve current user data, compatibility, and behavior until an explicitly
  authorized replacement proves parity and rollback.
- Git history is the primary archive. Remove material only through a separately
  authorized, proof-backed scope.

C0–C8 are merged. RR0 was inventory/planning, and RR1 is documentation
authority reconciliation. C9 remains pending separate explicit authorization.
Do not begin C9 from documentation, research, or cleanup language.

## Authority and safety

- Never fabricate tests, evidence, IDs, host observations, state changes,
  receipts, or pull-request URLs.
- Durable semantic changes and irreversible external actions require explicit
  authority.
- Keep semantic authority, execution authority, external-effect authority, and
  repository merge authority distinct.
- `ReviewDecision` and Transition remain separate. Host/native permission is
  not Augnes approval.
- Do not turn nonce, fingerprint, TTL, database path, checksum, process
  management, or protocol mechanics into normal user tasks.
- Do not merge, mark ready for review, enable auto-merge, publish evidence,
  release, deploy, or change repository settings without explicit authorization
  for that exact action.

## Verification

For ordinary changes:

- run focused tests for the changed behavior or documentation contract;
- run `npm run typecheck` for behavior changes;
- run `npm run build` when routes, runtime composition, or packaging are
  affected;
- use `npm test`, `npm run test:authority`, `npm run test:integration`,
  `npm run test:operability`, and the bounded browser lanes as the canonical
  public test surface;
- use disposable databases for destructive, writer, migration, restore, or
  recovery verification;
- cover both interactive and policy-triggered paths when shared lifecycle
  behavior changes;
- report exact commands, results, and concrete skipped reasons.

### Local Canonical verification lifecycle

- Before mutation and before deciding verification, prove the exact repository
  root, authorized origin, branch, baseline/head, and clean/dirty state.
- Use `npm run verify:local:quick` during implementation. Quick mode is
  non-deciding feedback and may record a dirty tree or noncanonical Node
  version.
- Before opening most pull requests, run
  `npm run verify:local:changed -- --base <exact-40-character-sha> --head <exact-40-character-sha>`.
  Run `npm run verify:local:full -- --base <exact-40-character-sha> --head <exact-40-character-sha>`
  when the planner selects `full-canonical`, before an explicitly required full
  phase, or when package, runtime, process, browser, or authority boundaries
  require it.
- Never weaken the planner, choose an artificial base, or widen timeouts to
  obtain a narrower or passing result.
- Deciding local evidence requires Node 24.18.0, npm 11.16.0, a clean worktree,
  and current `HEAD` equal to the requested head. Other supported versions are
  compatibility lanes and cannot silently produce a Canonical pass.
- Treat root `next-env.d.ts` and bounded `.next` output according to the
  repository-owned executor. Never hide unrelated tracked mutations.
- Dependency replacement, build, package, runtime, operability, and browser
  phases run sequentially on the shared host. Core and continuity E2E never run
  concurrently.
- Process-owning Canonical tests must use the repository's bounded test-harness lifecycle
  and declare a measured timeout. They must terminate and await their complete
  owned process tree, close listeners, and leave zero owned process, port,
  database, runtime-state, or temporary-file residue.
- Do not add automatic retries, arbitrary sleeps, or wider timeouts to obtain a
  pass. Do not add unbounded child waits or cleanup bypasses.
- Temporary deciding evidence is a completed successful local Canonical run for
  the exact pull-request head. Cite its exact repository-relative receipt path
  and SHA-256 content fingerprint. Validate the deciding receipt against the
  current repository after the exact-head run.
- A receipt records one execution on one shared machine. It is not hosted
  reproduction, independent attestation, signature, GitHub-authenticated
  execution, status, check, or deployment.
- Receipts and logs remain ignored local artifacts. Do not commit or upload
  them.
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
- GitHub Actions execution must remain absent. GitHub is source control,
  pull-request, review, and history infrastructure, not this repository’s
  active verification runner.

Long manual pilots and broad usefulness studies are Alpha/RC work unless the
task explicitly requires them. Basic product-continuity correctness remains a
merge gate for affected product changes.

## Pull requests

Use the user-authorized branch. Keep the PR centered on one product advance or
one audited reduction. Stage only intended files. Include:

- user/workflow or authority impact;
- complete changed-file list;
- current implementation versus target direction;
- data, Core/protocol, execution, and compatibility impact;
- tests and exact Local Canonical result;
- unresolved questions and next separately authorized work.

Keep Draft unless the user explicitly authorizes ready-for-review. Never merge
or enable auto-merge.
