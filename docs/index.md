---
title: Almanac
data: [data/showcase.js]
map: true
description: "An MkDocs theme and plugin for reference sites, after Tabler's look. Every page shares the navbar and the header band, and its front matter picks the layout of its body."
---

Almanac draws an MkDocs site in the look of Tabler's dashboard: a navbar with a menu for each section of the site's `nav`, a header band naming the page, and the content on raised surfaces. The site opens from disk with no server, so its data, its lexicon and its diagrams come as scripts beside the pages.

## Two layouts

A page picks its body with `layout` in its front matter.

- **docs**, the default: the article as prose on one surface, with the page's contents in a column beside it that marks the section being read. On a narrower window the column gives way to a floating button.
- **cards**: each `##` section a card, for a page of figures and panels. The [components](components/content.md) are drawn that way.

The site's navigation is a navbar across the top, as here, or a sidebar down the left.

## What it carries

- The components under Components, each drawn live with its markup: alerts, tables, charts, tabs, forms, drawers and the rest, and the light, dark and accent settings in the navbar.
- Numbers bound to data: `<span data-value="showcase.pages"></span>` shows <span data-value="showcase.pages"></span>, read from a script the project writes.
- The lexicon's words explained where a page first uses them, as the layout and the header band are here.
- Mermaid diagrams, drawn in the browser in the theme's own colours and face.

```mermaid
flowchart LR
    md["docs/*.md"] --> mkdocs["MkDocs"]
    data["docs/data/*.js<br>the project's scripts"] --> site
    mkdocs --> theme["main.html<br>the shell"] --> site["site/*.html"]
    plugin["almanac plugin<br>cards, lexicon.js"] --> site
```

## The map

This page carries `map: true`, which draws the site's map under it: a card for each section, its pages with their descriptions, and a lit dot for a page's [standing](components/standing.md).
