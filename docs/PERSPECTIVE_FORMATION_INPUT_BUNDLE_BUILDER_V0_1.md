# Perspective Formation Input Bundle Builder v0.1

## Purpose and Status

This is the first pure local builder after Perspective Formation Lane v0.1. It
implements PR B from the lane's Future Implementation Ladder: a deterministic
builder that turns caller-supplied Codex work material refs into a read-only
Formation Input Bundle for future Perspective Candidate formation.

This builder is local TypeScript only. It does not implement runtime behavior,
routes, DB schema, migrations, persistence, graph DB behavior, OAuth,
provider/model/API calls, ChatGPT Apps, Codex plugin behavior, Codex SDK
execution, proof/evidence/readiness writes, product UI, components, CSS, or
browser-facing behavior.

## What It Builds

`buildPerspectiveFormationInputBundle(input)` accepts only caller-supplied
values and returns a `perspective_formation_input_bundle.v0.1` object with:

- scope and work anchor refs;
- source PR refs;
- changed files and `changed_files_summary`;
- checks run;
- skipped checks with concrete reasons;
- evidence row refs and proof-only action refs;
- work event refs and session trace refs;
- existing Perspective refs;
- unresolved gaps;
- source privacy and redaction notes;
- read-only authority flags.

The bundle is input material for future Perspective Candidate formation. It is
not committed state, not proof, not evidence, not readiness, not approval, and
not merge authority.

## Usability Correction: Bounded Summaries Are Allowed

PR #463's lane definition over-constrained the first slice by listing bounded
summary values with raw/private payloads. This builder deliberately corrects
that usability issue.

Bounded summaries are allowed because Formation Input Bundles need reviewable
context to be useful. Safe examples include:

- `changed_files_summary`;
- check result summaries;
- skipped-check reasons when concrete reasons are present;
- unresolved gap summaries;
- safe source labels;
- source privacy and redaction notes.

Placeholder skipped checks may be preserved as caller-supplied bounded material,
but they are not readiness material until `skipped_reason` contains concrete
non-empty text.

Raw/private/provider/token/source payloads remain forbidden. The builder does
not accept or return raw pasted text, raw source payloads, raw candidate
payloads, private/provider/token/OAuth/API key/billing payloads, hidden
reasoning, raw generated model payloads, or secrets.

## Determinism and Locality

The builder:

- is deterministic;
- accepts caller-supplied values only;
- does not read files;
- does not read environment variables;
- does not call `fetch`;
- does not call network APIs;
- does not import runtime route handlers;
- does not import DB or persistence helpers;
- does not create timestamps internally.

`generated_at` is preserved only when the caller supplies it.

## Readiness

Readiness is intentionally simple:

- `blocked` when scope is missing;
- `needs_review` when there is no `work_id` and no source PR ref;
- `needs_review` when no checks, evidence refs, proof refs, or skipped-check
  material exists;
- `needs_review` when skipped checks are present without concrete reasons;
- `needs_review` when unresolved gaps exist;
- `ready_for_candidate` when scope plus a work id or PR ref exists, at least
  one verification/proof/evidence/concrete-skipped-check material exists, and
  no unresolved gaps are present.

The builder preserves gaps as gaps. It does not pretend evidence exists.

## Authority Boundary

The returned bundle has authority mode `read_only_formation_input` and explicit
false authority flags for committed state, persistence, provider/model/API
calls, proof/evidence/readiness writes, Codex execution, and
merge/publish/approval authority.

It does not change Event Rail, graph topology, node ids/types, edge ids/types,
packet section order, Agent Brief read route behavior, local manual preview
route behavior, Perspective runtime builders, or any product UI.

## Future Next Step

Add deterministic Perspective Candidate builder fixture.
