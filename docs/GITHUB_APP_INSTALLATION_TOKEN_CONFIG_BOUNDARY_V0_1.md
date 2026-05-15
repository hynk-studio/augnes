# GitHub App Installation Token Config Boundary v0.1

This document defines the future GitHub App installation-token configuration
boundary for Augnes. It is design/config boundary only.

## Status

The GitHub App installation-token provider is not implemented.

This v0.1 boundary adds:

- future config names
- validation and redaction rules
- private key handling rules
- JWT rules
- installation-token exchange boundaries
- permission and repository scoping rules
- expiry handling expectations
- audit/evidence policy
- a recommended future implementation sequence

This v0.1 boundary does not add:

- JWT signing
- private key parsing
- installation access token exchange
- GitHub API calls
- live GitHub publish
- runtime reading of future GitHub App config variables
- DB schema or migrations
- API routes
- Cockpit controls
- ChatGPT App tools

No JWT signing. No private key parsing. No installation access token exchange.
No GitHub API call. No live publish.

The current implemented token provider remains env `GITHUB_TOKEN` only through
`resolveGitHubPublishToken()`.

## Future Config Names

The following names are reserved for future design and implementation work.
runtime code does not read these names in this PR:

- `AUGNES_GITHUB_APP_ID`
- `AUGNES_GITHUB_APP_CLIENT_ID`
- `AUGNES_GITHUB_APP_PRIVATE_KEY_PATH`
- `AUGNES_GITHUB_APP_PRIVATE_KEY_BASE64`
- `AUGNES_GITHUB_APP_PRIVATE_KEY`
- `AUGNES_GITHUB_APP_INSTALLATION_ID`
- `AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST`
- `AUGNES_GITHUB_APP_PERMISSION_PROFILE`
- `AUGNES_GITHUB_APP_TOKEN_PROVIDER=installation_token`

Future implementation may choose app ID or client ID for JWT issuer handling,
but it must be explicit about which value is used and why. GitHub's current
documentation accepts the GitHub App client ID or application ID as the JWT
`iss` value and recommends the client ID.

Config validation must fail closed. Missing, empty, malformed, or unsupported
future GitHub App config must make the installation-token provider unavailable;
it must not fall back to broader credentials or accept request-supplied secrets.

## Private Key Boundary

Future private key support must follow these rules:

- Do not commit private keys.
- Do not log private keys.
- Do not print a private key path if it reveals sensitive local structure.
- Do not store private key material in Augnes DB tables.
- Do not include private key material in evidence records.
- Do not include private key material in PR bodies.
- Do not include private key material in screenshots.
- Do not include private key material in docs.
- Prefer runtime secret manager or environment injection in production.
- If file path use is later allowed, path handling must be reviewed in a
  separate implementation PR.
- Base64/private-key env mode must have redaction tests before implementation.

Future code must treat `AUGNES_GITHUB_APP_PRIVATE_KEY_PATH`,
`AUGNES_GITHUB_APP_PRIVATE_KEY_BASE64`, and
`AUGNES_GITHUB_APP_PRIVATE_KEY` as secret-bearing config. Public-safe metadata
may report only bounded categories such as `private_key_source=env_base64` or
`private_key_source=file_path_redacted`; it must not report the raw key or a
sensitive path.

## JWT Boundary

GitHub App JWT creation is future work only. This PR does not sign, parse,
return, store, or log JWTs.

Future JWT signing must use RS256. Required claims must include:

- `iat`
- `exp`
- `iss`

The `iat` value should allow clock drift. GitHub's docs recommend setting it
60 seconds in the past. The `exp` value must be short-lived and not more than
10 minutes in the future. The `iss` value must identify the GitHub App using
the selected app/client identifier.

In compact form: `exp` must be not more than 10 minutes in the future.

JWTs must not be:

- logged
- stored
- returned in API responses
- recorded as evidence
- included in PR bodies
- included in screenshots
- included in docs

JWT creation is not approval, readiness, publication, or proof.

## Installation Token Boundary

Future installation-token support must create a GitHub App JWT first, identify
the target installation ID, then POST to:

```text
/app/installations/{installation_id}/access_tokens
```

GitHub's docs say installation access tokens expire after 1 hour. The token
response includes an `expires_at` timestamp; future provider code must track
that timestamp and treat expired or near-expired tokens as unavailable for new
publish attempts.

Installation token response handling rules:

