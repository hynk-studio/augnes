import { AsyncLocalStorage } from "node:async_hooks";
import { runOwnedSyncChild } from "./test-harness-process-lifecycle.mjs";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SELECTED_GIT_CONTRACT = "augnes.local-canonical-selected-git.v1";
export const SELECTED_GIT_MANIFEST_ENV = "AUGNES_CANONICAL_SELECTED_GIT_MANIFEST";
export const SELECTED_GIT_MANIFEST_HASH_ENV = "AUGNES_CANONICAL_SELECTED_GIT_SHA256";
const scope = new AsyncLocalStorage();
const states = new WeakMap();
// Cache only parsing of unchanged, fully observed local authority files. Every
// use still reads and compares their complete content and physical metadata.
const authorityParseCache = new Map();
const hash = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest("hex");
const fail = code => { throw Object.assign(new Error(code), { code }); };
const inside = (root, entry) => entry === root || entry.startsWith(root + path.sep);
const SHA = /^[0-9a-f]{40}$/u;
const REFERENCE = /^refs\/(?:heads|remotes|tags)\/[A-Za-z0-9_./-]+$/u;

// Only the selected source repository uses this read-only Git view. Test-owned
// repositories retain their own Git directories; a global GIT_DIR would redirect
// their legitimate init/add/commit operations into the verification source.
export function initializeSelectedGit({ repositoryRoot, temporaryRoot, gitExecutable }) {
  const root = physicalDirectory(repositoryRoot), temporary = physicalDirectory(temporaryRoot);
  const tool = physicalExecutable(gitExecutable);
  const directory = path.join(temporary, "selected-git");
  mkdirSync(directory, { mode: 0o700 });
  const empty = path.join(directory, "empty-config");
  writeImmutable(empty, "");
  const layout = readLayout(root);
  const authority = readAuthority(layout, tool, empty);
  const live = readLiveSource(layout);
  const gitDirectory = path.join(directory, "repository");
  mkdirSync(gitDirectory, { mode: 0o700 });
  mkdirSync(path.join(gitDirectory, "refs"), { mode: 0o700 });
  mkdirSync(path.join(gitDirectory, "objects"), { mode: 0o700 });
  mkdirSync(path.join(gitDirectory, "hooks"), { mode: 0o700 });
  const config = '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = false\n\tfsmonitor = false\n\tuntrackedcache = false\n\tattributesfile = ' + quoteConfig(empty) + '\n\texcludesfile = ' + quoteConfig(empty) + '\n\thookspath = ' + quoteConfig(path.join(gitDirectory, "hooks")) + '\n[remote "origin"]\n\turl = ' + authority.origin + '\n';
  writeImmutable(path.join(gitDirectory, "config"), config);
  writeImmutable(path.join(gitDirectory, "HEAD"), live.headText);
  if (live.branch) {
    mkdirSync(path.dirname(path.join(gitDirectory, live.branch)), { recursive: true, mode: 0o700 });
    writeImmutable(path.join(gitDirectory, live.branch), `${live.head}\n`);
  }
  const main = readReference(layout.common, "refs/remotes/origin/main");
  if (main) {
    mkdirSync(path.join(gitDirectory, "refs/remotes/origin"), { recursive: true, mode: 0o700 });
    writeImmutable(path.join(gitDirectory, "refs/remotes/origin/main"), `${main}\n`);
  }
  const index = safeFile(path.join(layout.gitDirectory, "index"), { optional: true, maximum: 32 * 1024 * 1024 });
  if (index) writeImmutable(path.join(gitDirectory, "index"), index.bytes);
  const privateFiles = walkFiles(directory).map(file => ({ file, identity: fileIdentity(file) }));
  const data = { schema: "augnes.local-canonical-selected-execution.v1", contract: SELECTED_GIT_CONTRACT, root, temporary, directory, gitDirectory, empty,
    gitExecutable: tool, toolIdentity: fileIdentity(tool, { executable: true }), layout, authority, live,
    indexIdentity: index?.identity ?? null, privateFiles };
  const manifestPath = path.join(directory, "selection.json");
  writeImmutable(manifestPath, JSON.stringify(data));
  return own({ ...data, manifestPath, manifestIdentity: fileIdentity(manifestPath) });
}

export function withSelectedGit(context, callback) {
  requireState(context);
  return scope.run(context, callback);
}

export function serializeSelectedGit(context) {
  const state = requireState(context);
  return state.manifestPath;
}

export function selectedGitEnvironment(context) {
  const state = requireState(context);
  return { [SELECTED_GIT_MANIFEST_ENV]: state.manifestPath,
    [SELECTED_GIT_MANIFEST_HASH_ENV]: state.manifestIdentity.sha256 };
}

export function selectedGitExecutable(context) { return requireState(context).gitExecutable; }

