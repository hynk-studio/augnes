import assert from "node:assert/strict";
import { createAgentProjectDirectionHandler } from "../app/api/vnext/agent/project-direction/route";
const token = process.env.AUGNES_TEST_DIRECTION_CREDENTIAL!;
const expected = JSON.parse(process.env.AUGNES_TEST_DIRECTION_EXPECTED!);
const handler = createAgentProjectDirectionHandler({ environment: process.env, clock: { now: () => expected.at } });
void handler(new Request("http://127.0.0.1/api/vnext/agent/project-direction", { headers: { host:"127.0.0.1", authorization:`Bearer ${token}` } }))
  .then(async response => {
    assert.equal(response.status,200);
    const value=await response.json();
    assert.equal(value.discovery.complete,true);
    assert.deepEqual(value.discovery.projects.map((p:{project:{project_id:string}})=>p.project.project_id).sort(),expected.ids);
    assert.equal(value.sequence,expected.sequence);
    console.log("fresh-process authenticated discovery preserves exact scope and sequence");
  }).catch(error=>{console.error(error);process.exitCode=1;});
