# Codex Augnes skill

## Purpose

The `augnes-codex` skill is the single repository-local user-facing entrypoint
for explicit Augnes continuity, setup, and memory/reuse requests. It routes each
request to its current owner instead of making Perspective-memory intake the
default for source work.

## Routing

### Resume, continue, recovery, or current state

Use the reviewed `augnes-operator` Companion lifecycle and
`augnes-live-repository-continuity` owner. The supported flow is one exact
lifecycle status read, at most one start of an already-installed exact service,
and one repository resume read. Missing or ambiguous continuity is not
reconstructed from docs, Git, GuideBrief, Work Brief, or memory.

An already-running packaged runtime also exposes:

```bash
npm run codex:current-continuity
```

### Explicit memory or reuse

Run the bounded manual intake only when the user asks for Augnes memory,
context, or reuse:

```bash
npm run perspective:memory-reuse-intake -- --task "<task>" --brief
```

The optional user-level hook is an explicit setup choice, not project default
behavior. Its installer and uninstaller are documented in
[the migration guide](./CODEX_AUGNES_USER_HOOK_INSTALLER_V0_1.md).

### General setup

Prefer the current operator plugin and Companion owners:

```bash
npm run augnes:plugin:install
npm run augnes:service:status
```

Service installation or mutation requires a separate exact user request.

## Skill ownership

Repository-local generic authority, implementation-slice, read-brief,
evidence-recording, and closeout-proof skills were removed from
`.agents/skills`. AGENTS.md owns the general operating contract. Specialized
GuideBrief, evidence, proof, and Companion procedures remain with their
operator-plugin, command, and contract owners; their runtime commands were not
removed.

Ordinary source-first work does not invoke this skill merely because a prompt
mentions code, scripts, review, Codex, or Augnes.
