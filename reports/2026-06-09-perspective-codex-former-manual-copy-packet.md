# Perspective Codex Former Manual Copy Packet V0.1

Conclusion: PASS with follow-up

Recommended next implementation PR title: Dogfood manual Codex former draft copy packet with a real Codex response transcript

## Summary

This PR adds a pure local Manual Codex Former Draft Copy Packet. It lets a
human review and copy bounded prompt text into a user-started Codex session,
then paste the returned `CodexPerspectiveCandidateDraft` JSON back into Augnes
local validation.

## What PR #479 Enabled

PR #479 added the prompt-contract layer:

`CodexPerspectiveFormerInputPacket -> local prompt contract text -> future CodexPerspectiveCandidateDraft`

That contract made the future draft instructions explicit: neutral perspective
beyond summary, pointer-only refs, basis quality, unresolved tensions,
next-action candidates, user/Core questions, false authority, and
draft/review-only output.

## What The Manual Copy Packet Adds

The manual copy packet wraps the former input packet and prompt contract into a
reviewable local copy object. It adds:

- `copy_status`;
- copyable prompt text;
- expected `CodexPerspectiveCandidateDraft` response contract;
- returned draft validation instructions;
- manual review checklist;
- unsafe material policy;
- authority boundary;
- browser/computer-use validation decision;
- false authority flags.

## How A Human Uses The Packet

The human reviews the packet first. If the status and checklist are acceptable,
the human copies `copyable_codex_prompt_text` into a user-started Codex session.

The returned JSON is then reviewed and pasted back into Augnes local validation
with the same former input packet.

## What Is Copied Into Codex

Only bounded manual prompt text is copied:

- role `codex_perspective_former`;
- bounded former input packet summary;
- PR #479 prompt contract instructions;
- exact `CodexPerspectiveCandidateDraft` output shape;
- JSON-only response instruction;
- pointer-only ref rule;
- neutral perspective beyond plain summary requirement;
- `needs_review` or `blocked` fallback instruction;
- false-authority and draft/review-only boundary.

Unsafe source literals are omitted or replaced with safe placeholders.

## What Must Be Pasted Back Into Augnes Validation

The returned material must be one `CodexPerspectiveCandidateDraft` JSON object.
It must be pasted back into local validation with
`validateAndNormalizeCodexPerspectiveCandidateDraft`.

The returned draft is not accepted Perspective state before validation succeeds.
Blocked validation means no candidate-compatible review material exists.

## Why This Is Still Not Codex Execution

The packet does not call Codex, execute Codex, call the Codex SDK, call
OpenAI/provider/model APIs, or add any automation. A human starts the Codex
session manually and controls whether to paste the prompt.

## Why This Is Still Not Authority

The packet is not proof/evidence/readiness, not approval, not merge authority,
not publish authority, not GitHub mutation, not persistence, and not a Core
decision. The returned draft remains draft/review material until Augnes local
validation normalizes it into candidate-compatible review material.

## Browser/Computer-Use Validation

Not run: no browser/computer-use validation required because this PR is pure
local library/docs/report/smoke/package work and adds no UI, route,
browser-visible surface, or interactive copy control.

Not run: no browser/computer-use validation required because this PR is pure local library/docs/report/smoke/package work and adds no UI, route, browser-visible surface, or interactive copy control.

## What Remains Out Of Scope

This PR does not call Codex, execute Codex, call the Codex SDK, call
OpenAI/provider/model APIs, call GitHub APIs from implementation, use network
access in implementation behavior, write DB state, add runtime routes, add UI,
create proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

It also does not dogfood a real returned Codex response transcript.

## What Is Validated

The smoke validates:

- ready manual copy packet status, prompt content, false authority, and safe
  output;
- needs-review manual copy packet status, skipped-check checklist, unresolved
  gap checklist, and qualified prompt instructions;
- unsafe source material omission without echoing unsafe literals;
- returned draft round trip through prompt-contract fit and
  `validateAndNormalizeCodexPerspectiveCandidateDraft`;
- bad returned draft regression with plain summary, malformed refs, malformed
  shape, overconfident basis, and authority claims.

## Verification

Validation passed:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-manual-copy-packet`
- `npm run smoke:perspective-codex-former-prompt-contract`
- `npm run smoke:perspective-codex-former-pipeline-dogfood`
- `npm run smoke:perspective-codex-former-pipeline`
- `npm run smoke:perspective-worker-facing-guidance`
- `npm run smoke:perspective-candidate-builder-fixture`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Concrete Reasons

- Browser/computer-use validation skipped: no UI, route, browser-visible
  surface, clipboard automation, or interactive copy control was added.
- DB validation skipped: this PR adds no DB schema, persistence path, or state
  writer.
- Provider/model validation skipped: this PR intentionally does not call Codex,
  OpenAI, provider/model APIs, or SDKs.

## Next Implementation PR

Dogfood manual Codex former draft copy packet with a real Codex response transcript