// The product worktree observer uses asynchronous execFile semantics. Under a
// selected capability, own its actual shim launch without changing the ordinary
// unselected product process path or its timeout/output/error contract.
export async function selectedGitExecFile(root, args, { env = process.env, timeout = 5000, maxBuffer = 32 * 1024 * 1024 + 1 } = {}) {
  if (!env[SELECTED_GIT_MANIFEST_ENV]) fail("selected_git_manifest_unbound");
  const { runCanonicalChild } = await import("./canonical-child-runner.mjs");
  const controller = new AbortController();
  const output = { stdout: [], stderr: [] }, counts = { stdout: 0, stderr: 0 };
  let overflow = null;
  const capture = channel => ({ write(chunk) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const remaining = Math.max(0, maxBuffer - counts[channel]);
    if (remaining) output[channel].push(bytes.subarray(0, remaining));
    counts[channel] += bytes.length;
    if (counts[channel] > maxBuffer && !overflow) { overflow = channel; controller.abort(); }
  } });
  const commandArgs = ["--no-optional-locks", "-C", root, ...args];
  const result = await runCanonicalChild({ suite: "selected-worktree-reader", label: "product Git reader",
    command: process.execPath, args: [fileURLToPath(import.meta.url), ...commandArgs], cwd: root, env, timeoutMs: timeout,
    signal: controller.signal, stdout: capture("stdout"), stderr: capture("stderr"), log() {},
  });
  const stdout = Buffer.concat(output.stdout).toString("utf8"), stderr = Buffer.concat(output.stderr).toString("utf8");
  if (overflow || result.spawn_error_code || result.timed_out || result.exit_code !== 0 || !result.cleanup_completed ||
      !result.exit_observed || !result.streams_closed || result.remaining_owned_processes !== 0) {
    const code = overflow ? "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" : result.spawn_error_code ??
      (result.exit_code !== 0 ? result.exit_code : "selected_git_child_cleanup_incomplete");
    throw Object.assign(new Error(overflow ? `${overflow} maxBuffer length exceeded` : `Command failed: git ${commandArgs.join(" ")}\n${stderr}`),
      { code, stdout, stderr, killed: result.timed_out || result.cancelled, signal: result.signal,
        cmd: `git ${commandArgs.join(" ")}` });
  }
  return { stdout, stderr };
}

export function loadSelectedGit(manifestPath, expectedHash) {
  if (!/^[0-9a-f]{64}$/u.test(expectedHash ?? "")) fail("selected_git_manifest_unbound");
  const manifest = safeFile(manifestPath, { maximum: 1024 * 1024 });
  if (manifest.identity.sha256 !== expectedHash || manifest.identity.mode !== String(0o100400) ||
      (typeof process.getuid === "function" && manifest.identity.uid !== String(process.getuid()))) fail("selected_git_manifest_changed");
  let data;
  try { data = JSON.parse(manifest.bytes); } catch { fail("selected_git_manifest_invalid"); }
  if (data?.contract !== SELECTED_GIT_CONTRACT || !Array.isArray(data.privateFiles) ||
      data.privateFiles.length < 3 || data.privateFiles.length > 16 ||
      data.directory !== path.join(data.temporary, "selected-git") ||
      data.gitDirectory !== path.join(data.directory, "repository") ||
      data.empty !== path.join(data.directory, "empty-config") ||
      manifestPath !== path.join(data.directory, "selection.json")) fail("selected_git_manifest_invalid");
  const context = own({ ...data, manifestPath, manifestIdentity: manifest.identity });
  assertSelectedGit(context);
  return context;
}

export function selectedGitResources(context) {
  const state = requireState(context);
  return [...state.privateFiles, { file: state.manifestPath }].map(({ file }, i) => ({
    id: `selected-git-${i}`, file, classification: "execution",
  }));
}

export function selectedGitRetainedInputs(context) {
  const state = requireState(context);
  const inputs = state.privateFiles.map(({ file, identity }, i) => {
    const logical = path.relative(state.directory, file).split(path.sep).join("/");
    const kind = logical === "empty-config" ? "empty-config" : logical === "repository/config" ? "generated-git-config" :
      logical === "repository/index" ? "source-git-index" : logical === "repository/HEAD" ? "source-git-head" : "source-git-ref";
    return { id: `selected-git-${i}`, file, kind, source_generated: true, expected_sha256: identity.sha256,
      ...(kind === "generated-git-config" ? { logical_content: readFileSync(file, "utf8").replaceAll(state.directory, "<selected-git-root>") } : {}) };
  });
  return [...inputs, { id: `selected-git-${state.privateFiles.length}`, file: state.manifestPath,
    kind: "selected-execution-manifest", source_generated: true, expected_sha256: state.manifestIdentity.sha256,
    logical_content: { schema: "augnes.local-canonical-selected-execution.v1", contract: SELECTED_GIT_CONTRACT,
      repository_fingerprint: hash(state.root), source_head: state.live.head, source_branch_fingerprint: hash(state.live.branch),
      source_index_sha256: state.indexIdentity?.sha256 ?? null, live_authority_fingerprint: hash(state.authority),
      executable_sha256: state.toolIdentity.sha256,
      inputs: inputs.map(input => ({ id: input.id, kind: input.kind,
        logical_sha256: input.logical_content ? hash(input.logical_content) : input.expected_sha256 })) } }];
}

export const selectedGitRetainedResources = selectedGitRetainedInputs;

export function selectedGitEvidence(context) {
  const state = requireState(context);
  return { contract: SELECTED_GIT_CONTRACT, repository_fingerprint: hash(state.root),
    source_head: state.live.head, source_branch_fingerprint: hash(state.live.branch),
    live_authority_fingerprint: hash(state.authority),
    source_index_fingerprint: state.indexIdentity ? hash(state.indexIdentity) : null,
    executable_fingerprint: hash(state.toolIdentity),
    selected_files: state.privateFiles.map(({ file, identity }) => ({
      logical_path: path.relative(state.directory, file).split(path.sep).join("/"), sha256: identity.sha256,
    })), environment_policy: "fixed-git-config-no-includes-no-replacements-no-global-gitdir" };
}

