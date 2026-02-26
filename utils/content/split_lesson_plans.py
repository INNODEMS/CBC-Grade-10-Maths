"""Split combined lesson-plans PDF into per-lesson PDFs using a page map.

This tool expects a simple mapping file with lines like:
  xmlid 12
  other-xmlid 20

Where the number is the 1-based page in the combined PDF where that
xmlid begins. The script writes each range to `output/plans/pdfs/<xmlid>.pdf`.

If no mapping file is provided it will look for `output/plans/main.pages`.
"""
from __future__ import annotations
import os
from pathlib import Path
from typing import List, Tuple

try:
    from PyPDF2 import PdfReader, PdfWriter
except Exception:
    PdfReader = PdfWriter = None


def read_map(path: Path) -> List[Tuple[str, int]]:
    out = []
    with path.open(encoding='utf-8') as f:
        for ln in f:
            ln = ln.strip()
            if not ln or ln.startswith('#'):
                continue
            parts = ln.split()
            if len(parts) < 2:
                continue
            name = parts[0]
            try:
                page = int(parts[1])
            except ValueError:
                continue
            out.append((name, page))
    return sorted(out, key=lambda x: x[1])


def split_pdf(pdf_path: Path, map_path: Path, out_dir: Path) -> None:
    if PdfReader is None:
        raise RuntimeError('PyPDF2 not available; please install it: pip install PyPDF2')

    mapping = read_map(map_path)
    if not mapping:
        raise RuntimeError(f'No entries found in map {map_path}')

    reader = PdfReader(str(pdf_path))
    total = len(reader.pages)
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, (name, start) in enumerate(mapping):
        end = (mapping[i+1][1] - 1) if i+1 < len(mapping) else total
        if start < 1:
            start = 1
        if end < start:
            continue
        writer = PdfWriter()
        for p in range(start - 1, end):
            writer.add_page(reader.pages[p])
        out_path = out_dir / f"{name}.pdf"
        with out_path.open('wb') as f:
            writer.write(f)
        print(f'Wrote {out_path} (pages {start}-{end})')


def main(argv=None):
    import argparse
    parser = argparse.ArgumentParser(description='Split combined lesson-plans PDF into per-lesson PDFs')
    parser.add_argument('--pdf', default=os.path.join('output', 'plans', 'main.pdf'))
    parser.add_argument('--map', default=os.path.join('output', 'plans', 'main.pages'))
    parser.add_argument('--out', default=os.path.join('output', 'plans', 'pdfs'))
    args = parser.parse_args(argv)

    pdf_path = Path(args.pdf)
    map_path = Path(args.map)
    out_dir = Path(args.out)

    if not pdf_path.exists():
        raise SystemExit(f'PDF not found: {pdf_path}')
    if not map_path.exists():
        raise SystemExit(f'Map file not found: {map_path}')

    split_pdf(pdf_path, map_path, out_dir)


if __name__ == '__main__':
    main()
