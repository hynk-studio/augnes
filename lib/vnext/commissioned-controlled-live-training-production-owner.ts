export const COMMISSIONED_LIVE_TRAINING_PRODUCTION_RUNTIME_AUTH_BINDING_VERSION_V01 =
  "commissioned_live_training_production_runtime_auth_binding.v0.1" as const;

/**
 * Historical compatibility shape retained temporarily while the terminated
 * ACGC-CW1 source family is reduced. It grants no execution or credential
 * authority and has no current producer.
 */
export interface CommissionedLiveTrainingProductionRuntimeAuthBindingV01 {
  binding_version: typeof COMMISSIONED_LIVE_TRAINING_PRODUCTION_RUNTIME_AUTH_BINDING_VERSION_V01;
}

export class CommissionedLiveTrainingProductionOwnerRetiredErrorV01 extends Error {
  constructor() {
    super("cw1_historical_live_training_production_owner_retired");
    this.name = "CommissionedLiveTrainingProductionOwnerRetiredErrorV01";
  }
}

export function commissionedLiveTrainingProductionOwnerExecutableBindingMatchesV01(
  _input: unknown,
): boolean {
  return false;
}

export function parseCommissionedLiveTrainingProductionRuntimeAuthBindingV01(
  _value: unknown,
): CommissionedLiveTrainingProductionRuntimeAuthBindingV01 {
  throw new CommissionedLiveTrainingProductionOwnerRetiredErrorV01();
}

export function createCommissionedLiveTrainingProductionOwnerFactoryV01(
  _input: unknown,
): never {
  throw new CommissionedLiveTrainingProductionOwnerRetiredErrorV01();
}
