# Perspective Memory Reuse Intake v0.1 Report

## Summary

Added a deterministic local CLI/helper as the Codex-facing entrypoint for Perspective Memory Reuse Intake v0.1.

The command:

```bash
npm run perspective:memory-reuse-intake -- --task "..."
```

reads persisted perspective-memory items, suggests accepted/reviewing items, generates `why_selected` and `reuse_boundary` suggestions, builds a structured reuse packet with `buildPerspectiveMemoryReusePacket`, prints a copyable Codex Memory Brief, and previews quality warnings with `buildPerspectiveMemoryReuseQualityReview`.

## Changed Files

- `lib/perspective-ingest/perspective-memory-reuse-intake.ts`
- `scripts/perspective-memory-reuse-intake.mjs`
- `scripts/smoke-perspective-memory-reuse-intake.mjs`
- `docs/PERSPECTIVE_MEMORY_REUSE_INTAKE_V0_1.md`
- `reports/2026-06-14-perspective-memory-reuse-intake.md`
- `package.json`

## Boundary

The intake is deterministic and local. It does not call providers/models, OpenAI API, MCP tools, Codex SDK, or GitHub. It does not persist reuse packets, create memory, mutate memory items, write Augnes state, change DB schema, start runtime, or create commit/reject authority.

Deprecated, retracted, and superseded memory items are excluded from automatic selection and surfaced as warning candidates only.

## Verification

Passed verification:

- `npm run smoke:perspective-memory-reuse-intake`
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

Skipped checks: none.
