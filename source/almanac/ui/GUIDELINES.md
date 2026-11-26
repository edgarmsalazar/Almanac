# Almanac kit: implementation guidelines

A specification for building static HTML pages and small apps on the Almanac kit: what a conforming project looks like, what a page must load and in what order, the contract of each component, and how the work is checked. It is written for whoever builds the pages, a person or a coding agent, and is meant to be followed without reading the kit's source.

The kit's `README.md` lists its files; each script's opening comment documents its markup and options in full; the Almanac site's Components pages show every component live with its markup. Where those and this document disagree, this document describes the intent and the other is a bug.

## 1. Terms

**MUST** and **MUST NOT** are requirements: a page that breaks one does not conform. **SHOULD** and **SHOULD NOT** are strong defaults: departing from one needs a reason, written in a comment where it happens. **MAY** is a free choice.

- **Kit**: the folder of stylesheets, scripts, fonts and libraries, copied into a project as `almanac/`.
- **Project**: a folder of hand-written pages that uses a copy of the kit.
- **Page**: one HTML file of the project.
- **Token**: a CSS custom property defined by `almanac/css/theme.css`, such as `--primary` or `--border-color`.
- **Component**: a piece of markup the kit styles, and where it has one, the script that gives it behaviour.

## 2. Runtime

2.1. A page MUST work opened straight from disk (`file://`), with no server, no build step and no network.

2.2. Scripts MUST be classic scripts (`<script src>` or inline). A page MUST NOT use ES modules (`type="module"`), `import`, or `fetch()`/`XMLHttpRequest` for local files: browsers refuse all of them under `file://`.

2.3. A page MUST NOT depend on npm, a bundler, a compiler or a CDN. Third-party code is used only from `almanac/vendor/` (section 9).

2.4. The supported browsers are current Chrome, Edge, Safari and Firefox (versions from 2024 on). The kit relies on `:has()`, `color-mix()`, `<dialog>` and `<details name>`; a page MAY use any feature those browsers share.

## 3. Project structure

3.1. A project MUST hold the kit as `almanac/`, copied by Almanac's `scripts/export-ui.sh <project>`, and MUST NOT edit anything inside it. The folder is replaced whole on every export; `almanac/VERSION` records which Almanac it came from.

3.2. A project SHOULD be laid out as:

```
project/
  index.html             the first page, from almanac/starter.html
  *.html                 the other pages, beside it
  css/project.css        the project's own styles, if any
  js/project.js          the project's own behaviour, if any
  data/*.js              the project's data scripts (section 7)
  almanac/               the kit, untouched
```

3.3. Pages SHOULD sit beside `index.html`, so every page reaches the kit as `almanac/…`. A page in a subfolder MUST adjust its paths (`../almanac/…`).

3.4. To update the kit, run the export script again, then check the project against section 12. An update MUST NOT be made by copying single files across.

## 4. Page anatomy

4.1. A page MUST start from `almanac/starter.html`: navbar, header band, body, contents panel, scripts. The template below is its skeleton; elided parts are as the starter has them.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page — Project</title>
<link rel="stylesheet" href="almanac/css/theme.css">
<link rel="stylesheet" href="almanac/css/components.css">
<link rel="stylesheet" href="almanac/css/layout.css">
<link rel="stylesheet" href="almanac/css/app.css">
<link rel="stylesheet" href="almanac/css/almanac.css">
<link rel="stylesheet" href="almanac/css/dashboard.css">
<link rel="stylesheet" href="css/project.css">
<script src="almanac/js/settings.js"></script>
<script src="almanac/js/charts.js"></script>
<script src="almanac/js/plot.js"></script>
<script src="data/budget.js"></script>
</head>
<body>
<div class="page">
  <header class="navbar d-print-none" id="navbar">…</header>
  <script src="almanac/js/navbar.js"></script>
  <div class="page-wrapper">
    <header class="page-header d-print-none">
      <div class="container-xl page-header-row"><div class="page-header-titles">
        <div class="page-pretitle">Section</div>
        <h1 class="page-title">Page</h1>
        <p class="page-lead">One line about the page.</p>
      </div></div>
    </header>
    <main class="page-body"><div class="container-xl">
      …cards…
    </div></main>
  </div>
