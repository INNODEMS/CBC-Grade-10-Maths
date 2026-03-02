"""Utilities for managing lesson‑plan resource boxes in PTX text.

The functions here encapsulate the mutation logic that was previously buried in
`helpers/add_resource_boxes.py`.  They are all pure text transformations and can
be unit‑tested independently.
"""
from __future__ import annotations
from typing import Optional, Tuple

from ..helpers.text import detect_newline


# ------------------------------------------------------------------
# builder
# ------------------------------------------------------------------

def build_axiom(indent: str, lesson_plan: str, step_by_step: Optional[str], newline: str) -> str:
    """Return a new-style axiom block for the given URLs.

    * If *step_by_step* is ``None`` only a single ``Lesson Plan`` link is
      produced.
    * *indent* is the whitespace that should appear at the start of each new
      line (typically taken from the line containing ``</objectives>``).
    """
    inner = indent + "    "
    inner2 = inner + "    "
    inner3 = inner2 + "    "
    inner4 = inner3 + "    "

    if step_by_step is None:
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
    block = block.strip("\n")
    return f"{newline}{block}{newline}{newline}"


# ------------------------------------------------------------------
# insertion / upgrade logic
# ------------------------------------------------------------------

def insert_axiom_if_missing(content: str, lesson_plan: str, step_by_step: Optional[str]) -> Optional[str]:
    """Insert a resource box unless one already exists (checked via blurb URL)."""
    if "../../resources-blurb-lesson.ptx" in content:
        return None

    objectives_index = content.find("</objectives>")
    if objectives_index == -1:
        return None

    newline = detect_newline(content)
    line_start = content.rfind(newline, 0, objectives_index)
    if line_start == -1:
        line_start = 0
    else:
        line_start += len(newline)
    line_end = content.find(newline, objectives_index)
    if line_end == -1:
        line_end = len(content)
    line = content[line_start:line_end]
    indent = line[: len(line) - len(line.lstrip())]

    block = build_axiom(indent, lesson_plan, step_by_step, newline)
    insert_pos = objectives_index + len("</objectives>")
    return content[:insert_pos] + block + content[insert_pos:]


def remove_old_resource_boxes(content: str) -> Tuple[str, int]:
    """Drop any legacy <axiom> blocks that mention "offline lesson plan".

    Returns a tuple of (updated_content, number_removed).
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
        if phrase in block_lower:
            removed += 1
            j = end_close
            while j < n and content[j] in " \t\r\n":
                j += 1
            i = j
        else:
            pieces.append(block)
            i = end_close
    return "".join(pieces), removed


def upgrade_lesson_only_resource_boxes(
    content: str, lesson_plan: str, step_by_step: Optional[str]
) -> Tuple[str, int]:
    """If a side-by-side guide now exists, replace old lesson-only boxes.

    Returns (updated_content, number_upgraded).
    """
    if step_by_step is None or "../../resources-blurb-lesson.ptx" not in content:
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
        if (
            "../../resources-blurb-lesson.ptx" in block_lower
            and "lesson plan" in block_lower
            and "step-by-step guide" not in block_lower
        ):
            line_start = content.rfind(newline, 0, start)
            if line_start == -1:
                line_start = 0
            else:
                line_start += len(newline)
            line = content[line_start:start]
            indent = line[: len(line) - len(line.lstrip())]
            new_block = build_axiom(indent, lesson_plan, step_by_step, newline).strip("\r\n")
            pieces.append(new_block)
            upgraded += 1
            i = end_close
        else:
            pieces.append(block)
            i = end_close
    return "".join(pieces), upgraded
