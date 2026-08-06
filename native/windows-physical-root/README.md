# Windows physical-root helper v0.1

This directory contains the reviewed CDX2B3A native source for
`physical_root_identity.windows.v0.1`. The ignored build output is not a
committed binary and does not establish packaged Windows support.

## Contract

The helper accepts exactly:

```text
augnes-windows-physical-root-v0.1.exe \
  --contract augnes.windows_physical_root_helper.v0.1 \
  --path <absolute-directory>
```

It opens the requested directory target without a shell, resolves the final
target path, and reads the volume serial and 128-bit file ID from that same
directory handle. Before admission it walks every requested-path and resolved-
target ancestor with a bounded component limit. Ordinary directories and the
explicit directory symlink/junction alias tags are admitted; cloud, projected,
recall, virtualization, unknown, unavailable, or ambiguous reparse families
fail closed. It admits Windows 10 Pro 22H2 build 19045 or newer and Windows 11
build 22000 or newer on x64 local fixed NTFS, subject to that alias policy.
Output is one bounded JSON object. Error codes contain no supplied path or
physical identifier.

## Source build

On a supported Windows x64 developer environment with the reviewed MSVC
toolchain:

```powershell
npm run build:native:windows-identity
```

The build writes an ignored executable and integrity manifest beneath
`native/windows-x64/`. The runtime verifies the helper contract, platform,
architecture, minimum Windows build, deterministic location, and SHA-256
before invocation. Runtime-root canonicalization and the physical targets of
both manifest and helper must remain inside the same canonical runtime root;
an escaping intermediate junction or symlink is refused before process
invocation. File identity, metadata, and hashes are revalidated immediately
before execution to detect practical replacement races. The source-build owner
discovers an installed official
Visual Studio Build Tools and Windows SDK toolchain without requiring a
Developer Command Prompt. There is no runtime download or compilation path.

## Proof and packaging boundary

The existing distributable owner packages macOS and Linux only. It does not
stage this Windows helper. A normal user must not be told to install a compiler,
and an opaque executable must not be committed merely to create a pass.

Historical source-runtime attachment evidence was obtained on Windows 10 Pro
22H2 build 19045.6456 at checkpoint
`374a582b766a10616667633eb911d3df2d49b85e`. Independent Windows 11 Home 25H2
build 26200.8875 evidence was obtained at pre-integration checkpoint
`567c9bbbad5d35e6803ad740adfac1b881983912`. Both hosts were x64 local fixed
NTFS with Node 24.18.0 and npm 11.16.0; the Windows 11 build used Visual Studio
Build Tools 2022 17.14.37, MSVC 19.44.35228, and Windows SDK 10.0.26100.0. The
Windows helper and canonical owners changed after the Windows 10 checkpoint,
so a later integrated head is not described as Windows 10 exact-head verified
without a fresh real Windows 10 run. Compatibility support and historical
evidence remain distinct from exact-head deciding proof. The real matrices
covered restart, drive-letter case, dot/dot-dot normalization, Unicode, a path
longer than 320 characters, junction aliases, reparse-loop refusal, same-path
replacement, delete/recreate, and rename/rebind semantics.
Directory-symlink creation was unavailable without host privilege on the
Windows 11 node, and no second local fixed NTFS volume was available for
cross-volume proof there. The existing package builder returns
`package_build_runtime_unsupported` on Windows, so packaged admission remains
disabled. Windows managed Start and Resume remain blocked and belong to CDX2B3B.
