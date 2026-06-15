---
name: augnes-codex
description: Augnes install, Augnes setup, Augnes use, Augnes memory, Augnes reuse, Augnes context, Use Augnes, Set up Augnes, Install Augnes, Enable Augnes reuse, Start with Augnes memory, Start from Augnes memories, Use Augnes memory, Use Augnes context, Review this PR with Augnes context, Work with Augnes memory, Start this task with Augnes, Augnes 설치, Augnes 쓰자, Augnes 기억, Augnes 컨텍스트, Augnes 보고 시작, 아그네스 설치, 아그네스 쓰자 - use when the user asks to install, enable, use, diagnose, or start work with Augnes memory, reuse, or context in Codex.
---

# Augnes Codex Skill v0.1

## Purpose

Use this skill when the user asks Codex to install, enable, use, diagnose, or
start work with Augnes memory, reuse, or context.

Common trigger phrases include:

- `Use Augnes`
- `Use Augnes for this task`
- `Set up Augnes`
- `Set up Augnes in Codex`
- `Install Augnes`
- `Enable Augnes reuse`
- `Start with Augnes memory`
- `Start from Augnes memories`
- `Use Augnes memory`
- `Use Augnes context`
- `Use Augnes context before editing`
- `Review this PR with Augnes context`
- `Work with Augnes memory`
- `Start this task with Augnes`
- `Codex야 Augnes 설치해줘`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes reuse 켜줘`
- `Augnes context 붙여서 작업해줘`
- `Augnes memory 보고 이 PR 리뷰해줘`
- `Augnes reuse context로 이 작업 시작해`
- `아그네스 설치해줘`
- `아그네스 쓰자`
- `Augnes 기억`
- `Augnes 컨텍스트`
- `Augnes 보고 시작`

This packaged skill is a user-facing onboarding layer over the existing Augnes
Codex hook installer and Perspective Memory Reuse Intake. It does not replace
the existing hook, installer, or intake command.

## Default Constraints And User-Liftable Limits

At the start of Augnes use, briefly disclose which limits are Augnes defaults
that the user can lift by explicit user scope, and which limits are
non-liftable Codex/platform constraints.

Default constraints that are intentionally kept but user-liftable:

- dry-run-first installer behavior
- real install requires explicit `--yes` or equivalent explicit user
  authorization
- no real `~/.codex` write unless explicitly authorized
- real ~/.codex write remains blocked unless explicitly authorized
- memory brief is read-only/context-only by default
- no automatic memory item creation by default
- no storage/persistence/provider/model/OpenAI config/MCP/Codex SDK/GitHub
  mutation unless explicitly scoped
- no plugin-bundled hook implementation by default

Non-liftable Codex/platform constraints:

- `/hooks review/trust remains manual`
- plugin install does not prove hook trust
- plugin install does not prove real hook loading
- static smoke cannot prove real hook loading or trust
- Codex command approvals and safety behavior remain in force

Unlock protocol:

- If the user explicitly asks to lift a user-liftable default, Codex may
  proceed within that explicit user scope.
- For real hook install, Codex may use:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

  only when the user explicitly asks for real install, asks to skip dry-run, or
  allows real `~/.codex` writes.
- If the user asks for storage/persistence/provider/model/OpenAI config/MCP/
  Codex SDK/GitHub mutation work, Codex may include it only as an explicitly
  scoped implementation PR, not as hidden setup.
- If the user asks for automatic memory item creation, Codex may only use
  existing repo-supported commands if present; otherwise propose or implement a
  scoped PR for that feature.
- Codex must not represent lifted defaults as Codex policy bypasses.
- Codex must not claim it can remove `/hooks` trust.
- Codex must not use `--dangerously-bypass-hook-trust` as normal UX; phrase
  this as `not use --dangerously-bypass-hook-trust as normal UX`.
- Codex must not use --dangerously-bypass-hook-trust as normal UX.

User-facing wording guidance:

- First disclose defaults in a compact way.
- Then say which user-liftable defaults can be lifted by explicit scope.
- Then proceed according to the user's chosen scope.
- Do not repeatedly nag once the mode is established unless a new risky action
  is requested.

## Install Request Flow

Use this flow for requests such as:

- `Set up Augnes`
- `Install Augnes`
- `Codex야 Augnes 설치해줘`
- `Augnes reuse 켜줘`
- `아그네스 설치해줘`

Procedure:

1. Confirm the current repository is Augnes or contains the Augnes installer
   scripts.
2. Check `package.json` for `codex:install-augnes-reuse-hook`.
3. Disclose the default constraints and non-liftable constraints once in
   compact form.
4. Prefer dry-run first unless the user has explicitly lifted that default:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

5. Summarize what the dry-run would change, including target files and whether
   unrelated hooks would be preserved.
6. Run the real install only after explicit user approval, explicit skip-dry-run
   scope, or explicit authorization for real `~/.codex` writes:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

7. Explain that `/hooks` review/trust is still required before a non-managed
   hook can actually run.
8. State clearly that smoke tests can verify files, docs, scripts, and
   temp-home installer behavior, but smoke does not prove real Codex hook
   loading or `/hooks` trust.

If `codex:uninstall-augnes-reuse-hook` exists, mention rollback:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

## Use Request Flow

Use this flow for requests such as:

- `Use Augnes`
- `Use Augnes for this task`
- `Start with Augnes memory`
- `Start from Augnes memories`
- `Use Augnes memory`
- `Use Augnes context`
- `Use Augnes context before editing`
- `Review this PR with Augnes context`
- `Work with Augnes memory`
- `Start this task with Augnes`
- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes context 붙여서 작업해줘`
- `아그네스 쓰자`

