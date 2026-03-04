import os
import re
import csv
from collections import Counter
from lxml import etree
from slugify import slugify
from pathlib import Path

from ..helpers.csvtools import read_links_csv, cached_file, PTX_COL
from ..audits.reports import write_validated_to_sheet

## Usage: in the root directory:
# python3 -m utilis.audits.audit_questions

# Configuration: assume commands run from repository root
ASSET_FILES_ROOT = Path('assets')      # tree containing the STACK questions
PTX_FILES_ROOT = Path('source')       # tree containing files that reference the XMLs


def get_all_asset_files(root_dir, extension=".xml"):
    """Recursively finds all .xml files in a directory tree."""
    xml_files = set()
    for root, _, files in os.walk(str(root_dir)):
        for file in files:
            if file.endswith(extension) and "gitsync_category" not in file:
                # store relative path from the root_dir
                rel_path = os.path.relpath(os.path.join(root, file), start=os.path.dirname(str(root_dir)))
                xml_files.add(rel_path.replace("assets/", ""))
    return xml_files


def get_referenced_sources(root_dir, tag="stack"):
    """Collects all 'source' attributes from <stack /> tags."""
    references = []
    stack_pattern = re.compile('<' + tag + r'\s+[^>]*source="([^"]+)"')

    for root, _, files in os.walk(str(root_dir)):
        for file in files:
            if file.endswith('.ptx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = stack_pattern.findall(content)
                    references.extend(matches)
    return references


def get_label_from_filepath(path):
    filename = Path(path).stem
    return slugify(filename)


def write_orphaned(orphans, orphan_include_file):
    with open(orphan_include_file, "w") as f:
        for orphan in orphans:
            slug = get_label_from_filepath(orphan)
            f.write(f"""
                <exercise xml:id="ex-{slug}">
                    <!--<title></title>-->
                    <stack label="stk-{slug}" source="{orphan}"/>
                </exercise>
            """
)

            static = os.path.join("generated-assets", "stack", f"stk-{slug}.ptx")
            if not os.path.isfile(static):
                with open(static, "w") as fs:
                    fs.write("<stack-static>\n"
                            "<statement><p>Go to the online version of this book to view this question.</p></statement>\n"
                            "</stack-static>")


def audit_includes(extensions, tag, orphan_include_file=None):
    # 1. Collect data
    actual_files = get_all_asset_files(ASSET_FILES_ROOT, extensions)
    referenced_list = get_referenced_sources(PTX_FILES_ROOT, tag)
    unique_references = set(referenced_list)

    # 2. Identify Duplicates
    ref_counts = Counter(referenced_list)
    duplicates = [ref for ref, count in ref_counts.items() if count > 1]

    # 3. Identify Broken Links (Referenced but don't exist)
    broken_links = unique_references - actual_files

    # 4. Identify Orphaned Files (Exist but never referenced)
    orphans = actual_files - unique_references

    # --- Output Results ---
    
    print(f"Total {tag.upper()} files found in tree: {len(actual_files)}")
    print(f"Total {tag.upper()} questions references in textbook: {len(referenced_list)}\n")

    print(f"\n1. BROKEN LINKS ({len(broken_links)}):")
    for b in sorted(broken_links):
        print(f"   [X] {b}")
    if not broken_links: print("   None")

    print(f"2. DUPLICATE REFERENCES ({len(duplicates)}):")
    for d in sorted(duplicates):
        print(f"   [!] {d} (referenced {ref_counts[d]} times)")
    if not duplicates: print("   None")

    print(f"\n3. ORPHANED FILES ({len(orphans)}):")
    for o in sorted(orphans):
        print(f"   [-] {o}")
    if not orphans: print("   None")
    if orphan_include_file:
        print(orphans)
        write_orphaned(orphans, orphan_include_file)

    return actual_files


def check_deployed_variants(stack_files):
    missing_seeds = []
    missing_tests = []
    for file_path in stack_files:
        file_path = os.path.join(str(ASSET_FILES_ROOT), file_path)

        # Use a parser that preserves comments and CDATA
        parser = etree.XMLParser(strip_cdata=False, remove_blank_text=False)
        tree = etree.parse(file_path, parser)
        root = tree.getroot()

        questions = root.xpath('//quiz/question')
        
        for q in questions:
            var_text_node = q.xpath('questionvariables/text')
            
            if var_text_node:
                content = var_text_node[0].text or ""
                if 'random' in content or 'rand_' in content:
                    # Check if a deployedseed already exists
                    seeds = q.xpath('deployedseed')
                    if not seeds:
                        missing_seeds.append(file_path)

            tests = q.xpath('qtest')
            if not tests:
                missing_tests.append(file_path)

    print(f"\n4. BROKEN QUESTIONS - NO DEPLOYED VARIANTS ({len(missing_seeds)}):")
    for b in sorted(missing_seeds):
        print(f"   [X] {b}")
    if not missing_seeds: print("   None")

    print(f"\n5. QUESTIONS WITHOUT TESTS ({len(missing_tests)}):")
    for o in sorted(missing_tests):
        print(f"   [-] {o}")
    if not missing_tests: print("   None")


# ------------------------------------------------------------------
# Stack-by-section catalogue (merged from audit_stack_by_section)
# ------------------------------------------------------------------

# Regex for extracting source attributes from <stack .../> tags in a
# single file (same pattern as get_referenced_sources, but per-file).
_STACK_PATTERN = re.compile(r'<stack\s+[^>]*source="([^"]+)"')

# Columns from Automatic Links that we carry over into the catalogue CSV
_CATALOGUE_COLS = [
    "Chapter",
    "Section",
    "Subsection",
    "Subsubsection",
    "In Syllabus",
    PTX_COL,
]


def get_stack_sources_in_file(ptx_path: Path) -> list[str]:
    """Return an ordered list of stack source attributes found in *ptx_path*."""
    if not ptx_path.is_file():
        return []
    content = ptx_path.read_text(encoding="utf-8", errors="ignore")
    return _STACK_PATTERN.findall(content)


def build_stack_catalogue() -> list[dict[str, str]]:
    """Read Automatic Links and return rows augmented with stack question columns."""
    rows = read_links_csv()
    max_questions = 0
    output_rows: list[dict[str, str]] = []

    for row in rows:
        ptx_rel = row.get(PTX_COL, "").strip()
        ptx_path = PTX_FILES_ROOT / ptx_rel if ptx_rel else None

        sources = get_stack_sources_in_file(ptx_path) if ptx_path else []
        max_questions = max(max_questions, len(sources))

        out = {col: row.get(col, "") for col in _CATALOGUE_COLS}
        out["Stack Count"] = str(len(sources))
        for i, src in enumerate(sources, start=1):
            out[f"Stack Q{i}"] = src

        output_rows.append(out)

    # Ensure every row has the same set of Stack Q columns
    for out in output_rows:
        for i in range(1, max_questions + 1):
            out.setdefault(f"Stack Q{i}", "")

    return output_rows


def write_stack_catalogue(
    output_rows: list[dict[str, str]], dest: Path | None = None
) -> Path:
    """Write the catalogue to a CSV file and return the path."""
    if dest is None:
        dest = cached_file("Stack Questions by Section.csv")

    # Build ordered fieldnames
    fieldnames = list(_CATALOGUE_COLS) + ["Stack Count"]
    # Determine max question index
    q_cols = sorted(
        (k for k in output_rows[0] if k.startswith("Stack Q")),
        key=lambda k: int(k.removeprefix("Stack Q")),
    )
    fieldnames += q_cols

    with dest.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in output_rows:
            writer.writerow(row)

    return dest


def run_stack_catalogue() -> None:
    """Build and write the stack-by-section catalogue, printing a summary."""
    output_rows = build_stack_catalogue()
    dest = write_stack_catalogue(output_rows)
    total = sum(int(r["Stack Count"]) for r in output_rows)
    sections_with = sum(1 for r in output_rows if int(r["Stack Count"]) > 0)
    print(f"\n--- Stack-by-Section Catalogue ---")
    print(f"Wrote {dest}")
    print(f"  {len(output_rows)} sections, {sections_with} with STACK questions, {total} questions total")
    print(f"Exporting to Google Sheet")
    write_validated_to_sheet(output_rows, sheet_name="STACK Audit Upload")


def run_audit():
    print("--- Starting IMAGE Audit ---\n")
    audit_includes((".png", ".jpg", ".jpeg", ".webp"), "image")
    print("--- Starting PDF Audit ---\n")
    audit_includes((".pdf"), "dataurl")
    print("\n\n--- Starting STACK Audit ---\n")
    stack_files = audit_includes(".xml", "stack", orphan_include_file="utils/audits/orphaned.ptx")
    check_deployed_variants(stack_files)
    run_stack_catalogue()


if __name__ == "__main__":
    run_audit()
