import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const APPROVED_FIXTURE_FILES = [
  "fixtures/sidecar-et-trace-pack.example.json",
  "fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json",
];

const EXPECTED_TRACE_COUNTS = new Map([
  ["fixtures/sidecar-et-trace-pack.example.json", 1],
  ["fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json", 5],
]);

const TRACE_PACK_VERSION = "sidecar_et_trace_pack.v0.1";
const FREE_TEXT_KEYS = new Set(["description", "title", "label", "value"]);
const ALLOWED_PACK_KEYS = new Set(["version", "description", "traces"]);
const ALLOWED_TRACE_KEYS = new Set([
  "id",
  "scope",
  "title",
  "state_keys",
  "events",
  "expectations",
]);
const ALLOWED_EXPECTATION_KEYS = new Set([
  "allowed_regime_hint",
  "runtime_sidecar_placeholder",
]);
const ALLOWED_EVENT_KEYS = new Map([
  [
    "state",
    new Set(["kind", "id", "state_key", "value", "at"]),
  ],
  [
    "work",
    new Set(["kind", "work_id", "title", "status", "related_state_keys", "at"]),
  ],
  [
    "action",
    new Set(["kind", "id", "state_key", "title", "status", "at"]),
  ],
  [
    "work_event",
    new Set([
      "kind",
      "id",
      "work_id",
      "actor",
      "result_status",
      "related_action_id",
      "related_state_keys",
      "at",
    ]),
  ],
  [
    "evidence",
    new Set(["kind", "id", "work_id", "evidence_kind", "label", "status", "at"]),
  ],
  [
    "tension",
    new Set(["kind", "id", "state_key", "title", "severity", "status", "at"]),
  ],
  [
    "proposal",
    new Set(["kind", "id", "state_key", "status", "at"]),
  ],
]);

const ENUMS = {
  workStatus: new Set(["in_progress"]),
  actionStatus: new Set(["blocked", "completed", "failed"]),
  actor: new Set(["codex", "operator"]),
  resultStatus: new Set(["blocked", "completed", "failed", "passed", "skipped"]),
  evidenceKind: new Set(["check_failed", "check_passed", "check_skipped"]),
  evidenceStatus: new Set(["blocked", "passed", "skipped"]),
  tensionSeverity: new Set(["low", "medium", "high"]),
  tensionStatus: new Set(["open"]),
  proposalStatus: new Set(["pending"]),
};

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Sidecar e_t fixture descriptor smoke must not call fetch");
};

const imported = APPROVED_FIXTURE_FILES.map((fixturePath) => {
  const pack = readJson(fixturePath);
  validatePack(pack, fixturePath);
  assert.equal(
    pack.traces.length,
    EXPECTED_TRACE_COUNTS.get(fixturePath),
    `${fixturePath} trace count should match the approved first subset`,
  );
  return {
    path: fixturePath,
    traces: pack.traces.length,
  };
});

assertApprovedFixtureSet();
assertNegativeValidationCases();
assertPackageScriptBoundary();
assert.equal(fetchCalls, 0, "fixture descriptor smoke should not call fetch");

console.log(
  JSON.stringify(
    {
      smoke: "sidecar-et-trace-pack-fixture-descriptors",
      approved_fixture_files: imported.map((entry) => entry.path),
      trace_counts: Object.fromEntries(
        imported.map((entry) => [entry.path, entry.traces]),
      ),
      fixture_version: TRACE_PACK_VERSION,
      unknown_event_kinds_rejected: true,
      unknown_fields_rejected: true,
      unsupported_enums_rejected: true,
      long_free_text_absent: true,
      secret_like_patterns_absent: true,
      raw_urls_absent: true,
      absolute_paths_absent: true,
      raw_sql_absent: true,
      raw_db_rows_absent: true,
      timestamps_non_decreasing: true,
      references_only_to_earlier_rows: true,
      runtime_sidecar_e_t_not_computed_by_fixture_validation: true,
      fetch_calls: fetchCalls,
      db_writes: false,
      bridge_table_rows_created: false,
      verification_evidence_records_created: false,
      action_records_created: false,
      proof_evidence_readiness_writes: false,
      qp_evidence_created: false,
      z_t_commits: false,
      ag_resume_writer_helper_called: false,
      ag_resume_writer_helper_output_dependency: false,
      ag_resume_package_script_collisions: false,
    },
    null,
    2,
  ),
);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertApprovedFixtureSet() {
  const actual = readdirSync("fixtures")
    .filter((name) => name.startsWith("sidecar-et-trace-pack"))
    .filter((name) => name !== "sidecar-et-trace-pack.manifest.json")
    .map((name) => path.join("fixtures", name))
    .sort();
  assert.deepEqual(
    actual,
    [...APPROVED_FIXTURE_FILES].sort(),
    "Only the approved first Sidecar e_t fixture subset should be present",
  );
}