Procedure:

1. Diagnose whether the user-level hook installer appears to be present, for
   example by checking `package.json` for `codex:install-augnes-reuse-hook` and
   `codex:uninstall-augnes-reuse-hook`.
2. Disclose the default constraints and non-liftable constraints once in
   compact form.
3. Warn that `/hooks review/trust remains manual` and may still be required
   before hook automation can run.
4. If hook automation is unavailable, missing, disabled, or not trusted, fall
   back to manual Perspective Memory Reuse Intake.
5. Use the repository's equivalent script when it differs; otherwise run:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

6. Treat the resulting Codex Memory Brief as task-start context.

## Work-Start Memory Flow

Use this flow for requests such as:

- `Start with Augnes memory`
- `Start from Augnes memories`
- `Use Augnes memory`
- `Review this PR with Augnes context`
- `Work with Augnes memory`
- `Start this task with Augnes`
- `Augnes memory 보고 이 PR 리뷰해줘`
- `Augnes reuse context로 이 작업 시작해`

Procedure:

1. Run memory reuse intake with `--brief` for the task:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

2. Preserve selected memory IDs, `why_selected`, `reuse_boundary`, and
   `quality_review_preview_summary` when available.
3. Use the memory brief as context, not as permission to mutate unrelated
   systems.
4. Respect the user's explicit scope. Narrow boundaries such as docs-only,
   report-only, smoke-only, read-only, local-only, design-only, copy-only, and
   audit-only stay active unless the user explicitly changes them.

## Boundaries

Do not add or mutate the following unless the user explicitly scopes the work:

- storage/persistence
- provider/model calls
- OpenAI config
- MCP
- Codex SDK
- GitHub mutation
- automatic Augnes memory item creation
- managed enterprise hooks
- large hook filter rewrites
- plugin packaging beyond this instruction-only wrapper

This skill does not grant Augnes state commit/reject authority, publication
authority, proof/evidence write authority, merge authority, or approval
authority.

## Closeout

At the end of Augnes-assisted work, report:

- changed files
- verification commands run
- skipped checks and why
- remaining friction or trust/setup caveats
- whether memory reuse intake was used
- whether hook automation was actually used or only documented/fallbacked

Never claim `/hooks` trust, real hook loading, evidence rows, proof closeout,
or Augnes state changes happened unless the corresponding command or user action
actually occurred.
