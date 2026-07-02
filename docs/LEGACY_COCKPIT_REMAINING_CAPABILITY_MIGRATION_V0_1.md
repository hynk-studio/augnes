# Legacy Cockpit Remaining Capability Migration Map v0.1

## Status And Purpose

Status: remaining capability migration map after route split shrink.

This is the remaining capability migration map after the route split shrink.
`/cockpit` is temporary retained compatibility, not a long-term product surface.
The goal is to move each useful remaining Cockpit capability to Blank State,
Workplane, Workplane State Proposal Review, a dedicated review or edit surface,
or delete it when it is obsolete.

This PR does not move UI yet and does not delete Cockpit yet. It maps the
remaining capability surface so later implementation PRs can dismantle Legacy
Cockpit without hidden feature loss.

Cockpit unique useful capability count must reach 0 before route removal.

## Destination Model

Destination values:

- `blank_state`: Human entry, direction setting, high-level review, user
  judgment, start or continue flow selection, and perspective or review flow
  selection belong on Blank State.
- `workplane`: AI/Codex/runner operational context, source refs, debug context,
  proposal context, state transition inspection, handoff prep, runner or
  DeltaBatch review, and research-state inspection belong on Agent Workplane.
- `workplane_state_proposal_review`: Research-critical state-change review
  functions belong in a native Workplane State Proposal Review lane. This
  includes field-level proposal diff, before/after state preview, manual
  preview editor, Perspective lens detail, memory proposal review, local draft
  review, source refs, impact analysis, stale/fallback warnings,
  needs-user-judgment lane, authority boundary, and proposal status history.
- `dedicated_review_or_edit_surface`: A capability needs a purpose-built
  review or edit surface outside the first State Proposal Review lane before
  Cockpit can stop retaining it.
- `delete`: The capability is obsolete shell, duplicate copy, compatibility
  explanatory residue, or forbidden external execution residue and should not
  be migrated.
- `blocked_until_authority_contract`: The capability is local-write, apply,
  commit, reject, or durable state mutation control and must not move until a
  separate authority contract exists.
- `retained_temporarily_in_cockpit`: The capability remains explicitly
  accounted for in retained Cockpit compatibility while a native destination is
  missing or not yet validated.

Destination counts in this map:

| destination | count |
| --- | ---: |
| `blank_state` | 7 |
| `workplane` | 14 |
| `workplane_state_proposal_review` | 13 |
| `dedicated_review_or_edit_surface` | 0 |
| `delete` | 8 |
| `blocked_until_authority_contract` | 5 |
| `retained_temporarily_in_cockpit` | 0 |

## Capability Fields

Each capability row records:

- `capability_id`
- `current_cockpit_location`
- `short_description`
- `user_value`
- `ai_agent_value`
- `research_value`
- `risk_level`
- `destination`
- `migration_status`
- `delete_when`
- `required_native_surface`
- `required_validation`
- `authority_notes`
- `next_pr_target`

Allowed `migration_status` values:

- `ready_for_blank_state`
- `ready_for_workplane`
- `ready_for_state_proposal_review`
- `needs_dedicated_surface`
- `blocked_until_authority_contract`
- `obsolete_delete`
- `retained_temporarily`

Allowed `risk_level` values:

- `low`
- `medium`
- `high`

## Migration Map

