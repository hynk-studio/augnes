// Extends the existing review child and its authenticated HTTP/network fixture.
// No additional database/runtime owner, positive SQL seeding or live receiver.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";

export async function testReviewCallbackEnrollment(f: any) {
    const config = JSON.parse(readFileSync(f.configPath, "utf8"));
    const c = { ...config.connections[0], id: `review:${randomBytes(16).toString("hex")}`, secret: randomBytes(32).toString("base64url"),
        storage_key: randomBytes(32).toString("base64url"), callback_origins: [], callback_enrollment: true };
    config.connections.push(c);
    writeFileSync(f.configPath, JSON.stringify(config), { mode: 0o600 });
    const binding = digest(c), base = { action: "callback_operator", connection_ref: c.id, connection_binding: binding, project_key: c.project_key };
    const operator = async (operation: string, args = {}, headers = {}) => (await f.raw({ ...base, operation, ...args }, headers)).value;
    const delivery = { mode: "webhook", url: "https://receiver.example.com/private-path?secret=not-retained", secret: f.signingSecret };
    const sub = { name: "review.requested", arguments: {}, delivery };
    const event = async (method: string, params: object = sub, connection = c, secret = c.secret) => f.raw({ action: "event", connection_ref: connection.id, method, params }, { "x-augnes-review-credential": secret });
    const inspect = () => operator("inspect");
    const select = async (origin = "https://receiver.example.com", args = {}) => {
        const view = await inspect(); assert.equal(view.observation, "observed");
        const candidate = view.candidates.find((r: any) => r.origin === origin && JSON.stringify(r.arguments) === JSON.stringify(args)); assert(candidate);
        return { view, candidate, decision: { candidate_ref: candidate.candidate_ref, expected_revision: candidate.revision, expected_policy_revision: view.policy_revision } };
    };
    const approve = async () => {
        const { decision } = await select();
        const result = await operator("approve", { ...decision, expires_at: new Date(Date.now() + 600000).toISOString() });
        assert.equal(result.status, "available"); return result;
    };
    const before = f.networkCounts();
    assert.equal((await event("events/subscribe", sub, c, config.connections[0].secret)).status, 403);
    assert.deepEqual((await inspect()).candidates, []);
    const pending = await event("events/subscribe");
    assert.equal(pending.value.protocol_error.data.reason, "approval_required");
    assert.equal(pending.value.protocol_error.data.stage, "origin_policy");
    assert(!JSON.stringify(pending).includes("receiver.example"));
    assert.equal((f.db.prepare("SELECT count(*) n FROM vnext_review_subscriptions WHERE connection_ref=?").get(c.id) as any).n, 0);
    const first = await select();
    assert.equal(first.candidate.state, "pending");
    await event("events/subscribe", { ...sub, delivery: { ...delivery, url: "https://RECEIVER.example.com:443/changed", secret: `whsec_${Buffer.alloc(32, 2).toString("base64")}` } });
    assert.deepEqual((await select()).candidate, first.candidate, "duplicates/path/key changes cannot extend or replace pending observation");
    assert.deepEqual(f.networkCounts(), before, "pending observation performs no DNS/HTTPS/application delivery");
    for (const input of [{ ...base, operation: "inspect", project_key: config.connections[1].project_key },
        { ...base, operation: "approve", ...first.decision, connection_ref: config.connections[1].id },
        { ...base, operation: "inspect", connection_binding: "sha256:" + "f".repeat(64) }]) {
        const denied = await f.raw(input); assert.equal(denied.status, 403); assert(!JSON.stringify(denied).includes(c.project_key));
    }
    assert.equal((await operator("approve", { ...first.decision, expires_at: c.expires_at }, { "x-augnes-review-credential": c.secret })).reason, "review_access_refused");
    assert.equal((await operator("approve", { ...first.decision, expires_at: new Date(Date.now() + 7200000).toISOString() })).reason, "callback_approval_expiry_invalid");
    const concurrent = await Promise.all([0, 1].map(() => operator("approve", { ...first.decision, expires_at: new Date(Date.now() + 600000).toISOString() })));
    assert.deepEqual(concurrent.map(r => r.status).sort(), ["available", "refused"]);
    assert.equal(concurrent.find(r => r.status === "refused").reason, "callback_candidate_changed");
    assert.deepEqual(f.networkCounts(), before, "local approval does not complete an already-refused host call");
    assert.equal(digest(JSON.parse(readFileSync(f.configPath, "utf8")).connections.at(-1)), binding);
    assert.equal((await operator("revoke", first.decision)).reason, "callback_candidate_changed");
    delivery.url = "https://receiver.example.com/new-path?fresh=callback";
    let subscribed = await event("events/subscribe"); assert.equal(subscribed.status, 200);
    const verified = f.networkCounts(); assert.equal(verified.verifyCalls, before.verifyCalls + 1);
    assert.equal((await event("events/subscribe")).status, 200); assert.deepEqual(f.networkCounts(), verified);
    const freshSecret = `whsec_${randomBytes(32).toString("base64")}`; f.signingSecrets.add(freshSecret);
    assert.equal((await event("events/subscribe", { ...sub, delivery: { ...delivery, secret: freshSecret } })).status, 200);
    assert.equal(f.networkCounts().verifyCalls, verified.verifyCalls + 1, "verification cache is key- and approval-bound");
    for (const changed of [{ ...sub, delivery: { ...delivery, url: "https://receiver.example.com:444/path" } },
        { ...sub, delivery: { ...delivery, url: "https://different.example.com/path" } },
        { ...sub, arguments: { work_ref: "sha256:" + "e".repeat(64) } }]) {
        const n = f.networkCounts(); assert.equal((await event("events/subscribe", changed)).value.protocol_error.data.reason, "approval_required");
        assert.deepEqual(f.networkCounts(), n);
    }
    const different = await select("https://different.example.com");
    assert.equal((await operator("reject", different.decision)).status, "available");
    assert.equal((await event("events/subscribe", { ...sub, delivery: { ...delivery, url: "https://different.example.com/changed" } })).value.protocol_error.data.reason, "approval_revoked");
    // Revoke between DNS validation and socket creation. The production owner
    // rechecks approval after the asynchronous operation and refuses the socket.
    f.duringDNS(async () => { assert.equal((await operator("revoke", (await select()).decision)).status, "available"); });
    const preRace = f.networkCounts();
    const race = await event("events/subscribe", { ...sub, delivery: { ...delivery, url: delivery.url + "-race" } });
    assert.equal(race.value.protocol_error.data.reason, "approval_revoked");
    assert.equal(f.networkCounts().verifyCalls, preRace.verifyCalls);
    const noNetwork = f.networkCounts();
    const { secret: _secret, ...stopDelivery } = delivery;
    assert.equal((await event("events/unsubscribe", { ...sub, delivery: stopDelivery })).status, 200);
    assert.deepEqual(f.networkCounts(), noNetwork, "revoked unsubscribe neither resolves nor challenges");
    await approve();
    assert.equal((await event("events/subscribe")).status, 200);
    const material = (await f.raw({ action: "inspect", connection_ref: c.id })).value;
    f.duringDNS(async () => { assert.equal((await operator("revoke", (await select()).decision)).status, "available"); });
    const beforeDelivery = f.networkCounts();
    const interrupted = await f.raw({ action: "request", connection_ref: c.id, expected_material_ref: material.material_ref, question: "Synthetic request: preserve rows after egress revocation?" });
    assert.equal(interrupted.value.status, "saved");
    assert.equal(f.networkCounts().callbacks, beforeDelivery.callbacks, "revocation during delivery DNS fences the application socket");
    assert.equal((f.db.prepare("SELECT response_ref FROM vnext_review_requests WHERE request_ref=?").get(interrupted.value.request_ref) as any).response_ref, null);
    await approve();
    f.duringHTTPS(async () => { assert.equal((await operator("revoke", (await select()).decision)).status, "available"); });
    const verifiedButRevoked = await event("events/subscribe", { ...sub, delivery: { ...delivery, url: delivery.url + "-before-commit" } });
    assert.equal(verifiedButRevoked.value.protocol_error.data.reason, "approval_revoked", "approval is rechecked after challenge before persistence");
    await approve();
    // The network security owner remains mandatory after informed local approval.
    for (const addresses of [[{ address: "8.8.8.8", family: 4 }, { address: "127.0.0.1", family: 4 }], [{ address: "169.254.169.254", family: 4 }], [{ address: "2001:db8::1", family: 6 }]]) {
        f.addresses(addresses);
        const result = await event("events/subscribe", { ...sub, delivery: { ...delivery, url: delivery.url + "-dns" } });
        assert.equal(result.value.protocol_error.data.stage, "dns_address");
    }
    f.addresses([{ address: "8.8.8.8", family: 4 }]);
    for (const code of ["ERR_TLS_CERT_ALTNAME_INVALID", "DEPTH_ZERO_SELF_SIGNED_CERT"]) {
        try {
            f.socketError(code);
            const result = await event("events/subscribe", { ...sub, delivery: { ...delivery, url: delivery.url + "-tls" } });
            assert.equal(result.value.protocol_error.data.stage, "tls_verification");
            assert(!JSON.stringify(result).includes("protected_fixture"));
        } finally { f.socketError(null); }
    }
    try {
        f.oversizedResponse(true);
        assert.equal((await event("events/subscribe", { ...sub, delivery: { ...delivery, url: delivery.url + "-large" } })).value.protocol_error.data.reason, "response_too_large");
    } finally { f.oversizedResponse(false); }
    const clock = Date.now;
    try {
        f.duringDNS(async () => { Date.now = () => clock() + 10001; });
        const result = await event("events/subscribe", { ...sub, delivery: { ...delivery, url: delivery.url + "-timeout" } });
        assert.equal(result.value.protocol_error.data.reason, "timeout");
    } finally { Date.now = clock; }
    for (const [url, stage] of [["http://receiver.example.com/x", "url_https"], ["https://u:p@receiver.example.com/x", "url_userinfo"], ["https://receiver.example.com/x#fragment", "url_fragment"], ["https://127.0.0.1/x", "url_literal_address"], ["bad", "url_parse"], ["x".repeat(2049), "url_input"]]) {
        const result = await event("events/subscribe", { ...sub, delivery: { ...delivery, url } }); assert.equal(result.value.protocol_error.data.stage, stage);
    }
    // Candidate flood cannot grow state without bound. No origin is implicitly
    // permitted and no untrusted display text becomes a diagnostic/log payload.
    for (let i = 0; i < 4; i++) assert.equal((await event("events/subscribe", { ...sub, delivery: { ...delivery, url: `https://candidate${i}.example.com/x` } })).value.protocol_error.data.reason, "approval_required");
    assert.equal((await inspect()).candidates.length, 8);
    assert.equal((await event("events/subscribe", { ...sub, delivery: { ...delivery, url: "https://overflow.example.com/x" } })).value.protocol_error.data.reason, "approval_candidate_limit");
    const localView = JSON.stringify(await inspect());
    assert(!localView.includes("private-path") && !localView.includes("fresh=callback") && !localView.includes(f.signingSecret));
    const now = Date.now;
    try {
        Date.now = () => now() + 900001;
        assert.equal((await operator("approve", { ...different.decision, expires_at: new Date(Date.now() + 60000).toISOString() })).reason, "callback_candidate_changed");
        const newCandidate = await event("events/subscribe"); assert.equal(newCandidate.value.protocol_error.data.reason, "approval_required");
        const view = await inspect(); assert.equal(view.candidates.length, 2, "expired candidates/approval are pruned; rejected tombstone survives");
        assert.notEqual((await select()).candidate.candidate_ref, first.candidate.candidate_ref);
    } finally { Date.now = now; }
    // Finish with a supported approval/subscription to include in the real
    // backup below. Revocation after the backup must not be undone by restore.
    await approve(); assert.equal((await event("events/subscribe")).status, 200);
    const beforeRestoreDecision = (await select()).decision;
    return {
        async revokeAfterBackup() { assert.equal((await operator("revoke", (await select()).decision)).status, "available"); },
        async assertRestored(db: any) {
            const view = await inspect(); assert.equal(view.stopped, true); assert(view.candidates.every((r: any) => r.state === "revoked"));
            assert.equal((await operator("approve", { ...beforeRestoreDecision, expires_at: new Date(Date.now() + 60000).toISOString() })).reason, "callback_policy_changed");
            const n = f.networkCounts();
            assert.equal((await event("events/subscribe")).value.protocol_error.data.reason, "approval_required");
            assert.deepEqual(f.networkCounts(), n, "restore does not revive a revoked permission");
            assert.equal((await event("events/unsubscribe", { ...sub, delivery: stopDelivery })).status, 200);
            assert.equal(db.prepare("SELECT count(*) n FROM vnext_review_subscriptions WHERE connection_ref=? AND stopped=0").get(c.id).n, 0);
        },
    };
}
