# Feedback Influenced Surfacing Preview v0.1

## 1. Purpose

Feedback Influenced Surfacing Preview is preview-only.

Feedback influenced surfacing is advisory only.

Surfacing preview is not authority.

This slice previews how caller-provided public-safe feedback aggregates, rule
failure candidates, candidate refs, bounded summaries, and surface metadata may
shape display hints. The output is a deterministic review aid. It is not truth,
proof, evidence, ranking authority, promotion readiness, durable Perspective
state, or product-write authority.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements `feedback_influenced_surfacing_preview_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Field, type, enum, and runtime
authority remains with this slice helper and the existing repo-local contracts
it consumes.

## 3. Relationship to PR #792 and PR #793

PR #792 Feedback Event Aggregation Runtime produces advisory public-safe
feedback aggregates and candidate-only rule failure candidates.

PR #793 Feedback Controls Expansion adds local UI intent controls and a
read-only audit panel without persistence.

This slice follows both boundaries. It consumes caller-provided bounded
aggregate-like objects and rule-failure-candidate-like objects and turns them
into preview-only display hints. It does not write feedback, persist
aggregation, call routes, read DB rows, or mutate candidates.

## 4. Scope and non-goals

In scope:

- Deterministic feedback-influenced surfacing preview helper.
- Read-only preview panel.
- Public-safe fixture.
- Static smoke validation.
- Browser/static readiness validation.
- Docs, package scripts, and latest-index pointer.

Out of scope:

- Feedback write route.
- Feedback event persistence.
- DB read/write.
- Candidate mutation or deletion.
- Candidate auto-hide.
- Promotion.
- Rule mutation.
- Parser mutation.
- Durable Perspective state mutation.
- Formation Receipt write.
- Promotion decision write.
- Proof/evidence creation.
- Claim/evidence writes.
- Product write or product ID allocation.
- Provider/OpenAI calls.
- Prompt sending.
- Retrieval/RAG execution.
- Source fetch or file reads as source input.
- Git Ledger export.
- Codex/GitHub automation.
- Background jobs, package dependencies, or GitHub Actions.

Feedback is not truth.

Feedback is not proof.

Feedback is not evidence.

Feedback is not promotion readiness.

Feedback influenced surfacing does not delete candidates.

Feedback influenced surfacing does not hide candidates silently.

Feedback influenced surfacing does not promote candidates.

Feedback influenced surfacing does not mutate rules.

Feedback influenced surfacing does not mutate parser behavior.

Feedback influenced surfacing does not mutate durable Perspective state.

Feedback influenced surfacing does not product-write.

Product-write remains parked by #686.

This PR does not add feedback write route.

This PR does not persist surfacing decisions.

This PR does not write DB.

This PR does not add routes.

## 5. Input shape

The input uses `feedback_influenced_surfacing_input.v0.1`,
`feedback_influenced_surfacing_preview.v0.1`, `scope: project:augnes`, a
public-safe preview id, an `as_of` timestamp, candidate inputs, feedback
aggregates, rule failure candidates, boundary notes, reason codes, and an
optional authority boundary object.

Candidate inputs include `candidate_ref`, `target_surface`,
`target_surface_ref`, `bounded_title`, `bounded_summary`, source refs, review
record refs, aggregate refs, rule failure candidate refs, `public_safe: true`,
and reason codes.

Feedback aggregates are bounded objects compatible with the PR #792 aggregate
shape. Rule failure candidates are bounded objects compatible with the PR #792
candidate-only rule failure shape.

Feedback aggregate count fields must be non-negative finite integers.

Malformed aggregate reason codes are rejected before preview build.

Aggregate-compatible inputs with candidate deletion, promotion, rule mutation,
parser mutation, durable state mutation, or product-write flags are rejected.

Source refs are lineage pointers, not proof.

Source refs must be public-safe symbolic refs.

## 6. Surfacing item shape

Each item uses `feedback_influenced_surfacing_item.v0.1` and includes the
candidate ref, target surface, target surface ref, bounded title, bounded
summary, source refs, review record refs, linked aggregate refs, linked rule
failure candidate refs, advisory display hints, warning booleans, reason codes,
and authority boundary.

Every item keeps:

- `advisory_only: true`
- `deletes_candidate: false`
- `hides_candidate_silently: false`
- `promotes_candidate: false`
- `mutates_rules: false`
- `mutates_parser: false`
- `mutates_durable_state: false`
- `product_write_executed: false`

## 7. Priority preview rules

Pin/useful feedback can elevate display hint but cannot promote.

Dismiss/wrong feedback can lower display hint but cannot delete.

Correction/invalidation feedback creates review warning only.

Needs-more-evidence creates review cue only.

Scope-overreach creates rule review cue only.

Priority preview values are `none`, `lower`, `normal`, `elevated`, and
`needs_review`. They are display hints only.

## 8. Visibility hint rules

Visible candidates remain visible. Lowered candidates use `lower_priority`
rather than deletion. Warning or review cases use `visible_with_warning` or
`needs_review`.

The helper never silently hides candidates. The `blocked_from_auto_hide` hint is
a boundary value, not a deletion authority.

## 9. Review attention hint rules

Correction and invalidation create review-required hints. Needs-more-evidence
creates `evidence_needed`. Scope-overreach creates `rule_review_needed`.
Stale-context feedback creates `stale_context_review_needed`.

Rule failure candidates are review aids.

Rule failure candidates do not mutate rules, mutate parser behavior, delete
candidates, promote candidates, write DB rows, create proof/evidence, or
product-write.

## 10. Candidate overlay hint rules

Candidate overlay hints are display hints only.

Aggregate-linked items may show an overlay. Warning, review, stale-context, or
rule-failure cases show an overlay with warning. Overlay hints are visually
separate from the durable graph and do not create durable Perspective state.

## 11. Preview panel rules

The preview panel is read-only. It accepts props only, uses local display state
only for selected-candidate presentation, and does not fetch, call routes,
persist data, write DB, call providers, send prompts, mutate candidates, delete
candidates, promote candidates, mutate rules, mutate parser behavior, mutate
durable state, or product-write.

The panel must keep visible labels for preview-only surfacing, advisory display
hints, no candidate deletion, no promotion, no durable state mutation, and
product-write remaining parked.

The panel should remain readable at a 390px viewport through compact labels and
wrapping rows.

## 12. Privacy and redaction rules

Fixtures and examples use bounded summaries and public-safe symbolic refs only.

Forbidden content includes private URLs, local private paths, tokens, secrets,
raw source text, raw provider output, raw retrieval output, raw feedback
payload, raw surfacing payload, hidden reasoning, raw conversation logs, browser
dumps, raw DB rows, actual prompt text, actual query text, embeddings, and
vector index dumps.

Blocked examples use bounded placeholder text only.

## 13. Authority boundary

The only active capability is preview-only advisory surfacing.

Denied authority includes feedback write, feedback persistence, candidate
mutation, candidate deletion, candidate auto-hide, rule mutation, parser
mutation, promotion execution, durable state write/apply, Formation Receipt
write, promotion decision record write, proof/evidence record write,
claim/evidence write, product write, product ID allocation, work mutation, DB
query/write, source fetch, local/repository/uploaded file reads, provider/OpenAI
calls, prompt sending, retrieval execution, RAG answer generation, embedding
creation, vector search, Git Ledger export, Codex execution authority, GitHub
automation authority, feedback truth/proof/evidence/promotion-readiness
authority, surfacing authority, ranking authority, and product-write authority.

## 14. Deferred work

- Dogfooding ingestion
- Runtime audit panel integration
- Git Ledger export
- Product write reentry

## 15. Verification expectations

Verification should run the new smoke, browser/static validation, PR #793
feedback controls smoke and browser/static validation, PR #792 feedback
aggregation smoke, downstream constellation/promotion/retrieval/provider/source
intake/review memory/foundation smokes listed by the handoff, `npm run
typecheck`, `git diff --check`, and `git diff --cached --check`.

Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings from direct TypeScript imports
are acceptable only when commands exit 0.

## 16. Next recommended slices

1. dogfooding_record_runtime_contract_v0_1
2. runtime_audit_panel_v0_1
3. git_ledger_export_contract_v0_1 only after audit/readiness review
4. product_write_reentry_review_v0_1 only after explicit reentry approval
5. release_readiness_matrix_v0_1
