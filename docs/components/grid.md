---
title: Grid and utilities
layout: cards
description: "Arranging a page by hand: Bootstrap's twelve-column grid, rows of cards, stacks and dividers, and the single-purpose classes for display, flex, spacing, text, sizing and borders."
---

## Columns

*Twelve columns to a row. A width class with a breakpoint applies from that width up, so these three sit side by side from 768 px and stack below it.*

```example
<div class="row gy-3">
  <div class="col-md-4"><div class="border rounded p-3">.col-md-4</div></div>
  <div class="col-md-4"><div class="border rounded p-3">.col-md-4</div></div>
  <div class="col-md-4"><div class="border rounded p-3">.col-md-4</div></div>
  <div class="col-md-8"><div class="border rounded p-3">.col-md-8</div></div>
  <div class="col-md-4"><div class="border rounded p-3">.col-md-4</div></div>
</div>
```

The classes are Bootstrap's, as Tabler uses them: `.col-6`, `.col-sm-*`, `.col-md-*`, `.col-lg-*`, `.col-xl-*` and `.col-xxl-*`, at 576, 768, 992, 1200 and 1400 px. Columns are as far apart as the page's padding; `.gy-3` adds space between columns that wrap.

## Shared and fitted widths

*A `.col` shares what is left with the other `.col`s; a `.col-auto` is as wide as what it holds. `.row-cols-3` gives every column a third without a class on each.*

```example
<div class="row align-items-center">
  <div class="col-auto"><span class="status status-success">Under</span></div>
  <div class="col">Groceries, with four days to go in the month</div>
  <div class="col-auto tabular-nums">445 of 450</div>
</div>
<div class="row row-cols-3 gx-2 mt-3">
  <div><div class="border rounded p-2 text-center">One</div></div>
  <div><div class="border rounded p-2 text-center">Two</div></div>
  <div><div class="border rounded p-2 text-center">Three</div></div>
</div>
```

## A row of cards

*`.row-cards` sets the cards apart both ways, so those that wrap keep their distance below too; `.row-deck` stretches each card to its column's height, so the row ends level.*

```example
<div class="row row-cards row-deck">
  <div class="col-sm-6 col-lg-4">
    <div class="card"><div class="card-body">
      <div class="kpi-title">Income</div>
      <div class="kpi-value">3,200</div>
    </div></div>
  </div>
  <div class="col-sm-6 col-lg-4">
    <div class="card"><div class="card-body">
      <div class="kpi-title">Spent</div>
      <div class="kpi-value">2,410</div>
      <div class="text-secondary small mt-1">Rent, food, transport and six more envelopes</div>
    </div></div>
  </div>
  <div class="col-sm-12 col-lg-4">
    <div class="card"><div class="card-body">
      <div class="kpi-title">Saved</div>
      <div class="kpi-value">790</div>
    </div></div>
  </div>
</div>
```

On a page, a row among the page's cards takes the same space above and below that a card does.

## Stacks and dividers

*Children set apart by a gap, with `.space-y-*` down or `.space-x-*` across, or by a rule with `.divide-y`, with no margins on the children themselves.*

```example
<div class="row">
  <div class="col-md-6">
    <div class="space-y-2">
      <div class="border rounded p-2">Rent</div>
      <div class="border rounded p-2">Groceries</div>
      <div class="border rounded p-2">Transport</div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="divide-y-2">
      <div class="d-flex justify-content-between"><span>Rent</span><span class="tabular-nums">1,200</span></div>
      <div class="d-flex justify-content-between"><span>Groceries</span><span class="tabular-nums">445</span></div>
      <div class="d-flex justify-content-between"><span>Transport</span><span class="tabular-nums">105</span></div>
    </div>
  </div>
</div>
```

## Flex

*A toolbar: the title on the left, the actions pushed to the right by `.ms-auto`, all on one line and centred against each other.*

```example
<div class="d-flex flex-wrap align-items-center gap-2">
  <strong>November</strong>
  <span class="text-secondary">12 transactions</span>
  <button class="btn btn-sm ms-auto" type="button">Export</button>
  <button class="btn btn-sm btn-primary" type="button">Add</button>
</div>
```

