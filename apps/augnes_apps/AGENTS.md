# AGENTS.md — Codex implementation rules for Augnes Console

You are implementing the first ChatGPT App version of Augnes.

## Non-negotiable product constraints

1. **Core sovereignty**
   - ChatGPT is surface only.
   - The app must not become canonical memory.
   - Canonical write paths stay inside Augnes Core.

2. **Read-first v1**
   - All public tools remain read-only.
   - No create/update/delete/send/job-trigger actions.
   - `readOnlyHint`, `destructiveHint`, and `openWorldHint` must be set for every tool.

3. **Working View is view-only**
   - Keep it thin: claim ids, summary, top evidence ids, active pointers.
   - Never stash raw logs or full source text in working view payloads.

4. **Narrator is not truth**
   - Never promote narrator/self-explanation text into evidence.
   - Surface contradiction instead of smoothing it away.

5. **RepoGraph discipline**
   - Search and explore are view-only.
   - Fetch is the only repo output that can later become an evidence candidate.

6. **Continuity discipline**
   - Continuity is shown and measured first.
   - Do not use continuity score as an online action selector in v1.

7. **Boundary discipline**
   - Carry-forward is explicit.
   - Maintain ratification ladder vocabulary: provisional -> boundary_committed -> canary_or_reviewed -> promoted.

## Public app profile

The public directory-safe profile must only expose:

- search
- fetch
- open_casefile
- get_working_view
- explain_strategy
- get_boundary_packet
- get_continuity_report
- navigate_repo
- get_governance_audit

No hidden write tools should be left in the same app during submission.

## Engineering bias

- prefer boring explicit JSON structures
- prefer server-side validation over model trust
- prefer fewer tools with clearer payloads
- prefer a single widget shell with panels over many fragile widgets
- prefer typed adapters over inline fetch calls everywhere

## Delivery order

1. Make the scaffold run.
2. Replace mock adapter with real Augnes Core adapter.
3. Improve widget rendering and host-state handling.
4. Add tests for tool payloads and review-safe output.
5. Harden privacy / logging / metadata for submission.

## What not to optimize early

- fancy front-end polish
- animations
- auth complexity before the read-only flow works
- OpenClaw / Codex / action flows in the public app
- hidden memory tricks using thread/session state
