import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { NativeHostReconciliationRequiredErrorV01 } from "./native-host-contract";
import { piOfflineSandboxArgs } from "./pi-offline-sandbox";
import { PiRpcProtocolError, readIdlePiSessionV01, readPiRpcRecordsV01, signalPiGroupV01 } from "./pi-rpc-lifecycle";

export const PI_PATCH_EDIT = "printf '\\n' >> /workspace/answer.txt";
export const PI_PATCH_CHECK = "/bin/bash /fixture/check.sh";
// Only validated, nonempty UTF-8 text without NUL enters the staged file.
export const PI_PATCH_CHECK_SOURCE = "IFS= read -r -d '' contents < /workspace/answer.txt || :\n[[ $contents == *$'\\n' ]]\n";

/** The actual Pi session starts with an empty file. Only the reviewed bytes
 * enter that mount, after the controller has identified the idle session. */
export async function runPiFilePatchWorker(input: {
  directory: string;
  signal: AbortSignal;
  settleMs: number;
  deliver: (session: string) => Promise<void>;
  record: (command: "edit" | "check", exitCode: number) => void;
}): Promise<void> {
  const { directory, signal } = input;
  signal.throwIfAborted();
  const child = spawn("/usr/bin/prlimit", piOfflineSandboxArgs(directory), {
    cwd: directory, env: { NODE_ENV: "production" }, detached: true, stdio: ["pipe", "pipe", "ignore"],
  });
  let closed = false;
  const close = new Promise<boolean>(resolve => {
    child.once("error", () => resolve(false));
    child.once("close", (code, reason) => { closed = true; resolve(code === 0 && reason === null); });
  });
  child.stdin.on("error", () => {}); // Each write observes its own callback.
  const records = readPiRpcRecordsV01(child.stdout);
  let sequence = 0;
  async function call(type: "get_state" | "bash", command?: string) {
    signal.throwIfAborted();
    const id = String(++sequence);
    const request = command === undefined ? { id, type } : { id, type, command, excludeFromContext: true };
    await new Promise<void>((resolve, reject) => {
      child.stdin.write(JSON.stringify(request) + "\n", error => error ? reject(error) : resolve());
    });
    for (;;) {
      const next = await records.next();
      if (next.done) throw new PiRpcProtocolError("pi_patch_response_missing");
      const reply = next.value;
      if (reply.id !== id) throw new PiRpcProtocolError("pi_patch_response_mismatch");
      if (type === "bash" && reply.type === "bash_execution_update" && typeof reply.delta === "string") continue;
      if (reply.type !== "response" || reply.command !== type || reply.success !== true ||
          !reply.data || typeof reply.data !== "object" || Array.isArray(reply.data)) {
        throw new PiRpcProtocolError("pi_patch_response_invalid");
      }
      return reply.data as Record<string, unknown>;
    }
  }

  async function exchange() {
    const session = readIdlePiSessionV01(await call("get_state"), 0);
    signal.throwIfAborted();
    await input.deliver(session);
    for (const kind of ["edit", "check"] as const) {
      const reply = await call("bash", kind === "edit" ? PI_PATCH_EDIT : PI_PATCH_CHECK);
      if (!Number.isInteger(reply.exitCode) || reply.cancelled !== false || reply.truncated !== false ||
          typeof reply.output !== "string") throw new PiRpcProtocolError("pi_patch_command_incomplete");
      const exitCode = reply.exitCode as number;
      input.record(kind, exitCode);
      if (exitCode !== 0) throw new PiRpcProtocolError("pi_patch_command_failed");
    }
    // Pi retains a session entry for each Bash return even with excludeFromContext.
    readIdlePiSessionV01(await call("get_state"), 0, session, 2);
    child.stdin.end();
    if (!(await records.next()).done || !await close) throw new PiRpcProtocolError("pi_patch_shutdown_incomplete");
  }

  // Interrupt the actual descriptors and owned process group so exchange()
  // settles before its caller can remove the workspace or publish a result.
  let stopError: unknown;
  function stop() {
    try {
      if (child.pid && !closed) signalPiGroupV01(child.pid, "SIGKILL");
    } catch (error) { stopError = error; }
    child.stdin.destroy();
    child.stdout.destroy();
  }
  signal.addEventListener("abort", stop, { once: true });
  if (signal.aborted) stop();
  try {
    await exchange();
  } finally {
    signal.removeEventListener("abort", stop);
    if (!closed || (child.pid && signalPiGroupV01(child.pid, 0) === "present")) {
      try { if (child.pid) signalPiGroupV01(child.pid, "SIGKILL"); } catch (error) { stopError = error; }
    }
    child.stdin.destroy();
    child.stdout.destroy();
    const deadline = performance.now() + input.settleMs;
    while (!closed || (child.pid && signalPiGroupV01(child.pid, 0) !== "absent")) {
      if (performance.now() >= deadline) throw new NativeHostReconciliationRequiredErrorV01("pi_patch_worker_unsettled");
      await delay(10);
    }
    if (stopError) throw stopError;
  }
}
