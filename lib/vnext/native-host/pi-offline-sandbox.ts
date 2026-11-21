import path from "node:path";
import { PI_OFFLINE_RPC_FLAGS_V01 } from "./pi-rpc-lifecycle";

// The child receives one writable host file, one read-only check, its runtime
// files and private scratch. Every source path except the OS runtime is ours.
export function piOfflineSandboxArgs(root: string, probePort?: number): string[] {
  return [...piOfflineSandboxPrefix(root, probePort), "--remount-ro", "/", "--chdir", "/workspace", "--", "/bin/pi", ...PI_OFFLINE_RPC_FLAGS_V01];
}

export function piOfflineSandboxPrefix(root: string, probePort?: number): string[] {
  const systemFiles = ["/lib64/ld-linux-x86-64.so.2", "/bin/bash", "/usr/bin/readlink",
    ...["libc.so.6", "libdl.so.2", "libm.so.6", "libpthread.so.0", "libtinfo.so.6"]
      .map(name => "/lib/x86_64-linux-gnu/" + name)];
  return [
    "--core=0:0", "--fsize=1048576:1048576", "--nofile=128:128", "--cpu=10:10", "--",
    "/usr/bin/unshare", "--user", "--map-root-user", "--net", "--",
    "/usr/bin/bwrap", "--unshare-user", "--disable-userns", "--unshare-pid", "--unshare-ipc",
    "--unshare-uts", "--new-session", "--die-with-parent", "--cap-drop", "ALL", "--clearenv",
    "--dir", "/workspace", "--proc", "/proc", "--dev", "/dev",
    "--size", "16777216", "--tmpfs", "/dev/shm", "--size", "33554432", "--tmpfs", "/tmp",
    "--dir", "/tmp/home", "--setenv", "HOME", "/tmp/home", "--setenv", "TMPDIR", "/tmp",
    "--setenv", "PI_CODING_AGENT_DIR", "/tmp/home/agent", "--setenv", "PI_OFFLINE", "1",
    "--setenv", "NODE_ENV", "production", "--setenv", "PATH", "/bin",
    ...(probePort === undefined ? [] : ["--setenv", "PROBE_PORT", String(probePort),
      "--setenv", "OUTSIDE_FILE", path.join(root, "outside.txt")]),
    ...systemFiles.flatMap(file => ["--ro-bind", file, file]),
    "--ro-bind", path.join(root, "pi"), "/bin/pi",
    "--ro-bind", path.join(root, "check.sh"), "/fixture/check.sh",
    "--bind", path.join(root, "answer.txt"), "/workspace/answer.txt",
  ];
}
