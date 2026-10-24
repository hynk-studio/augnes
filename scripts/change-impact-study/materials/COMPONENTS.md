# Supplied callables

`components.py` version 1.0 contains three independent public operations and one
inventory helper. This is newly authored ordinary Python source for a bounded
repository-inspection workflow, using Python 3.9+ standard-library `ast`,
`pathlib`, `hashlib` and `stat`. Its exact file bytes travel with this inventory.

| Callable | Input → output | Verified limits |
| --- | --- | --- |
| `changed_files(before, after)` | Two filesystem roots → sorted changed-file rows with old/new SHA256 and added/removed/modified status | Byte changes, additions/removals and unchanged omission; refuses symlinks, hard links and special entries. No symbol or behavior interpretation. |
| `file_inventory(root)` | Root → relative-path/hash mapping | Ordinary finite regular-file trees; does not follow links. |
| `python_facts(text)` | One Python module's text → top-level import spellings and function syntax/call observations with source line numbers | Locations/comments excluded from syntax; aliases retained as written. Syntax errors propagate. It does not resolve imported names, call targets, reachability, or runtime behavior. |
| `markdown_table(headers, rows)` | Nonempty headers and rectangular values → Markdown | Pipes/backslashes/newlines escaped; malformed widths refuse. Does not verify report claims. |

The syntax helper describes all syntactic calls in a function, including nested
bodies. The supplied tasks restrict their source language further. General
Python alias analysis, decorators, classes, mutable global bindings, callbacks,
external packages and filesystem races are not verified capabilities. Source
imports are data; inspecting a module does not run it. These parts were checked
individually on unrelated small examples. No supplied callable produces an
end-to-end impact report or a test-selection plan. You may use, adapt, replace or
decline any part and explain the decision briefly in your public notes.