function validatePack(pack, packPath) {
  assertObject(pack, "$");
  assertOnlyKeys(pack, ALLOWED_PACK_KEYS, "$");
  assert.equal(
    pack.version,
    TRACE_PACK_VERSION,
    `${packPath} version should be ${TRACE_PACK_VERSION}`,
  );
  assertSafeString(pack.description, "$.description", true);
  assert(Array.isArray(pack.traces), `${packPath} traces should be an array`);
  assert(pack.traces.length > 0, `${packPath} should include traces`);

  const traceIds = new Set();
  for (const [traceIndex, trace] of pack.traces.entries()) {
    validateTrace(trace, `$.traces[${traceIndex}]`, traceIds);
  }
}

function validateTrace(trace, tracePath, traceIds) {
  assertObject(trace, tracePath);
  assertOnlyKeys(trace, ALLOWED_TRACE_KEYS, tracePath);
  assertSafeString(trace.id, `${tracePath}.id`);
  assert(
    !traceIds.has(trace.id),
    `${tracePath}.id should be unique within imported fixtures`,
  );
  traceIds.add(trace.id);
  assertSafeString(trace.scope, `${tracePath}.scope`);
  assertSafeString(trace.title, `${tracePath}.title`, true);
  assert(Array.isArray(trace.state_keys), `${tracePath}.state_keys should be an array`);
  assert(trace.state_keys.length > 0, `${tracePath}.state_keys should not be empty`);
  const declaredStateKeys = new Set(trace.state_keys);
  for (const [index, stateKey] of trace.state_keys.entries()) {
    assertSafeString(stateKey, `${tracePath}.state_keys[${index}]`);
  }
  assert(Array.isArray(trace.events), `${tracePath}.events should be an array`);
  assert(trace.events.length > 0, `${tracePath}.events should not be empty`);
  validateExpectations(trace.expectations, `${tracePath}.expectations`);

  const seenWorkIds = new Set();
  const seenActionIds = new Set();
  const seenEventIds = new Set();
  let previousTimestamp = "";
  for (const [eventIndex, event] of trace.events.entries()) {
    const eventPath = `${tracePath}.events[${eventIndex}]`;
    validateEvent({
      event,
      eventPath,
      declaredStateKeys,
      seenActionIds,
      seenEventIds,
      seenWorkIds,
      previousTimestamp,
    });
    previousTimestamp = event.at;
  }
}

function validateExpectations(expectations, expectationsPath) {
  assertObject(expectations, expectationsPath);
  assertOnlyKeys(expectations, ALLOWED_EXPECTATION_KEYS, expectationsPath);
  assert.equal(
    expectations.runtime_sidecar_placeholder,
    true,
    `${expectationsPath}.runtime_sidecar_placeholder must stay true`,
  );
  assert.equal(
    expectations.allowed_regime_hint,
    true,
    `${expectationsPath}.allowed_regime_hint must stay true`,
  );
}

