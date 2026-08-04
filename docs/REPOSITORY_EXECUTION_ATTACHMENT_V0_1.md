# Repository execution attachment v0.1

## Purpose

CDX2B2A establishes one trusted, node-local repository attachment for a
canonical Augnes project. It answers one question: can later managed delegation
start from the exact project, root, work, and bounded repository state that the
user already established? This phase prepares and validates that answer. It
does not execute it.

The product doctrine is:

> strongly identify the repository, project, and current work once; create one
> exact execution attachment; later permit broad local reversible autonomy only
> within that attachment.

## Separate meanings

These records are deliberately not interchangeable:

- `CanonicalProjectIdentity` is durable project meaning.
- `ProjectLocalRootBinding` is the canonical local path binding.
- `physical_root_baseline.v0.1` is a node-local physical identity baseline for
  that binding.
- Browser active selection is presentation and mutation context only.
- `repository_execution_attachment.v0.1` is a prepared future-execution
  binding.
- a managed-run binding remains CDX2B2B work.

Git remote equality is external-reference evidence. It is never physical
identity and never authorizes adoption or rebind.

## Physical-root baseline

The canonical database stores one current baseline per workspace, project, and
local node scope. The baseline binds the root-binding fingerprint to the
existing NativeHost physical-root observation: canonical realpath fingerprint,
filesystem volume/device identity, filesystem object identity, observation
time, provenance, and a deterministic baseline fingerprint.

On macOS and Linux, the current adapter contract uses `realpath`, directory
`stat` device, and inode identity. Known network filesystem types fail as
`identity_unsupported`; known virtual filesystem types with ambiguous object
stability fail as `identity_ambiguous`. Windows returns
`identity_unsupported` until a stable volume/file-ID adapter is implemented and
verified on an actual Windows filesystem. PR #117 has actual filesystem proof
on macOS. Linux has adapter-contract coverage but no separate Linux filesystem
proof. No Windows verification is claimed, and Windows managed delegation
remains unavailable. Broad CDX2B2B rollout therefore requires either a
verified Windows adapter or an explicitly macOS-only product boundary.

New canonical onboarding observes and creates the project, root binding, and
baseline in the same confirmation flow. Project/root/baseline writes commit
together, so the directory confirmation is not followed by a second prompt.
The baseline write expects absence and rolls the onboarding transaction back
if any exact or different baseline appeared concurrently.

An existing project without a current-node baseline reports
`baseline_adoption_required`. The explicit adoption action requires the exact
project/root admission fingerprint and the expected physical observation
fingerprint. The preview also creates one expiring decision request. Only the
same-origin Browser project-settings confirmation can issue its one-time grant.
The established one-time local-review bootstrap creates a separate decision
session in an `HttpOnly`, `SameSite=Strict`, project-route cookie. The database
stores only session-secret and rotating action-nonce hashes. The Browser first
obtains a request-bound challenge and then consumes that exact nonce atomically
with the grant. Origin, Host, forwarded-header, and Fetch Metadata checks remain
defense in depth; forged headers without the session cookie receive 401/403.
The MCP proxy, Companion access record, runtime manifest, tool output, and
delegated environment expose no bootstrap, decision-session, or challenge
capability. An MCP literal or assistant prose is not confirmation. Grant consumption and
baseline insertion share one immediate transaction. Exact consumed replay is
idempotent; missing, expired, mismatched, reused-for-another-state, or stale
input refuses. The ordinary meaning is “Use this folder as this project's
trusted execution root.” Adoption grants no execution authority.

A moved root never rebinds automatically. Explicit rebind requires the expected
old root binding, exact expected old current-node baseline, exact new
observation, and a Browser-confirmed decision grant. One transaction
updates the root, creates the replacement baseline, stales the prior prepared
attachment, consumes the grant, and records a bounded idempotency receipt.
Replacement uses an exact old-baseline compare-and-swap; no ordinary caller can
overwrite another baseline by project/node scope alone. Remote equality may
help the UI suggest a folder, but cannot approve the mutation.

Replacing a repository with a different filesystem object at the same path is
a physical mismatch. Augnes does not create a new baseline or attachment and
does not rebind automatically.

## Persistence, recovery, and portability

The additive canonical schema owns physical baselines, execution attachments,
bounded root-rebind receipts, and bounded decision requests/grants. Canonical
migration, schema-integrity,
backup/restore, recovery validation, packaging, and database copying include
these tables. Removing a project from recents preserves its canonical project
data and node-local baseline; canonical project deletion cascades the linked
metadata if a separately authorized deletion owner removes the identity.

