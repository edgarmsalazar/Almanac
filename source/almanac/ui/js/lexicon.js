/*
 * The lexicon page's filter: words typed narrow the terms to those holding every
 * one, in the term, its definition, form, example or note; a group's tag narrows
 * them to that group. A group left with no terms hides with its heading, and a
 * line says when nothing is left. Without this script every term shows and the
 * filter stays hidden.
 */
(function () {
  'use strict';

  var tools = document.querySelector('[data-lexicon-tools]');
  if (!tools) return;
  var field = tools.querySelector('[data-lexicon-filter]');
  var chips = tools.querySelector('[data-lexicon-groups]');
  var grids = Array.prototype.slice.call(document.querySelectorAll('.lexicon-grid'));
  var none = document.querySelector('.lexicon-none');
  var group = '';

  function apply() {
    var words = field.value.toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    grids.forEach(function (grid) {
      var left = 0;
      Array.prototype.forEach.call(grid.querySelectorAll('.lexicon-term'), function (card) {
        var text = card.getAttribute('data-words');
        var keep = (!group || card.getAttribute('data-group') === group) &&
          words.every(function (word) { return text.indexOf(word) >= 0; });
        card.hidden = !keep;
        if (keep) left += 1;
      });
      grid.hidden = left === 0;
      var heading = grid.previousElementSibling;
      if (heading && /^H2$/.test(heading.tagName)) heading.hidden = left === 0;
      shown += left;
    });
    if (none) none.hidden = shown > 0;
  }

  field.addEventListener('input', apply);
  if (chips) {
    chips.addEventListener('click', function (event) {
      var chip = event.target.closest('.tag');
      if (!chip) return;
      group = chip.getAttribute('data-group');
      Array.prototype.forEach.call(chips.querySelectorAll('.tag'), function (tag) {
        tag.classList.toggle('active', tag === chip);
      });
      apply();
    });
  }
  tools.hidden = false;
})();
