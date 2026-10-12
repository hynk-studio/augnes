import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkWorkflowCostPublication, PUBLICATION_DIRECTORY, PUBLICATION_NAMES, sha256 } from "./build-workflow-cost-publication.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PLUGIN_DIRECTORY = "plugins/augnes-workflow-cost";
export const SKILL_DIRECTORY = "skills/stationary-retry-work";
export const MATERIAL_DIRECTORY = `${SKILL_DIRECTORY}/assets/workflow-cost-v1`;
const guidance = ["plugin.json", `${SKILL_DIRECTORY}/SKILL.md`,
  `${SKILL_DIRECTORY}/references/usage.md`, `${SKILL_DIRECTORY}/scripts/verify_material.py`];
export const PLUGIN_FILES = Object.freeze([...guidance, ...PUBLICATION_NAMES.map(name => `${MATERIAL_DIRECTORY}/${name}`)].sort());
export const PUBLIC_CATALOG = Object.freeze({ name: "augnes-public-assets",
  interface: { displayName: "Augnes public assets" },
  plugins: [{ name: "augnes-workflow-cost", source: { source: "local", path: `./${PLUGIN_DIRECTORY}` },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" }, category: "Productivity" }] });

function regularBytes(root, relative) {
  let current = realpathSync(root);
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    assert.equal(lstatSync(current).isSymbolicLink(), false, `plugin_symlink_refused:${relative}`);
  }
  assert.ok(lstatSync(current).isFile(), `plugin_regular_file_required:${relative}`);
  return readFileSync(current);
}

function inventory(root, prefix = "") {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    assert.equal(entry.isSymbolicLink(), false, "plugin_symlink_refused");
    const relative = prefix + entry.name;
    return entry.isDirectory() ? inventory(path.join(root, entry.name), `${relative}/`) : [relative];
  }).sort();
}

export function checkWorkflowCostPlugin() {
  const publication = checkWorkflowCostPublication();
  const root = path.join(repository, PLUGIN_DIRECTORY);
  assert.deepEqual(inventory(root), PLUGIN_FILES, "plugin_closed_material_inventory");
  const files = new Map(PLUGIN_FILES.map(name => [name, regularBytes(root, name)]));
  for (const name of PUBLICATION_NAMES) {
    assert.deepEqual(files.get(`${MATERIAL_DIRECTORY}/${name}`), regularBytes(path.join(repository, PUBLICATION_DIRECTORY), name),
      `plugin_release_copy_drift:${name}`);
  }
  const plugin = JSON.parse(files.get("plugin.json"));
  assert.equal(plugin.name, "augnes-workflow-cost");
  assert.equal(plugin.version, "0.1.0");
  assert.equal(plugin.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.deepEqual(Object.keys(plugin).sort(), ["$schema", "name", "version", "description", "author", "repository", "homepage"].sort(),
    "public_plugin_has_no_private_connection_hooks_or_components");
  return { files, publication, plugin };
}

export function syncWorkflowCostPluginMaterial() {
  checkWorkflowCostPublication(); // Never regenerate or bless changed release hashes.
  const root = path.join(repository, PLUGIN_DIRECTORY);
  for (const name of PUBLICATION_NAMES) {
    const destination = path.join(root, MATERIAL_DIRECTORY, name);
    mkdirSync(path.dirname(destination), { recursive: true });
    // Existing components must stay physical, including the new copy's parent.
    assert.equal(realpathSync(path.dirname(destination)), path.dirname(destination));
    if (existsSync(destination)) assert.ok(lstatSync(destination).isFile() && !lstatSync(destination).isSymbolicLink());
    writeFileSync(destination, regularBytes(path.join(repository, PUBLICATION_DIRECTORY), name));
  }
  return checkWorkflowCostPlugin();
}

export function bundleWorkflowCostPlugin(destination) {
  const checked = checkWorkflowCostPlugin();
  // Create-only bundle: never overwrite an existing profile or user directory.
  const target = path.resolve(destination);
  assert.equal(realpathSync(path.dirname(target)), path.dirname(target), "bundle_parent_must_be_physical");
  mkdirSync(target, { mode: 0o700 });
  for (const [name, bytes] of checked.files) {
    const output = path.join(target, PLUGIN_DIRECTORY, name);
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, bytes, { flag: "wx" });
  }
  mkdirSync(path.join(target, ".agents/plugins"), { recursive: true });
  writeFileSync(path.join(target, ".agents/plugins/marketplace.json"), `${JSON.stringify(PUBLIC_CATALOG, null, 2)}\n`, { flag: "wx" });
  return { ...checked, destination: target };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  let result;
  if (args.length === 1 && args[0] === "--check") result = checkWorkflowCostPlugin();
  else if (args.length === 1 && args[0] === "--sync-material") result = syncWorkflowCostPluginMaterial();
  else if (args.length === 2 && args[0] === "--bundle") result = bundleWorkflowCostPlugin(args[1]);
  else throw new Error("usage: build-workflow-cost-plugin.mjs --check | --sync-material | --bundle NEW_DIRECTORY");
  console.log(JSON.stringify({ plugin: result.plugin.name, version: result.plugin.version,
    content_id: result.publication.content_id, destination: result.destination ?? null,
    files: [...result.files].map(([name, bytes]) => ({ name, bytes: bytes.length, sha256: sha256(bytes) })) }));
}
