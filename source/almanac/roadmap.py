"""The roadmap's page: the project's stops on Tabler's timeline, drawn from a file.

A page whose front matter says roadmap: true gets the roadmap after its own
text, or the roadmap's intro where the page has none. Above it, a bar of how
many stops are reached. Then the stops in the file's order, a timeline for each
standing in turn (reached, under way, ahead), each stop a card with its items;
the route planned next as numbered steps, between the stops under way and those
ahead; and the pending work, a card for each of its groups. Each part is a ##
heading, so the page's contents list them; a stop's id is its name, so a link
to #the-replay lands on it.

The file is an object holding:

    intro       the page's text where the page has none, optional
    milestones  the stops, each with a name, a title, a status (reached,
                under way or ahead) and its items, and may have a version and
                the date it was reached
    planned     the route next, optional: a lead and its steps
    pending     what is on no stop yet, optional: a lead and its groups, each
                a title and its items

Any other field is left out. Items, steps and leads are Markdown; a stop's or
a group's title may hold `code` in backticks.
"""

import html

from almanac.lexicon import inline, term_id
from almanac.plugin import icon_svg

# Each standing's heading, its timeline icon and its status colour.
STANDINGS = {
    "reached": ("Reached", "check", "green"),
    "under way": ("Under way", "progress", "primary"),
    "ahead": ("Ahead", "circle-dashed", "secondary"),
}
ALIASES = {"underway": "under way", "under-way": "under way", "under_way": "under way"}


def standing(milestone: dict) -> str:
    """Returns a stop's standing, its status as the roadmap names it."""
    status = str(milestone.get("status", "ahead")).strip().lower()
    status = ALIASES.get(status, status)
    if status not in STANDINGS:
        raise ValueError(f"the roadmap: {milestone.get('name', milestone.get('title'))} has the status "
                         f"{status!r}, not one of {', '.join(STANDINGS)}")
    return status


def stop_id(milestone: dict) -> str:
    """Returns a stop's id on the page: its name, or its title's slug where it has none."""
    return term_id(str(milestone.get("name") or milestone["title"]))


def bullets(items: list) -> str:
    """Returns one Markdown list, an item per line."""
    return "\n".join(f"- {item}" for item in items)


def when(milestone: dict, status: str) -> str:
    """Returns a stop's version as a badge and the date it was reached, where it has them."""
    parts = []
    if milestone.get("version"):
        parts.append(f'<span class="badge">{inline(milestone["version"])}</span>')
    if milestone.get("date"):
        parts.append(f'<time datetime="{html.escape(str(milestone["date"]))}">{inline(milestone["date"])}</time>')
    elif status == "under way":
        parts.append("<span>under way</span>")
    return f'<span class="roadmap-when">{"".join(parts)}</span>' if parts else ""


def stop(milestone: dict, status: str) -> str:
    """Returns one stop on the timeline: its icon, and a card with its title, version, date and items."""
    _, icon, colour = STANDINGS[status]
    ident = stop_id(milestone)
    # Not a heading: forty stops would crowd the page's contents, which list the standings.
    head = (f'<div class="roadmap-stop-head"><a class="roadmap-stop-title" href="#{ident}">'
            f'{inline(milestone["title"])}</a>{when(milestone, status)}</div>')
    body = [head]
    if milestone.get("items"):
        body.append(bullets(milestone["items"]))
    return "\n\n".join([
        f'<div class="timeline-event roadmap-stop is-{colour}" id="{ident}" markdown>',
        f'<div class="timeline-event-icon">{icon_svg(icon)}</div>',
        '<div class="card timeline-event-card" markdown>',
        '<div class="card-body" markdown>',
        *body,
        "</div>",
        "</div>",
        "</div>",
    ])


def timeline(milestones: list[dict], status: str) -> str:
    """Returns one standing's stops as a timeline, under its heading."""
    title = STANDINGS[status][0]
    events = "\n\n".join(stop(milestone, status) for milestone in milestones)
    return (f"## {title}\n\n"
            f'<div class="timeline roadmap-timeline is-{status.replace(" ", "-")}" markdown>\n\n{events}\n\n</div>')


def summary(counts: dict[str, int]) -> str:
    """Returns the bar of how far the roadmap has come: a share for each standing, and a legend."""
    total = sum(counts.values()) or 1
    bars = "".join(
        f'<div class="progress-bar roadmap-bar-{colour}" style="width: {100 * counts[status] / total:.2f}%" '
        f'title="{counts[status]} {title.lower()}"></div>'
        for status, (title, _, colour) in STANDINGS.items() if counts[status] and status != "ahead")
    legend = "".join(
        f'<span class="roadmap-legend-item"><span class="status-dot status-{colour}"></span>'
        f'<strong>{counts[status]}</strong> {title.lower()}</span>'
        for status, (title, _, colour) in STANDINGS.items() if counts[status])
    label = f'{counts["reached"]} of {sum(counts.values())} stops reached'
    return (f'<div class="card roadmap-summary"><div class="card-body">'
            f'<div class="progress progress-lg progress-separated" role="img" aria-label="{label}">{bars}</div>'
            f'<div class="roadmap-legend">{legend}</div></div></div>')


def planned(route: dict) -> str:
    """Returns the route planned next: its lead, and its steps numbered on Tabler's vertical steps."""
    steps = "\n\n".join(f'<li class="step-item" markdown>\n\n{step}\n\n</li>' for step in route.get("steps", []))
    parts = ["## Planned"]
    if route.get("lead"):
        parts.append(route["lead"])
    if steps:
        parts.append(f'<ol class="steps steps-vertical steps-counter roadmap-steps" markdown>\n\n{steps}\n\n</ol>')
    return "\n\n".join(parts)


def pending(backlog: dict) -> str:
    """Returns the pending work: its lead, and a card for each of its groups."""
    cards = []
    for group in backlog.get("groups", []):
        items = group.get("items", [])
        cards.append("\n\n".join([
            '<div class="card roadmap-group" markdown>',
            f'<div class="card-header"><h3 class="card-title">{inline(group["title"])}</h3>'
            f'<span class="badge">{len(items)}</span></div>',
            '<div class="card-body" markdown>',
            bullets(items),
            "</div>",
            "</div>",
        ]))
    parts = ["## Pending"]
    if backlog.get("lead"):
        parts.append(backlog["lead"])
    if cards:
        parts.append('<div class="roadmap-groups" markdown>\n\n' + "\n\n".join(cards) + "\n\n</div>")
    return "\n\n".join(parts)


def roadmap_page(source: dict, own_text: str) -> str:
    """Returns the page's Markdown: its own text, or the roadmap's intro, then the bar, the stops, the route and the backlog."""
    milestones = source.get("milestones", [])
    by_standing = {status: [] for status in STANDINGS}
    for milestone in milestones:
        by_standing[standing(milestone)].append(milestone)
    counts = {status: len(stops) for status, stops in by_standing.items()}
    parts = [own_text.strip() or source.get("intro", "")]
    if milestones:
        parts.append(summary(counts))
    for status in ("reached", "under way"):
        if by_standing[status]:
            parts.append(timeline(by_standing[status], status))
    if source.get("planned"):
        parts.append(planned(source["planned"]))
    if by_standing["ahead"]:
        parts.append(timeline(by_standing["ahead"], "ahead"))
    if source.get("pending"):
        parts.append(pending(source["pending"]))
    return "\n\n".join(part for part in parts if part) + "\n"
