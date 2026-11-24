---
name: augnes-codex
description: Use when the user explicitly asks to use, resume, continue, set up, diagnose, or reuse Augnes context or memory in Codex.
---

# Augnes Codex

## Purpose

Route an explicit Augnes request to the current owner without priming ordinary
source-first repository work.

This skill is for requests such as:

- `Resume this repository with Augnes`
- `What was I working on here?`
- `Continue from the current Augnes context`
- `Use Augnes memory for this task`
- `Review this PR with Augnes context`
- `Set up Augnes in Codex`
- `Augnes memory 보고 시작해`
- `아그네스 컨텍스트로 계속해줘`

A normal implementation, audit, review, investigation, script, or Codex prompt
does not imply continuity or memory reuse.

## Current continuity and resumption

For a named Web project or shared Web work, open the project's authenticated
Web entry. A recipient can discover the work in **Shared with you** and use
its granted role. A returning owner can read the exact report in work history.
This Web step works with the local Companion stopped. To update a registered
local task afterward, resume that task separately. The Augnes source checkout
describes the handoff in `docs/WEB_EXPORT_NATIVE_HANDOFF.md`, section
**Continue local work from a successor report**.

For a request to resume, recover, or inspect a registered local project:

1. Use the `augnes-live-repository-continuity` owner from the reviewed
   `augnes-operator` plugin when available.
2. Resolve the Augnes application/service checkout separately from the intended
   project's registered local root. Pass the application checkout to
   `augnes_companion_lifecycle_status`; use the project root for Resume and work
   tools. They may differ, and a project may be an ordinary task folder.
3. If one installed stopped service is startable, call
   `augnes_start_companion_service` once and require live verification.
4. Call `augnes_resume_repository` once with the intended project root. Do not
   substitute the application checkout, loop, or reconstruct missing
   continuity from docs, Git, GuideBrief, Work Brief, or Perspective memory.
5. Preserve unavailable, ambiguous, partial, or unsupported results exactly.

When the packaged local runtime is already running, the explicit CLI read
remains available:

```bash
npm run codex:current-continuity
```

Run it from the application checkout. It reads the runtime's currently selected
project, accepts no project-root argument, and is not the root-bound Resume
above. Confirm the intended selection first. It defaults to
`http://localhost:3000`; use `AUGNES_API_BASE_URL` for a different verified local
runtime address. It is runtime-only and has no repository, documentation,
GuideBrief, Work Brief, or memory fallback.

## Explicit memory or reuse

Only when the user explicitly asks for Augnes memory, context, or reuse, run the
bounded manual intake:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

Treat the result as optional context, not source truth, approval, authority, or
permission to widen the task. Preserve selected memory IDs, `why_selected`,
`reuse_boundary`, warnings, and no-match status when present.

The repository does not register a default `UserPromptSubmit` memory hook.
Ordinary source-first work therefore receives no hidden Perspective-memory
brief from repository hook configuration.

## Optional user-level explicit-reuse hook

The legacy user-level hook commands remain only for operators who explicitly
want hook-assisted reuse prompts or need migration/rollback:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
npm run codex:install-augnes-reuse-hook -- --yes
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

Real writes require explicit user authorization. Installation preserves
unrelated user hooks and handles only explicit memory/reuse intent; generic
development words do not trigger it. Re-running install updates an older Augnes
entry and copied script. Uninstall removes only the recognized Augnes entry and
installer-owned files. `/hooks` review and trust remain manual.

## Setup

To open shared Web work, sign in through its Web entry and use the current
grant. This works on a Mac with no local Augnes installation. The public
workflow-cost calculator also runs without installing Augnes.

For local Operator setup on macOS, use the reviewed Operator and Companion.
Run the applicable command from the Augnes application checkout:

```bash
npm run augnes:plugin:install
npm run augnes:service:status
```

The install command changes the selected Codex profile; status only inspects an
existing service. The packaged Companion lifecycle is macOS-only and needs the
supported Node 24 runtime. If no reviewed Operator is installed, follow the
public setup route before attempting its tools. A missing service needs the
separate explicit service-install action; copying this routing skill does not
install an Operator, a Companion, or a registered project. Read the source
checkout's `docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md`, section **Public setup and
first continuation**, for the supported sequence and remaining gaps.

An explicit request to resume or continue a registered local project permits
one start of an already-installed service when lifecycle status identifies one
exact, startable match. Verify it is live before Resume. Standalone starts,
installation, stop and uninstall require their own explicit request. Checking
service status is read-only. Answer source questions without starting the
runtime or changing user-level hooks.

## Boundaries

- Independent source-first work does not require continuity or memory priming.
- Context is not product/Core truth or semantic authority.
- Never fabricate continuity, memory matches, work IDs, evidence, receipts, or
  service state.
- Do not add provider/model calls, persistence, MCP behavior, GitHub mutation,
  proof/evidence writes, or state commit/reject authority unless separately
  scoped.
- Do not merge, mark Ready, enable auto-merge, publish, release, or deploy.

## Closeout

Report which owner was used, whether continuity or memory intake actually ran,
its exact result or skipped reason, changed files, verification, and remaining
setup or trust friction.
