# Dogfood Perspective Memory Reuse Intake v0.1

## Summary

Result: PASS with follow-up.

Perspective Memory Reuse Intake v0.1 was dogfooded after PR #565 was merged
into `main`. The command avoided opening the reuse workspace manually and
produced a useful Codex Memory Brief from one local deterministic command
against an explicit seeded temp DB.

The output was useful enough to guide Codex work, with three concrete friction
points for a narrow follow-up: exact-intake ranking should beat generic compact
brief metadata, no-match copy should better distinguish an available DB with no
matches from an empty/unreadable store, and `compact_brief_recommended` should
say what Codex should trim or preserve.

Next recommended PR: Perspective Memory Reuse Intake v0.2 ranking and copy
polish for ranking, no-match output, `--brief` length guidance, and compact
brief guidance. Do not add storage or persistence.

No product/helper/CLI code changed in this PR. Report-only validation was
sufficient because the intake command completed, read the explicit DB, selected
plausible items, generated `why_selected` and `reuse_boundary`, and surfaced
quality warnings without a blocker.

## Environment

- Repository: `hynk-studio/augnes`
- Branch: `codex/perspective-memory-reuse-intake-dogfood`
- Prerequisite: PR #565 was merged into `main`.
- PR #565 merge commit on local `main`: `b0b6956`
- Explicit seeded temp DB path:
  `/tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db`
- Seeded temp DB row count: 5 persisted perspective-memory items
- Intake command under dogfood:
  `npm run perspective:memory-reuse-intake -- --task "..." --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db`
- Compact brief command under dogfood:
  `npm run perspective:memory-reuse-intake -- --task "..." --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db --brief`
- Optional structured command:
  `npm run perspective:memory-reuse-intake -- --task "..." --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db --json`

Dogfood task string:

```text
Review whether Perspective Memory Reuse Intake v0.1 produces a useful Codex Memory Brief for the next bounded Augnes development slice, and identify any ranking, warning copy, no-match, or compact-brief friction.
```

The seeded temp DB was setup-only. The intake command itself did not create
memory items, mutate memory items, persist reuse packets, persist quality
reviews, change schema, or write to a default/user DB.

## Command Result

The command read five persisted items through `listPerspectiveMemoryItems`:

- `candidate_source.read_via: listPerspectiveMemoryItems`
- `candidate_source.total_items_read: 5`
- `candidate_source.total_matched_candidates: 5`
- `candidate_source.active_candidate_count: 3`
- `candidate_source.excluded_candidate_count: 2`
- `selected_item_count: 3`

Selected memory IDs:

1. `perspective-memory-item:compact-brief-guidance-accepted`
2. `perspective-memory-item:intake-command-v0-1-accepted`
3. `perspective-memory-item:intake-warning-copy-reviewing`

Excluded warning candidates:

- `perspective-memory-item:superseded-no-match-copy-sketch`
- `perspective-memory-item:deprecated-storage-first-intake-sketch`

The selected IDs were useful, but the top ranking exposed friction: the compact
brief metadata item ranked above the exact PR #565 intake command item because
it matched many task terms across more fields. For a Codex-facing intake task,
the direct command memory felt like the better first item even with a lower
score.

## why_selected

The `why_selected` suggestions were understandable and paste-ready enough for
Codex. They named matched task keywords, matched fields, item status, and the
PASS-with-follow-up caveat for the reviewing item.

Representative output:

```text
Matched task keywords perspective, memory, reuse, intake, codex, brief, bounded, augnes in content.title (perspective, memory, reuse, intake); content.summary (perspective, memory, reuse, intake, codex); content.source_refs (perspective, memory, reuse, intake, augnes); item status is accepted.
```

Friction: the phrasing is mechanically honest but long. In the compact `--brief`
form, three selected items pushed the Codex Memory Brief to 6,759 characters and
58 lines.

## reuse_boundary

The `reuse_boundary` suggestions were conservative enough. They consistently
bounded reuse to Augnes prior context and explicitly denied runtime authority,
current-truth authority, memory creation, state mutation, packet persistence,
provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls,
GitHub mutation, and Augnes state commit/reject authority.

Representative output:

```text
Reuse only as bounded Augnes prior context for matched fields content.title, content.summary, content.source_refs, content.evidence_refs, content.carry_forward_questions. Do not treat it as runtime authority, current truth, or permission to create memory, mutate state, persist packets, start providers/models, call OpenAI API, use Codex SDK, call MCP tools, mutate GitHub, or commit/reject Augnes state.
```

## Codex Memory Brief

The Codex Memory Brief felt paste-ready for Codex because it included the task,
selected memory IDs, summaries, source refs, why relevant text, boundaries,
reuse instructions, return expectations, and authority boundary.

The `--brief` output was the right format for a Codex worker, but it was not
compact in practice for three selections:

- `codex_memory_brief_character_count: 6759`
- `codex_memory_brief_line_count: 58`
- `selected_item_count: 3`
- `has_large_selection_warning: true`
- `compact_brief_recommended: true`

Friction: `--brief` remained paste-ready, but it did not give Codex an obvious
way to shorten the brief while preserving selected IDs, `why_selected`, and
`reuse_boundary`.

## quality_review_preview_summary

The `quality_review_preview_summary` helped. It turned the reviewing
PASS-with-follow-up row and large selection into an operator-visible warning
without blocking command usage:

```text
preview_state: needs_operator_review
reviewable_item_count: 2
needs_operator_review_count: 1
missing_why_selected_count: 0
missing_reuse_boundary_count: 0
compact_brief_recommended: true
large_selection_warning: true
suggested_next_action: Operator review required before treating reuse as high-quality.
```

Warning behavior was correct. Deprecated and superseded items were excluded
from automatic selection and appeared as warning candidates:

