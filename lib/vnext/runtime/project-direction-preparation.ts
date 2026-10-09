import type Database from "better-sqlite3";
import { closeSync, constants, fstatSync, openSync, readSync, realpathSync } from "node:fs";
import path from "node:path";
import { directionObject, directionArray, directionRef, directionText } from "../project-direction";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { assertInspection, PROSPECTIVE_INPUT, readAgendaInput, type Agenda, type ConditionalMethod } from "../prospective-agenda";
import { effectiveDirection, assertPacketDirectionCurrent, directionCheck as check } from "../persistence/project-direction-store";
import { readCanonicalProjectWithRootV01 } from "../persistence/project-identity-registry";
import { readProjectWorkInitializationV01 } from "./project-work-initialization";
import { inspectVNextOperatorPilotPacketLineageV01 } from "./operator-pilot-project-continuity";
import { revisePreExecutionProjectWorkV01 } from "./project-work-revision";
import type { VNextLocalOperatorPilotConfigV01, VNextLocalOperatorSessionCredentialV01 } from "./local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "./local-runtime-clock";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { DIRECTION_SOURCE, directionSource, selectedDirectionProfile as selectedProfile } from "../project-direction-source";
export { DIRECTION_SOURCE, directionSource } from "../project-direction-source";
/** A structured note is a projection, not proof. Production admission resolves
 * its exact bytes against the authenticated durable direction owner. */
export function assertAgendaDirectionBinding(db: Database.Database, packet: TaskContextPacketV01, at: string) {
  const sources = readSelectedWorkSources(packet);
  const current = effectiveDirection(db, packet, at);
  if (!current) {
    check(!sources.some(e => selectedProfile(e)?.version === DIRECTION_SOURCE), "direction_source_unbound");
    return;
  }
  assertPacketDirectionCurrent(db, packet, at);
  const agenda = readAgendaInput(sources, at);
  const selected = directionSource(current);
  check(agenda?.agenda.direction_ref === selected.source_ref && sources.some(e => canonical(e) === canonical(selected)), "agenda_direction_changed");
}

/** The UI supplies ordinary file names and literal questions. Exact hashes,
 * source references, clock fields and comparison bindings are server-owned. */
export function prepareDirectionAgenda(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; credential: VNextLocalOperatorSessionCredentialV01; request: unknown; clock?: VNextLocalRuntimeClockV01;
}) {
  const raw = directionObject(input.request, ["action", "expected_ref", "files"]);
  check(raw.action === "prepare_inspection", "request_invalid");
  const request = { expected_ref: directionRef(raw.expected_ref), files: directionArray(raw.files, 1, 2).map(value => {
    const file = directionObject(value, ["path", "contains"]);
    return { path: directionText(file.path, 160), contains: directionText(file.contains, 128) };
  }) };
  const at = input.clock?.now() ?? new Date().toISOString();
  const current = effectiveDirection(db, input.config, at);
  check(current && current.ref === request.expected_ref, "stale_revision");
  const work = readProjectWorkInitializationV01(db, input.config);
  check(work.current_packet && work.current_work && work.project_work_binding, "define_ordinary_work_first");
  check(["initial_user_defined", "pre_execution_user_revision", "pre_execution_new_task", "authored_successor_task"].includes(work.current_packet.lineage_kind), "preparation_profile_unsupported");
  const packet = inspectVNextOperatorPilotPacketLineageV01(db, { config: input.config, packet_id: work.current_packet.packet_id, packet_fingerprint: work.current_packet.packet_fingerprint }).packet;
  const registration = readCanonicalProjectWithRootV01(db, input.config);
  check(registration, "project_missing");
  const root = realpathSync(registration.root_binding.local_root.normalized_path);
  let bytes = 0;
  const inspections = request.files.map((file, index) => {
    const preliminary = { ...file, key: `source_${index + 1}`, digest: hash("") };
    assertInspection(preliminary);
    const filePath = path.join(root, file.path);
    check(realpathSync(filePath) === filePath, "selected_source_symlink_refused");
    const fd = openSync(filePath, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      check(stat.isFile() && stat.nlink === 1 && stat.size + bytes <= 65_536, "selected_source_budget");
      const buffer = Buffer.alloc(65_537 - bytes);
      const length = readSync(fd, buffer, 0, buffer.length, 0);
      const data = buffer.subarray(0, length);
      bytes += length;
      check(bytes <= 65_536 && length === stat.size && fstatSync(fd).size === stat.size, "selected_source_changed");
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(data);
      return { ...preliminary, digest: hash(decoded) };
    } finally { closeSync(fd); }
  });
  check(new Set(inspections.map(i => i.path)).size === inspections.length, "duplicate_source");
  const direction = directionSource(current);
  const agenda: Agenda = { profile: PROSPECTIVE_INPUT, kind: "agenda", decision: current.value.content.purpose,
    direction_ref: direction.source_ref!, interpretation: "Inspect the explicitly selected sources before reviewing the current working direction.",
    support_refs: [], premise_until: new Date(Date.parse(at) + 3_600_000).toISOString(), event_window: null,
    deadline: null, preparation_ms: { min: 0, max: 10_000 }, not_before: at,
    recheck_at: new Date(Date.parse(at) + 10_000).toISOString(), event_key: null, inspections,
    costs: { preparation: "At most two files and 65,536 bytes", waiting: null, execution: "No commands, model calls or network", opportunity: null }, exploratory: false };
  const method: ConditionalMethod = { profile: PROSPECTIVE_INPUT, kind: "method", id: "review_selected_sources",
    action: "Review the inspected sources against the current project direction.", context: {},
    premises: Object.fromEntries(inspections.map(i => [i.key, true])), support_refs: [], conflict_refs: [] };
  const note = (value: unknown) => buildSelectedWorkSourceEntry(input.config, { source: "Selected-source preparation", label: "New candidate", observed_at: at,
    provenance: "derived_interpretation", text: canonical(value) });
  // Keep facts, counterevidence and methods. Replacing an agenda changes
  // selection only; every earlier packet and its selected notes remain intact.
  const retained = readSelectedWorkSources(packet).filter(e => {
    const v = selectedProfile(e);
    return v?.version !== DIRECTION_SOURCE && !(v?.profile === PROSPECTIVE_INPUT && v.kind === "agenda");
  });
  const hasMethod = retained.some(e => selectedProfile(e)?.kind === "method");
  const sources = [...retained, direction, note(agenda), ...(!hasMethod ? [note(method)] : [])];
  const comparison = compareSelectedWorkSources(packet, sources);
  const result = revisePreExecutionProjectWorkV01(db, { ...input, expected_direction_ref: request.expected_ref, request: {
    action: "revise_pre_execution_project_work", workspace_id: input.config.workspace_id, project_id: input.config.project_id,
    expected_active_project_id: input.config.project_id, expected_active_selection_revision: work.active_selection_revision,
    expected_project_work_binding: work.project_work_binding,
    expected_current_packet_id: packet.packet_id, expected_current_packet_fingerprint: packet.integrity.fingerprint,
    expected_current_lineage_kind: work.current_packet.lineage_kind, ...work.current_work,
    selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
  } });
  const prepared = readAgendaInput(readSelectedWorkSources(result.packet), result.packet.generated_at)!;
  return { packet_id: result.packet.packet_id, agenda_ref: prepared.source_ref, direction_ref: current.ref,
    preparation_authorized: false, execution_started: false, session_admission: result.session_admission };
}
