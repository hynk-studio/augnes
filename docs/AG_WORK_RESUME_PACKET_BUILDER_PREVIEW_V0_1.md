# AG Work Resume Packet Builder Preview v0.1

## Purpose

`lib/ag-work-resume-packet.ts` provides a pure read-only builder for AG Resume
Packet v0.2 preview objects. The builder packages provided work/state/handoff
context plus explicit Git metadata into the packet shape validated by
`ag:resume-preflight`.

The builder is a local library primitive only. It is not a route, not a CLI,
not an import path, not a Direct Resume Code implementation, and not runtime
authority.

## Relationship To PR #280 Preflight

PR #280 added `scripts/ag-work-resume-packet-preflight.mjs`, which validates
packet JSON before Local B uses it as read-only resume context. This builder
creates a sanitized packet preview that should pass that preflight in strict
mode when supplied complete public-safe inputs.

Preflight remains the validation layer. The builder does not replace validation
and does not decide whether a target local runtime may import, map, execute, or
record anything.

## Inputs

The builder accepts explicit input objects only:

- `workBrief`: a `WorkBrief`-compatible object from existing work brief
  surfaces.
- `stateBrief`: a narrow state brief shape containing agent instructions,
  notable state keys, and codex handoff hints.
- `handoffDraft`: optional handoff-like preview values.
- `git`: explicit Git metadata supplied by the caller: remote, base branch,
  base commit, working branch, head commit, related PR, and dirty-worktree
  flag.
- `issuer`: runtime instance id, source local label, created surface, and
  optional export event id.
- Optional `created_at`, `expires_at`, `max_recent_work_events`,
  `max_foreign_evidence_refs`, and public-safe foreign refs.

The builder does not fetch these values. Callers must supply them.

## Output Packet Shape

The output follows `augnes.ag_work_resume_packet.v0_2`:

- `schema`
- `packet_kind`
- deterministic `packet_id`
- `created_at`
- `expires_at`
- `issuer`
- deterministic `integrity` hashes
- `source_work`
- `git`
- `handoff`
- `continuity`
- `target_runtime_policy`
- `redaction`
- `bounds`

Preview packet ids are deterministic and shaped like:

```text
resume-packet:preview:<scope-safe>:<work-id-safe>
```

The id is not persisted or recorded by this slice.

## Pure Builder Boundary

The builder:

- does not call the Augnes runtime
- does not call GitHub
- does not call OpenAI
- does not call browser, network, shell, or external services
- does not read the filesystem
- does not run git commands
- does not persist packets
- does not create work events
- does not record evidence or proof
- does not bind sessions

It uses Node built-in crypto only to compute deterministic `sha256:` hashes.

## Sanitization And Redaction

The builder sanitizes derived strings before writing them into the packet. It
omits unsafe raw values and records only category-level redaction notes.

Unsafe content includes:

- local runtime endpoint-specific commands such as `http://localhost` and
  `AUGNES_API_BASE_URL=`
- raw DB paths, including `/tmp/augnes` and `.db`
- tunnel URLs
- unsafe local absolute paths
- secret-like tokens and private-key markers

Redaction notes may say:

- `omitted local-runtime endpoint-specific verification command`
- `omitted unsafe local path reference`
- `omitted raw DB path reference`
- `omitted tunnel URL reference`
- `omitted secret-like verification content`

Notes never include the omitted raw values. The generated packet emits all
unsafe-content redaction flags as `false` because unsafe raw content is omitted
from the output packet.

## Existing Surfaces

The builder derives packet fields from existing read surfaces:

- `WorkBrief`: source work, recent work event summaries, related state keys,
  proof/action refs, docs, constraints, and suggested verification.
- `StateBrief`: agent instructions, notable state keys, likely files, and
  verification commands.
- Optional handoff-like preview: explicit expected files/checks, boundaries,
  stop conditions, and handoff id/status when already provided by a caller.
- Explicit Git metadata: supplied by the caller rather than inferred from the
  local checkout.

## Authority Boundary

This slice adds no route, no database/schema change, no persistence, no import,
no Direct Resume Code route, no relay, no proof/evidence recording, no work
event creation, no session binding, no approval, no publish/retry/replay, no
merge, and no committed-state mutation.

Generated packets are read-only context transfer aids. They are not approval,
not proof/evidence authorization, not local work item creation authority, not
Codex execution authority, and not merge/publish authority. Durable approval
remains user/Core gated.

## Future Route Or Helper Note

A later PR may wire this pure builder into a read-only route or ChatGPT App
surface only after user/Core explicitly scopes that surface and preserves the
same no-import, no-execution, no-proof/evidence, no-merge, and no-state-mutation
boundaries.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-packet-builder-preview
npm run smoke:ag-work-resume-packet-preflight
git diff --check
```

For this pure builder slice, browser verification is skipped with:

```text
browser verification skipped: no rendered UI/operator surface changed in this pure builder/helper slice
```
