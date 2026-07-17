# Augnes Research Accumulation Scenario Pack v0.1

## Purpose

This scenario pack defines the first preview-only contract for a future
Research / Paper / Knowledge Accumulation surface in Augnes.

It is a docs/smoke artifact for `AG-DOGFOOD-RESEARCH-001`. The current pack
does not ingest papers, fetch papers, call providers, create embeddings, index
content, define database tables, or write durable research state. That is the
current preview implementation status, not a permanent product ban. It gives
operators and Codex workers a shared vocabulary for what future research
accumulation previews may show once implementation is separately authorized.

## Source Work Routing

- Work ID: `AG-DOGFOOD-RESEARCH-001`
- Scope: `project:augnes`
- Source scenario:
  `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md`
- Source seeded work item: `scripts/demo-seed.mjs`
- Selected by:
  `docs/AUGNES_CORE_HANDOFF_CURRENT_TASK_USAGE_STATUS_DOGFOOD_OBSERVATION_V0_1.md`

The seeded work item is historical preview material. Any new native-host work
uses the persisted packet and automatic structured `RunReceipt` return path;
this pack does not define result intake.

## Preview Shapes Only

The shapes below are display and handoff contracts. They are not database
schemas, API route contracts, provider prompts, extraction pipelines, durable
state records, proof rows, evidence rows, event records, or work-status
mutations.

Every preview shape must preserve candidate status and human-review status
explicitly. A candidate can support later human review, but it is not accepted
knowledge, committed state, proof, evidence, closure authority, or approval.

## Preview-scope Stop Conditions, Not Permanent Product Bans

The stop conditions in this pack apply to the current preview-only docs/smoke
work. They mean stop if this work would require unscoped fetching, crawling,
provider calls, retrieval indexing, persistence, proof/evidence writes, work
mutation, or state mutation.

They do not mean Augnes can never grow research capability lanes. A future
fresh Work Brief or Core Handoff may authorize bounded product-facing lanes
when it names the lane, expected files, expected checks, authority boundary,
source limits, and verification evidence. Future authorized lanes may include:

- manual source intake
- bounded source fetching for operator-provided sources
- provider-assisted extraction or summary
- derived retrieval indexes, including FTS, embedding, vector, or RAG-style
  retrieval
- durable research candidate memory
- human-reviewed perspective promotion

Provider, fetch, and retrieval results remain non-authoritative candidates
until human review. Derived retrieval indexes must be rebuildable,
non-authoritative, and source-ref based; they cannot create proof/evidence
rows, committed perspective state, work closure, approval, or Augnes state
commit/reject authority by themselves. Durable research writes, when separately
authorized, should write candidate or review records first, not committed
perspective state directly. Perspective update candidates remain candidates
until human review, promote, and commit gates are explicitly implemented.

## Shape Catalog

### research_session_preview

Purpose: show the bounded research question and current accumulation state for
one operator-led reading session.

Preview fields:

- `session_id`
- `scope`
- `work_id`
- `research_question`
- `operator_intent`
- `session_status`
- `source_refs`
- `paper_reference_count`
- `claim_candidate_count`
- `evidence_candidate_count`
- `tension_candidate_count`
- `knowledge_gap_candidate_count`
- `perspective_update_candidate_count`
- `follow_up_work_candidate_count`
- `review_status`
- `boundary_notes`

### paper_reference_preview

Purpose: show one paper or source reference without fetching, normalizing, or
enriching it automatically.

Preview fields:

- `paper_reference_id`
- `title`
- `authors`
- `venue`
- `year`
- `identifier_or_url`
- `reference_source`
- `source_status`
- `reading_status`
- `operator_note_summary`
- `linked_claim_candidate_ids`
- `review_status`
- `boundary_notes`

### claim_candidate

Purpose: show a candidate claim extracted or summarized by a human or a future
authorized workflow.

Preview fields:

- `claim_candidate_id`
- `paper_reference_id`
- `claim_text`
- `claim_type`
- `confidence_label`
- `supporting_evidence_candidate_ids`
- `contradicting_evidence_candidate_ids`
- `review_status`
- `boundary_notes`

### evidence_candidate

Purpose: show candidate support, contradiction, or context for a claim without
turning it into proof/evidence rows.

Preview fields:

- `evidence_candidate_id`
- `paper_reference_id`
- `claim_candidate_id`
- `evidence_summary`
- `evidence_role`
- `locator`
- `quality_note`
- `review_status`
- `boundary_notes`

### tension_candidate

Purpose: show a possible contradiction, uncertainty, or unresolved comparison
between candidate claims or evidence.

Preview fields:

- `tension_candidate_id`
- `summary`
- `related_claim_candidate_ids`
- `related_evidence_candidate_ids`
- `tension_type`
- `operator_question`
- `review_status`
- `boundary_notes`

### knowledge_gap_candidate

