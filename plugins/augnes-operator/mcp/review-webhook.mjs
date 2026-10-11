import https from "node:https";
import dns from "node:dns";
import { BlockList, isIP } from "node:net";
import { createHmac } from "node:crypto";
export class CallbackError extends Error {
    constructor(reason) { super("callback_endpoint_error"); this.reason = reason; }
}
const blocked = new BlockList();
for (const [ip, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
    ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3]])
    blocked.addSubnet(ip, bits, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [ip, bits] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]])
    blocked.addSubnet(ip, bits, "ipv6");
export function publicCallbackAddress(address) {
    const family = isIP(address);
    return family === 4 ? !blocked.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}
export function callbackURL(raw, approvedOrigins) {
    try {
        const u = new URL(raw);
        if (typeof raw !== "string" || raw.length > 2048 || u.protocol !== "https:" || u.username || u.password || u.hash ||
            isIP(u.hostname.replace(/^\[|\]$/g, "")) || !approvedOrigins.includes(u.origin))
            throw new Error();
        return u;
    }
    catch {
        throw new CallbackError("destination_refused");
    }
}
export function signingKey(secret) {
    if (typeof secret !== "string" || !/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret))
        throw new CallbackError("signing_key_invalid");
    const encoded = secret.slice(6), key = Buffer.from(encoded, "base64");
    if (key.length < 24 || key.length > 64 || key.toString("base64").replace(/=+$/, "") !== encoded.replace(/=+$/, ""))
        throw new CallbackError("signing_key_invalid");
    return key;
}
export function signWebhook(secret, id, timestamp, body) {
    return `v1,${createHmac("sha256", signingKey(secret)).update(`${id}.${timestamp}.${body}`).digest("base64")}`;
}
// No redirect, proxy, custom CA, arbitrary fetch or production test bypass.
// A fresh DNS result is validated and pinned at every connection, retaining
// the original hostname for TLS and Host. Only a short bounded body is read.
export async function postReviewWebhook({ url, origins, secret, previousSecret, subscriptionId, eventId, body, beforeSend }) {
    const destination = callbackURL(url, origins);
    if (Buffer.byteLength(body) > 262144)
        throw new CallbackError("payload_too_large");
    signingKey(secret);
    const deadline = Date.now() + 10000;
    let timer;
    try {
        const addresses = await Promise.race([
            dns.promises.lookup(destination.hostname, { all: true, verbatim: true }),
            new Promise((_, reject) => { timer = setTimeout(() => reject(new CallbackError("timeout")), 10000); }),
        ]);
        if (!addresses.length || addresses.some(a => !publicCallbackAddress(a.address)))
            throw new CallbackError("destination_refused");
        if (Date.now() >= deadline)
            throw new CallbackError("timeout");
        await beforeSend();
        if (Date.now() >= deadline)
            throw new CallbackError("timeout");
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = [secret, previousSecret].filter(Boolean).map(s => signWebhook(s, eventId, timestamp, body)).join(" ");
        return await new Promise((resolve, reject) => {
            const pinned = addresses[0];
            const request = https.request(destination, {
                method: "POST", agent: false, servername: destination.hostname,
                lookup(_host, options, callback) { callback(null, options?.all ? [pinned] : pinned.address, pinned.family); },
                headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body), "webhook-id": eventId,
                    "webhook-timestamp": timestamp, "webhook-signature": signature, "X-MCP-Subscription-Id": subscriptionId },
            }, response => {
                let bytes = 0;
                const chunks = [];
                response.on("data", chunk => { bytes += chunk.length; if (bytes > 16384)
                    request.destroy(new CallbackError("response_too_large"));
                else
                    chunks.push(chunk); });
                response.on("error", () => reject(new CallbackError("transport_failed")));
                response.on("end", () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
            });
            const abort = setTimeout(() => request.destroy(new CallbackError("timeout")), Math.max(1, deadline - Date.now()));
            request.on("error", error => reject(error instanceof CallbackError ? error : new CallbackError("transport_failed")));
            request.on("close", () => clearTimeout(abort));
            request.end(body);
        });
    }
    finally {
        clearTimeout(timer);
    }
}
