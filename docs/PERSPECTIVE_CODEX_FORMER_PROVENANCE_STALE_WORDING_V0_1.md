# Perspective Codex Former Provenance And Stale Wording v0.1

This follows PR #488, which dogfooded a second bounded real human-started
Codex response transcript after PR #487.

PR #488 passed with follow-up. It showed that the old PR #483 alias drift was
absent, PR #486 non-local `tension_kind` drift was absent, direct contract fit
returned `fits_contract`, direct local validation produced candidate-compatible
material, PR #484 alignment was not required for candidate material, and
Worker-Facing Guidance stayed advisory-only.

The remaining follow-up was provenance and stale wording:

- `source_manual_copy_packet_id` and `source_prompt_hash` were not supplied in
  chat;
- stale `PR #479 prompt contract` wording appeared in the returned material;
- source packet wording about a missing second transcript was echoed after the
  transcript had been supplied;
- capture-next-action wording still treated the current response as absent.

## Manual Copy Contract Label

New manual copy prompts identify the contract as:

`CodexPerspectiveFormerDraftPromptContract v0.1`

The copyable prompt should not identify the prompt contract by an old PR number.
PR refs may remain as bounded source refs, but they are not the prompt contract
identity.

## Capture Return Envelope

The manual copy packet now exposes a return envelope near the copyable prompt:

```text
REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET

capture_method: human_manual
codex_surface_label: <surface>
prompt_was_generated_by_manual_copy_packet: true
source_manual_copy_packet_id: <packet_id>
source_former_input_packet_id: <former input packet id>
source_prompt_hash: <copyable prompt hash>
captured_at: <timestamp or unknown>

TRANSCRIPT_REDACTION_NOTES:
- Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.
- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.

RETURNED_CODEX_RESPONSE:
<returned JSON>
END RETURNED_CODEX_RESPONSE
```

Complete provenance can now be preserved when the returned transcript includes
`source_manual_copy_packet_id` and `source_prompt_hash`. Partial provenance still
remains `needs_review` and must not be fabricated.

## Source Gap Handling

Dogfood should distinguish:

- `source_packet_pre_capture_gap`: what the source packet said before capture;
- `captured_transcript_present`: whether the dogfood run now has a transcript;
- `post_capture_remaining_gap`: what remains after the transcript exists.

If a source packet says a transcript is missing, and a transcript fixture is now
present, dogfood should say the source packet originally described transcript
capture as unresolved. It should not say the transcript is currently absent.

If a model response repeats stale missing-transcript wording after the response
exists, classify that as stale source-packet echo and `needs_review` follow-up.

## Stale Wording Checks

The follow-up dogfood checks:

- stale source-packet echo;
- stale capture next-action after supplied transcript;
- stale prompt lineage label;
- stale old PR prompt contract references.

## Boundary

This is a pure local manual-copy/provenance/docs/report/smoke slice. It does
not capture a new transcript, call Codex, call the Codex SDK, call
OpenAI/provider/model APIs, use network behavior in implementation, write DB
state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

Expected conclusion: PASS with follow-up.

Recommended next implementation PR title:
Dogfood provenance-clean Codex former transcript capture
