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

type SidecarEtPressureLevel = "none" | "low" | "medium" | "high";

type SidecarEtSourceRefCompleteness = "empty" | "partial" | "complete";

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

export type SidecarEtOfflineFixtureCandidate = {
  version: "sidecar_e_t.offline_fixture_candidate.v0.1";
  mode: "log_only";
  status: "fixture_only_candidate";
  computed: true;
  fixture_only: true;
  runtime_enabled: false;
  values: {
    missing_basis: boolean;
    repeated_trace_pressure: SidecarEtPressureLevel;
    unresolved_tension_pressure: SidecarEtPressureLevel;
    source_ref_completeness: SidecarEtSourceRefCompleteness;
    sidecar_e_t_candidate_summary: string;
    qp_observability_proxy_candidate_summary: string;
    z_t_regime_hint_candidate_summary: string;
  };
  source_refs: Required<SidecarEtRefSet>;
  notes: string[];
};

export type SidecarEtOfflineInputBoundaryValidation = {
  valid: boolean;
  reason:
    | "valid"
    | "missing_input"
    | "non_object_input"
    | "array_input"
    | "unsupported_top_level_key"
    | "missing_scope"
    | "non_string_scope"
    | "empty_scope"
    | "missing_already_read_refs"
    | "malformed_already_read_refs"
    | "malformed_fixture_metadata"
    | "malformed_candidate_source_refs"
    | "candidate_refs_not_already_read";
};

export function buildSidecarEtOfflineDiagnosticCandidate(
  input?: unknown,
): SidecarEtOfflineDiagnosticCandidate {
  validateSidecarEtOfflineInputBoundary(input);

  return buildSidecarEtPlaceholderFallback();
}

export function buildSidecarEtOfflineFixtureCandidate(
  input?: unknown,
): SidecarEtOfflineDiagnosticCandidate | SidecarEtOfflineFixtureCandidate {
  const validation = validateSidecarEtOfflineInputBoundary(input);
  if (!validation.valid || !isPlainObject(input)) {
    return buildSidecarEtPlaceholderFallback();
  }

  const helperInput = input as SidecarEtOfflineHelperInput;
  if (helperInput.candidate_source_refs === undefined) {
    return buildSidecarEtPlaceholderFallback();
  }

  const category = helperInput.fixture_metadata?.category ?? "unknown";
  if (category === "invalid-input" || category === "source-ref-boundary") {
    return buildSidecarEtPlaceholderFallback();
  }

  const candidateRefs = normalizeRefSet(helperInput.candidate_source_refs);
  const alreadyReadRefs = normalizeRefSet(helperInput.already_read_refs);
  const candidateRefCount = countRefs(candidateRefs);
  const alreadyReadRefCount = countRefs(alreadyReadRefs);
  const missingBasis =
    candidateRefCount === 0 ||
    alreadyReadRefCount === 0 ||
    category === "missing-context";

  const repeatedTracePressure = deriveRepeatedTracePressure({
    category,
    candidateRefs,
  });
  const unresolvedTensionPressure = deriveUnresolvedTensionPressure({
    category,
    candidateRefs,
  });
  const sourceRefCompleteness = deriveSourceRefCompleteness({
    candidateRefCount,
    alreadyReadRefCount,
    candidateRefs,
    alreadyReadRefs,
  });

  return {
    version: "sidecar_e_t.offline_fixture_candidate.v0.1",
    mode: "log_only",
    status: "fixture_only_candidate",
    computed: true,
    fixture_only: true,
    runtime_enabled: false,
    values: {
      missing_basis: missingBasis,
      repeated_trace_pressure: repeatedTracePressure,
      unresolved_tension_pressure: unresolvedTensionPressure,
      source_ref_completeness: sourceRefCompleteness,
      sidecar_e_t_candidate_summary: buildSidecarFixtureSummary({
        category,
        missingBasis,
        repeatedTracePressure,
        unresolvedTensionPressure,
        sourceRefCompleteness,
      }),
      qp_observability_proxy_candidate_summary:
        "Fixture-only bounded observability caveat; no QP output is created and no QP value is treated as evidence.",
      z_t_regime_hint_candidate_summary:
        "Fixture-only bounded regime caveat; no z_t update, commit, or regime authority is created.",
    },
    source_refs: candidateRefs,
    notes: [
      "fixture-only",
      "log_only",
      "non-authoritative",
      "not runtime",
      "not actual Sidecar state",
      "not QP evidence",
      "not z_t commit",
      "not source of truth",
      "not proposal scoring",
      "not commit/reject input",
      "not Gate/SRF input",
      "not Claim confidence or Evidence status input",
      "not publication readiness",
      "not Cockpit action input",
      "source_refs are emitted only after validation proves candidate_source_refs are a subset of already_read_refs",
    ],
  };
}

