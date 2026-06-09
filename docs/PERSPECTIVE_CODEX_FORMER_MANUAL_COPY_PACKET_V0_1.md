# Perspective Codex Former Manual Copy Packet v0.1

This document describes the pure local Manual Codex Former Draft Copy Packet
that follows PR #479, which added the Codex perspective former prompt contract.

The packet is material a human can review and copy into Codex, then use only
after local Augnes validation of the returned draft.

The packet adds a manual usability layer:

1. Perspective Formation Input Bundle
2. CodexPerspectiveFormerInputPacket
3. CodexPerspectiveFormerDraftPromptContract
4. Manual Codex Former Draft Copy Packet
5. human-started Codex prompt
6. returned CodexPerspectiveCandidateDraft
7. validateAndNormalizeCodexPerspectiveCandidateDraft

The Manual Codex Former Draft Copy Packet is not Codex execution, not
proof/evidence/readiness, not approval, not merge authority, not GitHub
mutation, not Codex SDK integration, and not a Core decision.

Boundary shorthand: not Codex execution, not proof/evidence/readiness, not
approval, not a Core decision.

## Builder

`buildManualCodexPerspectiveFormerDraftCopyPacket(input)` accepts a former input
packet, a prompt contract, optional manual context, optional expected validation
commands, and optional metadata. It returns:

- `copy_status`;
- source former input packet refs;
- source prompt contract refs;
- `copyable_codex_prompt_text`;
- expected CodexPerspectiveCandidateDraft response contract;
- returned draft validation instructions;
- manual review checklist;
- unsafe material policy;
- authority boundary;
- privacy and false authority flags;
- browser/computer-use validation decision.

`evaluateManualCodexPerspectiveFormerDraftCopyPacket(packet)` is a local
consistency helper. It checks that the copy packet remains bounded, prompt text
is safe, expected output is `CodexPerspectiveCandidateDraft`, authority flags
are false, and returned draft instructions mention
`validateAndNormalizeCodexPerspectiveCandidateDraft`.

## Copy Status

`ready_to_copy` means the packet and prompt contract are bounded, draft-only,
non-authoritative, and ready for human review before copy.

`needs_review` means the packet is valid but contains skipped checks,
unresolved gaps, weak verification, omitted unsafe material, or usefulness that
still needs human review.

`needs_scope` means source refs, work id, pointer refs, or draft output contract
pieces are missing.

`blocked` means unsafe material, raw payload inclusion, authority claims,
runtime/UI/API expectations, or non-manual execution claims appear.

## Human Usage Flow

A human reviews the packet first. If acceptable, the human copies
`copyable_codex_prompt_text` into a user-started Codex session. The prompt asks
for one returned `CodexPerspectiveCandidateDraft` JSON object.

The human then pastes the returned draft JSON back into Augnes local validation
using `validateAndNormalizeCodexPerspectiveCandidateDraft` with the same former
input packet. The returned draft is not accepted state before validation. The
user decides whether to continue after validation.

## Copied Prompt Boundary

The copyable prompt includes:

- role `codex_perspective_former`;
- bounded former input packet summary;
- PR #479 prompt contract instructions;
- exact `CodexPerspectiveCandidateDraft` output shape requirements;
- JSON-only response instruction;
- pointer-only ref rule;
- neutral perspective beyond plain summary requirement;
- `needs_review` or `blocked` fallback instructions;
- no raw, private, provider, token, billing, or source material;
- no hidden reasoning;
- no proof/evidence/readiness, approval, merge, GitHub mutation, Codex
  execution, provider/model execution, or Core-decision claims.

Unsafe source literals are omitted or replaced with safe placeholders.

## Browser/Computer-Use Validation

Not run: no browser/computer-use validation required because this PR is pure
local library/docs/report/smoke/package work and adds no UI, route,
browser-visible surface, or interactive copy control.

If a later PR adds a UI, route, clipboard automation, web preview, or
interactive copy surface, that PR should include browser/computer-use validation
for that surface.

## Scope Boundary

This PR does not call Codex, execute Codex, call the Codex SDK, call
OpenAI/provider/model APIs, call GitHub APIs from implementation, use network
access in implementation behavior, write DB state, add runtime routes, add UI,
create proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Conclusion

Expected conclusion: PASS with follow-up.

Recommended next implementation PR title:

Dogfood manual Codex former draft copy packet with a real Codex response transcript
