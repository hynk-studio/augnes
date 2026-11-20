import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readlink, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";
import { preparePinnedPiExecutableV01 } from "../lib/vnext/native-host/pi-rpc-lifecycle-adapter";
import { piOfflineSandboxArgs } from "../lib/vnext/native-host/pi-offline-sandbox";
import { readPiRpcRecordsV01 } from "../lib/vnext/native-host/pi-rpc-lifecycle";
import { registerOwnedChild, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";

const BEFORE = "41\n";
const AFTER = "42\n";
const CHECK = 'read -r value < /workspace/answer.txt && [[ "$value" == 42 ]]\n';
const CANARY = "outside the mounted workspace\n";
const CONNECT = 'exec 3<>"/dev/tcp/127.0.0.1/$PROBE_PORT"';
const DEADLINE_MS = 20_000;
class UnsettledPiWorkspace extends AggregateError {}

async function exercisePi(root: string, port: number, signal: AbortSignal) {
  signal.throwIfAborted();
  const child = spawn("/usr/bin/prlimit", piOfflineSandboxArgs(root, port), {
    cwd: root, env: { NODE_ENV: "test", AUGNES_HOST_SENTINEL: "visible only before isolation" }, detached: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const record = registerOwnedChild(new Set(), child, { label: "pi-offline-workspace" });
  const records = readPiRpcRecordsV01(child.stdout);
  let diagnostic = "";
  child.stderr.on("data", (chunk: Buffer) => {
    diagnostic = (diagnostic + chunk.toString("utf8")).slice(-2048);
  });
  child.stdin.on("error", () => {}); // The write callback receives EPIPE.
  let sequence = 0;
  let stopping = false;

  async function call(type: "get_state" | "bash", command?: string) {
    assert(!stopping, "Pi exchange stopped");
    const id = String(++sequence);
    const input = type === "bash" ? { id, type, command, excludeFromContext: true } : { id, type };
    await new Promise<void>((resolve, reject) => {
      child.stdin.write(JSON.stringify(input) + "\n", error => error ? reject(error) : resolve());
    });
    for (;;) {
      const next = await records.next();
      if (next.done) {
        const exit = await record.closePromise;
        throw new Error("Pi closed before " + type + " response (" +
          String(record.spawnErrorCode ?? exit.signal ?? exit.code) + "): " + diagnostic.trim());
      }
      const reply = next.value;
      assert.equal(reply.id, id, "Pi response or update belongs to another command");
      if (type === "bash" && reply.type === "bash_execution_update") {
        assert.equal(typeof reply.delta, "string");
        continue;
      }
      assert(reply.type === "response" && reply.command === type && reply.success === true,
        "unexpected Pi response to " + type);
      assert(reply.data && typeof reply.data === "object" && !Array.isArray(reply.data));
      return reply.data as Record<string, unknown>;
    }
  }

  async function bash(command: string, expectedExit: number) {
    const result = await call("bash", command);
    assert.equal(result.exitCode, expectedExit, "Pi Bash exit code: " + String(result.output).slice(-512));
    assert.equal(result.cancelled, false);
    assert.equal(result.truncated, false);
    assert.equal(typeof result.output, "string");
    return result.output as string;
  }

  async function exchange() {
    const initial = await call("get_state");
    assert.equal(typeof initial.sessionId, "string");
    assert.equal(initial.messageCount, 0);
    const boundaries = [
      "set -eu",
      "[[ ! -v AUGNES_HOST_SENTINEL && ! -r \"$OUTSIDE_FILE\" ]]",
      "if (printf changed > \"$OUTSIDE_FILE\") 2>/dev/null; then exit 21; fi",
      "if (printf changed > /fixture/check.sh) 2>/dev/null; then exit 22; fi",
      "if (" + CONNECT + ") 2>/dev/null; then exit 23; fi",
      "/usr/bin/readlink /proc/self/ns/pid /proc/self/ns/net",
    ].join("\n");
    const namespaces = (await bash(boundaries, 0)).trim().split("\n");
    assert.equal(namespaces.length, 2);
    for (const [index, name] of ["pid", "net"].entries()) {
      assert.match(namespaces[index], new RegExp("^" + name + ":\\[[0-9]+\\]$"));
      assert.notEqual(namespaces[index], await readlink("/proc/self/ns/" + name));
    }
    await bash("/bin/bash /fixture/check.sh", 1);
    await bash('read -r value < answer.txt && printf "%s\\n" "$((value + 1))" > answer.txt', 0);
    await bash("/bin/bash /fixture/check.sh", 0);
    const final = await call("get_state");
    assert.equal(final.sessionId, initial.sessionId);
    assert.equal(final.pendingMessageCount, 0);
    assert.equal(final.isStreaming, false);
    assert.equal(final.isCompacting, false);
    child.stdin.end();
    assert((await records.next()).done, "unexpected Pi output after shutdown");
    assert.deepEqual(await record.closePromise, { code: 0, signal: null }, diagnostic);
  }

  let exchangeError: unknown;
  const interrupted = Promise.withResolvers<never>();
  const onAbort = () => interrupted.reject(signal.reason);
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    await Promise.race([exchange(), interrupted.promise]);
  } catch (error) {
    exchangeError = error;
    throw error;
  } finally {
    stopping = true;
    signal.removeEventListener("abort", onAbort);
    child.stdin.end();
    try {
      if (!record.closed) await Promise.race([record.closePromise, delay(1_000, undefined, { ref: false })]);
      await terminateOwnedProcessTree(record);
    } catch (error) {
      throw new UnsettledPiWorkspace(exchangeError ? [exchangeError, error] : [error],
        "Pi cleanup is unconfirmed. Temporary workspace retained at " + root);
    }
  }
}

async function main(signal: AbortSignal) {
  const [flag, executable, ...extra] = process.argv.slice(2);
  assert(flag === "--pi-executable" && executable && path.isAbsolute(executable) && !extra.length,
    "usage: node --import tsx scripts/test-pi-offline-workspace.ts --pi-executable /absolute/path/to/pi");
  assert(process.platform === "linux" && process.arch === "x64", "the isolated workspace check requires Linux x64");
  const root = await mkdtemp(path.join(tmpdir(), "augnes-pi-workspace-"));
  let connections = 0;
  const server = createServer(socket => { connections++; socket.end("ready\n"); });
  let settled = true;
  try {
    assert(await preparePinnedPiExecutableV01(executable, path.join(root, "pi"), signal),
      "the supplied executable does not match the Pi 1.5.2 release pin");
    await writeFile(path.join(root, "answer.txt"), BEFORE, { mode: 0o600 });
    await writeFile(path.join(root, "check.sh"), CHECK, { mode: 0o600 });
    await writeFile(path.join(root, "outside.txt"), CANARY, { mode: 0o600 });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert(address && typeof address === "object");
    // Positive control for both this Bash build's /dev/tcp and this listener.
    const positiveControl = CONNECT + ' && IFS= read -r -t 2 reply <&3 && [[ "$reply" == ready ]]';
    await promisify(execFile)("/bin/bash", ["--noprofile", "--norc", "-c", positiveControl],
      { env: { NODE_ENV: "test", PROBE_PORT: String(address.port) }, timeout: 3_000, signal });
    assert.equal(connections, 1, "the host listener must be reachable before the Pi check");
    await exercisePi(root, address.port, signal);
    const after = await readFile(path.join(root, "answer.txt"));
    assert.deepEqual(after, Buffer.from(AFTER));
    assert.equal(await readFile(path.join(root, "check.sh"), "utf8"), CHECK);
    assert.equal(await readFile(path.join(root, "outside.txt"), "utf8"), CANARY);
    assert.equal(connections, 1, "the sandbox reached the host listener");
    return { profile: "pi_offline_synthetic_workspace", pi_version: "1.5.2", platform: "linux-x64",
      model_prompts_sent: 0, check_exit_before: 1, edit_exit: 0, check_exit_after: 0,
      artifact_sha256: createHash("sha256").update(after).digest("hex"),
      outside_file_preserved: true, check_file_preserved: true, host_listener_connections_from_pi: 0,
      separate_pid_and_network_namespaces: true };
  } catch (error) {
    settled = !(error instanceof UnsettledPiWorkspace);
    throw error;
  } finally {
    try {
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    } finally {
      if (settled) await rm(root, { recursive: true, force: true });
    }
  }
}

const stop = new AbortController();
const onStop = (signal: NodeJS.Signals) => stop.abort(new Error("Pi workspace check interrupted by " + signal));
process.on("SIGINT", onStop);
process.on("SIGTERM", onStop);
const result = main(AbortSignal.any([stop.signal, AbortSignal.timeout(DEADLINE_MS)]));
result.then(value => console.log(JSON.stringify(value)), error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  process.removeListener("SIGINT", onStop);
  process.removeListener("SIGTERM", onStop);
});
