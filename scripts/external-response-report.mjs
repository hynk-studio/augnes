// Ordinary scripted consumer, also usable by a fresh executor. Only a registered
// project root and a new writable directory are arguments. No evaluator input.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
const sha = (v) => `sha256:${createHash("sha256").update(v).digest("hex")}`;
export function independentCostOracle(data, population) {
  assert.equal(data.schema_version, "build-events.v1");
  assert(Array.isArray(data.events));
  const unique = [];
  for (const e of data.events) {
    assert(/^[0-9]+(?:\.[0-9]{1,3})?$/.test(e.duration_s));
    assert(["ok", "failed"].includes(e.status));
    const old = unique.find((r) => r.event_id === e.event_id);
    if (old) assert.deepEqual(e, old);
    else unique.push(e);
  }
  let total = 0n,
    failed = 0n,
    n = 0;
  for (const row of unique) {
    if (population === "success" && row.status !== "ok") continue;
    const [whole, fraction = ""] = row.duration_s.split(".");
    const ms = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0"));
    total += ms;
    if (row.status === "failed") failed += ms;
    n++;
  }
  assert(total <= BigInt(Number.MAX_SAFE_INTEGER));
  return {
    input_rows: data.events.length,
    unique_attempts: unique.length,
    selected_attempts: n,
    total_ms: Number(total),
    failed_ms: Number(failed),
  };
}
export async function continueExternalReport(repositoryRoot, directory) {
  let id = 0;
  const actions = [];
  const op = async (action, data, expected_material_ref) => {
    const reply = await handleMessageV01({
      jsonrpc: "2.0",
      id: ++id,
      method: "tools/call",
      params: {
        name: "augnes_external_repository_work",
        arguments: {
          repository_root: repositoryRoot,
          action,
          ...(data ? { data } : {}),
          ...(expected_material_ref ? { expected_material_ref } : {}),
        },
      },
    });
    const r = reply.result?.structuredContent;
    if (!r) throw new Error("ordinary_external_entry_unavailable");
    actions.push({ action, status: r.status });
    return r;
  };
  const ok = (r) => {
    assert(
      ["available", "saved", "exact_replay"].includes(r.status),
      JSON.stringify(r),
    );
    return r;
  };
  const initial = ok(await op("read"));
  const contractSource = initial.sources.find(
    (s) => s.source_locator === "note-ref:external-report-contract",
  );
  assert(contractSource, "A selected ordinary report contract is required.");
  const contract = JSON.parse(contractSource.excerpt_text);
  assert(["all", "success"].includes(contract.population));
  assert(/^[a-z0-9-]+\.json$/.test(contract.output));
  const readBytes = async (ref, experience_ref) => {
    const m = ok(
      await op("material", {
        ref,
        ...(experience_ref ? { experience_ref } : {}),
      }),
    ).material;
    const b = Buffer.from(m.base64, "base64");
    assert.equal(b.length, m.metadata.size);
    assert.equal(sha(b), m.metadata.sha256);
    assert.equal(m.ref, ref);
    return { m, b };
  };
  const decode = (b, format) =>
    format === "json"
      ? JSON.parse(b.toString())
      : {
          schema_version: "build-events.v1",
          events: b
            .toString()
            .trim()
            .split("\n")
            .map((s) => JSON.parse(s)),
        };
  const put = async (
    name,
    b,
    dependencies,
    source,
    media_type = "application/json",
  ) =>
    ok(
      await op(
        "put_material",
        {
          metadata: {
            name,
            media_type,
            version: "1",
            source,
            applicability: initial.definition.goal,
            dependencies,
            sha256: sha(b),
            size: b.length,
          },
          base64: b.toString("base64"),
        },
        initial.material_basis,
      ),
    ).material_ref;
  // A new native basis does not erase an earlier effect. Read the ordinary
  // work entries before selecting or preparing a request, including entries
  // whose purpose changed while their acknowledgement was unavailable.
  const existing = [];
  for (const w of initial.work_refs)
    existing.push(ok(await op("read", { work_ref: w.ref })).work);
  const unresolved = existing.filter((w) => w.state.unresolved);
  const unfinished = unresolved.length
    ? unresolved
    : existing.filter((w) => w.purpose === initial.definition.goal);
  assert(
    unfinished.length <= 1,
    "Ambiguous report work requires an explicit current work choice.",
  );
  let workRef = unfinished[0]?.work_ref;
  if (!workRef) {
    const inputs = initial.materials.filter(
      (m) => m.metadata.name === contract.input_name,
    );
    assert.equal(
      inputs.length,
      1,
      "Choose one exact input version; do not silently substitute another file.",
    );
    const input = inputs[0];
    const found = ok(await op("discover", { query: "build processor" }));
    const observations = [];
    for (const candidate of found.experiences) {
      const e = ok(await op("read_experience", { ref: candidate.ref }));
      let conditions;
      try {
        conditions = JSON.parse(e.experience.payload.conditions);
      } catch {
        continue;
      }
      if (
        conditions.schema !== "build-events.v1" ||
        !Array.isArray(conditions.formats) ||
        !conditions.formats.length ||
        conditions.formats.some((f) => !["json", "jsonl"].includes(f))
      )
        continue;
      for (const m of e.materials) await readBytes(m.ref, e.experience.ref);
      observations.push({
        ref: e.experience.ref,
        instance: e.experience.payload.association.endpoint,
        conditions,
      });
    }
    const permitted = initial.envelopes.filter(
      (e) =>
        !e.usage.suspended &&
        e.usage.configuration_matches &&
        Date.parse(e.expires_at) > Date.now(),
    );
    const observed = observations.find((o) =>
      permitted.some((e) => e.instance === o.instance),
    );
    const envelope = observed
      ? permitted.find((e) => e.instance === observed.instance)
      : permitted[0];
    assert(envelope, "No current permitted local envelope.");
    // The domain policy uses the actually read observation, while account and
    // operator associations remain uncertain and never grant access.
    const format = observed?.conditions.formats[0] ?? "json";
    const experiences = observed ? [observed.ref] : [];
    let inputRef = input.ref;
    if (format === "jsonl") {
      const { b } = await readBytes(input.ref),
        data = JSON.parse(b.toString());
      const converted = Buffer.from(
        data.events.map((e) => JSON.stringify(e)).join("\n") + "\n",
      );
      inputRef = await put(
        "events-observed-format.jsonl",
        converted,
        [input.ref],
        "format selected from scoped observed service conditions",
        "application/x-ndjson",
      );
    }
    workRef = ok(
      await op(
        "prepare",
        {
          key: `report:${initial.packet_ref}`,
          purpose: initial.definition.goal,
          experience_refs: experiences,
          envelope_id: envelope.id,
          input_ref: inputRef,
          terms: {
            operation: "aggregate",
            format,
            population: contract.population,
            deadline: envelope.expires_at,
            max_rows: 200,
          },
          expectation: `${observed ? `Scoped observation ${observed.ref} selected ${format} for its exact observed instance.` : "No applicable prior observation; the permitted service is tried with JSON."} Complete scoped aggregate will be independently checked and used. Direct arithmetic remains a feasible fallback.`,
          reconsider_when:
            "Current format feedback, source correction, deadline, unavailable material or changed work basis.",
          owners: {
            receive: "ordinary report consumer",
            check: "independent integer oracle",
            use: "report calculation",
          },
        },
        initial.material_basis,
      ),
    ).work_ref;
  }
  for (let step = 0; step < 10; step++) {
    const read = ok(await op("read", { work_ref: workRef })),
      view = read.work,
      s = view.state;
    if (s.used && view.ready && !s.unresolved) {
      const { b } = await readBytes(s.used.payload.output_ref);
      writeFileSync(path.join(directory, contract.output), b, { flag: "wx" });
      return {
        status: "completed",
        work_ref: workRef,
        output: contract.output,
        sha256: sha(b),
        actions,
        process: process.pid,
        runtime: process.version,
      };
    }
    if (s.unresolved) {
      const r = await op("act", {
        key: `reconcile:${s.head}`,
        work_ref: workRef,
        expected_head: s.head,
        mode: "reconcile",
      });
      if (r.status === "unavailable")
        return {
          status: "unresolved",
          work_ref: workRef,
          actions,
          process: process.pid,
          runtime: process.version,
        };
      ok(r);
      continue;
    }
    if (!view.ready || s.closed)
      return {
        status: "reconsider_or_stop",
        work_ref: workRef,
        actions,
        process: process.pid,
        runtime: process.version,
      };
    const feedback = s.returned?.payload.response;
    if (!feedback || feedback.status === "absent") {
      const r = await op("act", {
        key: `send:${s.head}`,
        work_ref: workRef,
        expected_head: s.head,
        mode: "send",
      });
      if (r.status === "unavailable")
        return {
          status: "unresolved",
          work_ref: workRef,
          actions,
          process: process.pid,
          runtime: process.version,
        };
      ok(r);
      continue;
    }
    if (feedback.status === "proposed") {
      const next = feedback.proposal.formats.find(
        (f) =>
          ["json", "jsonl"].includes(f) && f !== s.attempt.payload.terms.format,
      );
      if (!next) break;
      const { b } = await readBytes(s.attempt.payload.input_ref),
        data = decode(b, s.attempt.payload.terms.format);
      const amended = Buffer.from(
        next === "json"
          ? JSON.stringify(data)
          : data.events.map((e) => JSON.stringify(e)).join("\n") + "\n",
      );
      const inputRef = await put(
        "events-amended.jsonl",
        amended,
        [s.attempt.payload.input_ref],
        `format conversion for ${s.returned.ref}`,
        next === "jsonl" ? "application/x-ndjson" : "application/json",
      );
      const amendedResult = await op(
        "amend",
        {
          key: `amend:${s.returned.ref}`,
          work_ref: workRef,
          expected_head: s.head,
          proposal_ref: s.returned.ref,
          input_ref: inputRef,
          terms: { ...s.attempt.payload.terms, format: next },
        },
        read.material_basis,
      );
      if (
        amendedResult.status !== "saved" &&
        amendedResult.status !== "exact_replay"
      )
        return {
          status: "stopped",
          reason: amendedResult.reason,
          work_ref: workRef,
          actions,
          process: process.pid,
        };
      continue;
    }
    if (feedback.status === "returned") {
      const resultRef = s.returned.payload.material_ref,
        { b: resultBytes } = await readBytes(resultRef),
        returned = JSON.parse(resultBytes.toString());
      const { b: input } = await readBytes(s.attempt.payload.input_ref),
        expected = independentCostOracle(
          decode(input, s.attempt.payload.terms.format),
          contract.population,
        );
      assert.equal(returned.version, "build-cost-result.v1");
      assert.equal(returned.input_ref, s.attempt.payload.input_ref);
      assert.equal(returned.population, contract.population);
      for (const [k, v] of Object.entries(expected))
        assert.equal(returned[k], v, `independent oracle: ${k}`);
      const checked = ok(
        await op(
          "check",
          {
            key: `check:${s.returned.ref}`,
            work_ref: workRef,
            expected_head: s.head,
            response_ref: s.returned.ref,
            material_ref: resultRef,
            checker: "scripted independent BigInt oracle",
            verdict: "pass",
            checks:
              "Complete bytes, SHA-256, request input identity, exact population, all unique events and independent decimal integer sums.",
            limitations:
              "Constructed local worker-time arithmetic; no model consumption, economic effect or makespan inference.",
          },
          read.material_basis,
        ),
      );
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b)),
        divisor = gcd(returned.failed_ms, returned.total_ms) || 1;
      // The output calculation consumes RETURNED values after the separate check.
      const report = {
        goal: initial.definition.goal,
        population: returned.population,
        total_worker_ms: returned.total_ms,
        failed_worker_ms: returned.failed_ms,
        failed_share: {
          numerator: returned.failed_ms / divisor,
          denominator: returned.total_ms / divisor,
        },
        result_material: resultRef,
        input_material: s.attempt.payload.input_ref,
        check_ref: checked.record.ref,
        limitations: feedback.limitations,
      };
      const output = Buffer.from(JSON.stringify(report, null, 2) + "\n"),
        outputRef = await put(
          contract.output,
          output,
          [resultRef],
          `checked service material ${resultRef}`,
        );
      ok(
        await op(
          "use",
          {
            key: `use:${checked.record.ref}`,
            work_ref: workRef,
            expected_head: checked.record.ref,
            check_ref: checked.record.ref,
            output_ref: outputRef,
            description:
              "Used the independently checked returned totals in the report and reduced failed-worker-time fraction.",
          },
          read.material_basis,
        ),
      );
      continue;
    }
    // Refusal and partial population do not masquerade as verified returned work.
    if (["refused", "partial"].includes(feedback.status)) {
      const { b } = await readBytes(s.attempt.payload.input_ref);
      const direct = independentCostOracle(
        decode(b, s.attempt.payload.terms.format),
        contract.population,
      );
      const fallback = Buffer.from(
        JSON.stringify({
          goal: initial.definition.goal,
          source: "direct_fallback",
          external_material_used: false,
          ...direct,
        }) + "\n",
      );
      await put(
        contract.output,
        fallback,
        [s.attempt.payload.input_ref],
        "direct fallback after explicit counterpart feedback",
      );
      ok(
        await op("close", {
          key: `stop:${s.head}`,
          work_ref: workRef,
          expected_head: s.head,
          reason: `Counterpart ${feedback.status}; direct fallback retained separately. No external cancellation or acceptance inferred.`,
        }),
      );
      writeFileSync(path.join(directory, contract.output), fallback, {
        flag: "wx",
      });
      return {
        status: "direct_fallback",
        work_ref: workRef,
        output: contract.output,
        actions,
        process: process.pid,
        runtime: process.version,
      };
    }
    break;
  }
  return {
    status: "stopped",
    work_ref: workRef,
    actions,
    process: process.pid,
    runtime: process.version,
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  continueExternalReport(process.argv[2], process.cwd())
    .then((r) => console.log(JSON.stringify(r)))
    .catch(() => {
      console.error(
        "external_report_failed_preserve_work_and_read_current_state",
      );
      process.exitCode = 1;
    });
}
