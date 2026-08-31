import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const closeoutPath = path.join(
  repositoryRoot,
  "docs/vnext/research/ACGC_CW1_TERMINAL_CLOSEOUT_AND_SALVAGE_V0_1.md",
);
const closeout = readFileSync(closeoutPath, "utf8");

for (const required of [
  "empirical_objective = not_achieved",
  "usable_experimental_result = none",
  "scientific_disposition = not_tested",
  "track_disposition = terminal_history",
  "CW1 experiment/corpus/schedule/result machinery = HISTORICAL_CW1",
]) {
  assert.ok(
    closeout.includes(required),
    `CW1 terminal closeout is missing required historical boundary: ${required}`,
  );
}

process.stdout.write(
  `${JSON.stringify({
    status: "pass",
    surface: "commissioned-controlled-workbench",
    disposition: "historical_cw1",
    empirical_execution_performed: false,
    provider_or_model_calls: 0,
    holdout_activity: 0,
  })}\n`,
);
