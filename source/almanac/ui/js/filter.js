/*
 * Filtering the rows of one table or several, from a search box and a row of
 * state pills. After Portal's unit search, without its serials and index.
 *
 * The box is Tabler's .input-icon over a .form-control; data-filter names the
 * tables it narrows, a table or anything holding tables:
 *
 *   <div class="table-filter" data-filter="#spending">
 *     <div class="input-icon">
 *       <span class="input-icon-addon">(search icon)</span>
 *       <input class="form-control" type="search" placeholder="Filter…" aria-label="Filter the rows">
 *     </div>
 *     <span class="table-filter-count" aria-live="polite"></span>
 *   </div>
 *
 * The pills are status chips as buttons, data-filter-states naming the same
 * tables; "all" lets every state through:
 *
 *   <div class="state-filter" data-filter-states="#spending" role="group" aria-label="State">
 *     <button class="state-filter-pill is-active" type="button" data-state="all" aria-pressed="true"><span class="status status-primary">All</span></button>
 *     <button class="state-filter-pill" type="button" data-state="over" aria-pressed="false"><span class="status status-danger">Over</span></button>
 *   </div>
 *
 * A row is matched on its data-search if it has one, else on its text, case
 * aside, every word typed found somewhere in it; on its data-state for a pill.
 * Both at once narrow together. Without this script every row stays in sight.
 *
 * The rows are filtered once when the page has loaded, then on every key typed
 * and every pill clicked. Each run ends with "almanac:filter" on the element
 * the selector names, bubbling, so a page can react to what is left in sight:
 *
 *   detail.shown  rows in sight          detail.query  the box's text, as typed
 *   detail.total  rows in the target     detail.state  the chosen pill's data-state
 *
 * The box, the pills and the target are found at each run rather than bound at
 * load, and each row's text is read at each run, so a filter or rows a page
 * builds later, or a cell it rewrites, are matched as written ones. Rows added
 * or changed under a query are not filtered until the next run:
 * Almanac.filter.run(selector) runs it at once, as a key typed would.
 *
 * An element carrying the same selector in data-filter-empty is the empty
 * state for when no row matches: shown while rows exist and none is in sight,
 * hidden otherwise. A target with no rows at all is the page's own case.
 *
 *   <div class="empty" data-filter-empty="#spending" hidden>
 *     <p class="empty-title">No envelopes match</p>
 *   </div>
 */
(function () {
  'use strict';

  var HIDDEN = 'is-filtered-out';

  function rowsOf(target) {
    return Array.prototype.slice.call(target.querySelectorAll('tbody tr'));
  }

  /* Read again on every run, not kept: a row added, or a cell the page rewrote,
     is matched on what it says now. Reading 2,000 rows' text again costs
     about half a millisecond a key, against the frame's sixteen. */
  function haystack(row) {
    return (row.getAttribute('data-search') || row.textContent).toLowerCase();
  }

  /* Everything is looked up by its selector at each run, so a box, pills, an
     empty state or a target the page builds after load work as written ones. */
  function run(selector) {
    var target = document.querySelector(selector);
    if (!target) return;
    var box = document.querySelector('.table-filter[data-filter="' + selector + '"]');
    var pills = document.querySelector('.state-filter[data-filter-states="' + selector + '"]');
    var input = box && box.querySelector('.form-control');
    var count = box && box.querySelector('.table-filter-count');
    var active = pills && pills.querySelector('.state-filter-pill.is-active');
    var wanted = active ? active.getAttribute('data-state') : 'all';
    var words = input ? input.value.toLowerCase().split(/\s+/).filter(Boolean) : [];
    var rows = rowsOf(target);
    var shown = 0;
    rows.forEach(function (row) {
      var hit = wanted === 'all' || row.getAttribute('data-state') === wanted;
      if (hit && words.length) {
        var text = haystack(row);
        hit = words.every(function (word) { return text.indexOf(word) >= 0; });
      }
      row.classList.toggle(HIDDEN, !hit);
      if (hit) shown++;
    });
    /* Nothing matched, as against nothing there to match. */
    var none = rows.length > 0 && shown === 0;
    target.classList.toggle('is-filtered-empty', none);
    if (count) {
      count.textContent = shown === rows.length ? ''
        : shown === 0 ? 'No rows match' : shown + ' of ' + rows.length + ' rows';
    }
    document.querySelectorAll('[data-filter-empty="' + selector + '"]').forEach(function (empty) {
      empty.hidden = !none;
    });
    target.dispatchEvent(new CustomEvent('almanac:filter', { bubbles: true, detail: {
      shown: shown, total: rows.length, query: input ? input.value : '', state: wanted
    } }));
  }

  /* One listener each for the document, so a box or pills added later need no
     binding of their own. */
  document.addEventListener('input', function (event) {
    var box = event.target.closest && event.target.closest('.table-filter[data-filter]');
    if (box && event.target.matches('.form-control')) run(box.getAttribute('data-filter'));
  });

  document.addEventListener('click', function (event) {
    var pill = event.target.closest && event.target.closest('.state-filter-pill');
    var pills = pill && pill.closest('.state-filter[data-filter-states]');
    if (!pills) return;
    pills.querySelectorAll('.state-filter-pill').forEach(function (other) {
      var on = other === pill;
      other.classList.toggle('is-active', on);
      other.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    run(pills.getAttribute('data-filter-states'));
  });

  /* Once at load, so a box the browser refilled on going back, a pill the
     page wrote chosen, and a page waiting on the event all start in step. */
  document.addEventListener('DOMContentLoaded', function () {
    var seen = {};
    document.querySelectorAll('[data-filter], [data-filter-states]').forEach(function (el) {
      var selector = el.getAttribute('data-filter') || el.getAttribute('data-filter-states');
      if (seen[selector]) return;
      seen[selector] = true;
      run(selector);
    });
  });

  window.Almanac = window.Almanac || {};
  window.Almanac.filter = { run: run };
})();
