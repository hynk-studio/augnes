// Owned deterministic local processor. This is a service, not an independent
// reasoning agent. The caller owns listener settlement and finite lifetime.
import { createServer } from "node:http";
import { timingSafeEqual, randomUUID, randomBytes } from "node:crypto";
import { lstatSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  EXTERNAL_VERSION,
  canonical,
  digest,
  hashBytes,
  keys,
  terms,
  bytes,
  receiptIdentity,
  time,
  integer,
} from "../lib/vnext/external-response-rules.mjs";
/** @param {{ secret: string, formats?: string[], maxRows?: number, accepting?: boolean, receiptDirectory?: string }} options */
export function createLocalProcessor({
  secret,
  formats = ["json"],
  maxRows = 200,
  accepting = true,
  receiptDirectory = undefined,
}) {
  // A new receipt owner always has a new incarnation. Restarting this in-memory
  // counterpart cannot truthfully answer absence for the previous incarnation.
  const instance = `local-processor:${randomUUID()}`;
  if (receiptDirectory !== undefined &&
      (!path.isAbsolute(receiptDirectory) || !lstatSync(receiptDirectory).isDirectory()))
    throw new Error("invalid_owned_receipt_directory");
  let conditions = { formats, maxRows, accepting };
  const receipts = new Map();
  const receiptCredentials = new Map();
  let effects = 0, posts = 0, queries = 0;
  const same = (a, b) =>
    typeof a === "string" &&
    Buffer.byteLength(a) === Buffer.byteLength(b) &&
    timingSafeEqual(Buffer.from(a), Buffer.from(b));
  const server = createServer(async (req, res) => {
    const send = (code, v) => {
      res.writeHead(code, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(v));
    };
    try {
      const executionCredential = same(req.headers.authorization, `Bearer ${secret}`);
      const credential = receiptCredentials.get(digest(req.headers.authorization ?? ""));
      if ((!executionCredential && !credential) || (executionCredential && req.headers["x-receipt-only"] === "1")) {
        send(403, { status: "refused" });
        return;
      }
      const url = new URL(req.url, "http://127.0.0.1");
      if (!/^\/requests\/[a-f0-9]{64}$/.test(url.pathname) || url.search) {
        send(404, { status: "unavailable" });
        return;
      }
      const requestRef = `sha256:${url.pathname.split("/").at(-1)}`;
      if (!executionCredential) {
        const bound = credential.receipt;
        if (req.method !== "GET" || requestRef !== bound.attempt_ref ||
            req.headers["x-input-ref"] !== bound.input_ref ||
            req.headers["x-terms-ref"] !== bound.terms_ref ||
            req.headers["x-counterpart-instance"] !== instance ||
            req.headers["x-receipt-identity"] !== digest(bound) ||
            Date.now() >= Date.parse(credential.expires_at) || credential.consumed >= credential.max_queries) {
          send(403, { status: "refused" });
          return;
        }
        credential.consumed++;
      }
      if (req.method === "GET") {
        if (req.headers["x-counterpart-instance"] && req.headers["x-counterpart-instance"] !== instance) {
          send(409, { status: "binding_mismatch" });
          return;
        }
        queries++;
        const previous = receipts.get(requestRef);
        send(
          200,
          previous?.response ?? {
            version: EXTERNAL_VERSION,
            instance,
            request_ref: requestRef,
            input_ref: req.headers["x-input-ref"],
            terms_ref: req.headers["x-terms-ref"],
            status: "absent",
          },
        );
        return;
      }
      if (req.method !== "POST") {
        send(405, { status: "refused" });
        return;
      }
      posts++;
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 100000) {
          send(413, { status: "refused" });
          return;
        }
        chunks.push(chunk);
      }
      const input = JSON.parse(Buffer.concat(chunks).toString());
      keys(input, [
        "version",
        "instance",
        "request_ref",
        "input_ref",
        "terms",
        "material",
      ], ["receipt_identity"]);
      terms(input.terms);
      if (
        input.version !== EXTERNAL_VERSION ||
        input.instance !== instance ||
        input.request_ref !== requestRef
      ) {
        send(409, { status: "binding_mismatch" });
        return;
      }
      if (input.receipt_identity !== undefined) {
        const r = receiptIdentity(input.receipt_identity);
        if (r.instance !== instance || r.endpoint !== `http://127.0.0.1:${server.address().port}` ||
            r.attempt_ref !== requestRef || r.input_ref !== input.input_ref || r.terms_ref !== digest(input.terms)) {
          send(409, { status: "binding_mismatch" });
          return;
        }
      }
      const fingerprint = digest(input),
        old = receipts.get(requestRef);
      if (old) {
        send(
          old.fingerprint === fingerprint ? 200 : 409,
          old.fingerprint === fingerprint
            ? old.response
            : { status: "conflicting_replay" },
        );
        return;
      }
      if (receipts.size >= 64) {
        send(429, { status: "capacity_exhausted" });
        return;
      }
      const basis = {
        version: EXTERNAL_VERSION,
        instance,
        request_ref: requestRef,
        input_ref: input.input_ref,
        terms_ref: digest(input.terms),
      };
      let output;
      if (!conditions.accepting)
        output = {
          ...basis,
          status: "refused",
          limitations: "The controlled processor is not accepting work.",
        };
      else if (Date.parse(input.terms.deadline) <= Date.now())
        output = {
          ...basis,
          status: "refused",
          limitations: "The requested deadline elapsed.",
        };
      else if (!conditions.formats.includes(input.terms.format))
        output = {
          ...basis,
          status: "proposed",
          proposal: {
            formats: [...conditions.formats],
            reason:
              "Current processor input support differs from the requested format.",
          },
        };
      else {
        const body = bytes(input.material.base64);
        if (
          body.length !== input.material.metadata.size ||
          hashBytes(body) !== input.material.metadata.sha256
        )
          throw new Error();
        const data =
          input.terms.format === "json"
            ? JSON.parse(body.toString())
            : {
                schema_version: "build-events.v1",
                events: body
                  .toString()
                  .trim()
                  .split("\n")
                  .map((s) => JSON.parse(s)),
              };
        keys(data, ["schema_version", "events"]);
        if (
          data.schema_version !== "build-events.v1" ||
          !Array.isArray(data.events)
        )
          throw new Error();
        if (
          data.events.length >
          Math.min(conditions.maxRows, input.terms.max_rows)
        )
          output = {
            ...basis,
            status: "partial",
            accepted_terms: basis.terms_ref,
            limitations:
              "Population exceeds the current complete-processing bound; no complete material is declared.",
          };
        else {
          const rows = new Map();
          for (const row of data.events) {
            keys(row, [
              "event_id",
              "job_id",
              "attempt",
              "status",
              "duration_s",
            ]);
            if (
              typeof row.event_id !== "string" ||
              !row.event_id.length ||
              typeof row.job_id !== "string" ||
              !row.job_id.length ||
              !Number.isSafeInteger(row.attempt) ||
              row.attempt < 1 ||
              !["ok", "failed"].includes(row.status) ||
              typeof row.duration_s !== "string" ||
              !/^\d{1,9}(\.\d{1,3})?$/.test(row.duration_s)
            )
              throw new Error();
            if (
              rows.has(row.event_id) &&
              canonical(rows.get(row.event_id)) !== canonical(row)
            )
              throw new Error();
            rows.set(row.event_id, row);
          }
          const chosen = [...rows.values()].filter(
            (r) => input.terms.population === "all" || r.status === "ok",
          );
          const total = chosen.reduce(
              (n, r) => n + Math.round(Number(r.duration_s) * 1000),
              0,
            ),
            failed = chosen
              .filter((r) => r.status === "failed")
              .reduce((n, r) => n + Math.round(Number(r.duration_s) * 1000), 0);
          const result = {
            version: "build-cost-result.v1",
            input_ref: input.input_ref,
            population: input.terms.population,
            input_rows: data.events.length,
            unique_attempts: rows.size,
            selected_attempts: chosen.length,
            total_ms: total,
            failed_ms: failed,
          };
          const resultBytes = Buffer.from(canonical(result));
          output = {
            ...basis,
            status: "returned",
            accepted_terms: basis.terms_ref,
            limitations:
              "Integer worker time only; not elapsed makespan or economic benefit.",
            material: {
              metadata: {
                name: "processed-cost.json",
                media_type: "application/json",
                version: "build-cost-result.v1",
                source: `request:${requestRef}`,
                applicability: `${input.terms.population} population under the exact request terms`,
                dependencies: [input.input_ref],
                sha256: hashBytes(resultBytes),
                size: resultBytes.length,
              },
              base64: resultBytes.toString("base64"),
            },
          };
          effects++;
        }
      }
      receipts.set(requestRef, { fingerprint, response: output, receipt: input.receipt_identity ?? null });
      // Optional task-owned evidence persists the actual receipt before reply.
      // It does not restore an incarnation or become a replacement receipt owner.
      if (receiptDirectory !== undefined) writeFileSync(
        path.join(receiptDirectory, `${requestRef.slice(7)}.json`),
        canonical({ instance, request_ref: requestRef, fingerprint, response: output }) + "\n",
        { flag: "wx", mode: 0o600, flush: true },
      );
      send(200, output);
    } catch {
      send(422, { status: "invalid_material" });
    }
  });
  return {
    server,
    instance,
    setConditions(next) {
      conditions = { ...conditions, ...next };
    },
    // An explicit operator action at the owned counterpart, after real receipt
    // retention. Generates a distinct narrow credential; never reuses the sender.
    grantReceipt({ request_ref, expires_at, max_queries }) {
      time(expires_at);
      integer(max_queries, 1, 16);
      const receipt = receipts.get(request_ref)?.receipt;
      if (!receipt || Date.parse(expires_at) <= Date.now() || receiptCredentials.size >= 64)
        throw new Error("receipt_permission_unavailable");
      const token = randomBytes(32).toString("base64url");
      receiptCredentials.set(digest(`Bearer ${token}`), { receipt, expires_at, max_queries, consumed: 0 });
      return { receipt: { ...receipt }, expires_at, max_queries, secret: token };
    },
    snapshot() {
      return {
        conditions: { ...conditions },
        effects,
        posts,
        queries,
        receipts: [...receipts].map(([ref, v]) => ({
          ref,
          fingerprint: v.fingerprint,
          response: v.response,
        })),
      };
    },
  };
}
