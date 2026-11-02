---
title: Reference pages
description: "A Python package's reference, as mkdocstrings writes it: a card for each class and function, its members divided inside, the kind of each marked in the reader's chosen style."
---

A page that names a module with mkdocstrings' `:::` gets the theme's reference styles, and only such a page loads them. Each class and module-level function is a card, its heading the card's header: the kind's mark, the name, labels such as `dataclass` or `property` at the end, and a link that shows on hover. Its signature, docstring and sections follow; its members are rows divided inside the card.

The mark of each kind, in the headings and in the contents, is the reader's to choose: the theme settings offer *Code symbols* on a page like this one, as a letter tile, the keyword as the code reads it, the word in a badge, or an icon.

mkdocstrings is installed beside the theme (`pip install "mkdocstrings[python]"`) and named in `mkdocs.yml`; these are the options this page is drawn with:

```yaml
plugins:
  - search
  - almanac
  - mkdocstrings:
      handlers:
        python:
          paths: [source]
          options:
            heading_level: 2
            show_root_heading: true
            show_symbol_type_heading: true   # the kind's mark in the heading
            show_symbol_type_toc: true       # and in the contents
            separate_signature: true
            show_signature_annotations: true
            signature_crossrefs: true
```

The examples below document `library`, a small package written for this page, under `examples/` beside `docs/`. Each object's docstring says which of mkdocstrings' features it shows, so a change to the theme can be checked against every one of them here.

## A package

*A package's own docstring, and its modules listed in a summary.*

::: library
    options:
      heading_level: 3
      summary: true
      show_submodules: false

## Every kind of object

*A module with an attribute, a type alias, an exception, an enumeration, a protocol, an abstract class, dataclasses and a generic class; methods of every kind; every docstring section; summaries; and the classes' inheritance as a diagram.*

::: library.catalogue
    options:
      heading_level: 3
      summary: true
      show_inheritance_diagram: true
      filters: ["!^_", "!^first$"]

## Source

*An object with its source beneath it, folded.*

::: library.catalogue.first
    options:
      heading_level: 3
      show_source: true

## Section styles

*The same function in each of mkdocstrings' docstring section styles: tables, the default; lists; spaCy's; and its parameters as headings of their own.*

::: library.loans.lend
    options:
      heading_level: 3

::: library.loans.lend
    options:
      heading_level: 3
      docstring_section_style: list

::: library.loans.lend
    options:
      heading_level: 3
      docstring_section_style: spacy

::: library.loans.lend
    options:
      heading_level: 3
      parameter_headings: true
