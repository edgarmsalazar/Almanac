---
title: Data
layout: cards
data: [data/showcase.js]
description: "Numbers and how they are shown: tables, sortable tables, bar charts, progress bars, bitfields, flows, numbers bound to data and the lexicon's tooltips."
---

## Tables

*A Markdown table takes the theme's classes from the plugin, framed, scrolling sideways when it is wide.*

| Layout | Body | Contents |
| --- | --- | --- |
| docs | the article on one surface | a column beside it |
| cards | a card a section | the floating button |

Written as an ordinary Markdown table. A table written in HTML keeps its own classes: `table`, with `table-vcenter` or `table-nowrap` on it, inside a `table-responsive` box.

## Sortable table

*A button in a column's head sorts by the cells that carry its class: numbers by size, a mixed column as text.*

```example
<div class="table-responsive">
  <table class="table">
    <thead><tr>
      <th><button class="table-sort" data-sort="sort-setup">Setup</button></th>
      <th><button class="table-sort" data-sort="sort-rate">Pages a second</button></th>
      <th><button class="table-sort" data-sort="sort-date">Measured</button></th>
    </tr></thead>
    <tbody class="table-tbody">
      <tr><td class="sort-setup">One process</td><td class="sort-rate">2,140</td><td class="sort-date" data-date="2026-10-18">18 October</td></tr>
      <tr><td class="sort-setup">Every core</td><td class="sort-rate">19,870</td><td class="sort-date" data-date="2026-10-21">21 October</td></tr>
      <tr><td class="sort-setup">Threads</td><td class="sort-rate">15,320</td><td class="sort-date" data-date="2026-10-19">19 October</td></tr>
    </tbody>
  </table>
</div>
```

## Bar chart

*Fixed data drawn as HTML: a bar a row on a shared scale, round ticks below, a reference row in gray.*

```example
<div id="chart-example"></div>
<script>
  Almanac.charts.bars(document.getElementById('chart-example'), {
    rows: [
      { label: 'From the cache', caption: 'the ceiling', value: 21400, reference: true },
      { label: 'Every core', value: 19870 },
      { label: 'Threads', value: 15320 },
      { label: 'One process', value: 2140 }
    ],
    axis: 'pages a second'
  });
</script>
```

## Progress

*A rounded track, its bars side by side, so several make a stacked bar; separated, each bar is ringed in the card's colour.*

```example
<div class="progress"><div class="progress-bar" style="width: 64%"></div></div>
<div class="progress progress-xl progress-separated" style="margin-top: 1rem">
  <div class="progress-bar" style="width: 52%; --progress-bar-bg: var(--azure)" title="Guides"></div>
  <div class="progress-bar" style="width: 23%; --progress-bar-bg: var(--orange)" title="Reference"></div>
  <div class="progress-bar" style="width: 14%; --progress-bar-bg: var(--purple)" title="Examples"></div>
</div>
```

## Bitfield

*A number drawn bit by bit, high bit first, each bit coloured by the field it belongs to, the fields named below.*

```example
<div class="bitfield" style="--bits: 8" aria-label="A byte, bit 7 first">
  <div class="bit field-a"><small>7</small><span>1</span></div>
  <div class="bit field-a"><small>6</small><span>0</span></div>
  <div class="bit field-b"><small>5</small><span>1</span></div>
  <div class="bit field-b"><small>4</small><span>1</span></div>
  <div class="bit field-b"><small>3</small><span>0</span></div>
  <div class="bit field-c"><small>2</small><span>0</span></div>
  <div class="bit field-c"><small>1</small><span>1</span></div>
  <div class="bit field-c"><small>0</small><span>0</span></div>
</div>
<p style="margin-top: 0.75rem">
  <span class="field-chip field-a">direction</span> ·
  <span class="field-chip field-b">speed</span> ·
  <span class="field-chip field-c">state</span>
</p>
```

## Flow

*What happens in order, one row a way of doing it, the columns lined up so a step one way skips sits beside the step the other takes.*

```example
<div class="flow-scroll">
  <div class="flow" style="--flow-columns: 4">
    <div class="flow-label">Cached</div>
    <div class="flow-step"><b>Read the request</b><small>its key</small></div>
    <div class="flow-step is-skipped"><b>Query</b><small>skipped</small></div>
    <div class="flow-step is-written"><b>Serve the copy</b><small>from the cache</small></div>
    <div class="flow-step is-last"><b>Reply</b><small>the same body</small></div>

    <div class="flow-label">Fresh</div>
    <div class="flow-step"><b>Read the request</b><small>its key</small></div>
    <div class="flow-step"><b>Query</b><small>the database</small></div>
    <div class="flow-step"><b>Store the copy</b><small>for next time</small></div>
    <div class="flow-step is-last"><b>Reply</b><small>the body</small></div>
  </div>
</div>
<p class="flow-legend"><span class="is-plain">a step</span><span class="is-skipped">skipped</span><span class="is-written">written</span></p>
```

## Numbers from data

*A measured number is never typed into a page: the page names it by its path, and the theme fills it in.*

```example
<p>The guide has <span data-value="showcase.pages"></span> pages and
   <span data-value="showcase.sections"></span> sections, at
   <span data-value="showcase.sections" data-format="hex3"></span> in hex.</p>
```

The page lists its data scripts in its front matter, `data: [data/showcase.js]`, each setting a part of `window.ALMANAC_DATA`. A path that finds nothing leaves the place as written, marked `.data-missing`.

## Lexicon tooltips

*The first use of each lexicon term on a page is marked, its definition shown on hover or focus.*

Every layout and every header band here is explained where it is first used: the plugin writes the site's lexicon as `data/lexicon.js`, and `terms.js` marks the words. Code, headings, links and controls are left alone.
