"""The example fence: a block of HTML drawn live, with its markup shown under it.

Named in a site's mkdocs.yml as a pymdownx.superfences custom fence:

    custom_fences:
      - name: example
        class: example
        format: !!python/name:almanac.fences.example_format

A script inside the block runs where it stands, so a component a script draws
is shown drawn.
"""

from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import HtmlLexer

FORMATTER = HtmlFormatter(wrapcode=True)


def example_format(source, language, css_class, options, md, **kwargs):
    """Returns the example's HTML as it is, and its markup coloured beneath."""
    code = highlight(source, HtmlLexer(), FORMATTER)
    return (f'<div class="almanac-example"><div class="almanac-example-preview">\n{source}\n</div>'
            f'<div class="almanac-example-code">{code}</div></div>')
