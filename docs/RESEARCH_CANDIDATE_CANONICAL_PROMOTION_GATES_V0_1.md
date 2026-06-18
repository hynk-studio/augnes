# Augnes Research Candidate Canonical Promotion Gates v0.1

## Purpose

This slice defines a static audit for preventing raw research/source strings
from becoming canonical labels, operational tags, dashboard keys, task schema
IDs, or evidence metadata promoted keys.

Research candidate review may preserve unstable source strings as display
text, source pointers, local candidate IDs, or public-safe audit samples. This
gate keeps those strings candidate/pointer/raw-only unless they are explicitly
allowed as closed, low-cardinality vocabulary.

## Source Work Routing

- Work ID: `AG-RESEARCH-CANDIDATE-CANONICAL-GATES-001`
- Scope: `project:augnes`
- Related state keys:
  - `research.candidate_review`
  - `research.canonical_promotion_gates`
  - `perspective.development`

## Relationship To Research Candidate Review Surface

This gate follows the Research Candidate Review contract artifacts:

- `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`
- `types/research-candidate-review.ts`
- `fixtures/research-candidate-review.sample.v0.1.json`
- `scripts/smoke-research-candidate-review-types-v0-1.mjs`

This PR does not change the Research Candidate Review preview contract. It adds
a static gate around how raw source/candidate strings may be used in future
slices.

This gate is static audit only and non-authoritative.

## Threat Model

A raw title, URL, provider ID, thread ID, arbitrary user label, or demo DB ref
can look stable enough to become a state key or operational tag. That pollutes
ontology, dashboards, task routing, and future evidence metadata.

Examples to block:

- paper title becoming `target_perspective_key`
- source URL becoming `dashboard_group_key`
- provider run ID becoming `operational_tag`
- raw thread ID becoming `task_schema_id`
- arbitrary pasted user label becoming `canonical_state_label`
- demo DB ref becoming evidence metadata promoted key

## Gate Vocabulary

`input_class` values:

- `source_title`
- `source_url`
- `doi_or_identifier`
- `provider_id`
- `workspace_id`
- `thread_id`
- `run_id`
- `raw_session_id`
- `arbitrary_user_string`
- `episode_id`
- `demo_db_ref`
- `source_ref_id`
- `candidate_id`
- `repo_path`
- `work_id`
- `low_cardinality_enum`

`proposed_usage` values:

- `raw_display`
- `source_pointer`
- `local_candidate_id`
- `local_preview_id`
- `review_label`
- `canonical_state_label`
- `dashboard_group_key`
- `task_schema_id`
- `evidence_metadata_promoted_key`
- `operational_tag`
- `type_union_literal`

`disposition` values:

- `blocked_canonical_promotion`
- `raw_only`
- `source_pointer_only`
- `candidate_id_only`
- `allowed_repo_path_pointer`
- `allowed_work_id_pointer`
- `allowed_low_cardinality_enum`

## Blocked Promotion Targets

For unstable/raw input classes, these proposed usages are blocked:

- `canonical_state_label`
- `dashboard_group_key`
- `task_schema_id`
- `evidence_metadata_promoted_key`
- `operational_tag`

The blocked input classes are:

- `source_title`
- `source_url`
- `doi_or_identifier`
- `provider_id`
- `workspace_id`
- `thread_id`
- `run_id`
- `raw_session_id`
- `arbitrary_user_string`
- `episode_id`
- `demo_db_ref`

## Allowed Pointer And Candidate Uses

- `source_ref_id` may be used as a local preview pointer, not as a canonical
  state label.
- Candidate IDs may be used inside a candidate bundle, not as global
  operational tags.
- Repo paths may be used as source pointers, not as newly invented state
  labels.
- Work IDs may be used as existing work pointers, not as arbitrary
  research-derived labels.
- Raw titles/URLs may appear as display/reference fields only.

## Allowed Low-Cardinality Vocabulary

Closed, documented union values may be used as labels because they are
controlled vocabulary.

Allowed examples from `types/research-candidate-review.ts`:

- `review_status` values
- `epistemic_status` values
- `delta_type` values
- `promotion_readiness` values
- `evidence_role` values
- `tension_type` values
- authority boolean fields from `ResearchCandidateReviewAuthority`

## Gate Rules

### RCR-GATE-001

Raw source strings must not become canonical labels.

### RCR-GATE-002

Provider/workspace/thread/run/session IDs must not become operational tags or
task schema IDs.

### RCR-GATE-003

Source URLs and DOI-like identifiers remain source pointers or raw display
fields only.

### RCR-GATE-004

Candidate IDs remain local preview IDs unless a later explicit durable record
design says otherwise.

### RCR-GATE-005

Only closed low-cardinality vocabulary from the type contract may be used as
review/status labels.

### RCR-GATE-006

`target_perspective_key` must not be copied from source titles, URLs,
DOI/provider IDs, raw thread IDs, or arbitrary pasted user strings.

### RCR-GATE-007

Future durable candidate/review storage must store raw unstable strings as
raw/source fields, not promoted ontology keys.

### RCR-GATE-008

This gate is a static audit slice, not a permanent ban on future bounded source
intake, retrieval, or durable review records.

This gate does not permanently ban future bounded research lanes.

## Sample Fixture Contract

The public-safe sample fixture is:

- `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`

It includes blocked promotion samples, allowed pointer samples, allowed
low-cardinality samples, and the static audit surface file list.

## Static Audit Scope

The smoke checks only static docs/fixture/type/sample surfaces. It does not
call runtime, DB, network, API routes, MCP/App tools, OpenAI, GitHub, or
external services.

This slice has no runtime/API/DB/provider/retrieval/persistence behavior.

## Expected Files And Checks

Expected files:

- `docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md`
- `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`
- `scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
- `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `package.json`

Expected checks:

- `node scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
- `npm run smoke:research-candidate-canonical-promotion-gates-v0-1`
- `npm run smoke:research-candidate-review-types-v0-1`
- `npm run smoke:research-candidate-review-surface-v0-1`
- `git diff --check`
- `npm run typecheck`

## Scoped Stop Conditions

Stop if this PR would require runtime/API/DB/provider/retrieval/persistence/UI
or type redesign behavior.

Also stop if the work would require source fetching, crawler behavior,
provider/OpenAI calls, embeddings/RAG/vector/FTS/indexing, durable research
writes, candidate/review record storage, proof/evidence writes, perspective
promotion, work status mutation, state commit/reject, App/MCP tool changes,
package dependencies, or automatic Codex/GitHub automation inside Augnes
runtime.

## What This Slice Implements

This slice implements only:

- docs gate contract
- public-safe gate fixture
- static smoke
- docs/index pointer
- package script pointer

## What This Slice Does Not Implement

This slice does not implement runtime UI, API routes, DB schema or migrations,
source fetching, crawler behavior, provider/OpenAI calls,
embeddings/RAG/vector/FTS/indexing, durable research writes,
candidate/review record storage, proof/evidence writes, perspective promotion,
work status mutation, state commit/reject, App/MCP tool changes, package
dependencies, automatic Codex execution inside Augnes runtime, or GitHub
automation inside Augnes runtime.

## Next Recommended Step

Add a manual pasted research note parser preview-only slice that keeps raw
source strings raw/source-bound and preserves canonical promotion gates.