</div>
…contents button and panel…
<script src="almanac/js/toc.js"></script>
<!-- code, data, table, period, tabs, filter, dropdown, toast, popover, calendar, autosize -->
<script src="js/project.js"></script>
</body>
</html>
```

4.2. Load order is part of the contract:

| Where | What | Why |
| --- | --- | --- |
| `<head>`, first | `theme.css`, then `components.css`, `layout.css`, `app.css`, `almanac.css`, `dashboard.css` | Later files build on earlier ones |
| `<head>` | `css/vendors.css` and a library's own stylesheet, only on a page using a library | Section 9 |
| `<head>` | the project's stylesheet, after the kit's | It may override the kit, never the reverse |
| `<head>` | `settings.js`, not deferred | It sets the theme before the first paint |
| `<head>` | `charts.js`, `plot.js` | So a page's own script can draw a chart |
| `<head>` | the project's data scripts | Before anything reads them |
| right after the navbar | `navbar.js` | The navbar works as soon as it is drawn |
| foot of `<body>` | every other kit script, then library scripts, then the project's | They bind markup already in the page |

4.3. A page MAY load every kit script: each looks for its own markup and does nothing without it.

4.4. The navbar's theme buttons (`#theme-toggle`, `#theme-settings-open`) SHOULD be kept, so the reader can switch light and dark and pick an accent.

4.5. Each section of a page's body SHOULD be a card (section 6.1) whose title carries an `id`; the floating contents button lists the cards by their titles.

## 5. Theming

5.1. Colours, borders, radii, shadows and fonts MUST come from tokens: `color: var(--secondary)`, never `color: #6b7280`. A literal colour breaks dark mode and the reader's accent.

5.2. The tokens a page uses most:

| Use | Tokens |
| --- | --- |
| Text | `--body-color`, `--secondary` (quieter), `--tertiary`, `--disabled-color`, `--link-color` |
| Surfaces | `--body-bg`, `--bg-surface` (cards), `--bg-surface-secondary`, `--bg-surface-tertiary`, `--active-bg` (hover) |
| Lines | `--border-color`, `--border-width` |
| Meaning | `--primary`, `--success`, `--info`, `--warning`, `--danger`; each with `-lt` (a pale tint) and `-fg` (text on it) |
| Palette | `--blue`, `--azure`, `--indigo`, `--purple`, `--pink`, `--red`, `--orange`, `--yellow`, `--lime`, `--green`, `--teal`, `--cyan`, each with `-lt` |
| Charts | `--chart-1` to `--chart-8`, `--chart-grid`, `--chart-axis` |
| Shape | `--border-radius`, `--border-radius-md`, `--border-radius-pill`, `--page-padding`, `--shadow-sm` |
| Type | `--font-sans-serif`, `--font-monospace`, `--font-weight-medium`, `--font-weight-bold` |

5.3. A page MUST NOT style one mode only. Where a rule truly differs between modes it is scoped `[data-theme="dark"] …`, and the light rule stands unscoped.

5.4. The reader's choices live on `<html>`: `data-theme` (`light` or `dark`), `data-theme-primary`, `data-theme-base`, `data-theme-radius`, `data-theme-font`. A page MUST NOT set them itself, except through the address for a link that opens in a given mode (`page.html?theme=dark`). A script that must react to a change of mode observes the `data-theme` attribute.

5.5. Text on a colour MUST read at 4.5 : 1 at least. The kit's components meet this; a project's own colour pairings MUST be checked.

## 6. Layout and styling

6.1. **Cards.** A card is `.card > .card-header > .card-header-titles > h2.card-title (+ p.card-subtitle)` followed by `.card-body`, and MAY end in `.card-footer`. Actions go in `.card-actions` inside the header. Cards stacked in `.container-xl` are spaced by the kit; a page MUST NOT add margins between them.

6.2. **Grid.** Columns are Bootstrap's grid: `.row` holding `.col`, `.col-auto`, `.col-6`, `.col-md-4` and so on, at breakpoints sm 576 px, md 768, lg 992, xl 1200, xxl 1400. Rows of cards use `.row.row-cards`, and `.row-deck` for equal heights. A page SHOULD NOT build its own grid with custom CSS.

