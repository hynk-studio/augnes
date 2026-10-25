import { fileURLToPath } from "node:url";
import { initializeOwnedChildLifecycleFile, readOwnedChildLifecycleFile, withOwnedSyncLifecycle, runOwnedSyncChild,
  inheritedOwnedChildLifecycleAncestors, OWNED_CHILD_ANCESTORS_ENV } from "./test-harness-process-lifecycle.mjs";
import { withCompanionProcessProbe } from "../plugins/augnes-operator/mcp/companion-service-core.mjs";
import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { codexConfigurationSourceFiles, observeNativeConfigurationInput, nativeConfigurationFixtureRoot,
  assertNativeConfigurationSelection, selectedNativeFixtureRoots, NATIVE_CONFIGURATION_CONTRACT, NATIVE_FIXTURE_ROOTS_ENV } from "../lib/vnext/native-host/codex-configuration-sources.mjs";
import { digest, observeInputFile } from "./local-canonical-inputs.mjs";
import { auditSelectedConsumers, SELECTED_CONSUMER_MANIFEST } from "./local-canonical-selected-consumers.mjs";
import { initializeSelectedGit, withSelectedGit, selectedGitResources, selectedGitEvidence,
  assertSelectedGit, selectedGitEnvironment, selectedGitRetainedInputs } from "./local-canonical-selected-git.mjs";

export const SELECTED_EXECUTION_CONTRACT = "augnes.local-canonical-selected-execution.v1";
export const SELECTED_EXECUTION_ENV = "AUGNES_CANONICAL_SELECTED_INPUTS";
const scope = new AsyncLocalStorage();
const owners = new WeakMap();
const fail = code => { throw Object.assign(new Error(code), { code }); };
const implementationRoot = fileURLToPath(new URL("../", import.meta.url));
// Only these source-owned invocations occur in the selected workload. Reject
// abbreviations as well as full npm config overrides; npm accepts both.
const NPM_ARGUMENT_SETS = [["--version"], ["ci", "--no-audit", "--no-fund"],
  ["run", "build"], ["run", "typecheck"], ["run", "typegen"], ["test"], ["run", "test:authority"],
  ["run", "test:integration"], ["run", "test:operability"], ["config", "get", "userconfig"]];
const NPM_GUARD = 'case "$*" in\n  "--version"|"ci --no-audit --no-fund"|"run build"|"run typecheck"|"run typegen"|"test"|"run test:authority"|"run test:integration"|"run test:operability"|"config get userconfig") ;;\n  *) exit 126 ;;\nesac\n';
const LIVE_TRANSPORT_KEYS = ["HOME", "USERPROFILE", "PATH", "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL",
  "GH_TOKEN", "GITHUB_TOKEN", "GH_CONFIG_DIR", "XDG_CONFIG_HOME", "GH_HOST", "HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY", "NO_PROXY",
  "https_proxy", "http_proxy", "all_proxy", "no_proxy", "SSL_CERT_FILE", "SSL_CERT_DIR"];
function liveTransportEnvironment() {
  return Object.fromEntries(LIVE_TRANSPORT_KEYS.filter(k => process.env[k] !== undefined).map(k => [k,process.env[k]]));
}
const SELECTED_KEYS = [SELECTED_EXECUTION_ENV, `${SELECTED_EXECUTION_ENV}_SHA256`, NATIVE_FIXTURE_ROOTS_ENV,
  "AUGNES_CANONICAL_SELECTED_GIT_MANIFEST", "AUGNES_CANONICAL_SELECTED_GIT_SHA256",
  "GIT_CONFIG_NOSYSTEM", "GIT_CONFIG_SYSTEM", "GIT_CONFIG_GLOBAL", "GIT_TERMINAL_PROMPT",
  "npm_config_userconfig", "npm_config_globalconfig", "npm_config_script_shell",
  "npm_config_cache", "npm_config_devdir", "AUGNES_CANONICAL_CHILD_LEDGER",
  "AUGNES_CANONICAL_CHILD_LEDGER_PATH", "AUGNES_CANONICAL_CHILD_LEDGER_IDENTITY", OWNED_CHILD_ANCESTORS_ENV];

