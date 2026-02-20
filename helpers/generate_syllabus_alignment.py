#!/usr/bin/env python3
"""
Generate a PreTeXt syllabus alignment table from File Matching Validated.csv

This script reads the syllabus mapping CSV and generates a PreTeXt-formatted
table that links strands and substrands to the corresponding sections in the book.

Usage:
    python generate_syllabus_alignment.py

Output:
    ../source/syllabus-alignment.ptx
"""

import csv
import os
from collections import OrderedDict


def get_xml_id(section_filecase, subsection_filecase, subsubsection_filecase):
    """
    Generate the xml:id for cross-referencing based on the hierarchy level.
    
    Returns the deepest available reference:
    - subsubsection if available
    - subsection if no subsubsection
    - section if no subsection
    """
    if subsubsection_filecase:
        return f"subsubsec-{subsubsection_filecase}"
    elif subsection_filecase:
        return f"subsec-{subsection_filecase}"
    else:
        return f"sec-{section_filecase}"


def get_display_title(subsection, subsubsection):
    """
    Get the display title for the table.
    Combines subsection and subsubsection where applicable.
    """
    if subsubsection:
        return f"{subsection}: {subsubsection}"
    else:
        return subsection


def parse_csv(csv_path, source_dir):
    """
    Parse the CSV file and organize data by strand and substrand.
    Only includes entries where the PTX file actually exists.
    
    Args:
        csv_path: Path to the CSV file
        source_dir: Path to the source directory containing PTX files
    
    Returns:
        OrderedDict: {strand: {substrand: [(title, xml_id), ...]}}
    """
    data = OrderedDict()
    
    # Map chapter names to strand numbers
    strand_numbers = {
        "Numbers and Algebra": "1.0",
        "Measurements and Geometry": "2.0",
        "Statistics and Probability": "3.0"
    }
    
    # Track substrand numbers within each strand
    substrand_counts = {}
    substrand_numbers = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            chapter = row['Chapter'].strip()
            section = row['Section'].strip()
            subsection = row['Subsection'].strip()
            subsubsection = row['Subsubsection'].strip()
            in_syllabus = row['In Syllabus'].strip()
            ptx_exists = row['PTX Exists'].strip()
            ptx_path = row['PTX Path'].strip()
            
            # Skip rows that are not in syllabus or don't have PTX files
            if in_syllabus not in ['Yes', 'Extension'] or ptx_exists != 'YES':
                continue
            
            # Skip empty chapters
            if not chapter:
                continue
            
            # Verify the PTX file actually exists
            full_ptx_path = os.path.join(source_dir, ptx_path)
            if not os.path.isfile(full_ptx_path):
                print(f"  Skipping (file not found): {ptx_path}")
                continue
            
            # Get filecase values for xml:id construction
            section_filecase = row['Section Filecase'].strip()
            subsection_filecase = row['Subsection Filecase'].strip()
            subsubsection_filecase = row['Subsubsection Filecase'].strip()
            
            # Create strand name with number
            strand_num = strand_numbers.get(chapter, "")
            strand_name = f"{strand_num} {chapter}"
            
            # Track substrand numbers
            if strand_name not in substrand_counts:
                substrand_counts[strand_name] = 0
                substrand_numbers[strand_name] = {}
            
            # Create substrand name with number
            if section not in substrand_numbers[strand_name]:
                substrand_counts[strand_name] += 1
                base_num = strand_num.rstrip('0').rstrip('.')
                substrand_numbers[strand_name][section] = f"{base_num}.{substrand_counts[strand_name]}"
            
            substrand_num = substrand_numbers[strand_name][section]
            substrand_name = f"{substrand_num} {section}"
            
            # Initialize data structures
            if strand_name not in data:
                data[strand_name] = OrderedDict()
            if substrand_name not in data[strand_name]:
                data[strand_name][substrand_name] = []
            
            # Generate cross-reference info
            xml_id = get_xml_id(section_filecase, subsection_filecase, subsubsection_filecase)
            display_title = get_display_title(subsection, subsubsection) if subsection else section
            
            # Avoid duplicates
            entry = (display_title, xml_id)
            if entry not in data[strand_name][substrand_name]:
                data[strand_name][substrand_name].append(entry)
    
    return data


def generate_ptx(data, output_path):
    """
    Generate the PreTeXt file with the syllabus alignment table.
    Uses <preface> element so it can be included in frontmatter.
    """
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- AUTO-GENERATED FILE - DO NOT EDIT MANUALLY -->',
        '<!-- Regenerate using: python3 helpers/generate_syllabus_alignment.py -->',
        '',
        '<preface xml:id="preface-syllabus-alignment" xmlns:xi="http://www.w3.org/2001/XInclude">',
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
        # Create a paragraphs block for each strand with a table
        strand_id = strand_name.replace(' ', '-').replace('.', '-').lower()
        lines.append(f'    <paragraphs xml:id="syllabus-{strand_id}">')
        lines.append(f'        <title>{strand_name}</title>')
        lines.append('')
        
        # Create table for this strand
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
            # Create cross-reference links for each entry
            # Format: 1.1.1.1 Title (using global for number, title for name)
            xrefs = []
            for title, xml_id in entries:
                xrefs.append(f'<xref ref="{xml_id}" text="global"/><nbsp/><xref ref="{xml_id}" text="title"/>')
            
            # Join with list elements for readability
            if len(xrefs) > 1:
                topics_content = '<ul>\n'
                for title, xml_id in entries:
                    topics_content += f'                            <li>§<xref ref="{xml_id}" text="global"/><nbsp/><xref ref="{xml_id}" text="title"/></li>\n'
                topics_content += '                        </ul>'
            else:
                topics_content = xrefs[0] if xrefs else '<mdash/>'
            
            lines.append('                <row bottom="minor">')
            lines.append(f'                    <cell>{substrand_name}</cell>')
            if len(xrefs) > 1:
                lines.append(f'                    <cell>')
                lines.append(f'                        {topics_content}')
                lines.append(f'                    </cell>')
            else:
                lines.append(f'                    <cell>{topics_content}</cell>')
            lines.append('                </row>')
        
        lines.append('            </tabular>')
        lines.append('        </table>')
        lines.append('')
        lines.append('    </paragraphs>')
        lines.append('')
    
    lines.append('</preface>')
    lines.append('')
    
    # Write the output file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"Generated: {output_path}")


def main():
    # Get paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'File Matching Validated.csv')
    source_dir = os.path.join(script_dir, '..', 'source')
    output_path = os.path.join(source_dir, 'syllabus-alignment.ptx')
    
    # Parse CSV and generate PTX
    print(f"Reading: {csv_path}")
    print(f"Checking PTX files in: {source_dir}")
    data = parse_csv(csv_path, source_dir)
    
    # Summary
    total_entries = sum(
        len(entries)
        for substrands in data.values()
        for entries in substrands.values()
    )
    print(f"Found {len(data)} strands with {total_entries} total topic entries")
    
    generate_ptx(data, output_path)
    print("Done!")


if __name__ == '__main__':
    main()
