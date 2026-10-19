import type Database from "better-sqlite3";
import { createHmac } from "node:crypto";
import { openDatabase } from "@/lib/db";
import { resolveCodexRepositoryProjectV01 } from "./codex-repository-continuity/codex-repository-continuity";
import { projectSelectedWorkSourcesV01 } from "./codex-repository-continuity/codex-repository-work-sources";
import { readProjectWorkInitializationSnapshotV01 } from "./runtime/project-work-initialization";
import { readProjectWorkBindingV01 } from "./runtime/project-work-binding";
import { readProjectWorkRevisionEligibilityStrictV01 } from "./runtime/project-work-revision";
import { inspectPreExecutionProjectWorkRevisionChainV01 } from "./runtime/pre-execution-project-work-revision";
import { PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01 } from "@/types/vnext/project-work-revision";
import { readCanonicalProjectWithRootV01 } from "./persistence/project-identity-registry";
import { inspectNativeHostPhysicalRootIdentitySynchronouslyV01 } from "./native-host/project-root-identity";
import { readCodexCurrentContinuitySnapshotV01 } from "./codex-current-continuity/codex-current-continuity";
import { COMPANION_WORK_OPERATOR_ID_V01 } from "./runtime/local-operator-session";
import { selectedWorkSourceInput, buildSelectedWorkSourceEntry, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { REVIEW_MARKER, digest, canonical, currentReviewConnection, readReviewConnections, sameSecret } from "../../plugins/augnes-operator/mcp/review-connection.mjs";
export class ReviewError extends Error {
    constructor(readonly code: string, readonly status = 409) { super(code); }
}
export function refuseReview(code: string, status = 409): never { throw new ReviewError(code, status); }
export const reviewProjection = (status: string, data: object = {}) => ({
    projection_version: REVIEW_MARKER, status, ...data,
    source_material_authority: "untrusted_review_context",
    authority: { semantic: false, execution: false, external_effect: false, approval: false },
});
export type ReviewConnection = {
    id: string;
    binding: string;
    principal: string;
    repository_root: string;
    project_key: string;
    secret: string;
    storage_key: string;
    destination: string;
    reviewer_label: string;
    expires_at: string;
    callback_origins: string[];
    callback_enrollment?: true;
};
export type ReviewRow = {
    request_ref: string;
    workspace_id: string;
    project_id: string;
    connection_ref: string;
    connection_binding: string;
    requester: string;
    reviewer: string;
    destination: string;
    packet_ref: string;
    project_binding: string;
    material_ref: string;
    question: string;
    created_at: string;
    read_binding: string | null;
    response_json: string | null;
    response_ref: string | null;
    response_saved_at: string | null;
    readback_served_at: string | null;
};
export function reviewObject(value: unknown): Record<string, any> {
    if (!value || typeof value !== "object" || Array.isArray(value))
        refuseReview("invalid_review_input", 400);
    return value as Record<string, any>;
}
export function reviewKeys(value: Record<string, any>, required: string[], optional: string[] = []) {
    if (required.some(k => !(k in value)) || Object.keys(value).some(k => !required.includes(k) && !optional.includes(k)))
        refuseReview("invalid_review_input", 400);
}
function bounded(value: unknown, max: number) {
    if (typeof value !== "string" || !value.trim() || [...value].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value))
        refuseReview("invalid_review_input", 400);
    return value as string;
}
export async function resolveReviewScope(db: Database.Database, c: ReviewConnection) {
    const r = await resolveCodexRepositoryProjectV01(db, { repository_root: c.repository_root });
    if (r.status !== "resolved_exact")
        refuseReview("review_access_refused", 403);
    const scope = { workspace_id: r.workspace_id!, project_id: r.project_id! };
    if (digest({ purpose: "codex-current-continuity-public-project-key.v0.1", ...scope }) !== c.project_key)
        refuseReview("review_access_refused", 403);
    return scope;
}
// One validated packet supplies BOTH definition and selected sources. No second
// opportunistic read can replace a classified failure with an empty projection.
export function readReviewMaterial(db: Database.Database, scope: {
    workspace_id: string;
    project_id: string;
}) {
    // Event delivery also uses this reader outside the request transaction. Pin
    // definition, sources and project binding to one SQLite read snapshot there.
    if (!db.inTransaction)
        return db.transaction(() => readReviewMaterialInsideTransaction(db, scope))();
    return readReviewMaterialInsideTransaction(db, scope);
}
function readReviewMaterialInsideTransaction(db: Database.Database, scope: {
    workspace_id: string;
    project_id: string;
}) {
    const { projection: work, packet } = readProjectWorkInitializationSnapshotV01(db, scope);
    if (work.state === "unavailable")
        refuseReview("review_material_inspection_failed", 503);
    if (!packet || !work.current_packet || !work.current_work)
        refuseReview("review_material_unavailable");
    const project_binding = readProjectWorkBindingV01(db, scope);
    if (!project_binding)
        refuseReview("review_material_inspection_failed", 503);
    const packet_ref = packet.integrity.fingerprint;
    const material_ref = digest({ packet_ref, project_binding });
    const definition = { goal: work.current_work.goal, success_criteria: work.current_work.success_criteria, non_goals: work.current_work.non_goals };
    if (Buffer.byteLength(canonical(definition)) > 12000)
        refuseReview("review_material_out_of_bounds");
    return { material_ref, packet_ref, project_binding, definition,
        sources: projectSelectedWorkSourcesV01(work.selected_source_context ?? []), packet };
}
export function scopedReview(db: Database.Database, c: ReviewConnection, scope: {
    workspace_id: string;
    project_id: string;
}, ref: unknown) {
    if (typeof ref !== "string" || !/^sha256:[a-f0-9]{64}$/.test(ref))
        refuseReview("review_access_refused", 403);
    const row = db.prepare(`SELECT * FROM vnext_review_requests WHERE request_ref=? AND workspace_id=? AND project_id=?
    AND connection_ref=? AND connection_binding=? AND reviewer=?`).get(ref, scope.workspace_id, scope.project_id, c.id, c.binding, c.principal) as ReviewRow | undefined;
    if (!row)
        refuseReview("review_access_refused", 403);
    validateReviewRow(row, c);
    return row;
}
function validateReviewRow(row: ReviewRow, c: ReviewConnection) {
    try {
        if (row.requester !== COMPANION_WORK_OPERATOR_ID_V01 || row.reviewer !== c.principal || row.destination !== c.destination ||
            row.material_ref !== digest({ packet_ref: row.packet_ref, project_binding: row.project_binding }) ||
            row.request_ref !== digest({ connection: c.binding, requester: row.requester, material: row.material_ref, question: row.question }))
            throw new Error();
        bounded(row.question, 2000);
        if (row.response_ref) {
            const response = reviewObject(JSON.parse(row.response_json!));
            reviewKeys(response, ["request_ref", "material_ref", "answer", "limitations", "source_refs", "attribution"]);
            bounded(response.answer, 1000);
            bounded(response.limitations, 240);
            if (digest(response) !== row.response_ref || response.request_ref !== row.request_ref || response.material_ref !== row.material_ref ||
                !row.response_saved_at || !Array.isArray(response.source_refs) || response.source_refs.length > 8 ||
                response.source_refs.some((v: unknown) => typeof v !== "string" || !/^sha256:[a-f0-9]{64}$/.test(v)) ||
                canonical(response.attribution) !== canonical({ principal: c.principal, destination: c.destination, label: c.reviewer_label,
                    basis: "configured_capability_possession", model_and_tier: "unverified" }))
                throw new Error();
        }
        else if (row.response_json || row.response_saved_at)
            throw new Error();
    }
    catch {
        refuseReview("review_saved_state_inspection_failed", 503);
    }
}
export function responseNote(row: ReviewRow) {
    const response = JSON.parse(row.response_json!);
    return { source: `note_ref:augnes-review:${row.response_ref!.slice(7)}`,
        text: `Review ${row.request_ref}; material ${row.material_ref}.\n${response.answer}\nLimitations: ${response.limitations}\nAttribution: ${response.attribution.label} (configured connection; model/tier unverified).`,
        provenance: "imported_unverified", observed_at: row.response_saved_at, label: "Unclassified / needs review" };
}
function originalReadBinding(row: ReviewRow, c: ReviewConnection) {
    return `sha256:${createHmac("sha256", c.storage_key).update(canonical({ request: row.request_ref, material: row.material_ref, reviewer: c.principal })).digest("hex")}`;
}
/** Recover bytes from the bounded, validated ordinary history owner. Neither a
 * digest, a current source with the same locator, nor a caller copy is proof. */
