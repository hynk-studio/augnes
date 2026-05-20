import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(
  path.join(tmpdir(), "augnes-sidecar-et-fixture-boundaries-"),
);
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
delete process.env.OPENAI_API_KEY;
delete process.env.GITHUB_TOKEN;
delete process.env.GH_TOKEN;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "Sidecar e_t fixture boundary smoke must not make live external calls",
  );
};

const CLEAN_SCOPE = "project:sidecar-et-clean";
const REPEATED_NOISY_SCOPE = "project:sidecar-et-repeated-noisy";
const MISSING_CONTEXT_SCOPE = "project:sidecar-et-missing-context";
const CONFLICTING_CONTEXT_SCOPE = "project:sidecar-et-conflicting-context";
const INVALID_INPUT_SCOPE = "project:sidecar-et-invalid-input";
const SOURCE_REF_BOUNDARY_SCOPE = "project:sidecar-et-source-ref-boundary";
const OUTSIDE_SOURCE_REF_SCOPE = "project:sidecar-et-outside-source-ref";
const REPEATED_WORK_ID = "AG-SIDECAR-ET-REPEATED-NOISY";

const FIXTURES = [
  {
    scope: CLEAN_SCOPE,
    category: "clean/minimal",
    expectedLoopnessLevel: "none",
  },
  {
    scope: REPEATED_NOISY_SCOPE,
    category: "repeated/noisy",
    expectedLoopnessLevel: "medium",
  },
  {
    scope: MISSING_CONTEXT_SCOPE,
    category: "missing-context",
  },
  {
    scope: CONFLICTING_CONTEXT_SCOPE,
    category: "conflicting-context",
  },
  {
    scope: INVALID_INPUT_SCOPE,
    category: "invalid-input",
    attemptedRefs: [
      "malformed-ref",
      "unsupported:sidecar-et:diagnostic",
      "../not-a-canonical-ref",
    ],
  },
  {
    scope: SOURCE_REF_BOUNDARY_SCOPE,
    category: "source-ref-boundary",
    attemptedRefs: [
      "state:sidecar-et:outside-scope",
      "evidence:sidecar-et:not-read",
      "proposal:sidecar-et:not-read",
    ],
  },
];

const ROUTE_SCOPES = [CLEAN_SCOPE, REPEATED_NOISY_SCOPE];

