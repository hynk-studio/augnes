# Privacy Redaction Runtime Guard v0.1

## Purpose

Privacy Redaction Runtime Guard v0.1 implements the
`privacy_redaction_runtime_guard_v0_1` roadmap slice as a deterministic helper
for scanning caller-provided objects, strings, and arrays before future public
exports, imports, Git Ledger packets, provider extraction outputs, review
memory records, dogfooding artifacts, or audit surfaces reuse them.

The guard prevents private, raw, provider, runtime, local, credential, token,
secret, cookie, private-key, browser-dump, hidden-reasoning, raw-conversation,
opaque connector, and uploaded-file opaque identifiers from becoming canonical
labels or public-safe export payloads.

The guard emits public-safe reports only. Findings include path, kind, action,
reason codes, and public-safe summary. Findings, reports, error messages,
fixtures, and docs examples do not include the raw unsafe value.

## Relationship to the integrated roadmap guide v0.2.1 FULL

This implements `privacy_redaction_runtime_guard_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. It is an operational roadmap and PR sequencing
guide. Field, type, enum, helper, and authority boundaries remain repo-local
and slice-local.

## Relationship to runtime writes and adjacent surfaces

This guard is a shared preflight helper for future runtime writes,
export/import, Git Ledger, provider extraction, dogfooding, audit, review
memory, and product-write reentry review.

The guard is not an export/import implementation.

The guard is not Git Ledger export runtime.

The guard does not create canonical labels.

The guard does not persist raw/private payloads.

The guard does not read files, fetch sources, call providers, execute
retrieval/RAG, write DB, write proof/evidence, promote Perspective, write
product records, call GitHub, or execute Git.

The guard does not read files, fetch sources, call providers, execute retrieval/RAG, write DB, write proof/evidence, promote Perspective, write product records, call GitHub, or execute Git.

Product-write remains parked by #686.

Smoke/CI pass is not truth.

## Scope and non-goals

In scope:

- Pure deterministic TypeScript helper in `lib/privacy/redaction-guard.ts`.
- Caller-provided object, string, and array scanning.
- Recursive scan of unknown fields and arrays.
- Public-safe redacted preview.
- Public-safe findings and guard fingerprint.
- Fixture, static smoke, docs, package script, and latest-index pointer.

Out of scope:

- Export/import runtime.
- Git Ledger export runtime or Git Ledger builder.
- Provider calls, prompt sending, provider output storage, or provider
  extraction execution.
- Source fetch, repository file reads as source input, local file reads as
  source input, or uploaded-file reads.
- Retrieval execution, RAG answer generation, embeddings, vector search, or
  source fetching.
- DB query/write, migrations, routes, UI, or durable state behavior.
- Review-memory writes, dogfooding writes, audit writes, Formation Receipt
  writes, promotion execution, proof/evidence writes, claim/evidence writes,
  product-write, product ID allocation, Codex execution, Git execution, GitHub
  API calls, and repository file writes as runtime behavior.

## What is blocked

The guard blocks unsafe canonical label use. If fields such as
`canonical_label`, `canonical_name`, `display_label`, `label`, `name`, `title`,
or related canonical label fields contain a private/runtime/raw marker, the
report status becomes `blocked_private_or_raw_payload`.

The guard blocks forbidden authority claims anywhere in the input object. If a
caller-provided field claims authority such as product-write, provider calls,
retrieval execution, Git/GitHub execution, DB writes, routes, UI, state writes,
proof/evidence writes, Codex execution authority, smoke truth, or CI truth, the
report status becomes `blocked_forbidden_authority`.

Empty or unsupported top-level input is blocked as `blocked_invalid_input`.

## What is redacted

Unsafe values in optional descriptive fields are redacted from the preview and
reported with path-level findings. The report can remain
`redacted_with_warnings` when unsafe values are not used as canonical labels
and do not claim forbidden authority.

Redacted classes include provider internal IDs, provider thread IDs, provider
run IDs, provider session IDs, private URLs, local private paths, credentials,
tokens, secrets, cookies, private keys, raw source body markers, raw note text
markers, raw provider output markers, raw retrieval output markers, raw DB row
markers, browser dump markers, hidden reasoning markers, and raw conversation
markers.

## What is reference-only

Opaque connector IDs and uploaded-file opaque IDs are reduced to reference-only
handling when they appear in optional reference fields. They are still omitted
from the public-safe preview. If they are used as canonical labels, the guard
blocks the input.

## Authority boundary

Allowed true flags:

- `privacy_redaction_guard_now: true`
- `caller_provided_input_only: true`
- `deterministic_public_safe_report_now: true`

Forbidden capabilities are always false in the report authority boundary:

- canonical label creation from private identifiers
- raw/private payload persistence
- raw source body storage
- provider output storage
- provider thread/run/session ID canonicalization
- private URL canonicalization
- local private path canonicalization
- DB query/write
- routes or UI
- source fetch
- local, repository, or uploaded-file read
- provider/OpenAI call
- prompt sending
- retrieval execution
- RAG answer generation
- proof/evidence record write
- claim/evidence write
- promotion execution
- durable state write
- Formation Receipt write
- Git Ledger export runtime
- Git write
- GitHub API call
- repository file write
- Codex execution authority
- GitHub automation authority
- product-write authority
- product ID allocation authority
- smoke pass as truth
- CI pass as truth

## Fixture policy

`fixtures/privacy-redaction-guard.sample.v0.1.json` uses safe placeholder
markers only, such as `SAFE_MARKER_PROVIDER_THREAD_ID`,
`SAFE_MARKER_PRIVATE_URL`, `SAFE_MARKER_SECRET_TOKEN`, and
`SAFE_MARKER_RAW_SOURCE_BODY`.

The fixture must not include real secrets, live-looking tokens, real private
URLs, real local user paths, real provider IDs, raw source bodies, raw notes,
raw provider output, raw retrieval output, raw DB rows, browser dumps, hidden
reasoning, or raw conversations.

Fixture safe-marker strings are input only. Expected reports and smoke output
must not echo them.

## Verification expectations

Run:

```bash
node --check scripts/smoke-privacy-redaction-guard-v0-1.mjs
npm run smoke:privacy-redaction-guard-v0-1
npm run typecheck
git diff --check
git diff --cached --check
```

The smoke verifies file scope, docs/index/package pointers, report statuses,
redaction behavior, forbidden authority closure, product-write stopline
wording, absence of route/UI/DB/provider/retrieval/GitHub/Git/product-write
implementation files for this slice, absence of real-looking secret examples,
and deterministic fingerprint stability.

## Deferred work

- Export/import runtime remains deferred.
- Git Ledger export runtime and deterministic builder remain deferred.
- Provider calls and provider extraction execution remain deferred.
- Retrieval/RAG answer generation remains deferred.
- DB-backed runtime writes, routes, UI, audit writes, review-memory writes,
  dogfooding writes, proof/evidence writes, Formation Receipt writes,
  Perspective promotion, durable state writes, Git/GitHub execution, Codex
  execution, and product-write remain deferred.
