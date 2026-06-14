# Dogfood Perspective Memory Reuse Return Binding v0.1

## Summary

Dogfood result: PASS with follow-up.

The merged Return Binding preview clearly links
`reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up candidate memory`
for the PR #551/#552 loop.

The preview is complete_enough_for_future_memory_review for this fixture. It
preserves changed files, verification, skipped checks with concrete reasons,
remaining friction, and a preview-only follow_up_candidate_memory_preview
without creating memory.

Next recommended PR: live-data browser/runtime reuse dogfood with seeded
persisted memory rows before adding any persisted return binding table.

## Environment

- Date: 2026-06-14
- Repository: `hynk-studio/augnes`
- Base: current `main` after PR #552 was merged.
- PR #552 merged prerequisite: yes, `Add Perspective Memory Reuse Return Binding v0.1`.
- PR #551 dogfood context: yes, `Dogfood Perspective Memory Reuse Packet v0.1`.
- Current-base drift noted: PR #554 and PR #555 have also merged and removed
  older dogfood report smoke overhead, including the old
  `smoke:perspective-memory-reuse-packet-dogfood-report` package script.
- Boundary for this PR: bounded dogfood report/smoke/package validation only.

No product/helper code changed; no blocker required changing
`lib/perspective-ingest/perspective-memory-reuse-return-binding.ts`.

## Dogfood task

Use the merged Return Binding helper to model the return from the PR #552 work
itself.

The fixture asks whether the preview can preserve this chain:

`reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up candidate memory`

It also asks whether the preview keeps operator-review material together:
changed files, verification, skipped checks with concrete reasons, remaining
friction, missing return sections, and follow_up_candidate_memory_preview.

## Return binding fixture/input used

- `reuse_packet_id`: `reuse-packet:pr-551-dogfood-context`
- `codex_run_ref`: `codex-run:pr-552-return-binding-preview`
- `returned_envelope_ref`: `returned-envelope:pr-552-pr-body`
- `returned_at`: `2026-06-14T10:53:47.000Z`
- `nowIso`: `2026-06-14T12:30:00.000Z`

Changed files from PR #552:

- `lib/perspective-ingest/perspective-memory-reuse-return-binding.ts`
- `docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md`
- `reports/2026-06-14-perspective-memory-reuse-return-binding.md`
- `scripts/smoke-perspective-memory-reuse-return-binding.mjs`
- `package.json`

Verification commands from PR #552:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-packet-dogfood-report`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Skipped checks with concrete reasons from PR #552:

- Runtime/browser validation skipped because PR #552 added no route and no
  runtime behavior; helper/static smoke and typecheck covered the slice.
- Runtime startup skipped because the preview layer did not require runtime.
- MCP bridge startup skipped because the preview layer did not require bridge
  behavior.
- MCP tools were not called because the boundary prohibited MCP tool calls.
- Provider/model checks and OpenAI API calls were not run because the boundary
  prohibited them.
- Codex SDK was not used because the boundary prohibited Codex SDK execution.
- Setup execution and setup/prepare polish skipped because PR #552 did not
  change setup/prepare behavior.
- Secrets and `~/.codex/config.toml` were not read or written because no
  credentialed behavior was needed.

Remaining friction from PR #552:

- PR #551 found that `/tmp/augnes-demo.db` had the
  `perspective_memory_items` table but zero persisted memory rows.
- Fixture-backed validation was useful, but live-data browser/runtime dogfood
  remains future work.
- Persisted return binding storage is not justified by this preview alone.

follow_up_candidate_memory_preview:

- title: `Dogfood Return Binding with the PR #551/#552 loop`
- summary: `Return Binding preserved the reuse-packet-to-Codex-return chain and should carry forward live-data browser/runtime reuse dogfood with seeded persisted memory rows before any persisted return binding table.`
- source_refs: `pr:551`, `pr:552`, `report:2026-06-14-perspective-memory-reuse-return-binding-dogfood`
- risk_notes: `preview-only; do not create memory automatically`, `fixture-backed validation does not prove live-data route usability`
- carry_forward_questions: `Do seeded persisted memory rows make browser/runtime reuse dogfood clear enough?`, `Is there a concrete product reason to persist return bindings now?`
- suggested_next_review_action: `Run live-data browser/runtime reuse dogfood with seeded persisted memory rows before storage work.`

## Binding preview result

The helper returns `perspective_memory_reuse_return_binding.v0.1` with this
operator-facing result:

- `binding_id`: `perspective-memory-reuse-return-binding:reuse-packet-pr-551-dogfood-context:codex-run-pr-552-return-binding-preview:returned-envelope-pr-552-pr-body`
- `reuse_packet_id`: `reuse-packet:pr-551-dogfood-context`
- `codex_run_ref`: `codex-run:pr-552-return-binding-preview`
- `returned_envelope_ref`: `returned-envelope:pr-552-pr-body`
- `complete_enough_for_future_memory_review`: true
- `missing_return_sections`: []
- `changed_file_count`: 5
- `verification_count`: 14
- `skipped_check_count`: 8
- `remaining_friction_count`: 3
- `has_follow_up_candidate_memory_preview`: true

The helper summary stayed short enough for operator review because it presented
the refs, changed files, verification, skipped checks, remaining friction, and
follow-up preview without expanding into the full returned envelope.

## Findings

- Did the binding preview preserve the relationship from reuse packet to Codex
  return? Yes. The chain stayed visible as
  `reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up candidate memory`.
