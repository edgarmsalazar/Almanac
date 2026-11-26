"""Almanac's plugin: what the theme's template cannot do alone.

A page's own # title is dropped, since the header band draws it, and a Markdown
table takes the theme's table classes. On a page whose front matter says
layout: cards, each ## section Markdown wrote becomes a card. The lexicon is
written as data/lexicon.js, a script rather than JSON, so a site opened from
disk reads it without a server; so is the search plugin's index, as
search/search_index.js. Each page's standing, from its front matter
and the status file, is set where the template reads it. The template gets
two helpers: almanac_icon, a Tabler icon by name, and almanac_svg, an SVG file
from the docs drawn inline so the page's colours reach it. Admonitions are
drawn as Tabler's alerts, by a Markdown extension the plugin adds (admonitions.py).
A page whose front matter says lexicon: true gets every term of the lexicon as
a card (lexicon.py); one that says roadmap: true gets the roadmap's stops on a
timeline (roadmap.py). The kit, ui/, the stylesheets, scripts and fonts a page
written by hand loads as well, is served under almanac/.
"""

import json
import re
from functools import cache
from pathlib import Path

from markupsafe import Markup
from mkdocs.config import config_options
from mkdocs.config.base import Config
from mkdocs.plugins import BasePlugin, event_priority
from mkdocs.structure.files import File

from almanac.lexicon import lexicon_page

# A heading Markdown wrote sits at the start of a line with an id alone; a
# hand-written card's <h2 class="card-title"> does not, and is left as it is.
SECTION = re.compile(r'^<h2 id="([^"]+)">(.*?)</h2>\n', re.MULTILINE)
SUBTITLE = re.compile(r'^<p><em>(.*?)</em></p>\n?', re.DOTALL)
TITLE = re.compile(r'^<h1[^>]*>.*?</h1>\n?')
# Markdown writes a table bare, and never one inside another; a hand-written one has its own class.
TABLE = re.compile(r'<table>(.*?)</table>', re.DOTALL)
SVG_OPEN = re.compile(r'<svg\b', re.IGNORECASE)
XML_PROLOGUE = re.compile(r'^\s*(<\?xml[^>]*\?>\s*)?(<!DOCTYPE[^>]*>\s*)?', re.IGNORECASE)
LEXICON_FIELDS = ("term", "definition", "note")
STANDING_FIELDS = ("status", "checked", "checked_date", "why", "commits", "files")
STANDINGS = ("built", "designed", "drifted", "disagrees")
ICONS = Path(__file__).parent / "icons" / "tabler-nodes-outline.json"
# The kit, and what in it a site does not serve: the page shell to copy and the kit's own notes.
UI = Path(__file__).parent / "ui"
UI_UNSERVED = ("starter.html", "README.md", "VERSION")
ICON_ATTRIBUTES = ('viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
                   'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"')


def drop_title(html: str) -> str:
    """Returns the page without the # title it opens with."""
    return TITLE.sub("", html, count=1)


def style_tables(html: str) -> str:
    """Returns the page with each bare table in the theme's classes, in a box that scrolls sideways."""
    return TABLE.sub(r'<div class="table-responsive almanac-table"><table class="table">\1</table></div>', html)


def card(anchor: str, title: str, body: str) -> str:
    """Returns one section as a card; an italic paragraph straight under its heading is the subtitle.

    The heading keeps its id, so the page's contents and the search index find
    the section by it.
    """
    subtitle = ""
    found = SUBTITLE.match(body)
    if found:
        subtitle = f'<p class="card-subtitle">{found.group(1)}</p>'
        body = body[found.end():]
    return (
        f'<div class="card"><div class="card-header"><div class="card-header-titles">'
        f'<h2 class="card-title" id="{anchor}">{title}</h2>{subtitle}</div></div>'
        f'<div class="card-body"><div class="prose">{body}</div></div></div>\n'
    )


def wrap_sections(html: str) -> str:
    """Returns the page with each ## section in a card.

    What comes before the first section goes in a card of its own, unless it
    holds a hand-written card already.
    """
    parts = SECTION.split(html)
    if len(parts) == 1:
        return html
    intro, rest = parts[0], parts[1:]
    cards = [f'<div class="card"><div class="card-body"><div class="prose">{intro}</div></div></div>\n'] if intro.strip() and 'class="card' not in intro else [intro]
    cards += [card(*rest[i:i + 3]) for i in range(0, len(rest), 3)]
    return "".join(cards)


def lexicon_entries(source: object) -> list[dict]:
    """Returns the terms terms.js reads, from a lexicon given as a list or as {"terms": [...]}."""
    terms = source["terms"] if isinstance(source, dict) else source
    return [{field: term[field] for field in LEXICON_FIELDS if field in term} for term in terms]


def lexicon_script(entries: list[dict]) -> str:
    """Returns data/lexicon.js's text."""
    return ("window.ALMANAC_DATA = window.ALMANAC_DATA || {};\n"
            f"window.ALMANAC_DATA.lexicon = {json.dumps(entries, indent=1, ensure_ascii=False)};\n")


def search_script(index: dict) -> str:
    """Returns search/search_index.js's text: the search plugin's entries, without its configuration."""
    docs = [{"location": doc["location"], "title": doc["title"], "text": doc["text"]} for doc in index["docs"]]
    return f"window.ALMANAC_SEARCH = {json.dumps({'docs': docs}, ensure_ascii=False)};\n"


