import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isSupportedNodeVersion } from "../plugins/augnes-operator/mcp/node-runtime-policy.mjs";

const root = process.cwd();
assert(isSupportedNodeVersion(process.versions.node));
const requireRoot = createRequire(path.join(root, "package.json"));
const { default: loadNextConfig } = requireRoot("next/dist/server/config");
const { PHASE_DEVELOPMENT_SERVER } = requireRoot("next/constants");
const nextConfig = await loadNextConfig(PHASE_DEVELOPMENT_SERVER, root);
assert.equal(nextConfig.experimental.agentUpgrade, false,
  "source runtime startup must not opt into Next advisory fetch or upgrade automation");
const inventory = [];
const seenNative = new Set();
for (const prefix of ["", "apps/augnes_apps", "apps/web_planning"]) {
  const project = path.join(root, prefix);
  const lock = JSON.parse(readFileSync(path.join(project, "package-lock.json")));
  for (const [relative, record] of Object.entries(lock.packages)) {
    if (!/(?:^|\/)node_modules\/(?:next|sharp|undici|miniflare|esbuild|workerd)$/u.test(relative)) continue;
    const location = path.join(project, relative);
    const name = relative.split("node_modules/").at(-1);
    const manifest = JSON.parse(readFileSync(path.join(location, "package.json")));
    assert.equal(manifest.version, record.version, `${prefix}/${relative}`);
    inventory.push({ graph: prefix || "root", path: relative, version: record.version });
    if (name === "next") assert.equal(record.version, "16.4.3");
    if (name === "sharp") {
      assert.equal(record.version, "0.35.5");
      const sharp = requireRoot(location);
      const output = await sharp({ create: { width: 2, height: 2, channels: 4, background: "#123456" } }).resize(1, 1).png().toBuffer();
      assert.equal((await sharp(output).metadata()).width, 1);
      seenNative.add(`sharp:${sharp.versions.vips}`);
    }
    if (name === "undici") assert.equal(record.version, "7.30.1");
    if (name === "esbuild") {
      const code = execFileSync(path.join(location, "bin", "esbuild"), ["--loader=ts"],
        { input: "const value: number = 1", encoding: "utf8", timeout: 5_000 });
      assert.match(code, /const value = 1/u);
      seenNative.add(`esbuild:${record.version}`);
    }
    if (name === "workerd") {
      const executable = path.join(location, "bin", "workerd");
      assert.match(execFileSync(executable, ["--version"], { encoding: "utf8", timeout: 5_000 }), /workerd/u);
      seenNative.add(`workerd:${record.version}`);
    }
    if (name === "miniflare") {
      const consumer = createRequire(path.join(location, "package.json"));
      assert.equal(consumer("sharp").versions.sharp, "0.35.5");
      assert.equal(consumer("undici/package.json").version, "7.30.1");
      const { Miniflare, convertV4MiniflareOptions } = await import(pathToFileURL(consumer.resolve("miniflare")).href);
      // Disable the optional remote cf metadata fetch and its checkout cache.
      // The retained v5 alpha exposes its explicit v4 compatibility adapter.
      const options = { cf: false, workers: [{ modules: true, compatibilityDate: "2025-01-01",
        script: "export default { fetch() { return new Response('historical-parent-compatible') } }" }] };
      const mf = new Miniflare(record.version.startsWith("5.") ? convertV4MiniflareOptions(options) : options);
      try { assert.equal(await (await mf.dispatchFetch("http://localhost/native-check")).text(), "historical-parent-compatible"); }
      finally { await mf.dispose(); }
    }
  }
}
const Database = requireRoot("better-sqlite3");
const db = new Database(":memory:");
try { assert.equal(db.prepare("SELECT 42 AS value").get().value, 42); }
finally { db.close(); }
const suffix = process.platform === "linux"
  ? (process.report.getReport().header.glibcVersionRuntime ? "-gnu" : "-musl")
  : process.platform === "win32" ? "-msvc" : "";
const swc = requireRoot(`@next/swc-${process.platform}-${process.arch}${suffix}`);
assert.equal(typeof swc.transformSync, "function");
console.log(JSON.stringify({ status: "pass", node: process.versions.node, bundled_undici: process.versions.undici,
  current_dependencies: inventory, native: [...seenNative, "better-sqlite3", "next-swc"],
  miniflare_http_consumers: inventory.filter(row => row.path.endsWith("/miniflare")).length }));
