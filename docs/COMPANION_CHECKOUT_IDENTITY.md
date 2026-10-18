# Companion checkout enrollment and lifecycle identity

Companion installation is durable across terminal exit, login and supported
filesystem mount changes. It is not a durable process, a source approval, or an
execution grant. This contract belongs to `companion-service-core.mjs` and its
Darwin `checkout-identity.mjs` / `checkout-identity-darwin.py` provider.

## Four separate lifetimes

| Witness | Lifetime and purpose |
| --- | --- |
| Configuration schema 2 `repository_identity` | Explicit enrollment of an exact canonical path on a persistent volume/object. |
| Current descriptor/path stat, owner and birth observations | One observation/operation; device and inode must remain coherent within it. |
| Manager/supervisor process birth, instance and generation | Current runtime ownership only; never revived by checkout continuity. |
| Service source fingerprint, pinned Node, native execution attachments | Independent source and authority checks; filesystem continuity does not approve changed code or revive credentials. |

The existing service label and path-derived repository fingerprint remain
logical lookup keys. They are not upgraded into authentication evidence. Native
host `native_host_physical_root_identity.v0.1`, historical attachments and
receipts keep their original meanings. Core and database schemas do not change.

## Darwin observation and limits

The provider opens the target directory with `O_DIRECTORY | O_NOFOLLOW`, compares
descriptor and path identity before and after, and uses `fgetattrlist` on that
same descriptor. Volume attributes therefore come from the target's mount, not
an independently resolved path. It requires APFS or HFS, a nonzero persistent
volume UUID, `VOL_CAP_FMT_PERSISTENTOBJECTIDS`, `VOL_CAP_FMT_PATH_FROM_ID`, a
persistent object ID and an exact creation timestamp. Unsupported attributes,
missing interpreter, malformed results, aliases and incoherent observations
refuse authorization. There is no path/Git/inode-only fallback or observation
cache. The bounded helper uses the existing system `/usr/bin/python3` with
`-I -S`, standard-library ctypes and no user site/environment injection; no
compiler, downloaded package or provider access is used during observation.

Apple documents persistent object IDs as surviving mount/unmount, and the
path-from-ID capability as implying non-recycled IDs. The creation timestamp is
an additional replacement witness, not an authentication credential; changing
it refuses continuity. File IDs are scoped to their volume. Ordinary
`NSURLVolumeIdentifierKey` and `NSURLFileResourceIdentifierKey` are expressly
not persistent across system restarts and are not used here.

This is cooperative local lifecycle safety, not protection against a malicious
same-user/root process or forged filesystem metadata. A block-level clone or
snapshot that preserves every volume/object/birth witness is not distinguishable
by this contract; replacing/restoring a checkout or volume remains an explicit
operator/source/data decision. Filesystems without the required capabilities
are unsupported. Real disposable APFS observations and deterministic device
renumbering cases are distinct evidence; they are not a reboot/remount trial or
an empirical HFS qualification.

Primary references:

