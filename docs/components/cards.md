---
title: Cards and small pieces
layout: cards
description: "Card footers, actions, status strips, sizes and links; folding sections; spinners and placeholders while something loads; dividers, breadcrumbs, avatars and ribbons."
---

## Card footer and actions

*A footer for the card's buttons or a note; actions at the header's far end.*

```example
<div class="row row-cards row-deck">
  <div class="col-md-6">
    <div class="card">
      <div class="card-header">
        <div class="card-header-titles"><h3 class="card-title">Groceries</h3></div>
        <div class="card-actions">
          <button class="btn btn-sm" type="button">Edit</button>
          <button class="btn-action" type="button" aria-label="More"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M11 19a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M11 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/></svg></button>
        </div>
      </div>
      <div class="card-body">$445 of $450 spent this month.</div>
      <div class="card-footer d-flex align-items-center">
        <span class="text-secondary">Updated two minutes ago</span>
        <button class="btn btn-primary btn-sm ms-auto" type="button">Add transaction</button>
      </div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="card">
      <div class="card-header"><div class="card-header-titles"><h3 class="card-title">New envelope</h3></div></div>
      <div class="card-body">
        <label class="form-label" for="card-envelope">Name</label>
        <input class="form-control" id="card-envelope" placeholder="Gifts">
      </div>
      <div class="card-footer btn-list btn-list-end">
        <button class="btn" type="button">Cancel</button>
        <button class="btn btn-primary" type="button">Save</button>
      </div>
    </div>
  </div>
</div>
```

In a `.row-deck` the footers line up at the foot of cards of different heights. `.card-footer-transparent` drops its shading and rule.

## Status strip

*A coloured strip along a card's top, start or bottom; its colour is a `.bg-*` class.*

```example
<div class="row row-cards">
  <div class="col-md-4"><div class="card"><div class="card-status-top bg-danger"></div><div class="card-body"><h3 class="card-title">Eating out</h3><p class="text-secondary mb-0">$20 over budget.</p></div></div></div>
  <div class="col-md-4"><div class="card"><div class="card-status-start bg-green"></div><div class="card-body"><h3 class="card-title">Transport</h3><p class="text-secondary mb-0">$35 left.</p></div></div></div>
  <div class="col-md-4"><div class="card"><div class="card-status-bottom bg-yellow"></div><div class="card-body"><h3 class="card-title">Gifts</h3><p class="text-secondary mb-0">90% spent.</p></div></div></div>
</div>
```

`.bg-*` takes any semantic colour (`primary`, `success`, `warning`, `danger`, …) or hue of the palette (`red`, `orange`, `green`, …); `.bg-*-lt` is its pale tint with the hue as the text's colour.

## Sizes, borderless, active, link and stacked

*Tighter or roomier padding; no border; the chosen card; a whole card as a link that rises under the pointer; a card with a second sheet behind it.*

```example
<div class="row row-cards">
  <div class="col-md-4"><div class="card card-sm"><div class="card-body">.card-sm, for dense tiles</div></div></div>
  <div class="col-md-4"><div class="card card-borderless bg-surface-secondary"><div class="card-body">.card-borderless</div></div></div>
  <div class="col-md-4"><div class="card card-active"><div class="card-body">.card-active, the chosen one</div></div></div>
  <div class="col-md-6"><a class="card card-link card-link-pop" href="#sizes-borderless-active-link-and-stacked"><div class="card-body"><h3 class="card-title">November report</h3><p class="text-secondary mb-0">A whole card as a link.</p></div></a></div>
  <div class="col-md-6"><div class="card card-stacked"><div class="card-body"><h3 class="card-title">3 statements</h3><p class="text-secondary mb-0">.card-stacked: more behind this one.</p></div></div></div>
</div>
```

`.card-lg` gives a card roomy padding for a page with one thing on it.

## Accordion

*Sections that fold open, on native `<details>`, so they need no script. Items with the same `name` open one at a time.*

```example
<div class="accordion">
  <details class="accordion-item" name="envelopes" open>
    <summary class="accordion-button">What is an envelope?<span class="accordion-button-toggle"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6"/></svg></span></summary>
    <div class="accordion-body">Money set aside for one kind of spending, refilled each month.</div>
  </details>
  <details class="accordion-item" name="envelopes">
    <summary class="accordion-button">What happens to what is left?<span class="accordion-button-toggle"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6"/></svg></span></summary>
    <div class="accordion-body">It rolls over into next month's envelope.</div>
  </details>
</div>
<div class="accordion accordion-tabs mt-4">
  <details class="accordion-item">
    <summary class="accordion-button"><span class="accordion-button-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"/><path d="M3 10l18 0"/><path d="M7 15l.01 0"/><path d="M11 15l2 0"/></svg></span>Accounts<span class="accordion-button-toggle accordion-button-toggle-plus"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg></span></summary>
    <div class="accordion-body">Checking, savings and the credit card.</div>
  </details>
  <details class="accordion-item">
    <summary class="accordion-button"><span class="accordion-button-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/></svg></span>Recurring bills<span class="accordion-button-toggle accordion-button-toggle-plus"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg></span></summary>
    <div class="accordion-body">Rent on the 1st, phone on the 18th.</div>
  </details>
</div>
```

