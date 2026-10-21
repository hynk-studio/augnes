// Fresh process: read saved work through the production ordinary entry. No
// producer artifacts, expected values or in-memory producer state are inputs.
import assert from "node:assert/strict";
import { save, setupServer, finish, choice } from "./execution-choice-transition-harness";
async function consume() {
  const view=await choice("read"), m=view.manual_contribution;
  assert(m.request&&m.original&&m.decision&&m.feedback);
  const card=JSON.parse(m.downstream[0].text), original=JSON.parse(m.original.value.content);
  assert.equal(card.available,original.available); assert.equal(card.top_up,original.top_up);
  const output={text:`Available: ${card.available}\nTop up: ${card.top_up}\nBefore ordering: ${m.decision.value.unfinished}\n`,
    expectation:view.choice.judgment.expectation,question:m.request.value.question,
    manual_request_ref:m.request.ref,manual_return_ref:m.original.ref,decision_ref:m.decision.ref,
    order_authorized:card.order_authorized,next_check:m.feedback.delivery.next_check,
    original_selection:m.original.selection,feedback:m.feedback.delivery};
  save("fresh-card",output);save("fresh-read",view);
}
void setupServer().then(consume).finally(finish);