- `Excluded superseded perspective-memory item perspective-memory-item:superseded-no-match-copy-sketch; operator review required before reuse.`
- `Excluded deprecated perspective-memory item perspective-memory-item:deprecated-storage-first-intake-sketch; operator review required before reuse.`
- `Quality review preview has items needing operator review.`
- `Quality review preview recommends compact brief review.`

## No-Match Probe

The no-match probe used the same explicit DB:

```bash
npm run perspective:memory-reuse-intake -- --task "Investigate billing webhook retries for a remote payments integration" --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db --brief
```

Result:

- No persisted perspective-memory items selected.
- `preview_state: needs_operator_review`
- `suggested_next_action: Select persisted perspective-memory items before quality review.`
- warning: `No accepted/reviewing perspective-memory items matched the task.`

The warning was accurate, but the copy needs polish. Because the DB did contain
readable persisted items, `Select persisted perspective-memory items before
quality review` could mislead Codex into thinking no store data existed. The
better action would distinguish: explicit DB read succeeded, persisted items
were available, but no accepted/reviewing item matched this task.

## Required Questions

- Did the command avoid opening the reuse workspace manually? Yes.
- Did it select plausible memory items? Yes, with ranking caveat.
- Were selected IDs useful? Yes.
- Were `why_selected` suggestions understandable? Yes.
- Were `reuse_boundary` suggestions conservative enough? Yes.
- Did stale/deprecated/retracted/superseded warnings behave correctly? Yes;
  deprecated and superseded matches were excluded and warned. Retracted was not
  separately seeded in this run, but it uses the same inactive-status warning
  path.
- Did the Codex Memory Brief feel paste-ready for Codex? Yes, but long.
- Did `quality_review_preview_summary` help? Yes.
- Did no-match or low-match output need better copy? Yes.
- Did `compact_brief_recommended` create actionable guidance? Partly; it warned
  correctly, but the action text should say what to trim or preserve.
- Did this reveal a need to change ranking thresholds, warning copy, or output
  format? Yes: ranking priority, no-match copy, and compact brief guidance.
- Did this reveal any reason for storage/persistence? No.

## Boundary

This PR is dogfood/report/smoke/package only.

It does not add:

- no provider/model calls
- no OpenAI API calls
- no MCP tool calls
- no Codex SDK execution
- no GitHub mutation from scripts
- no persistence writes
- no DB schema or migration
- no automatic memory creation
- no memory item mutation
- no Augnes state commit/reject authority
- no runtime authority
- no setup/prepare polish
- no proof/evidence writes
- no perspective-memory persistence writes
- no reuse packet persistence
- no return binding persistence
- no quality review persistence
- no product boundary creation
- no automatic synthesis
- no default/user DB writes
- no hidden background daemons

The only writes performed during dogfood were explicit temp DB seed setup under
`/tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db` and the expected
report/smoke/package files in this PR.

## Verification

Dogfood commands passed:

- `npm run perspective:memory-reuse-intake -- --task "Review whether Perspective Memory Reuse Intake v0.1 produces a useful Codex Memory Brief for the next bounded Augnes development slice, and identify any ranking, warning copy, no-match, or compact-brief friction." --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db`
- `npm run perspective:memory-reuse-intake -- --task "Review whether Perspective Memory Reuse Intake v0.1 produces a useful Codex Memory Brief for the next bounded Augnes development slice, and identify any ranking, warning copy, no-match, or compact-brief friction." --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db --brief`
- `npm run --silent perspective:memory-reuse-intake -- --task "Review whether Perspective Memory Reuse Intake v0.1 produces a useful Codex Memory Brief for the next bounded Augnes development slice, and identify any ranking, warning copy, no-match, or compact-brief friction." --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db --json`
- `npm run perspective:memory-reuse-intake -- --task "Investigate billing webhook retries for a remote payments integration" --db-path /tmp/augnes-perspective-memory-reuse-intake-dogfood/augnes.db --brief`

Repository verification for this PR:

- `npm run smoke:perspective-memory-reuse-intake`
- `npm run smoke:perspective-memory-reuse-intake-dogfood-report`
- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-quality-review`
- `npm run smoke:perspective-memory-reuse-quality-review-dogfood-report`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report`
- `npm run smoke:perspective-memory-reuse-quality-review-panel-dogfood-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Concrete Reasons

- Default/user DB validation skipped because this dogfood required an explicit
  known DB path and must not read or write default/user DB paths.
- Browser/runtime validation skipped because this is a local CLI intake command
  and no browser-visible surface changed.
- MCP bridge startup skipped because the command must not require bridge
  behavior.
- Provider/model checks skipped because the boundary prohibits provider/model
  calls.
- OpenAI API calls skipped because the boundary prohibits OpenAI API calls.
- Codex SDK execution skipped because the boundary prohibits Codex SDK
  execution.
- GitHub mutation from scripts skipped because scripts must not mutate GitHub.
- Product/helper/CLI code changes skipped because dogfood did not reveal a
  blocker that report-only validation could not describe.

## Next Recommended PR

Next recommended PR: Perspective Memory Reuse Intake v0.2 ranking and copy
polish.

Suggested scope:

- Rank exact intake/command memories ahead of broad metadata memories when the
  task names the intake command directly.
- Improve no-match copy to distinguish missing DB, empty DB, unreadable rows,
  and readable persisted rows with no accepted/reviewing matches.
- Make `compact_brief_recommended` actionable by telling Codex what to trim and
  what to preserve.
- Keep `--brief` paste-ready while making large-selection guidance clearer.

Do not recommend storage/persistence. This dogfood produced no concrete product
reason for storage, persisted reuse packets, quality review persistence, return
binding persistence, automatic memory creation, or memory item mutation.
