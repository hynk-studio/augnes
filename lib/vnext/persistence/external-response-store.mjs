import {
  EXTERNAL_VERSION,
  LIMITS,
  canonical,
  digest,
  hashBytes,
  fail,
  materialMetadata,
  bytes,
  ref,
  time,
  keys,
  text,
  refs,
  integer,
  terms,
  response,
  stateOf,
} from "../external-response-rules.mjs";
export const externalSchemaSql = `
CREATE TABLE IF NOT EXISTS vnext_external_records (
 ref TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
 kind TEXT NOT NULL, stream TEXT NOT NULL, sequence INTEGER NOT NULL,
 operation_key TEXT NOT NULL, payload_json TEXT NOT NULL CHECK(length(payload_json)<=24000), created_at TEXT NOT NULL,
 UNIQUE(workspace_id,project_id,operation_key), UNIQUE(workspace_id,project_id,stream,sequence),
 FOREIGN KEY(workspace_id,project_id) REFERENCES vnext_project_identities(workspace_id,project_id)
);
CREATE INDEX IF NOT EXISTS idx_external_records_scope ON vnext_external_records(workspace_id,project_id,kind,stream,sequence);
CREATE TABLE IF NOT EXISTS vnext_external_materials (
 ref TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
 metadata_json TEXT NOT NULL, body BLOB NOT NULL CHECK(length(body) BETWEEN 1 AND 65536),
 FOREIGN KEY(workspace_id,project_id) REFERENCES vnext_project_identities(workspace_id,project_id)
);
CREATE TABLE IF NOT EXISTS vnext_external_shares (
 record_ref TEXT NOT NULL REFERENCES vnext_external_records(ref), target_key TEXT NOT NULL,
 created_at TEXT NOT NULL, withdrawn_at TEXT, PRIMARY KEY(record_ref,target_key)
);
CREATE TABLE IF NOT EXISTS vnext_external_envelopes (
 workspace_id TEXT NOT NULL, envelope_id TEXT NOT NULL, binding TEXT NOT NULL,
 calls INTEGER NOT NULL CHECK(calls>=0), input_bytes INTEGER NOT NULL CHECK(input_bytes>=0),
 suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN(0,1)), PRIMARY KEY(workspace_id,envelope_id)
);`;
export const scopeKey = (scope) =>
  digest({
    purpose: "codex-current-continuity-public-project-key.v0.1",
    ...scope,
  });
