---
name: augnes-codex
description: Augnes install, Augnes setup, Augnes use, Augnes memory, Augnes reuse, Augnes context, Augnes 설치, Augnes 쓰자, Augnes 기억, Augnes 컨텍스트, Augnes 보고 시작, 아그네스 설치, 아그네스 쓰자 - use when the user asks to install, enable, use, diagnose, or start work with Augnes memory, reuse, or context in Codex.
---

# Augnes Codex Skill v0.1

## Purpose

Use this skill when the user asks Codex to install, enable, use, diagnose, or
start work with Augnes memory, reuse, or context.

Common trigger phrases include:

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

This skill is a user-facing onboarding layer over the existing Augnes Codex
hook installer and Perspective Memory Reuse Intake. It does not replace the
existing hook, installer, or intake command.

## Install Request Flow

Use this flow for requests such as:

- `Codex야 Augnes 설치해줘`
- `Augnes reuse 켜줘`
- `아그네스 설치해줘`

Procedure:

1. Confirm the current repository is Augnes or contains the Augnes installer
   scripts.
2. Check `package.json` for `codex:install-augnes-reuse-hook`.
3. Prefer dry-run first:

```bash
npm run codex:install-augnes-reuse-hook -- --dry-run
```

4. Summarize what the dry-run would change, including target files and whether
   unrelated hooks would be preserved.
5. Run the real install only after explicit user approval:

```bash
npm run codex:install-augnes-reuse-hook -- --yes
```

6. Explain that `/hooks` review/trust is still required before a non-managed
   hook can actually run.
7. State clearly that smoke tests can verify files, docs, scripts, and
   temp-home installer behavior, but smoke does not prove real Codex hook
   loading or `/hooks` trust.

If `codex:uninstall-augnes-reuse-hook` exists, mention rollback:

```bash
npm run codex:uninstall-augnes-reuse-hook -- --yes
```

## Use Request Flow

Use this flow for requests such as:

- `Codex야 Augnes 쓰자`
- `Augnes memory 보고 시작해`
- `Augnes context 붙여서 작업해줘`

Procedure:

1. Diagnose whether the user-level hook installer appears to be present, for
   example by checking `package.json` for `codex:install-augnes-reuse-hook` and
   `codex:uninstall-augnes-reuse-hook`.
2. Warn that `/hooks` review/trust may still be required before hook automation
   can run.
3. If hook automation is unavailable, missing, disabled, or not trusted, fall
   back to manual Perspective Memory Reuse Intake.
4. Use the repository's equivalent script when it differs; otherwise run:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

5. Treat the resulting Codex Memory Brief as task-start context.

## Work-Start Memory Flow

Use this flow for requests such as:

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

- storage
- persistence
- provider/model calls
- OpenAI provider configuration
- MCP
- Codex SDK
- GitHub mutation
- automatic Augnes memory item creation
- managed enterprise hooks
- large hook filter rewrites
- plugin packaging

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