- Did it make changed files easier to inspect? Yes. The changed files are
  deduped into one small list and can be compared directly to the PR #552 file
  set.
- Did it preserve verification and skipped checks clearly? Yes. Verification
  entries remain command-shaped, and skipped checks keep concrete reasons.
- Did it preserve remaining friction? Yes. The zero persisted memory rows,
  fixture-backed limitation, and storage-not-yet-justified decision all carried
  forward.
- Did missing-section detection help? Yes. A complete fixture reports
  `complete_enough_for_future_memory_review: true` and
  `missing_return_sections: []`; an intentionally empty fixture reports missing
  `reuse_packet_id`, `codex_run_ref`, `returned_envelope_ref`, `returned_at`,
  `changed_files`, `verification`, `skipped_checks`, `remaining_friction`,
  `follow_up_candidate_memory_preview.title`, and
  `follow_up_candidate_memory_preview.summary`.
- Was the follow-up candidate memory preview useful without creating memory?
  Yes. It captured what should be carried forward while keeping
  `preview_only: true` and memory creation false.
- Did the summary stay short enough for operator review? Yes. It is compact
  enough to scan before deciding whether the next PR is dogfood or persistence.
- Did it suggest live-data browser/runtime dogfood next, or persisted return
  binding table next? It suggests live-data browser/runtime reuse dogfood with
  seeded persisted memory rows next. It does not justify a persisted return
  binding table now.
- Did it reveal any stale/misleading memory or over-claim? No blocker in the
  Return Binding preview. It did reveal request drift on current `main`: after
  PR #552, PR #554 and PR #555 deleted older dogfood smoke overhead, so the old
  reuse-packet dogfood smoke should be skipped on this base rather than
  restored.

## User-facing/operator friction

- The binding is readable as a review artifact, but it is still fixture-backed.
- The lack of persisted rows in `/tmp/augnes-demo.db` means this cannot claim
  browser/runtime reuse is proven.
- The next operator-facing question is not storage. It is whether seeded memory
  rows make the reuse packet and Return Binding understandable in a live route.
- Current-base cleanup means the historical
  `smoke:perspective-memory-reuse-packet-dogfood-report` command is no longer
  available; treating that as a skipped check is less misleading than
  resurrecting deleted dogfood overhead.

## Changed files

This PR changes only:

- `reports/dogfood/2026-06-14-perspective-memory-reuse-return-binding-dogfood.md`
- `scripts/smoke-perspective-memory-reuse-return-binding-dogfood-report.mjs`
- `package.json`

No product/helper code changed unless a blocker was fixed. No blocker was
found, so no product/helper code changed.

## Verification

Passed locally for this dogfood PR:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

The PR #552 returned envelope also listed
`npm run smoke:perspective-memory-reuse-packet-dogfood-report`, but that package
script is absent on current `main` after the cleanup PRs that followed #552.

## Skipped checks with concrete reasons

- `npm run smoke:perspective-memory-reuse-packet-dogfood-report` skipped
  because the package script and backing report smoke were removed from current
  `main` by cleanup after PR #552. Re-adding it would exceed this bounded
  report/smoke/package PR.
- Runtime/browser validation skipped because this PR changes no route, UI, or
  browser-visible surface.
- Runtime startup skipped because this report/smoke/package validation does not
  require an app process.
- MCP bridge startup skipped because no bridge behavior changed.
- MCP tool calls skipped because the boundary forbids adding MCP tool calls.
- Provider/model checks and OpenAI API calls skipped because the boundary
  forbids provider/model calls and OpenAI API calls.
- Codex SDK execution skipped because the boundary forbids Codex SDK execution.
- Setup execution and setup/prepare polish skipped because this PR does not
  change setup/prepare behavior.
- Default/user DB inspection skipped because this PR must not perform
  default/user DB writes and does not need DB state.

## Cleanup status

- No runtime process was started, so no runtime process needed stopping.
- No bridge process was started, so no bridge process needed stopping.
- No database was created, migrated, seeded, or written.
- No default/user DB path was read or written.
- No setup-generated changes were created.
- No temporary report or fixture files remain.

## Remaining friction

- Live-data browser/runtime reuse dogfood remains future work.
- Seeded persisted memory rows are still needed before claiming the route-level
  reuse workflow is proven.
- The current report can describe follow-up candidate memory, but it does not
  and should not create memory.
- A persisted return binding table still lacks a concrete product reason.

## Boundary

This PR is a bounded dogfood validation PR for the merged Return Binding
preview. It adds no runtime authority, DB schema changes, migrations,
setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK
execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes,
perspective-memory persistence writes, reuse packet persistence, return binding
persistence, product boundary creation, automatic synthesis, automatic memory
creation, default/user DB writes, hidden background daemons, or Augnes state
commit/reject authority.

It does not add runtime authority, DB schema changes, migrations,
setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK
execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes,
perspective-memory persistence writes, reuse packet persistence, return binding
persistence, product boundary creation, automatic synthesis, automatic memory
creation, default/user DB writes, hidden background daemons, or Augnes state
commit/reject authority.

The scripts in this PR do not perform GitHub mutation from scripts and do not
write proof/evidence rows, memory rows, reuse packets, return bindings,
product boundary records, or Augnes state.

## Next recommended PR

Next recommended PR: live-data browser/runtime reuse dogfood with seeded
persisted memory rows before adding any persisted return binding table.

Only recommend a persisted return binding table if live-data dogfood produces a
concrete product reason that persistence is needed now.
