# Augnes

*Continuous perspective for AI-assisted projects.*

Augnes is a local-first continuity engine for AI-assisted projects. It helps a
project carry goals, relevant context, evidence, decisions, uncertainty, and
accepted changes across tasks, tools, and sessions.

ChatGPT, Codex, and other native hosts perform tasks. Augnes preserves and
reviews the project context around that work so that later tasks can begin from
an explicit, source-linked state.

This repository demonstrates the operational Core and a reference operator
interface. It proves the full continuity loop; a simpler user-facing workspace
will be developed on top of this engine.

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

The source checkout requires Node.js 20.9 or newer and npm. On a supported
Linux or macOS development host, the minimal local start is:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes
```

Augnes prepares its application-owned local database, starts the supervised UI
and bridge, waits for both to become ready, and prints the effective loopback UI
URL. No private credentials are required for this startup path.

On fresh local data, choose a folder and confirm it to create the first project.
Normal startup does not seed or reset operator data. For the prepared Build Week
evaluation workspace, use this walkthrough:

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

The prepared walkthrough uses an explicit local workspace, project, operator,
and database binding. The deterministic host uses a zero-model local adapter and
does not require `OPENAI_API_KEY`. Supported flows use deterministic local
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

The repository now supports:

- local project onboarding and Project Home;
- project-scoped deterministic and live Codex/native-host round trips;
- structured, immutable `RunReceipt` records;
- source-linked criterion verification that preserves unresolved status;
- reviewable proposals and explicit `ReviewDecision` records;
- separately authorized `Transition` records and later-context reuse;
- shared Inspector lineage across Project Home and Semantic Workbench;
- bounded automation that stops for review; and
- supervised local runtime, native packages, backup, restore, update, recovery,
  and portable project continuity.

## How GPT-5.6 and Codex were used

GPT-5.6 in ChatGPT was used for architecture analysis, implementation planning,
product decisions, and pull-request review. It helped preserve architectural
and authority boundaries as the project advanced through successive phases.

Codex implemented scoped vertical slices, wrote deterministic and adversarial
tests, ran repository verification, and opened pull requests. The project used
a PR-centered workflow so each major capability could be reviewed and tested
separately before merge.

The human developer selected goals, reviewed results, made product decisions,
and controlled merges. ChatGPT did not directly execute Codex or create commits.

## Reference operator interface

The current UI is a reference operator interface for the continuity engine. It
shows detailed verification, authority, uncertainty, and lineage state so the
Core can be inspected directly.

The planned user-facing layer will present goals, progress, pending decisions,
and next actions more simply. Detailed records will remain available through
Inspector when needed.

## Product direction

Augnes is being completed around one operability-first flow:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run Codex / the native host interactively or through bounded automation
→ RunReceipt
→ source-linked assessment/comparison
→ reviewable semantic proposal
→ user decision
→ authorized Transition
→ later context reuse
→ later outcome feedback
```

The active product commitments are:

- provider-neutral, local-first Core
- Resume / Verify / Decide
- project and workspace identity with isolation
- `TaskContextPacket`, `RunReceipt`, `EpisodeDeltaProposal`, and `ReviewDecision`
- source-linked criterion assessment that preserves `unknown` when support is insufficient
- bounded strategic advantage transfer inside the shared R6 assessment boundary
- candidate-level review before any strategic or semantic change can be authorized
- later `ContextUseReview` outcome feedback for reviewed context reuse
- a bounded Automation Spine using policy, grants, runs, receipts, stop conditions, and user control
- minimal Model Gateway with an OpenAI reference adapter
- adapter-backed Codex round trip for interactive and unattended runs
- Project Home, Semantic Workbench, and shared Inspector
- a bounded Personal Perspective lane that reuses the same review, context-selection, and feedback contracts
- migration, backup, restore, update, and recovery

