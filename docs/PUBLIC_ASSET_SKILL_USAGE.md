# Public retry-work Skill entry (#1447)

This entry is for a code-capable Codex consumer with Python 3.9+, standard-library
file access and permission to execute local code. It adds a task-described Skill
and portable plugin around the existing public workflow-cost 1.0.0 files. It
does not add a server, private connection, project or solver. Ordinary
[public web/file use](../publications/workflow-cost-v1/README.md) stays available.
ChatGPT reading access alone does not establish a Python execution environment.

## Candidate and intended observation

Recorded before evaluating this entry: use the historical public question
[How long does it take](https://math.stackexchange.com/questions/692846/how-long-does-it-take)
(user1769184, 2014-02-27). Its stipulated serial process spends one minute per
job, succeeds with probability 0.98, and restarts the whole sequence after a
failure. Produce an exact expected-work answer for two and eight consecutive
successes, with source and assumptions a later worker can use. These are small
instances of the question, selected by the developer; the public question is
real, but this is not a newly arriving customer or an observed production rate.
Do not post an answer to that site as part of this exercise.

The optional-inspection CLI does **not** directly model a sequence restarting
after a partial success. The existing 1–8-state `expected_work` callable does,
with progress as the finite state and fixed costs/probabilities on every visit.
No empirical inspection benefit or Canonical failure rate is inferred. Additional
verification work absent from the question remains unpriced; this mathematical
answer does not authorize omitting a required check in real work.

The strongest ordinary alternative is a direct renewal recurrence/closed form,
with the same public question, Python and exact fractions available. It can
answer this simple question without downloading a package. The expected gap is
not missing mathematics: the public App and existing private Operator/continuity
plugins do not provide this code-capable task entry with complete executable
material. The old exact-link HTTP delivery is already accepted under
[#1422/#1423](https://github.com/hynk-studio/augnes/issues/1209#issuecomment-6059444075).

A later, distinct task will review a proposed planning promise for **nine jobs
within ten minutes with at least 95% completion probability**, inheriting only
the first output and its referenced local material. This is a task-owned
synthetic planning request, not the original public user's demand. It needs a
deadline judgment, whereas the first task asks for expected work. Observe
whether the worker preserves the original basis, recognizes changed needs and
uses a suitable alternative or declines the package. Also exercise a missing
dependency and invalid input. Do not convert appropriate non-use into successful
calculator consumption.

The bounded native writer/later-worker passes are development observations with
supplied catalog candidates and known case genealogy. No search-rank test,
independent-user, host-recommendation, superiority or measured savings claim is
planned. Keep failed attempts. One writer and one later worker are sufficient;
do not rerun an unchanged case to get a preferable result.

## Package and activate

The portable [plugin manifest](../plugins/augnes-workflow-cost/plugin.json)
discovers `skills/stationary-retry-work/SKILL.md` from its root `skills/` folder.
The repository catalog lists it as available, not automatically installed. The
new entry is separate from both the public/default App and private native
Operator/reviewer scopes. It has no MCP, hook, auth, runtime or private-write
component.

Maintainers build a complete, create-only bundle outside the checkout:

```sh
node scripts/build-workflow-cost-plugin.mjs --check
node scripts/build-workflow-cost-plugin.mjs --bundle /absolute/new/bundle
```

The bundle contains only this plugin and a minimal `augnes-public-assets` local
catalog. It includes all five immutable publication files plus the Skill,
supporting usage, integrity checker and plugin manifest. Copies are checked
byte-for-byte against the authoritative publication; `--sync-material` refreshes
only those copies and refuses source drift. Never edit or rehash the pinned
release to make a changed implementation look like 1.0.0.

On a host whose `codex plugin ... --help` supports these commands, an authorized
user/admin can register a received bundle and install the one plugin:

```sh
codex plugin marketplace add /absolute/path/to/bundle
codex plugin list --marketplace augnes-public-assets --available --json
codex plugin add augnes-workflow-cost@augnes-public-assets --json
```

Installation changes that host's configured plugin profile. For an isolated
development check, use the same commands with `CODEX_HOME` set only in each
child process environment to a **new task-owned directory**. Do not copy auth
files or read keys. A no-inference catalog/skill-list check needs no new account
or provider calls. Remove the plugin/catalog with the supported remove commands
and clean that directory after preserving the observation. Do not change the
user's installed profile or restart a shared desktop application for this test.

The [official plugin guide](https://developers.openai.com/plugins/build/plugins)
and [Skill guide](https://developers.openai.com/plugins/build/skills) describe
portable manifests, local catalogs and Skill discovery. Check the actual host:
availability differs by surface. A host without the needed activation mechanism
leaves activation pending; the complete bundle and independent Python checks
can still finish. No full repository clone is necessary for the bundle consumer.
No release/tag, deployed endpoint, universal directory submission or new service
terms are implied by this source change. A Draft branch is not a stable release.

## Who does what, and what it proves

| Step | Actor and boundary |
|---|---|
| Catalog addition | Maintainer supplies package/catalog material; local test registration is task-owned. |
| Installation/activation | User/admin explicitly chooses a destination; the isolated test profile is not the user's installed connection. |
| Host recommendation | A separate host observation, never inferred from listing or installation. |
| Model selection | Worker chooses among exposed candidates; supplied candidates are not organic search. |
| Material retrieval | Host copies the plugin into its cache; consumer verifies all release bytes before execution. |
| Actual use | Worker incorporates a real calculation into its answer; invoking a tool alone is insufficient. |
| Later use | Another task reads ordinary output/files, rechecks applicability and makes its own useful judgment. |

Source completion, public listing, connection, discovery, actual use, comparative
benefit and repeat use have separate states. The source PR may finish with an
explicit operational gate, but #1447's full public-distribution objective then
remains open. The exact package identity, observed host/version, activation,
outputs, exposure, failed/NOT_RUN steps and next action belong in that PR and
the issue progress record. Raw logs, model transcripts and local verification
receipts remain local unless separately authorized for publication.
