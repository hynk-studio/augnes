import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  beginCanonicalTestResourceUse, buildCanonicalChildEnvironment,
  cleanupCanonicalTestResources, createCanonicalTestResourceRoot, settleCanonicalTestResourceUse,
} from "../canonical-test-environment.mjs";
import { canonicalChildAcceptanceFailure, runCanonicalChild } from "../canonical-child-runner.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const foreignSection = '[branch "fixture/other"]\n\tremote = origin\n\tmerge = refs/heads/fixture/other\n';
const quiet = { write() {} };
const write = (file, value) => writeFileSync(file, value, { mode: 0o600 });

function fixture() {
  const owner = createCanonicalTestResourceRoot("ag-resource-test-");
  const root = owner.root, anchor = path.join(root, "anchor"), checkout = path.join(root, "checkout");
  const env = buildCanonicalChildEnvironment({ temporaryRoot: root });
  mkdirSync(env.HOME, { recursive: true });
  const emptyConfig = path.join(root, "empty-gitconfig"); write(emptyConfig, "");
  // These overrides isolate only setup/read commands in the synthetic fixture.
  // The production observer receives its own ordinary, filtered environment.
  const gitEnv = { ...env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_SYSTEM: emptyConfig, GIT_CONFIG_GLOBAL: emptyConfig };
  const git = (cwd, args, expected = 0) => {
    const result = spawnSync("git", ["--no-replace-objects", "-C", cwd, ...args], {
      env: gitEnv, encoding: "utf8", timeout: 5000, maxBuffer: 1024 * 1024,
    });
    assert.equal(result.error, undefined); assert.equal(result.signal, null);
    assert.equal(result.status, expected, `synthetic git ${args[0]}: ${result.stderr}`);
    return result.stdout.trimEnd();
  };
  mkdirSync(anchor);
  git(anchor, ["init", "--quiet", "--initial-branch=main"]);
  const config = path.join(anchor, ".git", "config");
  const initial = '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n' +
    '[remote "origin"]\n\turl = https://example.invalid/fixture.git\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n' +
    '[branch "main"]\n\tremote = origin\n\tmerge = refs/heads/main\n' +
    '[branch "fixture/current"]\n\tremote = origin\n\tmerge = refs/heads/main\n';
  write(config, initial);
  write(path.join(anchor, "fixture.txt"), "synthetic Git input fixture\n");
  git(anchor, ["add", "fixture.txt"]);
  git(anchor, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  git(anchor, ["branch", "fixture/other"]);
  git(anchor, ["worktree", "add", "--quiet", "-b", "fixture/current", checkout, "HEAD"]);
  git(anchor, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  assert.equal(readFileSync(config, "utf8"), initial);
  assert.equal(git(checkout, ["rev-parse", "--git-common-dir"]), path.join(anchor, ".git"));
  return { owner, root, anchor, checkout, config, initial, env, gitEnv, git, roots: [checkout, anchor], childInFlight: false };
}

function resource(api, f) {
  const expected = { id: "git-config", file: f.config, classification: "execution",
    gitTracking: { policy: "isolated-current-branches-v1", protected_branches: [...new Set(f.roots.map(root => sha(f.git(root, ["symbolic-ref", "--short", "HEAD"]))))].sort() },
    gitRoots: f.roots };
  // The predecessor has the stable freeze/observe API but no new constructor.
  // Give both implementations the identical real-root-derived declaration so
  // its negative result is classification behavior, never a missing import.
  if (!api.createGitTrackingResource) return expected;
  const actual = api.createGitTrackingResource(f.config, f.roots);
  assert.deepEqual(actual, expected, "candidate and predecessor witness resource must be identical");
  return actual;
}

async function child(f, options) {
  f.childInFlight = true;
  const result = await runCanonicalChild({ suite: "git-input", command: process.execPath, cwd: f.checkout,
    env: f.env, timeoutMs: 5000, termGraceMs: 500, killGraceMs: 500, stdout: quiet, stderr: quiet, log() {}, ...options });
  f.childInFlight = !(result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0);
  assert.equal(f.childInFlight, false, "owned Git input child must settle");
  return result;
}

const fixedCommands = [
  ["rev-parse", "HEAD"], ["rev-parse", "HEAD^{tree}"], ["symbolic-ref", "--short", "HEAD"],
  ["remote", "get-url", "origin"], ["status", "--porcelain", "--untracked-files=normal"],
  ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
];

async function witness(api, f, modulePath) {
  const r = resource(api, f);
  const frozen = api.freezeInputContract({ resources: [r], pathKind: "isolated-model-free-v1", binding: { fixture: "git-tracking" } });
  const before = frozen.snapshot(), controller = new AbortController();
  const monitor = api.monitorInputContract(frozen, controller, { intervalMs: 1000 });
  const barrier = path.join(f.root, "read-after-mutation");
  let output = "", changed = false;
  const script = `
    const {execFileSync}=require('node:child_process'),{existsSync}=require('node:fs');
    const commands=${JSON.stringify(fixedCommands)},env=${JSON.stringify(f.gitEnv)};
    const read=()=>commands.map(args=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8',env,timeout:2000}));
    console.log(JSON.stringify({phase:'before',values:read()}));
    const timer=setInterval(()=>{if(existsSync(${JSON.stringify(barrier)})){clearInterval(timer);console.log(JSON.stringify({phase:'after',values:read()}));}},10);
  `;
  let result;
  try {
    result = await child(f, { label: "foreign tracking witness", args: ["-e", script], signal: controller.signal,
      stdout: { write(chunk) {
        output += chunk;
        if (!changed && output.includes("\n")) {
          changed = true; write(f.config, f.initial + foreignSection); monitor.check(); write(barrier, "continue\n");
        }
      } } });
  } finally { monitor.stop(); }
  const evidence = frozen.snapshot();
  assert(changed, "consumer must read before the real config mutation");
  assert.notEqual(sha(readFileSync(f.config)), before.resources[0].before.sha256);
  console.log(JSON.stringify({ git_input_witness: true, first_fault: evidence.first_fault?.disposition ?? null,
    child: result, raw_changed: true, source_contract: before.contract }));
  assert.equal(evidence.first_fault, null, "foreign tracking-only append must not invalidate a proven fixed consumer");
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: "git-input", timeoutMs: 5000, requireNaturalExit: true }), null);
  const values = output.trim().split("\n").map(line => JSON.parse(line));
  assert.deepEqual(values.map(value => value.phase), ["before", "after"]);
  assert.deepEqual(values[0].values, values[1].values);
  const current = api.freezeInputContract({ resources: [resource(api, f)], pathKind: "isolated-model-free-v1", binding: { fixture: "git-tracking" } }).snapshot();
  assert.equal(api.digest(api.commonInputResources(before)), api.digest(api.commonInputResources(current)));
  assert.equal(api.digest(api.commonInputResources(JSON.parse(JSON.stringify(before)))), api.digest(api.commonInputResources(current)));
  assert.equal(Object.hasOwn(before.resources[0], "gitRoots"), false, "private roots must not persist");
  assert.equal(JSON.stringify(evidence).includes(f.root), false, "private paths must not persist");
  const packet = path.join(f.root, "fresh-observations.json"); write(packet, JSON.stringify({ before, current }));
  const fresh = await child(f, { label: "fresh Git input reconstruction", args: ["--input-type=module", "-e", `
    import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
    import {commonInputResources,digest,classifyInputChange,nonFaultInputChange} from ${JSON.stringify(pathToFileURL(modulePath).href)};
    const {before,current}=JSON.parse(readFileSync(${JSON.stringify(packet)},'utf8'));
    assert.equal(digest(commonInputResources(before)),digest(commonInputResources(current)));
    const r=before.resources[0];
    assert(nonFaultInputChange(classifyInputChange(r.before,current.resources[0].before,r,before)));
  `] });
  assert.equal(canonicalChildAcceptanceFailure(fresh, { suite: "git-input", timeoutMs: 5000, requireNaturalExit: true }), null);
  return { before, current, evidence };
}

