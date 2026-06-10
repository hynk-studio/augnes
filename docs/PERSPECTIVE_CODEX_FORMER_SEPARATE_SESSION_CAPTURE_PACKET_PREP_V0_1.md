# Perspective Codex Former Separate-Session Capture Packet Prep v0.1

## Purpose

This prep slice follows PR #490 by preparing the next separate-session capture
attempt. A real separate-session transcript envelope has now been supplied, so
this document is the packet-generation record and current validation is handled
by the separate-session provenance-clean capture dogfood.

PR #490 proved the provenance-clean same-session fallback. The remaining
follow-up is to confirm the same provenance-clean flow in a separate
user-started Codex session.

The packet metadata remains immutable because the supplied transcript provenance
depends on the generated ids and prompt hash. The current conclusion is
`PASS with follow-up`.

## Generated Packet

Run:

```sh
npm run dogfood:perspective-codex-former-separate-session-capture-packet-prep
```

The report stores:

- a fresh post-PR #490 Manual Codex Former Draft Copy Packet;
- the generated manual copy packet id;
- the generated former input packet id;
- the generated `source_prompt_hash`;
- the full copyable prompt for a separate user-started Codex session;
- the return envelope the human should paste back after capture.

The generated prompt must include
`Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1` and must not
use stale PR #479 prompt wording.

## Required Return Envelope

The returned transcript used this shape:

```text
REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET

capture_method: human_manual
codex_surface_label: <surface>
prompt_was_generated_by_manual_copy_packet: true
source_manual_copy_packet_id: <packet id>
source_former_input_packet_id: <former input packet id>
source_prompt_hash: <prompt hash>
captured_at: <timestamp or unknown>

TRANSCRIPT_REDACTION_NOTES:
- Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.
- No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.

RETURNED_CODEX_RESPONSE:
<returned JSON>
END RETURNED_CODEX_RESPONSE
```

The ids and prompt hash must match the generated packet metadata in the report.
Old packet ids and old prompt hashes must not be reused.

## What Moved To The Follow-Up Capture Dogfood

After the real separate-session envelope was supplied, the follow-up capture
dogfood became responsible for:

- contract fit;
- direct validation;
- alignment safety-net reporting;
- Worker-Facing Guidance;
- unsafe/authority regression checks;
- stale wording regression checks.

Recommended next implementation PR title:
`Capture separate-session provenance-clean Codex former transcript`.

Follow-up capture artifact:
`reports/dogfood/2026-06-10-perspective-codex-former-separate-session-provenance-clean-capture.md`.

## Authority Boundary

This PR is a pure local separate-session capture dogfood/prep docs/report/smoke
slice. It does not call Codex from implementation, execute Codex from Augnes,
call the Codex SDK, call OpenAI/provider/model APIs from implementation, call
GitHub APIs from implementation behavior, use implementation network behavior,
write DB state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Skipped Checks

- Real separate-session transcript dogfood: run by
  `npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture`
  because the transcript is now supplied.
- Browser/computer-use validation: not run because this PR adds no UI, route,
  browser-visible surface, clipboard automation, or interactive copy control.
- DB validation: not run because this PR adds no DB schema, persistence path, or
  state writer.
- Provider/model validation: not run because this PR intentionally does not call
  Codex, OpenAI, provider/model APIs, or SDKs from implementation.