`.accordion-flush` drops the outer border, for an accordion filling a card; `.accordion-tabs` sets the items apart, as here; `.accordion-inverted` puts the toggle first. A plus toggle (`.accordion-button-toggle-plus`) turns into a minus when open.

## Loading

*A turning ring or a growing dot in the text's colour; three dots that count after a word; grey blocks the shape of what is coming.*

```example
<div class="d-flex flex-wrap align-items-center gap-3">
  <div class="spinner-border" role="status"><span class="visually-hidden">Loading</span></div>
  <div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading</span></div>
  <div class="spinner-grow text-success" role="status"><span class="visually-hidden">Loading</span></div>
  <button class="btn btn-primary" type="button" disabled><span class="spinner-border spinner-border-sm" aria-hidden="true"></span>Importing</button>
  <span>Reading the statement<span class="animated-dots"></span></span>
</div>
<div class="card mt-4" aria-hidden="true">
  <div class="card-body placeholder-glow">
    <div class="d-flex align-items-center gap-3 mb-3">
      <span class="avatar placeholder"></span>
      <div class="flex-fill"><span class="placeholder col-5"></span><br><span class="placeholder placeholder-xs col-3"></span></div>
    </div>
    <span class="placeholder col-7"></span>
    <span class="placeholder col-4"></span>
    <span class="placeholder col-4"></span>
    <span class="placeholder col-6"></span>
  </div>
</div>
```

A placeholder's width is a `.col-*` or `.w-*` class; `-xs`, `-sm` and `-lg` set its height. `.placeholder-glow` on its parent pulses it, `.placeholder-wave` runs a sheen across. The page swaps the placeholders for the content when it arrives.

## Divider and breadcrumb

*A rule with words on it; the way down to the page.*

```example
<p class="mb-0">Groceries, eating out and transport.</p>
<div class="hr-text">Fixed costs</div>
<p class="mb-0">Rent, phone and insurance.</p>
<div class="hr-text hr-text-start text-primary">October</div>
<nav aria-label="Breadcrumb"><ol class="breadcrumb">
  <li class="breadcrumb-item"><a href="#divider-and-breadcrumb">Budget</a></li>
  <li class="breadcrumb-item"><a href="#divider-and-breadcrumb">Reports</a></li>
  <li class="breadcrumb-item active" aria-current="page">November</li>
</ol></nav>
<nav aria-label="Breadcrumb" class="mt-2"><ol class="breadcrumb breadcrumb-arrows breadcrumb-muted">
  <li class="breadcrumb-item"><a href="#divider-and-breadcrumb">Budget</a></li>
  <li class="breadcrumb-item"><a href="#divider-and-breadcrumb">Accounts</a></li>
  <li class="breadcrumb-item active" aria-current="page">Checking</li>
</ol></nav>
```

`.hr-text-start` and `.hr-text-end` move the words to an end. A breadcrumb's separator is a slash, or dots, arrows or bullets with `.breadcrumb-dots`, `-arrows` or `-bullets`; `.breadcrumb-muted` quiets its links. In a page's header band it sits over the title.

## Avatar

*Initials, an icon or a picture, square or round, in six sizes; a status dot; a stacked list.*

```example
<div class="d-flex flex-wrap align-items-center gap-3">
  <span class="avatar">AL</span>
  <span class="avatar bg-green-lt">JM</span>
  <span class="avatar avatar-rounded bg-azure-lt">AK</span>
  <span class="avatar"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/></svg></span>
  <span class="avatar">JM<span class="badge bg-success"></span></span>
  <span class="avatar avatar-sm">SM</span>
  <span class="avatar avatar-lg bg-orange-lt">LG</span>
  <div class="avatar-list avatar-list-stacked">
    <span class="avatar avatar-rounded">AL</span>
    <span class="avatar avatar-rounded bg-green-lt">JM</span>
    <span class="avatar avatar-rounded bg-azure-lt">AK</span>
    <span class="avatar avatar-rounded">+3</span>
  </div>
</div>
```

A picture is a `style="background-image: url(…)"` on the avatar. Sizes are `-xxs`, `-xs`, `-sm`, `-md`, `-lg`, `-xl` and `-2xl`; an empty `.badge` inside is the status dot, coloured by a `.bg-*` class.

## Ribbon

*A small banner wrapped round a card's edge: an icon or a word.*

```example
<div class="row row-cards">
  <div class="col-md-4"><div class="card"><div class="card-body" style="height: 5rem">Default</div><div class="ribbon">New</div></div></div>
  <div class="col-md-4"><div class="card"><div class="card-body text-end" style="height: 5rem">Top, start, in red</div><div class="ribbon ribbon-top ribbon-start bg-red"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z"/><path d="M12 16h.01"/></svg></div></div></div>
  <div class="col-md-4"><div class="card"><div class="card-body" style="height: 5rem">Bookmark</div><div class="ribbon ribbon-bookmark bg-orange"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/></svg></div></div></div>
</div>
```

`.ribbon-top`, `.ribbon-start` and `.ribbon-bottom` move it round the card; a `.bg-*` class colours it and its fold.
