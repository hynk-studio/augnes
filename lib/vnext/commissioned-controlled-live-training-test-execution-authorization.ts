import {
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01,
} from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import { createCodexIsolatedAuthTestExecutionAuthorizationV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  assertSourceOwnedCodexIsolatedExecutionOwnerV01,
  type CodexIsolatedAuthenticatedExecutionOwnerV01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  CommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  CommissionedLiveTrainingScheduleSlotV01,
} from "@/types/vnext/commissioned-controlled-live-training";
import type { CodexIsolatedAuthTestExecutionAuthorizationV01 } from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { NativeHostRequestV01 } from "@/types/vnext/native-host-adapter";

export function createCommissionedLiveTrainingTestExecutionAuthorizationV01(input: {
  witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request: NativeHostRequestV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  invocation_ordinal: number;
  expires_at: string;
}): CodexIsolatedAuthTestExecutionAuthorizationV01 {
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01(
    input.witness,
  );
  assertSourceOwnedCodexIsolatedExecutionOwnerV01(input.owner);
  const source = reserveCommissionedLiveTrainingRuntimeWitnessInvocationV01({
    witness: input.witness,
    invocation_ordinal: input.invocation_ordinal,
    slot: input.slot,
    attempt_id: input.attempt_id,
    attempt_kind: input.attempt_kind,
  });
  if (
    ![
      "test_conformance",
      "future_live_control_flow_conformance",
    ].includes(source.authorization.authorization_kind) ||
    input.owner.projection.executable_identity_class !==
      "test_emulated_profile" ||
    input.owner.repository_root_fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          version: "codex_isolated_auth_repository_root.v0.1",
          canonical_root: input.request.root_scope.canonical_root,
        }),
      )
  )
    throw new Error("live_training_test_execution_authorization_refused");
  return createCodexIsolatedAuthTestExecutionAuthorizationV01({
    owner: input.owner,
    request: input.request,
    external_authorization_ref: externalAuthorizationRefV01({
      authorization_id: `${input.attempt_id}-${input.invocation_ordinal}-test`,
      observed_at: source.consumption.consumed_at,
    }),
    expires_at: input.expires_at,
  });
}

function externalAuthorizationRefV01(input: {
  authorization_id: string;
  observed_at: string;
}): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "codex_isolated_auth_test_execution_authorization",
    external_id: input.authorization_id,
    provider: "augnes",
    host: "local",
    observed_at: input.observed_at,
    compatibility_namespace:
      "codex_isolated_auth_test_external_execution_authorization.v0.1",
    trust_class: "direct_local_observation",
  };
}
