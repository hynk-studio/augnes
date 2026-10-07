"""Independent exact renewal oracle; never imports the retained solver."""
import json
import sys
from fractions import Fraction as F

with open(sys.argv[1], encoding="utf-8") as source:
    observed = json.load(source)
i = {key: F(value) for key, value in observed["inputs"].items()}
def renewal(p, inspection):
    assert p > 0
    return (i["attempt"] + i["verification"] + inspection +
            (1 - p) * i["repair"]) / p
direct = renewal(i["direct_success"], F(0))
inspected = renewal(i["inspected_success"], i["inspection"])
assert observed["workflows"]["direct"] == {"status": "finite", "expected_work": str(direct)}
assert observed["workflows"]["inspected"] == {"status": "finite", "expected_work": str(inspected)}
assert observed["inspection_minus_direct"] == str(inspected - direct)
assert observed["comparison"] == ("inspection_reduces_work" if inspected < direct else
                                  "inspection_adds_work" if inspected > direct else "equal_work")
print(json.dumps({"method": "independent renewal formula; Python fractions only",
                  "direct": str(direct), "inspected": str(inspected),
                  "inspection_minus_direct": str(inspected-direct), "matches": True}, indent=2))