const AUTHORITY_TABLES = [
  "agents",
  "sessions",
  "messages",
  "state_delta_proposals",
  "state_entries",
  "state_transitions",
  "state_tensions",
  "action_records",
  "work_items",
  "work_events",
  "handoffs",
  "mailbox_messages",
  "publication_drafts",
  "publication_approval_requests",
  "publication_approval_decisions",
  "publication_readiness_checks",
  "delivery_ledger",
  "verification_evidence_records",
  "temporal_preview_review_artifacts",
  "temporal_preview_review_artifact_idempotency",
  "coordination_events",
];

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedSidecarEtFixtureScopes(db);
  db.close();

  const { buildPerspectiveSnapshot } = await import(
    "../lib/perspective/snapshot.ts"
  );
  const perspectiveSnapshotRoute = await import(
    "../app/api/perspective/snapshot/route.ts"
  );
  const {
    buildSidecarEtOfflineDiagnosticCandidate,
    validateSidecarEtOfflineInputBoundary,
  } = await import("../lib/perspective/sidecar-et-offline-helper.ts");

  const before = readAuthoritySnapshot(openDatabase);
  assertNoCockpitSidecarActionButtons();

  const helperSnapshots = [];
  for (const fixture of FIXTURES) {
    const snapshot = buildPerspectiveSnapshot({ scope: fixture.scope });
    helperSnapshots.push(snapshot);
    assertFixtureSnapshot(snapshot, fixture);
    assertHelperSkeleton({
      buildSidecarEtOfflineDiagnosticCandidate,
      validateSidecarEtOfflineInputBoundary,
      fixture,
      snapshot,
    });
    assertNoDiagnosticAuthority(snapshot);
    assertAuthorityUnchanged({
      openDatabase,
      before,
      label: `${fixture.category} helper PerspectiveSnapshot`,
    });
  }

  for (const scope of ROUTE_SCOPES) {
    const snapshot = await readRouteSnapshot({
      route: perspectiveSnapshotRoute,
      scope,
    });
    const fixture = FIXTURES.find((item) => item.scope === scope);
    assert(fixture, `route fixture should exist for ${scope}`);
    assertFixtureSnapshot(snapshot, fixture);
    assertNoDiagnosticAuthority(snapshot);
    assertAuthorityUnchanged({
      openDatabase,
      before,
      label: `${fixture.category} route PerspectiveSnapshot`,
    });
  }

  assert.equal(fetchCalls, 0, "Sidecar e_t fixture smoke should not call fetch");

  const repeatedSnapshot = helperSnapshots.find(
    (snapshot) => snapshot.scope === REPEATED_NOISY_SCOPE,
  );
  assert(repeatedSnapshot, "repeated/noisy snapshot should be checked");

  console.log(
    JSON.stringify(
      {
        smoke: "sidecar-et-fixture-boundaries",
        scopes_checked: FIXTURES.map((fixture) => fixture.scope),
        route_scopes_checked: ROUTE_SCOPES,
        route_invocation:
          "direct GET /api/perspective/snapshot handler for clean and repeated/noisy scopes; no Next server started",
        repeated_noisy_loopness_level:
          repeatedSnapshot.research_diagnostics.loopness_hint.level,
        helper_skeleton_checked: true,
        helper_validation_cases_checked: 18,
        helper_returns_placeholder_only: true,
        helper_computation_enabled: false,
        sidecar_placeholder_preserved: true,
        no_sidecar_loop: true,
        no_qp_output: true,
        no_z_t_commit: true,
        sidecar_source_refs_empty: true,
        structured_placeholders_preserved: true,
        loopness_only_bounded_log_only_diagnostic: true,
        cockpit_sidecar_action_buttons_introduced: false,
        authority_tables_mutated: false,
        fetch_calls: fetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

async function readRouteSnapshot({ route, scope }) {
  const response = await route.GET(
    new Request(
      `http://localhost/api/perspective/snapshot?scope=${encodeURIComponent(
        scope,
      )}`,
    ),
  );

  assert.equal(
    response.status,
    200,
    `PerspectiveSnapshot route should return 200 for ${scope}`,
  );

  return response.json();
}

function assertFixtureSnapshot(snapshot, fixture) {
  assert.equal(snapshot.runtime, "augnes");
  assert.equal(snapshot.snapshot_version, "perspective_snapshot.v0.1");
  assert.equal(snapshot.scope, fixture.scope);
  assert.equal(snapshot.research_diagnostics.mode, "log_only");
  assertSidecarEtPlaceholder(snapshot.research_diagnostics.sidecar_e_t);
  assertMetaWmHintPlaceholder(snapshot.research_diagnostics.meta_wm_hint);
  assertBslHintPlaceholder(snapshot.research_diagnostics.bsl_hint);
  assertCompIndexHintPlaceholder(snapshot.research_diagnostics.comp_index_hint);
  assertLoopnessIsOnlyBoundedDiagnostic(snapshot);

  if (fixture.expectedLoopnessLevel) {
    assert.equal(
      snapshot.research_diagnostics.loopness_hint.level,
      fixture.expectedLoopnessLevel,
      `${fixture.category} loopness level should match deterministic fixture`,
    );
  }

  if (fixture.scope === CLEAN_SCOPE) {
    assert.equal(snapshot.pending_proposal_pressure.count, 0);
    assert.equal(snapshot.work_trace_basis.count, 0);
    assert.equal(snapshot.action_trace_basis.count, 0);
    assert.equal(snapshot.open_tensions.count, 0);
    assert.equal(snapshot.research_diagnostics.loopness_hint.score, 0);
    assert.deepEqual(snapshot.research_diagnostics.loopness_hint.signals, {
      repeated_action_state_keys: 0,
      repeated_work_event_actors: 0,
      pending_proposal_count: 0,
      open_tension_count: 0,
    });
  }

  if (fixture.scope === REPEATED_NOISY_SCOPE) {
    assert.equal(snapshot.pending_proposal_pressure.count, 1);
    assert.equal(snapshot.work_trace_basis.count, 1);
    assert.equal(snapshot.action_trace_basis.count, 2);
    assert.equal(snapshot.open_tensions.count, 1);
    assert(
      snapshot.research_diagnostics.loopness_hint.score > 0 &&
        snapshot.research_diagnostics.loopness_hint.score <= 1,
      "repeated/noisy trace pressure may affect only bounded loopness",
    );
    assert.deepEqual(snapshot.research_diagnostics.loopness_hint.signals, {
      repeated_action_state_keys: 1,
      repeated_work_event_actors: 1,
      pending_proposal_count: 1,
      open_tension_count: 1,
    });
  }

  if (fixture.scope === MISSING_CONTEXT_SCOPE) {
    assert.equal(snapshot.committed_state_basis.active.length, 0);
    assert.equal(snapshot.pending_proposal_pressure.count, 0);
    assert.equal(snapshot.evidence_basis.count, 0);
    assert.equal(snapshot.work_trace_basis.count, 0);
    assert.equal(snapshot.action_trace_basis.count, 0);
    assert.equal(snapshot.open_tensions.count, 0);
  }

  if (fixture.scope === CONFLICTING_CONTEXT_SCOPE) {
    assert(snapshot.open_tensions.count > 0);
    assert(snapshot.pending_proposal_pressure.count > 0);
    assert.equal(
      snapshot.authority_boundaries.can_commit_or_reject_state,
      false,
      "conflicting context must not create commit/reject authority",
    );
    assert.equal(
      snapshot.authority_boundaries.can_create_evidence,
      false,
      "conflicting context must not create Evidence status authority",
    );
    assert.equal(
      snapshot.authority_boundaries.can_record_proof,
      false,
      "conflicting context must not create Claim confidence/proof authority",
    );
  }

  if (fixture.scope === INVALID_INPUT_SCOPE) {
    assert.equal(snapshot.research_diagnostics.sidecar_e_t.computed, false);
    assert.deepEqual(snapshot.research_diagnostics.sidecar_e_t.source_refs, []);
    assertNoAttemptedRefsLeaked(snapshot, fixture.attemptedRefs);
  }

  if (fixture.scope === SOURCE_REF_BOUNDARY_SCOPE) {
    assert.deepEqual(snapshot.research_diagnostics.sidecar_e_t.source_refs, []);
    assertNoAttemptedRefsLeaked(snapshot, fixture.attemptedRefs);
  }
}

function assertHelperSkeleton({
  buildSidecarEtOfflineDiagnosticCandidate,
  validateSidecarEtOfflineInputBoundary,
  fixture,
  snapshot,
}) {
  const alreadyReadRefs = buildAlreadyReadRefs(snapshot);
  const validSubsetRefs = buildValidCandidateRefs(alreadyReadRefs);
  const nonSubsetRefs = {
    state_entry_ids: ["state:sidecar-et:not-read"],
    action_record_ids: ["action:sidecar-et:not-read"],
    work_event_ids: ["work-event:sidecar-et:not-read"],
    tension_ids: ["tension:sidecar-et:not-read"],
  };

  const validResult = buildSidecarEtOfflineDiagnosticCandidate({
    scope: fixture.scope,
    already_read_refs: alreadyReadRefs,
    fixture_metadata: {
      category: fixture.category,
      notes: ["placeholder-only helper skeleton fixture"],
    },
    candidate_source_refs: validSubsetRefs,
  });
  assertSidecarEtHelperPlaceholder(validResult);

  const nonSubsetResult = buildSidecarEtOfflineDiagnosticCandidate({
    scope: fixture.scope,
    already_read_refs: alreadyReadRefs,
    fixture_metadata: {
      category: fixture.category,
    },
    candidate_source_refs: nonSubsetRefs,
  });
  assertSidecarEtHelperPlaceholder(nonSubsetResult);

  const missingInputResult = buildSidecarEtOfflineDiagnosticCandidate();
  assertSidecarEtHelperPlaceholder(missingInputResult);

  const malformedInputResult = buildSidecarEtOfflineDiagnosticCandidate({
    scope: fixture.scope,
    already_read_refs: {
      state_entry_ids: [42],
    },
  });
  assertSidecarEtHelperPlaceholder(malformedInputResult);

  const unsupportedInputResult = buildSidecarEtOfflineDiagnosticCandidate({
    scope: fixture.scope,
    already_read_refs: alreadyReadRefs,
    unsupported_input_kind: "qp-output",
  });
  assertSidecarEtHelperPlaceholder(unsupportedInputResult);

  const ambiguousMetadataResult = buildSidecarEtOfflineDiagnosticCandidate({
    scope: fixture.scope,
    already_read_refs: alreadyReadRefs,
    fixture_metadata: {
      category: 42,
    },
  });
  assertSidecarEtHelperPlaceholder(ambiguousMetadataResult);

  assertNoAttemptedRefsLeakedInSidecar(nonSubsetResult, [
    ...nonSubsetRefs.state_entry_ids,
    ...nonSubsetRefs.action_record_ids,
    ...nonSubsetRefs.work_event_ids,
    ...nonSubsetRefs.tension_ids,
  ]);

  if (fixture.attemptedRefs) {
    assertNoAttemptedRefsLeakedInSidecar(validResult, fixture.attemptedRefs);
  }

  assertHelperValidationCases({
    buildSidecarEtOfflineDiagnosticCandidate,
    validateSidecarEtOfflineInputBoundary,
    fixture,
    alreadyReadRefs,
    validSubsetRefs,
    nonSubsetRefs,
  });
}

function assertHelperValidationCases({
  buildSidecarEtOfflineDiagnosticCandidate,
  validateSidecarEtOfflineInputBoundary,
  fixture,
  alreadyReadRefs,
  validSubsetRefs,
  nonSubsetRefs,
}) {
  const validationCases = [
    {
      label: "missing input",
      input: undefined,
      valid: false,
      reason: "missing_input",
    },
    {
      label: "null input",
      input: null,
      valid: false,
      reason: "non_object_input",
    },
    {
      label: "non-object input",
      input: "not an object",
      valid: false,
      reason: "non_object_input",
    },
    {
      label: "array input",
      input: [],
      valid: false,
      reason: "array_input",
    },
    {
      label: "empty scope",
      input: {
        scope: "",
        already_read_refs: alreadyReadRefs,
      },
      valid: false,
      reason: "empty_scope",
    },
    {
      label: "non-string scope",
      input: {
        scope: 42,
        already_read_refs: alreadyReadRefs,
      },
      valid: false,
      reason: "non_string_scope",
    },
    {
      label: "missing already_read_refs",
      input: {
        scope: fixture.scope,
      },
      valid: false,
      reason: "missing_already_read_refs",
    },
    {
      label: "already_read_refs unsupported keys",
      input: {
        scope: fixture.scope,
        already_read_refs: {
          state_entry_ids: [],
          evidence_ids: [],
        },
      },
      valid: false,
      reason: "malformed_already_read_refs",
    },
    {
      label: "already_read_refs non-array values",
      input: {
        scope: fixture.scope,
        already_read_refs: {
          state_entry_ids: "state:sidecar-et:not-array",
        },
      },
      valid: false,
      reason: "malformed_already_read_refs",
    },
    {
      label: "already_read_refs non-string entries",
      input: {
        scope: fixture.scope,
        already_read_refs: {
          state_entry_ids: [42],
        },
      },
      valid: false,
      reason: "malformed_already_read_refs",
    },
    {
      label: "candidate_source_refs unsupported keys",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        candidate_source_refs: {
          evidence_ids: [],
        },
      },
      valid: false,
      reason: "malformed_candidate_source_refs",
    },
    {
      label: "candidate_source_refs non-string entries",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        candidate_source_refs: {
          state_entry_ids: [42],
        },
      },
      valid: false,
      reason: "malformed_candidate_source_refs",
    },
    {
      label: "candidate_source_refs not subset",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        candidate_source_refs: nonSubsetRefs,
      },
      valid: false,
      reason: "candidate_refs_not_already_read",
      attemptedRefs: [
        ...nonSubsetRefs.state_entry_ids,
        ...nonSubsetRefs.action_record_ids,
        ...nonSubsetRefs.work_event_ids,
        ...nonSubsetRefs.tension_ids,
      ],
    },
    {
      label: "fixture_metadata non-string category",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        fixture_metadata: {
          category: 42,
        },
      },
      valid: false,
      reason: "malformed_fixture_metadata",
    },
    {
      label: "fixture_metadata non-string notes",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        fixture_metadata: {
          notes: [42],
        },
      },
      valid: false,
      reason: "malformed_fixture_metadata",
    },
    {
      label: "extra top-level unsupported keys",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        unsupported_input_kind: "qp-output",
      },
      valid: false,
      reason: "unsupported_top_level_key",
    },
    {
      label: "valid subset refs",
      input: {
        scope: fixture.scope,
        already_read_refs: alreadyReadRefs,
        candidate_source_refs: validSubsetRefs,
        fixture_metadata: {
          category: fixture.category,
          notes: ["valid subset remains placeholder-only"],
        },
      },
      valid: true,
      reason: "valid",
    },
    {
      label: "empty valid refs",
      input: {
        scope: fixture.scope,
        already_read_refs: {},
        candidate_source_refs: {},
      },
      valid: true,
      reason: "valid",
    },
  ];

  assert.equal(
    validationCases.length,
    18,
    "Sidecar e_t validation smoke should cover the expected case count",
  );

  for (const validationCase of validationCases) {
    const validation = validateSidecarEtOfflineInputBoundary(
      validationCase.input,
    );
    assert.deepEqual(
      validation,
      {
        valid: validationCase.valid,
        reason: validationCase.reason,
      },
      `${validationCase.label} validation result should be bounded and explicit`,
    );

    const result = buildSidecarEtOfflineDiagnosticCandidate(
      validationCase.input,
    );
    assertSidecarEtHelperPlaceholder(result);
    assertNoAttemptedRefsLeakedInSidecar(
      result,
      validationCase.attemptedRefs ?? [],
    );
  }
}

