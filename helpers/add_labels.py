import os
import re
import random
import argparse
import string
from pathlib import Path

# Configuration
TARGET_TAGS = [
    "activity", "example", "exercise", "exercises", "exploration", "investigation", "introduction", "insight", "task", "technology", "note", "notation", 
    "figure", "table", 
    "p", "li", 
]
FILE_EXTENSION = '.ptx'
EXCLUDE = 'resources-blurb-'
SEARCH_DIR = '../source'

def generate_label(length=8):
    chars = string.ascii_lowercase + string.digits
    return 'auto_' + ''.join(random.choices(chars, k=length))

def process_content(content):
    for tag in TARGET_TAGS:
        # Regex breakdown:
        # <tag           : Matches the start of the tag
        # (?![^>]*label=): Negative lookahead; ensures 'label=' isn't already inside the tag
        # (?=[ \t>])     : Ensures the tag name is followed by a space, tab, or closing bracket
        pattern = rf'<{tag}(?![^>]*xml:id=)(?=[ \t>])'
        
        def replace_func(match):
            return f'<{tag} xml:id="{generate_label()}"'
        
        content = re.sub(pattern, replace_func, content)
    return content

def iter_ptx_files(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Search path does not exist: {path}")

    if os.path.isfile(path):
        if path.endswith(FILE_EXTENSION):
            yield path
        return

    for root, _, files in os.walk(path):
        for file in files:
            if file.endswith(FILE_EXTENSION) and not Path(file).stem.startswith(EXCLUDE):
                yield os.path.join(root, file)


def main(*, search_dir=SEARCH_DIR):
    for file_path in iter_ptx_files(search_dir):
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()

        new_content = process_content(original_content)

        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add xml:id labels to PreTeXt files.")
    parser.add_argument(
        "--search-dir",
        dest="search_dir",
        default=SEARCH_DIR,
        help="Directory or file to process (defaults to ./source).",
    )

    args = parser.parse_args()
    main(search_dir=args.search_dir)
