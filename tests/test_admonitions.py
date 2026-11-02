import markdown
from almanac.admonitions import AlertExtension


def render(text: str) -> str:
    """Returns the HTML without the newlines Markdown puts between block elements."""
    html = markdown.markdown(
        text, extensions=["admonition", "pymdownx.details", AlertExtension()]
    )
    return html.replace("\n", "")


def test_an_admonition_becomes_an_alert_of_its_kind():
    html = render('!!! tip "Write it once"\n    Body *text*.\n')
    assert '<div class="alert alert-teal admonition tip" role="note">' in html
    assert '<div class="alert-icon"><svg ' in html
    assert '<div class="alert-heading">Write it once</div>' in html
    assert '<div class="alert-description"><p>Body <em>text</em>.</p></div>' in html


def test_an_alias_takes_its_kinds_colour():
    assert 'class="alert alert-danger admonition error"' in render(
        "!!! error\n    Body.\n"
    )


def test_a_modifier_on_the_line_becomes_tablers_modifier():
    html = render('!!! warning important "Title"\n    Body.\n')
    assert 'class="alert alert-warning alert-important admonition warning"' in html


def test_a_modifier_alone_is_the_primary_colour():
    assert 'class="alert alert-primary alert-important admonition"' in render(
        "!!! important\n    Body.\n"
    )


def test_an_admonition_without_a_title_has_no_heading():
    html = render('!!! note ""\n    Body.\n')
    assert "alert-heading" not in html
    assert '<div class="alert-description"><p>Body.</p></div>' in html


def test_a_details_block_stays_collapsible_with_the_icon_in_its_summary():
    html = render('???+ bug "Seen once"\n    Body.\n')
    assert '<details class="alert alert-pink admonition bug" open="open">' in html
    assert '<summary class="alert-heading"><span class="alert-icon"><svg' in html
    assert "</svg></span>Seen once</summary>" in html
    assert '<div class="alert-description"><p>Body.</p></div></details>' in html


def test_nested_admonitions_are_each_drawn():
    html = render('!!! note "Outer"\n    !!! warning "Inner"\n        Body.\n')
    assert html.count('class="alert ') == 2
    assert html.index("alert-primary") < html.index("alert-warning")
