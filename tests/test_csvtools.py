"""Unit tests for utils/csvtools.py."""

from pathlib import Path
import tempfile

from utils import csvtools


def test_read_write_roundtrip(tmp_path: Path):
    rows = [{'A': '1', 'B': '2'}, {'A': 'x', 'B': 'y'}]
    file = tmp_path / "test.csv"
    csvtools.write_links_csv(rows, file)
    read = csvtools.read_links_csv(file)
    assert read == rows


def test_augment_with_existence(tmp_path: Path):
    base = tmp_path
    (base / "source").mkdir()
    (base / "source" / "foo.ptx").write_text('')
    (base / "assets" / "lesson_plans").mkdir(parents=True)
    (base / "assets" / "lesson_plans" / "lp.pdf").write_text('')
    rows = [{'PTX Path': 'foo.ptx', 'Lesson Plan Path': 'lp.pdf', 'Step By Step Guide Path': ''}]
    out = csvtools.augment_with_existence(rows, base)
    assert out[0]['PTX Exists'] == 'YES'
    assert out[0]['Lesson Plan Exists'] == 'YES'
    assert out[0]['Step By Step Guide Exists'] == 'NO'


def test_default_cached_file(tmp_path: Path, monkeypatch):
    # ensure that reading with no path uses the cached directory
    cache = tmp_path / "utils" / "cached-csv"
    cache.mkdir(parents=True)
    file = cache / "Automatic Links.csv"
    file.write_text("A,B\n1,2\n")
    monkeypatch.setattr(csvtools, "cached_dir", lambda: cache)
    rows = csvtools.read_links_csv()
    assert rows == [{'A': '1', 'B': '2'}]
