"""Unit tests for utils/google.py helper logic."""

import pytest
from pathlib import Path

from utils import google
from googleapiclient.errors import HttpError


def test_retry_decorator_retries_and_clears_token(tmp_path: Path):
    # ensure there is a dummy token file to be removed
    token_file = tmp_path / "token.pickle"
    token_file.write_bytes(b"bogus")

    # monkey‑patch the module constant so decorator operates on our file
    old_token = google.TOKEN_FILE
    google.TOKEN_FILE = token_file

    calls = []

    @google.retry_on_auth_failure
    def flaky(value):
        calls.append(value)
        if len(calls) == 1:
            # simulate expired credentials
            raise HttpError(resp=type("R", (), {"status": 401})(), content=b"" )
        return "ok"

    result = flaky(123)
    assert result == "ok"
    # first run failed, second succeeded
    assert calls == [123, 123]
    # token file should have been removed by decorator
    assert not token_file.exists()

    # restore original constant
    google.TOKEN_FILE = old_token


def test_retry_decorator_propagates_non_auth_errors():
    @google.retry_on_auth_failure
    def boom():
        raise ValueError("bad")

    with pytest.raises(ValueError):
        boom()


def test_retry_decorator_raises_if_retry_also_fails(tmp_path: Path):
    # patch token file
    token_file = tmp_path / "token.pickle"
    token_file.write_bytes(b"bogus")
    old_token = google.TOKEN_FILE
    google.TOKEN_FILE = token_file

    @google.retry_on_auth_failure
    def always_fail():
        raise HttpError(resp=type("R", (), {"status": 403})(), content=b"" )

    with pytest.raises(HttpError):
        always_fail()
    # token should still be deleted even though retry failed
    assert not token_file.exists()

    google.TOKEN_FILE = old_token
