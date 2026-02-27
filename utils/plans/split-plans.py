from typing import List, Tuple, Union, Optional
import os
import re
import argparse

from pypdf import PdfReader, PdfWriter
from pypdf.generic import Destination
from tqdm import tqdm
import pandas as pd
from typing import List, Union, Any

def get_outline(
    outlines: List[Union[Destination, List[Destination]]],
    reader: PdfReader,
    level: int = 0,
) -> List[Tuple[str, Optional[int]]]:
    """Recursively collect all outline items as (title, page_index).

    Returns a flat list of tuples. Page index may be None if it can't be resolved.
    """
    full_outline: List[Tuple[str, Optional[int]]] = []
    for item in outlines:
        if isinstance(item, list):
            full_outline.extend(get_outline(item, reader, level + 1))
        else:
            try:
                page_number = reader.get_destination_page_number(item)
            except Exception:
                page_number = None
            title = getattr(item, "title", str(item))
            if title != "Exercises":
                full_outline.append((title, page_number))
    return full_outline


def sanitize_filename(name: str) -> str:
    cleaned = name.rstrip().lower()
    cleaned = re.sub(r"[(),';:]", "", cleaned)
    cleaned = re.sub(r"\s+", "-", cleaned)
    return cleaned


def main():
    parser = argparse.ArgumentParser(description="Split a PDF at lowest-level outline items.")
    parser.add_argument("pdf", nargs="?", default="output/plans-print/main.pdf")
    parser.add_argument("--out", "-o", default="generated-assets/plans")
    args = parser.parse_args()
    
    reader = PdfReader(args.pdf)
    # Load CSV of automatic links
    csv_path = os.path.join("utils", "cached-csv", "Automatic Links.csv")
    df = pd.read_csv(csv_path)

    outline = get_outline(reader.outline, reader)

    # Iterate and split according to outline ranges with a progress bar
    for idx, (title, page_idx) in enumerate(tqdm(outline, desc="Splitting outlines", unit="item")):
        if page_idx is None:
            tqdm.write(f"Skipping outline item with no page: {title}")
            continue

        sanitized = sanitize_filename(title)

        matched_row = None
        # Try Subsubsection Filecase
        if "Subsubsection Filecase" in df.columns:
            mask = df["Subsubsection Filecase"].astype(str).str.strip() == sanitized
            if mask.any():
                matched_row = df[mask].iloc[0]

        # Fallback to Subsection Filecase
        if matched_row is None and "Subsection Filecase" in df.columns:
            mask2 = df["Subsection Filecase"].astype(str).str.strip() == sanitized
            if mask2.any():
                matched_row = df[mask2].iloc[0]

        if matched_row is None:
            tqdm.write(f"No CSV match for outline title: {title} (sanitized: {sanitized})")
            continue

        # Determine page range: start = page_idx, end = next_outline_page - 1 (or EOF)
        start = int(page_idx)
        next_page = None
        if idx + 1 < len(outline):
            next_page = outline[idx + 1][1]

        if next_page is None:
            end = len(reader.pages) - 1
        else:
            end = int(next_page) - 1

        if start > end:
            tqdm.write(f"Invalid page range for '{title}': start {start} > end {end}, skipping")
            continue

        lesson_path = matched_row.get("Lesson Plan Path")
        if not lesson_path or pd.isna(lesson_path):
            tqdm.write(f"Matched row for '{title}' has no Lesson Plan Path, skipping")
            continue

        out_file = os.path.join(args.out, str(lesson_path))
        out_dir = os.path.dirname(out_file)
        os.makedirs(out_dir, exist_ok=True)

        writer = PdfWriter()
        for p in range(start, end + 1):
            writer.add_page(reader.pages[p])

        with open(out_file, "wb") as fh:
            writer.write(fh)



if __name__ == "__main__":
    main()