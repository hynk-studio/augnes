"""Independent small source-inspection helpers, version 1.0.

These functions neither resolve names across modules nor select affected targets.
Inputs are trusted, bounded UTF-8 Python source snapshots; no source is executed.
"""
import ast
import hashlib
from pathlib import Path
import stat

VERSION = "1.0"


def file_inventory(root):
    """Return relative path -> SHA256 for regular files, refusing links/specials."""
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("ordinary directory required")
    result = {}
    for path in sorted(root.rglob("*")):
        info = path.lstat()
        if path.is_symlink() or not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
            raise ValueError("links and special files unsupported")
        if path.is_file():
            if info.st_nlink != 1:
                raise ValueError("hard links unsupported")
            result[path.relative_to(root).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def changed_files(before, after):
    """Byte-level file changes; comments/formatting count, equal files are omitted."""
    left, right = file_inventory(before), file_inventory(after)
    return [{"path": name, "before": left.get(name), "after": right.get(name),
             "status": "added" if name not in left else "removed" if name not in right else "modified"}
            for name in sorted(set(left) | set(right)) if left.get(name) != right.get(name)]


def python_facts(text):
    """Inspect one module; return import spellings and top-level function syntax.

    syntax excludes location/comments but includes the complete function AST.
    calls report every syntactic Call inside each top-level function, including
    nested bodies. They are observations, not resolved/runtime dependencies.
    ast.parse SyntaxError propagates. Python 3.9+; classes/assignment/data flow,
    reflection and import execution are outside this helper's interpretation.
    """
    tree = ast.parse(text)
    imports, functions = [], []
    for node in tree.body:
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            imports.append({"kind": "import" if isinstance(node, ast.Import) else "from",
                            "module": getattr(node, "module", None),
                            "level": getattr(node, "level", 0), "line": node.lineno,
                            "names": [{"name": a.name, "asname": a.asname} for a in node.names]})
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append({"name": node.name, "line": node.lineno,
                              "end_line": node.end_lineno,
                              "syntax": ast.dump(node, include_attributes=False),
                              "calls": [{"callee": ast.unparse(call.func), "line": call.lineno,
                                         "expression": ast.unparse(call)}
                                        for call in ast.walk(node) if isinstance(call, ast.Call)]})
    return {"imports": imports, "functions": functions}


def markdown_table(headers, rows):
    """Render rectangular values with escaped pipes/newlines; no truth checking."""
    def cell(value):
        return str(value).replace("\\", "\\\\").replace("|", "\\|").replace("\r", " ").replace("\n", "<br>")
    rows = [list(row) for row in rows]
    if not headers or any(len(row) != len(headers) for row in rows):
        raise ValueError("nonempty rectangular table required")
    return "\n".join("| " + " | ".join(map(cell, row)) + " |"
                     for row in [headers, ["---"] * len(headers)] + rows) + "\n"