export function validateSidecarEtOfflineInputBoundary(
  input?: unknown,
): SidecarEtOfflineInputBoundaryValidation {
  if (input === undefined) {
    return invalid("missing_input");
  }

  if (Array.isArray(input)) {
    return invalid("array_input");
  }

  if (!isPlainObject(input)) {
    return invalid("non_object_input");
  }

  const allowedKeys = new Set([
    "scope",
    "already_read_refs",
    "fixture_metadata",
    "candidate_source_refs",
  ]);

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      return invalid("unsupported_top_level_key");
    }
  }

  if (!("scope" in input)) {
    return invalid("missing_scope");
  }

  if (typeof input.scope !== "string") {
    return invalid("non_string_scope");
  }

  if (input.scope.length === 0) {
    return invalid("empty_scope");
  }

  if (!("already_read_refs" in input)) {
    return invalid("missing_already_read_refs");
  }

  if (!isRefSet(input.already_read_refs)) {
    return invalid("malformed_already_read_refs");
  }

  if (
    input.fixture_metadata !== undefined &&
    !isFixtureMetadata(input.fixture_metadata)
  ) {
    return invalid("malformed_fixture_metadata");
  }

  if (
    input.candidate_source_refs !== undefined &&
    !isRefSet(input.candidate_source_refs)
  ) {
    return invalid("malformed_candidate_source_refs");
  }

  if (
    input.candidate_source_refs !== undefined &&
    !isSubsetRefSet(input.candidate_source_refs, input.already_read_refs)
  ) {
    return invalid("candidate_refs_not_already_read");
  }

  return {
    valid: true,
    reason: "valid",
  };
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

function normalizeRefSet(
  refs: SidecarEtRefSet | undefined,
): Required<SidecarEtRefSet> {
  return {
    state_entry_ids: [...(refs?.state_entry_ids ?? [])],
    action_record_ids: [...(refs?.action_record_ids ?? [])],
    work_event_ids: [...(refs?.work_event_ids ?? [])],
    tension_ids: [...(refs?.tension_ids ?? [])],
  };
}

function countRefs(refs: SidecarEtRefSet) {
  return (
    (refs.state_entry_ids ?? []).length +
    (refs.action_record_ids ?? []).length +
    (refs.work_event_ids ?? []).length +
    (refs.tension_ids ?? []).length
  );
}

function deriveRepeatedTracePressure({
  category,
  candidateRefs,
}: {
  category: string;
  candidateRefs: Required<SidecarEtRefSet>;
}): SidecarEtPressureLevel {
  if (category === "repeated/noisy") {
    const traceCount =
      candidateRefs.action_record_ids.length +
      candidateRefs.work_event_ids.length;
    if (traceCount >= 4) {
      return "high";
    }
    if (traceCount >= 2) {
      return "medium";
    }
    if (traceCount === 1) {
      return "low";
    }
  }

  return "none";
}

function deriveUnresolvedTensionPressure({
  category,
  candidateRefs,
}: {
  category: string;
  candidateRefs: Required<SidecarEtRefSet>;
}): SidecarEtPressureLevel {
  if (
    (category === "repeated/noisy" || category === "conflicting-context") &&
    candidateRefs.tension_ids.length > 0
  ) {
    return candidateRefs.tension_ids.length > 1 ? "medium" : "low";
  }

  return "none";
}

function deriveSourceRefCompleteness({
  candidateRefCount,
  alreadyReadRefCount,
  candidateRefs,
  alreadyReadRefs,
}: {
  candidateRefCount: number;
  alreadyReadRefCount: number;
  candidateRefs: Required<SidecarEtRefSet>;
  alreadyReadRefs: Required<SidecarEtRefSet>;
}): SidecarEtSourceRefCompleteness {
  if (candidateRefCount === 0) {
    return "empty";
  }

  if (
    alreadyReadRefCount > 0 &&
    candidateRefCount === alreadyReadRefCount &&
    isSubsetRefSet(alreadyReadRefs, candidateRefs)
  ) {
    return "complete";
  }

  return "partial";
}

function buildSidecarFixtureSummary({
  category,
  missingBasis,
  repeatedTracePressure,
  unresolvedTensionPressure,
  sourceRefCompleteness,
}: {
  category: string;
  missingBasis: boolean;
  repeatedTracePressure: SidecarEtPressureLevel;
  unresolvedTensionPressure: SidecarEtPressureLevel;
  sourceRefCompleteness: SidecarEtSourceRefCompleteness;
}) {
  if (missingBasis) {
    return `Fixture-only ${category} candidate reports missing basis with ${sourceRefCompleteness} source refs; no runtime diagnostic or authority is produced.`;
  }

  if (category === "conflicting-context") {
    return `Fixture-only conflicting-context candidate reports bounded unresolved tension pressure=${unresolvedTensionPressure}; no z_t commit, evidence effect, or authority is produced.`;
  }

  return `Fixture-only ${category} candidate reports repeated_trace_pressure=${repeatedTracePressure}, unresolved_tension_pressure=${unresolvedTensionPressure}, and source_ref_completeness=${sourceRefCompleteness}; no runtime diagnostic or authority is produced.`;
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

function invalid(
  reason: Exclude<SidecarEtOfflineInputBoundaryValidation["reason"], "valid">,
): SidecarEtOfflineInputBoundaryValidation {
  return {
    valid: false,
    reason,
  };
}