| capability_id | current_cockpit_location | short_description | user_value | ai_agent_value | research_value | risk_level | destination | migration_status | delete_when | required_native_surface | required_validation | authority_notes | next_pr_target |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `continue_current_work_entry` | Cockpit Overview and Work tab current work cards | Entry for continuing the current work item. | Lets a user resume without scanning the legacy shell. | Gives Codex the selected work context and continuation intent. | Preserves continuity across research runs. | `medium` | `blank_state` | `ready_for_blank_state` | After Blank State exposes equivalent continue action. | Blank State current work entry. | Static smoke plus browser route check for entry visibility. | Read and navigation only. | PR 2 |
| `review_pending_proposals_entry` | Cockpit proposal and review summaries | Entry for pending proposal review. | Gives users a direct review queue entry. | Signals that proposals need review before work continues. | Protects proposal review from deletion. | `high` | `blank_state` | `ready_for_blank_state` | After Blank State links to native State Proposal Review. | Blank State review pending proposals entry. | Static smoke for link and no apply controls. | Must not add apply authority. | PR 2 |
| `choose_perspective_lens_entry` | Cockpit Perspective tab and lens selectors | Entry for choosing a Perspective lens or review flow. | Lets a user pick the lens before reading details. | Tells agents which review frame the user selected. | Preserves Perspective lens detail routing. | `medium` | `blank_state` | `ready_for_blank_state` | After Blank State exposes lens choice. | Blank State Perspective lens entry. | Static smoke for entry and target route. | Selection is view intent only. | PR 2 |
| `prepare_codex_handoff_entry` | Cockpit handoff and Codex handoff cards | Entry for preparing a Codex handoff. | Lets a user prepare transfer context intentionally. | Gives Codex source refs, constraints, and validation commands. | Preserves handoff prep without execution. | `medium` | `blank_state` | `ready_for_blank_state` | After Blank State routes to handoff prep. | Blank State handoff prep entry plus Workplane handoff target. | Static smoke for entry and no launch behavior. | Copy or preview only, no Codex execution. | PR 2 |
| `review_runner_deltabatch_entry` | Cockpit work and operator run-like summaries | Entry for reviewing runner DeltaBatch output. | Gives users an obvious place to inspect runner output. | Gives agents recovered output context without rerunning. | Preserves runner DeltaBatch review. | `medium` | `blank_state` | `ready_for_blank_state` | After Blank State exposes runner review entry. | Blank State runner DeltaBatch entry. | Static smoke for entry and no runner calls. | No runner execution, tick, recovery, or scheduling. | PR 2 |
| `automation_mode_entry` | Cockpit operator automation mode copy | Entry for understanding automation mode or boundary state. | Shows whether automation is off, preview, or blocked. | Prevents agents from assuming execution authority. | Preserves authority boundary visibility. | `high` | `blank_state` | `ready_for_blank_state` | After Blank State summarizes automation mode. | Blank State automation mode summary. | Static smoke for boundary text and no controls. | Display only. | PR 2 |
| `user_judgment_summary_entry` | Cockpit operator and review user judgment summaries | Entry for needs-user-judgment summary. | Lets users see judgment items first. | Tells agents what must wait for the user. | Preserves the needs-user-judgment lane. | `high` | `blank_state` | `ready_for_blank_state` | After Blank State exposes judgment summary. | Blank State user judgment summary. | Static smoke for judgment lanes and no auto-apply. | Suggestions are not actions. | PR 2 |
| `work_brief_detail` | Cockpit Work tab and current work detail | Detailed Work Brief context. | Helps inspect current task facts. | Gives agents objective, refs, and constraints. | Preserves work continuity. | `medium` | `workplane` | `ready_for_workplane` | After Workplane has equivalent source-backed detail. | Agent Workplane Work Brief detail. | Workplane smoke with source refs and fallback state. | Read-only. | PR 3 |
| `work_queue_detail` | Cockpit Work tab queue and selected work controls | Work queue detail and current selection context. | Lets users understand queued work. | Helps agents choose continuation target. | Preserves queue state. | `medium` | `workplane` | `ready_for_workplane` | After Workplane queue detail covers same fields. | Agent Workplane Work Queue detail. | Workplane smoke for row fields and no writes. | Read-only selection context. | PR 3 |
| `current_perspective_detail` | Cockpit Perspective current snapshot panels | Current Perspective detail. | Shows the live frame and tensions. | Helps agents avoid stale assumptions. | Preserves research-state inspection. | `high` | `workplane` | `ready_for_workplane` | After Workplane current Perspective detail is source-backed. | Agent Workplane Current Perspective detail. | Static and browser smoke for source and fallback disclosure. | No Perspective apply. | PR 3 |
| `delta_projection_detail` | Cockpit Perspective and Delta projection previews | Delta projection detail. | Shows projected changes before review. | Gives agents state transition context. | Preserves before/after reasoning input. | `high` | `workplane` | `ready_for_workplane` | After Workplane projection detail exists. | Agent Workplane Delta Projection detail. | Smoke for source refs, stale state, and no auto-apply. | No delta auto-apply. | PR 3 |
| `projected_delta_batch_detail` | Cockpit projection and batch preview copy | Projected DeltaBatch preview detail. | Lets users inspect planned batch shape. | Gives agents batch context without runner action. | Preserves research batch inspection. | `high` | `workplane` | `ready_for_workplane` | After Workplane projected batch detail exists. | Agent Workplane Projected DeltaBatch detail. | Smoke for projected versus recovered distinction. | Preview only. | PR 3 |
| `recovered_runner_deltabatch_detail` | Cockpit work and operator recovered run context | Recovered runner DeltaBatch detail. | Lets users review recovered runner output. | Gives agents actual recovered output context. | Preserves run-output continuity. | `high` | `workplane` | `ready_for_workplane` | After Workplane recovered DeltaBatch detail exists. | Agent Workplane Runner DeltaBatch detail. | Smoke for no runner execution and recovered refs. | No runner execution or recovery write. | PR 3 |
| `run_postmortem_detail` | Cockpit Session Trace, Evidence Pack, and Work events | Run postmortem detail. | Shows what happened and what failed. | Helps agents recover from partial or failed work. | Preserves postmortem trace. | `medium` | `workplane` | `ready_for_workplane` | After Workplane postmortem detail covers trace fields. | Agent Workplane Run Postmortem detail. | Smoke for event refs and skipped checks. | Read-only. | PR 3 |
| `source_ref_bridge_detail` | Cockpit Bridge tab and source ref examples | Source refs and bridge detail. | Shows provenance and endpoint context. | Helps agents separate observed and derived context. | Preserves source refs. | `high` | `workplane` | `ready_for_workplane` | After Workplane source ref bridge is complete. | Agent Workplane Source Ref Bridge detail. | Smoke for source ref kinds, gaps, and fallback. | No external calls. | PR 3 |
| `trace_diagnostics_detail` | Cockpit trace, temporal graph, and diagnostics sections | Trace diagnostics detail. | Shows gaps, stale state, and diagnostics. | Helps agents debug without hidden side effects. | Preserves diagnostic lineage. | `high` | `workplane` | `ready_for_workplane` | After Workplane trace diagnostics covers legacy detail. | Agent Workplane Trace Diagnostics detail. | Smoke for trace refs and warnings. | Read-only diagnostics. | PR 3 |
| `validation_smoke_detail` | Cockpit validation and evidence summaries | Validation and smoke detail. | Shows validation commands and gaps. | Helps agents report readiness honestly. | Preserves verification context. | `medium` | `workplane` | `ready_for_workplane` | After Workplane validation detail exists. | Agent Workplane Validation and Smoke detail. | Smoke for command listing and skipped checks. | No proof or evidence writes. | PR 3 |
| `handoff_builder_detail` | Cockpit handoff builder and copy areas | Handoff builder detail. | Lets users inspect transfer packet contents. | Gives agents a reviewable handoff packet. | Preserves handoff prep. | `medium` | `workplane` | `ready_for_workplane` | After Workplane handoff builder has equivalent detail. | Agent Workplane Handoff Builder detail. | Smoke for copy-only or preview-only boundary. | No send, launch, or execute. | PR 3 |
| `guidebrief_debug_context_detail` | Cockpit and Workplane debug-context adjacent summaries | GuideBrief debug context detail. | Explains what the guide sees. | Helps agents validate context before acting. | Preserves debug explainability. | `medium` | `workplane` | `ready_for_workplane` | After Workplane debug detail is native. | Agent Workplane GuideBrief Debug Context detail. | Smoke for observed, inferred, suggested, and judgment separation. | Read-only. | PR 3 |
| `intent_projection_detail` | Cockpit proposal and intent projection adjacent preview | Intent projection detail. | Shows how an intent maps to view projection. | Helps agents reason about reversible candidate packets. | Preserves proposal intent context. | `medium` | `workplane` | `ready_for_workplane` | After Workplane intent detail covers same fields. | Agent Workplane Intent Projection detail. | Smoke for reversible projection and no persistence. | No persistent mode. | PR 3 |
| `review_queue_detail` | Cockpit review queue and operator review summaries | Review queue detail. | Lets users see review burden. | Tells agents where proposals or memory items wait. | Preserves review queue inspection. | `high` | `workplane` | `ready_for_workplane` | After Workplane review queue detail is complete. | Agent Workplane Review Queue detail. | Smoke for counts, lanes, source refs, and no apply. | No durable memory or Perspective apply. | PR 3 |
| `field_level_proposal_diff` | Cockpit proposal preview and local proposal rows | field-level proposal diff. | Lets users inspect exact field changes. | Gives agents precise proposal comparison. | Research-critical proposal diff. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After State Proposal Review renders field diffs. | Workplane State Proposal Review field diff lane. | Smoke for old value, new value, source refs, and no apply. | Review only. | PR 3 |
| `before_after_state_preview` | Cockpit proposal preview and Perspective preview | before/after state preview. | Shows expected state before user judgment. | Gives agents state transition inspection. | Research-critical before and after review. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After State Proposal Review renders before/after preview. | Workplane State Proposal Review before/after lane. | Smoke for before and after sections. | No auto-apply. | PR 3 |
| `proposal_impact_analysis` | Cockpit proposal summary and impact copy | impact analysis for proposals. | Shows what changes would affect. | Helps agents explain consequences. | Preserves research impact review. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After impact analysis is native. | Workplane State Proposal Review impact analysis lane. | Smoke for impact rows and source refs. | Review only. | PR 3 |
| `memory_proposal_review` | Cockpit durable-memory proposal review areas | memory proposal review. | Lets users inspect memory candidates before application. | Tells agents memory is candidate state only. | Preserves memory review. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After memory proposal review is native. | Workplane State Proposal Review memory proposal lane. | Smoke for candidate labels and no apply controls. | No durable memory apply. | PR 3 |
| `perspective_lens_detail_edit` | Cockpit Perspective lens detail and local edit preview | Perspective lens detail and edit preview. | Lets users review lens details before choosing. | Gives agents selected frame details. | Preserves Perspective lens detail. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After lens detail review is native. | Workplane State Proposal Review Perspective lens lane. | Smoke for lens detail and no Perspective apply. | Edit preview only, no durable apply. | PR 3 |
| `local_draft_review` | Cockpit local draft and proposal preview areas | local draft review. | Lets users inspect drafts before promotion. | Keeps agents from treating drafts as committed. | Preserves draft-state distinction. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After local draft review is native. | Workplane State Proposal Review local draft lane. | Smoke for draft labels and no commit controls. | No commit or reject. | PR 3 |
| `manual_preview_editor` | Cockpit manual pasted text preview and editor | manual preview editor. | Lets users inspect manually supplied preview text. | Gives agents bounded preview material. | Preserves manual review input. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After manual preview editor is native or explicitly dedicated. | Workplane State Proposal Review manual preview editor lane. | Smoke for preview-only editor and no persistence. | No product DB writes. | PR 3 |
| `manual_gravity_preview` | Cockpit manual Perspective gravity preview | Manual gravity preview. | Shows gravity or priority preview before action. | Gives agents signal context without applying it. | Preserves formation and prioritization review. | `medium` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After gravity preview is native. | Workplane State Proposal Review gravity preview lane. | Smoke for preview labels and no apply. | Preview only. | PR 3 |
| `formation_basis_preview` | Cockpit Perspective formation basis preview | Formation basis preview. | Shows basis behind a formation candidate. | Helps agents explain why a candidate exists. | Preserves formation evidence. | `medium` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After formation basis review is native. | Workplane State Proposal Review formation basis lane. | Smoke for source basis and stale/fallback warnings. | Review only. | PR 3 |
| `proposal_status_history` | Cockpit proposal lifecycle and status rows | proposal status history. | Shows proposal lifecycle state. | Helps agents avoid repeating or misreporting review state. | Preserves proposal status history. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After status history is native. | Workplane State Proposal Review status history lane. | Smoke for status list and source refs. | Read-only. | PR 3 |
| `needs_user_judgment_lane` | Cockpit user decision and validation-required lanes | needs-user-judgment lane. | Separates items that require user judgment. | Prevents agents from auto-resolving judgment items. | Preserves human review gate. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After user judgment lane is native. | Workplane State Proposal Review needs-user-judgment lane. | Smoke for lane labels and no auto action. | User judgment remains user-owned. | PR 3 |
| `stale_fallback_warning_review` | Cockpit stale and fallback disclosures | stale/fallback warnings. | Shows when data is stale or fallback. | Helps agents report uncertainty. | Preserves freshness review. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After stale and fallback warning review is native. | Workplane State Proposal Review stale/fallback lane. | Smoke for warning labels and source status. | Read-only. | PR 3 |
| `authority_boundary_review` | Cockpit authority boundary copy and blocked controls | authority boundary. | Shows what review can and cannot do. | Prevents accidental authority escalation. | Preserves safety boundary for research review. | `high` | `workplane_state_proposal_review` | `ready_for_state_proposal_review` | After authority boundary review is native. | Workplane State Proposal Review authority boundary lane. | Smoke for no apply, no provider, no runner authority. | Boundary display only. | PR 3 |
| `local_write_manual_controls` | Cockpit local manual write controls | Local manual write controls. | Potentially useful only under explicit authority. | Agents must not inherit write controls casually. | Could affect durable local state. | `high` | `blocked_until_authority_contract` | `blocked_until_authority_contract` | Only after a separate authority contract exists, otherwise delete. | None until authority contract. | Smoke must prove controls remain absent from native surfaces. | local-write/apply/commit/reject controls are blocked until a separate authority contract. | PR 4 or later authority PR |
| `local_storage_draft_controls` | Cockpit localStorage and draft controls | Local storage draft controls. | Could preserve local draft convenience. | Agents must treat local draft state as non-durable unless contracted. | Could blur draft and committed state. | `high` | `blocked_until_authority_contract` | `blocked_until_authority_contract` | Only after draft authority contract exists, otherwise delete. | None until authority contract. | Smoke for no native localStorage durable mode. | No product DB or durable state writes. | PR 4 or later authority PR |
| `proposal_commit_reject_controls` | Cockpit proposal commit and reject controls | Proposal commit or reject controls. | Useful only when explicit user authority exists. | Agents must not commit or reject proposals. | Could mutate proposal lifecycle state. | `high` | `blocked_until_authority_contract` | `blocked_until_authority_contract` | Only after commit/reject authority contract exists, otherwise delete. | None until authority contract. | Smoke for no commit or reject controls in native review lane. | No commit, reject, or lifecycle mutation. | PR 4 or later authority PR |
| `durable_memory_apply_controls` | Cockpit durable-memory apply controls | Durable memory apply controls. | Useful only with explicit memory authority. | Agents must not apply memory candidates. | Could mutate durable memory. | `high` | `blocked_until_authority_contract` | `blocked_until_authority_contract` | Only after durable memory authority contract exists, otherwise delete. | None until authority contract. | Smoke for no durable memory apply controls. | No durable memory apply. | PR 4 or later authority PR |
| `perspective_apply_controls` | Cockpit Perspective apply controls | Perspective apply controls. | Useful only with explicit Perspective authority. | Agents must not apply Perspective changes. | Could mutate Perspective state. | `high` | `blocked_until_authority_contract` | `blocked_until_authority_contract` | Only after Perspective authority contract exists, otherwise delete. | None until authority contract. | Smoke for no Perspective apply controls. | No Perspective apply. | PR 4 or later authority PR |
| `six_tab_cockpit_shell` | Cockpit six-tab shell | Legacy six-tab Cockpit shell. | No long-term user value after destinations exist. | No agent value after native surfaces exist. | Shell itself is not research value. | `medium` | `delete` | `obsolete_delete` | When unique useful capability count is 0. | None. | Runtime/browser regression verifies shell absence. | Delete shell only after capability count reaches 0. | PR 5 |
| `legacy_cockpit_tab_navigation` | Cockpit tab navigation | Legacy tab navigation. | Superseded by native access layers. | Superseded by native Workplane organization. | Navigation is not research data. | `low` | `delete` | `obsolete_delete` | When native entries and review lanes exist. | None. | Browser regression verifies no tab shell. | No migration. | PR 5 |
| `duplicate_work_brief_cards` | Cockpit duplicate Work Brief cards | Duplicate Work Brief copy and cards. | Duplicate after Blank State and Workplane own entries. | Creates stale or conflicting context. | No unique research value. | `low` | `delete` | `obsolete_delete` | After Workplane Work Brief detail and Blank State entry exist. | None. | Static smoke for absence of duplicate cards after removal. | No migration. | PR 5 |
| `duplicate_perspective_summary_cards` | Cockpit duplicate Perspective summary cards | Duplicate Perspective summary cards. | Duplicate after Blank State and Workplane own Perspective summary. | Creates conflicting lens or freshness copy. | No unique research value once native detail exists. | `low` | `delete` | `obsolete_delete` | After native Perspective detail and review lane exist. | None. | Static smoke for absence after removal. | No migration. | PR 5 |
| `duplicate_bridge_summary_copy` | Cockpit duplicate Bridge summary copy | Duplicate Bridge summary copy. | Duplicate after Source Ref Bridge detail exists. | Creates stale bridge guidance. | No unique research value once source refs are native. | `low` | `delete` | `obsolete_delete` | After Workplane Source Ref Bridge detail is native. | None. | Static smoke for deletion. | No migration. | PR 5 |
| `duplicate_operator_visibility_copy` | Cockpit duplicate operator visibility copy | Duplicate operator visibility copy. | Duplicate after Blank State judgment and Workplane review queues exist. | Can confuse authority status. | No unique research value. | `low` | `delete` | `obsolete_delete` | After native judgment and review queues exist. | None. | Static smoke for deletion. | No migration. | PR 5 |
| `obsolete_external_execution_controls` | Historical Cockpit external execution residue | Obsolete external execution controls and copy. | No valid user value in product surface. | Must not be inherited by agents. | No research value. | `high` | `delete` | `obsolete_delete` | Immediately or during route removal if present only as residue. | None. | Static smoke proves external execution controls absent. | No provider/OpenAI/GitHub/Codex/runner authority. | PR 4 or PR 5 |
| `compatibility_island_explainer_copy` | Workbench compatibility pointer and Cockpit explainer copy | Compatibility island explainer copy. | Temporary orientation only. | Tells agents why Cockpit remains reachable. | No long-term research value. | `low` | `delete` | `obsolete_delete` | When `/cockpit` is removed or becomes deprecated redirect. | None. | Static smoke for absence after route removal. | No migration. | PR 5 |

