import type Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { openDatabase } from "@/lib/db";
import { canonical, currentReviewConnection, readReviewConnections, readReviewCallback } from "../../plugins/augnes-operator/mcp/review-connection.mjs";
import { callbackDestination, callbackURL, CallbackError } from "../../plugins/augnes-operator/mcp/review-webhook.mjs";
import { resolveReviewScope, reviewObject, reviewKeys, reviewProjection, refuseReview, type ReviewConnection } from "./request-bound-review";

// Egress permission only. These rows neither change the credential-bound
// connection configuration nor confer native work/semantic/execution authority.
type Policy = { connection_binding: string; revision: number; stopped: number; last_stage: string | null; observed_at: number | null };
type Candidate = { candidate_ref: string; connection_binding: string; principal: string; project_key: string; policy_revision: number;
    revision: number; origin: string; arguments_json: string; state: string; observed_at: number; expires_at: number; decision_at: number | null };
export type CallbackApproval = { candidate_ref: string; revision: number; policy_revision: number } | null;
const policy = (db: Database.Database, c: ReviewConnection) => db.prepare("SELECT * FROM vnext_review_callback_policies WHERE connection_ref=? AND connection_binding=?").get(c.id, c.binding) as Policy | undefined;
function fail(reason: string): never { throw new CallbackError(reason, "origin_policy"); }
const token = (c: Candidate): CallbackApproval => ({ candidate_ref: c.candidate_ref, revision: c.revision, policy_revision: c.policy_revision });

function ensurePolicy(db: Database.Database, c: ReviewConnection) {
    // Called only after authenticated scope validation. Replacement config keeps
    // its existing full-binding revocation semantics; no old decision migrates.
    db.prepare(`INSERT INTO vnext_review_callback_policies(connection_ref,connection_binding,revision,stopped) VALUES(?,?,1,0)
      ON CONFLICT(connection_ref) DO UPDATE SET connection_binding=excluded.connection_binding,revision=revision+1,stopped=0,last_stage=NULL,observed_at=NULL
      WHERE connection_binding<>excluded.connection_binding`).run(c.id, c.binding);
    return policy(db, c)!;
}
export function recordCallbackStage(db: Database.Database, c: ReviewConnection, stage: string) {
    if (c.callback_enrollment) db.prepare("UPDATE vnext_review_callback_policies SET last_stage=?,observed_at=? WHERE connection_ref=? AND connection_binding=?")
        .run(stage, Date.now(), c.id, c.binding);
}

/** Returns the exact current permission, or records one bounded pending origin
 * and refuses. Never stores a URL path/query/secret, resolves DNS or challenges. */
export function admitReviewCallback(db: Database.Database, c: ReviewConnection, raw: unknown, args: object,
    options: { observe?: boolean; expected?: CallbackApproval } = {}) {
    const destination = callbackDestination(raw);
    if (!c.callback_enrollment) {
        callbackURL(raw, c.callback_origins);
        return { origin: destination.origin, approval: null as CallbackApproval, expires_at: Date.parse(c.expires_at) };
    }
    let p = policy(db, c);
    const argumentsJson = canonical(args);
    const lookup = () => db.prepare(`SELECT * FROM vnext_review_callback_candidates
      WHERE connection_ref=? AND connection_binding=? AND principal=? AND project_key=? AND origin=? AND arguments_json=?`)
        .get(c.id, c.binding, c.principal, c.project_key, destination.origin, argumentsJson) as Candidate | undefined;
    let candidate = lookup();
    if (options.observe) {
        db.transaction(() => {
            currentReviewConnection(c.id, c.binding);
            p = ensurePolicy(db, c);
            // Expired observations/decisions are replaceable only by a new
            // authenticated request with a new candidate identity, never a refresh
            // of an old decision. Global and per-connection bounds cap flooding.
            db.prepare("DELETE FROM vnext_review_callback_candidates WHERE expires_at<=?").run(Date.now());
            candidate = lookup();
            if (!candidate && !p.stopped) {
                const count = db.prepare("SELECT count(*) n FROM vnext_review_callback_candidates WHERE connection_ref=?").get(c.id) as { n: number };
                const total = db.prepare("SELECT count(*) n FROM vnext_review_callback_candidates").get() as { n: number };
                if (count.n >= 8 || total.n >= 64) fail("approval_candidate_limit");
                db.prepare(`INSERT INTO vnext_review_callback_candidates VALUES(?,?,?,?,?,?,1,?,?,'pending',?,?,NULL)`)
                    .run(`candidate:${randomBytes(16).toString("hex")}`, c.id, c.binding, c.principal, c.project_key, p.revision,
                        destination.origin, argumentsJson, Date.now(), Math.min(Date.now() + 900000, Date.parse(c.expires_at)));
                candidate = lookup();
            }
        }).immediate();
    }
    if (!p || p.stopped) fail("approval_required");
    if (!candidate || candidate.expires_at <= Date.now()) fail("approval_required");
    if (candidate.state === "pending") fail("approval_required");
    if (candidate.state !== "approved") fail("approval_revoked");
    if (candidate.policy_revision !== p.revision || (options.expected !== undefined && canonical(options.expected) !== canonical(token(candidate))))
        fail("approval_changed");
    return { origin: destination.origin, approval: token(candidate), expires_at: Math.min(candidate.expires_at, Date.parse(c.expires_at)) };
}

