# Windows physical-root helper v0.1

This directory contains the reviewed CDX2B3A native source candidate for
`physical_root_identity.windows.v0.1`. It is not a committed binary and is not
proof of Windows product support.

## Contract

The helper accepts exactly:

```text
augnes-windows-physical-root-v0.1.exe \
  --contract augnes.windows_physical_root_helper.v0.1 \
  --path <absolute-directory>
```

It opens the requested directory target without a shell, resolves the final
target path, and reads the volume serial and 128-bit file ID from that same
directory handle. It admits only Windows 11 x64, local fixed NTFS, and supported
directory symlink/junction behavior. Output is one bounded JSON object. Error
codes contain no supplied path or physical identifier.

## Source build

On a Windows 11 x64 developer environment with the reviewed MSVC toolchain:

```powershell
npm run build:native:windows-identity
```

The build writes an ignored executable and integrity manifest beneath
`native/windows-x64/`. The runtime verifies the helper contract, platform,
architecture, minimum Windows build, deterministic location, and SHA-256
before invocation. There is no runtime download or compilation path.

## Proof and packaging boundary

The existing distributable owner packages macOS and Linux only. It does not
stage this Windows helper. A normal user must not be told to install a compiler,
and an opaque executable must not be committed merely to create a pass.

Product Windows attachment admission remains fail-closed until the actual
Windows 11 x64 local NTFS filesystem suite and official MCP source-runtime path
both pass. Windows managed Start remains blocked after that attachment phase
and belongs to CDX2B3B.
