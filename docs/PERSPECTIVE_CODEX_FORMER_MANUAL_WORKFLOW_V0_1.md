# Perspective Codex Former Manual Workflow v0.1

## Purpose

This workflow lets a human operator generate a bounded Manual Codex Former
Draft Copy Packet, paste the copyable prompt into a separate user-started Codex
session, return the capture envelope with exactly one
CodexPerspectiveCandidateDraft JSON object, and run local validation before
treating anything as candidate-compatible review material.

The workflow is manual and review-only. It does not create accepted Augnes
state, proof, evidence, readiness, approval, merge authority, GitHub mutation,
provider/model behavior, Codex SDK behavior, or a Core decision.

## Workflow Stages

### A. Generate Packet Locally

Use the local manual copy packet builder or a dogfood command that builds a
Manual Codex Former Draft Copy Packet from bounded local Augnes material.

Before paste, record:

- `source_manual_copy_packet_id`;
- `source_former_input_packet_id`;
- `source_prompt_hash`.

Confirm the copyable prompt includes
`CodexPerspectiveFormerDraftPromptContract v0.1`, and confirm stale PR #479
prompt wording is absent.

### Operator Capture Helper

The local helper is the preferred operator-facing wrapper for this manual
workflow. It reduces copy/paste and provenance mistakes, but it does not paste
into Codex, call Codex from Augnes, use the Codex SDK, call provider/model APIs,
or create accepted Augnes state.

The helper does not paste into Codex; the separate user-started session remains
a human-operated step.

Prepare a packet into a deterministic local output directory:

```bash
npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture
```

By default, prepare mode uses the proven separate-session capture packet prep
builder from the PR #491 through PR #494 path. Metadata records
`capture_source_kind: separate_session_capture_packet_prep_builder`.

For a fresh bounded local source input file, use `--source-input`:

```bash
npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-capture --source-input /tmp/augnes-codex-former-capture/bounded-source-input.json
```

The source input file must be local JSON containing bounded source material for
the local Formation Input Bundle builder: scope, work id or PR refs, changed
files, a bounded summary, checks or skipped checks, and any unresolved gaps or
pointer-oriented refs. When this path is used, metadata records
`capture_source_kind: bounded_source_input_file`, `source_input_path`,
`source_input_hash`, source scope, and source work id.

Use `docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md` for
the operator-readable source input shape and a sanitized example. If
`--generated-at` is supplied, that timestamp is used for helper metadata and the
generated Formation Input Bundle path. `source_input_hash` remains the hash of
the source input file exactly as supplied on disk.

Prepare mode writes:

- a copyable prompt file;
- a capture return envelope template file;
- a metadata file with `source_manual_copy_packet_id`,
  `source_former_input_packet_id`, `source_prompt_hash`, and the former input
  packet needed for later validation.

It prints the same ids/hash and output paths to stdout. It fails if the stable
prompt contract label is missing, stale PR #479 wording is present, or generated
provenance values are missing or `not_supplied_in_chat`. Source-input prepare
also fails when the local JSON cannot be parsed or contains unsafe private,
provider, credential-like, browser-capture, or raw source/review material.

After the human returns a separate-session capture envelope, validate it with
the metadata from prepare mode:

```bash
npm run perspective:codex-former:validate-capture -- --envelope /tmp/augnes-codex-former-capture/returned-envelope.txt --metadata /tmp/augnes-codex-former-capture/codex-former-capture-metadata.json
```

Validate mode verifies envelope provenance, confirms ids/hash match metadata,
extracts exactly one returned candidate draft JSON object, runs contract-fit,
runs direct validation/normalization with the same former input packet, runs
schema alignment only as a safety-net comparison, and runs Worker-Facing
Guidance only after direct validation returns candidate-compatible material. The
returned response may be a JSON object or bounded prose containing exactly one
balanced candidate JSON object. Multiple candidate objects block with useful
findings.

The validate result prints `PASS`, `PASS with follow-up`, or `BLOCKED with
useful findings`. The helper reports unknown pointer warnings and
`needs_review` basis quality rather than hiding them. Candidate-compatible
material remains `non_committed` review material.

### B. Paste Into Separate Codex Session

Start a separate user-started Codex session and paste only
`COPYABLE_CODEX_PROMPT_TEXT`.

Do not paste private material, raw diffs, provider logs, cookies, tokens,
screenshots, hidden reasoning, account data, unrelated chat text, raw page
dumps, raw PR diffs, raw review payloads, GitHub mutation logs, secrets, or
approval/merge authority.

### C. Return Envelope

The returned material must include this envelope and one returned candidate
draft JSON object:

