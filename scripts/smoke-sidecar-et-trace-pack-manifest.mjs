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
const negativeCasesChecked = assertNegativeManifestCases();
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
      negative_cases_checked: negativeCasesChecked,
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

function assertNegativeManifestCases() {
  const examplePack = approvedPack(
    "fixtures/sidecar-et-trace-pack.example.json",
  );
  const groundedQuietPack = approvedPack(
    "fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json",
  );
  const missingFixturePack = {
    path: "fixtures/sidecar-et-trace-pack.missing.json",
    kind: "probe",
    default_compare: false,
    explicit_only: true,
    expected_trace_count: 1,
  };
  const deferredPackPaths = [
    "fixtures/sidecar-et-trace-pack.curated-v0.1.json",
    "fixtures/sidecar-et-trace-pack.surprising-probes-v0.1.json",
    "fixtures/sidecar-et-trace-pack.medium-tension-probes-v0.1.json",
    "fixtures/sidecar-et-trace-pack.recovery-policy-probes-v0.1.json",
    "fixtures/sidecar-et-trace-pack.low-evidence-boundary-probes-v0.1.json",
    "fixtures/sidecar-et-trace-pack.stress-v0.1.json",
  ];

  const negativeCases = [
    {
      name: "invalid_manifest_version",
      manifest: {
        ...approvedManifest(),
        version: "sidecar_et_trace_pack_manifest.v9.9",
      },
      messageIncludes: "version must be",
    },
    {
      name: "missing_packs",
      manifest: { version: MANIFEST_VERSION },
      messageIncludes: "packs must be an array",
    },
    {
      name: "non_array_packs",
      manifest: { version: MANIFEST_VERSION, packs: {} },
      messageIncludes: "packs must be an array",
    },
    {
      name: "empty_packs",
      manifest: { version: MANIFEST_VERSION, packs: [] },
      messageIncludes: "must include exactly the approved first subset",
    },
    {
      name: "duplicate_paths",
      manifest: manifestWithPacks([examplePack, examplePack]),
      messageIncludes: "must not be duplicated",
    },
    {
      name: "unsafe_raw_url_path",
      manifest: manifestWithPacks([
        { ...examplePack, path: "https://example.invalid/pack.json" },
        groundedQuietPack,
      ]),
      messageIncludes: "must not be a raw URL",
    },
    {
      name: "absolute_path",
      manifest: manifestWithPacks([
        { ...examplePack, path: "/tmp/sidecar-et-trace-pack.example.json" },
        groundedQuietPack,
      ]),
      messageIncludes: "must not be absolute",
    },
    {
      name: "path_traversal",
      manifest: manifestWithPacks([
        {
          ...examplePack,
          path: "fixtures/../sidecar-et-trace-pack.example.json",
        },
        groundedQuietPack,
      ]),
      messageIncludes: "must be normalized",
    },
    {
      name: "backslash_path",
      manifest: manifestWithPacks([
        { ...examplePack, path: "fixtures\\sidecar-et-trace-pack.example.json" },
        groundedQuietPack,
      ]),
      messageIncludes: "must use forward slashes",
    },
    {
      name: "non_json_path",
      manifest: manifestWithPacks([
        { ...examplePack, path: "fixtures/sidecar-et-trace-pack.example.txt" },
        groundedQuietPack,
      ]),
      messageIncludes: "must end in .json",
    },
    ...deferredPackPaths.map((packPath) => ({
      name: `unimported_deferred_${deferredPackName(packPath)}`,
      manifest: manifestWithPacks([
        { ...examplePack, path: packPath },
        groundedQuietPack,
      ]),
      messageIncludes: "must not reference deferred pack",
    })),
    {
      name: "unknown_pack_field",
      manifest: manifestWithPacks([
        { ...examplePack, description: "not allowed in the manifest" },
        groundedQuietPack,
      ]),
      messageIncludes: "description is not supported",
    },
    {
      name: "unsupported_kind",
      manifest: manifestWithPacks([
        { ...examplePack, kind: "curated" },
        groundedQuietPack,
      ]),
      messageIncludes: "kind",
    },
    {
      name: "default_compare_and_explicit_only_both_true",
      manifest: manifestWithPacks([
        { ...examplePack, default_compare: true, explicit_only: true },
        groundedQuietPack,
      ]),
      messageIncludes: "cannot be both default_compare and explicit_only",
    },
    {
      name: "default_compare_false_and_explicit_only_false",
      manifest: manifestWithPacks([
        examplePack,
        { ...groundedQuietPack, default_compare: false, explicit_only: false },
      ]),
      messageIncludes: "explicit_only",
    },
    {
      name: "grounded_quiet_accidentally_default_compare",
      manifest: manifestWithPacks([
        examplePack,
        { ...groundedQuietPack, default_compare: true },
      ]),
      messageIncludes: "default_compare",
    },
    {
      name: "example_accidentally_explicit_only",
      manifest: manifestWithPacks([
        { ...examplePack, explicit_only: true },
        groundedQuietPack,
      ]),
      messageIncludes: "cannot be both default_compare and explicit_only",
    },
    {
      name: "expected_trace_count_mismatch",
      manifest: manifestWithPacks([
        { ...examplePack, expected_trace_count: 2 },
        groundedQuietPack,
      ]),
      messageIncludes: "expected_trace_count",
    },
    {
      name: "missing_fixture_file",
      manifest: manifestWithPacks([missingFixturePack]),
      messageIncludes: "must exist",
      options: {
        approvedPacks: [missingFixturePack],
        enforceFirstSubsetRouting: false,
      },
    },
  ];

  for (const negativeCase of negativeCases) {
    assertRejectsManifest(negativeCase);
  }

  return negativeCases.map((negativeCase) => negativeCase.name);
}

