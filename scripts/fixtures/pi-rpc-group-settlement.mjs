import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire, syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { mock } from "node:test";
import { pathToFileURL } from "node:url";

// The same fixture can run against either checkout, including when its bytes
// are retained outside both. Only the signal-0 observations are controlled.
export async function assertPiGroupSettlement() {
  if (process.platform !== "linux" && process.platform !== "darwin") return;
  const require = createRequire(path.resolve("package.json"));
  const { runPiRpcQueueLifecycleV01, PiRpcProtocolError } = require("./lib/vnext/native-host/pi-rpc-lifecycle.ts");
  const { NativeHostReconciliationRequiredErrorV01 } = require("./lib/vnext/native-host/native-host-contract.ts");
  const source = readFileSync(require.resolve("./scripts/fixtures/pi-rpc-lifecycle.cjs"), "utf8");
  for (const afterClose of ["real", "denied", "present"]) {
    const directory = mkdtempSync(path.join(tmpdir(), "augnes-pi-settlement-"));
    const executable = path.join(directory, "peer");
    writeFileSync(executable, "#!" + process.execPath + "\n" + source, { mode: 0o700 });
    writeFileSync(path.join(directory, "scenario"), "handled");
    const spawn = childProcess.spawn;
    const kill = process.kill.bind(process);
    const closed = Promise.withResolvers();
    let pid;
    let didClose = false;
    let kills = 0;
    let postCloseProbes = 0;
    const spawnPatch = mock.method(childProcess, "spawn", function (command, ...args) {
      const child = spawn.call(this, command, ...args);
      if (command === executable) {
        pid = child.pid;
        child.once("close", () => { didClose = true; closed.resolve(); });
      }
      return child;
    });
    syncBuiltinESMExports();
    const signalPatch = mock.method(process, "kill", (target, signal) => {
      if (pid && target === -pid) {
        if (signal === "SIGKILL") {
          const sent = kill(target, signal);
          kills++;
          return sent;
        }
        if (signal === 0 && kills) {
          if (didClose) postCloseProbes++;
          if (!didClose || afterClose === "denied") throw Object.assign(new Error("group probe denied"), { code: "EPERM" });
          if (afterClose === "present") return true;
        }
      }
      return kill(target, signal);
    });
    let closeDeadline;
    try {
      const failure = await runPiRpcQueueLifecycleV01({ executable, directory, signal: AbortSignal.timeout(5_000),
        stopSettleMs: afterClose === "real" ? 3_000 : 600 }).then(() => null, error => error);
      const closedAtReturn = didClose;
      assert(pid, "the real peer must have spawned");
      // Reap the real peer even when the predecessor returns immediately on EPERM.
      await Promise.race([closed.promise, new Promise((_, reject) => {
        closeDeadline = setTimeout(() => reject(new Error("peer did not close")), 3_000);
      })]);
      for (const id of [pid, -pid]) assert.throws(() => kill(id, 0), { code: "ESRCH" });
      assert.equal(kills, 1, "one real group stop");
      if (afterClose === "real") {
        assert(failure instanceof PiRpcProtocolError, "handled input lost its rejection: " + failure?.message);
        assert.equal(failure.message, "pi_rpc_queue_not_confirmed");
      } else {
        assert(failure instanceof NativeHostReconciliationRequiredErrorV01, "unconfirmed group was accepted");
        assert.equal(failure.code, afterClose === "denied" ? "pi_rpc_group_identity_unconfirmed" : "pi_rpc_group_unsettled");
      }
      assert(closedAtReturn && postCloseProbes > 0, "settlement needs child close and a separate group observation");
    } finally {
      clearTimeout(closeDeadline);
      signalPatch.mock.restore();
      spawnPatch.mock.restore();
      syncBuiltinESMExports();
      rmSync(directory, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await assertPiGroupSettlement();
}
