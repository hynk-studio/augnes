import assert from "node:assert/strict";

function assertScriptedSuccessLifecycle(events, route) {
  const startup = ["invocation_created", "spawned", "initialized", "account_available", "thread_started"];
  // This fixture sends the turn/start response before turn/completed. The
  // start observer awaits the lifecycle sink. The terminal observer can run
  // while that write is pending. Each must fire once, before cleanup.
  const turn = events?.[startup.length] === "terminal_observed"
    ? ["terminal_observed", "turn_started"]
    : ["turn_started", "terminal_observed"];
  assert.deepEqual(events, [...startup, ...turn, "server_request_state_cleared", "settled"],
    `${route} must observe the complete scripted success lifecycle`);
}

export function assertScriptedCodexParity(defaultBehavior, injectedBehavior) {
  const { lifecycle: defaultLifecycle, ...defaultFields } = defaultBehavior;
  const { lifecycle: injectedLifecycle, ...injectedFields } = injectedBehavior;
  assertScriptedSuccessLifecycle(defaultLifecycle, "default_codex");
  assertScriptedSuccessLifecycle(injectedLifecycle, "injected_codex");
  assert.deepEqual(defaultFields, injectedFields,
    "default composition must preserve the explicitly supplied scripted adapter's behavior");
}
