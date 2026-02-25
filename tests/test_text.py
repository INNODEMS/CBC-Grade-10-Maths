"""Unit tests for :mod:`utils.text`."""

from utils import text


def test_detect_newline():
    assert text.detect_newline("a\nb") == "\n"
    assert text.detect_newline("a\r\nb") == "\r\n"


def test_indent_of_line():
    assert text.indent_of_line("    foo") == "    "
    assert text.indent_of_line("noindent") == ""
