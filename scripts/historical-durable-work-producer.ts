// Executed only inside the pinned disposable source fixture. The dynamic
// import below intentionally cannot resolve to today's product owners.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

async function main() {
  const h = await import(pathToFileURL(process.argv[2]!).href);
  const fingerprint = (value: unknown) => createHash("sha256").update(h.canonical(value)).digest("hex");
  const current = (f: any) => {
    const id = h.readProjectWorkInitializationV01(f.db, f.config).current_packet.packet_id;
    return JSON.parse(f.db.prepare("SELECT payload_json FROM vnext_core_records WHERE record_kind='task_context_packet' AND record_id=?").get(id).payload_json);
  };
  const material = { question: "Which connection is visible in this exact excerpt?", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] };
  const definition = { goal: "Continue the bounded saved investigation", success_criteria: ["Preserve attributed uncertainty"], non_goals: ["No execution or semantic acceptance"] };
  const pricing = { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "durable-work-scripted" };
  const fixtures: Record<string, unknown> = {};
  try {
    for (const name of ["terminal", "replacement", "result", "saved", "null"]) {
      const f = await h.fixture(`historical-${name}`);
      assert.equal(current(f).expires_at, null, "Historical initial work already has no expiry");
      let completed: any = null;
      if (name === "replacement") {
        f.controls.lose = true;
        const attempt = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
        const ended = (await f.call({ action: "end_work", binding: attempt.disposition_preparation.binding })).result;
        await f.call({ action: "prepare_linked_work", disposition: { run_id: ended.run.run_id, disposition_fingerprint: ended.run.metadata.stateless_review_disposition.fingerprint }, material });
      } else if (name !== "null") {
        f.controls.transform = (output: any) => { output.recommendations[0].grounded_state_keys = ["wrong-source"]; };
        const attempt = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
        const request = { predecessor: attempt.terminal_preparation.binding, definition, material, notes: [], omitted_sources: [] as any[] };
        request.omitted_sources = (await f.call({ action: "compare_terminal_sources", request })).preparation.comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Keep the evidence in immutable history." }));
        const preview = (await f.call({ action: "preview_terminal_work", request })).preparation;
        await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding });
        assert.ok(current(f).expires_at);
      }
      const inheritedExpiry = current(f).expires_at;
      if (["result", "saved", "null"].includes(name)) {
        f.controls.transform = () => {};
        const grant = (await f.call({ action: "preview", pricing })).authorization;
        completed = (await f.call({ action: "authorize_and_run", authorization: grant })).result;
        assert.equal(completed.run.status, "completed");
        if (name !== "result") {
          const prep = await f.continuity({ action: "read_result_work_preparation", receipt_id: completed.receipt.receipt_id });
          const comparison = (await f.continuity({ action: "compare_result_work_sources", binding: prep.binding, notes: [] })).comparison;
          const preview = await f.continuity({ action: "preview_result_work", binding: prep.binding, definition,
            selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
              omitted_sources: comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Keep the evidence in immutable history." })) } });
          await f.continuity({ action: "prepare_result_work", request: preview.request }, 201);
          const packet = current(f), work = h.readProjectWorkInitializationV01(f.db, f.config);
          await f.continuity({ action: "revise_pre_execution_project_work", ...f.scope, expected_active_project_id: f.scope.project_id,
            expected_active_selection_revision: work.active_selection_revision, expected_current_packet_id: packet.packet_id,
            expected_current_packet_fingerprint: packet.integrity.fingerprint, expected_current_lineage_kind: "authored_successor_task", ...packet.task,
            goal: name === "null" ? "Historical already-durable work" : "Edit the saved investigation before expiry" }, 201);
          assert.equal(current(f).expires_at, inheritedExpiry, "Historical successors and revisions retain their original lifetime");
        }
      }
      if (["result", "saved"].includes(name)) h.controlFor(f, false);
      const selection = f.db.prepare("SELECT * FROM vnext_active_project_selections WHERE workspace_id=?").get(f.scope.workspace_id);
      assert.equal(selection.active_project_selection_version, "active_project_selection.v0.1");
      assert(Number.isSafeInteger(selection.selection_revision));
      const packet = current(f);
      assert.equal(packet.expires_at === null, name === "null");
      assert(!packet.compatibility.source_contracts.includes("augnes.durable-authored-work.v0.1"));
      fixtures[name] = { config: f.config, projectRoot: f.projectRoot, at: f.now(), completed: completed ? { receipt: { receipt_id: completed.receipt.receipt_id } } : null,
        core_fingerprint: fingerprint(f.db.prepare("SELECT * FROM vnext_core_records ORDER BY rowid").all()),
        authority_fingerprint: fingerprint([h.readProjectAutomationControlV01(f.db, f.scope), ...["autonomy_runs", "autonomy_run_steps", "autonomy_run_events"].map(table => f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())]),
        packet_fingerprint: packet.integrity.fingerprint, selection };
    }
    assert.equal(h.zeroNetwork.attempts.length, 0);
    writeFileSync(process.argv[3]!, JSON.stringify(fixtures), { mode: 0o600 });
    console.log(JSON.stringify({ historical_durable_fixtures: Object.keys(fixtures), production_owners: "pinned predecessor tree", selection_contract: "numeric v0.1", network_attempts: 0 }));
  } finally {
    for (const db of h.databases) if (db.open) db.close();
    h.network.unsubscribe(h.onNetwork); h.zeroNetwork.restore();
  }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
