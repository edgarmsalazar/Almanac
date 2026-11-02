from almanac.lexicon import lexicon_page, term_id

SOURCE = {
    "intro": "The words.",
    "groups": [{"name": "b", "title": "Second"}, {"name": "a", "title": "First"}],
    "terms": [
        {"term": "falling piece", "group": "a", "definition": "The piece in `play`.",
         "see": ["tile", "nowhere"], "not": [{"word": "mino", "why": "one name"}, "block"],
         "binds": "both", "added": "2026-09-17", "kind": "unit"},
        {"term": "tile", "group": "b", "definition": "A cell's worth <of> area."},
    ],
}


def test_term_id_is_the_slug_a_heading_would_have():
    assert term_id("falling piece") == "falling-piece"


def test_groups_come_in_the_lexicons_order_as_headings():
    page = lexicon_page(SOURCE, "")
    assert page.index("## Second") < page.index("## First")


def test_a_page_without_text_takes_the_intro_and_one_with_text_keeps_its_own():
    assert lexicon_page(SOURCE, "").startswith("The words.")
    assert lexicon_page(SOURCE, "Mine.\n").startswith("Mine.")


def test_a_term_is_a_card_with_its_id_group_and_escaped_text():
    page = lexicon_page(SOURCE, "")
    assert '<article class="card lexicon-term" id="tile" data-group="b"' in page
    assert "A cell's worth &lt;of&gt; area." in page
    assert "The piece in <code>play</code>." in page


def test_see_links_a_known_term_and_names_an_unknown_one():
    page = lexicon_page(SOURCE, "")
    assert '<a class="tag" href="#tile">tile</a>' in page
    assert '<span class="tag">nowhere</span>' in page


def test_not_strikes_each_word_and_gives_its_reason():
    page = lexicon_page(SOURCE, "")
    assert '<s>mino</s> <span class="lexicon-why">one name</span>; <s>block</s>' in page


def test_kind_binds_and_added_are_shown():
    page = lexicon_page(SOURCE, "")
    assert '<span class="badge">unit</span>' in page
    assert "Binds code and prose · Added 2026-09-17" in page


def test_a_lexicon_without_groups_has_no_headings_and_no_group_filter():
    page = lexicon_page({"terms": [{"term": "x", "definition": "y"}]}, "")
    assert "## " not in page
    assert "data-lexicon-groups" not in page
