---
title: Content
layout: cards
description: "What a page says beside its prose: alerts, admonitions, badges, status chips and dots, tags, legends, lists, label and value grids, empty states, steps and timelines."
---

## Alerts

*A note the reader should not miss, tinted by what kind it is: info, success, warning or danger.*

```example
<div class="alert alert-info">
  <div class="alert-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 9h.01"/><path d="M11 12h1v4h1"/></svg></div>
  <div>
    <h4 class="alert-heading">Built</h4>
    <div class="alert-description">What this page describes is in the code, and its tests pass.</div>
  </div>
</div>
<div class="alert alert-success">
  <div class="alert-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 12l2 2l4 -4"/></svg></div>
  <div><h4 class="alert-heading">Measured</h4><div class="alert-description">The numbers below were measured on the last commit.</div></div>
</div>
<div class="alert alert-warning">
  <div class="alert-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0"/><path d="M12 16h.01"/></svg></div>
  <div><h4 class="alert-heading">Designed</h4><div class="alert-description">Not built yet: this is the plan the code will follow.</div></div>
</div>
<div class="alert alert-danger">
  <div class="alert-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>
  <div><h4 class="alert-heading">Out of date</h4><div class="alert-description">The code this page describes changed after it was checked.</div></div>
</div>
```

## Alert colours

*Beside the four meanings, the primary, a quiet secondary, and every hue of the palette: alert-blue, alert-teal, alert-purple and the rest.*

```example
<div class="alert alert-primary"><div class="alert-heading">Primary</div></div>
<div class="alert alert-secondary"><div class="alert-heading">Secondary</div></div>
<div class="alert alert-teal"><div class="alert-heading">Teal</div></div>
<div class="alert alert-purple"><div class="alert-heading">Purple</div></div>
```

## Alert modifiers

*Tabler's: important fills the box with its colour, minor keeps a plain border, dismissible gives it a close button. Inside, a link in the sentence, an action on its own line, a list.*

```example
<div class="alert alert-important alert-danger" role="alert">
  <div class="alert-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0"/><path d="M12 16h.01"/></svg></div>
  <div class="alert-heading">The index is out of date</div>
  <div class="alert-description">Rebuild the site before you <a class="alert-link" href="#">publish it</a>.</div>
</div>
<div class="alert alert-minor alert-info alert-dismissible" role="alert">
  <div class="alert-heading">Two pages moved</div>
  <ul class="alert-list"><li>Setting up is under Guide.</li><li>Standing is under Components.</li></ul>
  <a class="alert-action" href="#">See the map</a>
  <button class="btn-close" type="button" data-close aria-label="Close"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></button>
</div>
```

## Admonitions

*Markdown's !!! note boxes, drawn as alerts: the kind picks the colour and the icon, the title is the heading. ??? folds one away, ???+ starts it open.*

```markdown
!!! tip "Write the number once"
    Name it by its path in the page's data, and the theme fills it in.

??? warning important "Before the first build"
    Install the theme into the environment MkDocs runs from.
```

!!! tip "Write the number once"
    Name it by its path in the page's data, and the theme fills it in.

??? warning important "Before the first build"
    Install the theme into the environment MkDocs runs from.

The kinds are those Material for MkDocs knows, its aliases too. A further word on the same line is one of Tabler's modifiers: `important` or `minor`. `admonition` and `pymdownx.details` are named in `mkdocs.yml`; the plugin does the rest.

!!! note
    Note, in the primary colour.

!!! abstract
    Abstract, summary or tldr.

!!! info
    Info or todo.

!!! success
    Success, check or done.

!!! question
    Question, help or faq.

!!! failure
    Failure, fail or missing.

!!! danger
    Danger or error.

!!! bug
    Bug.

!!! example
    Example.

!!! quote minor
    Quote or cite; here minor, with a plain border.

## Badges

*A small label on a tinted ground, beside a title.*

```example
<p>Export to PDF <span class="badge">planned</span> · Old menu <span class="badge">old layout</span></p>
```

## Status

*A dot and a label: a state at a glance, self-contained in its class.*

```example
<span class="status status-success"><span class="status-dot"></span>measured</span>
<span class="status status-warning"><span class="status-dot"></span>planned</span>
<span class="status status-danger"><span class="status-dot"></span>failing</span>
<span class="status status-primary"><span class="status-dot"></span>running</span>
<span class="status status-secondary"><span class="status-dot"></span>skipped</span>
```

