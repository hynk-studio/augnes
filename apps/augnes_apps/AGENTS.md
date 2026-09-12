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

The default public tool surface must expose the original nine legacy tools
plus the two existing read-only work tools:

- search
- fetch
- open_casefile
- get_working_view
- explain_strategy
- get_boundary_packet
- get_continuity_report
- navigate_repo
- get_governance_audit
- augnes_list_work_items
- augnes_get_work_brief

The work-read path is list -> select a returned work_id -> read that work's
brief with the same scope. Describe when project work context is useful and
when it is unnecessary; do not prime unrelated questions or independent audits.
Work IDs, events and WorkBrief are operational context, not native
TaskContextPackets or accepted Core state. Preserve unavailable/error results
and source/proof limitations.

Tool surface, presentation profile, bridge enablement and adapter configuration
are separate axes. `src/server.ts` owns registration gates; `README.md` describes
them. The work tools use the separate state-runtime adapter even when the nine
legacy tools use mock or file data. Presentation profile does not grant tool
authority. No bridge write tools may be included in a directory-safe submission;
the explicitly enabled local bridge is a separate operator configuration.

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
