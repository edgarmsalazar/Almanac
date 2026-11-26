---
title: Controls
layout: cards
description: "What a reader changes on a page: tabs, segmented controls, buttons, selects, text inputs, switches and sliders."
---

## Tabs

*Folder tabs on the surface below them, one shown at a time: Tabler's card tabs, written as pymdownx.tabbed's === sets. Each tab is a title and its indented content, and they need no script.*

```markdown
=== "Python"

    Run `python -m mkdocs build` from the site's folder.

=== "Shell"

    Run `mkdocs build`, or `mkdocs serve` to watch.
```

=== "Python"

    Run `python -m mkdocs build` from the site's folder.

=== "Shell"

    Run `mkdocs build`, or `mkdocs serve` to watch.

Name `pymdownx.tabbed` with `alternate_style: true` in `mkdocs.yml`. A tab holds any Markdown, cards and code blocks included.

## Segmented control

*One choice of a few, the chosen one switched on. As radio buttons it needs no script.*

```example
<div>
<div class="nav nav-segmented" role="radiogroup" aria-label="Scale">
  <input class="nav-link-input" type="radio" name="scale" id="scale-day" checked>
  <label class="nav-link" for="scale-day">Day</label>
  <input class="nav-link-input" type="radio" name="scale" id="scale-week">
  <label class="nav-link" for="scale-week">Week</label>
  <input class="nav-link-input" type="radio" name="scale" id="scale-month">
  <label class="nav-link" for="scale-month">Month</label>
</div>
</div>
<div style="margin-top: 0.75rem">
<div class="nav nav-segmented nav-sm" role="radiogroup" aria-label="Map">
  <input class="nav-link-input" type="radio" name="map" id="map-main" checked>
  <label class="nav-link" for="map-main">Main</label>
  <input class="nav-link-input" type="radio" name="map" id="map-sub">
  <label class="nav-link" for="map-sub">Submap</label>
</div>
</div>
```

## Buttons

*A bordered button, the primary one filled, and an icon button. [Forms and actions](forms.md) has the other colours, sizes and groups.*

```example
<button class="btn" type="button">Draw again</button>
<button class="btn btn-primary" type="button">Run</button>
<button class="btn btn-icon" type="button" aria-label="Search"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg></button>
```

## Select

*The browser's own select, restyled: its chevron, the theme's surface and border.*

```example
<label class="form-label" for="select-example">Fovea</label>
<select class="form-select" id="select-example" style="max-width: 20rem">
  <option>8 by 16, no far ring</option>
  <option>12 by 12</option>
  <option>16 by 16, far ring</option>
</select>
```

## Text input

*A text field, and one with an icon at its start.*

```example
<input class="form-control" type="text" placeholder="A name" aria-label="A name" style="max-width: 20rem">
<div class="input-icon" style="margin-top: 0.75rem; max-width: 20rem">
  <span class="input-icon-addon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg></span>
  <input class="form-control" type="search" placeholder="Search pages, such as setup" aria-label="Search pages">
</div>
```

## Switch

*A checkbox drawn as a pill whose knob slides across and takes the accent when on.*

```example
<label class="form-check form-switch"><input class="form-check-input" type="checkbox" checked><span class="form-check-label">Marks</span></label>
<label class="form-check form-switch"><input class="form-check-input" type="checkbox"><span class="form-check-label">Grid</span></label>
```

## Range

*A thin track and a round thumb in the accent, its label above with the value it holds.*

```example
<div class="range-field" style="max-width: 28rem">
  <label class="form-label" for="range-example">Slot <output id="range-out">3</output></label>
  <input class="form-range" type="range" id="range-example" min="0" max="11" value="3">
</div>
<script>
  document.getElementById('range-example').addEventListener('input', function () {
    document.getElementById('range-out').textContent = this.value;
  });
</script>
```
