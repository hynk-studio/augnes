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

## Boundary

This helper does not fetch GitHub, write proof or evidence, close work, mutate
work status, create or mutate events, commit or reject state, execute Codex,
spawn shell commands, call providers/OpenAI, create branches or PRs, submit PR
reviews, merge, publish, retry, replay, deploy, or widen the
`work_loop_readonly` Developer Mode tool surface.
