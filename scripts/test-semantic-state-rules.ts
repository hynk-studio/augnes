import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

import baseline from "../fixtures/vnext/persistence/semantic-state-baseline-v0-1.json";
import * as rules from "../lib/vnext/semantic-state-rules";

interface Edit {
  path: string;
  remove?: boolean;
  value?: unknown;
}

// Compare JSON records across the ordinary and restricted VM realms.
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function freezeFixture(value: unknown): void {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freezeFixture(child);
  }
}

function edited(input: unknown, edits: readonly Edit[]): unknown {
  const value = structuredClone(input);
  for (const edit of edits) {
    const keys = edit.path.split(".");
    const last = keys.pop()!;
    let parent = value as Record<string, unknown>;
    for (const key of keys) parent = parent[key] as Record<string, unknown>;
    if (edit.remove) delete parent[last];
    else parent[last] = edit.value;
  }
  return value;
}

// These expectations were captured before extraction from committed disposable
// writer records. No fixture builder or current implementation generates them.
function checkParity(api: typeof rules): void {
  for (const fixture of baseline.cases) {
    const input = fixture.input as Parameters<typeof api.buildVNextPersistedSemanticStateV01>[0];
    const expected = fixture.persisted_state;
    assert.deepEqual(plain(api.buildVNextPersistedSemanticStateV01(input)), expected, fixture.id);
    assert.deepEqual(plain(api.rebuildVNextPersistedSemanticStateV01(expected)), expected, fixture.id);
    assert.deepEqual(plain(api.validateVNextPersistedSemanticStateV01(expected)), {
      status: "valid", errors: [], normalized_state: expected,
    });
    assert.deepEqual(plain(api.createVNextSemanticTargetIdentityV01(input.target_ref)),
      expected.state_content.target_semantic_identity);
    assert.equal(api.deriveVNextSemanticTargetKeyV01(input.target_ref), expected.target_key);

    // Normalization must keep these existing identities and fingerprints, not
    // create a different historical record or make optional bindings mandatory.
    const padded = edited(expected, [
      { path: "bounded_state_summary", value: `  ${expected.bounded_state_summary}\n` },
      { path: "state_content.proposed_state_summary", value: `\t${expected.bounded_state_summary} ` },
      { path: "target_ref.external_id", value: ` ${expected.target_ref.external_id} ` },
    ]);
    assert.deepEqual(plain(api.rebuildVNextPersistedSemanticStateV01(padded)), expected);
  }

  for (const refusal of baseline.negatives) {
    const fixture = baseline.cases.find((item) => item.id === refusal.case_id)!;
    const value = edited(refusal.operation === "build" ? fixture.input : fixture.persisted_state, refusal.edits);
    if (refusal.operation === "rebuild") {
      assert.deepEqual(plain(api.validateVNextPersistedSemanticStateV01(value)),
        refusal.expected_validation, refusal.id);
    }
    assert.throws(() => refusal.operation === "build"
      ? api.buildVNextPersistedSemanticStateV01(value as Parameters<typeof api.buildVNextPersistedSemanticStateV01>[0])
      : api.rebuildVNextPersistedSemanticStateV01(value), (error: unknown) => {
      assert(error instanceof Error, refusal.id);
      const detail = error as Error & { code?: string; path?: string };
      assert.deepEqual({
        name: detail.name, message: detail.message,
        ...(detail.code ? { code: detail.code } : {}),
        ...(detail.path ? { path: detail.path } : {}),
      }, refusal.expected_error, refusal.id);
      if (detail.name === "VNextPersistedSemanticStateValidationErrorV01") {
        assert(error instanceof api.VNextPersistedSemanticStateValidationErrorV01);
      }
      return true;
    });
  }
}

async function main(): Promise<void> {
  const databasePath = process.env.AUGNES_DB_PATH;
  if (databasePath) assert.equal(existsSync(databasePath), false);
  freezeFixture(baseline);
  checkParity(rules);

  // Bundle without tree shaking so an unused runtime import cannot hide a
  // storage/service dependency. Type-only edges are intentionally erased.
  const bundle = await build({
    entryPoints: ["lib/vnext/semantic-state-rules.ts"],
    bundle: true, write: false, metafile: true, platform: "node", format: "cjs",
    treeShaking: false, packages: "external", logLevel: "silent",
  });
  const runtimeFiles = Object.keys(bundle.metafile.inputs).sort();
  assert.deepEqual(runtimeFiles, [
    "lib/vnext/episode-delta-candidate.ts",
    "lib/vnext/project-verify-lifecycle-protocol.ts",
    "lib/vnext/protocol-primitives.ts",
    "lib/vnext/semantic-state-rules.ts",
    "lib/vnext/strict-iso-timestamp.ts",
    "types/vnext/episode-delta-proposal.ts",
    "types/vnext/external-ref.ts",
    "types/vnext/project-verify-lifecycle.ts",
  ]);
  const externalImports = Object.values(bundle.metafile.inputs)
    .flatMap((input) => input.imports.filter((item) => item.external).map((item) => item.path));
  assert.deepEqual([...new Set(externalImports)], ["node:crypto"]);

  // Execute the full parity matrix again with no DB, schema, environment, file,
  // network, timer, wall clock or random capability available to the rules.
  const module = { exports: {} };
  const sandbox = {
    module, exports: module.exports, Error,
    require(name: string) {
      assert.equal(name, "node:crypto");
      return { createHash };
    },
  };
  runInNewContext(`
    Date = new Proxy(Date, {
      apply() { throw Error("implicit clock forbidden"); },
      construct(target, args) {
        if (!args.length) throw Error("implicit clock forbidden");
        return Reflect.construct(target, args);
      },
      get(target, key) {
        if (key === "now") return () => { throw Error("implicit clock forbidden"); };
        return Reflect.get(target, key);
      },
    });
    Math.random = () => { throw Error("randomness forbidden"); };
    ${bundle.outputFiles[0]!.text}
  `, sandbox, { timeout: 5_000 });
  checkParity(module.exports as typeof rules);
  if (databasePath) assert.equal(existsSync(databasePath), false);
  console.log(JSON.stringify({ suite: "semantic-state-rules", status: "passed",
    persisted_variants: baseline.cases.map((item) => item.id),
    baseline_refusals: baseline.negatives.length, db_free_runtime_files: runtimeFiles,
    external_capability: "node:crypto.createHash only", database_created: false }));
}

void main();
