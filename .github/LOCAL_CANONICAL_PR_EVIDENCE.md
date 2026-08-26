# Local Canonical pull-request evidence policy

## Purpose and authority

This optional layer publishes a bounded projection of one current deciding
Local Canonical receipt into one dedicated Draft pull-request comment. It does
not run verification, change receipt authority, or publish automatically.
Publication requires an explicit command and explicit user authority for the
exact pull request.

The three artifacts have different roles:

1. The ignored local receipt is the complete machine-readable result and the
   only deciding local evidence.
2. The publication envelope is a public-safe load-bearing projection of that
   receipt, deterministically serialized and fingerprinted.
3. The mutable GitHub comment stores the envelope for review and remote-only
   structural verification.

SHA-256 provides content integrity. It is not a signature, proof that the
publisher could not fabricate content, or independent authentication of the
local environment. GitHub stores the comment; GitHub did not run the tests,
recompute the receipt, or create a status check.

## Commands

Prepare locally without a GitHub write:

```bash
npm run verify:local:evidence:prepare -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

Publish only after inspecting the ignored preparation artifacts:

```bash
npm run verify:local:evidence:publish -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json \
  --confirm-publish
```

Verify the remote projection alone or link it back to the local receipt:

```bash
npm run verify:local:evidence:verify -- --pr <positive-pr-number>
npm run verify:local:evidence:verify -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

The commands use the installed `gh` CLI as an argument-safe transport. The
repository, owner, endpoint shapes, and marker are fixed in source. The command
line cannot supply a repository, URL, API path, GraphQL document, issue number,
comment ID, or authentication material.

## Eligibility and exact identity

Preparation and publication fail closed unless all of these facts agree:

- the local root and `origin` are the authorized repository;
- the local worktree is clean and attached to the Draft PR head branch;
- local `HEAD`, the pushed remote branch, the live PR head, and receipt head are
  the same exact SHA;
- live `main`, the live PR base, and receipt base are the same exact SHA;
- the PR is open, Draft, same-repository, and based on `main`;
- the existing receipt validator returns `valid_deciding_evidence=true`;
- the receipt is `changed` or `full`, never `quick`;
- the receipt uses the exact Canonical Node policy, has a pass result, contains
  every selected phase, and has complete cleanup with zero owned processes;
- receipt integrity, lockfiles, executor, plan, environment, and current
  repository state remain valid.

A moved base, changed head, dirty tree, unpushed head, fork, non-Draft PR,
failed/quick/stale receipt, timeout, missing phase, or cleanup residue blocks
publication. Running Local Canonical verification never triggers publication.

## Public envelope and privacy

The `augnes.local-canonical-pr-evidence.v1` envelope contains exact repository,
PR, base/head, branch, receipt/executor/lock fingerprints, mode and plan,
environment versions, finite run and phase durations, fixed public phase
commands, pass/timeout/cleanup states, and zero-process results. It also
contains fixed trust-boundary text and its own deterministic SHA-256 content
fingerprint.

It excludes the authorized local path, receipt path, machine fingerprint,
username, GitHub login, hostname, serial number, hardware UUID, environment
dump, credentials, tokens, stdout/stderr, raw logs, prompts, model output,
database/provider material, and hidden reasoning. Arbitrary receipt prose is
not projected. The envelope is capped at 32 KiB and the rendered comment at
48 KiB.

Full receipts and logs stay under the ignored
`.augnes-local-verification/` directory. Preparation envelopes, previews, and
publication/verification records stay under the ignored
`.augnes-local-verification/publications/` directory with bounded sizes and
retention. Real directories and files are required; symlink redirection is
refused.

## Comment ownership, idempotence, and replacement

The tool owns one complete top-level comment delimited by:

```text
<!-- augnes-local-canonical-pr-evidence:v1 -->
<!-- /augnes-local-canonical-pr-evidence:v1 -->
```

Unrelated comments are ignored and never edited. Zero marker comments permits
one create. One marker comment is parsed and verified. Multiple marker
comments, a partial marker, malformed JSON, a noncanonical renderer result, or
an invalid fingerprint fails closed. The tool never deletes a comment.

Publishing the identical prepared fingerprint performs a fresh remote read,
confirms the comment ID, body hash, update timestamp, marker, and fingerprint,
then returns `idempotent_noop`. It performs no GitHub write and reads again to
prove the body hash and update timestamp remained unchanged.

A different publication is never overwritten implicitly. Replacement requires
both explicit publication confirmation and the exact currently published
fingerprint:

```bash
npm run verify:local:evidence:publish -- \
  --pr <positive-pr-number> \
  --receipt .augnes-local-verification/receipts/<receipt>.json \
  --replace-existing <exact-prior-publication-fingerprint> \
  --confirm-publish
```

Immediately before update, the tool re-reads the exact remotely discovered
comment and compares its ID, marker structure, body hash, and prior
fingerprint. The new envelope records the superseded fingerprint. These
optimistic checks reduce accidental overwrite; they are not an atomic
distributed lock against every concurrent manual edit.

## Verification and trust

Remote-only verification locates exactly one marker comment, checks its bounded
canonical structure and envelope fingerprint, and compares repository, PR,
base, head, and branch against the live Draft PR. It can establish only that
the current comment contains an internally consistent, current pass/cleanup
claim. It cannot independently recompute the local receipt, executor,
lockfiles, environment, or omitted receipt fields.

Local-linked verification additionally runs the existing deciding receipt
validator against the current clean exact head, reconstructs the projection
using the comment's publication metadata, and compares every envelope field.
It returns `local_linked_match=true` only for an exact match. Neither mode
turns the comment into independent attestation.

The transport creates or updates only the dedicated issue-comment endpoint.
There is no status, check run, deployment, workflow, review, label, branch,
commit, merge, ready-for-review, auto-merge, or repository-setting path.

## Transfer boundary

This temporary repository hard-binds the authorized repository and local root.
An eventual separately authorized transfer to another repository must review
and deliberately replace those authority constants, comment policy, and local
artifact handling. This implementation does not contact or modify that future
repository and does not add repository-specific product identity.
