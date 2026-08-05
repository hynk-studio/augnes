# Repository execution attachment v0.1

## Purpose

CDX2B2A establishes one trusted, node-local repository attachment for a
canonical Augnes project. CDX2B2B consumes one exact prepared attachment into
one admitted managed run after one independent Browser start decision. Together
they answer: can one worker start from the exact project, root, work, bounded
repository state, adapter, and execution envelope the user established?

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
- a managed-run binding is the one exact CDX2B2B consumption result and never
  replaces project identity, root identity, or the immutable attachment.

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
remains unavailable. CDX2B2B v0.1 therefore adopts an explicit macOS-only
product boundary; a wider rollout requires separate Linux proof and a verified
Windows adapter.

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

The CDX2B2B additive migration rebuilds the attachment constraint so
`consumed` requires a non-null run ID, adds the one-run uniqueness index, and
adds the start-decision action while preserving every valid CDX2B2A row. An
impossible legacy consumed row fails migration rather than inventing a run.
Backup/restore retain consumed attachment/run lineage and decision receipts.
Recovery may project a restored nonterminal run as disconnected/paused, but it
does not reconstruct a controller or automatically launch another worker.

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

Lifecycle values are `prepared`, `stale`, `superseded`, `revoked`, and
`consumed`. CDX2B2A never produces `consumed`; only the CDX2B2B start owner may
set it, and only with a non-null exact `consumed_run_id` in the same transaction
that admits that run. A consumed attachment never returns to prepared and one
attachment cannot bind two runs. Validation classifies a
prepared attachment stale for physical mismatch, root rebind, packet/current
work change, project loss, conflicting managed run, bounded worktree change,
freshness expiry, or explicit revocation. Browser selection, tabs, filters,
ordering, views, and unrelated project changes do not alter it.

## Attachment-backed managed delegation

`repository_execution_envelope.v0.1` binds the macOS platform boundary,
attachment-backed run mode, exact-root filesystem scope, adapter/capability
versions, timeout and settle bounds, result budgets, protected-untracked-path
fingerprint, and allowed/forbidden operation categories. The start expected
state additionally binds every attachment input, the current database-state
fingerprint, and request/expiry timestamps.

`augnes_request_repository_delegation` creates or replays one expiring start
decision request but creates no run. The user confirms that exact request in
the existing Browser project card using the separate HttpOnly decision session
and rotating request-bound nonce. The MCP proxy exposes no session, bootstrap,
challenge, nonce, cookie, or confirmation operation. Normal attachment
preparation needs no decision; only Start and the pre-existing identity/revoke
exceptions require Browser confirmation.

Start first observes the physical root and bounded Git worktree and compiles
the adapter capability and envelope. Inside one immediate transaction it
validates and consumes the Browser grant, re-reads every DB-owned attachment
input, requires no conflicting nonterminal run, prepares and admits one
existing NativeHost claim, marks the attachment consumed with that run ID, and
creates the canonical queued run and initial events. Failure at any mutation
boundary rolls back grant, attachment, and run together.

After commit, Augnes observes physical root, bounded worktree, protected
untracked paths, and adapter capability, then reads canonical database state
last. The existing NativeHost delivery path repeats that gate immediately
before invocation. Any drift blocks the same run without invoking the worker;
the attachment remains consumed for truthful reconciliation. Exact replay
returns the same run and launches no second controller, provider request,
command, or file mutation. Its ordinary text is derived from the exact run
projection and distinguishes queued, starting, running, waiting for approval,
cancelling, paused/disconnected, blocked, completed, failed, cancelled, and
timed-out states. `worker_started` means that this specific Start request newly
started the worker; it is false for exact replay even when the bound run still
has an owned worker.

The envelope pre-authorizes bounded repository reads, in-root file creation and
edits, tracked-file deletion, local tests/typechecks/linters/formatters/builds,
Git inspection, and bounded local branch/commit work. It refuses arbitrary
project-command network access, dependency downloads, push/GitHub, release,
deployment, publication, injected Browser/Companion/provider/database/runtime
or OS credentials, outside-root secret material or writes, OS persistence, and
semantic authority. System secrets outside the repository remain blocked by
the root/sandbox boundary. Files already present inside the exact repository
remain within repository read scope and are not made technically unreadable by
content classification; no such content or secret-detection result is added to
MCP output. A destructive change that could cover pre-existing
untracked user data is not silently pre-authorized. Existing NativeHost
operation approval remains separate from Start and stays bound to the exact
run/operation. Cancellation is selection-independent, exact-run scoped, and
idempotent. It relies only on the immutable consumed attachment/run binding and
exact controller ownership, so packet/work expiry or change, root/baseline or
worktree drift, root unavailability/replacement, and Browser selection do not
prevent signalling an owned worker. A queued run cancels atomically without a
worker; a missing controller reports paused/disconnected reconciliation and
never creates or resumes one. Cancellation creates no semantic acceptance.

The existing live service owns one controller per exact project/run. A durable
nonterminal run without that controller projects disconnected/paused and is
not automatically resumed. Completion records normalized result, changed
files, commands/checks, RunReceipt, and at most one proposal pending review.
It never creates ReviewDecision, Transition, accepted-state mutation, work
closure, push, merge, release, deployment, or publication.

