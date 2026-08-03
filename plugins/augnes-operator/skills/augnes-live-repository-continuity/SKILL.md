---
name: augnes-live-repository-continuity
description: Resume, continue, or inspect the current local repository through the live supervised Augnes Companion and exact canonical project continuity.
---

# Augnes Live Repository Continuity

Use this skill when the user says “Resume this repository with Augnes,” “What
was I working on here?”, “Continue from the current Augnes context,” or “Show
the current Augnes project state.”

1. Supply the current local repository root to `augnes_resume_repository`.
2. Use only a response whose Companion status is `live`, repository resolution
   is `resolved_exact`, and nested continuity comes from
   `codex_current_continuity.v0.1`.
3. Present the ordinary-language current situation and one next meaningful
   action. Use the Browser deep link only when returned.
4. Refresh the tool after Browser-side work revision before continuing from a
   prior snapshot binding.
5. Preserve every unavailable, ambiguous, moved-root, changed-root, or partial
   result. Do not reconstruct missing continuity from source, docs, fixtures,
   GuideBrief, Work Brief, names, branches, GitHub URLs, or active Browser
   selection.

This surface is local and read-only. It does not register or rename projects,
change Browser selection, define or revise work, create or start a run, approve
anything, write proof/evidence, call a provider or GitHub, or grant merge,
release, deployment, remote, mobile, or managed-delegation authority.