Purpose: show missing knowledge that should remain explicit instead of being
filled by inference or provider calls.

Preview fields:

- `knowledge_gap_candidate_id`
- `summary`
- `why_it_matters`
- `related_claim_candidate_ids`
- `related_tension_candidate_ids`
- `suggested_next_reading`
- `review_status`
- `boundary_notes`

### perspective_update_candidate

Purpose: show a possible future update to an Augnes perspective or project
memory without committing state.

Preview fields:

- `perspective_update_candidate_id`
- `target_state_key`
- `proposed_update_summary`
- `basis_claim_candidate_ids`
- `basis_evidence_candidate_ids`
- `risk_or_conflict_note`
- `review_status`
- `boundary_notes`

### follow_up_work_candidate

Purpose: show a possible follow-up work item seed without creating work,
opening issues, dispatching Codex, or changing work status.

Preview fields:

- `follow_up_work_candidate_id`
- `candidate_title`
- `candidate_scope`
- `candidate_summary`
- `reason`
- `suggested_expected_files`
- `suggested_expected_checks`
- `review_status`
- `boundary_notes`

## Scenario Flow

1. Operator chooses or writes a research question.
2. Operator attaches paper references manually or through a future authorized
   flow.
3. Reading notes produce candidate claims and candidate evidence.
4. The preview groups tensions and gaps without resolving them automatically.
5. The preview proposes possible perspective updates and follow-up work as
   candidates only.
6. A human reviews candidates before any future state, proof, evidence, event,
   or work mutation.

## Expected Files And Checks

Expected files:

- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
- `scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
- `package.json`

Expected checks:

- `node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
- `git diff --check`

Broader local verification may also run `npm run typecheck` and
`npm --prefix apps/augnes_apps run typecheck`, but those checks are not proof
of live Work Contract Card observation, runtime Work Brief retrieval, or
Augnes close authority.

## Authority Boundaries

This pack is preview-only docs/smoke contract work. In this preview scope, it
adds:

- no unscoped automatic research ingestion
- no unscoped paper or source fetching
- no unscoped crawlers
- no unscoped provider/OpenAI calls
- no unscoped embeddings
- no unscoped RAG
- no unscoped vector search
- no unscoped indexing
- no database schema or migration in this preview pack
- no durable research candidate memory writes
- no proof/evidence writes
- no event creation/mutation
- no work close/status mutation
- no state commit/reject
- no perspective update commits
- no automatic work item creation
- no automatic Codex execution
- no shell execution from App/MCP
- no automatic GitHub fetch/review/merge/publish controls
- no branch or PR creation from App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no new user-facing App/MCP tools
- no widening of the `work_loop_readonly` Developer Mode tool surface

## Stop Conditions

Stop instead of implementing this preview-only pack if the requested work
requires any of these without a fresh Work Brief or Core Handoff that
explicitly authorizes the bounded lane:

- fetching or crawling papers or sources
- calling providers or OpenAI
- creating embeddings, RAG, vector search, FTS, or other retrieval indexes
- adding database schema, migrations, durable research candidate memory writes,
  proof rows, or evidence rows
- creating or mutating events, work status, state, committed perspective
  memory, or follow-up work
- adding App/MCP tools or widening `work_loop_readonly`
- claiming live MCP Inspector, ChatGPT Developer Mode, or host observations
  without actually running them

Do not stop merely because a future product task names one of those lanes. If
the fresh Work Brief or Core Handoff explicitly authorizes the lane, expected
files, checks, authority boundary, and verification, then follow that newer
contract and keep candidates non-authoritative until human review.

## Result Return Contract

Codex worker results for this pack should use the field-first result report
shape and include concrete skipped-check reasons. If no live MCP Inspector or
ChatGPT Developer Mode session was started, report that explicitly. If runtime
Work Brief retrieval was skipped or unavailable, report the repo-backed fallback
instead of implying live retrieval.

The former pasted-report return path is retired. New execution results return
automatically through the shared native-host lifecycle and canonical receipt
authority.

## What This Pack Does Not Implement

This current v0.1 pack does not implement a research product surface. In this
preview-only docs/smoke slice, it does not implement paper ingestion, paper
fetching, metadata normalization, provider calls, embeddings, RAG, vector
search, indexing, database persistence, durable research candidate memory,
proof/evidence recording, event creation, work closure, automatic follow-up
creation, GitHub automation, Codex execution, or a new App/MCP tool surface.
Those omissions describe current implementation status and do not forbid a
future explicitly scoped capability lane.

## Next Recommended Step

Use this scenario pack as the preview-only contract for later human-reviewed
Research / Paper / Knowledge Accumulation design or implementation work. Any
future implementation should start from a fresh Augnes Work Brief or Core
Handoff, name the authorized capability lane, and keep authority boundaries and
candidate-review gates visible.
