"""Independent commissioned B1/B2 renewal comparisons; no solver import."""
import json
import sys
from fractions import Fraction as F

case, filename = sys.argv[1:]
assert case in ("B1", "B2")
expected_inputs = {"attempt": "11", "verification": "2", "repair": "6", "direct_success": "3/5",
                   "inspection": "2" if case == "B1" else "9", "inspected_success": "4/5"}
with open(filename, encoding="utf-8") as source:
    observed = json.load(source)
assert observed["inputs"] == expected_inputs
i = {key: F(value) for key, value in expected_inputs.items()}
def renewal(p, inspection):
    return (i["attempt"] + i["verification"] + inspection + (1-p)*i["repair"]) / p
direct = renewal(i["direct_success"], F(0))
inspected = renewal(i["inspected_success"], i["inspection"])
comparison = "inspection_reduces_work" if inspected < direct else "inspection_adds_work" if inspected > direct else "equal_work"
assert observed["workflows"]["direct"] == {"status": "finite", "expected_work": str(direct)}
assert observed["workflows"]["inspected"] == {"status": "finite", "expected_work": str(inspected)}
assert observed["inspection_minus_direct"] == str(inspected-direct)
assert observed["comparison"] == comparison
print(json.dumps({"case": case, "method": "independent Fraction renewal formula; direct inspection zero",
                  "expected_inputs": expected_inputs, "direct": str(direct), "inspected": str(inspected),
                  "inspection_minus_direct": str(inspected-direct), "comparison": comparison,
                  "input_equality": True, "matches": True}, indent=2))