function assertRejectsManifest(negativeCase) {
  assert.throws(
    () => validateManifest(negativeCase.manifest, negativeCase.options),
    (error) => {
      assert(
        error instanceof Error,
        `${negativeCase.name} should throw an Error`,
      );
      assert(
        error.message.includes(negativeCase.messageIncludes),
        `${negativeCase.name} rejected with unexpected message: ${error.message}`,
      );
      return true;
    },
    `${negativeCase.name} should reject invalid manifest input`,
  );
}

function approvedManifest() {
  return manifestWithPacks(APPROVED_PACKS);
}

function manifestWithPacks(packs) {
  return {
    version: MANIFEST_VERSION,
    packs: packs.map(cloneJson),
  };
}

function approvedPack(packPath) {
  const pack = APPROVED_PACKS.find((candidate) => candidate.path === packPath);
  assert(pack, `${packPath} should be approved by the fixture manifest smoke`);
  return cloneJson(pack);
}

function deferredPackName(packPath) {
  return path
    .basename(packPath, ".json")
    .replace(/^sidecar-et-trace-pack\./, "")
    .replace(/-v0\.1$/, "")
    .replaceAll("-", "_");
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateManifest(value, options = {}) {
  const approvedPacks = options.approvedPacks ?? APPROVED_PACKS;
  const approvedPaths = new Set(approvedPacks.map((pack) => pack.path));
  const enforceFirstSubsetRouting = options.enforceFirstSubsetRouting ?? true;

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
    approvedPacks.length,
    `${MANIFEST_PATH} must include exactly the approved first subset`,
  );

  const seenPaths = new Set();
  for (const [index, pack] of value.packs.entries()) {
    validateManifestPack(pack, `$.packs[${index}]`, seenPaths, {
      approvedPacks,
      approvedPaths,
    });
  }

  assert.deepEqual(
    value.packs.map((pack) => pack.path).sort(),
    [...approvedPaths].sort(),
    `${MANIFEST_PATH} paths must match the imported approved fixture files`,
  );

  if (!enforceFirstSubsetRouting) {
    return;
  }

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

function validateManifestPack(pack, packPath, seenPaths, options) {
  const { approvedPacks, approvedPaths } = options;

  assertObject(pack, packPath);
  assertOnlyKeys(pack, ALLOWED_PACK_KEYS, packPath);
  assertManifestPath(pack.path, `${packPath}.path`);
  assert(!seenPaths.has(pack.path), `${pack.path} must not be duplicated`);
  seenPaths.add(pack.path);
  for (const forbidden of FORBIDDEN_PACK_PATH_FRAGMENTS) {
    assert(
      !pack.path.includes(forbidden),
      `${pack.path} must not reference deferred pack ${forbidden}`,
    );
  }
  assert(
    approvedPaths.has(pack.path),
    `${pack.path} is not part of the approved first imported subset`,
  );

  const expected = approvedPacks.find(
    (candidate) => candidate.path === pack.path,
  );
  assert(expected, `${pack.path} should have an approved routing entry`);
  assert.equal(
    !(pack.default_compare && pack.explicit_only),
    true,
    `${pack.path} cannot be both default_compare and explicit_only`,
  );
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
