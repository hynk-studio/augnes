#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { waitForBoundedFileSignal } from "./bounded-file-signal.mjs";

const root = mkdtempSync(path.join(tmpdir(), "augnes-file-signal-"));
try {
  const preexisting = path.join(root, "preexisting.release");
  writeFileSync(preexisting, "released\n");
  assert.deepEqual(
    await waitForBoundedFileSignal(preexisting, { timeoutMs: 100 }),
    { observation: "preexisting" },
  );

  const raced = path.join(root, "raced.release");
  let closed = false;
  assert.deepEqual(
    await waitForBoundedFileSignal(raced, {
      timeoutMs: 100,
      watchDirectory() {
        writeFileSync(raced, "released\n");
        return { close() { closed = true; } };
      },
    }),
    { observation: "post_registration" },
  );
  assert.equal(closed, true);

  const fallback = path.join(root, "fallback.release");
  const fallbackPromise = waitForBoundedFileSignal(fallback, {
    timeoutMs: 500,
    fallbackPollMs: 10,
    watchDirectory() { throw new Error("watch unavailable"); },
  });
  setTimeout(() => writeFileSync(fallback, "released\n"), 20);
  assert.deepEqual(await fallbackPromise, { observation: "poll_fallback" });
  await assert.rejects(
    waitForBoundedFileSignal(path.join(root, "missing.release"), { timeoutMs: 20 }),
    /file_signal_timeout/u,
  );
  await assert.rejects(
    waitForBoundedFileSignal("relative.release", { timeoutMs: 20 }),
    /file_signal_path_invalid/u,
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}

process.stdout.write(
  `${JSON.stringify({ test: "bounded-file-signal", status: "pass", assertions: 7 })}\n`,
);