export function resolveSelectedTool(name, environment = process.env) {
  if (!/^[a-z0-9_-]+$/u.test(name)) fail("selected_tool_name_invalid");
  for (const directory of (environment.PATH ?? "").split(path.delimiter)) {
    if (!path.isAbsolute(directory)) continue;
    const file = path.join(directory, name);
    try {
      const resolved = realpathSync(file), stat = lstatSync(resolved);
      if (stat.isFile() && (stat.mode & 0o111)) return resolved;
    } catch {}
  }
  fail("selected_tool_unavailable");
}

// The ordinary native controls use owned temporary source/snapshot roots. Only
// their external ancestors and fixed system sources are frozen here. A native
// call naming another external source refuses before reading it.
export function selectNativeConfigurationInputs({ privateRoot, environment, inherited = null, inheritedEnvironment = process.env }) {
  if (inherited) assertNativeConfigurationSelection(inherited.native_configuration);
  const roots = inherited ? selectedNativeFixtureRoots(inheritedEnvironment, inherited.native_configuration) : [];
  const own = nativeConfigurationFixtureRoot(privateRoot);
  const fixtureRoots = [...roots.filter(r => r.root !== own.root), own];
  const inside = file => fixtureRoots.some(r => file === r.root || file.startsWith(r.root + path.sep));
  const home = path.resolve(environment.HOME ?? path.join(privateRoot, "home"));
  const codexHome = path.resolve(environment.CODEX_HOME ?? path.join(home, ".codex"));
  const files = codexConfigurationSourceFiles({ home, codexHome, roots: [privateRoot] }).filter(file => !inside(file));
  const prior = inherited?.native_configuration.external_sources ?? [];
  if (prior.some(r => inside(r.file)) || (inherited && files.some(file => !prior.some(r => r.file === file))))
    fail("native_configuration_parent_inventory_changed");
  const selection = { schema: NATIVE_CONFIGURATION_CONTRACT, fixture_roots: fixtureRoots,
    external_sources: (inherited ? prior : files.map(file => ({ id: `native-config-${digest(file).slice(0, 24)}`, file,
      classification: "safety", nativeConfiguration: true, before: observeNativeConfigurationInput(file) }))) };
  assertNativeConfigurationSelection(selection);
  return selection;
}

