import assert from "node:assert/strict";

// Hold delivery of actual committed responses. The Browser owner must settle
// both the POST and its required history read before its caller can navigate.
export async function checkReportSaveSettlement(lifecycle, report, outcome, observation, receiptId) {
  assert.equal(typeof receiptId, "string");
  const settled = await lifecycle.evaluate(`(async () => {
    const response = await fetch('/api/vnext/operator/run-results?' + new URLSearchParams({ receipt_ref: ${JSON.stringify(receiptId)} }),
      { cache: 'no-store', headers: { 'Augnes-Project-Id': new URL(location.href).searchParams.get('project_id') } });
    const body = await response.json();
    return { status: response.status, proposal: body.result?.proposal };
  })()`);
  assert.equal(settled.status, 200);
  assert(settled.proposal && !(settled.proposal.status === "unavailable" && settled.proposal.reason === "not_created"),
    "The fixture result must have settled its independent proposal polling before the report gate");
  await lifecycle.waitForCondition(`(() => {
    const proposal = document.querySelector('[data-run-result-proposal]');
    return proposal?.getAttribute('data-run-result-proposal') === ${JSON.stringify(settled.proposal.status)} &&
      !proposal.textContent.includes('not created');
  })()`, "rendered proposal settlement before report gates");
  await lifecycle.evaluate(`(() => {
    const original = window.fetch;
    const gates = window.__expectationReportSettlement = { post: {}, history: {} };
    gates.restore = () => { window.fetch = original; };
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method ?? 'GET';
      const target = new URL(url, location.href);
      const gate = method === 'POST' && target.pathname === '/api/vnext/operator/work-expectations' ? gates.post
        : gates.postReleased && method === 'GET' && target.pathname === '/api/vnext/operator/run-results' &&
          target.searchParams.get('receipt_ref') === ${JSON.stringify(receiptId)} ? gates.history : null;
      const response = await original(...args);
      if (!gate || gate.reached || gates.released) return response;
      gate.status = response.status;
      gate.reached = true;
      await new Promise(resolve => { gate.release = resolve; });
      return response;
    };
  })()`);
  let finished = false, failure;
  const pending = report(lifecycle, outcome, observation).then(() => { finished = true; }, error => { failure = error; });
  let postFinished, historyFinished;
  try {
    await lifecycle.waitForCondition("window.__expectationReportSettlement.post.reached === true", "actual report response held");
    assert.equal(await lifecycle.evaluate("window.__expectationReportSettlement.post.status"), 201);
    postFinished = finished;
    await lifecycle.evaluate("window.__expectationReportSettlement.postReleased = true; window.__expectationReportSettlement.post.release()");
    await lifecycle.waitForCondition("window.__expectationReportSettlement.history.reached === true", "actual report history held");
    assert.equal(await lifecycle.evaluate("window.__expectationReportSettlement.history.status"), 200);
    historyFinished = finished;
  } finally {
    await lifecycle.evaluate(`(() => { const gates = window.__expectationReportSettlement;
      gates.released = true; gates.restore(); gates.post.release?.(); gates.history.release?.(); })()`);
    await pending;
  }
  if (failure) throw failure;
  console.log(JSON.stringify({ report_helper_settlement: { post_finished_while_held: postFinished,
    history_finished_while_held: historyFinished, history_gate: "exact receipt after explicit POST release; server and rendered proposal settled",
    responses: "actual browser/API", helper_finished: finished } }));
  assert.equal(postFinished, false, "Report helper must wait for its actual POST response");
  assert.equal(historyFinished, false, "Report helper must wait for refreshed history");
  assert.equal(finished, true);
}