## CDX2B4A checkpoint and resume-eligibility boundary

The consumed attachment is immutable start-snapshot metadata. It is never
updated to follow legitimate worker edits. The private additive
`repository_run_resume_checkpoint.v0.1` table records bounded checkpoint
history inside the same database because the existing run/event rows cannot
unambiguously bind one current post-operation filesystem observation and
private provider resume reference without overwriting history.

A checkpoint is admitted only for a durably declared operation that definitely
did not start, or for a durably terminal completed/failed/cancelled operation
with fresh same-boundary physical-root and worktree observations. Exact replay
writes nothing. High-water marks advance monotonically; an older controller,
conflicting terminal, later unclosed start, ambiguous approval, or CAS drift
fails closed. Checkpoint failure never rewrites the RunReceipt/result path and
instead prevents resume-ready eligibility.

`repository_run_resume_eligibility.v0.1` is read-only and selection-independent.
It returns active-owned, terminal, approval-pending, resume-ready,
reconciliation-required, stale, unsupported, or unavailable and one bounded
next action. It never exposes provider thread/turn IDs, operation IDs,
fingerprints, baseline IDs, paths, commands, output, or transcripts. Full local
backup/restore retains checkpoint history; portable project export excludes it
as machine-local operational truth, so an imported project cannot become
resume-ready from another node's checkpoint.

Startup reconciliation never resumes a checkpoint-backed run and does not
append a generic uncertain-effect event over its preserved operation boundary.
It leaves the run for the canonical eligibility read, which can still return
reconciliation-required, approval-pending, stale, unsupported, or unavailable.

CDX2B4A eligibility grants no execution authority by itself. CDX2B4B adds the
separate explicit boundary below; the generic historical live-service API
continues to refuse repository-attachment resume.

## CDX2B4B explicit same-run resume boundary

`repository_managed_resume_preparation.v0.1` creates one 15-minute exact
Browser decision request only from `resume_ready`. The Browser's existing
HttpOnly session, request-bound challenge, rotating nonce, and one-time grant
remain canonical. Apps MCP and the Operator can request the decision and later
submit the exact grant, but cannot issue or confirm it or access Browser
decision-session material. Approval-pending, active, terminal, ambiguous,
stale, unsupported, and blocked states create no Resume grant or attempt.

The private additive `repository_managed_resume_attempt.v0.1` history is needed
to represent repeated lifetime resumes and the provider invocation crash
boundary without overwriting runs, events, or checkpoints. One immediate
transaction consumes the exact grant; compares run, attachment, checkpoint,
high-water marks, revisions, packet/current work, root/baseline/worktree,
envelope, adapter/capability, private provider binding, approvals, conflicts,
and controller ownership; inserts one deterministic attempt; and advances one
controller generation. It never inserts a second run or attachment and never
reconstructs authority from Browser selection.

The post-commit gate rechecks physical root, bounded worktree,
adapter/capability, exact controller absence, then canonical database state.
The attempt records `provider_resume_invocation_started` before the adapter
call. Exact replay before that marker may launch the same attempt once. Once
the marker exists, loss of the controller/result is reconciliation-required
and cannot invoke the provider again. The exact stored
`NativeHostResumeBindingV01` reaches `thread/resume`; `thread/start` is not used.
New lifecycle events and checkpoints bind the resumed generation, while the
original consumed attachment and all prior checkpoints remain immutable.

Cancellation before the invocation marker settles the same attempt with zero
provider calls. After invocation it signals only the exact resumed controller
and stays independent of current packet, root, baseline, worktree, or Browser
selection. The existing result, RunReceipt, and proposal owners settle the same
run idempotently. Resume decision is not operation approval, and run completion
is not ReviewDecision, Transition, accepted state, or work closure.

Backup/restore retains local attempt history. Portable project export excludes
attempt, checkpoint, decision, provider, and controller identity, so another
node cannot import resume-ready or resume-admitted authority. Product support
remains verified local macOS only; startup never automatically resumes.

Managed repository delegation is product-supported only on a verified local
macOS filesystem. Linux remains non-product without a separate real
filesystem/runtime proof. Windows, non-Git, network, virtual, unsupported,
unavailable, and ambiguous roots fail before decision consumption,
attachment consumption, run creation, controller/provider invocation, command,
or project mutation.

## Product and authority boundary

The normal preparation tool says only that the named project is ready to
continue and returns an opaque attachment plus machine-readable projection.
Ordinary text does not expose raw paths, device IDs, inode/file IDs, database
paths, credentials, or internal ownership material.

Preparation, validation, adoption, rebind, supersession, and revocation may
write only their canonical metadata. CDX2B2B Start may additionally consume one
attachment, admit one run, invoke one separately managed worker, and perform
only the bounded local work in its exact envelope. GitHub, arbitrary network,
ambient/outside-root credential or secret access, semantic approval,
ReviewDecision, Transition, accepted-state, work
closure, merge, release, deployment, and publication authority remain false.
Explicit
revocation uses the same preview, Browser grant, atomic consumption, and exact
replay rules as adoption and rebind. Start confirmation, later NativeHost
operation approval, and semantic result review are three distinct authority
boundaries.
