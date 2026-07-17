import { spawnSync } from "node:child_process";

const DEFAULT_TERM_GRACE_MS = 5_000;
const DEFAULT_KILL_GRACE_MS = 5_000;
const PROCESS_SNAPSHOT_TIMEOUT_MS = 2_000;
const TASKKILL_TIMEOUT_MS = 3_000;
const SERVER_CLOSE_TIMEOUT_MS = 3_000;
const trackedServerSockets = new WeakMap();

export class OwnedProcessTimeoutError extends Error {
  constructor(label, timeoutMs) {
    super(`owned process timed out: label=${safeLabel(label)} timeout_ms=${timeoutMs}`);
    this.name = "OwnedProcessTimeoutError";
    this.code = "owned_process_timeout";
  }
}

export function registerOwnedChild(owner, child, { label = "test-child" } = {}) {
  if (!(owner instanceof Set)) throw new TypeError("owned process owner must be a Set");
  if (!child) throw new Error("owned process spawn failed");

  let resolveClose;
  const record = {
    child,
    label: safeLabel(label),
    pid: Number.isInteger(child.pid) && child.pid > 0 ? child.pid : null,
    closed: false,
    closeResult: null,
    spawnErrorCode: null,
    closePromise: new Promise((resolve) => {
      resolveClose = resolve;
    }),
  };
  owner.add(record);

  child.once("error", (error) => {
    record.spawnErrorCode = safeErrorCode(error?.code);
  });
  child.once("close", (code, signal) => {
    record.closed = true;
    record.closeResult = {
      code: Number.isInteger(code) ? code : null,
      signal: typeof signal === "string" ? signal : null,
    };
    owner.delete(record);
    resolveClose(record.closeResult);
  });
  return record;
}

export async function waitForOwnedProcessExit(
  record,
  timeoutMs,
  terminationOptions = {},
) {
  if (record.closed) return record.closeResult;
  let timeout;
  const outcome = await Promise.race([
    record.closePromise.then((value) => ({ kind: "closed", value })),
    new Promise((resolve) => {
      timeout = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
    }),
  ]);
  clearTimeout(timeout);
  if (outcome.kind === "closed") return outcome.value;

  await terminateOwnedProcessTree(record, terminationOptions);
  throw new OwnedProcessTimeoutError(record.label, timeoutMs);
}

export async function terminateOwnedProcessTree(
  record,
  {
    termGraceMs = DEFAULT_TERM_GRACE_MS,
    killGraceMs = DEFAULT_KILL_GRACE_MS,
  } = {},
) {
  if (!record) return { term_sent: false, kill_sent: false };
  if (record.closed) {
    if (
      process.platform === "win32" ||
      !Number.isInteger(record.pid) ||
      record.pid <= 0
    ) {
      return { term_sent: false, kill_sent: false };
    }
    const remainingGroup = discoverOwnedProcessGroup(record.pid);
    if (remainingGroup.length === 0) {
      return { term_sent: false, kill_sent: false };
    }
    signalVerifiedOwnedProcesses(remainingGroup, "SIGTERM");
    if (await waitForVerifiedProcessesExit(remainingGroup, termGraceMs)) {
      closeChildStreams(record.child);
      return { term_sent: true, kill_sent: false };
    }
    signalVerifiedOwnedProcesses(remainingGroup, "SIGKILL");
    const groupExited = await waitForVerifiedProcessesExit(
      remainingGroup,
      killGraceMs,
    );
    closeChildStreams(record.child);
    if (!groupExited) throw ownedCleanupError();
    return { term_sent: true, kill_sent: true };
  }
  if (!Number.isInteger(record.pid) || record.pid <= 0) {
    if (!(await waitForRecordClose(record, killGraceMs))) throw ownedCleanupError();
    return { term_sent: false, kill_sent: false };
  }

  if (process.platform === "win32") {
    runTaskkill(record.pid, false);
    if (await waitForRecordClose(record, termGraceMs)) {
      closeChildStreams(record.child);
      return { term_sent: true, kill_sent: false };
    }
    runTaskkill(record.pid, true);
    if (!(await waitForRecordClose(record, killGraceMs))) {
      throw ownedCleanupError();
    }
    closeChildStreams(record.child);
    return { term_sent: true, kill_sent: true };
  }

  const owned = discoverOwnedProcessTree(record.pid);
  signalVerifiedOwnedProcesses(owned, "SIGTERM");
  if (
    (await waitForRecordClose(record, termGraceMs)) &&
    (await waitForVerifiedProcessesExit(owned, 0))
  ) {
    closeChildStreams(record.child);
    return { term_sent: true, kill_sent: false };
  }

  signalVerifiedOwnedProcesses(owned, "SIGKILL");
  const [closed, treeExited] = await Promise.all([
    waitForRecordClose(record, killGraceMs),
    waitForVerifiedProcessesExit(owned, killGraceMs),
  ]);
  closeChildStreams(record.child);
  if (!closed || !treeExited) throw ownedCleanupError();
  return { term_sent: true, kill_sent: true };
}

export async function cleanupOwnedProcesses(owner, options = {}) {
  const errors = [];
  for (const record of [...owner]) {
    try {
      await terminateOwnedProcessTree(record, options);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    const error = new Error("owned process cleanup failed");
    error.code = "owned_process_cleanup_failed";
    error.causes = errors.map((cause) => safeErrorCode(cause?.code));
    throw error;
  }
}

export function trackServerConnections(server) {
  if (!server || trackedServerSockets.has(server)) return server;
  const sockets = new Set();
  trackedServerSockets.set(server, sockets);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });
  return server;
}

