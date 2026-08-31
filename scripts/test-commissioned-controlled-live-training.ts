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
  "confirmed_terminal_blocker = codex_0_150_1_agent_identity_registration_retry_exhaustion",
  "scientific_disposition = not_tested",
  "track_disposition = terminal_history",
  "No retry, replacement cohort, new authentication route, holdout access, or CW1",
  "CW1-specific Local Canonical children and their recurring verification cost",
]) {
  assert.ok(
    closeout.includes(required),
    `CW1 terminal closeout is missing required live-training retirement boundary: ${required}`,
  );
}

process.stdout.write(
  `${JSON.stringify({
    status: "pass",
    surface: "commissioned-controlled-live-training",
    disposition: "historical_cw1",
    empirical_execution_performed: false,
    authorization_created_or_consumed: false,
    credential_read: false,
    provider_or_model_calls: 0,
    holdout_activity: 0,
  })}\n`,
);
