"""Generation of PreTeXt tables from CSV data.

This module provides the two major table‑building functions that were
previously implemented as standalone scripts:

* syllabus alignment
* learning‑outcomes coverage

Both functions operate on row data (list of dicts) and a base directory and
produce a PTX string which the caller can write to a file.
"""
from __future__ import annotations
import os
import csv
from pathlib import Path
from collections import OrderedDict
from typing import Iterable, Dict, List, Tuple


def get_xml_id(section_filecase, subsection_filecase, subsubsection_filecase):
    if subsubsection_filecase:
        return f"subsubsec-{subsubsection_filecase}"
    elif subsection_filecase:
        return f"subsec-{subsection_filecase}"
    else:
        return f"sec-{section_filecase}"


def get_display_title(subsection: str, subsubsection: str) -> str:
    if subsubsection:
        return f"{subsection}: {subsubsection}"
    else:
        return subsection


def parse_links(rows: Iterable[Dict[str, str]], source_dir: Path) -> OrderedDict:
    """Return an OrderedDict grouping rows by strand/substring for syllabus.

    Only rows with in‑syllabus 'Yes' or 'Extension' and existing PTX files are
    included.  The returned structure is

        {strand_name: {substrand_name: [(display_title, xml_id), ...]}}
    """
    data: OrderedDict[str, OrderedDict[str, List[Tuple[str, str]]]] = OrderedDict()
    # map chapter to strand number
    strand_numbers = {
        "Numbers and Algebra": "1.0",
        "Measurements and Geometry": "2.0",
        "Statistics and Probability": "3.0",
    }
    substrand_counts: Dict[str, int] = {}
    substrand_numbers: Dict[str, Dict[str, str]] = {}

    for row in rows:
        ptx_path = row.get('PTX Path', '').strip()
        # skip geometry extras that aren't meant to appear in the tables
        if any(term in ptx_path.lower() for term in ("nonagon", "decagon")):
            continue
        chapter = row.get('Chapter', '').strip()
        section = row.get('Section', '').strip()
        subsection = row.get('Subsection', '').strip()
        subsubsection = row.get('Subsubsection', '').strip()
        in_syllabus = row.get('In Syllabus', '').strip()
        ptx_exists = row.get('PTX Exists', '').strip()
        if in_syllabus not in ['Yes', 'Extension'] or ptx_exists != 'YES':
            continue
        if not chapter:
            continue
        full_ptx = source_dir / ptx_path
        if not full_ptx.is_file():
            print(f"  Skipping (file not found): {ptx_path}")
            continue
        section_filecase = row.get('Section Filecase', '').strip()
        subsection_filecase = row.get('Subsection Filecase', '').strip()
        subsubsection_filecase = row.get('Subsubsection Filecase', '').strip()

        strand_num = strand_numbers.get(chapter, "")
        strand_name = f"{strand_num} {chapter}"
        if strand_name not in substrand_counts:
            substrand_counts[strand_name] = 0
            substrand_numbers[strand_name] = {}
        if section not in substrand_numbers[strand_name]:
            substrand_counts[strand_name] += 1
            base_num = strand_num.rstrip('0').rstrip('.')
            substrand_numbers[strand_name][section] = f"{base_num}.{substrand_counts[strand_name]}"
        substrand_num = substrand_numbers[strand_name][section]
        substrand_name = f"{substrand_num} {section}"

        if strand_name not in data:
            data[strand_name] = OrderedDict()
        if substrand_name not in data[strand_name]:
            data[strand_name][substrand_name] = []

        xml_id = get_xml_id(section_filecase, subsection_filecase, subsubsection_filecase)
        display_title = get_display_title(subsection, subsubsection) if subsection else section

        entry = (display_title, xml_id)
        if entry not in data[strand_name][substrand_name]:
            data[strand_name][substrand_name].append(entry)

    return data


def generate_syllabus_ptx(data: OrderedDict, output_path: Path) -> None:
    lines: List[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- AUTO-GENERATED FILE - DO NOT EDIT MANUALLY -->',
        '<!-- Regenerate using utils.content.syllabus_tables.generate_syllabus_ptx -->',
        '',
        '<appendix xml:id="appendix-syllabus-alignment" xmlns:xi="http://www.w3.org/2001/XInclude">',
        '    <title>Syllabus Alignment</title>',
        '',
        '    <p>',
        '        This section shows how the content of this book aligns with the Kenyan',
        '        Grade 10 competency-based mathematics curriculum. Use the links to navigate',
        '        to the relevant sections.',
        '    </p>',
        ''
    ]
    for strand_name, substrands in data.items():
        strand_id = strand_name.replace(' ', '-').replace('.', '-').lower()
        lines.append(f'    <paragraphs xml:id="syllabus-{strand_id}">')
        lines.append(f'        <title>{strand_name}</title>')
        lines.append('')
        lines.append('        <table>')
        lines.append(f'            <title>Syllabus Alignment: {strand_name}</title>')
        lines.append('            <tabular halign="left">')
        lines.append('                <col width="20%"/>')
        lines.append('                <col width="80%"/>')
        lines.append('                <row header="yes" bottom="medium">')
        lines.append('                    <cell>Substrand</cell>')
        lines.append('                    <cell>Coverage in Textbook</cell>')
        lines.append('                </row>')
        for substrand_name, entries in substrands.items():
            xrefs = [f'<xref ref="{xml_id}" text="global"/><nbsp/><xref ref="{xml_id}" text="title"/>' for _, xml_id in entries]
            if len(xrefs) > 1:
                topics_content = ''
                for title, xml_id in entries:
                    topics_content += f'<line>§<xref ref="{xml_id}" text="global"/><nbsp/><xref ref="{xml_id}" text="title"/></line>\n'
            else:
                topics_content = xrefs[0] if xrefs else '<mdash/>'
            lines.append('                <row bottom="minor">')
            lines.append(f'                    <cell>{substrand_name}</cell>')
            if len(xrefs) > 1:
                lines.append('                    <cell>')
                lines.append(f'                        {topics_content}')
                lines.append('                    </cell>')
            else:
                lines.append(f'                    <cell>{topics_content}</cell>')
            lines.append('                </row>')
        lines.append('            </tabular>')
        lines.append('        </table>')
        lines.append('')
        lines.append('    </paragraphs>')
        lines.append('')
    lines.append('</appendix>')
    lines.append('')
    output_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"Generated: {output_path}")


