# Expected Impact vs Actual Result Check

The Expected Impact vs Actual Result Check is a small comparison Codex should complete before opening or updating a PR. It catches drift between the handoff, the implementation, and the evidence pack.

## Why This Exists

Augnes tracks state and proof over time. Codex often uses multiple execution surfaces while implementing a repo change. The expected-vs-actual check keeps the work reviewable by asking whether the final PR matches the handoff.

## Inputs

Use these inputs when available:

- Codex Handoff Packet
- Augnes work brief
- related state keys
- PR diff
- Verification Evidence Pack
- Execution Surface Record
- completion record fields

## Minimal Check

```text
Expected Impact vs Actual Result

Files:
- Expected:
- Actual:
- Match: yes | no | partial

State keys:
- Expected:
- Actual referenced or recorded:
- Match: yes | no | partial

Execution surfaces:
- Expected:
- Actual:
- Match: yes | no | partial

Verification checks:
- Expected:
- Actual:
- Match: yes | no | partial

Result:
- Expected status/kind:
- Actual status/kind:
- Mismatch or follow-up:
```

## Status Guidance

Use the real outcome:

- `completed`: the expected work and checks completed.
- `partial`: some work completed, but expected files, surfaces, or checks did not all match.
- `blocked`: the work could not proceed because of a dependency or environment blocker.
- `failed`: the attempted work produced a failing result.
- `needs_review`: the result is intentionally handed back for human review before treating it as complete.

## Common Mismatches

- Expected Browser/Chrome verification, but no local runtime was available.
- Expected ChatGPT Developer Mode checks, but no tunnel or Developer Mode access was available.
- Expected a code change, but inspection showed a docs-only change was safer.
- Expected state proof recording, but `CODEX_WORK_ID` was unavailable or the local runtime was not running.
- Actual files changed outside the handoff scope.

## Review Rule

A mismatch is not automatically a failure. It must be visible. If the mismatch changes authority boundaries, adds runtime behavior, or expands the PR beyond the agreed scope, stop and ask for review before continuing.