- [Apple XNU getattrlist contract](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/man/man2/getattrlist.2)
- [Apple XNU attribute/capability definitions](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/attr.h)
- [Apple XNU descriptor implementation](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/vfs/vfs_attrlist.c)
- [Persistent volume UUID](https://developer.apple.com/documentation/foundation/urlresourcekey/volumeuuidstringkey)
- [Nonpersistent volume identifier](https://developer.apple.com/documentation/foundation/urlresourcekey/volumeidentifierkey)
- [Nonpersistent file resource identifier](https://developer.apple.com/documentation/foundation/urlresourcekey/fileresourceidentifierkey)

## Supported commands

Fresh installation uses the normal `npm run augnes:service:install`. To enroll a
fresh installation without loading a job or preparing a database:

```bash
npm run augnes:service:install -- --stopped
npm run augnes:service:status
```

Install/update preserves an existing desired stopped state. Use an explicitly
authorized `npm run augnes:service:start` to change it to running. Login/start
rechecks durable identity, source, desired state and current process ownership;
an enrolled volume/object can survive a different device number without an
identity rewrite. Ordinary stop/uninstall still use the exact lifecycle owner.

### Legacy configurations

Schema 1 has no historical volume UUID. Even equal path/device/inode cannot
silently enroll it. Status reports `legacy_evidence_insufficient`; an exact
legacy service remains stoppable through `npm run augnes:service:stop`.
Device drift keeps the compatible `companion_service_checkout_identity_changed`
refusal, with typed evidence distinguishing insufficient legacy evidence from
durable mismatch. Device drift alone does not prove physical replacement.

Explicit enrollment requires the exact service to be quiescent: its launchd job
observably absent, runtime/credential/lease/lock materials absent, and manager
state absent or the existing owner's explicitly stopped record. It neither
stops unverified processes nor removes residual ownership to manufacture this
condition. An ambiguous active legacy installation may first require the
existing, separately authorized stale-service decommission owner; do not rewrite
identity fields or kill a historical PID. Decommission/reinstall is a one-time
legacy recovery option, not a response to later benign device drift after
durable enrollment.

From the intended physical checkout, after obtaining maintenance/enrollment
authority:

```bash
umask 077
node scripts/augnes-companion-service.mjs identity-preview > "$PRIVATE_PREVIEW"
```

Inspect this local preview: exact checkout, current durable identity, desired
intent, source binding and the explicit warning that this is **new enrollment**,
not proof of historical continuity. The preview contains no credentials. After
the operator accepts this exact target/source, extract its `decision` object to
a separate absolute, user-owned `0600` JSON file, without modifying any fields:

```bash
node --input-type=module - "$PRIVATE_PREVIEW" "$PRIVATE_DECISION" <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const preview = JSON.parse(readFileSync(process.argv[2], 'utf8'));
writeFileSync(process.argv[3], JSON.stringify(preview.decision) + '\n', { mode: 0o600, flag: 'wx' });
JS
node scripts/augnes-companion-service.mjs enroll-identity "$PRIVATE_DECISION"
npm run augnes:service:status
```

The decision expires within five minutes and binds exact configuration/desired
state/LaunchAgent materials, current repository observation and source. The
lifecycle lock serializes commit with other operations. After final material,
source and checkout checks and temporary-file write/flush/close, commit admission
requires the decision still to be unexpired immediately before the atomic rename.
Equality with the deadline refuses. The clock check and filesystem rename are
separate operations; this is not a clock/filesystem atomicity or completion-time
guarantee. Expiry never extends the decision or triggers a replacement decision.
A stale/concurrent or interrupted precommit leaves legacy refusal intact; no
automatic retarget or retry occurs. Refusal removes the owned temporary file and
releases the exact lifecycle lock. If cleanup fails, the original refusal and
cleanup causes are retained; CLI output adds `cleanup_failed: true` without raw
paths or error details. Do not infer settlement from the primary refusal alone.
One atomic configuration publication installs schema 2. Readback
is required. A crash after publication may leave a settled configuration with
an unknown command acknowledgement; inspect it instead of replaying an old
decision. Desired stopped/running intent, launch definition, database, project
data and historical evidence remain unchanged. Enrollment does not start the
service or prepare storage. Any subsequent Start/source adoption is separately
authorized and must satisfy normal compatibility and preparation checks.

Do not use this procedure on the diagnosed production installation under a
source-development authorization. Review the candidate and obtain an exact
maintenance/source/data decision first. Older managers refuse schema 2;
rollback is not achieved by deleting its identity fields. Use the reviewed
lifecycle recovery procedure and compatible source, with data preserved.

## Diagnostics, preservation and dependency audit

Public status retains existing states/reasons and adds bounded
`checkout_identity` categories/comparison booleans. Missing observations are
unavailable, not false evidence. Local `identity-preview` reveals only the
non-secret target and identity needed for a decision. No credentials, raw
configuration, callback material or database data is projected.

Preservation observation v2 includes a current repository witness in the
bracketed before/after binding. A device, inode, birth, runtime, generation,
manager or configuration change during one admitted operation still fails;
durable continuity cannot rebaseline an active run. Historical v1 observations
retain their original validation and are not rewritten as v2 evidence.

Direct service comparisons (installation, validation, replacement and stale
retirement) now consume the versioned enrollment. The manager also retains its
startup observation during its lifetime. Checkout/capacity locks, bounded file
unlink/backup observations and native execution physical-root attachments keep
their existing short-lived/versioned device/inode rules. Discovery still needs
generation-bound credentials and verified UI/bridge/process identity; a durable
directory match cannot make a dead runtime live. No Core migration, background
re-enrollment, new authority store or automatic source adoption is introduced.

## Retained supervisor identity and explicit ownership retirement

A failed process observation is not exit. The manager retains its original
child handle, birth witness, attempt diagnostics and runtime ownership evidence
while an observation is unavailable or conflicting. It publishes
`recovery_required` with `companion_service_supervisor_ownership_unverifiable`;
its private manager record distinguishes `unavailable`, `conflicting`, and
`initial_identity_unavailable` observations. These retained fields are historical
witnesses, not a current live-ownership grant. Repeated failures neither count as
exits nor authorize signals, identity replacement or a competing supervisor.
The same gate precedes desired-state and maintenance handling and protects
adopted supervisors. An unidentified initial child remains unsettled until its
original handle/parent relationship can be verified or absence/exit is observed.
Confirmed absence and an observed child exit remain distinct failure origins.
Normal observed-exit restart retains the existing backoff. Stop and maintenance
wait for verification before acting; failed shutdown retains its witness and
manager lock instead of publishing a false stopped state. Process-group
settlement requires confirmed absence, including after a signal; unavailable or
changed observations cannot authorize escalation or cleanup.

Stopped startup and settled loop/shutdown share the same maintenance cleanup,
including a retained historical supervisor whose absence is confirmed. Only an
exact stale lease is removed before stopped completion is published. Active,
unverifiable, foreign or conflicting records remain; cleanup rechecks the full
lease and file identity so a renewed or replaced record refuses removal. This
does not start a supervisor or change stopped intent.

The diagnostic field and absence reason are additive private manager-state
information. The configuration, manager-state and public MCP wire versions are
unchanged; public live/preservation acceptance is not relaxed. The four-file
service source fingerprint changes and still requires explicit source adoption.
An unchanged Operator package label never demonstrates byte parity or adoption.
Older readers cannot interpret the new retirement record and must not operate
this installation during an incomplete retirement.

### Recovery of the previously erased relationship

`ownership-recovery-inspect`, `ownership-recovery-prepare` and
`ownership-recovery-apply` are narrow CLI operations owned by the same lifecycle
module. They retire the corroborated process family, persist **stopped** intent
and leave the installation and enrollment in place. They do not adopt a runtime
as live, start a replacement, update source, open/prepare a database, enroll a
checkout, repair credentials or qualify a PR. Previously stopped intent remains
stopped. The previous intent and lost manager record remain in the private
`ownership-recovery.json` operation record.

The initial entry requires the erased manager relationship: the exact manager
reports a foreign-runtime conflict with null supervisor and runtime ownership
fields. Attempt diagnostics lack child identity and may describe a later attempt;
they are retained as history, not proof of this supervisor's loss or exit. Start
is unavailable while manager ownership is unverified. Recovery requires all of
the following current evidence in one coherent observation:

- Durable checkout enrollment, exact configuration/LaunchAgent/desired-state
  material, actual installed source fingerprint and pinned Node identity.
- An exact loaded launchd definition and matching manager lock/state/process
  birth witnesses.
- The still-live supervisor's birth, exact command and direct parent relationship
  to that manager; matching runtime manifest, lock, generation and instance.
- Real UI/bridge health and credential-checked ownership responses, together with
  their exact process-group births and membership.

Neither parentage, a healthy URL, an old receipt nor a caller-supplied hash
substitutes for this combination. Missing witnesses refuse with a specific
`companion_service_recovery_*` reason. No record is rewritten to make inspection
pass. A foreign/reused process, unavailable observation, changed generation,
changed source, maintenance/decommission conflict or stale decision refuses.
This is cooperative same-user lifecycle safety, not protection against forged
same-user files or atomic OS/filesystem/process observation.

Preparation is read-only and expires after five minutes. Apply acquires the
existing lifecycle lock, reobserves the exact binding and rechecks at effect
admission, including before each process-group signal. It records the operation
before bootout, proves the manager absent and job unloaded, persists stopped
intent, settles only the recorded groups through the existing process owner,
then removes only exact residual runtime material through the existing bounded
cleanup owner. It preserves configuration, enrollment, launch definition,
database, project data and the recovery record. No replacement is attempted.
Expiry is an admission check, not a guarantee of completion before the deadline.

After a failed/unknown acknowledgement, use **inspect first**. A settled replay
returns the independently rechecked settlement without another effect. An
incomplete operation requires a new explicit preparation bound to the retained
operation and its currently verified remainder; it does not silently retry,
retarget or rebaseline. Changed/missing essential evidence keeps it refused.
Do not delete the record or its locks. New lifecycle code refuses ordinary Start,
Stop, installation and manager entry while that operation is incomplete. An
exclusive, coordinated operator window is still required: older installed
clients do not understand the new record, and a lifecycle lock is not a machine-
wide prohibition on independently authorized writers.

An already **settled** retirement is historical across supported device-number
changes. If its original observation hash differs, ordinary lifecycle inspection
requires valid current durable enrollment and an exact reconstruction of the
historical hash by changing only the current device number to the recorded configuration-parent
device. This does not assume that two paths share a mount: if that one recorded
number cannot reproduce the original hash, inspection refuses. Missing or
invalid enrollment, changed durable identity, malformed evidence and an
incomplete retirement still refuse. The record and its digest remain unchanged;
this compatibility check grants no process ownership or recovery replay.
Current configuration and source checks still apply; historical configuration
bytes do not freeze later otherwise-valid configuration updates.
Recovery inspection/application retain their stricter same-operation source,
material and repository checks. Preservation still brackets the actual current
observation and refuses device changes during a run.

### Non-circular, post-review operational handoff

Source development does not authorize these commands on production. After review,
an exact operator decision must authorize the candidate's **separate recovery
execution**, the installation it targets and a coordinated window with no other
lifecycle/maintenance writers. The accepted installation stays unchanged while
the reviewed candidate CLI runs from its separate checkout. Inspect/prepare bind
both its executing four-file source fingerprint and the installation's current
fingerprint. Thus recovery does not require installing itself first.

With the reviewed absolute paths, pinned Node and a private evidence directory:

```bash
umask 077
"$REVIEWED_NODE" "$REVIEWED_CANDIDATE/scripts/augnes-companion-service.mjs" \
  ownership-recovery-inspect --repository-root "$INSTALLED_CHECKOUT"
"$REVIEWED_NODE" "$REVIEWED_CANDIDATE/scripts/augnes-companion-service.mjs" \
  ownership-recovery-prepare --repository-root "$INSTALLED_CHECKOUT" \
  > "$PRIVATE_PREVIEW"
```

Review the target, effect, both source identities and current process/runtime
witnesses. The preparation's `decision.expected_binding` must equal the reviewed
inspection's `binding`; a different observation needs separate review, not an
automatic retry. Extract only the returned `decision` to an absolute user-owned `0600`
file using the same exclusive-file procedure shown for identity enrollment.
The decision is not user authority; the separately authorized application is:

```bash
"$REVIEWED_NODE" "$REVIEWED_CANDIDATE/scripts/augnes-companion-service.mjs" \
  ownership-recovery-apply --repository-root "$INSTALLED_CHECKOUT" \
  "$PRIVATE_DECISION"
"$REVIEWED_NODE" "$REVIEWED_CANDIDATE/scripts/augnes-companion-service.mjs" \
  ownership-recovery-inspect --repository-root "$INSTALLED_CHECKOUT"
```

Require `settled`, zero remaining owned processes, absent runtime materials and
locks, a stopped exact service, and unchanged configuration/enrollment/data
scope before considering anything else. Retirement is irreversible for that
process/generation; copying old state back cannot undo it. A later Start creates
a new generation and needs separate authority. If the installed service is now
validly stopped, the unchanged final candidate may be admitted to its own
planner-selected Canonical run without prior candidate installation. Focused
recovery evidence is not that qualification. Only a subsequent reviewed source-
adoption decision can advance the installed checkout and refresh its source
binding through supported installation/update while preserving stopped intent.
No source adoption, Start, merge or follow-on qualification is automatic.
