"""Offline developer controls; inert callbacks are not allocation or dispatch."""
import json
from pathlib import Path
import tempfile
import unittest

import request_preflight as preflight


class RequestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="augnes-1526-preflight-")
        self.root = Path(self.temp.name).resolve()
        self.prompt = b"Fixed developer fixture. Read a permitted file.\n"
        self.request = dict(task_name="i1526_a_prospective", message=self.prompt.decode(),
                            fork_turns="none", model="gpt-6.1-sol", reasoning_effort="xhigh")

    def tearDown(self):
        self.temp.cleanup()
        self.assertFalse(self.root.exists())

    def test_complete_request_and_same_payload_handoff(self):
        freeze = preflight.freeze(self.request, self.prompt, self.root / "bundle")
        calls = []
        def reserve(identity):
            calls.append(("inert-reservation", identity))
            return "NOT_A_REAL_ALLOCATION"
        def dispatch(request, reservation):
            self.assertEqual(request, self.request)
            self.assertEqual(preflight.serialize(request), (self.root / "bundle/REQUEST.json").read_bytes())
            calls.append(("inert-sink", reservation))
            return "NO_MODEL_CALLED"
        self.assertEqual(preflight.validated_handoff(self.root / "bundle", freeze, reserve, dispatch), "NO_MODEL_CALLED")
        self.assertEqual([x[0] for x in calls], ["inert-reservation", "inert-sink"])
        with self.assertRaises(FileExistsError):
            preflight.freeze(self.request, self.prompt, self.root / "bundle")

    def test_uppercase_missing_malformed_and_unsupported_fields(self):
        bad = [{**self.request, "task_name": "i1526_A_fresh"},
               {**self.request, "task_name": ""}, {**self.request, "extra": "unsupported"},
               {**self.request, "fork_turns": "all"}, {**self.request, "fork_turns": "invalid"},
               {**self.request, "model": "invented"}, {**self.request, "reasoning_effort": "invented"},
               {**self.request, "model": "gpt-6-luna", "reasoning_effort": "ultra"},
               {**self.request, "message": "changed"}]
        for field in preflight.FIELDS:
            bad.append({k: v for k, v in self.request.items() if k != field})
            for value in [None, True, 7, [], {}]:
                bad.append({**self.request, field: value})
        for index, request in enumerate(bad):
            with self.subTest(index=index), self.assertRaises(ValueError):
                preflight.freeze(request, self.prompt, self.root / ("bad" + str(index)))
            self.assertFalse((self.root / ("bad" + str(index))).exists())
        with self.assertRaisesRegex(ValueError, "duplicate"):
            preflight.parse(b'{"task_name":"one","task_name":"two"}')

    def test_changed_payload_never_reserves_or_dispatches(self):
        changes = [("REQUEST.json", lambda b: b.replace(b"i1526_a_prospective", b"i1526_b_prospective")),
                   ("REQUEST.json", lambda b: b.replace(b"Fixed developer", b"Changed developer")),
                   ("PROMPT.txt", lambda b: b + b"changed"),
                   ("REQUEST-FREEZE.json", lambda b: b + b" ")]
        for index, (name, change) in enumerate(changes):
            bundle = self.root / str(index)
            frozen = preflight.freeze(self.request, self.prompt, bundle)
            (bundle / name).write_bytes(change((bundle / name).read_bytes()))
            calls = []
            with self.assertRaises(ValueError):
                preflight.validated_handoff(bundle, frozen, lambda _: calls.append("reserve"), lambda *_: calls.append("dispatch"))
            self.assertEqual(calls, [])

    def test_change_after_reservation_stops_dispatch_and_keeps_reservation(self):
        bundle = self.root / "bundle"
        frozen = preflight.freeze(self.request, self.prompt, bundle)
        calls = []
        def reserve(_):
            calls.append("inert-reservation-retained")
            (bundle / "REQUEST.json").write_text("{}")
        with self.assertRaises(ValueError):
            preflight.validated_handoff(bundle, frozen, reserve, lambda *_: calls.append("dispatch"))
        self.assertEqual(calls, ["inert-reservation-retained"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
