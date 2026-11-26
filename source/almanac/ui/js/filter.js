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
 */
(function () {
  'use strict';

  var HIDDEN = 'is-filtered-out';

  function rowsOf(target) {
    return Array.prototype.slice.call(target.querySelectorAll('tbody tr'));
  }

  function haystack(row) {
    if (row._almanacHaystack === undefined) {
      row._almanacHaystack = (row.getAttribute('data-search') || row.textContent).toLowerCase();
    }
    return row._almanacHaystack;
  }

  function bind(target, selector) {
    var box = document.querySelector('.table-filter[data-filter="' + selector + '"]');
    var pills = document.querySelector('.state-filter[data-filter-states="' + selector + '"]');
    var input = box && box.querySelector('.form-control');
    var count = box && box.querySelector('.table-filter-count');

    function state() {
      var active = pills && pills.querySelector('.state-filter-pill.is-active');
      return active ? active.getAttribute('data-state') : 'all';
    }

    function apply() {
      var words = input ? input.value.toLowerCase().split(/\s+/).filter(Boolean) : [];
      var wanted = state();
      var rows = rowsOf(target);
      var shown = 0;
      rows.forEach(function (row) {
        var text = haystack(row);
        var hit = words.every(function (word) { return text.indexOf(word) >= 0; }) &&
          (wanted === 'all' || row.getAttribute('data-state') === wanted);
        row.classList.toggle(HIDDEN, !hit);
        if (hit) shown++;
      });
      target.classList.toggle('is-filtered-empty', rows.length > 0 && shown === 0);
      if (count) {
        count.textContent = shown === rows.length ? ''
          : shown === 0 ? 'No rows match' : shown + ' of ' + rows.length + ' rows';
      }
    }

    if (input) input.addEventListener('input', apply);
    if (pills) {
      pills.querySelectorAll('.state-filter-pill').forEach(function (pill) {
        pill.addEventListener('click', function () {
          pills.querySelectorAll('.state-filter-pill').forEach(function (other) {
            var on = other === pill;
            other.classList.toggle('is-active', on);
            other.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          apply();
        });
      });
    }
    /* A box the browser refilled on going back filters at once. */
    if (input && input.value) apply();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var seen = {};
    document.querySelectorAll('[data-filter], [data-filter-states]').forEach(function (el) {
      var selector = el.getAttribute('data-filter') || el.getAttribute('data-filter-states');
      if (seen[selector]) return;
      seen[selector] = true;
      var target = document.querySelector(selector);
      if (target) bind(target, selector);
    });
  });
})();
