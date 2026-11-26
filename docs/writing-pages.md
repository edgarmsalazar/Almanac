---
title: Writing pages
data: [data/showcase.js]
description: "The front matter Almanac reads, and how Markdown and raw HTML share a page."
---

## Front matter

| Key | What it does |
| --- | --- |
| `title` | The page's title in the header band and the tab. |
| `pretitle` | The small line above the title. The page's section in `nav` by default. |
| `description` | The lead under the title, and the page's meta description. |
| `layout` | `docs`, the default, or `cards`. |
| `data` | Scripts of data the page reads, loaded in its head before its own scripts. |
| `scripts` | The page's own scripts, loaded after its data. |

The page's own `# Title` is dropped, since the header band draws it.

## Markdown and HTML

MkDocs passes raw HTML through as it is, so a figure is written in HTML in the middle of Markdown. Three rules keep the two apart:

1. A line indented four spaces outside an HTML block is a code block. HTML pasted from elsewhere is dedented first.
2. Markdown inside an HTML block is read only where the block carries the `markdown` attribute, through `md_in_html`.
3. A page's inline `<script>` runs where it stands, after the data and scripts its front matter names.

## Numbers from data

A number the project measures is never typed into a page. The page names it by its path in `window.ALMANAC_DATA`, and the theme fills it in:

```html
<span data-value="showcase.sections"></span>
```

That gives <span data-value="showcase.sections"></span>. `data-format` says how to show it: `number`, the default, `currency`, `hex2`, `hex3` or `text`. A `currency` value is in the element's `data-currency`, else the page's `<html data-currency>`, else US dollars, with that currency's own decimals unless `data-decimals` gives others: `data-currency="EUR"` shows 1630 as €1,630.00.

## A card in a docs page

<div class="card" markdown>
<div class="card-body" markdown>

**A figure that wants a panel** is wrapped in `<div class="card" markdown>`, and the Markdown inside it is read as usual.

</div>
</div>
