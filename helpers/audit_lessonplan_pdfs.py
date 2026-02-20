import os
import re

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'lesson_plans')
SOURCE_DIR = os.path.join(os.path.dirname(__file__), '..', 'source')

def find_unreferenced_pdfs():
    # Collect all .pdf files in assets/lesson_plans (recursively)
    pdf_files = []
    for root, _, files in os.walk(ASSETS_DIR):
        for file in files:
            if file.lower().endswith('.pdf'):
                rel_path = os.path.relpath(os.path.join(root, file), ASSETS_DIR)
                pdf_files.append(rel_path)

    # Read all source files into a single string
    source_text = ''
    for root, _, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith('.ptx') or file.endswith('.xml') or file.endswith('.txt'):
                with open(os.path.join(root, file), encoding='utf-8') as f:
                    source_text += f.read().lower() + '\n'

    # Check if each PDF is mentioned in the source
    unreferenced = []
    for pdf in pdf_files:
        # Check for filename or relative path
        pdf_name = os.path.basename(pdf).lower()
        pdf_path = pdf.replace('\\', '/').lower()
        if pdf_name not in source_text and pdf_path not in source_text:
            unreferenced.append(pdf)

    # Print unreferenced PDFs
    if unreferenced:
        print('Unreferenced PDFs:')
        for pdf in unreferenced:
            print(pdf)
    else:
        print('All PDFs are referenced in source.')

if __name__ == '__main__':
    find_unreferenced_pdfs()
