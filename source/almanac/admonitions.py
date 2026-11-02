"""Admonitions drawn as Tabler's alerts.

Python-Markdown's admonition (`!!! note "Title"`) and pymdownx.details
(`??? note`, `???+ note` open) write a box classed by its kind. This rewrites
each into the theme's alert: the kind picks the colour and the icon, as
Material for MkDocs names its kinds, aliases included, and the title becomes
the alert's heading. A collapsible one stays a `<details>`, its `<summary>` the
heading.

Tabler's modifiers ride along as further classes on the same line, so
`!!! warning important "Title"` is filled with its colour, `!!! note minor`
keeps a plain border. A kind alone that is a modifier, `!!! important`, is the
primary colour.

The plugin adds this extension itself; a site names only admonition and
pymdownx.details, as it would for any theme. mkdocstrings writes a docstring's
Note, Warning and See Also sections as such boxes straight into the page, past
Markdown, so the plugin turns those into alerts too (alert_details).
"""

import re
import xml.etree.ElementTree as etree

from markdown import Extension
from markdown.treeprocessors import Treeprocessor

from almanac.plugin import icon_nodes

# Each kind's alert colour and Tabler icon.
KINDS = {
    "note": ("primary", "pencil"),
    "abstract": ("cyan", "clipboard-text"),
    "info": ("info", "info-circle"),
    "tip": ("teal", "bulb"),
    "success": ("success", "circle-check"),
    "question": ("indigo", "help-circle"),
    "warning": ("warning", "alert-triangle"),
    "failure": ("danger", "circle-x"),
    "danger": ("danger", "bolt"),
    "bug": ("pink", "bug"),
    "example": ("purple", "flask"),
    "quote": ("secondary", "quote"),
    "see-also": ("secondary", "link"),
}
ALIASES = {
    "summary": "abstract", "tldr": "abstract",
    "todo": "info",
    "hint": "tip",
    "check": "success", "done": "success",
    "help": "question", "faq": "question",
    "caution": "warning", "attention": "warning",
    "fail": "failure", "missing": "failure",
    "error": "danger",
    "cite": "quote",
}
MODIFIERS = ("important", "minor")
DEFAULT = ("primary", "info-circle")


def icon_element(name: str, tag: str) -> etree.Element:
    """Returns Tabler's icon called name in a wrapper of the given tag, as the alert's icon."""
    wrapper = etree.Element(tag, {"class": "alert-icon"})
    svg = etree.SubElement(wrapper, "svg", {
        "class": "icon", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor",
        "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true"})
    for element, attributes in icon_nodes()[name]:
        etree.SubElement(svg, element, attributes)
    return wrapper


def alert_classes(classes: list[str]) -> tuple[str, str]:
    """Returns the alert's classes and its icon's name, from the classes Markdown gave the box."""
    modifiers = [name for name in classes if name in MODIFIERS]
    kinds = [name for name in classes if name not in MODIFIERS and name != "admonition"]
    kind = ALIASES.get(kinds[0], kinds[0]) if kinds else ""
    colour, icon = KINDS.get(kind, DEFAULT)
    names = ["alert", f"alert-{colour}"] + [f"alert-{name}" for name in modifiers] + ["admonition"] + kinds
    return " ".join(names), icon


def description(children: list[etree.Element]) -> etree.Element:
    """Returns the alert's body: the box's own children, moved into its description."""
    body = etree.Element("div", {"class": "alert-description"})
    body.extend(children)
    return body


# A box mkdocstrings wrote for a docstring section: one kind as its class, a bare summary.
SECTION_BOX = re.compile(r'<details class="([a-z-]+)"( open)?>\s*<summary>')


def icon_markup(name: str) -> str:
    """Returns the alert's icon, as a <span>, in text."""
    return etree.tostring(icon_element(name, "span"), encoding="unicode", method="html")


def alert_details(html: str) -> str:
    """Returns the page with each docstring section box mkdocstrings wrote drawn as a collapsible alert.

    Only the box's opening and its summary change, so its body, whatever it
    holds, is left as written; a box whose class is no kind, as the folded
    source is, is left alone.
    """
    def alert(found: re.Match) -> str:
        kind = found.group(1)
        if ALIASES.get(kind, kind) not in KINDS:
            return found.group(0)
        classes, icon = alert_classes([kind])
        return f'<details class="{classes}"{found.group(2) or ""}><summary class="alert-heading">{icon_markup(icon)}'
    return SECTION_BOX.sub(alert, html)


class AlertTreeprocessor(Treeprocessor):
    def run(self, root):
        boxes = [element for element in root.iter()
                 if element.tag == "details"
                 or (element.tag == "div" and "admonition" in (element.get("class") or "").split())]
        for box in boxes:
            if box.tag == "details":
                self.collapsible(box)
            else:
                self.admonition(box)

    def admonition(self, box: etree.Element) -> None:
        classes, icon = alert_classes((box.get("class") or "").split())
        children = list(box)
        title = children[0] if children and "admonition-title" in (children[0].get("class") or "").split() else None
        body = children[1:] if title is not None else children
        for child in children:
            box.remove(child)
        box.set("class", classes)
        box.set("role", "note")
        box.append(icon_element(icon, "div"))
        if title is not None:
            title.tag = "div"
            title.set("class", "alert-heading")
            box.append(title)
        if body:
            box.append(description(body))

    def collapsible(self, box: etree.Element) -> None:
        classes, icon = alert_classes((box.get("class") or "").split())
        children = list(box)
        summary = children[0] if children and children[0].tag == "summary" else None
        body = children[1:] if summary is not None else children
        for child in body:
            box.remove(child)
        box.set("class", classes)
        if summary is None:
            summary = etree.Element("summary")
            summary.text = "Details"
            box.insert(0, summary)
        summary.set("class", "alert-heading")
        mark = icon_element(icon, "span")
        mark.tail, summary.text = summary.text, None
        summary.insert(0, mark)
        if body:
            box.append(description(body))


class AlertExtension(Extension):
    def extendMarkdown(self, md):
        # After the inline pass, so a title's own Markdown is already drawn.
        md.treeprocessors.register(AlertTreeprocessor(md), "almanac-alerts", 15)
