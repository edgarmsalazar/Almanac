# The Almanac kit

The stylesheets, scripts and fonts behind every Almanac page, whether MkDocs built it or it was written by hand. Nothing here needs a build step or a server: a page opened from disk works.

To use it in a project, copy it there with `scripts/export-ui.sh <project>` from the Almanac repository. The copy lands in `<project>/almanac/` with a `VERSION` file saying which Almanac it came from; run the script again to update it. Then copy `starter.html` out of it as the project's first page.

## What is here

| Path | Holds |
| --- | --- |
| `css/theme.css` | The design tokens: palette, gray ramps, radii, fonts, light and dark. The `data-theme-*` attributes on `<html>` pick among them. |
| `css/components.css` | Tabler's components, ported by hand: cards, tables, alerts, badges, status, steps, the navbar, the offcanvas panel and the rest. |
| `css/layout.css` | The grid and the utilities, Bootstrap's names as Tabler uses them: `.row`, `.col-md-6`, `.row-cards`, `.d-flex`, `.gap-2`, `.mt-3`, `.text-end` and the rest. For arranging a page; the components do not lean on them, save the KPI cards' `.visually-hidden`. |
| `css/app.css` | What a page written by hand reaches for, from Tabler: buttons in every colour, outline and ghost, groups and lists; checkboxes, radios, input groups, select boxes and validation; modal dialogs, popovers, toasts, menus and pagination; card footers, actions, status strips and links; accordions, spinners, placeholders, dividers, breadcrumbs, avatars, ribbons and a mini calendar. |
| `css/vendors.css` | Dropzone, FullCalendar and HugeRTE in the theme's look. Load it only on a page that uses one of them, after `app.css`. |
| `css/almanac.css` | Almanac's own layout: the header band's lead, the docs layout and its contents column, the pager, search, examples, maths, and the lexicon and roadmap pages. |
| `css/dashboard.css` | The dashboard pieces from Portal: the canvas charts' legend, toolbar and readout, KPI cards, the period control, card tabs, the tracking strip and the table filter. |
| `css/reference.css` | API reference pages, as mkdocstrings writes them. Load it only where one is. |
| `js/` | One script a behaviour. Each looks for its own markup and does nothing without it. |
| `fonts/` | Lexend, Exo 2, Barlow and Fira Code, each with its licence. |
| `vendor/` | Mermaid and KaTeX, for diagrams and maths; Dropzone, FullCalendar and HugeRTE, for dropping files, a month of events and a rich-text field. Unchanged, each with its licence. Load each only on a page that uses it. |
| `GUIDELINES.md` | The implementation guidelines: what a conforming project and page look like, the load order, each component's contract, the API, and the checks a page passes. For whoever builds the pages, a person or a coding agent. |
| `starter.html` | A page shell to copy: navbar, header band, a KPI card, a chart and a card side by side, and a sortable table. |

## Loading order

Stylesheets in the order above, `theme.css` first. In `<head>`, `js/settings.js` before anything is painted, since it sets the theme; `js/charts.js` and `js/plot.js` there too, so a page's own script can draw a chart. `js/navbar.js` straight after the navbar. Every other script at the foot of `<body>`. `starter.html` does all of this.

## The scripts

| Script | Binds | Reads |
| --- | --- | --- |
| `settings.js` | `#theme-toggle`, `#theme-settings-open`, and the theme settings panel it builds. Gives the other scripts `Almanac` helpers: copy, download, the address hash. | The `?theme-…=` address, then the browser's saved choices. |
| `navbar.js` | `.navbar` menus and toggler, `[data-open]` buttons for a `<dialog>`, `[data-close]`, a click on a `.modal`'s backdrop, `[data-almanac-icon]`. | |
| `toc.js` | The floating contents button `#toc-toggle` and its panel `#toc`, for a page of cards. | The cards' `.card-title`s. |
| `almanac.js` | The docs layout's contents column, `[data-almanac-toc]`. | |
| `table.js` | `.table-sort` buttons, `data-table-export` copy and CSV buttons. | Each cell's `data-sort-value`, else its text. |
| `charts.js` | Nothing by itself: `Almanac.charts.bars(element, {...})`, HTML bars of fixed figures, described at the top of the file. | |
| `plot.js` | Nothing by itself: `Almanac.plot.create(canvasId, {...})`, canvas charts of bars, lines and boxes, with a legend, readout, table view and calendar windows. Every key is described at the top of the file. Load it in `<head>`, after `settings.js`. | Colours from theme.css's chart ramp. |
| `period.js` | `[data-periods]`: a row of KPI cards or a table, stepped by month, week or day; `[data-page-period]`, a control for the whole page. | A `<script type="application/json">` holding every window's text, described at the top of the file. |
| `tabs.js` | `.nav-link[data-tab]` in a `.card-tabs`: one `.tab-pane` shown at a time, the address naming it. | |
| `filter.js` | `.table-filter[data-filter]` and `.state-filter[data-filter-states]`: rows narrowed by words and by state, `almanac:filter` fired after each run, a `[data-filter-empty]` shown when no row matches. | Each row's `data-state`, and its `data-search` or text. |
| `dropdown.js` | `.dropdown-toggle[aria-controls]` outside the navbar: its `.dropdown-menu` opened below it, or above, fixed to the window; the arrow keys, Escape, a click elsewhere. | |
| `toast.js` | Nothing by itself: `Almanac.toast(text)` or `Almanac.toast({title, text, meta, color, delay})`, a note in the window's corner; a `.toast`'s `[data-close]`. | |
| `popover.js` | `[data-popover="id"]` and `[data-popover-content]` buttons: a bubble opened beside them, flipped to stay in the window. | |
| `calendar.js` | `[data-calendar]`: a month drawn in, a day picked, `almanac:date` fired. | Its `data-month`, `data-selected`, `data-marked`, `data-range`, `data-week`. |
| `autosize.js` | `textarea[data-autosize]`, where the browser does not size it itself. | |
| `editor.js` | `textarea[data-editor]`: a HugeRTE editor, light or dark as the page. | `vendor/hugerte/hugerte.min.js`, loaded first. |
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