def standing_of(meta: dict, recorded: dict | None) -> dict | None:
    """Returns a page's standing: the status file's record, over the page's front matter.

    None where neither gives a status. A status outside the four is refused, so
    a typo does not draw a page as checked.
    """
    standing = {field: meta[field] for field in STANDING_FIELDS if field in meta}
    standing.update({field: recorded[field] for field in STANDING_FIELDS if recorded and field in recorded})
    if "status" not in standing:
        return None
    if standing["status"] not in STANDINGS:
        raise ValueError(f"status {standing['status']!r} is not one of {', '.join(STANDINGS)}")
    return standing


@cache
def kit_files() -> list[Path]:
    """Returns every file of the kit a site serves, the page shell and the kit's notes left out."""
    return sorted(path for path in UI.rglob("*")
                  if path.is_file() and path.name not in UI_UNSERVED and not path.name.startswith("."))


def icon_nodes() -> dict:
    """Returns Tabler's outline icons, each a list of [element, attributes]."""
    return json.loads(ICONS.read_text(encoding="utf-8"))


def icon_svg(name: str, css_class: str = "icon") -> Markup:
    """Returns Tabler's outline icon called name, inline, drawn in currentColor."""
    nodes = icon_nodes().get(name)
    if nodes is None:
        raise KeyError(f"no Tabler icon called {name!r}")
    inner = "".join(
        f"<{element} " + " ".join(f'{key}="{value}"' for key, value in attributes.items()) + "/>"
        for element, attributes in nodes)
    return Markup(f'<svg class="{css_class}" {ICON_ATTRIBUTES}>{inner}</svg>')


def inline_svg(text: str, css_class: str) -> Markup:
    """Returns an SVG file's text ready to sit in a page: its prologue gone, the class on its root."""
    text = XML_PROLOGUE.sub("", text, count=1)
    return Markup(SVG_OPEN.sub(f'<svg class="{css_class}"', text, count=1))


class AlmanacConfig(Config):
    # A path under docs_dir to the site's lexicon; without it the tooltips have no words.
    lexicon = config_options.Optional(config_options.Type(str))
    # A path under docs_dir to a JSON object of standings by page source path,
    # which a project's own tooling writes; it wins over a page's front matter.
    status = config_options.Optional(config_options.Type(str))
    # A path under docs_dir to the site's roadmap, which a roadmap: true page draws.
    roadmap = config_options.Optional(config_options.Type(str))


class AlmanacPlugin(BasePlugin[AlmanacConfig]):
    def on_config(self, config):
        # Imported here: admonitions.py takes its icons from this module.
        from almanac.admonitions import AlertExtension
        config.markdown_extensions.append(AlertExtension())
        # The roadmap's items are Markdown inside its cards.
        if "md_in_html" not in config.markdown_extensions:
            config.markdown_extensions.append("md_in_html")
        self.lexicon = None
        if self.config.lexicon:
            self.lexicon = json.loads((Path(config["docs_dir"]) / self.config.lexicon).read_text(encoding="utf-8"))
        self.roadmap = None
        if self.config.roadmap:
            self.roadmap = json.loads((Path(config["docs_dir"]) / self.config.roadmap).read_text(encoding="utf-8"))
        self.recorded = {}
        if self.config.status:
            source = Path(config["docs_dir"]) / self.config.status
            self.recorded = json.loads(source.read_text(encoding="utf-8"))
        return config

    def on_files(self, files, config):
        # A file of the docs at the same path wins, as it does over the theme's own.
        for path in kit_files():
            uri = f"almanac/{path.relative_to(UI).as_posix()}"
            if files.get_file_from_path(uri) is None:
                files.append(File.generated(config, uri, abs_src_path=str(path)))
        return files

    def on_serve(self, server, config, builder):
        server.watch(str(UI))
        return server

    def on_env(self, env, config, files):
        docs = Path(config["docs_dir"])
        env.globals["almanac_icon"] = icon_svg
        env.globals["almanac_svg"] = lambda path, css_class="icon": inline_svg(
            (docs / path).read_text(encoding="utf-8"), css_class)
        return env

    def on_page_markdown(self, markdown, page, config, files):
        page.meta["standing"] = standing_of(page.meta, self.recorded.get(page.file.src_uri))
        if page.meta.get("lexicon") is True and self.lexicon is not None:
            markdown = lexicon_page(self.lexicon, markdown)
        if page.meta.get("roadmap") is True and self.roadmap is not None:
            # Imported here: roadmap.py takes its icons from this module.
            from almanac.roadmap import roadmap_page
            markdown = roadmap_page(self.roadmap, markdown)
        return markdown

    def on_page_content(self, html, page, config, files):
        from almanac.admonitions import alert_details
        html = alert_details(style_tables(drop_title(html)))
        if page.meta.get("layout") == "cards":
            html = wrap_sections(html)
        return html

    # Late, so the search plugin has written its index whichever order the two are named in.
    @event_priority(-100)
    def on_post_build(self, config):
        index = Path(config["site_dir"]) / "search" / "search_index.json"
        if index.exists():
            script = search_script(json.loads(index.read_text(encoding="utf-8")))
            index.with_suffix(".js").write_text(script, encoding="utf-8")
        entries = lexicon_entries(self.lexicon) if self.lexicon is not None else []
        out = Path(config["site_dir"]) / "data" / "lexicon.js"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(lexicon_script(entries), encoding="utf-8")
