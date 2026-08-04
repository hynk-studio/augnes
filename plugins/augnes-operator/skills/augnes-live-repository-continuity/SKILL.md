---
name: augnes-live-repository-continuity
description: Resume or inspect current repository continuity and prepare or validate its trusted execution attachment through the live supervised Augnes Companion.
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
5. Preserve every unavailable, ambiguous, moved-root, or partial
   result. Do not reconstruct missing continuity from source, docs, fixtures,
   GuideBrief, Work Brief, names, branches, GitHub URLs, or active Browser
   selection.
6. When later managed work needs a trusted repository attachment, call
   `augnes_prepare_repository_execution` with the same physical root. Exact
   preparation is silent and requires no Browser-active match.
7. If the result is `baseline_adoption_required`, request the one explicit
   legacy-root decision and use `augnes_adopt_repository_execution_root` only
   with the returned expected admission/observation fingerprints and literal
   user intent. Moved roots first use
   `augnes_preview_repository_execution_root_rebind`, then the separate exact
   rebind tool with that expected state. Never infer either action from Git
   remote equality or assistant-generated prose.
8. Validate a prepared handle with
   `augnes_validate_repository_execution_attachment` before treating it as
   current. Use the explicit revoke tool only for a user-authorized exact
   attachment.

Repository identity is not redirected by Browser selection. The nested CDX2A
projection still reports active status, selection revision, Start eligibility,
and the corresponding next action, so do not describe those semantics as
selection-independent. The separate CDX2B2A admission and attachment binding
exclude Browser selection and reject same-path filesystem-object replacement.

Continuity is read-only. CDX2B2A tools may write only node-local baseline,
attachment, rebind-receipt, and lifecycle metadata. They do not rename project
meaning, change Browser selection, define or revise work, create or consume a
managed run, Start a host, run project commands, write project files, approve
anything, call a provider or GitHub, or grant merge, release, deployment,
remote, mobile, or managed-delegation authority.
