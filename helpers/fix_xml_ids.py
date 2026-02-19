#!/usr/bin/env python3
"""
Fix xml:id values in PTX files to match the expected format from the CSV.

This script reads File Matching Validated.csv, opens each PTX file,
and corrects the xml:id attribute to match the expected format.

Usage:
    python3 fix_xml_ids.py

"""

import csv
import os
import re


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


def fix_xml_id_in_file(filepath, expected_id):
    """
    Fix the xml:id in a PTX file to match the expected value.
    
    Returns:
        tuple: (success, old_id, message)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to find xml:id in section/subsection/subsubsection elements
        pattern = r'(<(?:section|subsection|subsubsection)\s+[^>]*xml:id\s*=\s*["\'])([^"\']+)(["\'])'
        
        match = re.search(pattern, content)
        if not match:
            return False, None, "No xml:id found in file"
        
        old_id = match.group(2)
        
        if old_id == expected_id:
            return True, old_id, "Already correct"
        
        # Replace the xml:id
        new_content = re.sub(
            pattern,
            lambda m: f'{m.group(1)}{expected_id}{m.group(3)}',
            content,
            count=1  # Only replace the first occurrence (root element)
        )
        
        # Write the fixed content back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True, old_id, f"Fixed: {old_id} -> {expected_id}"
        
    except Exception as e:
        return False, None, f"Error: {e}"


def fix_all_xml_ids(csv_path, source_dir):
    """
    Fix all PTX files to have correct xml:ids.
    """
    fixed = []
    skipped = []
    errors = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            chapter = row['Chapter'].strip()
            ptx_exists = row['PTX Exists'].strip()
            ptx_path = row['PTX Path'].strip()
            
            # Skip empty rows
            if not chapter or not ptx_path:
                continue
            
            # Skip if PTX doesn't exist
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
            
            # Check if file exists
            full_path = os.path.join(source_dir, ptx_path)
            if not os.path.isfile(full_path):
                errors.append(f"File not found: {ptx_path}")
                continue
            
            # Fix the xml:id
            success, old_id, message = fix_xml_id_in_file(full_path, expected_id)
            
            if success:
                if "Fixed" in message:
                    fixed.append(f"{ptx_path}: {message}")
                else:
                    skipped.append(ptx_path)
            else:
                errors.append(f"{ptx_path}: {message}")
    
    return fixed, skipped, errors


def main():
    # Get paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'File Matching Validated.csv')
    source_dir = os.path.join(script_dir, '..', 'source')
    
    print(f"Reading: {csv_path}")
    print(f"Source directory: {source_dir}")
    print()
    
    fixed, skipped, errors = fix_all_xml_ids(csv_path, source_dir)
    
    print("="*70)
    print("XML:ID FIX REPORT")
    print("="*70)
    
    print(f"\n✓ Fixed: {len(fixed)}")
    print(f"- Skipped (already correct): {len(skipped)}")
    print(f"✗ Errors: {len(errors)}")
    
    if fixed:
        print("\n" + "-"*70)
        print("FIXED FILES:")
        print("-"*70)
        for item in fixed:
            print(f"  {item}")
    
    if errors:
        print("\n" + "-"*70)
        print("ERRORS:")
        print("-"*70)
        for item in errors:
            print(f"  {item}")
    
    print("\nDone!")


if __name__ == '__main__':
    main()
