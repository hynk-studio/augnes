# Augnes

*Continuous perspective for long-horizon, AI-assisted work.*

Augnes maintains the state, temporal lineage, evidence, perspectives,
unresolved judgments, and next meaningful actions of long-horizon work, and
projects the same product meaning into the host-native interfaces where the
user is already working.

The product invariant is the continuity of meaning, not the replication of one
interface. The product is continuous work, not a collection of surfaces.

**Resume / Verify / Decide.**

[Quickstart](#quickstart) · [What works today](#what-works-today) ·
[Product direction](#product-direction) ·
[Authority](#repository-authority) ·
[Verification](#canonical-verification)

## Quickstart

The source checkout supports maintained even-numbered Node.js 22 and 24 lines
with npm 10 or 11. Exact Local Canonical verification uses Node.js 24.18.0 and
npm 11.16.0.

On a supported macOS development host, install the exact checkout-bound local
Companion service once:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes:service:install
```

This explicit action installs a user-session LaunchAgent for this physical
checkout, selects and pins one Node 24 binary, and starts the existing
supervised UI/Core and bridge. It stores no secret in the service definition,
survives the installing terminal, starts at login, and recovers unexpected
runtime failure. It grants no repository execution, managed-run Resume,
provider, semantic, external-effect, publication, or merge authority. Stop or
remove it reversibly with `npm run augnes:service:stop` or
`npm run augnes:service:uninstall`. Linux and Windows service installation are
unsupported; their source development flow remains foreground-only.

Normal startup prepares the application-owned local database and does not
reset or seed operator data. `npm run augnes:service:status` returns bounded
lifecycle state without exposing service paths, Node paths, PIDs, ports,
tokens, manifests, or database paths.

Open the URL and connect a local project. The primary path uses **Choose a
folder**. If the native picker is unavailable, remains invisible, is cancelled,
or does not return, **Enter the folder path instead** accepts one exact absolute
path from the computer running Augnes. Both paths converge on the same review
and explicit **Connect project** action. The folder is not uploaded, and
connecting it does not run Codex or change project files. This fresh-checkout
path demonstrates installation, project onboarding, Blank State, and supervised
local runtime behavior. It does not fabricate the review history needed for a
complete continuity walkthrough.

To define or revise work for the connected project from a source checkout,
open another terminal in this repository and run:

```bash
npm run augnes -- access
```

This normally stops the current supervised runtime, binds the existing local
review session owner to the exact current project, restarts one supervised
runtime, and prints one expiring token. Paste that token into the visible
Browser unlock form. The token establishes local project review access only;
it grants no execution, semantic, external-effect, or merge authority. Do not
copy it into project files, prompts, issue comments, or verification evidence.

If an existing project's saved folder later becomes unavailable, **Locate
folder** opens the same verified folder-selection experience for that exact
project. **Choose a folder** and **Enter the folder path instead** converge on
one recovery review. **Use this folder** keeps the project name and stored
history, then uses the existing Browser-confirmed project root-rebind authority
to replace the local root and physical baseline atomically. Selecting the exact
current folder or one of its physical aliases only opens the existing project
and does not rewrite its saved root. Recovery does not run Codex or change
project files.

For source-blind local Codex resumption, install the repo-local
`plugins/augnes-operator` plugin once with
`npm run augnes:plugin:install`. Ask “Resume this
repository with Augnes.” Plugin version 0.4.0 first checks lifecycle status,
starts an already-installed exact service at most once when offered, and only
then performs one read-only canonical Resume through a verified Companion. It
never installs the service from MCP. The plugin verifies the supervised bridge and
calls the strict UI/Core route through a private generation-bound channel; no
fixed `8787` configuration, Browser open page, mock, seed, docs, or legacy brief
fallback is required.

`OPENAI_API_KEY` is optional. Supported paths retain deterministic local
fallbacks without it. A locally installed and authenticated Codex CLI with App
Server support is required only for live Codex work.

For the prepared historical Build Week evaluation path and its limitations, see
the [judge guide](docs/submission/openai-build-week/JUDGE_GUIDE.md).

## What works today

Repository-scoped Codex continuity, trusted local execution preparation, and
one attachment-backed managed run are
documented in [Repository execution attachment v0.1](./docs/REPOSITORY_EXECUTION_ATTACHMENT_V0_1.md).
Preparation binds canonical project, physical root, current work, and bounded
Git worktree content state without starting a run or depending on Browser
active selection. Legacy adoption, intentional rebind, and revocation use one
same-origin Browser confirmation backed by a separate HttpOnly decision session
and a request-bound one-time nonce; forged request headers and MCP literals are
insufficient. Ordinary exact preparation remains silent. Starting consumes one
exact attachment only after one Browser confirmation, then permits bounded
reversible local repository work within its deterministic envelope. Later
operation approval and semantic result review remain separate. The
managed-delegation product boundary covers verified local macOS and the
verified Windows 11 x64 source-runtime lane on local fixed NTFS. Linux has no
separate product filesystem/runtime proof. CDX2B3A source-runtime attachment
admission has exact Windows 10 Pro 22H2 build 19045.6456 proof at checkpoint
`374a582b766a10616667633eb911d3df2d49b85e` and exact Windows 11 Home 25H2
build 26200.8875 proof at pre-integration checkpoint
`567c9bbbad5d35e6803ad740adfac1b881983912`, both x64 local fixed NTFS. A later
integrated head is not Windows 10 exact-head verified without a fresh run
there, so Windows 10 managed Start and Resume remain unavailable. The existing
package builder still refuses Windows, so packaged Windows admission, Start,
and Resume remain unavailable. CDX2B3B enables Browser-confirmed Start and
explicit same-run Resume only through the existing attachment, run, checkpoint,
envelope, cancellation, result, and semantic-review owners; it adds no Windows
runner and no automatic Resume.

Cancellation remains available from the immutable consumed attachment/run
binding even when current packet, work, root, baseline, worktree, or Browser
selection has drifted. Exact Start replay reports the persisted run's actual
queued, active, approval, disconnected, blocked, or terminal state and never
starts another worker. Browser, Companion, provider, database, runtime, and OS
credentials are not injected into the worker, and outside-root material stays
blocked. Files already inside the exact repository are nevertheless within the
repository read scope; Augnes does not claim content-based secret unreadability
for those files.

The checked-in runtime currently provides:

- local workspace/project onboarding and project isolation;
- supervised startup, persistence, migration, backup, restore, recovery, and
  run reconciliation;
- a two-zone product shell with Blank State and AI Workplane;
- project-scoped deterministic and live native-host/Codex work;
- structured receipts, source-linked criterion assessment, reviewable
  proposals, explicit decisions, authorized Transitions, later context, and
  bounded feedback;
- GuideBrief v0.2 projections across current Browser, ChatGPT/MCP, and Codex
  paths;
- contextual, read-only Exact details;
- bounded interactive and policy-triggered execution;
- compatible portability and recovery paths;
- limited project-scoped Personal Perspective controls and bounded research
  capabilities where runtime/tests prove them.

Execution completion is not verified success. Recommendation is not decision.
Candidate is not accepted state. A decision is not an applied Transition.

Exact current status and sequencing belong to the
[current implementation roadmap](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md).
Current code remains the source of truth for exact routes, schemas, commands,
records, and behavior.

## Product direction

Augnes preserves continuous work across Browser, ChatGPT Apps, Codex, and
future hosts without forcing those hosts to look alike.

- **Blank State** focuses human attention and resumption.
- **AI Workplane** coordinates delegation, progress, verification,
  reconciliation, review preparation, bounded automation, later context, and
  outcome feedback.
- **Timeline** explains meaningful sequence.
- **Relationship exploration** explains a bounded connection, not an exhaustive
  graph or permanent “constellation” product.
- **GuideBrief** explains present meaning and remains contextual,
  source-anchored, conversational, and non-authoritative.
- **Inspector / Exact details** exposes optional, dense, neutral, read-only
  records.

Internal research complexity may increase; default user complexity must not
increase with it.

A mature attention queue, timeline-first work detail, bounded relationship
exploration, fully conversational GuideBrief, and the fuller long-horizon
research substrate remain product directions unless current runtime evidence
proves a bounded implementation. Their documentation does not claim they are
complete.

The durable doctrine is
[Augnes Product and Continuity Doctrine](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md).
Core records and protocol semantics are defined separately in
[Architecture and Protocol](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md).

## Repository authority

The [authority map](docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md) assigns one
active owner per durable topic:

- product and continuity doctrine — `01`;
- Core and protocol semantics — `02`;
- implementation status and sequence — `03`;
- evaluation and maturity — `04`;
- temporary C0–C9 correction program — `07`;
- product entry — this README;
- repository operating rules — `AGENTS.md`.

Implementation contracts, research, operator manuals, compatibility material,
and historical records do not silently override those owners.

C0–C8 are merged. RR0 was completed in
[issue #69](https://github.com/hynk-studio/augnes-perspective-lab/issues/69)
and [PR #70](https://github.com/hynk-studio/augnes-perspective-lab/pull/70).
RR1 is documentation authority reconciliation defined by
[issue #71](https://github.com/hynk-studio/augnes-perspective-lab/issues/71).
C9 remains pending separate explicit authorization.

Attachment-backed managed runs retain one private exact safe-operation
checkpoint history and expose one bounded read-only resume-eligibility status
through repository continuity, Browser, Apps MCP, and the Augnes Operator.
This distinguishes the immutable consumed start attachment from the latest
confirmed post-operation repository state. Exact `resume_ready` material may
now create one expiring Browser-only Resume decision and one atomic same-run,
same-attachment, same-thread attempt. The provider path uses `thread/resume`,
not `thread/start`; ambiguous effects require reconciliation and pending
operation approval remains separate. Resume completion does not create a
ReviewDecision, Transition, accepted state, or work closure, and Companion
startup never resumes automatically.

## Canonical verification

GitHub is used for source control, pull requests, review, and history. This
repository has no active GitHub Actions workflow; deciding verification is
repository-owned Local Canonical execution.

Use:

```bash
npm run verify:local:quick
npm run verify:local:changed -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:full -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:receipt -- \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

`quick` is non-deciding developer feedback. `changed` runs the exact-SHA
planner-selected lane. `full` deliberately runs the complete surface. Deciding
verification requires the exact clean head, repository-required Node/npm
versions, planner-selected scope, successful cleanup, and a validated local
receipt.

The complete surface consists of:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:authority`
- `npm run test:integration`
- `npm run test:operability`
- `npm run test:e2e:project-experience`
- `npm run test:e2e:operator-execution`
- `npm run test:e2e:continuity`
- `npm run test:e2e:golden`
- `npm run test:e2e`

Receipts and logs remain ignored local artifacts. Their fingerprints establish
content integrity and local provenance only; they are not hosted reproduction,
independent attestation, or an external status. Evidence publication is a
separate explicit action and never follows verification automatically.

The explicit evidence commands are:

```bash
npm run verify:local:evidence:prepare -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
npm run verify:local:evidence:publish -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json \
  --confirm-publish
npm run verify:local:evidence:verify -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

`prepare` is read-only. `publish` is forbidden without separate explicit
authorization for the exact current Draft PR and receipt.

See:

- [Local Canonical verification policy](.github/LOCAL_CANONICAL_VERIFICATION.md)
- [Local Canonical PR evidence policy](.github/LOCAL_CANONICAL_PR_EVIDENCE.md)
- [Evaluation and maturity](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)

## Historical note

An earlier Augnes version placed third in the OpenAI Discord community’s “Build
a System, Not a Prompt” developer challenge. Build Week expanded the project
into the operational local-first continuity reference implementation preserved
in this repository. Submission material remains historical evaluation context,
not current product authority.
