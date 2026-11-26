# The Almanac kit

The stylesheets, scripts and fonts behind every Almanac page, whether MkDocs built it or it was written by hand. Nothing here needs a build step or a server: a page opened from disk works.

To use it in a project, copy it there with `scripts/export-ui.sh <project>` from the Almanac repository. The copy lands in `<project>/almanac/` with a `VERSION` file saying which Almanac it came from; run the script again to update it. Then copy `starter.html` out of it as the project's first page.

## What is here

| Path | Holds |
| --- | --- |
| `css/theme.css` | The design tokens: palette, gray ramps, radii, fonts, light and dark. The `data-theme-*` attributes on `<html>` pick among them. |
| `css/components.css` | Tabler's components, ported by hand: cards, tables, alerts, badges, status, steps, the navbar, the offcanvas panel and the rest. |
| `css/almanac.css` | Almanac's own layout: the header band's lead, the docs layout and its contents column, the pager, search, examples, maths, and the lexicon and roadmap pages. |
| `css/reference.css` | API reference pages, as mkdocstrings writes them. Load it only where one is. |
| `js/` | One script a behaviour. Each looks for its own markup and does nothing without it. |
| `fonts/` | Lexend, Exo 2, Barlow and Fira Code, each with its licence. |
| `vendor/` | Mermaid and KaTeX, unchanged. Load them only on a page with a diagram or maths. |
| `starter.html` | A page shell to copy: navbar, header band, a body of cards. |

## Loading order

Stylesheets in the order above, `theme.css` first. In `<head>`, `js/settings.js` before anything is painted, since it sets the theme; `js/charts.js` there too, so a page's own script can draw a chart. `js/navbar.js` straight after the navbar. Every other script at the foot of `<body>`. `starter.html` does all of this.

## The scripts

| Script | Binds | Reads |
| --- | --- | --- |
| `settings.js` | `#theme-toggle`, `#theme-settings-open`, and the theme settings panel it builds. Gives the other scripts `Almanac` helpers: copy, download, the address hash. | The `?theme-…=` address, then the browser's saved choices. |
| `navbar.js` | `.navbar` menus and toggler, `[data-open]` buttons for a `<dialog>`, `[data-close]`, `[data-almanac-icon]`. | |
| `toc.js` | The floating contents button `#toc-toggle` and its panel `#toc`, for a page of cards. | The cards' `.card-title`s. |
| `almanac.js` | The docs layout's contents column, `[data-almanac-toc]`. | |
| `table.js` | `.table-sort` buttons, `data-table-export` copy and CSV buttons. | Each cell's `data-sort-value`, else its text. |
| `charts.js` | Nothing by itself: `Almanac.charts.bars(element, {...})`, described at the top of the file. | |
| `data.js` | `[data-value="path"]`, filled from `window.ALMANAC_DATA`. | A script that sets `window.ALMANAC_DATA`, loaded first. |
| `code.js` | `pre.highlight[data-lang]` and `.code-block`: colours, headers, copy buttons. | |
| `terms.js` | The first use of each lexicon term in `.page-body`, given a tooltip. | `window.ALMANAC_DATA.lexicon`. |
| `lexicon.js` | The lexicon page's filter, `[data-lexicon-tools]`. | |
| `search.js` | `form[data-almanac-search]`. | `window.ALMANAC_SEARCH`, loaded from the form's `data-index` on first use. |
| `diagrams.js` | `.mermaid`. | `vendor/mermaid.min.js`, loaded first. |
| `maths.js` | `.arithmatex`. | `vendor/katex/`, loaded first. |

## The data a page supplies

Each is a script setting a global, not JSON, so a page opened from disk can load it.

```js
// Numbers for data.js: <span data-value="budget.total"></span>
window.ALMANAC_DATA = window.ALMANAC_DATA || {};
window.ALMANAC_DATA.budget = { total: 1630 };

// Terms for terms.js
window.ALMANAC_DATA.lexicon = [
  { term: "envelope", definition: "Money set aside for one kind of spending.", note: "optional" }
];

// The search index, at the path in the form's data-index. A location with a
// #fragment is a section of the page before it.
window.ALMANAC_SEARCH = { docs: [
  { location: "monthly.html", title: "Monthly", text: "The month's spending by envelope." },
  { location: "monthly.html#rent", title: "Rent", text: "…" }
] };
```