- Do not store the raw installation token in the DB.
- Do not log the raw installation token.
- Do not return the raw installation token in API responses.
- Do not record the raw installation token in evidence records.
- Do not include the raw installation token in PR bodies, screenshots, or docs.
- Do not store the raw JWT used to request the token.
- Do not persist token response bodies as raw payloads.
- Do not use the installation token for anything except the approved outbound
  GitHub adapter operation.

The provider may cache an installation token in memory later only with explicit
design. Any cache design must include expiry checks, permission/profile checks,
target matching, cache invalidation rules, and redaction tests. There is no
in-memory cache in this PR.

Token availability is not approval or readiness. GitHub App installation is not
user or PM approval. Installation-token resolution is not publication.

## Repository And Permission Scoping

This section defines repository allowlist and permission minimization rules.

Future provider implementations should scope installation tokens down wherever
possible. GitHub's docs allow the installation access token request to include
`repositories` or `repository_ids` and `permissions`, within the access already
granted to the app installation.

Augnes future rules:

- Use `AUGNES_GITHUB_APP_REPOSITORY_ALLOWLIST` to define allowed owner/repo
  targets.
- Match the Core-gated `target_ref` against the stored publication target and
  repository allowlist before token exchange.
- Do not grant broader repository access than the target requires.
- For PR comments, minimize `AUGNES_GITHUB_APP_PERMISSION_PROFILE` to the
  required GitHub permission set for creating an issue/PR comment.
- The requested installation token cannot exceed permissions granted to the app
  installation.
- A token scoped to all installation repositories should be rejected unless a
  later explicit design proves that broader scope is necessary and safe.
- Permission profile names must map to deterministic request bodies; request
  bodies must not supply free-form permission JSON.

Target matching remains a Core-gated publish responsibility. The token provider
must not override `target_ref`, target surface, approval decision, readiness
state, delivery idempotency, or allowlist checks.

## Core-Gated Publish Integration

Token resolution remains after Core gates and before adapter execution.

`dry_run=true` remains token-free.

`dry_run=false` requires token availability before delivery row creation and
adapter execution, unless the request is a same-key sent/acknowledged replay
returning an existing durable artifact.

Same-key sent/acknowledged replay must remain able to return without token
resolution or adapter calls.

Request bodies must not supply:

- `github_token`
- `token`
- `GITHUB_TOKEN`
- `private_key`
- `github_app_private_key`
- `github_app_private_key_base64`
- `github_app_private_key_path`
- `app_id`
- `client_id`
- `installation_id`
- `github_app_installation_id`
- `permission_profile`
- `repository_allowlist`

Existing C5 gate semantics must not loosen. A future GitHub App provider only
changes how Augnes resolves an outbound credential; it does not change whether
publish is allowed to use one.

## Audit And Evidence Policy

Evidence records may record public-safe provider metadata only, such as:

- provider source, for example `github_app_installation_token`
- availability, for example `available` or `unavailable`
- token expiry timestamp, for example `expires_at`
- bounded error category, for example `missing_installation_id`,
  `allowlist_mismatch`, `permission_profile_unsupported`, or
  `installation_token_exchange_failed`

Evidence records must not include:

- raw token
- installation token
- JWT
- private key
- private key path when sensitive
- base64 private key material
- GitHub App secret-bearing config
- raw token exchange response body

PR bodies must mention only bounded public-safe metadata. Screenshots must not
include secret material. Logs must not include raw token/JWT/private-key values
or secret-bearing config.

## Future Implementation Sequence

Recommended future sequence:

1. Config reader/validator with no GitHub calls.
2. Offline JWT signing fixture using a fake key only, no network.
3. Installation-token exchange behind an explicit opt-in smoke, no live
   publish.
4. Provider integration with C5 after config, JWT, redaction, and exchange
   boundaries are covered.
5. Optional in-memory cache with expiry and permission/target guards.
6. Live test only with explicit user/PM target approval.

Each future slice should restate whether it reads secret config, signs JWTs,
calls GitHub, creates installation tokens, changes C5 gate semantics, or
executes live publish.

## Reference Facts

This boundary reflects current GitHub Docs for GitHub App authentication:

- A GitHub App JWT is required to generate an installation access token.
- The JWT must be signed with RS256 and include `iat`, `exp`, and `iss`.
- GitHub says JWT `exp` must be no more than 10 minutes in the future.
- Installation-token creation uses
  `POST /app/installations/{installation_id}/access_tokens`.
- Installation access tokens expire after 1 hour.
- Installation token access can be scoped by repositories or repository IDs and
  permissions, within the app installation's granted access.

References:

- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
