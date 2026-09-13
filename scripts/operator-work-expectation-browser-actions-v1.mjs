import assert from "node:assert/strict";

export async function activateProject(lifecycle) {
  if (
    await lifecycle.evaluateBoolean(
      `Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="false"]')).some((entry) => entry.getBoundingClientRect().width > 0)`,
    )
  ) {
    assert.equal(
      await lifecycle.evaluateBoolean(`(() => {
        const root = Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="false"]')).find((entry) => entry.getBoundingClientRect().width > 0);
        const button = root?.querySelector('button[data-blank-state-primary-action="make_active"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await lifecycle.waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="true"]')).some((entry) => entry.getBoundingClientRect().width > 0)`,
      "active execution project",
    );
  }
}

export async function openProjectOptions(lifecycle) {
  await lifecycle.waitForCondition(
    `(() => {
      const directOptions = Array.from(document.querySelectorAll('[data-blank-state-project-options="true"]')).find((entry) => entry.getBoundingClientRect().width > 0);
      if (directOptions) return true;
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((entry) => entry.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      return details.querySelector('[data-blank-state-project-options="true"]')?.getBoundingClientRect().width > 0;
    })()`,
    "visible native-host project options",
  );
}

export async function clickSelector(lifecycle, selector) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const candidates = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const element = candidates.find((entry) => entry.getBoundingClientRect().width > 0);
      if (!(element instanceof HTMLElement)) return false;
      element.click(); return true;
    })()`),
    true,
  );
}

export async function saveBrowserExpectation(lifecycle, prediction, reason) {
  await lifecycle.waitForCondition(`document.querySelector('[data-work-expectation="preparation"]') !== null`, 'optional expectation preparation');
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-work-expectation="preparation"]').open = true; return true; })()`);
  await lifecycle.waitForCondition(`document.querySelector('#expectation-reason') !== null`, 'authenticated expectation form');
  await lifecycle.setFormControlValue('#expectation-prediction', prediction);
  await lifecycle.setFormControlValue('#expectation-reason', reason);
  await lifecycle.setFormControlValue('#expectation-conditions', 'Only the exact first interactive attempt is observed.');
  await clickSelector(lifecycle, '[data-expectation-action="save"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-history="1"]') !== null`, 'prospective expectation saved');
}
export async function reportBrowserExpectation(lifecycle, outcome, observation) {
  await lifecycle.evaluateBoolean(`(() => { const form = document.querySelector('[data-expectation-action="report"]')?.closest('details'); if (!form) return false; form.open = true; return true; })()`);
  await lifecycle.setFormControlValue('#expectation-outcome', outcome);
  await lifecycle.setFormControlValue('#expectation-observation', observation);
  await lifecycle.evaluateBoolean(`(() => { const box = document.querySelector('#expectation-applicability'); if (!box.checked) box.click(); return true; })()`);
  await clickSelector(lifecycle, '[data-expectation-action="report"]');
}