export async function closeTrackedServer(
  server,
  { timeoutMs = SERVER_CLOSE_TIMEOUT_MS } = {},
) {
  if (!server) return;
  const sockets = trackedServerSockets.get(server) ?? server.testSockets ?? new Set();
  for (const socket of sockets) socket.destroy();
  server.closeAllConnections?.();
  server.closeIdleConnections?.();
  if (!server.listening) return;

  let settled = false;
  let closeError = null;
  const closed = new Promise((resolve) => {
    server.close((error) => {
      settled = true;
      closeError = error ?? null;
      resolve();
    });
  });
  const finished = await Promise.race([
    closed.then(() => true),
    delay(timeoutMs).then(() => false),
  ]);
  if (!finished) {
    for (const socket of sockets) socket.destroy();
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    await Promise.race([closed, delay(250)]);
  }
  if (!settled || server.listening) {
    const error = new Error("owned server close timed out");
    error.code = "owned_server_close_timeout";
    throw error;
  }
  if (closeError) throw closeError;
}

function discoverOwnedProcessTree(rootPid) {
  const snapshot = readPosixProcessSnapshot();
  const root = snapshot.get(rootPid);
  if (!root) {
    return [
      {
        pid: rootPid,
        ppid: null,
        pgid: rootPid,
        started: null,
      },
    ];
  }

  const ownedPids = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const processRecord of snapshot.values()) {
      if (ownedPids.has(processRecord.pid) || !ownedPids.has(processRecord.ppid)) {
        continue;
      }
      ownedPids.add(processRecord.pid);
      changed = true;
    }
  }
  return [...ownedPids]
    .map((pid) => snapshot.get(pid))
    .filter(Boolean)
    .sort((left, right) => right.pid - left.pid);
}

function discoverOwnedProcessGroup(rootPid) {
  return [...readPosixProcessSnapshot().values()]
    .filter(
      (record) => record.pgid === rootPid && !record.state.startsWith("Z"),
    )
    .sort((left, right) => right.pid - left.pid);
}

function readPosixProcessSnapshot() {
  const result = spawnSync(
    "ps",
    ["-axo", "pid=,ppid=,pgid=,state=,lstart="],
    {
      encoding: "utf8",
      timeout: PROCESS_SNAPSHOT_TIMEOUT_MS,
      windowsHide: true,
    },
  );
  const snapshot = new Map();
  if (result.status !== 0 || result.error) return snapshot;
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+?)\s*$/);
    if (!match) continue;
    snapshot.set(Number(match[1]), {
      pid: Number(match[1]),
      ppid: Number(match[2]),
      pgid: Number(match[3]),
      state: match[4],
      started: match[5],
    });
  }
  return snapshot;
}

function signalVerifiedOwnedProcesses(owned, signal) {
  const current = readPosixProcessSnapshot();
  const verified = owned.filter((record) => {
    const candidate = current.get(record.pid);
    if (!candidate) return false;
    if (record.started === null) return record.pid === candidate.pid;
    return candidate.pgid === record.pgid && candidate.started === record.started;
  });
  const groups = new Set(
    verified
      .map((record) => record.pgid)
      .filter((pgid) => Number.isInteger(pgid) && pgid > 0),
  );
  for (const pgid of groups) safeKill(-pgid, signal);
  for (const record of verified) {
    if (!groups.has(record.pgid)) safeKill(record.pid, signal);
  }
}

async function waitForVerifiedProcessesExit(owned, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  do {
    const current = readPosixProcessSnapshot();
    const alive = owned.some((record) => {
      const candidate = current.get(record.pid);
      if (!candidate || candidate.state.startsWith("Z")) return false;
      if (record.started === null) return candidate.pid === record.pid;
      return candidate.pgid === record.pgid && candidate.started === record.started;
    });
    if (!alive) return true;
    if (Date.now() >= deadline) return false;
    await delay(50);
  } while (true);
}

async function waitForRecordClose(record, timeoutMs) {
  if (record.closed) return true;
  return Promise.race([
    record.closePromise.then(() => true),
    delay(timeoutMs).then(() => false),
  ]);
}

function runTaskkill(pid, force) {
  const args = ["/PID", String(pid), "/T"];
  if (force) args.push("/F");
  spawnSync("taskkill", args, {
    stdio: "ignore",
    timeout: TASKKILL_TIMEOUT_MS,
    windowsHide: true,
  });
}

function safeKill(pid, signal) {
  try {
    process.kill(pid, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function closeChildStreams(child) {
  for (const stream of [child.stdin, child.stdout, child.stderr]) {
    if (stream && !stream.destroyed) stream.destroy();
  }
}

function ownedCleanupError() {
  const error = new Error("owned process tree cleanup failed");
  error.code = "owned_process_tree_cleanup_failed";
  return error;
}

function safeLabel(value) {
  return String(value ?? "test-child")
    .replace(/[^a-zA-Z0-9 _.,:()/-]/g, "?")
    .slice(0, 160);
}

function safeErrorCode(value) {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value)
    ? value
    : "unknown";
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
