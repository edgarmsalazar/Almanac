/*
 * The period a KPI row or a table shows: any complete month, week or day. From Portal.
 *
 * The control is the charts' window control — the same kinds, ‹ › stepping and dated
 * week names, in the same markup and classes — so a reader meets one way of choosing
 * a period on a page, whether it moves a chart, a row of cards or a table. It is
 * built here rather than borrowed from plot.js, which it does not touch: a chart's
 * control is one of the chart's parts, and a row's is one of the row's.
 *
 * Nothing is computed or formatted here: the page ships every window's content as
 * text, in a JSON script the component names, so it works from disk.
 *
 *   <div class="card" data-periods="kpis-data">         a component
 *     … <span data-period-name></span> against <span data-period-against></span>
 *     <div class="kpi-grid" data-period-toolbar>          the control goes before this
 *       <div class="card kpi-card" data-kpi="spent">       .kpi-value, .kpi-meta, a canvas
 *     <template data-kpi-icons><span data-icon="up">(svg)</span> … down, flat</template>
 *     <script type="application/json" id="kpis-data">{…}</script>
 *   </div>
 *   <div data-page-period></div>                         optional: the page's own control
 *
 * The JSON, for a KPI row:
 *
 *   { "id": "kpis", "type": "kpi", "kinds": ["month", "week"],
 *     "open": { "kind": "month", "label": "2026-10" },
 *     "fields": ["value", "state", "meta", "delta", "trend", "better"],
 *     "points": 8,                                       the sparkline's length
 *     "by_kind": { "month": {
 *       "labels": ["2026-09", "2026-10"],                oldest first, sortable as text
 *       "windows": { "2026-10": {
 *         "name": "Oct 2026", "against": "Sep 2026",
 *         "in": { },                                    for a week, the month holding it
 *         "cards": { "spent": ["1,630", "warn", "of 1,800 budgeted", "+4%", "up", false] } } },
 *       "sparks": { "spent": { plot.js config, its x every period of the kind } } } } }
 *
 * For a table, "type": "table", "table": the id of its <table>, "classes": each
 * column's cell class, and each window's "rows": [[[text, sort, state], …], …], a
 * cell's state cloned as a chip from <template data-status-chips> holding one
 * element per data-state. Without JS each component shows its default window, as
 * the page rendered it.
 *
 * A page may have its own period (an element marked data-page-period), which every
 * component falls back to: a component shows its OWN choice if the reader made one,
 * else the PAGE's period where it offers it, else its default. Moving the page moves
 * only the components without a choice of their own; "Follow page" drops a choice,
 * and the page's "Reset" drops every choice and the page's own, back to the defaults.
 * A chart that opts in (followsPage) follows the page too, through
 * window.Almanac.period -- but only once the page is moved: untouched, a chart keeps its
 * own opening (a trend's whole year), and a window the reader gives it is its own.
 *
 * Both are kept in the address (Almanac.hash), as a chart's view is: the page's as
 * `period=window:month,at:2026-08` when moved, a component's own choice under its id,
 * `kpis=window:day,at:2026-09-24`, only while it has one.
 */
