"""Small helpers for working with PTX/plain text strings.

The helpers are trivial but shared by multiple modules; they used to live in
:mod:`utils.ptx` along with some more elaborate routines that have since been
removed.  Once nothing imports :mod:`utils.ptx` we can delete that file.
"""

from __future__ import annotations


def detect_newline(text: str) -> str:
    """Return the newline sequence used in *text*.

    Detect CRLF first, falling back to LF so that callers can re-write a file
    preserving its original line endings.
    """
    return "\r\n" if "\r\n" in text else "\n"


def indent_of_line(line: str) -> str:
    """Return the leading whitespace of ``line``.

    ``line.lstrip()`` removes the indentation; the slice back to the original
    length gives the amount retained.
    """
    return line[: len(line) - len(line.lstrip())]
