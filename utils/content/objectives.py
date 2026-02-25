"""Support routines for inserting "objectives" blocks into PTX text.

These functions mirror the behaviour of `helpers/add_objectives.py` but are
written in a pure, testable style.  The module does *not* read or write files.
Higher‑level code can call `insert_objectives` repeatedly over rows from the
links CSV.
"""
from __future__ import annotations
from typing import List, Dict

from ..helpers.text import detect_newline, indent_of_line
import pandas as pd


# -------------------------------------------------------------
# numbering helpers copied from the original helper script
# -------------------------------------------------------------

def build_numbering(df: pd.DataFrame) -> Dict[str, Dict]:
    """Return chapter/section numbering maps from an Automatic Links DataFrame.

    The returned dictionary has two keys, ``chapter_num`` and ``section_num``.
    ``chapter_num`` maps chapter names to strings like ``"1.0"``.
    ``section_num`` maps ``(chapter, section)`` tuples to strings like
    ``"1.2"``.
    """
    chapters = df["Chapter"].dropna().unique().tolist()
    chapter_num: Dict[str, str] = {}
    for i, ch in enumerate(chapters, start=1):
        chapter_num[ch] = f"{i}.0"

    section_num: Dict[tuple[str, str], str] = {}
    for ch in chapters:
        ch_df = df[df["Chapter"] == ch]
        sections = ch_df["Section"].dropna().unique().tolist()
        ch_idx = int(chapter_num[ch].split(".")[0])
        for j, sec in enumerate(sections, start=1):
            section_num[(ch, sec)] = f"{ch_idx}.{j}"

    return {"chapter_num": chapter_num, "section_num": section_num}


# -------------------------------------------------------------
# block creation and insertion functions
# -------------------------------------------------------------

def build_objectives_block(
    indent: str,
    chapter: str,
    section: str,
    chapter_num: str,
    section_num: str,
    learning_outcomes: List[str],
    newline: str,
) -> str:
    """Return an objectives XML fragment indented to match *indent*.

    The caller is responsible for determining *indent* (typically by
    examining the title line) and for writing the returned string back into
    the document.
    """
    inner = indent + "    "
    inner2 = inner + "    "
    inner3 = inner2 + "    "

    # build list items
    lo_items = ""
    for lo in learning_outcomes:
        lo_items += f"{inner2}<li>{lo}</li>{newline}"
    lo_items = lo_items.rstrip(newline)

    block = f"""{indent}<objectives component="outcomes">
{inner}<introduction>
{inner2}<dl>
{inner3}<li>
{inner3}    <title>Strand</title>
{inner3}    <p>
{inner3}        {chapter_num} {chapter}
{inner3}    </p>
{inner3}</li>
{inner3}<li>
{inner3}    <title>Sub-Strand</title>
{inner3}    <p>
{inner3}        {section_num} {section}
{inner3}    </p>
{inner3}</li>
{inner2}</dl>
{inner}</introduction>
{inner}<ul>
{lo_items}
{inner}</ul>
{indent}</objectives>"""
    return block.replace("\n", newline)


def has_objectives(content: str) -> bool:
    """Return True if *content* already contains an objectives block."""
    return '<objectives component="outcomes">' in content


def insert_objectives(
    content: str,
    chapter: str,
    section: str,
    chapter_num: str,
    section_num: str,
    learning_outcomes: List[str],
) -> str | None:
    """Return text with an objectives block inserted, or ``None`` if no
    insertion was needed.

    The rules mirror the original script:

    * do nothing if the file already has an objectives block;
    * find the first ``</title>`` tag and insert immediately after it.
    """
    if has_objectives(content):
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

    block = build_objectives_block(
        indent,
        chapter,
        section,
        chapter_num,
        section_num,
        learning_outcomes,
        newline,
    )

    insert_pos = title_index + len("</title>")
    return content[:insert_pos] + newline + block + content[insert_pos:]
