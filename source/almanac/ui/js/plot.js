/*
 * Canvas charts: bars, lines and box plots over one x axis, from Portal.
 *
 * Portal's own renderer; an older dashboard's was consulted for the fiddly
 * maths (nice-number ticks, DPI scaling), but no code was carried over. For a
 * short list of fixed figures as HTML bars, charts.js is the lighter choice.
 *
 * Design: generic series types that compose into specifics. A chart is a list
 * of series, each {type, label, y, axis}. A pareto is not a chart type; it is a
 * bar series on the left axis plus a line series on the right.
 *
 * Colours come from CSS custom properties (theme.css's chart ramp), so a theme
 * change is a repaint with no config change.
 *
 *   <canvas id="spending" class="plot"></canvas>
 *   <script>
 *     Almanac.plot.create('spending', {
 *       title: 'Spending by month',  // its name for a screen reader, and the CSV's
 *       height: 260,                 // px, optional
 *       x: ['Jan', 'Feb', 'Mar'],    // one label a point; every series aligns to it
 *       series: [
 *         { type: 'bar',  label: 'Spent',  y: [1200, 980, null] },  // null: a gap
 *         { type: 'line', label: 'Budget', y: [1100, 1100, 1100], axis: 'left',
 *           color: '--chart-2', dashed: true, hidden: false }
 *         // a box: { type: 'box', label, median: [], p25: [], p75: [], p10: [], p90: [] }
 *         // a line may carry lo / hi whiskers and bands: [{lo: [], hi: []}, …]
 *       ],
 *       xAxis: { title: 'Month', rotate: false, hideLabels: false, unit: '' },
 *       yAxis: { title: 'Amount', tickFormat: 'percent', min: 0, max: 1, scale: 'log' },
 *       yAxisRight: { … },           // for a series with axis: 'right'
 *       refLines: [{ axis: 'left', value: 1000, label: 'Limit', color: '--danger', dashed: true }],
 *       views: [{ label: 'By month', series: [...] }, …],  // alternative series sets, toggled
 *       sparkline: false,            // the line alone, for a KPI card's foot
 *       offerTable: false            // a Copy / CSV / "show as table" control
 *     });
 *   </script>
 *
 * Every key but x and series is optional. Colours are token names ('--chart-3',
 * '--danger'), so they follow the theme. Calendar windows (steps, or windowCharts
 * with windows: month, week, day, stepped with ‹ ›) are described where they are
 * handled, below. Almanac.plot.get(id) gives a chart back, and its
 * update(config) redraws it.
 *
 * The legend is DOM, and each entry toggles its series: hidden, a series leaves
 * the plot and the scale. A view of the shipped data, never a new number.
 */