## Required Destination Decisions

- Human entry and high-level decision items are assigned to `blank_state`.
- AI/Codex/runner operational context is assigned to `workplane`.
- Research-critical proposal, preview, memory, Perspective, and draft review
  functions are assigned to `workplane_state_proposal_review`.
- Local-write, apply, commit, and reject controls are assigned to
  `blocked_until_authority_contract`.
- Obsolete shell, duplicate copy, and external execution residue are assigned
  to `delete`.

## Next PR Sequence

PR 2: Blank State Review Entry Absorption v0.1

Purpose: Move high-level human entry actions into Blank State:

- Continue Current Work
- Review Pending Proposals
- Choose Perspective Lens
- Prepare Codex Handoff
- Review Runner DeltaBatch
- Automation Mode / User Judgment summary

PR 3: Workplane State Proposal Review v0.1

Purpose: Create the research-critical review lane:

- field-level proposal diff
- before/after preview
- memory proposal review
- perspective lens detail
- local draft review
- manual preview
- source refs
- impact analysis
- stale/fallback warnings
- authority boundary

PR 4: Cockpit Manual Controls Migration v0.1

Purpose: Move safe preview/copy controls. Keep local-write controls blocked
until a separate authority contract exists. Delete obsolete controls.

PR 5: Cockpit Route Removal v0.1

Purpose: Remove `/cockpit` and `components/augnes-cockpit.tsx` only when unique
useful capability count is 0.

## Completion Criteria

- `/cockpit` unique useful capability count = 0.
- Blank State exposes human entry and judgment flows.
- Workplane exposes AI/Codex/runner operational context.
- State Proposal Review preserves research-critical state-change review.
- local-write/apply controls are not migrated without authority contract.
- obsolete external execution controls remain absent/deleted.
- Cockpit shell and six-tab layout are gone from product surface.
- runtime/browser regression verifies absence of Cockpit shell after final
  removal.

## Explicit Non-Goals

This PR does not:

- change product UI
- add apply/commit/reject authority
- add provider/OpenAI calls
- add GitHub actuation
- add Codex execution
- add runner execution/tick/recovery/scheduling
- add product DB writes
- add proof/evidence writes
- apply durable memory
- apply Perspective
- auto-apply deltas
- delete `/cockpit`
- delete `components/augnes-cockpit.tsx`
