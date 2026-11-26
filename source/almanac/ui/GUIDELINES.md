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
  css/project.css        the project's own styles, only if it has rules of its own
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
<html lang="en" data-currency="USD">
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
<link rel="stylesheet" href="css/project.css">  <!-- only if the project has one -->
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
| `<head>` | the project's stylesheet, if it has one, after the kit's | It may override the kit, never the reverse |
| `<head>` | `settings.js`, not deferred | It sets the theme before the first paint |
| `<head>` | `charts.js`, `plot.js` | So a page's own script can draw a chart |
| `<head>` | the project's data scripts | Before anything reads them |
| right after the navbar | `navbar.js` | The navbar works as soon as it is drawn |
| foot of `<body>` | every other kit script, then library scripts, then the project's | They bind markup already in the page |

4.3. A page MAY load every kit script: each looks for its own markup and does nothing without it.

4.4. The navbar's theme buttons (`#theme-toggle`, `#theme-settings-open`) SHOULD be kept, so the reader can switch light and dark and pick an accent.

4.5. Each section of a page's body SHOULD be a card (section 6.1) whose title carries an `id`; the floating contents button lists the cards by their titles.

4.6. The starter's content is placeholder: its navbar entries (Overview, and a Reports menu linking to `monthly.html` and `yearly.html`, which do not exist), its brand "Project", and its KPI card, chart, text card and table. Each MUST be replaced with the project's own or removed; a link to a page the project does not have does not conform.

4.7. **Header band actions.** A page's own action goes at the end of `.page-header-row`, after `.page-header-titles`; the row sets the two apart. There is no class of its own for it: a `.btn-list` holds one button or several.

```html
<div class="container-xl page-header-row">
  <div class="page-header-titles">
    <div class="page-pretitle">Budget</div>
    <h1 class="page-title">November budget</h1>
  </div>
  <div class="btn-list">
    <button class="btn btn-primary" type="button" data-open="add-transaction">Add transaction</button>
  </div>
</div>
```

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

5.4. The reader's choices live on `<html>`: `data-theme` (`light` or `dark`), `data-theme-primary`, `data-theme-base`, `data-theme-radius`, `data-theme-font`. A page MUST NOT set them itself, except through the address for a link that opens in a given mode (`page.html?theme=dark`). A choice made in the address is remembered by the browser (`localStorage`) and holds on later pages until changed. A script that must react to a change of mode observes the `data-theme` attribute.

5.5. Text on a colour MUST read at 4.5 : 1 at least. The kit's components meet this; a project's own colour pairings MUST be checked.

## 6. Layout and styling

6.1. **Cards.** A card is `.card > .card-header > .card-header-titles > h2.card-title (+ p.card-subtitle)` followed by `.card-body`, and MAY end in `.card-footer`. Actions go in `.card-actions`, after `.card-header-titles` inside the header; it sits at the header's far end. Cards stacked in `.container-xl` are spaced by the kit; a page MUST NOT add margins between them.

```html
<div class="card">
  <div class="card-header">
    <div class="card-header-titles">
      <h2 class="card-title" id="envelopes">Envelopes</h2>
      <p class="card-subtitle">November, by envelope</p>
    </div>
    <div class="card-actions">
      <button class="btn btn-sm" type="button" data-table-export="csv" data-table="envelopes-table">Save CSV</button>
      <button class="btn-action" type="button" aria-label="More">…icon…</button>
    </div>
  </div>
  <div class="card-body">…</div>
</div>
```

6.2. **Grid.** Columns are Bootstrap's grid: `.row` holding `.col`, `.col-auto`, `.col-6`, `.col-md-4` and so on, at breakpoints sm 576 px, md 768, lg 992, xl 1200, xxl 1400. Rows of cards use `.row.row-cards`, and `.row-deck` for equal heights. A page SHOULD NOT build its own grid with custom CSS.

