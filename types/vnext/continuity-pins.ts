import type { BlankStateContinuitySourceFamilyV01 } from "./blank-state";

export const CONTINUITY_PIN_TARGET_VERSION_V01 =
  "continuity_pin_target.v0.1" as const;
export const PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01 =
  "project_continuity_pin_collection.v0.1" as const;
export const PROJECT_CONTINUITY_PIN_PROJECTION_VERSION_V01 =
  "project_continuity_pin_projection.v0.1" as const;
export const PROJECT_CONTINUITY_PIN_LIMIT_V01 = 12 as const;

export type ContinuityPinCoreRecordKindV01 =
  | "episode_delta_proposal"
  | "review_decision"
  | "state_transition_receipt"
  | "run_receipt";

export type ContinuityPinSupportedOwnerV01 =
  | {
      kind: "managed_run";
      run_ref: string;
    }
  | {
      kind: "core_record";
      record_kind: ContinuityPinCoreRecordKindV01;
      record_id: string;
    };

/**
 * A retained compatibility shape for a once-supported owner family.
 * Current UI code never creates this target. It lets an additive store keep a
 * truthful unavailable pin instead of dropping or silently retargeting it.
 */
export interface ContinuityPinUnsupportedOwnerV01 {
  kind: "unsupported_source";
  source_family: string;
  source_key: string;
}

export interface ContinuityPinTargetRefV01 {
  target_version: typeof CONTINUITY_PIN_TARGET_VERSION_V01;
  workspace_id: string;
  project_id: string;
  owner: ContinuityPinSupportedOwnerV01 | ContinuityPinUnsupportedOwnerV01;
}

export interface ContinuityPinEligibilityEligibleV01 {
  status: "eligible";
  target: ContinuityPinTargetRefV01 & {
    owner: ContinuityPinSupportedOwnerV01;
  };
  source_item_id: string;
}

export interface ContinuityPinEligibilityUnsupportedV01 {
  status: "unsupported";
  reason_code:
    | "no_current_project"
    | "transient_project_projection"
    | "durable_owner_unavailable"
    | "source_family_unsupported";
  reason: string;
}

export type ContinuityPinEligibilityV01 =
  | ContinuityPinEligibilityEligibleV01
  | ContinuityPinEligibilityUnsupportedV01;

export type ProjectContinuityPinResolutionStatusV01 =
  | "resolved"
  | "temporarily_unavailable"
  | "no_longer_supported";

export interface ProjectContinuityPinV01 {
  pin_handle: string;
  target: ContinuityPinTargetRefV01;
  source_family_snapshot: BlankStateContinuitySourceFamilyV01;
  source_item_id_snapshot: string;
  label: string;
  state_label: string;
  resolution_status: ProjectContinuityPinResolutionStatusV01;
  destination: string | null;
  exact_detail_destination: string | null;
  sort_order: number;
  pinned_at: string;
  updated_at: string;
  projection_only: true;
  semantic_authority_granted: false;
  execution_authority_granted: false;
}

export interface ProjectContinuityPinProjectionV01 {
  projection_version: typeof PROJECT_CONTINUITY_PIN_PROJECTION_VERSION_V01;
  collection_version: typeof PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  revision: number;
  pins: ProjectContinuityPinV01[];
  projection_only: true;
  semantic_authority_granted: false;
  execution_authority_granted: false;
}

export type ProjectContinuityPinMutationActionV01 =
  | {
      action: "pin";
      expected_revision: number;
      target: ContinuityPinTargetRefV01 & {
        owner: ContinuityPinSupportedOwnerV01;
      };
      source_family: BlankStateContinuitySourceFamilyV01;
      source_item_id: string;
      label_snapshot: string;
      state_snapshot: string;
    }
  | {
      action: "unpin";
      expected_revision: number;
      target: ContinuityPinTargetRefV01;
    }
  | {
      action: "reorder";
      expected_revision: number;
      target_order: ContinuityPinTargetRefV01[];
    };

export type ProjectContinuityPinMutationStatusV01 =
  | "pinned"
  | "already_pinned"
  | "unpinned"
  | "already_unpinned"
  | "reordered"
  | "order_unchanged";

export interface ProjectContinuityPinMutationResultV01 {
  status: ProjectContinuityPinMutationStatusV01;
  collection: ProjectContinuityPinProjectionV01;
}
