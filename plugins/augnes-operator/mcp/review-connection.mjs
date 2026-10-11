import { createHash, timingSafeEqual } from "node:crypto";
import { constants, openSync, fstatSync, readFileSync, closeSync } from "node:fs";
import path from "node:path";
export const REVIEW_MARKER = "request-bound-review-v0.1";
export const REVIEW_PATH = "/api/augnes/review?scope=repository:local";
export const digest = value => `sha256:${createHash("sha256").update(typeof value === "string" ? value : canonical(value)).digest("hex")}`;
export function canonical(value) {
    if (Array.isArray(value))
        return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object")
        return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
    return JSON.stringify(value);
}
export function sameSecret(a, b) {
    if (typeof a !== "string" || typeof b !== "string")
        return false;
    const x = Buffer.from(a), y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
}
// Explicit machine-local configuration is an adapter capability, not a Core
// grant. Never accept this configuration or a principal from model arguments.
// Reopen at EVERY boundary so removal, expiry and replacement revoke access.
export function readReviewConnections() {
    const file = process.env.AUGNES_REVIEW_CONNECTIONS_FILE;
    if (!file)
        throw new Error("review_not_configured");
    let fd;
    try {
        if (!path.isAbsolute(file))
            throw new Error();
        fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
        const st = fstatSync(fd);
        if (!st.isFile() || st.nlink !== 1 || (st.mode & 0o077) || st.uid !== process.getuid?.() || st.size > 32768)
            throw new Error();
        const value = JSON.parse(readFileSync(fd, "utf8"));
        if (value.version !== REVIEW_MARKER || !Array.isArray(value.connections) || value.connections.length > 8)
            throw new Error();
        const seen = new Set(), principals = new Set();
        return value.connections.map(c => {
            if (Object.keys(c).sort().join(",") !== "callback_origins,destination,expires_at,id,project_key,repository_root,reviewer_label,secret,storage_key" ||
                !/^review:[a-f0-9]{32}$/.test(c.id) || seen.has(c.id) || !path.isAbsolute(c.repository_root) ||
                !/^sha256:[a-f0-9]{64}$/.test(c.project_key) || !/^[A-Za-z0-9_-]{43}$/.test(c.secret) || principals.has(c.secret) ||
                !/^[A-Za-z0-9_-]{43}$/.test(c.storage_key) ||
                ![c.destination, c.reviewer_label].every(v => typeof v === "string" && v.length > 0 && v.length <= 160 && !/[\u0000-\u001f\u007f]/u.test(v)) ||
                !Number.isFinite(Date.parse(c.expires_at)) || !Array.isArray(c.callback_origins) || c.callback_origins.length > 8 ||
                c.callback_origins.some(v => { const u = new URL(v); return u.protocol !== "https:" || u.origin !== v || u.username || u.password; }))
                throw new Error();
            seen.add(c.id);
            principals.add(c.secret);
            return { ...c, binding: digest(c), principal: `review-connection:${digest(c.secret).slice(7)}` };
        });
    }
    catch {
        throw new Error("review_configuration_unavailable");
    }
    finally {
        if (fd !== undefined)
            closeSync(fd);
    }
}
export function currentReviewConnection(id, binding) {
    const c = readReviewConnections().find(c => c.id === id && (!binding || c.binding === binding));
    if (!c || Date.parse(c.expires_at) <= Date.now())
        throw new Error("review_access_refused");
    return c;
}
// Fixed private route only. Credentials, callback addresses and local paths
// never appear in returned errors or model-visible reviewer tool arguments.
export async function callReview(companion, input, secret) {
    try {
        const response = await fetch(new URL(REVIEW_PATH, companion.ui_url), {
            method: "POST", redirect: "error", signal: AbortSignal.timeout(45000),
            headers: { "content-type": "application/json", "x-augnes-review": REVIEW_MARKER,
                "x-augnes-companion-proxy": companion.proxy_token,
                "x-augnes-runtime-instance": companion.instance_id, "x-augnes-runtime-generation": companion.generation_id,
                "x-augnes-runtime-repository": companion.repository_fingerprint,
                ...(secret ? { "x-augnes-review-credential": secret } : {}) },
            body: JSON.stringify(input),
        });
        if (response.headers.get("x-augnes-review") !== REVIEW_MARKER ||
            response.headers.get("x-augnes-runtime-instance") !== companion.instance_id ||
            response.headers.get("x-augnes-runtime-generation") !== companion.generation_id ||
            response.headers.get("x-augnes-runtime-repository") !== companion.repository_fingerprint)
            throw new Error();
        const text = await response.text();
        if (Buffer.byteLength(text) > 128000)
            throw new Error();
        const result = JSON.parse(text);
        if (result.projection_version !== REVIEW_MARKER || !["available", "saved", "exact_replay", "changed", "unavailable", "refused"].includes(result.status))
            throw new Error();
        return result;
    }
    catch {
        return { projection_version: REVIEW_MARKER, status: "unavailable", reason: "review_transport_unavailable", persistence: "unknown_read_back_before_retry" };
    }
}