function buildAlreadyReadRefs(snapshot) {
  return {
    state_entry_ids: snapshot.source_refs.state_entry_ids,
    action_record_ids: snapshot.source_refs.action_record_ids,
    work_event_ids: snapshot.source_refs.work_event_ids,
    tension_ids: snapshot.source_refs.tension_ids,
  };
}

function buildValidCandidateRefs(alreadyReadRefs) {
  return {
    state_entry_ids: alreadyReadRefs.state_entry_ids.slice(0, 1),
    action_record_ids: alreadyReadRefs.action_record_ids.slice(0, 1),
    work_event_ids: alreadyReadRefs.work_event_ids.slice(0, 1),
    tension_ids: alreadyReadRefs.tension_ids.slice(0, 1),
  };
}

function assertSidecarEtPlaceholder(sidecarEtHint) {
  assert.equal(sidecarEtHint.version, "sidecar_e_t.placeholder.v0.1");
  assert.equal(sidecarEtHint.mode, "log_only");
  assert.equal(sidecarEtHint.status, "placeholder");
  assert.equal(sidecarEtHint.computed, false);
  assert.deepEqual(sidecarEtHint.values, {
    e_t_register: null,
    qp_observability_proxy: null,
    z_t_regime_hint: null,
    sidecar_state_summary: null,
    sidecar_e_t_hat: null,
  });
  assert.deepEqual(sidecarEtHint.source_refs, []);
  assert(
    sidecarEtHint.notes.some((note) => note.includes("not computed")),
    "Sidecar e_t placeholder should state that it is not computed",
  );
  assert(
    sidecarEtHint.notes.some((note) => note.includes("no authority")),
    "Sidecar e_t placeholder should state that it has no authority",
  );
  assert(
    sidecarEtHint.notes.some((note) =>
      note.includes("not actual Sidecar state"),
    ),
    "Sidecar e_t placeholder should state that it is not actual Sidecar state",
  );
  assert(
    sidecarEtHint.notes.some(
      (note) =>
        note.includes("does not run a Sidecar loop") &&
        note.includes("update or commit z_t") &&
        note.includes("create QP output"),
    ),
    "Sidecar e_t placeholder should state no Sidecar loop, no z_t update/commit, and no QP output",
  );
}

