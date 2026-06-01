import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const MANIFEST_PATH = "fixtures/sidecar-et-trace-pack.manifest.json";
const MANIFEST_VERSION = "sidecar_et_trace_pack_manifest.v0.1";
const TRACE_PACK_VERSION = "sidecar_et_trace_pack.v0.1";
const APPROVED_PACKS = [
  {
    path: "fixtures/sidecar-et-trace-pack.example.json",
    kind: "example",
    default_compare: true,
    explicit_only: false,
    expected_trace_count: 1,
  },
  {
    path: "fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json",
    kind: "probe",
    default_compare: false,
    explicit_only: true,
    expected_trace_count: 5,
  },
];
const APPROVED_PATHS = new Set(APPROVED_PACKS.map((pack) => pack.path));
const FORBIDDEN_PACK_PATH_FRAGMENTS = [
  "curated",
  "surprising-probes",
  "medium-tension-probes",
  "recovery-policy-probes",
  "low-evidence-boundary-probes",
  "stress",
];
const ALLOWED_MANIFEST_KEYS = new Set(["version", "packs"]);
const ALLOWED_PACK_KEYS = new Set([
  "path",
  "kind",
  "default_compare",
  "explicit_only",
  "expected_trace_count",
]);

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Sidecar e_t manifest routing smoke must not call fetch");
};

const manifest = readJson(MANIFEST_PATH);
validateManifest(manifest);
validatePackageScriptBoundary();
assert.equal(fetchCalls, 0, "manifest routing smoke should not call fetch");

console.log(
  JSON.stringify(
    {
      smoke: "sidecar-et-trace-pack-manifest",
      manifest_path: MANIFEST_PATH,
      manifest_version: manifest.version,
      packs_checked: manifest.packs.length,
      pack_paths: manifest.packs.map((pack) => pack.path),
      default_compare_packs: manifest.packs.filter(
        (pack) => pack.default_compare,
      ).length,
      explicit_only_packs: manifest.packs.filter((pack) => pack.explicit_only)
        .length,
      default_compare_only_example: true,
      grounded_quiet_explicit_only: true,
      unimported_packs_present: false,
      expected_trace_counts_match_actual_files: true,
      unsafe_paths_present: false,
      fetch_calls: fetchCalls,
      db_writes: false,
      ag_resume_writer_helper_called: false,
      proof_evidence_readiness_outputs: false,
      qp_evidence_created: false,
      z_t_commits: false,
      ag_resume_package_script_collisions: false,
    },
    null,
    2,
  ),
);

function validateManifest(value) {
  assertObject(value, "$");
  assertOnlyKeys(value, ALLOWED_MANIFEST_KEYS, "$");
  assert.equal(
    value.version,
    MANIFEST_VERSION,
    `${MANIFEST_PATH}.version must be ${MANIFEST_VERSION}`,
  );
  assert(Array.isArray(value.packs), `${MANIFEST_PATH}.packs must be an array`);
  assert.equal(
    value.packs.length,
    APPROVED_PACKS.length,
    `${MANIFEST_PATH} must include exactly the approved first subset`,
  );

  const seenPaths = new Set();
  for (const [index, pack] of value.packs.entries()) {
    validateManifestPack(pack, `$.packs[${index}]`, seenPaths);
  }

  assert.deepEqual(
    value.packs.map((pack) => pack.path).sort(),
    [...APPROVED_PATHS].sort(),
    `${MANIFEST_PATH} paths must match the imported approved fixture files`,
  );

  const defaultComparePacks = value.packs.filter(
    (pack) => pack.default_compare,
  );
  assert.deepEqual(
    defaultComparePacks.map((pack) => pack.kind),
    ["example"],
    "default_compare must include only the example pack",
  );

  const groundedQuiet = value.packs.find((pack) =>
    pack.path.endsWith("sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json"),
  );
  assert(groundedQuiet, "grounded/quiet pack must be present");
  assert.equal(groundedQuiet.kind, "probe");
  assert.equal(groundedQuiet.default_compare, false);
  assert.equal(groundedQuiet.explicit_only, true);
}

