/*
 * The mini calendar: a month of dates to pick a day from, drawn into any
 * [data-calendar] in Tabler's calendar markup (app.css):
 *
 *   <div class="calendar" data-calendar data-month="2026-11" data-selected="2026-11-15"
 *     data-marked="2026-11-01 2026-11-15 2026-11-28" aria-label="Pay dates"></div>
 *
 * data-month     the month shown first, YYYY-MM; this month unless given
 * data-selected  the chosen day, YYYY-MM-DD, filled
 * data-marked    days with something on them, a dot under each, by spaces
 * data-range     two days, YYYY-MM-DD YYYY-MM-DD: the days between shaded
 * data-week      the first day of the week, 1 Monday (the default) or 0 Sunday
 *
 * The arrows step a month either way. A click on a day chooses it and fires
 * "almanac:date" on the calendar, detail.date the YYYY-MM-DD; the calendar's
 * data-selected follows. Almanac.calendar.draw(element) draws it again after
 * the page changes its attributes. Today is the reader's own, ringed.
 */
(function () {
  'use strict';

  var CHEVRON_LEFT = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6l6 6"/></svg>';
  var CHEVRON_RIGHT = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6l-6 6"/></svg>';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

  function today() {
    var now = new Date();
    return iso(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function parseMonth(text) {
    var m = /^(\d{4})-(\d{2})/.exec(text || '');
    if (m) return { y: +m[1], m: +m[2] - 1 };
    var now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function draw(cal) {
    var at = parseMonth(cal.getAttribute('data-month') || cal.getAttribute('data-selected'));
    var weekStart = cal.getAttribute('data-week') === '0' ? 0 : 1;
    var selected = cal.getAttribute('data-selected') || '';
    var marked = (cal.getAttribute('data-marked') || '').split(/\s+/).filter(Boolean);
    var range = (cal.getAttribute('data-range') || '').split(/\s+/).filter(Boolean).sort();
    var now = today();
    var locale = document.documentElement.lang || undefined;

    cal.textContent = '';
    if (!cal.hasAttribute('role')) cal.setAttribute('role', 'group');

    var nav = el('div', 'calendar-nav');
    var prev = el('button', 'btn-action');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous month');
    prev.setAttribute('data-step', '-1');
    prev.innerHTML = CHEVRON_LEFT;
    var next = el('button', 'btn-action');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next month');
    next.setAttribute('data-step', '1');
    next.innerHTML = CHEVRON_RIGHT;
    var title = el('div', 'calendar-title',
      new Date(at.y, at.m, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }));
    title.setAttribute('aria-live', 'polite');
    nav.appendChild(prev);
    nav.appendChild(title);
    nav.appendChild(next);
    cal.appendChild(nav);

    var header = el('div', 'calendar-header');
    for (var i = 0; i < 7; i++) {
      /* 2023-01-01 was a Sunday: its week names the days in the reader's tongue. */
      var day = new Date(2023, 0, 1 + ((weekStart + i) % 7));
      var name = el('div', 'calendar-date', day.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2));
      name.setAttribute('aria-hidden', 'true');
      header.appendChild(name);
    }
    cal.appendChild(header);

    var body = el('div', 'calendar-body');
    var first = new Date(at.y, at.m, 1);
    var lead = (first.getDay() - weekStart + 7) % 7;
    var days = new Date(at.y, at.m + 1, 0).getDate();
    var cells = Math.ceil((lead + days) / 7) * 7;
    for (var c = 0; c < cells; c++) {
      var date = new Date(at.y, at.m, 1 - lead + c);
      var key = iso(date.getFullYear(), date.getMonth(), date.getDate());
      var cell = el('div', 'calendar-date');
      if (date.getMonth() !== at.m) cell.classList.add(c < lead ? 'prev-month' : 'next-month');
      if (range.length === 2 && key >= range[0] && key <= range[1]) {
        cell.classList.add('calendar-range');
        if (key === range[0]) cell.classList.add('range-start');
        if (key === range[1]) cell.classList.add('range-end');
      }
      var button = el('button', 'date-item', String(date.getDate()));
      button.type = 'button';
      button.setAttribute('data-date', key);
      button.setAttribute('aria-label', date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
        (marked.indexOf(key) >= 0 ? ', marked' : ''));
      button.setAttribute('aria-pressed', key === selected ? 'true' : 'false');
      if (key === now) {
        button.classList.add('date-today');
        button.setAttribute('aria-current', 'date');
      }
      if (marked.indexOf(key) >= 0) button.classList.add('date-marked');
      cell.appendChild(button);
      body.appendChild(cell);
    }
    cal.appendChild(body);
  }

  document.addEventListener('click', function (event) {
    var cal = event.target.closest('[data-calendar]');
    if (!cal) return;
    var step = event.target.closest('[data-step]');
    if (step) {
      var at = parseMonth(cal.getAttribute('data-month') || cal.getAttribute('data-selected'));
      var to = new Date(at.y, at.m + Number(step.getAttribute('data-step')), 1);
      cal.setAttribute('data-month', to.getFullYear() + '-' + pad(to.getMonth() + 1));
      draw(cal);
      cal.querySelector('[data-step="' + step.getAttribute('data-step') + '"]').focus();
      return;
    }
    var day = event.target.closest('.date-item');
    if (!day) return;
    var date = day.getAttribute('data-date');
    cal.setAttribute('data-selected', date);
    if (date.slice(0, 7) !== (cal.getAttribute('data-month') || '')) cal.setAttribute('data-month', date.slice(0, 7));
    draw(cal);
    var again = cal.querySelector('[data-date="' + date + '"]');
    if (again) again.focus();
    cal.dispatchEvent(new CustomEvent('almanac:date', { bubbles: true, detail: { date: date } }));
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-calendar]').forEach(draw);
  });

  window.Almanac = window.Almanac || {};
  window.Almanac.calendar = { draw: draw };
})();
