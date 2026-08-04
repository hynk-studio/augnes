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

On macOS and Linux, the current adapter uses `realpath`, directory `stat`
device, and inode identity. Known network filesystem types fail as
`identity_unsupported`; known virtual filesystem types with ambiguous object
stability fail as `identity_ambiguous`. Windows returns
`identity_unsupported` until a stable volume/file-ID adapter is implemented and
verified on an actual Windows filesystem. No Windows verification is claimed
by CDX2B2A.

New canonical onboarding observes and creates the project, root binding, and
baseline in the same confirmation flow. Project/root/baseline writes commit
together, so the directory confirmation is not followed by a second prompt.

An existing project without a current-node baseline reports
`baseline_adoption_required`. The explicit adoption action requires the exact
project/root admission fingerprint, the expected physical observation
fingerprint, and literal user intent. Exact replay is idempotent; stale or
mismatched input refuses. The ordinary meaning is “Use this folder as this
project's trusted execution root.” Adoption grants no execution authority.

A moved root never rebinds automatically. Explicit rebind requires the expected
old root binding, expected old current-node baseline (including explicit
absence), exact new observation, and literal user intent. One transaction
updates the root, creates the replacement baseline, stales the prior prepared
attachment, and records a bounded idempotency receipt. Remote equality may help
the UI suggest a folder, but cannot approve the mutation.

Replacing a repository with a different filesystem object at the same path is
a physical mismatch. Augnes does not create a new baseline or attachment and
does not rebind automatically.

## Persistence, recovery, and portability

The additive canonical schema owns physical baselines, execution attachments,
and bounded root-rebind receipts. Canonical migration, schema-integrity,
backup/restore, recovery validation, packaging, and database copying include
these tables. Removing a project from recents preserves its canonical project
data and node-local baseline; canonical project deletion cascades the linked
metadata if a separately authorized deletion owner removes the identity.

Physical identity is machine-local, not portable project truth. Portable
export explicitly excludes physical baselines, attachments, and rebind
receipts. Import preserves canonical workspace/project identity and creates the
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
the staged-index listing fingerprint, tracked dirty-path fingerprint, and a
bounded relevant untracked-path fingerprint. It does not hash repository file
contents or run project commands. Path/output bounds fail closed.

For non-Git projects it records an explicit `plain_folder` observation. Such an
attachment cannot claim branch or commit readiness. Physical identity and
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
publication, and external-effect authority flags remain false.