function validateEvent({
  event,
  eventPath,
  declaredStateKeys,
  seenActionIds,
  seenEventIds,
  seenWorkIds,
  previousTimestamp,
}) {
  assertObject(event, eventPath);
  assertSafeString(event.kind, `${eventPath}.kind`);
  const allowedKeys = ALLOWED_EVENT_KEYS.get(event.kind);
  assert(allowedKeys, `${eventPath}.kind is unsupported`);
  assertOnlyKeys(event, allowedKeys, eventPath);
  assertSafeTimestamp(event.at, `${eventPath}.at`);
  assert(
    previousTimestamp === "" || event.at >= previousTimestamp,
    `${eventPath}.at must be non-decreasing`,
  );

  for (const [key, value] of Object.entries(event)) {
    if (typeof value === "string") {
      assertSafeString(value, `${eventPath}.${key}`, FREE_TEXT_KEYS.has(key));
    }
  }

  if ("id" in event) {
    assertUniqueId(event.id, `${eventPath}.id`, seenEventIds);
  }

  if ("state_key" in event) {
    assert(
      declaredStateKeys.has(event.state_key),
      `${eventPath}.state_key must be declared in trace.state_keys`,
    );
  }

  if ("related_state_keys" in event) {
    assert(Array.isArray(event.related_state_keys), `${eventPath}.related_state_keys should be an array`);
    for (const [index, stateKey] of event.related_state_keys.entries()) {
      assertSafeString(stateKey, `${eventPath}.related_state_keys[${index}]`);
      assert(
        declaredStateKeys.has(stateKey),
        `${eventPath}.related_state_keys[${index}] must be declared in trace.state_keys`,
      );
    }
  }

  if (event.kind === "work") {
    assertSafeString(event.work_id, `${eventPath}.work_id`);
    assertEnum(event.status, ENUMS.workStatus, `${eventPath}.status`);
    seenWorkIds.add(event.work_id);
  }

  if (event.kind === "action") {
    assertEnum(event.status, ENUMS.actionStatus, `${eventPath}.status`);
    seenActionIds.add(event.id);
  }

  if (event.kind === "work_event") {
    assertEnum(event.actor, ENUMS.actor, `${eventPath}.actor`);
    assertEnum(event.result_status, ENUMS.resultStatus, `${eventPath}.result_status`);
    assert(
      seenWorkIds.has(event.work_id),
      `${eventPath}.work_id must refer to an earlier work row`,
    );
    if (event.related_action_id) {
      assert(
        seenActionIds.has(event.related_action_id),
        `${eventPath}.related_action_id must refer to an earlier action event`,
      );
    }
  }

  if (event.kind === "evidence") {
    assert(
      seenWorkIds.has(event.work_id),
      `${eventPath}.work_id must refer to an earlier work row`,
    );
    assertEnum(event.evidence_kind, ENUMS.evidenceKind, `${eventPath}.evidence_kind`);
    assertEnum(event.status, ENUMS.evidenceStatus, `${eventPath}.status`);
  }

  if (event.kind === "tension") {
    assertEnum(event.severity, ENUMS.tensionSeverity, `${eventPath}.severity`);
    assertEnum(event.status, ENUMS.tensionStatus, `${eventPath}.status`);
  }

  if (event.kind === "proposal") {
    assertEnum(event.status, ENUMS.proposalStatus, `${eventPath}.status`);
  }
}

function assertPackageScriptBoundary() {
  const packageJson = readJson("package.json");
  const scripts = packageJson.scripts ?? {};
  assert.equal(
    scripts["smoke:sidecar-et-trace-pack-fixture-descriptors"],
    "node scripts/smoke-sidecar-et-trace-pack-fixture-descriptors.mjs",
    "approved fixture descriptor smoke script should be the only required new package script",
  );
  for (const scriptName of Object.keys(scripts)) {
    if (
      scriptName.startsWith("ag:resume-") ||
      scriptName.startsWith("smoke:ag-work-resume-")
    ) {
      assert(
        !scriptName.includes("sidecar-et"),
        `${scriptName} should not collide with Sidecar e_t fixture descriptor validation`,
      );
    }
  }
}

function assertNegativeValidationCases() {
  const base = basePack();
  const cases = [
    {
      name: "unknown event kind",
      pack: packWithEvents([{ ...stateEvent(), kind: "raw_sql" }]),
      expected: "kind is unsupported",
    },
    {
      name: "unknown event field",
      pack: packWithEvents([{ ...stateEvent(), raw_db_row: {} }]),
      expected: "raw_db_row is not supported",
    },
    {
      name: "unsupported enum",
      pack: packWithEvents([workEvent({ status: "published" })]),
      expected: "status must be one of",
    },
    {
      name: "long free text",
      pack: {
        ...base,
        traces: [
          {
            ...base.traces[0],
            title:
              "This trace title is deliberately too long for the original repo fixture safety boundary and should reject",
          },
        ],
      },
      expected: "must be 80 characters or shorter",
    },
    {
      name: "secret-like pattern",
      pack: packWithEvents([stateEvent({ value: "\"sk-proj-abcdefghijklmnopqrstuvwxyz\"" })]),
      expected: "secret-like token",
    },
    {
      name: "raw url",
      pack: packWithEvents([stateEvent({ value: "\"https://example.invalid\"" })]),
      expected: "raw URLs",
    },
    {
      name: "absolute path",
      pack: packWithEvents([stateEvent({ value: "\"/Users/example/secret\"" })]),
      expected: "absolute paths",
    },
    {
      name: "raw sql",
      pack: packWithEvents([stateEvent({ value: "\"DROP TABLE state_entries\"" })]),
      expected: "SQL-like content",
    },
    {
      name: "timestamp order",
      pack: packWithEvents([
        stateEvent({ at: "2026-06-01T00:02:00.000Z" }),
        actionEvent({ at: "2026-06-01T00:01:00.000Z" }),
      ]),
      expected: "must be non-decreasing",
    },
    {
      name: "undeclared state key",
      pack: packWithEvents([stateEvent({ state_key: "trace.missing" })]),
      expected: "must be declared",
    },
    {
      name: "future work reference",
      pack: packWithEvents([workTraceEvent()]),
      expected: "must refer to an earlier work row",
    },
    {
      name: "future action reference",
      pack: packWithEvents([
        workEvent(),
        workTraceEvent({ related_action_id: "action:trace:missing" }),
      ]),
      expected: "must refer to an earlier action event",
    },
    {
      name: "runtime placeholder missing",
      pack: {
        ...base,
        traces: [
          {
            ...base.traces[0],
            expectations: {
              runtime_sidecar_placeholder: false,
              allowed_regime_hint: true,
            },
          },
        ],
      },
      expected: "must stay true",
    },
  ];

  for (const testCase of cases) {
    assert.throws(
      () => validatePack(testCase.pack, `negative:${testCase.name}`),
      (error) => {
        assert(
          error.message.includes(testCase.expected),
          `${testCase.name} should include ${JSON.stringify(testCase.expected)} but got ${error.message}`,
        );
        return true;
      },
      `${testCase.name} should reject`,
    );
  }
}

