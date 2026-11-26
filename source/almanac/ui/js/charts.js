/*
 * Bar charts of fixed data, drawn as HTML.
 *
 * Tabler draws its charts with ApexCharts, on canvas, with controls for windows
 * and views. A reference page's figures are
 * measured once and never filtered, so this is only the chart: one horizontal
 * bar a row on a shared scale, a value axis below with round ticks and their
 * gridlines, the value at each bar's end. Labels are HTML, so a row can carry a
 * caption under its name and the chart reflows with the page.
 *
 *   Almanac.charts.bars(element, {
 *     rows: [{ label: 'a page', caption: '…', value: 222, reference: false }],
 *     title: 'By section',         // the chart's title, centred over its plot, optional
 *     axis: 'pages',               // the axis's title, optional
 *     format: function (n) { … }   // a value as shown, optional; or 'currency'
 *     tickFormat: function (n) { … }  // an axis tick as shown, optional, else format;
 *                                  // 'currency' gives compact ticks ($1.5k)
 *     currency: 'EUR',             // for 'currency'; else <html data-currency>, else USD
 *     log: { low: 0.1, high: 1e5 } // a log scale between two powers of ten, optional
 *   });
 *
 * A row marked reference is drawn in gray: something the others are measured
 * against rather than one of them. With format 'currency' a value reads in full
 * ($1,630.00) and a tick compact ($1.5k), the symbol from Intl.
 */
(function () {
  'use strict';

  /* Round ticks from 0 to at least top: steps of 1, 2 or 5 times a power of ten, about five. */
  function ticks(top) {
    if (top <= 0) return [0, 1];
    var raw = top / 5;
    var power = Math.pow(10, Math.floor(Math.log10(raw)));
    var step = [1, 2, 5, 10].map(function (m) { return m * power; }).filter(function (s) { return s >= raw; })[0];
    var out = [];
    for (var t = 0; t < top + step; t += step) out.push(t);
    return out;
  }

  /* Money in the chart's currency: in full, or compact for a tick ($800, $1.5k,
     $1.2M), in the currency's own layout with the digits swapped in. Narrow
     symbols, so dollars read $ rather than US$. A code Intl does not know reads
     as the number and the code. */
  function money(code, compact) {
    code = String(code || document.documentElement.getAttribute('data-currency') || 'USD').toUpperCase();
    var made = null;
    try {
      made = new Intl.NumberFormat('en-GB', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' });
    } catch (error) {
      try { made = new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }); } catch (again) { made = null; }
    }
    return function (n) {
      if (!compact) {
        return made ? made.format(n)
          : n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + code;
      }
      var size = Math.abs(n);
      var round = function (x) { return String(Math.round(x * 100) / 100); };
      var digits = size >= 1e6 ? round(size / 1e6) + 'M' : size >= 1e3 ? round(size / 1e3) + 'k' : round(size);
      if (!made || !made.formatToParts) return (n < 0 ? '-' : '') + digits + ' ' + code;
      var text = '';
      var placed = false;
      made.formatToParts(n < 0 ? -1 : 1).forEach(function (part) {
        if (/^(integer|group|decimal|fraction)$/.test(part.type)) {
          if (!placed) text += digits;
          placed = true;
        } else {
          text += part.value;
        }
      });
      return text;
    };
  }

  function escape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function bars(element, options) {
    var rows = options.rows;
    var format = options.format === 'currency' ? money(options.currency, false)
      : options.format || function (n) { return n.toLocaleString('en-GB'); };
    var top = Math.max.apply(null, rows.map(function (row) { return row.value; }));
    var scale = ticks(top);
    var end = scale[scale.length - 1];
    /* Where a value sits along the plot, as a share of it: linear from 0, or by its logarithm. */
    var at = function (value) { return 100 * value / end; };
    if (options.log) {
      var low = options.log.low, high = options.log.high;
      scale = [];
      for (var power = low; power <= high * 1.0001; power *= 10) scale.push(power);
      at = function (value) { return 100 * Math.log10(Math.max(value, low) / low) / Math.log10(high / low); };
    }
    /* The title, where there is one, takes the first row; the bars follow it. */
    var first = options.title ? 2 : 1;
    var html = (options.title ? '<div class="chart-title" style="grid-row: 1">' + escape(options.title) + '</div>' : '') +
      '<div class="chart-grid" style="grid-row: ' + first + ' / span ' + rows.length + '">' +
      scale.map(function (t) { return '<span style="left: ' + at(t) + '%"></span>'; }).join('') + '</div>';
    /* Each row placed by number: the gridlines span every row's plot cell, so nothing may be
       left to auto-placement, which would push a row's plot below them. */
    var tickFormat = options.tickFormat === 'currency' || (!options.tickFormat && options.format === 'currency')
      ? money(options.currency, true) : options.tickFormat || format;
    rows.forEach(function (row, i) {
      var place = ' style="grid-row: ' + (first + i) + '"';
      html += '<div class="chart-label"' + place + '>' + (row.html || escape(row.label)) +
        (row.caption ? '<small>' + escape(row.caption) + '</small>' : '') + '</div>' +
        '<div class="chart-plot"' + place + (row.title ? ' title="' + escape(row.title) + '"' : '') + '>' +
        '<div class="chart-bar' + (row.reference ? ' is-reference' : '') + '" style="width: ' + at(row.value) + '%"></div>' +
        '<span class="chart-value" style="left: ' + at(row.value) + '%">' + escape(format(row.value)) + '</span></div>';
    });
    html += '<div class="chart-axis" style="grid-row: ' + (first + rows.length) + '">' + scale.map(function (t) {
      return '<span style="left: ' + at(t) + '%">' + escape(tickFormat(t)) + '</span>';
    }).join('') + '</div>';
    if (options.axis) html += '<div class="chart-axis-title" style="grid-row: ' + (first + rows.length + 1) + '">' + escape(options.axis) + '</div>';
    element.className = 'chart-bars';
    element.innerHTML = html;
  }

  window.Almanac.charts = { bars: bars, ticks: ticks };
})();
