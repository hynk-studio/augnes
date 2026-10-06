import type { ReconstructionConformanceLaneStatusV01, ReconstructionConformanceReportV01 } from "./reconstruction-conformance";

export const RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V02 = "reconstruction_conformance_report.v0.2" as const;
export const RECONSTRUCTION_SELECTION_PROFILE_V01 = "preserved_history_fresh_selection.v0.1" as const;

export interface ReconstructionObservationCheckV02 {
  check: string;
  status: "match" | "mismatch" | "incomplete";
  non_compensable: true;
}

/** A local, captured comparison; neither a live write precondition nor remote attestation. */
export interface ReconstructionConformanceReportV02 {
  report_version: typeof RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V02;
  profile: typeof RECONSTRUCTION_SELECTION_PROFILE_V01;
  legacy: ReconstructionConformanceReportV01;
  allowed_differences: readonly string[];
  preservation: {
    status: ReconstructionConformanceLaneStatusV01;
    checks: ReconstructionObservationCheckV02[];
  };
  local_observations: {
    status: ReconstructionConformanceLaneStatusV01;
    checks: ReconstructionObservationCheckV02[];
    baseline_binding: string | null;
    reconstructed_binding: string | null;
  };
  status: ReconstructionConformanceLaneStatusV01;
  integrity: ReconstructionConformanceReportV01["integrity"];
}
