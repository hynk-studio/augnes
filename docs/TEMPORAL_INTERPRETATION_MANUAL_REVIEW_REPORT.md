# Temporal Interpretation Manual Review Report v0.1

Use this template when reviewing `POST /api/temporal-interpretation/preview`
outputs, fixture results, or Cockpit Temporal Interpretation Preview captures.
The report is a manual review aid only. It does not commit state, approve work,
publish proof, replay delivery, create PerspectiveSnapshot runtime state, or
promote rules.

## Preview Input

- Scope:
- Request body:
- Runtime URL or fixture name:
- Generator observed: `mock | mock_fallback | openai`
- Model, if any:

## Preview Output

- Current interpretation:
- Transition relation:
- Safe next step:
- Non-authority boundary:
- Guardrails passed: `yes | no`
- Guardrail warnings:

## Source Refs

- Evidence anchors:
- Summary-only refs:
- Work/action/session refs:
- Fixture refs:

## Admission Decisions

For each active context admission decision:

```text
candidate_id:
category:
reason:
source_authority:
evidence_refs:
counterexample_refs:
residual_tension_refs:
```

Check:

- Primary active context is backed by evidence refs.
- Boundary and tension context remains visible.
- Summary-only refs are not treated as evidence.
- Duplicate, out-of-scope, and pending/stale candidates are excluded or suspended.

## Counterexamples Preserved?

- Expected counterexample refs:
- Output counterexample refs:
- Missing refs:
- Reviewer notes:

## Residual Tensions Preserved?

- Expected residual tension refs:
- Output residual tension refs:
- Missing refs:
- Reviewer notes:

## Summary/Evidence Separation

- Are summary refs present only as summary/view context?
- Did any summary-only ref become an evidence anchor?
- Did any user preference become factual readiness or approval?

## Authority Boundary Check

Confirm the output does not claim or imply:

- durable PerspectiveSnapshot runtime
- RawEpisodeBundle runtime
- state commit/reject authority
- proof publication authority
- approval, publish, retry, or replay authority
- ChatGPT App write authority
- Cockpit write authority

## Safe Next Step Check

- Does `safe_next_step` avoid `approve`, `publish`, `ready to ship`,
  `P4 ready`, `fully verified`, or equivalent authority language unless bounded
  evidence and explicit approval are present?
- Does it preserve the read-only/non-authority boundary?

## Reviewer Verdict

Choose one:

- `pass`
- `pass_with_notes`
- `fail`

## Notes

-

## Follow-Up Action

-
