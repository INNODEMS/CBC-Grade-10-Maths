"""Catalogue STACK questions per section from the Automatic Links CSV.

For every row in ``Automatic Links.csv`` this script opens the corresponding
PTX file and collects the ``source`` attributes of every ``<stack …/>`` tag.
The result is written as a new CSV with the same leading columns plus
``Stack Q1``, ``Stack Q2``, … for each question found.

Usage (from the repository root):

    python3 -m utils.audits.audit_stack_by_section
"""

from __future__ import annotations

import re
from pathlib import Path
import csv

from ..helpers.csvtools import read_links_csv, cached_file, PTX_COL
from .audit_questions import get_referenced_sources, PTX_FILES_ROOT

# Build the same regex that get_referenced_sources uses internally,
# so we can apply it to individual files rather than whole directory trees.
_STACK_PATTERN = re.compile(r'<stack\s+[^>]*source="([^"]+)"')

# Columns from Automatic Links that we carry over into the output
CARRY_COLS = [
    "Chapter",
    "Section",
    "Subsection",
    "Subsubsection",
    "In Syllabus",
    PTX_COL,
]


def get_stack_sources_in_file(ptx_path: Path) -> list[str]:
    """Return an ordered list of stack source attributes found in *ptx_path*.

    Uses the same regex pattern as
    :func:`audit_questions.get_referenced_sources` but applied to a single
    file instead of walking a whole directory tree.
    """
    if not ptx_path.is_file():
        return []
    content = ptx_path.read_text(encoding="utf-8", errors="ignore")
    return _STACK_PATTERN.findall(content)


def build_stack_catalogue() -> list[dict[str, str]]:
    """Read Automatic Links and return rows augmented with stack question columns."""
    rows = read_links_csv()
    max_questions = 0
    output_rows: list[dict[str, str]] = []

    for row in rows:
        ptx_rel = row.get(PTX_COL, "").strip()
        ptx_path = PTX_FILES_ROOT / ptx_rel if ptx_rel else None

        sources = get_stack_sources_in_file(ptx_path) if ptx_path else []
        max_questions = max(max_questions, len(sources))

        out = {col: row.get(col, "") for col in CARRY_COLS}
        out["Stack Count"] = str(len(sources))
        for i, src in enumerate(sources, start=1):
            out[f"Stack Q{i}"] = src

        output_rows.append(out)

    # Ensure every row has the same set of Stack Q columns
    for out in output_rows:
        for i in range(1, max_questions + 1):
            out.setdefault(f"Stack Q{i}", "")

    return output_rows


def write_catalogue(output_rows: list[dict[str, str]], dest: Path | None = None) -> Path:
    """Write the catalogue to a CSV file and return the path."""
    if dest is None:
        dest = cached_file("Stack Questions by Section.csv")

    # Build ordered fieldnames
    fieldnames = list(CARRY_COLS) + ["Stack Count"]
    # Determine max question index
    q_cols = sorted(
        (k for k in output_rows[0] if k.startswith("Stack Q")),
        key=lambda k: int(k.removeprefix("Stack Q")),
    )
    fieldnames += q_cols

    with dest.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in output_rows:
            writer.writerow(row)

    return dest


def run() -> None:
    output_rows = build_stack_catalogue()
    dest = write_catalogue(output_rows)
    total = sum(int(r["Stack Count"]) for r in output_rows)
    sections_with = sum(1 for r in output_rows if int(r["Stack Count"]) > 0)
    print(f"Wrote {dest}")
    print(f"  {len(output_rows)} sections, {sections_with} with STACK questions, {total} questions total")


if __name__ == "__main__":
    run()
