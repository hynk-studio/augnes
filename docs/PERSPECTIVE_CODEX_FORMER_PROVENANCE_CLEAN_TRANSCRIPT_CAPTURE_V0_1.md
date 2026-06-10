# Perspective Codex Former Provenance-Clean Transcript Capture v0.1

## Purpose

This dogfood slice follows PR #489 by testing the provenance-clean Manual Codex Former Draft Copy Packet path with a fresh locally generated packet.

PR #489 added the stable `CodexPerspectiveFormerDraftPromptContract v0.1` label, `copyable_prompt_hash`, `capture_return_envelope`, source pre-capture gap guidance, and prevention for stale PR #479 prompt-contract wording. This slice verifies that those fields work together when the user cannot safely copy a large packet from a phone.

## Capture Method

Capture was performed as a phone-assisted same-session path in a human-started Codex work session by generating the post-PR #489 packet locally and using its copyable prompt text as bounded input, avoiding phone/manual packet copying. No Codex SDK, provider/model API, or implementation Codex call was used.

The existing return envelope still records `capture_method: human_manual` because that is the current schema field. The report must not claim this was a separate manually pasted Codex session.

## Packet Bounds

The local dogfood builds a Formation Input Bundle for:

- `scope: project:augnes`
- `work_id: AG-provenance-clean-codex-former-transcript-capture`
- source PR refs from `pr:hynk-studio/augnes#489` through `pr:hynk-studio/augnes#483`

The generated packet must include:

- `copyable_prompt_hash`
- `capture_return_envelope`
- `source_manual_copy_packet_id`
- `source_former_input_packet_id`
- `source_prompt_hash`
- `Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1`
- the source pre-capture gap guidance
- the post-capture instruction not to repeat that gap as current state

It must not include the stale PR #479 prompt contract wording.

## Dogfood Coverage

The dogfood scenarios are:

- `generated_post_pr489_packet`
- `provenance_clean_capture_envelope`
- `captured_candidate_contract_fit`
- `direct_validation`
- `alignment_safety_net`
- `downstream_guidance`
- `stale_wording_regression`
- `unsafe_authority_regression`

Expected conclusion: `PASS with follow-up`.

Reason: this proves the post-PR #489 provenance envelope works without phone packet copying, while a later separate-session capture may still be useful as confirmation.

Recommended next implementation PR title: `Confirm provenance-clean Codex former capture in separate session`.

Alternative if fully sufficient: `Promote provenance-clean Codex former capture path to manual workflow docs`.

## Authority Boundary

This PR is a pure local packet-generation/provenance-clean transcript dogfood/docs/report/smoke slice. It does not call Codex from implementation, execute Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs from implementation behavior, use implementation network behavior, write DB state, add runtime routes, add UI, add clipboard automation, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.

## Skipped Checks

- Browser/computer-use validation: not run because this PR is pure local packet-generation/provenance-clean transcript dogfood/docs/report/smoke/package work and adds no UI, route, browser-visible surface, clipboard automation, or interactive copy control.
- Separate manual pasted Codex session: skipped because the user is on a phone and cannot safely copy a large packet between sessions.
- DB validation: skipped because this PR adds no DB schema, persistence path, or state writer.
- Provider/model validation: skipped because this PR intentionally does not call Codex, OpenAI, provider/model APIs, or SDKs from implementation.
