# Public retry-work Skill entry (#1447)

The published **Augnes workflow-cost Skill/plugin 0.1.0 Pre-release**
packages the unchanged **workflow-cost method 1.0.0** for code-capable Codex
consumers. Python 3.9+ file use needs no Augnes account, project, Companion,
MCP server or private upload. Skill loading is optional and requires explicit
user/admin installation. Reading in ChatGPT alone does not provide code execution.
This is a component preview, not a full Augnes application release.

## Download and verify

- [Public component Pre-release](https://github.com/hynk-studio/augnes/releases/tag/augnes-workflow-cost-v0.1.0) (tag `augnes-workflow-cost-v0.1.0`).
- [Packaged ZIP](https://github.com/hynk-studio/augnes/releases/download/augnes-workflow-cost-v0.1.0/augnes-workflow-cost-0.1.0.zip) — **38,254 bytes**, SHA-256 `082789624f70a1feaca11c4e4fa852f8d6a505caf45d3e2e572df5f40fa8c59d`.
- Fixed source commit: `d51b73b447780c1c1d3f795515dfbd5f9d24468d`.
- Package 0.1.0 and immutable calculation method 1.0.0 are separate versions.
- Use the explicit ZIP, not GitHub's automatic repository source archive.

In a fresh directory with `curl`, `shasum` and `unzip` available:

```sh
curl --fail --location --output augnes-workflow-cost-0.1.0.zip \
  https://github.com/hynk-studio/augnes/releases/download/augnes-workflow-cost-v0.1.0/augnes-workflow-cost-0.1.0.zip
printf '%s  %s\n' \
  082789624f70a1feaca11c4e4fa852f8d6a505caf45d3e2e572df5f40fa8c59d \
  augnes-workflow-cost-0.1.0.zip | shasum -a 256 -c -
mkdir workflow-cost-bundle
unzip augnes-workflow-cost-0.1.0.zip -d workflow-cost-bundle
cd workflow-cost-bundle/plugins/augnes-workflow-cost/skills/stationary-retry-work
python3 -E -s -S -B scripts/verify_material.py assets/workflow-cost-v1
```

Stop on any failed checksum, inventory or bundled-material check. Never
substitute unrelated local checkout or installed files for missing members.
Hashes establish integrity against a known published identity, not execution
safety or publisher authentication. The archive holds exactly nine public
plugin files and a minimal local catalog, without private Operator files,
credentials, transcripts or generated receipts.

## Optional Codex Skill loading

Inspect `codex plugin --help` on the actual host first. The observed isolated
loading profile was **macOS 26.6.2 arm64 / Codex CLI 0.153.4**; other host
versions and ordinary user-profile adoption were not verified. Point to the
extracted **bundle root**, not to the nested Skill folder:

```sh
codex plugin marketplace add /absolute/path/to/workflow-cost-bundle
codex plugin list --marketplace augnes-public-assets --available --json
codex plugin add augnes-workflow-cost@augnes-public-assets --json
```

The namespaced Skill is `augnes-workflow-cost:stationary-retry-work`. These
commands modify the selected Codex profile. For a temporary test, set
`CODEX_HOME` only in each command's child environment to a fresh task-owned
directory, without copying authentication or keys. Clean a temporary profile
through the supported removal commands:

```sh
codex plugin remove augnes-workflow-cost@augnes-public-assets --json
codex plugin marketplace remove augnes-public-assets
```

If the host does not support plugin loading, ordinary verified Python files
remain usable by a separately authorized code-capable consumer. Read the
bundled `references/usage.md` and method README; keep the five immutable
material files together. A simple direct recurrence may be preferable.
Public delivery, plugin availability, installation, actual model choice/use,
later reuse and comparative benefit are separate observations.

## Historical development observation (not a consumer prerequisite)

### Candidate and intended observation

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

The separate synthetic successor considered a **nine jobs within ten minutes
with at least 95% completion probability** promise using the first output and
its local references. A deadline probability cannot be inferred from an
expected-work result; the recorded successor appropriately rejected the
unjustified promise. See [#1451](https://github.com/hynk-studio/augnes/pull/1451)
and [#1447](https://github.com/hynk-studio/augnes/issues/1447). This was
developer-supplied context, not the original public user's demand, organic
discovery, a matched comparison or measured savings.

The recorded native writer/later-worker observations used supplied catalog
candidates and known case genealogy. They did not test organic search rank,
independent users, host recommendations, superiority or measured savings.
Keep historical failures and non-use separate; do not rerun unchanged cases to
obtain preferred outcomes.

## Package and activate

### Maintainer source-bundle construction

The public ZIP above is the recommended distribution. This **maintainer-only**
source path uses the [plugin manifest](../plugins/augnes-workflow-cost/plugin.json)
and the local catalog; no source checkout is needed to consume the release.
The builder creates a checked **directory** bundle, not a ZIP:

```sh
node scripts/build-workflow-cost-plugin.mjs --check
node scripts/build-workflow-cost-plugin.mjs --bundle /absolute/new/bundle
```

The directory includes the unchanged five publication files, Skill, usage,
integrity checker, plugin manifest and minimal `augnes-public-assets` catalog.
Do not rehash, rewrite, re-version or silently update the pinned method to
reflect later documentation. Source copying must remain byte-exact and
refuse drift.

The [official plugin guide](https://developers.openai.com/plugins/build/plugins)
and [Skill guide](https://developers.openai.com/plugins/build/skills) describe
host activation conventions. This GitHub **component Pre-release** is not a
stable Augnes application distribution, a general plugin-directory submission
or proof of ordinary-profile adoption.

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

Source completion, published public download, catalog listing, connection,
discovery, actual use, comparative benefit and repeat use remain distinct.
The scoped public component **Pre-release distribution was accepted on
2026-10-20**; see [#1447's final independent review](https://github.com/hynk-studio/augnes/issues/1447#issuecomment-6284432330).
Broader #1447 work on discoverability, independently initiated use and later
agent re-entry remains open; public release alone does not prove those outcomes.
Preserve exact package identity, host/version, exposure, outputs, non-use and
unobserved benefits with their original evidence. Generated raw logs, model
transcripts and local verification receipts remain local unless publication
is separately authorized.
