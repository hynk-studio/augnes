#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createOperatorProjectHomeReadinessObservationV1 } from "./operator-project-home-readiness-observation-v1.mjs";

const projectId = "disposable-project";
const selector = '[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]';
const expression = `document.querySelector('${selector}') !== null`;
const label = "hydrated expectation Project Home";
const lifecycleSource = readFileSync(new URL("./operator-execution-browser-lifecycle-v1.mjs", import.meta.url), "utf8");
const childSource = readFileSync(new URL("./browser-validate-operator-work-expectation-v1.mjs", import.meta.url), "utf8");
const resultSource = readFileSync(new URL("./operator-execution-browser-child-v1.mjs", import.meta.url), "utf8");
const evaluateSource = lifecycleSource.slice(lifecycleSource.indexOf("  const evaluate = async ("), lifecycleSource.indexOf("  const waitForCondition = async ("));
const waitSource = lifecycleSource.slice(lifecycleSource.indexOf("  const waitForCondition = async ("), lifecycleSource.indexOf("  const throwDocumentResponseMissing ="));
assert(evaluateSource.includes("observation.evaluate"));
assert(waitSource.includes("operator_condition_timeout:"));
assert(childSource.includes(`await lifecycle.waitForCondition(\`${expression}\`, "${label}", undefined, { observe_project_home_readiness: true });`));
assert.match(lifecycleSource, /const DEFAULT_TIMEOUT_MS = 45_000;/u);
assert.match(resultSource, /const ACCEPTANCE_BOUND_MS = 360_000;/u);
assert(resultSource.includes("result.project_home_readiness_observation = failureEvidence?.project_home_readiness_observation ?? null"));
assert(resultSource.includes("result.project_home_readiness_observation = evidence.project_home_readiness_observation"));

let checks = 0;
function observer() {
  const value = createOperatorProjectHomeReadinessObservationV1({ project_id: projectId });
  value.navigationStarted({ epoch: 3, url: `http://127.0.0.1/projects/${projectId}` });
  value.navigationExpected({ frameId: "private-frame", loaderId: "private-loader" });
  value.observe({ method: "Page.frameNavigated", params: { frame: { id: "private-frame", loaderId: "private-loader" } } });
  value.observe({ method: "Runtime.executionContextCreated", params: { context: { id: 4, auxData: { isDefault: true, frameId: "private-frame" } } } });
  value.documentResponse({ status: 200, frame_id: "private-frame", loader_id: "private-loader" });
  return value;
}

function browser({ ready = true, active = true, hydrated = true, root = true, observationError = false, predicateError = false, intended = true } = {}) {
  let predicateCalls = 0, calls = 0;
  const element = { getAttribute: name => name === "data-blank-state-active" ? String(active) : String(hydrated) };
  const document = {
    readyState: "complete",
    querySelector(query) {
      if (query === selector) {
        predicateCalls++;
        if (predicateError) throw new Error("private predicate details");
        return (typeof ready === "function" ? ready(predicateCalls) : ready) ? element : null;
      }
      return null;
    },
    querySelectorAll(query) {
      if (observationError) throw new Error("private observation details");
      if (query === '[data-blank-state="v0.1"]') return root ? [element] : [];
      if (query === "[data-project-bound-work-link]") return [{ href: `http://127.0.0.1/workbench/semantic-review?project_id=${projectId}` }];
      throw new Error("unexpected observational query");
    },
  };
  const send = async (method, params) => {
    calls++;
    assert.equal(method, "Runtime.evaluate");
    assert.equal(params.awaitPromise, true);
    assert.equal(params.returnByValue, true);
    try {
      const value = vm.runInNewContext(params.expression, { document, URL, location: { pathname: intended ? `/projects/${projectId}` : "/other", href: "http://127.0.0.1" } }, { timeout: 1000 });
      return { result: { type: typeof value, value } };
    } catch (error) { return { exceptionDetails: { exception: { description: error.message } } }; }
  };
  return { send, document, calls: () => calls, predicateCalls: () => predicateCalls };
}

// Exercise the actual lifecycle wait/evaluate bodies without starting a runtime,
// using a finite virtual clock. This seam does not add a production extension API.
function lifecycle(observation, send, observe = true) {
  let now = 0, delays = 0, completed = 0;
  const context = vm.createContext({
    cdp: { send }, projectHomeReadiness: observation,
    DEFAULT_TIMEOUT_MS: 45_000, Date: { now: () => now },
    delay: async amount => { assert.equal(amount, 100); now += amount; delays++; },
    recordWait: () => { completed++; },
    publicToken: text => text.toLowerCase().replace(/\s+/gu, "_"),
    lastNavigationDocument: null, setBrowserFailureDiagnostic: () => assert.fail("unrelated diagnostic changed"),
  });
  const wait = vm.runInContext(`${evaluateSource}\n${waitSource}\nwaitForCondition;`, context);
  return { wait: () => wait(expression, label, undefined, { observe_project_home_readiness: observe }), delays: () => delays, completed: () => completed };
}

// Other waits keep the original evaluator without creating an observation.
{
  const capture = observer(); const page = browser();
  await lifecycle(capture, page.send, false).wait();
  assert.equal(page.calls(), 1); assert.equal(page.predicateCalls(), 1);
  assert.equal(capture.snapshot(), null); checks++;
}

// The original Boolean is decisive even when a hypothetical second evaluation
// would differ. There is exactly one original-predicate call per CDP evaluation.
for (const initial of [true, false]) {
  const capture = observer(); capture.begin({ expression, timeout_ms: 45_000 });
  const page = browser({ ready: count => count === 1 ? initial : !initial });
  const result = await capture.evaluate(page.send, { expression, awaitPromise: true, returnByValue: true });
  assert.equal(result.result.value, initial);
  assert.equal(page.predicateCalls(), 1); assert.equal(page.calls(), 1);
  capture.finish(initial ? "passed" : "not_satisfied");
  assert.equal(capture.snapshot().status, "complete"); checks++;
}