function assertSidecarEtHelperPlaceholder(sidecarEtHint) {
  assertSidecarEtPlaceholder(sidecarEtHint);
  assert(
    sidecarEtHint.notes.some((note) => note.includes("Placeholder fallback")),
    "Sidecar e_t helper skeleton should state placeholder fallback behavior",
  );
}

function assertMetaWmHintPlaceholder(metaWmHint) {
  assert.equal(metaWmHint.version, "meta_wm_hint.placeholder.v0.1");
  assert.equal(metaWmHint.mode, "log_only");
  assert.equal(metaWmHint.status, "placeholder");
  assert.equal(metaWmHint.computed, false);
  assert.deepEqual(metaWmHint.source_refs, []);
}

function assertBslHintPlaceholder(bslHint) {
  assert.equal(bslHint.version, "bsl_hint.placeholder.v0.1");
  assert.equal(bslHint.mode, "log_only");
  assert.equal(bslHint.status, "placeholder");
  assert.equal(bslHint.computed, false);
  assert.deepEqual(bslHint.source_refs, []);
}

function assertCompIndexHintPlaceholder(compIndexHint) {
  assert.equal(compIndexHint.version, "comp_index_hint.placeholder.v0.1");
  assert.equal(compIndexHint.mode, "log_only");
  assert.equal(compIndexHint.status, "placeholder");
  assert.equal(compIndexHint.computed, false);
  assert.deepEqual(compIndexHint.source_refs, []);
}