function stopSubscriptions(db: Database.Database, c: ReviewConnection) {
    // Local stop needs no callback address or egress approval. Changing policy
    // fences in-flight verification before persistence and before the socket.
    db.prepare("UPDATE vnext_review_subscriptions SET stopped=1,generation=generation+1 WHERE connection_ref=? AND connection_binding=?").run(c.id, c.binding);
    db.prepare(`UPDATE vnext_review_deliveries SET status='stopped' WHERE status='pending' AND subscription_id IN
      (SELECT subscription_id FROM vnext_review_subscriptions WHERE connection_ref=? AND connection_binding=?)`).run(c.id, c.binding);
}

/** This operation is reachable only by the authenticated local Companion
 * channel, never by the three-tool reviewer adapter or a reviewer credential. */
export async function handleCallbackOperator(value: unknown, reviewerSecret: string | null) {
    if (reviewerSecret !== null) refuseReview("review_access_refused", 403);
    const input = reviewObject(value);
    reviewKeys(input, ["action", "operation", "connection_ref", "connection_binding", "project_key"],
        ["candidate_ref", "expected_revision", "expected_policy_revision", "expires_at"]);
    const { operation } = input;
    if (!["inspect", "approve", "reject", "revoke", "stop"].includes(operation)) refuseReview("invalid_review_input", 400);
    // Expiry must not prevent inspect/stop. Still require the exact private file,
    // runtime and project binding; replacement/removal remains a refusal.
    const c = (readReviewConnections() as ReviewConnection[]).find(c => c.id === input.connection_ref && c.binding === input.connection_binding && c.project_key === input.project_key);
    if (!c || !c.callback_enrollment) refuseReview("review_access_refused", 403);
    const db = openDatabase();
    try {
        await resolveReviewScope(db, c);
        if (operation !== "inspect") {
            if (!Number.isSafeInteger(input.expected_policy_revision)) refuseReview("invalid_review_input", 400);
            db.transaction(() => {
                // Reread private authority after obtaining the write lock.
                const fresh = (readReviewConnections() as ReviewConnection[]).find(v => v.id === c.id && v.binding === c.binding);
                if (!fresh) refuseReview("review_access_refused", 403);
                const p = ensurePolicy(db, c);
                if (p.revision !== input.expected_policy_revision) refuseReview("callback_policy_changed");
                if (operation === "stop") {
                    if (input.candidate_ref !== undefined || input.expected_revision !== undefined || input.expires_at !== undefined) refuseReview("invalid_review_input", 400);
                    db.prepare("UPDATE vnext_review_callback_policies SET stopped=1,revision=revision+1,last_stage='operator_stopped',observed_at=? WHERE connection_ref=?").run(Date.now(), c.id);
                    db.prepare("UPDATE vnext_review_callback_candidates SET state='revoked',revision=revision+1 WHERE connection_ref=? AND connection_binding=?").run(c.id, c.binding);
                    stopSubscriptions(db, c);
                    return;
                }
                if (!/^candidate:[a-f0-9]{32}$/.test(input.candidate_ref) || !Number.isSafeInteger(input.expected_revision)) refuseReview("invalid_review_input", 400);
                const row = db.prepare(`SELECT * FROM vnext_review_callback_candidates WHERE candidate_ref=? AND connection_ref=? AND connection_binding=? AND project_key=? AND principal=?`)
                    .get(input.candidate_ref, c.id, c.binding, c.project_key, c.principal) as Candidate | undefined;
                if (!row) refuseReview("review_access_refused", 403);
                if (row.revision !== input.expected_revision) refuseReview("callback_candidate_changed");
                let expires = Math.min(row.expires_at, Date.parse(c.expires_at));
                if (operation === "approve") {
                    currentReviewConnection(c.id, c.binding);
                    expires = Date.parse(input.expires_at);
                    if (row.expires_at <= Date.now() || !Number.isFinite(expires) || expires <= Date.now() || expires > Date.parse(c.expires_at) || expires > Date.now() + 3600000)
                        refuseReview("callback_approval_expiry_invalid", 400);
                } else {
                    if (input.expires_at !== undefined) refuseReview("invalid_review_input", 400);
                    // A refusal remains a tombstone until connection expiry. The
                    // host cannot evict it by changing a path/secret or refreshing.
                    expires = Date.parse(c.expires_at);
                }
                db.prepare(`UPDATE vnext_review_callback_candidates SET state=?,revision=revision+1,policy_revision=?,expires_at=?,decision_at=? WHERE candidate_ref=?`)
                    .run(operation === "approve" ? "approved" : operation === "reject" ? "rejected" : "revoked", p.revision, expires, Date.now(), row.candidate_ref);
                db.prepare("UPDATE vnext_review_callback_policies SET stopped=CASE WHEN ?='approve' THEN 0 ELSE stopped END,last_stage=?,observed_at=? WHERE connection_ref=?")
                    .run(operation, `operator_${operation}`, Date.now(), c.id);
                // Permission tokens fence this candidate's deliveries even when
                // another scope on this connection remains approved.
                for (const sub of db.prepare("SELECT subscription_id,callback_envelope FROM vnext_review_subscriptions WHERE connection_ref=? AND connection_binding=? AND stopped=0 AND expires_at>?").all(c.id, c.binding, Date.now()) as any[]) {
                    if (readReviewCallback(c, sub.callback_envelope).approval?.candidate_ref !== row.candidate_ref) continue;
                    db.prepare("UPDATE vnext_review_subscriptions SET stopped=1,generation=generation+1 WHERE subscription_id=?").run(sub.subscription_id);
                    db.prepare("UPDATE vnext_review_deliveries SET status='stopped' WHERE subscription_id=? AND status='pending'").run(sub.subscription_id);
                }
            }).immediate();
        } else if (["candidate_ref", "expected_revision", "expected_policy_revision", "expires_at"].some(k => input[k] !== undefined)) refuseReview("invalid_review_input", 400);
        const p = policy(db, c);
        const rows = db.prepare("SELECT * FROM vnext_review_callback_candidates WHERE connection_ref=? AND connection_binding=? ORDER BY observed_at,candidate_ref LIMIT 8").all(c.id, c.binding) as Candidate[];
        const subscriptions = db.prepare("SELECT subscription_id,arguments_json,callback_envelope,expires_at,verified_until FROM vnext_review_subscriptions WHERE connection_ref=? AND connection_binding=? AND stopped=0 AND expires_at>? LIMIT 16").all(c.id, c.binding, Date.now()) as any[];
        const effective = subscriptions.map(s => {
            const saved = readReviewCallback(c, s.callback_envelope);
            let state = "permitted";
            try {
                currentReviewConnection(c.id, c.binding);
                admitReviewCallback(db, c, saved.url, JSON.parse(s.arguments_json), { expected: saved.approval ?? null });
            } catch (error) {
                if (error instanceof CallbackError || (error instanceof Error && error.message === "review_access_refused")) state = "permission_inactive";
                else throw error;
            }
            return { subscription_ref: s.subscription_id, state, expires_at: new Date(s.expires_at).toISOString(), verified_until: new Date(s.verified_until).toISOString() };
        });
        return reviewProjection("available", { observation: "observed", connection_ref: c.id, connection_binding: c.binding, project_key: c.project_key, principal: c.principal,
            connection_expires_at: c.expires_at, policy_revision: p?.revision ?? 1, stopped: Boolean(p?.stopped),
            subscriptions: effective,
            diagnostic: p?.last_stage ? { stage: p.last_stage, observed_at: p.observed_at } : { status: "unavailable", reason: "no_observation" },
            candidates: rows.map(r => ({ candidate_ref: r.candidate_ref, revision: r.revision, policy_revision: r.policy_revision,
                origin: r.origin, event: "review.requested", arguments: JSON.parse(r.arguments_json), state: r.state, provenance: "authenticated_events_subscribe",
                currentness: r.expires_at <= Date.now() ? "expired" : r.policy_revision !== p?.revision ? "policy_changed" : "current",
                observed_at: new Date(r.observed_at).toISOString(), expires_at: new Date(r.expires_at).toISOString(),
                decision_at: r.decision_at === null ? null : new Date(r.decision_at).toISOString() })),
            limitations: "Authenticated receiver submission and challenge verification do not establish corporate ownership. Approval permits scoped egress only. Host retries, task cancellation and exactly-once model execution are not guaranteed.",
            next_action: "Inspect the exact origin and scope locally. Approve only within the authorized disclosure scope, then request a fresh ordinary host subscription. Approval alone never activates delivery." });
    } finally { db.close(); }
}
