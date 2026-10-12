"""Undiscounted completion work for small, stipulated retry workflows.

No empirical probabilities, check-skipping authority, model calls or file writes.
"""

import argparse
import json
import re
from fractions import Fraction as F

from exact_linear import exact_system, exact_value, solve_exact


class NonCompletingWorkflow(ValueError):
    """Completion is not almost sure from every supplied state."""


def expected_work(transitions, costs):
    """Q[i][j] is a transient transition; missing row mass completes the work.

Costs are incurred on each visit. Return one value per state. Every supplied
state must have a positive-probability path to completion, even if unreachable
from a caller's preferred start. Completion has zero remaining cost.
"""
    q, c = exact_system(transitions, costs)
    if any(x < 0 for row in q for x in row) or any(sum(row) > 1 for row in q):
        raise ValueError("transition rows must be nonnegative with sum at most one")
    if any(x < 0 for x in c):
        raise ValueError("work costs must be nonnegative")

    # Finite substochastic chains absorb almost surely iff every state can
    # reach an exit. Check this independently of solving (I-Q)v=c, including
    # zero-cost closed loops where a finite algebraic value is misleading.
    exits = {i for i, row in enumerate(q) if sum(row) < 1}
    while True:
        reachable = exits | {i for i, row in enumerate(q)
                             if any(p > 0 and j in exits for j, p in enumerate(row))}
        if reachable == exits:
            break
        exits = reachable
    if len(exits) != len(c):
        raise NonCompletingWorkflow("completion is not almost sure from every supplied state")

    return solve_exact([[F(i == j) - p for j, p in enumerate(row)]
                        for i, row in enumerate(q)], c)


def retry_work(attempt, verification, repair, success, inspection=None):
    """Attempt -> mandatory verification -> success, or repair and retry.

Optional inspection occurs before EVERY attempt, including retries. Its
success probability is stipulated by the caller, never estimated here.
"""
    attempt, verification, repair, success = map(exact_value, (attempt, verification, repair, success))
    if not 0 <= success <= 1:
        raise ValueError("success probability must be between zero and one")
    if inspection is None:
        return expected_work([[0, 1, 0], [0, 0, 1 - success], [1, 0, 0]],
                             [attempt, verification, repair])[0]
    inspection = exact_value(inspection)
    return expected_work([[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1 - success], [1, 0, 0, 0]],
                         [inspection, attempt, verification, repair])[0]


def compare_workflows(attempt, verification, repair, direct_success, inspection, inspected_success):
    values = {}
    for name, p, extra in [("direct", direct_success, None), ("inspected", inspected_success, inspection)]:
        try:
            values[name] = retry_work(attempt, verification, repair, p, extra)
        except NonCompletingWorkflow:
            values[name] = None
    comparable = all(v is not None for v in values.values())
    delta = values["inspected"] - values["direct"] if comparable else None
    return {
        "evidence": "constructed development calculation; probabilities and costs are stipulated",
        "workflows": {name: {"status": "finite" if value is not None else "non_completing",
                              "expected_work": str(value) if value is not None else None}
                      for name, value in values.items()},
        "inspection_minus_direct": str(delta) if delta is not None else None,
        "comparison": ("not_comparable" if delta is None else
                       "inspection_reduces_work" if delta < 0 else
                       "inspection_adds_work" if delta > 0 else "equal_work"),
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    defaults = {"attempt": "7", "verification": "2", "repair": "3",
                "direct_success": "1/2", "inspection": "2", "inspected_success": "3/4"}

    def rational(text):
        if not re.fullmatch(r"[+-]?[0-9]{1,20}(?:/[0-9]{1,20})?", text):
            raise argparse.ArgumentTypeError("use a bounded integer or rational fraction")
        try:
            return exact_value(F(text))
        except (ValueError, ZeroDivisionError):
            raise argparse.ArgumentTypeError("use a rational with at most 64-bit numerator/denominator") from None

    for name, default in defaults.items():
        parser.add_argument("--" + name.replace("_", "-"), type=rational, default=default)
    args = vars(parser.parse_args(argv))
    try:
        result = compare_workflows(**args)
    except ValueError as error:
        parser.error(str(error))
    print(json.dumps({"inputs": {k: str(v) for k, v in args.items()}, **result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