function assertLoopnessIsOnlyBoundedDiagnostic(snapshot) {
  const loopnessHint = snapshot.research_diagnostics.loopness_hint;
  assert.equal(loopnessHint.version, "loopness_hint.v0.1");
  assert.equal(loopnessHint.mode, "log_only");
  assert(loopnessHint.score >= 0 && loopnessHint.score <= 1);
  assert(["none", "low", "medium", "high"].includes(loopnessHint.level));
  assert.equal(snapshot.research_diagnostics.sidecar_e_t.computed, false);
  assert.equal(snapshot.research_diagnostics.meta_wm_hint.computed, false);
  assert.equal(snapshot.research_diagnostics.bsl_hint.computed, false);
  assert.equal(snapshot.research_diagnostics.comp_index_hint.computed, false);
}

function assertNoDiagnosticAuthority(snapshot) {
  assert.equal(snapshot.authority_boundaries.derived_view_only, true);
  assert.equal(snapshot.authority_boundaries.source_of_truth, false);
  assert.equal(snapshot.authority_boundaries.can_commit_or_reject_state, false);
  assert.equal(snapshot.authority_boundaries.can_record_proof, false);
  assert.equal(snapshot.authority_boundaries.can_create_evidence, false);
  assert.equal(snapshot.authority_boundaries.can_update_work, false);
  assert.equal(snapshot.authority_boundaries.can_publish_external, false);
  assert.equal(snapshot.authority_boundaries.can_mutate_mailbox, false);
  assert.equal(snapshot.authority_boundaries.can_mutate_publication_state, false);
  assert.equal(snapshot.authority_boundaries.can_call_github_or_openai, false);
  assert.equal(
    snapshot.authority_boundaries.can_write_temporal_review_artifacts,
    false,
  );
  assert(
    snapshot.research_diagnostics.notes.some((note) =>
      note.includes("not authority"),
    ),
    "research diagnostics notes should include non-authority language",
  );
}

