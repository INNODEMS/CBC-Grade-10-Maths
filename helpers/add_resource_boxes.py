#!/usr/bin/env python3
from __future__ import annotations

import csv
from pathlib import Path
from typing import Optional


def is_yes(value: Optional[str]) -> bool:
    if value is None:
        return False
    return str(value).strip().lower() in {"yes", "y", "true", "1"}


def detect_newline(text: str) -> str:
    return "\r\n" if "\r\n" in text else "\n"


def build_axiom(indent: str, lesson_plan: str, step_by_step: str, newline: str) -> str:
    inner = indent + "    "
    inner2 = inner + "    "
    inner3 = inner2 + "    "
    inner4 = inner3 + "    "

    block = f"""
{indent}<axiom component=\"resources\">
{inner}<!-- Link to blurb -->
{inner}<xi:include href=\"../../resources-blurb-lesson.ptx\" />

{inner}<sbsgroup widths=\"45% 45%\" margins=\"2% 2%\">
{inner2}<sidebyside>
{inner3}<p>
{inner4}<dataurl source=\"{lesson_plan}\"> Lesson Plan </dataurl>
{inner3}</p>
{inner3}<p>
{inner4}<dataurl source=\"{step_by_step}\"> Step-by-Step Guide </dataurl>
{inner3}</p>
{inner2}</sidebyside>
{inner}</sbsgroup>
{indent}</axiom>
"""

    # Normalise leading/trailing newlines and adapt to the file's newline style
    block = block.lstrip("\n").rstrip("\n")
    block = block.replace("\n", newline)
    return f"{newline}{block}{newline}{newline}"


def insert_axiom_if_missing(content: str, lesson_plan: str, step_by_step: str) -> Optional[str]:
    if "../../resources-blurb-lesson.ptx" in content:
        return None

    title_index = content.find("</title>")
    if title_index == -1:
        return None

    newline = detect_newline(content)
    title_line_start = content.rfind(newline, 0, title_index)
    if title_line_start == -1:
        title_line_start = 0
    else:
        title_line_start += len(newline)

    title_line_end = content.find(newline, title_index)
    if title_line_end == -1:
        title_line_end = len(content)

    title_line = content[title_line_start:title_line_end]
    indent = title_line[: len(title_line) - len(title_line.lstrip())]

    axiom_block = build_axiom(indent, lesson_plan, step_by_step, newline)
    insert_pos = title_index + len("</title>")
    return content[:insert_pos] + axiom_block + content[insert_pos:]


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    csv_path = repo_root / "helpers" / "File Matching Validated.csv"
    source_root = repo_root / "source"

    added_count = 0
    processed = 0

    with csv_path.open(newline="", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            if not (
                is_yes(row.get("PTX Exists"))
                and is_yes(row.get("Lesson Plan Exists"))
                and is_yes(row.get("Step By Step Exists"))
            ):
                continue

            ptx_rel = (row.get("PTX Path") or "").strip()
            lesson_plan_rel = (row.get("Lesson Plan Path") or "").strip()
            step_by_step_rel = (row.get("Step By Step Guide Path") or "").strip()

            if not ptx_rel or not lesson_plan_rel or not step_by_step_rel:
                continue

            if "/real-numbers/" not in ptx_rel.replace("\\", "/"):
                continue

            ptx_path = source_root / ptx_rel
            if not ptx_path.exists():
                continue

            lesson_plan = f"lesson_plans/{lesson_plan_rel}"
            step_by_step = f"lesson_plans/{step_by_step_rel}"

            content = ptx_path.read_text(encoding="utf-8")
            updated = insert_axiom_if_missing(content, lesson_plan, step_by_step)
            processed += 1

            if updated is None:
                continue

            ptx_path.write_text(updated, encoding="utf-8")
            added_count += 1

    print(f"Processed real-numbers files: {processed}")
    print(f"Resource boxes added: {added_count}")


if __name__ == "__main__":
    main()
