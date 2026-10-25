import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources } from "../canonical-test-environment.mjs";
import { inheritSelectedExecutionEnvironment } from "../local-canonical-selected-execution.mjs";

// Frozen same-expectation control: callers may select reviewed/current module
// bytes, but cannot change the required refusal or ordinary positive assertions.
export async function selectedGitFileOperandControl({ git, lifecycle, retainLedger = null }) {
  const started = Date.now(), owner = createCanonicalTestResourceRoot("ag-resource-test-");
  const root = path.join(owner.root, "source"), privateRoot = path.join(owner.root, "private");
  const outside = path.join(owner.root, "outside-selection"), fixture = path.join(privateRoot, "fixture");
  for (const directory of [root, privateRoot, outside, fixture]) mkdirSync(directory, { mode: 0o700 });
  const ledgerFile = path.join(owner.root, "children.jsonl"), ledger = lifecycle.initializeOwnedChildLifecycleFile(ledgerFile);
  const selection = { file: ledgerFile, identity: ledger.identity,
    ancestors: lifecycle.inheritedOwnedChildLifecycleAncestors(inheritSelectedExecutionEnvironment(process.env, {})) }, observations = [], positives = [];
  let failure = null, inventory, cleanup;
  beginCanonicalTestResourceUse(owner);
  try {
    lifecycle.withOwnedSyncLifecycle(selection, () => {
      const executable = realpathSync("/usr/bin/git"), empty = path.join(outside, "empty-config"); writeFileSync(empty, "");
      const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: owner.root, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: empty,
        GIT_AUTHOR_NAME: "Fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid", GIT_COMMITTER_NAME: "Fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
      const native = (directory, args) => {
        const result = lifecycle.runOwnedSyncChild(executable, args, { cwd: directory, env, encoding: "utf8", timeout: 5000 });
        assert.equal(result.error, undefined); assert.equal(result.signal, null); assert.equal(result.status, 0, result.stderr); return result.stdout;
      };
      for (const directory of [root, fixture]) {
        native(directory, ["init", "--quiet"]);
        native(directory, ["config", "remote.origin.url", "https://github.com/fixture/file-operands.git"]);
        writeFileSync(path.join(directory, "tracked.txt"), "needle\n-f-literal\n");
        native(directory, ["add", "tracked.txt"]); native(directory, ["commit", "--quiet", "-m", "fixture"]);
        writeFileSync(path.join(directory, "needle"), "untracked\n");
      }
      const context = git.initializeSelectedGit({ repositoryRoot: root, temporaryRoot: privateRoot, gitExecutable: executable });
      const invoke = (directory, args) => git.withSelectedGit(context, () => git.selectedGitResult(directory, args, { env, encoding: "utf8", timeout: 5000 }));
      const pattern = path.join(outside, "pattern");
      for (const directory of [root, fixture]) {
        const head = invoke(directory, ["rev-parse", "HEAD"]).stdout.trim();
        for (const args of [["grep", "-I", "-l", "-z", "-F", "-e", "needle", "-e", "tracked.txt", head, "--"],
          ["grep", "-I", "-l", "-z", "-E", "needle|absent", head, "--", ":!*.md"],
          ["grep", "-F", "-e-f-literal", head, "--", "tracked.txt"],
          ["ls-files", "--stage", "-z"], ["diff", "--binary", "--no-ext-diff", "--no-textconv", head, "--"],
          ["show", "-s", "--format=%P", head], ["rev-parse", "--verify", "HEAD"],
          ["ls-tree", "-r", "-t", "-l", "-z", "--full-tree", head],
          ["diff", "--name-status", "-z", "--find-renames=50%", head, head],
          ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none"],
          ["status", "--porcelain=v2", "-z", "--untracked-files=no", "--ignore-submodules=none"],
          ["ls-files", "--others", "--exclude-standard", "-z"], ["cat-file", "-e", `${head}^{commit}`],
          ["merge-base", "--is-ancestor", head, head]]) {
          const result = invoke(directory, args); assert.equal(result.status, 0, result.stderr); assert.equal(result.error, undefined);
          positives.push({ route: directory === root ? "source" : "fixture", command: args[0], status: result.status });
        }
        const cases = [
          ["grep-attached", ["grep", `-f${pattern}`, "HEAD"]],
          ["grep-separated", ["grep", "-f", pattern, "HEAD"]],
          ["grep-short-cluster", ["grep", `-lf${pattern}`, "HEAD"]],
          ["grep-relative-attached", ["grep", `-f${path.relative(directory, pattern)}`, "HEAD"]],
          ["grep-long-attached", ["grep", `--file=${pattern}`, "HEAD"]],
          ["grep-long-separated", ["grep", "--file", pattern, "HEAD"]],
          ["diff-order-attached", ["diff", `-O${pattern}`, "HEAD"]],
          ["diff-order-separated", ["diff", "-O", pattern, "HEAD"]],
          ["ls-files-exclude-attached", ["ls-files", "--others", `-X${pattern}`]],
          ["ls-files-exclude-separated", ["ls-files", "--others", "-X", pattern]],
          ["ls-files-exclude-long", ["ls-files", "--others", `--exclude-from=${pattern}`]],
          ["ls-files-exclude-abbreviation", ["ls-files", "--others", `--exclude-f=${pattern}`]],
        ];
        if (directory === fixture) cases.push(
          ["commit-message-attached", ["commit", "--allow-empty", `-F${pattern}`]],
          ["commit-message-separated", ["commit", "--allow-empty", "-F", pattern]],
          ["commit-template-attached", ["commit", "--allow-empty", `--template=${pattern}`, "--no-edit"]],
          ["add-pathspec-attached", ["add", `--pathspec-from-file=${pattern}`]],
        );
        for (const [name, args] of cases) {
          const reads = [];
          for (const content of ["needle\n", "absent-pattern\n"]) {
            writeFileSync(pattern, content);
            const before = lifecycle.readOwnedChildLifecycleFile(ledgerFile, ledger.identity).started_count;
            let result, refusal = null;
            try { result = invoke(directory, args); } catch (error) { refusal = error.code ?? error.message; }
            const after = lifecycle.readOwnedChildLifecycleFile(ledgerFile, ledger.identity).started_count;
            reads.push({ pattern_sha256: createHash("sha256").update(content).digest("hex"), refusal, dispatched_children: after - before,
              status: result?.status ?? null, stdout: result?.stdout ?? null, stderr: result?.stderr ?? null,
              native_error: result?.error?.code ?? null });
          }
          observations.push({ route: directory === root ? "source" : "fixture", name, reads,
            refused_before_dispatch: reads.every(read => /^selected_git_(?:escape_refused|fixture_escape_refused|file_operand_unclassified)$/u.test(read.refusal ?? "") && read.dispatched_children === 0) });
        }
      }
    });
  } catch (error) { failure = { message: error.message, stack: error.stack }; }
  finally {
    inventory = lifecycle.readOwnedChildLifecycleFile(ledgerFile, ledger.identity);
    if (retainLedger) writeFileSync(retainLedger, readFileSync(ledgerFile));
    if (inventory.complete) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    cleanup = cleanupCanonicalTestResources([owner]);
  }
  return { duration_ms: Date.now() - started, failure, positives, observations,
    violations: observations.filter(row => !row.refused_before_dispatch).map(row => `${row.route}:${row.name}`), lifecycle: inventory, cleanup };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [moduleFile, lifecycleFile, output] = process.argv.slice(2);
  const git = await import(pathToFileURL(moduleFile)), lifecycle = await import(pathToFileURL(lifecycleFile));
  const report = await selectedGitFileOperandControl({ git, lifecycle, retainLedger: `${output}.children.jsonl` });
  writeFileSync(output, JSON.stringify({ module_sha256: createHash("sha256").update(readFileSync(moduleFile)).digest("hex"),
    control_sha256: createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"), ...report }, null, 2) + "\n");
  assert.equal(report.failure, null); assert.deepEqual(report.violations, []);
  assert.equal(report.lifecycle.complete, true); assert(report.cleanup.every(row => row.completed));
}