(function () {
  'use strict';

  var KIND_NAMES = { month: 'Month', week: 'Week', day: 'Day' };

  /* Tabler's segmented control, as chart.js builds it. */
  function segmented(name, options, active, onPick) {
    var group = document.createElement('div');
    group.className = 'nav nav-segmented nav-sm';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', name);
    options.forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-link' + (option.key === active ? ' active' : '');
      button.setAttribute('aria-pressed', option.key === active ? 'true' : 'false');
      button.dataset.control = name + ':' + option.key;
      button.textContent = option.label;
      button.addEventListener('click', function () { onPick(option.key); });
      group.appendChild(button);
    });
    return group;
  }

  /* The last `points` entries of *values* whose period is at or before *label*. */
  function lastUpTo(periods, label, points) {
    var end = -1;
    periods.forEach(function (p, i) { if (p <= label) end = i; });
    return { from: Math.max(0, end - points + 1), end: end };
  }

  /* ------------------------------------------------------------ KPI row */

  /* A card's text from its packed array (the payload's `fields` order). */
  function unpack(fields, values) {
    var text = {};
    fields.forEach(function (field, i) { text[field] = values[i] === undefined ? null : values[i]; });
    return text;
  }

  /* The whole trend series cut to the last `points` periods up to *label*. */
  function cutSpark(full, label, points) {
    var span = lastUpTo(full.x, label, points);
    function slice(values) { return span.end < 0 ? [] : values.slice(span.from, span.end + 1); }
    var out = {};
    Object.keys(full).forEach(function (key) { out[key] = full[key]; });
    out.x = slice(full.x);
    out.series = (full.series || []).map(function (s) {
      var copy = {};
      Object.keys(s).forEach(function (key) { copy[key] = s[key]; });
      ['y', 'n'].forEach(function (key) { if (s[key]) copy[key] = slice(s[key]); });
      return copy;
    });
    return out;
  }

  function kpiFiller(root, data) {
    var icons = {};
    var holder = root.querySelector('template[data-kpi-icons]');
    if (holder) {
      Array.prototype.forEach.call(holder.content.querySelectorAll('[data-icon]'), function (el) {
        icons[el.getAttribute('data-icon')] = el.innerHTML;
      });
    }

    function fillCard(card, text) {
      var value = card.querySelector('.kpi-value');
      value.textContent = text.value;
      value.className = 'kpi-value' + (text.state ? ' kpi-value--' + text.state : '');
      card.querySelector('.kpi-meta').textContent = text.meta;
      var old = card.querySelector('.kpi-delta');
      if (old) old.remove();
      if (!text.delta) return;
      var tone = text.better === true ? 'better' : text.better === false ? 'worse' : 'flat';
      var delta = document.createElement('span');
      delta.className = 'kpi-delta kpi-delta--' + tone;
      var said = document.createElement('span');
      said.className = 'visually-hidden';
      said.textContent = ({ up: 'Up', down: 'Down' }[text.trend] || 'No change') + ' ';
      delta.appendChild(said);
      delta.appendChild(document.createTextNode(text.delta));
      delta.insertAdjacentHTML('beforeend', icons[text.trend === 'up' || text.trend === 'down' ? text.trend : 'flat'] || '');
      value.parentNode.appendChild(delta);
    }

    return function (shown) {
      var kind = data.by_kind[shown.kind];
      var win = kind.windows[shown.label];
      Array.prototype.forEach.call(root.querySelectorAll('[data-kpi]'), function (card) {
        var key = card.getAttribute('data-kpi');
        var packed = win.cards[key];
        fillCard(card, packed ? unpack(data.fields, packed) : { value: '—', meta: 'nothing in ' + shown.label });
        var canvas = card.querySelector('canvas');
        var chart = canvas && window.Almanac.plot ? window.Almanac.plot.get(canvas.id) : null;
        if (chart && kind.sparks[key]) chart.update(cutSpark(kind.sparks[key], shown.label, data.points));
      });
      var name = root.querySelector('[data-period-name]');
      if (name) name.textContent = win.name;
      var against = root.querySelector('[data-period-against]');
      if (against) against.textContent = win.against;
    };
  }

  /* -------------------------------------------------------------- table */

  function tableFiller(root, data) {
    var table = document.getElementById(data.table);
    var body = table && table.querySelector('tbody');
    var chips = {};
    var holder = root.querySelector('template[data-status-chips]');
    if (holder) {
      Array.prototype.forEach.call(holder.content.querySelectorAll('[data-state]'), function (el) {
        chips[el.getAttribute('data-state')] = el;
      });
    }

    function cell(values, column) {
      var td = document.createElement('td');
      td.className = data.classes[column];
      var text = values[0];
      var sort = values.length > 1 ? values[1] : null;
      var state = values.length > 2 ? values[2] : null;
      if (sort !== null && sort !== undefined) td.setAttribute('data-sort-value', sort);
      if (state && chips[state]) {
        var chip = chips[state].cloneNode(true);
        chip.removeAttribute('data-state');
        chip.textContent = text;
        td.appendChild(chip);
      } else {
        td.textContent = text;
      }
      return td;
    }

    return function (shown) {
      if (!body) return;
      var kind = data.by_kind[shown.kind];
      var win = kind.windows[shown.label];
      var rows = win.rows;
      if (!rows) {
        var span = lastUpTo(kind.periods, shown.label, kind.points);
        rows = span.end < 0 ? [] : kind.rows.slice(span.from, span.end + 1);
      }
      var fragment = document.createDocumentFragment();
      rows.forEach(function (row) {
        var tr = document.createElement('tr');
        row.forEach(function (values, column) { tr.appendChild(cell(values, column)); });
        fragment.appendChild(tr);
      });
      body.textContent = '';
      body.appendChild(fragment);
      /* A sort the reader chose holds across periods. */
      if (window.Almanac.table) window.Almanac.table.resort(table);
      var title = root.querySelector('[data-period-title]');
      if (title && win.title) title.textContent = win.title;
    };
  }

  /* ------------------------------------------------------------ control */

  /* What a control reads of whatever it chooses for: the kinds offered, each kind's
     labels (oldest first), and a window's name and the coarser windows holding it. */
  function sourceOf(data) {
    return {
      kinds: data.kinds,
      labels: function (kind) { return data.by_kind[kind] ? data.by_kind[kind].labels : []; },
      window: function (kind, label) { return data.by_kind[kind] ? data.by_kind[kind].windows[label] : undefined; }
    };
  }

  function has(source, sel) {
    return !!sel && source.labels(sel.kind).indexOf(sel.label) >= 0;
  }

  /* Where a change of kind lands: coarser, the window holding this one (a week's
     month, by its Thursday); finer, the latest inside it; else the latest. */
  function carry(source, from, kind) {
    var list = source.labels(kind);
    var here = source.window(from.kind, from.label);
    var held = here && here['in'] ? here['in'][kind] : undefined;
    if (held !== undefined && list.indexOf(held) >= 0) return held;
    var inside = list.filter(function (label) {
      var w = source.window(kind, label);
      return w && w['in'] && w['in'][from.kind] === from.label;
    });
    return inside.length ? inside[inside.length - 1] : list[list.length - 1];
  }

  /* The control: kind, then ‹ name ›, as the charts draw theirs. *pick* receives the
     reader's choice and the control it came from, so focus can be put back. */
  function drawControl(toolbar, source, shown, pick, focus) {
    var control = document.createElement('div');
    control.className = 'chart-window';
    control.appendChild(segmented('Window', source.kinds.map(function (kind) {
      return { key: kind, label: KIND_NAMES[kind] || kind };
    }), shown.kind, function (kind) {
      if (kind !== shown.kind) pick({ kind: kind, label: carry(source, shown, kind) }, 'Window:' + kind);
    }));

    var list = source.labels(shown.kind);
    var at = list.indexOf(shown.label);
    var nav = document.createElement('div');
    nav.className = 'chart-window-nav';
    [['earlier', '‹', -1], ['later', '›', 1]].forEach(function (spec, k) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'chart-window-arrow';
      button.textContent = spec[1];
      button.dataset.control = 'Nav:' + spec[0];
      button.setAttribute('aria-label', 'Show the ' + spec[0] + ' ' + (KIND_NAMES[shown.kind] || '').toLowerCase());
      var next = list[at + spec[2]];
      button.disabled = next === undefined;
      button.addEventListener('click', function () {
        pick({ kind: shown.kind, label: next }, 'Nav:' + spec[0]);
      });
      if (k === 1) {
        var label = document.createElement('span');
        label.className = 'chart-window-label' + (shown.kind === 'week' ? ' chart-window-label--dated' : '');
        label.setAttribute('aria-live', 'polite');
        var win = source.window(shown.kind, shown.label);
        label.textContent = win ? win.name : shown.label;
        nav.appendChild(label);
      }
      nav.appendChild(button);
    });
    control.appendChild(nav);

    toolbar.textContent = '';
    toolbar.appendChild(control);
    if (focus) {
      var again = control.querySelector('[data-control="' + focus + '"]');
      if (again && !again.disabled) again.focus();
    }
    return control;
  }

  /* A choice as the address carries it, and back -- only a window the source offers. */
  function encode(sel) {
    return 'window:' + window.Almanac.slug(sel.kind) + ',at:' + window.Almanac.slug(sel.label);
  }

  function decode(source, text) {
    if (!text) return null;
    var view = {};
    text.split(',').forEach(function (pair) {
      var at = pair.indexOf(':');
      if (at > 0) view[pair.slice(0, at)] = pair.slice(at + 1);
    });
    var kind = source.kinds.filter(function (k) { return window.Almanac.slug(k) === view.window; })[0];
    if (!kind) return null;
    var label = source.labels(kind).filter(function (l) { return window.Almanac.slug(l) === view.at; })[0];
    return label ? { kind: kind, label: label } : null;
  }

  function same(a, b) { return !!a && !!b && a.kind === b.kind && a.label === b.label; }

  /* ------------------------------------------------- components and the page */

  /* Every component on the page, and the page period they fall back to (14c):
     a component shows its OWN choice if the reader made one, else the PAGE's period
     where it offers it, else its default -- the latest complete week. Moving the page
     moves only the components without a choice of their own. */
  var components = [];
  var page = { source: null, opening: null, chosen: null, toolbar: null };

  /* Charts that asked to follow the page period (14d) register here: chart.js keeps
     its own window state; this script only tells it the page's period, with the
     coarser windows holding it, and asks whether it has a window of its own. */
  var followers = [];
  window.Almanac.period = {
    follow: function (follower) { followers.push(follower); },
    changed: function () { renderPage(); },
    hasPage: function () { return !!page.toolbar; },
    page: function () { return page.chosen; }
  };

  function tellFollowers() {
    var sel = page.chosen;
    var win = sel && page.source ? page.source.window(sel.kind, sel.label) : null;
    var holders = win && win['in'] ? win['in'] : {};
    followers.forEach(function (f) { f.show(sel, holders); });
  }

  function pageShown() { return page.chosen || page.opening; }

  function shownBy(c) {
    if (c.own) return c.own;
    var p = pageShown();
    return has(c.source, p) ? p : c.opening;
  }

  function renderComponent(c, focus) {
    var shown = shownBy(c);
    c.fill(shown);
    drawControl(c.toolbar, c.source, shown, function (sel, from) {
      c.own = sel;
      renderComponent(c, from);
      renderPage();
    }, focus);
    /* Back to the page's period: only for a component with a choice of its own, on a
       page that has one to follow. */
    if (c.own && page.toolbar) {
      var follow = document.createElement('button');
      follow.type = 'button';
      follow.className = 'btn btn-sm period-follow';
      follow.textContent = 'Follow page';
      follow.title = 'Drop this choice and show the page’s period';
      follow.addEventListener('click', function () {
        c.own = null;
        renderComponent(c);
        renderPage();
      });
      c.toolbar.appendChild(follow);
    }
    window.Almanac.hash.set(c.data.id, c.own ? encode(c.own) : '');
  }

  function renderPage(focus) {
    if (!page.toolbar) return;
    var label = document.createElement('span');
    label.className = 'period-page-label';
    label.textContent = 'Page period';
    drawControl(page.toolbar, page.source, pageShown(), function (sel, from) {
      page.chosen = same(sel, page.opening) ? null : sel;
      renderPage(from);
      components.forEach(function (c) { if (!c.own) renderComponent(c); });
      tellFollowers();
    }, focus);
    page.toolbar.insertBefore(label, page.toolbar.firstChild);
    /* Everything back to its default: the page's period and every component's own
       choice, which a reload would otherwise keep from the address (user). Offered
       only while something differs. */
    var mine = components.filter(function (c) { return c.own; }).length +
      followers.filter(function (f) { return f.own(); }).length;
    if (page.chosen || mine) {
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'btn btn-sm period-reset';
      reset.textContent = 'Reset';
      reset.title = 'Every row, table and chart back to its default period' +
        (mine ? ' (' + mine + ' with a period of its own)' : '');
      reset.addEventListener('click', function () {
        page.chosen = null;
        components.forEach(function (c) { c.own = null; });
        followers.forEach(function (f) { f.clear(); });
        renderAll();
        var control = page.toolbar.querySelector('[data-control="Window:' + pageShown().kind + '"]');
        if (control) control.focus();
      });
      page.toolbar.appendChild(reset);
    }
    window.Almanac.hash.set('period', page.chosen ? encode(page.chosen) : '');
  }

  function bind(root) {
    var source = document.getElementById(root.getAttribute('data-periods'));
    if (!source || !window.Almanac) return null;
    var data = JSON.parse(source.textContent);
    if (!data.open) return null;
    var toolbar = document.createElement('div');
    toolbar.className = 'chart-toolbar period-toolbar';
    var anchor = root.querySelector('[data-period-toolbar]');
    anchor.parentNode.insertBefore(toolbar, anchor);
    return {
      data: data,
      source: sourceOf(data),
      fill: data.type === 'table' ? tableFiller(root, data) : kpiFiller(root, data),
      opening: { kind: data.open.kind, label: data.open.label },
      own: null,
      toolbar: toolbar
    };
  }

  /* The page's choices: the windows any of its components offers, named as they name
     them; opening where they open -- the latest complete week. */
  function pageSource() {
    var order = ['month', 'week', 'day'];
    var kinds = order.filter(function (kind) {
      return components.some(function (c) { return c.source.labels(kind).length; });
    });
    var labels = {};
    kinds.forEach(function (kind) {
      var seen = {};
      components.forEach(function (c) { c.source.labels(kind).forEach(function (l) { seen[l] = true; }); });
      labels[kind] = Object.keys(seen).sort();
    });
    return {
      kinds: kinds,
      labels: function (kind) { return labels[kind] || []; },
      window: function (kind, label) {
        for (var i = 0; i < components.length; i++) {
          var w = components[i].source.window(kind, label);
          if (w) return w;
        }
        return undefined;
      }
    };
  }

  /* What the address says: the page's period, and each component's own choice. */
  function restore() {
    if (page.toolbar) page.chosen = decode(page.source, window.Almanac.hash.get('period'));
    components.forEach(function (c) { c.own = decode(c.source, window.Almanac.hash.get(c.data.id)); });
  }

  function renderAll() {
    renderPage();
    components.forEach(function (c) { renderComponent(c); });
    tellFollowers();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-periods]'), function (root) {
      var c = bind(root);
      if (c) components.push(c);
    });
    var holder = document.querySelector('[data-page-period]');
    if (holder && components.length) {
      page.source = pageSource();
      var kind = page.source.kinds.indexOf('week') >= 0 ? 'week' : page.source.kinds[0];
      var list = page.source.labels(kind);
      page.opening = { kind: kind, label: list[list.length - 1] };
      page.toolbar = document.createElement('div');
      page.toolbar.className = 'chart-toolbar period-toolbar period-page';
      holder.appendChild(page.toolbar);
    }
    restore();
    renderAll();
    window.addEventListener('hashchange', function () { restore(); renderAll(); });
  });
})();
