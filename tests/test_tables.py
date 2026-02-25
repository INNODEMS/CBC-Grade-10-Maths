"""Unit tests for utils/tables.py."""

from pathlib import Path
import tempfile
from utils import tables


def test_parse_links_and_generate(tmp_path: Path):
    source = tmp_path / "source"
    source.mkdir()
    # create dummy file to satisfy existence check
    (source / "foo.ptx").write_text('')
    rows = [
        {'Chapter': 'Numbers and Algebra', 'Section': 'S1', 'Subsection': '', 'Subsubsection': '',
         'In Syllabus': 'Yes', 'PTX Exists': 'YES', 'PTX Path': 'foo.ptx',
         'Section Filecase': 's1', 'Subsection Filecase': '', 'Subsubsection Filecase': ''},
    ]
    data = tables.parse_links(rows, source)
    assert data
    out_file = tmp_path / 'syllabus.ptx'
    tables.generate_syllabus_ptx(data, out_file)
    assert out_file.exists()


def test_lo_coverage(tmp_path: Path):
    lo_rows = [{'Strand': 'A', 'Sub-Strand': 'a1', 'Learning Outcomes': 'LO1'}]
    rows = [{'Chapter':'A','Section':'a1','Section Filecase':'a1','Subsection Filecase':'','Subsubsection Filecase':'','In Syllabus':'Yes','PTX Exists':'YES','PTX Path':'f.ptx','LO 1':'LO1','LO 2':'','LO 3':'','LO 4':''}]
    mapping = tables.parse_file_matching_validated(rows)
    lo_data = tables.parse_learning_outcomes(lo_rows)
    out_file = tmp_path / 'lo.ptx'
    tables.generate_lo_coverage_ptx(lo_data, mapping, out_file)
    assert out_file.exists()