export function assertSelectedGit(context) {
  const state = requireState(context);
  const expectedFiles = [...state.privateFiles.map(item => item.file), state.manifestPath].sort();
  if (hash(walkFiles(state.directory).sort()) !== hash(expectedFiles)) fail("selected_git_private_input_changed");
  for (const item of state.privateFiles) {
    if (!inside(state.directory, item.file) || hash(fileIdentity(item.file)) !== hash(item.identity))
      fail("selected_git_private_input_changed");
  }
  const currentToolIdentity = fileIdentity(state.gitExecutable, { executable: true });
  if (hash(fileIdentity(state.manifestPath)) !== hash(state.manifestIdentity) ||
      hash(currentToolIdentity) !== hash(state.toolIdentity))
    fail("selected_git_private_input_changed");
  const layout = readLayout(state.root);
  if (hash(layout) !== hash(state.layout) || hash(readAuthority(layout, state.gitExecutable, state.empty, currentToolIdentity)) !== hash(state.authority))
    fail("selected_git_live_authority_changed");
  const live = readLiveSource(layout);
  const index = safeFile(path.join(layout.gitDirectory, "index"), { optional: true, maximum: 32 * 1024 * 1024 });
  if (hash(live) !== hash(state.live) || hash(index?.identity ?? null) !== hash(state.indexIdentity))
    fail("source_input_changed");
  assertObjects(layout.common);
  return true;
}

export function selectedGitResult(root, args, options = {}) {
  const inherited = process.env[SELECTED_GIT_MANIFEST_ENV];
  if (inherited && !/^[0-9a-f]{64}$/u.test(process.env[SELECTED_GIT_MANIFEST_HASH_ENV] ?? "")) fail("selected_git_manifest_unbound");
  const scoped = scope.getStore();
  const context = scoped ?? (inherited
    ? loadSelectedGit(inherited, process.env[SELECTED_GIT_MANIFEST_HASH_ENV]) : null);
  if (!context) return runOwnedSyncChild("git", args, { cwd: root, ...options });
  const state = requireState(context);
  // Public loadSelectedGit already performs this full current validation.
  // A scoped context requires the same check here; do not repeat it within
  // one synchronous inherited dispatch.
  if (scoped) assertSelectedGit(context);
  const call = normalizeCall(root, args);
  if (options.shell || (options.cwd && path.resolve(options.cwd) !== path.resolve(root))) fail("selected_git_escape_refused");
  const callerEnvironment = options.env ?? process.env;
  if (Object.keys(callerEnvironment).some(key => /^(?:GIT_(?:DIR|COMMON_DIR|WORK_TREE|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|CONFIG_PARAMETERS|EXEC_PATH|SSH(?:_COMMAND)?|EXTERNAL_DIFF)|GIT_CONFIG_(?:KEY|VALUE)_\d+)$/u.test(key) && callerEnvironment[key]))
    fail("selected_git_environment_escape_refused");
  if (callerEnvironment.GIT_CONFIG_COUNT && callerEnvironment.GIT_CONFIG_COUNT !== "0") fail("selected_git_environment_escape_refused");
  let isSource = inside(state.root, call.root);
  const isAnchor = call.root === state.layout.anchor;
  const environment = callerEnvironment;
  const fixtureRoots = [state.temporary];
  const childRoot = environment.AUGNES_CANONICAL_TEMP_ROOT;
  if (typeof childRoot === "string" && path.isAbsolute(childRoot) && !inside(state.root, childRoot) &&
      (inside(state.temporary, childRoot) || /^ag-(?:suite|c[0-9]{2}|resource-test)-/u.test(path.basename(childRoot))))
    fixtureRoots.push(physicalDirectory(childRoot));
  const fixturePath = candidate => {
    if (typeof candidate !== "string" || !candidate || candidate.includes("\0")) return false;
    const resolved = path.resolve(call.root, candidate);
    if (!fixtureRoots.some(boundary => inside(boundary, resolved))) return false;
    let parent = resolved;
    while (!existsSync(parent) && path.dirname(parent) !== parent) parent = path.dirname(parent);
    return realpathSync(parent) === parent;
  };
  let explicitFixture = false;
  if (isSource && ["init", "clone"].includes(call.args[0])) {
    const destination = call.args.at(-1);
    if (!destination || destination.startsWith("-") || !fixturePath(destination)) fail("selected_git_fixture_escape_refused");
    if (call.args[0] === "clone") {
      const source = call.args.at(-2);
      if (!source || source.startsWith("-") || !fixturePath(source)) fail("selected_git_fixture_escape_refused");
    }
    isSource = false;
    explicitFixture = true;
  }
  if (explicitFixture || (!isSource && !isAnchor)) {
    // Fixture callers may supply their own HOME, but never inherited host Git
    // configuration, loaders, helpers or an explicit foreign Git directory.
    if (!fixtureRoots.some(boundary => inside(boundary, call.root)) && !["init", "clone"].includes(call.args[0]))
      fail("selected_git_fixture_escape_refused");
    const fixtureRepositories = assertFixtureArguments(call, fixturePath);
    for (const repository of fixtureRepositories) {
      const layout = assertFixtureStorage(repository.root, fixturePath, { optional: repository.optional });
      if (layout) assertFixtureConfiguration(layout, state, fixturePath);
    }
    return runOwnedSyncChild(state.gitExecutable, ["-c", `core.hooksPath=${path.join(state.gitDirectory,"hooks")}`,
      "-c", "core.fsmonitor=false", "-c", `core.attributesFile=${state.empty}`, "-c", `core.excludesFile=${state.empty}`,
      "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", "-c", "protocol.allow=never", "-c", "protocol.file.allow=always",
      ...call.prefix, ...call.args], { ...options, cwd: call.root,
      env: gitEnvironment(state.empty, environment, true) });
  }
  if (call.configurationOverride) fail("selected_git_escape_refused");
  const metadata = metadataAnswer(state, call.root, call.args);
  if (metadata !== null) return completed(metadata, options);
  if (isAnchor && call.root !== state.root) fail("selected_git_anchor_operation_refused");
  const command = call.args[0];
  if (!["rev-parse", "status", "cat-file", "ls-tree", "diff", "grep", "merge-base", "show", "log", "ls-files", "check-ignore", "symbolic-ref", "archive"].includes(command))
    fail("selected_git_operation_unclassified");
  if (command === "archive") {
    const archiveArgs = call.args.slice(1);
    if (archiveArgs.shift() !== "--format=tar") fail("selected_git_archive_unclassified");
    if (archiveArgs[0]?.startsWith("--output=")) {
      if (!fixturePath(archiveArgs.shift().slice("--output=".length))) fail("selected_git_fixture_escape_refused");
    }
    if (!SHA.test(archiveArgs.shift() ?? "") || archiveArgs.some(arg => !/^[A-Za-z0-9_./-]+$/u.test(arg) ||
        arg.startsWith("-") || path.isAbsolute(arg) || arg.split("/").some(part => !part || part === "." || part === "..")))
      fail("selected_git_archive_unclassified");
  } else {
    if (call.args.some(arg => /^(?:--(?:git-dir|work-tree|namespace|exec-path|config-env|output|pathspec-from-file|filters|textconv|ext-diff)(?:=|$)|-c$|--config$)/u.test(arg)))
      fail("selected_git_escape_refused");
    if (call.args.some(arg => path.isAbsolute(arg) || /^(?:\.\.\/|--(?:no-index|open-files-in-pager|recurse-submodules|recursive)(?:=|$))/u.test(arg)))
      fail("selected_git_escape_refused");
    assertReadArguments(call, () => false);
  }
  if (command === "symbolic-ref" && !["symbolic-ref\0HEAD", "symbolic-ref\0--quiet\0--short\0HEAD", "symbolic-ref\0--short\0HEAD"].includes(call.args.join("\0"))) fail("selected_git_operation_unclassified");
  if (command === "rev-parse" && call.args.some(arg => /^(?:--resolve-git-dir|--git-path|--sq-quote)/u.test(arg))) fail("selected_git_operation_unclassified");
  const env = { ...gitEnvironment(state.empty), GIT_DIR: state.gitDirectory, GIT_WORK_TREE: state.root,
    GIT_COMMON_DIR: state.gitDirectory, GIT_INDEX_FILE: path.join(state.gitDirectory, "index"),
    GIT_OBJECT_DIRECTORY: path.join(state.layout.common, "objects") };
  return runOwnedSyncChild(state.gitExecutable, ["--no-replace-objects", ...call.prefix, ...call.args], { ...options,
    cwd: call.root, env, shell: false });
}

