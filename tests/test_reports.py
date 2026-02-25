"""Unit tests for utils/reports.py."""

from pathlib import Path
import tempfile

from utils import reports


def test_find_unreferenced_pdfs(tmp_path: Path):
    base = tmp_path
    assets = base / "assets" / "lesson_plans"
    source = base / "source"
    assets.mkdir(parents=True)
    source.mkdir(parents=True)
    # create pdfs
    (assets / "a.pdf").write_text('')
    (assets / "b.pdf").write_text('')
    # reference a.pdf in a source file
    (source / "x.ptx").write_text('link to a.pdf')
    unref = reports.find_unreferenced_pdfs(base)
    assert "b.pdf" in unref
    assert "a.pdf" not in unref


def test_audit_xml_ids(tmp_path: Path):
    # create csv and a ptx file
    csv_path = tmp_path / "links.csv"
    csv_path.write_text("Chapter,PTX Exists,PTX Path,Section Filecase,Subsection Filecase,Subsubsection Filecase\n" +
                       "Ch,YES,foo.ptx,s1,ss1,\n")
    source = tmp_path / "source"
    source.mkdir()
    ptx = source / "foo.ptx"
    ptx.write_text('<section xml:id="sec-s1"></section>')
    results, mapping = reports.audit_xml_ids(csv_path, source)
    assert len(results['matches']) == 1
    assert mapping['sec-s1'] == 'sec-s1'