function basePack() {
  return {
    version: TRACE_PACK_VERSION,
    description: "synthetic anonymized trace pack",
    traces: [baseTrace()],
  };
}

function baseTrace() {
  return {
    id: "trace:validation:example",
    scope: "project:trace-pack:validation-example",
    title: "Validation trace",
    state_keys: ["trace.validation"],
    events: [stateEvent()],
    expectations: {
      runtime_sidecar_placeholder: true,
      allowed_regime_hint: true,
    },
  };
}

function packWithEvents(events) {
  return {
    ...basePack(),
    traces: [
      {
        ...baseTrace(),
        events,
      },
    ],
  };
}

function stateEvent(overrides = {}) {
  return {
    kind: "state",
    id: "state:trace:validation",
    state_key: "trace.validation",
    value: "\"validation trace\"",
    at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function workEvent(overrides = {}) {
  return {
    kind: "work",
    work_id: "AG-TRACE-VALIDATION",
    title: "Trace validation work",
    status: "in_progress",
    related_state_keys: ["trace.validation"],
    at: "2026-06-01T00:01:00.000Z",
    ...overrides,
  };
}

function actionEvent(overrides = {}) {
  return {
    kind: "action",
    id: "action:trace:validation",
    state_key: "trace.validation",
    title: "Trace validation action",
    status: "completed",
    at: "2026-06-01T00:02:00.000Z",
    ...overrides,
  };
}

function workTraceEvent(overrides = {}) {
  return {
    kind: "work_event",
    id: "work-event:trace:validation",
    work_id: "AG-TRACE-VALIDATION",
    actor: "codex",
    result_status: "completed",
    related_action_id: "action:trace:validation",
    related_state_keys: ["trace.validation"],
    at: "2026-06-01T00:03:00.000Z",
    ...overrides,
  };
}

function assertObject(value, valuePath) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `${valuePath} should be an object`,
  );
}

function assertOnlyKeys(object, allowedKeys, valuePath) {
  for (const key of Object.keys(object)) {
    assert(allowedKeys.has(key), `${valuePath}.${key} is not supported`);
  }
}

function assertSafeString(value, valuePath, freeText = false) {
  assert.equal(typeof value, "string", `${valuePath} should be a string`);
  assert(!/https?:\/\//i.test(value), `${valuePath} must not contain raw URLs`);
  assert(
    !/(^|[\s"'])\/(Users|home|var|tmp|etc|private)\//.test(value),
    `${valuePath} must not contain absolute paths`,
  );
  assert(
    !/(sk-proj-|sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9_]{12,}|github_pat_|xox[baprs]-)/.test(
      value,
    ),
    `${valuePath} appears to contain a secret-like token`,
  );
  assert(
    !/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\s+\w+/i.test(value),
    `${valuePath} must not contain SQL-like content`,
  );
  if (freeText) {
    assert(
      value.length <= 80,
      `${valuePath} must be 80 characters or shorter`,
    );
  }
}

function assertSafeTimestamp(value, valuePath) {
  assertSafeString(value, valuePath);
  assert(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value),
    `${valuePath} should be an ISO timestamp`,
  );
}

function assertUniqueId(value, valuePath, seenIds) {
  assertSafeString(value, valuePath);
  assert(!seenIds.has(value), `${valuePath} should be unique within trace`);
  seenIds.add(value);
}

function assertEnum(value, allowed, valuePath) {
  assertSafeString(value, valuePath);
  assert(
    allowed.has(value),
    `${valuePath} must be one of ${JSON.stringify([...allowed])}`,
  );
}