6.3. **Utilities.** Spacing, display, flex, text, colour, sizing and border utilities are Bootstrap's names (`mt-3`, `d-flex`, `gap-2`, `text-end`, `bg-success-lt`, `w-100`). They are `!important`. A page SHOULD use them for arrangement and MUST NOT use them to restyle a component's look (a button's colour comes from its variant class, not `bg-*`).

6.4. **Project CSS.** A rule the kit cannot express goes in `css/project.css`, uses tokens only (5.1), and its classes MUST carry a project prefix (`.bud-ledger`, not `.ledger`) so a later kit cannot collide with them. A project with no such rule has no `css/project.css` and does not link one. A project MUST NOT override a kit class's look; if a component falls short, raise it against Almanac.

6.5. **Icons** are Tabler's outline set, inline: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">…</svg>`. There is no icon font. An icon that carries meaning alone MUST have an accessible name on its button or link.

6.6. **Showing and hiding.** The kit holds `[hidden] { display: none !important; }`, so `element.hidden = true` (or the `hidden` attribute in the markup) hides any element, a component that sets its own `display` included, and `element.hidden = false` shows it again. A page SHOULD show and hide with `hidden` rather than with a rule or a utility of its own. Rows a filter hides carry `.is-filtered-out`, which belongs to the filter (8.10): a page MUST NOT set or clear it.

## 7. Data

7.1. A project's data MUST be supplied as a script that assigns into `window.ALMANAC_DATA`, loaded in `<head>` before any script that reads it:

```js
// data/budget.js
window.ALMANAC_DATA = window.ALMANAC_DATA || {};
window.ALMANAC_DATA.budget = {
  month: '2026-11',
  total: 1630,
  budgeted: 1800,
  months: ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'],
  groceries: { budget: 450, spent: [410, 455, 390, 430, 470, 445] },
  envelopes: [
    { name: 'Groceries', budget: 450, spent: 445 },
    { name: 'Eating out', budget: 150, spent: 170 }
  ]
};
```

7.2. Each data script MUST add one top-level key and MUST NOT replace `ALMANAC_DATA` whole, so several scripts can load on one page.

7.3. A number shown in prose SHOULD be bound, not typed: `<span data-value="budget.total" data-format="currency"></span>`. `data.js` fills each `[data-value]` once, when the page has loaded; a path that finds nothing leaves the element as written and marks it `.data-missing`. A script reads the same path with `Almanac.data.get('budget.total')` and formats with `Almanac.data.format(value, how, options)` (8.5). The values of `data-format`:

| `data-format` | Shows | Notes |
| --- | --- | --- |
| `number` (the default) | `1,630` | en-GB grouping; a value that is not a number is shown as text |
| `currency` | `$1,630.00` | The currency is `data-currency` on the element, else on `<html>`, else `USD`; en-GB grouping and the narrow symbol (`$`, `€`, `£`). `data-decimals="0"` gives `$1,630`; without it, the currency's own decimals |
| `hex2`, `hex3` | `0x1CB` | Padded to two or three digits |
| `text` | the value as it is | |

In a script: `Almanac.data.format(1630, 'currency')`, or with options, `Almanac.data.format(1630, 'currency', { currency: 'EUR', decimals: 0 })`; the options argument is optional.

There is no percent and no date `data-format`. A page shows those itself: its script formats the value (`new Intl.NumberFormat('en-GB', { style: 'percent' }).format(0.42)`, `new Date('2026-11-26').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })`) and sets the element's `textContent`.

7.4. Dates in data MUST be ISO 8601 (`2026-11-26`, `2026-11` for a month). Amounts MUST be numbers, not formatted strings; formatting happens when shown.

7.5. A page that keeps what the reader enters SHOULD store it in `localStorage` under a project prefix (`budget:transactions`), and SHOULD offer a way out of the browser: a file saved with `Almanac.download(name, text)` and read back from a file input or a drop zone (9.2).

7.6. A project that works in one currency SHOULD set it once, on `<html>` (`<html lang="en" data-currency="EUR">`), so every `currency` value and chart on the page follows it. A `data-currency` on one element, or `currency` in one chart's config, overrides it there.

## 8. Components

8.1. A component's markup MUST follow its contract: the class names, the attributes and the nesting below. The kit's scripts find components by these and nothing else.

8.2. A page MUST NOT use Bootstrap's or Tabler's JavaScript attributes (`data-bs-toggle`, `data-bs-target`, …) or load either project's stylesheet or script: the class names are theirs, the behaviour is the kit's own.

**Structure and display**

| Component | Contract | Script |
| --- | --- | --- |
| Card | 6.1; status strip `.card-status-top`/`-start`/`-bottom` with a `.bg-*`; `.card-sm`, `.card-borderless`, `.card-active`, `a.card.card-link(.card-link-pop)`, `.card-stacked` | |
| Table | `.table-responsive#id > table.table > thead + tbody`; to sort, `th > button.table-sort[type="button"][data-sort="col-x"]` and `td.col-x` cells, `data-sort-value` for a value that is not the text; to copy or save, `button[data-table-export="copy"\|"csv"][data-table="id"]`, `data-table` being the bare id of the wrapper (no `#`). Export below. Tabler's `.table-tbody` on the `tbody` MAY be written and does nothing | table.js |
| Row filter | 8.10: `.table-filter[data-filter="#id"]` and `.state-filter[data-filter-states="#id"]`, each a CSS selector; `[data-filter-empty="#id"]` for its empty state; fires `almanac:filter` | filter.js |
| Status | `.status.status-{colour}` (with `.status-dot`; `.status-lite` for the plain chip), `.badge`, `.alert.alert-{colour}` (`[data-close]` inside removes it); colours in 8.7 | navbar.js |
| Tabs | `.card-tabs` holding `ul.nav.nav-tabs > li.nav-item > a.nav-link[data-tab][href="#pane"]` and `.tab-content > .tab-pane#pane`; the address keeps the open tab | tabs.js |
| Accordion | `.accordion > details.accordion-item[name="group"] > summary.accordion-button + .accordion-body`; the chevron in `.accordion-button-toggle` | none |
| Loading | `.spinner-border(-sm)`, `.spinner-grow(-sm)`, `.animated-dots`; `.placeholder.col-*` inside `.placeholder-glow` | |
| Empty state | 8.12: `.empty > .empty-icon? + .empty-title + .empty-subtitle + .empty-action?` | |
| Small pieces | `.hr-text`, `nav > ol.breadcrumb > li.breadcrumb-item(.active)`, `.avatar` (sizes `-xs` to `-2xl`, `.avatar-rounded`, an empty `.badge.bg-*` as its status, `.avatar-list-stacked`), `.ribbon(.ribbon-top/-start/-bookmark).bg-*`, `.steps`, `.timeline`, `.progress`, `.datagrid`, `ul.pagination > li.page-item(.active) > a.page-link` | |

**Table export.** The Copy and CSV buttons take the first `table` inside the wrapper `data-table` names, as it stands: its header row (each `thead th`'s text), then every `tbody` row in the current sort. Rows a filter has hidden (8.10) are included: the export is the whole table, not what is in sight. A cell gives its `data-sort-value` when it has one, else its text, trimmed; a cell holding only `—` gives an empty value. `data-date` and `data-value`, which sorting also reads, are not used: a cell whose file value is not its text carries `data-sort-value`. CSV is comma-separated, a value quoted when it holds a comma, a quote or a line break, lines ended by `\n`, UTF-8 without a byte-order mark; the file is named from the wrapper's id (`Almanac.slug(id) + '.csv'`, so `envelopes-table.csv`), and the id is how to name it. Copy puts the same rows on the clipboard separated by tabs, unquoted, which a spreadsheet pastes as columns, and the button reads "Copied" for a moment. A page that wants another file (only the rows in sight, other columns) builds the rows itself and calls `Almanac.download(name, Almanac.delimited(rows, ','))`.

**Figures**

| Component | Contract | Script |
| --- | --- | --- |
| KPI tile | 8.9: `.kpi-grid > .card.kpi-card > .card-body > .kpi-title + .kpi-row (> .kpi-value + .kpi-delta) + .kpi-meta`, then an optional `canvas.plot.kpi-spark` after `.card-body` | plot.js, for the sparkline |
| Chart | 8.8: `<canvas id="x" class="plot">`, then `Almanac.plot.create('x', config)` | plot.js, whose header documents every key |
| Fixed bars | `Almanac.charts.bars(element, { rows, title, axis, format, tickFormat, currency })`; `format: 'currency'` shows values in full and ticks compact | charts.js |
| Period control | `[data-periods]` with a `<script type="application/json">` of every window | period.js, whose header documents the JSON |

**Input and actions**

| Component | Contract | Script |
| --- | --- | --- |
| Button | `button.btn` with one variant: `.btn-primary`, `.btn-secondary`, `.btn-success`/`-info`/`-warning`/`-danger`, `.btn-outline-*`, `.btn-ghost-*`, `.btn-link`; sizes `.btn-sm`, `.btn-lg`; `.btn-icon` (with `aria-label`); `.btn-action` (a bare icon); `.btn-loading` while busy. Rows: `.btn-list` (`.btn-list-end` to the right); joined: `.btn-group`, a choice with `input.btn-check + label.btn` | |
| Segmented choice | `.nav.nav-segmented > button.nav-link(.active)`; the page wires the clicks | |
| Form field | `label.form-label(.required)[for]` then `.form-control`, `.form-select` or `.input-group > .input-group-text + .form-control`; a hint `.form-hint` after it; `.form-check > input.form-check-input + .form-check-label`, `.form-switch` for a switch | |
| Validation | `.is-invalid`/`.is-valid` on the field, `.invalid-feedback`/`.valid-feedback` after it as a later sibling (after the `.input-group`, not in it); or `.was-validated` on the form, added by the page on submit, which shows the browser's own checks (`required`, `type`, `min`, `max`). Recipe in 8.13 | |
| Select boxes | `.form-selectgroup.form-selectgroup-boxes > label.form-selectgroup-item > input.form-selectgroup-input + span.form-selectgroup-label (> .form-selectgroup-check + .form-selectgroup-label-content > .form-selectgroup-title)` | |
| Select pills | `.form-selectgroup.form-selectgroup-pills`, the same items with checkboxes for several at once | |
| Growing textarea | `textarea.form-control[data-autosize]` | autosize.js |
| Day picker | 8.11: `.calendar[data-calendar]` with `data-month`, `data-selected`, `data-marked`, `data-range`, `data-week`; fires `almanac:date` | calendar.js |
| Dialog | `dialog.modal#id[aria-labelledby]` holding `.modal-header` (`.modal-title`, `.btn-close[data-close]`), `.modal-body`, `.modal-footer`, or a `<form>` holding all three; `.modal-sm`, `.modal-lg`; opened by `[data-open="id"]`; closed by `[data-close]`, Escape, the backdrop, a `<form method="dialog">` or `dialog.close()`. Recipe in 8.13 | navbar.js |
| Side panel | `dialog.offcanvas.offcanvas-end` (or `-start`) with `.offcanvas-header` and `.offcanvas-body`, opened the same way | navbar.js |
| Menu | `.dropdown > button.dropdown-toggle[aria-expanded="false"][aria-controls="m"] + .dropdown-menu#m[hidden] > button.dropdown-item`; `.dropdown-menu-end`, `.dropdown-divider`, `.dropdown-header`, `.dropdown-item-danger` | dropdown.js |
| Popover | `button[data-popover-title][data-popover-content]`, or `button[data-popover="id"]` naming a `.popover#id[hidden]` with `.popover-header` and `.popover-body`; `data-placement` (`top`, the default, `bottom`, `left`, `right`), `data-popover-trigger="hover"` | popover.js |
| Toast | `Almanac.toast(text)` or `Almanac.toast({ title, text, meta, color, delay })`; `color` in 8.7; `delay` in milliseconds, 5000 unless given, `0` keeps it | toast.js |

8.3. A component's script MUST NOT be imitated: where the kit has a behaviour, a page uses it rather than writing its own (a second dropdown script would fight the first).

8.4. A page's own behaviour goes in `js/project.js` or an inline script at the foot of `<body>`. It SHOULD reach the kit through the API in 8.5 and the events in 8.6, not by reaching into a component's internals.

8.5. **API on `window.Almanac`**

| Call | Does |
| --- | --- |
| `plot.create(canvasId, config)`, `plot.get(canvasId)` | Draw a chart (8.8); the drawn chart's `update(config)` redraws it with a whole new config |
| `charts.bars(element, options)` | Draw fixed horizontal bars |
| `toast(options)`, `toast.close(element)` | Show a note in the corner and return its element; take it away |
| `calendar.draw(element)` | Draw a day picker again after changing its attributes, or draw one added later |
| `editor(textarea, options)`, `editor.value(textarea)` | Make a rich-text field; read its HTML (9.4) |
| `autosize(textarea)` | Resize a growing textarea after setting its value |
| `dropdown.close()`, `popover.close()` | Close what is open |
| `table.resort(table)` | Apply the reader's chosen sort again to a table element after its rows change; nothing if it was not sorted |
| `data.get(path)`, `data.format(value, how, options)` | Read from `ALMANAC_DATA`; format as `data-format` does (7.3) |
| `hash.get(key)`, `hash.set(key, value)` | Keep state in the address, so a reload or a shared link keeps it |
| `copyText(text, done)`, `download(filename, text)`, `delimited(rows, separator)`, `slug(text)` | Copy; save a file; rows to CSV (`','`) or TSV (`'\t'`); a name for a file or an id |

`plot`, `charts` and the helpers in the last two rows exist once the `<head>` scripts have run; the rest exist only once the foot scripts have, so a script in the middle of `<body>` may call `plot.create` but not `data.format` or `toast`.

8.6. **Events.** `almanac:date` on a day picker, bubbling (`detail.date`, `YYYY-MM-DD`); `almanac:filter` on a row filter's target after each run, bubbling (`detail.shown`, `total`, `query`, `state`; 8.10); `almanac:dropdown` on a menu's toggle (`detail.open`); `input` from a rich-text field's textarea as it changes; `close` from a `<dialog>`, with its `returnValue`.

8.7. **Allowed values.**

| Where | Values |
| --- | --- |
| `.status-*`, `.alert-*`, `.bg-*`, `.bg-*-lt` | Meaning: `primary`, `secondary`, `success`, `info`, `warning`, `danger`. Palette: `blue`, `azure`, `indigo`, `purple`, `pink`, `red`, `orange`, `yellow`, `lime`, `green`, `teal`, `cyan` |
| Toast `color`; `.modal-status-*` | `primary`, `success`, `info`, `warning`, `danger`; no `color` for a plain note |
| `.kpi-value--*` | `good`, `warn`, `bad`; none for a neutral figure |
| `.kpi-delta--*` | `better`, `worse`, `flat` |
| `data-format` | `number` (default), `currency`, `hex2`, `hex3`, `text` (7.3) |
| Chart series `type` | `bar` (default), `line`, `box` |
| Chart axis `tickFormat` | none (plain numbers, `1.5k` past 1,000), `percent` (values 0 to 1), `currency` |
| Chart `refLines[].axis` | `left` (default: a level across the plot, on the left scale), `x` (a line down the plot at an x label or value) |
| Day picker `data-week` | `1` (Monday, default), `0` (Sunday) |

8.8. **Chart.** The canvas goes in a card body, alone in its parent: the chart adds its toolbar before the canvas and its legend and table after it, in the same parent. The page MAY call `Almanac.plot.create` once `settings.js` and `plot.js` have loaded (in `<head>`, 4.2) and the canvas is in the document: in an inline script right after the canvas, or in the page's script at the foot. Called before the canvas exists, it warns in the console and returns `null`.

```html
<div class="card">
  <div class="card-header"><div class="card-header-titles">
    <h2 class="card-title" id="groceries">Groceries by month</h2>
  </div></div>
  <div class="card-body"><canvas id="groceries-chart" class="plot"></canvas></div>
</div>
<script>
  var budget = window.ALMANAC_DATA.budget;
  Almanac.plot.create('groceries-chart', {
    title: 'Groceries by month',              // the canvas's accessible name, and the CSV's
    height: 260,                              // px, optional
    x: budget.months,                         // one label a point
    series: [
      { type: 'bar', label: 'Spent', y: budget.groceries.spent, color: '--primary' }  // null in y is a gap
    ],
    xAxis: { title: 'Month' },
    yAxis: { title: 'Spent', min: 0, tickFormat: 'currency' },
    refLines: [
      { value: budget.groceries.budget, label: 'Budget', axis: 'left', color: '--danger', dashed: true },
      { value: '2026-09', label: 'New store', axis: 'x', dashed: false }
    ],
    offerTable: true                          // Chart / Table switch, Copy and CSV
  });
</script>
```

A series takes `type`, `label`, `y`, and MAY take `axis` (`'right'`, with `yAxisRight`), `color`, `dashed` and `hidden`. A colour is a token's name as a string, leading `--` included (`'--primary'`, `'--chart-3'`), never `'var(--primary)'` or a literal. Series without `color` take `--chart-1`, `--chart-2`, … by their place in `series`, and `--chart-1` is red: a single-series chart SHOULD pass `color: '--primary'`, so one series does not read as a warning, and a series SHOULD NOT share its colour with a reference line beside it. A reference line takes `value` and MAY take `label` (drawn outside the plot), `axis`, `color` (a token name; the axis colour unless given) and `dashed` (dashed unless `false`). With `tickFormat: 'currency'` the axis shows compact ticks (`$1.5k`, `$1.2M`) and the readout and table show values in full (`$445.00`); the currency is the config's `currency` (`currency: 'EUR'`), else `<html data-currency>`, else USD. `plot.js`'s header documents the other keys (`views`, `sparkline`, calendar windows).

8.9. **KPI tile.** The value MAY be bound (7.3). The delta holds the change in words for a screen reader, the change as shown, and an arrow; the class says whether it is better or worse, the arrow which way it moved. The kit has no arrow classes: the arrow is an inline icon, up, down or a dash. The sparkline is a `canvas.plot.kpi-spark` inside `.kpi-card`, after `.card-body`, drawn with `sparkline: true`.

```html
<div class="kpi-grid">
  <div class="card kpi-card">
    <div class="card-body">
      <div class="kpi-title">Spent</div>
      <div class="kpi-row">
        <div class="kpi-value kpi-value--warn" data-value="budget.total" data-format="currency" data-decimals="0"></div>
        <span class="kpi-delta kpi-delta--worse"><span class="visually-hidden">Up </span>+4%<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg></span>
      </div>
      <div class="kpi-meta">against last month</div>
    </div>
    <canvas id="spent-spark" class="plot kpi-spark"></canvas>
  </div>
</div>
<script>
  Almanac.plot.create('spent-spark', { sparkline: true, height: 48, x: window.ALMANAC_DATA.budget.months,
    series: [{ type: 'line', label: 'Spent', y: [1580, 1720, 1650, 1540, 1570, 1630], color: '--body-color' }] });
</script>
```

The other two deltas, in the same place:

```html
<span class="kpi-delta kpi-delta--better"><span class="visually-hidden">Down </span>−7%<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg></span>
<span class="kpi-delta kpi-delta--flat"><span class="visually-hidden">No change </span>0%<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l14 0"/></svg></span>
```

8.10. **Row filter.** A search box, a row of state pills, or both, over one table or over an element holding several. `data-filter` and `data-filter-states` take a CSS selector (`"#envelopes-table"`, with the `#`), and the two MUST carry the identical string to work together; `data-table` on an export button takes a bare id (`"envelopes-table"`, 8.2). The `.input-icon` wrapper and its icon are optional; the box needs only its `.form-control`. `.table-filter-count` is optional and says "3 of 12 rows" or "No rows match", empty when every row shows. Each pill's `data-state` is matched against each row's `data-state`; `all` lets every row through. The page writes the first pill `.is-active` with `aria-pressed="true"` and the others `aria-pressed="false"`; the script moves both on a click. A row is matched on its `data-search` if it has one, else on its text, every word typed found somewhere in it.

The script filters once when the page has loaded, then on every key typed and every pill clicked. Each run ends with `almanac:filter` on the element the selector names (here the `.table-responsive`, not the `tbody`), bubbling, with `event.detail`:

| Field | Holds |
| --- | --- |
| `shown` | rows in sight after the run |
| `total` | rows in the target, `tbody tr` of every table in it |
| `query` | the search box's text as typed, `''` without a box |
| `state` | the chosen pill's `data-state`, `all` without pills |

A page that reacts to the filter (a total of the rows in sight, its own empty state) SHOULD listen for this event rather than read the rows' classes, and SHOULD add the listener at its script's top level (8.14), so the run at load reaches it. An element with `data-filter-empty` carrying the identical selector is the filter's empty state: written `hidden`, the script shows it while the target has rows and none matches, and hides it otherwise. A target with no rows at all leaves it hidden; that empty state is the page's (8.12). The target also carries `.is-filtered-empty` while no row matches; the kit gives it no style.

```html
<div class="table-filter" data-filter="#envelopes-table">
  <div class="input-icon">
    <span class="input-icon-addon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg></span>
    <input class="form-control" type="search" placeholder="Filter…" aria-label="Filter the envelopes">
  </div>
  <span class="table-filter-count" aria-live="polite"></span>
</div>
<div class="state-filter" data-filter-states="#envelopes-table" role="group" aria-label="State">
  <button class="state-filter-pill is-active" type="button" data-state="all" aria-pressed="true"><span class="status status-primary">All</span></button>
  <button class="state-filter-pill" type="button" data-state="under" aria-pressed="false"><span class="status status-success">Under</span></button>
  <button class="state-filter-pill" type="button" data-state="over" aria-pressed="false"><span class="status status-danger">Over</span></button>
</div>
<div class="table-responsive" id="envelopes-table">
  <table class="table">
    <thead><tr><th>Envelope</th><th>Spent</th><th>State</th></tr></thead>
    <tbody>
      <tr data-state="under"><td>Groceries</td><td>$445.00</td><td><span class="status status-success">Under</span></td></tr>
      <tr data-state="over"><td>Eating out</td><td>$170.00</td><td><span class="status status-danger">Over</span></td></tr>
    </tbody>
  </table>
</div>
<div class="empty" data-filter-empty="#envelopes-table" hidden>
  <p class="empty-title">No envelopes match</p>
  <p class="empty-subtitle">Clear the box or choose All to see every envelope.</p>
</div>
<script>
  document.getElementById('envelopes-table').addEventListener('almanac:filter', function (event) {
    showTotal(event.detail.shown);   // the page's own function
  });
</script>
```

The chosen pill is drawn as its full coloured chip, ringed; the others outlined, their dot alone in colour. The rows would be built from the data (8.14); they are typed here to show the markup.

8.11. **Day picker.** The script draws the month into the element. `data-month` is the month shown first (`YYYY-MM`; else the month of `data-selected`, else this month); `data-selected` the chosen day (`YYYY-MM-DD`); `data-marked` days with something on them, ISO dates separated by spaces, each drawn with a dot; `data-range` a first and last day, separated by a space, the days between shaded; `data-week` the first day of the week (8.7). The element SHOULD carry an `aria-label`. A click on a day sets `data-selected` (and `data-month`, if the day is in another month), draws the month again and fires `almanac:date`, which bubbles, with `event.detail.date` the chosen `YYYY-MM-DD`. Day and month names follow the page's `lang`.

```html
<div class="calendar" id="pay-dates" data-calendar data-month="2026-11" data-selected="2026-11-15"
  data-marked="2026-11-01 2026-11-15 2026-11-28" aria-label="Bill dates"></div>
<script>
  document.getElementById('pay-dates').addEventListener('almanac:date', function (event) {
    showBillsDue(event.detail.date);   // the page's own function
  });
</script>
```

To change a picker from a script, set its attributes, then call `Almanac.calendar.draw(element)`.

The drawn month, for a test or a page's CSS to find: `.calendar-nav` holds `button.btn-action[data-step="-1"]` and `[data-step="1"]` (Previous and Next month) either side of `.calendar-title`; `.calendar-body` holds a `.calendar-date` cell a day, whole weeks, each with one `button.date-item[data-date="YYYY-MM-DD"]`. The chosen day's button has `aria-pressed="true"` (every other `"false"`) and no class of its own; today's has `.date-today` and `aria-current="date"`; a marked day's has `.date-marked` and ", marked" at the end of its `aria-label`. Days of the months before and after are on the cell, not the button: `.calendar-date.prev-month`, `.next-month`; they can be clicked, and choose the day and move to its month. Days in `data-range` are `.calendar-range` cells, the ends `.range-start` and `.range-end`. Every draw replaces the buttons, so a test finds a button again after each click: `picker.querySelector('[data-date="2026-11-20"]').click()`.

8.12. **Empty state.** Where a list, a table or a chart has nothing to show, the page shows why, and what to do about it if anything. `.empty-icon` and `.empty-action` are optional. A table's empty state sits in place of the `.table-responsive`, or beside it, hidden while rows show (6.6). For a table with no rows the page shows it itself; for a filter that matches none, `data-filter-empty` (8.10) has the kit show it, and a page that needs more listens for `almanac:filter`.

```html
<div class="empty">
  <div class="empty-icon">…icon…</div>
  <p class="empty-title">No transactions in November</p>
  <p class="empty-subtitle">A transaction appears here once it is added or imported.</p>
  <div class="empty-action"><button class="btn btn-primary" type="button" data-open="add-transaction">Add transaction</button></div>
</div>
```

8.13. **Dialog with a form.** The form is the dialog's direct child, holding the header, body and footer, and carries `novalidate`, so the page checks the fields and shows the kit's messages instead of the browser's. A button with `data-open` opens it; Cancel and the close button carry `data-close`. On submit the page calls `preventDefault`, marks each field it finds wrong with `.is-invalid` (which shows the `.invalid-feedback` after it), and closes the dialog only when every field is right. The form is reset on the dialog's `close` event, so Escape, the backdrop and Cancel reset it too.

```html
<dialog class="modal" id="add-transaction" aria-labelledby="add-transaction-title">
  <form id="add-transaction-form" novalidate>
    <div class="modal-header">
      <h2 class="modal-title" id="add-transaction-title">Add transaction</h2>
      <button class="btn-close" type="button" data-close aria-label="Close">…icon…</button>
    </div>
    <div class="modal-body space-y-3">
      <div>
        <label class="form-label required" for="tx-payee">Payee</label>
        <input class="form-control" id="tx-payee" name="payee" required aria-describedby="tx-payee-error">
        <div class="invalid-feedback" id="tx-payee-error">Who was paid, such as "Corner grocer".</div>
      </div>
      <div>
        <label class="form-label required" for="tx-amount">Amount</label>
        <div class="input-group">
          <span class="input-group-text">$</span>
          <input class="form-control" id="tx-amount" name="amount" type="number" min="0.01" step="0.01" required aria-describedby="tx-amount-error">
        </div>
        <div class="invalid-feedback" id="tx-amount-error">A number above 0, such as 42.50.</div>
      </div>
      <div>
        <label class="form-label" for="tx-note">Note</label>
        <textarea class="form-control" id="tx-note" name="note" rows="1" data-autosize></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" type="button" data-close>Cancel</button>
      <button class="btn btn-primary" type="submit">Add transaction</button>
    </div>
  </form>
</dialog>
```

```js
var dialog = document.getElementById('add-transaction');
var form = document.getElementById('add-transaction-form');

form.addEventListener('submit', function (event) {
  event.preventDefault();
  var first = null;
  form.querySelectorAll('.form-control[required]').forEach(function (field) {
    var wrong = !field.checkValidity();
    field.classList.toggle('is-invalid', wrong);
    field.setAttribute('aria-invalid', String(wrong));
    if (wrong && !first) first = field;
  });
  if (first) { first.focus(); return; }
  saveTransaction(new FormData(form));   // the page's own function (7.5)
  dialog.close();
  Almanac.toast({ text: 'Transaction added.', color: 'success' });
});

dialog.addEventListener('close', function () {
  form.reset();
  form.querySelectorAll('.is-invalid').forEach(function (field) {
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
  });
  Almanac.autosize(document.getElementById('tx-note'));
});
```

A form MAY use `.was-validated` instead, added on submit, which shows the browser's own checks without a class on each field; but its messages show only for a field that is a sibling of its `.invalid-feedback`, so a field in an `.input-group` still needs `.is-invalid`. A dialog that only asks a question MAY use `<form method="dialog">` and read the pressed button's `value` from `dialog.returnValue` on `close`.

8.14. **Rendering from data.** A page builds markup from its data in its own script. What the kit does with that markup depends on when it is built.

- **Before the kit binds.** The kit's foot scripts bind once, on `DOMContentLoaded`. Markup a page's script builds at its top level, in `js/project.js` or an inline script at the foot (4.2), is in place by then, and every component in it works as if it had been written in the page. This is the default: a page SHOULD build its first view this way, and SHOULD NOT wait for `DOMContentLoaded` to do it.
- **Later.** Markup built or changed after `DOMContentLoaded` (in a handler, after a form is sent, after a file is read) is not bound. What each component needs:

| Changed later | Tell the kit |
| --- | --- |
| Rows of a sorted table added, removed or replaced | `Almanac.table.resort(tableElement)`; a sort button bound at load sorts the new rows on its next click either way |
| Rows of a filtered table | Run the filter again: `input.dispatchEvent(new Event('input'))` on its search box, or, with pills alone, `.click()` on the active pill. The run fires `almanac:filter` and sets `data-filter-empty` as any other; a page learns what is in sight from the event, not by reading the rows. A row's text is read once, the first time it is filtered: to change a row's text, replace the `<tr>` rather than its cells |
| A day picker's attributes, or a day picker added | `Almanac.calendar.draw(element)` |
| A growing textarea's value | `Almanac.autosize(textarea)` |
| A value to show, or a `[data-value]` added | Set its `textContent` to `Almanac.data.format(value, how, options)`; `data.js` fills `[data-value]` only once |
| A chart's data | `Almanac.plot.get(id).update(config)`, with the whole config |
| A table, its export buttons, a filter box or pills, tabs, a period control, a popover button added | Not bound after load. Build them before `DOMContentLoaded`, then change only their rows or content |

Dialogs (`data-open`, `data-close`), menus, popovers, toasts, alerts' `[data-close]`, a day picker's clicks and a growing textarea's typing are handled for the whole document, and work on markup added at any time; a popover button added later SHOULD carry `aria-expanded="false"` (and, with `data-popover`, `aria-controls` naming its popover) itself, since those are set only at load. The contents button reads the cards each time it opens. A chart drawn while hidden (in a tab not chosen, a closed dialog, a `hidden` element) draws itself again when it is shown.

```js
// js/project.js: at the top level, so it runs before the kit binds
var body = document.querySelector('#envelopes-table tbody');
Almanac.data.get('budget.envelopes').forEach(function (envelope) {
  var over = envelope.spent > envelope.budget;
  var row = body.insertRow();
  row.setAttribute('data-state', over ? 'over' : 'under');
  row.insertCell().textContent = envelope.name;
  var spent = row.insertCell();
  spent.textContent = Almanac.data.format(envelope.spent, 'currency');
  spent.setAttribute('data-sort-value', envelope.spent);
  var state = document.createElement('span');
  state.className = 'status status-' + (over ? 'danger' : 'success');
  state.textContent = over ? 'Over' : 'Under';
  row.insertCell().appendChild(state);
});
```

Text from data or from the reader goes in with `textContent`, never `innerHTML`.

A page's listeners for the kit's events (8.6) SHOULD be added at the top level too. The filter runs once on `DOMContentLoaded`, so a listener added later, in the page's own `DOMContentLoaded` handler, misses that first `almanac:filter`.

## 9. Libraries

9.1. A library is used only from `almanac/vendor/`, and loaded only on a page that uses it, after the kit's CSS (with `almanac/css/vendors.css` for its theming) and after the kit's scripts.

9.2. **Dropzone**, for files dropped in. Load `vendor/dropzone/dropzone.css` and `css/vendors.css` in `<head>`; `vendor/dropzone/dropzone-min.js` at the foot, followed at once by `Dropzone.autoDiscover = false;`. With no server, a drop zone MUST be made with `url: '#'` and `autoProcessQueue: false`, carry the class `.dz-local`, and read each file in its `addedfile` event (`file.text()`). Nothing is uploaded.

9.3. **FullCalendar**, for a month of events. Load `css/vendors.css` and `vendor/fullcalendar/fullcalendar.min.js` (its CSS is inside). Make it after `DOMContentLoaded`: `new FullCalendar.Calendar(element, options).render()`. Event colours SHOULD be tokens (`color: 'var(--green)'`). For picking a single day, the day picker (8.11) needs no library.

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

11.2. Words on a page SHOULD be plain and specific: a button says what it does ("Add transaction", not "Submit"), a message says what is wanted ("A number, such as 400"), an empty table says why it is empty (8.12).

11.3. Example or placeholder content MUST NOT hold real people's names, accounts or figures.

## 12. Acceptance

A page conforms when every item holds:

1. It opens from disk with the network off, and the console shows no error from the page or the kit.
2. It reads and works in light and in dark (`?theme=light`, `?theme=dark`), and with another accent (`?theme-primary=teal`).
3. It reads and works at about 400 px wide and at 1280 px, with nothing scrolling sideways but tables.
4. Every control can be reached and used with the keyboard alone, with focus visible, and Escape closes what is open.
5. Its CSS holds no literal colours (`grep -E '#[0-9a-fA-F]{3,8}\b|rgb\(' css/project.css`, where the project has one, finds none outside comments), and every project class carries the project prefix.
6. Nothing in `almanac/` differs from the export (`almanac/VERSION` matches, and the folder is as copied).
7. It loads only the libraries it uses, in the order of section 4.2.
8. Data comes from `data/*.js` as section 7 sets out. Figures, amounts, rows and dates the data holds are bound or built from it, not typed; a page title or heading MAY restate what the page shows ("November budget").
9. No starter placeholder is left: every navbar entry and menu item leads to a page of the project (4.6).

Choices made in the address are remembered (5.4): a check, by hand or automated, MUST name the mode in the address of every page it opens (`?theme=light` or `?theme=dark`), and the accent too when it matters (`?theme-primary=blue`), rather than rely on what an earlier visit left behind.

Two notes for checks in headless Chrome. It does not size a window below 500 px wide, so the phone width (item 3) is checked by loading the page in a 390 px `<iframe>`. Under `--virtual-time-budget` a `<dialog>`'s `close` event does not fire, so a check that closes a dialog dispatches it by hand, `dialog.dispatchEvent(new Event('close'))`, after `dialog.close()`.
