import assert from "node:assert/strict";
import { browserEvaluationDiagnostic } from "./browser-evaluation-diagnostic.mjs";

const native = browserEvaluationDiagnostic({ exception: { className: "TypeError",
  description: "TypeError: Cannot read properties of null (reading 'tagName')\nsecret evaluated expression" },
  stackTrace: { callFrames: [{ functionName: "eval", lineNumber: 3, columnNumber: 4, url: "secret URL" }] } });
assert.equal(native.class, "TypeError");
assert.equal(native.message, "Cannot read properties of null (reading 'tagName')");
assert.deepEqual(native.stack, [{ function: "eval", line: 3, column: 4 }]);
const privatePayload = browserEvaluationDiagnostic({ exception: { className: "secret class", description: "secret credential", value: "secret object" },
  stackTrace: { callFrames: Array.from({ length: 20 }, () => ({ functionName: "secret function", lineNumber: -1, columnNumber: NaN, url: "secret expression" })) } });
assert.equal(JSON.stringify(privatePayload).includes("secret"), false);
assert.equal(privatePayload.stack.length, 6);
assert.equal(privatePayload.stack[0].line, null);
assert.deepEqual(browserEvaluationDiagnostic(null), { class: "Error", message: "[message withheld]", stack: [] });
console.log("browser_evaluation_diagnostic: native exception retained; private payload withheld; bounds enforced");
