import assert from "node:assert/strict";

// Runs only in the disposable component iframe. Both genuine helpers define an
// inline fetch but await mounting before Open. Replace that unused definition at
// this boundary; the full candidate transport and schedule are common to both.
export function installResultDraftCapture(frame, parent) {
  const w = frame?.contentWindow, s = w?.resultFixture;
  if (!s || s.posts.length || s.owner !== "operator:A" || s.locks !== 0 ||
      s.holdPreview || s.captureScheduler || parent.__resultDraftCapture)
    throw new Error("result_capture_mount_boundary_invalid");
  const originalFetch = w.fetch, originalRemove = frame.remove;
  const descriptor = Object.getOwnPropertyDescriptor(s, "authenticate");
  if (descriptor && (!Object.hasOwn(descriptor, "value") || !descriptor.configurable || !descriptor.writable))
    throw new Error("result_capture_authenticate_descriptor_invalid");
  let authenticate = s.authenticate, armed = false, used = false, preparation, preview, finished = false;
  const counts = { installed_before_open: true, inline_transport_detached: true,
    requests: 0, hold_count: 0, boundary_releases: 0, cleanup_releases: 0, rejected_releases: 0, authenticate_calls: 0 };
  const snapshot = () => ({ ...counts, preparation_pending: !!preparation, preview_pending: !!preview,
    editor_present: !!w.document.querySelector("#new-work-goal"),
    editor_wait_observed: s.editorWaitObserved === true, locks: s.locks });
  const releasePreparation = () => {
    if (!preparation) return;
    if (!s.editorWaitObserved || w.document.querySelector("#new-work-goal"))
      { counts.rejected_releases++; return; }
    counts.boundary_releases++; const release = preparation; preparation = undefined;
    s.preparationReleased = true; release();
  };
  Object.defineProperty(s, "authenticate", { configurable: true, enumerable: descriptor?.enumerable ?? true,
    get() { const callback = authenticate; if (typeof callback !== "function") return callback;
      return function (...args) {
        counts.authenticate_calls++;
        if (!used && args[0] === "operator:A" && s.holdPreview === true && s.locks === 1 &&
            !s.drafts.has("operator:A") && s.posts.filter(p => p.action === "prepare_result_work").length === 2)
          armed = true;
        return Reflect.apply(callback, this, args);
      };
    }, set(value) { authenticate = value; } });
  const session = () => ({ authenticated: true, workspace_id: "workspace:A", project_id: "project:A", operator_id: s.owner });
  const entry = (source, text) => ({ entry_id: source, source_ref: source, why_included: "New candidate", trust_class: "user_declaration", bounded_summary: text, external_ref: { observed_at: null }, compatibility_source_ref: { external_id: source } });
  const previous = entry("prior-source", "Prior selected material");
  const preparationValue = () => ({ ok: true, initialization: { workspace_id: "workspace:A", project_id: "project:A", state: "defined", project_work_binding: "root:" + s.version, current_work: { goal: "Saved task " + s.version, success_criteria: ["Inspect"], non_goals: [] }, current_packet: { packet_id: "packet:A", packet_fingerprint: "packet-fp" }, selected_source_context: [previous] }, binding: { expected_latest_receipt_id: "receipt:A", expected_project_work_binding: "root:" + s.version }, result_source: null });
  w.fetch = async (url, init) => {
    counts.requests++;
    if (new w.Headers(init?.headers).get("Augnes-Project-Id") !== "project:A") throw Error("wrong_project_selector");
    if (url.endsWith("/session")) return w.Response.json(s.authorized ? { status: "authenticated", session: session() } : { error_code: "operator_session_expired" }, { status: s.authorized ? 200 : 401 });
    const body = JSON.parse(init.body); s.posts.push(body);
    if (body.action === "read_result_work_preparation") {
      if (armed && !used && s.owner === "operator:A") {
        used = true; armed = false; counts.hold_count++; s.holdPreparation = false;
        s.preparationHeld = true; s.preparationReleased = false; s.releasePreparation = releasePreparation;
        await new Promise(resolve => { preparation = resolve; });
      }
      return w.Response.json(preparationValue());
    }
    if (body.action === "compare_result_work_sources") return w.Response.json({ status: "selected_source_comparison", comparison: { entries: body.notes.map(n => entry(n.source, n.text)), fingerprint: "comparison:" + s.version, rows: [], unselected_previous: [previous], retained_source_refs: [] } });
    if (body.action === "preview_result_work") {
      if (s.holdPreview) { s.holdPreview = false; s.previewHeld = true;
        await new Promise(resolve => { preview = resolve; s.releasePreview = () => { const release = preview; preview = undefined; release?.(); }; });
        s.previewReturned = true; return w.Response.json({ ok: false, error_code: "operator_session_revoked" }, { status: 403 }); }
      if (s.failPreview) { s.failPreview = false; return w.Response.json({ ok: false, error_code: "successor_task_preparation_changed" }, { status: 409 }); }
      return w.Response.json({ ok: true, before: preparationValue().initialization.current_work, after: body.definition, sources_before: [previous], sources_after: body.selected_sources.selected_source_context, omitted_sources: body.selected_sources.omitted_sources, request: body });
    }
    if (body.action === "prepare_result_work") {
      if (s.failSave) { s.failSave = false; s.authorized = false; return w.Response.json({ ok: false, error_code: "operator_session_revoked" }, { status: 403 }); }
      return w.Response.json({ ok: true, status: "inserted", run_created: false, execution_started: false });
    }
    throw Error("unexpected_fixture_action");
  };
  const cleanup = () => {
    if (finished) return;
    const before = snapshot(); finished = true;
    if (preparation) { counts.cleanup_releases++; const release = preparation; preparation = undefined; release(); }
    if (preview) { const release = preview; preview = undefined; release(); }
    parent.__resultDraftCapture = { before_cleanup: before, after_cleanup: snapshot() };
    w.fetch = originalFetch; frame.remove = originalRemove;
    if (descriptor) Object.defineProperty(s, "authenticate", { ...descriptor, value: authenticate });
    else { delete s.authenticate; s.authenticate = authenticate; }
  };
  s.captureScheduler = { snapshot, cleanup };
  frame.remove = function (...args) { cleanup(); return Reflect.apply(originalRemove, this, args); };
  return snapshot();
}

