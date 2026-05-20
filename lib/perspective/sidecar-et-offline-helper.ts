type SidecarEtRefSet = {
  state_entry_ids?: string[];
  action_record_ids?: string[];
  work_event_ids?: string[];
  tension_ids?: string[];
};

type FixtureMetadata = {
  category?: string;
  notes?: string[];
};

export type SidecarEtOfflineHelperInput = {
  scope?: string;
  already_read_refs?: SidecarEtRefSet;
  fixture_metadata?: FixtureMetadata;
  candidate_source_refs?: SidecarEtRefSet;
};

export type SidecarEtOfflineDiagnosticCandidate = {
  version: "sidecar_e_t.placeholder.v0.1";
  mode: "log_only";
  status: "placeholder";
  computed: false;
  values: {
    e_t_register: null;
    qp_observability_proxy: null;
    z_t_regime_hint: null;
    sidecar_state_summary: null;
    sidecar_e_t_hat: null;
  };
  source_refs: string[];
  notes: string[];
};

export function buildSidecarEtOfflineDiagnosticCandidate(
  input?: SidecarEtOfflineHelperInput | null,
): SidecarEtOfflineDiagnosticCandidate {
  validateBoundaryOnly(input);

  return buildSidecarEtPlaceholderFallback();
}

function buildSidecarEtPlaceholderFallback(): SidecarEtOfflineDiagnosticCandidate {
  return {
    version: "sidecar_e_t.placeholder.v0.1",
    mode: "log_only",
    status: "placeholder",
    computed: false,
    values: {
      e_t_register: null,
      qp_observability_proxy: null,
      z_t_regime_hint: null,
      sidecar_state_summary: null,
      sidecar_e_t_hat: null,
    },
    source_refs: [],
    notes: [
      "Sidecar e_t is reserved for future Sidecar diagnostics.",
      "This placeholder is not computed and has no authority.",
      "This placeholder is not actual Sidecar state.",
      "It does not run a Sidecar loop, update or commit z_t, create QP output, or commit any regime/state.",
      "It must not affect commit/reject, proposal scoring, Gate/SRF, Claim confidence, Evidence status, publication readiness, Cockpit actions, or any Core state.",
      "Placeholder fallback is returned by the offline helper skeleton for every input.",
    ],
  };
}

function validateBoundaryOnly(input?: SidecarEtOfflineHelperInput | null) {
  if (!isPlainObject(input)) {
    return false;
  }

  if (typeof input.scope !== "string" || input.scope.length === 0) {
    return false;
  }

  const allowedKeys = new Set([
    "scope",
    "already_read_refs",
    "fixture_metadata",
    "candidate_source_refs",
  ]);

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      return false;
    }
  }

  if (!isRefSet(input.already_read_refs)) {
    return false;
  }

  if (
    input.fixture_metadata !== undefined &&
    !isFixtureMetadata(input.fixture_metadata)
  ) {
    return false;
  }

  if (
    input.candidate_source_refs !== undefined &&
    (!isRefSet(input.candidate_source_refs) ||
      !isSubsetRefSet(input.candidate_source_refs, input.already_read_refs))
  ) {
    return false;
  }

  return true;
}

function isFixtureMetadata(value: unknown): value is FixtureMetadata {
  if (!isPlainObject(value)) {
    return false;
  }

  if (value.category !== undefined && typeof value.category !== "string") {
    return false;
  }

  if (
    value.notes !== undefined &&
    (!Array.isArray(value.notes) ||
      !value.notes.every((note) => typeof note === "string"))
  ) {
    return false;
  }

  return true;
}

function isRefSet(value: unknown): value is SidecarEtRefSet {
  if (!isPlainObject(value)) {
    return false;
  }

  const allowedKeys = new Set([
    "state_entry_ids",
    "action_record_ids",
    "work_event_ids",
    "tension_ids",
  ]);

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      return false;
    }
  }

  return (
    isOptionalStringArray(value.state_entry_ids) &&
    isOptionalStringArray(value.action_record_ids) &&
    isOptionalStringArray(value.work_event_ids) &&
    isOptionalStringArray(value.tension_ids)
  );
}

function isSubsetRefSet(candidate: SidecarEtRefSet, alreadyRead: SidecarEtRefSet) {
  return (
    isSubset(candidate.state_entry_ids ?? [], alreadyRead.state_entry_ids ?? []) &&
    isSubset(
      candidate.action_record_ids ?? [],
      alreadyRead.action_record_ids ?? [],
    ) &&
    isSubset(candidate.work_event_ids ?? [], alreadyRead.work_event_ids ?? []) &&
    isSubset(candidate.tension_ids ?? [], alreadyRead.tension_ids ?? [])
  );
}

function isSubset(candidate: string[], alreadyRead: string[]) {
  const alreadyReadSet = new Set(alreadyRead);
  return candidate.every((ref) => alreadyReadSet.has(ref));
}

function isOptionalStringArray(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
