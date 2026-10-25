// Compile-only regression: this function is never invoked. Use real exports,
// native result contracts and unchanged consumers; do not annotate callers.
import type { NonSharedBuffer } from "node:buffer";
import type { SpawnSyncOptions, SpawnSyncReturns, ExecFileSyncOptions } from "node:child_process";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { ownedSpawnSync, runOwnedSyncChild, ownedExecFileSync } from "./test-harness-process-lifecycle.mjs";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
declare function expectTrue<T extends true>(): void;
declare function expectNative<T extends string | NonSharedBuffer>(value: SpawnSyncReturns<T>): void;

function compilerRegression(generalSpawn: SpawnSyncOptions, generalExec: ExecFileSyncOptions) {
  const childOptions = { suite: "compiler", label: "compile only", command: process.execPath,
    args: ["-e", "process.exit(0)"], cwd: process.cwd(), env: process.env };
  void runCanonicalChild(childOptions);
  void runCanonicalChild({ ...childOptions, onLifecycle(event) {
    expectTrue<Equal<IsAny<typeof event>, false>>();
    const kind: "started" | "settled" | "unknown" = event.event;
    const childId: string = event.child_id;
    const observedAt: string = event.observed_at;
    void [kind, childId, observedAt];
  } });

  const plain = ownedSpawnSync("compile-only");
  const args = ownedSpawnSync("compile-only", ["arg"]);
  const text = ownedSpawnSync("compile-only", { encoding: "utf8" });
  const textArgs = ownedSpawnSync("compile-only", ["arg"], { encoding: "utf8" });
  const buffer = ownedSpawnSync("compile-only", { encoding: "buffer" });
  const nullBuffer = ownedSpawnSync("compile-only", ["arg"], { encoding: null });
  const noEncoding = ownedSpawnSync("compile-only", { timeout: 1000 });
  const noEncodingArgs = ownedSpawnSync("compile-only", ["arg"], { timeout: 1000 });
  const broad = ownedSpawnSync("compile-only", generalSpawn);
  const broadArgs = ownedSpawnSync("compile-only", ["arg"], generalSpawn);
  expectTrue<Equal<typeof plain.stdout, NonSharedBuffer>>();
  expectTrue<Equal<typeof args.stderr, NonSharedBuffer>>();
  expectTrue<Equal<typeof text.stdout, string>>();
  expectTrue<Equal<typeof textArgs.stderr, string>>();
  expectTrue<Equal<typeof buffer.stdout, NonSharedBuffer>>();
  expectTrue<Equal<typeof nullBuffer.stderr, NonSharedBuffer>>();
  expectTrue<Equal<typeof noEncoding.stdout, NonSharedBuffer>>();
  expectTrue<Equal<typeof noEncodingArgs.stdout, NonSharedBuffer>>();
  expectTrue<Equal<typeof broad.stdout, string | NonSharedBuffer>>();
  expectTrue<Equal<typeof broadArgs.stderr, string | NonSharedBuffer>>();
  expectTrue<Equal<IsAny<typeof text.stdout>, false>>();
  expectNative<string>(text);
  expectNative<NonSharedBuffer>(plain);
  const status: number | null = text.status;
  const signal: NodeJS.Signals | null = text.signal;
  const error: Error | undefined = text.error;
  const pid: number = text.pid;
  const output: Array<string | null> = text.output;
  void [status, signal, error, pid, output];
  expectTrue<Equal<undefined extends typeof text.owned_child_lifecycle ? true : false, true>>();
  expectTrue<Equal<undefined extends typeof text.owned_child_lifecycle_start ? true : false, true>>();
  if (text.owned_child_lifecycle) {
    const terminal: "settled" | "unknown" = text.owned_child_lifecycle.event;
    const remaining: number | null = text.owned_child_lifecycle.remaining_owned_processes;
    void [terminal, remaining];
  }

  const direct = runOwnedSyncChild("compile-only", []);
  const directText = runOwnedSyncChild("compile-only", [], { encoding: "utf8" });
  const directBuffer = runOwnedSyncChild("compile-only", [], { encoding: "buffer" });
  const directBroad = runOwnedSyncChild("compile-only", [], generalSpawn);
  expectTrue<Equal<typeof direct.stdout, NonSharedBuffer>>();
  expectTrue<Equal<typeof directText.stdout, string>>();
  expectTrue<Equal<typeof directBuffer.stderr, NonSharedBuffer>>();
  expectTrue<Equal<typeof directBroad.stdout, string | NonSharedBuffer>>();
  expectNative<string>(directText);
  expectNative<NonSharedBuffer>(direct);
  const directStatus: number | null = directText.status;
  const directSignal: NodeJS.Signals | null = directText.signal;
  const directError: Error | undefined = directText.error;
  void [directStatus, directSignal, directError];

  const execPlain = ownedExecFileSync("compile-only");
  const execArgs = ownedExecFileSync("compile-only", ["arg"]);
  const execText = ownedExecFileSync("compile-only", { encoding: "utf8" });
  const execTextArgs = ownedExecFileSync("compile-only", ["arg"], { encoding: "utf8" });
  const execBuffer = ownedExecFileSync("compile-only", { encoding: "buffer" });
  const execNull = ownedExecFileSync("compile-only", ["arg"], { encoding: null });
  const execNoEncoding = ownedExecFileSync("compile-only", { timeout: 1000 });
  const execBroad = ownedExecFileSync("compile-only", generalExec);
  const execBroadArgs = ownedExecFileSync("compile-only", ["arg"], generalExec);
  expectTrue<Equal<typeof execPlain, NonSharedBuffer>>();
  expectTrue<Equal<typeof execArgs, NonSharedBuffer>>();
  expectTrue<Equal<typeof execText, string>>();
  expectTrue<Equal<typeof execTextArgs, string>>();
  expectTrue<Equal<typeof execBuffer, NonSharedBuffer>>();
  expectTrue<Equal<typeof execNull, NonSharedBuffer>>();
  expectTrue<Equal<typeof execNoEncoding, NonSharedBuffer>>();
  expectTrue<Equal<typeof execBroad, string | NonSharedBuffer>>();
  expectTrue<Equal<typeof execBroadArgs, string | NonSharedBuffer>>();
  expectTrue<Equal<IsAny<typeof execText>, false>>();
}
void compilerRegression;
