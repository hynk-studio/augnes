# Perspective Codex Former Separate-Session Capture Packet Prep v0.1

## Purpose

This prep slice follows PR #490 by preparing the next separate-session capture
attempt without claiming that separate-session confirmation has succeeded.

PR #490 proved the provenance-clean same-session fallback. The remaining
follow-up is to confirm the same provenance-clean flow in a separate
user-started Codex session.

No real separate-session transcript envelope is included in this PR. The
conclusion is `BLOCKED / WAITING_FOR_TRANSCRIPT`.

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

The returned transcript must use this shape:

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

## What Remains Blocked

Until a real separate-session envelope is returned:

- contract fit is not run;
- direct validation is not run;
- alignment is not run;
- Worker-Facing Guidance is not run;
- separate-session confirmation is not claimed.

Recommended next implementation PR title:
`Capture separate-session provenance-clean Codex former transcript`.

## Authority Boundary

This PR is a pure local separate-session capture dogfood/prep docs/report/smoke
slice. It does not call Codex from implementation, execute Codex from Augnes,
call the Codex SDK, call OpenAI/provider/model APIs from implementation, call
GitHub APIs from implementation behavior, use implementation network behavior,
write DB state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Skipped Checks

- Real separate-session transcript dogfood: not run because no real
  separate-session transcript envelope was supplied.
- Browser/computer-use validation: not run because this PR adds no UI, route,
  browser-visible surface, clipboard automation, or interactive copy control.
- DB validation: not run because this PR adds no DB schema, persistence path, or
  state writer.
- Provider/model validation: not run because this PR intentionally does not call
  Codex, OpenAI, provider/model APIs, or SDKs from implementation.