// This is an execution-input selector for the audited model-free path, not an
// OS sandbox. Native tools and installed Companion observation remain explicit
// live boundaries. No account configuration or credentials are copied here.
export function initializeSelectedExecution({ repositoryRoot, temporaryRoot, environment }) {
  if (process.platform !== "darwin" && process.platform !== "linux") fail("selected_execution_host_unsupported");
  const root = realpathSync(repositoryRoot), privateRoot = realpathSync(temporaryRoot);
  const consumerMap = auditSelectedConsumers();
  const directory = path.join(privateRoot, "selected-inputs");
  mkdirSync(directory, { mode: 0o700 });
  const bin = path.join(directory, "bin"); mkdirSync(bin, { mode: 0o700 });
  if (process.env.NODE_OPTIONS || process.execArgv.some(arg => /^(?:--(?:require|import|loader|experimental-loader|inspect)|-r$)/u.test(arg))) fail("selected_node_bootstrap_override_refused");
  const ledgerFile = path.join(directory, "owned-children.jsonl");
  const ledger = initializeOwnedChildLifecycleFile(ledgerFile);
  const inherited = readInheritedSelection(process.env);
  const nativeConfiguration = selectNativeConfigurationInputs({ privateRoot, environment, inherited });
  const ledgerAncestors = inherited ? inheritedOwnedChildLifecycleAncestors(inherited.environment) : [];
  ledger.environment[OWNED_CHILD_ANCESTORS_ENV] = JSON.stringify(ledgerAncestors);
  const ledgerSelection = {file:ledgerFile,identity:ledger.identity,ancestors:ledgerAncestors};
  const tools = inherited?.tools ?? { node: realpathSync(process.execPath), git: resolveSelectedTool("git"),
    npm: resolveSelectedTool("npm"), gh: resolveSelectedTool("gh"), python3: resolveSelectedTool("python3"),
    sh: "/bin/sh", ps: "/bin/ps", tar: realpathSync("/usr/bin/tar") };
  if (!tools.npm.endsWith("/bin/npm-cli.js")) fail("selected_npm_cli_unsupported");
  const npmRoot = realpathSync(path.dirname(path.dirname(tools.npm)));
  const toolInputs = [...Object.entries(tools).map(([name,file]) => ({ id: `selected-${name}-executable`, file,
    classification: "execution", readOnlyExecutable: name !== "npm" })),
    { id: "selected-npm-package-tree", file: npmRoot, classification: "execution", readOnlyTree: true },
    { id: "selected-node-headers", file: path.join(path.dirname(path.dirname(tools.node)),"include","node"),classification:"execution",readOnlyTree:true},
    ...["/usr/bin/python3", "/bin/chmod", "/bin/ls", "/usr/bin/stat", "/usr/bin/make", "/usr/bin/c++",
      ...(process.platform==="darwin"?["/usr/bin/xattr","/usr/bin/clang","/usr/bin/sw_vers","/usr/bin/xcrun","/usr/bin/xcodebuild","/bin/launchctl"]:[])]
      .map((file,i)=>({id:`selected-platform-helper-${i}`,file:realpathSync(file),classification:"execution",readOnlyExecutable:true}))];
  // Observe before controller version/Git/npm operations, not merely at freeze.
  const initialTools = withOwnedSyncLifecycle(ledgerSelection,()=>toolInputs.map(r => ({ ...r, before: observeInputFile(r.file,r) })));
  const liveEnvironment = liveTransportEnvironment();
  const ghDirectory = path.resolve(liveEnvironment.GH_CONFIG_DIR ?? path.join(liveEnvironment.XDG_CONFIG_HOME ?? path.join(os.userInfo().homedir,".config"),"gh"));
  const liveResources = [
    { id: "selected-live-gh-hosts", file: path.join(ghDirectory,"hosts.yml"), classification: "safety", metadataOnly:true },
    { id: "selected-live-gh-config", file: path.join(ghDirectory,"config.yml"), classification: "safety" },
    ...["SSL_CERT_FILE"].filter(key => liveEnvironment[key]).map(key => ({id:`selected-live-${key.toLowerCase()}`,file:liveEnvironment[key],classification:"safety"})),
  ];
  if (liveEnvironment.SSL_CERT_DIR) fail("selected_transport_certificate_directory_unclassified");
  if (liveEnvironment.GH_HOST && liveEnvironment.GH_HOST !== "github.com") fail("selected_transport_host_override_refused");
  const initialLive = withOwnedSyncLifecycle(ledgerSelection,()=>liveResources.map(r => ({...r,before:observeInputFile(r.file,r)})));
  const generated = [];
  const create = (id, relative, content, mode = 0o400, kind = null) => {
    const file = path.join(directory, relative);
    writeFileSync(file, content, { flag: "wx", mode });
    generated.push({ id, file, classification: "execution", ...(kind ? { kind, source_generated: true } : {}) });
    return file;
  };
  const emptyGit = create("selected-empty-git-config", "git-empty.config", "", 0o400, "generated-git-config");
  const npmUser = create("selected-npm-user-config", "npm-user.config", "", 0o400, "empty-npm-config");
  const npmGlobal = create("selected-npm-global-config", "npm-global.config", "", 0o400, "empty-npm-config");
  const git = withOwnedSyncLifecycle(ledgerSelection,()=>initializeSelectedGit({ repositoryRoot: root, temporaryRoot: directory, gitExecutable: tools.git }));
  const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
  // PATH dispatch names select exact tools, including package lifecycle shells.
  // The Git dispatch preserves disposable-repository tests without redirecting
  // their GIT_DIR into the candidate's private read view.
  for (const [name, executable] of Object.entries(tools)) {
    if (name === "gh" || name === "ps") continue;
    const command = name === "npm" ? `${quote(tools.node)} ${quote(executable)}` :
      name === "git" ? `${quote(tools.node)} ${quote(fileURLToPath(new URL("./local-canonical-selected-git.mjs", import.meta.url)))}` :
      name === "sh" ? `${quote(tools.node)} ${quote(fileURLToPath(new URL("./local-canonical-selected-shell.mjs", import.meta.url)))}` :
      name === "python3" ? `${quote(tools.node)} ${quote(fileURLToPath(new URL("./local-canonical-selected-python.mjs", import.meta.url)))}` : quote(executable);
    create(`selected-tool-dispatch-${name}`, `bin/${name}`, `#!/bin/sh\n${name === "npm" ? NPM_GUARD : ""}exec ${command} "$@"\n`, 0o500, "generated-execution-wrapper");
  }
  const selectedEnvironment = {
    ...environment, ...ledger.environment, PATH: [bin, "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(path.delimiter),
    ...selectedGitEnvironment(git), GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_SYSTEM: emptyGit,
    GIT_CONFIG_GLOBAL: emptyGit, GIT_TERMINAL_PROMPT: "0",
    npm_config_userconfig: npmUser, npm_config_globalconfig: npmGlobal,
    npm_config_script_shell: path.join(bin,"sh"), npm_config_cache: path.join(privateRoot, "npm-cache"),
    npm_config_devdir: path.join(privateRoot, "node-gyp"), AUGNES_CANONICAL_CHILD_LEDGER: "1",
  };
  // A new immutable manifest owns this selection's complete inherited roots;
  // an older marker must not retain its parent's manifest fingerprint.
  delete selectedEnvironment[NATIVE_FIXTURE_ROOTS_ENV];
  const files = withOwnedSyncLifecycle(ledgerSelection,()=>generated.map(r => ({ id: r.id, file: r.file, before: observeInputFile(r.file) })));
  const manifest = { schema: SELECTED_EXECUTION_CONTRACT, contract: SELECTED_EXECUTION_CONTRACT, repository_root: root, private_root: privateRoot,
    native_configuration: nativeConfiguration,
    tools, npm_root: npmRoot, consumer_map: consumerMap, files, environment: Object.fromEntries(["PATH", ...SELECTED_KEYS]
      .filter(key => selectedEnvironment[key] !== undefined).map(key => [key, selectedEnvironment[key]])),
    git: selectedGitEvidence(git) };
  const file = create("selected-execution-manifest", "execution.json", JSON.stringify(manifest) + "\n", 0o400, "selected-execution-manifest");
  selectedEnvironment[SELECTED_EXECUTION_ENV] = file;
  selectedEnvironment[`${SELECTED_EXECUTION_ENV}_SHA256`] = digest(readFileSync(file));
  const context = Object.freeze({ contract: SELECTED_EXECUTION_CONTRACT, fingerprint: selectedEnvironment[`${SELECTED_EXECUTION_ENV}_SHA256`] });
  owners.set(context, { ledger, ledgerFile, ledgerSelection, root, privateRoot, directory, tools, npmRoot, toolInputs, initialTools,
    liveResources, initialLive, liveEnvironment, nativeConfiguration, consumerMap, files, generated, git, manifest, file, environment: selectedEnvironment });
  return context;
}

export function withSelectedExecution(context, callback) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  assertSelectedExecution(context);
  return scope.run(context, () => withOwnedSyncLifecycle(state.ledgerSelection,()=>
    withCompanionProcessProbe(runOwnedSyncChild,()=>withSelectedGit(state.git, callback))));
}
export function selectedExecutionEnvironment(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  assertSelectedExecution(context); return { ...state.environment };
}
export function selectedExecutionResources(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  return [...state.generated, ...selectedGitResources(state.git), ...state.toolInputs, ...state.liveResources,
    ...state.nativeConfiguration.external_sources.map(({ before, ...resource }) => resource),
    {id:"selected-consumer-map",file:path.join(implementationRoot,SELECTED_CONSUMER_MANIFEST),classification:"execution"}];
}