*Every hue of the palette has its class too, and status-lite keeps only the dot in colour.*

```example
<span class="status status-teal"><span class="status-dot"></span>teal</span>
<span class="status status-purple"><span class="status-dot"></span>purple</span>
<span class="status status-orange"><span class="status-dot"></span>orange</span>
<span class="status status-lite status-green"><span class="status-dot"></span>lite</span>
```

*In a table cell the chip takes the cell's size, and marks a value among plain ones.*

```example
<table class="table">
  <thead><tr><th>Setup</th><th>One process</th><th>Threads</th><th>Every core</th></tr></thead>
  <tbody>
    <tr><td>Cold cache</td><td><span class="status status-danger">2,140</span></td><td>15,320</td><td><span class="status status-success">19,870</span></td></tr>
    <tr><td>Warm cache</td><td><span class="status status-danger">2,610</span></td><td>17,050</td><td><span class="status status-success">21,400</span></td></tr>
  </tbody>
</table>
```

## Status dot and indicator

*A dot on its own, in any status colour; animated, a ring pulses out of it. The indicator is the larger mark, three circles.*

```example
<p class="status-legend">
  <span><span class="status-dot status-green"></span>a dot</span>
  <span><span class="status-dot status-red status-dot-animated"></span>animated</span>
</p>
<span class="status-indicator status-azure status-indicator-animated">
  <span class="status-indicator-circle"></span><span class="status-indicator-circle"></span><span class="status-indicator-circle"></span>
</span>
```

## Tags

*Small bordered labels in a wrapping list. A tag that is a button filters, active when chosen, with its count beside it.*

```example
<div class="tags-list">
  <span class="tag">guide</span><span class="tag">reference</span><span class="tag">examples</span>
</div>
<div class="tags-list" style="margin-top: 0.75rem" id="tag-filter">
  <button class="tag active" type="button">All <span class="tag-count">42</span></button>
  <button class="tag" type="button">Guides <span class="tag-count">27</span></button>
  <button class="tag" type="button">Reference <span class="tag-count">15</span></button>
</div>
<script>
  document.getElementById('tag-filter').addEventListener('click', function (event) {
    var tag = event.target.closest('.tag');
    if (!tag) return;
    this.querySelectorAll('.tag').forEach(function (t) { t.classList.toggle('active', t === tag); });
  });
</script>
```

## Legend

*A dot and a label, in a wrapping list; a button where it switches a series on and off.*

```example
<div class="legend-list">
  <span class="legend" style="--legend-color: var(--azure)"><span class="legend-dot"></span>Guides <span class="legend-value">412</span></span>
  <span class="legend" style="--legend-color: var(--orange)"><span class="legend-dot"></span>Reference <span class="legend-value">128</span></span>
  <span class="legend" style="--legend-color: var(--purple)"><span class="legend-dot"></span>Examples <span class="legend-value">77</span></span>
</div>
<div class="legend-list" style="margin-top: 0.75rem" id="legend-switches">
  <button class="legend active" type="button" style="--legend-color: var(--green)"><span class="legend-dot"></span>Kept</button>
  <button class="legend active" type="button" style="--legend-color: var(--red)"><span class="legend-dot"></span>Dropped</button>
</div>
<script>
  document.getElementById('legend-switches').addEventListener('click', function (event) {
    var legend = event.target.closest('.legend');
    if (legend) legend.classList.toggle('legend-off');
  });
</script>
```

## List group

*Rows of links in a card, each with a quieter line under its title, under an optional header.*

```example
<div class="card">
  <div class="list-group">
    <div class="list-group-header">Guide</div>
    <a class="list-group-item" href="../setting-up.html">
      <span class="list-group-item-title">Setting up</span>
      <div class="list-group-item-text">Installing the theme and pointing a site at it.</div>
    </a>
    <a class="list-group-item" href="../writing-pages.html">
      <span class="list-group-item-title">Writing pages</span>
      <div class="list-group-item-text">Front matter, Markdown and HTML.</div>
    </a>
    <div class="list-group-item disabled">
      <span class="list-group-item-title">Publishing <span class="badge">planned</span></span>
      <div class="list-group-item-text">Not written yet.</div>
    </div>
  </div>
</div>
```

## Datagrid

*Labels over values, flowing into as many columns as fit: better than a two-column table at any width.*

