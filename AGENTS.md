# AGENTS.md

## Role

Codex implements, tests, and opens pull requests for Augnes. ChatGPT and the user set product direction and review scope. Codex does not merge pull requests or claim user decisions.

## Active product path

Advance this flow:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run the native host / Codex interactively or through bounded automation
→ return a structured result
→ review the result
→ approve any durable semantic change
→ reuse the changed context in later work
```

Read only the documents needed for the task:

- `README.md`
- `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md` for product identity
- `docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` for Core or protocol changes
- `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` for sequencing
- `docs/REPOSITORY_REDUCTION_SCOPE.md` for retention and deletion work

Older plans, handoff documents, dogfood reports, closeout records, and runbooks are historical unless the task explicitly targets a compatibility path.

## Development defaults

- Prefer a working vertical slice over planning, preview, boundary, or smoke-only work.
- Each PR should move the active product path forward or remove verified obsolete residue.
- Treat the minimal Automation Spine as a cross-cutting core capability across R2–R8: policy evaluation, bounded grants, run lifecycle, timeout/cancel/stop conditions, receipts, reconciliation, and user-visible pause/retry state.
- Do not defer automation architecture until after the manual path. Interactive and policy-triggered runs should converge on the same Core contracts and receipts.
- Defer only advanced automation: generic scheduler replication, broad hunt heuristics, unrestricted retry, self-modification, automatic semantic commit, and automation-specific product sprawl.
- Personal Perspective may advance as a bounded parallel lane when it reuses existing candidate, review, scoped state, context-selection, receipt, and feedback contracts. Do not create a separate Personal Perspective substrate or make it a blocker for the mainline path.
- Do not add a new planning-only document, workflow-stage table, passive panel, manual copy/paste flow, native execution replica, or feature-specific package smoke command by default.
- Reuse native host task, terminal, browser, diff, PR, worktree, and scheduler UX instead of rebuilding them in Augnes.
- Keep provider-neutral Core semantics; provider-specific behavior belongs in adapters.
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
- use disposable databases for destructive or migration tests
- use automated browser/CDP checks for affected user flows when practical
- cover both interactive and policy-triggered paths when changing shared run lifecycle behavior
- report exact commands, results, and concrete skipped reasons

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