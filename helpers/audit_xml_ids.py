#!/usr/bin/env python3
"""
Audit xml:id values in PTX files against the expected format from the CSV.

This script reads File Matching Validated.csv, opens each PTX file that exists,
and verifies that the xml:id attribute matches the expected format based on the
section hierarchy (subsubsec-, subsec-, sec-).

Usage:
    python3 audit_xml_ids.py

Output:
    Reports mismatches and optionally generates a corrected mapping.
"""

import csv
import os
import re
from collections import defaultdict


def get_expected_xml_id(section_filecase, subsection_filecase, subsubsection_filecase):
    """
    Generate the expected xml:id based on hierarchy level.
    """
    if subsubsection_filecase:
        return f"subsubsec-{subsubsection_filecase}"
    elif subsection_filecase:
        return f"subsec-{subsection_filecase}"
    else:
        return f"sec-{section_filecase}"


def extract_xml_id_from_file(filepath):
    """
    Extract the xml:id from the root element of a PTX file.
    
    Returns:
        tuple: (xml_id, element_type) or (None, None) if not found
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read(2000)  # Read first 2000 chars - should contain root element
        
        # Look for xml:id in the first element (section, subsection, subsubsection)
        # Pattern matches: <element xml:id="value"
        pattern = r'<(section|subsection|subsubsection)\s+[^>]*xml:id\s*=\s*["\']([^"\']+)["\']'
        match = re.search(pattern, content)
        
        if match:
            return match.group(2), match.group(1)
        
        # Try alternative pattern where xml:id comes first
        pattern2 = r'<(section|subsection|subsubsection)\s+xml:id\s*=\s*["\']([^"\']+)["\']'
        match2 = re.search(pattern2, content)
        
        if match2:
            return match2.group(2), match2.group(1)
            
        return None, None
        
    except Exception as e:
        print(f"  Error reading {filepath}: {e}")
        return None, None


def audit_xml_ids(csv_path, source_dir):
    """
    Audit all PTX files and compare actual xml:ids to expected values.
    
    Returns:
        dict: Mapping of expected_id -> actual_id for all entries
    """
    results = {
        'matches': [],
        'mismatches': [],
        'missing_files': [],
        'no_xml_id': [],
    }
    
    id_mapping = {}  # expected -> actual
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            chapter = row['Chapter'].strip()
            ptx_exists = row['PTX Exists'].strip()
            ptx_path = row['PTX Path'].strip()
            
            # Skip empty rows
            if not chapter or not ptx_path:
                continue
            
            # Skip if PTX doesn't exist according to CSV
            if ptx_exists != 'YES':
                continue
            
            # Get filecase values
            section_filecase = row['Section Filecase'].strip()
            subsection_filecase = row['Subsection Filecase'].strip()
            subsubsection_filecase = row['Subsubsection Filecase'].strip()
            
            # Calculate expected xml:id
            expected_id = get_expected_xml_id(
                section_filecase, 
                subsection_filecase, 
                subsubsection_filecase
            )
            
            # Check if file actually exists
            full_path = os.path.join(source_dir, ptx_path)
            if not os.path.isfile(full_path):
                results['missing_files'].append({
                    'ptx_path': ptx_path,
                    'expected_id': expected_id
                })
                continue
            
            # Extract actual xml:id from file
            actual_id, element_type = extract_xml_id_from_file(full_path)
            
            if actual_id is None:
                results['no_xml_id'].append({
                    'ptx_path': ptx_path,
                    'expected_id': expected_id
                })
                continue
            
            # Compare
            if actual_id == expected_id:
                results['matches'].append({
                    'ptx_path': ptx_path,
                    'xml_id': actual_id
                })
            else:
                results['mismatches'].append({
                    'ptx_path': ptx_path,
                    'expected_id': expected_id,
                    'actual_id': actual_id,
                    'element_type': element_type
                })
            
            # Store mapping (actual is what we should use)
            id_mapping[expected_id] = actual_id
    
    return results, id_mapping


def print_report(results):
    """Print a summary report of the audit."""
    print("\n" + "="*70)
    print("XML:ID AUDIT REPORT")
    print("="*70)
    
    print(f"\n✓ Matches: {len(results['matches'])}")
    print(f"✗ Mismatches: {len(results['mismatches'])}")
    print(f"? Missing files: {len(results['missing_files'])}")
    print(f"? No xml:id found: {len(results['no_xml_id'])}")
    
    if results['mismatches']:
        print("\n" + "-"*70)
        print("MISMATCHES (Expected vs Actual):")
        print("-"*70)
        for item in results['mismatches']:
            print(f"\n  File: {item['ptx_path']}")
            print(f"    Expected: {item['expected_id']}")
            print(f"    Actual:   {item['actual_id']}")
    
    if results['missing_files']:
        print("\n" + "-"*70)
        print("MISSING FILES (marked as YES in CSV but not found):")
        print("-"*70)
        for item in results['missing_files']:
            print(f"  {item['ptx_path']}")
    
    if results['no_xml_id']:
        print("\n" + "-"*70)
        print("FILES WITHOUT xml:id:")
        print("-"*70)
        for item in results['no_xml_id']:
            print(f"  {item['ptx_path']}")


def save_id_mapping(id_mapping, output_path):
    """Save the id mapping to a file for use by the syllabus generator."""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Mapping of expected xml:ids to actual xml:ids\n")
        f.write("# Format: expected_id,actual_id\n")
        for expected, actual in sorted(id_mapping.items()):
            f.write(f"{expected},{actual}\n")
    print(f"\nID mapping saved to: {output_path}")


def main():
    # Get paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'File Matching Validated.csv')
    source_dir = os.path.join(script_dir, '..', 'source')
    mapping_path = os.path.join(script_dir, 'xml_id_mapping.csv')
    
    print(f"Reading: {csv_path}")
    print(f"Source directory: {source_dir}")
    
    results, id_mapping = audit_xml_ids(csv_path, source_dir)
    
    print_report(results)
    
    # Save the mapping for use by the syllabus generator
    save_id_mapping(id_mapping, mapping_path)
    
    print("\nDone!")


if __name__ == '__main__':
    main()
