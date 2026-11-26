---
title: Dashboard
layout: cards
description: "Pieces for a page of figures, from Portal: canvas charts, KPI cards, the period control, card tabs, the tracking strip and the table filter."
---

## Chart

*Bars and lines over one x axis, drawn on a canvas in the theme's chart colours. The legend switches a series off and on; the pointer reads the values under it.*

```example
<canvas id="plot-example" class="plot"></canvas>
<script>
  Almanac.plot.create('plot-example', {
    title: 'Spending by month',
    x: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    series: [
      { type: 'bar', label: 'Groceries', y: [410, 455, 390, 430, 470, 445] },
      { type: 'bar', label: 'Transport', y: [120, 95, 160, 110, 130, 105] },
      { type: 'line', label: 'Eating out', y: [180, 240, 210, 150, 195, 170] }
    ],
    yAxis: { title: 'Spent', min: 0 },
    refLines: [{ axis: 'left', value: 450, label: 'Groceries budget', color: '--danger', dashed: true }]
  });
</script>
```

`Almanac.plot.create(id, config)` draws on the canvas with that id. `x` names the points and each series gives a value for each, `null` for a gap. A series is a `bar`, a `line` or a `box` (a median and its quartiles). Colours are the chart ramp's `--chart-1` to `--chart-8` in turn unless a series names a token. `plot.js` describes every key at its top.

## Two axes and a table

*A series on the right axis takes its own scale. With offerTable, the chart offers its numbers as a table, to copy or save as CSV.*

```example
<canvas id="plot-axes" class="plot"></canvas>
<script>
  Almanac.plot.create('plot-axes', {
    title: 'Savings',
    x: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    series: [
      { type: 'bar', label: 'Saved', y: [300, 150, 420, 380, 260, 350] },
      { type: 'line', label: 'Share of income', y: [0.09, 0.05, 0.13, 0.12, 0.08, 0.11], axis: 'right' }
    ],
    yAxis: { title: 'Saved', tickFormat: 'currency', min: 0 },
    yAxisRight: { title: 'Of income', tickFormat: 'percent', min: 0 },
    offerTable: true
  });
</script>
```

An axis's `tickFormat` is `percent` for a rate from 0 to 1, or `currency` for money: compact on the ticks (`$1.5k`), in full in the readout and the table (`$350.00`). The currency is the chart's `currency: 'EUR'`, else the page's `<html data-currency>`, else US dollars.

## KPI cards

*A figure, its change on the period before, green when better whichever way it moved, and its trend along the foot.*

```example
<div class="kpi-grid">
  <div class="card kpi-card">
    <div class="card-body">
      <div class="kpi-title">Spent</div>
      <div class="kpi-row">
        <div class="kpi-value kpi-value--warn">1,630</div>
        <span class="kpi-delta kpi-delta--worse"><span class="visually-hidden">Up </span>+4%<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg></span>
      </div>
      <div class="kpi-meta">of 1,800 budgeted</div>
    </div>
    <canvas id="kpi-spent" class="plot kpi-spark"></canvas>
  </div>
  <div class="card kpi-card">
    <div class="card-body">
      <div class="kpi-title">Saved</div>
      <div class="kpi-row">
        <div class="kpi-value kpi-value--good">350</div>
        <span class="kpi-delta kpi-delta--better"><span class="visually-hidden">Up </span>+35%<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg></span>
      </div>
      <div class="kpi-meta">11% of income</div>
    </div>
    <canvas id="kpi-saved" class="plot kpi-spark"></canvas>
  </div>
  <div class="card kpi-card">
    <div class="card-body">
      <div class="kpi-title">Bills paid</div>
      <div class="kpi-row">
        <div class="kpi-value">12 of 12</div>
        <span class="kpi-delta kpi-delta--flat"><span class="visually-hidden">No change </span>0<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l14 0"/></svg></span>
      </div>
      <div class="kpi-meta">none late</div>
    </div>
  </div>
</div>
<script>
  Almanac.plot.create('kpi-spent', { sparkline: true, height: 48, x: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    series: [{ type: 'line', label: 'Spent', y: [1580, 1720, 1650, 1540, 1570, 1630], color: '--body-color' }] });
  Almanac.plot.create('kpi-saved', { sparkline: true, height: 48, x: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    series: [{ type: 'line', label: 'Saved', y: [300, 150, 420, 380, 260, 350], color: '--body-color' }] });
</script>
```

