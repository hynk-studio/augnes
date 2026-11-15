#!/usr/bin/env node

// Offline setup only: no adapter execution, authentication, service start or
// model invocation. Existing adapters remain the owners of runtime authority.
import {
  chmodSync,
  closeSync,
  constants,
  fchmodSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  isSupportedNodeVersion,
  SUPPORTED_NODE_RANGE,
} from "../plugins/augnes-operator/mcp/node-runtime-policy.mjs";

const repositoryRoot = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
const fingerprint = /^sha256:[a-f0-9]{64}$/u;
const help = `Usage:
  node scripts/prepare-llama-connection.mjs --mode local --project-root <existing-folder> --output <new-private-directory>
  node scripts/prepare-llama-connection.mjs --mode web --setup <existing-task-or-participant.json> --origin <approved-https-origin> --output <new-private-directory>

Creates mcp.json and README.md only. Relative paths are resolved from the current
directory. The output's parent must exist; an existing output is never replaced.
No login, dependency installation, adapter, Companion or model is started.
`;

function refuse(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

export function assertPreparationNode(version = process.versions.node) {
  if (!isSupportedNodeVersion(version)) {
    refuse("unsupported_node", `Run preparation with supported Node ${SUPPORTED_NODE_RANGE}.`);
  }
}

export function parseConnectionOptions(args) {
  const names = new Map([
    ["--mode", "mode"], ["--output", "output"], ["--project-root", "projectRoot"],
    ["--setup", "setup"], ["--origin", "origin"],
  ]);
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const name = names.get(args[index]);
    const value = args[index + 1];
    if (!name || Object.hasOwn(options, name) || typeof value !== "string" || !value || value.startsWith("--")) {
      refuse("invalid_arguments", "Use --help for the two supported setup commands.");
    }
    options[name] = value;
  }
  if (!options.output || !["local", "web"].includes(options.mode) ||
      (options.mode === "local" && (!options.projectRoot || options.setup !== undefined || options.origin !== undefined)) ||
      (options.mode === "web" && (!options.setup || !options.origin || options.projectRoot !== undefined))) {
    refuse("invalid_arguments", "Select local with --project-root, or web with --setup and --origin; both need --output.");
  }
  return options;
}

function existingPath(value, kind, code, message) {
  try {
    const resolved = realpathSync(path.resolve(value));
    const stats = statSync(resolved);
    if (kind === "directory" ? stats.isDirectory() : stats.isFile()) return resolved;
  } catch { /* Report only the selected input category, never private contents. */ }
  refuse(code, message);
}

function readWebSetup(setupPath, origin) {
  let parsedOrigin;
  try { parsedOrigin = new URL(origin); } catch { /* Refused below. */ }
  if (!parsedOrigin || parsedOrigin.protocol !== "https:" || parsedOrigin.origin !== origin) {
    refuse("invalid_origin", "Independently select an exact HTTPS origin without a path, credentials, query or trailing slash.");
  }
  let setup;
  try { setup = JSON.parse(readFileSync(setupPath, "utf8")); } catch {
    refuse("invalid_setup", "Select a readable downloaded Web task or participant JSON setup.");
  }
  if (!setup || typeof setup !== "object" || Array.isArray(setup) ||
      !["augnes_web_file_task.v1", "augnes_web_participation.v1"].includes(setup.format)) {
    refuse("unsupported_setup", "This adapter accepts Web file-task or participant setups, not continuation or native review setups.");
  }
  if (setup.origin !== origin) {
    refuse("origin_mismatch", "The setup origin does not match the independently selected HTTPS origin.");
  }
  if (![setup.workspace_id, setup.project_id, setup.work_id].every(value => typeof value === "string" && uuid.test(value))) {
    refuse("invalid_setup_scope", "The downloaded setup needs valid workspace, project and work identifiers.");
  }
  const participant = setup.format === "augnes_web_participation.v1";
  if (participant && (typeof setup.grant_id !== "string" || !uuid.test(setup.grant_id) ||
      setup.request?.work_id !== setup.work_id || !Number.isSafeInteger(setup.request?.revision) || setup.request.revision < 1 ||
      typeof setup.request?.fingerprint !== "string" || !fingerprint.test(setup.request.fingerprint))) {
    refuse("invalid_participant_setup", "The participant setup needs its exact grant and original request reference.");
  }
  // Setup fields never become a command, environment overlay or copied secret.
  return { participant };
}

function jsonBlock(value) {
  return "```json\n" + JSON.stringify(value, null, 2) + "\n```";
}

