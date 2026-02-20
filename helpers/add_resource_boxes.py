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

    if step_by_step is None: # Only do lesson plan if step by step guide is missing
        block = f"""
{indent}<axiom component=\"resources\">
{inner}<!-- Link to blurb -->
{inner}<xi:include href=\"../../resources-blurb-lesson.ptx\" />

{inner}<p>
{inner2}<dataurl source=\"{lesson_plan}\"> Lesson Plan </dataurl>
{inner}</p>
{indent}</axiom>
"""
    else:
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

    # Insert after </objectives> instead of </title>
    objectives_index = content.find("</objectives>")
    if objectives_index == -1:
        return None

    newline = detect_newline(content)
    objectives_line_start = content.rfind(newline, 0, objectives_index)
    if objectives_line_start == -1:
        objectives_line_start = 0
    else:
        objectives_line_start += len(newline)

    objectives_line_end = content.find(newline, objectives_index)
    if objectives_line_end == -1:
        objectives_line_end = len(content)

    objectives_line = content[objectives_line_start:objectives_line_end]
    indent = objectives_line[: len(objectives_line) - len(objectives_line.lstrip())]

    axiom_block = build_axiom(indent, lesson_plan, step_by_step, newline)
    insert_pos = objectives_index + len("</objectives>")
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


def upgrade_lesson_only_resource_boxes(
    content: str, lesson_plan: str, step_by_step: str
) -> tuple[str, int]:
    """Upgrade existing resource boxes that only have a Lesson Plan.

    If a Step-by-Step Guide now exists, replace such boxes with the
    newer side-by-side layout containing both Lesson Plan and
    Step-by-Step Guide links.
    """

    if step_by_step is None:
        return content, 0

    phrase_blurb = "../../resources-blurb-lesson.ptx"
    # Quick bail-out if there are no resource blurbs at all.
    if phrase_blurb not in content:
        return content, 0

    newline = detect_newline(content)
    lowered = content.lower()
    upgraded = 0
    pieces: list[str] = []
    i = 0
    n = len(content)

    while True:
        start = content.find("<axiom", i)
        if start == -1:
            pieces.append(content[i:])
            break

        pieces.append(content[i:start])

        end = content.find("</axiom>", start)
        if end == -1:
            pieces.append(content[start:])
            break

        end_close = end + len("</axiom>")
        block = content[start:end_close]
        block_lower = lowered[start:end_close]

        # Identify lesson-only resource boxes that should be upgraded.
        if (
            phrase_blurb.lower() in block_lower
            and "lesson plan" in block_lower
            and "step-by-step guide" not in block_lower
        ):
            # Derive indentation from the line containing the opening tag.
            line_start = content.rfind(newline, 0, start)
            if line_start == -1:
                line_start = 0
            else:
                line_start += len(newline)
            line = content[line_start:start]
            indent = line[: len(line) - len(line.lstrip())]

            # Reuse the standard builder, but strip surrounding newlines
            # so we don't disturb spacing around this block.
            new_block = build_axiom(indent, lesson_plan, step_by_step, newline)
            new_block = new_block.strip("\r\n")

            pieces.append(new_block)
            upgraded += 1
            i = end_close
        else:
            pieces.append(block)
            i = end_close

    return "".join(pieces), upgraded


def main() -> None:
    csv_path = HELPERS_DIR / CSV_FILENAME
    source_root = REPO_ROOT / "source"

    added_count = 0
    only_lesson = 0
    removed_count = 0
    upgraded_count = 0
    processed = 0

    df = pd.read_csv(csv_path, encoding="utf-8")

    for row in df.to_dict(orient="records"):
        ptx_ok = row.get("PTX Exists") == "YES"
        lesson_ok = row.get("Lesson Plan Exists") == "YES"
        step_ok = row.get("Step By Step Guide Exists") == "YES"
        if not ptx_ok or not lesson_ok: # file doesn't exist or lesson plan doesn't exist, skip. Step by step guide is optional, so we can still add the lesson plan if step by step guide is missing.
            continue

        ptx_rel = (row.get("PTX Path") or "").strip()
        lesson_plan_rel = (row.get("Lesson Plan Path") or "").strip()
        lesson_plan = f"lesson_plans/{lesson_plan_rel}"
        
        if step_ok:
            step_by_step_rel = (row.get("Step By Step Guide Path") or "").strip()
            step_by_step = f"lesson_plans/{step_by_step_rel}"
        else:
            step_by_step = None
            
        ptx_path = source_root / ptx_rel
        content = ptx_path.read_text(encoding="utf-8")

        original_content = content

        # First, remove any legacy resource boxes.
        content, removed_here = remove_old_resource_boxes(content)
        removed_count += removed_here

        # Next, if a step-by-step guide now exists, upgrade any
        # existing lesson-only resource boxes to the side-by-side
        # layout with both links.
        if step_ok:
            content, upgraded_here = upgrade_lesson_only_resource_boxes(
                content, lesson_plan, step_by_step
            )
            upgraded_count += upgraded_here

        # Then, insert the new-style resource box if needed.
        updated = insert_axiom_if_missing(content, lesson_plan, step_by_step)
        if updated is not None:
            content = updated
            added_count += 1
            if not step_ok:
                only_lesson += 1

        if content != original_content:
            ptx_path.write_text(content, encoding="utf-8")

        processed += 1

    print(f"Processed files: {processed}")
    print(f"Resource boxes added: {added_count}")
    print(f"Of which, lesson plan only (no step-by-step): {only_lesson}")
    print(f"Old resource boxes removed: {removed_count}")
    print(f"Existing boxes upgraded to include step-by-step: {upgraded_count}")


if __name__ == "__main__":
    main()
