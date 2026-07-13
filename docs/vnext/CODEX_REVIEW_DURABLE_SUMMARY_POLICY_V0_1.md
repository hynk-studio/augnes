# Codex Review Durable Summary Policy v0.1

Status: compatibility contract
Identity: `codex_review_durable_summary_policy.v0.1`
Classification: Compatibility / protocol-contract remediation
Core protocol version change: no

## Purpose

The Codex review compatibility mapper receives legacy Candidate Ingress
material and produces a review-required `EpisodeDeltaProposal`. Candidate
Ingress intentionally keeps `candidate.summary` compact for legacy review and
display use:

- summary: at most 180 characters;
- label: at most 80 characters;
- long summaries use the existing deterministic ellipsis behavior.

Those display bounds are unchanged. They are not the durable semantic-summary
contract.

For a canonical `requirement_progress_delta_candidates` derivation, the mapper
uses the exact canonical requirement source signal as
`proposed_state_summary`. It does not copy the compact candidate summary and
does not prepend the legacy display prefix.

## Deterministic policy

The v0.1 policy:

1. selects the canonical requirement source signal already used to validate the
   candidate derivation;
2. normalizes whitespace with `value.replace(/\s+/g, " ").trim()`;
3. requires non-empty text;
4. refuses forbidden raw, secret, credential, private-path, and private-URL
   material;
5. requires at most 2,000 characters;
6. returns the complete normalized signal without truncation;
7. blocks mapping before proposal construction when preservation fails.

The mapper does not accept a caller-provided durable-summary override.
Candidate identity, source relations, review-required status, candidate-only
status, target refs, and authority boundaries remain independently validated.

For non-requirement candidate buckets, `proposed_state_summary` continues to
use the existing compact candidate summary.

## Pilot regression policy

The focused conformance fixture preserves this complete public-safe requirement:

> Every Augnes-controlled production remote-model transport must pass a reviewed,
> versioned, bounded, fail-closed payload boundary before provider invocation.
> External native-host model execution that Augnes cannot enforce must be
> represented with accurate observed, advisory, or outside-coverage semantics.
> Any exception requires separate explicit review.

The fixture proves that the Candidate Ingress display summary remains bounded
while the proposal and a pure, synthetic semantic-state construction retain the
complete normalized requirement. The synthetic decision binding is test
material only: it is not a real user decision, persisted record, transition, or
accepted project state.

## Bounds and failure behavior

| Input                                                                                                         | Result                                           |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| non-empty canonical requirement at or below 2,000 characters                                                  | preserved exactly after whitespace normalization |
| 2,001 characters                                                                                              | blocked; no proposal                             |
| empty or whitespace-only                                                                                      | blocked; no proposal                             |
| secret, credential, absolute path, private URL, raw prompt/transcript/reasoning/environment/terminal material | blocked; no proposal                             |
| arbitrary durable-summary override                                                                            | rejected as outside the mapper input contract    |
| non-requirement candidate                                                                                     | existing compact-summary behavior                |

Errors contain bounded codes and generic messages rather than rejected raw
material. Invalid input is never truncated into validity.

## Compatibility and rollback

- Candidate Ingress summary and label bounds do not change.
- Existing persisted proposals, decisions, receipts, and semantic states remain
  readable; no migration or backfill is required.
- Historical deferred pilot material is not rewritten.
- New proposal identities can differ because the durable requirement summary
  and compatibility metadata now include this policy version.
- Rollback is a code rollback. Records already produced by the policy remain
  valid under the unchanged Core proposal and semantic-state schemas.

## Authority and purity

This policy is pure compatibility logic. It reads no database, filesystem,
clock, randomness, environment, network, provider, or external service and
performs no writes or external actuation.

It does not create or infer:

- source-of-truth status;
- user approval or a `ReviewDecision`;
- semantic transition, accepted state, or target head;
- Evidence, Perspective, memory, proof, or work closure;
- provider, GitHub, execution, scheduling, or external-actuation authority;
- Model Gateway completion, Reviewed Reuse, Outcome Improvement, or M3
  completion.
