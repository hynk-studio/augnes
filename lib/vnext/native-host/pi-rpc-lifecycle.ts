import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import { NativeHostReconciliationRequiredErrorV01 } from "./native-host-contract";

// This profile sends only this marker to an idle Pi queue. There is no prompt,
// project path, model input, or extensible command channel.
const MARKER = "Augnes offline queue check";
const MAX_OUTPUT_BYTES = 128 * 1024;
export const PI_OFFLINE_RPC_FLAGS_V01 = Object.freeze(["--mode", "rpc", "--offline", "--no-session", "--no-tools", "--no-extensions",
  "--no-skills", "--no-prompt-templates", "--no-themes", "--no-context-files"]);

/** Only local protocol reason codes may be returned to the project. */
export class PiRpcProtocolError extends Error {}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new PiRpcProtocolError("pi_rpc_record_invalid");
  return value as Record<string, unknown>;
}

export async function* readPiRpcRecordsV01(stream: Readable) {
  let total = 0;
  let pending = Buffer.alloc(0);
  for await (const chunk of stream) {
    total += chunk.length;
    if (total > MAX_OUTPUT_BYTES) throw new PiRpcProtocolError("pi_rpc_output_limit");
    pending = Buffer.concat([pending, chunk]);
    let newline;
    while ((newline = pending.indexOf(10)) >= 0) {
      const line = pending.subarray(0, newline);
      pending = pending.subarray(newline + 1);
      let value: unknown;
      try { value = JSON.parse(line.toString("utf8")); }
      catch { throw new PiRpcProtocolError("pi_rpc_record_invalid"); }
      yield object(value);
    }
  }
  if (pending.length) throw new PiRpcProtocolError("pi_rpc_record_incomplete");
}

function idleSession(value: unknown, pending: number, expectedSession?: string): string {
  const state = object(value);
  if (typeof state.sessionId !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(state.sessionId) ||
      (expectedSession !== undefined && state.sessionId !== expectedSession) ||
      state.pendingMessageCount !== pending || state.messageCount !== 0 ||
      state.isStreaming !== false || state.isCompacting !== false) throw new PiRpcProtocolError("pi_rpc_session_state_invalid");
  return state.sessionId;
}

function signalGroup(pid: number, signal: NodeJS.Signals | 0): "present" | "absent" | "unconfirmed" {
  try { process.kill(-pid, signal); return "present"; }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ESRCH") return "absent";
    if (signal === 0 && code === "EPERM") return "unconfirmed";
    throw new NativeHostReconciliationRequiredErrorV01("pi_rpc_group_identity_unconfirmed");
  }
}

/** The caller supplies a private copy of the verified executable. Free-form
 * task material never enters this driver. Each POSIX child leads its own group. */