function assertNoAttemptedRefsLeaked(snapshot, attemptedRefs = []) {
  const serializedSidecar = JSON.stringify(
    snapshot.research_diagnostics.sidecar_e_t,
  );
  assertNoAttemptedRefsLeakedInSidecar(serializedSidecar, attemptedRefs);
}

function assertNoAttemptedRefsLeakedInSidecar(sidecarEtHint, attemptedRefs = []) {
  const serializedSidecar =
    typeof sidecarEtHint === "string"
      ? sidecarEtHint
      : JSON.stringify(sidecarEtHint);
  for (const ref of attemptedRefs) {
    assert(
      !serializedSidecar.includes(ref),
      `sidecar_e_t must not include attempted non-read ref ${ref}`,
    );
  }
}

function assertNoCockpitSidecarActionButtons() {
  const source = readFileSync("components/augnes-cockpit.tsx", "utf8");
  const start = source.indexOf("function SidecarEtHintPanel");
  const end = source.indexOf("function MetaWmHintPanel");
  assert(start >= 0 && end > start, "Sidecar e_t Cockpit panel should exist");
  const sidecarPanelSource = source.slice(start, end);
  assert(
    !sidecarPanelSource.includes("<button"),
    "Sidecar e_t Cockpit panel must not introduce action buttons",
  );
  const normalizedSidecarPanelSource = sidecarPanelSource.replace(/\s+/g, " ");
  assert(
    normalizedSidecarPanelSource.includes("not a Cockpit action input"),
    "Sidecar e_t Cockpit panel should keep action-input boundary copy",
  );
}

function assertAuthorityUnchanged({ openDatabase, before, label }) {
  const after = readAuthoritySnapshot(openDatabase);
  assert.deepEqual(
    after.counts,
    before.counts,
    `${label} must not write authority table rows`,
  );
  assert.deepEqual(
    after.table_hashes,
    before.table_hashes,
    `${label} must not mutate authority table contents`,
  );
  assert.equal(
    after.counts.state_transitions,
    before.counts.state_transitions,
    `${label} must not invoke state transition writes`,
  );
  assert.equal(
    after.counts.verification_evidence_records,
    before.counts.verification_evidence_records,
    `${label} must not create evidence/proof records`,
  );
}

