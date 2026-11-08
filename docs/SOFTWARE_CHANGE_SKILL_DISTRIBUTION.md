# Software Change Check: first free listing

Owner: [#1447](https://github.com/hynk-studio/augnes/issues/1447).
Selected 2026-11-09 KST. This is one standalone Skill, version **0.1.0**, named
**Augnes Software Change Check** for the listing. The source Skill name remains
`verify-software-change`. It is separate from the published workflow-cost
component and the installed Augnes Operator.

## Current disposition

Source, four-file packaging, isolated delivery checks, reproducible development
examples and the listing text below are prepared for review. This is not a live listing
or a new GitHub release. Local development checks do not establish Mac Local
Canonical qualification or actual Agensi consumption. Keep the PR Draft until
the repository's required verification and review are complete.

The approved direction is one **free** listing. No payout setup, subscription,
outreach, support commitment, automatic publisher or new runtime is needed.
Agensi's public registration documentation was checked on 2026-11-09 KST. The
submission page redirected this session to sign-in; no account draft, upload,
submission or marketplace approval was observed. Reconcile the actual account's
existing listings before creating one. An absent public search result does not
establish an empty creator account.

## Build the submission

From this repository, with Python 3.9+:

```sh
python3 -E -s -S -B scripts/build-software-change-skill.py
python3 -E -s -S -B scripts/build-software-change-skill.py --output /path/to/new/augnes-software-change-check-0.1.0.zip
```

The parent output directory must exist. An existing output is never overwritten.
The builder includes only `SKILL.md`, `references/handoff.md`,
`scripts/snapshot_inputs.py` and `examples/request-and-result.md`, at the ZIP root.
It prints the archive and member SHA-256 identities. These identify the prepared
bytes, not marketplace approval or publisher authentication. No credentials,
project input, local receipt, installed plugin or developer script is included.

The snapshot helper is unchanged. On individual-file delivery it runs from its
actual temporary path and needs no other Skill files beside it. Reports and
snapshot JSON are permitted task outputs; the Skill itself is not installed
into the consumer's project. Keep the source in this repository; do not maintain
an Agensi-specific implementation fork.

## Ready-to-enter listing fields

| Field | Value |
| --- | --- |
| Name | Augnes Software Change Check (confirm availability) |
| Version | 0.1.0 |
| Price | Free |
| Primary category | Testing & Debugging |
| Secondary category | Code Quality & Review |
| Tags | software-verification, package-delivery, dependency-check, installation, reproducibility |
| Compatibility | A code-capable agent with access to the subject and its existing checks. Python 3.9+ for the optional input snapshot helper. Agensi delivery requires an Agensi connection; no Augnes runtime or account is required. |
| Source/docs | https://github.com/hynk-studio/augnes/blob/main/skills/verify-software-change/SKILL.md |

### Summary

Check whether an installation, package delivery or version change works in its
actual destination. Reuse the project's checks and return reproducible evidence,
failure details and the next action. No Augnes installation required.

### Description

An installer saying “complete” is only the start of checking whether the intended
installation works. A script may also work in a checkout while its delivered
copy is missing a dependency.

Augnes Software Change Check helps your coding agent investigate one concrete
installation, package-delivery, dependency or version change. It identifies the
actual source, delivered files and destination; chooses relevant existing
checks; and records commands, observed results, unresolved limits and the next
useful action. When input identity matters, a small optional Python helper
captures and compares explicitly selected files.

Use it for an upgrade check, an installation into a selected profile, or a
package that must run outside its original checkout. The result is a concise
report another developer or agent can reproduce. A diagnosed incompatibility
or a clear explanation of what could not run is also a useful result.

The helper does not test application behavior, and equal file hashes are not a
compatibility certificate. The Skill uses your project's actual checks and
does not require a new framework, server, Augnes project or migration.

### See it in action

Use the complete first case in
[the included examples](../skills/verify-software-change/examples/request-and-result.md#installation-says-complete-but-updates-the-wrong-profile)
for the listing: an installer reports completion but updates the wrong profile.
It includes the request, full disposable fixture, commands, observed output and
handoff. The existing test command replays that published fixture with the
ZIP-delivered helper. The second case retains the calculator delivery finding.
Keep the developer-supplied origin, environment and simulated delivery labels.
These are not live Agensi executions, independent customer results or measured
improvements over ordinary tools. Copy the actual first case into the form;
do not generate a successful outcome that did not happen.

### Limitations and FAQ

- **Does it install Augnes?** No. The Skill uses the consumer's own tools.
- **Does it guarantee compatibility or security?** No. It reports the checked
  behavior and its actual environment and limits; this is not a security audit.
- **Does it always run every test?** No. Choose relevant existing checks and
  preserve any checks the project requires.
- **What if execution is unavailable?** Return a source-only or blocked result
  and the concrete missing prerequisite. Never present an unrun command as a pass.
- **Where is my code processed?** In the consumer's existing agent environment;
  this Skill adds no Augnes backend or upload endpoint. The host and its tools
  retain their own data handling.
- **What does the file observer prove?** Identity of explicitly selected bytes
  at observation time. It does not prove whole-directory state, transitive
  dependencies, or absence of changes that were restored between observations.

## Submission and follow-through

Use [Agensi's web submission](https://www.agensi.io/dashboard/submit) with the
prepared ZIP, or its creator connector if already available. Inspect the actual
permissions inferred from the package. Select Free and the categories above;
do not accept an automatic paid price, generated outcome or external checkout.
Review the concrete preview and record the actual returned listing URL/status.
Submission, pending review, live availability and consumer execution are separate.

Agensi serves only live listings through MCP. After publication, retrieve the
Skill and its helper through that actual path, run the helper unchanged against
disposable selected files, and record the result under #1447. A simulated
temporary-file check must not be substituted for that observation. Useful
questions or failures inform further work; no traffic quota or new monitoring
framework is needed.

Official channel references:
[packaging](https://www.agensi.io/docs/packaging),
[loading](https://www.agensi.io/docs/how-agents-load-skills),
[submission](https://www.agensi.io/docs/submit-on-the-website),
[creator FAQ](https://www.agensi.io/docs/creator-faq).
