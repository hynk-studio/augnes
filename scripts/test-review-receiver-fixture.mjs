// Test-only external network boundary shared by supervised Next and the review
// integration owner. No production module imports this fixture or has a bypass.
import assert from "node:assert/strict";
import dns from "node:dns";
import https from "node:https";
import { Writable, Readable } from "node:stream";
import { createHmac } from "node:crypto";
import { appendFileSync } from "node:fs";
export const receiverSecret = `whsec_${Buffer.alloc(32, 19).toString("base64")}`;
export function installReviewReceiverFixture(records) {
    const lookup = dns.promises.lookup, request = https.request;
    dns.promises.lookup = async (hostname, options) => {
        assert.equal(hostname, "receiver.example.invalid");
        assert.deepEqual(options, { all: true, verbatim: true });
        appendFileSync(records, JSON.stringify({ stage: "dns" }) + "\n", { mode: 0o600 });
        return [{ address: "8.8.8.8", family: 4 }];
    };
    https.request = (url, options, receive) => {
        assert.equal(url.origin, "https://receiver.example.invalid");
        assert.equal(options.servername, url.hostname);
        assert.equal(options.agent, false);
        assert.equal(options.rejectUnauthorized, undefined, "TLS verification keeps Node's secure default");
        options.lookup(url.hostname, { all: true }, (error, addresses) => {
            assert.equal(error, null); assert.deepEqual(addresses, [{ address: "8.8.8.8", family: 4 }]);
        });
        let body = "";
        const req = new Writable({ write(chunk, _encoding, done) { body += chunk.toString(); done(); } });
        req.once("finish", () => {
            const h = options.headers, payload = JSON.parse(body);
            const signed = `v1,${createHmac("sha256", Buffer.from(receiverSecret.slice(6), "base64"))
                .update(`${h["webhook-id"]}.${h["webhook-timestamp"]}.${body}`).digest("base64")}`;
            assert(h["webhook-signature"].split(" ").includes(signed));
            assert(Math.abs(Number(h["webhook-timestamp"]) - Date.now() / 1000) < 60);
            assert(h["X-MCP-Subscription-Id"].startsWith("sub_"));
            const verification = payload.type === "verification";
            if (!verification) assert.equal(payload.eventId, h["webhook-id"]);
            appendFileSync(records, JSON.stringify({ stage: verification ? "verification" : "event", signed: true,
                ...(!verification ? { request_ref: payload.data.request_ref } : {}) }) + "\n", { mode: 0o600 });
            const response = Readable.from([Buffer.from(verification ? JSON.stringify({ challenge: payload.challenge }) : "{}")]);
            response.statusCode = 200; receive(response);
        });
        return req;
    };
    return () => { dns.promises.lookup = lookup; https.request = request; };
}
