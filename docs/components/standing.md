---
title: Page standing
layout: cards
description: "Whether a page still agrees with the code it describes: a red, amber or green dot on the map and a footer on the page."
status: drifted
checked: a1b2c3d
checked_date: 18 October 2026
commits:
  - {commit: e4f5a6b, subject: "rename the build option"}
files: [src/build.py]
---

## Four standings, three colours

*A red, amber and green marking in Tabler's status dot: green is built and agrees with the code, amber is designed and not built, red, pulsing, is drifted or disagrees.*

```example
<p class="status-legend">
  <span><span class="status-dot status-green" role="img" aria-label="Agrees with the code"></span>built: agrees with the code</span>
  <span><span class="status-dot status-yellow" role="img" aria-label="Designed, not built yet"></span>designed: not built yet</span>
  <span><span class="status-dot status-red status-dot-animated" role="img" aria-label="Changed since checked"></span>drifted or disagrees</span>
</p>
```

The two reds differ in why: drifted means the code changed after the page was checked, and the footer lists the commits since; disagrees means the page and the code were found to differ, and the footer gives the reason.

## Where it comes from

*A page's front matter, or a file the project's tooling writes, which wins.*

This page says it in its front matter, with example values; its footer, at the foot of the page, reads them back:

```yaml
status: drifted          # built, designed, drifted or disagrees
checked: a1b2c3d         # the commit it was checked against
checked_date: 18 October 2026
commits:                 # what changed since, for drifted
  - {commit: e4f5a6b, subject: "rename the build option"}
files: [src/build.py]
why: …                   # the reason, for designed or disagrees
```

A project that checks its pages against its code writes the same fields as one JSON object, keyed by each page's path under `docs/`, and names it to the plugin: `almanac: {status: page-status.json}`. A commit links where the theme's `commit_url` is set.
