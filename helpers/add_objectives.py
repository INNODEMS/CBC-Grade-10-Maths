"""Adding objectives to PTX files based on the File Matching Validated CSV."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd


HELPERS_DIR = Path(__file__).resolve().parent
REPO_ROOT = HELPERS_DIR.parent
CSV_FILENAME = "File Matching Validated.csv"


def detect_newline(text: str) -> str:
    return "\r\n" if "\r\n" in text else "\n"


def build_numbering(df: pd.DataFrame) -> dict:
    """Build numbering dictionaries for chapters and sections.
    
    Returns a dict with:
    - 'chapter_num': {chapter_name: "X.0", ...}
    - 'section_num': {(chapter_name, section_name): "X.Y", ...}
    """
    # Get unique chapters in order
    chapters = df["Chapter"].dropna().unique().tolist()
    chapter_num = {}
    for i, ch in enumerate(chapters, start=1):
        chapter_num[ch] = f"{i}.0"
    
    # Get unique sections per chapter in order
    section_num = {}
    for ch in chapters:
        ch_df = df[df["Chapter"] == ch]
        sections = ch_df["Section"].dropna().unique().tolist()
        ch_idx = int(chapter_num[ch].split(".")[0])
        for j, sec in enumerate(sections, start=1):
            section_num[(ch, sec)] = f"{ch_idx}.{j}"
    
    return {"chapter_num": chapter_num, "section_num": section_num}


def build_objectives_block(
    indent: str,
    chapter: str,
    section: str,
    chapter_num: str,
    section_num: str,
    learning_outcomes: list[str],
    newline: str,
) -> str:
    """Build the objectives XML block."""
    inner = indent + "    "
    inner2 = inner + "    "
    inner3 = inner2 + "    "

    # Build the learning outcomes list items
    lo_items = ""
    for lo in learning_outcomes:
        lo_items += f"{inner2}<li>{lo}</li>{newline}"
    lo_items = lo_items.rstrip(newline)  # Remove trailing newline

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

    # Adapt to the file's newline style
    block = block.replace("\n", newline)
    return block


def has_objectives(content: str) -> bool:
    """Check if the file already has an objectives block."""
    return '<objectives component="outcomes">' in content


def insert_objectives(
    content: str,
    chapter: str,
    section: str,
    chapter_num: str,
    section_num: str,
    learning_outcomes: list[str],
) -> Optional[str]:
    """Insert objectives block after </title> and before any axiom block."""
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

    objectives_block = build_objectives_block(
        indent,
        chapter,
        section,
        chapter_num,
        section_num,
        learning_outcomes,
        newline,
    )

    insert_pos = title_index + len("</title>")
    return content[:insert_pos] + newline + objectives_block + content[insert_pos:]


def main() -> None:
    csv_path = HELPERS_DIR / CSV_FILENAME
    source_root = REPO_ROOT / "source"

    df = pd.read_csv(csv_path, encoding="utf-8")
    
    # Build numbering
    numbering = build_numbering(df)
    chapter_num_map = numbering["chapter_num"]
    section_num_map = numbering["section_num"]

    added_count = 0
    skipped_exists = 0
    skipped_no_lo = 0
    processed = 0

    for row in df.to_dict(orient="records"):
        ptx_ok = row.get("PTX Exists") == "YES"
        if not ptx_ok:
            continue

        ptx_rel = (row.get("PTX Path") or "").strip()
        if not ptx_rel:
            continue

        chapter = (row.get("Chapter") or "").strip()
        section = (row.get("Section") or "").strip()
        
        if not chapter or not section:
            continue

        # Gather learning outcomes (LO 1 through LO 4)
        learning_outcomes = []
        for i in range(1, 5):
            lo = row.get(f"LO {i}")
            if pd.notna(lo) and str(lo).strip():
                learning_outcomes.append(str(lo).strip())
        
        if not learning_outcomes:
            skipped_no_lo += 1
            continue

        # Get numbering
        ch_num = chapter_num_map.get(chapter, "?.0")
        sec_num = section_num_map.get((chapter, section), "?.?")

        ptx_path = source_root / ptx_rel
        if not ptx_path.exists():
            continue

        content = ptx_path.read_text(encoding="utf-8")

        updated = insert_objectives(
            content,
            chapter,
            section,
            ch_num,
            sec_num,
            learning_outcomes,
        )

        if updated is not None:
            ptx_path.write_text(updated, encoding="utf-8")
            added_count += 1
        else:
            skipped_exists += 1

        processed += 1

    print(f"Processed files: {processed}")
    print(f"Objectives added: {added_count}")
    print(f"Skipped (already has objectives): {skipped_exists}")
    print(f"Skipped (no learning outcomes): {skipped_no_lo}")


if __name__ == "__main__":
    main()
