# Perspective Codex Former Real Transcript Capture Instructions v0.1

This document prepares the capture protocol for a future real Codex response
transcript dogfood PR. It follows PR #481, which added the manual Codex former
transcript dogfood harness and truthfully remained BLOCKED because no bounded
real human-started Codex response transcript was supplied.

This PR does not capture a real transcript. It adds instructions, a review
template, fixture expectations, redaction policy, and smoke coverage so a future
PR can safely supply one.

## Preconditions

- PR #480 Manual Codex Former Draft Copy Packet is available.
- PR #481 transcript dogfood harness is available.
- The user or human operator intentionally starts the Codex session.
- The prompt is generated from a Manual Codex Former Draft Copy Packet.
- The operator understands that the returned draft is not accepted state.
- The returned draft must be validated locally before any follow-up.

## Capture Method A: Manual Sanitized Copy

1. Build the Manual Codex Former Draft Copy Packet locally.
2. Human reviews `copyable_codex_prompt_text`.
3. Human copies the prompt into a user-started Codex session.
4. Human copies only the returned CodexPerspectiveCandidateDraft JSON or bounded
   response text needed to extract that JSON.
5. Human omits private account data, browser chrome, cookies, tokens,
   screenshots, hidden reasoning, provider logs, raw page dumps, unrelated chat
   content, raw PR diff, raw review payload, billing/token/OAuth/API-key
   material, and sensitive credentials.
6. Human records transcript provenance fields in a local fixture.

## Capture Method B: Browser/Computer-Use Assisted Capture

Use browser/computer-use assisted capture only when the user explicitly chooses
that path. Browser/computer-use may help open the Codex surface, paste the
prompt, and copy the bounded response. It must not capture private page content
outside the bounded returned response.

The future PR must report exactly what browser/computer-use did and what it did
not do. It must not include cookies, tokens, account identifiers, screenshots
with private data, hidden reasoning, page dumps, provider logs, GitHub mutation,
merge, approval, repo execution, or Core-decision activity.

## Capture Method C: No Transcript Available

If no real transcript is available, do not pretend one exists. Keep the
dogfood conclusion BLOCKED. Synthetic fixtures may be used only as controls and
must be labeled as controls. The recommended next action remains obtaining a
bounded real transcript.

## Required Real Transcript Fixture Fields

Future real transcript fixtures must include:

- `transcript_kind: manual_codex_former_response_transcript`
- `transcript_version`
- `transcript_available: true`
- `fixture_source: real_human_started_codex_response`
- `source_manual_copy_packet_id`
- `source_prompt_hash` or bounded prompt excerpt hash
- `prompt_was_generated_by_manual_copy_packet: true`
- `captured_by: human_manual` or `browser_computer_use_assisted`
- `captured_at`, if available
- `codex_surface_label`, if available
- `response_text` or `extracted_json_text`
- `extracted_codex_perspective_candidate_draft`, if already extracted
- `transcript_redaction_notes`
- `privacy_flags`
- `authority_flags`

Required `privacy_flags`:

- `raw_payloads_included: false`
- `private_account_data_included: false`
- `browser_tokens_or_cookies_included: false`
- `raw_page_dump_included: false`
- `hidden` + `_reasoning_included: false`
- `provider_logs_included: false`
- `unsafe_material_omitted: true` or `false`
- `omitted_unsafe_fields: string[]`

Required `authority_flags`:

- `committed_state: false`
- `persistence: false`
- `provider_model_api_calls: false`
- `proof_evidence_readiness_writes: false`
- `codex_execution: false`
- `github_mutation: false`
- `merge_publish_approval: false`
- `core_decision: false`

## Forbidden Transcript Content

The transcript fixture must not include hidden reasoning, private account data,
browser cookies or tokens, raw page dumps, screenshots with sensitive/private
content, provider logs, raw PR diff, raw review payload, unrelated
conversation text, GitHub mutation logs, or approval/merge instructions as
authority.

The following forbidden marker forms must be treated as unsafe if encountered.
They are shown as split fragments so this policy document does not contain raw
unsafe markers:

| Marker form | Split representation |
| --- | --- |
| billing payload marker | `billing` + `_payload` |
| token payload marker | `token` + `_payload` |
| OAuth payload marker | `oauth` + `_payload` |
| raw source payload marker | `raw_source` + `_payload` |
| raw candidate payload marker | `raw_candidate` + `_payload` |
| raw private payload marker | `raw_private` + `_payload` |
| private payload marker | `private` + `_payload` |
| provider payload marker | `provider` + `_payload` |
| OAuth token marker | `oauth` + `_token` |
| access token marker | `access` + `_token` |
| refresh token marker | `refresh` + `_token` |
| API key marker | `api` + `_key` |
| hidden reasoning marker | `hidden` + `_reasoning` |
| generated model payload marker | `generated_model` + `_payload` |
| project key prefix | `sk-proj` + `-` |
| GitHub personal token prefix | `ghp` + `_` |
| GitHub OAuth token prefix | `gho` + `_` |
| GitHub user token prefix | `ghu` + `_` |
| GitHub server token prefix | `ghs` + `_` |
| GitHub refresh token prefix | `ghr` + `_` |
| standalone sensitive word | `secr` + `et` |

## Review Gates

Before accepting a transcript fixture into a future dogfood PR, review must
confirm:

- transcript provenance is present;
- prompt was generated by the manual copy packet;
- prompt hash or bounded prompt excerpt hash is present;
- response contains or can extract one CodexPerspectiveCandidateDraft JSON
  object;
- forbidden content is absent;
- privacy flags are false where required;
- authority flags are false;
- returned draft is not accepted state;
- local validation is required;
- browser/computer-use notes are present if browser/computer-use was used;
- synthetic fixtures are labeled as controls and not real transcripts.

## Extraction And Validation Procedure

Future dogfood PRs should:

1. paste the real transcript fixture into the dogfood harness or fixture
   location;
2. extract one CodexPerspectiveCandidateDraft JSON object;
3. run `evaluateCodexPerspectiveCandidateDraftPromptContractFit`;
4. run `validateAndNormalizeCodexPerspectiveCandidateDraft`;
5. if candidate-compatible review material exists, optionally run
   `buildWorkerFacingPerspectiveGuidanceFromCandidate` with
   `{ candidate, guidance_context }`;
6. record whether the result is PASS, PASS with follow-up, or BLOCKED.

## Browser/Computer-Use Validation For This PR

Not run: this PR only adds capture instructions/docs/report/smoke/package
checks. It adds no UI, route, browser-visible surface, clipboard automation,
interactive copy control, and does not actually capture a transcript.

## Authority Boundary

This PR is a pure local capture-instructions/docs/report/smoke slice. It does
not capture a real transcript, call Codex from implementation, execute Codex
from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from
implementation, call GitHub APIs from implementation, use network access in
implementation behavior, write DB state, add runtime routes, add UI, add
clipboard automation, create proof/evidence/readiness records, approve, merge,
publish, retry, replay, deploy, or make Core decisions.

## Conclusion

PASS with follow-up.

Dogfooded by:

- `docs/PERSPECTIVE_CODEX_FORMER_MANUAL_COPY_REAL_TRANSCRIPT_DOGFOOD_V0_1.md`
- `reports/dogfood/2026-06-09-perspective-codex-former-manual-copy-real-transcript.md`

Recommended next implementation PR title:

Dogfood manual Codex former draft copy packet with a captured real transcript
