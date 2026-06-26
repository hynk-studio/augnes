# Feedback Event Aggregation Runtime v0.1

## 1. Purpose

Feedback Event Aggregation Runtime is advisory only.

This slice aggregates caller-provided public-safe feedback events into deterministic display and review signals.

Feedback is not truth.

Feedback is not proof.

Feedback is not evidence.

Feedback is not promotion readiness.

Aggregation is not authority.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `feedback_event_aggregation_runtime_v0_1` from `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual field, type, and enum authority remains with the feedback aggregation runtime helper and existing feedback-to-rule candidate contracts.

## 3. Relationship to PR #791 and prior feedback slices

This slice follows PR #791 Manual Anchors and prior feedback-to-rule contract/builder slices.

PR #791 persists explicit operator-created manual anchors as display hints only. The prior feedback-to-rule slices defined candidate-only review artifacts. This PR adds advisory aggregation only and does not add feedback write routes, UI controls, DB writes, state mutation, or product-write.

## 4. Scope and non-goals

Aggregation does not mutate candidates.

Aggregation does not delete candidates.

Aggregation does not promote candidates.

Aggregation does not mutate rules.

Aggregation does not mutate parser behavior.

Aggregation does not mutate durable Perspective state.

Aggregation does not product-write.

Product-write remains parked by #686.

This PR does not implement feedback write route, feedback event mutation, automatic rule mutation, automatic parser mutation, automatic candidate deletion, automatic candidate rejection, automatic promotion, durable Perspective state mutation, Formation Receipt write, promotion execution, promotion decision write, proof/evidence creation, claim/evidence writes, product write, product ID allocation, provider/OpenAI calls, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file reads as source input, Git Ledger export, Codex/GitHub automation, work mutation, UI controls, background jobs, external network calls, package dependencies, GitHub Actions, raw source body storage, raw provider output storage, raw retrieval output storage, raw feedback payload storage, raw conversation storage, hidden reasoning storage, private URL persistence, local private path persistence, or automatic aggregation authority from provider/retrieval/RAG/Codex/CI/smoke/Git refs.

## 5. Input event shape

An input event contains a public-safe event id, event kind, target surface, target surface ref, target candidate ref, source refs, review record refs, operator actor ref, bounded feedback summary, timestamp, public-safe flag, and reason codes.

Supported event kinds are `pin_preview`, `dismiss_preview`, `correct_preview`, `invalidate_preview`, `needs_more_evidence`, `scope_overreach`, `not_relevant_now`, `mark_useful`, `mark_wrong`, and `unknown`.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Aggregation shape

Aggregation groups events by target surface, target surface ref, and target candidate ref.

It computes `pin_count`, `dismiss_count`, `correct_count`, `invalidate_count`, `needs_more_evidence_count`, `scope_overreach_count`, `not_relevant_now_count`, `mark_useful_count`, `mark_wrong_count`, `last_feedback_at`, affected refs, priority hints, rule failure candidates, reason codes, and authority boundary.

Every aggregate is advisory-only. Aggregates never delete candidates, promote candidates, mutate rules, mutate parser behavior, mutate durable state, create proof/evidence, or product-write.

## 7. Priority hint rules

Pinned items stay visible but are not promoted.

Dismissed items lower display priority but are not deleted.

Corrected items show correction warning but do not mutate parser/rules.

Invalidated items require source/review follow-up and are not hard-deleted.

Needs-more-evidence creates review cue only.

Scope-overreach creates rule failure candidate only.

Priority hints are display/review hints. They are not truth, proof, evidence, promotion readiness, durable Perspective state, or product-write authority.

## 8. Rule failure candidate rules

Rule failure candidates are candidate-only review aids.

Repeated dismissals, repeated corrections, scope-overreach, needs-more-evidence, invalidation, wrong-mark feedback, stale context, and unknown feedback kinds may create candidate-only rule failure candidates.

Rule failure candidates do not mutate rules, mutate parser behavior, delete candidates, promote candidates, write DB rows, create proof/evidence, or product-write.

## 9. Route rules

The route is `POST /api/research-candidate/feedback-events/aggregation`.

POST requires a same-origin boundary and a JSON object body. It runs deterministic aggregation over caller-provided public-safe JSON only.

This PR does not add feedback write route.

This PR does not add UI controls.

This PR does not persist aggregation.

This PR does not write DB.

The route does not read files, fetch sources, call providers, execute retrieval/RAG, mutate durable state, create proof/evidence, product-write, start background jobs, or perform GitHub automation.

## 10. Privacy and redaction rules

The runtime accepts bounded symbolic refs, bounded feedback summaries, reason codes, and public-safe metadata only.

Fixtures must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, raw feedback payload, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text.

Blocked examples use bounded placeholder text only.

## 11. Authority boundary

Advisory feedback aggregation runtime is the only active capability.

Feedback write, candidate mutation, rule mutation, parser mutation, promotion execution, durable state write, durable state apply, Formation Receipt write, promotion decision record write, proof/evidence record write, claim/evidence write, product write, product ID allocation, work mutation, DB query/write, source fetch, local/repository/uploaded file read, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution authority, GitHub automation authority, feedback truth/proof/evidence/promotion-readiness authority, aggregation authority, and product-write authority remain false.

## 12. Deferred work

Deferred work:

1. Feedback controls expansion
2. Feedback influenced surfacing preview
3. Runtime audit panel integration
4. Dogfooding ingestion
5. Git Ledger export
6. Product write reentry

## 13. Verification expectations

Verification should run the feedback aggregation smoke, PR #791 Manual Anchors smoke, PR #790 Constellation Runtime UI smoke and browser/static validation, PR #789 Seeded Constellation Layout Runtime smoke, PR #788 Project Constellation Runtime Layout Contract smoke, PR #787 Perspective Trajectory Builder smoke, PR #786 Durable Perspective State Apply smoke, PR #785 Formation Receipt smoke, PR #783/#784 promotion decision store smoke, PR #782 promotion contract smoke, PR #781 RAG Context Preview smoke, PR #780 retrieval index runtime smoke, PR #779 retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, `npm run typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports are acceptable only when commands exit 0.

## 14. Next recommended slices

1. feedback_controls_expansion_v0_1
2. feedback_influenced_surfacing_preview_v0_1
3. dogfooding_record_runtime_contract_v0_1
4. runtime_audit_panel_v0_1
5. git_ledger_export_contract_v0_1 only after audit/readiness review
