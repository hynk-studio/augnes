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

The existing engine is being preserved and reprojected, not discarded. C2 in
this change renders `/` as the canonical Blank State and absorbs project choice,
resumption, and the former user-facing Project Home composition into one shared
surface. `/projects` and `/projects/[projectId]` remain compatible management and
viewed-project routes into that surface. The internal Project Home projection
continues to supply read-only source data; it is not a separate product surface.
Semantic Workbench, Shared Inspector, Portability, and Recovery remain current
reference operator surfaces until their assigned correction work changes them.
The target topology is documented in the
[post-Build Week product UX correction charter](docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md);
C0 established the product authority and C1 reduced the shared shell to
**Blank State** and **AI Workplane** as its only primary destinations. Existing
project selection, transfer, and recovery routes remain available through
secondary **Project tools**. C2 becomes complete only when this PR is reviewed
and merged. GuideBrief active-path restoration remains pending C3; C4–C9 also
remain pending.

The repository now supports:

- a shared Blank State for local project choice, resumption, recovery, and
  viewed-project deep links;
- project-scoped deterministic and live Codex/native-host round trips;
- structured, immutable `RunReceipt` records;
- source-linked criterion verification that preserves unresolved status;