export function selectedExecutionRetainedResources(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  const normalize = text => text.replaceAll(state.privateRoot, "<private-root>").replaceAll(state.root, "<source-root>");
  const git = selectedGitRetainedInputs(state.git);
  const ordinary = state.generated.filter(r => r.id !== "selected-execution-manifest").map(r => ({
    ...r, source_generated: true, expected_sha256: digest(readFileSync(r.file)),
    logical_content: r.kind === "generated-execution-wrapper" ? {
      schema: "augnes.local-canonical-generated-wrapper-recipe.v1", template: "selected-dispatch-v1",
      tool: r.id.slice("selected-tool-dispatch-".length),
      arguments: [...readFileSync(r.file,"utf8").matchAll(/'([^']*)'/gu)].map(m => normalize(m[1])),
    } : { schema: "augnes.selected-input-logical.v1", id: r.id, content: normalize(readFileSync(r.file,"utf8")) },
  }));
  const manifest = state.generated.find(r => r.id === "selected-execution-manifest");
  return [...ordinary, ...git, { ...manifest, source_generated: true, expected_sha256: digest(readFileSync(manifest.file)),
    logical_content: { schema: SELECTED_EXECUTION_CONTRACT, tool_inputs: state.tools,
      native_configuration: { schema: NATIVE_CONFIGURATION_CONTRACT, external_sources: state.nativeConfiguration.external_sources.map(({ file, ...source }) =>
        ({ ...source, location_fingerprint: digest(file) })) },
      files: [...ordinary, ...git].map(r => ({ id: r.id, kind: r.kind, logical_sha256: digest(r.logical_content ?? { actual_execution_sha256: r.expected_sha256 }) })) } }];
}