function historicalReviewBasis(db: Database.Database, scope: { workspace_id: string; project_id: string },
    row: ReviewRow, c: ReviewConnection, current: ReturnType<typeof readReviewMaterial>) {
    if (!row.read_binding || !sameSecret(row.read_binding, originalReadBinding(row, c)))
        refuseReview("review_read_binding_refused", 403);
    if (row.project_binding !== current.project_binding)
        refuseReview("review_project_binding_changed");
    try {
        const eligibility = readProjectWorkRevisionEligibilityStrictV01(db, scope);
        if (!eligibility.eligible || !["eligible_initial_packet", "eligible_revised_packet"].includes(eligibility.status))
            refuseReview("review_history_unavailable");
        const chain = inspectPreExecutionProjectWorkRevisionChainV01(db, scope);
        if (!chain.projection_current || chain.tip_packet.integrity.fingerprint !== current.packet_ref)
            refuseReview("review_history_unavailable");
        const start = chain.packets.findLastIndex(p => p.compatibility.source_contracts.includes(PRE_EXECUTION_NEW_WORK_COMPILER_VERSION_V01));
        const packets = chain.packets.slice(Math.max(0, start));
        const index = packets.findIndex(p => p.integrity.fingerprint === row.packet_ref);
        if (index < 0) refuseReview("review_original_material_unavailable");
        const packet = packets[index];
        const definition = { goal: packet.task.goal, success_criteria: packet.task.success_criteria, non_goals: packet.task.non_goals };
        if (Buffer.byteLength(canonical(definition)) > 12000) refuseReview("review_material_out_of_bounds");
        const sources = projectSelectedWorkSourcesV01(readSelectedWorkSources(packet));
        return { original: { material_ref: row.material_ref, packet_ref: row.packet_ref, project_binding: row.project_binding,
            definition, sources }, intervening_packet_refs: packets.slice(index + 1).map(p => p.integrity.fingerprint) };
    } catch (error) {
        if (error instanceof ReviewError) throw error;
        refuseReview("review_history_unavailable", 503);
    }
}
async function reassessReview(db: Database.Database, scope: { workspace_id: string; project_id: string },
    row: ReviewRow, c: ReviewConnection, material: ReturnType<typeof readReviewMaterial>) {
    if (!row.response_ref) refuseReview("review_response_unavailable");
    const basis = historicalReviewBasis(db, scope, row, c, material);
    const response = JSON.parse(row.response_json!);
    if (response.source_refs.some((v: string) => v !== row.packet_ref && !basis.original.sources.some(s => s.source_binding === v)))
        refuseReview("review_original_material_unavailable", 503);
    const continuity = await readCodexCurrentContinuitySnapshotV01(db, { viewed_project_id: scope.project_id });
    if (continuity.projection.snapshot.status !== "exact" || continuity.work_initialization?.current_packet?.packet_fingerprint !== material.packet_ref)
        refuseReview("review_material_inspection_failed", 503);
    const current = { material_ref: material.material_ref, packet_ref: material.packet_ref, project_binding: material.project_binding,
        definition: material.definition, sources: material.sources, snapshot_binding: continuity.projection.snapshot.binding };
    return { ...basis, current, response,
        reassessment_binding: digest({ purpose: "augnes.review-reassessment.v1", request_ref: row.request_ref,
            response_ref: row.response_ref, original: basis.original, current }),
        changes: { definition_changed: canonical(basis.original.definition) !== canonical(current.definition),
            original_sources_not_selected: basis.original.sources.filter(s => !current.sources.some(n => n.source_binding === s.source_binding)).map(s => s.source_binding),
            current_sources_added: current.sources.filter(s => !basis.original.sources.some(o => o.source_binding === s.source_binding)).map(s => s.source_binding) },
    };
}
function projectRow(row: ReviewRow, material: ReturnType<typeof readReviewMaterial>) {
    const response = row.response_json ? JSON.parse(row.response_json) : null;
    const sources = material.packet.selected_context.map(selectedWorkSourceInput);
    const useSource = `note_ref:augnes-review-use:${row.response_ref?.slice(7)}`;
    const note = response ? responseNote(row) : null;
    const retained = note && sources.some(s => canonical(s) === canonical(note));
    const use = retained ? sources.find(s => s.source === useSource && s.provenance === "derived_interpretation") : null;
    return {
        request_ref: row.request_ref, question: row.question, material_ref: row.material_ref, packet_ref: row.packet_ref,
        created_at: row.created_at, requester: row.requester, reviewer: row.reviewer, destination: row.destination,
        currentness: material.material_ref === row.material_ref ? "current" : "historical",
        response, response_ref: row.response_ref, response_saved_at: row.response_saved_at,
        readback: row.readback_served_at ? "served_to_origin" : "not_served",
        use: use ? { status: "attributed_note_in_current_work", reasoning: use.text, packet_ref: material.packet_ref,
            meaning: "Explicit authored use; not independent evidence of model judgment or semantic acceptance." } : { status: "not_observed_in_current_work" },
        next_action: response ? "Assess this answer and currentness; deliberately prepare retain, revise or reject through ordinary work revision." : "Review pending; discover or read this exact request.",
    };
}
export async function handleReviewOperation(inputValue: unknown, reviewerSecret: string | null) {
    const input = reviewObject(inputValue);
    const db = openDatabase();
    try {
        db.pragma("busy_timeout = 5000");
        const connections = readReviewConnections() as ReviewConnection[];
        const reviewer = reviewerSecret !== null;
        if (input.action === "connections" && !reviewer) {
            reviewKeys(input, ["action", "repository_root"]);
            const target = await resolveCodexRepositoryProjectV01(db, { repository_root: input.repository_root });
            if (target.status !== "resolved_exact")
                refuseReview("review_access_refused", 403);
            const key = digest({ purpose: "codex-current-continuity-public-project-key.v0.1", workspace_id: target.workspace_id, project_id: target.project_id });
            const permitted = connections.filter(c => c.project_key === key && Date.parse(c.expires_at) > Date.now());
            for (const c of permitted) {
                await resolveReviewScope(db, c);
                currentReviewConnection(c.id, c.binding);
            }
            return reviewProjection("available", { connections: permitted.map(c => ({ connection_ref: c.id, destination: c.destination, expires_at: c.expires_at })) });
        }
        const c = reviewer
            ? connections.find(c => sameSecret(reviewerSecret, c.secret))
            : connections.find(c => c.id === input.connection_ref);
        if (!c || Date.parse(c.expires_at) <= Date.now())
            refuseReview("review_access_refused", 403);
        if (reviewer && input.connection_ref !== c.id)
            refuseReview("review_access_refused", 403);
        const scope = await resolveReviewScope(db, c);
        // Finish asynchronous physical discovery before reserving the synchronous
        // SQLite writer. Otherwise a second request's busy wait blocks the first
        // request's event loop. Recheck the registered and physical roots inside
        // the transaction; material and replay checks have no asynchronous gap.
        db.exec(["prepare_use", "reassess", "prepare_reassessed_use"].includes(input.action) ? "BEGIN" : "BEGIN IMMEDIATE");
        const registration = readCanonicalProjectWithRootV01(db, scope);
        if (!registration || canonical(inspectNativeHostPhysicalRootIdentitySynchronouslyV01(c.repository_root)) !==
            canonical(inspectNativeHostPhysicalRootIdentitySynchronouslyV01(registration.root_binding.local_root.normalized_path)))
            refuseReview("review_access_refused", 403);
        const common = ["action", "connection_ref"];
        const allowed = reviewer ? ["list", "read", "reply"] : ["inspect", "request", "list", "readback", "prepare_use", "reassess", "prepare_reassessed_use"];
        if (!allowed.includes(input.action))
            refuseReview("review_capability_refused", 403);
        if (input.action === "inspect")
            reviewKeys(input, common);
        else if (input.action === "list")
            reviewKeys(input, common, ["cursor"]);
        else if (input.action === "request")
            reviewKeys(input, [...common, "expected_material_ref", "question"]);
        else if (input.action === "reply")
            reviewKeys(input, [...common, "request_ref", "read_binding", "answer", "limitations", "source_refs"], ["receipt_mode"]);
        else if (input.action === "prepare_use")
            reviewKeys(input, [...common, "request_ref", "choice", "reasoning"]);
        else if (input.action === "prepare_reassessed_use")
            reviewKeys(input, [...common, "request_ref", "expected_response_ref", "expected_reassessment_binding", "choice", "reasoning"]);
        else
            reviewKeys(input, [...common, "request_ref"]);
        const material = readReviewMaterial(db, scope);
        let result: Record<string, any>;
        if (input.action === "inspect") {
            result = reviewProjection("available", { connection_ref: c.id, destination: c.destination,
                material_ref: material.material_ref, packet_ref: material.packet_ref, definition: material.definition,
                next_action: "Ask one bounded question against this material_ref." });
        }
        else if (input.action === "request") {
            const question = bounded(input.question, 2000);
            if (input.expected_material_ref !== material.material_ref)
                refuseReview("review_material_changed");
            const ref = digest({ connection: c.binding, requester: COMPANION_WORK_OPERATOR_ID_V01, material: material.material_ref, question });
            const previous = db.prepare("SELECT * FROM vnext_review_requests WHERE request_ref=?").get(ref) as ReviewRow | undefined;
            if (previous)
                validateReviewRow(previous, c);
            if (!previous) {
                db.prepare(`INSERT INTO vnext_review_requests(request_ref,workspace_id,project_id,connection_ref,connection_binding,requester,reviewer,destination,packet_ref,project_binding,material_ref,question,created_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(ref, scope.workspace_id, scope.project_id, c.id, c.binding, COMPANION_WORK_OPERATOR_ID_V01, c.principal, c.destination, material.packet_ref, material.project_binding, material.material_ref, question, new Date().toISOString());
                for (const sub of db.prepare("SELECT * FROM vnext_review_subscriptions WHERE connection_ref=? AND connection_binding=? AND stopped=0 AND expires_at>?").all(c.id, c.binding, Date.now()) as any[]) {
                    const filter = JSON.parse(sub.arguments_json);
                    if (!filter.work_ref || filter.work_ref === material.packet_ref)
                        db.prepare("INSERT INTO vnext_review_deliveries VALUES(?,?,0,'pending')").run(sub.subscription_id, ref);
                }
            }
            result = reviewProjection(previous ? "exact_replay" : "saved", { request_ref: ref, material_ref: material.material_ref, response_ref: previous?.response_ref ?? null,
                next_action: "The reviewer can read this request. Discover its saved response through list/readback." });
        }
        else if (input.action === "list") {
            const cursor = input.cursor == null ? null : scopedReview(db, c, scope, input.cursor);
            const rows = db.prepare(`SELECT * FROM vnext_review_requests WHERE workspace_id=? AND project_id=? AND connection_ref=? AND connection_binding=?
        AND (? IS NULL OR (created_at,request_ref)<(?,?)) ORDER BY created_at DESC,request_ref DESC LIMIT 6`)
                .all(scope.workspace_id, scope.project_id, c.id, c.binding, cursor?.request_ref ?? null, cursor?.created_at ?? null, cursor?.request_ref ?? null) as ReviewRow[];
            rows.forEach(row => validateReviewRow(row, c));
            result = reviewProjection("available", { requests: rows.slice(0, 5).map(r => projectRow(r, material)),
                next_cursor: rows.length > 5 ? rows[4].request_ref : null });
        }
        else {
            const row = scopedReview(db, c, scope, input.request_ref);
            const current = row.material_ref === material.material_ref;
            if (input.action === "read") {
                if (!current)
                    result = reviewProjection("changed", { reason: "review_material_changed", request_ref: row.request_ref, material_ref: row.material_ref, next_action: "Request an explicit updated review; no replacement material returned." });
                else {
                    const binding = originalReadBinding(row, c);
                    db.prepare("UPDATE vnext_review_requests SET read_binding=? WHERE request_ref=?").run(binding, row.request_ref);
                    result = reviewProjection("available", { request_ref: row.request_ref, question: row.question,
                        material_ref: row.material_ref, read_binding: binding, definition: material.definition, sources: material.sources,
                        attribution: { label: c.reviewer_label, basis: "configured_capability_possession", model_and_tier: "unverified" } });
                }
            }
            else if (input.action === "reply") {
                if (input.receipt_mode !== undefined && input.receipt_mode !== "historical_v1")
                    refuseReview("invalid_review_input", 400);
                if (!row.read_binding || !sameSecret(input.read_binding, row.read_binding))
                    refuseReview("review_read_binding_refused", 403);
                const original = input.receipt_mode === "historical_v1" ? historicalReviewBasis(db, scope, row, c, material).original : null;
                const answer = bounded(input.answer, 1000), limitations = bounded(input.limitations, 240);
                if (!Array.isArray(input.source_refs) || input.source_refs.length > 8 || input.source_refs.some((v: unknown) => typeof v !== "string" || !/^sha256:[a-f0-9]{64}$/.test(v)))
                    refuseReview("invalid_review_input", 400);
                const response = { request_ref: row.request_ref, material_ref: row.material_ref, answer, limitations,
                    source_refs: [...new Set(input.source_refs)].sort(),
                    attribution: { principal: c.principal, destination: c.destination, label: c.reviewer_label, basis: "configured_capability_possession", model_and_tier: "unverified" } };
                const responseRef = digest(response);
                if (row.response_ref && row.response_ref !== responseRef)
                    refuseReview("review_reply_conflict");
                if (!row.response_ref) {
                    if (!current && !original)
                        refuseReview("review_material_changed");
                    if (response.source_refs.some(v => v !== row.packet_ref && !(original ?? material).sources.some(s => s.source_binding === v)))
                        refuseReview("review_source_ref_refused", 403);
                    db.prepare("UPDATE vnext_review_requests SET response_json=?,response_ref=?,response_saved_at=? WHERE request_ref=? AND response_ref IS NULL")
                        .run(canonical(response), responseRef, new Date().toISOString(), row.request_ref);
                }
                result = reviewProjection(row.response_ref ? "exact_replay" : "saved", { request_ref: row.request_ref, response_ref: responseRef,
                    currentness: current ? "current" : "historical", persistence: "saved", next_action: "Originating agent must read and deliberately use the response. No further review was requested." });
            }
            else if (input.action === "readback") {
                if (row.response_ref) {
                    row.readback_served_at = row.readback_served_at ?? new Date().toISOString();
                    db.prepare("UPDATE vnext_review_requests SET readback_served_at=? WHERE request_ref=?").run(row.readback_served_at, row.request_ref);
                }
                result = reviewProjection("available", projectRow(row, material));
            }
            else if (input.action === "reassess" || input.action === "prepare_reassessed_use") {
                const assessment = await reassessReview(db, scope, row, c, material);
                result = reviewProjection("available", { ...projectRow(row, material), ...assessment,
                    applicability: "unassessed", next_action: "Inspect the original answer, both bases and intervening changes. Explicitly prepare use, partial_use, revise, defer or reject with reasons. Nothing has been applied." });
                if (input.action === "prepare_reassessed_use") {
                    if (input.expected_response_ref !== row.response_ref || input.expected_reassessment_binding !== assessment.reassessment_binding)
                        refuseReview("review_reassessment_changed");
                    if (!["use", "partial_use", "revise", "defer", "reject"].includes(input.choice))
                        refuseReview("invalid_review_input", 400);
                    const reasoning = bounded(input.reasoning, 1000), note = responseNote(row);
                    const use = { source: `note_ref:augnes-review-use:${row.response_ref!.slice(7)}`,
                        text: `${input.choice}: ${reasoning}\nOriginal packet: ${row.packet_ref}\nReassessed current packet: ${material.packet_ref}\nReassessment: ${assessment.reassessment_binding}`,
                        provenance: "derived_interpretation", observed_at: new Date().toISOString(), label: "Next check" };
                    buildSelectedWorkSourceEntry(scope, note);
                    buildSelectedWorkSourceEntry(scope, use);
                    const selected = readSelectedWorkSources(material.packet);
                    // Reuse ordinary exact replacement if an earlier authored use
                    // is selected. The earlier packet and complete answer survive.
                    const previous = selected.filter(s => selectedWorkSourceInput(s).source === use.source);
                    if (previous.length > 1) refuseReview("review_use_ambiguous");
                    const add = selected.some(s => canonical(selectedWorkSourceInput(s)) === canonical(note)) ? [] : [note];
                    Object.assign(result, { choice: input.choice, reasoning, applicability: "authored_interpretation_unsaved",
                        next_action: "Preview the attributed notes and your selective current edits together, then explicitly save. No use or current change has been saved.",
                        revision_tool: "augnes_preview_repository_work_revision", revision_arguments: {
                            repositoryRoot: c.repository_root, expectedSnapshotBinding: assessment.current.snapshot_binding,
                            changes: { sources: previous.length ? { add, replace: [{ source_binding: previous[0].source_ref, note: use }] } : { add: [...add, use] } },
                        } });
                }
            }
            else {
                if (!row.response_ref || !current)
                    refuseReview("review_material_changed");
                if (!["retain", "revise", "reject"].includes(input.choice))
                    refuseReview("invalid_review_input", 400);
                const reasoning = bounded(input.reasoning, 1000);
                const note = responseNote(row);
                const use = { source: `note_ref:augnes-review-use:${row.response_ref.slice(7)}`, text: `${input.choice}: ${reasoning}`,
                    provenance: "derived_interpretation", observed_at: new Date().toISOString(), label: "Next check" };
                // The ordinary source writer owns size/provenance constraints. A full
                // selection refuses there; we neither omit notes nor expand its budget.
                buildSelectedWorkSourceEntry(scope, note);
                buildSelectedWorkSourceEntry(scope, use);
                const continuity = await readCodexCurrentContinuitySnapshotV01(db, { viewed_project_id: scope.project_id });
                if (continuity.projection.snapshot.status !== "exact" || continuity.work_initialization?.current_packet?.packet_fingerprint !== row.packet_ref)
                    refuseReview("review_material_inspection_failed", 503);
                result = reviewProjection("available", { request_ref: row.request_ref, response_ref: row.response_ref, response: JSON.parse(row.response_json!),
                    choice: input.choice, reasoning, currentness: "current", next_action: "Preview these ordinary attributed note changes; deliberately save within your existing work authority. No use has been saved yet.",
                    revision_tool: "augnes_preview_repository_work_revision", revision_arguments: {
                        repositoryRoot: c.repository_root, expectedSnapshotBinding: continuity.projection.snapshot.binding,
                        changes: { sources: { add: [note, use] } },
                    } });
            }
        }
        // Preserve the existing private review transport's complete-response
        // bound. A long validated chain is unavailable, never a clipped basis.
        if (["reassess", "prepare_reassessed_use"].includes(input.action) && Buffer.byteLength(JSON.stringify(result)) > 128000)
            refuseReview("review_reassessment_out_of_bounds");
        currentReviewConnection(c.id, c.binding);
        db.exec("COMMIT");
        return result;
    }
    catch (error) {
        if (db.inTransaction)
            db.exec("ROLLBACK");
        throw error;
    }
    finally {
        db.close();
    }
}