```example
<div class="datagrid">
  <div class="datagrid-item"><div class="datagrid-title">Inputs</div><div class="datagrid-content">1,344</div><div class="card-subtitle">cells and five fields</div></div>
  <div class="datagrid-item"><div class="datagrid-title">Outputs</div><div class="datagrid-content">7</div><div class="card-subtitle">one a button</div></div>
  <div class="datagrid-item"><div class="datagrid-title">Weights</div><div class="datagrid-content">9,415</div><div class="card-subtitle">7 × (inputs + bias)</div></div>
  <div class="datagrid-item"><div class="datagrid-title">Pressed when</div><div class="datagrid-content">sum &gt; 0</div><div class="card-subtitle">the larger of a pair</div></div>
</div>
```

## Empty state

*Nothing to show yet, a list with no rows, or a missing page.*

```example
<div class="empty">
  <div class="empty-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 10l.01 0"/><path d="M15 10l.01 0"/><path d="M9 15l6 0"/></svg></div>
  <p class="empty-title">No builds recorded</p>
  <p class="empty-subtitle">A build appears here once the site has been built on this machine.</p>
  <div class="empty-action"><button class="btn" type="button">Show how</button></div>
</div>
```

## Steps

*Where a sequence has got to: the steps done, the one in hand, the rest. Across, or down on a narrow page.*

```example
<ol class="steps">
  <li class="step-item done">Draft</li>
  <li class="step-item done">Review</li>
  <li class="step-item active">Build</li>
  <li class="step-item">Release</li>
</ol>
<ol class="steps steps-counter" style="margin-top: 1.5rem">
  <li class="step-item done">Parse</li>
  <li class="step-item active">Check</li>
  <li class="step-item">Render</li>
</ol>
<ol class="steps steps-vertical" style="margin-top: 1.5rem">
  <li class="step-item done"><b>Install the theme</b> into the environment MkDocs runs from.</li>
  <li class="step-item done"><b>Name it in mkdocs.yml</b>, with the plugin beside search.</li>
  <li class="step-item active"><b>Build the site</b> and open it from disk.</li>
  <li class="step-item"><b>Publish it</b> wherever the project keeps its pages.</li>
</ol>
```

## Timeline

*Events down a line, each an icon on the line and a card beside it. The icon takes its colour from `is-green`, `is-primary`, `is-yellow` or `is-red` on the event, and is gray without one; `timeline-simple` drops the icons. [The roadmap](../roadmap.md) is drawn on it.*

```example
<ol class="timeline">
  <li class="timeline-event is-green">
    <div class="timeline-event-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10"/></svg></div>
    <div class="card timeline-event-card"><div class="card-body">
      <div class="roadmap-stop-head"><b>The port</b><span class="roadmap-when">2026-10-20</span></div>
      <div>Tabler's tokens and components, hand-written.</div>
    </div></div>
  </li>
  <li class="timeline-event is-primary">
    <div class="timeline-event-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969"/><path d="M14 3.223a9.003 9.003 0 0 1 0 17.554"/><path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592"/><path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305"/><path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356"/></svg></div>
    <div class="card timeline-event-card"><div class="card-body">
      <div class="roadmap-stop-head"><b>The roadmap</b><span class="roadmap-when">under way</span></div>
      <div>Stops on this timeline, from a file.</div>
    </div></div>
  </li>
  <li class="timeline-event is-secondary">
    <div class="timeline-event-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.56 3.69a9 9 0 0 0 -2.92 1.95"/><path d="M3.69 8.56a9 9 0 0 0 -.69 3.44"/><path d="M3.69 15.44a9 9 0 0 0 1.95 2.92"/><path d="M8.56 20.31a9 9 0 0 0 3.44 .69"/><path d="M15.44 20.31a9 9 0 0 0 2.92 -1.95"/><path d="M20.31 15.44a9 9 0 0 0 .69 -3.44"/><path d="M20.31 8.56a9 9 0 0 0 -1.95 -2.92"/><path d="M15.44 3.69a9 9 0 0 0 -3.44 -.69"/></svg></div>
    <div class="card timeline-event-card"><div class="card-body">
      <div class="roadmap-stop-head"><b>The release</b><span class="roadmap-when">ahead</span></div>
      <div>A licence, and the package published.</div>
    </div></div>
  </li>
</ol>
```

