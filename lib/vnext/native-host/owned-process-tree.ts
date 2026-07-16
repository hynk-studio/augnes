import { spawnSync, type ChildProcess } from "node:child_process";

const POLL_INTERVAL_MS = 25;

export interface OwnedProcessTreeStopResultV01 {
  root_pid: number | null;
  graceful: boolean;
  forced: boolean;
  settled: boolean;
}

/**
 * Stop only the process and descendants rooted at `child.pid`. The Codex
 * app-server is intentionally spawned in the supervised UI process group, so
 * R2 remains the ultimate shutdown owner; this helper provides the narrower
 * per-invocation stop path without signalling the UI itself.
 */
export async function stopOwnedProcessTreeV01(
  child: ChildProcess,
  options: {
    graceful_timeout_ms: number;
    forced_timeout_ms: number;
    additional_owned_pids?: Iterable<number>;
  },
): Promise<OwnedProcessTreeStopResultV01> {
  const pid = child.pid ?? null;
  const known = new Set<number>(options.additional_owned_pids ?? []);
  if (pid) known.add(pid);
  collectKnownDescendantsV01(known);
  if (known.size === 0 || ![...known].some(isProcessAliveV01)) {
    return { root_pid: pid, graceful: true, forced: false, settled: true };
  }

  signalKnownTreeV01(known, "SIGTERM");
  if (await waitForTreeExitV01(known, options.graceful_timeout_ms)) {
    return { root_pid: pid, graceful: true, forced: false, settled: true };
  }

  collectKnownDescendantsV01(known);
  signalKnownTreeV01(known, "SIGKILL");
  const settled = await waitForTreeExitV01(known, options.forced_timeout_ms);
  return { root_pid: pid, graceful: false, forced: true, settled };
}

export function listOwnedDescendantProcessIdsV01(rootPid: number): number[] {
  if (!Number.isSafeInteger(rootPid) || rootPid <= 0) return [];
  if (process.platform === "win32") return [];
  const observed = spawnSync("ps", ["-axo", "pid=,ppid="], {
    encoding: "utf8",
    timeout: 2_000,
    windowsHide: true,
  });
  if (observed.status !== 0 || typeof observed.stdout !== "string") return [];
  const children = new Map<number, number[]>();
  for (const line of observed.stdout.split("\n")) {
    const match = /^\s*(\d+)\s+(\d+)\s*$/u.exec(line);
    if (!match) continue;
    const pid = Number(match[1]);
    const parent = Number(match[2]);
    const entries = children.get(parent) ?? [];
    entries.push(pid);
    children.set(parent, entries);
  }
  const descendants: number[] = [];
  const pending = [...(children.get(rootPid) ?? [])];
  while (pending.length > 0) {
    const pid = pending.pop()!;
    descendants.push(pid);
    pending.push(...(children.get(pid) ?? []));
  }
  return descendants;
}

export function isProcessAliveV01(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function waitForTreeExitV01(
  known: Set<number>,
  timeoutMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    collectKnownDescendantsV01(known);
    if (![...known].some(isProcessAliveV01)) return true;
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  collectKnownDescendantsV01(known);
  return ![...known].some(isProcessAliveV01);
}

function collectKnownDescendantsV01(known: Set<number>): void {
  for (const pid of [...known]) {
    for (const descendant of listOwnedDescendantProcessIdsV01(pid)) {
      known.add(descendant);
    }
  }
}

function signalKnownTreeV01(
  known: Set<number>,
  signal: NodeJS.Signals,
): void {
  if (process.platform === "win32") {
    for (const pid of known) {
      const args = ["/PID", String(pid), "/T"];
      if (signal === "SIGKILL") args.push("/F");
      spawnSync("taskkill", args, {
        stdio: "ignore",
        timeout: 3_000,
        windowsHide: true,
      });
    }
    return;
  }
  for (const pid of [...known].reverse()) {
    try {
      process.kill(pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  }
}
