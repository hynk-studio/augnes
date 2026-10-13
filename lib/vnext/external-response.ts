import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import { resolveCodexRepositoryProjectV01 } from "./codex-repository-continuity/codex-repository-continuity";
import { readCanonicalProjectWithRootV01 } from "./persistence/project-identity-registry";
import { inspectNativeHostPhysicalRootIdentitySynchronouslyV01 as physical } from "./native-host/project-root-identity";
import { readReviewMaterial } from "./request-bound-review";
import {
  EXTERNAL_VERSION,
  LIMITS,
  ExternalError,
  canonical,
  digest,
  keys,
  text,
  ref,
  refs,
  terms,
  response,
  stateOf,
  fail,
} from "./external-response-rules.mjs";
import {
  append,
  parseRecord,
  records,
  putMaterial,
  readMaterial,
  scopeKey,
} from "./persistence/external-response-store.mjs";
import {
  readExternalConfiguration,
  currentEnvelope,
  contactProcessor,
} from "./external-response-transport.mjs";

type Scope = { workspace_id: string; project_id: string };
export const externalProjection = (status: string, data: object = {}) => ({
  version: EXTERNAL_VERSION,
  status,
  ...data,
  authority: { semantic: false, execution_grant: false, approval: false },
  evidence_level: "local_adapter_observation",
});
const sameScope = (a: Scope, b: Scope) =>
  a.workspace_id === b.workspace_id && a.project_id === b.project_id;