The value takes `kpi-value--good`, `--warn` or `--bad` for its band; the change `kpi-delta--better`, `--worse` or `--flat`, with an arrow for its direction and the direction in words for a screen reader.

## Period control

*Any month, stepped with ‹ ›: the cards change to that month. The page ships every month's text; nothing is computed in the browser.*

```example
<div class="card" data-periods="period-example-data">
  <div class="card-header"><div class="card-header-titles"><h3 class="card-title"><span data-period-name>Nov 2026</span> against <span data-period-against>Oct 2026</span></h3></div></div>
  <div class="card-body">
    <div class="kpi-grid" data-period-toolbar>
      <div class="card kpi-card" data-kpi="spent">
        <div class="card-body">
          <div class="kpi-title">Spent</div>
          <div class="kpi-row"><div class="kpi-value">1,630</div></div>
          <div class="kpi-meta">of 1,800 budgeted</div>
        </div>
        <canvas id="period-spent" class="plot kpi-spark"></canvas>
      </div>
      <div class="card kpi-card" data-kpi="saved">
        <div class="card-body">
          <div class="kpi-title">Saved</div>
          <div class="kpi-row"><div class="kpi-value">350</div></div>
          <div class="kpi-meta">11% of income</div>
        </div>
      </div>
    </div>
    <template data-kpi-icons>
      <span data-icon="up"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg></span>
      <span data-icon="down"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg></span>
      <span data-icon="flat"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l14 0"/></svg></span>
    </template>
    <script type="application/json" id="period-example-data">
    { "id": "period-example", "type": "kpi", "kinds": ["month"],
      "open": { "kind": "month", "label": "2026-11" },
      "fields": ["value", "state", "meta", "delta", "trend", "better"],
      "points": 4,
      "by_kind": { "month": {
        "labels": ["2026-09", "2026-10", "2026-11"],
        "windows": {
          "2026-09": { "name": "Sep 2026", "against": "Aug 2026", "cards": {
            "spent": ["1,540", "good", "of 1,800 budgeted", "-7%", "down", true],
            "saved": ["380", "good", "12% of income", "-10%", "down", false] } },
          "2026-10": { "name": "Oct 2026", "against": "Sep 2026", "cards": {
            "spent": ["1,570", "good", "of 1,800 budgeted", "+2%", "up", false],
            "saved": ["260", "warn", "8% of income", "-32%", "down", false] } },
          "2026-11": { "name": "Nov 2026", "against": "Oct 2026", "cards": {
            "spent": ["1,630", "warn", "of 1,800 budgeted", "+4%", "up", false],
            "saved": ["350", "good", "11% of income", "+35%", "up", true] } } },
        "sparks": {
          "spent": { "sparkline": true, "height": 48, "x": ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"],
            "series": [{ "type": "line", "label": "Spent", "y": [1580, 1720, 1650, 1540, 1570, 1630], "color": "--body-color" }] } } } } }
    </script>
  </div>
</div>
<script>
  Almanac.plot.create('period-spent', { sparkline: true, height: 48, x: ['2026-08', '2026-09', '2026-10', '2026-11'],
    series: [{ type: 'line', label: 'Spent', y: [1650, 1540, 1570, 1630], color: '--body-color' }] });
</script>
```

A component is marked `data-periods`, naming the JSON script that holds every window's text; the control goes before its `data-period-toolbar`. A card's `data-kpi` picks its text from each window's `cards`, in the order `fields` gives. A table can be swapped by period too; `period.js` describes both, and an element marked `data-page-period` gives the page one control that every component follows. The choice is kept in the address.

## Card tabs

*Folder tabs on a card: one pane at a time, the address naming the one shown.*

