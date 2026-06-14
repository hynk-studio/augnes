# Codex Former Returned Envelope Intake Report

## Summary

This adds a repo-local returned-envelope intake path for the existing local-adapter operator flow. It automates manual paste + manual local validation by reading one bounded file from `reports/intake/codex-former-returned-envelopes/` and running the existing validation bridge.

The candidate draft creation remains user-controlled. The intake path is not candidate acceptance and not memory persistence.

## Boundary

The helper enforces a path safety boundary that allows only normalized relative refs under `reports/intake/codex-former-returned-envelopes/`. It blocks arbitrary paths, traversal, absolute refs, symlinks, non-files, empty files, and oversized files without committing large invalid fixtures.

The implementation creates no DB write, no memory write, no Core/runtime/provider/GitHub mutation, no candidate draft, no memory review queue item, no local write proposal, no checklist record, no product persistence boundary record, no vector search, and no embeddings.

## Verification Plan

- `npm run smoke:perspective-codex-former-local-adapter-returned-envelope-intake`
- `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- `npm run browser:perspective-codex-former-local-adapter-operator-flow`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