export function selectedExecutionLedger(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  return { file: state.ledgerFile, identity: state.ledger.identity };
}

export function selectedExecutionLifecycle(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  return readOwnedChildLifecycleFile(state.ledgerFile, state.ledger.identity);
}

export function selectedExecutionEvidence(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  return { contract: SELECTED_EXECUTION_CONTRACT, selection_fingerprint: context.fingerprint,
    consumer_map_fingerprint: state.consumerMap.fingerprint,
    consumer_inventory: state.consumerMap,
    git: selectedGitEvidence(state.git), tool_ids: Object.keys(state.tools).sort() };
}
export function assertSelectedExecution(context) {
  const state = owners.get(context); if (!state) fail("selected_execution_not_owned");
  return withOwnedSyncLifecycle(state.ledgerSelection,()=>assertSelectedExecutionState(context,state));
}
function assertSelectedExecutionState(context,state) {
  if (digest(readFileSync(state.file)) !== context.fingerprint) fail("selected_execution_manifest_changed");
  assertNativeConfigurationSelection(state.nativeConfiguration);
  for (const r of state.files) if (digest(observeInputFile(r.file)) !== digest(r.before)) fail("selected_execution_input_changed");
  assertSelectedGit(state.git);
  if (auditSelectedConsumers().fingerprint !== state.consumerMap.fingerprint) fail("selected_consumer_inventory_changed");
  for (const r of [...state.initialTools,...state.initialLive]) if (digest(observeInputFile(r.file,r)) !== digest(r.before)) fail("selected_execution_live_input_changed");
  if (digest(liveTransportEnvironment()) !== digest(state.liveEnvironment)) fail("selected_transport_environment_changed");
}