function seedSidecarEtFixtureScopes(db) {
  const now = "2026-05-21T00:00:00.000Z";

  db.prepare(
    `
      INSERT INTO agents (id, name, kind)
      VALUES ('codex-sidecar-et-fixture-smoke', 'Codex Sidecar e_t fixture smoke', 'external')
    `,
  ).run();

  seedStateEntry({
    db,
    id: "state:sidecar-et:clean",
    scope: CLEAN_SCOPE,
    stateKey: "sidecar.clean",
    value: '"clean fixture"',
    now,
  });

  seedStateEntry({
    db,
    id: "state:sidecar-et:repeated",
    scope: REPEATED_NOISY_SCOPE,
    stateKey: "sidecar.repeated",
    value: '"repeated noisy fixture"',
    now,
  });
  seedActionRecord({
    db,
    id: "action:sidecar-et:repeat-a",
    scope: REPEATED_NOISY_SCOPE,
    stateKey: "sidecar.loop",
    title: "Repeated Sidecar e_t fixture action A",
    now,
  });
  seedActionRecord({
    db,
    id: "action:sidecar-et:repeat-b",
    scope: REPEATED_NOISY_SCOPE,
    stateKey: "sidecar.loop",
    title: "Repeated Sidecar e_t fixture action B",
    now,
  });
  seedWorkItem({
    db,
    workId: REPEATED_WORK_ID,
    scope: REPEATED_NOISY_SCOPE,
    title: "Sidecar e_t repeated/noisy fixture",
    now,
  });
  seedWorkEvent({
    db,
    id: "work-event:sidecar-et:repeat-a",
    workId: REPEATED_WORK_ID,
    scope: REPEATED_NOISY_SCOPE,
    relatedActionId: "action:sidecar-et:repeat-a",
    now,
  });
  seedWorkEvent({
    db,
    id: "work-event:sidecar-et:repeat-b",
    workId: REPEATED_WORK_ID,
    scope: REPEATED_NOISY_SCOPE,
    relatedActionId: "action:sidecar-et:repeat-b",
    now,
  });
  seedPendingProposal({
    db,
    id: "proposal:sidecar-et:pending",
    scope: REPEATED_NOISY_SCOPE,
    stateKey: "sidecar.loop",
    reason: "Pending proposal pressure must affect only loopness.",
    now,
  });
  seedOpenTension({
    db,
    id: "tension:sidecar-et:open",
    scope: REPEATED_NOISY_SCOPE,
    stateKey: "sidecar.loop",
    title: "Sidecar e_t repeated/noisy fixture tension",
    now,
  });

  seedStateEntry({
    db,
    id: "state:sidecar-et:conflicting-a",
    scope: CONFLICTING_CONTEXT_SCOPE,
    stateKey: "sidecar.conflict",
    value: '"conflict candidate A"',
    now,
  });
  seedPendingProposal({
    db,
    id: "proposal:sidecar-et:conflicting",
    scope: CONFLICTING_CONTEXT_SCOPE,
    stateKey: "sidecar.conflict",
    reason: "Conflicting context must not create authority.",
    now,
  });
  seedOpenTension({
    db,
    id: "tension:sidecar-et:conflicting",
    scope: CONFLICTING_CONTEXT_SCOPE,
    stateKey: "sidecar.conflict",
    title: "Sidecar e_t conflicting fixture tension",
    now,
  });

  seedStateEntry({
    db,
    id: "state:sidecar-et:source-ref-boundary",
    scope: SOURCE_REF_BOUNDARY_SCOPE,
    stateKey: "sidecar.source_ref_boundary",
    value: '"source ref boundary fixture"',
    now,
  });
  seedStateEntry({
    db,
    id: "state:sidecar-et:outside-scope",
    scope: OUTSIDE_SOURCE_REF_SCOPE,
    stateKey: "sidecar.outside_scope",
    value: '"outside scope ref that must not be read for sidecar_e_t"',
    now,
  });
}

function seedStateEntry({ db, id, scope, stateKey, value, now }) {
  db.prepare(
    `
      INSERT INTO state_entries (
        id,
        scope,
        state_key,
        value,
        temporal_scope,
        valid_from,
        valid_until,
        stability,
        change_type,
        source_agent_id,
        source_session_id,
        source_transition_id,
        created_at,
        updated_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @value,
        'current_project',
        NULL,
        NULL,
        'active',
        'new_state',
        NULL,
        NULL,
        NULL,
        @now,
        @now
      )
    `,
  ).run({ id, scope, state_key: stateKey, value, now });
}