```example
<div class="card-tabs">
  <ul class="nav nav-tabs" role="tablist">
    <li class="nav-item" role="presentation"><a class="nav-link active" href="#tab-month" role="tab" aria-controls="tab-month" aria-selected="true" data-tab>This month</a></li>
    <li class="nav-item" role="presentation"><a class="nav-link" href="#tab-year" role="tab" aria-controls="tab-year" aria-selected="false" data-tab>This year</a></li>
  </ul>
  <div class="tab-content">
    <div class="tab-pane active" id="tab-month" role="tabpanel" aria-label="This month">
      <div class="card"><div class="card-body">1,630 spent of 1,800.</div></div>
    </div>
    <div class="tab-pane" id="tab-year" role="tabpanel" aria-label="This year">
      <div class="card"><div class="card-body">17,940 spent of 19,800.</div></div>
    </div>
  </div>
</div>
```

`tabs.js` hides every pane but the chosen one; without it, every pane shows, stacked, each tab a link to its pane. A chart in a hidden pane is drawn when its pane is shown.

## Tracking strip

*A run of states, oldest first: one block each, its title saying what it was.*

```example
<div class="tracking" role="img" aria-label="Budget kept, the last twelve months">
  <div class="tracking-block status-success" title="Dec 2025: kept"></div>
  <div class="tracking-block status-success" title="Jan 2026: kept"></div>
  <div class="tracking-block status-warning" title="Feb 2026: within 5%"></div>
  <div class="tracking-block status-success" title="Mar 2026: kept"></div>
  <div class="tracking-block status-danger" title="Apr 2026: over"></div>
  <div class="tracking-block status-success" title="May 2026: kept"></div>
  <div class="tracking-block status-success" title="Jun 2026: kept"></div>
  <div class="tracking-block status-success" title="Jul 2026: kept"></div>
  <div class="tracking-block status-warning" title="Aug 2026: within 5%"></div>
  <div class="tracking-block status-success" title="Sep 2026: kept"></div>
  <div class="tracking-block status-success" title="Oct 2026: kept"></div>
  <div class="tracking-block" title="Nov 2026: not over yet"></div>
</div>
```

A block with no state keeps the border's gray: nothing yet, rather than an outcome.

## Table filter

*Words typed narrow the rows to those holding every one; a state pill narrows them to that state. The two combine.*

```example
<div class="table-filter" data-filter="#filter-example">
  <div class="input-icon">
    <span class="input-icon-addon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg></span>
    <input class="form-control" type="search" placeholder="Filter…" aria-label="Filter the rows">
  </div>
  <span class="table-filter-count" aria-live="polite"></span>
</div>
<div class="state-filter" data-filter-states="#filter-example" role="group" aria-label="State">
  <button class="state-filter-pill is-active" type="button" data-state="all" aria-pressed="true"><span class="status status-primary">All</span></button>
  <button class="state-filter-pill" type="button" data-state="under" aria-pressed="false"><span class="status status-success">Under</span></button>
  <button class="state-filter-pill" type="button" data-state="over" aria-pressed="false"><span class="status status-danger">Over</span></button>
</div>
<div class="table-responsive" id="filter-example">
  <table class="table">
    <thead><tr><th>Envelope</th><th>Spent</th><th>Budget</th><th>State</th></tr></thead>
    <tbody>
      <tr data-state="under"><td>Groceries</td><td>445</td><td>450</td><td><span class="status status-success">Under</span></td></tr>
      <tr data-state="over"><td>Eating out</td><td>170</td><td>150</td><td><span class="status status-danger">Over</span></td></tr>
      <tr data-state="under"><td>Transport</td><td>105</td><td>140</td><td><span class="status status-success">Under</span></td></tr>
      <tr data-state="over"><td>Gifts</td><td>90</td><td>60</td><td><span class="status status-danger">Over</span></td></tr>
    </tbody>
  </table>
</div>
```

`data-filter` and `data-filter-states` name the same table, or an element holding several; each row's `data-state` is what a pill matches, and a `data-search` on a row, if it has one, is matched in place of its text.