function known(db: Database.Database, scope: Scope, r: string) {
  ref(r);
  const row = db
    .prepare(
      "SELECT * FROM vnext_external_records WHERE ref=? AND workspace_id=? AND project_id=?",
    )
    .get(r, scope.workspace_id, scope.project_id);
  if (!row) fail("external_access_refused", 403);
  return parseRecord(row)!;
}
function shared(db: Database.Database, scope: Scope, r: string) {
  ref(r);
  const v = db
    .prepare(
      "SELECT * FROM vnext_external_records WHERE ref=? AND workspace_id=?",
    )
    .get(r, scope.workspace_id) as any;
  if (!v || !["experience", "correction"].includes(v.kind))
    fail("external_access_refused", 403);
  const c = readExternalConfiguration(),
    ownerKey = scopeKey({
      workspace_id: v.workspace_id,
      project_id: v.project_id,
    }),
    target = scopeKey(scope);
  const owner = c.projects.find((p: any) => p.project_key === ownerKey);
  if (!owner || !c.projects.some((p: any) => p.project_key === target))
    fail("external_access_refused", 403);
  if (
    !sameScope(v, scope) &&
    (!owner.share_to.includes(target) ||
      !db
        .prepare(
          "SELECT 1 FROM vnext_external_shares WHERE record_ref=? AND target_key=? AND withdrawn_at IS NULL",
        )
        .get(r, target))
  )
    fail("external_access_refused", 403);
  return parseRecord(v)!;
}
function material(
  db: Database.Database,
  scope: Scope,
  r: string,
  experience?: string,
) {
  // Missing and private references have the same access refusal unless a
  // currently readable declaration establishes that the missing bytes are owed.
  const row = db
    .prepare(
      "SELECT workspace_id,project_id FROM vnext_external_materials WHERE ref=?",
    )
    .get(ref(r)) as Scope | undefined;
  if (experience) {
    const e = shared(db, scope, experience);
    if (!e.payload.materials?.includes(r)) fail("external_access_refused", 403);
  } else if (!row || !sameScope(row, scope)) {
    const declared = records(db, scope).some(
      (v: any) => v.payload.material_ref === r || v.payload.input_ref === r,
    );
    if (!declared) fail("external_access_refused", 403);
  }
  const m = readMaterial(db, r);
  if (
    m.workspace_id !== scope.workspace_id ||
    (!experience && !sameScope(m, scope))
  )
    fail("external_access_refused", 403);
  return m;
}
function dependencies(
  db: Database.Database,
  scope: Scope,
  experienceRefs: string[],
) {
  return experienceRefs.map((r) => {
    try {
      const e = shared(db, scope, r);
      const changes = db
        .prepare(
          "SELECT * FROM vnext_external_records WHERE workspace_id=? AND kind='correction' AND json_extract(payload_json,'$.target_ref')=? ORDER BY created_at,ref LIMIT 33",
        )
        .all(scope.workspace_id, r) as any[];
      if (changes.length > 32)
        return {
          ref: r,
          status: "unavailable",
          reason: "dependency_inspection_limit",
        };
      const corrections = [];
      for (const change of changes) {
        try {
          const c = shared(db, scope, change.ref);
          corrections.push({
            ref: c.ref,
            created_at: c.created_at,
            topic: c.payload.topic,
            statement: c.payload.statement,
            material_basis: c.payload.material_basis,
          });
        } catch {
          return {
            ref: r,
            status: "unavailable",
            reason: "current_dependency_inspection_unavailable",
          };
        }
      }
      return {
        ref: e.ref,
        status: corrections.length ? "corrected" : "available",
        corrections,
      };
    } catch {
      return {
        ref: r,
        status: "unavailable",
        reason: "current_dependency_inspection_unavailable",
      };
    }
  });
}
function workView(db: Database.Database, scope: Scope, w: any, current: any) {
  const events = records(db, scope, w.stream),
    state = stateOf(events),
    deps = dependencies(db, scope, w.payload.experience_refs);
  const dependency_binding = digest(deps),
    review = events.filter((e: any) => e.kind === "reconsider").at(-1);
  const reviewedCurrent =
    review?.payload.material_basis === current.material_ref &&
    review?.payload.response_ref === (state.returned?.ref ?? null);
  const applicability = reviewedCurrent
    ? "explicitly_reconsidered"
    : w.payload.material_basis !== current.material_ref
      ? "basis_changed"
      : state.returned?.payload.late
        ? "late_result_review_required"
        : "original_basis";
  const reconsidered =
    review?.payload.dependency_binding === dependency_binding &&
    review?.payload.decision === "retain";
  const ready =
    !["basis_changed", "late_result_review_required"].includes(applicability) &&
    review?.payload.decision !== "stop" &&
    deps.every(
      (d: any) =>
        d.status === "available" || (d.status === "corrected" && reconsidered),
    );
  return {
    work_ref: w.ref,
    purpose: w.payload.purpose,
    original: w.payload,
    events,
    state,
    dependencies: deps,
    dependency_binding,
    applicability,
    ready,
    next_action: state.unresolved
      ? "reconcile_before_repetition"
      : state.closed
        ? "closed_retaining_obligations"
        : !ready
          ? "inspect_and_reconsider_dependencies"
          : state.used
            ? "close_or_reconsider"
            : ["refused", "partial"].includes(
                  state.returned?.payload.response.status,
                )
              ? "choose_direct_fallback_or_close"
              : state.returned?.payload.response.status === "returned"
                ? "read_check_and_use_material"
                : state.returned?.payload.response.status === "proposed"
                  ? "consider_proposed_amendment"
                  : state.attempt
                    ? "explicit_send_or_stop"
                    : "prepare_an_attempt",
  };
}
function requireReady(view: any) {
  if (!view.ready) fail("external_reconsideration_required");
  if (view.state.closed) fail("external_work_closed");
}
export async function handleExternalOperation(value: unknown) {
  keys(value, ["repository_root", "action"], ["data", "expected_material_ref"]);
  const input = value as any;
  text(input.repository_root, 4096);
  text(input.action, 40);
  const data = input.data ?? {};
  const db = openDatabase();
  try {
    db.pragma("busy_timeout = 5000");
    const resolution = await resolveCodexRepositoryProjectV01(db, {
      repository_root: input.repository_root,
    });
    if (resolution.status !== "resolved_exact")
      fail("external_access_refused", 403);
    const scope = {
        workspace_id: resolution.workspace_id!,
        project_id: resolution.project_id!,
      },
      projectKey = scopeKey(scope);
    function context() {
      const config = readExternalConfiguration(),
        project = config.projects.find(
          (p: any) =>
            p.project_key === projectKey &&
            p.repository_root === input.repository_root,
        );
      const registration = readCanonicalProjectWithRootV01(db, scope);
      if (
        !project ||
        !registration ||
        canonical(physical(input.repository_root)) !==
          canonical(
            physical(registration.root_binding.local_root.normalized_path),
          )
      )
        fail("external_access_refused", 403);
      return { config, project, current: readReviewMaterial(db, scope) };
    }
    const transact = (f: () => any) => db.transaction(f).immediate();
    let dispatch: any = null;
    const initial = transact(() => {
      const { config, project, current } = context();
      const mutates = ![
        "read",
        "discover",
        "read_experience",
        "material",
        "withdraw",
        "act",
        "close",
      ].includes(input.action);
      if (mutates && input.expected_material_ref !== current.material_ref)
        fail("external_work_basis_changed");
      const result = (status: string, extra: object = {}) =>
        externalProjection(status, extra);
      const own = (r: string) => known(db, scope, r);
      const envelope = (id: string) => {
        const e = config.envelopes.find(
          (e: any) => e.id === id && e.project_keys.includes(projectKey),
        );
        if (!e) fail("external_access_refused", 403);
        return e;
      };
      const ensureEnvelope = (e: any) => {
        const old = db
          .prepare(
            "SELECT * FROM vnext_external_envelopes WHERE workspace_id=? AND envelope_id=?",
          )
          .get(scope.workspace_id, e.id) as any;
        if (old && (old.binding !== e.binding || old.suspended))
          fail(
            old.suspended
              ? "external_recovery_suspended"
              : "external_envelope_changed",
            403,
          );
        if (!old)
          db.prepare(
            "INSERT INTO vnext_external_envelopes VALUES(?,?,?,0,0,0)",
          ).run(scope.workspace_id, e.id, e.binding);
        return old ?? { calls: 0, input_bytes: 0, suspended: 0 };
      };
      const selected = (values: string[]) => {
        refs(values);
        if (!values.length) fail("external_sources_required");
        return values.map((r) => {
          const s = current.sources.find((s: any) => s.source_binding === r);
          if (!s?.source_locator) fail("external_source_unavailable", 403);
          return s;
        });
      };
      const targets = (values: string[]) => {
        refs(values, LIMITS.shares);
        const registered = db
          .prepare(
            "SELECT workspace_id,project_id FROM vnext_project_identities WHERE workspace_id=?",
          )
          .all(scope.workspace_id)
          .map(scopeKey);
        if (
          values.some(
            (k) =>
              !project.share_to.includes(k) ||
              !registered.includes(k) ||
              !config.projects.some((p: any) => p.project_key === k),
          )
        )
          fail("external_sharing_refused", 403);
        return values;
      };
      const save = (
        kind: string,
        stream: string,
        payload: any,
        head?: string | null,
      ) => {
        text(data.key, 100);
        return append(
          db,
          scope,
          { kind, stream, operation_key: data.key, payload },
          head,
        );
      };
      const withShares = (saved: any) => {
        for (const target of saved.record.payload.targets)
          db.prepare(
            "INSERT OR IGNORE INTO vnext_external_shares VALUES(?,?,?,NULL)",
          ).run(saved.record.ref, target, saved.record.created_at);
        return result(saved.replay ? "exact_replay" : "saved", {
          record: saved.record,
        });
      };
      if (input.action === "read") {
        keys(data, [], ["work_ref"]);
        if (data.work_ref) {
          const w = own(data.work_ref);
          if (w.kind !== "work") fail("external_access_refused", 403);
          return result("available", {
            work: workView(db, scope, w, current),
            material_basis: current.material_ref,
          });
        }
        const list = records(db, scope).filter((r: any) => r.kind === "work");
        if (list.length > 32) fail("external_discovery_limit");
        const owned = db
          .prepare(
            "SELECT ref,metadata_json FROM vnext_external_materials WHERE workspace_id=? AND project_id=? ORDER BY ref LIMIT 129",
          )
          .all(scope.workspace_id, scope.project_id) as any[];
        if (owned.length > 128) fail("external_discovery_limit");
        return result("available", {
          definition: current.definition,
          material_basis: current.material_ref,
          packet_ref: current.packet_ref,
          sources: current.sources,
          work_refs: list.map((w: any) => ({
            ref: w.ref,
            purpose: w.payload.purpose,
            original_basis: w.payload.material_basis,
          })),
          materials: owned.map((m) => ({
            ref: m.ref,
            metadata: readMaterial(db, m.ref).metadata,
            availability: "locator_only",
          })),
          project_key: projectKey,
          share_targets: project.share_to,
          envelopes: config.envelopes
            .filter((e: any) => e.project_keys.includes(projectKey))
            .map((e: any) => {
              const usage = db
                .prepare(
                  "SELECT calls,input_bytes,suspended,binding FROM vnext_external_envelopes WHERE workspace_id=? AND envelope_id=?",
                )
                .get(scope.workspace_id, e.id) as any;
              return {
                id: e.id,
                instance: e.instance,
                expires_at: e.expires_at,
                max_calls: e.max_calls,
                max_amendments: e.max_amendments,
                max_input_bytes: e.max_input_bytes,
                timeout_ms: e.timeout_ms,
                usage: usage
                  ? {
                      calls: usage.calls,
                      input_bytes: usage.input_bytes,
                      suspended: !!usage.suspended,
                      configuration_matches: usage.binding === e.binding,
                    }
                  : {
                      calls: 0,
                      input_bytes: 0,
                      suspended: false,
                      configuration_matches: true,
                    },
                operations: ["aggregate"],
                input_sha256: e.input_sha256,
              };
            }),
        });
      }
      if (input.action === "discover") {
        keys(data, ["query"]);
        text(data.query, 120);
        // Access-filter before matching/projection; withheld titles never enter search.
        const candidates = db
          .prepare(
            "SELECT ref FROM vnext_external_records WHERE workspace_id=? AND kind='experience' ORDER BY ref LIMIT 2049",
          )
          .all(scope.workspace_id) as any[];
        if (candidates.length > LIMITS.records)
          fail("external_discovery_limit");
        const visible = [];
        for (const c of candidates) {
          let e;
          try {
            e = shared(db, scope, c.ref);
          } catch (error) {
            if (
              error instanceof ExternalError &&
              error.code === "external_access_refused"
            )
              continue;
            throw error;
          }
          if (
            canonical(e.payload)
              .toLowerCase()
              .includes(data.query.toLowerCase())
          )
            visible.push({
              ref: e.ref,
              title: e.payload.title,
              created_at: e.created_at,
              source_project: scopeKey({
                workspace_id: e.workspace_id,
                project_id: e.project_id,
              }),
            });
        }
        if (visible.length > 32) fail("external_discovery_limit");
        return result("available", {
          experiences: visible,
          scope: "currently_permitted_workspace_shares",
        });
      }
      if (input.action === "read_experience") {
        keys(data, ["ref"]);
        const e = shared(db, scope, data.ref),
          target = e.kind === "correction" ? e.payload.target_ref : e.ref;
        return result("available", {
          experience: e,
          affected_work: records(db, scope)
            .filter(
              (w: any) =>
                w.kind === "work" && w.payload.experience_refs.includes(target),
            )
            .map((w: any) => ({ ref: w.ref, purpose: w.payload.purpose })),
          dependencies: dependencies(db, scope, [target]),
          materials: (e.payload.materials ?? []).map((r: string) => ({
            ref: r,
            availability: "locator_only",
          })),
        });
      }
      if (input.action === "material") {
        keys(data, ["ref"], ["experience_ref"]);
        const m = material(db, scope, data.ref, data.experience_ref);
        return result("available", {
          material: {
            ref: m.ref,
            metadata: m.metadata,
            base64: m.base64,
            availability: "complete_read",
          },
        });
      }
      if (input.action === "put_material") {
        keys(data, ["metadata", "base64"]);
        return result("saved", {
          material_ref: putMaterial(db, scope, data.metadata, data.base64),
        });
      }
      if (input.action === "publish") {
        keys(data, [
          "key",
          "title",
          "source_refs",
          "conditions",
          "association",
          "assessment",
          "materials",
          "targets",
        ]);
        text(data.title, 160);
        text(data.conditions);
        text(data.assessment);
        keys(data.association, [
          "endpoint",
          "account",
          "operator",
          "confidence",
        ]);
        for (const v of Object.values(data.association)) text(v, 200);
        refs(data.materials);
        data.materials.forEach((r: string) => material(db, scope, r));
        const payload = {
          title: data.title,
          sources: selected(data.source_refs),
          conditions: data.conditions,
          association: data.association,
          assessment: data.assessment,
          materials: data.materials,
          targets: targets(data.targets),
          material_basis: current.material_ref,
        };
        return withShares(
          save("experience", `experience:${data.key}`, payload),
        );
      }
      if (input.action === "withdraw") {
        keys(data, ["ref", "target_key"]);
        const e = own(data.ref);
        if (!["experience", "correction"].includes(e.kind))
          fail("external_access_refused", 403);
        ref(data.target_key);
        const row = db
          .prepare(
            "SELECT * FROM vnext_external_shares WHERE record_ref=? AND target_key=?",
          )
          .get(e.ref, data.target_key) as any;
        if (!row) fail("external_access_refused", 403);
        if (!row.withdrawn_at)
          db.prepare(
            "UPDATE vnext_external_shares SET withdrawn_at=? WHERE record_ref=? AND target_key=?",
          ).run(new Date().toISOString(), e.ref, data.target_key);
        return result(row.withdrawn_at ? "exact_replay" : "saved", {
          withdrawn: true,
          prior_copies_recalled: false,
        });
      }
      if (input.action === "correct") {
        keys(data, [
          "key",
          "target_ref",
          "topic",
          "statement",
          "source_refs",
          "targets",
        ]);
        const e = own(data.target_ref);
        if (e.kind !== "experience") fail("external_correction_target_invalid");
        text(data.topic, 100);
        text(data.statement);
        return withShares(
          save("correction", `correction:${data.key}`, {
            target_ref: e.ref,
            topic: data.topic,
            statement: data.statement,
            sources: selected(data.source_refs),
            targets: targets(data.targets),
            material_basis: current.material_ref,
          }),
        );
      }
      if (input.action === "prepare") {
        keys(data, [
          "key",
          "purpose",
          "experience_refs",
          "envelope_id",
          "input_ref",
          "terms",
          "expectation",
          "reconsider_when",
          "owners",
        ]);
        for (const k of ["purpose", "expectation", "reconsider_when"])
          text(data[k]);
        keys(data.owners, ["receive", "check", "use"]);
        Object.values(data.owners).forEach((v) => text(v, 160));
        refs(data.experience_refs);
        data.experience_refs.forEach((r: string) => shared(db, scope, r));
        terms(data.terms);
        const e = envelope(data.envelope_id);
        currentEnvelope(e.id, e.binding, projectKey);
        ensureEnvelope(e);
        const m = material(db, scope, data.input_ref);
        if (
          !e.input_sha256.includes(m.metadata.sha256) ||
          Date.parse(data.terms.deadline) > Date.parse(e.expires_at) ||
          Date.parse(data.terms.deadline) <= Date.now()
        )
          fail("external_terms_outside_envelope");
        const saved = save("work", `work:${data.key}`, {
          purpose: data.purpose,
          experience_refs: data.experience_refs,
          envelope_id: e.id,
          envelope_binding: e.binding,
          input_ref: m.ref,
          terms: data.terms,
          expectation: data.expectation,
          reconsider_when: data.reconsider_when,
          owners: data.owners,
          material_basis: current.material_ref,
          packet_ref: current.packet_ref,
          definition: current.definition,
        });
        append(
          db,
          scope,
          {
            kind: "attempt",
            stream: saved.record.stream,
            operation_key: `${data.key}:initial`,
            payload: {
              input_ref: m.ref,
              terms: data.terms,
              proposal_ref: null,
            },
          },
          saved.record.ref,
        );
        return result(saved.replay ? "exact_replay" : "saved", {
          work_ref: saved.record.ref,
        });
      }
      // Every following operation resolves an already scoped stream, not a caller's
      // claimed project/worker. Its aggregate envelope survives identity correction.
      const w = own(data.work_ref);
      if (w.kind !== "work") fail("external_access_refused", 403);
      const view = workView(db, scope, w, current),
        s = view.state;
      if (input.action === "amend") {
        keys(data, [
          "key",
          "work_ref",
          "expected_head",
          "proposal_ref",
          "input_ref",
          "terms",
        ]);
        requireReady(view);
        const prior = view.events.find(
          (r: any) => r.operation_key === data.key,
        );
        if (prior) {
          const saved = save(
            "attempt",
            w.stream,
            {
              input_ref: data.input_ref,
              terms: data.terms,
              proposal_ref: data.proposal_ref,
            },
            data.expected_head,
          );
          return result(saved.replay ? "exact_replay" : "saved", {
            record: saved.record,
          });
        }
        if (s.unresolved) fail("external_reconciliation_required");
        if (
          s.returned?.ref !== data.proposal_ref ||
          s.returned.payload.response.status !== "proposed"
        )
          fail("external_unaccepted_amendment");
        const e = envelope(w.payload.envelope_id);
        currentEnvelope(e.id, w.payload.envelope_binding, projectKey);
        ensureEnvelope(e);
        terms(data.terms);
        if (
          s.amendments >= e.max_amendments ||
          data.terms.operation !== w.payload.terms.operation ||
          data.terms.population !== w.payload.terms.population ||
          data.terms.deadline !== w.payload.terms.deadline ||
          data.terms.max_rows !== w.payload.terms.max_rows ||
          !s.returned.payload.response.proposal.formats.includes(
            data.terms.format,
          )
        )
          fail("external_amendment_outside_envelope");
        const m = material(db, scope, data.input_ref);
        if (!e.input_sha256.includes(m.metadata.sha256))
          fail("external_material_not_permitted", 403);
        const saved = save(
          "attempt",
          w.stream,
          {
            input_ref: m.ref,
            terms: data.terms,
            proposal_ref: data.proposal_ref,
          },
          data.expected_head,
        );
        return result(saved.replay ? "exact_replay" : "saved", {
          record: saved.record,
        });
      }
      if (input.action === "act") {
        keys(data, ["key", "work_ref", "expected_head", "mode"]);
        if (!["send", "reconcile"].includes(data.mode))
          fail("external_invalid_input", 400);
        const previous = view.events.find(
          (r: any) => r.operation_key === data.key,
        );
        if (previous) {
          if (
            previous.kind !== "sent" ||
            previous.payload.mode !== data.mode ||
            previous.payload.expected_head !== data.expected_head
          )
            fail("external_replay_conflict");
          return result("exact_replay", { work: view, effect_repeated: false });
        }
        if (data.mode === "send") {
          requireReady(view);
          if (
            w.payload.material_basis !== current.material_ref &&
            view.applicability !== "explicitly_reconsidered"
          )
            fail("external_work_basis_changed");
          if (
            s.sent &&
            (!s.returned || s.returned.payload.response.status !== "absent")
          )
            fail("external_reconciliation_required");
          if (Date.parse(s.attempt.payload.terms.deadline) <= Date.now())
            fail("external_deadline_elapsed");
        } else if (
          !s.sent ||
          (!s.unresolved && s.returned?.payload.response.status !== "absent")
        )
          return result("available", { work: view, effect_repeated: false });
        const e = currentEnvelope(
            w.payload.envelope_id,
            w.payload.envelope_binding,
            projectKey,
          ),
          usage = ensureEnvelope(e),
          m = material(db, scope, s.attempt.payload.input_ref);
        if (!e.input_sha256.includes(m.metadata.sha256))
          fail("external_material_not_permitted", 403);
        const byteCost = data.mode === "send" ? m.metadata.size : 0;
        if (
          usage.calls >= e.max_calls ||
          usage.input_bytes + byteCost > e.max_input_bytes
        )
          fail("external_budget_exhausted");
        if (view.events.length > LIMITS.events - 3)
          fail("external_history_limit");
        const sent = save(
          "sent",
          w.stream,
          {
            attempt_ref: s.attempt.ref,
            mode: data.mode,
            expected_head: data.expected_head,
          },
          data.expected_head,
        );
        db.prepare(
          "UPDATE vnext_external_envelopes SET calls=calls+1,input_bytes=input_bytes+? WHERE workspace_id=? AND envelope_id=?",
        ).run(byteCost, scope.workspace_id, e.id);
        dispatch = {
          e,
          attempt: s.attempt,
          input: m,
          sent: sent.record,
          w,
          scope,
          projectKey,
          reconcile: data.mode === "reconcile",
        };
        return null;
      }
      if (input.action === "reconsider") {
        keys(data, [
          "key",
          "work_ref",
          "expected_head",
          "dependency_binding",
          "decision",
          "reason",
        ]);
        if (
          !["retain", "stop"].includes(data.decision) ||
          data.dependency_binding !== view.dependency_binding
        )
          fail("external_dependency_changed");
        text(data.reason);
        if (
          data.decision === "retain" &&
          view.dependencies.some((d: any) => d.status === "unavailable")
        )
          fail("external_dependency_unavailable");
        const saved = save(
          "reconsider",
          w.stream,
          {
            dependency_binding: view.dependency_binding,
            response_ref: s.returned?.ref ?? null,
            dependencies: view.dependencies.map((d: any) => ({
              ref: d.ref,
              status: d.status,
              correction_refs: (d.corrections ?? []).map((c: any) => c.ref),
            })),
            decision: data.decision,
            reason: data.reason,
            material_basis: current.material_ref,
          },
          data.expected_head,
        );
        return result(saved.replay ? "exact_replay" : "saved", {
          record: saved.record,
        });
      }
      if (input.action === "check") {
        keys(data, [
          "key",
          "work_ref",
          "expected_head",
          "response_ref",
          "material_ref",
          "checker",
          "verdict",
          "checks",
          "limitations",
        ]);
        requireReady(view);
        if (
          s.unresolved ||
          s.returned?.ref !== data.response_ref ||
          s.returned.payload.material_ref !== data.material_ref ||
          s.returned.payload.response.status !== "returned"
        )
          fail("external_result_not_available");
        material(db, scope, data.material_ref);
        text(data.checker, 160);
        text(data.checks);
        text(data.limitations);
        if (!["pass", "fail"].includes(data.verdict))
          fail("external_invalid_input", 400);
        const saved = save(
          "check",
          w.stream,
          {
            response_ref: data.response_ref,
            material_ref: data.material_ref,
            checker: data.checker,
            verdict: data.verdict,
            checks: data.checks,
            limitations: data.limitations,
            material_basis: current.material_ref,
            dependency_binding: view.dependency_binding,
          },
          data.expected_head,
        );
        return result(saved.replay ? "exact_replay" : "saved", {
          record: saved.record,
        });
      }
      if (input.action === "use") {
        keys(data, [
          "key",
          "work_ref",
          "expected_head",
          "check_ref",
          "output_ref",
          "description",
        ]);
        requireReady(view);
        text(data.description);
        if (
          s.checked?.ref !== data.check_ref ||
          s.checked.payload.verdict !== "pass" ||
          s.checked.payload.response_ref !== s.returned?.ref ||
          s.checked.payload.material_basis !== current.material_ref ||
          s.checked.payload.dependency_binding !== view.dependency_binding
        )
          fail("external_current_check_required");
        const output = material(db, scope, data.output_ref);
        if (
          !output.metadata.dependencies.includes(s.checked.payload.material_ref)
        )
          fail("external_output_dependency_required");
        const saved = save(
          "use",
          w.stream,
          {
            check_ref: data.check_ref,
            output_ref: data.output_ref,
            description: data.description,
            material_basis: current.material_ref,
            attribution: "consumer_declared_use_with_material_dependency",
          },
          data.expected_head,
        );
        return result(saved.replay ? "exact_replay" : "saved", {
          record: saved.record,
        });
      }
      if (input.action === "close") {
        keys(data, ["key", "work_ref", "expected_head", "reason"]);
        text(data.reason);
        const saved = save(
          "close",
          w.stream,
          {
            reason: data.reason,
            unresolved_effect: s.unresolved,
            external_cancellation_confirmed: false,
            credentials_withdrawn: false,
          },
          data.expected_head,
        );
        return result(saved.replay ? "exact_replay" : "saved", {
          record: saved.record,
        });
      }
      fail("external_invalid_action", 400);
    });
    if (!dispatch) return initial;
    // Reserve before egress. A crash anywhere after this commit leaves an
    // unresolved sent record. No transaction claims exactly-once external effect.
    const d = dispatch;
    try {
      currentEnvelope(d.e.id, d.e.binding, d.projectKey);
      const received = await contactProcessor(
        d.e,
        d.attempt,
        d.input,
        d.reconcile,
      );
      response(received, d.attempt, d.e);
      return transact(() => {
        const { config } = context();
        if (
          !config.envelopes.some(
            (e: any) => e.id === d.e.id && e.binding === d.e.binding,
          )
        )
          fail("external_permission_unavailable", 403);
        const materialRef =
          received.status === "returned"
            ? putMaterial(
                db,
                scope,
                received.material.metadata,
                received.material.base64,
              )
            : null;
        const retained = { ...received };
        delete retained.material;
        const saved = append(
          db,
          scope,
          {
            kind: "response",
            stream: d.w.stream,
            operation_key: `response:${d.sent.ref}`,
            payload: {
              attempt_ref: d.attempt.ref,
              response: retained,
              material_ref: materialRef,
              late: Date.now() > Date.parse(d.attempt.payload.terms.deadline),
              material_basis: d.w.payload.material_basis,
            },
          },
          d.sent.ref,
        );
        return externalProjection("saved", {
          record: saved.record,
          effect_status: received.status,
        });
      });
    } catch (error) {
      return externalProjection("unavailable", {
        reason: (error as any).code ?? "external_response_unavailable",
        persistence: "sent_committed_response_unresolved",
        work_ref: d.w.ref,
        next_action:
          "Read this work and reconcile the same request before any repetition.",
      });
    }
  } finally {
    db.close();
  }
}
