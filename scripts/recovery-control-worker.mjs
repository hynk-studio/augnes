// Fixed internal IPC entry. No public command, caller executable or inherited
// runtime authority. The supervisor persists admission/ownership before sending.
import { Worker } from "node:worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { preflightDistributablePackage, loadVerifiedDistributableSupervisor } from "./distributable-package-launcher.mjs";
// The child is its own supervisor-owned process group. This small independent
// watchdog bounds synchronous native validation even if its supervisor dies.
const watchdog = new Worker(`
  const { parentPort } = require('node:worker_threads');
  const parent = process.ppid;
  let end = Date.now() + 5000;
  parentPort.on('message', ms => { end = Date.now() + Math.min(ms, 120000); });
  setInterval(() => {
    if (process.ppid !== parent || Date.now() >= end) {
      if (process.platform === 'win32') require('node:child_process').spawnSync('taskkill',['/PID',String(process.pid),'/T','/F'],{timeout:3000,windowsHide:true,stdio:'ignore'});
      else process.kill(-process.pid, 'SIGKILL');
    }
  }, 50);
`, { eval: true });
let completed = false;
process.once("disconnect", () => { if (!completed)
    process.exitCode = 1; });
process.once("message", async (input) => {
    try {
        watchdog.postMessage(input.deadline);
        let run;
        if (input.distribution) {
            const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
            const preflight = preflightDistributablePackage({ packageRoot });
            const manifest = preflight.manifest;
            if (manifest.build_identity !== input.distribution.build_identity ||
                manifest.application_scope_fingerprint !== input.scope ||
                manifest.application_version !== input.validatorApplication.application_version ||
                manifest.runtime.runtime_contract !== input.validatorApplication.runtime_contract ||
                manifest.runtime.runtime_schema_version !== input.validatorApplication.runtime_schema_version)
                throw new Error("package_integrity_failed");
            run = loadVerifiedDistributableSupervisor(preflight).runRecoveryWorkerJob;
        }
        else {
            // Source-only dependency; the packaged bootstrap must contain only
            // its preflight/verified-loader owner, not a second validator copy.
            const jobUrl = new URL("./recovery-control-job.mjs", import.meta.url).href;
            run = (await import(jobUrl)).runRecoveryWorkerJob;
        }
        const result = await run(input);
        if (input.scenario !== "output_loss") {
            await new Promise((resolve, reject) => process.send(result, error => error ? reject(error) : resolve()));
        }
        completed = true;
    }
    catch (error) {
        process.exitCode = 1;
        const failure_code = /^(?:recovery|restore|package|database)_[a-z0-9_]{1,90}$/u.test(error.code ?? "") ? error.code : "recovery_worker_execution_failed";
        if (process.connected)
            await new Promise(resolve => process.send({ ...(input.request ? { request_id: input.request.request_id, fingerprint: input.fingerprint } : {}), failure_code }, () => resolve()));
    }
    finally {
        await watchdog.terminate();
        process.disconnect?.();
    }
});