export async function withResultDraftCapture(tab, check) {
  let installed = false, primary;
  const adapter = { async eval(expression) {
    try {
      const value = await tab.eval(expression);
      if (!installed) {
        await tab.eval(`(${installResultDraftCapture.toString()})((()=>{const frames=document.querySelectorAll('[data-result-draft-fixture]');if(frames.length!==1)throw Error('result_capture_frame_count_invalid');return frames[0]})(),window)`);
        installed = true;
      }
      return value;
    } catch (error) {
      try { const state = await tab.eval(`document.querySelector('[data-result-draft-fixture]')?.contentWindow.resultFixture?.captureScheduler?.snapshot()??null`);
        console.error("result_draft_capture_failure " + JSON.stringify(state)); } catch { /* Preserve the original exception. */ }
      throw error;
    }
  } };
  try {
    const result = await check(adapter);
    const final = await tab.eval("window.__resultDraftCapture");
    assert.equal(final?.before_cleanup.hold_count, 1);
    assert.equal(final.before_cleanup.boundary_releases, 1);
    assert.equal(final.before_cleanup.cleanup_releases, 0);
    assert.equal(final.before_cleanup.rejected_releases, 0);
    assert.equal(final.before_cleanup.preparation_pending, false);
    assert.equal(final.before_cleanup.preview_pending, false);
    return result;
  } catch (error) { primary = error; throw error; }
  finally {
    try {
      const final = await tab.eval(`(()=>{const frame=document.querySelector('[data-result-draft-fixture]');frame?.contentWindow.resultFixture?.captureScheduler?.cleanup();frame?.remove();const record=window.__resultDraftCapture;delete window.__resultDraftCapture;return record??null})()`);
      console.log("result_draft_capture_schedule " + JSON.stringify(final));
    } catch (error) { if (!primary) throw error; console.error("result_draft_capture_cleanup unavailable"); }
  }
}
