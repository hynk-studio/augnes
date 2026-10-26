# Augnes

*Long-horizon work continuity for people and AI agents.*

Augnes maintains the state, temporal lineage, evidence, perspectives,
unresolved judgments, and next meaningful actions of long-horizon work, and
projects the same product meaning into the host-native interfaces where the
user is already working.

Its broader aim is continuous, user-owned problem solving: later work should
be able to reuse, combine, revise or decline methods in light of checked
outcomes and changed conditions. This is a product direction, **not** a claim
that autonomous method learning has already shipped.

The product invariant is the continuity of meaning, not the replication of one
interface. The product is continuous work, not a collection of surfaces.

**Resume / Verify / Decide.**

[Try a method without installing Augnes](#try-a-method-without-setup) ·
[Why Augnes](#why-augnes) · [What works today](#what-works-today) · [Quickstart](#quickstart) ·
[Product direction](#product-direction) ·
[Authority](#repository-authority) ·
[Verification](#canonical-verification)

## Try a method without setup

**Without installing Augnes does not mean zero prerequisites.** This small,
optional workflow-cost calculator estimates **expected total work** for repeated
attempts from supplied success probabilities and attempt, mandatory verification,
repair and optional inspection costs. You still need to download and verify the
files and have Python 3.9+ with permission to run them, or separately install
the Codex Skill on a supported host. The calculator does **not** learn rates,
guarantee deadlines or replace Augnes's local work-continuity runtime.

**Public component preview:** [Augnes workflow-cost Skill/plugin 0.1.0](https://github.com/hynk-studio/augnes/releases/tag/augnes-workflow-cost-v0.1.0) is now available as a **Pre-release**. [Download the complete ZIP](https://github.com/hynk-studio/augnes/releases/download/augnes-workflow-cost-v0.1.0/augnes-workflow-cost-0.1.0.zip) · [Verify and load the Skill](docs/PUBLIC_ASSET_SKILL_USAGE.md). This is not a general Augnes application release, a universal plugin-directory listing or a stable cross-host compatibility claim.

It packages the unchanged **workflow-cost method 1.0.0** and a local Codex catalog. The ZIP is **38,254 bytes**, SHA-256 `082789624f70a1feaca11c4e4fa852f8d6a505caf45d3e2e572df5f40fa8c59d`. Check the archive and enclosed material before execution. The isolated loading observation covers **macOS 26.6.2 arm64 / Codex CLI 0.153.4** only. Installing a Skill requires an explicit user/admin choice of profile; it does not install the private Augnes Operator or Companion.

**No plugin required:** [Is optional inspection worth the work?](publications/workflow-cost-v1/README.md) is also a standalone Python 3.9+ method for agents permitted to execute code. Download its manifest and all four listed files, verify their identities, and run in your own harness. A [no-JavaScript HTML entry](publications/workflow-cost-v1/index.html) is available as static source material; that does not establish a separately hosted service. For simple tasks, direct calculation or non-use may be appropriate.

**Using Augnes itself:** The local-first project/work continuity runtime, installed Companion, and repository Operator are separate from this public calculator component. See the [supported local Quickstart](#quickstart) and its platform and authority limits.

## Why Augnes

Long-horizon AI-assisted work crosses sessions, tools, and hosts. Evidence
accumulates, work is revised, and unresolved judgments carry forward. Resuming
requires knowing the current goal and scope, how the work changed, what
supports a claim, and what needs attention next.

Augnes is local-first and provider-neutral. Browser, ChatGPT Apps/MCP, Codex,
and future hosts keep their own interaction and execution strengths. Augnes
owns continuity around that work rather than rebuilding chat, editors,
terminals, browsers, diffs, pull requests, worktrees, or schedulers.

In practice, continuity means preserving the current goal, scope, and
constraints; meaningful history; source-linked evidence; unresolved
uncertainty and judgment; reviewed decisions; and the next meaningful action.
These responsibilities come from the
[Product and Continuity Doctrine](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md).

## Work in two projects

Open a project's **Open protected work for this project** link to keep its work
in a dedicated tab. Authenticate each project once with its own local review
token. Tabs in the same browser profile keep separate project sessions; using B
does not retarget A or invalidate an unchanged A edit. Opening a project does not
silently change the workspace's default selection.

If A's saved work or folder changes, saving refuses and retains your draft in
that tab. Refresh, inspect the current saved work, explicitly choose it as the
revision base and compare your selected sources again before saving. Reconnect
an unavailable folder or authenticate the original project again when required.
Unsaved drafts remain in memory only: keep the tab open until saving or copying
them. Supported running work remains observable and controllable in its project;
starting work still requires its existing execution authority.

## Use selected experience with a local service

The Operator tool `augnes_external_repository_work` connects selected experience
from one project to another project's permitted local request and actual report.
Start with `read`, deliberately publish/share current sources and exact material,
then prepare/send, respond to real format feedback, read/check returned bytes and
record their use in an output. A fresh process reads the same entry and reconciles
an unanswered request before continuing. Sharing does not transfer authority;
late material and relevant corrections require current applicability review.

The [local workflow and setup](docs/EXTERNAL_RESPONSE_LOCAL.md) describe the
finite operator envelope, every action, the reusable report consumer and the
controlled two-project example. The supported path is explicit and local. Its
source/mechanism tests do not establish model use, installed adoption or economic
benefit; #1433 Events and #1447 public distribution remain separate.

## Preview an operating profile

From a source checkout with the repository's supported Node runtime, supply a
local `OperatingProfile.v0.1` JSON file to the read-only preview:

```text
node scripts/operating-profile.mjs examples/operating-profiles/defensive-observe-recommend.json
node scripts/operating-profile.mjs examples/operating-profiles/defensive-observe-recommend.json --format json
node scripts/operating-profile.mjs examples/operating-profiles/direct-work.json
```

The text entry opens with the purpose, next observations, supplied/missing input,
executor/principal and permission gaps, return/check/use responsibilities and
arrangement alternatives. Both formats preserve the complete same input and
review. Copy either example to author a profile; identifiers only connect items
inside that document. The direct-work example uses one executor without a team.

All observations, bindings and explanations are authored declarations. The entry
does not inspect source locators, determine current applicability, grant access,
save application state or start work. The defensive example is synthetic
Observe/Recommend; Defend and Incident Command are unavailable. Do not supply
secrets. Use one UTF-8 regular file of at most 64 KiB; symlinks are refused and
`O_NOFOLLOW` support is required. Linux/macOS is the source target; Windows and
installed-host adoption are not claimed by this entry. The provisional contract
and limits are in [02](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md#read-only-operating-profile-input-and-preview-1518).

## The continuity loop

> Resume current work → act in ChatGPT, Codex, or another native host within
> the authorized scope → return results and evidence → verify what happened
> and what remains unknown → review the proposed consequential change → decide
> → apply only a separately authorized state change → resume later from the
> accepted state.

Execution completion is not verified success. Recommendation is not decision.
Candidate is not accepted state. A review decision (`ReviewDecision`) is not an
applied Transition.

## What works today

The checked-in runtime currently provides:

- local workspace/project onboarding and project isolation;
- supervised startup, persistence, migration, backup, restore, recovery, and
  run reconciliation;
- a two-zone product shell with Blank State and AI Workplane;
- project-scoped deterministic and live native-host/Codex work;
- structured receipts, source-linked criterion assessment, reviewable
  proposals, explicit decisions, authorized Transitions, later context, and
  bounded feedback;
- GuideBrief v0.2 projections across current Browser, ChatGPT/MCP, and Codex
  paths;
- contextual, read-only Exact details;
- bounded interactive and policy-triggered execution;
- compatible portability and recovery paths;
- limited project-scoped Personal Perspective controls and bounded research
  capabilities where runtime/tests prove them.

Exact current status and sequencing belong to the
[current implementation roadmap](docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md).
Current code remains the source of truth for exact routes, schemas, commands,
records, and behavior.

Supported operation and detailed managed-run/platform qualifications are in
[Quickstart](#quickstart) below.

## Quickstart

For explicit local verification of a selected workflow-cost 1.0.0 JSON report
against an independently selected numeric basis, use the documented
[fixed workflow-cost operator handler](docs/WORKFLOW_COST_FIXED_VERIFICATION_V1.md).
It persists source-bound results without Codex, model or provider execution.

In local project settings, **Find saved projects** shows **Working projects**,
including projects missing from recents and projects created by an authorized
agent. **Load more saved projects** continues the list; refresh includes later changes.
Opening uses the same project identity and saved name. **Remove from recents**
removes a shortcut and preserves project data and files; find it again here.
Unavailable folders use the existing **Locate folder** review and recovery flow.
This is local organization, separate from Web Planning's explicit erasure.

Use **Archive project** and confirm the named project to set it aside. It leaves
the working list and recents; if it was current, the displayed selection clears.
Another current project stays selected. **Archived projects** finds it again,
including when its folder is missing. **Unarchive project** returns it to the
working list; then use **Make current and open** or the existing **Locate folder**
flow to return to the same saved work. Reading an old project link does not
unarchive it. An unconfirmed action reads saved state; refresh management before
another action instead of repeating the old request.

Archive retains identity, root binding, files, work, history and unfinished
obligations. It does not pause direction, stop workers, revoke access, complete
work or free history capacity. Classification survives restart and supported
native backup/restore; backups still do not copy project files. Portable v0.1
does not transfer this local organization choice: a fresh import starts working,
and exact replay preserves the destination's existing choice. Existing export
eligibility is unchanged.

Authenticated local project-direction clients can read
`GET /api/vnext/agent/project-direction` without a project ID to rediscover only
projects readable under that capability. The complete bounded response includes
current direction, local organization, permission, sequence and remaining mutation budget. Reading
does not change browser focus or recents, consume a mutation, renew credentials,
or grant execution. Continue through the existing permitted operations; expiry
or revocation requires separately authorized fresh authentication.

In **Project direction → Authorize a bounded agent role**, the issuer can use
**Revoke role access** even when ordinary direction history is full. Refresh
direction to see the saved issuer, time and reason. A saved withdrawal prevents
subsequent use of that credential, including on its existing child projects;
earlier committed work stays in history. If a response is lost, refresh to inspect
the actual outcome, reopening protected project review if the session is stale.
This does not free space for decisions, grants or renewals. See the
[history and recovery contract](docs/DATABASE_ACCESS_LIFECYCLE.md#accumulated-native-history-refusal-and-preservation-1439).

The source checkout supports patched Node.js `^22.23.4 || ^24.22.1`
with npm 10 or 11. Node 22 is a source compatibility line; Companion requires
Node 24.22.1 or later within Node 24. Exact Local Canonical verification uses Node.js 24.22.1 and
npm 11.16.0.

On a supported macOS development host, install the exact checkout-bound local
Companion service once:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes:service:install
```

This explicit action installs a user-session LaunchAgent for this physical
checkout, selects and pins one patched Node 24 binary, and starts the existing
supervised UI/Core and bridge. It stores no secret in the service definition,
survives the installing terminal, starts at login, and recovers unexpected
runtime failure. It grants no repository execution, managed-run Resume,
provider, semantic, external-effect, publication, or merge authority. Stop or
remove it reversibly with `npm run augnes:service:stop` or
`npm run augnes:service:uninstall`. Linux and Windows service installation are
unsupported; their source development flow remains foreground-only.

Normal startup prepares the application-owned local database and does not
reset or seed operator data. Ordinary reads and writes then connect only to that
prepared store; missing or incompatible storage is refused without implicit
creation or repair. See [database lifecycle ownership](docs/DATABASE_ACCESS_LIFECYCLE.md). `npm run augnes:service:status` returns bounded
lifecycle state without exposing service paths, Node paths, PIDs, ports,
tokens, manifests, or database paths.

<details>
<summary>Companion lifecycle and recovery boundaries</summary>

New installations enroll a descriptor-observed persistent
Darwin volume/object identity; benign device renumbering between lifecycle
observations does not require reinstallation. See the [identity and explicit
legacy enrollment guide](docs/COMPANION_CHECKOUT_IDENTITY.md).

Uninstall also has one destruction-only fail-closed path for an exact stored
service with conflicting checkout identity at the same logical repository root.
Legacy device/inode drift is insufficient continuity evidence, not proof of
physical replacement. The uninstall path authenticates the stored service,
LaunchAgent, desired state, maintenance state, and owned processes before
removal; it never starts or resumes the stale service. A moved root or changed
logical repository fingerprint remains refused and requires separate operator
recovery rather than being inferred from remote equality.
Explicit Stop remains stopped across a later login or LaunchAgent reload; only
an explicit Start returns that exact service to running. Install/update preserves
an existing stopped intent. One
production Companion service may be installed per local user session, so setup
or Start for another checkout refuses without changing the existing service.

</details>

The **Backups and recovery** page lists inventory metadata without validating
backup databases. **Create backup** and **Verify selected backup** are explicit
requests. The page retains a correlation identity before sending either one.
An accepted request is still pending: use **Refresh status** to read that same
request, including after a lost response or page reload. There is no automatic
polling, backup retry, or fresh validation on a status read.

Only a completed exact validation result confirms that operation's checkpoint
observation. It names the backup, verification time and available validator/build
provenance. Source-runtime build identity may remain unattested. Replacement or
changed target metadata makes the result stale; a recorded result never promises
perpetual freshness. An existing backup can be freshly verified without creating
another backup or identifying the historical HTTP request that created it.
Restore/update still require their separate explicit action and full target
revalidation under the existing recovery lifecycle. Unknown/interrupted requests
remain unresolved; do not send a replacement merely to hide a lost response.

Open the URL and connect a local project. The primary path uses **Choose a
folder**. If the native picker is unavailable, remains invisible, is cancelled,
or does not return, **Enter the folder path instead** accepts one exact absolute
path from the computer running Augnes. Both paths converge on the same review
and explicit **Connect project** action. The folder is not uploaded, and
connecting it does not run Codex or change project files. This fresh-checkout
path demonstrates installation, project onboarding, Blank State, and supervised
local runtime behavior. It does not fabricate the review history needed for a
complete continuity walkthrough.

To establish local review access for the connected project, open another
terminal in this source checkout and run:

```bash
npm run augnes -- access
```

On an ordinarily installed, healthy Companion with first-work access support,
this verifies the existing service and UI, then prints one expiring token for
the exact selected project without stopping or restarting the runtime. Paste
it into the visible Browser unlock form. The token establishes local project review access only;
it grants no execution, semantic, external-effect, or merge authority. Do not
copy it into project files, prompts, issue comments, or verification evidence.

The installed Companion profile supports authenticated reads, saving the
initial work definition, and comparing and revising selected source notes and
work definitions while the existing revision owner confirms unexecuted work.
The editor's bounded retained-note lookup is read-only. These preparation
actions do not require managed-execution readiness. Selecting another project
never moves an existing session's access; issue a separate token for that project. Other review
mutations and execution retain their existing gates. A standalone source/pilot
runtime retains the historical stop, issue, and project-scoped restart path.
An installed service with unavailable access support is refused without a
lifecycle change; the access command does not repair or reconfigure it.

<details>
<summary>Access-failure diagnostics and safe next steps</summary>

If access fails, read the additive `diagnostic.stage`, `diagnostic.category`,
and `diagnostic.next_action` fields. Existing result/exit semantics and known
public refusal reasons are preserved. The stages distinguish installed-service,
runtime-binding and access-profile verification from issuer launch, process
completion and response validation. Categories report only the current attempt:

| Diagnostic category | Evidence and safe next step |
| --- | --- |
| `local_review_access_source_runtime_required`, `operator_pilot_disabled` | Access configuration refused before service inspection. Review the existing entry point or explicit disabled setting without enabling or replacing it automatically. |
| `local_review_companion_not_live`, `local_review_companion_binding_mismatch`, `local_review_companion_profile_unavailable` | The corresponding installed-access check refused. Read `npm run augnes:service:status` and review the existing binding/profile; no automatic repair. |
| `installed_verification_unknown` | Verification raised an unrecognized error. Share the public service status and diagnostic for review. |
| `issuer_launch_failed`, `issuer_signal_terminated`, `issuer_process_error_unknown`, `issuer_process_outcome_unknown` | The process result identifies a launch failure, termination, process error, or no normal exit. It does not establish a dependency, permission, ABI, or database cause. |
| `issuer_refused` | A nonzero exit supplied a recognized structured refusal. Missing active project means use the normal project selector; unavailable project/root means inspect that existing registration/folder. Other allowlisted prerequisites carry their own review action. |
| `issuer_nonzero_exit_unknown`, `issuer_exception_unknown` | A nonzero exit lacked a recognized explanation, or the issuer explicitly reported an unexpected exception. The cause remains unknown. |
| `issuer_output_empty`, `issuer_output_malformed`, `issuer_output_invalid` | The issuer exited zero but its success response was empty, invalid JSON, or missing/invalid required fields. |

For unidentified issuer failures, read `node --version` and `npm --version` in
the same terminal and provide those versions and the sanitized diagnostic for
review. Do not repeat issuance merely to diagnose it. Failure diagnostics omit
raw output, arbitrary error text, tokens, cookies, private paths and database
contents. `credential_issuance: "unknown"` means no valid token was returned;
a credential may already have been written. Reporting adds no issuance,
revocation, rollback, retry, or service lifecycle action. A successful explicit
access command still returns its one-time token through the normal channel.

</details>

If an existing project's saved folder later becomes unavailable, **Locate
folder** opens the same verified folder-selection experience for that exact
project. **Choose a folder** and **Enter the folder path instead** converge on
one recovery review. **Use this folder** keeps the project name and stored
history, then uses the existing Browser-confirmed project root-rebind authority
to replace the local root and physical baseline atomically. Selecting the exact
current folder or one of its physical aliases only opens the existing project
and does not rewrite its saved root. Recovery does not run Codex or change
project files.

For source-blind local Codex resumption, install the repo-local
`plugins/augnes-operator` plugin once with
`npm run augnes:plugin:install`. Ask “Resume this
repository with Augnes.” The reviewed Operator package (currently 0.5.0) first checks lifecycle status,
starts an already-installed exact service at most once when offered, and only
then performs one read-only canonical Resume through a verified Companion. It
never installs the service from MCP. The plugin verifies the supervised bridge and
calls the strict UI/Core route through a private generation-bound channel; no
fixed `8787` configuration, Browser open page, mock, seed, docs, or legacy brief
fallback is required.

Ordinary Operator reading and work preparation use the private Companion
channel, not the optional Browser review token or a managed Codex run. Ask to
read the selected notes, preview an authorized change, save it explicitly, then
Resume and read it back. In a later conversation, ask to Resume the same
registered project folder and read its saved notes; no prior packet or internal
identifier needs to be copied. If a save response is lost, read back before
deciding whether another write is needed. Keep unsaved drafts in the original
client until saved or copied. See the [ordinary-use and recovery walkthrough](plugins/augnes-operator/INSTALL.md#ordinary-use-and-recovery).

For an existing ordinary task, ask **“Compare how to do this work, use a
contribution only if it helps, and revisit the arrangement after the result.”**
The native `augnes_prepare_repository_execution_choice` entry reads the current
goal and selected material, prepares a choice for explicit preview/save, and
supports direct work, a delivered asset, or a configured bounded reviewer. It
shows the requested contribution and returned result before connection details.
After actual downstream work, save the result-linked continue/end-role judgment
and its reconsideration condition. Ending a role does not withdraw access or
cancel a process. See [the supported sequence and limits](docs/EXECUTION_CHOICE_USAGE.md).
This source capability needs ordinary plugin/runtime adoption separately;
reading or preparing a choice neither installs nor activates anything.

For a reviewer who already read an earlier revision of the same unstarted task,
the [explicit late-review path](docs/EXECUTION_CHOICE_USAGE.md#explicit-late-review-and-current-reassessment-1486)
retains the original answer and basis. Inspect it against fresh current work,
record selective use or non-use, then preview and explicitly save current edits.
Receipt alone never applies historical material; default reply/use stays current-only.

A configured contributor can [inspect its exact review's status](docs/EXECUTION_CHOICE_USAGE.md#contributor-status-after-the-origin-advances-1506)
with `augnes_get_review_status`, including after the origin advances. The saved
response and authored current-use reasoning match its existing reviewer list;
inspection grants no material-read witness, origin revision or execution authority.

`OPENAI_API_KEY` is optional. Supported paths retain deterministic local
fallbacks without it. A locally installed and authenticated Codex CLI with App
Server support is required only for live Codex work.

<details>
<summary>Managed repository execution, Resume, and platform qualifications</summary>

Repository-scoped Codex continuity, trusted local execution preparation, and
one attachment-backed managed run are
documented in [Repository execution attachment v0.1](./docs/REPOSITORY_EXECUTION_ATTACHMENT_V0_1.md).
Preparation binds canonical project, physical root, current work, and bounded
Git worktree content state without starting a run or depending on Browser
active selection. Legacy adoption, intentional rebind, and revocation use one
same-origin Browser confirmation backed by a separate HttpOnly decision session
and a request-bound one-time nonce; forged request headers and MCP literals are
insufficient. Ordinary exact preparation remains silent. Starting consumes one
exact attachment only after one Browser confirmation, then permits bounded
reversible local repository work within its deterministic envelope. Later
operation approval and semantic result review remain separate. The
managed-delegation product boundary covers verified local macOS and the
verified Windows 11 x64 source-runtime lane on local fixed NTFS. Linux has no
separate product filesystem/runtime proof. CDX2B3A source-runtime attachment
admission has exact Windows 10 Pro 22H2 build 19045.6456 proof at checkpoint
`374a582b766a10616667633eb911d3df2d49b85e` and exact Windows 11 Home 25H2
build 26200.8875 proof at pre-integration checkpoint
`567c9bbbad5d35e6803ad740adfac1b881983912`, both x64 local fixed NTFS. A later
integrated head is not Windows 10 exact-head verified without a fresh run
there, so Windows 10 managed Start and Resume remain unavailable. The existing
package builder still refuses Windows, so packaged Windows admission, Start,
and Resume remain unavailable. CDX2B3B enables Browser-confirmed Start and
explicit same-run Resume only through the existing attachment, run, checkpoint,
envelope, cancellation, result, and semantic-review owners; it adds no Windows
runner and no automatic Resume.

Cancellation remains available from the immutable consumed attachment/run
binding even when current packet, work, root, baseline, worktree, or Browser
selection has drifted. Exact Start replay reports the persisted run's actual
queued, active, approval, disconnected, blocked, or terminal state and never
starts another worker. Browser, Companion, provider, database, runtime, and OS
credentials are not injected into the worker, and outside-root material stays
blocked. Files already inside the exact repository are nevertheless within the
repository read scope; Augnes does not claim content-based secret unreadability
for those files.

Attachment-backed managed runs retain one private exact safe-operation
checkpoint history and expose one bounded read-only resume-eligibility status
through repository continuity, Browser, Apps MCP, and the Augnes Operator.
This distinguishes the immutable consumed start attachment from the latest
confirmed post-operation repository state. Exact `resume_ready` material may
now create one expiring Browser-only Resume decision and one atomic same-run,
same-attachment, same-thread attempt. The provider path uses `thread/resume`,
not `thread/start`; ambiguous effects require reconciliation and pending
operation approval remains separate. Resume completion does not create a
ReviewDecision, Transition, accepted state, or work closure, and Companion
startup never resumes automatically.

</details>

For the prepared historical Build Week evaluation path and its limitations, see
the [judge guide](docs/submission/openai-build-week/JUDGE_GUIDE.md).

## Product direction

Augnes preserves continuous work across Browser, ChatGPT Apps, Codex, and
future hosts without forcing those hosts to look alike.

- **Blank State** focuses human attention and resumption.
- **AI Workplane** coordinates delegation, progress, verification,
  reconciliation, review preparation, bounded automation, later context, and
  outcome feedback.
- **Timeline** explains meaningful sequence.
- **Relationship exploration** explains a bounded connection, not an exhaustive
  graph or permanent “constellation” product.
- **GuideBrief** explains present meaning and remains contextual,
  source-anchored, conversational, and non-authoritative.
- **Inspector / Exact details** exposes optional, dense, neutral, read-only
  records.

Internal research complexity may increase; default user complexity must not
increase with it.

A mature attention queue, timeline-first work detail, bounded relationship
exploration, fully conversational GuideBrief, and the fuller long-horizon
research substrate remain product directions unless current runtime evidence
proves a bounded implementation. Their documentation does not claim they are
complete.

The durable doctrine is
[Augnes Product and Continuity Doctrine](docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md).
Core records and protocol semantics are defined separately in
[Architecture and Protocol](docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md).

## Repository authority

The [authority map](docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md) assigns one
active owner per durable topic:

- product and continuity doctrine — `01`;
- Core and protocol semantics — `02`;
- implementation status and sequence — `03`;
- evaluation and maturity — `04`;
- retention and deletion safety — `docs/REPOSITORY_REDUCTION_SCOPE.md`;
- product entry — this README;
- repository operating rules — `AGENTS.md`.

Implementation contracts, research, operator manuals, compatibility material,
and historical records do not silently override those owners.

RR0 was completed in
[issue #69](https://github.com/hynk-studio/augnes-perspective-lab/issues/69)
and [PR #70](https://github.com/hynk-studio/augnes-perspective-lab/pull/70).
RR1 was defined by
[Issue #71](https://github.com/hynk-studio/augnes-perspective-lab/issues/71);
[PR #72](https://github.com/hynk-studio/augnes-perspective-lab/pull/72) is its
completed documentation-authority reconciliation and outcome record.

The temporary C0–C9 correction and post-CW1 cleanup program is completed.
[`07`](docs/vnext/07_AUGNES_POST_BUILD_WEEK_PRODUCT_UX_CORRECTION_CHARTER.md)
is a historical closeout pointer, not an active authority owner. Its umbrella
[Issue #1170](https://github.com/hynk-studio/augnes/issues/1170) grants no
continuing cleanup or deletion authority. Future dispositions require separate
authorization under the durable
[repository reduction policy](docs/REPOSITORY_REDUCTION_SCOPE.md) and current
verification rules. Current research status remains owned by `03`.

## Canonical repository migration

`hynk-studio/augnes` is the canonical repository and
`/Users/hynk/code/augnes` is the canonical macOS root. The complete
perspective-lab Git history through the migration point remains ancestry and
historical provenance; historical Issue, PR, release, receipt, and research
links stay bound to `hynk-studio/augnes-perspective-lab`.

The local cutover is complete: the existing workspace/project identity,
database, project-root binding, Companion, Codex operator plugin, and active
RW1/RW1A artifacts now continue at the canonical root. [Augnes Issue
#1130](https://github.com/hynk-studio/augnes/issues/1130) is the Current RW1B
owner; perspective-lab Issue #268 is historical/migrated, not completed
research. Completed perspective-lab artifacts remain readable only as isolated
historical evidence. Neither the legacy repository/root nor historical
readability grants current execution, Local Canonical, project, Companion,
provider, or GitHub transport authority. No general multi-repository or
configurable-root mode exists.

## Canonical verification

GitHub is used for source control, pull requests, review, and history. This
repository has no active GitHub Actions workflow; deciding verification is
repository-owned Local Canonical execution.

Use:

```bash
npm run verify:local:quick
npm run verify:local:changed -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:full -- \
  --base <exact-40-character-base-sha> \
  --head <exact-40-character-head-sha>
npm run verify:local:receipt -- \
  --receipt .augnes-local-verification/receipts/<receipt>.json
```

Ordinary explanatory documentation is exempt from deciding execution and receipts;
review the exact diff and use content-appropriate checks. Authority/contract docs
and documentation dispositions use the bounded static checks and consumer review
in the Local Canonical policy. Static checks do not qualify runtime behavior.

`quick` is non-deciding developer feedback. `changed` runs the exact-SHA
planner-selected lane. `full` deliberately runs the complete surface. Deciding
verification requires the exact clean head, repository-required Node/npm
versions, planner-selected scope, successful cleanup, and a validated local
receipt.

The complete surface consists of:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:authority`
- `npm run test:integration`
- `npm run test:operability`
- `npm run test:e2e:project-experience`
- `npm run test:e2e:operator-execution`
- `npm run test:e2e:continuity`
- `npm run test:e2e:golden`
- `npm run test:e2e`

Receipts and logs remain ignored local artifacts. Their fingerprints establish
content integrity and local provenance only; they are not hosted reproduction,
independent attestation, or an external status. The Draft PR body carries the
review summary; verification itself has no GitHub write or publication path.

See:

- [Local Canonical verification policy](.github/LOCAL_CANONICAL_VERIFICATION.md)
- [Evaluation and maturity](docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)

## Historical note

An earlier Augnes version placed third in the OpenAI Discord community’s “Build
a System, Not a Prompt” developer challenge. Build Week expanded the project
into the operational local-first continuity reference implementation preserved
in this repository. Submission material remains historical evaluation context,
not current product authority.
