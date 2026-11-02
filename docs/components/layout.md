---
title: Layout
layout: cards
description: "How a page is put together: cards, sections side by side, the intro block, the site's map, drawers, the contents panel, the sidebar, pictures by the pixel, pictures for one theme and printing."
---

## Card

*A raised surface with a header, a title and a subtitle. A cards page makes one of each ## section; one can be written by hand.*

```example
<div class="card">
  <div class="card-header">
    <div class="card-header-titles">
      <h2 class="card-title">The window</h2>
      <p class="card-subtitle">Six sections at fixed places.</p>
    </div>
  </div>
  <div class="card-body">
    <div class="prose"><p>A card's body holds prose, a figure or both.</p></div>
  </div>
</div>
```

On a docs page, a card is written around Markdown with `<div class="card" markdown>`; [Writing pages](../writing-pages.md) has one.

## Section row

*Two blocks side by side, a figure beside its words, stacking on a narrow window.*

```example
<div class="split">
  <div class="prose">
    <p>Each button has its own weighted sum: one weight for every value of the sight, plus a bias. Where the sum is above 0 the button is pressed.</p>
  </div>
  <div class="datagrid">
    <div class="datagrid-item"><div class="datagrid-title">Outputs</div><div class="datagrid-content">7</div></div>
    <div class="datagrid-item"><div class="datagrid-title">Pressed when</div><div class="datagrid-content">sum &gt; 0</div></div>
  </div>
</div>
```

## Intro

*A front page's one block: art beside a short statement of what the project is.*

```example
<div class="intro">
  <div class="intro-art" aria-hidden="true">
    <img class="intro-icon" src="../images/icon.svg" alt="">
  </div>
  <div class="intro-body">
    <h2 class="intro-title">Almanac</h2>
    <p class="intro-text">An MkDocs theme for reference sites, after Tabler's look.</p>
    <p class="intro-note">Pages marked <span class="badge">planned</span> are not written yet.</p>
  </div>
</div>
```

## The site's map

*A card a section of nav, each page a row with its description and its standing.*

The [home page](../index.md) shows it: `map: true` in a page's front matter draws the map under the page's content. A section's icon and its line come from the theme's `sections` option in `mkdocs.yml`, a page's line from its `description`, and its dot from its [standing](standing.md).

## Drawer

*A panel sliding in from the side, wide enough to hold a whole record. A button with data-open names it, a button inside with data-close shuts it.*

```example
<button class="btn" type="button" data-open="drawer-example">Open the record</button>
<dialog class="offcanvas offcanvas-end offcanvas-wide" id="drawer-example" aria-labelledby="drawer-example-title">
  <div class="offcanvas-header">
    <h2 class="offcanvas-title" id="drawer-example-title">A record</h2>
    <button class="btn-close" type="button" aria-label="Close" data-close><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></button>
  </div>
  <div class="offcanvas-body">
    <div class="datagrid">
      <div class="datagrid-item"><div class="datagrid-title">Table</div><div class="datagrid-content">normal</div></div>
      <div class="datagrid-item"><div class="datagrid-title">Number</div><div class="datagrid-content">0x0D</div></div>
    </div>
  </div>
</dialog>
```

## Contents

*The page's sections, a click away.*

On a cards page the floating button at the bottom right opens them in a side panel, read from the page's cards. On a docs page they sit in a column beside the article, marking the section being read, and the button takes over on a narrower window.

## Sidebar

*The site's navigation down the left instead of across the top.*

Set `navigation: sidebar` under `theme:` in `mkdocs.yml`. Each section opens in place, the current one open from the start, and the theme's switches sit at its foot. This site built that way: `mkdocs build -f mkdocs-sidebar.yml`, into `site-sidebar/`.

## Pictures by the pixel

*A small picture drawn by whole pixels at any size; on checks, what is transparent shows as such.*

```example
<img class="pixel checker" width="96" height="96" alt="An icon, eight pixels square" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAANElEQVR4nGNggAINDZv/yJgBGYAEnkWhYrgiZMn/zyrAGEURSQqIsgZDEtmh2NgoXsTGBwB/z2LfNdq8jgAAAABJRU5ErkJggg==">
<img width="96" height="96" alt="The same icon, smoothed" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAANElEQVR4nGNggAINDZv/yJgBGYAEnkWhYrgiZMn/zyrAGEURSQqIsgZDEtmh2NgoXsTGBwB/z2LfNdq8jgAAAABJRU5ErkJggg==">
```

## Pictures for one theme

*An image marked for the light or the dark theme shows only in that one, as Material for MkDocs and GitHub mark them. Switch the theme to see the other.*

```markdown
![Drawn for the light theme](../images/theme-light.svg#only-light)
![Drawn for the dark theme](../images/theme-dark.svg#only-dark)
```

![Drawn for the light theme](../images/theme-light.svg#only-light)
![Drawn for the dark theme](../images/theme-dark.svg#only-dark)

GitHub's own marks, `#gh-light-mode-only` and `#gh-dark-mode-only`, work too.

## Printing

*A printed page keeps its content and drops the chrome.*

The navbar, the header band's controls, the contents and the pager carry `d-print-none`, so a page printed or saved as PDF is its article alone. Anything of a page's own that is only for the screen takes the same class.
