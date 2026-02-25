"""PreTeXt file text helpers.

This module contains string‑manipulation routines that are useful when
reading or modifying `.ptx` files.  None of the functions depend on the
filesystem; they operate solely on the text contents.  A small wrapper class
(`PtxFile`) is provided for callers that do want to work with a path.
"""

from __future__ import annotations
from pathlib import Path
from typing import Optional, Callable, Any


def detect_newline(text: str) -> str:
    """Return the newline sequence used in *text*.

    The function detects CRLF first, falling back to LF.  This allows us to
    preserve the original line endings of a file when writing back updates.
    """
    return "\r\n" if "\r\n" in text else "\n"


def indent_of_line(line: str) -> str:
    """Return the leading whitespace of a single line."""
    return line[: len(line) - len(line.lstrip())]


def insert_after(text: str, marker: str, block: str, *, require_unique: bool = True) -> Optional[str]:
    """Insert ``block`` into ``text`` immediately after the first occurrence
    of ``marker``.

    If ``require_unique`` is true the function first checks whether ``block``
    (stripped of surrounding whitespace) already appears in ``text``; if so it
    returns ``None``.

    Returns the updated string or ``None`` if the marker wasn't found or no
    insertion was needed.
    """
    if require_unique and block.strip() in text:
        return None
    idx = text.find(marker)
    if idx == -1:
        return None
    pos = idx + len(marker)
    newline = detect_newline(text)
    return text[:pos] + newline + block.replace("\n", newline) + text[pos:]


def remove_around(text: str, start_tag: str, end_tag: str) -> str:
    """Drop any block between ``start_tag`` and ``end_tag`` (inclusive).

    Useful for tidying legacy resource boxes, etc.  Returns the modified
    text; if no occurrences are found the original string is returned
    unchanged.
    """
    out = []
    i = 0
    n = len(text)
    while True:
        start = text.find(start_tag, i)
        if start == -1:
            out.append(text[i:])
            break
        end = text.find(end_tag, start)
        if end == -1:
            # malformed; bail out
            out.append(text[i:])
            break
        out.append(text[i:start])
        i = end + len(end_tag)
    return "".join(out)


class PtxFile:
    """A thin wrapper around a PTX file path.

    The ``update`` method makes it easy to apply a modifier function and
    automatically write the file back only when a change occurs.
    """

    def __init__(self, path: Path) -> None:
        self.path = path
        self._text: Optional[str] = None

    def read(self) -> str:
        if self._text is None:
            self._text = self.path.read_text(encoding="utf-8")
        return self._text

    def write(self, new_text: str) -> None:
        self.path.write_text(new_text, encoding="utf-8")
        self._text = new_text

    def update(self, modifier: Callable[[str], Optional[str]]) -> bool:
        """Run *modifier* on the current content.

        If the modifier returns a string that differs from the current content,
        the file is written and ``True`` is returned.  If the modifier returns
        ``None`` or an identical string, the file is left untouched and
        ``False`` is returned.
        """
        old = self.read()
        result = modifier(old)
        if result is not None and result != old:
            self.write(result)
            return True
        return False

    @property
    def newline(self) -> str:
        return detect_newline(self.read())
