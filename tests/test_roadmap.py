import pytest

from almanac.roadmap import roadmap_page

SOURCE = {
    "intro": "The shape.",
    "milestones": [
        {"name": "grid", "title": "The grid", "status": "reached", "version": "v0.1", "date": "2026-09-26",
         "items": ["The `grid` as data."]},
        {"name": "replay", "title": "The replay", "status": "under way", "version": "v0.2", "items": ["A record."]},
        {"name": "channel", "title": "The channel", "status": "ahead", "items": ["The queues."]},
    ],
    "planned": {"lead": "In order.", "steps": ["First.", "Second."]},
    "pending": {"lead": "In no order.", "groups": [{"title": "Engine", "items": ["A fill.", "A piece."]}]},
}


def test_a_page_without_text_takes_the_intro_and_one_with_text_keeps_its_own():
    assert roadmap_page(SOURCE, "").startswith("The shape.")
    assert roadmap_page(SOURCE, "Mine.\n").startswith("Mine.")


def test_the_parts_come_reached_under_way_planned_ahead_pending():
    page = roadmap_page(SOURCE, "")
    headings = [line for line in page.splitlines() if line.startswith("## ")]
    assert headings == ["## Reached", "## Under way", "## Planned", "## Ahead", "## Pending"]


def test_a_stop_is_a_timeline_event_with_its_id_colour_version_and_items():
    page = roadmap_page(SOURCE, "")
    assert '<div class="timeline-event roadmap-stop is-green" id="grid" markdown>' in page
    assert '<span class="badge">v0.1</span><time datetime="2026-09-26">2026-09-26</time>' in page
    assert "- The `grid` as data." in page
    assert 'id="replay"' in page and "<span>under way</span>" in page


def test_the_bar_counts_each_standing():
    page = roadmap_page(SOURCE, "")
    assert 'aria-label="1 of 3 stops reached"' in page
    assert "<strong>1</strong> ahead" in page


def test_the_route_is_numbered_steps_and_the_backlog_a_card_a_group():
    page = roadmap_page(SOURCE, "")
    assert '<ol class="steps steps-vertical steps-counter roadmap-steps" markdown>' in page
    assert page.count('<li class="step-item" markdown>') == 2
    assert '<h3 class="card-title">Engine</h3><span class="badge">2</span>' in page


def test_a_status_written_as_one_word_is_under_way_and_an_unknown_one_is_refused():
    assert 'id="x"' in roadmap_page({"milestones": [{"name": "x", "title": "X", "status": "underway"}]}, "")
    with pytest.raises(ValueError, match="done"):
        roadmap_page({"milestones": [{"name": "x", "title": "X", "status": "done"}]}, "")