Physical identity and decision grants are machine-local, not portable project
truth. Portable export explicitly excludes physical baselines, attachments,
decision requests/grants, and rebind receipts. Import preserves canonical
workspace/project identity and creates the
destination root binding through the existing importer, but the destination
node has no trusted baseline. It requires one node-local adoption before
execution preparation. Device/inode or future Windows File IDs are never
compared across node scopes.

## Project-scoped execution admission

`project_execution_admission.v0.1` is a pure project-scoped projection. It
combines the canonical project/root, current-node baseline, current
TaskContextPacket and current-work semantic fingerprint, existing managed-run
state, and a bounded worktree observation. Browser active project ID is
returned only as non-binding observation metadata. Active selection ID and
selection revision are excluded from eligibility and the admission
fingerprint.

CDX2A remains unchanged. Its active-project projection can truthfully describe
repository A as inactive and Start-ineligible while Browser selects B, even
while CDX2B2A separately reports A's project-scoped admission as ready.

## Bounded worktree observation

For Git repositories, the observer uses bounded read-only Git plumbing with
optional locks disabled. It records repository/worktree kind, the canonical
Git common-directory fingerprint, HEAD commit, branch/detached/unborn state,
the staged-index listing fingerprint, tracked dirty-path fingerprint,
unstaged tracked-diff content fingerprint, bounded untracked entries containing
normalized path/size/content hash, and relevant submodule state. Contents are
hashed and never returned. The v0.1 bounds are 4,096 changed/untracked paths,
8 MiB per inspected working-tree file, and 32 MiB total Git/content evidence.
Exceeding a path, individual-file, total-byte, race, entry-kind, or dirty
submodule bound returns an ambiguous state and blocks preparation; it never
falls back to path-only evidence.

For non-Git projects it records an explicit `plain_folder` observation for
continuity, but project execution admission returns
`non_git_execution_unsupported`. CDX2B2A never produces a ready attachment
whose worktree fingerprint cannot detect file changes. Physical identity and
worktree state remain separate fingerprints.

## Attachment lifecycle

The attachment binds:

- workspace and project identity;
- local node scope;
- physical-root baseline and canonical root binding;
- TaskContextPacket ID and fingerprint;
- current-work semantic fingerprint;
- project-scoped admission fingerprint;
- bounded worktree-observation fingerprint;
- managed-run state fingerprint;
- preparation time and the v0.1 freshness policy.

Browser project ID and selection revision are not binding inputs. Exact repeated
preparation returns the same active attachment. Changed material deterministically
supersedes the prepared attachment, and bounded retention prevents unbounded
duplicates.

Preparation observes the physical root/worktree, computes one proposed
admission, then enters an immediate canonical transaction. Inside it, Augnes
re-reads the root binding, baseline, TaskContextPacket, current-work semantic
fingerprint, and managed-run state and compares one exact database-state
fingerprint before inserting or superseding. After commit it re-observes the
physical root, then the bounded worktree, and only then performs the final
canonical database admission read. Any difference produces a deterministic
compensating stale transition and no exact prepared result. A packet/work,
root/baseline, or managed-run write that commits during either post-commit
filesystem observation is therefore included in the final comparison.

Lifecycle values are `prepared`, `stale`, `superseded`, `revoked`, and the
reserved `consumed`. CDX2B2A never produces `consumed`. Validation classifies a
prepared attachment stale for physical mismatch, root rebind, packet/current
work change, project loss, conflicting managed run, bounded worktree change,
freshness expiry, or explicit revocation. Browser selection, tabs, filters,
ordering, views, and unrelated project changes do not alter it.

## Product and authority boundary

The normal preparation tool says only that the named project is ready to
continue and returns an opaque attachment plus machine-readable projection.
Ordinary text does not expose raw paths, device IDs, inode/file IDs, database
paths, credentials, or internal ownership material.

Preparation, validation, adoption, rebind, supersession, and revocation may
write only their canonical metadata. All project-file, project-command,
managed-run creation, Start, provider, branch/commit, GitHub, semantic
approval, result admission, Transition, merge, release, deployment,
publication, and external-effect authority flags remain false. Explicit
revocation uses the same preview, Browser grant, atomic consumption, and exact
replay rules as adoption and rebind. CDX2B2B must later validate and consume an
attachment and create its managed run atomically; separate validation followed
by run creation is not sufficient.
