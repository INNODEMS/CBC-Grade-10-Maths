import argparse
import pytest

from utils import cli


def test_all_inherits_pull_flags():
    parser = cli.build_parser()
    args = parser.parse_args(['all', '--clean', '--new'])
    assert args.command == 'all'
    # the options should appear on namespace (they're provided by parents)
    assert getattr(args, 'clean', False) is True
    assert getattr(args, 'new', False) is True


def test_all_inherits_validate_flags():
    parser = cli.build_parser()
    args = parser.parse_args([
        'all',
        '--base-dir', 'myrepo',
        '--cached',
        '--no-write-sheet',
    ])
    assert args.command == 'all'
    assert args.base_dir == 'myrepo'
    assert args.cached is True
    assert args.no_write is True


def test_individual_commands_still_parse():
    parser = cli.build_parser()
    # ensure existing subparsers still accept their flags
    args = parser.parse_args(['pull-plans', '--clean'])
    assert args.command == 'pull-plans'
    assert args.clean is True

    args = parser.parse_args(['validate-paths', '--cached'])
    assert args.command == 'validate-paths'
    assert args.cached is True

    # unknown flag on a subcommand should raise
    with pytest.raises(SystemExit):
        parser.parse_args(['pull-plans', '--no-write-sheet'])


def test_new_commands_parse():
    parser = cli.build_parser()
    args = parser.parse_args(['audit-questions'])
    assert args.command == 'audit-questions'

    args = parser.parse_args(['add-labels', '--search-dir', 'foo'])
    assert args.command == 'add-labels'
    assert args.search_dir == 'foo'


def test_add_labels_generate_label():
    # ensure generate_label returns the expected prefix and length
    label = cli.add_labels.generate_label(5)
    assert label.startswith('auto_')
    assert len(label) == 5 + len('auto_')
