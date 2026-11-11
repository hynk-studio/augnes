// CDP exception descriptions may contain evaluated code or private values.
// Retain native diagnostics only; never serialize the RemoteObject or expression.
export function browserEvaluationDiagnostic(details) {
  const classes = ["Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError", "EvalError", "URIError"];
  const kind = classes.includes(details?.exception?.className) ? details.exception.className : "Error";
  const first = typeof details?.exception?.description === "string" ? details.exception.description.split("\n", 1)[0] : "";
  const native = /^TypeError: Cannot read properties of (?:null|undefined) \(reading '(?:tagName|value|disabled|readOnly)'\)$/u;
  return {
    class: kind,
    message: native.test(first) ? first.slice("TypeError: ".length) : "[message withheld]",
    stack: (Array.isArray(details?.stackTrace?.callFrames) ? details.stackTrace.callFrames : []).slice(0, 6).map(frame => ({
      function: ["", "eval"].includes(frame?.functionName) ? frame.functionName || "<anonymous>" : "<withheld>",
      line: Number.isSafeInteger(frame?.lineNumber) && frame.lineNumber >= 0 ? frame.lineNumber : null,
      column: Number.isSafeInteger(frame?.columnNumber) && frame.columnNumber >= 0 ? frame.columnNumber : null,
    })),
  };
}
