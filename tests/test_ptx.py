"""Unit tests for utils/ptx.py."""

from utils import ptx


def test_detect_newline():
    assert ptx.detect_newline("a\nb") == "\n"
    assert ptx.detect_newline("a\r\nb") == "\r\n"


def test_indent_of_line():
    assert ptx.indent_of_line("    foo") == "    "
    assert ptx.indent_of_line("noindent") == ""


def test_insert_after():
    base = "<title>hi</title>more"
    block = "<objectives/>"
    result = ptx.insert_after(base, "</title>", block)
    assert "<objectives/>" in result
    # insertion idempotent
    assert ptx.insert_after(result, "</title>", block) is None


def test_remove_around():
    text = "before<start>drop</start>after"
    assert ptx.remove_around(text, "<start>", "</start>") == "beforeafter"