function validateManifestPack(pack, packPath, seenPaths) {
  assertObject(pack, packPath);
  assertOnlyKeys(pack, ALLOWED_PACK_KEYS, packPath);
  assertManifestPath(pack.path, `${packPath}.path`);
  assert(!seenPaths.has(pack.path), `${pack.path} must not be duplicated`);
  seenPaths.add(pack.path);
  assert(
    APPROVED_PATHS.has(pack.path),
    `${pack.path} is not part of the approved first imported subset`,
  );
  for (const forbidden of FORBIDDEN_PACK_PATH_FRAGMENTS) {
    assert(
      !pack.path.includes(forbidden),
      `${pack.path} must not reference deferred pack ${forbidden}`,
    );
  }

  const expected = APPROVED_PACKS.find((candidate) => candidate.path === pack.path);
  assert(expected, `${pack.path} should have an approved routing entry`);
  assert.equal(pack.kind, expected.kind, `${pack.path} kind`);
  assert.equal(
    pack.default_compare,
    expected.default_compare,
    `${pack.path} default_compare`,
  );
  assert.equal(
    pack.explicit_only,
    expected.explicit_only,
    `${pack.path} explicit_only`,
  );
  assert.equal(
    !(pack.default_compare && pack.explicit_only),
    true,
    `${pack.path} cannot be both default_compare and explicit_only`,
  );
  assert.equal(
    typeof pack.expected_trace_count,
    "number",
    `${pack.path} expected_trace_count must be numeric`,
  );
  assert.equal(
    Number.isInteger(pack.expected_trace_count),
    true,
    `${pack.path} expected_trace_count must be an integer`,
  );
  assert.equal(
    pack.expected_trace_count,
    expected.expected_trace_count,
    `${pack.path} expected_trace_count`,
  );
  validateTracePackFile(pack);
}

function validateTracePackFile(pack) {
  assert(existsSync(pack.path), `${pack.path} must exist`);
  const tracePack = readJson(pack.path);
  assert.equal(
    tracePack.version,
    TRACE_PACK_VERSION,
    `${pack.path}.version must be ${TRACE_PACK_VERSION}`,
  );
  assert(Array.isArray(tracePack.traces), `${pack.path}.traces must be an array`);
  assert.equal(
    tracePack.traces.length,
    pack.expected_trace_count,
    `${pack.path} trace count must match manifest expected_trace_count`,
  );
}

function assertManifestPath(packPath, valuePath) {
  assert.equal(typeof packPath, "string", `${valuePath} must be a string`);
  assert(packPath.length > 0, `${valuePath} must not be empty`);
  assert(!/https?:\/\//i.test(packPath), `${valuePath} must not be a raw URL`);
  assert(!path.isAbsolute(packPath), `${valuePath} must not be absolute`);
  assert(!packPath.includes("\\"), `${valuePath} must use forward slashes`);
  assert(
    packPath.startsWith("fixtures/"),
    `${valuePath} must stay under fixtures/`,
  );
  assert.equal(
    path.posix.normalize(packPath),
    packPath,
    `${valuePath} must be normalized`,
  );
  assert(!packPath.includes("../"), `${valuePath} must not traverse upward`);
  assert.equal(
    path.posix.extname(packPath),
    ".json",
    `${valuePath} must end in .json`,
  );
}

function validatePackageScriptBoundary() {
  const packageJson = readJson("package.json");
  const scripts = packageJson.scripts ?? {};
  assert.equal(
    scripts["smoke:sidecar-et-trace-pack-manifest"],
    "node scripts/smoke-sidecar-et-trace-pack-manifest.mjs",
    "approved manifest smoke script should be registered exactly once",
  );

  const sidecarScriptNames = Object.keys(scripts)
    .filter((scriptName) => scriptName.startsWith("smoke:sidecar-et-"))
    .sort();
  assert.deepEqual(sidecarScriptNames, [
    "smoke:sidecar-et-fixture-boundaries",
    "smoke:sidecar-et-runtime-boundaries",
    "smoke:sidecar-et-trace-pack-fixture-descriptors",
    "smoke:sidecar-et-trace-pack-manifest",
  ]);

  for (const scriptName of Object.keys(scripts)) {
    if (
      scriptName.startsWith("ag:resume-") ||
      scriptName.startsWith("smoke:ag-work-resume-")
    ) {
      assert(
        !scriptName.includes("sidecar-et"),
        `${scriptName} should not collide with Sidecar e_t manifest routing`,
      );
    }
  }
}

function readJson(jsonPath) {
  try {
    return JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (error) {
    throw new Error(`${jsonPath} must be valid JSON: ${error.message}`);
  }
}

function assertObject(value, valuePath) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `${valuePath} must be an object`,
  );
}

function assertOnlyKeys(object, allowedKeys, valuePath) {
  for (const key of Object.keys(object)) {
    assert(allowedKeys.has(key), `${valuePath}.${key} is not supported`);
  }
}
