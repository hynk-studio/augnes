"""Independent equations/properties for the exposed development consumer."""

import contextlib
import hashlib
import inspect
import io
import json
import unittest
from fractions import Fraction as F

import exact_linear
from exact_linear import SingularSystem, solve_exact
from workflow_cost import NonCompletingWorkflow, compare_workflows, expected_work, main, retry_work


class ExecutableReuseTests(unittest.TestCase):
    def test_source_algorithm_identity(self):
        # Original source segment SHA is independently recorded in #1375 intake.
        source = inspect.getsource(exact_linear._solve_source).replace("def _solve_source(", "def solve(", 1).rstrip("\n")
        self.assertEqual(hashlib.sha256(source.encode()).hexdigest(),
                         "330f62e836bc0af7f9239aaec1c9107e21de3b057599b025d8262d2274994541")

    def test_pivot_exactness_and_input_preservation(self):
        a, b = [[0, 2], [3, 4]], [1, 2]
        self.assertEqual(solve_exact(a, b), (F(0), F(1, 2)))
        self.assertEqual(a, [[0, 2], [3, 4]])
        self.assertEqual(b, [1, 2])
        self.assertEqual(solve_exact([[3]], [1]), (F(1, 3),))

    def test_shape_and_numeric_refusal(self):
        cases = [([], []), ([[1], [99]], [2]), ([[1, 2]], [2]), ([[1]], [1, 2]),
                 ([[1]] * 9, [1] * 9), ([[True]], [1]), ([[1.0]], [1]),
                 ([[1]], [False]), ([[1]], ["1/2"]), ([[1 << 64]], [1]),
                 ([[F(1, 1 << 64)]], [1]), (None, [1]), ([[1]], iter([1]))]
        for a, b in cases:
            with self.subTest(a=a, b=b), self.assertRaises(ValueError):
                solve_exact(a, b)

    def test_singular_is_not_an_answer(self):
        for b in ([0, 0], [1, 2], [1, 3]):
            with self.subTest(b=b), self.assertRaises(SingularSystem):
                solve_exact([[1, 2], [2, 4]], b)

    def test_geometric_reference_for_retry_workflows(self):
        # Expected attempts = 1/p; expected failures = (1-p)/p. This reference
        # uses renewal counting, no matrix construction or solver implementation.
        for p in (F(1, 7), F(1, 2), F(3, 4), F(1)):
            for inspection in (None, F(0), F(2), F(8)):
                with self.subTest(p=p, inspection=inspection):
                    reference = (F(7) + 2 + (inspection or 0)) / p + 3 * (1 - p) / p
                    self.assertEqual(retry_work(7, 2, 3, p, inspection), reference)

    def test_five_state_consumer_and_coordinate_permutation(self):
        # Setup once, then attempt -> verify -> failure repair -> inspect -> retry.
        q = [[0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, F(1, 4), 0],
             [0, 0, 0, 0, 1], [0, 1, 0, 0, 0]]
        c = [4, 7, 2, 3, 2]
        # Renewal formula: attempt value = (9 + (3+2)/4)/(3/4) = 41/3.
        reference = tuple(map(F, [F(53, 3), F(41, 3), F(20, 3), F(56, 3), F(47, 3)]))
        result = expected_work(q, c)
        self.assertEqual(result, reference)
        for i in range(5):
            self.assertEqual(result[i], c[i] + sum(q[i][j] * result[j] for j in range(5)))
        order = [3, 0, 4, 2, 1]
        self.assertEqual(expected_work([[q[i][j] for j in order] for i in order], [c[i] for i in order]),
                         tuple(reference[i] for i in order))
        self.assertEqual(expected_work(q, [3 * x for x in c]), tuple(3 * x for x in reference))

    def test_noncompletion_including_zero_cost_and_disconnected_class(self):
        for q, c in [([[1]], [1]), ([[1]], [0]), ([[0, 1], [1, 0]], [1, 2]),
                     ([[0, 0], [0, 1]], [1, 0]), ([[0, F(1, 2)], [0, 1]], [1, 1])]:
            with self.subTest(q=q, c=c), self.assertRaises(NonCompletingWorkflow):
                expected_work(q, c)
        with self.assertRaises(NonCompletingWorkflow):
            retry_work(7, 2, 3, 0)
        self.assertEqual(expected_work([[0]], [0]), (F(0),))

    def test_invalid_workflow_domain(self):
        for q, c in [([[-1]], [1]), ([[F(3, 2)]], [1]), ([[0]], [-1]),
                     ([[0], [0]], [1]), ([[0]], [float("nan")])]:
            with self.subTest(q=q, c=c), self.assertRaises(ValueError):
                expected_work(q, c)
        for p in (-1, F(3, 2), True, 0.5):
            with self.subTest(p=p), self.assertRaises(ValueError):
                retry_work(7, 2, 3, p)

    def test_comparison_and_nonuse(self):
        low = compare_workflows(7, 2, 3, F(1, 2), 2, F(3, 4))
        self.assertEqual(low["workflows"]["direct"]["expected_work"], "21")
        self.assertEqual(low["workflows"]["inspected"]["expected_work"], "47/3")
        self.assertEqual(low["inspection_minus_direct"], "-16/3")
        self.assertEqual(low["comparison"], "inspection_reduces_work")
        high = compare_workflows(7, 2, 3, F(1, 2), 8, F(3, 5))
        self.assertEqual(high["workflows"]["inspected"]["expected_work"], "91/3")
        self.assertEqual(high["comparison"], "inspection_adds_work")
        self.assertEqual(compare_workflows(7, 2, 3, 1, 0, 1)["comparison"], "equal_work")
        absent = compare_workflows(7, 2, 3, 0, 2, F(3, 4))
        self.assertEqual(absent["workflows"]["direct"], {"status": "non_completing", "expected_work": None})
        self.assertEqual(absent["comparison"], "not_comparable")
        self.assertIsNone(absent["inspection_minus_direct"])

    def test_cli_observable_results_and_invalid_input(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(main([]), 0)
        self.assertEqual(json.loads(output.getvalue())["comparison"], "inspection_reduces_work")
        for args in (["--direct-success", "0/0"], ["--repair", "-1"],
                     ["--inspection", "9" * 49], ["--direct-success", "2"],
                     ["--inspection", "1e999999999"], ["--direct-success", "0.5"]):
            with self.subTest(args=args), contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as caught:
                main(args)
            self.assertEqual(caught.exception.code, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