`.d-flex` and `.d-inline-flex` start a flex box; `.flex-column`, `.flex-wrap`, `.flex-fill`, `.flex-grow-1` and `.flex-shrink-0` shape it; `.justify-content-*` (`start`, `end`, `center`, `between`, `around`, `evenly`) and `.align-items-*` (`start`, `end`, `center`, `baseline`, `stretch`) place what is in it; `.gap-*` sets it apart.

## By the window's width

*Display, flex direction, alignment and text alignment come at every breakpoint as well. Here the figure stacks under its label on a narrow window and sits beside it from 768 px.*

```example
<div class="d-flex flex-column flex-md-row justify-content-md-between gap-1 border rounded p-3">
  <span>Left to spend this month</span>
  <strong class="tabular-nums">790</strong>
</div>
<p class="d-none d-md-block text-secondary small mt-2 mb-0">This line shows only from 768 px up.</p>
<p class="d-md-none text-secondary small mt-2 mb-0">This line shows only below 768 px.</p>
```

## Spacing

*Margin and padding on Tabler's spacer scale.*

| Step | Size |
| --- | --- |
| `0` | 0 |
| `1` | 0.25rem |
| `2` | 0.5rem |
| `3` | 1rem |
| `4` | 1.5rem |
| `5` | 2rem |
| `6` | 2.5rem |

| Class | Sets |
| --- | --- |
| `.m-3` `.p-3` | every side |
| `.mt-3` `.pt-3` | the top |
| `.mb-3` `.pb-3` | the bottom |
| `.ms-3` `.ps-3` | the start, the left |
| `.me-3` `.pe-3` | the end, the right |
| `.mx-3` `.px-3` | left and right |
| `.my-3` `.py-3` | top and bottom |

`.m-auto`, `.mx-auto` and `.ms-auto` take the rest of the space: centred, or pushed to the end. Gutters (`.g-*`, `.gx-*`, `.gy-*`), gaps (`.gap-*`) and stacks (`.space-y-*`) use the same steps.

## Text, sizing and borders

*The rest, each class one property. Colours are the theme's, so they follow light and dark and the chosen primary.*

```example
<div class="table-responsive">
  <table class="table">
    <thead><tr><th>Payee</th><th class="text-end">Amount</th></tr></thead>
    <tbody>
      <tr><td><div class="text-truncate" style="max-width: 14rem">Corner grocery, the one on the far side of the square</div></td><td class="text-end tabular-nums">42.10</td></tr>
      <tr><td>Refund</td><td class="text-end tabular-nums text-success">−18.00</td></tr>
      <tr><td class="text-secondary">Pending</td><td class="text-end tabular-nums text-secondary">7.50</td></tr>
    </tbody>
  </table>
</div>
```

| Set | Classes |
| --- | --- |
| Text | `.text-start` `.text-center` `.text-end`, `.text-nowrap` `.text-wrap` `.text-truncate` `.text-break`, `.text-uppercase`, `.fw-normal` `.fw-medium` `.fw-bold`, `.fst-italic`, `.small`, `.font-monospace`, `.tabular-nums`, `.lh-1` |
| Colour | `.text-body` `.text-secondary` (or `.text-muted`) `.text-primary` `.text-success` `.text-info` `.text-warning` `.text-danger` `.text-reset` |
| Sizing | `.w-25` to `.w-100`, `.w-auto`, `.h-25` to `.h-100`, `.mw-100` `.mh-100` `.min-w-0` |
| Borders | `.border` `.border-top` `.border-bottom` `.border-start` `.border-end`, `.border-0`, `.rounded` `.rounded-1` to `.rounded-3` `.rounded-circle` `.rounded-pill` |
| Position | `.position-relative` `.position-absolute` `.position-sticky`, `.top-0` `.bottom-0` `.start-0` `.end-0`, `.overflow-hidden` `.overflow-auto` |
| Visibility | `.d-none`, `.invisible`, `.visually-hidden` (for a screen reader only), `.visually-hidden-focusable` (shown when it takes focus) |
| Containers | `.container-xl` (the page's), `.container-fluid` (the full window), `.container-narrow` `.container-tight` `.container-slim` (a column for a form) |

A utility is `!important`, as in Bootstrap, so it wins over the component it sits on. The kit's components never need one: they are for arranging a page.
