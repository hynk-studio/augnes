# Temporal Interpretation OpenAI-path validation

This report covers the opt-in live OpenAI-backed Temporal Interpretation
Preview validation for the strict `active_context_admission` schema. It is a
validation artifact only. It does not commit state, approve work, publish
proof, replay delivery, call the GitHub publication adapter, create durable
PerspectiveSnapshot state, create RawEpisodeBundle runtime, or add write
controls.

## Run Metadata

- Date/time: `2026-05-13T17:53:54Z`
- Branch/commit: `codex/temporal-openai-validation` at `da405cd`
- Input source: `TEMPORAL_HARDENING_FIXTURES[0]`
  (`valid_review_bounded_preview`)
- Validation command:
  `npm run validate:temporal-openai-path`
- Input result source: user-supplied redacted validation output from a real
  OpenAI-key-backed run.
- Generator observed: `openai`
- Model observed: not included in the supplied redacted output excerpt. The
  harness default is `gpt-4.1-mini` unless `OPENAI_MODEL` is set in the
  environment.
- OpenAI was called: yes
- OpenAI validation call count: `1`
- Secrets handling: no API key was printed, stored, written to a file, or
  committed.

## Redacted Result Summary

```json
{
  "validation": "temporal-openai-path",
  "input_fixture": "valid_review_bounded_preview",
  "generator": "openai",
  "model": "not included in supplied redacted output",
  "openai_call_count": 1,
  "active_context_admission_present": true,
  "decision_count": 7,
  "categories_observed": [
    "admit_boundary_active",
    "admit_primary_active",
    "admit_tension_active",
    "exclude_summary_only",
    "retain_recallable"
  ],
  "guardrails_passed": true,
  "warning_count": 0,
  "warnings": [],
  "counterexamples_preserved": true,
  "residual_tensions_preserved": true,
  "summary_only_evidence_anchor_count": 0,
  "unsafe_safe_next_step_detected": false,
  "non_authority_boundary_confirmed": true,
  "schema_decision_shape_valid": true,
  "no_secrets_printed": true,
  "passed": true,
  "failures": []
}
```

## active_context_admission

- Generated: yes
- Decision count: `7`
- Categories observed: `admit_boundary_active`, `admit_primary_active`,
  `admit_tension_active`, `exclude_summary_only`, `retain_recallable`
- Decision shape validated: yes

## guardrails

- Guardrail result: passed
- Warning count: `0`
- Warnings: none
- Bounded result: yes

## Counterexample Preservation

- Expected counterexample refs from fixture: `boundary:summary_refs`
- Result: confirmed

## Residual Tension Preservation

- Expected residual tension refs from fixture: `tension:secret-handling`
- Result: confirmed

## summary/evidence Separation

- Summary-only evidence anchor count: `0`
- Result: confirmed

## safe_next_step Check

- Unsafe authority language detected: no
- safe_next_step non-authority confirmed: yes
- Result: confirmed

## non-authority Boundary

- Non-authority boundary confirmed: yes
- Result: confirmed

## Notes

- The opt-in validation harness was run with `OPENAI_API_KEY` supplied through
  the shell environment.
- The redacted result passed with no guardrail warnings and no validation
  failures.
- The validation result confirms that counterexamples and residual tensions were
  preserved, summary-only refs were not used as evidence anchors, and the
  generated `safe_next_step` did not contain unsafe authority language.
- Normal smoke checks do not require `OPENAI_API_KEY`.
- no secrets committed.

## Reviewer verdict

`pass`

The live OpenAI-path validation completed successfully with a redacted passing
summary. The report does not include any API key, raw secret, `.env` content, or
full raw model response.
