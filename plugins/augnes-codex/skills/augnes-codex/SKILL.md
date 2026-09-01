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

For explicit resume, continue, recovery, or current-state intent:

1. Use the `augnes-live-repository-continuity` owner from the reviewed
   `augnes-operator` plugin when available.
2. Pass the exact physical repository root to
   `augnes_companion_lifecycle_status`.
3. If one installed stopped service is startable, call
   `augnes_start_companion_service` once and require live verification.
4. Call `augnes_resume_repository` once. Do not loop or reconstruct missing
   continuity from docs, Git, GuideBrief, Work Brief, or Perspective memory.
5. Preserve unavailable, ambiguous, partial, or unsupported results exactly.

When the packaged local runtime is already running, the explicit CLI read
remains available:

```bash
npm run codex:current-continuity
```

It is runtime-only and has no repository, documentation, GuideBrief, Work Brief,
or memory fallback.

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

For general setup, prefer the current reviewed operator and Companion owners:

```bash
npm run augnes:plugin:install
npm run augnes:service:status
```

Service install, start, stop, or uninstall requires the user's exact request.
Do not start runtime, install a service, or mutate user-level hook state merely
because the user asked a source question.

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
