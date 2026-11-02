---
title: Setting up
description: "Installing the theme into a project's environment and pointing its mkdocs.yml at it."
---

## Installing

Almanac is a Python package. Install it into the environment that builds the site, from its folder while it has no release:

```bash
pip install -e ../Almanac
```

In a project whose environment is a conda `environment.yml`, it goes under `pip:`:

```yaml
dependencies:
  - python=3.12
  - pip
  - pip:
      - -e ../Almanac
```

## The site's configuration

```yaml
use_directory_urls: false   # pages as files, so the site opens from disk

theme:
  name: almanac
  icon: images/icon.svg     # optional, a path under docs_dir; an .svg is drawn inline
  navigation: navbar        # or sidebar
  sections:                 # optional, each section or top-level page of nav by its title
    Guide: {icon: book, about: "Installing and writing."}
    Changelog: {icon: history}   # a top-level page takes an icon too
  commit_url: https://github.com/you/project/commit/   # optional, for page standing

plugins:
  - search
  - almanac:
      lexicon: lexicon.json # optional, a path under docs_dir
      roadmap: roadmap.json # optional, a path under docs_dir
      status: page-status.json # optional, each page's standing, under docs_dir

markdown_extensions:
  - attr_list
  - md_in_html
  - admonition         # optional, !!! note boxes, drawn as alerts
  - pymdownx.details   # optional, ??? note boxes that fold
  - pymdownx.tabbed:   # optional, === "Tab" sets, drawn as Tabler's card tabs
      alternate_style: true
  - pymdownx.arithmatex:  # optional, maths typeset by KaTeX, which ships with the theme
      generic: true
  - toc
  - pymdownx.highlight
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_div_format
        - name: example     # optional, HTML drawn live with its markup beneath
          class: example
          format: !!python/name:almanac.fences.example_format
```

A `plugins:` list replaces MkDocs' default one, so `search` is named again beside `almanac`.

## The lexicon

The plugin reads the file named by `lexicon` and writes `data/lexicon.js`, from which a page explains each term where it first uses it. The file is a list of terms, or an object holding them under `terms`, with an optional `intro` and `groups`. Each term has a `term` and a `definition`, and may have a `group`, `kind`, `form`, `example`, `not` (the words it replaces), `see`, `note`, `binds` and `added`. Any other field is left out.

A page whose front matter says `lexicon: true` draws the whole lexicon: a card a term, under its group's heading, with a filter by word and by group above them. Its own text, if it has any, comes first; otherwise the lexicon's `intro`. [The lexicon](lexicon.md) is this guide's.

## The roadmap

A page whose front matter says `roadmap: true` draws the file named by `roadmap`: a bar of how many stops are reached, then the stops on Tabler's timeline, a heading for each standing. The route planned next sits between the stops under way and those ahead, as numbered steps, and the pending work closes the page, a card for each group. Its own text, if it has any, comes first; otherwise the roadmap's `intro`.

The file is an object holding `milestones`, and may hold `intro`, `planned` and `pending`. A milestone has a `name` (its id on the page), a `title`, a `status` (`reached`, `under way` or `ahead`) and its `items`, and may have a `version` and a `date`. `planned` is a `lead` and its `steps`; `pending` is a `lead` and its `groups`, each a `title` and its `items`. Items, steps and leads are Markdown. [The roadmap](roadmap.md) is this guide's.


## The site's icon

An `.svg` icon is drawn inline beside the site's name, so its colours can follow the page's: `currentColor` takes the navbar's text colour, and `style="fill: var(--primary)"` the accent the reader chose. The tab's icon is made from it, and changes with the theme.

## Theme settings

A reader chooses light or dark, the base gray, the accent, the corners and the font in the navbar's panel. The defaults are Neutral and Barlow; the choice is remembered in the browser, and a link can set one: `?theme-primary=teal`.

## Search

With the `search` plugin named, a search field sits in the navbar, or at the top of the sidebar, in Tabler's style. Every word typed must be found, a title's match ranks above the text's, and each section of a page is its own result. `/` or Ctrl K (⌘K on a Mac) puts the cursor in it; the arrows move through the results and Enter opens one. The almanac plugin writes the search plugin's index again as a script, so the search works from disk too.
