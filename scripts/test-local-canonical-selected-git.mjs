import assert from "node:assert/strict";
import { runOwnedSyncChild } from "./test-harness-process-lifecycle.mjs";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as selectedGitModule from "./local-canonical-selected-git.mjs";
import * as lifecycleModule from "./test-harness-process-lifecycle.mjs";
import { selectedGitFileOperandControl } from "./fixtures/local-canonical-selected-git-file-operands.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { initializeSelectedGit, withSelectedGit, selectedGitResult, selectedGitOutput, selectedGitEnvironment,
  selectedGitResources, selectedGitRetainedInputs, selectedGitEvidence, assertSelectedGit,
  selectedGitExecutable, selectedGitExecFile, loadSelectedGit, SELECTED_GIT_MANIFEST_ENV, SELECTED_GIT_MANIFEST_HASH_ENV } from "./local-canonical-selected-git.mjs";

const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const temporary = owner.root;
const git = process.env[SELECTED_GIT_MANIFEST_ENV]
  ? selectedGitExecutable(loadSelectedGit(process.env[SELECTED_GIT_MANIFEST_ENV], process.env[SELECTED_GIT_MANIFEST_HASH_ENV]))
  : runOwnedSyncChild("/usr/bin/which", ["git"], { encoding: "utf8", timeout: 5000 }).stdout.trim();
