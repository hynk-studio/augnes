# Codex Dogfood Index

Date: 2026-05-25

## Runs

| Run | Report | Status | Scope |
| --- | --- | --- | --- |
| 001 | `reports/dogfood/2026-05-25-codex-dogfood-run-001.md` | needs review | Independent execution-layer dogfood across onboarding, runtime, Cockpit, bridge, Codex helpers, evidence, temporal preview, authority boundaries, stale docs, and next-goal generation. |

## Current Review Queues

Product judgment:

- Decide whether proof helpers should create `external.*` committed state entries.
- Decide whether state-level handoff should always expose a current `work_id`.
- Decide whether "check" commands should ever write proof by default.

Design:

- Clarify Cockpit bridge-enabled status in UI/health cues.
- Reduce stale five-tab/six-tab naming confusion.
- Improve testability of read-only panels and controls.

Engineering:

- Add or document root `codex:handoff-check`.
- Improve validation errors for publish/review-artifact boundary failures.
- Add browser regression suite for Cockpit read-only flows.

Docs:

- Restore or replace missing dogfood docs.
- Quote shell-fragile URLs.
- Align quickstart migration steps.
- Clarify that Developer Mode/tunnel checks are optional and must be skipped with concrete reasons when unavailable.

Security:

- Keep authority-boundary negative tests in smoke/regression coverage.
- Confirm bridge health/status cannot leak secrets while still showing bridge mode clearly.

## Evidence IDs From Run 001

- `evidence:f66fbc46-5735-4afb-ad48-9a19ede1a745`: skipped ChatGPT Developer Mode check, reason `No HTTPS tunnel or ChatGPT Developer Mode session was available.`
- `evidence:fa153949-6b9a-47af-ae05-8db4eb1499b3`: passed root typecheck command.

## Action IDs From Run 001

- `action:ff453676-50bd-405c-bc91-d67f8be06bc4`: dogfood independent execution-layer test completion, `needs_review`.
- `action:49913eaa-e6a0-4a45-a85a-c117a7280e9f`: app-prefix Codex handoff check, `completed`.

## Recommended Next /goal

```text
/goal Fix Augnes dogfood documentation drift only. Add or update the missing dogfooding docs/index references, quote shell-fragile curl URLs, and do not modify runtime behavior.
```
