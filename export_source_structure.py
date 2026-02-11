#!/usr/bin/env python3
"""Print a CSV summary of the PreTeXt source hierarchy to see the structure of the book"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
import sys
from xml.etree import ElementTree as ET

XI_NAMESPACE = "http://www.w3.org/2001/XInclude"
XI_INCLUDE_TAG = f"{{{XI_NAMESPACE}}}include"
XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Expand the PreTeXt source tree and emit a CSV with chapter, section, "
            "subsection, and subsubsection titles."
        )
    )
    parser.add_argument(
        "--source-file",
        default="source/main.ptx",
        help="Path to the top-level PreTeXt file (default: source/main.ptx)",
    )
    parser.add_argument(
        "--output",
        help="Optional path to write the CSV (defaults to stdout)",
    )
    return parser.parse_args()


def resolve_xincludes(element: ET.Element, current_dir: Path, seen: set[Path]) -> None:
    """Inline xi:include directives so traversal can treat the tree as monolithic."""
    i = 0
    while i < len(element):
        child = element[i]
        if child.tag == XI_INCLUDE_TAG:
            href = child.attrib.get("href")
            if not href:
                raise ValueError("Encountered xi:include without an href attribute")
            include_path = (current_dir / href).resolve()
            if include_path in seen:
                raise ValueError(f"Cyclic xi:include detected at {include_path}")
            if not include_path.exists():
                raise FileNotFoundError(f"xi:include target does not exist: {include_path}")
            included_root = ET.parse(include_path).getroot()
            resolve_xincludes(included_root, include_path.parent, seen | {include_path})
            element.remove(child)
            element.insert(i, included_root)
            continue
        resolve_xincludes(child, current_dir, seen)
        i += 1


def extract_title(element: ET.Element) -> str:
    title = element.find("title")
    if title is not None:
        text = "".join(title.itertext()).strip()
        if text:
            return text
    xml_id = element.get(f"{{{XML_NAMESPACE}}}id")
    if xml_id:
        return xml_id
    return element.tag


def collect_rows(book: ET.Element) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for chapter in book.findall("chapter"):
        chapter_title = extract_title(chapter)
        sections = [child for child in chapter if child.tag == "section"]
        if not sections:
            rows.append((chapter_title, "", "", ""))
            continue
        for section in sections:
            section_title = extract_title(section)
            subsections = [child for child in section if child.tag == "subsection"]
            if not subsections:
                rows.append((chapter_title, section_title, "", ""))
                continue
            for subsection in subsections:
                subsection_title = extract_title(subsection)
                subsubs = [child for child in subsection if child.tag == "subsubsection"]
                if not subsubs:
                    rows.append((chapter_title, section_title, subsection_title, ""))
                    continue
                for subsub in subsubs:
                    rows.append(
                        (
                            chapter_title,
                            section_title,
                            subsection_title,
                            extract_title(subsub),
                        )
                    )
    return rows


def write_csv(rows: list[tuple[str, str, str, str]], destination: Path | None) -> None:
    header = ["Chapter", "Section", "Subsection", "Subsubsection"]
    if destination is None:
        writer = csv.writer(sys.stdout)
        writer.writerow(header)
        writer.writerows(rows)
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    source_path = Path(args.source_file).resolve()
    if not source_path.exists():
        print(f"Source file not found: {source_path}", file=sys.stderr)
        return 1
    tree = ET.parse(source_path)
    root = tree.getroot()
    resolve_xincludes(root, source_path.parent, {source_path})
    book = root.find("book")
    if book is None:
        print("No <book> element found in source", file=sys.stderr)
        return 1
    rows = collect_rows(book)
    if not rows:
        print("No chapters/sections/subsections found", file=sys.stderr)
        return 1
    output_path = Path(args.output).resolve() if args.output else None
    write_csv(rows, output_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
