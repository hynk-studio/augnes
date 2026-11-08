import { constants, closeSync, fstatSync, openSync, readSync, existsSync, lstatSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { digest } from "./local-canonical-inputs.mjs";
import { createBrowserBundleObserver, compareBrowserBundle, validBrowserBundle } from "./local-canonical-browser-bundle.mjs";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";

export const BROWSER_INPUT_CONTRACT = "augnes.local-canonical-browser-input.v1";
export const BROWSER_INPUT_ENV_KEYS = Object.freeze(["AUGNES_BROWSER_INPUT_CONTRACT", "AUGNES_BROWSER_INPUT_BINDING", "AUGNES_BROWSER_INPUT_FINGERPRINT"]);
const moduleRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fail = code => Object.assign(new Error(code), { code });
const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
const guardName = ".augnes-local-verification/browser-input-active.json";
const guards = new WeakMap();

export function readBrowserInputJson(file, maximum = 1024 * 1024) {
  const s = lstatSync(file);
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > maximum || (s.mode & 0o022) || realpathSync(file) !== file) throw fail("browser_input_record_unsafe");
  // A second named observation detects a replacement during this bounded read.
  const descriptor = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fstatSync(descriptor);
    if (s.dev !== opened.dev || s.ino !== opened.ino || !opened.isFile() || opened.nlink !== 1 || opened.size > maximum) throw fail("browser_input_record_race");
    const buffer = Buffer.alloc(maximum + 1); let length = 0, count;
    while (length <= maximum && (count = readSync(descriptor, buffer, length, buffer.length - length, null)) > 0) length += count;
    if (length > maximum) throw fail("browser_input_record_unsafe");
    const bytes = buffer.subarray(0, length), after = lstatSync(file), closed = fstatSync(descriptor);
    if (s.dev !== after.dev || s.ino !== after.ino || s.size !== bytes.length || s.mtimeMs !== after.mtimeMs || s.ctimeMs !== after.ctimeMs || s.mtimeMs !== closed.mtimeMs || s.ctimeMs !== closed.ctimeMs) throw fail("browser_input_record_race");
    return { value: JSON.parse(bytes.toString("utf8")), sha256: digest(bytes) };
  } finally { closeSync(descriptor); }
}

export function browserInputLocalPath(repositoryRoot, relative) {
  if (typeof relative !== "string" || !/^\.augnes-local-verification\/[A-Za-z0-9_./ -]+$/u.test(relative) || relative.split("/").some(p => p === ".." || p === "")) throw fail("browser_input_path_unsafe");
  const file = path.join(repositoryRoot, relative);
  if (realpathSync(file) !== file) throw fail("browser_input_path_unsafe");
  return file;
}

export function readBrowserInputBinding(relative, repositoryRoot = moduleRoot) {
  const file = browserInputLocalPath(repositoryRoot, relative), { value, sha256 } = readBrowserInputJson(file);
  if (value.contract !== BROWSER_INPUT_CONTRACT || value.platform !== "mac-arm64" || !/^\d+\.\d+\.\d+\.\d+$/u.test(value.version ?? "") ||
      !sha(value.artifact?.zip_sha256) || !sha(value.artifact?.metadata_sha256) ||
      value.artifact?.origin !== `https://storage.googleapis.com/chrome-for-testing-public/${value.version}/mac-arm64/chrome-mac-arm64.zip` ||
      !Number.isInteger(value.artifact?.codesign_exit) || !Number.isInteger(value.artifact?.spctl_exit) ||
      value.executable !== "Contents/MacOS/Google Chrome for Testing" || !sha(value.reference?.sha256)) throw fail("browser_input_binding_invalid");
  const root = browserInputLocalPath(repositoryRoot, value.bundle_relative_path);
  if (!root.endsWith("/Google Chrome for Testing.app") || !lstatSync(root).isDirectory()) throw fail("browser_input_bundle_invalid");
  const executable = path.join(root, value.executable);
  if (realpathSync(executable) !== executable || !lstatSync(executable).isFile() || !(lstatSync(executable).mode & 0o111)) throw fail("browser_input_executable_invalid");
  const referenceFile = browserInputLocalPath(repositoryRoot, value.reference.relative_path), reference = readBrowserInputJson(referenceFile);
  if (reference.sha256 !== value.reference.sha256 || !validBrowserBundle(reference.value.observation) || reference.value.observation.location_fingerprint !== digest(root) ||
      !Array.isArray(reference.value.inventory) || !Array.isArray(reference.value.files) ||
      reference.value.inventory.length !== reference.value.observation.entries || digest(reference.value.inventory) !== reference.value.observation.inventory_sha256 ||
      digest(reference.value.files) !== reference.value.observation.content_sha256) throw fail("browser_input_reference_invalid");
  const publicBinding = { contract: BROWSER_INPUT_CONTRACT, local_relative_path: relative, fingerprint: sha256,
    reference_sha256: reference.sha256, bundle: reference.value.observation, executable_fingerprint: digest(executable),
    version: value.version, platform: value.platform, artifact: value.artifact };
  return { file, root, executable, referenceFile, publicBinding, observe: createBrowserBundleObserver(root) };
}

