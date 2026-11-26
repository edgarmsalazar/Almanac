/*
 * Client-side table sorting.
 *
 * Binds Tabler's .table-sort markup contract, emitted in preference to
 * vendoring a library:
 *
 *   <div class="table-responsive">
 *     <table class="table">
 *       <thead><tr>
 *         <th><button class="table-sort" type="button" data-sort="sort-key">Key</button></th>
 *       </tr></thead>
 *       <tbody class="table-tbody">
 *         <tr><td class="sort-key">…</td></tr>
 *       </tbody>
 *
 * A button's data-sort names the CELL CLASS it sorts by, so a column can move
 * without the binding changing. That indirection is Tabler's, kept as-is.
 *
 * Why not list.js, which Tabler's own demo page uses: it is not vendored and not
 * in package.json (the demo loads it externally), and it DOM-diffs rendered rows
 * — which is exactly what makes it slow at the row counts a long
 * table reaches. Sorting is the whole of what it was wanted for, and this is it.
 *
 * Sorting is comparison-only and never re-renders a cell, so a row keeps
 * whatever markup the page gave it — a status chip, a link, an icon.
 *
 * The sort and export buttons are found when clicked, not bound at load, so a
 * table a page builds later sorts and exports as one written in the page. Its
 * rows replaced under a chosen sort, Almanac.table.resort(table) sorts them again.
 */
(function () {
  'use strict';

  /* Non-lexical sort keys ride on data attributes, because the rendered text is
     the wrong thing to compare: "2026-07-15 09:40" sorts fine as text but
     "9:40 AM" does not, and neither does "1,024". A date column sorted as text
     is a bug waiting to happen. */
  var KEY_ATTRS = ['data-sort-value', 'data-date', 'data-value'];

  function sortKey(cell) {
    if (!cell) return '';
    for (var i = 0; i < KEY_ATTRS.length; i++) {
      var raw = cell.getAttribute(KEY_ATTRS[i]);
      if (raw !== null) return raw;
    }
    return cell.textContent.trim();
  }

  /* A value counts as numeric only if the WHOLE string is a number. parseFloat
     alone would take "12 hours" as 12 and sort it beside a bare 12, so the
     pattern is what rejects a partial parse. Thousands separators are allowed
     because a rendered count carries them. */
  var NUMERIC = /^-?[\d,]+(\.\d+)?$/;

  function asNumber(value) {
    var text = value.trim();
    if (!NUMERIC.test(text)) return null;
    var n = parseFloat(text.replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }

  /* Numeric when BOTH sides are numeric, so a column of counts orders by
     magnitude while a column of names stays lexical. A mixed column
     falls back to text rather than coercing half of it to NaN.

     localeCompare with numeric:true is what keeps embedded digits in order —
     "W9" before "W10", which a plain string compare gets backwards. */
  function compare(a, b) {
    var na = asNumber(a);
    var nb = asNumber(b);
    if (na !== null && nb !== null) return na - nb;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  function sortBy(table, cellClass, descending) {
    var body = table.querySelector('tbody');
    if (!body) return;

    var rows = Array.prototype.slice.call(body.rows);

    /* Decorate-sort-undecorate: querySelector once per row rather than twice per
       comparison, which matters once a table has a few thousand rows. */
    var keyed = rows.map(function (row, index) {
      return {
        row: row,
        key: sortKey(row.querySelector('.' + cellClass)),
        index: index /* keeps equal rows in document order */
      };
    });

    keyed.sort(function (x, y) {
      var result = compare(x.key, y.key);
      if (result !== 0) return descending ? -result : result;
      return x.index - y.index;
    });

    /* One fragment, one reflow. */
    var fragment = document.createDocumentFragment();
    keyed.forEach(function (entry) {
      fragment.appendChild(entry.row);
    });
    body.appendChild(fragment);
  }

  function choose(button) {
    var cellClass = button.getAttribute('data-sort');
    var table = button.closest('table');
    if (!cellClass || !table) return;

    var descending = button.classList.contains('asc');

    /* Only one column carries a direction at a time: two lit arrows would
       claim the table is sorted by both. aria-sort is cleared from the th,
       which is where it was set — clearing it from the button instead leaves
       the previous column still announcing itself as sorted. */
    table.querySelectorAll('.table-sort').forEach(function (other) {
      other.classList.remove('asc', 'desc');
    });
    table.querySelectorAll('th[aria-sort]').forEach(function (th) {
      th.removeAttribute('aria-sort');
    });

    button.classList.add(descending ? 'desc' : 'asc');

    /* aria-sort belongs on the th, not the button inside it. */
    var header = button.closest('th');
    if (header) header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');

    sortBy(table, cellClass, descending);
  }

  /* A table's rows as shown — in its current sort — for a copy or a CSV: the
     header's labels, then each cell's raw value where it carries one (a number's
     data-sort-value) and its text otherwise; a gap's dash is an empty cell. */
  function tableRows(table) {
    var header = Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) {
      return th.textContent.trim();
    });
    var rows = [header];
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
      rows.push(Array.prototype.map.call(tr.cells, function (td) {
        var raw = td.getAttribute('data-sort-value');
        if (raw !== null) return raw;
        var text = td.textContent.trim();
        return text === '\u2014' ? '' : text;
      }));
    });
    return rows;
  }

  /* Copy and CSV above a table: data-table-export names the
     action, data-table the table's wrapper, looked up at the click, so a
     table or a button the page builds later is found the same way.
     settings.js holds the copy and the download, so every table's file is
     made the same way. */
  function exportFrom(button) {
    var wrapper = document.getElementById(button.getAttribute('data-table'));
    var table = wrapper && wrapper.querySelector('table');
    if (!table) return;
    if (button.getAttribute('data-table-export') === 'csv') {
      window.Almanac.download(window.Almanac.slug(wrapper.id) + '.csv',
        window.Almanac.delimited(tableRows(table), ','));
      return;
    }
    var label = button.lastChild;
    window.Almanac.copyText(window.Almanac.delimited(tableRows(table), '\t'), function () {
      /* A second click while "Copied" shows must not keep "Copied" as the label. */
      if (button._almanacLabel === undefined) button._almanacLabel = label.textContent;
      label.textContent = 'Copied';
      clearTimeout(button._almanacCopied);
      button._almanacCopied = setTimeout(function () {
        label.textContent = button._almanacLabel;
        button._almanacLabel = undefined;
      }, 1500);
    });
  }

  /* For a script that swaps a table's rows (period.js): the sort the reader chose,
     applied again to the new rows. Nothing happens on a table nobody sorted. */
  window.Almanac.table = {
    resort: function (table) {
      var active = table.querySelector('.table-sort.asc, .table-sort.desc');
      if (active) sortBy(table, active.getAttribute('data-sort'), active.classList.contains('desc'));
    }
  };

  /* One listener for the document rather than one a button, so a table or an
     export button the page builds after load works as one written in it. */
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('.table-sort, [data-table-export]');
    if (!button) return;
    if (button.classList.contains('table-sort')) choose(button);
    else exportFrom(button);
  });
})();