export async function runPiRpcQueueLifecycleV01(input: {
  executable: string;
  directory: string;
  signal: AbortSignal;
  stopSettleMs: number;
  onQueued?: (session: string) => Promise<void>;
}): Promise<{ session: string; queued: boolean }> {
  input.signal.throwIfAborted();
  const child = spawn(input.executable, PI_OFFLINE_RPC_FLAGS_V01, {
    cwd: input.directory, detached: true, stdio: ["pipe", "pipe", "ignore"],
    env: { NODE_ENV: "production", HOME: input.directory, TMPDIR: input.directory, PATH: input.directory,
      PI_CODING_AGENT_DIR: input.directory + "/agent", PI_OFFLINE: "1" },
  });
  let childClosed = false;
  const closed = new Promise<boolean>(resolve => {
    child.once("error", () => resolve(false));
    child.once("close", (code, signal) => {
      childClosed = true;
      resolve(code === 0 && signal === null);
    });
  });
  // Broken pipes are observed by the write callback or stdout EOF.
  child.stdin.on("error", () => {});
  const records = readPiRpcRecordsV01(child.stdout);
  let sequence = 0;
  async function call(command: string, message?: string) {
    const id = String(++sequence);
    await new Promise<void>((resolve, reject) => {
      child.stdin.write(JSON.stringify({ id, type: command, message }) + "\n",
        error => error ? reject(error) : resolve());
    });
    for (;;) {
      const next = await records.next();
      if (next.done) throw new PiRpcProtocolError("pi_rpc_response_missing");
      const reply = next.value;
      if (reply.type === "queue_update") continue;
      if (reply.type !== "response" || reply.id !== id || reply.command !== command || reply.success !== true) {
        throw new PiRpcProtocolError("pi_rpc_response_invalid");
      }
      return reply.data;
    }
  }

  // On cancellation, fence new queue entries immediately. Allow the in-flight
  // exchange and clear/abort to finish, then force a stuck private group down.
  const graceMs = Math.max(1, Math.min(1_000, Math.floor(input.stopSettleMs / 3)));
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  const interrupted = Promise.withResolvers<void>();
  let forced = false;
  let groupError: unknown;
  function forceStop() {
    if (forced) return;
    forced = true;
    interrupted.resolve();
    try { if (child.pid) signalGroup(child.pid, "SIGKILL"); }
    catch (error) { groupError = error; }
    child.stdin.destroy();
    child.stdout.destroy();
  }
  function armStop() { stopTimer ??= setTimeout(forceStop, graceMs); }
  input.signal.addEventListener("abort", armStop, { once: true });
  if (input.signal.aborted) armStop();
  let session: string;
  let queued = false;
  try {
    session = idleSession(await call("get_state"), 0);
    if (!input.signal.aborted) {
      const acceptance = object(await call("follow_up", MARKER));
      if (acceptance.disposition !== "queued") throw new PiRpcProtocolError("pi_rpc_queue_not_confirmed");
      queued = true;
      idleSession(await call("get_state"), 1, session);
      if (input.onQueued) await Promise.race([input.onQueued(session), Promise.race([closed, interrupted.promise]).then(() => {
        throw new PiRpcProtocolError("pi_rpc_closed_during_checkpoint");
      })]);
    }
    const recovered = object(await call("clear_queue"));
    if (!Array.isArray(recovered.steering) || recovered.steering.length ||
        !Array.isArray(recovered.followUp) || recovered.followUp.length !== Number(queued) ||
        (queued && recovered.followUp[0] !== MARKER)) throw new PiRpcProtocolError("pi_rpc_queue_recovery_failed");
    await call("abort");
    idleSession(await call("get_state"), 0, session);
    child.stdin.end();
    armStop();
    if (!(await records.next()).done || !await Promise.race([closed, interrupted.promise])) {
      throw new PiRpcProtocolError("pi_rpc_shutdown_incomplete");
    }
  } finally {
    clearTimeout(stopTimer);
    input.signal.removeEventListener("abort", armStop);
    try {
      if (!forced && child.pid && signalGroup(child.pid, 0) === "present") forceStop();
    } finally {
      child.stdin.destroy();
      child.stdout.destroy();
    }
    if (groupError) throw groupError;
    // Darwin can deny a group probe between SIGKILL and reaping the leader.
    // Observe child close first, then require ESRCH for the entire group.
    const deadline = performance.now() + graceMs;
    for (;;) {
      const group = childClosed && child.pid ? signalGroup(child.pid, 0) : undefined;
      if (childClosed && (!child.pid || group === "absent")) break;
      const remaining = deadline - performance.now();
      if (remaining <= 0) {
        throw new NativeHostReconciliationRequiredErrorV01(
          group === "unconfirmed" ? "pi_rpc_group_identity_unconfirmed" : "pi_rpc_group_unsettled",
        );
      }
      await delay(Math.min(10, remaining));
    }
  }
  if (forced) throw new PiRpcProtocolError("pi_rpc_shutdown_incomplete");
  return { session, queued };
}