function readInheritedSelection(environment) {
  const file = environment[SELECTED_EXECUTION_ENV];
  if (!file) return null;
  const expected = environment[`${SELECTED_EXECUTION_ENV}_SHA256`];
  if (!/^[a-f0-9]{64}$/u.test(expected ?? "") || !path.isAbsolute(file)) fail("selected_execution_binding_missing");
  const observation = observeInputFile(file);
  if (observation.sha256 !== expected || observation.metadata?.mode !== String(0o100400) ||
      (typeof process.getuid === "function" && observation.metadata?.uid !== String(process.getuid()))) fail("selected_execution_manifest_changed");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  if (manifest.contract !== SELECTED_EXECUTION_CONTRACT || !Array.isArray(manifest.files) || manifest.files.length > 32) fail("selected_execution_manifest_invalid");
  for (const r of manifest.files) if (digest(observeInputFile(r.file)) !== digest(r.before)) fail("selected_execution_input_changed");
  assertNativeConfigurationSelection(manifest.native_configuration);
  return manifest;
}

// Nested environment owners reconstruct the selected keys from their validated
// capability; they never copy arbitrary ambient npm/Git/loader overrides.
export function inheritSelectedExecutionEnvironment(ambient, child) {
  const manifest = readInheritedSelection(ambient);
  if (!manifest) return child;
  for (const [key,value] of Object.entries(manifest.environment)) {
    if (!["PATH", ...SELECTED_KEYS].includes(key) || typeof value !== "string") fail("selected_execution_environment_invalid");
    child[key] = value;
  }
  child[SELECTED_EXECUTION_ENV] = ambient[SELECTED_EXECUTION_ENV];
  child[`${SELECTED_EXECUTION_ENV}_SHA256`] = ambient[`${SELECTED_EXECUTION_ENV}_SHA256`];
  const roots = selectedNativeFixtureRoots(ambient, manifest.native_configuration);
  if (child.AUGNES_CANONICAL_TEMP_ROOT) {
    const own = nativeConfigurationFixtureRoot(child.AUGNES_CANONICAL_TEMP_ROOT);
    if (manifest.native_configuration.external_sources.some(r => r.file === own.root || r.file.startsWith(own.root + path.sep)))
      fail("native_configuration_parent_inventory_changed");
    child[NATIVE_FIXTURE_ROOTS_ENV] = JSON.stringify({ selection_fingerprint: child[`${SELECTED_EXECUTION_ENV}_SHA256`],
      roots: [...roots.filter(r => r.root !== own.root), own] });
  } else child[NATIVE_FIXTURE_ROOTS_ENV] = JSON.stringify({ selection_fingerprint: child[`${SELECTED_EXECUTION_ENV}_SHA256`], roots });
  return child;
}
export function isSelectedExecutionEnvironmentKey(key) { return SELECTED_KEYS.includes(key); }

export function selectedPythonInputs(ambient, cwd) {
  const manifest = readInheritedSelection(ambient);
  if (!manifest) fail("selected_python_binding_missing");
  const roots = [manifest.repository_root, manifest.private_root, manifest.npm_root];
  const childRoot = ambient.AUGNES_CANONICAL_TEMP_ROOT;
  if (childRoot) {
    const stat = lstatSync(childRoot);
    if (!path.isAbsolute(childRoot) || realpathSync(childRoot) !== childRoot || !stat.isDirectory() ||
        (!(childRoot === manifest.private_root || childRoot.startsWith(manifest.private_root + path.sep)) &&
          !/^ag-(?:suite|c[0-9]{2}|resource-test)-/u.test(path.basename(childRoot))) ||
        (stat.mode & 0o077) !== 0 || (process.getuid && stat.uid !== process.getuid())) fail("selected_python_private_root_unsafe");
    roots.push(childRoot);
  }
  const physical = realpathSync(cwd);
  if (physical !== cwd || !roots.some(root => physical === root || physical.startsWith(root + path.sep))) fail("selected_python_cwd_unclassified");
  return { executable: manifest.tools.python3, wrapper: path.join(manifest.private_root, "selected-inputs", "bin", "python3"),
    roots, env: inheritSelectedExecutionEnvironment(ambient, { ...ambient }) };
}

