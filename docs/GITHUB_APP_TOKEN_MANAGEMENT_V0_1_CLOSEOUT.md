# GitHub App Token Management v0.1 Closeout

GitHub App/token management v0.1 is complete as a bounded foundation and
authority-boundary line.

This closeout does not mark live GitHub App provider integration complete. It
does not mark live installation-token exchange complete. It does not authorize
or execute live publish.

## Status

GitHub App/token management v0.1 is complete for:

- current env `GITHUB_TOKEN` provider behavior
- public-safe token redaction boundaries
- future GitHub App installation-token components through a network-disabled
  exchange boundary
- docs and smoke coverage for secret handling and no-live-network behavior

The completed line is not:

- live GitHub App installation-token provider integration
- live installation-token exchange
- live publish
- Cockpit write controls
- ChatGPT App write tools
- approval to use broad GitHub write authority

## Completed Chain

The v0.1 line completed these slices:

- env `GITHUB_TOKEN` provider foundation
- provider redaction and public-safe response boundary
- C5 token resolution moved behind `resolveGitHubPublishToken()`
- `lib/github-publication.ts` receives a token explicitly and no longer
  resolves `process.env.GITHUB_TOKEN` itself
- GitHub App installation-token config boundary
- GitHub App config reader/validator in `lib/github-app-config.ts`
- offline RS256 JWT fake-key fixture in `lib/github-app-jwt.ts`
- target/allowlist policy helper in `lib/github-app-target-policy.ts`
- installation-token exchange boundary helper in
  `lib/github-app-installation-token-exchange.ts`
- network-disabled-by-default exchange behavior
- injected fake-fetch exchange smoke
- docs and smokes for secret redaction

## Authority Boundary

Token availability is not approval.

Token availability is not readiness.

Config validation is not token resolution.

JWT creation is not token resolution.

Target policy is not approval, readiness, publication, or proof.

The exchange boundary is not publication.

Live GitHub App installation-token exchange is future work.

Live publish remains separately approved and target-specific.

env `GITHUB_TOKEN` remains the only implemented publish token provider.

The GitHub App installation-token provider is not wired into C5.

C5 gates remain unchanged.

PR #67 and PR #81 live comments are historical target-specific evidence. They
do not authorize future broad posting or automatic live publish.

## Secret Handling Boundary

Raw GitHub tokens must not be:

- logged
- persisted
- returned in API JSON
- written to evidence records
- included in PR bodies
- included in screenshots
- included in docs

Raw JWTs must not be logged, persisted, returned, or recorded.

Private key material, private key paths, and base64 private-key config must not
be logged, persisted, returned, or recorded.

Raw installation-token exchange response bodies must not be persisted.

Public-safe metadata may contain only bounded categories, counts, booleans,
expiry timestamps, provider source, and permission keys. It must never contain
raw token, JWT, private key, private-key path, base64 key, authorization header,
or raw exchange response values.

## Future Work Outside v0.1

These items are explicitly outside GitHub App/token management v0.1:

- live GitHub App installation-token exchange
- provider integration into `resolveGitHubPublishToken()`
- C5 GitHub App provider path
- live exchange test
- live publish with GitHub App token
- in-memory token cache
- installation token refresh
- Cockpit publish/write controls
- ChatGPT App publish/write tools
- retry design
- broader permission profiles
- multi-repo or all-repo token scoping
- hosted auth and deployment secret-manager integration

## Recommended Next Sequence

Recommended next work, given the planned product focus:

1. UI polishing / Cockpit MVP polish.
2. Demo/submission readiness closeout.

Later GitHub App/token work should resume as separately approved slices:

1. Provider integration design with network-disabled default.
2. Live exchange test only with explicit user/PM approval.
3. Core-gated write controls as a separate productization phase.
4. RawEpisodeBundle runtime as a separate research/runtime phase.

Any future live exchange or live publish must include explicit user/PM approval
for the target, installation ID, permission profile, token use, and no broad
posting boundary.
