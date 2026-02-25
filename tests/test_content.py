"""Unit tests for utils/content modules."""

from utils.content import objectives, resources, namespace


def test_objectives_insertion_simple():
    content = "<title>Foo</title>\n<para>"  # minimal
    new = objectives.insert_objectives(
        content,
        chapter="Ch",
        section="Sec",
        chapter_num="1.0",
        section_num="1.1",
        learning_outcomes=["LO1"],
    )
    assert new is not None
    assert "<objectives" in new


def test_objectives_skip_if_present():
    content = "<title>Foo</title><objectives component=\"outcomes\"/>"
    assert objectives.insert_objectives(content, "C", "S", "1.0", "1.1", ["x"]) is None


def test_namespace():
    txt = "<subsection>hi</subsection>"
    updated, count = namespace.add_namespace_to_text(txt)
    assert count == 1
    assert 'xmlns:xi' in updated


def test_resources_build_and_insert():
    indent = "    "
    block = resources.build_axiom(indent, "lp.pdf", None, "\n")
    assert "Lesson Plan" in block
    text = "</objectives>"
    new = resources.insert_axiom_if_missing(text, "lp.pdf", None)
    assert new is not None
    # second insertion does nothing
    assert resources.insert_axiom_if_missing(new, "lp.pdf", None) is None


def test_remove_old_and_upgrade():
    old = "<axiom>Offline lesson plan</axiom>"
    cleaned, removed = resources.remove_old_resource_boxes(old)
    assert removed == 1
    assert "Offline" not in cleaned

    lesson_only = "<axiom>Lesson Plan</axiom>"
    upgraded, count = resources.upgrade_lesson_only_resource_boxes(lesson_only, "lp", "step")
    assert count == 1
    assert "step-by-step" in upgraded.lower()
