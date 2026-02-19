#!/usr/bin/env python3
"""Add xmlns:xi namespace to subsection/subsubsection elements in .ptx files."""

from __future__ import annotations

import re
from pathlib import Path

NAMESPACE_ATTR = 'xmlns:xi="http://www.w3.org/2001/XInclude"'
TAG_PATTERN = re.compile(r"<(subsection|subsubsection)(\s[^>]*?)?>")


def add_namespace_to_text(text: str) -> tuple[str, int]:
    """Return updated text and count of tags modified."""
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


def process_file(path: Path) -> int:
    original = path.read_text(encoding="utf-8")
    updated, count = add_namespace_to_text(original)
    if count > 0 and updated != original:
        path.write_text(updated, encoding="utf-8")
    return count


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source_dir = root / "source"
    if not source_dir.is_dir():
        raise SystemExit(f"source directory not found at {source_dir}")

    total_files = 0
    total_updates = 0

    for path in source_dir.rglob("*.ptx"):
        total_files += 1
        total_updates += process_file(path)

    print(f"Scanned {total_files} files. Updated {total_updates} subsection/subsubsection tags.")


if __name__ == "__main__":
    main()