(function () {
  'use strict';

  var charts = {};
  var observing = false;

  /* --------------------------------------------------------------- tokens */

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function readPalette() {
    var series = [];
    for (var i = 1; i <= 12; i++) {
      var value = cssVar('--chart-' + i);
      if (!value) break;
      series.push(value);
    }
    var dashes = [];
    for (var d = 1; d <= 6; d++) {
      var pattern = cssVar('--chart-dash-' + d);
      if (!pattern) break;
      dashes.push(pattern === 'none' ? [] : pattern.split(/[ ,]+/).map(Number));
    }
    if (!dashes.length) dashes = [[]];
    return {
      series: series,
      dashes: dashes,
      other: cssVar('--chart-other') || cssVar('--secondary'),
      grid: cssVar('--chart-grid') || cssVar('--border-color'),
      axis: cssVar('--chart-axis') || cssVar('--secondary'),
      text: cssVar('--body-color'),
      surface: cssVar('--bg-surface')
    };
  }

  /* Identity is hue x dash, assigned in fixed order and never cycled on hue
   * alone: two series sharing a colour are indistinguishable, and cycling makes
   * that happen silently. With 8 hues and 3 dash patterns a line chart carries
   * 24 distinct series; past that, callers are told to fold the tail into
   * "Other" rather than being handed a duplicate. */
  function encodingFor(palette, index, isLine) {
    var hues = palette.series.length || 1;
    if (!isLine) {
      /* Bars cannot carry a dash legibly, so their capacity is the hue count. */
      return index < hues
        ? { color: palette.series[index], dash: [] }
        : { color: palette.other, dash: [] };
    }
    var capacity = hues * palette.dashes.length;
    if (index >= capacity) return { color: palette.other, dash: [] };
    return {
      color: palette.series[index % hues],
      dash: palette.dashes[Math.floor(index / hues)]
    };
  }

  /* Series past the palette's capacity all render as "Other". Warn once so the
   * page author sees it in the console rather than discovering it visually. */
  function warnIfOverCapacity(series, palette) {
    var lines = series.filter(function (s) { return (s.type || 'bar') !== 'bar'; }).length;
    var bars = series.length - lines;
    var lineCap = (palette.series.length || 1) * palette.dashes.length;
    var barCap = palette.series.length || 1;
    if (lines > lineCap || bars > barCap) {
      console.warn(
        'Almanac.plot: ' + series.length + ' series exceeds palette capacity (' +
        barCap + ' bars, ' + lineCap + ' lines). Excess renders as "Other" — ' +
        'consider small multiples or grouping the tail.'
      );
    }
  }

  /* ---------------------------------------------------------------- scale */

  /* Round a raw step up to 1, 2, 5 or 10 x a power of ten, so axis labels land
     on numbers a reader expects rather than on 3.7-unit intervals. */
  function niceStep(range, target) {
    if (range <= 0) return 1;
    var raw = range / Math.max(target, 1);
    var magnitude = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var normalised = raw / magnitude;
    var step;
    if (normalised <= 1) step = 1;
    else if (normalised <= 2) step = 2;
    else if (normalised <= 5) step = 5;
    else step = 10;
    return step * magnitude;
  }

  function ticksFor(min, max, count) {
    if (min === max) {
      min = Math.min(0, min);
      max = max || 1;
    }
    var step = niceStep(max - min, count);
    var start = Math.floor(min / step) * step;
    var end = Math.ceil(max / step) * step;
    var ticks = [];
    for (var v = start; v <= end + step / 2; v += step) {
      ticks.push(Math.abs(v) < step / 1e6 ? 0 : v);
    }
    return { ticks: ticks, min: start, max: end };
  }

  function extent(series, axis, fromZero) {
    var lo = Infinity;
    var hi = -Infinity;
    series.forEach(function (s) {
      if ((s.axis || 'left') !== axis) return;
      /* Interval ends and box whiskers belong to the scale too, or a whisker
         would run off the plot. */
      var spans = [];
      (s.bands || []).forEach(function (band) { spans.push(band.lo, band.hi); });
      [s.y, s.lo, s.hi, s.p10, s.p90].concat(spans).forEach(function (values) {
        (values || []).forEach(function (v) {
          if (v === null || v === undefined || isNaN(v)) return;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        });
      });
    });
    if (lo === Infinity) return null;
    return { min: fromZero === false ? lo : Math.min(0, lo), max: hi };
  }

  /* --------------------------------------------------------------- canvas */

  /* Back the canvas with device pixels so lines and text are not blurry on a
     HiDPI display, then work in CSS pixels for the rest of the draw. */
  function scaleCanvas(canvas, ctx, width, height) {
    var ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /* 'percent' labels a 0-1 axis as 0-100 %: the values stay rates, only the
     label changes, so a tooltip or a reference line reads the same numbers. */
  function formatTick(value, format) {
    if (format === 'percent') return String(Math.round(value * 1000) / 10) + '%';
    if (Math.abs(value) >= 1000) return value / 1000 + 'k';
    return String(Math.round(value * 100) / 100);
  }

  /* A colour in a config is a token name ('--chart-3'), never a literal, so it
     follows the theme; resolved at paint time like the palette itself. */
  function resolveColor(color, fallback) {
    if (!color) return fallback;
    return color.indexOf('--') === 0 ? cssVar(color) || fallback : color;
  }

  /* An axis's scale: nice ticks over the data, unless the config pins either
     end — a rate axis reads better fixed at 0-1 than fitted to 0.62-0.97. */
  function scaleFor(series, axis, spec, room) {
    if (spec.scale === 'log') return logScaleFor(series, axis, spec, room);
    var found = extent(series, axis) || { min: 0, max: 1 };
    var lo = spec.min !== undefined && spec.min !== null ? spec.min : found.min;
    var hi = spec.max !== undefined && spec.max !== null ? spec.max : found.max;
    var scale = ticksFor(lo, hi, 5);
    if (spec.min !== undefined && spec.min !== null) scale.min = spec.min;
    if (spec.max !== undefined && spec.max !== null) scale.max = spec.max;
    scale.ticks = scale.ticks.filter(function (t) {
      return t >= scale.min - 1e-9 && t <= scale.max + 1e-9;
    });
    return scale;
  }

  /* A sparkline's scale: the data's own range with a little air, no ticks. It
     shows how a metric moved, which a zero-based axis would flatten — 76 to 81 %
     on 0 to 100 % is a straight line. The card beside it states the value. */
  function sparkScale(series, refLines) {
    var found = extent(series, 'left', false) || { min: 0, max: 1 };
    /* A reference value — the band's good line — widens the range to include
       it, so the line reads as above or below target without an axis. */
    (refLines || []).forEach(function (line) {
      var v = Number(line.value);
      if (line.axis !== 'y' || isNaN(v)) return;
      found = { min: Math.min(found.min, v), max: Math.max(found.max, v) };
    });
    var air = (found.max - found.min) * 0.15 || Math.abs(found.max) * 0.1 || 1;
    return { min: found.min - air, max: found.max + air, ticks: [] };
  }

  /* The 1-2-5 value at or below (down) or at or above (up) v. */
  function oneTwoFive(v, up) {
    var decade = Math.pow(10, Math.floor(Math.log(v) / Math.LN10 + 1e-9));
    var steps = [1, 2, 5, 10];
    var found = up ? 10 : 1;
    for (var i = 0; i < steps.length; i++) {
      var tick = steps[i] * decade;
      if (up && tick >= v * (1 - 1e-9)) { found = steps[i]; break; }
      if (!up && tick <= v * (1 + 1e-9)) found = steps[i];
    }
    return found * decade;
  }

  /* Height a decade needs before its 2 and 5 are labelled: three labels, each
     with a line of room. Below it the decades alone are labelled. */
  var LOG_DECADE_ROOM = 54;

  /* A log axis over the positive values on it, from the 1-2-5 tick at or below
     the smallest to the one at or above the largest, *room* pixels tall. Ticks at
     1, 2 and 5 of each decade while a decade has LOG_DECADE_ROOM, decades alone
     when it has less — 1 to 1k in 130 px is three decades of 43 px. The floor
     sits a little under the lowest tick, so a bar of exactly that value keeps a
     stub rather than vanishing into the axis. */
  function logScaleFor(series, axis, spec, room) {
    var lo = Infinity;
    var hi = -Infinity;
    series.forEach(function (s) {
      if ((s.axis || 'left') !== axis) return;
      var spans = [];
      (s.bands || []).forEach(function (band) { spans.push(band.lo, band.hi); });
      [s.y, s.lo, s.hi, s.p10, s.p90].concat(spans).forEach(function (values) {
        (values || []).forEach(function (v) {
          if (!isValue(v) || v <= 0) return;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        });
      });
    });
    if (lo === Infinity) { lo = 1; hi = 10; }
    if (spec.min > 0) lo = spec.min;
    if (spec.max > 0) hi = spec.max;
    var bottom = oneTwoFive(lo, false);
    var top = oneTwoFive(hi, true);
    if (top <= bottom) top = oneTwoFive(bottom * 1.5, true);
    var decades = Math.log(top / bottom) / Math.LN10;
    var mantissas = (room || 0) / Math.max(decades, 1) >= LOG_DECADE_ROOM ? [1, 2, 5] : [1];
    var ticks = [];
    for (var e = Math.floor(Math.log(bottom) / Math.LN10 + 1e-9); e <= Math.ceil(Math.log(top) / Math.LN10); e++) {
      mantissas.forEach(function (m) {
        var v = m * Math.pow(10, e);
        if (v >= bottom * (1 - 1e-9) && v <= top * (1 + 1e-9)) ticks.push(v);
      });
    }
    return { log: true, ticks: ticks, min: bottom / 1.3, max: top };
  }

  /* ----------------------------------------------------------------- draw */

  /* `hidden` holds the indices of series the reader switched off in the legend.
     A hidden series leaves the draw AND the scale, so what remains refits; every
     series keeps its own colour slot, so identity never shifts under a toggle. */
  function render(canvas, config, hidden) {
    hidden = hidden || {};
    var ctx = canvas.getContext('2d');
    var palette = readPalette();
    /* The canvas's own displayed width, not its parent's: a padded parent's
       clientWidth counts the padding, and a bitmap drawn that wide is squeezed
       back into the canvas — every x off by a few percent, the hover readout
       with it. The parent's is the fallback while the canvas is not laid out. */
    var width = canvas.clientWidth || canvas.parentElement.clientWidth || 640;
    var height = config.height || 260;
    scaleCanvas(canvas, ctx, width, height);
    ctx.clearRect(0, 0, width, height);

    var series = config.series || [];
    var labels = config.x || [];
    var xAxis = config.xAxis || {};
    var yAxis = config.yAxis || {};
    var yAxisRight = config.yAxisRight || {};
    var visible = series.filter(function (s) { return !hidden[s.label]; });
    var hasRight = visible.some(function (s) {
      return s.axis === 'right';
    });

    var font = cssVar('--font-sans-serif') || 'sans-serif';
    ctx.font = '11px ' + font;

    /* Rotated labels need their own height below the plot; measured rather
       than guessed, since week labels and day labels differ by half. */
    var rotate = ((xAxis.rotate || 0) * Math.PI) / 180;
    var labelWidth = 0;
    labels.forEach(function (label) {
      labelWidth = Math.max(labelWidth, ctx.measureText(String(label)).width);
    });
    var labelBand = xAxis.hideLabels ? 0 : rotate && xAxis.scale !== 'log' ? labelWidth * Math.sin(rotate) + 6 : 14;

    /* Reference-line labels sit OUTSIDE the plot, never over it: a label on the
       data hides data. A vertical line's label takes a row of the top margin; a
       horizontal line's, the right gutter beside its line. */
    var refLines = config.refLines || [];
    var topRows = refLines.filter(function (l) { return l.axis === 'x' && l.label; }).length;
    var gutter = 0;
    refLines.forEach(function (l) {
      if (l.axis !== 'x' && l.label) gutter = Math.max(gutter, ctx.measureText(l.label).width + 8);
    });

    /* A sparkline is the line alone — no axes, grid, labels or frame — edge to
       edge with a few pixels of air, so a stroke is never clipped. */
    var spark = !!config.sparkline;
    var pad = spark ? { top: 4, right: 4, bottom: 4, left: 4 } : {
      top: 16 + 14 * topRows,
      right: (hasRight ? 48 : 16) + (hasRight && yAxisRight.title ? 16 : 0) + gutter,
      bottom: 14 + labelBand + (xAxis.title ? 16 : 0),
      left: 44 + (yAxis.title ? 16 : 0)
    };
    var plotW = width - pad.left - pad.right;
    var plotH = height - pad.top - pad.bottom;
    if (plotW <= 0 || plotH <= 0) return null;

    var left = spark ? sparkScale(visible, config.refLines) : scaleFor(visible, 'left', yAxis, plotH);
    var right = hasRight ? scaleFor(visible, 'right', yAxisRight, plotH) : null;

    function yFor(value, scale) {
      /* On a log axis a value at or under the floor — a zero count — sits on it:
         every drawer below then works unchanged, and a zero bar has no height. */
      if (scale.log) {
        var floor = Math.log(scale.min);
        var at = Math.log(Math.max(value, scale.min));
        return pad.top + plotH - ((at - floor) / (Math.log(scale.max) - floor)) * plotH;
      }
      var span = scale.max - scale.min || 1;
      return pad.top + plotH - ((value - scale.min) / span) * plotH;
    }

    /* A log x axis places each label by its value, not its index: the labels
       must be positive numbers (hours, say), and the axis runs from the smallest
       to the largest. Anything else falls back to the category axis. */
    var xs = labels.map(function (l) { return parseFloat(l); });
    var logX = xAxis.scale === 'log' && xs.length > 1 && xs.every(function (v) { return v > 0; });
    var lmin = logX ? Math.log(Math.min.apply(null, xs)) : 0;
    var lmax = logX ? Math.log(Math.max.apply(null, xs)) : 0;
    if (lmax === lmin) logX = false;

    function xLog(value) {
      return pad.left + (plotW * (Math.log(value) - lmin)) / (lmax - lmin);
    }

    function xFor(index, count) {
      if (logX) return xLog(xs[index]);
      if (count <= 1) return pad.left + plotW / 2;
      var band = plotW / count;
      return pad.left + band * index + band / 2;
    }

    /* Grid and left axis labels */
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.axis;
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    left.ticks.forEach(function (tick) {
      var y = Math.round(yFor(tick, left)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillText(formatTick(tick, yAxis.tickFormat), pad.left - 6, y);
    });

    if (right) {
      ctx.textAlign = 'left';
      right.ticks.forEach(function (tick) {
        ctx.fillText(
          formatTick(tick, yAxisRight.tickFormat),
          pad.left + plotW + 6,
          Math.round(yFor(tick, right))
        );
      });
    }

    /* X labels, thinned so they never overlap. A rotated label needs only a
       line's height of room along the axis, an upright one its full width. */
    var count = labels.length;
    if (logX && !xAxis.hideLabels) {
      /* Ticks at 1, 2 and 5 of each decade the axis spans, each with a faint
         vertical grid line: on a log axis the spacing itself carries meaning. */
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (var e = Math.floor(lmin / Math.LN10); e <= Math.ceil(lmax / Math.LN10); e++) {
        [1, 2, 5].forEach(function (m) {
          var v = m * Math.pow(10, e);
          var lv = Math.log(v);
          if (lv < lmin - 1e-9 || lv > lmax + 1e-9) return;
          var tx = Math.round(xLog(v)) + 0.5;
          ctx.strokeStyle = palette.grid;
          ctx.beginPath();
          ctx.moveTo(tx, pad.top);
          ctx.lineTo(tx, pad.top + plotH);
          ctx.stroke();
          ctx.fillStyle = palette.axis;
          ctx.fillText(formatTick(v) + (xAxis.unit ? ' ' + xAxis.unit : ''), tx, pad.top + plotH + 6);
        });
      }
    } else if (!xAxis.hideLabels && !spark) {
      var perLabel = rotate ? Math.min(labelWidth + 6, 14 / Math.sin(rotate)) : labelWidth + 10;
      var every = Math.max(1, Math.ceil((count * perLabel) / Math.max(plotW, 1)));
      labels.forEach(function (label, i) {
        if (i % every) return;
        var x = xFor(i, count);
        var y = pad.top + plotH + 6;
        if (rotate) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-rotate);
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(label), 0, 0);
          ctx.restore();
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(String(label), x, y);
        }
      });
    }

    /* Axis titles */
    ctx.textAlign = 'center';
    if (xAxis.title) {
      ctx.textBaseline = 'bottom';
      ctx.fillText(xAxis.title, pad.left + plotW / 2, height - 2);
    }
    [[yAxis, 10, -Math.PI / 2], [yAxisRight, width - 10, Math.PI / 2]].forEach(function (spec) {
      if (!spec[0].title || (spec[0] === yAxisRight && !right)) return;
      ctx.save();
      ctx.translate(spec[1], pad.top + plotH / 2);
      ctx.rotate(spec[2]);
      ctx.textBaseline = 'middle';
      ctx.fillText(spec[0].title, 0, 0);
      ctx.restore();
    });

    /* Series */
    /* Only visible bars share a band, so hiding one closes the gap. */
    var barCount = visible.filter(function (s) {
      return (s.type || 'bar') === 'bar';
    }).length;
    var barIndex = 0;
    warnIfOverCapacity(series, palette);


    series.forEach(function (s, index) {
      if (hidden[s.label]) return;
      var scale = s.axis === 'right' && right ? right : left;
      if (s.type === 'box') {
        var boxEncoding = encodingFor(palette, index, false);
        drawBox(ctx, s, scale, resolveColor(s.color, boxEncoding.color), xFor, yFor, plotW);
        return;
      }
      var isLine = (s.type || 'bar') !== 'bar';
      var encoding = encodingFor(palette, index, isLine);
      var colour = resolveColor(s.color, encoding.color);
      var values = s.y || [];
      var n = Math.max(values.length, 1);

      if ((s.type || 'bar') === 'bar') {
        var band = plotW / n;
        var slot = (band * 0.7) / Math.max(barCount, 1);
        ctx.fillStyle = colour;
        values.forEach(function (v, i) {
          if (v === null || v === undefined || isNaN(v)) return;
          var y = yFor(v, scale);
          var base = yFor(Math.max(scale.min, 0), scale);
          var x = xFor(i, n) - band * 0.35 + slot * barIndex;
          ctx.fillRect(x, Math.min(y, base), slot, Math.abs(base - y));
        });
        barIndex++;
      } else {
        if (s.bands) drawBands(ctx, s, scale, colour, xFor, yFor, n);
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        /* Secondary encoding: past the hue count, identity continues on dash. A
           series with an interval draws its trend dotted instead: the whiskers
           carry the reading, the line only joins them. */
        if (s.lo) {
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          ctx.setLineDash([0, 3]);
        } else {
          ctx.setLineDash(dashFor(s, encoding, palette));
        }
        ctx.beginPath();
        var started = false;
        values.forEach(function (v, i) {
          if (v === null || v === undefined || isNaN(v)) {
            started = false;
            return;
          }
          var x = xFor(i, n);
          var y = yFor(v, scale);
          if (started) {
            ctx.lineTo(x, y);
          } else {
            ctx.moveTo(x, y);
            started = true;
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);

        /* A value with a gap on both sides has no segment to draw, so a line
           alone would hide it — on a continuous period axis that is exactly an
           isolated week. It gets a dot instead. */
        ctx.fillStyle = colour;
        values.forEach(function (v, i) {
          if (!isValue(v) || isValue(values[i - 1]) || isValue(values[i + 1])) return;
          ctx.beginPath();
          ctx.arc(xFor(i, n), yFor(v, scale), 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.lineCap = 'butt';
        if (s.lo) drawInterval(ctx, s, values, labels, scale, colour, xFor, yFor, n);

        /* A sparkline marks where it ends: the value the card states. */
        if (spark) {
          for (var last = values.length - 1; last >= 0 && !isValue(values[last]); last--);
          if (last >= 0) {
            ctx.beginPath();
            ctx.arc(xFor(last, n), yFor(values[last], scale), 3, 0, Math.PI * 2);
            ctx.fillStyle = colour;
            ctx.fill();
          }
        }

        /* Marks: a hollow ring where something changed about the series — the
           last week a station was measured. Hollow, so it never reads as the
           solid dot of an isolated value. */
        (s.marks || []).forEach(function (mark) {
          var i = labels.indexOf(mark);
          if (i < 0 || !isValue(values[i])) return;
          ctx.beginPath();
          ctx.arc(xFor(i, n), yFor(values[i], scale), 4.5, 0, Math.PI * 2);
          ctx.fillStyle = palette.surface;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = colour;
          ctx.stroke();
        });
      }
    });

    /* Reference lines over the series, so a mean is visible across the bars */
    var row = 0;
    refLines.forEach(function (line) {
      var colour = resolveColor(line.color, palette.axis);
      var x1, y1, x2, y2;
      if (line.axis === 'x') {
        var x = logX
          ? Number(line.value) > 0 ? xLog(Number(line.value)) : null
          : xForValue(line.value, labels, pad.left, plotW);
        if (x === null) return;
        x1 = x2 = Math.round(x) + 0.5;
        y1 = pad.top;
        y2 = pad.top + plotH;
      } else {
        var y = yFor(Number(line.value), left);
        if (y < pad.top || y > pad.top + plotH) return;
        y1 = y2 = Math.round(y) + 0.5;
        x1 = pad.left;
        x2 = pad.left + plotW;
      }
      ctx.strokeStyle = colour;
      ctx.lineWidth = spark ? 1 : 1.5;
      ctx.setLineDash(line.dashed === false ? [] : [4, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!line.label) return;
      ctx.fillStyle = colour;
      if (line.axis === 'x') {
        /* One margin row per marker, so a mean and a median never overprint;
           flipped to the line's left when it would run off the canvas. */
        var w = ctx.measureText(line.label).width;
        var flip = x1 + 4 + w > width;
        ctx.textAlign = flip ? 'right' : 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(line.label, flip ? x1 - 4 : x1 + 4, 2 + 14 * row++);
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(line.label, width - gutter + 4 - (hasRight && yAxisRight.title ? 16 : 0), y1);
      }
    });

    /* Axis frame last, so bars do not sit on top of it */
    if (!spark) {
      ctx.strokeStyle = palette.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left + 0.5, pad.top);
      ctx.lineTo(pad.left + 0.5, pad.top + plotH + 0.5);
      ctx.lineTo(pad.left + plotW, pad.top + plotH + 0.5);
      ctx.stroke();
    }

    /* Where the plot sits, so the readout can map a pointer to a period. */
    return {
      left: pad.left,
      top: pad.top,
      width: plotW,
      height: plotH,
      count: labels.length,
      /* On a log axis a pointer maps to the nearest point by position, not by band. */
      positions: logX ? labels.map(function (_l, i) { return xFor(i, labels.length); }) : null
    };
  }

  /* An interval as quiet whiskers: 1 px, the series colour at reduced strength,
     short caps, centred on the point and drawn behind it: each value's solid dot
     goes on top. A ringed point (a mark) leaves a gap the size of the ring, so
     the whisker never runs into it. */
  function drawInterval(ctx, s, values, labels, scale, colour, xFor, yFor, n) {
    var ringed = {};
    (s.marks || []).forEach(function (mark) {
      var j = labels.indexOf(mark);
      if (j >= 0) ringed[j] = true;
    });
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    values.forEach(function (v, i) {
      var lo = (s.lo || [])[i];
      var hi = (s.hi || [])[i];
      if (!isValue(v) || !isValue(lo) || !isValue(hi)) return;
      var x = Math.round(xFor(i, n)) + 0.5;
      var y = yFor(v, scale);
      var top = yFor(hi, scale);
      var bottom = yFor(lo, scale);
      var gap = ringed[i] ? 7 : 0;
      ctx.beginPath();
      if (top < y - gap) {
        ctx.moveTo(x, top);
        ctx.lineTo(x, y - gap);
        ctx.moveTo(x - 2.5, top);
        ctx.lineTo(x + 2.5, top);
      }
      if (bottom > y + gap) {
        ctx.moveTo(x, y + gap);
        ctx.lineTo(x, bottom);
        ctx.moveTo(x - 2.5, bottom);
        ctx.lineTo(x + 2.5, bottom);
      }
      ctx.stroke();
    });
    ctx.restore();
    ctx.fillStyle = colour;
    values.forEach(function (v, i) {
      if (!isValue(v) || ringed[i]) return;
      ctx.beginPath();
      ctx.arc(xFor(i, n), yFor(v, scale), 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* A box per x: P25-P75 filled lightly, the median across it, whiskers P10-P90
     with caps: the shape of a skewed distribution such as TAT, which a mean and
     a P90 line flatten into two numbers. */
  function drawBox(ctx, s, scale, colour, xFor, yFor, plotW) {
    var count = (s.median || []).length;
    var width = Math.min(18, Math.max(3, (plotW / Math.max(count, 1)) * 0.55));
    ctx.save();
    ctx.setLineDash([]);
    (s.median || []).forEach(function (median, i) {
      var q1 = (s.p25 || [])[i];
      var q3 = (s.p75 || [])[i];
      if (!isValue(median) || !isValue(q1) || !isValue(q3)) return;
      var x = Math.round(xFor(i, count)) + 0.5;
      var low = (s.p10 || [])[i];
      var high = (s.p90 || [])[i];
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (isValue(high)) {
        ctx.moveTo(x, yFor(high, scale));
        ctx.lineTo(x, yFor(q3, scale));
        ctx.moveTo(x - width / 4, yFor(high, scale));
        ctx.lineTo(x + width / 4, yFor(high, scale));
      }
      if (isValue(low)) {
        ctx.moveTo(x, yFor(q1, scale));
        ctx.lineTo(x, yFor(low, scale));
        ctx.moveTo(x - width / 4, yFor(low, scale));
        ctx.lineTo(x + width / 4, yFor(low, scale));
      }
      ctx.stroke();
      var top = yFor(q3, scale);
      var height = Math.max(yFor(q1, scale) - top, 1);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = colour;
      ctx.fillRect(x - width / 2, top, width, height);
      ctx.globalAlpha = 1;
      ctx.strokeRect(x - width / 2, top, width, height);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, yFor(median, scale));
      ctx.lineTo(x + width / 2, yFor(median, scale));
      ctx.stroke();
    });
    ctx.restore();
  }

  /* Bands: shaded spans around a line, lighter outward (the page gives them
     innermost first). A run of periods with both bounds is one filled shape; a
     gap breaks it, as it breaks the line. A lone period is a short bar. */
  function drawBands(ctx, s, scale, colour, xFor, yFor, n) {
    var bands = s.bands || [];
    ctx.save();
    ctx.fillStyle = colour;
    for (var b = bands.length - 1; b >= 0; b--) {
      var band = bands[b];
      ctx.globalAlpha = 0.28 - 0.14 * (b / Math.max(bands.length - 1, 1));
      var run = [];
      var flush = function () {
        if (!run.length) return;
        ctx.beginPath();
        if (run.length === 1) {
          var x = xFor(run[0], n);
          ctx.rect(x - 2, yFor(band.hi[run[0]], scale), 4,
            yFor(band.lo[run[0]], scale) - yFor(band.hi[run[0]], scale));
        } else {
          run.forEach(function (i, k) {
            var y = yFor(band.hi[i], scale);
            if (k) ctx.lineTo(xFor(i, n), y); else ctx.moveTo(xFor(i, n), y);
          });
          for (var k = run.length - 1; k >= 0; k--) {
            ctx.lineTo(xFor(run[k], n), yFor(band.lo[run[k]], scale));
          }
          ctx.closePath();
        }
        ctx.fill();
        run = [];
      };
      (band.lo || []).forEach(function (lo, i) {
        if (isValue(lo) && isValue(band.hi[i])) run.push(i); else flush();
      });
      flush();
    }
    ctx.restore();
  }

  function isValue(v) {
    return v !== null && v !== undefined && !isNaN(v);
  }

  /* A series drawn dashed on request takes the ramp's second pattern, so it
     matches what composite encoding would give it. */
  function dashFor(s, encoding, palette) {
    if (s.dash) return s.dash;
    if (s.dashed) return palette.dashes[1] || [6, 3];
    return encoding.dash;
  }

  /* Where a vertical reference line falls. A value that IS a label sits at that
     band's centre — "this week". Otherwise, over numeric labels such as histogram
     bin edges ("0-4", "4-8", read as their leading number), the band's left edge
     is the label's value and the line is placed proportionally inside it — a
     mean of 17.3 h lands a third of the way into the 16-20 bar. */
  function xForValue(value, labels, left, plotW) {
    var count = labels.length;
    if (!count) return null;
    var band = plotW / count;
    var exact = labels.indexOf(String(value));
    if (exact >= 0) return left + band * exact + band / 2;
    var edges = labels.map(function (l) { return parseFloat(l); });
    var v = Number(value);
    if (isNaN(v) || edges.some(isNaN)) return null;
    /* Only bin edges read as numbers. A period label parses too — "2026-W30" is
       2026 — but its leading numbers repeat, so it never counts as an axis of
       values: a marker at a period not on the axis is left out, not misplaced. */
    for (var e = 1; e < count; e++) {
      if (!(edges[e] > edges[e - 1])) return null;
    }
    for (var i = count - 1; i >= 0; i--) {
      if (v >= edges[i]) {
        var next = i + 1 < count ? edges[i + 1] : edges[i] + (i > 0 ? edges[i] - edges[i - 1] : 1);
        var within = next > edges[i] ? Math.min((v - edges[i]) / (next - edges[i]), 1) : 0;
        return left + band * (i + within);
      }
    }
    return left;
  }

  /* Repaint every chart when a theme attribute changes: the colours live in
     CSS, so the config is untouched and only the paint is stale. */
  function observeTheme() {
    if (observing) return;
    observing = true;
    new MutationObserver(function (mutations) {
      var themed = mutations.some(function (m) {
        return m.attributeName === 'data-theme' || m.attributeName === 'data-theme-base';
      });
      if (!themed) return;
      Object.keys(charts).forEach(function (id) {
        charts[id].render();
      });
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-base']
    });
  }

  /* Render the legend as DOM beside the canvas, not painted into it: legend text
   * must be selectable, searchable and readable by a screen reader, and identity
   * must not be carried by colour alone. The swatch mirrors each series' actual
   * dash pattern, so composite encoding is visible rather than implied. */
  /* Each entry is a toggle: clicking it hides or shows its series. Buttons, so a
     keyboard reaches them and aria-pressed tells a screen reader which are on. */
  function renderLegend(canvas, config, instance) {
    var series = config.series || [];
    var host = canvas.parentElement;
    var existing = host.querySelector('.chart-legend');
    if (existing) existing.remove();
    if (series.length < 2) return;   /* one series is named by the title */

    var palette = readPalette();
    var legend = document.createElement('div');
    legend.className = 'chart-legend';

    series.forEach(function (s, index) {
      var isLine = (s.type || 'bar') === 'line';
      var encoding = encodingFor(palette, index, isLine);
      var off = !!instance.hidden[s.label];
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'chart-legend-item' + (off ? ' is-hidden' : '');
      item.setAttribute('aria-pressed', off ? 'false' : 'true');
      item.title = (off ? 'Show ' : 'Hide ') + (s.label || 'series');
      item.addEventListener('click', function () {
        instance.hidden[s.label] = !instance.hidden[s.label];
        instance.focus = index;
        instance.render();
      });

      var colour = resolveColor(s.color, encoding.color);

      /* Tabler's selectgroup pill: a check box that is filled while the series
         is shown and empty while it is hidden — the look of a control, so the
         legend says it can be clicked without a sentence saying so. It carries
         the series' own colour, which ties the control to its line. */
      var check = document.createElement('span');
      check.className = 'chart-legend-check';
      check.style.borderColor = colour;
      if (!off) {
        check.style.backgroundColor = colour;
        check.appendChild(tick());
      }

      var swatch = document.createElement('span');
      swatch.className = 'chart-legend-swatch';
      swatch.style.borderTopColor = colour;
      /* Solid, beside the check box: a dotted or dashed swatch there reads as a
         doubled line. The one exception is identity — past the palette's hues a
         series is told apart by its dash alone, so that dash must show. */
      var identityDash = isLine && encoding.dash && encoding.dash.length;
      swatch.style.borderTopStyle = identityDash ? 'dashed' : 'solid';
      if (s.type === 'box') {
        swatch.className += ' chart-legend-swatch-box';
        swatch.style.borderColor = colour;
      }

      item.appendChild(check);
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(s.label || 'Series ' + (index + 1)));
      legend.appendChild(item);
    });
    host.appendChild(legend);

    /* The legend is rebuilt on every render; put the keyboard back on the entry
       just toggled rather than dropping it at the top of the page. */
    if (instance.focus !== undefined) {
      var again = legend.querySelectorAll('.chart-legend-item')[instance.focus];
      if (again) again.focus();
      instance.focus = undefined;
    }
  }

  /* Tabler's `check` icon, drawn in currentColor. */
  function tick() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M5 12l5 5l10 -10');
    svg.appendChild(path);
    return svg;
  }

  /* The row above the canvas that holds a chart's controls: the calendar window
     on the left, the view toggle on the right. Made on first use. */
  function toolbarOf(canvas) {
    var host = canvas.parentElement;
    var bar = host.querySelector('.chart-toolbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'chart-toolbar';
      host.insertBefore(bar, canvas);
    }
    return bar;
  }

  /* The view toggle: a segmented row above the canvas, one button per view.
     Built once; later renders only move the active mark. */
  function renderViews(canvas, views, instance) {
    if (views.length < 2) return;
    var host = canvas.parentElement;
    var bar = host.querySelector('.chart-views-toggle');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'nav nav-segmented nav-sm chart-views-toggle';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Chart view');
      views.forEach(function (view, i) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'nav-link';
        button.textContent = view.label;
        button.addEventListener('click', function () {
          instance.view = i;
          instance.render();
        });
        bar.appendChild(button);
      });
      toolbarOf(canvas).appendChild(bar);
    }
    Array.prototype.forEach.call(bar.querySelectorAll('.nav-link'), function (b, i) {
      var active = i === instance.view;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* The y scale switch, offered by a chart whose y axis the page declared log:
     Log first, since that is how it opens; Linear is one click away. Built once. */
  function renderScale(canvas, instance) {
    var bar = toolbarOf(canvas);
    var group = bar.querySelector('.chart-scale-toggle');
    if (!group) {
      group = segmented('Y scale', [
        { key: 'log', label: 'Log' },
        { key: 'linear', label: 'Linear' }
      ], instance.yScale, function (key) {
        instance.yScale = key;
        instance.render();
      });
      group.className += ' chart-scale-toggle';
      bar.appendChild(group);
    }
    Array.prototype.forEach.call(group.querySelectorAll('.nav-link'), function (b) {
      var active = b.dataset.control === 'Y scale:' + instance.yScale;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------- windows */

  /* A windowed chart (`steps`, from charts.windowed) ships the same chart at
     several periods, each label tagged with the windows that hold it. The reader
     picks a window — a year, quarter, month or week — and a step finer than it;
     the chart shows that step's points inside that window. Selection only: no
     date arithmetic here and no value is ever added up. */

  var LADDER = ['day', 'week', 'month', 'quarter', 'year'];
  var WINDOW_KINDS = ['year', 'quarter', 'month', 'week', 'day'];
  var KIND_NAMES = { year: 'Year', quarter: 'Quarter', month: 'Month', week: 'Week', day: 'Day' };
  var STEP_NAMES = { day: 'By day', week: 'By week', month: 'By month', quarter: 'By quarter' };
  /* The step a window opens on: enough points to read a trend, not a comb. */
  var DEFAULT_STEP = { year: 'week', quarter: 'week', month: 'day', week: 'day' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var PER_POINT = ['y', 'lo', 'hi', 'n', 'p10', 'p25', 'median', 'p75', 'p90'];

  function rank(period) { return LADDER.indexOf(period); }

  /* The steps a window of `kind` can show, finest first. */
  function stepsFor(steps, kind) {
    return steps.filter(function (step) { return rank(step.period) < rank(kind); });
  }

  function windowName(kind, label, titles) {
    /* A week's days come from the page, worked out in Python: no date arithmetic
       here. */
    if (titles && titles[label]) return titles[label];
    if (kind === 'month') {
      var parts = label.split('-');
      return MONTHS[Number(parts[1]) - 1] + ' ' + parts[0];
    }
    if (kind === 'quarter') return label.replace('-', ' ');
    return label;
  }

  /* Whether any series draws something at index i — a window with nothing to
     draw is not offered, so the arrows never land on a blank plot. */
  function hasValue(step, i) {
    var views = step.views && step.views.length ? step.views : [{ series: step.series || [] }];
    return views.some(function (view) {
      return view.series.some(function (s) {
        return isValue((s.y || s.median || [])[i]);
      });
    });
  }

  /* The instances of a window kind, oldest first, read from the finest step that
     can show it. */
  function instancesOf(steps, kind) {
    var step = stepsFor(steps, kind)[0];
    var seen = {};
    var out = [];
    step.windows[kind].forEach(function (label, i) {
      if (!seen[label] && hasValue(step, i)) {
        seen[label] = true;
        out.push(label);
      }
    });
    return out.sort();
  }

  /* Changing the kind keeps the reader where they were: the latest instance of the
     new kind that overlaps the current window (Q2 → June, not the latest month). */
  function carryWindow(steps, from, kind) {
    var instances = instancesOf(steps, kind);
    var common = stepsFor(steps, rank(from.kind) < rank(kind) ? from.kind : kind)[0];
    var found = null;
    if (common) {
      common.windows[from.kind].forEach(function (label, i) {
        var there = common.windows[kind][i];
        if (label === from.label && instances.indexOf(there) >= 0 && (found === null || there > found)) {
          found = there;
        }
      });
    }
    return found !== null ? found : instances[instances.length - 1];
  }

  /* The step shown for a window: the one the reader picked, while it is still finer
     than the window (a default is not carried to the next window); otherwise the
     window's default, or the nearest step there is. */
  function stepFor(steps, kind, wanted) {
    var names = stepsFor(steps, kind).map(function (step) { return step.period; });
    if (names.indexOf(wanted) >= 0) return wanted;
    if (names.indexOf(DEFAULT_STEP[kind]) >= 0) return DEFAULT_STEP[kind];
    return names[names.length - 1];
  }

  /* The window control reads a chart's calendar through one small interface, so
     the same control serves both shapes of windowed chart:
     - `steps` (charts.windowed): one chart per step, sliced to the window;
     - `windowCharts`: one whole chart per window — a histogram,
       whose x is hours, so a window selects a chart rather than slicing an axis.
     A calendar gives the kinds it offers, the instances of each (oldest first), where
     a change of kind lands, the steps a kind can show, and a note on the window. */

  function stepCalendar(steps) {
    return {
      kinds: WINDOW_KINDS.filter(function (kind) { return stepsFor(steps, kind).length; }),
      instances: function (kind) { return instancesOf(steps, kind); },
      carry: function (from, kind) { return carryWindow(steps, from, kind); },
      steps: function (kind) { return stepsFor(steps, kind); },
      stepFor: function (kind, wanted) { return stepFor(steps, kind, wanted); },
      variants: [],
      /* Week windows' names with their dates, from whichever step carries them. */
      titles: function () {
        var out = {};
        steps.forEach(function (step) {
          Object.keys(step.windowTitles || {}).forEach(function (label) {
            out[label] = step.windowTitles[label];
          });
        });
        return out;
      },
      note: function () { return ''; }
    };
  }

  function chartCalendar(charts, variants) {
    function of(kind) {
      return charts.filter(function (c) { return c.window.period === kind; });
    }
    /* The chart for a window, in *variant* when one is named: every variant of a
       window holds the same units, so where a window sits needs none. */
    function find(sel, variant) {
      return charts.filter(function (c) {
        return c.window.period === sel.kind && c.window.label === sel.label &&
          (variant === undefined || (c.window.variant || '') === variant);
      })[0];
    }
    var calendar = {
      kinds: WINDOW_KINDS.filter(function (kind) { return of(kind).length; }),
      instances: function (kind) {
        var seen = {};
        return of(kind).map(function (c) { return c.window.label; }).filter(function (label) {
          if (seen[label]) return false;
          seen[label] = true;
          return true;
        }).sort();
      },
      /* Finer: the latest window of that kind inside the current one (a year ->
         its last month with units). Coarser: the one holding it (a week -> the
         month of its Thursday). Otherwise the latest. */
      carry: function (from, kind) {
        var labels = calendar.instances(kind);
        var found = null;
        if (rank(kind) < rank(from.kind)) {
          of(kind).forEach(function (c) {
            var label = c.window.label;
            if ((c.window.windows || {})[from.kind] === from.label && (found === null || label > found)) {
              found = label;
            }
          });
        } else {
          var here = find(from);
          var holder = here && (here.window.windows || {})[kind];
          if (labels.indexOf(holder) >= 0) found = holder;
        }
        return found !== null ? found : labels[labels.length - 1];
      },
      steps: function () { return []; },
      stepFor: function () { return null; },
      variants: variants || [],
      titles: function () {
        var out = {};
        charts.forEach(function (c) {
          if (c.window.title) out[c.window.label] = c.window.title;
        });
        return out;
      },
      note: function (sel) {
        var chart = find(sel);
        return chart && chart.window.note ? chart.window.note : '';
      },
      chart: find
    };
    return calendar;
  }

  /* The step's config cut down to one window: every per-point array, band and
     mark, and any category reference line off the axis. */
  function sliceStep(step, kind, label) {
    var keep = [];
    step.windows[kind].forEach(function (l, i) { if (l === label) keep.push(i); });
    function pick(values) {
      return keep.map(function (i) { return values[i]; });
    }
    var shown = {};
    Object.keys(step).forEach(function (key) { shown[key] = step[key]; });
    shown.x = pick(step.x || []);
    if (step.xTitles) shown.xTitles = pick(step.xTitles);
    var onAxis = {};
    shown.x.forEach(function (l) { onAxis[l] = true; });
    function cut(s) {
      var out = {};
      Object.keys(s).forEach(function (key) { out[key] = s[key]; });
      PER_POINT.forEach(function (key) { if (s[key]) out[key] = pick(s[key]); });
      if (s.bands) {
        out.bands = s.bands.map(function (band) {
          return { label: band.label, lo: pick(band.lo), hi: pick(band.hi) };
        });
      }
      if (s.marks) out.marks = s.marks.filter(function (m) { return onAxis[m]; });
      return out;
    }
    shown.series = (step.series || []).map(cut);
    if (step.views) {
      shown.views = step.views.map(function (view) {
        return { label: view.label, series: view.series.map(cut) };
      });
    }
    if (step.refLines) {
      shown.refLines = step.refLines.filter(function (line) {
        return line.axis !== 'x' || typeof line.value === 'number' || onAxis[line.value];
      });
    }
    return shown;
  }

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

  /* The window control: kind, ‹ instance ›, step. Rebuilt on every render — the
     step choices depend on the kind — with the keyboard put back where it was. */
  function renderWindow(canvas, calendar, instance) {
    var bar = toolbarOf(canvas);
    var old = bar.querySelector('.chart-window');
    var control = document.createElement('div');
    control.className = 'chart-window';
    var sel = instance.window;

    control.appendChild(segmented('Window', calendar.kinds.map(function (kind) {
      return { key: kind, label: KIND_NAMES[kind] };
    }), sel.kind, function (kind) {
      if (kind === sel.kind) return;
      instance.window = { kind: kind, label: calendar.carry(sel, kind) };
      instance.step = calendar.stepFor(kind, instance.stepChosen ? instance.step : null);
      instance.control = 'Window:' + kind;
      ownWindow(instance);
    }));

    var instances = calendar.instances(sel.kind);
    var at = instances.indexOf(sel.label);
    var nav = document.createElement('div');
    nav.className = 'chart-window-nav';
    [['earlier', '‹', -1], ['later', '›', 1]].forEach(function (spec, k) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'chart-window-arrow';
      button.textContent = spec[1];
      button.dataset.control = 'Nav:' + spec[0];
      button.setAttribute('aria-label', 'Show the ' + spec[0] + ' ' + KIND_NAMES[sel.kind].toLowerCase());
      var next = instances[at + spec[2]];
      button.disabled = next === undefined;
      button.addEventListener('click', function () {
        instance.window = { kind: sel.kind, label: next };
        instance.control = 'Nav:' + spec[0];
        ownWindow(instance);
      });
      if (k === 1) {
        var name = document.createElement('span');
        name.className = 'chart-window-label';
        name.setAttribute('aria-live', 'polite');
        var titles = calendar.titles();
        name.textContent = windowName(sel.kind, sel.label, titles);
        /* A dated name ("2026-W40 · 28 Sep – 4 Oct") needs a wider fixed box, so
           the arrows still hold still as the reader steps through weeks. */
        if (titles[sel.label]) name.className += ' chart-window-label--dated';
        nav.appendChild(name);
      }
      nav.appendChild(button);
    });
    control.appendChild(nav);

    /* What the window holds — "212 units" — beside its name. */
    var note = calendar.note(sel);
    if (note) {
      var said = document.createElement('span');
      said.className = 'chart-window-note';
      said.textContent = note;
      control.appendChild(said);
    }

    /* Where a step row would be, a per-window chart's variants — its bin widths. */
    if (calendar.variants.length > 1) {
      control.appendChild(segmented('Variant', calendar.variants.map(function (name) {
        return { key: name, label: name };
      }), instance.variant, function (name) {
        instance.variant = name;
        instance.control = 'Variant:' + name;
        instance.render();
      }));
    }

    var steps = calendar.steps(sel.kind);
    if (steps.length) {
      control.appendChild(segmented('Step', steps.slice().reverse().map(function (step) {
        return { key: step.period, label: STEP_NAMES[step.period] || step.period };
      }), instance.step, function (period) {
        instance.step = period;
        instance.stepChosen = true;
        instance.control = 'Step:' + period;
        instance.render();
      }));
    }

    /* A chart that follows the page period, with a window of its own: the way back. */
    if (instance.followsPage && instance.windowOwn && window.Almanac.period && window.Almanac.period.hasPage()) {
      var follow = document.createElement('button');
      follow.type = 'button';
      follow.className = 'btn btn-sm period-follow';
      follow.textContent = 'Follow page';
      follow.title = 'Drop this window and show the page\u2019s period';
      follow.addEventListener('click', function () {
        instance.windowOwn = false;
        instance.follow(window.Almanac.period.page());
        window.Almanac.period.changed();
      });
      control.appendChild(follow);
    }

    if (old) bar.replaceChild(control, old);
    else bar.insertBefore(control, bar.firstChild);

    if (instance.control) {
      var again = control.querySelector('[data-control="' + instance.control + '"]');
      if (again && !again.disabled) again.focus();
      instance.control = undefined;
    }
  }

  /* ------------------------------------------------------------ empty */

  /* Why nothing is drawn, when nothing is: the chart has no data, the window
     chosen holds only gaps, or the reader has switched every series off. Null
     when there is something to draw. */
  function emptyReason(cfg, hidden, windowed) {
    /* A sparkline's card states its own "no units". */
    if (cfg.sparkline) return null;
    var series = cfg.series || [];
    if (!series.length || !(cfg.x || []).length) {
      return windowed
        ? { title: 'Nothing in this window', subtitle: 'Step to another with \u2039 \u203a.' }
        : { title: 'No data to draw', subtitle: '' };
    }
    var visible = series.filter(function (s) { return !hidden[s.label]; });
    if (!visible.length) {
      return { title: 'Every series is hidden', subtitle: 'Pick one in the legend to draw it.' };
    }
    var drawn = visible.some(function (s) {
      return (s.y || s.median || []).some(isValue);
    });
    if (drawn) return null;
    return windowed
      ? { title: 'Nothing in this window', subtitle: 'Step to another with \u2039 \u203a.' }
      : { title: 'No data to draw', subtitle: '' };
  }

  /* Tabler's empty state, over the plot rather than instead of it: the canvas
     keeps its size, so nothing below jumps when a series comes back. */
  function renderEmpty(canvas, reason) {
    var host = canvas.parentElement;
    var box = host.querySelector('.chart-empty');
    if (!reason) {
      if (box) box.hidden = true;
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.className = 'empty chart-empty';
      box.setAttribute('role', 'status');
      box.appendChild(document.createElement('p')).className = 'empty-title';
      box.appendChild(document.createElement('p')).className = 'empty-subtitle';
      host.appendChild(box);
    }
    box.querySelector('.empty-title').textContent = reason.title;
    box.querySelector('.empty-subtitle').textContent = reason.subtitle;
    box.hidden = false;
  }

  /* ------------------------------------------------------------- data */

  /* A chart's numbers, as it shows them now — its window, step, view and bin
     width, the series switched on in its legend — one row per point. Each column
     keeps its raw value (for a copy or a CSV) and its formatted text (for the
     table view). Nothing here is computed: the columns are the config's own. */
  function dataColumns(cfg, hidden) {
    var labels = cfg.x || [];
    var titles = cfg.xTitles || labels;
    var unit = cfg.xAxis && cfg.xAxis.unit ? ' ' + cfg.xAxis.unit : '';
    var columns = [{
      header: (cfg.xAxis && cfg.xAxis.title) || 'Period',
      raw: function (i) { return labels[i]; },
      text: function (i) { return titles[i] + unit; },
      number: false
    }];
    (cfg.series || []).forEach(function (s) {
      if (hidden[s.label]) return;
      var axis = s.axis === 'right' ? cfg.yAxisRight || {} : cfg.yAxis || {};
      function add(name, values, isCount) {
        if (!values) return;
        columns.push({
          header: name,
          raw: function (i) { return isValue(values[i]) ? values[i] : ''; },
          text: function (i) {
            var v = values[i];
            if (!isValue(v)) return '—';
            return isCount ? Math.round(v).toLocaleString() : formatValue(v, axis.tickFormat);
          },
          number: true
        });
      }
      if (s.type === 'box') {
        [['p10', 'P10'], ['p25', 'P25'], ['median', 'median'], ['p75', 'P75'], ['p90', 'P90']].forEach(function (q) {
          add(s.label + ' ' + q[1], s[q[0]]);
        });
      } else {
        add(s.label, s.y);
        add(s.label + ' low', s.lo);
        add(s.label + ' high', s.hi);
        (s.bands || []).forEach(function (band) {
          add(s.label + ' ' + band.label + ' low', band.lo);
          add(s.label + ' ' + band.label + ' high', band.hi);
        });
      }
      add(s.label + ' n', s.n, true);
    });
    return columns;
  }

  /* The chart's raw values as rows — header first — for a copy or a CSV. */
  function dataRows(cfg, hidden) {
    var columns = dataColumns(cfg, hidden);
    var rows = [columns.map(function (c) { return c.header; })];
    (cfg.x || []).forEach(function (_label, i) {
      rows.push(columns.map(function (c) { return c.raw(i); }));
    });
    return rows;
  }

  /* The table view: the kit's own .table (sticky header, a scrolling box when
     long), numbers right-aligned. */
  function renderTable(canvas, cfg, hidden, show) {
    var host = canvas.parentElement;
    var box = host.querySelector('.chart-data-table');
    canvas.hidden = !!show;
    if (!show) {
      if (box) box.hidden = true;
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.className = 'table-responsive chart-data-table';
      host.insertBefore(box, canvas.nextSibling);
    }
    box.hidden = false;
    var columns = dataColumns(cfg, hidden);
    var table = document.createElement('table');
    table.className = 'table';
    var head = table.createTHead().insertRow();
    columns.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c.header;
      if (c.number) th.className = 'table-cell-number';
      head.appendChild(th);
    });
    var body = table.createTBody();
    (cfg.x || []).forEach(function (_label, i) {
      var row = body.insertRow();
      columns.forEach(function (c) {
        var td = row.insertCell();
        td.textContent = c.text(i);
        if (c.number) td.className = 'table-cell-number';
      });
    });
    box.textContent = '';
    box.appendChild(table);
  }

  var ICON_COPY = '<path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/>';
  var ICON_DOWNLOAD = '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/>';

  function svgIcon(paths) {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  /* The data controls, at the toolbar's end: Chart / Table, then Copy and CSV.
     Built once; each acts on the chart as last rendered. */
  function renderDataControls(canvas, instance) {
    var bar = toolbarOf(canvas);
    var group = bar.querySelector('.chart-data');
    if (!group) {
      group = document.createElement('div');
      group.className = 'chart-data';
      var view = segmented('Show as', [
        { key: 'chart', label: 'Chart' },
        { key: 'table', label: 'Table' }
      ], instance.asTable ? 'table' : 'chart', function (key) {
        instance.asTable = key === 'table';
        instance.render();
      });
      view.className += ' chart-data-view';
      group.appendChild(view);

      function button(label, paths, action) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm';
        btn.innerHTML = svgIcon(paths);
        btn.appendChild(document.createTextNode(label));
        btn.addEventListener('click', function () { action(btn); });
        group.appendChild(btn);
        return btn;
      }
      button('Copy', ICON_COPY, function (btn) {
        window.Almanac.copyText(window.Almanac.delimited(dataRows(instance.shown, instance.hidden), '\t'), function () {
          btn.lastChild.textContent = 'Copied';
          setTimeout(function () { btn.lastChild.textContent = 'Copy'; }, 1500);
        });
      }).title = 'Copy these numbers, to paste into a spreadsheet';
      button('CSV', ICON_DOWNLOAD, function () {
        var slug = window.Almanac.slug;
        var name = slug(instance.shown.title) + (instance.window ? '-' + slug(instance.window.label) : '');
        window.Almanac.download(name + '.csv', window.Almanac.delimited(dataRows(instance.shown, instance.hidden), ','));
      }).title = 'Download these numbers as a CSV file';
      bar.appendChild(group);
    }
    Array.prototype.forEach.call(group.querySelectorAll('.chart-data-view .nav-link'), function (b) {
      var active = b.dataset.control === 'Show as:' + (instance.asTable ? 'table' : 'chart');
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------- readout */

  /* A value as its axis labels it: a rate as a percentage, anything else to one
     decimal (none past 100, where the decimal is noise). */
  function formatValue(v, format) {
    if (!isValue(v)) return '\u2014';
    if (format === 'percent') return (Math.round(v * 1000) / 10).toFixed(1) + '%';
    /* A count is a whole number and reads as one: "12", not "12.0". */
    if (Number.isInteger(v)) return v.toLocaleString();
    return Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : (Math.round(v * 10) / 10).toFixed(1);
  }

  /* One series' line in the readout at index i: its value, its interval, its
     count. A box reads as its median with the two spans around it. */
  function readoutText(s, i, format) {
    var text;
    if (s.type === 'box') {
      var median = (s.median || [])[i];
      if (!isValue(median)) return null;
      text = 'median ' + formatValue(median, format) +
        ' \u00b7 P25\u2013P75 ' + formatValue((s.p25 || [])[i], format) + '\u2013' + formatValue((s.p75 || [])[i], format) +
        ' \u00b7 P10\u2013P90 ' + formatValue((s.p10 || [])[i], format) + '\u2013' + formatValue((s.p90 || [])[i], format);
    } else {
      var v = (s.y || [])[i];
      if (!isValue(v)) return null;
      text = formatValue(v, format);
      if (s.lo && isValue(s.lo[i]) && isValue(s.hi[i])) {
        text += ' (' + formatValue(s.lo[i], format) + '\u2013' + formatValue(s.hi[i], format) + ')';
      }
    }
    (s.bands || []).forEach(function (band) {
      if (isValue(band.lo[i]) && isValue(band.hi[i])) {
        text += ' \u00b7 ' + band.label + ' ' + formatValue(band.lo[i], format) + '\u2013' + formatValue(band.hi[i], format);
      }
    });
    if (s.n && isValue(s.n[i])) text += ' \u00b7 n = ' + Math.round(s.n[i]).toLocaleString();
    return text;
  }

  /* The hover readout: the period under the pointer and every visible series'
     reading there, counts included — how many units stand behind a point is what
     a line alone cannot say. DOM rather than paint, so it is selectable text; it
     reads the chart as last rendered, so views and legend toggles apply. */
  function attachReadout(canvas, instance) {
    var host = canvas.parentElement;
    host.classList.add('chart-host');
    var box = document.createElement('div');
    box.className = 'chart-readout';
    box.hidden = true;
    host.appendChild(box);

    function hide() { box.hidden = true; }

    canvas.addEventListener('mouseleave', hide);
    canvas.addEventListener('mousemove', function (event) {
      var g = instance.geometry;
      var cfg = instance.shown;
      if (!g || !cfg || !g.count) return hide();
      var rect = canvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      if (x < g.left || x > g.left + g.width || y < g.top || y > g.top + g.height) return hide();
      var i = Math.min(g.count - 1, Math.floor(((x - g.left) / g.width) * g.count));
      if (g.positions) {
        i = 0;
        g.positions.forEach(function (px, k) {
          if (Math.abs(px - x) < Math.abs(g.positions[i] - x)) i = k;
        });
      }

      var palette = readPalette();
      var rows = [];
      (cfg.series || []).forEach(function (s, index) {
        if (instance.hidden[s.label]) return;
        var axis = s.axis === 'right' ? cfg.yAxisRight || {} : cfg.yAxis || {};
        var text = readoutText(s, i, axis.tickFormat);
        if (text === null) return;
        var isLine = (s.type || 'bar') === 'line';
        rows.push({
          label: s.label,
          text: text,
          colour: resolveColor(s.color, encodingFor(palette, index, isLine).color)
        });
      });
      if (!rows.length) return hide();

      box.textContent = '';
      var title = document.createElement('div');
      title.className = 'chart-readout-title';
      var unit = cfg.xAxis && cfg.xAxis.unit ? ' ' + cfg.xAxis.unit : '';
      /* A week's heading carries its dates ("2026-W39 · 21–27 Sep"). */
      title.textContent = (cfg.xTitles || cfg.x || [])[i] + unit;
      box.appendChild(title);
      rows.forEach(function (row) {
        var line = document.createElement('div');
        line.className = 'chart-readout-row';
        var swatch = document.createElement('span');
        swatch.className = 'chart-readout-swatch';
        swatch.style.backgroundColor = row.colour;
        var name = document.createElement('span');
        name.className = 'chart-readout-label';
        name.textContent = row.label;
        var value = document.createElement('span');
        value.className = 'chart-readout-value';
        value.textContent = row.text;
        line.appendChild(swatch);
        line.appendChild(name);
        line.appendChild(value);
        box.appendChild(line);
      });
      box.hidden = false;

      /* Beside the pointer, flipped to its left near the right edge. */
      var hostRect = host.getBoundingClientRect();
      var left = event.clientX - hostRect.left + 14;
      var top = event.clientY - hostRect.top + 14;
      if (left + box.offsetWidth > host.clientWidth) left = Math.max(0, left - box.offsetWidth - 28);
      box.style.left = left + 'px';
      box.style.top = top + 'px';
    });
  }

  /* ------------------------------------------------------------- address */

  /* A chart's view, as the address carries it: the window (kind and instance),
     step, bins, view, y scale and chart or table. Only what differs from how the
     chart opens is written, so an untouched chart adds nothing to the address;
     each value as a slug ("bins:4-h-bins", "at:2026-w39"), matched back the same way. */
  var VIEW_FIELDS = ['window', 'at', 'step', 'bins', 'view', 'scale', 'show'];

  function viewOf(instance) {
    return {
      window: instance.window ? instance.window.kind : undefined,
      at: instance.window ? instance.window.label : undefined,
      step: instance.step || undefined,
      bins: instance.variant || undefined,
      view: String(instance.view),
      scale: instance.yScale,
      show: instance.asTable ? 'table' : 'chart'
    };
  }

  function encodeView(view, opening, follower) {
    return VIEW_FIELDS.filter(function (field) {
      /* A chart following the page period (follower) writes its window only when the
         reader gave it one -- the page's is in the address under `period`, and writing
         a followed window would turn "following" into a choice on the next load -- and
         its step only when the reader picked one, not the step a window brought. */
      if (follower && !follower.windowOwn && (field === 'window' || field === 'at')) return false;
      if (follower && !follower.stepChosen && field === 'step') return false;
      return view[field] !== undefined && view[field] !== opening[field];
    }).map(function (field) {
      return field + ':' + window.Almanac.slug(view[field]);
    }).join(',');
  }

  function decodeView(text) {
    var view = {};
    (text || '').split(',').forEach(function (pair) {
      var at = pair.indexOf(':');
      if (at > 0) view[pair.slice(0, at)] = pair.slice(at + 1);
    });
    return view;
  }

  /* Put a chart in the view the address names, from how it opens: anything the
     chart does not offer (a window it lacks, bins it has not) is ignored, so a
     link outliving its data still opens, on the nearest thing to it. */
  function restoreView(instance, view, offerTable) {
    var opening = instance.opening;
    var calendar = instance.calendar;
    /* The one of *values* the address's slug names, if any. */
    function named(values, slug) {
      return slug ? values.filter(function (v) { return window.Almanac.slug(v) === slug; })[0] : undefined;
    }
    if (calendar) {
      var kind = named(calendar.kinds, view.window) || opening.window;
      var labels = calendar.instances(kind);
      var label = named(labels, view.at) ||
        (kind === opening.window ? opening.at : labels[labels.length - 1]);
      instance.window = { kind: kind, label: label };
      var step = named(calendar.steps(kind).map(function (s) { return s.period; }), view.step);
      instance.step = calendar.stepFor(kind, step);
      instance.stepChosen = step !== undefined;
      instance.variant = named(calendar.variants, view.bins) || opening.bins || '';
    }
    instance.view = /^\d+$/.test(view.view || '') ? Number(view.view) : Number(opening.view);
    /* Only a chart that has the switch — its y axis opened log. */
    if (opening.scale) instance.yScale = view.scale === 'linear' ? 'linear' : 'log';
    instance.asTable = offerTable && view.show === 'table';
    /* A window in the address is one the reader chose: a follower keeps it over the
       page period until "Follow page" or the page's Reset. */
    instance.windowOwn = !!(view.window || view.at);
  }

  /* The reader moved a chart's window: for a chart following the page period, that
     window is now its own; the page hears of it (its Reset counts own choices). */
  function ownWindow(instance) {
    if (instance.followsPage) instance.windowOwn = true;
    instance.render();
    if (instance.followsPage && window.Almanac.period) window.Almanac.period.changed();
  }

  /* Charts follow the address when it changes under them: a link pasted over
     this page's, or one edited by hand. */
  window.addEventListener('hashchange', function () {
    Object.keys(charts).forEach(function (canvasId) {
      var instance = charts[canvasId];
      restoreView(instance, decodeView(window.Almanac.hash.get(canvasId)), instance.offerTable);
      instance.render();
    });
  });

  /* ------------------------------------------------------------ packing */

  /* A chart by window may arrive packed: what its ~1,400 charts
     share is stated once — the x per variant, keys equal on every chart, each
     window, each reference line's and series' style — and each chart keeps only
     its own, {w: window, v: variant, ...}, its lines as [style, value, label], its
     series as {s: style, y: [...]}. Unpacked
     once, on opening, into the charts the rest of this file reads. */
  function unpackWindows(config) {
    if (!config.windowCharts || !config.windows) return config;
    var variants = config.variants || [''];
    var styles = config.lineStyles || [];
    var seriesStyles = config.seriesStyles || [];
    var shared = config.shared || {};
    var out = {};
    Object.keys(config).forEach(function (key) { out[key] = config[key]; });
    out.windowCharts = config.windowCharts.map(function (packed) {
      var variant = packed.v !== undefined ? variants[packed.v] : '';
      var chart = {};
      Object.keys(shared).forEach(function (key) { chart[key] = shared[key]; });
      Object.keys(packed).forEach(function (key) {
        if (key === 'w' || key === 'v') return;
        if (key === 'refLines') {
          chart[key] = packed[key].map(function (line) {
            var full = {};
            Object.keys(styles[line[0]]).forEach(function (k) { full[k] = styles[line[0]][k]; });
            full.value = line[1];
            if (line.length > 2) full.label = line[2];
            return full;
          });
        } else if (key === 'series') {
          chart[key] = packed[key].map(function (one) {
            var full = {};
            Object.keys(seriesStyles[one.s]).forEach(function (k) { full[k] = seriesStyles[one.s][k]; });
            Object.keys(one).forEach(function (k) { if (k !== 's') full[k] = one[k]; });
            return full;
          });
        } else {
          chart[key] = packed[key];
        }
      });
      if (!chart.x) chart.x = (config.sharedX || {})[variant];
      var win = {};
      Object.keys(config.windows[packed.w]).forEach(function (k) { win[k] = config.windows[packed.w][k]; });
      if (variant) win.variant = variant;
      chart.window = win;
      return chart;
    });
    return out;
  }

  window.Almanac.plot = {
    create: function (canvasId, config) {
      config = unpackWindows(config);
      var canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.warn('Almanac.plot: no canvas #' + canvasId);
        return null;
      }
      observeTheme();
      /* The picture is not readable by a screen reader; its name at least is. */
      if (config.title) {
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', config.title);
      }

      /* Alternative series sets over one axis (`views`), or the chart's own. */
      function viewsOf(cfg) {
        return cfg.views && cfg.views.length ? cfg.views : [{ label: '', series: cfg.series || [] }];
      }

      /* Series the page asked to start switched off (`hidden: true`), by name, so
         a series keeps its state when the reader switches view or step. */
      var startHidden = {};
      (config.steps || config.windowCharts || [config]).forEach(function (step) {
        viewsOf(step).forEach(function (view) {
          view.series.forEach(function (s) {
            if (s.hidden) startHidden[s.label] = true;
          });
        });
      });

      var instance = {
        hidden: startHidden,
        view: 0,
        render: function () {
          var base = config;
          if (config.steps) {
            var step = config.steps.filter(function (s) { return s.period === instance.step; })[0];
            renderWindow(canvas, instance.calendar, instance);
            base = sliceStep(step, instance.window.kind, instance.window.label);
          } else if (config.windowCharts) {
            renderWindow(canvas, instance.calendar, instance);
            /* The window's chart, unpacked on opening — its shared x included. */
            var chosen = instance.calendar.chart(instance.window, instance.variant);
            base = {};
            Object.keys(chosen).forEach(function (key) { base[key] = chosen[key]; });
          }
          var views = viewsOf(base);
          var shown = {};
          Object.keys(base).forEach(function (key) { shown[key] = base[key]; });
          shown.series = views[Math.min(instance.view, views.length - 1)].series;
          renderViews(canvas, views, instance);
          /* A log y axis comes with its switch; the reader's choice rides on a
             copy of the axis, so the shipped config is never edited. */
          if (base.yAxis && base.yAxis.scale === 'log') {
            if (!instance.yScale) instance.yScale = 'log';
            renderScale(canvas, instance);
            shown.yAxis = {};
            Object.keys(base.yAxis).forEach(function (key) { shown.yAxis[key] = base.yAxis[key]; });
            shown.yAxis.scale = instance.yScale === 'log' ? 'log' : undefined;
          }
          instance.shown = shown;
          instance.geometry = render(canvas, shown, instance.hidden);
          renderLegend(canvas, shown, instance);
          /* Only a chart that asked for them (offerTable) — never a
             sparkline, a KPI card's foot. */
          if (config.offerTable && !shown.sparkline) {
            renderDataControls(canvas, instance);
            renderTable(canvas, shown, instance.hidden, instance.asTable);
          }
          renderEmpty(canvas, instance.asTable ? null
            : emptyReason(shown, instance.hidden, !!(config.steps || config.windowCharts)));
          /* Keep the view in the address, once the chart has opened. */
          if (instance.opening) {
            window.Almanac.hash.set(canvasId, encodeView(viewOf(instance), instance.opening,
              instance.followsPage ? instance : null));
          }
        },
        update: function (next) {
          config = unpackWindows(next);
          instance.render();
        }
      };
      /* A windowed chart opens at the latest instance of its opening window — the
         widest it offers (the present year, to date), unless the page named one:
         a histogram opens on the present week. */
      if (config.steps || config.windowCharts) {
        var calendar = config.steps
          ? stepCalendar(config.steps)
          : chartCalendar(config.windowCharts, config.variants);
        instance.variant = config.variant || '';
        var kind = calendar.kinds.indexOf(config.open) >= 0 ? config.open : calendar.kinds[0];
        var instances = calendar.instances(kind);
        instance.calendar = calendar;
        instance.window = { kind: kind, label: instances[instances.length - 1] };
        instance.step = calendar.stepFor(kind, null);
      }
      instance.render();
      /* How the chart opens is what the address is written against; then the
         view a copied link names, if it names one. */
      instance.offerTable = !!config.offerTable;
      /* Opt-in (followsPage): only a windowed chart that asked follows
         the page period; every other chart is untouched by it. */
      instance.followsPage = !!(config.followsPage && instance.calendar);
      instance.opening = viewOf(instance);
      var named = window.Almanac.hash.get(canvasId);
      if (named) {
        restoreView(instance, decodeView(named), instance.offerTable);
        instance.render();
      }
      if (instance.followsPage && window.Almanac.period) {
        /* Show the page's period *sel* -- or, where the chart has no such window (no
           Day window on a trend), the finest window *holders* names that it has --
           unless the reader gave the chart a window of its own. No page period: the
           chart's own opening, as if there were no page at all. */
        instance.follow = function (sel, holders) {
          if (!instance.windowOwn) {
            var cal = instance.calendar;
            var offers = function (kind, label) {
              return cal.kinds.indexOf(kind) >= 0 && cal.instances(kind).indexOf(label) >= 0;
            };
            var target = { kind: instance.opening.window, label: instance.opening.at };
            if (sel && offers(sel.kind, sel.label)) {
              target = sel;
            } else if (sel) {
              var held = ['week', 'month'].filter(function (kind) {
                return holders && holders[kind] && offers(kind, holders[kind]);
              })[0];
              if (held) target = { kind: held, label: holders[held] };
            }
            if (target.kind !== instance.window.kind || target.label !== instance.window.label) {
              instance.step = cal.stepFor(target.kind, instance.stepChosen ? instance.step : null);
              instance.window = { kind: target.kind, label: target.label };
            }
          }
          instance.render();
        };
        window.Almanac.period.follow({
          own: function () { return instance.windowOwn; },
          clear: function () { instance.windowOwn = false; },
          show: instance.follow
        });
      }
      attachReadout(canvas, instance);

      if (window.ResizeObserver) {
        var last = 0;
        new ResizeObserver(function () {
          var w = canvas.parentElement.clientWidth;
          if (w && w !== last) {
            last = w;
            instance.render();
          }
        }).observe(canvas.parentElement);
      }

      charts[canvasId] = instance;
      return instance;
    },
    get: function (canvasId) {
      return charts[canvasId] || null;
    }
  };
})();