function assertFixtureArguments(call, fixturePath) {
  const [command, ...args] = call.args;
  let repositories = [{root:call.root,optional:false}];
  const refuse = () => fail("selected_git_fixture_escape_refused");
  if (["commit", "tag", "merge"].includes(command) && args.some(arg => /^-[Ssu](?:.|$)/u.test(arg) || /^(?:--sign|--local-user|--strategy)(?:=|$)/u.test(arg))) refuse();
  if (!["init", "clone", "worktree", "config", "remote", "fetch", "push", "add", "commit", "mv", "rm",
    "reset", "clean", "tag", "merge", "update-ref", "update-index", "symbolic-ref", "checkout", "switch", "mktree", "commit-tree",
    "rev-parse", "status", "cat-file", "ls-tree", "diff", "grep", "merge-base", "show", "log", "ls-files", "check-ignore"].includes(command))
    fail("selected_git_fixture_operation_unclassified");
  const closedOptions = READ_OPTIONS[command] ?? FIXTURE_OPTIONS[command];
  if (closedOptions) assertBoundedOptions(call, closedOptions, fixturePath);
  // The executor's existing disposable admission fixture authors only tree and
  // commit objects. No flags/files/helpers or source-repository writes are added.
  else if (command === "mktree") { if (args.length) refuse(); }
  else if (command === "commit-tree") {
    if (![3, 5].includes(args.length) || !SHA.test(args[0]) || args[1] !== "-m" ||
        (args.length === 5 && (args[3] !== "-p" || !SHA.test(args[4])))) refuse();
  }
  else for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (/^--(?:git-dir|work-tree|namespace|exec-path|config-env|upload-pack|receive-pack|recurse-submodules|exec|filters|textconv|ext-diff|config|gpg-sign|open-files-in-pager|repo|repository|edit|edit-description)(?:=|$)/u.test(arg)) refuse();
    if (["--file", "-F", "--output", "-o", "--template", "--separate-git-dir", "--pathspec-from-file"].includes(arg)) {
      if (!fixturePath(args[++i])) refuse();
    } else if (/^--(?:file|output|template|separate-git-dir|pathspec-from-file)=/u.test(arg)) {
      if (!fixturePath(arg.slice(arg.indexOf("=") + 1))) refuse();
    } else if ((path.isAbsolute(arg) || /^\.\.(?:\/|$)/u.test(arg)) && !fixturePath(arg)) refuse();
  }
  if (["init", "clone", "worktree"].includes(command)) {
    const positional = [];
    const start = command === "worktree" ? 1 : 0;
    for (let i = start; i < args.length; i++) {
      if (["-b", "-B", "--initial-branch", "--branch"].includes(args[i])) { if (!args[++i]) refuse(); continue; }
      if (/^--(?:initial-branch|branch)=.+/u.test(args[i]) || ["--quiet", "-q", "--bare", "--no-local", "--no-hardlinks", "--detach", "--force", "-f", "--porcelain", "-z"].includes(args[i])) continue;
      if (args[i].startsWith("-")) refuse();
      positional.push(args[i]);
    }
    if (command === "init" && (positional.length > 1 || !fixturePath(positional[0] ?? "."))) refuse();
    if (command === "clone" && (positional.length !== 2 || positional.some(value => !fixturePath(value)))) refuse();
    if (command === "init") repositories = [{root:path.resolve(call.root,positional[0]??"."),optional:true}];
    if (command === "clone") repositories = [{root:path.resolve(call.root,positional[0]),optional:false}];
    if (command === "worktree") {
      if (args[0] === "list") { if (positional.length) refuse(); }
      else if (args[0] === "add") { if (positional.length < 1 || positional.length > 2 || !fixturePath(positional[0])) refuse(); }
      else if (args[0] === "move") { if (positional.length !== 2 || positional.some(value => !fixturePath(value))) refuse(); }
      else if (["remove", "lock", "unlock"].includes(args[0])) { if (positional.length !== 1 || !fixturePath(positional[0])) refuse(); }
      else refuse();
    }
  }
  if (command === "config") {
    const values = args.filter(arg => !["--local", "--get", "--get-all", "--null", "-z"].includes(arg));
    if (values.length < 1 || values.length > 2 || !/^(?:user\.(?:name|email)|commit\.gpgsign|fixture\.isolation|core\.quotePath|remote\.[A-Za-z0-9_-]+\.url)$/u.test(values[0])) refuse();
  }
  if (["fetch", "push"].includes(command)) {
    const remote = args.find(arg => !arg.startsWith("-"));
    if (!remote || !path.isAbsolute(remote) || !fixturePath(remote) || !existsSync(remote)) refuse();
    repositories.push({root:remote,optional:false});
  }
  if (command === "remote") {
    if (!args.length || ["-v", "--verbose"].includes(args[0])) { if (args.length > 1) refuse(); }
    else if (args[0] === "get-url") { if (args.length !== 2 || !/^[A-Za-z0-9_-]+$/u.test(args[1])) refuse(); }
    else if (["add", "set-url"].includes(args[0])) {
      if (args.length !== 3 || !/^[A-Za-z0-9_-]+$/u.test(args[1]) ||
        (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/u.test(args[2]) && !fixturePath(args[2]))) refuse();
    } else if (["remove", "rm"].includes(args[0])) { if (args.length !== 2 || !/^[A-Za-z0-9_-]+$/u.test(args[1])) refuse(); }
    else refuse();
  }
  return repositories;
}