// npm prepends ancestor .bin paths after receiving its environment. Rebuild
// that search at the actual lifecycle shell, bounded to the selected source.
export function selectedPackageShellInvocation(ambient, cwd) {
  const manifest=readInheritedSelection(ambient);
  if (!manifest) fail("selected_package_shell_binding_missing");
  const physical=realpathSync(cwd), root=manifest.repository_root;
  if (physical !== root && !physical.startsWith(root+path.sep)) fail("selected_package_shell_cwd_unclassified");
  const directories=[];
  for(let cursor=physical;;cursor=path.dirname(cursor)) {
    const bin=path.join(cursor,"node_modules",".bin");
    if (existsSync(bin) && !realpathSync(bin).startsWith(root+path.sep)) fail("selected_package_shell_alias_refused");
    directories.push(bin);
    if(cursor===root)break;
  }
  const environment=inheritSelectedExecutionEnvironment(ambient,{...ambient});
  environment.PATH=[path.join(manifest.private_root,"selected-inputs","bin"),...directories,
    path.join(manifest.npm_root,"node_modules","@npmcli","run-script","lib","node-gyp-bin"),"/usr/bin","/bin","/usr/sbin","/sbin"].join(path.delimiter);
  delete environment.NODE_OPTIONS; delete environment.NODE_PATH; delete environment.ENV; delete environment.BASH_ENV;
  return {command:manifest.tools.sh,env:environment};
}

export function selectedToolInvocation(command, args, { liveTransport = false } = {}) {
  const context = scope.getStore();
  if (!context) return { command, args };
  const state = owners.get(context);
  const tool = Object.keys(state.tools).find(name => command === name || command === state.tools[name]);
  if (tool === "node") assertSelectedNodeArguments(state, args);
  assertSelectedExecution(context);
  const executable = state.tools[tool];
  if (!executable) {
    const fixed = { sw_vers: "/usr/bin/sw_vers" }[command];
    if (!fixed) fail("selected_tool_unclassified");
    return { command: fixed, args, env: state.environment };
  }
  if (liveTransport && tool !== "gh") fail("selected_live_transport_unclassified");
  if (tool === "gh" && !liveTransport) fail("selected_live_transport_required");
  if (tool === "npm" && !NPM_ARGUMENT_SETS.some(allowed => JSON.stringify(allowed) === JSON.stringify(args))) fail("selected_npm_arguments_unclassified");
  return { command: tool === "npm" ? state.tools.node : tool === "python3" ? path.join(state.directory, "bin", "python3") : executable,
    args: tool === "npm" ? [executable, ...args] : args,
    env: liveTransport ? { ...state.liveEnvironment, GH_PROMPT_DISABLED:"1" } : state.environment };
}

function assertSelectedNodeArguments(state, args) {
  if (!Array.isArray(args) || args.some(arg => typeof arg !== "string")) fail("selected_node_arguments_unclassified");
  if (args.length === 1 && ["--version", "-v"].includes(args[0])) return;
  let index = 0;
  if (args[index] === "--input-type=module") index++;
  // Inline programs are authored by the hash-bound controller/control source.
  // Loader and preload switches are never inherited as arbitrary CLI inputs.
  if (["-e", "--eval"].includes(args[index]) && typeof args[index + 1] === "string" && args.length === index + 2) return;
  if (index || !args[0] || args[0].startsWith("-")) fail("selected_node_arguments_unclassified");
  const file = path.resolve(state.root, args[0]);
  if (file !== state.root && !file.startsWith(state.root + path.sep)) fail("selected_node_entrypoint_unclassified");
  if (!existsSync(file) || realpathSync(file) !== file || !lstatSync(file).isFile()) fail("selected_node_entrypoint_unsafe");
}
