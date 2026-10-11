#!/usr/bin/env node
// Explicit local setup only. No runtime, tunnel, account association or
// subscription is activated. Never print capability or callback material.
import { readFileSync, openSync, writeFileSync, closeSync, constants, unlinkSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { readReviewConnections, REVIEW_MARKER } from "../plugins/augnes-operator/mcp/review-connection.mjs";
let output, created = false;
try {
    const [inputFile, outputFile, ...extra] = process.argv.slice(2);
    if (extra.length || !inputFile || !outputFile || !path.isAbsolute(inputFile) || !path.isAbsolute(outputFile))
        throw new Error();
    const input = JSON.parse(readFileSync(inputFile, "utf8"));
    if (Object.keys(input).sort().join(",") !== "callback_origins,destination,expires_at,project_key,repository_root,reviewer_label" ||
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
catch {
    if (created)
        unlinkSync(output);
    process.stderr.write("review_connection_configuration_refused\n");
    process.exitCode = 1;
}
