---
name: augnes-live-repository-continuity
description: Resume current repository continuity, manage its trusted attachment, and start or cancel one Browser-confirmed attachment-backed managed run through the live supervised Augnes Companion.
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
   legacy-root decision, direct the user to confirm the exact request in Augnes
   Browser project settings, and use `augnes_adopt_repository_execution_root`
   only with the returned expected admission/observation fingerprints plus the
   Browser-issued request/grant fingerprints. Moved roots first use
   `augnes_preview_repository_execution_root_rebind`, then the separate exact
   rebind tool after the same Browser confirmation. Revocation first uses
   `augnes_preview_repository_execution_attachment_revocation`. Never infer
   any decision from Git remote equality, annotations, or assistant-generated
   prose. The Browser's HttpOnly decision session and request-bound nonce are
   intentionally unavailable to this skill and all MCP tools.
8. Validate a prepared handle with
   `augnes_validate_repository_execution_attachment` before treating it as
   current. Use the explicit revoke tool only for a user-authorized exact
   attachment.
   On Windows, preserve `identity_unsupported`, `identity_ambiguous`, missing-
   component, or proof-required results exactly. Never fall back to a path,
   Git remote, simulated `win32`, or raw volume/file identifiers. Windows
   source-runtime attachment readiness requires Windows 10 Pro 22H2 build
   19045 or newer or Windows 11 build 22000 or newer on x64 local fixed NTFS.
   Exact proof exists for Windows 10 Pro 22H2 build 19045.6456 at checkpoint
   `374a582b766a10616667633eb911d3df2d49b85e` and Windows 11 Home 25H2 build
   26200.8875 at pre-integration checkpoint
   `567c9bbbad5d35e6803ad740adfac1b881983912`. A later integrated head is not
   Windows 10 exact-head verified without a fresh run there; packaged Windows
   remains unsupported and must remain truthfully distinguished.
9. To start managed repository work, call
   `augnes_request_repository_delegation` for the exact prepared attachment.
   Ask the user to confirm the displayed start card in Augnes Browser. Never
   request, infer, or reproduce the Browser session, challenge, cookie, or
   nonce. After confirmation, call `augnes_request_repository_delegation`
   again with the same workspace, project, and attachment. This is an exact
   replay of the existing request, not a second Start request, and returns the
   Browser-issued grant binding without exposing Browser-session material.
   Then call `augnes_start_repository_delegation` with the exact attachment,
   envelope, request, and grant binding returned by that canonical replay.
   Never guess a grant or reuse the request fingerprint as the grant.
   Exact Start replay must return the same run.
10. Use `augnes_resume_repository` for managed status/result/review continuity.
    For an attachment-backed run, report its canonical resume-eligibility
    status and last confirmed operation without invoking resume. Treat
    `approval_pending` as approval review and `reconciliation_required` as an
    uncertain operation boundary; never translate either into resume-ready.
    For exact `resume_ready`, call `augnes_request_repository_resume`, ask the
    user to confirm the exact Resume card in Browser, and only then call
    `augnes_resume_repository_delegation` with the returned exact grant. Never
    request, infer, or reproduce Browser decision-session, cookie, challenge,
    or nonce material. Exact replay must preserve the same run and report
    `worker_started=false`.
    Use `augnes_cancel_repository_delegation` only with the exact attachment,
    run, binding, and control revision. Cancellation is risk-reducing and needs
    no second Browser decision. It remains available when current packet, work,
    root, baseline, worktree, or Browser selection has drifted. A missing
    controller reports disconnected reconciliation and never starts or resumes
    a worker.

Repository identity is not redirected by Browser selection. The nested CDX2A
projection still reports active status, selection revision, Start eligibility,
and the corresponding next action, so do not describe those semantics as
selection-independent. The separate CDX2B2A admission and attachment binding
exclude Browser selection and reject same-path filesystem-object replacement.

Continuity is read-only. CDX2B2A tools write only node-local baseline,
attachment, rebind-receipt, and lifecycle metadata. A Browser-confirmed CDX2B2B
Start may consume one attachment, create one run, and permit bounded reversible
local work only inside the exact verified macOS Git root or the verified
Windows 11 x64 source-runtime Git root on local fixed NTFS. Windows 10 and
packaged Windows remain unavailable. Explicit Resume must bind the same run,
attachment, thread, checkpoint, and next controller generation; never offer
automatic Resume or a second run. Start never grants arbitrary
network commands, downloads, push/GitHub, injected Browser/Companion/provider/
database/runtime/OS credentials, outside-root secret material, external publication,
semantic approval, ReviewDecision, Transition, accepted state, work closure,
remote/mobile execution, automatic resume, continuous automation, or another
attachment/run/project. Later operation approval and semantic review remain
separate from Start. Files already inside the exact repository remain in the
repository read scope; do not claim content-based secret unreadability. Exact
Start replay reports the bound run's actual state and never starts another
worker.
