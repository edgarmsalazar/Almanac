/*
 * Almanac's runtime: theme resolution, the theme toggle and its settings panel,
 * and the helpers the other scripts share (copy, download, the address hash).
 *
 * Applied before paint (this script is not deferred) so the page never flashes
 * the wrong theme. The theme knobs are attributes on <html>:
 *
 *   data-theme          light | dark      (chosen: light | dark | auto)
 *   data-theme-base     gray | slate | zinc | neutral | stone
 *   data-theme-primary  blue | azure | … | cyan | inverted
 *   data-theme-radius   0 | 0.5 | 1 | 1.5 | 2
 *   data-theme-font     system | lexend | exo-2 | barlow
 *   data-theme-symbols  letter | keyword | word | icon   (reference pages' kind marks)
 *
 * Tabler's knobs (core/js/tabler-theme.ts), under Almanac's own storage prefix.
 * Each comes from the URL (?theme-primary=teal), else the browser's saved choice,
 * else its default. "auto" follows the operating system, live. theme.css keys off
 * all five; reference.css keys off the symbols.
 */
(function () {
  'use strict';

  var KNOBS = {
    'theme': 'light',
    'theme-base': 'neutral',
    'theme-primary': 'blue',
    'theme-radius': '1',
    'theme-font': 'barlow',
    'theme-symbols': 'letter'
  };
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  var PREFIX = 'almanac-';

  function stored(key) {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch (e) {
      /* Private mode or blocked storage: fall back to the default. */
      return null;
    }
  }

  function remember(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch (e) {
      /* Not fatal — the choice just will not survive a reload. */
    }
  }

  /* The reader's choice for a knob: the URL's (remembered), else the saved one,
     else none. The mode's default is the operating system's. */
  function chosen(key) {
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get(key);
    if (fromUrl) {
      remember(key, fromUrl);
      return fromUrl;
    }
    return stored(key) || (key === 'theme' ? 'auto' : KNOBS[key]);
  }

  /* What a choice means on the page: "auto" is the system's mode right now. */
  function apply(key, value) {
    if (key === 'theme' && value === 'auto') value = prefersDark.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-' + key, value);
  }

  /* Apply immediately, before first paint. */
  Object.keys(KNOBS).forEach(function (key) {
    apply(key, chosen(key));
  });

  /* While the mode is "auto", follow the system when it changes. */
  function followSystem() {
    if (chosen('theme') !== 'auto') return;
    apply('theme', 'auto');
    var btn = document.getElementById('theme-toggle');
    if (btn) syncToggle(btn);
  }
  if (prefersDark.addEventListener) prefersDark.addEventListener('change', followSystem);
  else if (prefersDark.addListener) prefersDark.addListener(followSystem);

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncToggle(btn) {
    var dark = currentTheme() === 'dark';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  /* Set one knob, remembered for this browser. */
  function set(key, value) {
    remember(key, value);
    apply(key, value);
  }

  /* A knob's value as the reader last set it — what the panel shows. Not
     chosen(): a URL parameter wins on load, but once the reader changes the knob
     here, the page URL still carrying the old one must not win again. */
  function saved(key) {
    return stored(key) || (key === 'theme' ? 'auto' : KNOBS[key]);
  }

  /* ------------------------------------------------------------ the panel */

  /* What the panel offers: theme.css's own [data-theme-*] rules, kept in step
     by a test. Tabler's order; the accent's are the palette's twelve hues and
     "inverted". */
  var CHOICES = {
    'theme': [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']],
    'theme-base': [['gray', 'Gray'], ['slate', 'Slate'], ['zinc', 'Zinc'],
      ['neutral', 'Neutral'], ['stone', 'Stone']],
    'theme-radius': [['0', '0'], ['0.5', '0.5'], ['1', '1'], ['1.5', '1.5'], ['2', '2']],
    'theme-font': [['system', 'System'], ['lexend', 'Lexend'], ['exo-2', 'Exo 2'], ['barlow', 'Barlow']],
    'theme-symbols': [['letter', 'Letter'], ['keyword', 'Keyword'], ['word', 'Word'], ['icon', 'Icon']]
  };
  var HUES = ['blue', 'azure', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow',
    'lime', 'green', 'teal', 'cyan', 'inverted'];
  var SECTIONS = [
    ['theme', 'Color mode', 'Light, dark, or whichever the system is set to.'],
    ['theme-primary', 'Accent', 'Links, selected options and the current section.'],
    ['theme-base', 'Theme base', 'The tint of the grays.'],
    ['theme-font', 'Font', 'The text face: the system\'s, as Tabler has it, or a free one.'],
    ['theme-radius', 'Corner radius', 'How round the corners are.'],
    ['theme-symbols', 'Code symbols', 'How a reference page marks a module, class, function or attribute.']
  ];
  /* Offered only on a page that has something for it to change. */
  var OFFERED = {
    'theme-symbols': function () { return !!document.querySelector('.doc-symbol'); }
  };

  /* Tabler icons (check, x, rotate), drawn in currentColor. */
  var SVG_OPEN = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICON_CHECK = SVG_OPEN.replace('stroke-width="2"', 'stroke-width="3"') +
    '<path d="M5 12l5 5l10 -10"/></svg>';
  var ICON_CLOSE = SVG_OPEN + '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>';
  var ICON_RESET = SVG_OPEN + '<path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5"/></svg>';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function title(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /* A knob as Tabler's segmented control in its radio form: one input and label
     per choice, spanning the panel. Arrow keys move through it natively. */
  function segmentedRadios(key) {
    var group = el('div', 'nav nav-segmented nav-sm nav-fill');
    CHOICES[key].forEach(function (choice) {
      var id = 'theme-settings-' + key + '-' + choice[0].replace('.', '-');
      var input = el('input', 'nav-link-input');
      input.type = 'radio';
      input.name = key;
      input.value = choice[0];
      input.id = id;
      var label = el('label', 'nav-link', choice[1]);
      label.htmlFor = id;
      group.appendChild(input);
      group.appendChild(label);
    });
    return group;
  }

  /* The accent as Tabler's colour swatches. Inverted shows the ink it becomes,
     with its check drawn in the surface colour so it shows on either theme. */
  function swatches(key) {
    var group = el('div', 'form-colorinput-group');
    HUES.forEach(function (hue) {
      var label = el('label', 'form-colorinput');
      label.title = title(hue);
      var input = el('input', 'form-colorinput-input');
      input.type = 'radio';
      input.name = key;
      input.value = hue;
      input.setAttribute('aria-label', title(hue));
      var swatch = el('span', 'form-colorinput-color');
      swatch.style.setProperty('--swatch', hue === 'inverted' ? 'var(--body-color)' : 'var(--' + hue + ')');
      if (hue === 'inverted') swatch.style.color = 'var(--bg-surface)';
      swatch.innerHTML = ICON_CHECK;
      label.appendChild(input);
      label.appendChild(swatch);
      group.appendChild(label);
    });
    return group;
  }

  /* The theme base as swatches of each base's own grays. The dimmed page behind
     the panel cannot show a base's tint, so each swatch does: it carries the
     base's data-theme-base, and theme.css's ramp rules colour it from there —
     no colour is copied here. */
  function rampSwatches(key) {
    var group = el('div', 'form-colorinput-group');
    CHOICES[key].forEach(function (choice) {
      var label = el('label', 'form-colorinput form-colorinput-named');
      var input = el('input', 'form-colorinput-input');
      input.type = 'radio';
      input.name = key;
      input.value = choice[0];
      var swatch = el('span', 'form-colorinput-color form-colorinput-ramp');
      swatch.setAttribute('data-theme-base', choice[0]);
      swatch.innerHTML = ICON_CHECK;
      label.appendChild(input);
      label.appendChild(swatch);
      label.appendChild(el('span', 'form-colorinput-name', choice[1]));
      group.appendChild(label);
    });
    return group;
  }

  /* Tick each knob's saved value. */
  function syncPanel(panel) {
    Array.prototype.forEach.call(panel.querySelectorAll('input[type="radio"]'), function (input) {
      input.checked = saved(input.name) === input.value;
    });
  }

  /* The panel, built on first open: every page carries the button, none carries
     this markup. A choice applies as it is made and is remembered — there is no
     Save; Reset returns every knob to its default. */
  function buildPanel(onChange) {
    var panel = el('dialog', 'offcanvas offcanvas-end offcanvas-narrow');
    panel.id = 'theme-settings';
    panel.setAttribute('aria-labelledby', 'theme-settings-title');

    var header = el('div', 'offcanvas-header');
    var heading = el('h2', 'offcanvas-title', 'Theme settings');
    heading.id = 'theme-settings-title';
    var close = el('button', 'btn-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = ICON_CLOSE;
    close.addEventListener('click', function () { panel.close(); });
    header.appendChild(heading);
    header.appendChild(close);

    var body = el('div', 'offcanvas-body');
    SECTIONS.forEach(function (section) {
      if (OFFERED[section[0]] && !OFFERED[section[0]]()) return;
      var fieldset = el('fieldset');
      fieldset.appendChild(el('legend', 'form-label', section[1]));
      fieldset.appendChild(el('p', 'form-hint', section[2]));
      var control = section[0] === 'theme-primary' ? swatches(section[0])
        : section[0] === 'theme-base' ? rampSwatches(section[0])
        : segmentedRadios(section[0]);
      fieldset.appendChild(control);
      body.appendChild(fieldset);
    });
    body.addEventListener('change', function (event) {
      var input = event.target;
      if (!input.name) return;
      set(input.name, input.value);
      onChange();
    });

    var foot = el('div', 'offcanvas-foot');
    var reset = el('button', 'btn');
    reset.type = 'button';
    reset.innerHTML = ICON_RESET;
    reset.appendChild(document.createTextNode('Reset to defaults'));
    reset.addEventListener('click', function () {
      window.Almanac.reset();
      syncPanel(panel);
      onChange();
    });
    foot.appendChild(reset);
    body.appendChild(foot);

    panel.appendChild(header);
    panel.appendChild(body);
    /* A click on the backdrop lands on the dialog itself: close, as Tabler's does. */
    panel.addEventListener('click', function (event) {
      if (event.target === panel) panel.close();
    });
    document.body.appendChild(panel);
    return panel;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    function syncMode() {
      if (toggle) syncToggle(toggle);
    }
    if (toggle) {
      syncMode();
      toggle.addEventListener('click', function () {
        set('theme', currentTheme() === 'dark' ? 'light' : 'dark');
        syncMode();
      });
    }

    /* The panel needs <dialog>; without it (or without JS) the button stays
       hidden rather than opening nothing. */
    var open = document.getElementById('theme-settings-open');
    if (!open || typeof HTMLDialogElement !== 'function') return;
    open.hidden = false;
    var panel = null;
    open.addEventListener('click', function () {
      panel = panel || buildPanel(syncMode);
      syncPanel(panel);
      panel.showModal();
    });
  });

  /* ------------------------------------------------- copy and download */
  /* Shared by the tables, so each hands out the same kind of file. */

  /* Rows of cells as text separated by `sep`: a CSV (commas, a cell quoted where
     it needs to be) or the tab-separated text a spreadsheet pastes as columns. */
  function delimited(rows, sep) {
    return rows.map(function (row) {
      return row.map(function (value) {
        var text = value === null || value === undefined ? '' : String(value);
        if (sep === ',' && /[",\n]/.test(text)) text = '"' + text.replace(/"/g, '""') + '"';
        return text;
      }).join(sep);
    }).join('\n') + '\n';
  }

  /* Copy to the clipboard: the async API where the page may use it, otherwise
     the older selection copy, which works from file:// too. */
  function copyText(text, done) {
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); if (done) done(); } catch (e) { /* nothing to report to */ }
      area.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* Save text as a file, named *name*: a Blob link, which works from file://. */
  function download(name, text) {
    var url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function slug(text) {
    return String(text || 'data').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* -------------------------------------------------------------- money */
  /* Shared by data.js and both chart scripts, so a sum reads the same in prose,
     on an axis and in a table. Here rather than in data.js because the charts
     load in <head>, before it.

     In full ($1,630.00, or no decimals for yen) or compact for an axis tick
     ($800, $1.5k, $1.2M). The currency is options.currency, else the page's
     <html data-currency>, else US dollars. Narrow symbols, so dollars read $
     rather than US$; en-GB grouping, so a sum groups like the counts beside it.
     A code Intl does not know reads as the number and the code. */
  var moneyFormats = {};
  function moneyFormat(code, decimals) {
    var key = code + '|' + decimals;
    if (!(key in moneyFormats)) {
      var options = { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' };
      if (decimals !== undefined) {
        options.minimumFractionDigits = decimals;
        options.maximumFractionDigits = decimals;
      }
      var made = null;
      try {
        made = new Intl.NumberFormat('en-GB', options);
      } catch (error) {
        /* An older browser without narrowSymbol: the plain symbol. */
        try {
          delete options.currencyDisplay;
          made = new Intl.NumberFormat('en-GB', options);
        } catch (again) {
          made = null;
        }
      }
      moneyFormats[key] = made;
    }
    return moneyFormats[key];
  }

  /* options: { currency: 'EUR', decimals: 0, compact: true }, each optional. A
     value that is not a number, nor a string of one, comes back as text. */
  function money(value, options) {
    options = options || {};
    var number = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(number)) return String(value);
    var code = String(options.currency || document.documentElement.getAttribute('data-currency') || 'USD').toUpperCase();
    if (options.compact) return moneyCompact(number, code);
    var decimals = parseInt(options.decimals, 10);
    decimals = isNaN(decimals) ? undefined : Math.max(0, Math.min(20, decimals));
    var made = moneyFormat(code, decimals);
    if (made) return made.format(number);
    var places = decimals === undefined ? 2 : decimals;
    return number.toLocaleString('en-GB', { minimumFractionDigits: places, maximumFractionDigits: places }) + ' ' + code;
  }

  /* The currency's own layout, sign and symbol, with short digits swapped in. */
  function moneyCompact(number, code) {
    var size = Math.abs(number);
    var round = function (n) { return String(Math.round(n * 100) / 100); };
    var digits = size >= 1e6 ? round(size / 1e6) + 'M' : size >= 1e3 ? round(size / 1e3) + 'k' : round(size);
    var made = moneyFormat(code, undefined);
    if (!made || !made.formatToParts) return (number < 0 ? '-' : '') + digits + ' ' + code;
    var text = '';
    var placed = false;
    made.formatToParts(number < 0 ? -1 : 1).forEach(function (part) {
      if (/^(integer|group|decimal|fraction)$/.test(part.type)) {
        if (!placed) text += digits;
        placed = true;
      } else {
        text += part.value;
      }
    });
    return text;
  }

  /* ------------------------------------------------------------ address */
  /* The hash, shared by the scripts that keep a reader's choices in it, so a
     copied link opens the page as it was: bare words are the tab panes shown
     ("examples"), key=value pairs a view's settings ("year=2024").
     Written with replaceState — the page neither jumps nor stacks history. */
  function hashParts() {
    return window.location.hash.slice(1).split('&').filter(Boolean);
  }

  function writeHash(parts) {
    if (!window.history || !window.history.replaceState) return;
    var url = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', parts.length ? url + '#' + parts.join('&') : url);
  }

  var hash = {
    /* The tab panes the address names. */
    places: function () {
      return hashParts().filter(function (part) { return part.indexOf('=') < 0; });
    },
    /* Show *chosen* in place of any of *among* (one tab row's panes). */
    place: function (among, chosen) {
      var parts = hashParts().filter(function (part) { return among.indexOf(part) < 0; });
      var places = parts.filter(function (part) { return part.indexOf('=') < 0; });
      var pairs = parts.filter(function (part) { return part.indexOf('=') >= 0; });
      writeHash(places.concat([chosen], pairs));
    },
    get: function (key) {
      var found = null;
      hashParts().forEach(function (part) {
        if (part.indexOf(key + '=') === 0) found = part.slice(key.length + 1);
      });
      return found;
    },
    /* Set *key* to *value*; an empty value removes it. */
    set: function (key, value) {
      var at = -1;
      var parts = hashParts().filter(function (part, i) {
        var mine = part.indexOf(key + '=') === 0;
        if (mine && at < 0) at = i;
        return !mine;
      });
      if (value) {
        if (at < 0) parts.push(key + '=' + value);
        else parts.splice(at, 0, key + '=' + value);
      }
      if (parts.join('&') !== hashParts().join('&')) writeHash(parts);
    }
  };

  window.Almanac = {
    hash: hash,
    delimited: delimited,
    copyText: copyText,
    download: download,
    slug: slug,
    money: money,
    knobs: KNOBS,
    chosen: chosen,
    set: set,
    /* Every knob back to its default; the mode back to following the system. */
    reset: function () {
      Object.keys(KNOBS).forEach(function (key) {
        set(key, key === 'theme' ? 'auto' : KNOBS[key]);
      });
    },
    setTheme: function (value) { set('theme', value); },
    setThemeBase: function (value) { set('theme-base', value); }
  };
})();