def parse_learning_outcomes(lo_rows: Iterable[Dict[str, str]]) -> OrderedDict:
    data: OrderedDict[str, OrderedDict[str, List[Tuple[str, str]]]] = OrderedDict()
    count = {}
    for row in lo_rows:
        strand = row.get('Strand','').strip()
        substrand = row.get('Sub-Strand','').strip()
        outcome = row.get('Learning Outcomes','').strip()
        if not strand or not substrand or not outcome:
            continue
        if strand not in data:
            data[strand] = OrderedDict()
            count[strand] = {}
        if substrand not in data[strand]:
            data[strand][substrand] = []
            count[strand][substrand] = 0
        count[strand][substrand] += 1
        letter = chr(96 + count[strand][substrand])
        data[strand][substrand].append((letter, outcome))
    return data


def parse_file_matching_validated(rows: Iterable[Dict[str, str]]) -> Dict[str, Dict[str, Dict[str, List[str]]]]:
    mapping: Dict[str, Dict[str, Dict[str, List[str]]]] = {}
    for row in rows:
        ptx_path = row.get('PTX Path','').strip()
        if any(term in ptx_path.lower() for term in ("nonagon","decagon")):
            continue
        orig_strand = row.get('Chapter','').strip()
        section = row.get('Section','').strip()
        strand = orig_strand
        substrand = section
        section_filecase = row.get('Section Filecase','').strip()
        subsection_filecase = row.get('Subsection Filecase','').strip()
        subsubsection_filecase = row.get('Subsubsection Filecase','').strip()
        in_syllabus = row.get('In Syllabus','').strip()
        ptx_exists = row.get('PTX Exists','').strip()
        if in_syllabus not in ['Yes','Extension'] or ptx_exists != 'YES':
            continue
        xml_id = get_xml_id(section_filecase, subsection_filecase, subsubsection_filecase)
        for i in range(1,5):
            lo_text = row.get(f'LO {i}','').strip()
            if not lo_text:
                continue
            mapping.setdefault(strand, {}).setdefault(substrand, {}).setdefault(lo_text, []).append(xml_id)
    return mapping


def generate_lo_coverage_ptx(
    lo_data: OrderedDict,
    fmv_mapping: Dict[str, Dict[str, Dict[str, List[str]]]],
    output_path: Path,
) -> None:
    # assign numbering
    strand_numbers: Dict[str,int] = {}
    substrand_numbers: Dict[str, Dict[str,int]] = {}
    for i,(strand, substrands) in enumerate(lo_data.items(),1):
        strand_numbers[strand] = i
        substrand_numbers[strand] = {}
        for j, substrand in enumerate(substrands.keys(),1):
            substrand_numbers[strand][substrand] = j

    lines: List[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- AUTO-GENERATED FILE - DO NOT EDIT MANUALLY -->',
        '<!-- Regenerate using utils.content.syllabus_tables.generate_lo_coverage_ptx -->',
        '',
        '<appendix xml:id="appendix-lo-coverage-table" xmlns:xi="http://www.w3.org/2001/XInclude">',
        '    <title>Learning Outcomes Coverage Table</title>',
        '',
        '    <p>',
        '        For each strand and sub-strand in the 2025 Core Mathematics CBE Curriculum, this table maps each specific learning outcome to the section(s) of the textbook where it is covered.',
        '        Section numbers are clickable links.',
        '    </p>',
        ''
    ]
    for strand, substrands in lo_data.items():
        strand_id = strand.replace(' ','-').replace('.','-').lower()
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
                if substrand == 'Surface Area and Volume of Solids':
                    xml_ids: List[str] = []
                    for ss in ['Surface Area','Volume']:
                        xml_ids += fmv_mapping.get(strand, {}).get(ss, {}).get(outcome, [])
                    xml_ids += fmv_mapping.get(strand, {}).get(substrand, {}).get(outcome, [])
                else:
                    xml_ids = fmv_mapping.get(strand, {}).get(substrand, {}).get(outcome, [])
                refs = [f'<m>§</m><xref ref="{xml_id}" text="global"/>' for xml_id in xml_ids]
                coverage = ', '.join(refs) if refs else '<mdash/>'
                lines.append('            <row bottom="minor">')
                lines.append(f'                <cell>({letter}) {outcome}</cell>')
                lines.append(f'                <cell>{coverage}</cell>')
                lines.append('            </row>')
            lines.append('        </tabular>')
            lines.append('')
        lines.append('    </paragraphs>')
        lines.append('')
    lines.append('</appendix>')
    output_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"Generated: {output_path}")
