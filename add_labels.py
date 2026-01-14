import os
import re
import random
import string

# Configuration
TARGET_TAGS = [
    "activity", "example", "exercise", "exercises", "exploration", "investigation", "introduction", "insight", "task", "technology", "note", "notation", 
    "figure", "table", 
    "p", "ol", "ul", "li", 
]
FILE_EXTENSION = '.ptx'
SEARCH_DIR = './source'  # Current directory

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

def main():
    for root, _, files in os.walk(SEARCH_DIR):
        for file in files:
            if file.endswith(FILE_EXTENSION):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    original_content = f.read()
                
                new_content = process_content(original_content)
                
                if new_content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {file_path}")

if __name__ == "__main__":
    main()
