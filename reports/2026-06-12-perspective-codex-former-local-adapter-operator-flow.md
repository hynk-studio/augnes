# Local Codex Adapter Operator Flow Report

## Summary

Implemented the local Codex adapter operator flow shell at `/cockpit/perspective/codex-former/local-adapter-operator-flow`.

This PR turns the closed v0.1 local adapter proof chain into a single user-facing route for the manual Augnes / Codex loop. The route shows source and prepare context, presents a bounded Copy For Codex packet, supports returned envelope paste/load, previews PASS / PASS with follow-up / BLOCKED validation results, shows warnings and `next_safe_action`, shows bounded candidate review material, and lets the user choose one local draft action.

## Changed Files

- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/page.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css`
- `lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts`
- `scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `package.json`

## Fixture Inputs

The route uses committed local adapter fixtures for:

- source input refs and hashes;
- prepare execution summaries and manual copy packet refs;
- returned envelope fixtures for PASS, PASS with follow-up, and BLOCKED;
- validate execution summaries for PASS, PASS with follow-up, and BLOCKED.

No raw fixture payload is inlined in the component or helper source.

## Local Draft Boundary

Candidate action controls are visible:

- `keep_review_only`
- `accept_as_perspective_candidate`
- `reject_from_memory_candidate`
- `supersede_previous_candidate`

They are local draft choices only. They create no accepted Augnes state, no review decision, no product DB persistence, no Core decision, no product readiness, no mergeability, no runtime handoff, and no automatic promotion.

## Persistence Boundary

The localStorage namespace is `augnes.codexFormer.localAdapterOperatorFlow.v0.1`.

Metadata is saved automatically. Returned envelope text is saved only when the user explicitly selects Save draft locally. The route does not persist hidden reasoning, provider logs, tokens, secrets, raw private material, raw source packets, browser dumps, raw diffs, raw review payloads, or raw candidate payloads by default.

## Verification

- `npm run smoke:perspective-codex-former-local-adapter-operator-flow` passed.
- `npm run browser:perspective-codex-former-local-adapter-operator-flow` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Browser validation at `http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-operator-flow` passed with 0 console warnings/errors, 0 unexpected external refs, 13 focusable controls, PASS/PASS with follow-up/BLOCKED fixture interaction coverage, and 0 horizontal overflow at 390px, 768px, and desktop.

## Scope Boundaries

This shell has no provider/model calls, no Codex SDK calls, no GitHub mutation, no DB writes, no network behavior, no automatic clipboard behavior, no accepted Augnes state, no review decision, and no Core decision behavior.
