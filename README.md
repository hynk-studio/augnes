# Augnes

*Continuous perspective for AI-assisted projects.*

Augnes is a local-first continuity engine for AI-assisted projects. It helps a
project carry goals, relevant context, evidence, decisions, uncertainty, and
accepted changes across tasks, tools, and sessions.

ChatGPT, Codex, and other native hosts perform tasks. Augnes preserves and
reviews the project context around that work so that later tasks can begin from
an explicit, source-linked state.

```text
Project context
→ Codex or another native host
→ RunReceipt
→ criterion verification
→ reviewable proposal
→ user decision
→ authorized Transition
→ later project context
```

[Judge Quickstart](#judge-quickstart) · [What works today](#what-works-today) ·
[How GPT-5.6 and Codex were used](#how-gpt-56-and-codex-were-used) ·
[Architecture and roadmap](#architecture-and-roadmap) ·
[Verification](#canonical-verification)

## Judge Quickstart

The source checkout supports the maintained even-numbered Node.js 22 and 24
lines with npm 10 or 11. Exact local Canonical evidence uses Node.js 24.18.0,
recorded in `.node-version`; ordinary compatibility work may use another
supported version but cannot claim a Canonical pass. On a supported Linux or
macOS development host, the minimal local start is:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes
```

Augnes prepares its application-owned local database, starts the supervised UI
and bridge, waits for both to become ready, and prints the effective loopback UI
URL. No private credentials are required for this startup path.

### Fresh-checkout evaluation

Open the printed URL, choose a folder, inspect it, and confirm it to create the
first project. This path demonstrates installation, project onboarding, Project
Home, and supervised local runtime behavior. Normal startup does not seed or
reset operator data, and it does not create the review history needed for the
full continuity walkthrough.

### Prepared Build Week demonstration

The submission video and gallery show this sequence in a separately prepared
evaluation workspace:

1. Open the prepared local project in Project Home.
2. Select **Run deterministic host round trip**.
3. Open the returned `RunReceipt` through **Inspect exact receipt**.
4. Compare execution completion with task outcome; a completed process does not
   automatically establish task success.
5. Open Semantic Workbench to inspect criteria, unresolved uncertainty, and the
   reviewable proposal.
6. Review the candidate, its `ReviewDecision`, and any separately authorized
   `Transition` state.
7. Open Inspector to trace the packet, receipt, sources, decision, and later
   context lineage.

The repository does not currently provide a supported public command that
creates this complete workspace from a clean checkout. A final Build Week
release will include the prepared walkthrough only if it also includes a
reproducible evaluation workspace and instructions. Until then, the three
startup commands above should not be read as a credential-free full continuity
demo.

`OPENAI_API_KEY` remains optional, and supported flows use deterministic local
fallbacks when no API key is present. A locally installed and authenticated
Codex CLI with App Server support is required only for **Start live Codex work**.

See the [full judge guide](docs/submission/openai-build-week/JUDGE_GUIDE.md) for
fresh-data behavior, the optional live path, supported platforms, and known
limitations.

## OpenAI Build Week 2026

An earlier version of Augnes placed third in the OpenAI Discord community's
“Build a System, Not a Prompt” developer challenge. During Build Week, the
project was expanded into an operable local-first continuity system.

This submission focuses on the continuity Core and its reference operator
interface. The current UI exposes the engine's behavior for evaluation; it does
not claim to be the finished end-user product.

## Post-Build Week product direction

The post-Build Week direction preserves the operational Core and reprojects it
through a simpler product topology. **Blank State** is the human entry and
resumption surface. **AI Workplane** is the complex AI/operator layer for
delegation, verification, reconciliation, automation, semantic processing, and
result preparation. **GuideBrief** is the restored non-authoritative guidance
layer shared across Browser, ChatGPT, Codex, Blank State, and AI Workplane.
**Inspector** remains contextual, optional, exact read-only detail rather than
a normal peer destination.

The existing engine is being preserved and reprojected, not discarded. C2
renders `/` as the canonical Blank State and absorbs project choice,
resumption, and the former user-facing Project Home composition into one shared
surface. `/projects` and `/projects/[projectId]` remain compatible management and
viewed-project routes into that surface. The internal Project Home projection
continues to supply read-only source data; it is not a separate product surface.
Project transfer and recovery retain their compatible routes and exact engines,
and C7 presents them as contextual management and safety work.
The exact Inspector reader remains contextual **Exact details**, not a peer
product.
The target topology is documented in the
[post-Build Week product UX correction charter](docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md);
C0 established the product authority and C1 reduced the shared shell to
**Blank State** and **AI Workplane** as its only primary destinations. Existing
project selection remains in Blank State; transfer/import and ordinary
backups/recovery are available under its closed **Manage and protect**
disclosure. The runtime proxy still forces `/recovery` when recovery mode is
active. C0–C7 are merged. GuideBrief v0.2 is the
deterministic current-project interpretation shared by
Blank State, a compact AI Workplane rail, the existing
`augnes_get_guide_brief` MCP tool, `codex:read-brief`, and new native Codex task
starts. GuideBrief remains a read-only View and is delivered separately from the
exact `TaskContextPacket`; legacy v0.1 fixtures and Human Surface consumers are
historical or compatibility-only. C4 reprojects the compatible
`/workbench/semantic-review` route as the human-facing AI Workplane for current
work, results, suggested changes, decisions, and separately confirmed project
changes. Exact verification and source history remain available through
advanced or contextual detail. C5 added one bounded delegated
Codex timeline over the existing runner ledger, moves live start/approval/
cancel/resume ownership into AI Workplane, and gives Blank State a compact
status and return path. Leaving the page does not itself cancel admitted local
work; a lost local-runtime owner requires explicit resume of the same exact
run/thread/turn binding. Trusted result status requires persisted receipt/result
binding. C6 keeps `/workbench/inspector` directly addressable
while presenting only concrete target context, target-relevant exact sections,
closed additional records, and a deterministic return to the related result,
suggested change, delegated work, Blank State, or AI Workplane. Normal C4/C5
flows load no Inspector data. C7 removes the shared-shell Project
tools menu, keeps `/portability` and `/recovery` compatible, and preserves all
package, backup, restore, update, reconciliation, and recovery-mode semantics.
C8–C9 remain pending.

The repository now supports:

- a shared Blank State for local project choice, resumption, recovery, and
  viewed-project deep links;
- project-scoped deterministic and live Codex/native-host round trips;
- structured, immutable `RunReceipt` records;
- source-linked criterion verification that preserves unresolved status;

## Canonical verification

The complete Canonical verification surface runs locally. GitHub is used for
source control, pull requests, review, and history; this repository has no
active GitHub Actions workflow and does not use another hosted CI provider.

Use the repository-owned executor:

```bash
npm run verify:local:quick
npm run verify:local:changed -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:full -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
```

`quick` is bounded developer feedback. It uses the installed dependency trees,
runs typecheck plus the local executor, receipt, PR-evidence, transport, and
repository lifecycle contracts, and may run on a dirty tree or noncanonical
Node version. Its receipt is always non-deciding and non-transferable.

`changed` requires a clean worktree whose current `HEAD` equals the exact
requested head. It invokes the existing exact-SHA planner. A
`documentation-only` result runs only the documentation validator, without
installing dependencies or executing runtime suites. A `full-canonical` result
runs the complete surface. Planner ambiguity fails closed to the full surface;
malformed or missing commits and an identical base/head are refused.

`full` also requires a clean exact head and runs the exact planner for context,
then deliberately expands to the complete surface:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:authority`
- `npm run test:integration`
- `npm run test:operability`
- `npm run test:e2e:core`
- `npm run test:e2e:continuity`

Before a full surface, root and nested dependencies are replaced by sequential
`npm ci --no-audit --no-fund` installations from their lockfiles. npm download
cache reuse is allowed, but cached content and pre-existing `node_modules` are
not deciding authority. The executor removes only the bounded ignored `.next`
build directory before a full run and again during final cleanup. It never
stashes, resets, cleans, or discards source changes.

`next-env.d.ts` is generated and ignored rather than exact-head source.
`npm run typecheck` explicitly runs `next typegen` before `tsc --noEmit`;
development and production generation may reference route types under
`.next/dev/types` and `.next/types` respectively, and `tsconfig.json` includes
both. This generated-file ownership does not mask other changes: any unrelated
tracked mutation still fails the post-execution clean-tree check. The package
compatibility guard likewise compares dependency graph declarations and every
non-root resolved package entry, while excluding unrelated root package policy
metadata such as `engines` from dependency-graph identity.

All outer phases are sequential on the shared Mac. This includes dependency,
build, package, runtime reconciliation, supervisor, operability, and browser
ownership. Core and continuity E2E never overlap. The existing integration
runner alone retains its proven maximum-two isolated groups.

Every invocation writes a public-safe JSON receipt and bounded local phase logs
under `.augnes-local-verification/`. Receipts and logs are gitignored and
retained locally because they describe a machine execution, may become stale,
and are not source. Validate a deciding receipt against the current repository:

```bash
npm run verify:local:receipt -- \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

The receipt binds the exact base/head, origin, branch/detached state, clean
state, Node/npm and host policy, pseudonymous local machine identifier,
lockfile hashes, executor source fingerprint, selected plan, phase results,
timeouts, cleanup, and remaining owned-process count. Its deterministic
SHA-256 fingerprint provides content integrity and local provenance only. It is
one execution on one shared Mac, not independent cryptographic attestation,
hosted reproduction, or an external status check. A changed head, dirty
worktree, lockfile or executor drift, plan drift, environment drift, missing
phase, timeout, failure, or incomplete cleanup invalidates deciding use.

An explicitly authorized user may publish a bounded projection of one current
deciding receipt to the current task Draft PR. Publication is a separate,
foreground action and never follows verification automatically:

```bash
npm run verify:local:evidence:prepare -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
npm run verify:local:evidence:publish -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json \
  --confirm-publish
npm run verify:local:evidence:verify -- --pr <positive-pr-number>
npm run verify:local:evidence:verify -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

`prepare` reads the live PR identity but performs no GitHub write. `publish`
hard-binds the authorized repository, current clean pushed branch, exact live
base/head, and existing deciding receipt, then owns one bounded marker comment.
An identical publication is an idempotent no-write result. Replacing different
evidence requires explicit authority naming the exact prior fingerprint.
Remote-only verification checks the current public projection; local-linked
verification also compares every projected field to the current local receipt.
Full receipts, raw logs, preparation files, and publication records stay local
and ignored.

The comment and envelope remain mutable local evidence. Their SHA-256
fingerprints prove content integrity only; they are not signatures, independent
attestations, hosted reproductions, GitHub-authenticated execution, status
checks, check runs, or deployments. See the
[Local Canonical PR evidence policy](.github/LOCAL_CANONICAL_PR_EVIDENCE.md).

Linux, Windows, Node 22, and other supported environments remain compatibility
surfaces; they do not substitute for the current macOS-arm64 Node 24.18.0
Canonical policy. The executor and documentation use Augnes product identity
and ordinary Git history so this temporary lab branch remains transferable;
the hard repository/root publication authority must be reviewed during any
separately authorized transfer. See the
[local Canonical verification policy](.github/LOCAL_CANONICAL_VERIFICATION.md).