The active sequence is defined in
[`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md).

## What works today

- `/` and `/projects/[projectId]` provide Project Home for Resume, current
  coordination, attention, automation state, and the next meaningful action.
- `/projects` onboards a local folder, preserves project identity, and reopens
  recent projects without deleting project data.
- `/workbench` remains a small compatibility landing page rather than a second
  review product.
- `/workbench/semantic-review` provides the canonical Semantic Workbench for
  Verify and Decide, including explicit decision and Transition interactions.
- Existing result deep links remain concise result entries into Workbench and
  the exact receipt-focused shared Inspector.
- `/workbench/inspector` is reached through generated exact links and provides
  authenticated, project-scoped, read-only drill-down. It creates no semantic
  record, decision, gate, Transition, packet, feedback, or automation work and
  invokes no model, provider, or external action.
- `/perspective` provides Perspective and lineage views.
- Local SQLite persistence stores durable vNext semantic records and projections.
- Deterministic mock paths allow local development without an OpenAI key.
- Persisted `TaskContextPacket` input reaches deterministic or live native hosts
  without packet copy, and structured results return through one canonical
  `RunReceipt` authority for Project Home, Workbench, and Inspector review.

## Source installation and local operation

The [Judge Quickstart](#judge-quickstart) contains the canonical source install
and start commands. The root dependency graph requires Node.js 20.9 or newer;
the repository requires npm to run its scripts but does not declare a separate
minimum npm version.

The supervised start command resolves application-owned local paths, safely
creates or migrates the database, and supervises both the local UI and MCP
bridge. It automatically selects another bounded loopback port when a preferred
port is occupied. On restart it reconciles provably owned orphan children and
interrupted database preparation; unverifiable local ownership fails closed
without signaling processes or changing data. `npm run dev` remains a
compatibility alias.

From another terminal, the same command surface reports or stops the verified
owned instance:

```bash
npm run augnes -- status
npm run augnes -- stop
npm run augnes -- diagnostics
```

`diagnostics` is an explicit, read-only local surface for resolved data,
configuration, backup, runtime-state, and database paths. Normal start, status,
stop, and health output omit database and backup paths. An absolute
`AUGNES_DB_PATH` remains available as an explicit compatibility override; when
it is absent, Augnes does not adopt `data/augnes.db` from the repository.

`db:migrate` and `demo:seed` remain explicit development commands and are not
part of normal startup. Do not use `db:reset` as a normal start command. It is a
destructive developer operation and must only be used with an absolute
`AUGNES_DB_PATH` that targets an explicitly disposable database.

`OPENAI_API_KEY` is optional. Without it, supported flows use deterministic
local fallbacks.

## Distributable package

Maintainers produce the platform-native Augnes artifact with one command:

```bash
npm run package
```

The command prints the exact artifact and package-root names and writes
`dist/augnes-<version>-<os>-<architecture>-node<abi>[-<libc>].tar.gz`. The
archive contains one matching versioned top-level directory with a production
standalone UI, a compiled bridge, the supervised runtime, and a versioned
integrity manifest. After receiving the artifact, an ordinary Unix user runs:

```bash
tar -xzf <artifact>
cd <package-root>
./augnes
```

Package production and startup are supported on Linux and macOS build hosts.
`Ctrl-C` performs the normal foreground shutdown; the same launcher also
accepts the optional `status`, `stop`, and `diagnostics` actions. Startup creates
or validates the application-owned database, chooses available loopback UI and
bridge ports, and preserves missing provider or host capabilities as lazy,
non-blocking status.

Each artifact is native to the operating system, architecture, Linux C library
where applicable, and Node module ABI recorded in `augnes-package.json`. The
launcher verifies those prerequisites and every packaged file before creating
runtime or data state. The current artifact contract requires Node.js 20.9 or
newer with the recorded native module ABI; it does not claim cross-platform,
cross-libc, or cross-ABI portability, bundled Node, code signing, or a remote
update channel. A Windows package is not currently supported.

## Canonical verification

The supported public verification surface is:

```bash
npm run typecheck
npm run build
npm test
npm run test:integration
npm run test:authority
npm run test:operability
npm run test:e2e
```

## Development policy

- Advance the end-to-end product flow before adding new framework or process layers.
- Build the minimal Automation Spine across R2–R8 instead of postponing automation until after the manual path is fixed.
- Defer advanced hunt heuristics, generic scheduler replication, unrestricted retry, self-modification, and automatic semantic commit—not bounded automation itself.
- Allow Personal Perspective to progress as a parallel bounded lane when it reuses existing Core contracts and does not block the mainline flow.
- Use focused unit, integration, disposable-database, and browser tests during development.
- Do not make long manual operator pilots a normal PR merge gate.
- Move broad real-user usefulness validation to Alpha, after the core R2–R8 flow is feature-complete.
- Keep irreversible external actions and durable semantic changes under explicit user control.
- Implement strategic analysis as an optional bounded profile inside the shared R6
  assessment → proposal → decision → Transition path, not as a separate Arena,
  strategic engine, or multi-agent subsystem.
- Never let assessment, strategic candidates, model agreement, or outcome feedback
  bypass proposal, decision, or Transition gates.
- Do not add new planning-only documents, passive workflow-stage panels, manual copy UI, feature-specific smoke commands, or separate automation/perspective subsystems by default.

## Architecture and roadmap

- [`docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md) — product identity and north star
- [`docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md) — Core and protocol meaning
- [`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) — active implementation order
- [`docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) — development and post-Alpha evaluation
- [`docs/REPOSITORY_REDUCTION_SCOPE.md`](docs/REPOSITORY_REDUCTION_SCOPE.md) — repository retention and deletion policy
- [`AGENTS.md`](AGENTS.md) — Codex implementation rules

Historical plans, dogfood reports, closeout records, and compatibility documents
are not active sequencing authority.