6.3. **Utilities.** Spacing, display, flex, text, colour, sizing and border utilities are Bootstrap's names (`mt-3`, `d-flex`, `gap-2`, `text-end`, `bg-success-lt`, `w-100`). They are `!important`. A page SHOULD use them for arrangement and MUST NOT use them to restyle a component's look (a button's colour comes from its variant class, not `bg-*`).

6.4. **Project CSS.** A rule the kit cannot express goes in `css/project.css`, uses tokens only (5.1), and its classes MUST carry a project prefix (`.bud-ledger`, not `.ledger`) so a later kit cannot collide with them. A project MUST NOT override a kit class's look; if a component falls short, raise it against Almanac.

6.5. **Icons** are Tabler's outline set, inline: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">…</svg>`. There is no icon font. An icon that carries meaning alone MUST have an accessible name on its button or link.

## 7. Data

7.1. A project's data MUST be supplied as a script that assigns into `window.ALMANAC_DATA`, loaded in `<head>` before any script that reads it:

```js
// data/budget.js
window.ALMANAC_DATA = window.ALMANAC_DATA || {};
window.ALMANAC_DATA.budget = {
  month: '2026-11',
  envelopes: [{ name: 'Groceries', budget: 450, spent: 445 }]
};
```

7.2. Each data script MUST add one top-level key and MUST NOT replace `ALMANAC_DATA` whole, so several scripts can load on one page.

7.3. A number shown in prose SHOULD be bound, not typed: `<span data-value="budget.total"></span>`, with `data-format` of `number` (the default), `text`, `hex2` or `hex3`. A script reads the same path with `Almanac.data.get('budget.total')`.

7.4. Dates in data MUST be ISO 8601 (`2026-11-26`, `2026-11` for a month). Amounts MUST be numbers, not formatted strings; formatting happens when shown.

7.5. A page that keeps what the reader enters SHOULD store it in `localStorage` under a project prefix (`budget:transactions`), and SHOULD offer a way out of the browser: a file saved with `Almanac.download(name, text)` and read back from a file input or a drop zone (9.2).

## 8. Components

8.1. A component's markup MUST follow its contract: the class names, the attributes and the nesting below. The kit's scripts find components by these and nothing else.

8.2. A page MUST NOT use Bootstrap's or Tabler's JavaScript attributes (`data-bs-toggle`, `data-bs-target`, …) or load either project's stylesheet or script: the class names are theirs, the behaviour is the kit's own.

**Structure and display**

| Component | Contract | Script |
| --- | --- | --- |
| Card | 6.1; status strip `.card-status-top`/`-start`/`-bottom` with a `.bg-*`; `.card-sm`, `.card-borderless`, `.card-active`, `a.card.card-link(.card-link-pop)`, `.card-stacked` | |
| Table | `.table-responsive > table.table`; to sort, `th > button.table-sort[data-sort="col-x"]` and `td.col-x` cells, `data-sort-value` for a value that is not the text; to copy or save, `button[data-table-export="copy"\|"csv"][data-table="wrapper-id"]` | table.js |
| Row filter | `.table-filter[data-filter="#table"]` holding `input.form-control`; `.state-filter[data-filter-states="#table"] > button.state-filter-pill[data-state]`; rows carry `data-state`, and `data-search` for text other than their own | filter.js |
| Status | `.status.status-{colour}` (with `.status-dot`), `.badge`, `.alert.alert-{colour}` (`[data-close]` inside removes it) | navbar.js |
| Tabs | `.card-tabs` holding `ul.nav.nav-tabs > li.nav-item > a.nav-link[data-tab][href="#pane"]` and `.tab-content > .tab-pane#pane`; the address keeps the open tab | tabs.js |
| Accordion | `.accordion > details.accordion-item[name="group"] > summary.accordion-button + .accordion-body`; the chevron in `.accordion-button-toggle` | none |
| Loading | `.spinner-border(-sm)`, `.spinner-grow(-sm)`, `.animated-dots`; `.placeholder.col-*` inside `.placeholder-glow` | |
| Small pieces | `.hr-text`, `nav > ol.breadcrumb > li.breadcrumb-item(.active)`, `.avatar` (sizes `-xs` to `-2xl`, `.avatar-rounded`, an empty `.badge.bg-*` as its status, `.avatar-list-stacked`), `.ribbon(.ribbon-top/-start/-bookmark).bg-*`, `.empty`, `.steps`, `.timeline`, `.progress`, `.datagrid`, `ul.pagination > li.page-item(.active) > a.page-link` | |

**Figures**

| Component | Contract | Script |
| --- | --- | --- |
| KPI tile | `.kpi-grid > .card.kpi-card > .card-body > .kpi-title + .kpi-row (> .kpi-value + .kpi-delta.kpi-delta--better/--worse/--flat) + .kpi-meta`; a sparkline is a `canvas.plot.kpi-spark` | |
| Chart | `<canvas id="x" class="plot">`, then `Almanac.plot.create('x', config)`: `x`, `series` (`bar`, `line`, `box`), `yAxis`, `yAxisRight`, `refLines`, `offerTable`, … | plot.js, whose header documents every key |
| Fixed bars | `Almanac.charts.bars(element, { rows, title, axis, format })` | charts.js |
| Period control | `[data-periods]` with a `<script type="application/json">` of every window | period.js, whose header documents the JSON |

**Input and actions**

| Component | Contract | Script |
| --- | --- | --- |
| Button | `button.btn` with one variant: `.btn-primary`, `.btn-secondary`, `.btn-success`/`-info`/`-warning`/`-danger`, `.btn-outline-*`, `.btn-ghost-*`, `.btn-link`; sizes `.btn-sm`, `.btn-lg`; `.btn-icon` (with `aria-label`); `.btn-action` (a bare icon); `.btn-loading` while busy. Rows: `.btn-list`; joined: `.btn-group`, a choice with `input.btn-check + label.btn` | |
| Segmented choice | `.nav.nav-segmented > button.nav-link(.active)`; the page wires the clicks | |
| Form field | `label.form-label(.required)[for]` then `.form-control`, `.form-select` or `.input-group > .input-group-text + .form-control`; a hint `.form-hint` after it; `.form-check > input.form-check-input + .form-check-label`, `.form-switch` for a switch | |
| Validation | `.is-invalid`/`.is-valid` on the field, `.invalid-feedback`/`.valid-feedback` after it (after the `.input-group`, not in it); or `.was-validated` on the form, added by the page on submit | |
| Select boxes | `.form-selectgroup.form-selectgroup-boxes > label.form-selectgroup-item > input.form-selectgroup-input + span.form-selectgroup-label (> .form-selectgroup-check + .form-selectgroup-label-content > .form-selectgroup-title)` | |
| Select pills | `.form-selectgroup.form-selectgroup-pills`, the same items with checkboxes for several at once | |
| Growing textarea | `textarea.form-control[data-autosize]` | autosize.js |
| Day picker | `.calendar[data-calendar]` with `data-month`, `data-selected`, `data-marked`, `data-range`, `data-week`; listen for `almanac:date` (`event.detail.date`) | calendar.js |
| Dialog | `dialog.modal#id[aria-labelledby]` holding `.modal-header` (`.modal-title`, `.btn-close[data-close]`), `.modal-body`, `.modal-footer`; opened by `[data-open="id"]`; closed by `[data-close]`, Escape, the backdrop or a `<form method="dialog">` | navbar.js |
| Side panel | `dialog.offcanvas.offcanvas-end` (or `-start`) with `.offcanvas-header` and `.offcanvas-body`, opened the same way | navbar.js |
| Menu | `.dropdown > button.dropdown-toggle[aria-expanded="false"][aria-controls="m"] + .dropdown-menu#m[hidden] > button.dropdown-item`; `.dropdown-menu-end`, `.dropdown-divider`, `.dropdown-header`, `.dropdown-item-danger` | dropdown.js |
| Popover | `button[data-popover-title][data-popover-content]`, or `button[data-popover="id"]` naming a `.popover#id[hidden]` with `.popover-header` and `.popover-body`; `data-placement`, `data-popover-trigger="hover"` | popover.js |
| Toast | `Almanac.toast(text)` or `Almanac.toast({ title, text, meta, color, delay })`; `delay: 0` keeps it | toast.js |

8.3. A component's script MUST NOT be imitated: where the kit has a behaviour, a page uses it rather than writing its own (a second dropdown script would fight the first).

8.4. A page's own behaviour goes in `js/project.js` or an inline script at the foot of `<body>`. It SHOULD reach the kit through the API in 8.5 and the events in 8.6, not by reaching into a component's internals.

8.5. **API on `window.Almanac`**

| Call | Does |
| --- | --- |
| `plot.create(canvasId, config)`, `plot.get(canvasId)` | Draw a chart; the drawn chart's `update(config)` redraws it |
| `charts.bars(element, options)` | Draw fixed horizontal bars |
| `toast(options)`, `toast.close(element)` | Show a note in the corner; take it away |
| `calendar.draw(element)` | Redraw a day picker after changing its attributes |
| `editor(textarea, options)`, `editor.value(textarea)` | Make a rich-text field; read its HTML (9.4) |
| `autosize(textarea)` | Resize a growing textarea after setting its value |
| `dropdown.close()`, `popover.close()` | Close what is open |
| `table.resort(table)` | Sort a table again after changing its rows |
| `data.get(path)` | Read from `ALMANAC_DATA` |
| `hash.get(key)`, `hash.set(key, value)` | Keep state in the address, so a reload or a shared link keeps it |
| `copyText(text, done)`, `download(filename, text)`, `delimited(rows, separator)`, `slug(text)` | Copy; save a file; rows to CSV (`','`) or TSV (`'\t'`); a name for a file or an id |

8.6. **Events.** `almanac:date` on a day picker (`detail.date`); `almanac:dropdown` on a menu's toggle (`detail.open`); `input` from a rich-text field's textarea as it changes; `close` from a `<dialog>`, with its `returnValue`.

## 9. Libraries

9.1. A library is used only from `almanac/vendor/`, and loaded only on a page that uses it, after the kit's CSS (with `almanac/css/vendors.css` for its theming) and after the kit's scripts.

9.2. **Dropzone**, for files dropped in. Load `vendor/dropzone/dropzone.css` and `css/vendors.css` in `<head>`; `vendor/dropzone/dropzone-min.js` at the foot, followed at once by `Dropzone.autoDiscover = false;`. With no server, a drop zone MUST be made with `url: '#'` and `autoProcessQueue: false`, carry the class `.dz-local`, and read each file in its `addedfile` event (`file.text()`). Nothing is uploaded.

9.3. **FullCalendar**, for a month of events. Load `css/vendors.css` and `vendor/fullcalendar/fullcalendar.min.js` (its CSS is inside). Make it after `DOMContentLoaded`: `new FullCalendar.Calendar(element, options).render()`. Event colours SHOULD be tokens (`color: 'var(--green)'`). For picking a single day, the day picker (8.2) needs no library.

9.4. **HugeRTE**, for rich text. Load `css/vendors.css`, `vendor/hugerte/hugerte.min.js`, then `js/editor.js`; every `textarea[data-editor]` becomes an editor in the page's mode. The textarea keeps the HTML, so a form sends it; `data-editor-toolbar` changes the toolbar. Only the lists, link and autolink plugins are carried. Stored or shown again, that HTML MUST be treated as the user's markup: it is set as `innerHTML` only where the page trusts its source.

9.5. **Mermaid** (`vendor/mermaid.min.js`, then `js/diagrams.js`, for `.mermaid`) and **KaTeX** (`vendor/katex/`, then `js/maths.js`, for `.arithmatex`) draw diagrams and maths.

9.6. A project MUST NOT add a library of its own beside the kit's. A library a project needs is added to Almanac's `vendor/`, with its theming and its licence.

## 10. Accessibility

10.1. Every control MUST be a real control: `<button type="button">` for an action, `<a href>` for a place, `<input>`/`<select>`/`<textarea>` with a `<label>` for a field. A `<div>` with a click handler does not conform.

10.2. A control with no visible words MUST have an `aria-label`. A decorative icon is `aria-hidden="true"`.

10.3. Colour MUST NOT be the only signal: a red status also says "Over", a KPI's arrow also has words (`.visually-hidden`), a chart has a table view (`offerTable`) or the numbers nearby.

10.4. Every interactive part MUST be reachable and usable from the keyboard, with focus visible. The kit's components already are; a page's own MUST be.

10.5. A page MUST have one `h1` (the header band's title), card titles as `h2`, and headings in order beneath.

10.6. A page SHOULD honour `prefers-reduced-motion` in any animation of its own, as the kit does.

## 11. Language and content

11.1. A page's `lang` MUST name its language. The day picker and dates shown by the kit follow it.

11.2. Words on a page SHOULD be plain and specific: a button says what it does ("Add transaction", not "Submit"), a message says what is wanted ("A number, such as 400"), an empty table says why it is empty (`.empty`).

11.3. Example or placeholder content MUST NOT hold real people's names, accounts or figures.

## 12. Acceptance

A page conforms when every item holds:

1. It opens from disk with the network off, and the console shows no error from the page or the kit.
2. It reads and works in light and in dark (`?theme=dark`), and with another accent (`?theme-primary=teal`).
3. It reads and works at about 400 px wide and at 1280 px, with nothing scrolling sideways but tables.
4. Every control can be reached and used with the keyboard alone, with focus visible, and Escape closes what is open.
5. Its CSS holds no literal colours (`grep -E '#[0-9a-fA-F]{3,8}\b|rgb\(' css/project.css` finds none outside comments), and every project class carries the project prefix.
6. Nothing in `almanac/` differs from the export (`almanac/VERSION` matches, and the folder is as copied).
7. It loads only the libraries it uses, in the order of section 4.2.
8. Data comes from `data/*.js` as section 7 sets out, and nothing is typed into the page that the data holds.
