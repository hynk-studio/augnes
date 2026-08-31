import type { CodexIsolatedAuthenticatedExecutionOwnerV01 } from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import type {
  CodexIsolatedAuthProductionExecutionAuthorizationV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

/**
 * Historical compatibility boundary for the terminated ACGC-CW1 track.
 *
 * The former implementation minted and consumed CW1-specific production
 * execution authorizations and therefore pulled the generic Codex App Server
 * adapter into the complete CW1 cohort/witness/artifact graph. CW1 terminated
 * before obtaining a usable empirical result, and no current product or managed
 * execution consumer uses this production authorization route.
 *
 * Keep the named exports temporarily so the generic adapter and historical CW1
 * source continue to compile while every production path fails closed. Git
 * history owns the retired implementation. A future production isolated-auth
 * consumer must introduce a newly reviewed generic authorization owner rather
 * than reviving this CW1 registry implicitly.
 */

export class CommissionedLiveTrainingExecutionAuthorizationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedLiveTrainingExecutionAuthorizationErrorV01";
  }
}

const RETIRED_CREATION_CODE_V01 =
  "cw1_historical_external_execution_authorization_retired" as const;
const RETIRED_SOURCE_CODE_V01 =
  "live_training_external_execution_authorization_source_identity_missing" as const;

export function commissionedLiveTrainingExternalExecutionExecutableBindingMatchesV01(
  _input: unknown,
): boolean {
  return false;
}

export function createCommissionedLiveTrainingExternalExecutionAuthorizationV01(
  _input: unknown,
): CodexIsolatedAuthProductionExecutionAuthorizationV01 {
  throw new CommissionedLiveTrainingExecutionAuthorizationErrorV01(
    RETIRED_CREATION_CODE_V01,
  );
}

export function createCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(
  _input: unknown,
): CodexIsolatedAuthProductionExecutionAuthorizationV01 {
  throw new CommissionedLiveTrainingExecutionAuthorizationErrorV01(
    RETIRED_CREATION_CODE_V01,
  );
}

export interface CommissionedLiveTrainingExternalExecutionAuthorizationAdapterObservationV01 {
  owner: CodexIsolatedAuthenticatedExecutionOwnerV01;
  request_id: string;
  run_id: string;
  root_scope_fingerprint: string;
  projection_fingerprint: string;
  execution_environment_fingerprint: string;
  provider_ref: ExternalRefV01;
  model_configuration_fingerprint: string;
  effective_route_fingerprint: string;
  observed_model_id: string | null;
  observed_reasoning_effort: string | null;
  observed_at: string;
}

export function assertCommissionedLiveTrainingExternalExecutionAuthorizationSourceOwnedV01(
  _authorization: CodexIsolatedAuthProductionExecutionAuthorizationV01,
): void {
  throw new CommissionedLiveTrainingExecutionAuthorizationErrorV01(
    RETIRED_SOURCE_CODE_V01,
  );
}

export function consumeCommissionedLiveTrainingExternalExecutionAuthorizationForAdapterV01(
  _authorization: CodexIsolatedAuthProductionExecutionAuthorizationV01,
  _input: CommissionedLiveTrainingExternalExecutionAuthorizationAdapterObservationV01,
): void {
  throw new CommissionedLiveTrainingExecutionAuthorizationErrorV01(
    RETIRED_SOURCE_CODE_V01,
  );
}

export function assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
  _value: unknown,
): asserts _value is CodexIsolatedAuthProductionExecutionAuthorizationV01 {
  throw new CommissionedLiveTrainingExecutionAuthorizationErrorV01(
    RETIRED_CREATION_CODE_V01,
  );
}