export function parseRecord(row) {
  if (!row) return null;
  const payload = JSON.parse(row.payload_json),
    body = {
      version: EXTERNAL_VERSION,
      workspace_id: row.workspace_id,
      project_id: row.project_id,
      kind: row.kind,
      stream: row.stream,
      sequence: row.sequence,
      operation_key: row.operation_key,
      payload,
      created_at: row.created_at,
    };
  if (
    digest(body) !== row.ref ||
    Buffer.byteLength(row.payload_json) > LIMITS.recordBytes
  )
    fail("external_saved_state_invalid", 503);
  time(row.created_at);
  return { ref: row.ref, ...body };
}
export function records(db, scope, stream) {
  const rows = db
    .prepare(
      `SELECT * FROM vnext_external_records WHERE workspace_id=? AND project_id=? ${stream === undefined ? "" : "AND stream=?"} ORDER BY stream,sequence LIMIT ?`,
    )
    .all(
      scope.workspace_id,
      scope.project_id,
      ...(stream === undefined ? [] : [stream]),
      LIMITS.records + 1,
    );
  if (rows.length > LIMITS.records) fail("external_history_limit", 503);
  return rows.map(parseRecord);
}
export function record(db, r) {
  ref(r);
  return parseRecord(
    db.prepare("SELECT * FROM vnext_external_records WHERE ref=?").get(r),
  );
}
export function append(
  db,
  scope,
  { kind, stream, operation_key, payload },
  expectedHead,
) {
  const old = db
    .prepare(
      "SELECT * FROM vnext_external_records WHERE workspace_id=? AND project_id=? AND operation_key=?",
    )
    .get(scope.workspace_id, scope.project_id, operation_key);
  if (old) {
    const p = parseRecord(old);
    if (
      p.kind !== kind ||
      p.stream !== stream ||
      canonical(p.payload) !== canonical(payload)
    )
      fail("external_replay_conflict");
    return { record: p, replay: true };
  }
  const history = records(db, scope, stream),
    head = history.at(-1)?.ref ?? null;
  if (expectedHead !== undefined && expectedHead !== head)
    fail("external_head_changed");
  if (
    history.length >= LIMITS.events ||
    db
      .prepare(
        "SELECT COUNT(*) n FROM vnext_external_records WHERE workspace_id=?",
      )
      .get(scope.workspace_id).n >= LIMITS.records
  )
    fail("external_history_limit");
  if (Buffer.byteLength(canonical(payload)) > LIMITS.recordBytes)
    fail("external_record_out_of_bounds", 413);
  const value = {
    version: EXTERNAL_VERSION,
    ...scope,
    kind,
    stream,
    sequence: history.length,
    operation_key,
    payload,
    created_at: new Date().toISOString(),
  };
  const r = digest(value);
  db.prepare(
    "INSERT INTO vnext_external_records VALUES(?,?,?,?,?,?,?,?,?)",
  ).run(
    r,
    scope.workspace_id,
    scope.project_id,
    kind,
    stream,
    history.length,
    operation_key,
    canonical(payload),
    value.created_at,
  );
  return { record: { ref: r, ...value }, replay: false };
}
export function putMaterial(db, scope, metadata, base64) {
  materialMetadata(metadata);
  const body = bytes(base64);
  if (body.length !== metadata.size || hashBytes(body) !== metadata.sha256)
    fail("external_material_integrity_failed");
  const r = digest({ version: EXTERNAL_VERSION, ...scope, metadata });
  const previous = db
    .prepare("SELECT * FROM vnext_external_materials WHERE ref=?")
    .get(r);
  if (previous) {
    readMaterial(db, r);
    return r;
  }
  if (
    db
      .prepare(
        "SELECT COALESCE(SUM(length(body)),0) n FROM vnext_external_materials WHERE workspace_id=?",
      )
      .get(scope.workspace_id).n +
      body.length >
    LIMITS.workspaceBytes
  )
    fail("external_material_capacity");
  db.prepare("INSERT INTO vnext_external_materials VALUES(?,?,?,?,?)").run(
    r,
    scope.workspace_id,
    scope.project_id,
    canonical(metadata),
    body,
  );
  return r;
}
export function readMaterial(db, r) {
  ref(r);
  const row = db
    .prepare("SELECT * FROM vnext_external_materials WHERE ref=?")
    .get(r);
  if (!row) fail("external_material_known_absent", 404);
  if (!Buffer.isBuffer(row.body))
    fail("external_material_integrity_failed", 503);
  const metadata = materialMetadata(JSON.parse(row.metadata_json));
  if (
    digest({
      version: EXTERNAL_VERSION,
      workspace_id: row.workspace_id,
      project_id: row.project_id,
      metadata,
    }) !== row.ref ||
    row.body.length !== metadata.size ||
    hashBytes(row.body) !== metadata.sha256
  )
    fail("external_material_integrity_failed", 503);
  return {
    ref: row.ref,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    metadata,
    base64: row.body.toString("base64"),
  };
}
export function suspendExternalEnvelopes(db) {
  db.exec("UPDATE vnext_external_envelopes SET suspended=1");
}
// Recovery validates retained facts without turning the serialized budget or
// endpoint binding into a live grant. Restoration separately suspends effects.
export function validateExternalStore(db) {
  if (
    !db
      .prepare(
        "SELECT 1 FROM sqlite_schema WHERE name='vnext_external_records'",
      )
      .get()
  )
    return;
  const invalid = () => fail("external_saved_state_invalid", 503);
  const all = db
    .prepare(
      "SELECT * FROM vnext_external_records ORDER BY workspace_id,project_id,stream,sequence",
    )
    .all();
  const streams = new Map(),
    counts = new Map(),
    usage = new Map();
  const ownMaterial = (r, m) => {
    const value = readMaterial(db, m);
    if (
      value.workspace_id !== r.workspace_id ||
      value.project_id !== r.project_id
    )
      invalid();
    return value;
  };
  const sourceBasis = (p) => {
    ref(p.material_basis);
    if (
      !Array.isArray(p.sources) ||
      !p.sources.length ||
      p.sources.length > LIMITS.dependencies
    )
      invalid();
    for (const s of p.sources) {
      ref(s.source_binding);
      text(s.source_locator, 4096);
    }
  };
  const scopedExperience = (owner, id) => {
    const e = record(db, id);
    if (!e || e.kind !== "experience" || e.workspace_id !== owner.workspace_id)
      invalid();
    return e;
  };
  for (const row of all) {
    const r = parseRecord(row);
    text(r.operation_key, 180);
    text(r.stream, 140);
    integer(r.sequence, 0, LIMITS.events - 1);
    const count = (counts.get(r.workspace_id) ?? 0) + 1;
    if (count > LIMITS.records) invalid();
    counts.set(r.workspace_id, count);
    const k = canonical([r.workspace_id, r.project_id, r.stream]),
      list = streams.get(k) ?? [];
    if (r.sequence !== list.length) invalid();
    list.push(r);
    streams.set(k, list);
  }
  const byteCounts = new Map();
  for (const row of db
    .prepare("SELECT ref FROM vnext_external_materials")
    .all()) {
    const m = readMaterial(db, row.ref),
      n = (byteCounts.get(m.workspace_id) ?? 0) + m.metadata.size;
    if (n > LIMITS.workspaceBytes) invalid();
    byteCounts.set(m.workspace_id, n);
  }
  for (const share of db.prepare("SELECT * FROM vnext_external_shares").all()) {
    const r = record(db, share.record_ref);
    if (
      !r ||
      !["experience", "correction"].includes(r.kind) ||
      !r.payload.targets.includes(share.target_key) ||
      share.created_at !== r.created_at
    )
      invalid();
    ref(share.target_key);
    time(share.created_at);
    if (share.withdrawn_at) {
      time(share.withdrawn_at);
      if (share.withdrawn_at < share.created_at) invalid();
    }
  }
  for (const list of streams.values()) {
    const first = list[0],
      p = first.payload;
    if (first.kind === "experience" || first.kind === "correction") {
      if (list.length !== 1) invalid();
      sourceBasis(p);
      refs(p.targets, LIMITS.shares);
      for (const target of p.targets)
        if (
          !db
            .prepare(
              "SELECT 1 FROM vnext_external_shares WHERE record_ref=? AND target_key=?",
            )
            .get(first.ref, target)
        )
          invalid();
      if (first.kind === "experience") {
        keys(p, [
          "title",
          "sources",
          "conditions",
          "association",
          "assessment",
          "materials",
          "targets",
          "material_basis",
        ]);
        text(p.title, 160);
        text(p.conditions);
        text(p.assessment);
        keys(p.association, ["endpoint", "account", "operator", "confidence"]);
        Object.values(p.association).forEach((v) => text(v, 200));
        refs(p.materials);
        p.materials.forEach((m) => ownMaterial(first, m));
      } else {
        keys(p, [
          "target_ref",
          "topic",
          "statement",
          "sources",
          "targets",
          "material_basis",
        ]);
        text(p.topic, 100);
        text(p.statement);
        if (
          scopedExperience(first, p.target_ref).project_id !== first.project_id
        )
          invalid();
      }
      continue;
    }
    if (first.kind !== "work") invalid();
    keys(p, [
      "purpose",
      "experience_refs",
      "envelope_id",
      "envelope_binding",
      "input_ref",
      "terms",
      "expectation",
      "reconsider_when",
      "owners",
      "material_basis",
      "packet_ref",
      "definition",
    ]);
    text(p.purpose);
    text(p.expectation);
    text(p.reconsider_when);
    text(p.envelope_id, 100);
    ref(p.envelope_binding);
    ref(p.material_basis);
    ref(p.packet_ref);
    terms(p.terms);
    ownMaterial(first, p.input_ref);
    keys(p.owners, ["receive", "check", "use"]);
    Object.values(p.owners).forEach((v) => text(v, 160));
    refs(p.experience_refs);
    p.experience_refs.forEach((r) => scopedExperience(first, r));
    const usageKey = canonical([first.workspace_id, p.envelope_id]);
    const account = usage.get(usageKey) ?? {
      binding: p.envelope_binding,
      calls: 0,
      input_bytes: 0,
    };
    if (account.binding !== p.envelope_binding) invalid();
    usage.set(usageKey, account);
    const before = [],
      byRef = new Map();
    for (const r of list) {
      const v = r.payload,
        s = stateOf(before);
      const earlier = (id, kind) => {
        const prior = byRef.get(id);
        if (!prior || prior.kind !== kind) invalid();
        return prior;
      };
      if (r.kind === "attempt") {
        keys(v, ["input_ref", "terms", "proposal_ref"]);
        const m = ownMaterial(r, v.input_ref);
        terms(v.terms);
        if (!s.attempt) {
          if (
            v.proposal_ref !== null ||
            v.input_ref !== p.input_ref ||
            canonical(v.terms) !== canonical(p.terms)
          )
            invalid();
        } else {
          const proposal = earlier(v.proposal_ref, "response");
          if (
            s.unresolved ||
            s.returned?.ref !== proposal.ref ||
            proposal.payload.response.status !== "proposed" ||
            !proposal.payload.response.proposal.formats.includes(
              v.terms.format,
            ) ||
            s.amendments >= 3
          )
            invalid();
          for (const field of [
            "operation",
            "population",
            "deadline",
            "max_rows",
          ])
            if (v.terms[field] !== p.terms[field]) invalid();
        }
      } else if (r.kind === "sent") {
        keys(v, ["attempt_ref", "mode", "expected_head"]);
        earlier(v.attempt_ref, "attempt");
        if (
          !["send", "reconcile"].includes(v.mode) ||
          v.attempt_ref !== s.attempt?.ref ||
          v.expected_head !== s.head
        )
          invalid();
        if (
          v.mode === "send" &&
          (s.closed ||
            s.unresolved ||
            (s.sent && s.returned?.payload.response.status !== "absent"))
        )
          invalid();
        if (v.mode === "reconcile" && !s.sent) invalid();
        account.calls++;
        if (v.mode === "send")
          account.input_bytes += ownMaterial(
            r,
            s.attempt.payload.input_ref,
          ).metadata.size;
      } else if (r.kind === "response") {
        keys(v, [
          "attempt_ref",
          "response",
          "material_ref",
          "late",
          "material_basis",
        ]);
        const attempt = earlier(v.attempt_ref, "attempt");
        if (
          s.sent?.ref !== s.head ||
          s.sent.payload.attempt_ref !== attempt.ref ||
          r.operation_key !== `response:${s.sent.ref}` ||
          typeof v.late !== "boolean" ||
          v.material_basis !== p.material_basis
        )
          invalid();
        const body = { ...v.response };
        if (body.status === "returned") {
          const m = ownMaterial(r, v.material_ref);
          body.material = { metadata: m.metadata, base64: m.base64 };
        } else if (v.material_ref !== null) invalid();
        // Instance is retained as observed attribution; config is intentionally not
        // consulted while validating an offline historical backup.
        text(body.instance, 100);
        response(body, attempt, { instance: body.instance });
      } else if (r.kind === "check") {
        keys(v, [
          "response_ref",
          "material_ref",
          "checker",
          "verdict",
          "checks",
          "limitations",
          "material_basis",
          "dependency_binding",
        ]);
        const result = earlier(v.response_ref, "response");
        if (
          s.unresolved ||
          result.ref !== s.returned?.ref ||
          result.payload.response.status !== "returned" ||
          result.payload.material_ref !== v.material_ref ||
          !["pass", "fail"].includes(v.verdict)
        )
          invalid();
        ownMaterial(r, v.material_ref);
        text(v.checker, 160);
        text(v.checks);
        text(v.limitations);
        ref(v.material_basis);
        ref(v.dependency_binding);
      } else if (r.kind === "use") {
        keys(v, [
          "check_ref",
          "output_ref",
          "description",
          "material_basis",
          "attribution",
        ]);
        const check = earlier(v.check_ref, "check");
        if (
          s.checked?.ref !== check.ref ||
          check.payload.verdict !== "pass" ||
          check.payload.response_ref !== s.returned?.ref ||
          v.material_basis !== check.payload.material_basis ||
          v.attribution !== "consumer_declared_use_with_material_dependency" ||
          !ownMaterial(r, v.output_ref).metadata.dependencies.includes(
            check.payload.material_ref,
          )
        )
          invalid();
        text(v.description);
      } else if (r.kind === "reconsider") {
        keys(v, [
          "dependency_binding",
          "response_ref",
          "dependencies",
          "decision",
          "reason",
          "material_basis",
        ]);
        ref(v.dependency_binding);
        ref(v.material_basis);
        text(v.reason);
        if (
          !["retain", "stop"].includes(v.decision) ||
          v.response_ref !== (s.returned?.ref ?? null) ||
          !Array.isArray(v.dependencies) ||
          v.dependencies.length !== p.experience_refs.length
        )
          invalid();
        for (const d of v.dependencies) {
          if (
            !p.experience_refs.includes(d.ref) ||
            !["available", "corrected", "unavailable"].includes(d.status)
          )
            invalid();
          refs(d.correction_refs, 32);
          if (v.decision === "retain" && d.status === "unavailable") invalid();
        }
      } else if (r.kind === "close") {
        keys(v, [
          "reason",
          "unresolved_effect",
          "external_cancellation_confirmed",
          "credentials_withdrawn",
        ]);
        text(v.reason);
        if (
          v.unresolved_effect !== s.unresolved ||
          v.external_cancellation_confirmed !== false ||
          v.credentials_withdrawn !== false
        )
          invalid();
      } else if (r !== first) invalid();
      before.push(r);
      byRef.set(r.ref, r);
    }
    if (list.length < 2) invalid();
  }
  for (const row of db
    .prepare("SELECT * FROM vnext_external_envelopes")
    .all()) {
    ref(row.binding);
    text(row.envelope_id, 100);
    integer(row.calls, 0, 64);
    integer(row.input_bytes, 0, 1048576);
    integer(row.suspended, 0, 1);
    const k = canonical([row.workspace_id, row.envelope_id]),
      u = usage.get(k);
    if (
      !u ||
      u.binding !== row.binding ||
      u.calls !== row.calls ||
      u.input_bytes !== row.input_bytes
    )
      invalid();
    usage.delete(k);
  }
  if (usage.size) invalid();
}
