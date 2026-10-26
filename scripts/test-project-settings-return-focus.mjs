#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 2 && args[0] === "--source"), "usage: test-project-settings-return-focus.mjs [--source <absolute-owner-source-path>]");
const ownerPath = args.length ? args[1] : fileURLToPath(new URL("../components/blank-state/blank-state-client.tsx", import.meta.url));
assert.equal(path.isAbsolute(ownerPath), true, "owner_source_path_must_be_absolute");
const ownerStat = lstatSync(ownerPath);
assert.equal(ownerStat.isFile() && !ownerStat.isSymbolicLink(), true, "owner_source_must_be_regular_file");
const ownerSource = readFileSync(ownerPath, "utf8");
const linkSource = readFileSync(new URL("../components/project-settings-link.tsx", import.meta.url), "utf8");
export function runProjectSettingsReturnFocusControls({ ownerSource, linkSource }) {
  const parsed = ts.createSourceFile("blank-state-client.tsx", ownerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  // Extract and execute the real effect. The test does not implement its focus rule.
  const effects = [];
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useEffect") {
      const callback = node.arguments[0];
      const identifiers = new Set();
      const collect = (child) => {
        if (ts.isIdentifier(child)) identifiers.add(child.text);
        ts.forEachChild(child, collect);
      };
      if (callback) collect(callback);
      if (["projectSettingsRef", "projectIdentityRef", "PROJECT_SETTINGS_ACTIVATION_EVENT"].every(name => identifiers.has(name))) {
        effects.push(callback);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.equal(effects.length, 1, "exact_project_settings_effect_required");
  const compile = (source, fileName) => ts.transpileModule(source, {
    fileName,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const effectCode = compile(`module.exports = (${effects[0].getText(parsed)});`, "effect.ts");
  const linkCode = compile(linkSource, "project-settings-link.tsx");

  const ownedFixtures = [];
  function fixture({ hash = "", settingsPresent = true, identityPresent = true } = {}) {
    const listeners = new Map();
    const frames = [];
    const focused = [];
    const dispatched = [];
    let active = null;
    const target = (name) => ({ focus() { active = name; focused.push(name); } });
    const summary = target("summary");
    const input = target("identity-input");
    const identity = { ...target("identity"), querySelector(selector) {
      assert.equal(selector, 'input[name="current-project-display-name"]');
      return input;
    } };
    const settings = { open: false, querySelector(selector) {
      assert.equal(selector, ":scope > summary");
      return summary;
    } };
    const window = {
      location: { hash },
      requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener);
      },
      removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
      dispatchEvent(event) {
        dispatched.push(event.type);
        for (const listener of [...(listeners.get(event.type) ?? [])]) listener.call(window, event);
        return true;
      },
    };
    const linkExports = {};
    vm.runInNewContext(linkCode, { exports: linkExports, window, Event, require(name) {
      assert.equal(name, "react/jsx-runtime");
      return require(name);
    } }, { timeout: 1000 });
    const link = linkExports.ProjectSettingsLink({
      href: "/#project-settings", name: "Fixture project", label: "Current project", children: "Current project",
    });
    assert.equal(link.type, "a");
    assert.equal(link.props.href, "/#project-settings");
    const module = { exports: null };
    vm.runInNewContext(effectCode, { module, window,
      projectSettingsRef: { current: settingsPresent ? settings : null },
      projectIdentityRef: { current: identityPresent ? identity : null },
      PROJECT_SETTINGS_ACTIVATION_EVENT: linkExports.PROJECT_SETTINGS_ACTIVATION_EVENT,
    }, { timeout: 1000 });
    const instance = {
      window, settings, focused, dispatched, mount: module.exports,
      get active() { return active; },
      get pending() { return frames.length; },
      listenerCount(type) { return listeners.get(type)?.size ?? 0; },
      flush() {
        assert(frames.length <= 8, "unexpected_frame_growth");
        while (frames.length) frames.shift()(0);
      },
      activate(overrides = {}) {
        link.props.onClick({ defaultPrevented: false, button: 0, metaKey: false,
          ctrlKey: false, shiftKey: false, altKey: false, detail: 1, ...overrides });
      },
      hash(value) { window.location.hash = value; window.dispatchEvent(new Event("hashchange")); },
      activationEvent: linkExports.PROJECT_SETTINGS_ACTIVATION_EVENT,
      dispose() { listeners.clear(); frames.length = 0; },
    };
    ownedFixtures.push(instance);
    return instance;
  }

  // Each independent control settles its listeners even when an assertion fails.
  // A predecessor failure does not prevent reporting the other actual behaviors.
  const controls = [];
  function control(name, action) {
    try { action(); controls.push({ name, status: "pass" }); }
    catch (error) {
      controls.push({ name, status: "fail", code: error.code ?? error.name,
        message: error.message, actual: error.actual, expected: error.expected });
    } finally {
      // Dispose only this in-memory fixture after preserving its assertion result.
      for (const owned of ownedFixtures.splice(0)) owned.dispose();
    }
  }

  control("hash_mount_replay_summary", () => {
    const replay = fixture({ hash: "#project-settings" });
    replay.mount()();
    const cleanup = replay.mount();
    try {
      assert.equal(replay.settings.open, true);
      assert.equal(replay.pending, 2);
      assert.equal(replay.active, null);
      replay.flush();
      assert.deepEqual(replay.focused, ["summary", "summary"], "hash_mount_replay_must_not_advance_to_input");
      assert.equal(replay.listenerCount("hashchange"), 1);
      assert.equal(replay.listenerCount(replay.activationEvent), 1);
    } finally { cleanup(); }
  });

  control("listener_cleanup", () => {
    const f = fixture();
    f.mount()();
    const cleanup = f.mount();
    assert.equal(f.listenerCount("hashchange"), 1);
    assert.equal(f.listenerCount(f.activationEvent), 1);
    cleanup();
    assert.equal(f.listenerCount("hashchange"), 0);
    assert.equal(f.listenerCount(f.activationEvent), 0);
    f.activate();
    f.hash("#project-settings");
    assert.equal(f.pending, 0, "cleanup_must_remove_both_listeners");
  });

  control("closed_and_repeated_explicit_activation", () => {
    const f = fixture();
    const cleanup = f.mount();
    try {
      assert.equal(f.pending, 0);
      f.activate();
      f.flush();
      assert.equal(f.active, "summary", "closed_explicit_activation_focuses_summary");
      f.activate();
      f.flush();
      assert.equal(f.active, "identity-input", "open_explicit_activation_focuses_input");
    } finally { cleanup(); }
  });

  control("hash_navigation_summary", () => {
    const f = fixture();
    const cleanup = f.mount();
    try {
      f.activate();
      f.flush();
      f.activate();
      f.flush();
      assert.equal(f.active, "identity-input");
      f.hash("#elsewhere");
      assert.equal(f.pending, 0);
      f.hash("#project-settings");
      f.flush();
      assert.equal(f.active, "summary", "hash_navigation_preserves_entry_focus_even_when_open");
    } finally { cleanup(); }
  });

  control("keyboard_click_handler_and_excluded_clicks", () => {
    const f = fixture();
    const cleanup = f.mount();
    try {
      // The actual anchor handler receives the browser's keyboard-click shape.
      // Actual Enter dispatch/navigation requires separate Browser evidence.
      f.activate({ detail: 0 });
      f.flush();
      assert.equal(f.active, "summary");
      f.activate({ detail: 0 });
      f.flush();
      assert.equal(f.active, "identity-input");
      assert.deepEqual(f.dispatched, [f.activationEvent, f.activationEvent]);
      for (const excluded of [
        { defaultPrevented: true }, { button: 1 }, { metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true },
      ]) f.activate(excluded);
      assert.equal(f.pending, 0);
      assert.equal(f.dispatched.length, 2, "excluded_clicks_must_not_activate_owner");
    } finally { cleanup(); }
  });

  control("unrelated_hash_inert", () => {
    const f = fixture({ hash: "#elsewhere" });
    const cleanup = f.mount();
    try {
      f.hash("#another");
      assert.equal(f.settings.open, false);
      assert.equal(f.pending, 0);
    } finally { cleanup(); }
  });

  control("identity_only_fallback", () => {
    const f = fixture({ hash: "#project-settings", settingsPresent: false });
    const cleanup = f.mount();
    try {
      f.flush();
      assert.equal(f.active, "identity-input", "identity_only_presentation_keeps_existing_focus");
    } finally { cleanup(); }
  });

  control("absent_owner_inert", () => {
    const f = fixture({ hash: "#project-settings", settingsPresent: false, identityPresent: false });
    const cleanup = f.mount();
    try { assert.equal(f.pending, 0); } finally { cleanup(); }
  });

  const passed = controls.every(entry => entry.status === "pass");
  return { test: "project-settings-return-focus", status: passed ? "pass" : "fail",
    actual_effect_executed: true, actual_anchor_handler_executed: true, controls,
    actual_browser_keyboard: "separate Browser evidence required",
    source_sha256: {
      owner: createHash("sha256").update(ownerSource).digest("hex"),
      link: createHash("sha256").update(linkSource).digest("hex"),
    },
  };
}

function replaceExactly(source, from, to) {
  assert.equal(source.split(from).length - 1, 1, "exact_control_mutation_target_required");
  return source.replace(from, to);
}

function runDefectiveWiringControls() {
  const registration = `window.addEventListener(
      PROJECT_SETTINGS_ACTIVATION_EVENT,
      activateProjectSettings,
    );`;
  const cleanup = `window.removeEventListener(
        PROJECT_SETTINGS_ACTIVATION_EVENT,
        activateProjectSettings,
      );`;
  const adapter = "const activateProjectSettings = () => openAndFocusProjectSettings();";
  const cases = [
    ["missing_activation_registration", source => replaceExactly(source, registration, ""), "closed_and_repeated_explicit_activation"],
    ["wrong_activation_event", source => replaceExactly(source, registration, registration.replace("PROJECT_SETTINGS_ACTIVATION_EVENT", '"wrong-project-settings-event"')), "closed_and_repeated_explicit_activation"],
    ["no_op_activation_callback", source => replaceExactly(source, adapter, "const activateProjectSettings = () => {};"), "closed_and_repeated_explicit_activation"],
    ["event_forwarded_into_prefer_summary", source => replaceExactly(source, adapter, "const activateProjectSettings = (event) => openAndFocusProjectSettings(event);"), "closed_and_repeated_explicit_activation"],
    ["direct_helper_event_registration", source => replaceExactly(replaceExactly(source, registration, registration.replace("activateProjectSettings", "openAndFocusProjectSettings")), cleanup, cleanup.replace("activateProjectSettings", "openAndFocusProjectSettings")), "closed_and_repeated_explicit_activation"],
    ["mismatched_listener_cleanup", source => replaceExactly(source, cleanup, cleanup.replace("activateProjectSettings", "() => activateProjectSettings()")), "listener_cleanup"],
    ["lost_hash_entry_summary", source => replaceExactly(source, "openAndFocusProjectSettings(true);", "openAndFocusProjectSettings();"), "hash_mount_replay_summary"],
  ];
  return cases.map(([name, mutate, expectedFailedControl]) => {
    try {
      const result = runProjectSettingsReturnFocusControls({ ownerSource: mutate(ownerSource), linkSource });
      assert.equal(result.status, "fail", `${name}_must_be_rejected`);
      assert.equal(result.controls.find(entry => entry.name === expectedFailedControl)?.status, "fail", `${name}_must_fail_its_behavior_control`);
      return { name, status: "pass", rejected_by: result.controls.filter(entry => entry.status === "fail").map(entry => entry.name) };
    } catch (error) {
      return { name, status: "fail", code: error.code ?? error.name, message: error.message };
    }
  });
}

const actualResult = runProjectSettingsReturnFocusControls({ ownerSource, linkSource });
const defectiveWiringControls = runDefectiveWiringControls();
export const projectSettingsReturnFocusResult = {
  ...actualResult,
  status: actualResult.status === "pass" && defectiveWiringControls.every(entry => entry.status === "pass") ? "pass" : "fail",
  defective_wiring_controls: defectiveWiringControls,
};

export function assertProjectSettingsReturnFocus(result = projectSettingsReturnFocusResult) {
  assert.equal(result.status, "pass", "project_settings_return_focus_contract_failed");
}

process.stdout.write(`${JSON.stringify(projectSettingsReturnFocusResult)}\n`);
// Imported owners must assert the result before reporting their own success.
// Never clear a failure already recorded by another imported owner.
if (projectSettingsReturnFocusResult.status !== "pass") process.exitCode = 1;
