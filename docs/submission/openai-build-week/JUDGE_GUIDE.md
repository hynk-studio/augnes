# OpenAI Build Week 2026 Judge Guide

This guide covers the public, local evaluation path for Augnes. The current UI
is a reference operator interface for the continuity engine, so it exposes more
verification, authority, uncertainty, and lineage detail than the planned
user-facing workspace.

## Requirements

- Node.js 20.9 or newer
- npm (the repository does not declare a separate minimum npm version)
- Linux or macOS for the currently supported source and package path
- no private credentials for fresh-checkout startup

The distributable artifact is native to its operating system, architecture,
Linux C library where applicable, and Node module ABI. Windows packaging is not
currently supported.

## A. Fresh-checkout evaluation

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes
```

The supervisor prepares the application-owned local database, starts the UI and
bridge, waits for both processes to become ready, and prints the effective
loopback UI URL. If a preferred port is occupied, it selects another bounded
loopback port.

Normal startup does not seed or reset operator data. With fresh local data,
open the printed URL, choose a local folder, inspect it, and confirm it as the
active project. This path covers installation, onboarding, Project Home, and
supervised runtime behavior. It does not create the packet, receipt, proposal,
decision, Transition, and later-context history described below.

No supported public command currently creates the complete Build Week
evaluation workspace. The repository's canonical fixture builders validate the
full flow with disposable data, but they are internal test harnesses rather than
public setup commands.

## B. Prepared Build Week demonstration

The submission video and gallery use a separately prepared local workspace,
project, operator, and database binding to show this sequence:

1. Open the prepared project in Project Home.
2. Select **Run deterministic host round trip**. The zero-model local adapter
   receives the selected `TaskContextPacket` and returns a structured result.
3. Select **Inspect exact receipt** to open the immutable `RunReceipt`.
4. Compare the receipt's execution status with its task outcome and checks.
   Process completion alone does not establish task success.
5. Open Semantic Workbench. Inspect source-linked criteria, any `unknown` or
   unresolved result, and the reviewable `EpisodeDeltaProposal` candidate.
6. Review the `ReviewDecision` separately from Transition eligibility and any
   authorized `Transition` application.
7. Open Inspector from the result or review surface. Trace the exact packet,
   receipt, source, decision, Transition, and later-context lineage.

This sequence is not currently reproducible from the three source-start commands
on a clean checkout. A final Build Week release will include it as a judge path
only if that release also includes a reproducible evaluation workspace and
instructions. Until then, Augnes does not claim a credential-free full
deterministic demo.

## Optional OpenAI and live Codex paths

`OPENAI_API_KEY` is optional. Supported flows use deterministic local fallbacks
when it is absent. Provider-assisted enrichment is optional and does not disable
criterion assessment, proposal review, or Core transitions when unavailable.

**Start live Codex work** is a separate optional path. It requires a locally
installed and authenticated Codex CLI that supports `codex app-server --stdio`.
Codex manages that native-host session. Fresh-checkout startup and supported
deterministic local fallbacks do not require Codex installation or an OpenAI API
key.

## Runtime controls

From another terminal:

```bash
npm run augnes -- status
npm run augnes -- diagnostics
npm run augnes -- stop
```

`diagnostics` is read-only. Normal start, status, stop, and health output omit
database and backup paths.

## Packaged installation

Maintainers build the native artifact with:

```bash
npm run package
```

An artifact recipient runs:

```bash
tar -xzf <artifact>
cd <package-root>
./augnes
```

The launcher verifies the recorded platform and runtime prerequisites plus the
integrity of every packaged file before creating runtime or data state.

## Public verification

```bash
npm run typecheck
npm run build
npm test
npm run test:integration
npm run test:authority
npm run test:operability
npm run test:e2e
```

These are the canonical public test surfaces. The repository also uses focused
tests while developing individual slices.

## Current product boundary

- The repository demonstrates the operational continuity Core and a reference
  operator interface, not a finished consumer application.
- Detailed records remain visible so judges can inspect verification, authority,
  and lineage directly.
- The planned user-facing layer will emphasize goals, progress, pending
  decisions, and next actions while retaining Inspector for detailed records.
- Augnes is local-first and single-operator today. It does not claim a hosted
  multi-user service, a Windows package, bundled Node.js, code signing, or a
  remote update channel.
- Missing model or native-host capability remains an explicit, non-blocking
  status for supported deterministic Core flows.
