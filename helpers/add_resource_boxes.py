""" Adding in links to lesson plans, only where they exist"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd


HELPERS_DIR = Path(__file__).resolve().parent
REPO_ROOT = HELPERS_DIR.parent
CSV_FILENAME = "File Matching Validated.csv"



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


def remove_old_resource_boxes(content: str) -> tuple[str, int]:
    """Remove legacy resource boxes mentioning 'Offline lesson plan'.

    Scans for <axiom> ... </axiom> blocks and drops any block that
    contains the phrase 'Offline lesson plan' (case-insensitive).
    """

    phrase = "offline lesson plan"
    lowered = content.lower()
    removed = 0
    pieces: list[str] = []
    i = 0
    n = len(content)

    while True:
        start = content.find("<axiom", i)
        if start == -1:
            # No more axioms; append the rest and stop.
            pieces.append(content[i:])
            break

        # Append any text before this axiom.
        pieces.append(content[i:start])

        end = content.find("</axiom>", start)
        if end == -1:
            # Malformed; just append the remainder and stop.
            pieces.append(content[start:])
            break

        end_close = end + len("</axiom>")
        block = content[start:end_close]
        block_lower = lowered[start:end_close]

        # Decide whether to keep or drop this block.
        if phrase in block_lower:
            removed += 1

            # Also skip any immediate trailing whitespace/newlines so we
            # don't leave large gaps where the box used to be.
            j = end_close
            while j < n and content[j] in " \t\r\n":
                j += 1
            i = j
        else:
            pieces.append(block)
            i = end_close

    return "".join(pieces), removed


def main() -> None:
    csv_path = HELPERS_DIR / CSV_FILENAME
    source_root = REPO_ROOT / "source"

    added_count = 0
    removed_count = 0
    processed = 0

    df = pd.read_csv(csv_path, encoding="utf-8")

    for row in df.to_dict(orient="records"):
        if row.get("PTX Exists") != "YES" or row.get("Lesson Plan Exists") != "YES" or row.get("Step By Step Exists") != "YES":
            continue

        ptx_rel = (row.get("PTX Path") or "").strip()
        lesson_plan_rel = (row.get("Lesson Plan Path") or "").strip()
        step_by_step_rel = (row.get("Step By Step Guide Path") or "").strip()

        if not ptx_rel or not lesson_plan_rel or not step_by_step_rel:
            continue

        # if "/real-numbers/" not in ptx_rel.replace("\\", "/"):
        #     continue

        ptx_path = source_root / ptx_rel
        if not ptx_path.exists():
            continue

        lesson_plan = f"lesson_plans/{lesson_plan_rel}"
        step_by_step = f"lesson_plans/{step_by_step_rel}"

        content = ptx_path.read_text(encoding="utf-8")

        original_content = content

        # First, remove any legacy resource boxes.
        content, removed_here = remove_old_resource_boxes(content)
        removed_count += removed_here

        # Then, insert the new-style resource box if needed.
        updated = insert_axiom_if_missing(content, lesson_plan, step_by_step)
        if updated is not None:
            content = updated
            added_count += 1

        if content != original_content:
            ptx_path.write_text(content, encoding="utf-8")

        processed += 1

    print(f"Processed real-numbers files: {processed}")
    print(f"Resource boxes added: {added_count}")
    print(f"Old resource boxes removed: {removed_count}")


if __name__ == "__main__":
    main()