function seedActionRecord({ db, id, scope, stateKey, title, now }) {
  db.prepare(
    `
      INSERT INTO action_records (
        id,
        scope,
        state_key,
        title,
        description,
        status,
        source_agent_id,
        source_session_id,
        created_at,
        completed_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @title,
        'Deterministic repeated action fixture for Sidecar e_t boundary smoke.',
        'completed',
        'codex-sidecar-et-fixture-smoke',
        NULL,
        @now,
        @now
      )
    `,
  ).run({ id, scope, state_key: stateKey, title, now });
}

function seedWorkItem({ db, workId, scope, title, now }) {
  db.prepare(
    `
      INSERT INTO work_items (
        work_id,
        scope,
        title,
        status,
        priority,
        summary,
        next_action,
        user_attention_required,
        related_state_keys,
        links,
        created_at,
        updated_at
      )
      VALUES (
        @work_id,
        @scope,
        @title,
        'in_progress',
        'now',
        'Deterministic fixture for Sidecar e_t placeholder boundary smoke.',
        'Keep Sidecar e_t placeholder-only and non-authoritative.',
        0,
        '["sidecar.loop"]',
        '{}',
        @now,
        @now
      )
    `,
  ).run({ work_id: workId, scope, title, now });
}

function seedWorkEvent({ db, id, workId, scope, relatedActionId, now }) {
  db.prepare(
    `
      INSERT INTO work_events (
        id,
        work_id,
        scope,
        actor,
        event_type,
        summary,
        result_status,
        result_kind,
        related_action_id,
        related_pr,
        related_state_keys,
        created_at
      )
      VALUES (
        @id,
        @work_id,
        @scope,
        'codex',
        'verification',
        'Deterministic repeated actor fixture for bounded loopness only.',
        'completed',
        'verification',
        @related_action_id,
        NULL,
        '["sidecar.loop"]',
        @now
      )
    `,
  ).run({
    id,
    work_id: workId,
    scope,
    related_action_id: relatedActionId,
    now,
  });
}

function seedPendingProposal({ db, id, scope, stateKey, reason, now }) {
  db.prepare(
    `
      INSERT INTO state_delta_proposals (
        id,
        scope,
        state_key,
        before_value,
        after_value,
        operation,
        temporal_scope,
        valid_from,
        valid_until,
        stability,
        change_type,
        source_agent_id,
        source_session_id,
        reason,
        status,
        proposed_at,
        prediction_error_score,
        salience_score,
        evidence_score,
        conflict_score,
        self_impact_score,
        consolidation_status,
        reinforcement_count,
        expires_at,
        last_evaluated_at,
        scoring_version,
        scoring_reason,
        score_breakdown
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        NULL,
        '"sidecar fixture proposal"',
        'set',
        'current_project',
        NULL,
        NULL,
        'tentative',
        'new_state',
        NULL,
        NULL,
        @reason,
        'pending',
        @now,
        0.1,
        0.2,
        0.3,
        0.4,
        0.5,
        'candidate',
        0,
        NULL,
        @now,
        'v0.2-rule-001',
        'Seed scoring for Sidecar e_t boundary smoke.',
        '{}'
      )
    `,
  ).run({ id, scope, state_key: stateKey, reason, now });
}

function seedOpenTension({ db, id, scope, stateKey, title, now }) {
  db.prepare(
    `
      INSERT INTO state_tensions (
        id,
        scope,
        state_key,
        title,
        description,
        status,
        severity,
        source_agent_id,
        source_session_id,
        created_at,
        resolved_at
      )
      VALUES (
        @id,
        @scope,
        @state_key,
        @title,
        'Open tension should remain trace pressure only.',
        'open',
        'high',
        NULL,
        NULL,
        @now,
        NULL
      )
    `,
  ).run({ id, scope, state_key: stateKey, title, now });
}

function readAuthoritySnapshot(openDatabase) {
  const db = openDatabase();
  try {
    const tableRows = Object.fromEntries(
      AUTHORITY_TABLES.map((table) => [
        table,
        db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all(),
      ]),
    );

    return {
      counts: Object.fromEntries(
        AUTHORITY_TABLES.map((table) => [table, tableRows[table].length]),
      ),
      table_hashes: Object.fromEntries(
        AUTHORITY_TABLES.map((table) => [table, hashRows(tableRows[table])]),
      ),
    };
  } finally {
    db.close();
  }
}

function hashRows(rows) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