const root = path.join(temporary, "source"), privateRoot = path.join(temporary, "private");
const home = path.join(temporary, "outside-home");
const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: home, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(home, ".gitconfig"), GIT_TERMINAL_PROMPT: "0" };
const run = (args, cwd = root, extra = {}) => {
  const result = runOwnedSyncChild(git, args, { cwd, env, encoding: "utf8", timeout: 5000, ...extra });
  assert.equal(result.status, 0, result.stderr); return result.stdout;
};
try {
  for (const directory of [root, privateRoot, home]) mkdirSync(directory);
  writeFileSync(path.join(home, ".gitconfig"), "[core]\n\tquotePath = false\n");
  run(["init", "--quiet"]);
  run(["remote", "add", "origin", "https://github.com/fixture/selected.git"]);
  writeFileSync(path.join(root, "source.txt"), "fixture source\n");
  run(["add", "source.txt"]);
  run(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "source"]);
  const head = run(["rev-parse", "HEAD"]).trim();
  const selected = initializeSelectedGit({ repositoryRoot: root, temporaryRoot: privateRoot, gitExecutable: git });
  const output = args => withSelectedGit(selected, () => selectedGitOutput(root, args, { encoding: "utf8", timeout: 5000 }));
  assert.equal(output(["rev-parse", "HEAD"]).trim(), head);
  assert.equal(output(["--no-optional-locks", "-C", root, "rev-parse", "--git-dir"]).trim(), path.join(root, ".git"));
  assert.equal(output(["--literal-pathspecs", "ls-files", "--", "source.txt"]).trim(), "source.txt");
  assert.equal(output(["--literal-pathspecs", "ls-files", "--", "*.txt"]).trim(), "");
  const subdirectory = path.join(root, "nested"); mkdirSync(subdirectory);
  assert.equal(withSelectedGit(selected, () => selectedGitOutput(subdirectory, ["rev-parse", "--show-toplevel"], { encoding: "utf8" })).trim(), root);
  assert.equal(output(["status", "--porcelain"]), "");
  assert.equal(output(["remote", "get-url", "origin"]).trim(), "https://github.com/fixture/selected.git");
  const archive = path.join(privateRoot,"selected-source.tar");
  assert.equal(output(["archive", "--format=tar", `--output=${archive}`, head]), "");
  assert(readFileSync(archive).length >= 512);
  assert(output(["archive", "--format=tar", head, "source.txt"]).includes("fixture source"));
  assert.throws(() => output(["archive", "--format=tar", "--output=/unowned-selected-archive.tar", head]), /selected_git_fixture_escape_refused/u);
  for (const args of [["--format=zip",head], ["--format=tar","HEAD"], ["--format=tar",head,"../outside"], ["--format=tar","--worktree-attributes",head]])
    assert.throws(() => output(["archive",...args]), /selected_git_archive_unclassified/u);
  assert.equal(selectedGitEvidence(selected).source_head, head);
  assert(selectedGitRetainedInputs(selected).every(input => input.expected_sha256.length === 64));

  // Both real external locations change, but selected Git uses its own config.
  writeFileSync(path.join(home, ".gitconfig"), "[include]\n\tpath = /not-present-canonical-control\n[core]\n\tquotePath = true\n");
  run(["config", "core.quotePath", "false"]);
  assert.equal(output(["status", "--porcelain"]), "");
  assert.equal(output(["rev-parse", "HEAD"]).trim(), head);
  assert.throws(() => withSelectedGit(selected, () => selectedGitResult(root, ["-c", "user.name=Escape", "status"])), /selected_git_escape_refused/u);
  assert.throws(() => output(["diff", "--no-index", "/etc/hosts", "source.txt"]), /selected_git_escape_refused/u);

  // A separate process selects the private view; explicit environment escape
  // attempts refuse instead of receiving the ambient-file exemption.
  const script = fileURLToPath(new URL("./local-canonical-selected-git.mjs", import.meta.url));
  const childEnvironment = { ...env, ...selectedGitEnvironment(selected) };
  const cold = runOwnedSyncChild(process.execPath, [script, "rev-parse", "HEAD"], {
    cwd: root, env: childEnvironment, encoding: "utf8", timeout: 10_000,
  });
  assert.equal(cold.status, 0, cold.stderr); assert.equal(cold.stdout.trim(), head);
  assert.equal((await selectedGitExecFile(root, ["rev-parse", "HEAD"], { env: childEnvironment, timeout: 5000 })).stdout.trim(), head);
  await assert.rejects(selectedGitExecFile(root, ["rev-parse", "HEAD"], { env: childEnvironment, timeout: 5000, maxBuffer: 8 }),
    error => error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" && /stdout maxBuffer/u.test(error.message));
  const escaped = runOwnedSyncChild(process.execPath, [script, "rev-parse", "HEAD"], {
    cwd: root, env: { ...childEnvironment, GIT_DIR: "/missing/foreign-git" }, encoding: "utf8", timeout: 10_000,
  });
  assert.notEqual(escaped.status, 0); assert.match(escaped.stderr, /selected_git_environment_escape_refused/u);
  const rebound = runOwnedSyncChild(process.execPath, [script, "--manifest", childEnvironment[SELECTED_GIT_MANIFEST_ENV], "--", "rev-parse", "HEAD"], {
    cwd: root, env: childEnvironment, encoding: "utf8", timeout: 10_000,
  });
  assert.notEqual(rebound.status, 0); assert.match(rebound.stderr, /selected_git_escape_refused/u);
  assert.throws(() => loadSelectedGit(childEnvironment[SELECTED_GIT_MANIFEST_ENV]), /selected_git_manifest_unbound/u);

  const fixture = path.join(privateRoot, "fixture");
  withSelectedGit(selected, () => {
    assert.equal(selectedGitResult(root, ["init", "--quiet", fixture], { encoding: "utf8", timeout: 5000 }).status, 0);
    assert.equal(selectedGitResult(fixture, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "--quiet", "-m", "fixture"], { encoding: "utf8", timeout: 5000 }).status, 0);
    assert.equal(selectedGitResult(fixture,["remote","add","origin","https://github.com/fixture/selected.git"]).status,0);
    assert.equal(selectedGitResult(fixture,["remote","remove","origin"]).status,0);
    // Native config stops option parsing at its key. A post-key -f/--fil token
    // is a literal value; before the key it would select an external file.
    const externalConfig = path.join(home, "explicit-config"), externalBytes = "[user]\nemail=external@example.invalid\n";
    writeFileSync(externalConfig, externalBytes);
    for (const value of [`-f${externalConfig}`, `--fil=${externalConfig}`]) {
      assert.equal(selectedGitResult(fixture, ["config", "user.email", value]).status, 0);
      assert.equal(selectedGitResult(fixture, ["config", "--get", "user.email"], { encoding: "utf8" }).stdout, `${value}\n`);
      assert.equal(readFileSync(externalConfig, "utf8"), externalBytes);
      assert.throws(() => selectedGitResult(fixture, ["config", value, "user.email"]), /selected_git_fixture_escape_refused/u);
    }
    assert.equal(selectedGitResult(fixture, ["config", "user.email", "fixture@example.invalid"]).status, 0);
    const emptyTree = selectedGitResult(fixture, ["mktree"], { input: "", encoding: "utf8", timeout: 5000 }).stdout.trim();
    const objectCommit = selectedGitResult(fixture, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
      "commit-tree", emptyTree, "-m", "admission fixture"], { encoding: "utf8", timeout: 5000 }).stdout.trim();
    assert.match(objectCommit, /^[0-9a-f]{40}$/u);
    const parented = selectedGitResult(fixture, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
      "commit-tree", emptyTree, "-m", "child", "-p", objectCommit], { encoding: "utf8", timeout: 5000 }).stdout.trim();
    assert.match(parented, /^[0-9a-f]{40}$/u);
    for (const args of [["mktree", "--missing"], ["commit-tree", emptyTree, "-F", "/unowned-message"],
      ["commit-tree", emptyTree, "-m", "message", "-p", "/unowned-parent"]])
      assert.throws(() => selectedGitResult(fixture, args), /selected_git_fixture_escape_refused/u);
    for (const args of [["init", "/unowned-selected-git-fixture"], ["clone", fixture, "/unowned-selected-git-fixture"],
      ["worktree", "add", "/unowned-selected-git-fixture", "HEAD"], ["fetch", "https://github.com/fixture/unselected.git"],
      ["config", "include.path", "/unowned-selected-git-fixture"]])
      assert.throws(() => selectedGitResult(fixture, args), /selected_git_fixture_escape_refused/u);
    const fixtureConfig=path.join(fixture,".git","config"), fixtureBytes=readFileSync(fixtureConfig);
    for(const appended of ["\n[include]\npath = /unowned-selected-git-fixture\n", "\n[core]\nhooksPath = /unowned-selected-git-fixture\n", "\n[alias]\nstatus = !touch /unowned-selected-git-fixture\n"]) {
      writeFileSync(fixtureConfig,Buffer.concat([fixtureBytes,Buffer.from(appended)]));
      assert.throws(()=>selectedGitResult(fixture,["status","--porcelain"]),/selected_git_fixture_configuration_unclassified/u);
    }
    writeFileSync(fixtureConfig,fixtureBytes);
    assert.equal(selectedGitResult(fixture,["status","--porcelain"]).status,0);
  });
  assert.equal(output(["rev-parse", "HEAD"]).trim(), head, "fixture commits cannot mutate selected source HEAD");

  const config = selectedGitResources(selected).find(input => input.file.endsWith("repository/config"));
  const extraRef = path.join(path.dirname(config.file), "refs/heads/unselected");
  writeFileSync(extraRef, `${head}\n`);
  assert.throws(() => assertSelectedGit(selected), /selected_git_private_input_changed/u);
  rmSync(extraRef);
  const original = readFileSync(config.file);
  chmodSync(config.file, 0o600); writeFileSync(config.file, Buffer.concat([original, Buffer.from("\n[core]\n\tquotePath = false\n")]));
  assert.throws(() => assertSelectedGit(selected), /selected_git_private_input_changed/u);
  const laterRoot = path.join(temporary, "later-selection"); mkdirSync(laterRoot);
  const later = initializeSelectedGit({ repositoryRoot: root, temporaryRoot: laterRoot, gitExecutable: git });
  const laterEnvironment = { ...env, ...selectedGitEnvironment(later) };
  const laterManifest = laterEnvironment[SELECTED_GIT_MANIFEST_ENV];
  // Exact bytes and hash do not permit a fresh process to accept a writable
  // capability manifest. Exercise both its public reader and actual CLI reader.
  chmodSync(laterManifest, 0o600);
  try {
    assert.throws(() => loadSelectedGit(laterManifest, laterEnvironment[SELECTED_GIT_MANIFEST_HASH_ENV]), /selected_git_manifest_changed/u);
    const writable = runOwnedSyncChild(process.execPath, [script, "rev-parse", "HEAD"], {
      cwd: root, env: laterEnvironment, encoding: "utf8", timeout: 10_000,
    });
    assert.notEqual(writable.status, 0); assert.match(writable.stderr, /selected_git_manifest_changed/u);
  } finally { chmodSync(laterManifest, 0o400); }
  const restored = loadSelectedGit(laterManifest, laterEnvironment[SELECTED_GIT_MANIFEST_HASH_ENV]);
  run(["config", "remote.origin.url", "https://github.com/fixture/changed.git"]);
  assert.throws(() => assertSelectedGit(restored), /selected_git_live_authority_changed/u);
  const operandControl = await selectedGitFileOperandControl({ git: selectedGitModule, lifecycle: lifecycleModule });
  assert.equal(operandControl.failure, null);
  assert.deepEqual(operandControl.violations, []);
  assert.equal(operandControl.lifecycle.complete, true);
  assert(operandControl.cleanup.every(row => row.completed));
  console.log("selected Git production-reader controls passed; disposable identities remain ineligible for qualification");
} finally {
  const [cleanup] = cleanupCanonicalTestResources([owner]);
  assert.equal(cleanup.completed, true, cleanup.failures.join(","));
}
