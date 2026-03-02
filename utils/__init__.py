"""Utility package for CBC-Grade-10-Maths helpers.

This package exposes a small set of top-level convenience imports so that
other code can write ``from utils import csvtools, reports`` instead of
mentioning the submodules directly.
"""

# expose a convenient flat import surface while the files live in
# more specific packages beneath ``helpers`` and ``audits``.
from .helpers import google, csvtools, text
from .audits import reports, audit_questions
from . import content

__all__ = ["google", "csvtools", "text", "reports", "audit_questions", "content"]
