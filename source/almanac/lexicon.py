"""The lexicon's page: every term drawn as a card, from the same file the tooltips read.

A page whose front matter says lexicon: true gets the lexicon after its own
text, or the lexicon's intro where the page has none. The terms come in groups,
each a ## heading, so the page's contents list the groups; a term is a card
under its group, its id the term's slug, so a link to #falling-piece lands on
it. Above them, a filter by words and by group, which lexicon.js runs; without
a script every term shows.

The file is a list of terms, or an object holding them under terms, with an
optional intro and groups ([{"name": ..., "title": ...}], in the order to show
them). A term has a term and a definition, and may have:

    group       the name of its group
    kind        a word for what sort of term it is, shown as a badge
    form        how the word is written or inflected
    example     the term in use
    not         the words it replaces: each a string or {"word", "why"}
    see         the terms it relates to, each linked where the lexicon has it
    note        anything further
    binds       what it binds: code, prose, or both
    added       the date it was added

Any other field is left out. Text may hold `code` in backticks.
"""

import html
import re

from markdown.extensions.toc import slugify

CODE = re.compile(r"`([^`]+)`")
BINDS = {"both": "Binds code and prose", "code": "Binds code", "prose": "Binds prose"}
FIELDS = (("form", "Form"), ("example", "Example"))


def inline(text: str) -> str:
    """Returns text escaped for a page, its backticked spans as code."""
    return CODE.sub(r"<code>\1</code>", html.escape(str(text), quote=False))


def term_id(term: str) -> str:
    """Returns a term's id on the page: its slug, as a heading of the same words would have."""
    return slugify(term, "-")


def terms_of(source: object) -> list[dict]:
    """Returns the lexicon's terms, from a list or an object holding them under terms."""
    return source["terms"] if isinstance(source, dict) else list(source)


def not_line(words: list) -> str:
    """Returns the words a term replaces, each struck through, with why where given."""
    parts = []
    for word in words:
        if isinstance(word, dict):
            why = f' <span class="lexicon-why">{inline(word["why"])}</span>' if word.get("why") else ""
            parts.append(f'<s>{inline(word["word"])}</s>{why}')
        else:
            parts.append(f"<s>{inline(word)}</s>")
    return "; ".join(parts)


def see_line(names: list, known: set[str]) -> str:
    """Returns the related terms as tags, each a link where the lexicon has it."""
    tags = []
    for name in names:
        if name in known:
            tags.append(f'<a class="tag" href="#{term_id(name)}">{inline(name)}</a>')
        else:
            tags.append(f'<span class="tag">{inline(name)}</span>')
    return f'<span class="tags-list">{"".join(tags)}</span>'


def card(entry: dict, known: set[str]) -> str:
    """Returns one term's card."""
    term = entry["term"]
    words = " ".join(str(entry.get(key, "")) for key in ("term", "definition", "form", "example", "note"))
    head = f'<h3 class="lexicon-word"><a href="#{term_id(term)}">{inline(term)}</a></h3>'
    if entry.get("kind"):
        head += f'<span class="badge">{inline(entry["kind"])}</span>'
    fields = [(label, inline(entry[key])) for key, label in FIELDS if entry.get(key)]
    if entry.get("not"):
        fields.append(("Not", not_line(entry["not"])))
    if entry.get("see"):
        fields.append(("See", see_line(entry["see"], known)))
    body = [f'<div class="lexicon-head">{head}</div>',
            f'<p class="lexicon-definition">{inline(entry["definition"])}</p>']
    if fields:
        body.append('<dl class="lexicon-fields">' + "".join(f"<dt>{label}</dt><dd>{value}</dd>" for label, value in fields) + "</dl>")
    if entry.get("note"):
        body.append(f'<p class="lexicon-note">{inline(entry["note"])}</p>')
    meta = [BINDS.get(entry["binds"], inline(entry["binds"])) if entry.get("binds") else "",
            f'Added {inline(entry["added"])}' if entry.get("added") else ""]
    meta = " · ".join(part for part in meta if part)
    foot = f'<div class="card-footer lexicon-meta">{meta}</div>' if meta else ""
    return (f'<article class="card lexicon-term" id="{term_id(term)}" data-group="{html.escape(entry.get("group", ""))}" '
            f'data-words="{html.escape(words.lower())}"><div class="card-body">{"".join(body)}</div>{foot}</article>')


def groups_of(source: object, terms: list[dict]) -> list[tuple[str, str]]:
    """Returns the groups as (name, title), in the lexicon's order, then any it does not list."""
    listed = source.get("groups", []) if isinstance(source, dict) else []
    groups = [(group["name"], group.get("title", group["name"])) for group in listed]
    named = {name for name, _ in groups}
    for entry in terms:
        name = entry.get("group", "")
        if name not in named:
            groups.append((name, name.capitalize() if name else "Terms"))
            named.add(name)
    return groups


def tools(groups: list[tuple[str, str]], terms: list[dict]) -> str:
    """Returns the filter above the terms: a search field, and a tag a group when there are several."""
    search = ('<div class="input-icon"><span class="input-icon-addon"><svg class="icon" viewBox="0 0 24 24" fill="none" '
              'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
              '<path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg></span>'
              '<input class="form-control" type="search" placeholder="Filter the terms" aria-label="Filter the terms" '
              'data-lexicon-filter></div>')
    chips = ""
    if len(groups) > 1:
        counts = {name: sum(1 for entry in terms if entry.get("group", "") == name) for name, _ in groups}
        chips = (f'<div class="tags-list" data-lexicon-groups><button class="tag active" type="button" data-group="">All '
                 f'<span class="tag-count">{len(terms)}</span></button>'
                 + "".join(f'<button class="tag" type="button" data-group="{html.escape(name)}">{inline(title)} '
                           f'<span class="tag-count">{counts[name]}</span></button>' for name, title in groups)
                 + "</div>")
    return f'<div class="lexicon-tools" data-lexicon-tools hidden>{search}{chips}</div>'


def lexicon_page(source: object, own_text: str) -> str:
    """Returns the page's Markdown: its own text, or the lexicon's intro, then the filter and every group of terms."""
    terms = terms_of(source)
    known = {entry["term"] for entry in terms}
    intro = own_text.strip() or (source.get("intro", "") if isinstance(source, dict) else "")
    groups = groups_of(source, terms)
    parts = [intro, tools(groups, terms)]
    for name, title in groups:
        members = [entry for entry in terms if entry.get("group", "") == name]
        if not members:
            continue
        if len(groups) > 1:
            parts.append(f"## {title}")
        parts.append(f'<div class="lexicon-grid" data-group="{html.escape(name)}">'
                     + "".join(card(entry, known) for entry in members) + "</div>")
    parts.append('<p class="lexicon-none" hidden>No term holds those words.</p>')
    return "\n\n".join(part for part in parts if part) + "\n"