```text
REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET

capture_method: human_manual
codex_surface_label: separate user-started Codex session
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

### D. Validate Locally

Run local validation before using the returned material:

- run `evaluateCodexPerspectiveCandidateDraftPromptContractFit`;
- run `validateAndNormalizeCodexPerspectiveCandidateDraft` with the same former
  input packet;
- run schema alignment only as a safety-net comparison, not as direct success;
- run Worker-Facing Guidance only after direct validation returns
  candidate-compatible material.

### E. Review Result

Use one of these conclusions:

- `PASS`: provenance is complete, contract fit is clean, direct validation
  produces candidate-compatible review material, and guidance remains
  advisory-only.
- `PASS with follow-up`: candidate-compatible review material exists, but
  pointer warnings, needs-review basis quality, or minor review issues remain.
- `BLOCKED with useful findings`: extraction, pointer, source mismatch,
  unsafe/privacy, or authority failure blocks safe use.

## Required Invariants

The manual workflow requires:

- `source_manual_copy_packet_id` is present;
- `source_former_input_packet_id` is present;
- `source_prompt_hash` is present;
- provenance values are not `not_supplied_in_chat`;
- returned `source_former_input_packet` matches the generated former input
  packet;
- evidence refs use `pointer_only` semantics;
- authority flags are all false;
- privacy/raw payload flags do not include raw private, source, or provider
  material;
- output remains draft/review material only.

## Known Review Warning From PR #492

PR #492 confirmed the separate-session workflow with complete provenance, direct
validation, and advisory-only Worker-Facing Guidance. It did not eliminate all
review work.

Contract fit remained `needs_review` because two evidence pointer refs produced
warnings:

- `pointer_ref:draft.evidence_pointer_refs[0]`
- `pointer_ref:draft.evidence_pointer_refs[1]`

Direct validation still produced non-committed candidate-compatible review
material, but it also reported `unknown_pointer_ref` warnings. Pointer warnings
are not the same as total failure, but they require review before downstream
use. Only retained and known pointer refs should be treated as usable evidence
pointers. Candidate material remains `non_committed`, and basis quality may
remain `needs_review`.

## Authority Boundary

This workflow never creates accepted Augnes state. It never creates proof,
evidence, or readiness records. It never approves, merges, publishes, retries,
replays, deploys, or mutates GitHub.

It never calls Codex from implementation, executes Codex from Augnes, calls the
Codex SDK, or calls OpenAI/provider/model APIs from implementation. Human/Core
decision remains outside the returned draft.

## Privacy And Redaction

Return only bounded candidate JSON or bounded response text. Do not include
hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps,
raw PR diffs, raw review payloads, unrelated chat text, secrets, screenshots,
GitHub mutation logs, or approval/merge authority.

If omitted unsafe/private marker names appear in a returned transcript,
public docs and reports must use sanitized summaries rather than echo the raw
marker names.

## Operator Checklist

Before paste:

- [ ] Packet id recorded
- [ ] Former input packet id recorded
- [ ] Prompt hash recorded
- [ ] Stable contract label present
- [ ] No stale PR #479 wording
- [ ] Copyable prompt only, no private material

After return:

- [ ] Envelope present
- [ ] ids/hash match generated packet
- [ ] exactly one candidate JSON object
- [ ] source_former_input_packet matches
- [ ] no raw/private/provider material
- [ ] authority flags false
- [ ] local validation run
- [ ] pointer warnings reviewed
- [ ] Worker-Facing Guidance advisory-only if run

## When Not To Use

Do not use this workflow:

- for automatic accepted state;
- to bypass validation;
- when raw private/provider/source material would need to be pasted;
- as proof or readiness evidence by itself;
- when the operator cannot preserve packet id, former input packet id, and
  prompt hash.

## Relationship To Previous PRs

- PR #483: first real transcript; useful but alias-shaped.
- PR #484: schema alignment safety net.
- PR #485: canonical schema prompt contract.
- PR #486: refined transcript; direct validation worked but semantic findings
  remained.
- PR #487: thesis and tension-kind refinement.
- PR #488: second transcript; provenance and stale-wording gaps remained.
- PR #489: provenance envelope and stale-wording cleanup.
- PR #490: same-session fallback dogfood.
- PR #491: separate-session packet prep.
- PR #492: separate-session transcript confirmed with `PASS with follow-up`.

## Conclusion

Expected conclusion: `PASS with follow-up`.

Recommended next implementation PR title:
`Add operator-facing capture helper or CLI wrapper`.

Alternative:
`Start product-surface design for Augnes Codex former capture review`.
