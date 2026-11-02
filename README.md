# Almanac

An MkDocs theme and plugin for reference sites, after Tabler's look. Every page shares a navbar drawn from the site's `nav` and a header band naming the page; its front matter picks the layout of its body. The built site opens from disk with no server.

## Install

For Almanac's own work, its conda environment installs it from this folder, editable, with its tests' needs and mkdocstrings, which the guide's reference page is drawn with:

```bash
conda env create -f environment.yml
conda activate almanac
```

In another project, into the environment that builds its site, while Almanac has no release:

```bash
pip install -e ../Almanac
```

or in that project's `environment.yml`, under `pip:`, as `- -e ../Almanac`. Its builds then use Almanac as this folder has it; for `mkdocs serve` to reload when Almanac changes too, name the folder in that project's `mkdocs.yml`:

```yaml
watch:
  - ../Almanac/source/almanac
```

## Use

```yaml
use_directory_urls: false

theme:
  name: almanac
  icon: images/icon.svg     # optional, under docs_dir; an .svg is drawn inline
  navigation: navbar        # or sidebar
  sections:                 # optional: a Tabler icon and a line for each section of nav
    Guide: {icon: book, about: "Installing and writing."}
  commit_url: null          # optional, where a page's standing links its commits

plugins:
  - search
  - almanac:
      lexicon: lexicon.json # optional, under docs_dir
      roadmap: roadmap.json # optional, under docs_dir
      status: null          # optional, each page's standing, as JSON under docs_dir

markdown_extensions:
  - attr_list
  - md_in_html
  - toc
  - pymdownx.highlight
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_div_format
        - name: example     # optional: HTML drawn live with its markup beneath
          class: example
          format: !!python/name:almanac.fences.example_format
```

A page's front matter takes `title`, `pretitle`, `description`, `layout` (`docs` by default, or `cards`), `data`, `scripts`, `map` (the site's map under the page) and its standing (`status`, `checked`, `checked_date`, `commits`, `files`, `why`). The theme's settings default to the Neutral base and the Barlow font.

The site in `docs/` is the guide and every component, drawn live with its markup, built with the theme itself:

```bash
mkdocs build && open site/index.html
mkdocs build -f mkdocs-sidebar.yml && open site-sidebar/index.html   # the sidebar navigation
```

## Layout of the repository

| Path | Holds |
| --- | --- |
| `source/almanac/theme/main.html` | The page shell, the one template. |
| `source/almanac/theme/assets/` | The CSS, scripts and fonts the site loads. `theme.css` and `components.css` are a hand-written port of Tabler; `almanac.css` and `almanac.js` are the theme's own layout. |
| `source/almanac/plugin.py` | Cards from a cards page's sections, the theme's classes on Markdown tables, the lexicon as `data/lexicon.js`, the search index as `search/search_index.js`, each page's standing, and the template's icon helpers. |
| `source/almanac/fences.py` | The `example` fence. |
| `source/almanac/lexicon.py`, `roadmap.py` | The pages a `lexicon: true` or `roadmap: true` page draws from its file. |
| `source/almanac/admonitions.py` | Admonitions drawn as Tabler alerts; the plugin adds it to Markdown. |
| `source/almanac/icons/` | Tabler's outline icons, drawn into a page by name. Not copied into the site. |
| `docs/` | The guide and showcase. |
| `tests/` | The plugin's and the admonitions' tests: `pytest`. |

Almanac is proprietary; see `LICENSE`. Third-party work it carries is under its own licences, listed in `NOTICE.md`.
