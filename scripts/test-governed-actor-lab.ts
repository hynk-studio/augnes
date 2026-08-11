import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  governedActorLabDevelopmentSourcesFixture,
  governedActorLabHoldoutFixture,
  governedActorLabManifestFixture,
  governedActorLabStrategyRecipeRefsFixture,
} from "@/fixtures/vnext/protocol/governed-actor-lab-v0-1";
import {
  resolveGovernedActorLabArtifactPathV01,
  writeGovernedActorLabPilotArtifactsV01,
} from "@/lib/vnext/governed-actor-lab-artifact-store";
import {
  canonicalizeGovernedActorLabValueV01,
  runGovernedActorLabPilotV01,
} from "@/lib/vnext/governed-actor-lab";
import { runGovernedActorLabConformanceV01 } from "@/scripts/vnext-protocol-conformance/governed-actor-lab";

const conformance = runGovernedActorLabConformanceV01();
const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "augnes-governed-actor-lab-"));
const repositoryRoot = path.join(temporaryRoot, "repository");
mkdirSync(repositoryRoot, { recursive: true });
writeFileSync(path.join(repositoryRoot, ".gitignore"), ".augnes-lab/\n", "utf8");

try {
  const pilot = runGovernedActorLabPilotV01({
    manifest: governedActorLabManifestFixture,
    strategy_recipe_refs: governedActorLabStrategyRecipeRefsFixture,
    development_sources: governedActorLabDevelopmentSourcesFixture,
    hidden_holdout: governedActorLabHoldoutFixture,
  });
  const first = writeGovernedActorLabPilotArtifactsV01({
    repository_root: repositoryRoot,
    run_label: "pilot",
    result: pilot,
  });
  const replay = writeGovernedActorLabPilotArtifactsV01({
    repository_root: repositoryRoot,
    run_label: "replay",
    result: pilot,
  });
  assert.equal(first.artifact_count, replay.artifact_count);
  assert.notEqual(
    first.artifact_index_fingerprint,
    replay.artifact_index_fingerprint,
    "run-local indexes bind their distinct run labels",
  );
  assert.equal(
    readFileSync(path.join(first.run_root, "report.json"), "utf8"),
    readFileSync(path.join(replay.run_root, "report.json"), "utf8"),
  );
  assert.equal(
    readFileSync(path.join(first.run_root, "product-zero-effect-ledger.json"), "utf8"),
    `${canonicalizeGovernedActorLabValueV01(pilot.report.product_effects)}\n`,
  );
  assert.ok(first.relative_run_root.startsWith(".augnes-lab/perspective-evolution/"));
  assert.throws(
    () => resolveGovernedActorLabArtifactPathV01(first.lab_root, "..", "escape.json"),
    /actor_lab_artifact_segment_invalid/u,
  );
  assert.throws(
    () =>
      writeGovernedActorLabPilotArtifactsV01({
        repository_root: repositoryRoot,
        run_label: "pilot",
        result: pilot,
      }),
    /actor_lab_run_root_not_clean/u,
  );

  const symlinkRepository = path.join(temporaryRoot, "symlink-repository");
  const outside = path.join(temporaryRoot, "outside");
  mkdirSync(symlinkRepository, { recursive: true });
  mkdirSync(outside, { recursive: true });
  writeFileSync(path.join(symlinkRepository, ".gitignore"), ".augnes-lab/\n", "utf8");
  symlinkSync(outside, path.join(symlinkRepository, ".augnes-lab"));
  assert.throws(
    () =>
      writeGovernedActorLabPilotArtifactsV01({
        repository_root: symlinkRepository,
        run_label: "pilot",
        result: pilot,
      }),
    /actor_lab_symlink_escape_refused/u,
  );

  console.log(
    JSON.stringify(
      {
        ...conformance,
        artifact_store: {
          status: "passed",
          clean_pilot_and_replay_roots_checked: true,
          deterministic_artifact_bytes_checked: true,
          traversal_refusal_checked: true,
          symlink_escape_refusal_checked: true,
          overwrite_refusal_checked: true,
          product_effect_ledger_zero_checked: true,
        },
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
