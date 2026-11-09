import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { canonicalChildAcceptanceFailure, runCanonicalChild } from "./canonical-child-runner.mjs";

const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const hash = value => createHash("sha256").update(JSON.stringify(value) ?? "undefined").digest("hex");
const failure = code => Object.assign(new Error(code), { code });
const common = ["database", "migrations", "filesystem", "process-owning", "listener-port-owning", "browser-profile-owning", "cdp-session-owning"];

// Commands, order, requirements and individual limits have one owner. There is
// no environment/CLI budget override. The phase inventory binds this contract.
export const PROJECT_EXPERIENCE_SERIAL = freeze({
  contract: "augnes.project-experience-serial-envelope.v1",
  children: [
    { id: "project-experience", group: "project-experience",
      requirements: ["database", "migrations", "filesystem", "project-root", "process-owning", "listener-port-owning", "browser-profile-owning", "cdp-session-owning", "immutable-fixture-input"],
      label: "independent project experience Browser owner",
      args: ["--import", "tsx", "scripts/browser-validate-project-experience-v1.mjs"], timeoutMs: 360000, requireNaturalExit: true },
    { id: "project-client-browser", group: "project-experience", requirements: [...common],
      label: "same-profile project clients, held saves and recoverable drafts in Browser",
      args: ["--import", "tsx", "scripts/test-project-client-browser.ts"], timeoutMs: 60000, requireNaturalExit: true },
    { id: "web-planning-browser", group: "project-experience", requirements: [...common],
      label: "durable web planning real D1 Browser producer and consumer",
      args: ["--import", "tsx", "scripts/browser-validate-web-planning.mjs"], timeoutMs: 180000, requireNaturalExit: true },
  ],
  naturalSettlementPerChildMs: 10000,
  coordinatorMs: 30000,
  maintenance: "no-lease-or-ancestor-joined",
});
export const PROJECT_EXPERIENCE_EXECUTION_MS = PROJECT_EXPERIENCE_SERIAL.children.reduce((n, c) => n + c.timeoutMs, 0);
export const PROJECT_EXPERIENCE_ENVELOPE_MS = PROJECT_EXPERIENCE_EXECUTION_MS +
  PROJECT_EXPERIENCE_SERIAL.children.length * PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs + PROJECT_EXPERIENCE_SERIAL.coordinatorMs;
export const PROJECT_EXPERIENCE_COMMITMENT = hash(PROJECT_EXPERIENCE_SERIAL);
export const projectExperienceElapsed = value => value.execution_ms.reduce((a,b)=>a+b,0) +
  value.natural_settlement_ms.reduce((a,b)=>a+b,0) + value.coordinator_ms;
export const projectExperienceSteps = (root, node = process.execPath) => PROJECT_EXPERIENCE_SERIAL.children.map(c => ({ ...structuredClone(c), command: node, cwd: root }));

export function assertProjectExperienceInventory(steps, root, node = process.execPath) {
  if (!Array.isArray(steps) || steps.length !== PROJECT_EXPERIENCE_SERIAL.children.length || steps.some((step, i) =>
    step.command !== node || step.cwd !== root || Object.entries(PROJECT_EXPERIENCE_SERIAL.children[i]).some(([key, value]) => hash(step[key]) !== hash(value))))
    throw failure("serial_inventory_disagreement");
}

