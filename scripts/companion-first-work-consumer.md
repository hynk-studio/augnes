# Companion first-work consumer

This deterministic development example checks the existing Web Planning
`fileManifest` API because it has a small bounded input, a precise refusal code,
and a targeted correction that can discriminate the cause without a provider or
hosted runtime. It is a software input-contract check, not a full export/import
or hosted-adoption test. All example inputs and discovery health/manifest fixtures
are synthetic and developer-exposed.

Run the complete disposable acceptance case with the supported repository Node:

```sh
node --import tsx scripts/test-codex-repository-continuity.ts --work-revision-envelope-only
```

Fixture setup registers/selects empty temporary projects and migrates only their
disposable database. It never seeds an initial packet. The source proxy dispatches
over loopback HTTP into the actual authenticated route and shared initial writer.
The consumer starts a fresh MCP client/proxy process, defines first work, executes
an external check, saves attributed notes through ordinary revision, and exits.
Another process resumes that work, reads its notes, checks incompatible input and
performs a real follow-up. A third process reads all saved notes. Existing bounded
child settlement and fixture cleanup own processes, listener and temporary files.

The observed branches are:

| Input | Actual check | Saved interpretation / action |
| --- | --- | --- |
| Supported `report` role | Exit 0, `compatible` | Stop checking this input; no extra check is justified. |
| Unsupported `future-report` role | Exit 1, `invalid_file_name_or_role` | Test the hypothesis by changing only the role to `report` in a second external process. Preserve both reports and the result-informed next preparation. |

Reports include observation time, actual exit status, input SHA-256 and checked
source hashes. They are saved as `imported_unverified`; driver interpretations
are `derived_interpretation`. Hashes identify content and do not independently
verify external execution. No RunReceipt, semantic acceptance or completion is
created. The test also covers read-only preview, save authentication without
Browser credentials, altered/stale bindings, atomic write failure, lost-response
readback and concurrent genesis. A contending SQLite request may have an uncertain
transport outcome; explicit Resume establishes the sole committed packet.

The example can be invoked against an already authorized disposable project on
a compatible live local Companion. The `start` mode requires no current work;
`continue` uses saved work, and `read` is read-only:

```sh
node --import tsx scripts/companion-first-work-consumer.mjs start /absolute/disposable/project /absolute/manifest.json
node --import tsx scripts/companion-first-work-consumer.mjs continue /absolute/disposable/project /absolute/manifest.json
node --import tsx scripts/companion-first-work-consumer.mjs read /absolute/disposable/project
```

The manifest file is a regular UTF-8 JSON file of at most 16,000 bytes, containing
an array of `{name, role, bytes, digest}` entries accepted by Web Planning's current
API. No command supplied by the input is executed. `start`/`continue` write work
and selected notes under the caller's existing authorization; they do not register
or select the project. Unknown save outcomes stop the invocation and require a
deliberate `read`, never automatic replacement saving. An unfamiliar mismatch
requires a separately chosen follow-up. Existing note limits remain enforced.

The fixture does not use or update the installed plugin or accepted production
data. Installed use requires the normal separately authorized post-merge rollout.
This proves neither ordinary-use benefit nor Autohunt, independent direction
authority, remote/hosted operation or transfer to an independent task.
