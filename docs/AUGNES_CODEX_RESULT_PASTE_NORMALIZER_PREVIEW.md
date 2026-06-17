# Augnes Codex Result Paste Normalizer Preview

## Status

- preview-only deterministic helper
- local parser only
- no runtime write authority
- no GitHub fetch or mutation
- no provider or OpenAI call

## Purpose

The Codex result paste normalizer helps a human review pasted Codex closeout
text before it reaches the existing Codex result review packet. It accepts raw
Codex final report text, PR body text, or closeout text through
`augnes_get_work_brief` and derives a conservative structured candidate.

The existing structured `codexResult` / `codexResultInput` / `codex_result`
path still works. Raw paste support is additive.

## Input Paths

Top-level raw paste aliases:

- `codexResultText`
- `codex_result_text`
- `codexResultPaste`
- `codex_result_paste`

Structured raw text aliases inside `codexResult`, `codexResultInput`, or
`codex_result`:

- `raw_result_text`
- `rawResultText`
- `pasted_result_text`
- `pastedResultText`
- `pr_body_text`
- `prBodyText`
- `closeout_text`
- `closeoutText`

## Candidate Behavior

The parser extracts fields only when they are explicit in the pasted text:

- `work_id`
- `scope`
- `final_report_text`
- `pr_url`
- `pr_number`
- `changed_files`
- `verification_commands`
- `verification_results`
- `skipped_checks`
- `remaining_caveats`
- `authority_boundary_statement`
- `result_status`

Explicit structured fields override parsed fields. Paste extraction fills only
missing structured fields. Conflicts are surfaced in the preview and do not
overwrite structured input.

Partial extraction remains partial. Missing fields stay visible as warnings or
review questions, not invented pass results.

## Recommended Report Shape

For future manual Codex closeouts, prefer the reusable report template in
`docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`. It names the expected
review fields, including `skipped_checks`, `remaining_caveats`, and
`ambiguous_combined_section_lines`, while preserving the current preview-only
paste path through `codexResultText` / `codexResultPaste`.

Combined skipped-check/caveat sections are split conservatively. Supported
combined headings include `Skipped checks and caveats`, `Skipped validation and
caveats`, `Skipped checks / remaining caveats`, `Caveats and skipped checks`,
and `Limitations / skipped checks`.

Lines that clearly describe skipped or unavailable validation become
`skipped_checks`. Lines that clearly describe residual limitations, future
work, manual review, or candidate-only behavior become `remaining_caveats`.
Ambiguous combined-section lines are not duplicated into both result fields;
they remain human-review warnings and are exposed as
`ambiguous_combined_section_lines`.

Explicit none-skipped and none-remaining signals are preserved, including
combined-section text such as `Skipped checks: none; Remaining caveats: none`.

## Boundary

This helper does not fetch GitHub, write proof or evidence, close work, mutate
work status, create or mutate events, commit or reject state, execute Codex,
spawn shell commands, call providers/OpenAI, create branches or PRs, submit PR
reviews, merge, publish, retry, replay, deploy, or widen the
`work_loop_readonly` Developer Mode tool surface.