async function controls(api, f, modulePath) {
  const findings = [];
  const validatedResource = resource(api, f);
  const reset = () => { write(f.config, f.initial); chmodSync(f.config, 0o600); };
  // Every production read still validates both roots before and after I/O.
  // Reuse only the already proven declaration, not an observation or result.
  const freeze = (r = validatedResource, extra = {}) => api.freezeInputContract({ resources: [r],
    pathKind: "isolated-model-free-v1", binding: { fixture: "git-tracking-controls" }, ...extra });
  const refusal = (name, mutate, expected = "input_invalidation") => {
    reset(); const frozen = freeze(); mutate(); const fault = frozen.check({ force: true });
    assert.equal(fault?.disposition, expected, name);
    assert.equal(JSON.stringify(frozen.snapshot()).includes("synthetic-credential-marker"), false, "credential marker must not persist");
    findings.push(name);
  };
  reset(); const unchanged = freeze(); assert.equal(unchanged.check({ force: true }), null);
  findings.push("identical configuration remains unchanged");
  for (const name of ["main", "fixture/current"]) {
    refusal(`protected ${name} tracking changed`, () => write(f.config, f.initial.replace(
      `[branch "${name}"]\n\tremote = origin\n\tmerge = refs/heads/main`,
      `[branch "${name}"]\n\tremote = other\n\tmerge = refs/heads/other`)));
  }
  for (const [name, suffix] of [
    ["origin URL", '[remote "origin"]\n\turl = https://example.invalid/changed.git\n'],
    ["origin push URL", '[remote "origin"]\n\tpushurl = https://example.invalid/push.git\n'],
    ["origin fetch", '[remote "origin"]\n\tfetch = +refs/heads/other:refs/remotes/origin/other\n'],
    ["URL rewrite", '[url "https://example.invalid/rewrite/"]\n\tinsteadOf = https://example.invalid/\n'],
    ["current pushRemote", '[branch "fixture/current"]\n\tpushRemote = other\n'],
    ["current rebase", '[branch "fixture/current"]\n\trebase = true\n'],
    ["credential helper", '[credential]\n\thelper = synthetic-credential-marker\n'],
    ["HTTP authority header", '[http]\n\textraHeader = synthetic-credential-marker\n'],
    ["SSH command", '[core]\n\tsshCommand = synthetic-credential-marker\n'],
    ["hooks path", '[core]\n\thooksPath = synthetic-credential-marker\n'],
    ["unknown key", '[unknown]\n\tvalue = synthetic-marker\n'],
    ["comment outside exempt block", '# added comment remains bound\n'],
  ]) refusal(`${name} delta remains binding`, () => write(f.config, f.initial + suffix));
  refusal("mixed foreign tracking plus authority delta remains binding", () => write(f.config,
    f.initial + foreignSection + '[credential]\n\thelper = synthetic-credential-marker\n'));

  const includeTarget = path.join(f.root, "included-config"); write(includeTarget, '[fixture]\n\tvalue = included\n');
  for (const [name, suffix] of [
    ["include", `[include]\n\tpath = ${includeTarget}\n`],
    ["includeIf gitdir", `[includeIf "gitdir:${f.anchor}/"]\n\tpath = ${includeTarget}\n`],
    ["includeIf gitdir/i", `[includeIf "gitdir/i:${f.anchor}/"]\n\tpath = ${includeTarget}\n`],
    ["includeIf onbranch", `[includeIf "onbranch:fixture/current"]\n\tpath = ${includeTarget}\n`],
    ["includeIf hasconfig", `[includeIf "hasconfig:remote.*.url:https://example.invalid/**"]\n\tpath = ${includeTarget}\n`],
  ]) {
    refusal(`${name} addition remains binding`, () => write(f.config, f.initial + suffix));
    write(f.config, f.initial + suffix);
    const r = api.createGitTrackingResource(f.config, f.roots);
    assert.equal(Object.hasOwn(r, "gitTracking"), false, `${name} must not acquire the exemption`);
    const frozen = freeze(r); write(f.config, f.initial + suffix + foreignSection);
    assert.equal(frozen.check({ force: true })?.disposition, "input_invalidation", `${name} path stays strict`);
  }
  findings.push("include and conditional include presence retain strict comparison");

  const extension = '[extensions]\n\tworktreeConfig = true\n';
  refusal("enabling worktree configuration changes the frozen input", () => write(f.config, f.initial + extension));
  write(f.config, f.initial + extension);
  const extendedRole = resource(api, f), extended = freeze(extendedRole);
  write(f.config, f.initial + extension + foreignSection);
  assert.equal(extended.check({ force: true }), null, "proven worktree config bindings retain the narrow common-file projection");
  for (const [name, root] of [["task", f.checkout], ["anchor", f.anchor]]) {
    const worktreeFile = path.resolve(root, f.git(root, ["rev-parse", "--git-path", "config.worktree"]));
    assert(worktreeFile.startsWith(f.root + path.sep));
    assert.equal(existsSync(worktreeFile), false);
    try {
      write(f.config, f.initial + extension);
      const appearance = freeze(extendedRole); write(worktreeFile, '[fixture]\n\tvalue = first\n');
      assert.equal(appearance.check()?.disposition, "input_invalidation", `${name} worktree file appearance`);
      const content = freeze(extendedRole); write(worktreeFile, foreignSection);
      assert.equal(content.check()?.disposition, "input_invalidation", `${name} worktree file content`);
      const tracking = freeze(extendedRole); write(worktreeFile, foreignSection.replace("refs/heads/fixture/other", "refs/heads/other"));
      assert.equal(tracking.check()?.disposition, "input_invalidation", `${name} worktree tracking bytes are not masked`);
      const permission = freeze(extendedRole); chmodSync(worktreeFile, 0o644);
      assert.equal(permission.check()?.disposition, "input_invalidation", `${name} worktree file permissions`);
      chmodSync(worktreeFile, 0o600); const removal = freeze(extendedRole); rmSync(worktreeFile);
      assert.equal(removal.check()?.disposition, "input_invalidation", `${name} worktree file removal`);
      write(worktreeFile, `[include]\n\tpath = ${includeTarget}\n`);
      const included = api.createGitTrackingResource(f.config, f.roots);
      assert.equal(Object.hasOwn(included, "gitTracking"), false, `${name} worktree includes remain unsupported`);
      const strict = freeze(included); write(f.config, f.initial + extension + foreignSection);
      assert.equal(strict.check()?.disposition, "input_invalidation", `${name} worktree include path stays strict`);
    } finally { rmSync(worktreeFile, { force: true }); }
    findings.push(`${name} config.worktree appearance/content/tracking/permissions/removal bind; includes disable exemption`);
  }
  write(f.config, f.initial + extension + '[extensions]\n\tobjectFormat = sha1\n');
  assert.equal(Object.hasOwn(api.createGitTrackingResource(f.config, f.roots), "gitTracking"), false,
    "other repository extensions are not enabled by worktreeConfig support");
  findings.push("known worktreeConfig support preserves whole per-worktree observations and refuses other extensions");

  for (const [name, suffix] of [
    ["duplicate branch sections", '[branch "fixture/other"]\n\tremote = origin\n[branch "fixture/other"]\n\tmerge = refs/heads/fixture/other\n'],
    ["duplicate tracking keys", foreignSection.replace("remote = origin", "remote = origin\n\tremote = other")],
    ["unsupported branch key", foreignSection + '\tdescription = unknown\n'],
    ["old dotted branch syntax", '[branch.fixture/other]\n\tremote = origin\n\tmerge = refs/heads/fixture/other\n'],
    ["escaped branch syntax", '[branch "fixture/oth\\er"]\n\tremote = origin\n\tmerge = refs/heads/fixture/other\n'],
    ["continued value", foreignSection.replace("remote = origin", "remote = ori\\\ngin")],
    ["unterminated section", '[branch "fixture/other"\n\tremote = origin\n'],
    ["invalid UTF-8", Buffer.from([0xff, 0x0a])],
  ]) refusal(`${name} cannot create an exemption`, () => write(f.config,
    Buffer.isBuffer(suffix) ? Buffer.concat([Buffer.from(f.initial), suffix]) : f.initial + suffix));

  refusal("permission change remains safety-relevant", () => chmodSync(f.config, 0o644), "safety_violation");
  reset(); const linked = freeze(), alias = path.join(f.root, "config-hardlink");
  try { linkSync(f.config, alias); assert.equal(linked.check()?.disposition, "observer_failure"); }
  finally { rmSync(alias); }
  reset(); const symlinked = freeze(), realConfig = path.join(f.root, "config-real");
  renameSync(f.config, realConfig);
  try { symlinkSync(realConfig, f.config); assert.equal(symlinked.check()?.disposition, "observer_failure"); }
  finally { rmSync(f.config); renameSync(realConfig, f.config); }
  reset(); const deleted = freeze(); rmSync(f.config);
  assert.equal(deleted.check()?.disposition, "input_invalidation"); reset();
  findings.push("mode, link, symlink and presence controls preserve safety/refusal");

  for (const [name, args] of [
    ["all local config", ["config", "--local", "--list"]],
    ["branch regexp", ["config", "--local", "--get-regexp", "^branch\\."]],
    ["all branch upstreams", ["for-each-ref", "--format=%(refname) %(upstream)", "refs/heads"]],
    ["verbose branches", ["branch", "-vv"]],
  ]) {
    reset(); const frozen = freeze({ id: "git-config", file: f.config, classification: "execution" });
    const before = f.git(f.checkout, args); write(f.config, f.initial + foreignSection);
    const after = f.git(f.checkout, args); assert.notEqual(after, before, `${name} positive consumption control`);
    assert.equal(frozen.check()?.disposition, "input_invalidation", `${name} stays a broad consuming role`);
  }
  findings.push("real config-list/branch-regexp/for-each-ref/branch-vv consumers detect foreign tracking and stay binding");

  let legacyPair;
  for (const [name, extra, mutateRole] of [
    ["unmarked v3", {}, r => { const { gitTracking, gitRoots, ...plain } = r; return plain; }],
    ["legacy v2", { contract: api.LEGACY_INPUT_CONTRACT }, r => r],
    ["canonical conservative", { pathKind: "canonical-conservative-v1" }, r => r],
  ]) {
    reset(); let frozen;
    try { frozen = freeze(mutateRole(resource(api, f)), extra); }
    catch (error) { assert.match(error.code ?? error.message, /git|role|unproven|contract/u, name); findings.push(`${name} marker refused at freeze`); continue; }
    const before = frozen.snapshot(); write(f.config, f.initial + foreignSection);
    assert.equal(frozen.check()?.disposition, "input_invalidation", name);
    if (name === "unmarked v3") legacyPair = { before, after: frozen.snapshot().events[0].after };
    findings.push(`${name} comparison remains conservative`);
  }
  reset(); const branchFrozen = freeze(); f.git(f.checkout, ["checkout", "--quiet", "--detach"]);
  assert.equal(api.nonFaultInputChange(branchFrozen.check()?.disposition), false, "selected branch identity is bound");
  f.git(f.checkout, ["checkout", "--quiet", "fixture/current"]);
  findings.push("selected branch change cannot reuse the frozen scope");
  reset(); const anchorFrozen = freeze(); f.git(f.anchor, ["checkout", "--quiet", "--detach"]);
  assert.equal(api.nonFaultInputChange(anchorFrozen.check()?.disposition), false, "anchor branch identity is bound");
  f.git(f.anchor, ["checkout", "--quiet", "main"]);
  findings.push("anchor branch change cannot reuse the frozen scope");

  reset();
  const malformed = { ...validatedResource, gitTracking: { ...validatedResource.gitTracking,
    protected_branches: [validatedResource.gitTracking.protected_branches] } };
  assert.throws(() => freeze(malformed), /input_git_role_unproven/u);
  const valid = freeze().snapshot(), observation = valid.resources[0].before;
  for (const key of ["scope_fingerprint", "effective_sha256"]) {
    const after = structuredClone(observation); after.git_projection[key] = [after.git_projection[key]];
    assert.equal(api.classifyInputChange(observation, after, validatedResource, valid), "unknown_relevance", `${key} rejects array coercion`);
  }
  const changedScope = structuredClone(observation); changedScope.git_projection.scope_fingerprint = "0".repeat(64);
  assert.equal(api.classifyInputChange(observation, changedScope, validatedResource, valid), "input_invalidation");
  findings.push("malformed branch/hash arrays refuse and changed external scope fingerprint binds");

  // Only this fixture's owned HOME is selected. The real user's files and
  // system/Apple defaults are never modified by these controls.
  const priorHome = process.env.HOME, priorXdg = process.env.XDG_CONFIG_HOME;
  const globalConfig = path.join(f.env.HOME, ".gitconfig"), privateXdg = path.join(f.root, "private-xdg");
  mkdirSync(privateXdg);
  try {
    process.env.HOME = f.env.HOME; process.env.XDG_CONFIG_HOME = privateXdg;
    reset(); write(globalConfig, '[fixture]\n\tvalue = original\n');
    const globalContent = freeze(); write(globalConfig, '[fixture]\n\tvalue = changed\n');
    assert.equal(globalContent.check()?.disposition, "input_invalidation");
    const globalMode = freeze(); chmodSync(globalConfig, 0o644);
    assert.equal(globalMode.check()?.disposition, "input_invalidation"); chmodSync(globalConfig, 0o600);
    rmSync(globalConfig); const globalAppearance = freeze(); write(globalConfig, '[fixture]\n\tvalue = new\n');
    assert.equal(globalAppearance.check()?.disposition, "input_invalidation");
    write(globalConfig, `[includeIf "onbranch:fixture/current"]\n\tpath = ${includeTarget}\n`);
    const globalIncludeRole = api.createGitTrackingResource(f.config, f.roots);
    assert.equal(Object.hasOwn(globalIncludeRole, "gitTracking"), false);
    const globalInclude = freeze(globalIncludeRole); write(f.config, f.initial + foreignSection);
    assert.equal(globalInclude.check()?.disposition, "input_invalidation");
  } finally {
    rmSync(globalConfig, { force: true });
    if (priorHome === undefined) delete process.env.HOME; else process.env.HOME = priorHome;
    if (priorXdg === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = priorXdg;
  }
  findings.push("owned ordinary HOME global content, permissions and appearance bind; global includeIf disables exemption");

  for (const [key, value] of [["GIT_CONFIG_COUNT", "0"], ["GIT_CONFIG_GLOBAL", includeTarget], ["GIT_CONFIG_SYSTEM", includeTarget]]) {
    reset(); const before = process.env[key];
    try { process.env[key] = value;
      assert.equal(Object.hasOwn(api.createGitTrackingResource(f.config, f.roots), "gitTracking"), false, `${key} prevents narrow role`);
    } finally { if (before === undefined) delete process.env[key]; else process.env[key] = before; }
  }
  findings.push("Git config overrides cannot acquire the narrow role");
  assert(legacyPair);
  const packet = path.join(f.root, "fresh-unmarked-observations.json"); write(packet, JSON.stringify(legacyPair));
  const fresh = await child(f, { label: "fresh unmarked Git comparison", args: ["--input-type=module", "-e", `
    import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
    import {classifyInputChange,commonInputResources,digest} from ${JSON.stringify(pathToFileURL(modulePath).href)};
    const {before,after}=JSON.parse(readFileSync(${JSON.stringify(packet)},'utf8')),resource=before.resources[0];
    assert.equal(classifyInputChange(resource.before,after,resource,before),'input_invalidation');
    const current={...before,resources:[{...resource,before:after}]};
    assert.notEqual(digest(commonInputResources(before)),digest(commonInputResources(current)));
  `] });
  assert.equal(canonicalChildAcceptanceFailure(fresh, { suite: "git-input", timeoutMs: 5000, requireNaturalExit: true }), null);
  findings.push("fresh stock-facing comparison retains old unmarked v3 strict identity");
  return findings;
}

export async function runGitInputControls(api, { witnessOnly = false, modulePath = fileURLToPath(new URL("../local-canonical-inputs.mjs", import.meta.url)) } = {}) {
  const f = fixture(), findings = [];
  beginCanonicalTestResourceUse(f.owner);
  try {
    await witness(api, f, modulePath);
    findings.push("real linked-worktree fixed consumer survives foreign tracking append; raw observations retained");
    if (!witnessOnly) {
      assert.equal(typeof api.createGitTrackingResource, "function");
      findings.push(...await controls(api, f, modulePath));
    }
  } finally {
    if (!f.childInFlight) settleCanonicalTestResourceUse(f.owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const [cleanup] = cleanupCanonicalTestResources([f.owner]);
    assert.equal(cleanup.completed, true, JSON.stringify(cleanup));
    assert.equal(existsSync(f.root), false);
  }
  return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv[2], "--witness"); assert.equal(process.argv.length, 4);
  const api = await import(pathToFileURL(path.resolve(process.argv[3])).href);
  const findings = await runGitInputControls(api, { witnessOnly: true, modulePath: path.resolve(process.argv[3]) });
  console.log(JSON.stringify({ status: "pass", checks: findings, cleanup_complete: true }));
}