// These are the current source-reader and disposable-fixture option forms, not
// a general Git parser. In particular no consumer selects grep pattern files,
// diff order files, ls-files exclude files, message/template files, or option
// abbreviations. A denylist cannot distinguish their attached short operands.
const READ_OPTIONS = {
  "rev-parse": ["--verify", "--is-inside-work-tree", "--show-toplevel", "--git-common-dir", "--git-dir", "--absolute-git-dir"],
  status: ["--porcelain", "--porcelain=v1", "--porcelain=v2", "--short", "--branch", "-z", "--untracked-files=all", "--untracked-files=no", "--untracked-files=normal", "--ignore-submodules=none"],
  "cat-file": ["-e", "-p", "-s", "-t", "--batch"],
  "ls-tree": ["-r", "-t", "-l", "-z", "-rz", "--full-tree", "--name-only"],
  diff: ["--binary", "--check", "--name-only", "--name-status", "--find-renames=50%", "--no-ext-diff", "--no-textconv", "--submodule=short", "--cached", "--stat", "-z"],
  grep: ["-I", "-l", "-z", "-F", "-E"],
  "merge-base": ["--is-ancestor"],
  show: ["-s", "--no-ext-diff", "--no-textconv"],
  log: ["-1", "--oneline", "--no-ext-diff", "--no-textconv"],
  "ls-files": ["--cached", "--stage", "-s", "-z", "--error-unmatch", "--others", "--exclude-standard"],
  "check-ignore": ["--quiet"],
  "symbolic-ref": ["--quiet", "--short"],
};
const FIXTURE_OPTIONS = {
  add: ["-A", "--all", "-f", "--force"], commit: ["--quiet", "-q", "--allow-empty", "--amend", "--no-edit", "--no-gpg-sign"],
  mv: [], rm: ["-r", "-f", "--force", "--cached"], reset: ["--hard", "--soft", "--mixed", "--quiet", "-q"],
  clean: ["-f", "-d", "-x", "-X", "-fd", "-fdx", "-q", "--quiet"], tag: ["-d", "--delete", "-a", "--annotate"],
  merge: ["--ff-only", "--no-ff", "--no-edit", "--quiet", "-q"], "update-ref": ["-d", "--no-deref"],
  "update-index": ["--index-info", "-z", "--add", "--remove"], checkout: ["--quiet", "-q", "--detach", "--force", "-f"],
  switch: ["--quiet", "-q", "--detach", "--force", "-f"], fetch: ["--quiet", "-q"], push: ["--quiet", "-q"],
};
function assertReadArguments(call, fixturePath) {
  assertBoundedOptions(call, READ_OPTIONS[call.args[0]], fixturePath);
}
function assertBoundedOptions(call, flags, fixturePath) {
  const [command, ...args] = call.args;
  const refuse = () => fail("selected_git_file_operand_unclassified");
  let paths = false, grepPattern = false;
  const operand = value => {
    if (path.isAbsolute(value) || value.split("/").includes("..")) {
      if (!fixturePath(value)) refuse();
    }
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (paths) { operand(arg); continue; }
    if (arg === "--") { paths = true; continue; }
    if (flags.includes(arg)) continue;
    // These values are authored text/ref names, never files. Consume them as
    // values even if they resemble options, preserving -e/-m literal behavior.
    const textFlags = command === "grep" ? ["-e"] : ["commit", "tag", "merge"].includes(command) ? ["-m"] :
      command === "checkout" ? ["-b", "-B"] : command === "switch" ? ["-c", "-C"] : [];
    const textFlag = textFlags.find(flag => arg === flag || arg.startsWith(flag) && arg.length > flag.length);
    if (textFlag) {
      if (arg === textFlag && args[++i] === undefined) refuse();
      if (command === "grep") grepPattern = true;
      continue;
    }
    if (["show", "log"].includes(command) && arg.startsWith("--format=")) continue;
    if (arg.startsWith("-")) refuse();
    if (command === "grep" && !grepPattern) { grepPattern = true; continue; }
    operand(arg);
  }
}