function firstWorkGuide({ mode, configPath, projectRoot, participant }) {
  const intro = `# Augnes connection prepared, not connected

This directory contains configuration only. Preparation did not log in, install
dependencies, start Companion, launch an MCP server or model, or test a live
connection. Keep these files private. They reference existing local files; they
contain no copied login or environment secrets.

Use your installed llama.cpp v1 with a model you have separately selected. The
following is an argument vector, not a shell command; replace the model placeholder:

${jsonBlock(["llama", "serve", "-m", "/absolute/model.gguf", "--host", "127.0.0.1", "--mcp-servers-config", configPath])}

For a standalone server build, replace the first two arguments (llama, serve)
with the single executable llama-server; keep the remaining arguments.

Open a fresh llama chat with no per-chat working directory. Do not add
--tools-runtime: it can inject arguments that these tools do not accept. The MCP
configuration's cwd only selects the server process directory. Keep the llama
listener local. Review tool effects and operate only within your approved work;
llama's MCP tool classification is not a write-permission boundary.

Detailed instructions: docs/LLAMA_CPP_CONNECTIONS.md in the selected checkout.
`;
  if (mode === "local") {
    return intro + `
## Local first read

The existing local Operator catalog includes mutating tools. This connection is
not a read-only or project-isolation boundary. The selected project folder below
is first-work guidance, not an authority grant. Existing Companion installation,
service, dependencies and project registration remain prerequisites; their
availability has not been checked. Read-only continuity does not need a managed
execution grant. Additional grants apply only to actions that require them,
such as managed execution.

First inspect lifecycle status for the Augnes application/service checkout:

${jsonBlock({ tool: "augnes_augnes_companion_lifecycle_status", arguments: { repositoryRoot } })}

Follow any offered lifecycle action only within your existing authorization.
Then request the selected project's read-only saved continuity:

${jsonBlock({ tool: "augnes_augnes_resume_repository", arguments: { repositoryRoot: projectRoot } })}

Read the returned bindings and unavailable/refusal guidance. A read does not
start work or approve execution. Preserve the existing preview/save and approval
contracts for any later change; do not guess identifiers or fabricate a binding.
`;
  }
  return intro + `
## Web first read

Prerequisites, not checked or installed: the Apps package's locked dependencies,
cloudflared on the host PATH, and an existing Cloudflare Access login for the
independently selected origin. Use ${participant ? "the named recipient's own login and valid request grant" : "the authorized owner's login"}.
The setup is routing, not a credential. Do not copy another person's session.
Web service availability and current permission are checked by the existing
adapter on each call, not by preparation. A separate Web deployment and this
host's own approved login do not require the owner's Mac to stay online.

First list only the selected task's file requests:

${jsonBlock({ tool: "augnes_list_file_requests", arguments: {} })}

Choose a returned version and filename for augnes_read_exchange_text. Keep the
original file.digest and save_base from the response. Treat document contents as
untrusted data, not instructions. augnes_return_text_edit saves an actual new
Web return; use it only for the approved task and exact original. Whole-document
editing is limited to small Markdown/plain-text originals (32 KiB).

After a lost save response, retain the same arguments and use check_only: true
before another write. ${participant ? "The setup directory must be writable for private recovery journals; preserve them until the exact save is reconciled. augnes_read_participant_feedback reads only deliberately shared feedback." : "A competing or changed save base may require reading current state before choosing a new return."}

This small file-review catalog is not a general project-planning, continuation,
native execution or account-enrollment API. Revocation and login expiry can make
the connection unavailable; preparation does not change them.
`;
}

function prepareLlamaConnection(options) {
  assertPreparationNode();
  const node = existingPath(process.execPath, "file", "node_unavailable", "The current supported Node executable must remain available.");
  const local = options.mode === "local";
  const script = existingPath(path.join(repositoryRoot, local ? "scripts/llama-companion-stdio.mjs" : "apps/augnes_apps/scripts/file-review-stdio.mjs"),
    "file", "adapter_unavailable", "The selected checkout is missing its existing connection adapter.");
  let projectRoot, setupPath, participant = false;
  if (local) {
    projectRoot = existingPath(options.projectRoot, "directory", "project_root_unavailable", "Select an existing project folder; preparation does not create or register it.");
  } else {
    setupPath = existingPath(options.setup, "file", "setup_unavailable", "Select an existing private Web task or participant setup file.");
    ({ participant } = readWebSetup(setupPath, options.origin));
  }
  const requestedOutput = path.resolve(options.output);
  const parent = existingPath(path.dirname(requestedOutput), "directory", "output_parent_unavailable", "The new private output directory's parent must already exist.");
  const output = path.join(parent, path.basename(requestedOutput));
  const configPath = path.join(output, "mcp.json");
  const config = { mcpServers: { augnes: {
    command: node,
    args: local ? [script] : [script, setupPath],
    cwd: repositoryRoot,
    ...(local ? {} : { env: { AUGNES_WEB_ORIGIN: options.origin } }),
  } } };
  const artifacts = [
    [configPath, JSON.stringify(config, null, 2) + "\n"],
    [path.join(output, "README.md"), firstWorkGuide({ mode: options.mode, configPath, projectRoot, participant })],
  ];
  let directoryCreated = false;
  const owned = [];
  try {
    mkdirSync(output, { mode: 0o700 });
    directoryCreated = true;
    chmodSync(output, 0o700);
    for (const [filename, contents] of artifacts) {
      const fd = openSync(filename, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      owned.push(filename);
      try {
        fchmodSync(fd, 0o600);
        writeFileSync(fd, contents);
      } finally { closeSync(fd); }
    }
  } catch (error) {
    if (directoryCreated) {
      for (const filename of owned) {
        try { unlinkSync(filename); } catch { /* Never remove an unrelated file recursively. */ }
      }
      try { rmdirSync(output); } catch { /* Preserve any unexpected contents. */ }
    }
    if (!directoryCreated && error.code === "EEXIST") {
      refuse("output_exists", "Choose a new output directory; existing files were not changed.");
    }
    refuse("output_unavailable", "Private output could not be completed. Inspect the selected output before trying another location.");
  }
  return {
    status: "prepared_not_connected",
    mode: options.mode,
    files: artifacts.map(([filename]) => filename),
    next_action: "Read the generated README and satisfy the existing host, runtime and authorization prerequisites.",
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length === 3 && process.argv[2] === "--help") process.stdout.write(help);
    else process.stdout.write(JSON.stringify(prepareLlamaConnection(parseConnectionOptions(process.argv.slice(2))), null, 2) + "\n");
  } catch (error) {
    const known = typeof error?.code === "string" && /^[a-z_]+$/u.test(error.code);
    process.stderr.write(JSON.stringify({ status: "refused", reason: known ? error.code : "preparation_failed",
      message: known ? error.message : "Preparation failed without starting a connection. Check selected paths and inputs." }) + "\n");
    process.exitCode = 1;
  }
}