for (const settings of [{ root: false }, { active: false }, { hydrated: false }, { intended: false }]) {
  const capture = observer(); capture.begin({ expression, timeout_ms: 45_000 });
  const page = browser({ ...settings, ready: false });
  await capture.evaluate(page.send, { expression, awaitPromise: true, returnByValue: true });
  const sample = capture.snapshot().last_sample;
  assert.equal(sample.evaluation, "false");
  if (settings.root === false) assert.equal(sample.document.root_count, 0);
  if (settings.active === false) assert.equal(sample.document.active_count, 0);
  if (settings.hydrated === false) assert.equal(sample.document.hydrated_count, 0);
  if (settings.intended === false) assert.equal(sample.document.intended_path_matches, false);
  checks++;
}

// Capture failures stay explicit and cannot reverse a successful condition.
for (const kind of ["browser_observation_error", "malformed_observation", "event_error"]) {
  const capture = observer();
  const page = browser({ observationError: kind === "browser_observation_error" });
  if (kind === "event_error") capture.observe(null);
  const send = async (...args) => {
    const result = await page.send(...args);
    if (kind === "malformed_observation") result.result.value.observation = { raw_private: "DO_NOT_RETAIN" };
    return result;
  };
  const wait = lifecycle(capture, send);
  await wait.wait();
  assert.equal(wait.completed(), 1); assert.equal(wait.delays(), 0);
  const snapshot = capture.snapshot();
  assert.equal(snapshot.condition_outcome, "passed"); assert.equal(snapshot.status, "incomplete");
  assert(snapshot.observation_error_count > 0);
  assert.doesNotMatch(JSON.stringify(snapshot), /private observation details|DO_NOT_RETAIN/u); checks++;
}

// A JS exception or CDP rejection is recorded without replacing its identity.
{
  const capture = observer(); capture.begin({ expression, timeout_ms: 45_000 });
  const exception = { exceptionDetails: { exception: { description: "DO_NOT_RETAIN" } } };
  assert.equal(await capture.evaluate(async () => exception, {}), exception);
  const rejection = new Error("DO_NOT_RETAIN");
  await assert.rejects(capture.evaluate(async () => { throw rejection; }, {}), error => error === rejection);
  assert.equal(capture.snapshot().javascript_exception_count, 1);
  assert.equal(capture.snapshot().cdp_rejection_count, 1);
  assert.doesNotMatch(JSON.stringify(capture.snapshot()), /DO_NOT_RETAIN/u); checks++;
}

// Original timeouts and the 45-second wait survive observation/predicate errors.
for (const settings of [{ ready: false, observationError: true }, { predicateError: true }]) {
  const capture = observer(); const page = browser(settings); const wait = lifecycle(capture, page.send);
  await assert.rejects(wait.wait(), /operator_condition_timeout:hydrated_expectation_project_home/u);
  assert.equal(wait.delays(), 450); assert.equal(wait.completed(), 0);
  assert.equal(page.predicateCalls(), 450);
  assert.equal(capture.snapshot().condition_outcome, "not_satisfied");
  assert.equal(capture.snapshot().status, "incomplete"); checks++;
}

// Bounded samples/contexts, private identity pseudonyms, fixed retained fields,
// context clearing, and a frozen observation after the target wait.
{
  const capture = observer(); capture.begin({ expression, timeout_ms: 45_000 });
  const page = browser({ ready: false });
  for (let index = 0; index < 70; index++) capture.observe({ method: "Runtime.executionContextCreated", params: { context: { id: 100 + index, auxData: { isDefault: true, frameId: "private-frame" } } } });
  for (let index = 0; index < 40; index++) {
    page.document.readyState = index % 2 ? "interactive" : "complete";
    await capture.evaluate(async (...args) => {
      const result = await page.send(...args);
      result.result.value.observation.raw_private = "DO_NOT_RETAIN";
      return result;
    }, { expression, awaitPromise: true, returnByValue: true });
  }
  const snapshot = capture.snapshot();
  assert.equal(snapshot.samples.length, 16); assert.equal(snapshot.omitted_sample_count, 24);
  assert.equal(snapshot.last_sample.navigation.default_contexts_for_frame.length, 64);
  assert.equal(snapshot.last_sample.navigation.frame_matches_expected, true);
  assert.equal(snapshot.last_sample.navigation.loader_matches_expected, true);
  assert.equal(snapshot.last_sample.navigation.document_response_matches_navigation, true);
  assert.equal(snapshot.last_sample.navigation.evaluation_context_binding, "implicit_default_context");
  assert.doesNotMatch(JSON.stringify(snapshot), /private-frame|private-loader|DO_NOT_RETAIN|disposable-project/u);
  capture.observe({ method: "Runtime.executionContextsCleared" });
  await capture.evaluate(page.send, { expression, awaitPromise: true, returnByValue: true });
  capture.finish("not_satisfied");
  assert.equal(capture.snapshot().context_overflow_count, 7);
  assert.equal(capture.snapshot().last_sample.navigation.default_contexts_for_frame.length, 0);
  const frozen = capture.snapshot();
  capture.navigationStarted({ epoch: 4, url: "http://127.0.0.1/other" });
  capture.observe(null); capture.finish("passed");
  assert.deepEqual(capture.snapshot(), frozen); checks++;
}

console.log(JSON.stringify({ ok: true, checks, scope: "same-evaluation readiness observation and actual bounded wait; no Browser execution" }));
