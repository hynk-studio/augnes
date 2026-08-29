import { readFileSync } from "node:fs";

import {
  consumeCommissionedLiveTrainingAuthorizationV01,
  openCommissionedLiveTrainingArtifactStoreV01,
} from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import type { CommissionedWorkFamilyManifestV01, CommissionedWorkRecordRefV01 } from "@/types/vnext/commissioned-controlled-workbench";
import type {
  CommissionedLiveTrainingAuthorizationV01,
  CommissionedLiveTrainingCohortPlanV01,
  CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
} from "@/types/vnext/commissioned-controlled-live-training";

interface InputV01 {
  repository_root: string;
  family: CommissionedWorkFamilyManifestV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  current_main_sha: string;
  current_main_tree: string;
  checkout_root_fingerprint: string;
  evaluated_at: string;
  authorization_nonce: string;
  consumer_instance_ref: CommissionedWorkRecordRefV01;
}

function main(): void {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("live_training_consumption_fixture_input_required");
  const input = JSON.parse(readFileSync(inputPath, "utf8")) as InputV01;
  const store = openCommissionedLiveTrainingArtifactStoreV01({
    repository_root: input.repository_root,
    plan: input.plan,
    authorization: input.authorization,
    family: input.family,
  });
  const result = consumeCommissionedLiveTrainingAuthorizationV01({
    store,
    authorization: input.authorization,
    plan: input.plan,
    native_execution_configuration: input.native_execution_configuration,
    current_main_sha: input.current_main_sha,
    current_main_tree: input.current_main_tree,
    checkout_root_fingerprint: input.checkout_root_fingerprint,
    evaluated_at: input.evaluated_at,
    authorization_nonce: input.authorization_nonce,
    consumer_instance_ref: input.consumer_instance_ref,
    allow_test_conformance: true,
  });
  process.stdout.write(`${result.consumption.integrity.fingerprint}\n`);
}

try {
  main();
} catch (error) {
  const code =
    error && typeof error === "object" && "code" in error &&
    typeof error.code === "string"
      ? error.code
      : error instanceof Error
        ? error.message
        : "live_training_consumption_fixture_failed";
  process.stderr.write(`${code}\n`);
  process.exitCode = 1;
}
