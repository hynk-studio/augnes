"""Qualified exact solver derived from #1366; see README.md for provenance.

Only solve_exact is the supported entry point. The source algorithm below is
unchanged except for its private function name; qualification is newly authored.
"""

from fractions import Fraction

MAX_STATES = 8
MAX_INPUT_BITS = 64


class SingularSystem(ValueError):
    """The equations have no unique solution; no value was returned."""


def exact_value(value):
    if type(value) not in (int, Fraction):
        raise ValueError("use integers or Fraction values, not floats or booleans")
    value = Fraction(value)
    if max(value.numerator.bit_length(), value.denominator.bit_length()) > MAX_INPUT_BITS:
        raise ValueError("input numerator and denominator must fit in 64 bits")
    return value


def exact_system(a, b):
    """Copy a bounded square system without silently dropping rows or columns."""
    if not isinstance(b, (list, tuple)) or not 1 <= len(b) <= MAX_STATES:
        raise ValueError("expected 1 to 8 equations")
    n = len(b)
    if (not isinstance(a, (list, tuple)) or len(a) != n or
            any(not isinstance(row, (list, tuple)) or len(row) != n for row in a)):
        raise ValueError("matrix must be square and match the right-hand side")
    return tuple(tuple(exact_value(x) for x in row) for row in a), tuple(map(exact_value, b))


def solve_exact(a, b):
    """Return exact rational values, or reject invalid/non-unique equations."""
    a, b = exact_system(a, b)
    try:
        return _solve_source(a, b)
    except StopIteration:
        raise SingularSystem("singular system: no unique solution") from None


def _solve_source(a, b):
    """Small exact Gauss-Jordan solve, independent of the trajectory check."""
    n = len(b)
    rows = [list(a[i]) + [b[i]] for i in range(n)]
    for col in range(n):
        pivot = next(i for i in range(col, n) if rows[i][col])
        rows[col], rows[pivot] = rows[pivot], rows[col]
        scale = rows[col][col]
        rows[col] = [x / scale for x in rows[col]]
        for i in range(n):
            if i != col:
                scale = rows[i][col]
                rows[i] = [x - scale * y for x, y in zip(rows[i], rows[col])]
    return tuple(row[-1] for row in rows)
