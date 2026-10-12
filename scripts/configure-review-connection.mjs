#!/usr/bin/env node
// Explicit local setup only. No runtime, tunnel, account association or
// subscription is activated. Never print credentials, full callback URLs or keys.
// Local inspection displays only the canonical origin needed for a decision.
import { readFileSync, openSync, writeFileSync, closeSync, constants, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { readReviewConnections, REVIEW_MARKER, callReview } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { discoverVerifiedCompanionV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";

async function callbackOperator(args) {
    const [operation, ref, decisionFile, ...extra] = args;
    if (extra.length || !["inspect", "approve", "reject", "revoke", "stop"].includes(operation) ||
        (operation === "inspect" ? decisionFile !== undefined : !decisionFile || !path.isAbsolute(decisionFile))) throw new Error();
    const c = readReviewConnections().find(c => c.id === ref && c.callback_enrollment);
    if (!c) throw new Error();
    const decision = decisionFile ? JSON.parse(readFileSync(decisionFile, "utf8")) : {};
    const expected = operation === "inspect" ? [] : operation === "stop" ? ["expected_policy_generation", "expected_policy_revision"] :
        ["candidate_ref", "expected_policy_generation", "expected_policy_revision", "expected_revision", ...(operation === "approve" ? ["expires_at"] : [])];
    if (!decision || Array.isArray(decision) || Object.keys(decision).sort().join(",") !== expected.sort().join(",")) throw new Error();
    const found = await discoverVerifiedCompanionV01(process.env);
    if (found.status !== "resolved") {
        process.stdout.write(JSON.stringify({ status: "unavailable", observation: "unavailable", reason: "review_runtime_unavailable" }) + "\n");
        process.exitCode = 1;
        return;
    }
    const result = await callReview(found.companion, { action: "callback_operator", operation, connection_ref: c.id,
        connection_binding: c.binding, project_key: c.project_key, ...decision });
    // JSON quotes untrusted text. Never print a configuration or callback URL.
    process.stdout.write(JSON.stringify(result).replace(/[\u2028\u2029\u202a-\u202e\u2066-\u2069]/gu,
        v => `\\u${v.charCodeAt(0).toString(16).padStart(4, "0")}`) + "\n");
    if (result.status !== "available") process.exitCode = 1;
}
let output, created = false;
try {
    if (process.argv.length === 3 && process.argv[2] === "--help") {
        process.stdout.write("Usage: node scripts/configure-review-connection.mjs <absolute-setup-json> <new-absolute-private-config>\n" +
            "       node scripts/configure-review-connection.mjs callbacks inspect <connection-ref>\n" +
            "       node scripts/configure-review-connection.mjs callbacks <approve|reject|revoke|stop> <connection-ref> <absolute-decision-json>\n" +
            "Callbacks commands use AUGNES_REVIEW_CONNECTIONS_FILE and verified local Companion discovery. See apps/augnes_apps/README.md for exact decision fields.\n");
    } else if (process.argv[2] === "callbacks") {
        await callbackOperator(process.argv.slice(3));
    } else {
        const [inputFile, outputFile, ...extra] = process.argv.slice(2);
        if (extra.length || !inputFile || !outputFile || !path.isAbsolute(inputFile) || !path.isAbsolute(outputFile))
            throw new Error();
        const input = JSON.parse(readFileSync(inputFile, "utf8"));
        if (Object.keys(input).filter(k => k !== "callback_enrollment").sort().join(",") !== "callback_origins,destination,expires_at,project_key,repository_root,reviewer_label" ||
            Date.parse(input.expires_at) <= Date.now())
            throw new Error();
        const config = { version: REVIEW_MARKER, connections: [{ ...input, id: `review:${randomBytes(16).toString("hex")}`,
                    secret: randomBytes(32).toString("base64url"), storage_key: randomBytes(32).toString("base64url") }] };
        output = outputFile;
        const fd = openSync(output, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
        created = true;
        try {
            writeFileSync(fd, JSON.stringify(config));
        }
        finally {
            closeSync(fd);
        }
        process.env.AUGNES_REVIEW_CONNECTIONS_FILE = output;
        const [connection] = readReviewConnections();
        process.stdout.write(JSON.stringify({ status: "configured_disabled", connection_ref: connection.id,
            next_action: "Separately authorize runtime configuration and exact destination transport before activation." }) + "\n");
    }
}
catch {
    if (created)
        unlinkSync(output);
    process.stderr.write("review_connection_configuration_refused\n");
    process.exitCode = 1;
}
