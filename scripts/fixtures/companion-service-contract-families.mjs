import { setImmediate as yieldToEventLoop } from "node:timers/promises";

// Only the service-contract fixture's two families share this coordinator.
// Each family still owns and awaits its existing cleanup. A family must call
// fail before awaiting cleanup so its peer can stop at the next safe boundary.
export function createServiceContractFamilies({ observe = () => {} } = {}) {
  if (typeof observe !== "function") throw new TypeError("family observer must be a function");
  const controller = new AbortController();
  const stopped = new Error("service-contract peer stopped");
  const failures = [];
  const captured = new Set();
  let used = false;

  function notify(details) {
    try {
      observe(details);
    } catch (error) {
      // A synchronous diagnostic failure is real, but must not recurse through
      // the same observer while reporting itself.
      capture(error, false);
    }
  }

  function capture(error, report, ancestors = new Set()) {
    if (error === stopped) return;
    if (error instanceof AggregateError && Array.isArray(error.errors) &&
        error.errors.length > 0 && !ancestors.has(error)) {
      ancestors.add(error);
      for (const nested of error.errors) capture(nested, report, ancestors);
      ancestors.delete(error);
      return;
    }
    // Empty or cyclic aggregates remain real failures rather than disappearing.
    if (captured.has(error)) return;
    captured.add(error);
    failures.push(error);
    if (!controller.signal.aborted) controller.abort(stopped);
    if (report) notify({ event: "failure", failure_count: failures.length });
  }

  function fail(error) {
    capture(error, true);
  }

  function throwIfStopped() {
    if (controller.signal.aborted) throw stopped;
  }

  async function checkpoint(label) {
    await yieldToEventLoop();
    notify({
      event: "checkpoint",
      label: typeof label === "string" && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,95}$/u.test(label)
        ? label : "unclassified",
      stopped: controller.signal.aborted,
    });
    throwIfStopped();
  }

  function start(family, action) {
    let pending;
    let entered = false;
    try {
      throwIfStopped();
      entered = true;
      notify({ event: "family_start", family });
      throwIfStopped();
      pending = Promise.resolve(action());
    } catch (error) {
      fail(error);
      pending = Promise.reject(error);
    }
    // Attach both handlers before starting the other family. These promises
    // always settle as values, so neither early nor late rejection is unhandled.
    return pending.then(
      value => {
        notify({ event: "family_settled", family, status: "fulfilled", started: entered });
        return { status: "fulfilled", value };
      },
      error => {
        fail(error);
        notify({ event: "family_settled", family,
          status: error === stopped ? "stopped" : "failed", started: entered });
        return { status: "rejected" };
      },
    );
  }

  async function run({ output, lifecycle }) {
    if (used) throw new Error("service-contract families already started");
    if (typeof output !== "function" || typeof lifecycle !== "function") {
      throw new TypeError("both service-contract families are required");
    }
    used = true;
    const outputTask = start("output", output);
    const lifecycleTask = start("lifecycle", lifecycle);
    const results = await Promise.all([outputTask, lifecycleTask]);
    if (failures.length > 0) {
      throw new AggregateError([...failures], "service-contract family or cleanup failed");
    }
    if (results.some(result => result.status !== "fulfilled")) {
      throw new Error("service-contract family settlement incomplete");
    }
    return results[1].value;
  }

  return Object.freeze({ signal: controller.signal, fail, throwIfStopped, checkpoint, run });
}
