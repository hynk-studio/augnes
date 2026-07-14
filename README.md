# Augnes

Augnes is a local-first, operator-led temporal project substrate for AI-assisted work.
Native hosts such as ChatGPT and Codex execute tasks; Augnes preserves project context,
lineage, reviewed decisions, and durable state across those tasks.

## Product direction

Augnes is being completed around one operability-first flow:

```text
Start Augnes
→ select a project
→ start or accept a task
→ compile project context
→ run Codex / the native host interactively or through bounded automation
→ return a structured result
→ review the result
→ approve any durable semantic change
→ reuse the changed context in later work
```

The active product commitments are:

- provider-neutral, local-first Core
- Resume / Verify / Decide
- project and workspace identity with isolation
- `TaskContextPacket`, `RunReceipt`, `EpisodeDeltaProposal`, and `ReviewDecision`
- a bounded Automation Spine using policy, grants, runs, receipts, stop conditions, and user control
- minimal Model Gateway with an OpenAI reference adapter
- adapter-backed Codex round trip for interactive and unattended runs
- Project Home, Semantic Workbench, and shared Inspector
- a bounded Personal Perspective lane that reuses the same review, context-selection, and feedback contracts
- migration, backup, restore, update, and recovery

The active sequence is defined in
[`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md).

## What works today

- `/` provides the current human-facing entry surface.
- `/workbench` provides the current operator/AI work surface.
- `/workbench/semantic-review` provides the current semantic review path.
- `/perspective` provides Perspective and lineage views.
- local SQLite persistence stores durable vNext semantic records and projections.
- deterministic mock paths allow local development without an OpenAI key.
- current MCP, handoff-copy, and manual result-paste flows remain compatibility paths until their adapter-backed replacements land.

## Current development start

After the current data bootstrap, one canonical command starts and supervises
both the local UI and MCP bridge:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run db:migrate
npm run demo:seed
npm run augnes
```

The command waits for both processes to become ready and prints the effective
loopback UI URL. It automatically selects another bounded loopback port when a
preferred port is occupied. `npm run dev` remains a compatibility alias.

From another terminal, the same command surface reports or stops the verified
owned instance:

```bash
npm run augnes -- status
npm run augnes -- stop
```

Platform-owned data paths and safe first-run database bootstrap remain R2
follow-up work. Until then, the existing database path and migration behavior
remain compatible.

Do not use `db:reset` as a normal start command. It is a destructive developer operation and must only be used against an explicitly disposable database.

`OPENAI_API_KEY` is optional. Without it, supported flows use deterministic local fallbacks.

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
- Do not add new planning-only documents, passive workflow-stage panels, manual copy UI, feature-specific smoke commands, or separate automation/perspective subsystems by default.

## Active documents

- [`docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md) — product identity and north star
- [`docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md) — Core and protocol meaning
- [`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) — active implementation order
- [`docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) — development and post-Alpha evaluation
- [`docs/REPOSITORY_REDUCTION_SCOPE.md`](docs/REPOSITORY_REDUCTION_SCOPE.md) — repository retention and deletion policy
- [`AGENTS.md`](AGENTS.md) — Codex implementation rules

Historical plans, dogfood reports, closeout records, and compatibility documents are not active sequencing authority.
