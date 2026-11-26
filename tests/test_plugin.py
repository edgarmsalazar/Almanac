import pytest
from almanac.fences import example_format
from almanac.plugin import (
    drop_title,
    icon_svg,
    UI,
    inline_svg,
    kit_files,
    lexicon_entries,
    lexicon_script,
    search_script,
    standing_of,
    style_tables,
    wrap_sections,
)


def test_drop_title_removes_the_opening_h1_only():
    html = '<h1 id="a">A</h1>\n<p>text</p>\n<h1 id="b">B</h1>\n'
    assert drop_title(html) == '<p>text</p>\n<h1 id="b">B</h1>\n'


def test_wrap_sections_puts_each_markdown_h2_in_a_card():
    html = '<h2 id="one">One</h2>\n<p>first</p>\n<h2 id="two">Two</h2>\n<p>second</p>\n'
    wrapped = wrap_sections(html)
    assert wrapped.count('<div class="card">') == 2
    assert '<h2 class="card-title" id="one">One</h2>' in wrapped
    assert '<div class="prose"><p>second</p>\n</div>' in wrapped


def test_wrap_sections_takes_an_italic_first_paragraph_as_the_subtitle():
    html = '<h2 id="one">One</h2>\n<p><em>The point.</em></p>\n<p>body</p>\n'
    wrapped = wrap_sections(html)
    assert '<p class="card-subtitle">The point.</p>' in wrapped
    assert "<em>" not in wrapped


def test_wrap_sections_leaves_a_hand_written_card_title_alone():
    html = '<div class="card">\n  <h2 class="card-title">Mine</h2>\n</div>\n'
    assert wrap_sections(html) == html


@pytest.mark.parametrize(
    "intro, is_wrapped",
    [
        ("<p>intro</p>\n", True),
        ('<div class="card"><p>mine</p></div>\n', False),
    ],
)
def test_wrap_sections_wraps_the_intro_unless_it_holds_a_card(intro, is_wrapped):
    wrapped = wrap_sections(intro + '<h2 id="one">One</h2>\n<p>x</p>\n')
    assert wrapped.startswith('<div class="card"><div class="card-body">') is is_wrapped
    assert intro in wrapped


@pytest.mark.parametrize(
    "source",
    [
        {
            "terms": [
                {
                    "term": "card",
                    "definition": "A raised surface.",
                    "note": "n",
                    "added": "2026-01-01",
                }
            ]
        },
        [{"term": "card", "definition": "A raised surface.", "note": "n", "added": "2026-01-01"}],
    ],
)
def test_lexicon_entries_keeps_the_fields_terms_js_reads(source):
    assert lexicon_entries(source) == [
        {"term": "card", "definition": "A raised surface.", "note": "n"}
    ]


def test_lexicon_script_assigns_the_entries_to_almanac_data():
    script = lexicon_script([{"term": "card", "definition": "A raised surface."}])
    assert script.startswith("window.ALMANAC_DATA = window.ALMANAC_DATA || {};\n")
    assert '"term": "card"' in script


def test_style_tables_gives_a_bare_table_the_theme_classes():
    html = '<table>\n<tr><td>x</td></tr>\n</table>\n<table class="mine"></table>'
    assert style_tables(html) == (
        '<div class="table-responsive almanac-table"><table class="table">\n<tr><td>x</td></tr>\n</table></div>\n'
        '<table class="mine"></table>'
    )


def test_standing_of_takes_the_status_file_over_the_front_matter():
    meta = {"status": "built", "checked": "a1b2c3d", "title": "Page"}
    assert standing_of(meta, {"status": "drifted"}) == {
        "status": "drifted",
        "checked": "a1b2c3d",
    }


def test_standing_of_is_none_without_a_status():
    assert standing_of({"title": "Page"}, None) is None


def test_standing_of_refuses_an_unknown_status():
    with pytest.raises(ValueError, match="buit"):
        standing_of({"status": "buit"}, None)


def test_icon_svg_draws_a_tabler_icon_by_name():
    svg = icon_svg("x", "icon icon-sm")
    assert svg.startswith('<svg class="icon icon-sm" viewBox="0 0 24 24"')
    assert '<path d="M18 6l-12 12"/>' in svg


def test_icon_svg_refuses_an_unknown_name():
    with pytest.raises(KeyError, match="no-such-icon"):
        icon_svg("no-such-icon")


def test_inline_svg_drops_the_prologue_and_classes_the_root():
    text = '<?xml version="1.0"?>\n<!DOCTYPE svg>\n<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
    assert (
        inline_svg(text, "logo")
        == '<svg class="logo" xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
    )


def test_example_format_draws_the_html_and_shows_its_markup():
    html = example_format(
        '<span class="badge">new</span>', "example", "example", {}, None
    )
    assert (
        '<div class="almanac-example-preview">\n<span class="badge">new</span>\n</div>'
        in html
    )
    assert '<span class="nt">span</span>' in html


def test_search_script_keeps_the_entries_and_drops_the_configuration():
    index = {
        "config": {"lang": ["en"]},
        "docs": [{"location": "a.html#b", "title": "B", "text": "words", "boost": 2}],
    }
    assert search_script(index) == (
        'window.ALMANAC_SEARCH = {"docs": [{"location": "a.html#b", "title": "B", "text": "words"}]};\n'
    )


def test_kit_files_serve_the_kit_but_not_its_shell_or_notes():
    served = {path.relative_to(UI).as_posix() for path in kit_files()}
    assert {"css/theme.css", "js/settings.js", "vendor/mermaid.min.js"} <= served
    assert not served & {"starter.html", "README.md", "VERSION"}