export function browserInputEnvironment(binding) {
  return { AUGNES_BROWSER_INPUT_CONTRACT: BROWSER_INPUT_CONTRACT, AUGNES_BROWSER_INPUT_BINDING: binding.publicBinding.local_relative_path,
    AUGNES_BROWSER_INPUT_FINGERPRINT: binding.publicBinding.fingerprint, AUGNES_BROWSER_EXECUTABLE_PATH: binding.executable };
}

// The controller's checkout-owned sentinel is independent of inherited env.
// A child which strips every strict env key still observes the active lane and
// refuses. The sentinel itself is a monitored safety input until settlement.
export function selectedBrowserInput({ repositoryRoot = moduleRoot, env = process.env } = {}) {
  const guardFile = path.join(repositoryRoot, guardName);
  const guard = existsSync(guardFile) ? readBrowserInputJson(guardFile).value : null;
  const strict = guard !== null || BROWSER_INPUT_ENV_KEYS.some(key => env[key] !== undefined);
  if (!strict) return null;
  if (env.AUGNES_BROWSER_INPUT_CONTRACT !== BROWSER_INPUT_CONTRACT || !sha(env.AUGNES_BROWSER_INPUT_FINGERPRINT)) throw fail("browser_input_binding_missing");
  const binding = readBrowserInputBinding(env.AUGNES_BROWSER_INPUT_BINDING, repositoryRoot);
  if (binding.publicBinding.fingerprint !== env.AUGNES_BROWSER_INPUT_FINGERPRINT || env.AUGNES_BROWSER_EXECUTABLE_PATH !== binding.executable ||
      (guard && (guard.contract !== BROWSER_INPUT_CONTRACT || guard.binding_fingerprint !== binding.publicBinding.fingerprint || guard.binding_path !== binding.publicBinding.local_relative_path))) throw fail("browser_input_selection_mismatch");
  return binding;
}

export function assertSelectedBrowser(executable, options) {
  const binding = selectedBrowserInput(options);
  if (binding && executable !== binding.executable) throw fail("browser_input_alternate_refused");
  return binding;
}

export function selectBrowserPath(candidates, options = {}) {
  const binding = selectedBrowserInput(options);
  if (binding) return binding.executable;
  // Historical consumers keep their existing candidate order outside this
  // explicitly versioned lane. An active lane never reaches this fallback.
  return candidates.find(candidate => candidate && existsSync(candidate)) ?? null;
}

export function strictBrowserArguments(args, options) {
  return selectedBrowserInput(options) ? args.filter(arg => arg !== "--no-sandbox") : args;
}

// Only the two existing trusted-local fixture owners retain the accepted-base
// Darwin outer network sandbox + --no-sandbox combination. Validate the actual
// spawn tuple, not a caller Boolean; a missing/altered wrapper must refuse.
// This network policy does not replace Chromium filesystem/IPC isolation.
/** @returns {[string, string[]]} */
export function strictNetworkSandboxLaunch(command, args, consumer, options) {
  const binding = selectedBrowserInput(options);
  if (binding && (process.platform !== "darwin"
      || !["durable-work-surface", "cumulative-work-surface", "project-client"].includes(consumer)
      || command !== "/usr/bin/sandbox-exec" || args[0] !== "-p"
      || args[1] !== '(version 1) (allow default) (deny network*) (allow network-inbound (local ip "localhost:*")) (allow network-outbound (remote ip "localhost:*")) (allow network-bind (local ip "localhost:*")) (allow network* (local unix-socket))'
      || args[2] !== binding.executable
      || args.slice(3).filter(arg => arg === "--no-sandbox").length !== 1)) {
    throw fail("browser_input_wrapped_launch_refused");
  }
  return [command, args];
}

export function assertBrowserBundle(binding, { force = true } = {}) {
  const result = binding.observe({ force });
  if (compareBrowserBundle(binding.publicBinding.bundle, result.observation) !== "unchanged") throw fail("browser_input_bundle_changed");
  return result;
}

export function acquireBrowserInputGuard({ repositoryRoot, checkoutOwner, binding, runId }) {
  assertCheckoutVerificationOwnership(checkoutOwner, repositoryRoot);
  const file = path.join(repositoryRoot, guardName);
  const record = { contract: BROWSER_INPUT_CONTRACT, binding_fingerprint: binding.publicBinding.fingerprint, binding_path: binding.publicBinding.local_relative_path, run_id: runId };
  writeFileSync(file, `${JSON.stringify(record)}\n`, { flag: "wx", mode: 0o600 });
  const capability = Object.freeze({ file });
  guards.set(capability, { record, repositoryRoot, checkoutOwner });
  return capability;
}

export function releaseBrowserInputGuard(capability, { settled }) {
  const state = guards.get(capability);
  if (!state || settled !== true) throw fail("browser_input_guard_unsettled");
  assertCheckoutVerificationOwnership(state.checkoutOwner, state.repositoryRoot);
  if (digest(readBrowserInputJson(capability.file).value) !== digest(state.record)) throw fail("browser_input_guard_changed");
  unlinkSync(capability.file);
  guards.delete(capability);
}

export function assertBrowserInputGuard(capability) {
  const state = guards.get(capability);
  if (!state || digest(readBrowserInputJson(capability.file).value) !== digest(state.record)) throw fail("browser_input_guard_changed");
}
