import os
import re
from collections import Counter
from lxml import etree

# Configuration
ASSET_FILES_ROOT = './assets'      # The tree containing the STACK questions
PTX_FILES_ROOT = './source'      # The tree containing files that reference the XMLs

def get_all_asset_files(root_dir, extension=".xml"):
    """Recursively finds all .xml files in a directory tree."""
    xml_files = set()
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(extension) and "gitsync_category" not in file:
                # Store relative path from the root_dir
                rel_path = os.path.relpath(os.path.join(root, file), start=os.path.dirname(root_dir))
                xml_files.add(rel_path.replace("assets/", ""))
    return xml_files

def get_referenced_sources(root_dir, tag="stack"):
    """Collects all 'source' attributes from <stack /> tags."""
    references = []
    # Regex to find: <stack ... source="path/to/file.xml" ... />
    stack_pattern = re.compile('<' + tag + r'\s+[^>]*source="([^"]+)"')

    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.ptx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = stack_pattern.findall(content)
                    references.extend(matches)
    return references

def audit_includes(extensions, tag):
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

    return actual_files

def check_deployed_variants(stack_files):
    missing_seeds = []
    missing_tests = []
    for file_path in stack_files:
        file_path = os.path.join(ASSET_FILES_ROOT, file_path)

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


def run_audit():
    print("--- Starting IMAGE Audit ---\n")
    audit_includes((".png", ".jpg", ".jpeg", ".webp"), "image")
    print("\n\n--- Starting STACK Audit ---\n")
    stack_files = audit_includes(".xml", "stack")
    check_deployed_variants(stack_files)

if __name__ == "__main__":
    run_audit()
