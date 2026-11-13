export const STOCK_VERIFIER_RESULT_PREFIX = "AUGNES_STOCK_VERIFIER_RESULT ";

// An uncaught assertion can terminate Node before an asynchronous pipe write
// drains. Settle the bounded write and its owned error listener first.
export function writeStockVerifierSummary(summary, output = process.stdout) {
  return new Promise((resolve, reject) => {
    const onError = error => { output.off("error", onError); reject(error); };
    output.once("error", onError);
    try {
      output.write(STOCK_VERIFIER_RESULT_PREFIX + JSON.stringify(summary) + "\n", error => {
        // A real Writable reports a failed write through its callback and its
        // error event. Keep the listener for that event after callback refusal.
        if (error) { reject(error); return; }
        output.off("error", onError);
        resolve();
      });
    } catch (error) { output.off("error", onError); reject(error); }
  });
}
