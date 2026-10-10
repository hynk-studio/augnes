// Pure-data consumer CLI, delivered beside its exact normalization dependencies.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, lstatSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const directory = path.dirname(fileURLToPath(import.meta.url));
const hash = bytes => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const read = name => {
  assert(/^[a-z0-9-]+\.(?:json|mjs)$/u.test(name), "simple fixed filename required");
  const target = path.join(directory, name), stat = lstatSync(target);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 64_000, "bounded regular file required");
  return readFileSync(target);
};

try {
  const [mode, version, inputName, outputName] = process.argv.slice(2);
  assert(["success", "capacity"].includes(mode) && ["v1", "v2"].includes(version));
  assert(/^[a-z0-9-]+\.json$/u.test(outputName) && outputName !== inputName && outputName !== "assets.json");
  const manifest = JSON.parse(read("assets.json"));
  const names = version === "v1" ? ["normalize-v1.mjs", "process-events.mjs"]
    : ["normalize-v1.mjs", "normalize-v2.mjs", "process-events.mjs"];
  assert.deepEqual(manifest.files.map(row => row.name), names, "exact dependency inventory required");
  for (const row of manifest.files) {
    const bytes = read(row.name);
    assert.equal(bytes.length, row.bytes); assert.equal(hash(bytes), row.sha256, "asset hash mismatch");
  }
  assert.equal(manifest.identity, hash(JSON.stringify(manifest.files)), "asset manifest identity mismatch");
  const input = read(inputName), parsed = JSON.parse(input);
  const moduleName = `normalize-${version}.mjs`, moduleUrl = new URL(moduleName, import.meta.url);
  const normalizer = await import(moduleUrl.href);
  const normalized = normalizer[version === "v1" ? "normalizeV1" : "normalizeV2"](parsed);
  const total = rows => {
    const value = rows.reduce((sum, row) => sum + BigInt(row.duration_ms), 0n);
    assert(value <= BigInt(Number.MAX_SAFE_INTEGER), "total exceeds exact JSON integer range"); return Number(value);
  };
  const ok = normalized.rows.filter(row => row.status === "ok"), failed = normalized.rows.filter(row => row.status === "failed");
  const common = { schema_version: parsed.schema_version, input_sha256: hash(input), method_identity: manifest.identity,
    input_rows: normalized.input_rows, unique_attempts: normalized.unique_attempts, duplicate_deliveries: normalized.duplicate_deliveries };
  const result = mode === "success"
    ? { ...common, population: "successful attempts only", excluded_failed_attempts: failed.length, successful_attempts: ok.length,
      rows: ok, total_ms: total(ok), max_ms: ok.length ? Math.max(...ok.map(row => row.duration_ms)) : null }
    : { ...common, population: "all unique attempts", successful_attempts: ok.length, failed_attempts: failed.length,
      rows: normalized.rows, total_ms: total(normalized.rows), successful_ms: total(ok), failed_ms: total(failed),
      // Preserve first-occurrence order, not A's dashboard job-label preference.
      per_job: [...new Set(normalized.rows.map(row => row.job_id))].map(job_id => {
        const rows = normalized.rows.filter(row => row.job_id === job_id);
        return { job_id, attempts: rows.length, total_ms: total(rows), failed_ms: total(rows.filter(row => row.status === "failed")) };
      }) };
  // Validation/calculation completes before replacing a previous complete result.
  writeFileSync(path.join(directory, outputName), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ runtime: process.version, executable: realpathSync(fileURLToPath(import.meta.url)),
    imported: [realpathSync(fileURLToPath(moduleUrl)), ...(version === "v2" ? [realpathSync(path.join(directory, "normalize-v1.mjs"))] : [])],
    cwd: realpathSync(process.cwd()), output: outputName, output_sha256: hash(read(outputName)), method_identity: manifest.identity }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
