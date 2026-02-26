from typing import List, Tuple, Union, Optional
import os
import re
import argparse

from pypdf import PdfReader, PdfWriter
from pypdf.generic import Destination
from tqdm import tqdm


def collect_leaves(
    outlines: List[Union[Destination, List[Destination]]],
    reader: PdfReader,
    level: int = 0,
) -> List[Tuple[str, Optional[int], int]]:
    """Collect leaf outline items as (title, page_number, level).

    pypdf represents outlines as a nested list where a child list
    immediately following a `Destination` is the parent's children.
    We walk the list and treat a `Destination` as a leaf only if it
    has no immediate child list following it.
    """
    leaves: List[Tuple[str, Optional[int], int]] = []
    i = 0
    while i < len(outlines):
        item = outlines[i]
        if isinstance(item, list):
            # anonymous nested list (should be children of previous item)
            leaves.extend(collect_leaves(item, reader, level + 1))
            i += 1
            continue

        # item is a Destination
        has_children = (i + 1 < len(outlines)) and isinstance(outlines[i + 1], list)

        if has_children:
            # Recurse into children list and skip the child list element
            children = outlines[i + 1]
            leaves.extend(collect_leaves(children, reader, level + 1))
            i += 2
            continue

        # Leaf destination: try to get page number
        try:
            page_num = reader.get_destination_page_number(item)
        except Exception:
            page_num = None

        leaves.append((getattr(item, "title", ""), page_num, level))
        i += 1

    return leaves


def sanitize_filename(s: str, maxlen: int = 80) -> str:
    s = s.strip()
    s = s.replace(" ", "_")
    s = re.sub(r"[^A-Za-z0-9._-]", "", s)
    return s[:maxlen] or "untitled"


def slugify_for_matching(s: str) -> str:
    """Create a slug suitable for matching against CSV lesson-plan filenames.

    Lowercase, replace non-alphanumeric with hyphens, collapse hyphens.
    """
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


def split_pdf_by_leaves(input_pdf: str, out_dir: str, csv_path: Optional[str] = None) -> None:
    reader = PdfReader(input_pdf)
    outlines = reader.outline

    leaves = collect_leaves(outlines, reader)

    # Keep only those with a concrete page number and normalise titles
    leaves = [(title.strip() if title else "", p, lvl) for (title, p, lvl) in leaves if p is not None]
    if not leaves:
        print("No leaf outline destinations with page numbers found.")
        return

    # Sort leaves by page number
    leaves.sort(key=lambda t: t[1])

    total_pages = len(reader.pages)

    os.makedirs(out_dir, exist_ok=True)

    # if a CSV mapping is provided, build slug -> lesson plan relative path map
    mapping = {}
    if csv_path and os.path.exists(csv_path):
        try:
            import csv as _csv
            with open(csv_path, encoding='utf-8-sig') as fh:
                rdr = _csv.DictReader(fh)
                for row in rdr:
                    lp = (row.get('Lesson Plan Path') or '').strip()
                    if not lp:
                        continue
                    base = os.path.splitext(os.path.basename(lp))[0]
                    mapping[slugify_for_matching(base)] = lp
        except Exception:
            mapping = {}

    # Build segments: merge any following 'Exercises' leaves into their parent
    segments = []  # list of (title, start_page, end_page)
    i = 0
    while i < len(leaves):
        title, start_page, _ = leaves[i]
        # Skip standalone Exercises if there's no preceding parent
        if title.lower() == "exercises":
            tqdm.write(f"Ignoring orphan Exercises at page {start_page+1}")
            i += 1
            continue

        # Find next non-Exercises entry to determine end
        j = i + 1
        while j < len(leaves) and leaves[j][0].lower() == "exercises":
            j += 1

        if j < len(leaves):
            end_page = int(leaves[j][1]) - 1
        else:
            end_page = total_pages - 1

        segments.append((title, int(start_page), int(end_page)))
        i = j

    for idx, (title, start, end) in enumerate(tqdm(segments, desc="Sections", unit="section")):
        if start > end or start < 0:
            tqdm.write(f"Skipping invalid range for '{title}': {start}..{end}")
            continue

        writer = PdfWriter()
        for p in range(start, end + 1):
            writer.add_page(reader.pages[p])

        # try to map title to CSV lesson-plan path if available
        slug = slugify_for_matching(title)
        mapped_rel = mapping.get(slug)
        if mapped_rel:
            out_path = os.path.join(out_dir, mapped_rel)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
        else:
            safe = sanitize_filename(f"{idx+1:03d}_{title}")
            out_path = os.path.join(out_dir, f"{safe}.pdf")

        with open(out_path, "wb") as f:
            writer.write(f)

        tqdm.write(f"Wrote {out_path} (pages {start+1}-{end+1})")


def main():
    parser = argparse.ArgumentParser(description="Split a PDF at lowest-level outline items.")
    parser.add_argument("pdf", nargs="?", default="output/plans/main.pdf")
    parser.add_argument("--out", "-o", default="output/plans/splits")
    args = parser.parse_args()

    if not os.path.exists(args.pdf):
        print(f"Input PDF not found: {args.pdf}")
        return
    
    split_pdf_by_leaves(args.pdf, args.out)


if __name__ == "__main__":
    main()