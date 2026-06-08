# Perspective Candidate Builder Fixture v0.1

## Purpose and Status

This is the deterministic pure local builder fixture for PR C after the
Perspective Formation Input Bundle builder. It converts a caller-supplied,
read-only Formation Input Bundle into a non-committed Perspective Candidate for
review.

The builder is TypeScript only. It does not add runtime routes, `app/api`
changes, DB schema, migrations, persistence, graph DB behavior, OAuth, source
ingress, provider/model/API calls, GitHub mutation beyond the scoped PR
workflow, ChatGPT Apps integration, Codex plugin integration, Codex SDK
execution, proof/evidence/readiness writes, UI, components, CSS, or
browser-facing behavior.

## Input

`buildPerspectiveCandidateFromFormationInputBundle(bundle)` accepts a
`perspective_formation_input_bundle.v0.1` object. The input bundle remains the
place where Augnes-filtered, caller-supplied material is bounded before
candidate formation.

Allowed input material is still limited to safe summaries and pointer refs:

- scope and work anchor refs;
- source PR refs;
- changed files and `changed_files_summary`;
- checks run;
- skipped checks, including placeholder skipped checks when preserved by the
  input bundle;
- evidence row refs and proof-only action refs;
- work event refs and session trace refs;
- existing Perspective refs;
- unresolved gaps;
- authority boundary notes;
- source privacy and redaction notes.

The builder does not accept raw pasted text, raw source payloads, raw candidate
payloads, private/provider/token/OAuth/API key/billing payloads, hidden
reasoning, raw generated model payloads, or secrets.

## Output

The output is a `perspective_candidate.v0.1` object with:

- `status: perspective_candidate`;
- `authority: non_committed`;
- a deterministic `candidate_id`;
- a bounded thesis derived from the changed-files summary;
- selected bounded material from the source bundle;
- pointer-only evidence, proof, trace, and existing Perspective refs;
- verification summaries, including preserved skipped-check entries;
- unresolved tensions for gaps, failed checks, missing skipped-check reasons,
  and upstream readiness reasons;
- `basis_quality`;
- next action candidates;
- user/Core decision questions;
- forbidden actions and explicit false authority flags.

This output is not committed state, not proof, not evidence, not readiness, not
approval, and not merge authority.

Empty pointer refs may be preserved upstream by the Formation Input Bundle, but
they are omitted from candidate `evidence_pointers`. Whitespace-only refs are
also omitted so missing refs do not appear as candidate pointer material.

## Consumed By

The Perspective Candidate briefing preview consumes this candidate as bounded
source material for ChatGPT-facing review. The Candidate remains non-committed
formation output, not briefing or approval by itself.

## Readiness and Review Quality

The candidate preserves input bundle readiness while adding candidate-level
review quality:

- `ready_for_candidate` maps to `sufficient_for_review` only when no failed
  checks are present;
- `needs_review` maps to `needs_review`;
- `blocked` maps to `blocked`;
- failed checks become unresolved tensions and force `needs_review`;
- unresolved gaps remain unresolved tensions;
- skipped checks without concrete reasons remain preserved in the verification
  summary but become unresolved tensions, not readiness material.

Next action candidates always include review of the non-committed candidate.
Preparing a Codex handoff is suggested only after the basis is sufficient for
review. Missing material, failed checks, skipped-check gaps, and unresolved
gaps suggest fixing the input first.

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

The deterministic id is derived only from scope, work id, and source PR refs.

## Authority Boundary

The returned candidate has authority `non_committed` and explicit false
authority flags for committed state, persistence, provider/model/API calls,
proof/evidence/readiness writes, Codex execution, and
merge/publish/approval authority.

It does not change Event Rail, graph topology, node ids/types, edge ids/types,
packet section order, Agent Brief read route behavior, local manual preview
route behavior, Perspective runtime builders, product UI, or browser-facing
behavior.

## Future Next Step

Add manual ChatGPT user judgment capture packet.
