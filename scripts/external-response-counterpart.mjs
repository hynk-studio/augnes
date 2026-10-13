// Owned deterministic local processor. This is a service, not an independent
// reasoning agent. The caller owns listener settlement and finite lifetime.
import { createServer } from "node:http";
import { timingSafeEqual, randomUUID } from "node:crypto";
import {
  EXTERNAL_VERSION,
  canonical,
  digest,
  hashBytes,
  keys,
  terms,
  bytes,
} from "../lib/vnext/external-response-rules.mjs";
export function createLocalProcessor({
  secret,
  formats = ["json"],
  maxRows = 200,
  accepting = true,
}) {
  // A new receipt owner always has a new incarnation. Restarting this in-memory
  // counterpart cannot truthfully answer absence for the previous incarnation.
  const instance = `local-processor:${randomUUID()}`;
  let conditions = { formats, maxRows, accepting };
  const receipts = new Map();
  let effects = 0;
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
      if (!same(req.headers.authorization, `Bearer ${secret}`)) {
        send(403, { status: "refused" });
        return;
      }
      const url = new URL(req.url, "http://127.0.0.1");
      if (!/^\/requests\/[a-f0-9]{64}$/.test(url.pathname) || url.search) {
        send(404, { status: "unavailable" });
        return;
      }
      const requestRef = `sha256:${url.pathname.split("/").at(-1)}`;
      if (req.method === "GET") {
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
      ]);
      terms(input.terms);
      if (
        input.version !== EXTERNAL_VERSION ||
        input.instance !== instance ||
        input.request_ref !== requestRef
      ) {
        send(409, { status: "binding_mismatch" });
        return;
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
      receipts.set(requestRef, { fingerprint, response: output });
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
    snapshot() {
      return {
        conditions: { ...conditions },
        effects,
        receipts: [...receipts].map(([ref, v]) => ({
          ref,
          fingerprint: v.fingerprint,
          response: v.response,
        })),
      };
    },
  };
}