// The parent starts this clock before spawning Node. A standalone suite starts
// at Node's time origin, so imports/startup also spend coordinator time. Every
// interval has exactly one owner. Parent post-exit settlement is outside it.
export function createProjectExperienceBudget({ now = () => performance.now(), startedAt = now(), onFailure = () => {}, timers = globalThis } = {}) {
  let last = startedAt, state = "coordinator", index = 0, ready = false, complete = false, stopped = false, error = null, timer;
  const execution = [0, 0, 0], settlement = [0, 0, 0]; let coordinator = 0;
  const elapsed = () => { const at = now(), delta = at - last; if (!Number.isFinite(delta) || delta < 0) throw failure("serial_clock_invalid");
    if (state === "execution") execution[index] += delta; else if (state === "settlement") settlement[index] += delta; else coordinator += delta;
    last = at;
  };
  const fault = code => { if (!error) { error = failure(code); onFailure(error); } return error; };
  const remaining = () => state === "execution" ? PROJECT_EXPERIENCE_SERIAL.children[index].timeoutMs - execution[index] :
    state === "settlement" ? PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs - settlement[index] : PROJECT_EXPERIENCE_SERIAL.coordinatorMs - coordinator;
  const check = () => {
    if (error) return error;
    if (coordinator > PROJECT_EXPERIENCE_SERIAL.coordinatorMs) return fault("serial_coordinator_budget_exceeded");
    if (execution.some((n, i) => n > PROJECT_EXPERIENCE_SERIAL.children[i].timeoutMs)) return fault("serial_child_execution_budget_exceeded");
    if (settlement.some(n => n > PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs)) return fault("serial_child_settlement_budget_exceeded");
    return null;
  };
  const schedule = () => {
    timers.clearTimeout(timer);
    if (stopped || error) return;
    timer = timers.setTimeout(() => { elapsed(); check(); schedule(); }, Math.max(1, Math.ceil(remaining()) + 1));
    timer?.unref?.();
  };
  const event = message => {
    if (stopped) return fault("serial_event_after_exit");
    elapsed(); check();
    if (message?.contract !== PROJECT_EXPERIENCE_SERIAL.contract || message.commitment !== PROJECT_EXPERIENCE_COMMITMENT ||
      Object.keys(message).sort().join(",") !== "commitment,contract,index,state") return fault("serial_inventory_disagreement");
    if (message.state === "ready" && message.index === 0 && !ready && index === 0 && state === "coordinator") ready = true;
    else if (message.index !== index || !ready || complete) return fault("serial_transition_invalid");
    else if (message.state === "execution" && state === "coordinator" && index < 3) state = "execution";
    else if (message.state === "settlement" && state === "execution") state = "settlement";
    else if (message.state === "coordinator" && state === "settlement") { state = "coordinator"; index++; }
    else if (message.state === "complete" && state === "coordinator" && index === 3) complete = true;
    else return fault("serial_transition_invalid");
    schedule(); return error;
  };
  schedule();
  return { event, get error() { return error; },
    stop({ requireComplete = true } = {}) { if (!stopped) { elapsed(); check(); stopped = true; timers.clearTimeout(timer); }
      if (requireComplete && !complete) fault("serial_execution_incomplete");
      return { contract: PROJECT_EXPERIENCE_SERIAL.contract, commitment: PROJECT_EXPERIENCE_COMMITMENT,
        execution_ms: execution, natural_settlement_ms: settlement, coordinator_ms: coordinator,
        envelope_elapsed_ms: projectExperienceElapsed({execution_ms:execution,natural_settlement_ms:settlement,coordinator_ms:coordinator}),
        completed_children: index, complete, failure_code: error?.code ?? null };
    },
  };
}

export const projectExperienceBudgetEvent = (state, index) => ({ contract: PROJECT_EXPERIENCE_SERIAL.contract, commitment: PROJECT_EXPERIENCE_COMMITMENT, state, index });

export function validProjectExperienceAccounting(value) {
  const finite = n => Number.isFinite(n) && n >= 0;
  return value?.contract === PROJECT_EXPERIENCE_SERIAL.contract && value.commitment === PROJECT_EXPERIENCE_COMMITMENT &&
    value.complete === true && value.completed_children === 3 && value.failure_code === null &&
    Array.isArray(value.execution_ms) && value.execution_ms.length === 3 &&
    value.execution_ms.every((n,i) => finite(n) && n <= PROJECT_EXPERIENCE_SERIAL.children[i].timeoutMs) &&
    Array.isArray(value.natural_settlement_ms) && value.natural_settlement_ms.length === 3 &&
    value.natural_settlement_ms.every(n => finite(n) && n <= PROJECT_EXPERIENCE_SERIAL.naturalSettlementPerChildMs) &&
    finite(value.coordinator_ms) && value.coordinator_ms <= PROJECT_EXPERIENCE_SERIAL.coordinatorMs &&
    finite(value.parent_post_exit_settlement_ms) &&
    value.envelope_elapsed_ms === projectExperienceElapsed(value);
}

// This is also the Full Browser parent owner. Its child runs plain Node; the
// suite's IPC boundaries account for imports, preparation and final drain.
// Stopping at the parent's process exit keeps post-exit settlement separate.
export async function runProjectExperienceParent(options, { runChild = runCanonicalChild, clock = {} } = {}) {
  if (options.timeoutMs !== PROJECT_EXPERIENCE_ENVELOPE_MS)
    throw failure("serial_inventory_disagreement");
  const controller = new AbortController();
  const budget = createProjectExperienceBudget({ ...clock, onFailure: () => controller.abort() });
  let accounting, terminalAt, naturalExit;
  try {
    const result = await runChild({ ...options,
      signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal,
      onMessage: budget.event,
      onBoundary: (state, terminal) => {
        if (state === "settlement") {
          terminalAt = performance.now(); naturalExit = terminal?.exited === true;
          accounting = budget.stop();
        }
      },
    });
    accounting ??= budget.stop();
    return { ...result, serial_budget: { ...accounting,
      parent_post_exit_settlement_ms: naturalExit ? performance.now() - terminalAt : null,
      parent_forced_terminal_cleanup_ms: !naturalExit && terminalAt !== undefined ? performance.now() - terminalAt : null } };
  } finally { budget.stop({ requireComplete: false }); }
}

// The real suite and the controlled regression both use this serial owner.
// Injecting the process function in a test does not create a runtime override.
export async function runProjectExperienceChildren({ steps, root, signal, emit, runChild = runCanonicalChild }) {
  assertProjectExperienceInventory(steps, root);
  const results = [];
  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    const result = await runChild({ ...step, signal, onBoundary: state => emit(projectExperienceBudgetEvent(state, index)) });
    results.push(result);
    const error = canonicalChildAcceptanceFailure(result, { suite: "e2e-project-experience", timeoutMs: step.timeoutMs, requireNaturalExit: true });
    if (error) throw error;
  }
  return results;
}
