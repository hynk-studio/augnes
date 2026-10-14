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
lifecycle lock serializes commit with other operations. A stale/concurrent or
interrupted precommit leaves legacy refusal intact; no automatic retarget or
retry occurs. One atomic configuration publication installs schema 2. Readback
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
