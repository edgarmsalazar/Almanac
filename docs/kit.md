---
title: Pages by hand
description: "The kit outside MkDocs: the same stylesheets and scripts copied into a project of hand-written pages, a dashboard or a small app, opened from disk."
---

Every page of this site loads the same kit: the stylesheets, scripts and fonts under `source/almanac/ui/`, served at `almanac/`. A project that is not a site, a dashboard or a small app written as plain HTML, takes a copy of the kit and gets the same look and the same components, with no build step and no server.

## Copying the kit

From the Almanac repository:

```bash
scripts/export-ui.sh ../budget
```

The kit lands in `../budget/almanac/` with a `VERSION` file naming the Almanac version and commit it came from and the day it was copied. Running the script again replaces the copy with the current kit. A folder called `almanac/` that holds no `VERSION` was not made by the script, and the script leaves it alone.

The project holds its own copy rather than a link back here, so it can be zipped and moved to another computer whole.

## The first page

`almanac/starter.html` is a page shell to copy out of the kit as the project's first page: the navbar with its theme toggle and settings, the header band, a KPI card with a sparkline, a chart and a text card side by side, a sortable table, and the floating contents button. It loads everything in the right order.

```bash
cp ../budget/almanac/starter.html ../budget/index.html
```

For a sidebar instead of the navbar, the shell's comment points to the branch of the site's template that draws it.

## Implementation guidelines

The kit carries `almanac/GUIDELINES.md`, a specification for building on it: what a conforming project and page look like, the order a page loads the kit in, the contract of each component (its classes, attributes and script), the API and events, the rules for data, theming, libraries and accessibility, and the checks a finished page passes. It is written to be followed by whoever builds the pages, a person or a coding agent, without reading the kit's source. A coding agent can be pointed at it from the project's own instructions, for Claude Code a line `@almanac/GUIDELINES.md` in the project's `CLAUDE.md`.

## What a page loads

| File | Holds | Load it |
| --- | --- | --- |
| `css/theme.css` | The tokens: palette, grays, radii, fonts, light and dark | Always, first |
| `css/components.css` | Tabler's components: cards, tables, alerts, badges, the navbar and the rest | Always |
| `css/layout.css` | The [grid and utilities](components/grid.md) | Always |
| `css/app.css` | [Buttons, forms, dialogs, toasts, menus and pagination](components/forms.md); [card extras and small pieces](components/cards.md) | Always |
| `css/vendors.css` | The [libraries](components/libraries.md) in the theme's look | With a library, after `app.css` |
| `css/almanac.css` | Almanac's own layout pieces | Always |
| `css/dashboard.css` | The [dashboard](components/dashboard.md) pieces | Always: the KPI cards need it |
| `css/reference.css` | API reference pages | Only where one is |
| `js/settings.js` | The theme, before the page is painted | In `<head>` |
| `js/charts.js`, `js/plot.js` | Bar charts and canvas charts | In `<head>`, so the page's own script can draw |
| `js/navbar.js` | The navbar, dialogs, closing alerts | Straight after the navbar |
| The other scripts | One behaviour each: tables, tabs, filters, menus, toasts, popovers, the mini calendar, growing textareas, the contents button | At the foot of `<body>` |
| `vendor/` | Mermaid and KaTeX; Dropzone, FullCalendar and HugeRTE | Each only on a page that uses it, at the foot of `<body>` (Dropzone's stylesheet in `<head>`) |

Each script looks for its own markup and does nothing without it, so a page may load every one. The kit's `README.md` says what each binds and what it reads.

## Data from the project

A page opened from disk cannot fetch a JSON file, so the project's figures come as scripts that set a global, loaded before the page's own:

```html
<script src="data/budget.js"></script>
```

```js
window.ALMANAC_DATA = window.ALMANAC_DATA || {};
window.ALMANAC_DATA.budget = { total: 1630 };
```

`<span data-value="budget.total"></span>` then shows the number, and `<span data-value="budget.total" data-format="currency"></span>` shows it as `$1,630.00`, as [Numbers from data](writing-pages.md#numbers-from-data) describes for a site. Charts take their figures from the page's own script, and the period control from a JSON block in the page.

## What only a site has

Some of what this guide shows is drawn by MkDocs and the plugin, not by the kit: Markdown and its extensions (admonitions, tabbed sets, maths and diagrams written as fences), cards made from a page's `##` sections, the site's map, the lexicon and roadmap pages, page standing read from a status file, and the search index. A page written by hand writes the same markup directly: an alert, a card, a status dot are HTML that the kit draws wherever it finds them.
