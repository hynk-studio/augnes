# Execution Surface Record

An Execution Surface Record names the places Codex used to inspect, verify, or publish work. It helps reviewers distinguish repo changes from browser checks, ChatGPT Developer Mode checks, MCP Inspector checks, and local runtime checks.

## Allowed Surface Names

Use these canonical names in PRs and completion records:

- `github`
- `browser`
- `chrome`
- `chatgpt_developer_mode`
- `mcp_inspector`
- `local_runtime`

Use `other:<name>` only when none of the canonical names fit.

## Record Format

```yaml
execution_surfaces:
  - surface: github
    purpose: inspect files, create branch, open PR
    authority: code_history
    result: completed
    evidence: PR URL or commit/branch reference
  - surface: browser
    purpose: verify Runtime Cockpit behavior
    authority: verification_only
    result: skipped
    evidence: local runtime unavailable
```

## Surface Guidance

### `github`

Use for repository inspection, commits, branches, PRs, review comments, and CI status. GitHub owns code history, not Augnes committed state.

Live GitHub publication adapter tests are not general GitHub usage. They require
explicit user/PM approval for a specific target, a scoped token, a unique
`idempotency_key`, and replay evidence proving no duplicate comment. PR #67 is
the baseline example: one retained test comment on PR #67, one sent delivery,
and no automatic posting authority.

### `browser` and `chrome`

Use for rendered UI checks. Browser/Chrome can observe behavior and produce evidence summaries. They do not approve state, edit repo, or open PRs by themselves.

### `chatgpt_developer_mode`

Use for ChatGPT App registration, tool invocation, widget checks, and bridge validation. Developer Mode can validate the app surface. It must not become a Codex controller or a commit/reject authority.

### `mcp_inspector`

Use for local MCP tool and widget validation. MCP Inspector may prove that bridge tools read state or record proof, but it does not approve durable state.

### `local_runtime`

Use for Augnes runtime API, cockpit, SQLite-backed state, and local commands. The local runtime owns committed state only through explicit Augnes routes and user decisions.

## PR Checklist Snippet

```text
Execution surfaces used:
- github: inspected files and opened PR
- local_runtime: skipped, no local checkout/runtime available
- browser/chrome: skipped, local UI unavailable
- chatgpt_developer_mode: skipped, no tunnel/runtime available
- mcp_inspector: skipped, no local bridge available
```

## Completion Record Use

When recording completion through `npm run codex:record-completion`, summarize surfaces in `CODEX_RESULT_SUMMARY` or the work event note. Keep the summary short and point to the PR for full evidence.