function assertFixtureStorage(root, fixturePath, { optional = false } = {}) {
  for (let current = root; fixturePath(current); current = path.dirname(current)) {
    if (existsSync(path.join(current, ".git"))) {
      const layout = readLayout(current);
      if (!fixturePath(layout.gitDirectory) || !fixturePath(layout.common)) fail("selected_git_fixture_escape_refused");
      assertObjects(layout.common); return layout;
    }
    if (existsSync(path.join(current, "HEAD")) && existsSync(path.join(current, "config")) && existsSync(path.join(current, "objects"))) {
      assertObjects(current); return {common:current,gitDirectory:current};
    }
  }
  if (!optional) fail("selected_git_fixture_escape_refused");
  return null;
}

function assertFixtureConfiguration(layout, state, fixturePath) {
  for (const file of [...new Set([path.join(layout.common,"config"),path.join(layout.gitDirectory,"config.worktree")])]) {
    const observed=safeFile(file,{optional:file.endsWith("config.worktree")});
    if(!observed)continue;
    for(const row of parsedGitConfiguration(file,observed,state.gitExecutable,state.empty,state.toolIdentity).split("\0").filter(Boolean)) {
      const split=row.indexOf("\n"), key=split<0?row:row.slice(0,split), value=split<0?"":row.slice(split+1);
      const ordinary=/^(?:user\.(?:name|email)|fixture\.isolation|init\.defaultbranch)$/u.test(key) ||
        /^core\.(?:filemode|bare|logallrefupdates|ignorecase|precomposeunicode|quotepath)$/u.test(key)&&["true","false"].includes(value) ||
        key==="core.repositoryformatversion"&&["0","1"].includes(value) ||
        key==="extensions.worktreeconfig"&&value==="true" ||
        key==="commit.gpgsign"&&value==="false" ||
        /^remote\.[A-Za-z0-9_-]+\.url$/u.test(key)&&(/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/u.test(value)||fixturePath(value)) ||
        /^remote\.[A-Za-z0-9_-]+\.fetch$/u.test(key)&&/^\+?refs\/heads\/(?:[A-Za-z0-9_./-]+|\*):refs\/remotes\/[A-Za-z0-9_./*-]+$/u.test(value) ||
        /^branch\.[A-Za-z0-9_./-]+\.remote$/u.test(key)&&/^[A-Za-z0-9_-]+$/u.test(value) ||
        /^branch\.[A-Za-z0-9_./-]+\.merge$/u.test(key)&&/^refs\/heads\/[A-Za-z0-9_./-]+$/u.test(value);
      if(!ordinary)fail("selected_git_fixture_configuration_unclassified");
    }
  }
}

export function selectedGitOutput(root, args, options = {}) {
  const result = selectedGitResult(root, args, options);
  if (result.error) throw result.error;
  if (result.status !== 0 || result.signal) fail("selected_git_command_failed");
  return result.stdout;
}

function metadataAnswer(state, root, args) {
  const joined = args.join("\0");
  const source = inside(state.root, root);
  const layout = source ? state.layout : readLayout(root);
  if (joined === "remote\0get-url\0origin") return `${readAuthority(layout, state.gitExecutable, state.empty).origin}\n`;
  if (joined === "rev-parse\0--show-toplevel") return `${source ? state.root : root}\n`;
  if (joined === "rev-parse\0--git-common-dir") return `${layout.common}\n`;
  if (["rev-parse\0--absolute-git-dir", "rev-parse\0--git-dir"].includes(joined)) return `${layout.gitDirectory}\n`;
  if (joined === "worktree\0list\0--porcelain\0-z") {
    const roots = [layout.anchor];
    const worktrees = path.join(layout.common, "worktrees");
    if (existsSync(worktrees)) for (const name of readdirSync(physicalDirectory(worktrees)).sort()) {
      const entry = path.join(worktrees, name);
      physicalDirectory(entry);
      const back = safeFile(path.join(entry, "gitdir"));
      const checkout = path.dirname(back.bytes.toString("utf8").trim());
      if (!path.isAbsolute(checkout)) fail("selected_git_registration_invalid");
      roots.push(checkout);
    }
    return roots.map(value => `worktree ${value}\0\0`).join("");
  }
  return null;
}

function readLayout(root) {
  physicalDirectory(root);
  const entry = path.join(root, ".git"), stat = lstatSync(entry);
  let gitDirectory, common;
  if (stat.isDirectory() && !stat.isSymbolicLink()) gitDirectory = physicalDirectory(entry);
  else {
    const value = safeFile(entry).bytes.toString("utf8");
    const match = /^gitdir: ([^\r\n]+)\n?$/u.exec(value);
    if (!match) fail("selected_git_registration_invalid");
    gitDirectory = physicalDirectory(path.resolve(root, match[1]));
  }
  const commonFile = safeFile(path.join(gitDirectory, "commondir"), { optional: true });
  common = commonFile ? physicalDirectory(path.resolve(gitDirectory, commonFile.bytes.toString("utf8").trim())) : gitDirectory;
  const anchor = path.dirname(common);
  if (path.basename(common) !== ".git") fail("selected_git_layout_unsupported");
  if (gitDirectory !== common) {
    if (path.dirname(gitDirectory) !== path.join(common, "worktrees") ||
        safeFile(path.join(gitDirectory, "gitdir")).bytes.toString("utf8").trim() !== entry)
      fail("selected_git_registration_invalid");
  }
  return { root, anchor, gitDirectory, common, root_identity: directoryIdentity(root),
    git_identity: directoryIdentity(gitDirectory), common_identity: directoryIdentity(common),
    entry_identity: stat.isDirectory() ? null : fileIdentity(entry),
    common_entry_identity: commonFile?.identity ?? null };
}

function readAuthority(layout, tool, empty, toolIdentity = fileIdentity(tool, { executable: true })) {
  const configFiles = [path.join(layout.common, "config"), path.join(layout.gitDirectory, "config.worktree")];
  let origin = null;
  const safety = [];
  for (const file of configFiles) {
    const observed = safeFile(file, { optional: file.endsWith("config.worktree") });
    if (!observed) { safety.push(null); continue; }
    const parsed = parsedGitConfiguration(file,observed,tool,empty,toolIdentity);
    const origins = [];
    for (const row of parsed.split("\0").filter(Boolean)) {
      const split = row.indexOf("\n"), key = split < 0 ? row : row.slice(0, split), value = split < 0 ? "" : row.slice(split + 1);
      if (/^include(?:if\.|\.)/iu.test(key)) fail("selected_git_authority_include_unresolved");
      if (key === "remote.origin.url") origins.push(value);
      if (key.startsWith("extensions.") && !(key === "extensions.worktreeconfig" && value === "true"))
        fail("selected_git_repository_extension_unsupported");
      if (key === "core.repositoryformatversion" && !["0", "1"].includes(value)) fail("selected_git_repository_format_unsupported");
      if (key === "core.bare" && value !== "false") fail("selected_git_repository_format_unsupported");
      if (key === "core.worktree") fail("selected_git_worktree_override_refused");
    }
    if (origins.length > 1 || origins.some(value => !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/u.test(value)))
      fail("selected_git_origin_ambiguous");
    if (origins.length) origin = origins[0];
    safety.push(safetyIdentity(observed.identity));
  }
  if (!origin) fail("selected_git_origin_missing");
  assertObjects(layout.common);
  return { origin, safety };
}

function parsedGitConfiguration(file,observed,tool,empty,toolIdentity) {
  const parserKey = hash({ file, identity: observed.identity, tool, toolIdentity });
  let parsed = authorityParseCache.get(parserKey);
  if (parsed === undefined) {
    const result = runOwnedSyncChild(tool, ["config", "--file", file, "--no-includes", "--null", "--list"], {
      cwd: path.dirname(empty), env: gitEnvironment(empty), encoding: "utf8", timeout: 5000, maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"], shell: false,
    });
    if (result.error || result.status !== 0 || result.signal) fail("selected_git_authority_unreadable");
    parsed = result.stdout;
    if (authorityParseCache.size >= 32) authorityParseCache.delete(authorityParseCache.keys().next().value);
    authorityParseCache.set(parserKey, parsed);
  }
  if (hash(fileIdentity(file)) !== hash(observed.identity)) fail("selected_git_observation_race");
  return parsed;
}

function readLiveSource(layout) {
  const observed = safeFile(path.join(layout.gitDirectory, "HEAD"));
  const headText = observed.bytes.toString("utf8");
  const value = headText.trim();
  let branch = null, head = value;
  if (value.startsWith("ref: ")) {
    branch = value.slice(5);
    head = readReference(layout.common, branch);
  }
  if (!SHA.test(head ?? "")) fail("selected_git_head_invalid");
  return { headText, branch, head, head_identity: observed.identity };
}

function readReference(common, reference) {
  if (!REFERENCE.test(reference) || reference.split("/").some(value => !value || value === "." || value === "..")) fail("selected_git_reference_unsupported");
  const loose = safeFile(path.join(common, reference), { optional: true });
  if (loose) {
    const value = loose.bytes.toString("utf8").trim();
    if (!SHA.test(value)) fail("selected_git_reference_unsupported");
    return value;
  }
  const packed = safeFile(path.join(common, "packed-refs"), { optional: true });
  const matches = (packed?.bytes.toString("utf8").split("\n") ?? []).filter(line => line.endsWith(` ${reference}`));
  if (matches.length > 1 || (matches.length && !/^[0-9a-f]{40} refs\//u.test(matches[0]))) fail("selected_git_reference_unsupported");
  return matches.length ? matches[0].slice(0, 40) : null;
}

function assertObjects(common) {
  physicalDirectory(path.join(common, "objects"));
  for (const relative of ["objects/info/alternates", "objects/info/http-alternates", "shallow", "info/grafts"]) {
    const value = safeFile(path.join(common, relative), { optional: true });
    if (value?.bytes.length) fail("selected_git_object_source_unsupported");
  }
}

function normalizeCall(root, args) {
  if (!Array.isArray(args) || !args.length || args.some(arg => typeof arg !== "string" || arg.includes("\0"))) fail("selected_git_arguments_invalid");
  let directory = path.resolve(root), i = 0, configurationOverride = false;
  const prefix = [];
  while (i < args.length) {
    if (["--no-replace-objects", "--no-optional-locks"].includes(args[i])) { i++; continue; }
    if (args[i] === "--literal-pathspecs") { prefix.push(args[i]); i++; continue; }
    if (args[i] === "-C" && args[i + 1]) { directory = path.resolve(directory, args[i + 1]); i += 2; continue; }
    if (args[i] === "-c" && (/^(?:user\.name|user\.email|init\.defaultBranch)=/u.test(args[i + 1] ?? "") || args[i + 1] === "commit.gpgsign=false")) {
      configurationOverride = true; prefix.push(args[i], args[i + 1]); i += 2; continue;
    }
    break;
  }
  if (!args[i] || args[i].startsWith("-")) fail("selected_git_escape_refused");
  return { root: physicalDirectory(directory), args: args.slice(i), prefix, configurationOverride };
}

function gitEnvironment(empty, source = {}, fixture = false) {
  const environment = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: path.dirname(empty),
    XDG_CONFIG_HOME: path.dirname(empty), LC_ALL: "C", LANG: "C", TZ: "UTC", GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_SYSTEM: empty, GIT_CONFIG_GLOBAL: empty,
    GIT_CONFIG_COUNT: "0", GIT_ATTR_NOSYSTEM: "1", GIT_OPTIONAL_LOCKS: "0", GIT_NO_REPLACE_OBJECTS: "1" };
  if (fixture) for (const key of ["HOME", "TMPDIR", "TMP", "TEMP", "SystemRoot", "WINDIR"])
    if (typeof source[key] === "string") environment[key] = source[key];
  return environment;
}

function safeFile(file, { optional = false, maximum = 1024 * 1024, executable = false } = {}) {
  let stat;
  try { stat = lstatSync(file); } catch (error) { if (optional && error.code === "ENOENT") return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || (!executable && stat.nlink !== 1) || realpathSync(file) !== file ||
      stat.size > maximum || (executable && !(stat.mode & 0o111))) fail("selected_git_unsafe_file");
  const bytes = readFileSync(file), after = lstatSync(file);
  const metadata = value => ({ device: String(value.dev), inode: String(value.ino), mode: String(value.mode),
    uid: String(value.uid), gid: String(value.gid), links: String(value.nlink), size: value.size,
    mtime: value.mtimeMs, ctime: value.ctimeMs });
  if (hash(metadata(stat)) !== hash(metadata(after))) fail("selected_git_observation_race");
  return { bytes, identity: { ...metadata(after), sha256: hash(bytes) } };
}
function fileIdentity(file, options = {}) { return safeFile(file, { maximum: options.executable ? 64 * 1024 * 1024 : 32 * 1024 * 1024, ...options }).identity; }
function safetyIdentity(value) { return Object.fromEntries(["device", "mode", "uid", "gid", "links"].map(key => [key, value[key]])); }
function physicalDirectory(directory) { if (!path.isAbsolute(directory) || realpathSync(directory) !== directory || !lstatSync(directory).isDirectory()) fail("selected_git_unsafe_directory"); return directory; }
function directoryIdentity(directory) { const stat = lstatSync(physicalDirectory(directory)); return [String(stat.dev), String(stat.ino), String(stat.mode), String(stat.uid), String(stat.gid)]; }
function physicalExecutable(file) { const resolved = realpathSync(file); fileIdentity(resolved, { executable: true }); return resolved; }
function writeImmutable(file, bytes) { writeFileSync(file, bytes, { flag: "wx", mode: 0o400 }); chmodSync(file, 0o400); }
function quoteConfig(value) { return '"' + value.replaceAll("\\", "\\\\").replaceAll('"', '\\"') + '"'; }
function walkFiles(directory) { return readdirSync(directory).sort().flatMap(name => { const file = path.join(directory, name); return lstatSync(file).isDirectory() ? walkFiles(file) : [file]; }); }
function own(state) { const context = Object.freeze({ contract: SELECTED_GIT_CONTRACT }); states.set(context, state); return context; }
function requireState(context) { const state = states.get(context); if (!state) fail("selected_git_context_not_owned"); return state; }
function completed(output, options) { const value = options.encoding && options.encoding !== "buffer" ? output : Buffer.from(output); return { status: 0, signal: null, error: undefined, stdout: value, stderr: typeof value === "string" ? "" : Buffer.alloc(0), pid: null, output: [null, value, null] }; }

// A selected PATH shim calls this exact source with its private manifest. The
// manifest is execution state; sanitized retained evidence never contains paths.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!/^[0-9a-f]{64}$/u.test(process.env[SELECTED_GIT_MANIFEST_HASH_ENV] ?? "")) fail("selected_git_shim_arguments_invalid");
    const context = loadSelectedGit(process.env[SELECTED_GIT_MANIFEST_ENV], process.env[SELECTED_GIT_MANIFEST_HASH_ENV]);
    const result = withSelectedGit(context, () => selectedGitResult(process.cwd(), process.argv.slice(2), { stdio: ["inherit", "pipe", "pipe"], maxBuffer: process.argv.slice(2).includes("archive") ? 150_000_000 : 32 * 1024 * 1024, timeout: 30_000 }));
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exitCode = result.error || result.signal ? 1 : result.status ?? 1;
  } catch (error) { process.stderr.write(`${error?.code ?? "selected_git_refused"}\n`); process.exitCode = 1; }
}
