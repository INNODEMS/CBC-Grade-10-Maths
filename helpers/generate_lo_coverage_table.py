#!/usr/bin/env python3
"""
Generate a PreTeXt table mapping each Learning Outcome to the section(s) where it is covered.

- Reads Learning Outcomes.csv
- Reads File Matching Validated.csv
- Assigns (a), (b), ... for each LO in order per sub-strand
- Maps each LO to all PTX xml:ids where it is covered
- Outputs a PreTeXt file: lo-coverage-table.ptx
"""

import csv
import os
from collections import OrderedDict, defaultdict


def get_expected_xml_id(section_filecase, subsection_filecase, subsubsection_filecase):
    if subsubsection_filecase:
        return f"subsubsec-{subsubsection_filecase}"
    elif subsection_filecase:
        return f"subsec-{subsection_filecase}"
    else:
        return f"sec-{section_filecase}"


def parse_learning_outcomes(lo_csv_path):
    """
    Returns:
        OrderedDict: {strand: {substrand: [(letter, outcome), ...]}}
    """
    data = OrderedDict()
    with open(lo_csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        # Normalize headers
        reader.fieldnames = [h.strip() for h in reader.fieldnames]
        count = defaultdict(lambda: defaultdict(int))
        for row in reader:
            strand = row.get('Strand', '').strip()
            substrand = row.get('Sub-Strand', '').strip()
            outcome = row.get('Learning Outcomes', '').strip()
            if not strand or not substrand or not outcome:
                continue
            if strand not in data:
                data[strand] = OrderedDict()
            if substrand not in data[strand]:
                data[strand][substrand] = []
            count[strand][substrand] += 1
            letter = chr(96 + count[strand][substrand])  # a, b, c, ...
            data[strand][substrand].append((letter, outcome))
    return data


def parse_file_matching_validated(fmv_csv_path):
    """
    Returns:
        dict: {strand: {substrand: {lo_text: [xml_id, ...]}}}
    """
    mapping = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    with open(fmv_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Remap Surface Area and Volume sections to the syllabus strand
            orig_strand = row['Chapter'].strip()
            section = row['Section'].strip()
            strand = orig_strand
            substrand = section
            section_filecase = row['Section Filecase'].strip()
            subsection_filecase = row['Subsection Filecase'].strip()
            subsubsection_filecase = row['Subsubsection Filecase'].strip()
            in_syllabus = row['In Syllabus'].strip()
            ptx_exists = row['PTX Exists'].strip()
            if in_syllabus not in ['Yes', 'Extension'] or ptx_exists != 'YES':
                continue
            xml_id = get_expected_xml_id(section_filecase, subsection_filecase, subsubsection_filecase)
            for i in range(1, 5):
                lo_col = f'LO {i}'
                lo_text = row[lo_col].strip()
                if lo_text:
                    mapping[strand][substrand][lo_text].append(xml_id)
    return mapping


def generate_ptx(lo_data, fmv_mapping, output_path):
    # Assign strand and substrand numbers
    strand_numbers = {}
    substrand_numbers = {}
    for i, (strand, substrands) in enumerate(lo_data.items(), 1):
        strand_numbers[strand] = i
        substrand_numbers[strand] = {}
        for j, substrand in enumerate(substrands.keys(), 1):
            substrand_numbers[strand][substrand] = j

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- AUTO-GENERATED FILE - DO NOT EDIT MANUALLY -->',
        '<!-- Regenerate using: python3 helpers/generate_lo_coverage_table.py -->',
        '',
        '<preface xml:id="preface-lo-coverage-table" xmlns:xi="http://www.w3.org/2001/XInclude">',
        '    <title>Learning Outcomes Coverage Table</title>',
        '',
        '    <p>',
        '        For each strand and sub-strand in the 2025 Core Mathematics CBE Curriculum, this table maps each specific learning outcome to the section(s) of the textbook where it is covered.',
        '        Section numbers are clickable links.',
        '    </p>',
        ''
    ]
    for strand, substrands in lo_data.items():
        strand_id = strand.replace(' ', '-').replace('.', '-').lower()
        s_num = strand_numbers[strand]
        lines.append(f'    <paragraphs xml:id="lo-coverage-{strand_id}">')
        lines.append(f'        <title>{s_num}.0 {strand}</title>')
        for substrand, outcomes in substrands.items():
            ss_num = substrand_numbers[strand][substrand]
            lines.append(f'        <p>{s_num}.{ss_num} {substrand}</p>')
            lines.append('        <tabular halign="left">')
            lines.append('            <col width="10%"/>')
            lines.append('            <col width="90%"/>')
            lines.append('            <row header="yes" bottom="medium">')
            lines.append('                <cell>Outcome</cell>')
            lines.append('                <cell>Coverage in Textbook</cell>')
            lines.append('            </row>')
            for letter, outcome in outcomes:
                # Special handling for Surface Area and Volume of Solids
                if substrand == 'Surface Area and Volume of Solids':
                    xml_ids = []
                    # Aggregate all substrands (Surface Area, Volume) for this sub-strand
                    for ss in ['Surface Area', 'Volume']:
                        xml_ids += fmv_mapping.get(strand, {}).get(ss, {}).get(outcome, [])
                    # Also include any direct matches under the combined substrand name (for robustness)
                    xml_ids += fmv_mapping.get(strand, {}).get(substrand, {}).get(outcome, [])
                else:
                    xml_ids = fmv_mapping.get(strand, {}).get(substrand, {}).get(outcome, [])
                refs = [f'§<xref ref="{xml_id}" text="global"/>' for xml_id in xml_ids]
                coverage = ', '.join(refs) if refs else '<mdash/>'
                lines.append('            <row bottom="minor">')
                lines.append(f'                <cell>({letter}) {outcome}</cell>')
                lines.append(f'                <cell>{coverage}</cell>')
                lines.append('            </row>')
            lines.append('        </tabular>')
            lines.append('')
        lines.append('    </paragraphs>')
        lines.append('')
    lines.append('</preface>')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Generated: {output_path}")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    lo_csv_path = os.path.join(script_dir, 'Learning Outcomes.csv')
    fmv_csv_path = os.path.join(script_dir, 'File Matching Validated.csv')
    output_path = os.path.join(script_dir, '..', 'source', 'lo-coverage-table.ptx')
    lo_data = parse_learning_outcomes(lo_csv_path)
    fmv_mapping = parse_file_matching_validated(fmv_csv_path)
    generate_ptx(lo_data, fmv_mapping, output_path)
    print("Done!")

if __name__ == '__main__':
    main()
