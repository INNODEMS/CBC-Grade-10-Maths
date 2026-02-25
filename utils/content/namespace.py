"""Namespace‑related transformations for PTX text.

Currently the only operation required is the one performed by the old
`add_xinclude_namespace.py` script: ensure that every `<subsection>` and
`<subsubsection>` tag carries the `xmlns:xi` attribute.  The function here is
pure and can be run over any string.
"""

from __future__ import annotations
import re

NAMESPACE_ATTR = 'xmlns:xi="http://www.w3.org/2001/XInclude"'
TAG_PATTERN = re.compile(r"<(subsection|subsubsection)(\s[^>]*?)?>")


def add_namespace_to_text(text: str) -> tuple[str, int]:
    """Return (updated_text, count) where *count* is the number of tags
    modified.

    Tags that already have an `xmlns:xi` attribute are left alone.
    """
    count = 0

    def replacer(match: re.Match[str]) -> str:
        nonlocal count
        tag = match.group(1)
        attrs = match.group(2) or ""
        if "xmlns:xi=" in attrs:
            return match.group(0)
        count += 1
        return f"<{tag}{attrs} {NAMESPACE_ATTR}>"

    updated = TAG_PATTERN.sub(replacer, text)
    return updated, count


# convenience wrappers for files

def process_file(path: str | Path) -> int:
    """Update *path* if any substitutions were made.  Returns the number of
    tags changed."""
    from pathlib import Path

    p = Path(path)
    orig = p.read_text(encoding="utf-8")
    updated, count = add_namespace_to_text(orig)
    if count > 0 and updated != orig:
        p.write_text(updated, encoding="utf-8")
    return count
