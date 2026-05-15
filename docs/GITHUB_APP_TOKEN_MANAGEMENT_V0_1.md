# GitHub App Token Management v0.1

This document defines the narrow token authority model for outbound GitHub
publication credentials. The implementation in this PR adds only an internal
token provider abstraction for the existing env-token behavior.

## Current Implemented Provider

Current implemented provider: env `GITHUB_TOKEN` only.

`resolveGitHubPublishToken()` reads the runtime `GITHUB_TOKEN`, trims it, and
returns it only to the internal C5 publish caller. If the variable is unset or
empty, it reports unavailable. It does not call GitHub, create a GitHub App
installation token, read private key files, persist a token, or add new runtime
environment variable handling.

`lib/github-publication.ts` does not resolve credentials. It receives an
explicit token from its caller and uses that token only for adapter execution
after delivery/idempotency checks reach the outbound side-effect boundary.

The provider may compute a bounded SHA-256 prefix fingerprint for internal
diagnostics. API routes should not return that fingerprint by default. Public
response metadata must omit the raw token.

## Future Provider

Future provider: GitHub App installation token, design only.

A later PR may add a GitHub App installation-token provider. That work must be
separately scoped and reviewed because it crosses additional secret, storage,
permission, expiry, and audit boundaries. This v0.1 slice does not implement a
live installation-token exchange.

GitHub App installation token support is design only in this document and must
ship in a separate PR.

Future GitHub App work should define:

- installation id storage boundary
- private key storage boundary
- app id and client id boundary
- installation-token exchange
- token expiry and refresh behavior
- permission minimization
- repository allowlist and target matching
- audit and evidence records without secret exposure

The first follow-up design/config boundary is
`docs/GITHUB_APP_INSTALLATION_TOKEN_CONFIG_BOUNDARY_V0_1.md`. It reserves future
config names and documents JWT, private key, installation-token exchange,
expiry, repository allowlist, permission minimization, Core-gated integration,
and evidence policies. It is design/config boundary only: runtime code does not
read the future GitHub App config names, sign JWTs, parse private keys, call
GitHub, or create installation tokens.

## Token Authority Boundary

Token availability is not approval.

Token availability is not readiness.

GitHub App installation is not user or PM approval.

Token resolution is not publication.

Token resolution must happen after Core gates and before adapter execution.

`dry_run=true` must never require or use a token.

`dry_run=false` still requires token availability before delivery rows are
created or the GitHub adapter is invoked, unless the request is a same-key
sent/acknowledged replay returning an existing durable artifact.

## Token Handling Policy

Raw GitHub tokens must not be:

- stored in Augnes tables
- logged
- returned in API responses
- written to evidence records
- included in PR bodies
- included in screenshots
- included in docs

Request bodies must not supply `github_token`, `token`, or `GITHUB_TOKEN`.
Outbound credential resolution belongs to Augnes runtime configuration, not to
publication request payloads.

## Implemented Runtime Boundary

The C5 Core-gated GitHub PR comment publish route separates two questions:

- Whether Core gates allow an actual publish attempt for one exact target.
- How Augnes resolves the outbound GitHub credential after those gates pass.

The provider abstraction answers only the second question. It does not approve,
dry-run, publish, retry, replay, create delivery rows, mutate publication
status, record proof, update mailbox state, commit or reject Augnes state, call
OpenAI, call GitHub, add Cockpit write controls, or add ChatGPT App tools.

## Non-Goals For v0.1

This v0.1 slice does not:

- implement live GitHub App installation-token exchange
- parse private keys
- add runtime handling for GitHub App app id, client id, private key, or
  installation id env vars
- read reserved future GitHub App config names
- call GitHub
- post to GitHub
- run a live C5 publish test
- accept request-supplied tokens
- expose raw tokens through API JSON
- persist tokens
- change DB schema or migrations
- change C5 approval, readiness, idempotency, target, freshness, or delivery
  semantics
- add Cockpit write controls
- add ChatGPT App tools
