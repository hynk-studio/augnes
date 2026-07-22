import { existsSync, watch } from "node:fs";
import path from "node:path";

export function waitForBoundedFileSignal(
  file,
  {
    timeoutMs,
    exists = existsSync,
    watchDirectory = watch,
    fallbackPollMs = 100,
  } = {},
) {
  if (!path.isAbsolute(file)) return Promise.reject(new Error("file_signal_path_invalid"));
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    return Promise.reject(new Error("file_signal_timeout_invalid"));
  }
  if (exists(file)) return Promise.resolve({ observation: "preexisting" });

  return new Promise((resolve, reject) => {
    let settled = false;
    let watcher = null;
    let poll = null;
    const timeout = setTimeout(
      () => finish(new Error("file_signal_timeout")),
      timeoutMs,
    );
    const finish = (error = null, observation = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (poll !== null) clearInterval(poll);
      watcher?.close();
      if (error) reject(error);
      else resolve({ observation });
    };
    const observe = (observation) => {
      if (exists(file)) finish(null, observation);
    };

    try {
      watcher = watchDirectory(path.dirname(file), () => observe("watcher"));
      // Recheck after registration to close the existence-check/watch race.
      observe("post_registration");
    } catch {
      poll = setInterval(() => observe("poll_fallback"), fallbackPollMs);
      observe("poll_fallback");
    }
  });
}
