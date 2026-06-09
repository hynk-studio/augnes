# Perspective Codex Former Prompt Contract Canonical Schema v0.1

## Summary

This follow-up to PR #484 refines the Codex former prompt contract so future
CodexPerspectiveCandidateDraft JSON is asked to use canonical local schema
directly. The PR #484 alignment layer remains in place as a safety net for old
or drifted model-shaped output.

## What PR #483 Found

PR #483 captured one useful real human-started Codex former response, but strict
local validation could not use it directly because the response used alias-shaped
selected material, pointer, authority, privacy, question, action, and tension
fields.

## What PR #484 Aligned

PR #484 added local schema alignment for the safe alias set observed in the real
transcript: selected material aliases, ref_type/pointer_only pointer aliases,
model-friendly false authority names, false privacy inclusion aliases, object
questions, and alias-shaped actions/tensions. Alignment still rejects true
authority, non-pointer evidence, unsafe material, and privacy inclusion claims.

## Canonical Prompt Contract

The prompt contract now states that selected_material must use:

- changed_files: string[]
- changed_files_summary: string|null
- work_id: string|null
- source_pr_refs: string[]

It also states that evidence_pointer_refs must use pointer_kind,
pointer_semantics: "pointer_only", and ref from the former input packet.

authority_flags must use only the canonical false local keys:

- committed_state
- persistence
- provider_model_api_calls
- proof_evidence_readiness_writes
- codex_execution
- github_mutation
- merge_publish_approval
- core_decision

privacy_flags must use only raw_payloads_included: false,
unsafe_input_material_omitted: boolean, and omitted_unsafe_fields: string[].

user_core_decision_questions must be string[]. next_action_candidates must use
{ action_id, summary } with review_candidate, fix_input_gaps, or
prepare_codex_handoff. unresolved_tensions must use { tension_kind, summary,
source_ref? }.

## Anti-Alias Guidance

Future Codex former responses should stop emitting changed_file_paths,
plain_summary_facts, neutral_perspective_basis, ref_type, pointer_only,
model-friendly authority aliases such as creates_augnes_state or approves,
privacy inclusion aliases such as raw_diffs_included or
private_material_included, hidden[_]reasoning inclusion alias, object user
questions, id/why_next action aliases, and id/why_it_matters tension aliases.

Plain summary facts should be folded into changed_files_summary. Neutral
perspective basis should be expressed in thesis or qualification_notes.

## Dogfood Result

The deterministic dogfood report compares:

- the old PR #483 real transcript alias output
- the refined canonical prompt expectations
- a synthetic canonical local draft fixture

The canonical fixture passes prompt-contract fit and local validation without
schema alignment, producing needs_review candidate-compatible review material
with non_committed authority. The old alias fixture still aligns through the
PR #484 safety net and then validates to needs_review candidate-compatible
review material.

Conclusion: PASS with follow-up.

## Browser/Computer-Use Validation

Browser/computer-use validation was not run because this is pure local
prompt-contract/docs/report/smoke/package work. It adds no UI, route,
browser-visible surface, clipboard automation, interactive copy control, or
transcript capture.

## Authority Boundary

This work does not call Codex from implementation, execute Codex from Augnes,
call the Codex SDK, call OpenAI/provider/model APIs from implementation, call
GitHub APIs from implementation behavior, use implementation network behavior,
write DB state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Follow-Up

Dogfood refined Codex former prompt contract with a new captured transcript.
