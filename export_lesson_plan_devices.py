#!/usr/bin/env python3
"""Emit a CSV of which lesson plans have been made for which topic."""
from __future__ import annotations

import argparse
import csv
from pathlib import Path
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "List every lesson-plan file inside assets/lesson-plans that lives "
            "under a 'With Devices' directory."
        )
    )
    parser.add_argument(
        "--base-dir",
        default="assets/lesson-plans",
        help="Root directory that holds the lesson-plan folders (default: assets/lesson-plans)",
    )
    parser.add_argument(
        "--output",
        help="Optional destination for the CSV (defaults to stdout)",
    )
    return parser.parse_args()


def is_with_devices_dir(path: Path) -> bool:
    name = path.name.lower()
    return (
        path.is_dir()
        and "with" in name
        and "device" in name
        and "without" not in name
    )


def iter_with_devices_dirs(base_dir: Path):
    for path in base_dir.rglob("*"):
        if is_with_devices_dir(path):
            yield path


def collect_rows(base_dir: Path) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for devices_dir in sorted(iter_with_devices_dirs(base_dir)):
        try:
            relative_devices = devices_dir.relative_to(base_dir)
        except ValueError:
            # Skip directories that fall outside the declared base (shouldn't happen).
            continue
        parts = relative_devices.parts
        if not parts:
            continue
        subject = parts[0]
        lesson_parts = parts[1:-1]
        lesson = " / ".join(lesson_parts) if lesson_parts else ""
        for file_path in sorted(devices_dir.iterdir()):
            if not file_path.is_file():
                continue
            if "step by step" in file_path.name.lower():
                continue
            relative = file_path.relative_to(base_dir)
            rows.append(
                (
                    subject,
                    lesson,
                    file_path.stem,
                    str(relative),
                )
            )
    return rows


def write_csv(rows: list[tuple[str, str, str, str]], destination: Path | None) -> None:
    header = ["Subject", "Lesson", "FileName", "RelativePath"]
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
    base_dir = Path(args.base_dir).resolve()
    if not base_dir.exists():
        print(f"Base directory not found: {base_dir}", file=sys.stderr)
        return 1
    rows = collect_rows(base_dir)
    if not rows:
        print("No 'With Devices' files found", file=sys.stderr)
        return 1
    output_path = Path(args.output).resolve() if args.output else None
    write_csv(rows, output_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
